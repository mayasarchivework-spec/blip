"use client";

import Link from "next/link";
import {
  Copy,
  Heart,
  ImagePlus,
  Mail,
  MessageCircle,
  MessageSquare,
  Settings,
  Share2,
  UserMinus,
  Users,
  X
} from "lucide-react";
import { useState } from "react";
import { AvatarRing } from "@/components/AvatarRing";
import { BlipButton } from "@/components/BlipButton";
import type { User } from "@/data/types";
import { copyToClipboard } from "@/lib/copyToClipboard";
import { useAppState } from "@/state/AppState";

interface ProfileHeaderProps {
  user: User;
  isOwnerProfile: boolean;
  isFriendProfile: boolean;
}

export function ProfileHeader({
  user,
  isOwnerProfile,
  isFriendProfile
}: ProfileHeaderProps) {
  const {
    accent,
    currentUser,
    getUserById,
    hasRequested,
    openInstant,
    posts,
    removeFriend,
    requestFriend,
    saveProfile,
    threads
  } = useAppState();
  const [editing, setEditing] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [profilePanel, setProfilePanel] = useState<"friends" | "blips" | null>(null);
  const [shareMessage, setShareMessage] = useState("");
  const [form, setForm] = useState({
    username: user.username,
    displayName: user.displayName,
    bio: user.bio,
    location: user.location ?? user.profileLine ?? "",
    avatarUrl: user.avatarUrl,
    bannerUrl: user.bannerUrl ?? "",
    avatarShape: user.avatarShape ?? "circle"
  });
  const requested = hasRequested(user.id);
  const profileFriends = user.friendIds
    .map((friendId) => getUserById(friendId))
    .filter((friend): friend is User => Boolean(friend));
  const profilePosts = posts.filter((post) => post.userId === user.id);
  const topBlipPosts = [...profilePosts].sort((a, b) => b.blips - a.blips).slice(0, 6);
  const loadedPostBlips = profilePosts.reduce((total, post) => total + post.blips, 0);
  const profileBlipTotal = Math.max(user.stats.blips, loadedPostBlips);
  const messageThread = threads.find(
    (thread) =>
      thread.participantIds.includes(currentUser.id) &&
      thread.participantIds.includes(user.id)
  );
  const profileUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/profile/${user.username}`
      : `/profile/${user.username}`;
  async function copyProfileLink(message = "profile link copied") {
    const copied = await copyToClipboard(profileUrl);
    setShareMessage(copied ? message : "select and copy this link");
    window.setTimeout(() => setShareMessage(""), 1200);
  }

  const shareOptions = [
    {
      label: "WhatsApp",
      icon: MessageCircle,
      href: `https://wa.me/?text=${encodeURIComponent(profileUrl)}`
    },
    {
      label: "Email",
      icon: Mail,
      href: `mailto:?subject=Blip profile&body=${encodeURIComponent(profileUrl)}`
    },
    { label: "Messages", icon: MessageSquare, href: "/messages" },
    { label: "Snapchat", icon: Share2, onClick: () => void copyProfileLink("link copied for Snapchat") },
    {
      label: "Copy link",
      icon: Copy,
      onClick: () => void copyProfileLink()
    }
  ];

  function resizeProfileImage(
    file: File,
    key: "avatarUrl" | "bannerUrl",
    onLoad: (dataUrl: string) => void
  ) {
    const limits =
      key === "bannerUrl"
        ? { width: 1080, height: 1920, quality: 0.82, mode: "cover" as const }
        : { maxWidth: 520, maxHeight: 520, quality: 0.82, mode: "contain" as const };
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result !== "string") {
        return;
      }

      const originalDataUrl = reader.result;
      const image = new Image();

      image.onload = () => {
        const width = image.naturalWidth || image.width;
        const height = image.naturalHeight || image.height;
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        if (!context) {
          onLoad(originalDataUrl);
          return;
        }

        if (limits.mode === "cover") {
          const outputWidth = limits.width;
          const outputHeight = limits.height;
          const scale = Math.max(outputWidth / width, outputHeight / height);
          const drawWidth = width * scale;
          const drawHeight = height * scale;

          canvas.width = outputWidth;
          canvas.height = outputHeight;
          context.drawImage(
            image,
            (outputWidth - drawWidth) / 2,
            (outputHeight - drawHeight) / 2,
            drawWidth,
            drawHeight
          );
        } else {
          const scale = Math.min(1, limits.maxWidth / width, limits.maxHeight / height);

          canvas.width = Math.max(1, Math.round(width * scale));
          canvas.height = Math.max(1, Math.round(height * scale));
          context.drawImage(image, 0, 0, canvas.width, canvas.height);
        }

        onLoad(canvas.toDataURL("image/jpeg", limits.quality));
      };

      image.onerror = () => onLoad(originalDataUrl);
      image.src = originalDataUrl;
    };

    reader.readAsDataURL(file);
  }

  function chooseImage(file: File | undefined, key: "avatarUrl" | "bannerUrl") {
    if (!file) {
      return;
    }

    resizeProfileImage(file, key, (dataUrl) => {
      setForm((values) => ({ ...values, [key]: dataUrl }));
    });
  }

  async function saveEdits() {
    await saveProfile({
      username: form.username,
      displayName: form.displayName,
      bio: form.bio,
      location: form.location,
      profileLine: form.location,
      avatarUrl: form.avatarUrl,
      bannerUrl: form.bannerUrl,
      avatarShape: form.avatarShape
    });
    setEditing(false);
  }

  return (
    <section className="profile-card">
      {user.bannerUrl ? <img className="profile-banner" src={user.bannerUrl} alt="" /> : null}
      <div className="profile-top">
        <AvatarRing user={user} size="xl" onClick={() => openInstant(user.id)} />
        <div className="profile-copy">
          <div className="profile-name-row">
            <h2>{user.displayName}</h2>
            {isOwnerProfile ? (
              <Link href="/settings" className="gear-link" aria-label="Open settings">
                <Settings size={28} />
              </Link>
            ) : null}
          </div>
          <Link href={`/profile/${user.username}`} className="handle">
            @{user.username}
          </Link>
          <p>{user.bio}</p>
          {user.profileLine ? <p className="profile-line">{user.profileLine}</p> : null}
        </div>
        {isOwnerProfile ? (
          <div className="theme-chip">
            <span>{accent.label} theme</span>
            <i />
          </div>
        ) : null}
      </div>
      <div className="profile-stats">
        <div>
          <strong>{user.stats.posts}</strong>
          <span>posts</span>
        </div>
        <button
          type="button"
          className="profile-stat-button"
          onClick={() => setProfilePanel("friends")}
        >
          <strong>{user.stats.friends}</strong>
          <span>friends</span>
        </button>
        <button
          type="button"
          className="profile-stat-button"
          onClick={() => setProfilePanel("blips")}
        >
          <strong>{profileBlipTotal}</strong>
          <span>blips</span>
        </button>
      </div>
      <div className="profile-actions">
        {isOwnerProfile ? (
          <>
            <BlipButton type="button" wide onClick={() => setEditing(true)}>
              Edit profile
            </BlipButton>
            <BlipButton type="button" wide onClick={() => setSharing((value) => !value)}>
              Share profile
            </BlipButton>
          </>
        ) : isFriendProfile ? (
          <Link
            href={messageThread ? `/messages/${messageThread.id}` : "/messages"}
            className="blip-link-button"
          >
            Send message
          </Link>
        ) : (
          <BlipButton
            type="button"
            wide
            disabled={requested}
            onClick={() => requestFriend(user.id)}
          >
            {requested ? "Request sent" : "Add friend"}
          </BlipButton>
        )}
      </div>
      {sharing ? (
        <div className="profile-share-menu post-popover">
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
          {shareMessage ? <p>{shareMessage}</p> : null}
        </div>
      ) : null}
      {profilePanel ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="profile-panel-modal">
            <button
              className="modal-close"
              type="button"
              onClick={() => setProfilePanel(null)}
              aria-label="Close profile details"
            >
              <X size={22} />
            </button>
            {profilePanel === "friends" ? (
              <>
                <div className="profile-panel-head">
                  <Users size={28} />
                  <div>
                    <h2>{isOwnerProfile ? "Your friends" : `${user.displayName}'s friends`}</h2>
                    <p>{user.stats.friends} friends</p>
                  </div>
                </div>
                <div className="profile-friend-list">
                  {profileFriends.length ? (
                    profileFriends.map((friend) => {
                      const canRemove =
                        friend.id !== currentUser.id && currentUser.friendIds.includes(friend.id);

                      return (
                        <div className="profile-friend-row" key={friend.id}>
                          <Link
                            href={`/profile/${friend.username}`}
                            onClick={() => setProfilePanel(null)}
                          >
                            <AvatarRing user={friend} size="sm" showInstant={false} />
                            <span>
                              <strong>{friend.displayName}</strong>
                              <small>@{friend.username}</small>
                            </span>
                          </Link>
                          {canRemove ? (
                            <button type="button" onClick={() => removeFriend(friend.id)}>
                              <UserMinus size={17} />
                              <span>Remove</span>
                            </button>
                          ) : null}
                        </div>
                      );
                    })
                  ) : (
                    <p className="profile-panel-empty">No friends to show yet.</p>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="profile-panel-head">
                  <Heart size={28} fill="currentColor" />
                  <div>
                    <h2>Blips</h2>
                    <p>{profileBlipTotal} total blips</p>
                  </div>
                </div>
                <div className="profile-blips-summary">
                  <strong>{profileBlipTotal}</strong>
                  <span>{isOwnerProfile ? "blips on your profile" : `blips for ${user.displayName}`}</span>
                </div>
                <div className="profile-blip-list">
                  {topBlipPosts.length ? (
                    topBlipPosts.map((post) => (
                      <div className="profile-blip-row" key={post.id}>
                        {post.imageUrl ? <img src={post.imageUrl} alt="" /> : <span>{post.type}</span>}
                        <div>
                          <strong>{post.content}</strong>
                          <small>{post.createdAt}</small>
                        </div>
                        <em>{post.blips}</em>
                      </div>
                    ))
                  ) : (
                    <p className="profile-panel-empty">No post blips to show yet.</p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
      {editing ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="edit-profile-modal">
            <button
              className="modal-close"
              type="button"
              onClick={() => setEditing(false)}
              aria-label="Close edit profile"
            >
              <X size={22} />
            </button>
            <h2>Edit profile</h2>
            <div className="edit-profile-preview">
              {form.bannerUrl ? (
                <img className="edit-profile-banner" src={form.bannerUrl} alt="" />
              ) : (
                <span className="edit-profile-banner edit-profile-banner-empty" />
              )}
              <div className="edit-profile-preview-main">
                <AvatarRing
                  user={{ ...user, avatarUrl: form.avatarUrl, avatarShape: form.avatarShape }}
                  size="lg"
                  showInstant={false}
                />
                <div>
                  <strong>{form.displayName || user.displayName}</strong>
                  <span>@{form.username || user.username}</span>
                  <p>{form.bio || user.bio}</p>
                </div>
              </div>
            </div>
            <div className="profile-upload-row">
              <label className="mini-action accept">
                <ImagePlus size={17} />
                <span>Profile pic</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => chooseImage(event.target.files?.[0], "avatarUrl")}
                />
              </label>
              <label className="mini-action">
                <ImagePlus size={17} />
                <span>Banner</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => chooseImage(event.target.files?.[0], "bannerUrl")}
                />
              </label>
            </div>
            <div className="avatar-shape-row">
              {(["circle", "rounded", "square"] as const).map((shape) => (
                <button
                  key={shape}
                  type="button"
                  className={form.avatarShape === shape ? "active" : ""}
                  onClick={() => setForm((values) => ({ ...values, avatarShape: shape }))}
                >
                  {shape}
                </button>
              ))}
            </div>
            <div className="edit-profile-fields">
              <label>
                <span>Username</span>
                <input
                  value={form.username}
                  onChange={(event) =>
                    setForm((values) => ({ ...values, username: event.target.value }))
                  }
                />
              </label>
              <label>
                <span>Name</span>
                <input
                  value={form.displayName}
                  onChange={(event) =>
                    setForm((values) => ({ ...values, displayName: event.target.value }))
                  }
                />
              </label>
              <label>
                <span>Bio</span>
                <textarea
                  value={form.bio}
                  onChange={(event) =>
                    setForm((values) => ({ ...values, bio: event.target.value }))
                  }
                />
              </label>
              <label>
                <span>Location</span>
                <input
                  value={form.location}
                  onChange={(event) =>
                    setForm((values) => ({ ...values, location: event.target.value }))
                  }
                />
              </label>
            </div>
            <BlipButton type="button" onClick={saveEdits} wide>
              Save profile
            </BlipButton>
          </div>
        </div>
      ) : null}
    </section>
  );
}
