"use client";

import { LogOut, UserRound } from "lucide-react";
import { FormEvent, useState } from "react";
import { BlipButton } from "@/components/BlipButton";
import { SettingsCard } from "@/components/SettingsCard";
import { useAppState } from "@/state/AppState";

export function AuthPanel() {
  const {
    authError,
    authSession,
    authStatus,
    backendReady,
    backendSource,
    currentUser,
    signIn,
    signOut,
    signUp
  } = useAppState();
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const busy = authStatus === "loading";
  const authNotice = authError?.toLowerCase().includes("check your email");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (mode === "sign-in") {
      await signIn(email, password);
      return;
    }

    await signUp(email, password, username, displayName);
  }

  if (authSession) {
    return (
      <SettingsCard>
        <div className="auth-card-head">
          <div className="auth-badge">
            <UserRound size={24} />
          </div>
          <div>
            <h2>Blip account</h2>
            <p>
              Signed in as @{currentUser.username}. Your Blips, profile, friends,
              and messages are connected.
            </p>
          </div>
        </div>
        <div className="auth-status-row">
          <span>{backendReady ? "Connected" : "Connecting..."}</span>
          <span>{backendSource === "supabase" ? "Blip backend" : "Local preview"}</span>
        </div>
        <BlipButton type="button" variant="secondary" onClick={() => void signOut()}>
          <LogOut size={18} /> Sign out
        </BlipButton>
      </SettingsCard>
    );
  }

  return (
    <SettingsCard>
      <div className="auth-card-head">
        <div className="auth-badge">
          <UserRound size={24} />
        </div>
        <div>
          <h2>Join Blip</h2>
          <p>Sign up or log in to post, blip, comment, message friends, and edit your profile.</p>
        </div>
      </div>
      <div className="auth-tabs">
        <button
          type="button"
          className={mode === "sign-in" ? "active" : ""}
          onClick={() => setMode("sign-in")}
        >
          Log in
        </button>
        <button
          type="button"
          className={mode === "sign-up" ? "active" : ""}
          onClick={() => setMode("sign-up")}
        >
          Sign up
        </button>
      </div>
      <form className="auth-form" onSubmit={handleSubmit}>
        <label>
          <span>Email</span>
          <input
            autoComplete="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>
        <label>
          <span>Password</span>
          <input
            autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
            minLength={6}
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>
        {mode === "sign-up" ? (
          <>
            <label>
              <span>Username</span>
              <input
                autoComplete="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="racer"
                required
              />
            </label>
            <label>
              <span>Display name</span>
              <input
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="racer"
                required
              />
            </label>
          </>
        ) : null}
        {authError ? (
          <p className={authNotice ? "auth-notice" : "auth-error"}>{authError}</p>
        ) : null}
        <BlipButton type="submit" disabled={busy}>
          {busy ? "Connecting..." : mode === "sign-in" ? "Log in to Blip" : "Create Blip account"}
        </BlipButton>
      </form>
    </SettingsCard>
  );
}
