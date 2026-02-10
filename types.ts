export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string;
  photoURL: string;
  instagramHandle?: string;
  interests: string[];
  bio?: string;
  createdAt: number;
}

export interface InterestTag {
  id: string;
  label: string;
  emoji: string;
}

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export const POPULAR_INTERESTS: InterestTag[] = [
  { id: 'travel', label: 'Travel', emoji: '✈️' },
  { id: 'foodie', label: 'Foodie', emoji: '🍕' },
  { id: 'gym', label: 'Fitness', emoji: '💪' },
  { id: 'music', label: 'Music', emoji: '🎵' },
  { id: 'art', label: 'Art', emoji: '🎨' },
  { id: 'tech', label: 'Tech', emoji: '💻' },
  { id: 'hiking', label: 'Hiking', emoji: '🥾' },
  { id: 'photography', label: 'Photography', emoji: '📸' },
  { id: 'gaming', label: 'Gaming', emoji: '🎮' },
  { id: 'movies', label: 'Movies', emoji: '🎬' },
  { id: 'books', label: 'Reading', emoji: '📚' },
  { id: 'pets', label: 'Pets', emoji: '🐾' },
];