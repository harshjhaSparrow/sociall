import { Message, Notification, Post, UserProfile } from "../types";

/**
 * API SERVICE
 *
 * Communicates with the Node.js/MongoDB backend.
 */

const PORT = 5000;
const getBaseUrl = () => {
  const { hostname } = window.location;
  // If running on localhost or loopback, point to localhost
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return `http://localhost:${PORT}/api`;
  }
  // If running on a network IP (e.g. 192.168.x.x) for mobile testing, try to reach server on that IP
  return `http://${hostname}:${PORT}/api`;
};

const API_BASE = getBaseUrl();

export const api = {
  auth: {
    signup: async (email: string, password: string) => {
      const response = await fetch(`${API_BASE}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Signup failed");
      return data;
    },

    login: async (email: string, password: string) => {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Login failed");
      return data;
    },

    googleLogin: async (
      email: string,
      displayName: string,
      photoURL: string,
    ) => {
      const response = await fetch(`${API_BASE}/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, displayName, photoURL }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Google Login failed");
      return data;
    },
  },

  profile: {
    get: async (uid: string) => {
      try {
        const response = await fetch(`${API_BASE}/profile/${uid}`);
        if (!response.ok) return null;
        return await response.json();
      } catch (error) {
        console.error("Failed to fetch profile:", error);
        return null;
      }
    },

    getBatch: async (uids: string[]) => {
      try {
        const response = await fetch(`${API_BASE}/profiles/batch`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uids }),
        });
        if (!response.ok) return [];
        return await response.json();
      } catch (error) {
        console.error("Failed to fetch batch profiles:", error);
        return [];
      }
    },

    getAllWithLocation: async () => {
      try {
        const response = await fetch(`${API_BASE}/profiles`);
        if (!response.ok) return [];
        return await response.json();
      } catch (error) {
        console.error("Failed to fetch profiles:", error);
        return [];
      }
    },

    createOrUpdate: async (uid: string, data: Partial<UserProfile>) => {
      const response = await fetch(`${API_BASE}/profile/${uid}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update profile");
    },
  },

  friends: {
    sendRequest: async (fromUid: string, toUid: string) => {
      const response = await fetch(`${API_BASE}/friends/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromUid, toUid }),
      });
      if (!response.ok) throw new Error("Failed to send request");
    },
    acceptRequest: async (userUid: string, requesterUid: string) => {
      const response = await fetch(`${API_BASE}/friends/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userUid, requesterUid }),
      });
      if (!response.ok) throw new Error("Failed to accept request");
    },
    rejectRequest: async (userUid: string, requesterUid: string) => {
      const response = await fetch(`${API_BASE}/friends/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userUid, requesterUid }),
      });
      if (!response.ok) throw new Error("Failed to reject request");
    },
    removeFriend: async (uid1: string, uid2: string) => {
      const response = await fetch(`${API_BASE}/friends/remove`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid1, uid2 }),
      });
      if (!response.ok) throw new Error("Failed to remove friend");
    },
  },

  chat: {
    send: async (
      fromUid: string,
      toUid: string,
      text: string,
    ): Promise<Message> => {
      const response = await fetch(`${API_BASE}/chat/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromUid, toUid, text }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error("Failed to send");
      return data;
    },
    getHistory: async (uid1: string, uid2: string): Promise<Message[]> => {
      try {
        const response = await fetch(
          `${API_BASE}/chat/history/${uid1}/${uid2}`,
        );
        if (!response.ok) return [];
        return await response.json();
      } catch (error) {
        console.error("Failed to fetch chat history:", error);
        return [];
      }
    },
    getInbox: async (uid: string) => {
      try {
        const response = await fetch(`${API_BASE}/chat/inbox/${uid}`);
        if (!response.ok) return [];
        return await response.json();
      } catch (e) {
        console.error("Failed to fetch inbox:", e);
        return [];
      }
    },
    markRead: async (myUid: string, partnerUid: string) => {
      try {
        await fetch(`${API_BASE}/chat/mark-read`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ myUid, partnerUid }),
        });
      } catch (e) {
        console.error("Failed to mark read:", e);
      }
    },
    getUnreadCount: async (uid: string): Promise<number> => {
      try {
        const response = await fetch(`${API_BASE}/chat/unread-count/${uid}`);
        if (!response.ok) return 0;
        const data = await response.json();
        return data.count || 0;
      } catch (e) {
        return 0;
      }
    },
    subscribe: (uid: string, onMessage: (msg: Message) => void) => {
      // --- WebSocket Implementation ---
      const { hostname, protocol } = window.location;
      const wsProtocol = protocol === "https:" ? "wss:" : "ws:";
      // Construct WS URL, defaulting to localhost:5000 if running locally or IP
      // If api.ts defines PORT=5000, we use that.
      const wsUrl = `${wsProtocol}//${hostname}:${PORT}?uid=${uid}`;

      let socket: WebSocket | null = null;
      let keepAliveInterval: any;

      const connect = () => {
        console.log("Connecting to WS:", wsUrl);
        socket = new WebSocket(wsUrl);

        socket.onopen = () => {
          // Send a ping every 30s to keep connection alive
          keepAliveInterval = setInterval(() => {
            if (socket?.readyState === WebSocket.OPEN) {
              socket.send(JSON.stringify({ type: "ping" }));
            }
          }, 30000);
        };

        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === "ping" || data.type === "pong") return;
            onMessage(data);
          } catch (e) {
            console.error("WS Parse Error", e);
          }
        };

        socket.onclose = () => {
          clearInterval(keepAliveInterval);
        };
      };

      connect();

      return () => {
        if (socket) socket.close();
        clearInterval(keepAliveInterval);
      };
    },
  },

  notifications: {
    get: async (uid: string): Promise<Notification[]> => {
      try {
        const response = await fetch(`${API_BASE}/notifications/${uid}`);
        if (!response.ok) return [];
        return await response.json();
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
        return [];
      }
    },
    markRead: async (notificationIds: string[]) => {
      try {
        await fetch(`${API_BASE}/notifications/mark-read`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notificationIds }),
        });
      } catch (e) {
        console.error("Failed to mark notifications read:", e);
      }
    },
  },

  posts: {
    create: async (postData: Partial<Post>) => {
      const response = await fetch(`${API_BASE}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(postData),
      });
      if (!response.ok) throw new Error("Failed to create post");
    },
    getAll: async () => {
      try {
        const response = await fetch(`${API_BASE}/posts`);
        if (!response.ok) return [];
        return await response.json();
      } catch (error) {
        console.error("Failed to fetch posts:", error);
        return [];
      }
    },
    getUserPosts: async (uid: string) => {
      try {
        const response = await fetch(`${API_BASE}/posts/user/${uid}`);
        if (!response.ok) return [];
        return await response.json();
      } catch (error) {
        console.error("Failed to fetch user posts:", error);
        return [];
      }
    },
    getPost: async (postId: string) => {
      try {
        const response = await fetch(`${API_BASE}/posts/${postId}`);
        if (!response.ok) return null;
        return await response.json();
      } catch (error) {
        console.error("Failed to fetch post:", error);
        return null;
      }
    },
    updatePost: async (
      postId: string,
      uid: string,
      content: string,
      imageURL?: string | null,
    ) => {
      const response = await fetch(`${API_BASE}/posts/${postId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, content, imageURL }),
      });
      if (!response.ok) throw new Error("Failed to update post");
    },
    deletePost: async (postId: string, uid: string) => {
      const response = await fetch(`${API_BASE}/posts/${postId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid }),
      });
      if (!response.ok) throw new Error("Failed to delete post");
    },
    toggleLike: async (postId: string, uid: string) => {
      const response = await fetch(`${API_BASE}/posts/${postId}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid }),
      });
      if (!response.ok) throw new Error("Failed to toggle like");
      return await response.json();
    },
    addComment: async (postId: string, uid: string, text: string) => {
      const response = await fetch(`${API_BASE}/posts/${postId}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, text }),
      });
      if (!response.ok) throw new Error("Failed to add comment");
      return await response.json();
    },
  },
};
