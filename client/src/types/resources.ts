// Resource type definitions for the Usogui fansite
// These types should match the server entities and be used for client-side data handling

export interface User {
  id: number;
  username: string;
  email: string;
  role: 'user' | 'moderator' | 'admin';
  createdAt: string;
  updatedAt: string;
}

export interface Series {
  id: number;
  title: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Volume {
  id: number;
  seriesId: number;
  series?: Series;
  volumeNumber: number;
  title?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Chapter {
  id: number;
  volumeId: number;
  volume?: Volume;
  chapterNumber: number;
  title?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Arc {
  id: number;
  title: string;
  description?: string;
  startChapter?: number;
  endChapter?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Character {
  id: number;
  name: string;
  description?: string;
  profileImage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Faction {
  id: number;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Event {
  id: number;
  title: string;
  description?: string;
  chapterId?: number;
  chapter?: Chapter;
  createdAt: string;
  updatedAt: string;
}

export interface Tag {
  id: number;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Quote {
  id: number;
  characterId: number;
  character?: Character;
  content: string;
  chapterId?: number;
  chapter?: Chapter;
  createdAt: string;
  updatedAt: string;
}

export interface Guide {
  id: number;
  title: string;
  content: string;
  authorId: number;
  author?: User;
  tags?: Tag[];
  createdAt: string;
  updatedAt: string;
  likes?: number;
}

export interface Media {
  id: number;
  title: string;
  url: string;
  type: 'fanart' | 'video';
  characterId?: number;
  character?: Character;
  arcId?: number;
  arc?: Arc;
  submittedById: number;
  submittedBy?: User;
  createdAt: string;
  updatedAt: string;
}

export interface Gamble {
  id: number;
  title: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GambleTeam {
  id: number;
  gambleId: number;
  gamble?: Gamble;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GambleRound {
  id: number;
  gambleId: number;
  gamble?: Gamble;
  roundNumber: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
}
