import { UserProfile } from '../types';

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
  }
};