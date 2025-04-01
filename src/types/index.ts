
export interface User {
  id: string;
  name: string;
  email: string;
  photoUrl: string;
  profilePhotoUrl?: string; // Added for compatibility with both photoUrl and profilePhotoUrl
  gender: string;
  joinedDate: number;
  signUpDate?: number; // Added field
  isBlocked: boolean;
  isBanned: boolean; // Changed from optional to required
  userName?: string; // Added field
  acceptMessages?: boolean; // Added field
  isNotificationsEnabled?: boolean; // Added field
}

export interface Song {
  id: string;
  name: string;
  songUrl: string;
  songPhoto: string;
  songLyrics: string;
  addTime: number;
  adRequired: boolean;
  visible: boolean;
}

export interface Wallpaper {
  id: string;
  wallpaperUrl: string;
  addTime: number;
  order?: number;
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  imageUrl?: string;
  actionUrl?: string;
  sent: boolean;
  sentAt: number;
  topic?: string; // Added topic field for FCM targeting
}

export interface Room {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  isLocked: boolean;
  createdAt: number;
  createdById: string;
  lastMessageTimestamp: number;
  creatorPhotoUrl?: string;
}

export interface AppUpdates {
  isEnabled: boolean;
  title: string;
  message: string;
  newVer: number;
  urlToOpen?: string;
  isCancelable: boolean;
}
