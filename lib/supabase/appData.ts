import { currentUserId } from "@/data/mockUsers";
import type {
  ChatMessage,
  FriendRequest,
  Instant,
  MessageThread,
  Post,
  PostComment,
  User
} from "@/data/types";
import type {
  CommentRow,
  FriendRequestRow,
  FriendshipRow,
  InstantRow,
  JsonValue,
  MessageRow,
  MessageThreadRow,
  PostRow,
  ProfileRow,
  ThreadMemberRow
} from "@/lib/supabase/types";
import {
  clearExpiredProfileNotes,
  fetchFriendRequests,
  fetchFriendships,
  fetchInstants,
  fetchMessages,
  fetchMessageThreads,
  fetchPosts,
  fetchProfiles,
  fetchThreadMembers
} from "@/lib/supabase/queries";
import { getConfiguredAccountRole } from "@/lib/supabase/config";

export interface SupabaseSnapshot {
  profiles: ProfileRow[];
  posts: PostRow[];
  friendRequests: FriendRequestRow[];
  friendships: FriendshipRow[];
  instants: InstantRow[];
  threads: MessageThreadRow[];
  threadMembers: ThreadMemberRow[];
  messages: MessageRow[];
}

export interface AppDataset {
  users: User[];
  posts: Post[];
  instants: Instant[];
  threads: MessageThread[];
  currentUserId: string;
  source: "mock" | "supabase";
}

export async function loadSupabaseSnapshot(
  accessToken?: string | null
): Promise<SupabaseSnapshot> {
  await clearExpiredProfileNotes(accessToken).catch(() => undefined);

  const [
    profiles,
    posts,
    friendRequests,
    friendships,
    instants,
    threads,
    threadMembers,
    messages
  ] = await Promise.all([
    fetchProfiles(accessToken),
    fetchPosts(accessToken),
    fetchFriendRequests(accessToken).catch(() => []),
    fetchFriendships(accessToken).catch(() => []),
    fetchInstants(accessToken).catch(() => []),
    fetchMessageThreads(accessToken).catch(() => []),
    fetchThreadMembers(accessToken).catch(() => []),
    fetchMessages(accessToken).catch(() => [])
  ]);

  return {
    profiles,
    posts,
    friendRequests,
    friendships,
    instants,
    threads,
    threadMembers,
    messages
  };
}

function activeNote(note: string | null | undefined, expiresAt: string | null | undefined) {
  if (!note || !expiresAt) {
    return undefined;
  }

  const expiresTime = Date.parse(expiresAt);
  return Number.isFinite(expiresTime) && expiresTime > Date.now() ? note : undefined;
}

export function buildAppDataset(
  snapshot: SupabaseSnapshot | null,
  preferredCurrentUserId?: string | null
): AppDataset {
  if (!snapshot) {
    return {
      users: [],
      posts: [],
      instants: [],
      threads: [],
      currentUserId,
      source: "supabase"
    };
  }

  const validProfiles = snapshot.profiles.filter(isRenderableProfileRow);

  if (validProfiles.length === 0) {
    return {
      users: [],
      posts: [],
      instants: [],
      threads: [],
      currentUserId,
      source: "supabase"
    };
  }

  const remoteUsers = validProfiles.map((profile) => {
    const username = cleanProfileText(profile.username, "blip");
    const displayName = cleanProfileText(profile.display_name, username);

    return {
      id: profile.id,
      username,
      displayName,
      accountRole:
        profile.account_role && profile.account_role !== "user"
          ? profile.account_role
          : getConfiguredAccountRole(undefined, username),
      bio: cleanProfileText(profile.bio, ""),
      avatarUrl: profile.avatar_url ?? "/assets/avatar-racer.svg",
      bannerUrl: profile.banner_url ?? undefined,
      accentColor: profile.accent_color,
      isPrivate: profile.is_private,
      allowExplore: profile.allow_explore,
      viewAudience: profile.view_audience ?? "friends",
      commentAudience: profile.comment_audience ?? "friends",
      friendIds: [],
      friendRequestsReceived: [],
      friendRequestsSent: [],
      stats: { posts: 0, friends: 0, blips: 0 },
      note: activeNote(profile.note, profile.note_expires_at),
      noteExpiresAt: activeNote(profile.note, profile.note_expires_at)
        ? profile.note_expires_at ?? undefined
        : undefined,
      profileLine: cleanProfileText(profile.profile_line, "") || undefined
    } satisfies User;
  });

  const users = remoteUsers;
  const validUserIds = new Set(users.map((user) => user.id));

  for (const friendship of snapshot.friendships) {
    addFriendship(users, friendship.user_low, friendship.user_high);
  }

  for (const request of snapshot.friendRequests) {
    addFriendRequest(users, {
      id: request.id,
      fromUserId: request.from_user_id,
      toUserId: request.to_user_id,
      createdAt: relativeTime(request.created_at),
      status: request.status
    });
  }

  const posts = snapshot.posts
    .filter((post) => validUserIds.has(post.user_id))
    .filter(isRenderablePostRow)
    .map(mapPostRow);

  const postStats = getPostStats(posts);
  const usersWithStats = users.map((user) => {
    const stats = postStats.get(user.id);
    return {
      ...user,
      stats: {
        posts: stats?.posts ?? user.stats.posts,
        friends: Math.max(user.friendIds.length, user.stats.friends),
        blips: stats?.blips ?? user.stats.blips
      }
    };
  });

  const instants = snapshot.instants.map(mapInstantRow);

  const threads =
    snapshot.threads.length > 0
      ? mapThreads(snapshot.threads, snapshot.threadMembers, snapshot.messages)
      : [];

  return {
    users: usersWithStats,
    posts,
    instants,
    threads,
    currentUserId:
      (preferredCurrentUserId &&
      usersWithStats.some((user) => user.id === preferredCurrentUserId)
        ? preferredCurrentUserId
        : currentUserId),
    source: "supabase"
  };
}

function cleanProfileText(value: string | null | undefined, fallback: string) {
  const text = normalizedText(value);
  return text && text.toLowerCase() !== "null" ? text : fallback;
}

function isRenderableProfileRow(row: ProfileRow) {
  return hasMeaningfulText(row.id) && hasMeaningfulText(row.username);
}

export function mapCommentRow(row: CommentRow): PostComment {
  return {
    id: row.id,
    postId: row.post_id,
    userId: row.user_id,
    body: row.body,
    createdAt: relativeTime(row.created_at),
    authorName: row.profiles?.display_name,
    authorAvatarUrl: row.profiles?.avatar_url ?? undefined
  };
}

function addFriendship(users: User[], leftUserId: string, rightUserId: string) {
  const left = users.find((user) => user.id === leftUserId);
  const right = users.find((user) => user.id === rightUserId);

  if (left && !left.friendIds.includes(rightUserId)) {
    left.friendIds = [...left.friendIds, rightUserId];
  }
  if (right && !right.friendIds.includes(leftUserId)) {
    right.friendIds = [...right.friendIds, leftUserId];
  }
}

function addFriendRequest(users: User[], request: FriendRequest) {
  if (request.status !== "pending") {
    return;
  }

  const from = users.find((user) => user.id === request.fromUserId);
  const to = users.find((user) => user.id === request.toUserId);

  if (from && !from.friendRequestsSent.some((item) => item.id === request.id)) {
    from.friendRequestsSent = [...from.friendRequestsSent, request];
  }
  if (to && !to.friendRequestsReceived.some((item) => item.id === request.id)) {
    to.friendRequestsReceived = [...to.friendRequestsReceived, request];
  }
}

function mapPostRow(row: PostRow): Post {
  const imageUrls = normalizedImageUrls(row.image_urls, row.image_url);
  const content = cleanProfileText(row.content, row.type);
  const caption = cleanProfileText(row.caption, "");

  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    content,
    imageUrl: imageUrls[0] ?? row.image_url ?? undefined,
    imageUrls: imageUrls.length > 1 ? imageUrls : undefined,
    videoUrl: row.video_url ?? undefined,
    songTitle: row.song_title ?? undefined,
    artistName: row.artist_name ?? undefined,
    albumArtUrl: row.album_art_url ?? undefined,
    caption: caption || undefined,
    blips: row.blips_count ?? 0,
    comments: row.comments_count ?? 0,
    isPinned: row.is_pinned,
    visibility: row.visibility,
    createdAt: relativeTime(row.created_at),
    aspectRatio: row.aspect_ratio ?? undefined
  };
}

function normalizedText(value: string | null | undefined) {
  return value?.trim() ?? "";
}

function hasMeaningfulText(value: string | null | undefined) {
  const text = normalizedText(value);
  return text.length > 0 && text.toLowerCase() !== "null";
}

function isRenderablePostRow(row: PostRow) {
  if (row.type === "text") {
    return hasMeaningfulText(row.content);
  }

  if (row.type === "photo") {
    return hasMeaningfulText(row.image_url) || normalizedImageUrls(row.image_urls).length > 0;
  }

  if (row.type === "video") {
    return (
      hasMeaningfulText(row.video_url) ||
      hasMeaningfulText(row.image_url) ||
      normalizedImageUrls(row.image_urls).length > 0
    );
  }

  if (row.type === "song") {
    return (
      hasMeaningfulText(row.song_title) ||
      hasMeaningfulText(row.album_art_url) ||
      hasMeaningfulText(row.content)
    );
  }

  return false;
}

function normalizedImageUrls(imageUrls?: string[] | null, fallback?: string | null) {
  const values = Array.isArray(imageUrls) ? imageUrls : [];
  const cleanValues = values
    .concat(fallback ? [fallback] : [])
    .map((value) => normalizedText(value))
    .filter(hasMeaningfulText);

  return Array.from(new Set(cleanValues)).slice(0, 20);
}

function mapInstantRow(row: InstantRow): Instant {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    content: row.content,
    thumbnailUrl: row.thumbnail_url ?? undefined,
    expiresAt: row.expires_at
  };
}

function mapThreads(
  threadRows: MessageThreadRow[],
  memberRows: ThreadMemberRow[],
  messageRows: MessageRow[]
): MessageThread[] {
  return threadRows.map((thread) => {
    const participantIds = memberRows
      .filter((member) => member.thread_id === thread.id)
      .map((member) => member.user_id);
    const messages = messageRows
      .filter((message) => message.thread_id === thread.id)
      .map(mapMessageRow);
    const lastMessage = messages[messages.length - 1];

    return {
      id: thread.id,
      participantIds,
      lastMessage: lastMessage?.content ?? thread.title ?? "new conversation",
      timestamp: relativeTime(lastMessage?.createdAt ?? thread.updated_at),
      unreadCount: 0,
      messages
    };
  });
}

function mapMessageRow(row: MessageRow): ChatMessage {
  const metadata = objectMetadata(row.metadata);

  return {
    id: row.id,
    senderId: row.sender_id,
    type: row.type,
    content: row.body,
    imageUrl: row.media_url ?? stringValue(metadata.imageUrl),
    songTitle: stringValue(metadata.songTitle),
    artistName: stringValue(metadata.artistName),
    albumArtUrl: stringValue(metadata.albumArtUrl),
    createdAt: relativeTime(row.created_at),
    status: row.sender_id ? "read" : undefined
  };
}

function objectMetadata(value: JsonValue): Record<string, JsonValue> {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function stringValue(value: JsonValue | undefined) {
  return typeof value === "string" ? value : undefined;
}

function getPostStats(posts: Post[]) {
  const stats = new Map<string, { posts: number; blips: number }>();
  for (const post of posts) {
    const current = stats.get(post.userId) ?? { posts: 0, blips: 0 };
    stats.set(post.userId, {
      posts: current.posts + 1,
      blips: current.blips + post.blips
    });
  }
  return stats;
}

function relativeTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const seconds = Math.max(0, Math.round((Date.now() - date.getTime()) / 1000));
  if (seconds < 60) {
    return "now";
  }

  const minutes = Math.round(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = Math.round(minutes / 60);
  if (hours < 24) {
    return `${hours}h`;
  }

  const days = Math.round(hours / 24);
  if (days === 1) {
    return "Yesterday";
  }
  if (days < 7) {
    return `${days}d`;
  }

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric"
  });
}
