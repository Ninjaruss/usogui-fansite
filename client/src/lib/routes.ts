/**
 * Centralized route configuration for the Usogui Database
 * Use these helpers instead of hardcoding route strings to prevent typos
 * and make refactoring easier.
 */

export const routes = {
  // Home
  home: () => '/',

  // Characters
  characters: () => '/characters',
  character: (id: number | string) => `/characters/${id}`,

  // Arcs
  arcs: () => '/arcs',
  arc: (id: number | string) => `/arcs/${id}`,

  // Volumes
  volumes: () => '/volumes',
  volume: (id: number | string) => `/volumes/${id}`,

  // Chapters
  chapters: () => '/chapters',
  chapter: (id: number | string) => `/chapters/${id}`,

  // Gambles
  gambles: () => '/gambles',
  gamble: (id: number | string) => `/gambles/${id}`,

  // Events
  events: () => '/events',
  event: (id: number | string) => `/events/${id}`,

  // Organizations
  organizations: () => '/organizations',
  organization: (id: number | string) => `/organizations/${id}`,

  // Guides
  guides: (params?: { author?: number; authorName?: string }) => {
    if (params?.author) {
      const searchParams = new URLSearchParams()
      searchParams.set('author', params.author.toString())
      if (params.authorName) {
        searchParams.set('authorName', params.authorName)
      }
      return `/guides?${searchParams.toString()}`
    }
    return '/guides'
  },
  guide: (id: number | string) => `/guides/${id}`,
  submitGuide: () => '/submit-guide',

  // Media
  media: (params?: { ownerType?: string; ownerId?: number }) => {
    if (params?.ownerType && params?.ownerId) {
      return `/media?ownerType=${params.ownerType}&ownerId=${params.ownerId}`
    }
    return '/media'
  },
  submitMedia: () => '/submit-media',

  // Quotes
  quotes: () => '/quotes',

  // Users
  users: () => '/users',
  user: (id: number | string) => `/users/${id}`,

  // Profile
  profile: () => '/profile',

  // Authentication
  login: () => '/login',
  register: () => '/register',

  // Utility
  search: (query?: string) => query ? `/search?q=${encodeURIComponent(query)}` : '/search',
  about: () => '/about',
  disclaimer: () => '/disclaimer',

  // Admin (for reference, not public)
  admin: () => '/admin',
} as const

/**
 * Entity type to route mapping for dynamic navigation
 */
export const entityRoutes = {
  character: routes.character,
  arc: routes.arc,
  volume: routes.volume,
  chapter: routes.chapter,
  gamble: routes.gamble,
  event: routes.event,
  organization: routes.organization,
  guide: routes.guide,
  user: routes.user,
} as const

export type EntityType = keyof typeof entityRoutes

/**
 * Get the list route for an entity type
 */
export function getEntityListRoute(entityType: EntityType): string {
  const listRoutes: Record<EntityType, string> = {
    character: routes.characters(),
    arc: routes.arcs(),
    volume: routes.volumes(),
    chapter: routes.chapters(),
    gamble: routes.gambles(),
    event: routes.events(),
    organization: routes.organizations(),
    guide: routes.guides(),
    user: routes.users(),
  }
  return listRoutes[entityType]
}

/**
 * Get the detail route for an entity
 */
export function getEntityDetailRoute(entityType: EntityType, id: number | string): string {
  return entityRoutes[entityType](id)
}
