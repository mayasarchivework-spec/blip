export type AccentName =
  | "blue"
  | "pink"
  | "purple"
  | "teal"
  | "green"
  | "orange"
  | "red";

export type PostType = "photo" | "video" | "text" | "song";
export type AspectRatio = "square" | "portrait" | "landscape" | "free";

export interface AccentOption {
  name: AccentName;
  label: string;
  color: string;
  dark: string;
  light: string;
}

export interface FriendRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  createdAt: string;
  status?: "pending" | "accepted" | "ignored";
}

export interface User {
  id: string;
  username: string;
  displayName: string;
  accountRole?: "user" | "admin" | "owner";
  bio: string;
  avatarUrl: string;
  avatarShape?: "circle" | "rounded" | "square";
  bannerUrl?: string;
  location?: string;
  accentColor: AccentName;
  isPrivate: boolean;
  allowExplore: boolean;
  friendIds: string[];
  friendRequestsReceived: FriendRequest[];
  friendRequestsSent: FriendRequest[];
  stats: {
    posts: number;
    friends: number;
    blips: number;
  };
  note?: string;
  noteExpiresAt?: string;
  profileLine?: string;
}

export interface Post {
  id: string;
  userId: string;
  type: PostType;
  content: string;
  imageUrl?: string;
  imageUrls?: string[];
  videoUrl?: string;
  songTitle?: string;
  artistName?: string;
  albumArtUrl?: string;
  caption?: string;
  blips: number;
  comments: number;
  isPinned: boolean;
  createdAt: string;
  aspectRatio?: AspectRatio;
}

export interface PostComment {
  id: string;
  postId: string;
  userId: string;
  body: string;
  createdAt: string;
  authorName?: string;
  authorAvatarUrl?: string;
}

export interface Instant {
  id: string;
  userId: string;
  type: PostType;
  content: string;
  thumbnailUrl?: string;
  videoUrl?: string;
  expiresAt: string;
}

export type MessageType = "text" | "image" | "song" | "note";

export interface ChatMessage {
  id: string;
  senderId: string;
  type: MessageType;
  content: string;
  imageUrl?: string;
  songTitle?: string;
  artistName?: string;
  albumArtUrl?: string;
  createdAt: string;
  status?: "sent" | "read";
}

export interface MessageThread {
  id: string;
  participantIds: string[];
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  messages: ChatMessage[];
}

export type ComposerType = "photo" | "text" | "video" | "song" | null;

export type EditorAdjustment =
  | "brightness"
  | "contrast"
  | "fade"
  | "grain"
  | "warmth"
  | "vignette";

export type EditorAdjustments = Record<EditorAdjustment, number>;
