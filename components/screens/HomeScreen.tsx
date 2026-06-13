"use client";

import Link from "next/link";
import { Bell, Image, MessageCircle, UserPlus } from "lucide-react";
import { useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { AuthPanel } from "@/components/AuthPanel";
import { BlipReactionIcon } from "@/components/BlipReactionIcon";
import { InstantRow } from "@/components/InstantRow";
import { PostCard } from "@/components/PostCard";
import { useAppState } from "@/state/AppState";

export function HomeScreen() {
  const { currentUser, getFriends, getUserById, isGuest, posts } = useAppState();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const friends = getFriends();
  const friendPosts = posts
    .filter((post) => currentUser.friendIds.includes(post.userId) && !post.isHidden)
    .slice()
    .sort((a, b) => Number(b.isPinned) - Number(a.isPinned));
  const ownPosts = posts.filter((post) => post.userId === currentUser.id && !post.isHidden);
  const request = currentUser.friendRequestsReceived.find(
    (item) => item.status !== "ignored"
  );
  const requestUser = request ? getUserById(request.fromUserId) : undefined;
  const latestFriendPost = friendPosts[0];
  const latestFriendPostUser = latestFriendPost
    ? getUserById(latestFriendPost.userId)
    : undefined;
  const blippedPost = ownPosts.find((post) => post.blips > 0);
  const commentedPost = ownPosts.find((post) => post.comments > 0);

  function cleanText(value: string | undefined, fallback: string) {
    const text = value?.replace(/\s+/g, " ").trim();
    return text && text.toLowerCase() !== "null" ? text : fallback;
  }

  function profileHref(username: string | undefined, postId?: string) {
    if (!username) {
      return "/explore";
    }

    return postId ? `/profile/${username}?post=${postId}` : `/profile/${username}`;
  }

  function plural(value: number, label: string) {
    return `${value} ${label}${value === 1 ? "" : "s"}`;
  }

  const notifications = [
    ...(blippedPost
      ? [
          {
            id: `blip-${blippedPost.id}`,
            icon: <BlipReactionIcon active size={19} />,
            href: profileHref(currentUser.username, blippedPost.id),
            title: `${plural(blippedPost.blips, "blip")} on your ${cleanText(
              blippedPost.content,
              "post"
            )}`,
            time: blippedPost.createdAt
          }
        ]
      : []),
    ...(commentedPost
      ? [
          {
            id: `comment-${commentedPost.id}`,
            icon: <MessageCircle size={18} />,
            href: profileHref(currentUser.username, commentedPost.id),
            title: `${plural(commentedPost.comments, "comment")} on your ${cleanText(
              commentedPost.content,
              "post"
            )}`,
            time: commentedPost.createdAt
          }
        ]
      : []),
    ...(request && requestUser
      ? [
          {
            id: `request-${request.id}`,
            icon: <UserPlus size={18} />,
            href: "/messages",
            title: `${requestUser.displayName} sent you a friend request`,
            time: request.createdAt
          }
        ]
      : []),
    ...(latestFriendPost && latestFriendPostUser
      ? [
          {
            id: `post-${latestFriendPost.id}`,
            icon: <Image size={18} />,
            href: profileHref(latestFriendPostUser.username, latestFriendPost.id),
            title: `${latestFriendPostUser.displayName} posted ${cleanText(
              latestFriendPost.content,
              "a new Blip"
            )}`,
            time: latestFriendPost.createdAt
          }
        ]
      : [])
  ];

  if (isGuest) {
    return (
      <div className="screen">
        <AppHeader title="Home" brand />
        <AuthPanel />
        <section className="empty-state">
          <h2>Your Home feed is waiting.</h2>
          <p>Sign up to add friends and see their posts here. You can browse Explore first.</p>
        </section>
      </div>
    );
  }

  return (
    <div className="screen">
      <AppHeader
        title="Home"
        brand
        actions={
          <div className="notification-wrap">
            <button
              className="header-tool"
              type="button"
              onClick={() => setNotificationsOpen((value) => !value)}
              aria-label="Notifications"
            >
              <Bell size={23} />
            </button>
            {notificationsOpen ? (
              <div className="notification-menu post-popover">
                <div className="notification-menu-head">
                  <strong>Notifications</strong>
                  <span>{notifications.length}</span>
                </div>
                {notifications.map((notification) => (
                  <Link
                    className="notification-item"
                    href={notification.href}
                    key={notification.id}
                    onClick={() => setNotificationsOpen(false)}
                  >
                    <span className="notification-icon">{notification.icon}</span>
                    <span>
                      <b>{notification.title}</b>
                      <small>{notification.time}</small>
                    </span>
                  </Link>
                ))}
                {!notifications.length ? (
                  <p className="notification-empty">No notifications yet.</p>
                ) : null}
              </div>
            ) : null}
          </div>
        }
      />
      <InstantRow users={friends.slice(0, 6)} includeCurrent />
      <section className="feed-stack">
        {friendPosts.length ? (
          friendPosts.map((post) => <PostCard key={post.id} post={post} canInteract />)
        ) : (
          <section className="empty-state">
            <h2>No friend posts yet.</h2>
            <p>Add friends or create your first Blip.</p>
          </section>
        )}
      </section>
    </div>
  );
}
