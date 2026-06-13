"use client";

import Link from "next/link";
import {
  AtSign,
  Camera,
  FileText,
  Hash,
  ImagePlus,
  MessageCircle,
  Play,
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

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve) => {
    const reader = new FileReader();

    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => resolve("");
    reader.readAsDataURL(file);
  });
}

function captureVideoThumbnail(src: string) {
  return new Promise<string>((resolve, reject) => {
    const video = document.createElement("video");
    let timeoutId = 0;
    let finished = false;

    function settle(callback: () => void) {
      if (finished) {
        return;
      }

      finished = true;
      window.clearTimeout(timeoutId);
      callback();
    }

    function capture() {
      const width = video.videoWidth || 1080;
      const height = video.videoHeight || 1920;
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");

      if (!context) {
        settle(() => reject(new Error("Could not prepare the video thumbnail.")));
        return;
      }

      const maxSide = 960;
      const scale = Math.min(1, maxSide / Math.max(width, height));
      canvas.width = Math.max(1, Math.round(width * scale));
      canvas.height = Math.max(1, Math.round(height * scale));
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      settle(() => resolve(canvas.toDataURL("image/jpeg", 0.86)));
    }

    video.muted = true;
    video.playsInline = true;
    video.preload = "metadata";
    video.onloadeddata = () => {
      const seekTarget =
        Number.isFinite(video.duration) && video.duration > 0.35
          ? Math.min(0.35, video.duration / 4)
          : 0;

      if (seekTarget > 0) {
        const fallbackId = window.setTimeout(capture, 700);
        video.onseeked = () => {
          window.clearTimeout(fallbackId);
          capture();
        };

        try {
          video.currentTime = seekTarget;
        } catch {
          window.clearTimeout(fallbackId);
          capture();
        }
        return;
      }

      capture();
    };
    video.onerror = () =>
      settle(() => reject(new Error("Could not load this video for a thumbnail.")));
    timeoutId = window.setTimeout(
      () => settle(() => reject(new Error("Video thumbnail timed out."))),
      5000
    );
    video.src = src;
    video.load();
  });
}

export function ComposerModal() {
  const { addLocalPost, composerType, closeComposer, currentUser } = useAppState();
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [text, setText] = useState("");
  const [replyMode, setReplyMode] = useState<(typeof replyModes)[number]>("Friends");
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [videoThumbnailUrl, setVideoThumbnailUrl] = useState("");
  const [videoThumbnailStatus, setVideoThumbnailStatus] = useState("");
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
  const previewUrl = mediaUrls[0] ?? "";
  const visualUrls =
    composerType === "photo"
      ? mediaUrls.slice(0, 20)
      : previewUrl
        ? [previewUrl]
        : [];
  const isMakingVideoThumbnail = videoThumbnailStatus === "Making thumbnail...";

  async function chooseFiles(fileList: FileList | null) {
    const files = Array.from(fileList ?? []).slice(0, composerType === "photo" ? 20 : 1);

    if (!files.length) {
      return;
    }

    if (composerType === "video") {
      const videoUrl = await readFileAsDataUrl(files[0]);
      setMediaUrls(videoUrl ? [videoUrl] : []);
      setVideoThumbnailUrl("");

      if (!videoUrl) {
        setVideoThumbnailStatus("Could not load video");
        return;
      }

      setVideoThumbnailStatus("Making thumbnail...");

      try {
        setVideoThumbnailUrl(await captureVideoThumbnail(videoUrl));
        setVideoThumbnailStatus("");
      } catch {
        setVideoThumbnailStatus("Preview ready");
      }

      return;
    }

    setVideoThumbnailUrl("");
    setVideoThumbnailStatus("");

    const urls = await Promise.all(files.map((file) => readFileAsDataUrl(file)));
    const cleanUrls = urls.filter(Boolean);
    setMediaUrls((current) => [...current, ...cleanUrls].slice(0, 20));
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
        imageUrl: composerType === "video" ? videoThumbnailUrl || undefined : previewUrl,
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
      <div className={`composer-modal composer-modal-${composerType}`}>
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
              {!mediaUrls.length ? (
                <label className="composer-upload-empty">
                  <ImagePlus size={26} />
                  <span>Upload {composerType === "photo" ? "images" : "a video"}</span>
                  <small>{composerType === "photo" ? "up to 20 images" : "thumbnail made for you"}</small>
                  <input
                    type="file"
                    accept={composerType === "photo" ? "image/*" : "video/*"}
                    multiple={composerType === "photo"}
                    onChange={(event) => chooseFiles(event.target.files)}
                  />
                </label>
              ) : composerType === "video" ? (
                <div className="composer-video-poster">
                  {videoThumbnailUrl ? (
                    <img src={videoThumbnailUrl} alt="" />
                  ) : (
                    <video src={previewUrl} muted playsInline preload="metadata" />
                  )}
                  <span className="composer-play composer-play-clean">
                    <Play size={28} fill="currentColor" />
                  </span>
                  <span className="composer-preview-pill">Video</span>
                  {videoThumbnailStatus ? (
                    <span className="composer-video-status">{videoThumbnailStatus}</span>
                  ) : null}
                </div>
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
            </div>
            <div className="composer-choice-row">
              <label className="mini-action accept">
                <ImagePlus size={17} />
                <span>Upload</span>
                <input
                  type="file"
                  accept={composerType === "photo" ? "image/*" : "video/*"}
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
            disabled={
              (isVisual && !mediaUrls.length) || isMakingVideoThumbnail || (!isVisual && !text.trim())
            }
          >
            {posted ? "Posted" : isMakingVideoThumbnail ? "Preparing" : "Post"}
          </BlipButton>
        </div>
      </div>
    </div>
  );
}
