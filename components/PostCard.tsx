"use client";

import Link from "next/link";
import {
  Ban,
  Copy,
  Edit3,
  Eye,
  EyeOff,
  Flag,
  ImagePlus,
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
import { BlipButton } from "@/components/BlipButton";
import { BlipReactionButton } from "@/components/BlipReactionButton";
import { PostContent } from "@/components/PostContent";
import { RichText } from "@/components/RichText";
import { VerifiedName } from "@/components/VerifiedName";
import type { Post } from "@/data/types";
import { copyToClipboard } from "@/lib/copyToClipboard";
import { useAppState } from "@/state/AppState";

const hashtagPattern = /(^|\s)(#[a-zA-Z0-9_]+(?:\.[a-zA-Z0-9_]+)*)/g;

function formatHashtags(value: string) {
  return value
    .split(/[\s,]+/)
    .map((tag) => tag.trim().replace(/^#+/, ""))
    .filter(Boolean)
    .map((tag) => `#${tag}`)
    .join(" ");
}

function splitCaption(value: string | undefined) {
  const text = value ?? "";
  const hashtags = Array.from(text.matchAll(hashtagPattern))
    .map((match) => match[2])
    .join(" ");
  const caption = text.replace(hashtagPattern, " ").replace(/\s+/g, " ").trim();

  return { caption, hashtags };
}

function buildCaption(caption: string, hashtags: string) {
  return [caption.trim(), formatHashtags(hashtags)].filter(Boolean).join(" ");
}

function cleanImageUrls(urls: Array<string | undefined>) {
  return urls.filter((url): url is string => Boolean(url)).slice(0, 20);
}

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
    editPost,
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
  const [editOpen, setEditOpen] = useState(false);
  const [editCaption, setEditCaption] = useState("");
  const [editHashtags, setEditHashtags] = useState("");
  const [editImages, setEditImages] = useState<string[]>([]);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("spam");
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

    blipPost(post.id, post.userId);
  }

  function addComment() {
    const trimmed = draftComment.trim();
    if (!trimmed) {
      return;
    }

    void addPostComment(post.id, post.userId, trimmed);
    setDraftComment("");
  }

  function openEditModal() {
    const { caption, hashtags } = splitCaption(post.caption);
    const images = cleanImageUrls(
      post.imageUrls?.length ? post.imageUrls : [post.imageUrl]
    );

    setEditCaption(caption);
    setEditHashtags(hashtags);
    setEditImages(images);
    setMoreOpen(false);
    setEditOpen(true);
  }

  function chooseEditImages(fileList: FileList | null) {
    const slots = Math.max(0, 20 - editImages.length);
    const files = Array.from(fileList ?? []).slice(0, slots);

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
      setEditImages((images) => cleanImageUrls([...images, ...urls]));
    });
  }

  function savePostEdits() {
    const finalCaption = buildCaption(editCaption, editHashtags);
    const images = cleanImageUrls(editImages);

    editPost(post.id, {
      caption: finalCaption || undefined,
      content: post.type === "text" ? editCaption.trim() || post.content : finalCaption || post.content,
      imageUrl: images[0],
      imageUrls: images.length > 1 ? images : undefined
    });
    setEditOpen(false);
    setMenuMessage("post updated");
    window.setTimeout(() => setMenuMessage(""), 1200);
  }

  function showMenuToast(message: string) {
    setMenuMessage(message);
    window.setTimeout(() => setMenuMessage(""), 1400);
  }

  function handlePinPost() {
    pinPost(post.id);
    setMoreOpen(false);
    showMenuToast(post.isPinned ? "post unpinned" : "post pinned");
  }

  function handleHidePost() {
    hidePost(post.id);
    setMoreOpen(false);
    showMenuToast(post.isHidden ? "post unhidden" : "post hidden");
  }

  function openDeleteConfirm() {
    setMoreOpen(false);
    setDeleteConfirmOpen(true);
  }

  function confirmDeletePost() {
    deletePost(post.id);
    setDeleteConfirmOpen(false);
  }

  function openReportModal() {
    setMoreOpen(false);
    setReportOpen(true);
  }

  function submitReport() {
    setReportOpen(false);
    showMenuToast(`report sent: ${reportReason.replace("-", " ")}`);
  }

  function handleBlockAuthor() {
    setMoreOpen(false);
    showMenuToast(`${postUser.displayName} blocked`);
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
                    <strong>
                      <VerifiedName user={author}>
                        {comment.authorName ?? author.displayName}
                      </VerifiedName>
                    </strong>{" "}
                    <RichText text={comment.body} />
                  </p>
                </div>
              );
            })
          : commentSeed.slice(0, Math.min(3, post.comments)).map((comment, index) => (
              <div className="comment-row" key={`${post.id}-comment-${index}`}>
                <AvatarRing user={postUser} size="sm" showInstant={false} />
                <p>
                  <strong>
                    <VerifiedName user={postUser}>
                      {index === 0 ? postUser.displayName : "friend"}
                    </VerifiedName>
                  </strong>{" "}
                  <RichText text={comment} />
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
            <strong>
              <VerifiedName user={user} />
            </strong>
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
      {post.caption ? (
        <p className="post-caption">
          <RichText text={post.caption} />
        </p>
      ) : null}
      <div className="post-actions">
        <BlipReactionButton
          active={blipped}
          count={post.blips}
          onClick={handleBlip}
          disabled={!canInteract}
        />
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
              <button type="button" onClick={openEditModal}>
                <Edit3 size={17} />
                <span>Edit</span>
              </button>
              <button type="button" onClick={handlePinPost}>
                <Pin size={17} />
                <span>{post.isPinned ? "Unpin post" : "Pin post"}</span>
              </button>
              <button type="button" onClick={handleHidePost}>
                {post.isHidden ? <Eye size={17} /> : <EyeOff size={17} />}
                <span>{post.isHidden ? "Unhide" : "Hide"}</span>
              </button>
              <button type="button" className="danger-menu-item" onClick={openDeleteConfirm}>
                <Trash2 size={17} />
                <span>Delete</span>
              </button>
            </>
          ) : (
            <>
              <button type="button" onClick={openReportModal}>
                <Flag size={17} />
                <span>Report</span>
              </button>
              <button type="button" onClick={handleBlockAuthor}>
                <Ban size={17} />
                <span>Block</span>
              </button>
            </>
          )}
          {menuMessage ? <p>{menuMessage}</p> : null}
        </div>
      ) : null}
      {menuMessage && !moreOpen && !shareOpen ? (
        <div className="post-action-toast">{menuMessage}</div>
      ) : null}
      {deleteConfirmOpen ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="post-confirm-modal">
            <button
              className="modal-close"
              type="button"
              onClick={() => setDeleteConfirmOpen(false)}
              aria-label="Cancel delete"
            >
              <X size={22} />
            </button>
            <h2>Delete post?</h2>
            <p>This removes it from your Blip feed and profile.</p>
            <div className="editor-action-row">
              <BlipButton type="button" variant="secondary" onClick={() => setDeleteConfirmOpen(false)}>
                Cancel
              </BlipButton>
              <BlipButton type="button" variant="danger" onClick={confirmDeletePost}>
                Delete
              </BlipButton>
            </div>
          </div>
        </div>
      ) : null}
      {reportOpen ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="post-confirm-modal">
            <button
              className="modal-close"
              type="button"
              onClick={() => setReportOpen(false)}
              aria-label="Close report"
            >
              <X size={22} />
            </button>
            <h2>Report post</h2>
            <p>Pick the closest reason. For now this is saved as a prototype action.</p>
            <div className="report-reason-list">
              {[
                ["spam", "Spam or scam"],
                ["harassment", "Harassment"],
                ["unsafe", "Unsafe content"],
                ["other", "Something else"]
              ].map(([value, label]) => (
                <label key={value}>
                  <input
                    type="radio"
                    checked={reportReason === value}
                    onChange={() => setReportReason(value)}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
            <div className="editor-action-row">
              <BlipButton type="button" variant="secondary" onClick={() => setReportOpen(false)}>
                Cancel
              </BlipButton>
              <BlipButton type="button" variant="danger" onClick={submitReport}>
                Send report
              </BlipButton>
            </div>
          </div>
        </div>
      ) : null}
      {editOpen ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="post-edit-modal">
            <button
              className="modal-close"
              type="button"
              onClick={() => setEditOpen(false)}
              aria-label="Close edit post"
            >
              <X size={22} />
            </button>
            <h2>Edit post</h2>
            <label className="composer-field">
              <span>Caption</span>
              <textarea
                value={editCaption}
                maxLength={500}
                onChange={(event) => setEditCaption(event.target.value)}
                placeholder="update the caption..."
              />
            </label>
            <label className="composer-field">
              <span>Hashtags</span>
              <input
                value={editHashtags}
                onChange={(event) => setEditHashtags(event.target.value)}
                placeholder="#night #blip"
              />
            </label>
            <div className="post-edit-image-head">
              <strong>Images</strong>
              <span>{editImages.length}/20</span>
            </div>
            <div className="post-image-editor-grid">
              {editImages.map((imageUrl, index) => (
                <button
                  key={`${imageUrl}-${index}`}
                  type="button"
                  onClick={() =>
                    setEditImages((images) =>
                      images.filter((_, itemIndex) => itemIndex !== index)
                    )
                  }
                  aria-label="Remove image"
                >
                  <img src={imageUrl} alt="" />
                  <span>Remove</span>
                </button>
              ))}
              {editImages.length < 20 ? (
                <label className="post-image-add-button">
                  <ImagePlus size={22} />
                  <span>Add images</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(event) => chooseEditImages(event.target.files)}
                  />
                </label>
              ) : null}
            </div>
            <div className="editor-action-row">
              <BlipButton type="button" onClick={savePostEdits} wide>
                Save changes
              </BlipButton>
            </div>
          </div>
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
                <strong>
                  <VerifiedName user={user} />
                </strong>
                <span>{post.createdAt}</span>
              </div>
            </div>
            <PostContent post={post} />
            {post.caption ? (
              <p className="post-caption">
                <RichText text={post.caption} />
              </p>
            ) : null}
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
