"use client";

import Link from "next/link";
import { Camera, FileText, Video, X } from "lucide-react";
import { useEffect, useState } from "react";
import { AvatarRing } from "@/components/AvatarRing";
import { BlipButton } from "@/components/BlipButton";
import { ThinkingDots } from "@/components/ThinkingDots";
import { VerifiedName } from "@/components/VerifiedName";
import type { User } from "@/data/types";
import { useAppState } from "@/state/AppState";

interface InstantRowProps {
  users: User[];
  includeCurrent?: boolean;
  notes?: boolean;
}

export function InstantRow({ users, includeCurrent = false, notes = false }: InstantRowProps) {
  const {
    createInstant,
    currentUser,
    openInstant,
    setUserNote,
    userNoteExpiresAt
  } = useAppState();
  const [instantCreatorOpen, setInstantCreatorOpen] = useState(false);
  const [noteCreatorOpen, setNoteCreatorOpen] = useState(false);
  const [expandedNote, setExpandedNote] = useState<User | null>(null);
  const [instantType, setInstantType] = useState<"photo" | "video" | "text">("photo");
  const [instantText, setInstantText] = useState("right now on Blip");
  const [instantMedia, setInstantMedia] = useState("");
  const [noteDraft, setNoteDraft] = useState(currentUser.note || "");
  const rowUsers = notes || includeCurrent ? [currentUser, ...users] : users;

  useEffect(() => {
    if (noteCreatorOpen) {
      setNoteDraft(currentUser.note || "");
    }
  }, [currentUser.note, noteCreatorOpen]);

  function chooseInstantFile(file: File | undefined) {
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setInstantMedia(reader.result);
      }
    };
    reader.readAsDataURL(file);
  }

  function publishInstant() {
    const fallback =
      instantType === "text"
        ? undefined
        : instantType === "video"
          ? "/assets/photo-car-night.svg"
          : "/assets/photo-selfie.svg";

    createInstant({
      type: instantType,
      content: instantText.trim() || "new Instant",
      thumbnailUrl: instantMedia || fallback,
      videoUrl:
        instantType === "video" && instantMedia.startsWith("data:video")
          ? instantMedia
          : undefined
    });
    setInstantCreatorOpen(false);
  }

  return (
    <section className={notes ? "instant-card instant-card-notes" : "instant-card"}>
      <div className="instant-scroll">
        {rowUsers.map((user, index) => {
          const current = user.id === currentUser.id;
          const note = current ? currentUser.note : user.note;
          const showOwnAdd = (includeCurrent || notes) && index === 0;

          return (
            <div className="instant-item" key={`${user.id}-${index}`}>
              {notes ? (
                <button
                  type="button"
                  className={`instant-note ${current ? "instant-note-own" : ""}`}
                  onClick={() => (current ? setNoteCreatorOpen(true) : setExpandedNote(user))}
                >
                  <ThinkingDots compact />
                  <span>{note || (current ? "add a note" : "thinking")}</span>
                </button>
              ) : null}
              <div className={showOwnAdd ? "instant-avatar-wrap" : ""}>
                <AvatarRing
                  user={user}
                  size="lg"
                  onClick={() => {
                    if (current && notes) {
                      setNoteCreatorOpen(true);
                      return;
                    }
                    openInstant(user.id);
                  }}
                />
                {showOwnAdd ? (
                  <button
                    type="button"
                    className="avatar-plus-button"
                    onClick={() => {
                      if (notes) {
                        setNoteCreatorOpen(true);
                        return;
                      }
                      setInstantCreatorOpen(true);
                    }}
                    aria-label="Add Instant"
                  >
                    +
                  </button>
                ) : null}
              </div>
              <span>
                {(includeCurrent || notes) && index === 0 ? (
                  "Your Instant"
                ) : (
                  <VerifiedName user={user} />
                )}
              </span>
            </div>
          );
        })}
      </div>
      <p className="instant-help">Tap a friend's photo to view their Instant</p>
      {instantCreatorOpen ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="instant-create-modal">
            <button
              className="modal-close"
              type="button"
              onClick={() => setInstantCreatorOpen(false)}
              aria-label="Close Instant creator"
            >
              <X size={22} />
            </button>
            <h2>Create Instant</h2>
            <div className="instant-type-row">
              {[
                { type: "photo" as const, icon: Camera, label: "Photo" },
                { type: "video" as const, icon: Video, label: "Video" },
                { type: "text" as const, icon: FileText, label: "Text" }
              ].map(({ type, icon: Icon, label }) => (
                <button
                  key={type}
                  type="button"
                  className={instantType === type ? "active" : ""}
                  onClick={() => {
                    setInstantType(type);
                    setInstantMedia("");
                  }}
                >
                  <Icon size={18} />
                  <span>{label}</span>
                </button>
              ))}
            </div>
            <div className="instant-create-preview">
              {instantType === "text" ? (
                <pre>{instantText || "type something"}</pre>
              ) : (
                instantType === "video" && instantMedia.startsWith("data:video") ? (
                  <video src={instantMedia} controls playsInline preload="metadata" />
                ) : (
                  <img
                    src={
                      instantMedia ||
                      (instantType === "video"
                        ? "/assets/photo-car-night.svg"
                        : "/assets/photo-selfie.svg")
                    }
                    alt=""
                  />
                )
              )}
            </div>
            {instantType !== "text" ? (
              <div className="composer-choice-row">
                <label className="mini-action accept">
                  Upload
                  <input
                    type="file"
                    accept={instantType === "video" ? "video/*,image/*" : "image/*"}
                    onChange={(event) => chooseInstantFile(event.target.files?.[0])}
                  />
                </label>
                <Link
                  href="/editor"
                  className="mini-action"
                  onClick={() => setInstantCreatorOpen(false)}
                >
                  Edit first
                </Link>
              </div>
            ) : null}
            <label className="composer-field">
              <span>Caption</span>
              <textarea
                value={instantText}
                maxLength={80}
                onChange={(event) => setInstantText(event.target.value)}
              />
            </label>
            <BlipButton type="button" onClick={publishInstant} wide>
              Publish Instant
            </BlipButton>
          </div>
        </div>
      ) : null}
      {noteCreatorOpen ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="note-create-modal">
            <button
              className="modal-close"
              type="button"
              onClick={() => setNoteCreatorOpen(false)}
              aria-label="Close note"
            >
              <X size={22} />
            </button>
            <h2>Your note</h2>
            <textarea
              value={noteDraft}
              maxLength={30}
              onChange={(event) => setNoteDraft(event.target.value.slice(0, 30))}
            />
            <div className="note-meta-row">
              <span>{noteDraft.length}/30</span>
              <span>
                {userNoteExpiresAt ? "disappears within 24 hours" : "lasts 24 hours"}
              </span>
            </div>
            <BlipButton
              type="button"
              onClick={() => {
                setUserNote(noteDraft);
                setNoteCreatorOpen(false);
              }}
              wide
            >
              Save note
            </BlipButton>
          </div>
        </div>
      ) : null}
      {expandedNote ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="note-create-modal">
            <button
              className="modal-close"
              type="button"
              onClick={() => setExpandedNote(null)}
              aria-label="Close note"
            >
              <X size={22} />
            </button>
            <AvatarRing user={expandedNote} size="lg" />
            <h2>
              <VerifiedName user={expandedNote} />
            </h2>
            <p>{expandedNote.note}</p>
          </div>
        </div>
      ) : null}
    </section>
  );
}
