"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import { currentUserId as mockCurrentUserId, mockUsers, accentOptions } from "@/data/mockUsers";
import type {
  AccentName,
  AccentOption,
  ChatMessage,
  ComposerType,
  EditorAdjustment,
  EditorAdjustments,
  Instant,
  MessageThread,
  Post,
  PostComment,
  User
} from "@/data/types";
import {
  buildAppDataset,
  loadSupabaseSnapshot,
  mapCommentRow,
  type SupabaseSnapshot
} from "@/lib/supabase/appData";
import {
  refreshAuthSession,
  signInWithPassword,
  signOutSession,
  signUpWithPassword,
  type SupabaseAuthSession
} from "@/lib/supabase/auth";
import {
  answerFriendRequest as updateFriendRequestStatus,
  createInstant as createRemoteInstant,
  createMessage,
  createPost as createRemotePost,
  createPostBlip,
  createPostComment,
  deleteInstant as deleteRemoteInstant,
  deletePostBlip,
  deletePost as deleteRemotePost,
  fetchProfileById,
  fetchPostComments,
  sendFriendRequest,
  updatePost as updateRemotePost,
  updateProfile,
  upsertProfile
} from "@/lib/supabase/queries";
import { getConfiguredAccountRole, isSupabaseConfigured } from "@/lib/supabase/config";
import { uploadProfileImage } from "@/lib/supabase/storage";

const defaultAdjustments: EditorAdjustments = {
  brightness: 15,
  contrast: 28,
  fade: 12,
  grain: 20,
  warmth: 6,
  vignette: -10
};

const storageKey = "blip.prototype.state.v1";
const authStorageKey = "blip.supabase.session.v1";
const noteLifetimeMs = 24 * 60 * 60 * 1000;
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const dataUrlPrefix = "data:";
const guestCurrentUser: User = {
  id: "guest",
  username: "guest",
  displayName: "Guest",
  accountRole: "user",
  bio: "",
  avatarUrl: "/assets/avatar-racer.svg",
  accentColor: "blue",
  isPrivate: false,
  allowExplore: false,
  friendIds: [],
  friendRequestsReceived: [],
  friendRequestsSent: [],
  stats: {
    posts: 0,
    friends: 0,
    blips: 0
  }
};

interface StoredAppState {
  accentName?: AccentName;
  isPrivate?: boolean;
  allowExplore?: boolean;
  favoriteUserIds?: string[];
  requestedUserIds?: string[];
  acceptedFriendIds?: string[];
  removedFriendIds?: string[];
  blipOverrides?: Record<string, number>;
  postEditOverrides?: Record<string, Partial<Post>>;
  pinnedPostOverrides?: Record<string, boolean>;
  blippedPostIds?: string[];
  hiddenPostIds?: string[];
  deletedPostIds?: string[];
  deletedInstantIds?: string[];
  localPosts?: Post[];
  localInstants?: Instant[];
  localThreads?: MessageThread[];
  threadMessageOverrides?: Record<string, ChatMessage[]>;
  profileOverrides?: Partial<User>;
  savedStickers?: string[];
  userNote?: string;
  userNoteExpiresAt?: string;
  editorFilter?: string;
  editorAdjustments?: EditorAdjustments;
}

interface AppStateValue {
  users: User[];
  posts: Post[];
  instants: Instant[];
  threads: MessageThread[];
  currentUser: User;
  accentOptions: AccentOption[];
  accent: AccentOption;
  backendSource: "mock" | "supabase";
  backendReady: boolean;
  backendLoading: boolean;
  isGuest: boolean;
  authError: string | null;
  authSession: SupabaseAuthSession | null;
  authStatus: "idle" | "loading" | "authenticated";
  favoriteUserIds: string[];
  requestedUserIds: string[];
  blippedPostIds: string[];
  savedStickers: string[];
  userNote: string;
  userNoteExpiresAt: string | null;
  activeInstantUserId: string | null;
  composerType: ComposerType;
  editorFilter: string;
  editorAdjustments: EditorAdjustments;
  getUserById: (id: string) => User | undefined;
  getUserByUsername: (username: string) => User | undefined;
  getFriends: () => User[];
  getInstantsForUser: (userId: string) => Instant[];
  getInstantForUser: (userId: string) => Instant | undefined;
  getCommentsForPost: (postId: string) => PostComment[] | undefined;
  loadPostComments: (postId: string) => Promise<void>;
  addPostComment: (postId: string, ownerId: string, body: string) => Promise<void>;
  startThread: (userId: string) => string | null;
  sendThreadMessage: (threadId: string, body: string) => Promise<void>;
  replyToInstant: (userId: string, body: string) => Promise<string | null>;
  answerFriendRequest: (requestId: string, status: "accepted" | "ignored") => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    username: string,
    displayName: string
  ) => Promise<void>;
  signOut: () => Promise<void>;
  deactivateAccount: () => Promise<void>;
  addLocalPost: (post: {
    type: "photo" | "video" | "text";
    content: string;
    imageUrl?: string;
    imageUrls?: string[];
    videoUrl?: string;
    caption?: string;
  }) => void;
  editPost: (postId: string, updates: Partial<Post>) => void;
  createInstant: (instant: {
    type: "photo" | "video" | "text";
    content: string;
    thumbnailUrl?: string;
    videoUrl?: string;
  }) => void;
  deleteInstant: (instantId: string) => void;
  deletePost: (postId: string) => void;
  hidePost: (postId: string) => void;
  pinPost: (postId: string) => void;
  saveProfile: (updates: Partial<User>) => Promise<void>;
  saveSticker: (dataUrl: string) => void;
  setUserNote: (note: string) => void;
  toggleFavoriteUser: (userId: string) => void;
  isFavoriteUser: (userId: string) => boolean;
  isFriend: (userId: string) => boolean;
  isOwner: (userId: string) => boolean;
  canInteractWith: (userId: string) => boolean;
  effectiveUser: (user: User) => User;
  setAccentName: (name: AccentName) => void;
  togglePrivate: () => void;
  toggleExplore: () => void;
  requestFriend: (userId: string) => void;
  removeFriend: (userId: string) => void;
  hasRequested: (userId: string) => boolean;
  blipPost: (postId: string, ownerId: string) => void;
  hasBlipped: (postId: string) => boolean;
  openInstant: (userId: string) => void;
  closeInstant: () => void;
  openComposer: (type: Exclude<ComposerType, null>) => void;
  closeComposer: () => void;
  setEditorFilter: (filter: string) => void;
  setEditorAdjustment: (name: EditorAdjustment, value: number) => void;
}

const AppStateContext = createContext<AppStateValue | null>(null);

function getAccent(name: AccentName) {
  return accentOptions.find((option) => option.name === name) ?? accentOptions[0];
}

function isRemoteId(id: string) {
  return uuidPattern.test(id);
}

function makeLocalMessage(currentUserId: string, body: string): ChatMessage {
  return {
    id: `local-message-${Date.now()}`,
    senderId: currentUserId,
    type: "text",
    content: body,
    createdAt: "now",
    status: "sent"
  };
}

function makeLocalComment(currentUser: User, postId: string, body: string): PostComment {
  return {
    id: `local-comment-${Date.now()}`,
    postId,
    userId: currentUser.id,
    body,
    createdAt: "now",
    authorName: currentUser.displayName,
    authorAvatarUrl: currentUser.avatarUrl
  };
}

function sanitizeUsername(value: string, fallback: string) {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._]/g, "")
    .replace(/^[._]+|[._]+$/g, "");

  const username = normalized.length >= 2 ? normalized : fallback;
  return username.slice(0, 30);
}

function sanitizeDisplayName(value: string | undefined, fallback: string) {
  const normalized = (value ?? "")
    .replace(/[✓✔☑✅]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  return (normalized || fallback).slice(0, 50);
}

function metadataString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function usernameWithSuffix(username: string, userId: string) {
  const suffix = userId.replace(/-/g, "").slice(0, 6);
  return `${username.slice(0, Math.max(2, 29 - suffix.length))}.${suffix}`;
}

function isDataUrl(value: unknown) {
  return typeof value === "string" && value.startsWith(dataUrlPrefix);
}

function isFutureIso(value: string | null | undefined) {
  if (!value) {
    return false;
  }

  const time = Date.parse(value);
  return Number.isFinite(time) && time > Date.now();
}

function isActiveInstant(instant: Instant) {
  const expiresTime = Date.parse(instant.expiresAt);

  return !Number.isFinite(expiresTime) || expiresTime > Date.now();
}

function stripProfileMedia(overrides: Partial<User> | undefined) {
  if (!overrides) {
    return overrides;
  }

  const next = { ...overrides };

  if (isDataUrl(next.avatarUrl)) {
    delete next.avatarUrl;
  }
  if (isDataUrl(next.bannerUrl)) {
    delete next.bannerUrl;
  }

  return next;
}

function stripPostMedia(post: Post): Post {
  return {
    ...post,
    imageUrl: isDataUrl(post.imageUrl) ? undefined : post.imageUrl,
    imageUrls: post.imageUrls?.filter((url) => !isDataUrl(url)),
    videoUrl: isDataUrl(post.videoUrl) ? undefined : post.videoUrl,
    albumArtUrl: isDataUrl(post.albumArtUrl) ? undefined : post.albumArtUrl
  };
}

function stripPostOverrideMedia(overrides: Partial<Post>) {
  return {
    ...overrides,
    imageUrl: isDataUrl(overrides.imageUrl) ? undefined : overrides.imageUrl,
    imageUrls: overrides.imageUrls?.filter((url) => !isDataUrl(url)),
    videoUrl: isDataUrl(overrides.videoUrl) ? undefined : overrides.videoUrl,
    albumArtUrl: isDataUrl(overrides.albumArtUrl) ? undefined : overrides.albumArtUrl
  };
}

function stripInstantMedia(instant: Instant): Instant {
  return {
    ...instant,
    thumbnailUrl: isDataUrl(instant.thumbnailUrl) ? undefined : instant.thumbnailUrl,
    videoUrl: isDataUrl(instant.videoUrl) ? undefined : instant.videoUrl
  };
}

function compactStoredState(stored: StoredAppState): StoredAppState {
  return {
    ...stored,
    localPosts: stored.localPosts?.map(stripPostMedia),
    postEditOverrides: stored.postEditOverrides
      ? Object.fromEntries(
          Object.entries(stored.postEditOverrides).map(([postId, overrides]) => [
            postId,
            stripPostOverrideMedia(overrides)
          ])
        )
      : undefined,
    localInstants: stored.localInstants?.map(stripInstantMedia),
    profileOverrides: stripProfileMedia(stored.profileOverrides),
    savedStickers: stored.savedStickers?.filter((sticker) => !isDataUrl(sticker))
  };
}

function persistStoredState(stored: StoredAppState) {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(stored));
  } catch (error) {
    if (error instanceof DOMException && error.name === "QuotaExceededError") {
      window.localStorage.setItem(storageKey, JSON.stringify(compactStoredState(stored)));
      return;
    }

    throw error;
  }
}

async function ensureProfileForSession(
  session: SupabaseAuthSession,
  values?: { displayName?: string; username?: string }
) {
  const existing = await fetchProfileById(session.user.id, session.access_token).catch(
    () => []
  );

  if (existing[0]) {
    return existing[0];
  }

  const emailName = session.user.email?.split("@")[0] ?? "blip";
  const username = sanitizeUsername(
    values?.username || metadataString(session.user.user_metadata?.username) || emailName,
    "blip"
  );
  const displayName = sanitizeDisplayName(
    values?.displayName ||
      metadataString(session.user.user_metadata?.display_name) ||
      metadataString(session.user.user_metadata?.displayName),
    username
  );
  const profile = {
    id: session.user.id,
    username,
    display_name: displayName,
    account_role: getConfiguredAccountRole(session.user.email, username),
    bio: "",
    avatar_url: "/assets/avatar-racer.svg",
    accent_color: "blue" as const,
    is_private: false,
    allow_explore: true,
    profile_line: ""
  };
  const profileWithoutRole = {
    id: profile.id,
    username: profile.username,
    display_name: profile.display_name,
    bio: profile.bio,
    avatar_url: profile.avatar_url,
    accent_color: profile.accent_color,
    is_private: profile.is_private,
    allow_explore: profile.allow_explore,
    profile_line: profile.profile_line
  };

  try {
    return (await upsertProfile(profile, session.access_token))[0];
  } catch {
    try {
      return (
        await upsertProfile(
          {
            ...profile,
            username: usernameWithSuffix(username, session.user.id)
          },
          session.access_token
        )
      )[0];
    } catch {
      try {
        return (await upsertProfile(profileWithoutRole, session.access_token))[0];
      } catch {
        return (
          await upsertProfile(
            {
              ...profileWithoutRole,
              username: usernameWithSuffix(username, session.user.id)
            },
            session.access_token
          )
        )[0];
      }
    }
  }
}

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const mockCurrentUser = mockUsers.find((user) => user.id === mockCurrentUserId);

  if (!mockCurrentUser) {
    throw new Error("Current Blip user is missing from mock data.");
  }

  const [snapshot, setSnapshot] = useState<SupabaseSnapshot | null>(null);
  const [backendReady, setBackendReady] = useState(false);
  const [backendLoading, setBackendLoading] = useState(isSupabaseConfigured);
  const [authSession, setAuthSession] = useState<SupabaseAuthSession | null>(null);
  const [authStatus, setAuthStatus] = useState<"idle" | "loading" | "authenticated">(
    "idle"
  );
  const [authError, setAuthError] = useState<string | null>(null);
  const [accentName, setAccentNameState] = useState<AccentName>(
    mockCurrentUser.accentColor
  );
  const [isPrivate, setIsPrivate] = useState(mockCurrentUser.isPrivate);
  const [allowExplore, setAllowExplore] = useState(mockCurrentUser.allowExplore);
  const [favoriteUserIds, setFavoriteUserIds] = useState<string[]>([]);
  const [requestedUserIds, setRequestedUserIds] = useState<string[]>([]);
  const [acceptedFriendIds, setAcceptedFriendIds] = useState<string[]>([]);
  const [removedFriendIds, setRemovedFriendIds] = useState<string[]>([]);
  const [hiddenRequestIds, setHiddenRequestIds] = useState<string[]>([]);
  const [blipOverrides, setBlipOverrides] = useState<Record<string, number>>({});
  const [postEditOverrides, setPostEditOverrides] = useState<Record<string, Partial<Post>>>(
    {}
  );
  const [commentOverrides, setCommentOverrides] = useState<Record<string, number>>({});
  const [pinnedPostOverrides, setPinnedPostOverrides] = useState<Record<string, boolean>>(
    {}
  );
  const [blippedPostIds, setBlippedPostIds] = useState<string[]>([]);
  const [hiddenPostIds, setHiddenPostIds] = useState<string[]>([]);
  const [deletedPostIds, setDeletedPostIds] = useState<string[]>([]);
  const [deletedInstantIds, setDeletedInstantIds] = useState<string[]>([]);
  const [localPosts, setLocalPosts] = useState<Post[]>([]);
  const [localInstants, setLocalInstants] = useState<Instant[]>([]);
  const [localThreads, setLocalThreads] = useState<MessageThread[]>([]);
  const [profileOverrides, setProfileOverrides] = useState<Partial<User>>({});
  const [savedStickers, setSavedStickers] = useState<string[]>([]);
  const [userNote, setUserNoteState] = useState("");
  const [userNoteExpiresAt, setUserNoteExpiresAt] = useState<string | null>(null);
  const [commentsByPostId, setCommentsByPostId] = useState<
    Record<string, PostComment[]>
  >({});
  const [threadMessageOverrides, setThreadMessageOverrides] = useState<
    Record<string, ChatMessage[]>
  >({});
  const [activeInstantUserId, setActiveInstantUserId] = useState<string | null>(null);
  const [composerType, setComposerType] = useState<ComposerType>(null);
  const [editorFilter, setEditorFilter] = useState("Bleach Bypass");
  const [editorAdjustments, setEditorAdjustments] =
    useState<EditorAdjustments>(defaultAdjustments);
  const [storageLoaded, setStorageLoaded] = useState(false);
  const [hasStoredState, setHasStoredState] = useState(false);

  const dataset = useMemo(
    () => buildAppDataset(snapshot, authSession?.user.id),
    [authSession?.user.id, snapshot]
  );
  const isGuest = !authSession;
  const baseCurrentUser = useMemo(
    () => {
      if (isGuest) {
        return guestCurrentUser;
      }

      return (
        dataset.users.find((user) => user.id === dataset.currentUserId) ??
        mockCurrentUser
      );
    },
    [dataset.currentUserId, dataset.users, isGuest, mockCurrentUser]
  );

  const accent = useMemo(() => getAccent(accentName), [accentName]);

  useEffect(() => {
    const raw = window.localStorage.getItem(authStorageKey);
    if (!raw) {
      return;
    }

    try {
      const stored = JSON.parse(raw) as SupabaseAuthSession;
      const expiresAt = stored.expires_at ?? 0;

      if (expiresAt > Math.floor(Date.now() / 1000) + 60) {
        setAuthSession(stored);
        setAuthStatus("authenticated");
        return;
      }

      if (stored.refresh_token) {
        setAuthStatus("loading");
        void refreshAuthSession(stored.refresh_token)
          .then((session) => {
            window.localStorage.setItem(authStorageKey, JSON.stringify(session));
            setAuthSession(session);
            setAuthStatus("authenticated");
          })
          .catch(() => {
            window.localStorage.removeItem(authStorageKey);
            setAuthStatus("idle");
          });
      }
    } catch {
      window.localStorage.removeItem(authStorageKey);
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setBackendReady(false);
      setBackendLoading(false);
      return;
    }

    let cancelled = false;
    setBackendLoading(true);

    loadSupabaseSnapshot(authSession?.access_token)
      .then((nextSnapshot) => {
        if (!cancelled) {
          setSnapshot(nextSnapshot);
          setBackendReady(true);
          setBackendLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setBackendReady(false);
          setBackendLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [authSession?.access_token]);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--accent-color", accent.color);
    root.style.setProperty("--accent-dark", accent.dark);
    root.style.setProperty("--accent-light", accent.light);
  }, [accent]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      setHasStoredState(Boolean(raw));
      if (!raw) {
        setStorageLoaded(true);
        return;
      }

      const stored = JSON.parse(raw) as StoredAppState;
      if (
        stored.accentName &&
        accentOptions.some((option) => option.name === stored.accentName)
      ) {
        setAccentNameState(stored.accentName);
      }
      if (typeof stored.isPrivate === "boolean") {
        setIsPrivate(stored.isPrivate);
      }
      if (typeof stored.allowExplore === "boolean") {
        setAllowExplore(stored.allowExplore);
      }
      if (Array.isArray(stored.favoriteUserIds)) {
        setFavoriteUserIds(stored.favoriteUserIds);
      }
      if (Array.isArray(stored.requestedUserIds)) {
        setRequestedUserIds(stored.requestedUserIds);
      }
      if (Array.isArray(stored.acceptedFriendIds)) {
        setAcceptedFriendIds(stored.acceptedFriendIds);
      }
      if (Array.isArray(stored.removedFriendIds)) {
        setRemovedFriendIds(stored.removedFriendIds);
      }
      if (stored.blipOverrides && typeof stored.blipOverrides === "object") {
        setBlipOverrides(stored.blipOverrides);
      }
      if (stored.postEditOverrides && typeof stored.postEditOverrides === "object") {
        setPostEditOverrides(stored.postEditOverrides);
      }
      if (stored.pinnedPostOverrides && typeof stored.pinnedPostOverrides === "object") {
        setPinnedPostOverrides(stored.pinnedPostOverrides);
      }
      if (Array.isArray(stored.blippedPostIds)) {
        setBlippedPostIds(stored.blippedPostIds);
      }
      if (Array.isArray(stored.hiddenPostIds)) {
        setHiddenPostIds(stored.hiddenPostIds);
      }
      if (Array.isArray(stored.deletedPostIds)) {
        setDeletedPostIds(stored.deletedPostIds);
      }
      if (Array.isArray(stored.deletedInstantIds)) {
        setDeletedInstantIds(stored.deletedInstantIds);
      }
      if (Array.isArray(stored.localPosts)) {
        setLocalPosts(stored.localPosts);
      }
      if (Array.isArray(stored.localInstants)) {
        setLocalInstants(stored.localInstants);
      }
      if (Array.isArray(stored.localThreads)) {
        setLocalThreads(stored.localThreads);
      }
      if (stored.threadMessageOverrides && typeof stored.threadMessageOverrides === "object") {
        setThreadMessageOverrides(stored.threadMessageOverrides);
      }
      if (stored.profileOverrides && typeof stored.profileOverrides === "object") {
        const nextProfileOverrides = { ...stored.profileOverrides };
        delete nextProfileOverrides.note;
        delete nextProfileOverrides.noteExpiresAt;
        setProfileOverrides(nextProfileOverrides);
      }
      if (Array.isArray(stored.savedStickers)) {
        setSavedStickers(stored.savedStickers);
      }
      if (typeof stored.userNote === "string" && isFutureIso(stored.userNoteExpiresAt)) {
        setUserNoteState(stored.userNote.slice(0, 30));
        setUserNoteExpiresAt(stored.userNoteExpiresAt ?? null);
      }
      if (stored.editorFilter) {
        setEditorFilter(stored.editorFilter);
      }
      if (stored.editorAdjustments) {
        setEditorAdjustments({
          ...defaultAdjustments,
          ...stored.editorAdjustments
        });
      }
    } catch {
      window.localStorage.removeItem(storageKey);
    } finally {
      setStorageLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!storageLoaded || hasStoredState) {
      return;
    }

    setAccentNameState(baseCurrentUser.accentColor);
    setIsPrivate(baseCurrentUser.isPrivate);
    setAllowExplore(baseCurrentUser.allowExplore);
  }, [
    baseCurrentUser.accentColor,
    baseCurrentUser.allowExplore,
    baseCurrentUser.isPrivate,
    hasStoredState,
    storageLoaded
  ]);

  useEffect(() => {
    if (!storageLoaded) {
      return;
    }

    const storedUserNote =
      userNote.trim() && isFutureIso(userNoteExpiresAt) ? userNote : "";
    const stored: StoredAppState = {
      accentName,
      isPrivate,
      allowExplore,
      favoriteUserIds,
      requestedUserIds,
      acceptedFriendIds,
      removedFriendIds,
      blipOverrides,
      postEditOverrides,
      pinnedPostOverrides,
      blippedPostIds,
      hiddenPostIds,
      deletedPostIds,
      deletedInstantIds,
      localPosts,
      localInstants,
      localThreads,
      threadMessageOverrides,
      profileOverrides,
      savedStickers: savedStickers.filter((sticker) => !isDataUrl(sticker)),
      userNote: storedUserNote,
      userNoteExpiresAt: storedUserNote ? userNoteExpiresAt ?? undefined : undefined,
      editorFilter,
      editorAdjustments
    };

    persistStoredState(stored);
  }, [
    accentName,
    acceptedFriendIds,
    allowExplore,
    blipOverrides,
    blippedPostIds,
    editorAdjustments,
    editorFilter,
    favoriteUserIds,
    deletedPostIds,
    deletedInstantIds,
    hiddenPostIds,
    isPrivate,
    localInstants,
    localThreads,
    localPosts,
    postEditOverrides,
    pinnedPostOverrides,
    profileOverrides,
    requestedUserIds,
    removedFriendIds,
    savedStickers,
    storageLoaded,
    threadMessageOverrides,
    userNote,
    userNoteExpiresAt
  ]);

  const activeUserNote = useMemo(
    () => (userNote.trim() && isFutureIso(userNoteExpiresAt) ? userNote : ""),
    [userNote, userNoteExpiresAt]
  );

  const currentUser = useMemo<User>(() => {
    const localSentRequests = requestedUserIds.map((userId, index) => ({
      id: `local-sent-${index}`,
      fromUserId: baseCurrentUser.id,
      toUserId: userId,
      createdAt: "Now",
      status: "pending" as const
    }));
    const baseVisibleFriendIds = baseCurrentUser.friendIds.filter(
      (friendId) => !removedFriendIds.includes(friendId)
    );
    const acceptedVisibleFriendIds = acceptedFriendIds.filter(
      (friendId) =>
        friendId !== baseCurrentUser.id &&
        !removedFriendIds.includes(friendId) &&
        !baseVisibleFriendIds.includes(friendId)
    );
    const visibleFriendIds = [...baseVisibleFriendIds, ...acceptedVisibleFriendIds];
    const removedVisibleFriendCount =
      baseCurrentUser.friendIds.length - baseVisibleFriendIds.length;
    const profileStats = profileOverrides.stats ?? baseCurrentUser.stats;

    return {
      ...baseCurrentUser,
      ...profileOverrides,
      accentColor: accentName,
      isPrivate: isGuest ? false : isPrivate,
      allowExplore: isGuest ? false : allowExplore,
      friendIds: visibleFriendIds,
      stats: {
        ...profileStats,
        friends: Math.max(
          visibleFriendIds.length,
          profileStats.friends - removedVisibleFriendCount + acceptedVisibleFriendIds.length
        )
      },
      note:
        activeUserNote ||
        (dataset.source === "supabase" ? baseCurrentUser.note : undefined),
      noteExpiresAt:
        activeUserNote ? userNoteExpiresAt ?? undefined : baseCurrentUser.noteExpiresAt,
      friendRequestsReceived: baseCurrentUser.friendRequestsReceived.filter(
        (request) => !hiddenRequestIds.includes(request.id)
      ),
      friendRequestsSent: mergeRequests(
        baseCurrentUser.friendRequestsSent,
        localSentRequests
      )
    };
  }, [
    accentName,
    acceptedFriendIds,
    activeUserNote,
    allowExplore,
    baseCurrentUser,
    dataset.source,
    hiddenRequestIds,
    isPrivate,
    isGuest,
    profileOverrides,
    requestedUserIds,
    removedFriendIds,
    userNoteExpiresAt
  ]);

  const users = useMemo(
    () => {
      const mergedUsers = dataset.users.map((user) => {
        if (user.id !== currentUser.id) {
          return user;
        }

        return currentUser;
      });

      return mergedUsers.some((user) => user.id === currentUser.id)
        ? mergedUsers
        : [currentUser, ...mergedUsers];
    },
    [currentUser, dataset.users]
  );

  const posts = useMemo(
    () =>
      [...(isGuest ? [] : localPosts), ...dataset.posts]
        .filter((post) => post.type !== "song" && !deletedPostIds.includes(post.id))
        .map((post) => ({
          ...post,
          ...postEditOverrides[post.id],
          blips: blipOverrides[post.id] ?? post.blips,
          comments: commentOverrides[post.id] ?? post.comments,
          isPinned: pinnedPostOverrides[post.id] ?? post.isPinned,
          isHidden: hiddenPostIds.includes(post.id)
        })),
    [
      blipOverrides,
      commentOverrides,
      dataset.posts,
      deletedPostIds,
      hiddenPostIds,
      isGuest,
      localPosts,
      postEditOverrides,
      pinnedPostOverrides
    ]
  );

  const threads = useMemo<MessageThread[]>(
    () => {
      const mergedThreads = dataset.threads.map((thread) => {
        const localMessages = threadMessageOverrides[thread.id] ?? [];
        const messages = [...thread.messages, ...localMessages].filter(
          (message) => message.type !== "song"
        );
        const lastMessage = messages[messages.length - 1];

        return {
          ...thread,
          messages,
          lastMessage: lastMessage?.content ?? thread.lastMessage,
          timestamp: localMessages.length ? "now" : thread.timestamp
        };
      });
      const localOnlyThreads = isGuest
        ? []
        : localThreads
            .filter((thread) => !mergedThreads.some((item) => item.id === thread.id))
            .map((thread) => {
              const localMessages = threadMessageOverrides[thread.id] ?? [];
              const messages = [...thread.messages, ...localMessages].filter(
                (message) => message.type !== "song"
              );
              const lastMessage = messages[messages.length - 1];

              return {
                ...thread,
                messages,
                lastMessage: lastMessage?.content ?? thread.lastMessage,
                timestamp: localMessages.length ? "now" : thread.timestamp
              };
            });

      return [...localOnlyThreads, ...mergedThreads].sort((a, b) => {
        const aOther = a.participantIds.find((id) => id !== currentUser.id) ?? "";
        const bOther = b.participantIds.find((id) => id !== currentUser.id) ?? "";
        return Number(favoriteUserIds.includes(bOther)) - Number(favoriteUserIds.includes(aOther));
      });
    },
    [
      currentUser.id,
      dataset.threads,
      favoriteUserIds,
      isGuest,
      localThreads,
      threadMessageOverrides
    ]
  );

  const instants = useMemo(
    () =>
      [...(isGuest ? [] : localInstants), ...dataset.instants].filter(
        (instant) =>
          instant.type !== "song" &&
          isActiveInstant(instant) &&
          !deletedInstantIds.includes(instant.id)
      ),
    [dataset.instants, deletedInstantIds, isGuest, localInstants]
  );

  const getUserById = useCallback(
    (id: string) => users.find((user) => user.id === id),
    [users]
  );

  const getUserByUsername = useCallback(
    (username: string) =>
      users.find((user) => user.username.toLowerCase() === username.toLowerCase()),
    [users]
  );

  const isOwner = useCallback((userId: string) => userId === currentUser.id, [currentUser.id]);

  const isFriend = useCallback(
    (userId: string) => currentUser.friendIds.includes(userId),
    [currentUser.friendIds]
  );

  const canInteractWith = useCallback(
    (userId: string) => !isGuest && (isOwner(userId) || isFriend(userId)),
    [isFriend, isGuest, isOwner]
  );

  const getFriends = useCallback(
    () =>
      currentUser.friendIds
        .map((friendId) => users.find((user) => user.id === friendId))
        .filter((user): user is User => Boolean(user)),
    [currentUser.friendIds, users]
  );

  const getInstantsForUser = useCallback(
    (userId: string) => instants.filter((instant) => instant.userId === userId),
    [instants]
  );

  const getInstantForUser = useCallback(
    (userId: string) => getInstantsForUser(userId)[0],
    [getInstantsForUser]
  );

  const getCommentsForPost = useCallback(
    (postId: string) => commentsByPostId[postId],
    [commentsByPostId]
  );

  const effectiveUser = useCallback(
    (user: User) => {
      if (user.id !== currentUser.id) {
        return user;
      }

      return currentUser;
    },
    [currentUser]
  );

  const syncProfile = useCallback(
    (updates: Parameters<typeof updateProfile>[1]) => {
      if (!isRemoteId(currentUser.id)) {
        return;
      }

      void updateProfile(currentUser.id, updates, authSession?.access_token).catch(
        () => undefined
      );
    },
    [authSession?.access_token, currentUser.id]
  );

  useEffect(() => {
    if (!userNoteExpiresAt) {
      return;
    }

    const expiresTime = Date.parse(userNoteExpiresAt);
    if (!Number.isFinite(expiresTime) || expiresTime <= Date.now()) {
      setUserNoteState("");
      setUserNoteExpiresAt(null);
      syncProfile({ note: null, note_expires_at: null });
      return;
    }

    const timeout = window.setTimeout(
      () => {
        setUserNoteState("");
        setUserNoteExpiresAt(null);
        syncProfile({ note: null, note_expires_at: null });
      },
      Math.min(expiresTime - Date.now(), 2_147_483_647)
    );

    return () => window.clearTimeout(timeout);
  }, [syncProfile, userNoteExpiresAt]);

  const setAccentName = useCallback(
    (name: AccentName) => {
      setAccentNameState(name);
      syncProfile({ accent_color: name });
    },
    [syncProfile]
  );

  const togglePrivate = useCallback(() => {
    setIsPrivate((value) => {
      const next = !value;
      syncProfile({ is_private: next });
      return next;
    });
  }, [syncProfile]);

  const toggleExplore = useCallback(() => {
    setAllowExplore((value) => {
      const next = !value;
      syncProfile({ allow_explore: next });
      return next;
    });
  }, [syncProfile]);

  const requestFriend = useCallback(
    (userId: string) => {
      if (isGuest) {
        return;
      }

      setRequestedUserIds((ids) => (ids.includes(userId) ? ids : [...ids, userId]));

      if (!isRemoteId(currentUser.id) || !isRemoteId(userId)) {
        return;
      }

      void sendFriendRequest(currentUser.id, userId, authSession?.access_token).catch(
        () => undefined
      );
    },
    [authSession?.access_token, currentUser.id, isGuest]
  );

  const removeFriend = useCallback((userId: string) => {
    setRemovedFriendIds((ids) => (ids.includes(userId) ? ids : [...ids, userId]));
    setRequestedUserIds((ids) => ids.filter((id) => id !== userId));
    setAcceptedFriendIds((ids) => ids.filter((id) => id !== userId));
  }, []);

  const answerFriendRequest = useCallback(
    (requestId: string, status: "accepted" | "ignored") => {
      const request = currentUser.friendRequestsReceived.find(
        (item) => item.id === requestId || item.fromUserId === requestId
      );
      const fromUserId = request?.fromUserId;

      setHiddenRequestIds((ids) => (ids.includes(requestId) ? ids : [...ids, requestId]));

      if (status === "accepted" && fromUserId) {
        setAcceptedFriendIds((ids) => (ids.includes(fromUserId) ? ids : [...ids, fromUserId]));
        setRemovedFriendIds((ids) => ids.filter((id) => id !== fromUserId));
      }

      if (!isRemoteId(requestId)) {
        return;
      }

      void updateFriendRequestStatus(
        requestId,
        status,
        authSession?.access_token
      ).catch(() => undefined);
    },
    [authSession?.access_token, currentUser.friendRequestsReceived]
  );

  const hasRequested = useCallback(
    (userId: string) =>
      requestedUserIds.includes(userId) ||
      currentUser.friendRequestsSent.some(
        (request) => request.toUserId === userId && request.status !== "ignored"
      ),
    [currentUser.friendRequestsSent, requestedUserIds]
  );

  const blipPost = useCallback(
    (postId: string, ownerId: string) => {
      if (!canInteractWith(ownerId)) {
        return;
      }

      const basePost = posts.find((post) => post.id === postId);
      if (!basePost) {
        return;
      }

      const alreadyBlipped = blippedPostIds.includes(postId);
      const currentBlips = blipOverrides[postId] ?? basePost.blips;

      if (alreadyBlipped) {
        setBlipOverrides((values) => ({
          ...values,
          [postId]: Math.max(0, currentBlips - 1)
        }));
        setBlippedPostIds((ids) => ids.filter((id) => id !== postId));

        if (isRemoteId(postId) && isRemoteId(currentUser.id)) {
          void deletePostBlip(postId, currentUser.id, authSession?.access_token).catch(
            () => undefined
          );
        }

        return;
      }

      setBlipOverrides((values) => ({
        ...values,
        [postId]: currentBlips + 1
      }));
      setBlippedPostIds((ids) => [...ids, postId]);

      if (!isRemoteId(postId) || !isRemoteId(currentUser.id)) {
        return;
      }

      void createPostBlip(postId, currentUser.id, authSession?.access_token).catch(
        () => undefined
      );
    },
    [
      authSession?.access_token,
      blipOverrides,
      blippedPostIds,
      canInteractWith,
      currentUser.id,
      posts
    ]
  );

  const hasBlipped = useCallback(
    (postId: string) => blippedPostIds.includes(postId),
    [blippedPostIds]
  );

  const loadPostComments = useCallback(
    async (postId: string) => {
      if (!isRemoteId(postId) || commentsByPostId[postId]) {
        return;
      }

      try {
        const rows = await fetchPostComments(postId, authSession?.access_token);
        setCommentsByPostId((comments) => ({
          ...comments,
          [postId]: rows.map(mapCommentRow)
        }));
      } catch {
        setCommentsByPostId((comments) => ({
          ...comments,
          [postId]: comments[postId] ?? []
        }));
      }
    },
    [authSession?.access_token, commentsByPostId]
  );

  const addPostComment = useCallback(
    async (postId: string, ownerId: string, body: string) => {
      if (!canInteractWith(ownerId)) {
        return;
      }

      const localComment = makeLocalComment(currentUser, postId, body);
      setCommentsByPostId((comments) => ({
        ...comments,
        [postId]: [...(comments[postId] ?? []), localComment]
      }));

      const basePost = posts.find((post) => post.id === postId);
      setCommentOverrides((values) => ({
        ...values,
        [postId]: (values[postId] ?? basePost?.comments ?? 0) + 1
      }));

      if (!isRemoteId(postId) || !isRemoteId(currentUser.id)) {
        return;
      }

      try {
        const rows = await createPostComment(
          postId,
          currentUser.id,
          body,
          authSession?.access_token
        );
        if (rows[0]) {
          setCommentsByPostId((comments) => ({
            ...comments,
            [postId]: [
              ...(comments[postId] ?? []).filter((comment) => comment.id !== localComment.id),
              mapCommentRow(rows[0])
            ]
          }));
        }
      } catch {
        // Keep the optimistic prototype comment if RLS blocks the write.
      }
    },
    [authSession?.access_token, canInteractWith, currentUser, posts]
  );

  const sendThreadMessage = useCallback(
    async (threadId: string, body: string) => {
      const trimmed = body.trim();
      if (!trimmed) {
        return;
      }

      const localMessage = makeLocalMessage(currentUser.id, trimmed);
      setThreadMessageOverrides((messages) => ({
        ...messages,
        [threadId]: [...(messages[threadId] ?? []), localMessage]
      }));

      if (!isRemoteId(threadId) || !isRemoteId(currentUser.id)) {
        return;
      }

      void createMessage(
        threadId,
        currentUser.id,
        trimmed,
        authSession?.access_token
      ).catch(() => undefined);
    },
    [authSession?.access_token, currentUser.id]
  );

  const startThread = useCallback(
    (userId: string) => {
      if (!userId || userId === currentUser.id) {
        return null;
      }

      const existingThread = threads.find(
        (thread) =>
          thread.participantIds.includes(currentUser.id) &&
          thread.participantIds.includes(userId)
      );

      if (existingThread) {
        return existingThread.id;
      }

      const threadId = `local-thread-${currentUser.id}-${userId}-${Date.now()}`;
      const nextThread: MessageThread = {
        id: threadId,
        participantIds: [currentUser.id, userId],
        lastMessage: "new conversation",
        timestamp: "now",
        unreadCount: 0,
        messages: []
      };

      setLocalThreads((items) => [nextThread, ...items]);
      return threadId;
    },
    [currentUser.id, threads]
  );

  const replyToInstant = useCallback(
    async (userId: string, body: string) => {
      const trimmed = body.trim();
      if (!trimmed) {
        return null;
      }

      const message = `replied to your Instant: ${trimmed}`;
      const existingThread = threads.find(
        (thread) =>
          thread.participantIds.includes(currentUser.id) &&
          thread.participantIds.includes(userId)
      );

      if (existingThread) {
        await sendThreadMessage(existingThread.id, message);
        return existingThread.id;
      }

      const threadId = `local-thread-${currentUser.id}-${userId}-${Date.now()}`;
      const localMessage = makeLocalMessage(currentUser.id, message);
      const nextThread: MessageThread = {
        id: threadId,
        participantIds: [currentUser.id, userId],
        lastMessage: message,
        timestamp: "now",
        unreadCount: 0,
        messages: [localMessage]
      };

      setLocalThreads((items) => [nextThread, ...items]);
      return threadId;
    },
    [currentUser.id, sendThreadMessage, threads]
  );

  const persistSession = useCallback((session: SupabaseAuthSession) => {
    window.localStorage.setItem(authStorageKey, JSON.stringify(session));
    setAuthSession(session);
    setAuthStatus("authenticated");
  }, []);

  const signIn = useCallback(
    async (email: string, password: string) => {
      setAuthStatus("loading");
      setAuthError(null);

      try {
        const session = await signInWithPassword(email, password);
        await ensureProfileForSession(session);
        persistSession(session);
        setSnapshot(await loadSupabaseSnapshot(session.access_token));
      } catch (error) {
        setAuthStatus("idle");
        setAuthError(error instanceof Error ? error.message : "Could not sign in.");
      }
    },
    [persistSession]
  );

  const signUp = useCallback(
    async (email: string, password: string, username: string, displayName: string) => {
      setAuthStatus("loading");
      setAuthError(null);

      try {
        const session = await signUpWithPassword(email, password, {
          displayName,
          username
        });
        await ensureProfileForSession(session, { displayName, username });
        persistSession(session);
        setSnapshot(await loadSupabaseSnapshot(session.access_token));
      } catch (error) {
        setAuthStatus("idle");
        setAuthError(error instanceof Error ? error.message : "Could not create account.");
      }
    },
    [persistSession]
  );

  const signOut = useCallback(async () => {
    const token = authSession?.access_token;

    window.localStorage.removeItem(authStorageKey);
    window.localStorage.removeItem(storageKey);
    setAuthSession(null);
    setAuthStatus("idle");
    setAuthError(null);
    setHasStoredState(false);
    setAccentNameState(mockCurrentUser.accentColor);
    setIsPrivate(mockCurrentUser.isPrivate);
    setAllowExplore(mockCurrentUser.allowExplore);
    setFavoriteUserIds([]);
    setRequestedUserIds([]);
    setAcceptedFriendIds([]);
    setRemovedFriendIds([]);
    setBlipOverrides({});
    setCommentOverrides({});
    setPostEditOverrides({});
    setPinnedPostOverrides({});
    setBlippedPostIds([]);
    setHiddenPostIds([]);
    setDeletedPostIds([]);
    setDeletedInstantIds([]);
    setLocalPosts([]);
    setLocalInstants([]);
    setLocalThreads([]);
    setThreadMessageOverrides({});
    setProfileOverrides({});
    setSavedStickers([]);
    setUserNoteState("");
    setUserNoteExpiresAt(null);
    setCommentsByPostId({});
    setActiveInstantUserId(null);
    setComposerType(null);
    setEditorFilter("Bleach Bypass");
    setEditorAdjustments(defaultAdjustments);

    if (token) {
      await signOutSession(token).catch(() => undefined);
    }

    if (isSupabaseConfigured) {
      setSnapshot(await loadSupabaseSnapshot().catch(() => null));
    }
  }, [
    authSession?.access_token,
    mockCurrentUser.accentColor,
    mockCurrentUser.allowExplore,
    mockCurrentUser.isPrivate
  ]);

  const deactivateAccount = useCallback(async () => {
    setIsPrivate(true);
    setAllowExplore(false);
    setProfileOverrides((current) => ({
      ...current,
      isPrivate: true,
      allowExplore: false
    }));

    if (isRemoteId(currentUser.id)) {
      await updateProfile(
        currentUser.id,
        {
          is_private: true,
          allow_explore: false
        },
        authSession?.access_token
      ).catch(() => undefined);
    }

    await signOut();
  }, [authSession?.access_token, currentUser.id, signOut]);

  const addLocalPost = useCallback(
    (post: {
      type: "photo" | "video" | "text";
      content: string;
      imageUrl?: string;
      imageUrls?: string[];
      videoUrl?: string;
      caption?: string;
    }) => {
      const imageUrls = (post.imageUrls?.length ? post.imageUrls : post.imageUrl ? [post.imageUrl] : [])
        .filter(Boolean)
        .slice(0, 20);
      const newPost: Post = {
        id: `local-post-${Date.now()}`,
        userId: currentUser.id,
        type: post.type,
        content: post.content,
        imageUrl: imageUrls[0] ?? post.imageUrl,
        imageUrls: imageUrls.length > 1 ? imageUrls : undefined,
        videoUrl: post.videoUrl,
        caption: post.caption,
        blips: 0,
        comments: 0,
        isPinned: false,
        createdAt: "now",
        aspectRatio: post.type === "text" ? "square" : "free"
      };

      setLocalPosts((items) => [newPost, ...items]);

      if (!isRemoteId(currentUser.id)) {
        return;
      }

      void createRemotePost(
        {
          user_id: currentUser.id,
          type: post.type,
          content: post.content,
          image_url: imageUrls[0] ?? post.imageUrl ?? null,
          image_urls: imageUrls,
          video_url: post.videoUrl ?? null,
          caption: post.caption ?? null,
          aspect_ratio: post.type === "text" ? "square" : "free",
          is_pinned: false,
          visibility: allowExplore ? "public" : "friends"
        },
        authSession?.access_token
      ).catch(() => undefined);
    },
    [allowExplore, authSession?.access_token, currentUser.id]
  );

  const editPost = useCallback(
    (postId: string, updates: Partial<Post>) => {
      const imageUrls = updates.imageUrls?.filter(Boolean).slice(0, 20);
      const normalizedUpdates: Partial<Post> = {
        ...updates,
        imageUrls: imageUrls && imageUrls.length > 1 ? imageUrls : undefined,
        imageUrl: imageUrls?.[0] ?? updates.imageUrl
      };

      setLocalPosts((items) =>
        items.map((post) =>
          post.id === postId ? { ...post, ...normalizedUpdates } : post
        )
      );
      setPostEditOverrides((values) => ({
        ...values,
        [postId]: {
          ...(values[postId] ?? {}),
          ...normalizedUpdates
        }
      }));

      if (!isRemoteId(postId)) {
        return;
      }

      void updateRemotePost(
        postId,
        {
          caption: normalizedUpdates.caption,
          content: normalizedUpdates.content,
          image_url: normalizedUpdates.imageUrl ?? null,
          image_urls: imageUrls ?? []
        },
        authSession?.access_token
      ).catch(() => undefined);
    },
    [authSession?.access_token]
  );

  const createInstant = useCallback(
    (instant: {
      type: "photo" | "video" | "text";
      content: string;
      thumbnailUrl?: string;
      videoUrl?: string;
    }) => {
      const nextInstant: Instant = {
        id: `local-instant-${Date.now()}`,
        userId: currentUser.id,
        type: instant.type,
        content: instant.content,
        thumbnailUrl: instant.thumbnailUrl,
        videoUrl: instant.videoUrl,
        expiresAt: new Date(Date.now() + noteLifetimeMs).toISOString()
      };

      setLocalInstants((items) => [
        nextInstant,
        ...items.filter(isActiveInstant)
      ]);
      setActiveInstantUserId(currentUser.id);

      if (!isRemoteId(currentUser.id)) {
        return;
      }

      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      void createRemoteInstant(
        {
          user_id: currentUser.id,
          type: instant.type,
          content: instant.content,
          thumbnail_url: instant.thumbnailUrl ?? null,
          expires_at: expiresAt
        },
        authSession?.access_token
      ).catch(() => undefined);
    },
    [authSession?.access_token, currentUser.id]
  );

  const deleteInstant = useCallback((instantId: string) => {
    setLocalInstants((items) => items.filter((instant) => instant.id !== instantId));
    setDeletedInstantIds((ids) =>
      ids.includes(instantId) ? ids : [...ids, instantId]
    );

    if (!isRemoteId(instantId)) {
      return;
    }

    void deleteRemoteInstant(instantId, authSession?.access_token).catch(() => undefined);
  }, [authSession?.access_token]);

  const deletePost = useCallback((postId: string) => {
    setLocalPosts((items) => items.filter((post) => post.id !== postId));
    setDeletedPostIds((ids) => (ids.includes(postId) ? ids : [...ids, postId]));
    setHiddenPostIds((ids) => ids.filter((id) => id !== postId));

    if (!isRemoteId(postId)) {
      return;
    }

    void deleteRemotePost(postId, authSession?.access_token).catch(() => undefined);
  }, [authSession?.access_token]);

  const hidePost = useCallback((postId: string) => {
    setHiddenPostIds((ids) =>
      ids.includes(postId) ? ids.filter((id) => id !== postId) : [...ids, postId]
    );
  }, []);

  const pinPost = useCallback(
    (postId: string) => {
      const targetPost = posts.find(
        (post) => post.id === postId && post.userId === currentUser.id
      );

      if (!targetPost) {
        return;
      }

      setLocalPosts((items) =>
        items.map((post) => {
          if (post.id !== postId) {
            return post;
          }

          return { ...post, isPinned: !post.isPinned };
        })
      );
      setPinnedPostOverrides((values) => ({
        ...values,
        [postId]: !targetPost.isPinned
      }));

      if (isRemoteId(postId)) {
        void updateRemotePost(
          postId,
          { is_pinned: !targetPost.isPinned },
          authSession?.access_token
        ).catch(() => undefined);
      }
    },
    [authSession?.access_token, currentUser.id, posts]
  );

  const saveProfile = useCallback(
    async (updates: Partial<User>) => {
      const normalizedUpdates: Partial<User> = { ...updates };

      if (updates.displayName !== undefined) {
        normalizedUpdates.displayName = sanitizeDisplayName(
          updates.displayName,
          currentUser.username
        );
      }

      if (updates.username !== undefined) {
        normalizedUpdates.username = sanitizeUsername(
          updates.username,
          currentUser.username
        );
      }

      const shouldUploadProfileMedia =
        isRemoteId(currentUser.id) &&
        Boolean(authSession?.access_token) &&
        isSupabaseConfigured;
      const resolvedUpdates: Partial<User> = { ...normalizedUpdates };
      const nextAvatarUrl = normalizedUpdates.avatarUrl;
      const nextBannerUrl = normalizedUpdates.bannerUrl;

      if (
        shouldUploadProfileMedia &&
        typeof nextAvatarUrl === "string" &&
        isDataUrl(nextAvatarUrl)
      ) {
        resolvedUpdates.avatarUrl = await uploadProfileImage({
          accessToken: authSession?.access_token,
          dataUrl: nextAvatarUrl,
          kind: "avatar",
          userId: currentUser.id
        }).catch(() => nextAvatarUrl);
      }

      if (
        shouldUploadProfileMedia &&
        typeof nextBannerUrl === "string" &&
        isDataUrl(nextBannerUrl)
      ) {
        resolvedUpdates.bannerUrl = await uploadProfileImage({
          accessToken: authSession?.access_token,
          dataUrl: nextBannerUrl,
          kind: "banner",
          userId: currentUser.id
        }).catch(() => nextBannerUrl);
      }

      setProfileOverrides((current) => ({ ...current, ...resolvedUpdates }));

      if (!isRemoteId(currentUser.id)) {
        return;
      }

      await updateProfile(
        currentUser.id,
        {
          username: resolvedUpdates.username,
          display_name: resolvedUpdates.displayName,
          bio: resolvedUpdates.bio,
          avatar_url: resolvedUpdates.avatarUrl,
          banner_url: resolvedUpdates.bannerUrl,
          accent_color: resolvedUpdates.accentColor,
          is_private: resolvedUpdates.isPrivate,
          allow_explore: resolvedUpdates.allowExplore,
          profile_line: resolvedUpdates.location ?? resolvedUpdates.profileLine
        },
        authSession?.access_token
      ).catch(() => undefined);
    },
    [authSession?.access_token, currentUser.id, currentUser.username]
  );

  const saveSticker = useCallback((dataUrl: string) => {
    setSavedStickers((stickers) => (stickers.includes(dataUrl) ? stickers : [dataUrl, ...stickers]));
  }, []);

  const setUserNote = useCallback(
    (note: string) => {
      const trimmed = note.trim().slice(0, 30);

      if (!trimmed) {
        setUserNoteState("");
        setUserNoteExpiresAt(null);
        syncProfile({ note: null, note_expires_at: null });
        return;
      }

      const expiresAt = new Date(Date.now() + noteLifetimeMs).toISOString();
      setUserNoteState(trimmed);
      setUserNoteExpiresAt(expiresAt);
      syncProfile({ note: trimmed, note_expires_at: expiresAt });
    },
    [syncProfile]
  );

  const toggleFavoriteUser = useCallback((userId: string) => {
    setFavoriteUserIds((ids) =>
      ids.includes(userId) ? ids.filter((id) => id !== userId) : [userId, ...ids]
    );
  }, []);

  const isFavoriteUser = useCallback(
    (userId: string) => favoriteUserIds.includes(userId),
    [favoriteUserIds]
  );

  const openInstant = useCallback(
    (userId: string) => {
      if (getInstantForUser(userId)) {
        setActiveInstantUserId(userId);
      }
    },
    [getInstantForUser]
  );

  const closeInstant = useCallback(() => {
    setActiveInstantUserId(null);
  }, []);

  const openComposer = useCallback((type: Exclude<ComposerType, null>) => {
    setComposerType(type);
  }, []);

  const closeComposer = useCallback(() => {
    setComposerType(null);
  }, []);

  const setEditorAdjustment = useCallback(
    (name: EditorAdjustment, value: number) => {
      setEditorAdjustments((adjustments) => ({
        ...adjustments,
        [name]: value
      }));
    },
    []
  );

  const value = useMemo<AppStateValue>(
    () => ({
      users,
      posts,
      instants,
      threads,
      currentUser,
      accentOptions,
      accent,
      backendSource: dataset.source,
      backendReady,
      backendLoading,
      isGuest,
      authError,
      authSession,
      authStatus,
      favoriteUserIds,
      requestedUserIds,
      blippedPostIds,
      savedStickers,
      userNote,
      userNoteExpiresAt,
      activeInstantUserId,
      composerType,
      editorFilter,
      editorAdjustments,
      getUserById,
      getUserByUsername,
      getFriends,
      getInstantsForUser,
      getInstantForUser,
      getCommentsForPost,
      loadPostComments,
      addPostComment,
      sendThreadMessage,
      startThread,
      replyToInstant,
      answerFriendRequest,
      signIn,
      signUp,
      signOut,
      deactivateAccount,
      addLocalPost,
      editPost,
      createInstant,
      deleteInstant,
      deletePost,
      hidePost,
      pinPost,
      saveProfile,
      saveSticker,
      setUserNote,
      toggleFavoriteUser,
      isFavoriteUser,
      isFriend,
      isOwner,
      canInteractWith,
      effectiveUser,
      setAccentName,
      togglePrivate,
      toggleExplore,
      requestFriend,
      removeFriend,
      hasRequested,
      blipPost,
      hasBlipped,
      openInstant,
      closeInstant,
      openComposer,
      closeComposer,
      setEditorFilter,
      setEditorAdjustment
    }),
    [
      accent,
      activeInstantUserId,
      addLocalPost,
      addPostComment,
      answerFriendRequest,
      authError,
      authSession,
      authStatus,
      backendReady,
      backendLoading,
      isGuest,
      blippedPostIds,
      canInteractWith,
      closeComposer,
      closeInstant,
      composerType,
      currentUser,
      dataset.source,
      createInstant,
      deactivateAccount,
      deleteInstant,
      deletePost,
      editPost,
      editorAdjustments,
      editorFilter,
      effectiveUser,
      favoriteUserIds,
      getCommentsForPost,
      getFriends,
      getInstantsForUser,
      getInstantForUser,
      getUserById,
      getUserByUsername,
      hasBlipped,
      hasRequested,
      hidePost,
      instants,
      isFriend,
      isFavoriteUser,
      isOwner,
      loadPostComments,
      openComposer,
      openInstant,
      pinPost,
      posts,
      requestedUserIds,
      requestFriend,
      removeFriend,
      replyToInstant,
      savedStickers,
      saveProfile,
      saveSticker,
      sendThreadMessage,
      startThread,
      signIn,
      signOut,
      signUp,
      setAccentName,
      setEditorAdjustment,
      setUserNote,
      threads,
      toggleFavoriteUser,
      toggleExplore,
      togglePrivate,
      userNote,
      userNoteExpiresAt,
      users
    ]
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

function mergeRequests(
  existing: User["friendRequestsSent"],
  incoming: User["friendRequestsSent"]
) {
  const seen = new Set(existing.map((request) => request.toUserId));
  return [...existing, ...incoming.filter((request) => !seen.has(request.toUserId))];
}

export function useAppState() {
  const context = useContext(AppStateContext);

  if (!context) {
    throw new Error("useAppState must be used inside AppStateProvider.");
  }

  return context;
}
