"use client";

import { ArrowLeft, Lock, MessageCircle, Shield, Users, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { AuthPanel } from "@/components/AuthPanel";
import { SettingsCard, SettingsRow, ToggleSwitch } from "@/components/SettingsCard";
import { useAppState } from "@/state/AppState";

type SettingsPanel = "sent" | "friends" | "messages" | "close" | null;

const commentOptions = ["Friends", "Everyone", "No one"];
const viewOptions = ["Friends", "Everyone"];
const requestOptions = ["Everyone", "Friends of friends", "No one"];
const dmOptions = ["Friends", "Everyone", "No one"];

function nextOption(options: string[], current: string) {
  const index = options.indexOf(current);
  return options[(index + 1) % options.length] ?? options[0];
}

export function SettingsScreen() {
  const router = useRouter();
  const {
    accent,
    accentOptions,
    currentUser,
    setAccentName,
    toggleExplore,
    togglePrivate
  } = useAppState();
  const [commentAudience, setCommentAudience] = useState("Friends");
  const [viewAudience, setViewAudience] = useState("Friends");
  const [requestAudience, setRequestAudience] = useState("Everyone");
  const [dmAudience, setDmAudience] = useState("Friends");
  const [storyReplies, setStoryReplies] = useState(true);
  const [readReceipts, setReadReceipts] = useState(true);
  const [panel, setPanel] = useState<SettingsPanel>(null);

  const panelTitle =
    panel === "sent"
      ? "Requests you sent"
      : panel === "friends"
        ? "Accounts that befriended you"
        : panel === "messages"
          ? "Message controls"
          : "Close account";

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
          value={commentAudience}
          onClick={() => setCommentAudience((value) => nextOption(commentOptions, value))}
        />
        <SettingsRow
          title="Who can view"
          value={viewAudience}
          onClick={() => setViewAudience((value) => nextOption(viewOptions, value))}
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
            {panel === "close" ? (
              <div className="settings-panel-body">
                <Shield size={34} />
                <p>
                  Account closure is a backend action, so this prototype keeps you safe and
                  leaves the account active.
                </p>
                <button type="button" onClick={() => setPanel(null)}>
                  Keep account active
                </button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
