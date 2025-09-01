export interface Arc {
  id: number;
  name: string;
  description: string;
  startChapter: number;
  endChapter: number;
  createdAt: string;
  updatedAt: string;
}

export interface Chapter {
  id: number;
  number: number;
  title: string;
  summary: string;
  series: { id: number; title: string };
  arc: { id: number; name: string };
  spoilers: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Character {
  id: number;
  name: string;
  description: string;
  alternateNames: string[];
  firstAppearanceChapter: number;
  notableRoles: string[];
  notableGames: string[];
  occupation: string;
  affiliations: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Event {
  id: number;
  title: string;
  description: string;
  startChapter: number;
  endChapter: number;
  type: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Faction {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface Team {
  id: number;
  name: string;
  members: string[];
  isWinner: boolean;
}

export interface Round {
  id: number;
  roundNumber: number;
  description: string;
  outcome: string;
}

export interface Gamble {
  id: number;
  name: string;
  rules: string;
  winCondition: string;
  chapterId: number;
  teams: Team[];
  rounds: Round[];
  observers: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Guide {
  id: number;
  title: string;
  description: string;
  content: string;
  author: {
    id: number;
    username: string;
  };
  tags: {
    id: number;
    name: string;
  }[];
  viewCount: number;
  likeCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Media {
  id: number;
  url: string;
  type: string;
  description: string;
  character?: {
    id: number;
    name: string;
  };
  submittedBy: {
    id: number;
    username: string;
  };
  createdAt: string;
}

export interface Quote {
  id: number;
  text: string;
  description: string;
  character: {
    id: number;
    name: string;
  };
  series: {
    id: number;
    title: string;
  };
  chapter: {
    id: number;
    number: number;
  };
  submittedBy: {
    id: number;
    username: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Series {
  id: number;
  name: string;
  order: number;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface Volume {
  id: number;
  number: number;
  title: string;
  description: string;
  coverImage: string;
  releaseDate: string;
  chapters: number[];
  createdAt: string;
  updatedAt: string;
}
