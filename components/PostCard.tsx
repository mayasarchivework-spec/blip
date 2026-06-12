"use client";

import Link from "next/link";
import {
  Ban,
  Copy,
  Edit3,
  EyeOff,
  Flag,
  Mail,
  MessageCircle,
  MessageSquare,
  MoreHorizontal,
  Pin,
  Send,
  Share2,
  Trash2,
  X
} from "lucide-react";
import { useEffect, useState } from "react";
import { AvatarRing } from "@/components/AvatarRing";
import { BlipReactionIcon } from "@/components/BlipReactionIcon";
import { PostContent } from "@/components/PostContent";
import type { Post } from "@/data/types";
import { copyToClipboard } from "@/lib/copyToClipboard";
import { useAppState } from "@/state/AppState";

interface PostCardProps {
  post: Post;
  canInteract?: boolean;
  contentExpandable?: boolean;
}

export function PostCard({
  post,
  canInteract = false,
  contentExpandable = true
}: PostCardProps) {
  const {
    addPostComment,
    blipPost,
    deletePost,
    getCommentsForPost,
    getUserById,
    hasBlipped,
    hidePost,
    isOwner,
    loadPostComments,
    pinPost
  } = useAppState();
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [blipBurst, setBlipBurst] = useState(false);
  const [draftComment, setDraftComment] = useState("");
  const [menuMessage, setMenuMessage] = useState("");
  const user = getUserById(post.userId);
  const loadedComments = getCommentsForPost(post.id);

  useEffect(() => {
    if (commentsOpen || expanded) {
      void loadPostComments(post.id);
    }
  }, [commentsOpen, expanded, loadPostComments, post.id]);

  if (!user) {
    return null;
  }

  const postUser = user;
  const blipped = hasBlipped(post.id);
  const ownPost = isOwner(post.userId);
  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/profile/${postUser.username}?post=${post.id}`
      : `/profile/${postUser.username}?post=${post.id}`;
  const commentSeed = [
    "this is so blip coded",
    "the filter is perfect",
    "saving this mood"
  ];

  function handleBlip() {
    if (!canInteract) {
      return;
    }

    const willUnlike = hasBlipped(post.id);
    blipPost(post.id, post.userId);
    if (!willUnlike) {
      setBlipBurst(false);
      window.setTimeout(() => setBlipBurst(true), 0);
      window.setTimeout(() => setBlipBurst(false), 560);
    }
  }

  function addComment() {
    const trimmed = draftComment.trim();
    if (!trimmed) {
      return;
    }

    void addPostComment(post.id, post.userId, trimmed);
    setDraftComment("");
  }

  async function copyShareLink(message = "link copied") {
    const copied = await copyToClipboard(shareUrl);
    setMenuMessage(copied ? message : "select and copy this link");
    window.setTimeout(() => setMenuMessage(""), 1200);
  }

  const shareOptions = [
    { label: "Copy link", icon: Copy, onClick: () => void copyShareLink() },
    { label: "WhatsApp", icon: MessageCircle, href: `https://wa.me/?text=${encodeURIComponent(shareUrl)}` },
    { label: "Snapchat", icon: MessageSquare, onClick: () => void copyShareLink("link copied for Snapchat") },
    { label: "Email", icon: Mail, href: `mailto:?subject=Blip&body=${encodeURIComponent(shareUrl)}` },
    { label: "Instagram DMs", icon: Send, onClick: () => void copyShareLink("link copied for Instagram") },
    { label: "Messages", icon: MessageSquare, href: "/messages" }
  ];

  function renderComments() {
    return (
      <div className="comment-list">
        {loadedComments
          ? loadedComments.map((comment) => {
              const author = getUserById(comment.userId) ?? postUser;
              return (
                <div className="comment-row" key={comment.id}>
                  <AvatarRing user={author} size="sm" showInstant={false} />
                  <p>
                    <strong>{comment.authorName ?? author.displayName}</strong>{" "}
                    {comment.body}
                  </p>
                </div>
              );
            })
          : commentSeed.slice(0, Math.min(3, post.comments)).map((comment, index) => (
              <div className="comment-row" key={`${post.id}-comment-${index}`}>
                <AvatarRing user={postUser} size="sm" showInstant={false} />
                <p>
                  <strong>{index === 0 ? postUser.displayName : "friend"}</strong>{" "}
                  {comment}
                </p>
              </div>
            ))}
        {loadedComments?.length === 0 ? (
          <p className="panel-empty">No comments yet.</p>
        ) : null}
      </div>
    );
  }

  return (
    <article className="post-card">
      <div className="post-top">
        <Link href={`/profile/${user.username}`} className="post-author">
          <AvatarRing user={user} size="sm" />
          <div>
            <strong>{user.displayName}</strong>
            <span>{post.createdAt}</span>
          </div>
        </Link>
        {post.isPinned ? <span className="pin-label">Pinned</span> : null}
      </div>
      <div
        className={`post-open-target ${contentExpandable ? "" : "not-expandable"}`}
        role="button"
        tabIndex={0}
        onClick={() => {
          if (contentExpandable) {
            setExpanded(true);
          }
        }}
        onKeyDown={(event) => {
          if (contentExpandable && (event.key === "Enter" || event.key === " ")) {
            setExpanded(true);
          }
        }}
      >
        <PostContent post={post} />
      </div>
      {post.caption ? <p className="post-caption">{post.caption}</p> : null}
      <div className="post-actions">
        <button
          type="button"
          className={`post-blip-button ${blipped ? "blipped" : ""} ${
            blipBurst ? "blip-burst" : ""
          }`}
          onClick={handleBlip}
          disabled={!canInteract}
          aria-label="Blip post"
          aria-pressed={blipped}
        >
          <BlipReactionIcon active={blipped} size={23} />
          <span>{post.blips} blips</span>
          {blipBurst ? <i className="blip-pop">+1</i> : null}
        </button>
        <button
          type="button"
          disabled={!canInteract}
          onClick={() => setCommentsOpen((value) => !value)}
        >
          <MessageCircle size={22} />
          <span>{post.comments}</span>
        </button>
        <button
          type="button"
          disabled={!canInteract}
          onClick={() => {
            setShareOpen((value) => !value);
            setMoreOpen(false);
          }}
        >
          <Share2 size={22} />
          <span>Share</span>
        </button>
        <button
          type="button"
          aria-label="More post options"
          onClick={() => {
            setMoreOpen((value) => !value);
            setShareOpen(false);
          }}
        >
          <MoreHorizontal size={24} />
        </button>
      </div>
      {shareOpen ? (
        <div className="post-popover share-popover">
          {shareOptions.map(({ href, icon: OptionIcon, label, onClick }) =>
            href ? (
              <a key={label} href={href} target={href.startsWith("http") ? "_blank" : undefined}>
                <OptionIcon size={17} />
                <span>{label}</span>
              </a>
            ) : (
              <button key={label} type="button" onClick={onClick}>
                <OptionIcon size={17} />
                <span>{label}</span>
              </button>
            )
          )}
          {menuMessage ? <p>{menuMessage}</p> : null}
        </div>
      ) : null}
      {moreOpen ? (
        <div className="post-popover post-menu">
          {ownPost ? (
            <>
              <Link href="/editor">
                <Edit3 size={17} />
                <span>Edit</span>
              </Link>
              <button type="button" onClick={() => pinPost(post.id)}>
                <Pin size={17} />
                <span>{post.isPinned ? "Unpin" : "Pin photo"}</span>
              </button>
              <button type="button" onClick={() => hidePost(post.id)}>
                <EyeOff size={17} />
                <span>Hide</span>
              </button>
              <button type="button" className="danger-menu-item" onClick={() => deletePost(post.id)}>
                <Trash2 size={17} />
                <span>Delete</span>
              </button>
            </>
          ) : (
            <>
              <button type="button" onClick={() => setMenuMessage("reported")}>
                <Flag size={17} />
                <span>Report</span>
              </button>
              <button type="button" onClick={() => setMenuMessage("blocked")}>
                <Ban size={17} />
                <span>Block</span>
              </button>
            </>
          )}
          {menuMessage ? <p>{menuMessage}</p> : null}
        </div>
      ) : null}
      {!canInteract ? (
        <div className="interaction-note">Only friends can interact.</div>
      ) : null}
      {commentsOpen ? (
        <div className="comments-drawer">
          <div className="comments-head">
            <strong>Comments</strong>
            <button type="button" onClick={() => setCommentsOpen(false)} aria-label="Close comments">
              <X size={20} />
            </button>
          </div>
          {renderComments()}
          <div className="comment-compose">
            <input
              value={draftComment}
              onChange={(event) => setDraftComment(event.target.value)}
              placeholder="write a comment..."
              aria-label="Write a comment"
            />
            <button type="button" onClick={addComment} aria-label="Post comment">
              <Send size={18} />
            </button>
          </div>
        </div>
      ) : null}
      {expanded ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="expanded-post">
            <button
              className="modal-close"
              type="button"
              onClick={() => setExpanded(false)}
              aria-label="Close post"
            >
              <X size={22} />
            </button>
            <div className="expanded-post-head">
              <AvatarRing user={user} size="sm" />
              <div>
                <strong>{user.displayName}</strong>
                <span>{post.createdAt}</span>
              </div>
            </div>
            <PostContent post={post} />
            {post.caption ? <p className="post-caption">{post.caption}</p> : null}
            <div className="expanded-post-comments">
              <strong>Comments</strong>
              {renderComments()}
              {canInteract ? (
                <div className="comment-compose">
                  <input
                    value={draftComment}
                    onChange={(event) => setDraftComment(event.target.value)}
                    placeholder="write a comment..."
                    aria-label="Write a comment"
                  />
                  <button type="button" onClick={addComment} aria-label="Post comment">
                    <Send size={18} />
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </article>
  );
}
