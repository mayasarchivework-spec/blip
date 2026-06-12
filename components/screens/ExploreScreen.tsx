"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { AvatarRing } from "@/components/AvatarRing";
import { BlipButton } from "@/components/BlipButton";
import { PostGrid } from "@/components/PostGrid";
import { VerifiedName } from "@/components/VerifiedName";
import { useAppState } from "@/state/AppState";

const categories = ["For you", "People", "Posts", "Tags"];

type ExploreFilter = "recent" | "under50" | "under100" | "under1000";

const filterLabels: Record<ExploreFilter, string> = {
  recent: "posted in past 7 days",
  under50: "under 50 friends",
  under100: "under 100 friends",
  under1000: "under 1000 friends"
};

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isRecentPost(createdAt: string) {
  if (/m|h|Yesterday/i.test(createdAt)) {
    return true;
  }

  const dayMatch = createdAt.match(/^(\d+)d$/);
  return dayMatch ? Number(dayMatch[1]) <= 7 : true;
}

function hasTag(post: { caption?: string; content: string }, tag: string) {
  if (!tag) {
    return true;
  }

  const text = `${post.caption ?? ""} ${post.content}`.toLowerCase();
  return new RegExp(`(^|\\s)#${escapeRegExp(tag)}(\\b|$)`).test(text);
}

export function ExploreScreen() {
  const searchParams = useSearchParams();
  const {
    canInteractWith,
    currentUser,
    effectiveUser,
    getUserById,
    hasRequested,
    isGuest,
    isFriend,
    posts,
    requestFriend,
    users
  } = useAppState();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<ExploreFilter[]>([]);
  const activeTag = (searchParams.get("tag") ?? "").trim().replace(/^#+/, "").toLowerCase();

  const suggestedUsers = users.filter(
    (user) => user.id !== currentUser.id && !isFriend(user.id)
  );

  const publicPosts = posts.filter((post) => {
    const owner = getUserById(post.userId);
    if (!owner) {
      return false;
    }

    const effectiveOwner = effectiveUser(owner);
    const visible = effectiveOwner.allowExplore && (!effectiveOwner.isPrivate || isFriend(owner.id));
    if (!visible) {
      return false;
    }

    if (!hasTag(post, activeTag)) {
      return false;
    }

    if (activeFilters.includes("recent") && !isRecentPost(post.createdAt)) {
      return false;
    }

    if (activeFilters.includes("under50") && effectiveOwner.stats.friends >= 50) {
      return false;
    }

    if (activeFilters.includes("under100") && effectiveOwner.stats.friends >= 100) {
      return false;
    }

    if (activeFilters.includes("under1000") && effectiveOwner.stats.friends >= 1000) {
      return false;
    }

    return true;
  });

  function toggleFilter(filter: ExploreFilter) {
    setActiveFilters((filters) =>
      filters.includes(filter)
        ? filters.filter((item) => item !== filter)
        : [...filters, filter]
    );
  }

  return (
    <div className="screen">
      <AppHeader title="Explore" />
      <section className="explore-search">
        <div className="search-box">
          <Search size={24} />
          <input placeholder="Search usernames, posts, tags..." aria-label="Search" />
          <button
            type="button"
            className={filtersOpen || activeFilters.length ? "active" : ""}
            onClick={() => setFiltersOpen((value) => !value)}
            aria-label="Filter"
          >
            <SlidersHorizontal size={24} />
          </button>
        </div>
        {filtersOpen ? (
          <div className="explore-filter-panel">
            {(Object.keys(filterLabels) as ExploreFilter[]).map((filter) => (
              <button
                key={filter}
                type="button"
                className={activeFilters.includes(filter) ? "active" : ""}
                onClick={() => toggleFilter(filter)}
              >
                {filterLabels[filter]}
              </button>
            ))}
          </div>
        ) : null}
        <div className="category-pills">
          {categories.map((category, index) => (
            <button
              key={category}
              type="button"
              className={activeTag ? (category === "Tags" ? "active" : "") : index === 0 ? "active" : ""}
            >
              {category}
            </button>
          ))}
        </div>
        {activeTag ? (
          <div className="tag-filter-chip">
            <span>Showing #{activeTag}</span>
            <Link href="/explore">Clear</Link>
          </div>
        ) : null}
        <p className="privacy-notice">
          {isGuest
            ? "Browse public Blips. Sign up or sign in to add friends, blip, comment, or share."
            : "View public profiles and posts. Only friends can interact."}
        </p>
      </section>
      <section className="people-card">
        <div className="section-heading">
          <h2>People you might like</h2>
          <Link href="/explore">See all</Link>
        </div>
        <div className="people-scroll">
          {suggestedUsers.length ? (
            suggestedUsers.slice(0, 5).map((user) => {
              const requested = hasRequested(user.id);
              return (
                <div key={user.id} className="suggested-person">
                  <Link href={`/profile/${user.username}`}>
                    <AvatarRing user={user} size="lg" />
                    <strong>
                      <VerifiedName user={user} />
                    </strong>
                    <span>@{user.username}</span>
                  </Link>
                  <BlipButton
                    type="button"
                    disabled={isGuest || requested}
                    onClick={() => requestFriend(user.id)}
                  >
                    {isGuest ? "Sign in to add" : requested ? "Request sent" : "Add friend"}
                  </BlipButton>
                </div>
              );
            })
          ) : (
            <p className="panel-empty">No public profiles yet.</p>
          )}
        </div>
      </section>
      {publicPosts.length ? (
        <PostGrid
          posts={publicPosts}
          showOwner
          canInteract={(post) => canInteractWith(post.userId)}
        />
      ) : (
        <section className="empty-state">
          <h2>{activeTag ? `No posts tagged #${activeTag} yet.` : "No public posts yet."}</h2>
          <p>
            {activeTag
              ? "Try another tag or clear the filter."
              : "Explore will fill up as people share public Blips."}
          </p>
        </section>
      )}
    </div>
  );
}
