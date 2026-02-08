export interface User {
  id: number;
  username: string;
  email: string;
  role: 'user' | 'moderator' | 'admin';
  createdAt: string;
  updatedAt: string;
}

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
  title?: string | null;
  summary?: string | null;
  description?: string | null;
  series?: { id: number; title: string } | null;
  arc?: { id: number; name: string } | null;
  volumeId?: number | null;
  volume?: {
    id: number;
    number: number;
    title?: string | null;
  } | null;
  spoilers?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Character {
  id: number;
  name: string;
  description: string;
  backstory?: string;
  alternateNames: string[];
  firstAppearanceChapter: number;
  createdAt: string;
  updatedAt: string;
}

export interface Event {
  id: number;
  title: string;
  description: string;
  chapterNumber: number;
  spoilerChapter?: number;
  type: 'gamble' | 'decision' | 'reveal' | 'shift' | 'resolution';
  status: EventStatus;
  rejectionReason?: string | null;
  gambleId?: number;
  gamble?: Gamble;
  arcId?: number;
  arc?: {
    id: number;
    name: string;
  };
  characters: Array<{
    id: number;
    name: string;
  }>;
  tags?: Array<{
    id: number;
    name: string;
  }>;
  createdBy?: {
    id: number;
    username: string;
  };
  createdAt: string;
  updatedAt: string;
}

export enum BadgeType {
  SUPPORTER = 'supporter',
  ACTIVE_SUPPORTER = 'active_supporter',
  SPONSOR = 'sponsor',
  CUSTOM = 'custom',
}

export interface Badge {
  id: number;
  name: string;
  description: string | null;
  type: BadgeType;
  icon: string;
  color: string;
  backgroundColor: string | null;
  displayOrder: number;
  isActive: boolean;
  isManuallyAwardable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserBadge {
  id: number;
  userId: number;
  badgeId: number;
  awardedAt: string;
  expiresAt: string | null;
  year: number | null;
  reason: string | null;
  isActive: boolean;
  revokedAt?: string | null;
  revokedReason?: string | null;
  awardedByUserId?: number | null;
  revokedByUserId?: number | null;
  revokedBy?: User | null;
  badge: Badge;
  metadata?: any;
}

export interface Donation {
  id: number;
  userId: number | null;
  amount: number;
  currency: string;
  donationDate: string;
  provider: 'kofi' | 'manual';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  message: string | null;
  donorName: string | null;
  isAnonymous: boolean;
}

export interface Organization {
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
  description?: string;
  rules: string;
  winCondition?: string;
  explanation?: string;
  chapterId: number;
  participants?: Character[];
  createdAt: string;
  updatedAt: string;
}

export enum GuideStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}
export enum EventStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum AnnotationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum AnnotationOwnerType {
  CHARACTER = 'character',
  GAMBLE = 'gamble',
  ARC = 'arc',
}

export interface Annotation {
  id: number;
  ownerType: AnnotationOwnerType;
  ownerId: number;
  title: string;
  content: string;
  sourceUrl: string | null;
  chapterReference: number | null;
  isSpoiler: boolean;
  spoilerChapter: number | null;
  status: AnnotationStatus;
  rejectionReason: string | null;
  authorId: number;
  author: {
    id: number;
    username: string;
    discordAvatar?: string | null;
    profilePictureType?: string | null;
    selectedCharacterMediaId?: number | null;
  };
  createdAt: string;
  updatedAt: string;
}

export interface UserContributions {
  userId: number;
  username: string;
  submissions: {
    guides: number;
    media: number;
    annotations: number;
    quotes: number;
    total: number;
  };
  edits: {
    characters: number;
    gambles: number;
    arcs: number;
    organizations: number;
    events: number;
    total: number;
  };
  totalContributions: number;
}

export interface Guide {
  id: number;
  title: string;
  description: string;
  content: string;
  status: GuideStatus;
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
  rejectionReason?: string | null;
}

export interface Media {
  id: string; // UUID
  url: string;
  type: string;
  description: string;
  key?: string; // B2 object key
  mimeType?: string;
  fileSize?: number;
  width?: number;
  height?: number;
  usageType?: 'character_image' | 'guide_image' | 'gallery_upload';
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

export enum RelationshipType {
  ALLY = 'ally',
  RIVAL = 'rival',
  MENTOR = 'mentor',
  SUBORDINATE = 'subordinate',
  FAMILY = 'family',
  PARTNER = 'partner',
  ENEMY = 'enemy',
  ACQUAINTANCE = 'acquaintance',
}

export interface CharacterRelationship {
  id: number;
  sourceCharacterId: number;
  sourceCharacter?: {
    id: number;
    name: string;
  };
  targetCharacterId: number;
  targetCharacter?: {
    id: number;
    name: string;
  };
  relationshipType: RelationshipType;
  description: string | null;
  startChapter: number;
  endChapter: number | null;
  spoilerChapter: number;
  createdAt: string;
  updatedAt: string;
}

export interface CharacterOrganization {
  id: number;
  characterId: number;
  character?: {
    id: number;
    name: string;
  };
  organizationId: number;
  organization?: {
    id: number;
    name: string;
    description?: string;
  };
  role: string;
  startChapter: number;
  endChapter: number | null;
  spoilerChapter: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}
