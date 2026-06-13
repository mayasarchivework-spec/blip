"use client";

import { ArrowLeft, Lock, LogOut, Mail, MessageCircle, Shield, Users, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { AuthPanel } from "@/components/AuthPanel";
import { SettingsCard, SettingsRow, ToggleSwitch } from "@/components/SettingsCard";
import type { CommentAudience, ViewAudience } from "@/data/types";
import { formatSupabaseAuthError } from "@/lib/supabase/auth";
import { useAppState } from "@/state/AppState";

type SettingsPanel = "sent" | "friends" | "messages" | "email" | "close" | null;

const commentOptions: CommentAudience[] = ["friends", "everyone", "none"];
const viewOptions: ViewAudience[] = ["friends", "everyone"];
const requestOptions = ["Everyone", "Friends of friends", "No one"];
const dmOptions = ["Friends", "Everyone", "No one"];

const commentLabels: Record<CommentAudience, string> = {
  friends: "Friends",
  everyone: "Everyone",
  none: "No one"
};

const viewLabels: Record<ViewAudience, string> = {
  friends: "Friends",
  everyone: "Everyone"
};

function nextOption<T>(options: T[], current: T) {
  const index = options.indexOf(current);
  return options[(index + 1) % options.length] ?? options[0];
}

export function SettingsScreen() {
  const router = useRouter();
  const {
    accent,
    accentOptions,
    authSession,
    currentUser,
    deactivateAccount,
    requestEmailChange,
    saveProfile,
    setAccentName,
    signOut,
    toggleExplore,
    togglePrivate
  } = useAppState();
  const [requestAudience, setRequestAudience] = useState("Everyone");
  const [dmAudience, setDmAudience] = useState("Friends");
  const [storyReplies, setStoryReplies] = useState(true);
  const [readReceipts, setReadReceipts] = useState(true);
  const [panel, setPanel] = useState<SettingsPanel>(null);
  const [accountBusy, setAccountBusy] = useState<"signout" | "deactivate" | "email" | null>(
    null
  );
  const [emailInput, setEmailInput] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [emailError, setEmailError] = useState("");

  const panelTitle =
    panel === "sent"
      ? "Requests you sent"
      : panel === "friends"
        ? "Accounts that befriended you"
        : panel === "messages"
          ? "Message controls"
          : panel === "email"
            ? "Change email"
            : "Close account";

  async function handleSignOut() {
    if (accountBusy) {
      return;
    }

    setAccountBusy("signout");
    await signOut();
    setAccountBusy(null);
    router.replace("/home");
  }

  async function handleEmailChange(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (accountBusy) {
      return;
    }

    setAccountBusy("email");
    setEmailMessage("");
    setEmailError("");

    try {
      await requestEmailChange(emailInput);
      setEmailMessage(
        "Confirmation links sent. Check your current and new email inboxes to finish the change."
      );
      setEmailInput("");
    } catch (error) {
      setEmailError(formatSupabaseAuthError(error, "Could not request an email change."));
    } finally {
      setAccountBusy(null);
    }
  }

  async function handleDeactivateAccount() {
    if (accountBusy) {
      return;
    }

    setAccountBusy("deactivate");
    await deactivateAccount();
    setAccountBusy(null);
    router.replace("/home");
  }

  return (
    <div className="screen">
      <AppHeader
        title="Settings"
        left={
          <button
            type="button"
            className="header-back-button"
            onClick={() => router.back()}
            aria-label="Go back"
          >
            <ArrowLeft size={24} />
          </button>
        }
      />
      <AuthPanel />
      <SettingsCard>
        <div className="settings-title-row">
          <div>
            <h2>Accent color / theme</h2>
            <p>Choose your Blip accent color.</p>
          </div>
          <span className="current-color" aria-label="Current accent color">
            <i />
          </span>
        </div>
        <div className="swatch-row">
          {accentOptions.map((option) => (
            <button
              key={option.name}
              type="button"
              className={option.name === accent.name ? "selected" : ""}
              style={{ backgroundColor: option.color }}
              onClick={() => setAccentName(option.name)}
              aria-label={`Use ${option.label} theme`}
            >
              {option.name === accent.name ? "\u2713" : ""}
            </button>
          ))}
        </div>
      </SettingsCard>
      <SettingsCard>
        <div className="toggle-row">
          <div>
            <h2>Private account</h2>
            <p>
              When on, only your friends can see your posts and profile. Non-friends
              cannot see your posts.
            </p>
          </div>
          <ToggleSwitch checked={currentUser.isPrivate} onChange={togglePrivate} />
        </div>
        <div className="settings-divider" />
        <div className="toggle-row">
          <div>
            <h2>Show my posts on Explore</h2>
            <p>Allow your public posts to appear on Explore.</p>
          </div>
          <ToggleSwitch checked={currentUser.allowExplore} onChange={toggleExplore} />
        </div>
      </SettingsCard>
      <SettingsCard>
        <SettingsRow
          title="Who can comment"
          value={commentLabels[currentUser.commentAudience ?? "friends"]}
          onClick={() => {
            const next = nextOption(commentOptions, currentUser.commentAudience ?? "friends");
            void saveProfile({ commentAudience: next });
          }}
        />
        <SettingsRow
          title="Who can view"
          value={viewLabels[currentUser.viewAudience ?? "friends"]}
          onClick={() => {
            const next = nextOption(viewOptions, currentUser.viewAudience ?? "friends");
            void saveProfile({ viewAudience: next });
          }}
        />
        <SettingsRow
          title="Friend requests received"
          value={requestAudience}
          onClick={() => setRequestAudience((value) => nextOption(requestOptions, value))}
        />
      </SettingsCard>
      <SettingsCard>
        <SettingsRow
          title="Requests you sent"
          value={`${currentUser.friendRequestsSent.length}`}
          onClick={() => setPanel("sent")}
        />
        <SettingsRow
          title="Accounts that befriended you"
          value={`${currentUser.stats.friends}`}
          onClick={() => setPanel("friends")}
        />
      </SettingsCard>
      <SettingsCard>
        <SettingsRow
          title="Message / privacy controls"
          note="Manage DMs, story replies, read receipts and more."
          onClick={() => setPanel("messages")}
        />
      </SettingsCard>
      {authSession ? (
        <SettingsCard>
          <SettingsRow
            title="Email address"
            value={authSession.user.email ?? "Change"}
            note="Send a confirmation link to update your login email."
            onClick={() => {
              setEmailInput("");
              setEmailMessage("");
              setEmailError("");
              setPanel("email");
            }}
          />
          <SettingsRow
            title={accountBusy === "signout" ? "Signing out..." : "Sign out"}
            note="Leave this device and clear local account data."
            onClick={() => void handleSignOut()}
          />
        </SettingsCard>
      ) : null}
      <button type="button" className="danger-card settings-danger-button" onClick={() => setPanel("close")}>
        <div className="danger-lock">
          <Lock size={32} />
        </div>
        <div>
          <h2>Close account / deactivate</h2>
          <p>Temporarily deactivate or permanently delete your Blip account and data.</p>
        </div>
      </button>
      {panel ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="settings-panel-modal">
            <button
              className="modal-close"
              type="button"
              onClick={() => setPanel(null)}
              aria-label="Close settings panel"
            >
              <X size={22} />
            </button>
            <h2>{panelTitle}</h2>
            {panel === "sent" ? (
              <div className="settings-panel-body">
                <Users size={34} />
                <p>
                  You have {currentUser.friendRequestsSent.length} outgoing friend
                  request{currentUser.friendRequestsSent.length === 1 ? "" : "s"}.
                </p>
                <button type="button" onClick={() => setPanel(null)}>
                  Done
                </button>
              </div>
            ) : null}
            {panel === "friends" ? (
              <div className="settings-panel-body">
                <Users size={34} />
                <p>{currentUser.stats.friends} accounts have befriended you on Blip.</p>
                <button type="button" onClick={() => setPanel(null)}>
                  Done
                </button>
              </div>
            ) : null}
            {panel === "messages" ? (
              <div className="settings-panel-body settings-panel-controls">
                <MessageCircle size={34} />
                <SettingsRow
                  title="Who can DM"
                  value={dmAudience}
                  onClick={() => setDmAudience((value) => nextOption(dmOptions, value))}
                />
                <div className="toggle-row compact-toggle-row">
                  <div>
                    <h2>Story replies</h2>
                    <p>Allow replies to your Instants.</p>
                  </div>
                  <ToggleSwitch
                    checked={storyReplies}
                    onChange={() => setStoryReplies((value) => !value)}
                  />
                </div>
                <div className="toggle-row compact-toggle-row">
                  <div>
                    <h2>Read receipts</h2>
                    <p>Show when you have read a message.</p>
                  </div>
                  <ToggleSwitch
                    checked={readReceipts}
                    onChange={() => setReadReceipts((value) => !value)}
                  />
                </div>
              </div>
            ) : null}
            {panel === "email" ? (
              <form className="settings-panel-body auth-form" onSubmit={handleEmailChange}>
                <Mail size={34} />
                <p>
                  Current email: {authSession?.user.email ?? "unknown"}. Enter a new
                  address and Blip will send confirmation links to finish the change.
                </p>
                <label>
                  <span>New email</span>
                  <input
                    autoComplete="email"
                    type="email"
                    value={emailInput}
                    onChange={(event) => setEmailInput(event.target.value)}
                    placeholder="new@email.com"
                    required
                  />
                </label>
                {emailMessage ? <div className="auth-notice">{emailMessage}</div> : null}
                {emailError ? <div className="auth-error">{emailError}</div> : null}
                <button type="submit" disabled={accountBusy === "email"}>
                  {accountBusy === "email" ? "Sending..." : "Send confirmation links"}
                </button>
              </form>
            ) : null}
            {panel === "close" ? (
              <div className="settings-panel-body">
                {authSession ? (
                  <>
                    <Shield size={34} />
                    <p>
                      Deactivate makes your account private, removes your posts from Explore,
                      signs you out, and clears account data from this device.
                    </p>
                    <div className="settings-panel-actions">
                      <button
                        type="button"
                        className="danger-action"
                        disabled={accountBusy === "deactivate"}
                        onClick={() => void handleDeactivateAccount()}
                      >
                        {accountBusy === "deactivate"
                          ? "Deactivating..."
                          : "Deactivate and sign out"}
                      </button>
                      <button
                        type="button"
                        className="secondary-action"
                        disabled={accountBusy === "deactivate"}
                        onClick={() => setPanel(null)}
                      >
                        Keep account active
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <LogOut size={34} />
                    <p>Sign in first to deactivate an account on this device.</p>
                    <button type="button" onClick={() => setPanel(null)}>
                      Done
                    </button>
                  </>
                )}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
