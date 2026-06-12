"use client";

import { Bell, Flag, Image, MessageCircle, Share2, UserPlus, Users } from "lucide-react";
import { useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { BlipReactionIcon } from "@/components/BlipReactionIcon";
import { InstantRow } from "@/components/InstantRow";
import { PostCard } from "@/components/PostCard";
import { useAppState } from "@/state/AppState";

export function HomeScreen() {
  const { currentUser, getFriends, getUserById, posts, users } = useAppState();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const friends = getFriends();
  const friendPosts = posts
    .filter((post) => currentUser.friendIds.includes(post.userId))
    .slice()
    .sort((a, b) => Number(b.isPinned) - Number(a.isPinned));
  const ownPosts = posts.filter((post) => post.userId === currentUser.id);
  const request = currentUser.friendRequestsReceived.find(
    (item) => item.status !== "ignored"
  );
  const requestUser = request ? getUserById(request.fromUserId) : undefined;
  const suggestion =
    users.find(
      (user) =>
        user.id !== currentUser.id &&
        !currentUser.friendIds.includes(user.id) &&
        !currentUser.friendRequestsSent.some((item) => item.toUserId === user.id)
    ) ?? friends[0];
  const latestFriendPost = friendPosts[0];
  const latestFriendPostUser = latestFriendPost
    ? getUserById(latestFriendPost.userId)
    : friends[0];

  function cleanText(value: string | undefined, fallback: string) {
    const text = value?.replace(/\s+/g, " ").trim();
    return text && text.toLowerCase() !== "null" ? text : fallback;
  }

  const notifications = [
    {
      id: "blip",
      icon: <BlipReactionIcon active size={19} />,
      title: `${friends[0]?.displayName ?? "Someone"} blipped your ${cleanText(
        ownPosts[0]?.content,
        "post"
      )}`,
      time: "just now"
    },
    {
      id: "comment",
      icon: <MessageCircle size={18} />,
      title: `${friends[1]?.displayName ?? "A friend"} commented on your ${cleanText(
        ownPosts[1]?.content,
        "post"
      )}`,
      time: "4m"
    },
    {
      id: "share",
      icon: <Share2 size={18} />,
      title: `${friends[2]?.displayName ?? "A friend"} shared your ${cleanText(
        ownPosts[2]?.content,
        "post"
      )}`,
      time: "12m"
    },
    {
      id: "report",
      icon: <Flag size={18} />,
      title: "A report was sent for review",
      time: "18m"
    },
    {
      id: "suggestion",
      icon: <Users size={18} />,
      title: `New friend suggestion: ${suggestion?.displayName ?? "maya"}`,
      time: "today"
    },
    {
      id: "request",
      icon: <UserPlus size={18} />,
      title: `${requestUser?.displayName ?? "Someone"} sent you a friend request`,
      time: request ? request.createdAt : "today"
    },
    {
      id: "post",
      icon: <Image size={18} />,
      title: `${latestFriendPostUser?.displayName ?? "A friend"} posted ${cleanText(
        latestFriendPost?.content,
        "a new Blip"
      )}`,
      time: latestFriendPost?.createdAt ?? "today"
    }
  ];

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
                  <div className="notification-item" key={notification.id}>
                    <span className="notification-icon">{notification.icon}</span>
                    <span>
                      <b>{notification.title}</b>
                      <small>{notification.time}</small>
                    </span>
                  </div>
                ))}
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
