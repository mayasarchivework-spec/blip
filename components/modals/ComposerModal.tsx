"use client";

import Link from "next/link";
import {
  AtSign,
  Camera,
  FileText,
  Hash,
  ImagePlus,
  MessageCircle,
  Sparkles,
  Users,
  Video,
  X
} from "lucide-react";
import { useState } from "react";
import { AvatarRing } from "@/components/AvatarRing";
import { BlipButton } from "@/components/BlipButton";
import { RichText } from "@/components/RichText";
import { VerifiedName } from "@/components/VerifiedName";
import { useAppState } from "@/state/AppState";
import type { ComposerType } from "@/data/types";

const iconMap = {
  photo: Camera,
  text: FileText,
  video: Video
};

const fallbackPhoto = "/assets/photo-selfie.svg";
const fallbackVideo = "/assets/photo-car-night.svg";
const replyModes = ["Friends", "Everyone", "No replies"] as const;

function formatHashtags(value: string) {
  return value
    .split(/[\s,]+/)
    .map((tag) => tag.trim().replace(/^#+/, ""))
    .filter(Boolean)
    .map((tag) => `#${tag}`);
}

function buildCaption(caption: string, hashtags: string) {
  return [caption.trim(), formatHashtags(hashtags).join(" ")]
    .filter(Boolean)
    .join(" ");
}

function isVisualComposer(type: ComposerType): type is "photo" | "video" {
  return type === "photo" || type === "video";
}

export function ComposerModal() {
  const { addLocalPost, composerType, closeComposer, currentUser } = useAppState();
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [text, setText] = useState("");
  const [replyMode, setReplyMode] = useState<(typeof replyModes)[number]>("Friends");
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [posted, setPosted] = useState(false);
  const textPreview = text.trim() || "What's happening on Blip?";
  const textCount = text.length;

  if (!composerType) {
    return null;
  }

  if (composerType === "song") {
    return null;
  }

  const Icon = iconMap[composerType];
  const isVisual = isVisualComposer(composerType);
  const previewUrl = mediaUrls[0] || (composerType === "video" ? fallbackVideo : fallbackPhoto);
  const visualUrls =
    composerType === "photo"
      ? (mediaUrls.length ? mediaUrls : [fallbackPhoto]).slice(0, 20)
      : [previewUrl];
  const isUploadedVideo = composerType === "video" && previewUrl.startsWith("data:video");

  function chooseFiles(fileList: FileList | null) {
    const files = Array.from(fileList ?? []).slice(0, composerType === "photo" ? 20 : 1);

    if (!files.length) {
      return;
    }

    Promise.all(
      files.map(
        (file) =>
          new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
            reader.onerror = () => resolve("");
            reader.readAsDataURL(file);
          })
      )
    ).then((urls) => {
      const cleanUrls = urls.filter(Boolean);
      setMediaUrls((current) =>
        composerType === "photo"
          ? [...current, ...cleanUrls].slice(0, 20)
          : cleanUrls.slice(0, 1)
      );
    });
  }

  function removeImage(index: number) {
    setMediaUrls((urls) => urls.filter((_, itemIndex) => itemIndex !== index));
  }

  function postDraft() {
    const finalCaption = buildCaption(caption, hashtags);

    if (isVisual) {
      addLocalPost({
        type: composerType,
        content: finalCaption || (composerType === "photo" ? "new photo" : "new video"),
        imageUrl: previewUrl,
        imageUrls: composerType === "photo" ? visualUrls : undefined,
        videoUrl: composerType === "video" ? previewUrl : undefined,
        caption: finalCaption || undefined
      });
    } else {
      addLocalPost({
        type: "text",
        content: textPreview,
        caption: finalCaption || undefined
      });
    }

    setPosted(true);
    window.setTimeout(() => {
      setPosted(false);
      closeComposer();
    }, 650);
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="composer-modal">
        <button className="modal-close" type="button" onClick={closeComposer}>
          <X size={22} />
        </button>
        <div className="composer-icon">
          <Icon size={34} />
        </div>
        <h2>Create {composerType} post</h2>
        {isVisual ? (
          <div className="composer-body">
            <div className="composer-preview">
              {isUploadedVideo ? (
                <video src={previewUrl} controls playsInline preload="metadata" />
              ) : composerType === "photo" && visualUrls.length > 1 ? (
                <div className="multi-image-strip">
                  {visualUrls.map((url, index) => (
                    <img key={`${url}-${index}`} src={url} alt="" />
                  ))}
                </div>
              ) : (
                <img src={previewUrl} alt="" />
              )}
              {composerType === "photo" && visualUrls.length > 1 ? (
                <span className="multi-image-count">{visualUrls.length}/20</span>
              ) : null}
              {composerType === "video" ? (
                <span className="composer-play">
                  <Video size={30} />
                </span>
              ) : null}
            </div>
            <div className="composer-choice-row">
              <label className="mini-action accept">
                <ImagePlus size={17} />
                <span>Upload</span>
                <input
                  type="file"
                  accept={composerType === "photo" ? "image/*" : "video/*,image/*"}
                  multiple={composerType === "photo"}
                  onChange={(event) => chooseFiles(event.target.files)}
                />
              </label>
              <Link href="/editor" className="mini-action">
                Open editor
              </Link>
            </div>
            {composerType === "photo" && mediaUrls.length ? (
              <div className="post-image-editor-grid">
                {mediaUrls.map((url, index) => (
                  <button
                    key={`${url}-${index}`}
                    type="button"
                    onClick={() => removeImage(index)}
                    aria-label="Remove image"
                  >
                    <img src={url} alt="" />
                    <span>Remove</span>
                  </button>
                ))}
              </div>
            ) : null}
            <label className="composer-field">
              <span>Caption</span>
              <input
                value={caption}
                onChange={(event) => setCaption(event.target.value)}
                placeholder="say something... tag @friends"
              />
            </label>
            <label className="composer-field">
              <span>Hashtags</span>
              <input
                value={hashtags}
                onChange={(event) => setHashtags(event.target.value)}
                placeholder="#night #blip"
              />
            </label>
          </div>
        ) : (
          <div className="composer-body text-status-composer">
            <div className="text-status-card">
              <div className="text-status-author">
                <AvatarRing user={currentUser} size="sm" showInstant={false} />
                <div>
                  <strong>
                    <VerifiedName user={currentUser} />
                  </strong>
                  <span>@{currentUser.username} - now</span>
                </div>
              </div>
              <label className="text-status-input">
                <span className="sr-only">Text post</span>
                <textarea
                  value={text}
                  maxLength={280}
                  onChange={(event) => setText(event.target.value)}
                  placeholder="What's happening on Blip?"
                />
              </label>
              <div className="text-status-preview">
                <RichText text={textPreview} />
              </div>
              <div className="text-status-meta">
                <span>{280 - textCount} left</span>
                <span>{replyMode} can reply</span>
              </div>
            </div>
            <label className="composer-field">
              <span>
                <Hash size={16} />
                Hashtags
              </span>
              <input
                value={hashtags}
                onChange={(event) => setHashtags(event.target.value)}
                placeholder="#thoughts #blip"
              />
            </label>
            <div className="composer-tools text-status-tools" aria-label="Text post tools">
              {replyModes.map((mode) => {
                const ModeIcon =
                  mode === "Friends" ? Users : mode === "Everyone" ? AtSign : MessageCircle;

                return (
                  <button
                    key={mode}
                    type="button"
                    className={replyMode === mode ? "active" : ""}
                    onClick={() => setReplyMode(mode)}
                  >
                    <ModeIcon size={18} />
                    <span>{mode}</span>
                  </button>
                );
              })}
              <button type="button" className="text-status-hint" disabled>
                <Sparkles size={18} />
                <span>2010 Blip status</span>
              </button>
            </div>
          </div>
        )}
        <div className="composer-actions">
          <BlipButton
            type="button"
            onClick={postDraft}
            disabled={!isVisual && !text.trim()}
          >
            {posted ? "Posted" : "Post"}
          </BlipButton>
        </div>
      </div>
    </div>
  );
}
