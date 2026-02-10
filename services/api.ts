import { UserProfile, Post, Comment } from '../types';

/**
 * API SERVICE (REAL BACKEND)
 * 
 * connects to the local Node.js server running on port 5000
 * which connects to MongoDB Atlas.
 */

const API_BASE = 'http://localhost:5000/api';

export const api = {
  auth: {
    signup: async (email: string, password: string): Promise<{ user: { uid: string, email: string } }> => {
      try {
        const response = await fetch(`${API_BASE}/auth/signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Signup failed');
        }

        return data;
      } catch (error) {
        console.error("Signup API Error:", error);
        throw error;
      }
    },

    login: async (email: string, password: string): Promise<{ user: { uid: string, email: string } }> => {
      try {
        const response = await fetch(`${API_BASE}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Login failed');
        }

        return data;
      } catch (error) {
        console.error("Login API Error:", error);
        throw error; // Re-throw to be handled by UI
      }
    }
  },

  profile: {
    get: async (uid: string): Promise<UserProfile | null> => {
      try {
        const response = await fetch(`${API_BASE}/profile/${uid}`);
        if (!response.ok) {
          // If 404 or other error, assume no profile or handle gracefully
          return null;
        }
        const data = await response.json();
        return data;
      } catch (error) {
        console.error("Get Profile API Error:", error);
        return null;
      }
    },

    createOrUpdate: async (uid: string, data: Partial<UserProfile>): Promise<void> => {
      try {
        const response = await fetch(`${API_BASE}/profile/${uid}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || 'Failed to update profile');
        }
      } catch (error) {
        console.error("Update Profile API Error:", error);
        throw error;
      }
    }
  },

  posts: {
    create: async (postData: Partial<Post>): Promise<void> => {
      try {
        const response = await fetch(`${API_BASE}/posts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(postData),
        });
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to create post');
        }
      } catch (error) {
        console.error("Create Post Error:", error);
        throw error;
      }
    },
    getAll: async (): Promise<Post[]> => {
      try {
        const response = await fetch(`${API_BASE}/posts`);
        if (!response.ok) return [];
        return await response.json();
      } catch (error) {
        console.error("Get Posts Error:", error);
        return [];
      }
    },
    getUserPosts: async (uid: string): Promise<Post[]> => {
      try {
        const response = await fetch(`${API_BASE}/posts/user/${uid}`);
        if (!response.ok) return [];
        return await response.json();
      } catch (error) {
        console.error("Get User Posts Error:", error);
        return [];
      }
    },
    getPost: async (postId: string): Promise<Post | null> => {
      try {
        const response = await fetch(`${API_BASE}/posts/${postId}`);
        if (!response.ok) return null;
        return await response.json();
      } catch (error) {
        console.error("Get Single Post Error:", error);
        return null;
      }
    },
    updatePost: async (postId: string, uid: string, content: string, imageURL?: string | null): Promise<void> => {
      try {
        const response = await fetch(`${API_BASE}/posts/${postId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uid, content, imageURL }),
        });
        if (!response.ok) {
          throw new Error("Failed to update post");
        }
      } catch (error) {
        console.error("Update Post Error:", error);
        throw error;
      }
    },
    deletePost: async (postId: string, uid: string): Promise<void> => {
      try {
        const response = await fetch(`${API_BASE}/posts/${postId}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uid }),
        });
        if (!response.ok) {
          throw new Error("Failed to delete post");
        }
      } catch (error) {
        console.error("Delete Post Error:", error);
        throw error;
      }
    },
    toggleLike: async (postId: string, uid: string): Promise<{ likes: number, likedBy: string[] }> => {
      try {
        const response = await fetch(`${API_BASE}/posts/${postId}/like`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uid }),
        });
        if (!response.ok) throw new Error("Failed to toggle like");
        return await response.json();
      } catch (error) {
        console.error("Toggle Like Error:", error);
        throw error;
      }
    },
    addComment: async (postId: string, uid: string, text: string): Promise<Comment> => {
      try {
        const response = await fetch(`${API_BASE}/posts/${postId}/comment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uid, text }),
        });
        if (!response.ok) throw new Error("Failed to add comment");
        return await response.json();
      } catch (error) {
        console.error("Add Comment Error:", error);
        throw error;
      }
    }
  }
};