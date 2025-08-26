export interface BaseResource {
  id: number;
}

export interface NamedResource extends BaseResource {
  name: string;
}

export interface TitledResource extends BaseResource {
  title: string;
}

export interface UserResource extends BaseResource {
  username: string;
}

export interface Arc extends NamedResource {
  order: number;
  description: string;
  startChapter: number;
  endChapter: number;
}

export interface Chapter extends BaseResource {
  number: number;
  title: string;
  summary: string;
}

export interface Character extends NamedResource {
  alternateNames: string[];
  description: string;
  firstAppearanceChapter: number;
  notableRoles: string[];
  notableGames: string[];
  occupation: string;
  affiliations: string[];
}

export interface Event extends TitledResource {
  description: string;
  type: string;
  startChapter: number;
  endChapter: number;
  spoilerChapter: number;
  pageNumbers: number[];
  isVerified: boolean;
  chapterReferences: { chapterNumber: number; context: string }[];
}

export interface Faction extends NamedResource {
  description: string;
}

export interface Gamble extends NamedResource {
  rules: string;
  winCondition: string;
  chapterId: number;
}

export interface Guide extends TitledResource {
  description: string;
  content: string;
  status: string;
  viewCount: number;
  likeCount: number;
  authorId: number;
}

export interface Media extends BaseResource {
  url: string;
  type: string;
  description: string;
  status: string;
  rejectionReason: string;
  characterId: number;
  submittedById: number;
}

export interface Quote extends BaseResource {
  text: string;
  chapterNumber: number;
  description: string;
  pageNumber: number;
  characterId: number;
  seriesId: number;
  submittedById: number;
}

export interface Series extends NamedResource {
  order: number;
  description: string;
}

export interface Tag extends NamedResource {
  description: string;
}

export interface User extends UserResource {
  email: string;
  isEmailVerified: boolean;
  role: string;
  userProgress: number;
  profileImageId: string;
  favoriteQuoteId: number;
  favoriteGambleId: number;
}

export interface Volume extends BaseResource {
  number: number;
  coverUrl: string;
  startChapter: number;
  endChapter: number;
  description: string;
  seriesId: number;
}
