"use client";

import Link from "next/link";
import {
  Ban,
  Camera,
  ChevronLeft,
  Flag,
  ImagePlus,
  Info,
  Plus,
  Send,
  Star,
  Sticker,
  Trash2,
  UserMinus,
  X
} from "lucide-react";
import { useState } from "react";
import { AvatarRing } from "@/components/AvatarRing";
import { BlipButton } from "@/components/BlipButton";
import { useAppState } from "@/state/AppState";

export function ChatScreen({ threadId }: { threadId: string }) {
  const {
    currentUser,
    getUserById,
    isFavoriteUser,
    openInstant,
    removeFriend,
    savedStickers,
    saveSticker,
    sendThreadMessage,
    threads,
    toggleFavoriteUser
  } = useAppState();
  const [draftMessage, setDraftMessage] = useState("");
  const [infoOpen, setInfoOpen] = useState(false);
  const [attachOpen, setAttachOpen] = useState(false);
  const [stickerOpen, setStickerOpen] = useState(false);
  const [infoMessage, setInfoMessage] = useState("");
  const thread = threads.find((item) => item.id === threadId);

  if (!thread) {
    return (
      <div className="screen">
        <section className="empty-state">This conversation could not be found.</section>
      </div>
    );
  }

  const otherUserId =
    thread.participantIds.find((id) => id !== currentUser.id) ?? currentUser.id;
  const otherUser = getUserById(otherUserId);

  if (!otherUser) {
    return null;
  }

  const favorite = isFavoriteUser(otherUser.id);

  return (
    <div className="screen chat-screen">
      <header className="chat-header app-header">
        <Link href="/messages" className="back-link" aria-label="Back to messages">
          <ChevronLeft size={30} />
        </Link>
        <AvatarRing user={otherUser} size="sm" onClick={() => openInstant(otherUser.id)} />
        <div className="chat-title">
          <strong>{otherUser.displayName}</strong>
          <span>@{otherUser.username}</span>
        </div>
        <button
          type="button"
          aria-label="Favorite"
          onClick={() => toggleFavoriteUser(otherUser.id)}
        >
          <Star size={24} fill={favorite ? "currentColor" : "none"} />
        </button>
        <button type="button" aria-label="Info" onClick={() => setInfoOpen((value) => !value)}>
          <Info size={25} />
        </button>
        {infoOpen ? (
          <div className="chat-info-menu post-popover">
            {[
              { label: "Block", icon: Ban },
              { label: "Remove friend", icon: UserMinus },
              { label: "Delete from chat feed", icon: Trash2 },
              { label: "Report", icon: Flag }
            ].map(({ label, icon: Icon }) => (
              <button
                key={label}
                type="button"
                onClick={() => {
                  if (label === "Remove friend") {
                    removeFriend(otherUser.id);
                  }
                  setInfoMessage(label.toLowerCase());
                  window.setTimeout(() => setInfoMessage(""), 1200);
                }}
              >
                <Icon size={17} />
                <span>{label}</span>
              </button>
            ))}
            {infoMessage ? <p>{infoMessage}</p> : null}
          </div>
        ) : null}
      </header>
      <div className="chat-hint">tap profile photo to view their Instant</div>
      <section className="chat-messages">
        <div className="day-divider">Today</div>
        {thread.messages.map((message) => {
          const sent = message.senderId === currentUser.id;

          if (message.type === "image") {
            return (
              <div key={message.id} className={sent ? "chat-item sent" : "chat-item received"}>
                <img className="chat-image" src={message.imageUrl} alt={message.content} />
                {message.imageUrl ? (
                  <button
                    className="save-sticker-button"
                    type="button"
                    onClick={() => saveSticker(message.imageUrl ?? "")}
                  >
                    <Sticker size={15} />
                    Save sticker
                  </button>
                ) : null}
                <span className="chat-time">{message.createdAt}</span>
              </div>
            );
          }

          if (message.type === "note") {
            return (
              <div key={message.id} className={sent ? "chat-item sent" : "chat-item received"}>
                <div className="note-card">
                  <span>note</span>
                  <pre>{message.content}</pre>
                  <i>&lt;3</i>
                </div>
                <span className="chat-time">{message.createdAt}</span>
              </div>
            );
          }

          return (
            <div key={message.id} className={sent ? "chat-item sent" : "chat-item received"}>
              <div className="chat-bubble">{message.content}</div>
              <span className="chat-time">
                {message.createdAt}
                {message.status ? "  read" : ""}
              </span>
            </div>
          );
        })}
      </section>
      {attachOpen || stickerOpen ? (
        <section className="chat-attachment-panel">
          <button
            type="button"
            className="panel-close-inline"
            onClick={() => {
              setAttachOpen(false);
              setStickerOpen(false);
            }}
            aria-label="Close attachments"
          >
            <X size={18} />
          </button>
          {attachOpen ? (
            <div className="chat-attachment-actions">
              <button type="button" onClick={() => setDraftMessage("sent you a photo")}>
                <Camera size={18} />
                <span>Camera</span>
              </button>
              <button type="button" onClick={() => setDraftMessage("sent you an image")}>
                <ImagePlus size={18} />
                <span>Photo</span>
              </button>
              <button type="button" onClick={() => setStickerOpen(true)}>
                <Sticker size={18} />
                <span>Stickers</span>
              </button>
            </div>
          ) : null}
          {stickerOpen ? (
            <div className="sticker-tray">
              {savedStickers.length ? (
                savedStickers.slice(0, 8).map((sticker) => (
                  <button
                    key={sticker}
                    type="button"
                    onClick={() => {
                      setDraftMessage("[sticker]");
                      setStickerOpen(false);
                    }}
                  >
                    <img src={sticker} alt="" />
                  </button>
                ))
              ) : (
                <p>Save an image from chat to build your sticker tray.</p>
              )}
            </div>
          ) : null}
        </section>
      ) : null}
      <form
        className="chat-input"
        onSubmit={(event) => {
          event.preventDefault();
          const message = draftMessage.trim();
          if (!message) {
            return;
          }
          void sendThreadMessage(thread.id, message);
          setDraftMessage("");
        }}
      >
        <button
          type="button"
          aria-label="Add"
          onClick={() => {
            setAttachOpen((value) => !value);
            setStickerOpen(false);
          }}
        >
          <Plus size={30} />
        </button>
        <input
          value={draftMessage}
          onChange={(event) => setDraftMessage(event.target.value)}
          placeholder="send a message..."
          aria-label="Message"
        />
        <BlipButton
          type="submit"
          className="chat-send-button"
          disabled={!draftMessage.trim()}
          aria-label="Send message"
        >
          <Send size={20} />
          <span>Send</span>
        </BlipButton>
        <BlipButton
          type="button"
          variant="secondary"
          aria-label="Stickers"
          onClick={() => setStickerOpen((value) => !value)}
        >
          <Sticker size={24} />
        </BlipButton>
      </form>
    </div>
  );
}
