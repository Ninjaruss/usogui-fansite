// Usogui manga constants
// Total number of chapters in the manga series
export const MAX_CHAPTER = 539

// Expected number of volumes in the manga series (for data loading heuristics)
export const EXPECTED_VOLUME_COUNT = 49

// Layout constants
export const LAYOUT = {
  // Navigation
  NAVBAR_HEIGHT: 64,
  MOBILE_MENU_Z_INDEX: 1100,
  SEARCH_DROPDOWN_Z_INDEX: 1400,

  // Images
  CHARACTER_IMAGE_WIDTH: 200,
  THUMBNAIL_SIZE_SM: 80,
  THUMBNAIL_SIZE_MD: 120,
  THUMBNAIL_SIZE_LG: 160,

  // Cards
  CARD_BORDER_RADIUS: 12,
  CARD_PADDING: 24,

  // Spacing
  SECTION_GAP: 32,
  CARD_GAP: 16,

  // Animations
  TRANSITION_SHORT: 150,
  TRANSITION_STANDARD: 200,
  TRANSITION_LONG: 300,

  // Breakpoints (matching Mantine theme)
  BREAKPOINT_SM: 600,
  BREAKPOINT_MD: 900,
  BREAKPOINT_LG: 1200,
  BREAKPOINT_XL: 1536,
} as const

// Cache TTL values (in milliseconds)
export const CACHE_TTL = {
  MEDIA: 5 * 60 * 1000, // 5 minutes
  SHORT: 1 * 60 * 1000, // 1 minute
  LONG: 15 * 60 * 1000, // 15 minutes
} as const

// Retry configuration
export const RETRY_CONFIG = {
  MAX_RETRIES: 3,
  DELAYS: [1000, 2000, 4000], // Progressive backoff
} as const

// Admin dashboard constants
export const EVENT_TYPES = [
  { id: 'gamble', name: 'Gamble' },
  { id: 'decision', name: 'Decision' },
  { id: 'reveal', name: 'Reveal' },
  { id: 'shift', name: 'Shift' },
  { id: 'resolution', name: 'Resolution' },
] as const

export const FACTION_ROLES = [
  { id: 'leader', name: 'Leader' },
  { id: 'member', name: 'Member' },
  { id: 'supporter', name: 'Supporter' },
  { id: 'observer', name: 'Observer' },
] as const

// Source: Characters.tsx local constant + CharacterRelationships.tsx RelationshipType enum
export const RELATIONSHIP_TYPE_VALUES = [
  'ally', 'rival', 'mentor', 'subordinate', 'family', 'partner', 'enemy', 'acquaintance'
] as const

// Source: CharacterRelationships.tsx RelationshipType enum — { id, name } shape for SelectInput choices
export const RELATIONSHIP_TYPE_CHOICES = [
  { id: 'ally', name: 'Ally' },
  { id: 'rival', name: 'Rival' },
  { id: 'mentor', name: 'Mentor' },
  { id: 'subordinate', name: 'Subordinate' },
  { id: 'family', name: 'Family' },
  { id: 'partner', name: 'Partner' },
  { id: 'enemy', name: 'Enemy' },
  { id: 'acquaintance', name: 'Acquaintance' },
] as const

// Source: MediaUsageType entity enum
export const MEDIA_USAGE_TYPES = [
  { id: 'character_image', name: 'Character Image' },
  { id: 'volume_image', name: 'Volume Image' },
  { id: 'volume_showcase_background', name: 'Volume Showcase Background' },
  { id: 'volume_showcase_popout', name: 'Volume Showcase Popout' },
  { id: 'guide_image', name: 'Guide Image' },
  { id: 'gallery_upload', name: 'Gallery Upload' },
] as const

// Source: ProfilePictureType entity enum
export const PROFILE_PICTURE_TYPES = [
  { id: 'fluxer', name: 'Fluxer Avatar' },
  { id: 'character_media', name: 'Character Media' },
  { id: 'exclusive_artwork', name: 'Exclusive Artwork' },
] as const

export const USER_ROLES = [
  { id: 'user', name: 'User' },
  { id: 'moderator', name: 'Moderator' },
  { id: 'editor', name: 'Editor' },
  { id: 'admin', name: 'Admin' },
] as const
