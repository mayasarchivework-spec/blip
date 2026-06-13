"use client";

import { EyeOff, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AppHeader } from "@/components/AppHeader";
import { AuthPanel } from "@/components/AuthPanel";
import { CreatePostPanel } from "@/components/CreatePostPanel";
import { PostGrid } from "@/components/PostGrid";
import { ProfileHeader } from "@/components/ProfileHeader";
import { useAppState } from "@/state/AppState";

export function ProfileScreen({ username }: { username: string }) {
  const router = useRouter();
  const {
    canInteractWith,
    canViewUserPosts,
    effectiveUser,
    getUserByUsername,
    authSession,
    currentUser,
    isFriend,
    isOwner,
    posts
  } = useAppState();
  const user = getUserByUsername(username);
  const ownProfileRedirect =
    !user &&
    authSession &&
    currentUser.username !== "guest" &&
    username !== currentUser.username
      ? `/profile/${currentUser.username}`
      : null;

  useEffect(() => {
    if (ownProfileRedirect) {
      router.replace(ownProfileRedirect);
    }
  }, [ownProfileRedirect, router]);

  if (!user) {
    if (ownProfileRedirect) {
      return (
        <div className="screen">
          <AppHeader title="Profile" brand />
          <section className="empty-state">Opening your profile...</section>
        </div>
      );
    }

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
  const canViewPosts = canViewUserPosts(user.id);
  const hiddenPrivate = !canViewPosts;
  const baseUserPosts = posts.filter((post) => post.userId === user.id);
  const visibleBaseUserPosts = baseUserPosts.filter((post) => !post.isHidden);
  const hiddenUserPosts = ownerProfile
    ? baseUserPosts
        .filter((post) => post.isHidden)
        .slice()
        .sort((a, b) => Number(b.isPinned) - Number(a.isPinned))
    : [];
  const pinnedPhotoIds = new Set(
    visibleBaseUserPosts
      .filter((post) => post.isPinned && post.type === "photo")
      .slice(0, 3)
      .map((post) => post.id)
  );
  const userPosts = ownerProfile
    ? [
        ...visibleBaseUserPosts.filter((post) => pinnedPhotoIds.has(post.id)),
        ...visibleBaseUserPosts.filter((post) => !pinnedPhotoIds.has(post.id))
      ]
    : visibleBaseUserPosts;

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
        <>
          {userPosts.length ? (
            <PostGrid
              posts={userPosts}
              canInteract={(post) => canInteractWith(post.userId)}
              showPinnedLabels={ownerProfile}
            />
          ) : hiddenUserPosts.length ? null : (
            <section className="empty-state">
              <h2>No posts yet.</h2>
              <p>This profile is ready for its first Blip.</p>
            </section>
          )}
          {ownerProfile && hiddenUserPosts.length ? (
            <section className="hidden-posts-panel">
              <div className="hidden-posts-head">
                <EyeOff size={22} />
                <div>
                  <h2>Hidden posts</h2>
                  <p>Open a post and use the menu to unhide it.</p>
                </div>
              </div>
              <PostGrid
                posts={hiddenUserPosts}
                canInteract={(post) => canInteractWith(post.userId)}
                showPinnedLabels
                showHiddenLabels
              />
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}
