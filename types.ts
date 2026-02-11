export interface Location {
  lat: number;
  lng: number;
  name?: string;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string;
  photoURL: string;
  instagramHandle?: string;
  interests: string[];
  bio?: string;
  createdAt: number;
  lastLocation?: Location;
  friends?: string[];
  incomingRequests?: string[];
  outgoingRequests?: string[];
}

export interface Comment {
  id: string;
  uid: string;
  authorName: string;
  authorPhoto: string;
  text: string;
  createdAt: number;
}

export interface Post {
  _id?: string;
  uid: string;
  authorName: string;
  authorPhoto: string;
  content: string;
  imageURL?: string;
  likes: number;
  likedBy?: string[];
  comments?: Comment[];
  createdAt: number;
  location?: Location;
}

export interface Notification {
  _id: string;
  type: 'friend_request' | 'friend_accept' | 'like' | 'comment';
  fromUid: string;
  fromName: string;
  fromPhoto: string;
  toUid: string;
  postId?: string;
  read: boolean;
  createdAt: number;
}

export interface Message {
  _id: string;
  fromUid: string;
  toUid: string;
  text: string;
  read?: boolean;
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