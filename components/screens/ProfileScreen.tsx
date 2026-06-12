"use client";

import { Lock } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { AuthPanel } from "@/components/AuthPanel";
import { CreatePostPanel } from "@/components/CreatePostPanel";
import { PostGrid } from "@/components/PostGrid";
import { ProfileHeader } from "@/components/ProfileHeader";
import { useAppState } from "@/state/AppState";

export function ProfileScreen({ username }: { username: string }) {
  const {
    canInteractWith,
    effectiveUser,
    getUserByUsername,
    authSession,
    currentUser,
    isFriend,
    isOwner,
    posts
  } = useAppState();
  const user = getUserByUsername(username);

  if (!user) {
    return (
      <div className="screen">
        <AppHeader title="Profile" brand />
        <section className="empty-state">This profile could not be found.</section>
      </div>
    );
  }

  const effectiveProfile = effectiveUser(user);
  const ownerProfile = isOwner(user.id);
  const friendProfile = isFriend(user.id);
  const hiddenPrivate = effectiveProfile.isPrivate && !ownerProfile && !friendProfile;
  const baseUserPosts = posts.filter((post) => post.userId === user.id);
  const pinnedPhotoIds = new Set(
    baseUserPosts
      .filter((post) => post.isPinned && post.type === "photo")
      .slice(0, 3)
      .map((post) => post.id)
  );
  const userPosts = ownerProfile
    ? [
        ...baseUserPosts.filter((post) => pinnedPhotoIds.has(post.id)),
        ...baseUserPosts.filter((post) => !pinnedPhotoIds.has(post.id))
      ]
    : baseUserPosts;

  if (!authSession && username === currentUser.username) {
    return (
      <div className="screen">
        <AppHeader title="Profile" brand />
        <AuthPanel />
      </div>
    );
  }

  return (
    <div className="screen">
      <AppHeader title="Profile" brand />
      <ProfileHeader
        user={effectiveProfile}
        isOwnerProfile={ownerProfile}
        isFriendProfile={friendProfile}
      />
      {ownerProfile ? <CreatePostPanel /> : null}
      {hiddenPrivate ? (
        <section className="private-card">
          <Lock size={42} />
          <h2>This account is private.</h2>
          <p>Become friends to see their posts.</p>
        </section>
      ) : (
        userPosts.length ? (
          <PostGrid
            posts={userPosts}
            canInteract={(post) => canInteractWith(post.userId)}
            showPinnedLabels={ownerProfile}
          />
        ) : (
          <section className="empty-state">
            <h2>No posts yet.</h2>
            <p>This profile is ready for its first Blip.</p>
          </section>
        )
      )}
    </div>
  );
}
