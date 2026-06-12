import type { MessageThread } from "./types";

export const mockThreads: MessageThread[] = [
  {
    id: "thread-maybexiv",
    participantIds: ["user-racer", "user-maybexiv"],
    lastMessage: "u coming to the show tmrw?",
    timestamp: "13:47",
    unreadCount: 2,
    messages: [
      {
        id: "msg-1",
        senderId: "user-maybexiv",
        type: "text",
        content: "hey you up?",
        createdAt: "11:42"
      },
      {
        id: "msg-2",
        senderId: "user-racer",
        type: "text",
        content: "just saw this!",
        createdAt: "11:43",
        status: "read"
      },
      {
        id: "msg-3",
        senderId: "user-maybexiv",
        type: "text",
        content: "i found this spot last night",
        createdAt: "11:45"
      },
      {
        id: "msg-4",
        senderId: "user-maybexiv",
        type: "image",
        content: "city skyline",
        imageUrl: "/assets/photo-skyline.svg",
        createdAt: "11:45"
      },
      {
        id: "msg-5",
        senderId: "user-racer",
        type: "text",
        content: "that view",
        createdAt: "11:45",
        status: "read"
      },
      {
        id: "msg-6",
        senderId: "user-maybexiv",
        type: "song",
        content: "Naive",
        songTitle: "Naive",
        artistName: "The Kooks",
        albumArtUrl: "/assets/album-naive.svg",
        createdAt: "11:46"
      },
      {
        id: "msg-7",
        senderId: "user-racer",
        type: "text",
        content: "love this song",
        createdAt: "11:47",
        status: "read"
      },
      {
        id: "msg-8",
        senderId: "user-maybexiv",
        type: "note",
        content: "let's make late nights\nand overthinking our thing",
        createdAt: "11:48"
      },
      {
        id: "msg-9",
        senderId: "user-racer",
        type: "text",
        content: "always",
        createdAt: "11:48",
        status: "read"
      }
    ]
  },
  {
    id: "thread-lxvender",
    participantIds: ["user-racer", "user-lxvender"],
    lastMessage: "sent you a photo",
    timestamp: "13:32",
    unreadCount: 1,
    messages: [
      {
        id: "lx-1",
        senderId: "user-lxvender",
        type: "image",
        content: "mirror",
        imageUrl: "/assets/photo-bathroom.svg",
        createdAt: "13:32"
      }
    ]
  },
  {
    id: "thread-jules",
    participantIds: ["user-racer", "user-jules"],
    lastMessage: "that song is so good",
    timestamp: "12:58",
    unreadCount: 0,
    messages: [
      {
        id: "ju-1",
        senderId: "user-jules",
        type: "text",
        content: "that song is so good",
        createdAt: "12:58"
      }
    ]
  },
  {
    id: "thread-tyler",
    participantIds: ["user-racer", "user-tyler"],
    lastMessage: "yeah totally, let's go",
    timestamp: "12:21",
    unreadCount: 0,
    messages: [
      {
        id: "ty-1",
        senderId: "user-tyler",
        type: "text",
        content: "yeah totally, let's go",
        createdAt: "12:21"
      }
    ]
  },
  {
    id: "thread-naivekid",
    participantIds: ["user-racer", "user-naivekid"],
    lastMessage: "new mix just dropped",
    timestamp: "11:35",
    unreadCount: 3,
    messages: [
      {
        id: "na-1",
        senderId: "user-naivekid",
        type: "song",
        content: "Soft Static",
        songTitle: "Soft Static",
        artistName: "naivekid",
        albumArtUrl: "/assets/album-static.svg",
        createdAt: "11:35"
      }
    ]
  },
  {
    id: "thread-dreamscape",
    participantIds: ["user-racer", "user-dreamscape"],
    lastMessage: "see u tonight",
    timestamp: "Yesterday",
    unreadCount: 0,
    messages: [
      {
        id: "dr-1",
        senderId: "user-dreamscape",
        type: "text",
        content: "see u tonight",
        createdAt: "Yesterday"
      }
    ]
  },
  {
    id: "thread-wonderland",
    participantIds: ["user-racer", "user-wonderland"],
    lastMessage: "hahaha facts",
    timestamp: "Yesterday",
    unreadCount: 0,
    messages: [
      {
        id: "wo-1",
        senderId: "user-wonderland",
        type: "text",
        content: "hahaha facts",
        createdAt: "Yesterday"
      }
    ]
  }
];
