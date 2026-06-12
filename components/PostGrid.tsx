"use client";

import Link from "next/link";
import { Play, X } from "lucide-react";
import { useState } from "react";
import { BlipReactionButton } from "@/components/BlipReactionButton";
import { PostCard } from "@/components/PostCard";
import { PostContent } from "@/components/PostContent";
import { VerifiedName } from "@/components/VerifiedName";
import type { Post } from "@/data/types";
import { useAppState } from "@/state/AppState";

interface PostGridProps {
  posts: Post[];
  canInteract?: (post: Post) => boolean;
  showOwner?: boolean;
  showPinnedLabels?: boolean;
}

export function PostGrid({
  posts,
  canInteract,
  showOwner = false,
  showPinnedLabels = false
}: PostGridProps) {
  const { blipPost, getUserById, hasBlipped } = useAppState();
  const [expandedPost, setExpandedPost] = useState<Post | null>(null);

  function handleTileBlip(post: Post, interactable: boolean) {
    if (!interactable) {
      return;
    }

    blipPost(post.id, post.userId);
  }

  return (
    <div className="masonry-grid">
      {posts.map((post) => {
        const owner = getUserById(post.userId);
        const interactable = canInteract ? canInteract(post) : false;
        const blipped = hasBlipped(post.id);

        return (
          <article className="masonry-item" key={post.id}>
            <div
              className="grid-tile"
              role="button"
              tabIndex={0}
              onClick={() => setExpandedPost(post)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  setExpandedPost(post);
                }
              }}
            >
              <div className="tile-labels">
                <span>{post.type}</span>
                {showPinnedLabels && post.isPinned ? <span>Pinned</span> : null}
              </div>
              <PostContent post={post} compact />
              {showOwner && owner ? (
                <Link className="tile-owner" href={`/profile/${owner.username}`}>
                  @{owner.username}
                </Link>
              ) : null}
              {post.type === "video" ? (
                <span className="tile-play">
                  <Play size={22} fill="currentColor" />
                </span>
              ) : null}
              <span
                className="tile-blip"
                onClick={(event) => {
                  event.stopPropagation();
                }}
              >
                <BlipReactionButton
                  active={blipped}
                  count={post.blips}
                  compact
                  disabled={!interactable}
                  onClick={() => handleTileBlip(post, interactable)}
                />
              </span>
            </div>
          </article>
        );
      })}
      {expandedPost ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="expanded-post expanded-grid-post">
            <button
              className="modal-close"
              type="button"
              onClick={() => setExpandedPost(null)}
              aria-label="Close post"
            >
              <X size={22} />
            </button>
            {getUserById(expandedPost.userId) ? (
              <div className="expanded-post-head">
                <strong>
                  <VerifiedName user={getUserById(expandedPost.userId)!} />
                </strong>
                <span>{expandedPost.createdAt}</span>
              </div>
            ) : null}
            <PostCard
              post={expandedPost}
              canInteract={canInteract ? canInteract(expandedPost) : false}
              contentExpandable={false}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
