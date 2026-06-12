"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight, Send, X } from "lucide-react";
import { useEffect, useState } from "react";
import { AvatarRing } from "@/components/AvatarRing";
import { BlipButton } from "@/components/BlipButton";
import { RichText } from "@/components/RichText";
import { VerifiedName } from "@/components/VerifiedName";
import { useAppState } from "@/state/AppState";

function formatInstantExpiry(expiresAt: string) {
  const expiresTime = Date.parse(expiresAt);

  if (!Number.isFinite(expiresTime)) {
    return expiresAt;
  }

  const remainingMs = expiresTime - Date.now();

  if (remainingMs <= 0) {
    return "expired";
  }

  const remainingHours = Math.max(1, Math.ceil(remainingMs / (60 * 60 * 1000)));

  return `${remainingHours}h left`;
}

export function InstantModal() {
  const {
    activeInstantUserId,
    canInteractWith,
    closeInstant,
    currentUser,
    getInstantsForUser,
    getUserById,
    replyToInstant
  } = useAppState();
  const [instantIndex, setInstantIndex] = useState(0);
  const [replyDraft, setReplyDraft] = useState("");
  const [replyStatus, setReplyStatus] = useState("");
  const [replyThreadId, setReplyThreadId] = useState<string | null>(null);

  useEffect(() => {
    setInstantIndex(0);
    setReplyDraft("");
    setReplyStatus("");
    setReplyThreadId(null);
  }, [activeInstantUserId]);

  if (!activeInstantUserId) {
    return null;
  }

  const user = getUserById(activeInstantUserId);
  const instantList = getInstantsForUser(activeInstantUserId);
  const safeInstantIndex = Math.min(instantIndex, Math.max(0, instantList.length - 1));
  const instant = instantList[safeInstantIndex];

  if (!user || !instant) {
    return null;
  }

  const instantUserId = user.id;
  const canReply = currentUser.id !== instantUserId && canInteractWith(instantUserId);
  const hasMultipleInstants = instantList.length > 1;

  function moveInstant(direction: -1 | 1) {
    setInstantIndex((index) => {
      const nextIndex = index + direction;

      if (nextIndex < 0) {
        return instantList.length - 1;
      }

      if (nextIndex >= instantList.length) {
        return 0;
      }

      return nextIndex;
    });
  }

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
            <span>{formatInstantExpiry(instant.expiresAt)}</span>
          </div>
        </div>
        {hasMultipleInstants ? (
          <div className="instant-progress" aria-hidden="true">
            {instantList.map((item, index) => (
              <span
                key={item.id}
                className={index === safeInstantIndex ? "active" : ""}
              />
            ))}
          </div>
        ) : null}
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
          {hasMultipleInstants ? (
            <>
              <button
                type="button"
                className="instant-side-button instant-side-button-left"
                onClick={() => moveInstant(-1)}
                aria-label="Previous Instant"
              >
                <ChevronLeft size={30} />
              </button>
              <button
                type="button"
                className="instant-side-button instant-side-button-right"
                onClick={() => moveInstant(1)}
                aria-label="Next Instant"
              >
                <ChevronRight size={30} />
              </button>
            </>
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
