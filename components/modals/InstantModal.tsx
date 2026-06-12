"use client";

import Link from "next/link";
import { Send, X } from "lucide-react";
import { useState } from "react";
import { AvatarRing } from "@/components/AvatarRing";
import { BlipButton } from "@/components/BlipButton";
import { RichText } from "@/components/RichText";
import { VerifiedName } from "@/components/VerifiedName";
import { useAppState } from "@/state/AppState";

export function InstantModal() {
  const {
    activeInstantUserId,
    canInteractWith,
    closeInstant,
    currentUser,
    getInstantForUser,
    getUserById,
    replyToInstant
  } = useAppState();
  const [replyDraft, setReplyDraft] = useState("");
  const [replyStatus, setReplyStatus] = useState("");
  const [replyThreadId, setReplyThreadId] = useState<string | null>(null);

  if (!activeInstantUserId) {
    return null;
  }

  const user = getUserById(activeInstantUserId);
  const instant = getInstantForUser(activeInstantUserId);

  if (!user || !instant) {
    return null;
  }

  const instantUserId = user.id;
  const canReply = currentUser.id !== instantUserId && canInteractWith(instantUserId);

  async function sendReply() {
    const threadId = await replyToInstant(instantUserId, replyDraft);

    if (!threadId) {
      return;
    }

    setReplyThreadId(threadId);
    setReplyDraft("");
    setReplyStatus("sent to messages");
    window.setTimeout(() => setReplyStatus(""), 1400);
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="instant-viewer">
        <button className="modal-close" type="button" onClick={closeInstant}>
          <X size={22} />
        </button>
        <div className="instant-top">
          <AvatarRing user={user} size="sm" />
          <div>
            <strong>
              <VerifiedName user={user} />
            </strong>
            <span>{instant.expiresAt}</span>
          </div>
        </div>
        <div className="instant-stage">
          {instant.type === "video" && instant.videoUrl?.startsWith("data:video") ? (
            <video
              src={instant.videoUrl}
              poster={instant.thumbnailUrl}
              controls
              playsInline
              preload="metadata"
            />
          ) : instant.type === "video" && instant.thumbnailUrl?.startsWith("data:video") ? (
            <video src={instant.thumbnailUrl} controls playsInline preload="metadata" />
          ) : instant.thumbnailUrl ? (
            <img src={instant.thumbnailUrl} alt="" />
          ) : null}
          <div className="instant-caption">
            <p>
              <RichText text={instant.content} />
            </p>
          </div>
        </div>
        <form
          className="instant-reply-form"
          onSubmit={(event) => {
            event.preventDefault();
            void sendReply();
          }}
        >
          {canReply ? (
            <>
              <input
                value={replyDraft}
                onChange={(event) => setReplyDraft(event.target.value)}
                placeholder={`reply to ${user.displayName}...`}
                aria-label="Reply to Instant"
              />
              <BlipButton type="submit" disabled={!replyDraft.trim()}>
                <Send size={17} />
                Send
              </BlipButton>
            </>
          ) : (
            <p>{currentUser.id === user.id ? "This is your Instant." : "Only friends can reply."}</p>
          )}
        </form>
        {replyStatus ? (
          <div className="instant-reply-status">
            <span>{replyStatus}</span>
            {replyThreadId ? <Link href={`/messages/${replyThreadId}`}>open chat</Link> : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
