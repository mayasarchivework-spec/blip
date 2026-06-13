import type {
  CommentRow,
  FriendRequestRow,
  FriendshipRow,
  InstantRow,
  MessageRow,
  MessageThreadRow,
  PostRow,
  ProfileRow,
  ThreadMemberRow
} from "@/lib/supabase/types";
import { supabaseFetch } from "@/lib/supabase/rest";

type ProfileUpdate = Partial<
  Pick<
    ProfileRow,
    | "accent_color"
    | "allow_explore"
    | "avatar_url"
    | "banner_url"
    | "bio"
    | "display_name"
    | "is_private"
    | "note"
    | "note_expires_at"
    | "profile_line"
    | "username"
    | "view_audience"
    | "comment_audience"
  >
>;

type ProfileInsert = Pick<
  ProfileRow,
  | "id"
  | "username"
  | "display_name"
  | "bio"
  | "avatar_url"
  | "accent_color"
  | "is_private"
  | "allow_explore"
  | "profile_line"
> &
  Partial<Pick<ProfileRow, "account_role" | "view_audience" | "comment_audience">>;

type PostInsert = Pick<
  PostRow,
  | "user_id"
  | "type"
  | "content"
  | "image_url"
  | "image_urls"
  | "video_url"
  | "caption"
  | "aspect_ratio"
  | "is_pinned"
  | "visibility"
>;

type PostUpdate = Partial<
  Pick<
    PostRow,
    "caption" | "content" | "image_url" | "image_urls" | "is_pinned" | "visibility"
  >
>;

type InstantInsert = Pick<
  InstantRow,
  "user_id" | "type" | "content" | "thumbnail_url" | "expires_at"
>;

export function fetchProfiles(accessToken?: string | null) {
  return supabaseFetch<ProfileRow[]>("profiles", {
    accessToken,
    query: {
      select: "*",
      order: "username.asc"
    }
  });
}

export function clearExpiredProfileNotes(accessToken?: string | null) {
  return supabaseFetch<null>("rpc/clear_expired_profile_notes", {
    accessToken,
    method: "POST",
    prefer: "return=minimal",
    body: {}
  });
}

export function fetchPosts(accessToken?: string | null) {
  return supabaseFetch<PostRow[]>("posts", {
    accessToken,
    query: {
      select: "*",
      order: "is_pinned.desc,created_at.desc"
    }
  });
}

export function fetchExplorePosts(accessToken?: string | null) {
  return supabaseFetch<PostRow[]>("posts", {
    accessToken,
    query: {
      select: "*,profiles(username,display_name,account_role,avatar_url,accent_color)",
      visibility: "eq.public",
      order: "created_at.desc"
    }
  });
}

export function fetchProfile(username: string, accessToken?: string | null) {
  return supabaseFetch<ProfileRow[]>("profiles", {
    accessToken,
    query: {
      select: "*",
      username: `eq.${username}`,
      limit: 1
    }
  });
}

export function fetchProfileById(profileId: string, accessToken?: string | null) {
  return supabaseFetch<ProfileRow[]>("profiles", {
    accessToken,
    query: {
      select: "*",
      id: `eq.${profileId}`,
      limit: 1
    }
  });
}

export function fetchFriendRequests(accessToken?: string | null) {
  return supabaseFetch<FriendRequestRow[]>("friend_requests", {
    accessToken,
    query: {
      select: "*",
      order: "created_at.desc"
    }
  });
}

export function fetchFriendships(accessToken?: string | null) {
  return supabaseFetch<FriendshipRow[]>("friendships", {
    accessToken,
    query: {
      select: "*",
      order: "created_at.desc"
    }
  });
}

export function fetchInstants(accessToken?: string | null) {
  return supabaseFetch<InstantRow[]>("instants", {
    accessToken,
    query: {
      select: "*",
      order: "expires_at.desc"
    }
  });
}

export function fetchMessageThreads(accessToken?: string | null) {
  return supabaseFetch<MessageThreadRow[]>("message_threads", {
    accessToken,
    query: {
      select: "*",
      order: "updated_at.desc"
    }
  });
}

export function fetchThreadMembers(accessToken?: string | null) {
  return supabaseFetch<ThreadMemberRow[]>("thread_members", {
    accessToken,
    query: {
      select: "*",
      order: "joined_at.asc"
    }
  });
}

export function fetchMessages(accessToken?: string | null) {
  return supabaseFetch<MessageRow[]>("messages", {
    accessToken,
    query: {
      select: "*",
      order: "created_at.asc"
    }
  });
}

export function fetchPostComments(postId: string, accessToken?: string | null) {
  return supabaseFetch<CommentRow[]>("post_comments", {
    accessToken,
    query: {
      select: "*,profiles(username,display_name,account_role,avatar_url)",
      post_id: `eq.${postId}`,
      order: "created_at.asc"
    }
  });
}

export function updateProfile(
  profileId: string,
  updates: ProfileUpdate,
  accessToken?: string | null
) {
  return supabaseFetch<ProfileRow[]>("profiles", {
    accessToken,
    method: "PATCH",
    body: updates,
    query: {
      id: `eq.${profileId}`
    }
  });
}

export function upsertProfile(profile: ProfileInsert, accessToken?: string | null) {
  return supabaseFetch<ProfileRow[]>("profiles", {
    accessToken,
    method: "POST",
    prefer: "resolution=merge-duplicates,return=representation",
    body: profile,
    query: {
      on_conflict: "id"
    }
  });
}

export function createPost(post: PostInsert, accessToken?: string | null) {
  return supabaseFetch<PostRow[]>("posts", {
    accessToken,
    method: "POST",
    prefer: "return=representation",
    body: post
  });
}

export function updatePost(
  postId: string,
  updates: PostUpdate,
  accessToken?: string | null
) {
  return supabaseFetch<PostRow[]>("posts", {
    accessToken,
    method: "PATCH",
    body: updates,
    query: {
      id: `eq.${postId}`
    }
  });
}

export function updateUserPostsVisibility(
  userId: string,
  visibility: PostRow["visibility"],
  accessToken?: string | null
) {
  return supabaseFetch<PostRow[]>("posts", {
    accessToken,
    method: "PATCH",
    body: { visibility },
    query: {
      user_id: `eq.${userId}`
    }
  });
}

export function deletePost(postId: string, accessToken?: string | null) {
  return supabaseFetch("posts", {
    accessToken,
    method: "DELETE",
    query: {
      id: `eq.${postId}`
    }
  });
}

export function createInstant(instant: InstantInsert, accessToken?: string | null) {
  return supabaseFetch<InstantRow[]>("instants", {
    accessToken,
    method: "POST",
    prefer: "return=representation",
    body: instant
  });
}

export function deleteInstant(instantId: string, accessToken?: string | null) {
  return supabaseFetch("instants", {
    accessToken,
    method: "DELETE",
    query: {
      id: `eq.${instantId}`
    }
  });
}

export function sendFriendRequest(
  fromUserId: string,
  toUserId: string,
  accessToken?: string | null
) {
  return supabaseFetch<FriendRequestRow[]>("friend_requests", {
    accessToken,
    method: "POST",
    body: {
      from_user_id: fromUserId,
      to_user_id: toUserId,
      status: "pending"
    }
  });
}

export function answerFriendRequest(
  requestId: string,
  status: "accepted" | "ignored",
  accessToken?: string | null
) {
  return supabaseFetch<FriendRequestRow[]>("friend_requests", {
    accessToken,
    method: "PATCH",
    body: { status },
    query: {
      id: `eq.${requestId}`
    }
  });
}

export function createPostBlip(
  postId: string,
  userId: string,
  accessToken?: string | null
) {
  return supabaseFetch("post_blips", {
    accessToken,
    method: "POST",
    body: {
      post_id: postId,
      user_id: userId
    }
  });
}

export function deletePostBlip(
  postId: string,
  userId: string,
  accessToken?: string | null
) {
  return supabaseFetch("post_blips", {
    accessToken,
    method: "DELETE",
    query: {
      post_id: `eq.${postId}`,
      user_id: `eq.${userId}`
    }
  });
}

export function createPostComment(
  postId: string,
  userId: string,
  body: string,
  accessToken?: string | null
) {
  return supabaseFetch<CommentRow[]>("post_comments", {
    accessToken,
    method: "POST",
    body: {
      post_id: postId,
      user_id: userId,
      body
    }
  });
}

export function createMessageThread(
  createdBy: string,
  title?: string | null,
  isGroup = false,
  accessToken?: string | null
) {
  return supabaseFetch<MessageThreadRow[]>("message_threads", {
    accessToken,
    method: "POST",
    prefer: "return=representation",
    body: {
      created_by: createdBy,
      title: title ?? null,
      is_group: isGroup
    }
  });
}

export function addThreadMembers(
  threadId: string,
  members: Array<{ userId: string; role?: "owner" | "member" }>,
  accessToken?: string | null
) {
  return supabaseFetch<ThreadMemberRow[]>("thread_members", {
    accessToken,
    method: "POST",
    prefer: "resolution=merge-duplicates,return=representation",
    query: {
      on_conflict: "thread_id,user_id"
    },
    body: members.map((member) => ({
      thread_id: threadId,
      user_id: member.userId,
      role: member.role ?? "member"
    }))
  });
}

export function createMessage(
  threadId: string,
  senderId: string,
  body: string,
  accessToken?: string | null
) {
  return supabaseFetch<MessageRow[]>("messages", {
    accessToken,
    method: "POST",
    body: {
      thread_id: threadId,
      sender_id: senderId,
      type: "text",
      body,
      metadata: {}
    }
  });
}

export function fetchThreadMessages(threadId: string, accessToken?: string | null) {
  return supabaseFetch<MessageRow[]>("messages", {
    accessToken,
    query: {
      select: "*",
      thread_id: `eq.${threadId}`,
      order: "created_at.asc"
    }
  });
}
