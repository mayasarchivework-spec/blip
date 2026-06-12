import { Play } from "lucide-react";
import { TextPost } from "@/components/TextPost";
import type { Post } from "@/data/types";

interface PostContentProps {
  post: Post;
  compact?: boolean;
}

export function PostContent({ post, compact = false }: PostContentProps) {
  if (post.type === "text") {
    return <TextPost content={post.content} compact={compact} />;
  }

  return (
    <div className={`media-frame media-${post.aspectRatio ?? "free"}`}>
      {post.type === "video" && post.videoUrl?.startsWith("data:video") ? (
        <video src={post.videoUrl} poster={post.imageUrl} controls playsInline preload="metadata" />
      ) : post.imageUrl ? (
        <img src={post.imageUrl} alt={post.caption ?? post.content} />
      ) : null}
      {post.type === "video" && !post.videoUrl?.startsWith("data:video") ? (
        <span className="video-play">
          <Play size={36} fill="currentColor" />
        </span>
      ) : null}
    </div>
  );
}
