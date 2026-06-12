"use client";

import Link from "next/link";
import { Camera, FileText, ImagePlus, LayoutGrid, Smile, Type, Video, X } from "lucide-react";
import { useState } from "react";
import { BlipButton } from "@/components/BlipButton";
import { useAppState } from "@/state/AppState";
import type { ComposerType } from "@/data/types";

const iconMap = {
  photo: Camera,
  text: FileText,
  video: Video
};

const fallbackPhoto = "/assets/photo-selfie.svg";
const fallbackVideo = "/assets/photo-car-night.svg";
const textStyles = ["notebook", "collage", "receipt"] as const;

function isVisualComposer(type: ComposerType): type is "photo" | "video" {
  return type === "photo" || type === "video";
}

export function ComposerModal() {
  const { addLocalPost, composerType, closeComposer, savedStickers } = useAppState();
  const [caption, setCaption] = useState("");
  const [text, setText] = useState("late nights\nand overthinking");
  const [textStyle, setTextStyle] = useState<(typeof textStyles)[number]>("notebook");
  const [sticker, setSticker] = useState("sparkle");
  const [mediaUrl, setMediaUrl] = useState("");
  const [posted, setPosted] = useState(false);
  const textPreview = text.trim() || "type something dreamy";

  if (!composerType) {
    return null;
  }

  if (composerType === "song") {
    return null;
  }

  const Icon = iconMap[composerType];
  const isVisual = isVisualComposer(composerType);
  const previewUrl = mediaUrl || (composerType === "video" ? fallbackVideo : fallbackPhoto);
  const isUploadedVideo = composerType === "video" && previewUrl.startsWith("data:video");

  function chooseFile(file: File | undefined) {
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setMediaUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  }

  function postDraft() {
    if (isVisual) {
      addLocalPost({
        type: composerType,
        content: caption.trim() || (composerType === "photo" ? "new photo" : "new video"),
        imageUrl: previewUrl,
        videoUrl: composerType === "video" ? previewUrl : undefined,
        caption: caption.trim() || undefined
      });
    } else {
      addLocalPost({
        type: "text",
        content: textPreview,
        caption: caption.trim() || undefined
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
              ) : (
                <img src={previewUrl} alt="" />
              )}
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
                  onChange={(event) => chooseFile(event.target.files?.[0])}
                />
              </label>
              <Link href="/editor" className="mini-action">
                Open editor
              </Link>
            </div>
            <label className="composer-field">
              <span>Caption</span>
              <input
                value={caption}
                onChange={(event) => setCaption(event.target.value)}
                placeholder="say something..."
              />
            </label>
          </div>
        ) : (
          <div className="composer-body">
            <div className={`text-composer-preview text-style-${textStyle}`}>
              <pre>{textPreview}</pre>
              <i>{sticker === "sparkle" ? "*" : sticker === "heart" ? "<3" : "star"}</i>
            </div>
            <label className="composer-field">
              <span>Text</span>
              <textarea
                value={text}
                maxLength={160}
                onChange={(event) => setText(event.target.value)}
              />
            </label>
            <div className="composer-tools" aria-label="Text post tools">
              {textStyles.map((style) => (
                <button
                  key={style}
                  type="button"
                  className={textStyle === style ? "active" : ""}
                  onClick={() => setTextStyle(style)}
                >
                  {style === "notebook" ? <Type size={18} /> : <LayoutGrid size={18} />}
                  <span>{style}</span>
                </button>
              ))}
              {["sparkle", "heart", "star"].map((item) => (
                <button
                  key={item}
                  type="button"
                  className={sticker === item ? "active" : ""}
                  onClick={() => setSticker(item)}
                >
                  <Smile size={18} />
                  <span>{item}</span>
                </button>
              ))}
            </div>
            {savedStickers.length ? (
              <div className="saved-sticker-row">
                {savedStickers.slice(0, 4).map((item) => (
                  <img key={item} src={item} alt="" />
                ))}
              </div>
            ) : null}
          </div>
        )}
        <div className="composer-actions">
          <BlipButton type="button" onClick={postDraft}>
            {posted ? "Posted" : "Post"}
          </BlipButton>
        </div>
      </div>
    </div>
  );
}
