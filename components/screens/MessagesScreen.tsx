"use client";

import Link from "next/link";
import { Check, MessageCircle, Plus, Search, Send, Users, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { AvatarRing } from "@/components/AvatarRing";
import { InstantRow } from "@/components/InstantRow";
import { VerifiedName } from "@/components/VerifiedName";
import { useAppState } from "@/state/AppState";

type MessagePanel = "requests" | "groups" | "new" | "create" | null;

export function MessagesScreen() {
  const router = useRouter();
  const { answerFriendRequest, currentUser, getFriends, getUserById, startThread, threads } =
    useAppState();
  const [panel, setPanel] = useState<MessagePanel>(null);
  const [openingChatUserId, setOpeningChatUserId] = useState<string | null>(null);
  const [handledRequests, setHandledRequests] = useState<string[]>([]);
  const [groupName, setGroupName] = useState("late night plans");
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([
    "user-jules",
    "user-mikey",
    "user-lena"
  ]);
  const [createdGroups, setCreatedGroups] = useState([
    {
      id: "group-show",
      name: "show crew",
      memberIds: ["user-maybexiv", "user-jules", "user-naivekid"],
      preview: "mikey sent the address"
    },
    {
      id: "group-mix",
      name: "new mix feedback",
      memberIds: ["user-soph", "user-naivekid", "user-wonderland"],
      preview: "3 new stickers"
    }
  ]);
  const friends = getFriends();
  const requestUsers = currentUser.friendRequestsReceived
    .filter((request) => !handledRequests.includes(request.id))
    .map((request) => getUserById(request.fromUserId))
    .filter(Boolean);

  const groupRows = useMemo(
    () =>
      createdGroups.map((group) => ({
        ...group,
        members: group.memberIds
          .map((memberId) => getUserById(memberId))
          .filter(Boolean)
      })),
    [createdGroups, getUserById]
  );

  function toggleMember(userId: string) {
    setSelectedMemberIds((ids) =>
      ids.includes(userId) ? ids.filter((id) => id !== userId) : [...ids, userId]
    );
  }

  function createGroup() {
    const trimmedName = groupName.trim() || "new group";
    setCreatedGroups((groups) => [
      {
        id: `group-${Date.now()}`,
        name: trimmedName,
        memberIds: selectedMemberIds,
        preview: "group ready"
      },
      ...groups
    ]);
    setPanel("groups");
  }

  async function openChat(userId: string) {
    setOpeningChatUserId(userId);
    try {
      const threadId = await startThread(userId);
      if (threadId) {
        router.push(`/messages/${threadId}`);
      }
    } finally {
      setOpeningChatUserId(null);
    }
  }

  return (
    <div className="screen">
      <AppHeader title="Messages" />
      <InstantRow users={friends.slice(5, 10).concat(friends.slice(0, 3))} notes />
      <section className="message-controls">
        <button
          type="button"
          className={panel === "requests" ? "active" : ""}
          onClick={() => setPanel(panel === "requests" ? null : "requests")}
        >
          <MessageCircle size={28} />
          <span>Requests</span>
          {requestUsers.length ? <i /> : null}
        </button>
        <button
          type="button"
          className={panel === "groups" ? "active" : ""}
          onClick={() => setPanel(panel === "groups" ? null : "groups")}
        >
          <Users size={28} />
          <span>Groups</span>
        </button>
        <button
          type="button"
          className={panel === "new" ? "active" : ""}
          onClick={() => setPanel(panel === "new" ? null : "new")}
        >
          <Send size={24} />
          <span>New chat</span>
        </button>
        <button
          type="button"
          className="create-group"
          onClick={() => setPanel(panel === "create" ? null : "create")}
        >
          <Plus size={22} />
          <span>Create group</span>
        </button>
      </section>
      {panel ? (
        <section className="message-panel">
          <div className="message-panel-head">
            <strong>
              {panel === "requests"
                ? "Message requests"
                : panel === "groups"
                  ? "Groups"
                  : panel === "new"
                    ? "New chat"
                    : "Create group"}
            </strong>
            <button type="button" onClick={() => setPanel(null)} aria-label="Close panel">
              <X size={20} />
            </button>
          </div>
          {panel === "requests" ? (
            <div className="request-list">
              {requestUsers.length ? (
                requestUsers.map((user) =>
                  user ? (
                    <div className="request-row" key={user.id}>
                      <AvatarRing user={user} size="md" />
                      <div>
                        <strong>
                          <VerifiedName user={user} />
                        </strong>
                        <span>@{user.username} wants to befriend you</span>
                      </div>
                      <button
                        type="button"
                        className="mini-action accept"
                        onClick={() => {
                          answerFriendRequest(
                            currentUser.friendRequestsReceived.find(
                              (request) => request.fromUserId === user.id
                            )?.id ?? user.id,
                            "accepted"
                          );
                          setHandledRequests((ids) => [
                            ...ids,
                            currentUser.friendRequestsReceived.find(
                              (request) => request.fromUserId === user.id
                            )?.id ?? user.id
                          ]);
                        }}
                      >
                        <Check size={17} /> Accept
                      </button>
                      <button
                        type="button"
                        className="mini-action"
                        onClick={() => {
                          answerFriendRequest(
                            currentUser.friendRequestsReceived.find(
                              (request) => request.fromUserId === user.id
                            )?.id ?? user.id,
                            "ignored"
                          );
                          setHandledRequests((ids) => [
                            ...ids,
                            currentUser.friendRequestsReceived.find(
                              (request) => request.fromUserId === user.id
                            )?.id ?? user.id
                          ]);
                        }}
                      >
                        Ignore
                      </button>
                    </div>
                  ) : null
                )
              ) : (
                <p className="panel-empty">No open requests.</p>
              )}
            </div>
          ) : null}
          {panel === "groups" ? (
            <div className="group-list">
              {groupRows.map((group) => (
                <div className="group-row" key={group.id}>
                  <div className="group-avatars">
                    {group.members.slice(0, 3).map((member) =>
                      member ? <AvatarRing key={member.id} user={member} size="sm" /> : null
                    )}
                  </div>
                  <div>
                    <strong>{group.name}</strong>
                    <span>{group.preview}</span>
                  </div>
                  <button type="button" className="mini-action accept">
                    Open
                  </button>
                </div>
              ))}
            </div>
          ) : null}
          {panel === "new" ? (
            <div className="request-list">
              {friends.length ? (
                friends.map((friend) => (
                  <div className="request-row" key={friend.id}>
                    <AvatarRing user={friend} size="md" />
                    <div>
                      <strong>
                        <VerifiedName user={friend} />
                      </strong>
                      <span>@{friend.username}</span>
                    </div>
                    <button
                      type="button"
                      className="mini-action accept"
                      disabled={openingChatUserId === friend.id}
                      onClick={() => void openChat(friend.id)}
                    >
                      <Send size={17} /> {openingChatUserId === friend.id ? "Opening..." : "Message"}
                    </button>
                  </div>
                ))
              ) : (
                <p className="panel-empty">Add friends to start a chat.</p>
              )}
            </div>
          ) : null}
          {panel === "create" ? (
            <div className="create-group-panel">
              <label className="group-name-field">
                <span>Group name</span>
                <input
                  value={groupName}
                  onChange={(event) => setGroupName(event.target.value)}
                />
              </label>
              <div className="group-search">
                <Search size={18} />
                <span>add friends</span>
              </div>
              <div className="member-picks">
                {friends.slice(0, 8).map((friend) => {
                  const selected = selectedMemberIds.includes(friend.id);
                  return (
                    <button
                      key={friend.id}
                      type="button"
                      className={selected ? "selected" : ""}
                      onClick={() => toggleMember(friend.id)}
                    >
                      <AvatarRing user={friend} size="sm" showInstant={false} />
                      <span>
                        <VerifiedName user={friend} />
                      </span>
                    </button>
                  );
                })}
              </div>
              <button type="button" className="blip-button" onClick={createGroup}>
                Create group
              </button>
            </div>
          ) : null}
        </section>
      ) : null}
      <section className="message-list">
        {threads.length ? (
          threads.map((thread) => {
            const otherUserId =
              thread.participantIds.find((id) => id !== currentUser.id) ?? currentUser.id;
            const otherUser = getUserById(otherUserId);
            if (!otherUser) {
              return null;
            }

            return (
              <Link href={`/messages/${thread.id}`} className="message-row" key={thread.id}>
                <span className={thread.unreadCount > 0 ? "unread-dot" : "unread-dot idle"} />
                <AvatarRing user={otherUser} size="md" />
                <div className="message-main">
                  <strong>
                    <VerifiedName user={otherUser} />
                  </strong>
                  <span>{thread.lastMessage}</span>
                </div>
                <div className="message-meta">
                  <span>{thread.timestamp}</span>
                  {thread.unreadCount > 0 ? <strong>{thread.unreadCount}</strong> : null}
                </div>
              </Link>
            );
          })
        ) : (
          <section className="empty-state">
            <h2>No messages yet.</h2>
            <p>Start a conversation when your friends join Blip.</p>
          </section>
        )}
      </section>
    </div>
  );
}
