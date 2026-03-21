export interface MediaItem {
  id: number
  url: string
  type: 'image' | 'video' | 'audio'
  description: string
  fileName?: string
  isUploaded?: boolean
  ownerType: 'character' | 'arc' | 'event' | 'gamble' | 'organization' | 'user'
  ownerId: number
  chapterNumber?: number
  purpose: 'gallery' | 'entity_display'
  submittedBy: { id: number; username: string }
  createdAt: string
  status?: string
  isApproved?: boolean
  // Entity relations — populated by the media list page API response
  character?: { id: number; name: string }
  arc?: { id: number; name: string }
  event?: { id: number; title: string }
  gamble?: { id: number; name: string }
  organization?: { id: number; name: string }
}
