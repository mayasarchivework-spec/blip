"use client";

import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import type { MouseEvent } from "react";
import { useState } from "react";
import { TextPost } from "@/components/TextPost";
import type { Post } from "@/data/types";

interface PostContentProps {
  post: Post;
  compact?: boolean;
}

function cleanImageUrls(urls: Array<string | undefined>) {
  return urls.filter((url): url is string => Boolean(url)).slice(0, 20);
}

interface MediaCarouselProps {
  images: string[];
  label: string;
}

function MediaCarousel({ images, label }: MediaCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const safeIndex = Math.min(activeIndex, Math.max(0, images.length - 1));

  function move(direction: -1 | 1, event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    setActiveIndex((index) => {
      const nextIndex = index + direction;

      if (nextIndex < 0) {
        return images.length - 1;
      }

      if (nextIndex >= images.length) {
        return 0;
      }

      return nextIndex;
    });
  }

  if (!images.length) {
    return null;
  }

  return (
    <div className="multi-image-carousel" aria-label={`${images.length} images`}>
      <img src={images[safeIndex]} alt={`${label} ${safeIndex + 1}`} />
      {images.length > 1 ? (
        <>
          <button
            type="button"
            className="post-media-nav post-media-nav-left"
            onClick={(event) => move(-1, event)}
            aria-label="Previous image"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            type="button"
            className="post-media-nav post-media-nav-right"
            onClick={(event) => move(1, event)}
            aria-label="Next image"
          >
            <ChevronRight size={24} />
          </button>
          <span className="multi-image-count">
            {safeIndex + 1}/{images.length}
          </span>
          <div className="post-media-dots" aria-hidden="true">
            {images.slice(0, 10).map((imageUrl, index) => (
              <span
                key={`${imageUrl}-${index}`}
                className={index === safeIndex ? "active" : ""}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

interface VideoPreviewProps {
  label: string;
  poster?: string;
  src: string;
}

function VideoPreview({ label, poster, src }: VideoPreviewProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  if (isPlaying) {
    return (
      <video
        src={src}
        poster={poster}
        controls
        autoPlay
        playsInline
        preload="metadata"
        onClick={(event) => event.stopPropagation()}
      />
    );
  }

  return (
    <button
      type="button"
      className="clean-video-preview"
      onClick={(event) => {
        event.stopPropagation();
        setIsPlaying(true);
      }}
      aria-label={`Play ${label}`}
    >
      {poster ? (
        <img src={poster} alt={label} />
      ) : (
        <video src={src} muted playsInline preload="metadata" />
      )}
      <span className="video-play video-play-clean">
        <Play size={42} fill="currentColor" />
      </span>
    </button>
  );
}

export function PostContent({ post, compact = false }: PostContentProps) {
  const images = cleanImageUrls(
    post.imageUrls?.length ? post.imageUrls : [post.imageUrl]
  );
  const mediaLabel = post.caption ?? post.content;

  if (post.type === "text") {
    if (!images.length) {
      return <TextPost content={post.content} compact={compact} />;
    }

    return (
      <div className="text-post-with-media">
        <TextPost content={post.content} compact={compact} />
        <div className="media-frame media-frame-multiple media-free">
          <MediaCarousel images={images} label={mediaLabel} />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`media-frame media-${post.aspectRatio ?? "free"} ${
        images.length > 1 ? "media-frame-multiple" : ""
      }`}
    >
      {post.type === "video" && post.videoUrl ? (
        <VideoPreview src={post.videoUrl} poster={images[0] ?? post.imageUrl} label={mediaLabel} />
      ) : images.length > 1 ? (
        <MediaCarousel images={images} label={mediaLabel} />
      ) : images[0] ? (
        <img src={images[0]} alt={mediaLabel} />
      ) : null}
      {post.type === "video" && !post.videoUrl?.startsWith("data:video") ? (
        <span className="video-play">
          <Play size={36} fill="currentColor" />
        </span>
      ) : null}
    </div>
  );
}
