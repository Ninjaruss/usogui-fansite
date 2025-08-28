// API-related types for the Usogui fansite

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  perPage?: number;
  totalPages?: number;
}

export interface ApiError {
  message: string;
  statusCode: number;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  user: {
    id: number;
    username: string;
    email: string;
    role: string;
  };
}

export interface RefreshResponse {
  access_token: string;
  user: {
    id: number;
    username: string;
    email: string;
    role: string;
  };
}

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  role: string;
}

// User Profile Types
export interface UserProfile {
  id: number;
  username: string;
  email: string;
  role: string;
  isEmailVerified: boolean;
  userProgress: number;
  profileImageId: string | null;
  favoriteQuoteId: number | null;
  favoriteGambleId: number | null;
  profileImage: string | null;
  favoriteQuote: Quote | null;
  favoriteGamble: Gamble | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileRequest {
  favoriteQuoteId?: number | null;
  favoriteGambleId?: number | null;
  profileImageId?: string | null;
}

export interface Quote {
  id: number;
  text: string;
  character: {
    id: number;
    name: string;
  };
}

export interface Gamble {
  id: number;
  name: string;
  description: string;
}

// Guide Types
export interface CreateGuideRequest {
  title: string;
  description: string;
  content: string;
  status: 'draft' | 'published';
  tagNames?: string[];
}

export interface Guide {
  id: number;
  title: string;
  description: string;
  content: string;
  status: string;
  authorId: number;
  author: {
    id: number;
    username: string;
  };
  tags: Array<{
    id: number;
    name: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

// Media Types
export interface CreateMediaRequest {
  url: string;
  type: 'image' | 'video' | 'audio';
  description?: string;
  characterId?: number;
}

export interface Media {
  id: number;
  url: string;
  type: string;
  description: string | null;
  status: string;
  characterId: number | null;
  character: Character | null;
  submittedBy: {
    id: number;
    username: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Character {
  id: number;
  name: string;
}
