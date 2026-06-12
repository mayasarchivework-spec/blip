import { Play } from "lucide-react";
import { TextPost } from "@/components/TextPost";
import type { Post } from "@/data/types";

interface PostContentProps {
  post: Post;
  compact?: boolean;
}

export function PostContent({ post, compact = false }: PostContentProps) {
  const images = (post.imageUrls?.length ? post.imageUrls : post.imageUrl ? [post.imageUrl] : [])
    .filter(Boolean)
    .slice(0, 20);

  if (post.type === "text") {
    if (!images.length) {
      return <TextPost content={post.content} compact={compact} />;
    }

    return (
      <div className="text-post-with-media">
        <TextPost content={post.content} compact={compact} />
        <div className="media-frame media-frame-multiple media-free">
          <div className="multi-image-strip" aria-label={`${images.length} images`}>
            {images.map((imageUrl, index) => (
              <img
                key={`${imageUrl}-${index}`}
                src={imageUrl}
                alt={`${post.caption ?? post.content} ${index + 1}`}
              />
            ))}
          </div>
          {images.length > 1 ? <span className="multi-image-count">1/{images.length}</span> : null}
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
      {post.type === "video" && post.videoUrl?.startsWith("data:video") ? (
        <video src={post.videoUrl} poster={images[0] ?? post.imageUrl} controls playsInline preload="metadata" />
      ) : images.length > 1 ? (
        <div className="multi-image-strip" aria-label={`${images.length} images`}>
          {images.map((imageUrl, index) => (
            <img
              key={`${imageUrl}-${index}`}
              src={imageUrl}
              alt={`${post.caption ?? post.content} ${index + 1}`}
            />
          ))}
        </div>
      ) : images[0] ? (
        <img src={images[0]} alt={post.caption ?? post.content} />
      ) : null}
      {images.length > 1 ? <span className="multi-image-count">1/{images.length}</span> : null}
      {post.type === "video" && !post.videoUrl?.startsWith("data:video") ? (
        <span className="video-play">
          <Play size={36} fill="currentColor" />
        </span>
      ) : null}
    </div>
  );
}
