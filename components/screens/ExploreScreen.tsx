"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FileText, Grid2X2, Hash, Image, Search, SlidersHorizontal, Star, Users, Video, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { AvatarRing } from "@/components/AvatarRing";
import { BlipButton } from "@/components/BlipButton";
import { PostGrid } from "@/components/PostGrid";
import { VerifiedName } from "@/components/VerifiedName";
import type { Post, User } from "@/data/types";
import { useAppState } from "@/state/AppState";

type ExploreCategory = "For you" | "People" | "Posts" | "Tags";
type ExploreFilter =
  | "recent"
  | "photos"
  | "videos"
  | "text"
  | "under50"
  | "under100"
  | "under1000";

const categories: Array<{ label: ExploreCategory; icon: typeof Star }> = [
  { label: "For you", icon: Star },
  { label: "People", icon: Users },
  { label: "Posts", icon: Grid2X2 },
  { label: "Tags", icon: Hash }
];

const filterLabels: Record<ExploreFilter, string> = {
  recent: "posted in past 7 days",
  photos: "photos",
  videos: "videos",
  text: "text posts",
  under50: "under 50 friends",
  under100: "under 100 friends",
  under1000: "under 1000 friends"
};

const postTypeFilters: ExploreFilter[] = ["photos", "videos", "text"];
const socialFilters: ExploreFilter[] = ["under50", "under100", "under1000"];

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

function normalizeSearch(value: string) {
  return value.trim().replace(/^#+/, "").toLowerCase();
}

function postSearchText(post: Post, owner?: User) {
  return [
    post.content,
    post.caption,
    post.type,
    owner?.username,
    owner?.displayName,
    owner?.bio,
    getPostTags(post).join(" ")
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function userSearchText(user: User) {
  return [user.displayName, user.username, user.bio, user.profileLine, user.location]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function getPostTags(post: Post) {
  const text = `${post.caption ?? ""} ${post.content}`.toLowerCase();
  const hashTags = Array.from(text.matchAll(/#([a-z0-9_.]+)/g)).map((match) => match[1]);
  const fallbackTags = text
    .replace(/#[a-z0-9_.]+/g, "")
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length >= 4 && !["this", "that", "with", "from", "made", "post"].includes(word))
    .slice(0, 3);

  return Array.from(new Set([...hashTags, ...fallbackTags])).slice(0, 8);
}

function filterByPostType(post: Post, activeFilters: ExploreFilter[]) {
  const selectedTypes = postTypeFilters.filter((filter) => activeFilters.includes(filter));

  if (!selectedTypes.length) {
    return true;
  }

  return selectedTypes.some((filter) => {
    if (filter === "photos") {
      return post.type === "photo";
    }

    if (filter === "videos") {
      return post.type === "video";
    }

    return post.type === "text";
  });
}

export function ExploreScreen() {
  const searchParams = useSearchParams();
  const {
    canInteractWith,
    canViewUserPosts,
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
  const tagParam = normalizeSearch(searchParams.get("tag") ?? "");
  const [activeCategory, setActiveCategory] = useState<ExploreCategory>(
    tagParam ? "Tags" : "For you"
  );
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<ExploreFilter[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState(tagParam);
  const normalizedQuery = normalizeSearch(searchQuery);
  const tagSearch = searchQuery.trim().startsWith("#");
  const activeTag = selectedTag || (tagSearch ? normalizedQuery : "");

  useEffect(() => {
    if (tagParam) {
      setSelectedTag(tagParam);
      setActiveCategory("Tags");
    }
  }, [tagParam]);

  const publicPostPool = useMemo(
    () =>
      posts
        .map((post) => {
          const owner = getUserById(post.userId);
          return { post, owner };
        })
        .filter(({ post, owner }) => {
          if (post.isHidden) {
            return false;
          }

          if (!owner) {
            return false;
          }

          const effectiveOwner = effectiveUser(owner);
          return (
            effectiveOwner.allowExplore &&
            canViewUserPosts(owner.id)
          );
        }),
    [canViewUserPosts, effectiveUser, getUserById, posts]
  );

  const tagRows = useMemo(() => {
    const tagCounts = new Map<string, number>();

    for (const { post } of publicPostPool) {
      for (const tag of getPostTags(post)) {
        tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
      }
    }

    return [...tagCounts.entries()]
      .map(([tag, count]) => ({ tag, count }))
      .filter(({ tag }) => !normalizedQuery || tag.includes(normalizedQuery))
      .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
  }, [normalizedQuery, publicPostPool]);

  const showFullPeopleResults = activeCategory === "People" || Boolean(normalizedQuery);
  const visibleExploreUsers = users.filter((user) => {
    const effectiveUserProfile = effectiveUser(user);

    return (
      effectiveUserProfile.allowExplore &&
      canViewUserPosts(user.id)
    );
  });
  const suggestedUsers = visibleExploreUsers
    .filter((user) => showFullPeopleResults || (user.id !== currentUser.id && !isFriend(user.id)))
    .filter((user) => !normalizedQuery || userSearchText(user).includes(normalizedQuery));

  const publicPosts = publicPostPool
    .filter(({ post, owner }) => {
      if (!owner) {
        return false;
      }

      const effectiveOwner = effectiveUser(owner);

      if (activeTag && !hasTag(post, activeTag) && !getPostTags(post).includes(activeTag)) {
        return false;
      }

      if (!activeTag && normalizedQuery && !postSearchText(post, owner).includes(normalizedQuery)) {
        return false;
      }

      if (activeFilters.includes("recent") && !isRecentPost(post.createdAt)) {
        return false;
      }

      if (!filterByPostType(post, activeFilters)) {
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
    })
    .map(({ post }) => post);

  const shouldShowPeople =
    activeCategory === "For you" || activeCategory === "People" || (Boolean(normalizedQuery) && !tagSearch);
  const shouldShowPosts =
    activeCategory === "For you" ||
    activeCategory === "Posts" ||
    activeCategory === "Tags" ||
    Boolean(normalizedQuery);
  const shouldShowTags = activeCategory === "Tags" || activeCategory === "For you" || tagSearch;

  function toggleFilter(filter: ExploreFilter) {
    setActiveFilters((filters) =>
      filters.includes(filter)
        ? filters.filter((item) => item !== filter)
        : [...filters, filter]
    );
  }

  function chooseCategory(category: ExploreCategory) {
    setActiveCategory(category);
    if (category !== "Tags") {
      setSelectedTag("");
    }
  }

  function clearExploreSearch() {
    setSearchQuery("");
    setSelectedTag("");
    setActiveFilters([]);
  }

  return (
    <div className="screen">
      <AppHeader title="Explore" />
      <section className="explore-search">
        <div className="search-box">
          <Search size={24} />
          <input
            value={searchQuery}
            placeholder="Search usernames, posts, tags..."
            aria-label="Search"
            onChange={(event) => setSearchQuery(event.target.value)}
          />
          {searchQuery || selectedTag ? (
            <button
              type="button"
              className="search-clear-button"
              onClick={clearExploreSearch}
              aria-label="Clear search"
            >
              <X size={18} />
            </button>
          ) : null}
          <button
            type="button"
            className={`filter-toggle-button ${filtersOpen || activeFilters.length ? "active" : ""}`}
            onClick={() => setFiltersOpen((value) => !value)}
            aria-label="Filter"
          >
            <SlidersHorizontal size={24} />
          </button>
        </div>
        {filtersOpen ? (
          <div className="explore-filter-panel">
            <div>
              <strong>Post type</strong>
              <span>Show one or mix them.</span>
            </div>
            {[["photos", Image], ["videos", Video], ["text", FileText]].map(([filter, Icon]) => (
              <button
                key={filter as string}
                type="button"
                className={activeFilters.includes(filter as ExploreFilter) ? "active" : ""}
                onClick={() => toggleFilter(filter as ExploreFilter)}
              >
                <Icon size={16} />
                {filterLabels[filter as ExploreFilter]}
              </button>
            ))}
            <div>
              <strong>Discovery</strong>
              <span>Optional filters for public profiles.</span>
            </div>
            {(["recent", ...socialFilters] as ExploreFilter[]).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  className={activeFilters.includes(filter) ? "active" : ""}
                  onClick={() => toggleFilter(filter)}
                >
                  {filterLabels[filter]}
                </button>
              ))}
            {activeFilters.length ? (
              <button type="button" className="ghost-filter" onClick={() => setActiveFilters([])}>
                Clear filters
              </button>
            ) : null}
          </div>
        ) : null}
        <div className="category-pills">
          {categories.map(({ label, icon: Icon }) => (
            <button
              key={label}
              type="button"
              className={activeCategory === label ? "active" : ""}
              onClick={() => chooseCategory(label)}
            >
              <Icon size={17} />
              <span>{label}</span>
            </button>
          ))}
        </div>
        {activeTag ? (
          <div className="tag-filter-chip">
            <span>Showing #{activeTag}</span>
            <button type="button" onClick={() => setSelectedTag("")}>
              Clear
            </button>
          </div>
        ) : null}
        <p className="privacy-notice">
          {isGuest
            ? "Browse public Blips. Sign up or sign in to add friends, blip, comment, or share."
            : "View public profiles and posts. Interaction follows each account's comment settings."}
        </p>
      </section>
      {shouldShowPeople ? (
        <section className="people-card">
          <div className="section-heading">
            <h2>{activeCategory === "People" ? "People" : "People you might like"}</h2>
            {activeCategory !== "People" ? (
              <button type="button" onClick={() => setActiveCategory("People")}>
                See all
              </button>
            ) : null}
          </div>
          <div className={activeCategory === "People" ? "people-grid" : "people-scroll"}>
            {suggestedUsers.length ? (
              suggestedUsers.slice(0, activeCategory === "People" ? 24 : 6).map((user) => {
                const ownProfile = user.id === currentUser.id;
                const friend = isFriend(user.id);
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
                      disabled={ownProfile || isGuest || friend || requested}
                      onClick={() => requestFriend(user.id)}
                    >
                      {ownProfile
                        ? "Your profile"
                        : isGuest
                          ? "Sign in to add"
                          : friend
                            ? "Friends"
                            : requested
                              ? "Request sent"
                              : "Add friend"}
                    </BlipButton>
                  </div>
                );
              })
            ) : (
              <p className="panel-empty">
                {normalizedQuery
                  ? "No profiles match that search yet."
                  : "No public profiles yet. When people join Blip, they will show here."}
              </p>
            )}
          </div>
        </section>
      ) : null}
      {shouldShowTags ? (
        <section className="people-card tag-browser-card">
          <div className="section-heading">
            <h2>Tags</h2>
            {selectedTag ? (
              <button type="button" onClick={() => setSelectedTag("")}>
                Clear tag
              </button>
            ) : null}
          </div>
          {tagRows.length ? (
            <div className="tag-cloud">
              {tagRows.slice(0, activeCategory === "Tags" ? 40 : 12).map(({ tag, count }) => (
                <button
                  type="button"
                  key={tag}
                  className={selectedTag === tag ? "active" : ""}
                  onClick={() => {
                    setSelectedTag(tag);
                    setActiveCategory("Tags");
                  }}
                >
                  <Hash size={15} />
                  <span>{tag}</span>
                  <small>{count}</small>
                </button>
              ))}
            </div>
          ) : (
            <p className="panel-empty">
              {normalizedQuery ? "No matching tags yet." : "Tags will appear as posts use hashtags or captions."}
            </p>
          )}
        </section>
      ) : null}
      {shouldShowPosts && publicPosts.length ? (
        <PostGrid
          posts={publicPosts}
          showOwner
          canInteract={(post) => canInteractWith(post.userId)}
        />
      ) : shouldShowPosts ? (
        <section className="empty-state">
          <h2>
            {activeTag
              ? `No posts tagged #${activeTag} yet.`
              : normalizedQuery
                ? "No posts match that search."
                : activeFilters.length
                  ? "No posts match those filters."
                  : "No public posts yet."}
          </h2>
          <p>
            {activeTag || normalizedQuery || activeFilters.length
              ? "Try another tag or clear the filter."
              : "Explore will fill up as people share public Blips."}
          </p>
          {activeTag || normalizedQuery || activeFilters.length ? (
            <BlipButton type="button" variant="secondary" onClick={clearExploreSearch}>
              Clear Explore
            </BlipButton>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
