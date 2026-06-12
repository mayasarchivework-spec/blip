import type { AccentName, AspectRatio, PostType } from "@/data/types";

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export interface ProfileRow {
  id: string;
  username: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  accent_color: AccentName;
  is_private: boolean;
  allow_explore: boolean;
  profile_line: string | null;
  note: string | null;
  note_expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PostRow {
  id: string;
  user_id: string;
  type: PostType;
  content: string;
  image_url: string | null;
  video_url: string | null;
  song_title: string | null;
  artist_name: string | null;
  album_art_url: string | null;
  caption: string | null;
  aspect_ratio: AspectRatio | null;
  is_pinned: boolean;
  visibility: "friends" | "public";
  created_at: string;
  updated_at: string;
  blips_count?: number;
  comments_count?: number;
}

export interface CommentRow {
  id: string;
  post_id: string;
  user_id: string;
  body: string;
  created_at: string;
  profiles?: {
    username: string;
    display_name: string;
    avatar_url: string | null;
  } | null;
}

export interface FriendRequestRow {
  id: string;
  from_user_id: string;
  to_user_id: string;
  status: "pending" | "accepted" | "ignored";
  created_at: string;
  updated_at: string;
}

export interface FriendshipRow {
  id: string;
  user_low: string;
  user_high: string;
  created_at: string;
}

export interface InstantRow {
  id: string;
  user_id: string;
  type: "photo" | "video" | "text" | "song";
  content: string;
  thumbnail_url: string | null;
  expires_at: string;
  created_at: string;
}

export interface MessageThreadRow {
  id: string;
  title: string | null;
  is_group: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface MessageRow {
  id: string;
  thread_id: string;
  sender_id: string;
  type: "text" | "image" | "song" | "note";
  body: string;
  media_url: string | null;
  metadata: JsonValue;
  created_at: string;
}

export interface ThreadMemberRow {
  thread_id: string;
  user_id: string;
  role: "owner" | "member";
  last_read_at: string | null;
  created_at: string;
}
