import { DataProvider, HttpError } from 'react-admin'
import { api } from '../../lib/api'

// Function to clean update data by removing read-only fields and relationship objects
const cleanUpdateData = (resource: string, data: Record<string, unknown>) => {
  const cleaned = { ...data }
  
  // Common relationship fields to remove (these are populated by the server)
  const relationshipFields = [
    'user', 'author', 'character', 'characters', 'chapter', 'chapters', 'arc', 'arcs',
    'gamble', 'gambles', 'event', 'events', 'organization', 'organizations', 'tag', 'tags',
    'quote', 'quotes', 'volume', 'volumes', 'submittedBy', 'profileImage', 'likes',
    'users', 'chapters', 'volumes', 'teams', 'rounds', 'observers', 'members',
    'winner', 'media', 'guides'
  ]
  
  relationshipFields.forEach(field => {
    delete cleaned[field]
  })
  
  // Resource-specific cleaning
  if (resource === 'events') {
    // Keep only the fields that are allowed in the CreateEventDto/UpdateEventDto
    const allowedFields = [
      'title', 'description', 'type', 'status', 'arcId', 'gambleId', 
      'chapterNumber', 'spoilerChapter', 'characterIds'
    ]
    
    const eventCleaned: Record<string, unknown> = {}
    allowedFields.forEach(field => {
      if (cleaned[field] !== undefined) {
        eventCleaned[field] = cleaned[field]
      }
    })
    
    // Handle characterIds - ReferenceArrayInput might set this as objects or IDs
    if (eventCleaned.characterIds && Array.isArray(eventCleaned.characterIds)) {
      console.log('Processing characterIds for event:', eventCleaned.characterIds)
      eventCleaned.characterIds = eventCleaned.characterIds.map((c: unknown) => {
        // If it's already a number, keep it
        if (typeof c === 'number') return c
        // If it's a string that can be parsed as number, parse it
        if (typeof c === 'string' && !isNaN(Number(c))) return Number(c)
        // If it's an object with id property, extract the id
        if (typeof c === 'object' && c !== null && 'id' in c) {
          const id = (c as Record<string, unknown>).id
          return typeof id === 'number' ? id : Number(id)
        }
        console.warn('Unexpected characterId format:', c)
        return c
      }).filter(id => {
        const isValid = id !== null && id !== undefined && !isNaN(Number(id))
        if (!isValid) console.warn('Filtered out invalid characterId:', id)
        return isValid
      })
      console.log('Processed characterIds for event:', eventCleaned.characterIds)
    } else if (data.characters && Array.isArray(data.characters)) {
      // If characterIds doesn't exist but characters does, extract IDs from characters
      console.log('Extracting characterIds from characters for event:', data.characters)
      eventCleaned.characterIds = data.characters.map((c: any) => 
        typeof c === 'object' && c !== null ? c.id : c
      ).filter((id: any) => {
        const isValid = id !== null && id !== undefined && !isNaN(Number(id))
        if (!isValid) console.warn('Filtered out invalid extracted characterId:', id)
        return isValid
      })
      console.log('Extracted characterIds for event:', eventCleaned.characterIds)
    }
    
    return eventCleaned
  }
  
  if (resource === 'gambles') {
    // Keep only the fields that are allowed in the CreateGambleDto/UpdateGambleDto
    const allowedFields = [
      'name', 'description', 'rules', 'winCondition', 'chapterId', 'participantIds'
    ]
    
    const gambleCleaned: Record<string, unknown> = {}
    allowedFields.forEach(field => {
      if (cleaned[field] !== undefined) {
        gambleCleaned[field] = cleaned[field]
      }
    })
    
    // Handle participantIds - ReferenceArrayInput might set this as objects or IDs
    if (gambleCleaned.participantIds && Array.isArray(gambleCleaned.participantIds)) {
      // Log for debugging
      console.log('Original participantIds:', gambleCleaned.participantIds)
      
      gambleCleaned.participantIds = gambleCleaned.participantIds.map((p: unknown) => {
        // If it's already a number, keep it
        if (typeof p === 'number') return p
        // If it's a string that can be parsed as number, parse it
        if (typeof p === 'string' && !isNaN(Number(p))) return Number(p)
        // If it's an object with id property, extract the id
        if (typeof p === 'object' && p !== null && 'id' in p) {
          const id = (p as Record<string, unknown>).id
          return typeof id === 'number' ? id : Number(id)
        }
        return p
      }).filter(id => id !== null && id !== undefined && !isNaN(Number(id)))
      
      // Log for debugging
      console.log('Processed participantIds:', gambleCleaned.participantIds)
    } else if (data.participants && Array.isArray(data.participants)) {
      // If participantIds doesn't exist but participants does, extract IDs from participants
      console.log('Original participants:', data.participants)
      gambleCleaned.participantIds = data.participants.map((p: any) => 
        typeof p === 'object' && p !== null ? (p.id || p.characterId) : p
      ).filter((id: any) => id !== null && id !== undefined && !isNaN(Number(id)))
      console.log('Extracted participantIds from participants:', gambleCleaned.participantIds)
    }
    
    return gambleCleaned
  }
  
  if (resource === 'guides') {
    console.log('=== GUIDE DATA CLEANING DEBUG ===')
    console.log('Original data:', JSON.stringify(data, null, 2))
    
    // Keep only the fields that are allowed in the CreateGuideDto/UpdateGuideDto
    const allowedFields = [
      'title', 'description', 'content', 'status', 'tagNames', 'authorId',
      'characterIds', 'arcId', 'gambleIds', 'rejectionReason'
    ]
    
    const guideCleaned: Record<string, unknown> = {}
    allowedFields.forEach(field => {
      if (cleaned[field] !== undefined) {
        guideCleaned[field] = cleaned[field]
      }
    })
    
    console.log('After allowed fields filtering:', JSON.stringify(guideCleaned, null, 2))
    
    // Handle characterIds - ReferenceArrayInput might set this as objects or IDs
    try {
      if (guideCleaned.characterIds && Array.isArray(guideCleaned.characterIds)) {
        console.log('Processing characterIds:', guideCleaned.characterIds)
        guideCleaned.characterIds = guideCleaned.characterIds.map((c: unknown) => {
          // If it's already a number, keep it
          if (typeof c === 'number') return c
          // If it's a string that can be parsed as number, parse it
          if (typeof c === 'string' && !isNaN(Number(c))) return Number(c)
          // If it's an object with id property, extract the id
          if (typeof c === 'object' && c !== null && 'id' in c) {
            const id = (c as Record<string, unknown>).id
            return typeof id === 'number' ? id : Number(id)
          }
          console.warn('Unexpected characterId format:', c)
          return c
        }).filter(id => {
          const isValid = id !== null && id !== undefined && !isNaN(Number(id))
          if (!isValid) console.warn('Filtered out invalid characterId:', id)
          return isValid
        })
        console.log('Processed characterIds:', guideCleaned.characterIds)
      } else if (data.characters && Array.isArray(data.characters)) {
        console.log('Extracting characterIds from characters:', data.characters)
        guideCleaned.characterIds = data.characters.map((c: any) => 
          typeof c === 'object' && c !== null ? c.id : c
        ).filter((id: any) => {
          const isValid = id !== null && id !== undefined && !isNaN(Number(id))
          if (!isValid) console.warn('Filtered out invalid extracted characterId:', id)
          return isValid
        })
        console.log('Extracted characterIds:', guideCleaned.characterIds)
      }
    } catch (error) {
      console.error('Error processing characterIds:', error)
      delete guideCleaned.characterIds
    }
    
    // Handle gambleIds - ReferenceArrayInput might set this as objects or IDs
    try {
      if (guideCleaned.gambleIds && Array.isArray(guideCleaned.gambleIds)) {
        console.log('Processing gambleIds:', guideCleaned.gambleIds)
        guideCleaned.gambleIds = guideCleaned.gambleIds.map((g: unknown) => {
          // If it's already a number, keep it
          if (typeof g === 'number') return g
          // If it's a string that can be parsed as number, parse it
          if (typeof g === 'string' && !isNaN(Number(g))) return Number(g)
          // If it's an object with id property, extract the id
          if (typeof g === 'object' && g !== null && 'id' in g) {
            const id = (g as Record<string, unknown>).id
            return typeof id === 'number' ? id : Number(id)
          }
          console.warn('Unexpected gambleId format:', g)
          return g
        }).filter(id => {
          const isValid = id !== null && id !== undefined && !isNaN(Number(id))
          if (!isValid) console.warn('Filtered out invalid gambleId:', id)
          return isValid
        })
        console.log('Processed gambleIds:', guideCleaned.gambleIds)
      } else if (data.gambles && Array.isArray(data.gambles)) {
        console.log('Extracting gambleIds from gambles:', data.gambles)
        guideCleaned.gambleIds = data.gambles.map((g: any) => 
          typeof g === 'object' && g !== null ? g.id : g
        ).filter((id: any) => {
          const isValid = id !== null && id !== undefined && !isNaN(Number(id))
          if (!isValid) console.warn('Filtered out invalid extracted gambleId:', id)
          return isValid
        })
        console.log('Extracted gambleIds:', guideCleaned.gambleIds)
      }
    } catch (error) {
      console.error('Error processing gambleIds:', error)
      delete guideCleaned.gambleIds
    }
    
    // Handle arcId - might be an object with id property, or null/empty string for clearing
    try {
      if (guideCleaned.arcId !== undefined) {
        if (guideCleaned.arcId && typeof guideCleaned.arcId === 'object' && guideCleaned.arcId !== null && 'id' in (guideCleaned.arcId as Record<string, unknown>)) {
          const id = (guideCleaned.arcId as Record<string, unknown>).id
          console.log('Extracting arcId from object:', guideCleaned.arcId, 'extracted:', id)
          guideCleaned.arcId = typeof id === 'number' ? id : Number(id)
        } else if (guideCleaned.arcId === null || guideCleaned.arcId === '' || guideCleaned.arcId === 'null') {
          // Handle clearing the arc relation
          console.log('Clearing arcId (was:', guideCleaned.arcId, ')')
          guideCleaned.arcId = null
        }
      } else if (data.arc && typeof data.arc === 'object' && data.arc !== null && 'id' in (data.arc as Record<string, unknown>)) {
        const id = (data.arc as Record<string, unknown>).id
        console.log('Extracting arcId from data.arc:', data.arc, 'extracted:', id)
        guideCleaned.arcId = typeof id === 'number' ? id : Number(id)
      }
      
      // Validate arcId is a valid number or null (for clearing)
      if (guideCleaned.arcId !== undefined && guideCleaned.arcId !== null && (isNaN(Number(guideCleaned.arcId)))) {
        console.warn('Invalid arcId, removing:', guideCleaned.arcId)
        delete guideCleaned.arcId
      }
    } catch (error) {
      console.error('Error processing arcId:', error)
      delete guideCleaned.arcId
    }
    
    // Handle tagNames - ensure it's an array of strings
    try {
      if (guideCleaned.tagNames && Array.isArray(guideCleaned.tagNames)) {
        guideCleaned.tagNames = guideCleaned.tagNames.filter(tag => 
          typeof tag === 'string' && tag.trim().length > 0
        )
        console.log('Processed tagNames:', guideCleaned.tagNames)
      }
    } catch (error) {
      console.error('Error processing tagNames:', error)
      delete guideCleaned.tagNames
    }
    
    // Remove read-only fields that are auto-calculated by backend
    delete guideCleaned.viewCount
    delete guideCleaned.likeCount  
    delete guideCleaned.author
    delete guideCleaned.likes
    delete guideCleaned.characters
    delete guideCleaned.gambles
    delete guideCleaned.arc
    delete guideCleaned.tags
    delete guideCleaned.createdAt
    delete guideCleaned.updatedAt
    
    console.log('Final cleaned data:', JSON.stringify(guideCleaned, null, 2))
    console.log('=== END GUIDE DATA CLEANING DEBUG ===')
    
    return guideCleaned
  }
  
  if (resource === 'media') {
    // Keep only the fields that are allowed in the media DTOs using polymorphic system
    const allowedFields = [
      'url', 'type', 'description', 'ownerType', 'ownerId', 'chapterNumber', 'status', 'rejectionReason', 'purpose'
    ]
    
    const mediaCleaned: Record<string, unknown> = {}
    allowedFields.forEach(field => {
      if (cleaned[field] !== undefined) {
        mediaCleaned[field] = cleaned[field]
      }
    })
    
    // Remove read-only fields that are auto-populated
    delete mediaCleaned.submittedBy
    delete mediaCleaned.character
    delete mediaCleaned.arc
    delete mediaCleaned.event
    delete mediaCleaned.gamble
    delete mediaCleaned.organization
    delete mediaCleaned.user
    
    // Remove legacy relationship fields to prevent conflicts
    delete mediaCleaned.characterId
    delete mediaCleaned.arcId
    delete mediaCleaned.eventId
    delete mediaCleaned.gambleId
    delete mediaCleaned.organizationId
    delete mediaCleaned.userId
    
    return mediaCleaned
  }
  
  if (resource === 'characters') {
    // Keep only the fields that are allowed in the CreateCharacterDto/UpdateCharacterDto
    const allowedFields = [
      'name', 'description', 'firstAppearanceChapter', 'alternateNames', 'organizationIds'
    ]
    
    const characterCleaned: Record<string, unknown> = {}
    allowedFields.forEach(field => {
      if (cleaned[field] !== undefined) {
        characterCleaned[field] = cleaned[field]
      }
    })
    
    // Handle organizationIds (organization IDs) - ReferenceArrayInput might set this as objects or IDs
    if (characterCleaned.organizationIds && Array.isArray(characterCleaned.organizationIds)) {
      console.log('Processing organization IDs for character:', characterCleaned.organizationIds)
      characterCleaned.organizationIds = characterCleaned.organizationIds.map((f: unknown) => {
        // If it's already a number, keep it
        if (typeof f === 'number') return f
        // If it's a string that can be parsed as number, parse it
        if (typeof f === 'string' && !isNaN(Number(f))) return Number(f)
        // If it's an object with id property, extract the id
        if (typeof f === 'object' && f !== null && 'id' in f) {
          const id = (f as Record<string, unknown>).id
          return typeof id === 'number' ? id : Number(id)
        }
        console.warn('Unexpected organization ID format:', f)
        return f
      }).filter(id => {
        const isValid = id !== null && id !== undefined && !isNaN(Number(id))
        if (!isValid) console.warn('Filtered out invalid organization ID:', id)
        return isValid
      })
      console.log('Processed organization IDs for character:', characterCleaned.organizationIds)
    } else if (data.organizations && Array.isArray(data.organizations)) {
      // If organizationIds doesn't exist but organizations does, extract IDs from organizations
      console.log('Extracting organization IDs from organizations for character:', data.organizations)
      characterCleaned.organizationIds = data.organizations.map((f: any) => 
        typeof f === 'object' && f !== null ? f.id : f
      ).filter((id: any) => {
        const isValid = id !== null && id !== undefined && !isNaN(Number(id))
        if (!isValid) console.warn('Filtered out invalid extracted organization ID:', id)
        return isValid
      })
      console.log('Extracted organization IDs for character:', characterCleaned.organizationIds)
    }
    
    return characterCleaned
  }
  
  if (resource === 'quotes') {
    // Keep only the fields that are allowed in the CreateQuoteDto/UpdateQuoteDto
    const allowedFields = [
      'text', 'chapterNumber', 'description', 'pageNumber', 'characterId'
    ]

    const quoteCleaned: Record<string, unknown> = {}
    allowedFields.forEach(field => {
      if (cleaned[field] !== undefined) {
        quoteCleaned[field] = cleaned[field]
      }
    })

    // Remove read-only relationship objects that shouldn't be sent in updates
    delete quoteCleaned.character
    delete quoteCleaned.submittedBy

    // If character object exists but characterId doesn't, extract characterId
    if (data.character && (data.character as Record<string, unknown>).id && !quoteCleaned.characterId) {
      quoteCleaned.characterId = (data.character as Record<string, unknown>).id
    }

    return quoteCleaned
  }

  if (resource === 'arcs') {
    // Keep only the fields that are allowed in the CreateArcDto/UpdateArcDto
    const allowedFields = [
      'name', 'description', 'order', 'startChapter', 'endChapter'
    ]

    const arcCleaned: Record<string, unknown> = {}
    allowedFields.forEach(field => {
      if (cleaned[field] !== undefined) {
        arcCleaned[field] = cleaned[field]
      }
    })

    return arcCleaned
  }

  if (resource === 'organizations') {
    // Keep only the fields that are allowed in the CreateOrganizationDto/UpdateOrganizationDto
    const allowedFields = [
      'name', 'description'
    ]

    const organizationCleaned: Record<string, unknown> = {}
    allowedFields.forEach(field => {
      if (cleaned[field] !== undefined) {
        organizationCleaned[field] = cleaned[field]
      }
    })

    return organizationCleaned
  }

  if (resource === 'tags') {
    // Keep only the fields that are allowed in the CreateTagDto/UpdateTagDto
    const allowedFields = [
      'name', 'description'
    ]

    const tagCleaned: Record<string, unknown> = {}
    allowedFields.forEach(field => {
      if (cleaned[field] !== undefined) {
        tagCleaned[field] = cleaned[field]
      }
    })

    return tagCleaned
  }

  if (resource === 'character-relationships') {
    // Keep only the fields that are allowed in the CreateCharacterRelationshipDto/UpdateCharacterRelationshipDto
    const allowedFields = [
      'sourceCharacterId', 'targetCharacterId', 'relationshipType',
      'description', 'startChapter', 'endChapter', 'spoilerChapter',
      'reverseRelationshipType', 'reverseDescription'
    ]

    const relationshipCleaned: Record<string, unknown> = {}
    allowedFields.forEach(field => {
      if (cleaned[field] !== undefined) {
        relationshipCleaned[field] = cleaned[field]
      }
    })

    // Remove relationship objects
    delete relationshipCleaned.sourceCharacter
    delete relationshipCleaned.targetCharacter

    return relationshipCleaned
  }

  if (resource === 'character-organizations') {
    // Keep only the fields that are allowed in the CreateCharacterOrganizationDto/UpdateCharacterOrganizationDto
    const allowedFields = [
      'characterId', 'organizationId', 'role',
      'startChapter', 'endChapter', 'spoilerChapter', 'notes'
    ]

    const membershipCleaned: Record<string, unknown> = {}
    allowedFields.forEach(field => {
      if (cleaned[field] !== undefined) {
        membershipCleaned[field] = cleaned[field]
      }
    })

    // Remove relationship objects
    delete membershipCleaned.character
    delete membershipCleaned.organization

    return membershipCleaned
  }

  // For all other resources, remove the id field as it should never be sent in update requests
  delete cleaned.id
  delete cleaned.createdAt
  delete cleaned.updatedAt

  return cleaned
}

export const AdminDataProvider: DataProvider = {
  getList: async (resource, params) => {
    const { page, perPage } = params.pagination || { page: 1, perPage: 20 }
    const { field, order } = params.sort || { field: 'id', order: 'ASC' }
    
    // Special handling for media-approval resource
    if (resource === 'media-approval') {
      try {
        const response = await api.get<unknown>('/media/pending')
        const items = Array.isArray(response) ? response : (response as Record<string, unknown>)?.data || []
        
        return {
          data: (items as any[]).map((item: any) => ({ ...item, id: item.id })),
          total: (items as any[]).length,
        }
      } catch (error: unknown) {
        console.error('Error in getList for media-approval:', error)
        const err = error as { status?: number; name?: string; message?: string }
        const status = err.status || (err.name === 'TypeError' ? 500 : 400)
        const message = err.message || 'Failed to fetch pending media items'
        throw new HttpError(message, status, error)
      }
    }
    
    // Base query parameters - filter out invalid values and client-side only filters
    const cleanFilter: Record<string, string> = {}
    if (params.filter) {
      Object.keys(params.filter).forEach(key => {
        const value = params.filter[key]
        // Skip undefined, null, empty strings, NaN, "NaN" values, and client-side only filters
        if (value !== undefined && value !== null && value !== '' && 
            !Number.isNaN(value) && value !== 'NaN' &&
            key !== 'guideType') { // Skip guideType as it's handled client-side
          cleanFilter[key] = String(value)
        }
      })
    }
    
    const query: Record<string, string> = {
      page: page.toString(),
      limit: perPage.toString(),
      ...cleanFilter,
    }

    // Add sorting parameters based on resource type
    if (resource === 'guides') {
      query.sortBy = field
      query.sortOrder = order
    } else if (['characters', 'arcs', 'events', 'gambles', 'organizations', 'tags', 'quotes', 'chapters', 'volumes', 'media'].includes(resource)) {
      query.sort = field
      query.order = order
    }
    // Users and other resources don't support sorting

    try {
      const response = await api.get<unknown>(`/${resource}?${new URLSearchParams(query).toString()}`)

      // Handle different response structures
      const responseData = (response as Record<string, unknown>)?.data ?? response
      let items = Array.isArray(responseData) ? responseData : (responseData as Record<string, unknown>)?.data || []
      const originalTotal = (response as Record<string, unknown>)?.total ?? (responseData as Record<string, unknown>)?.total ?? (items as Record<string, unknown>[]).length

      // Special handling for users to include badges
      if (resource === 'users' && Array.isArray(items)) {
        try {
          items = await Promise.all((items as any[]).map(async (user: any) => {
            try {
              const badgesResponse = await api.get<unknown>(`/users/${user.id}/badges/all`).catch(() => null)
              const badgesData = badgesResponse ? ((badgesResponse as Record<string, unknown>)?.data ?? badgesResponse) : []

              return {
                ...user,
                userBadges: Array.isArray(badgesData) ? badgesData : []
              }
            } catch (error) {
              console.warn(`Failed to fetch badges for user ${user.id}:`, error)
              return { ...user, userBadges: [] }
            }
          }))
        } catch (error) {
          console.warn('Failed to fetch badges for users:', error)
        }
      }
      
      // Apply client-side filtering for guides if guideType filter is present
      if (resource === 'guides' && params.filter?.guideType && params.filter.guideType !== 'all') {
        const guideType = params.filter.guideType as string
        console.log(`Filtering guides by type: ${guideType}`)
        console.log(`Total guides before filtering: ${(items as any[]).length}`)
        
        items = (items as any[]).filter((guide: any) => {
          const hasCharacters = guide.characters && guide.characters.length > 0
          const hasArc = guide.arc && guide.arc.name
          const hasGambles = guide.gambles && guide.gambles.length > 0
          
          let shouldInclude = false
          switch (guideType) {
            case 'character':
              // Character guides: primarily about characters (may have other entities)
              shouldInclude = hasCharacters
              break
            case 'arc':
              // Arc guides: have arcs (may or may not have characters/gambles)
              shouldInclude = hasArc
              break
            case 'gamble':
              // Gamble guides: have gambles (may or may not have characters/arcs)
              shouldInclude = hasGambles
              break
            case 'comprehensive':
              // Multi-entity guides: have at least 2 different types of entities
              const entityCount = (hasCharacters ? 1 : 0) + (hasArc ? 1 : 0) + (hasGambles ? 1 : 0)
              shouldInclude = entityCount >= 2
              break
            case 'general':
              // General guides: have neither characters, arcs, nor gambles
              shouldInclude = !hasCharacters && !hasArc && !hasGambles
              break
            default:
              shouldInclude = true
          }
          
          if (shouldInclude) {
            console.log(`Including guide: ${guide.title} (characters: ${hasCharacters}, arc: ${hasArc}, gambles: ${hasGambles})`)
          }
          
          return shouldInclude
        })
        
        console.log(`Total guides after filtering: ${(items as any[]).length}`)
      }
      
      return {
        data: (items as any[]).map((item: any) => ({ ...item, id: item.id })),
        total: resource === 'guides' && params.filter?.guideType && params.filter.guideType !== 'all' 
          ? (items as any[]).length // Use filtered count for guides with type filter
          : originalTotal as number, // Use original total for other cases
      }
    } catch (error: unknown) {
      console.error(`Error in getList for ${resource}:`, error)
      const err = error as { status?: number; name?: string; message?: string }
      const status = err.status || (err.name === 'TypeError' ? 500 : 400)
      const message = err.message || 'Failed to fetch items'
      throw new HttpError(message, status, error)
    }
  },

  getOne: async (resource, params) => {
    // Special handling for media-approval resource
    if (resource === 'media-approval') {
      try {
        const response = await api.get<unknown>(`/media/${params.id}`)
        const data = (response as Record<string, unknown>)?.data ?? response

        if (!data) {
          throw new HttpError('No data returned from server', 404)
        }

        const item = { ...(data as Record<string, unknown>), id: (data as Record<string, unknown>).id ?? params.id }
        return { data: item as any }
      } catch (error: unknown) {
        console.error('Error in getOne for media-approval:', error)
        const err = error as { status?: number; name?: string; message?: string }
        throw new HttpError(
          err.message || 'Failed to fetch media item',
          err.status || (err.name === 'TypeError' ? 500 : 404),
          error
        )
      }
    }

    // Special handling for users to include badges
    if (resource === 'users') {
      try {
        const [userResponse, badgesResponse] = await Promise.all([
          api.get<unknown>(`/users/${params.id}`),
          api.get<unknown>(`/users/${params.id}/badges/all`).catch(() => null) // Don't fail if badges endpoint fails
        ])

        const userData = (userResponse as Record<string, unknown>)?.data ?? userResponse
        const badgesData = badgesResponse ? ((badgesResponse as Record<string, unknown>)?.data ?? badgesResponse) : []

        if (!userData) {
          throw new HttpError('No data returned from server', 404)
        }

        const item = {
          ...(userData as Record<string, unknown>),
          id: (userData as Record<string, unknown>).id ?? params.id,
          userBadges: Array.isArray(badgesData) ? badgesData : []
        }
        return { data: item as any }
      } catch (error: unknown) {
        console.error('Error in getOne for users:', error)
        const err = error as { status?: number; name?: string; message?: string }
        throw new HttpError(
          err.message || 'Failed to fetch user',
          err.status || (err.name === 'TypeError' ? 500 : 404),
          error
        )
      }
    }
    
    try {
      const response = await api.get<unknown>(`/${resource}/${params.id}`)
      
      // Handle different response structures
      // For single item endpoints, response might be the item directly or wrapped in data
      const data = (response as Record<string, unknown>)?.data ?? response
      
      if (!data) {
        throw new HttpError('No data returned from server', 404)
      }
      
      // Ensure the item has an id, using the requested id as fallback
      const item = { ...(data as Record<string, unknown>), id: (data as Record<string, unknown>).id ?? params.id }
      
      // Resource-specific data transformations for editing
      if (resource === 'events') {
        // Transform characters array to characterIds for the form
        const itemData = item as any
        if (itemData.characters && Array.isArray(itemData.characters)) {
          console.log('Transforming characters to characterIds for event:', itemData.id, itemData.characters)
          itemData.characterIds = itemData.characters.map((character: any) => 
            typeof character === 'object' && character !== null ? character.id : character
          ).filter((id: any) => id !== null && id !== undefined && !isNaN(Number(id)))
          console.log('Generated characterIds:', itemData.characterIds)
        }
      }
      
      if (resource === 'characters') {
        // Transform organizations array to organizationIds for the form
        const itemData = item as any
        if (itemData.organizations && Array.isArray(itemData.organizations)) {
          console.log('Transforming organizations to organizationIds for character:', itemData.id, itemData.organizations)
          itemData.organizationIds = itemData.organizations.map((organization: any) => 
            typeof organization === 'object' && organization !== null ? organization.id : organization
          ).filter((id: any) => id !== null && id !== undefined && !isNaN(Number(id)))
          console.log('Generated organizationIds:', itemData.organizationIds)
        }
      }
      
      return { data: item as any }
    } catch (error: unknown) {
      console.error(`Error in getOne for ${resource}:`, error)
      const err = error as { status?: number; name?: string; message?: string }
      throw new HttpError(
        err.message || 'Failed to fetch item',
        err.status || (err.name === 'TypeError' ? 500 : 404),
        error
      )
    }
  },

  getMany: async (resource, params) => {
    // Filter out invalid IDs (NaN, null, undefined)
    const validIds = params.ids.filter(id => 
      id !== null && id !== undefined && !Number.isNaN(id) && id !== 'NaN'
    )
    
    if (validIds.length === 0) {
      return { data: [] }
    }
    
    try {
      const responses = await Promise.all(
        validIds.map((id) => api.get<unknown>(`/${resource}/${id}`))
      )
      
      const data = responses.map((response, index) => {
        const item = (response as Record<string, unknown>)?.data ?? response
        return item ? { ...(item as Record<string, unknown>), id: (item as Record<string, unknown>).id ?? validIds[index] } : null
      }).filter(Boolean) // Remove any null entries
      
      return { data: data as any[] }
    } catch (error: unknown) {
      console.error(`Error in getMany for ${resource}:`, error)
      const err = error as { status?: number; name?: string; message?: string }
      const status = err.status || (err.name === 'TypeError' ? 500 : 400)
      const message = err.message || 'Failed to fetch items'
      throw new HttpError(message, status, error)
    }
  },

  getManyReference: async (resource, params) => {
    const { page, perPage } = params.pagination || { page: 1, perPage: 20 }
    const { field, order } = params.sort || { field: 'id', order: 'ASC' }
    
    // Base query parameters - filter out invalid values
    const cleanFilter: Record<string, string> = {}
    if (params.filter) {
      Object.keys(params.filter).forEach(key => {
        const value = params.filter[key]
        // Skip undefined, null, empty strings, NaN, and "NaN" values
        if (value !== undefined && value !== null && value !== '' && 
            !Number.isNaN(value) && value !== 'NaN') {
          cleanFilter[key] = String(value)
        }
      })
    }
    
    const query: Record<string, string> = {
      page: page.toString(),
      limit: perPage.toString(),
      [params.target]: params.id.toString(),
      ...cleanFilter,
    }

    // Add sorting parameters based on resource type
    if (resource === 'guides') {
      query.sortBy = field
      query.sortOrder = order
    } else if (['characters', 'arcs', 'events', 'gambles', 'organizations', 'tags', 'quotes', 'chapters', 'volumes'].includes(resource)) {
      query.sort = field
      query.order = order
    }
    // Users and other resources don't support sorting

    try {
      const response = await api.get<unknown>(`/${resource}?${new URLSearchParams(query).toString()}`)
      
      // Handle different response structures
      const responseData = (response as Record<string, unknown>)?.data ?? response
      const items = Array.isArray(responseData) ? responseData : (responseData as Record<string, unknown>)?.data || []
      const total = (response as Record<string, unknown>)?.total ?? (responseData as Record<string, unknown>)?.total ?? (items as Record<string, unknown>[]).length
      
      return {
        data: (items as any[]).map((item: any) => ({ ...item, id: item.id })),
        total: total as number,
      }
    } catch (error: unknown) {
      console.error(`Error in getManyReference for ${resource}:`, error)
      const err = error as { status?: number; name?: string; message?: string }
      const status = err.status || (err.name === 'TypeError' ? 500 : 400)
      const message = err.message || 'Failed to fetch referenced items'
      throw new HttpError(message, status, error)
    }
  },

  create: async (resource, params) => {
    try {
      // Special handling for badge awarding
      if (resource === 'badges/award') {
        const awardData = {
          userId: params.data.userId,
          badgeId: params.data.badgeId,
          reason: params.data.reason || null,
          metadata: params.data.year ? { year: params.data.year } : null,
        }

        console.log('Awarding badge:', awardData)
        const response = await api.post<unknown>('/badges/award', awardData)
        const data = (response as Record<string, unknown>)?.data ?? response

        return { data: { id: Date.now(), ...awardData, ...(data as Record<string, unknown>) } as any }
      }

      // Clean the create data by removing read-only and relationship fields
      const cleanedData = cleanUpdateData(resource, params.data)

      if (resource === 'gambles') {
        console.log('=== GAMBLE CREATE DEBUG ===')
        console.log('Original params.data:', params.data)
        console.log('Cleaned data being sent:', cleanedData)
      }

      const response = await api.post<unknown>(`/${resource}`, cleanedData)
      
      const data = (response as Record<string, unknown>)?.data ?? response
      
      if (resource === 'gambles') {
        console.log('Gamble create server response data:', data)
        console.log('=== END GAMBLE CREATE DEBUG ===')
      }
      
      if (!data) {
        throw new HttpError('No data returned from server', 500)
      }
      
      // Ensure created item has an id
      const item = { ...(data as Record<string, unknown>), id: (data as Record<string, unknown>).id }
      
      if (!item.id) {
        throw new HttpError('Created item missing required id field', 500)
      }
      
      return { data: item as any }
    } catch (error: unknown) {
      console.error(`Error in create for ${resource}:`, error)
      const err = error as { status?: number; name?: string; message?: string }
      const status = err.status || (err.name === 'TypeError' ? 500 : 400)
      const message = err.message || 'Failed to create item'
      throw new HttpError(message, status, error)
    }
  },

  update: async (resource, params) => {
    try {
      // Clean the update data by removing read-only and relationship fields
      const cleanedData = cleanUpdateData(resource, params.data)
      
      if (resource === 'guides') {
        console.log('=== GUIDE UPDATE DEBUG ===')
        console.log('Original params.data:', params.data)
        console.log('Cleaned data being sent:', cleanedData)
      }
      
      if (resource === 'gambles') {
        console.log('=== GAMBLE UPDATE DEBUG ===')
        console.log('Original params.data:', params.data)
        console.log('Cleaned data being sent:', cleanedData)
      }
      
      // Use PATCH for resources that support it, PUT for others
      const usePatch = ['quotes', 'guides', 'media'].includes(resource)
      const response = usePatch 
        ? await api.patch<unknown>(`/${resource}/${params.id}`, cleanedData)
        : await api.put<unknown>(`/${resource}/${params.id}`, cleanedData)
      
      const data = (response as Record<string, unknown>)?.data ?? response
      
      if (resource === 'guides') {
        console.log('Server response data:', data)
      }
      
      if (resource === 'gambles') {
        console.log('Gamble server response data:', data)
        console.log('=== END GAMBLE UPDATE DEBUG ===')
      }
      
      // Ensure the returned item has proper id and includes all the updated data
      const item = { 
        ...(data as any), 
        id: (data as any).id ?? params.id,
      }
      
      // For guides, ensure authorId is properly set if it was in the response
      if (resource === 'guides' && (data as any).authorId) {
        item.authorId = (data as any).authorId
      }
      
      if (resource === 'guides') {
        console.log('Final item being returned to React Admin:', item)
        console.log('=== END GUIDE UPDATE DEBUG ===')
      }
      
      return { data: item as any }
    } catch (error: unknown) {
      console.error(`Error in update for ${resource}:`, error)
      const err = error as { status?: number; name?: string; message?: string }
      const status = err.status || (err.name === 'TypeError' ? 500 : 400)
      const message = err.message || 'Failed to update item'
      
      if (err.status === 404) {
        throw new HttpError(`${resource} not found`, 404, error)
      }
      if (err.status === 401 || err.status === 403) {
        throw new HttpError('Authentication required or insufficient permissions', err.status, error)
      }
      
      throw new HttpError(message, status, error)
    }
  },

  updateMany: async (resource, params) => {
    try {
      // Clean the update data by removing read-only and relationship fields
      const cleanedData = cleanUpdateData(resource, params.data)
      
      // Use PATCH for resources that support it, PUT for others
      const usePatch = ['quotes', 'guides'].includes(resource)
      await Promise.all(
        params.ids.map((id) => 
          usePatch 
            ? api.patch(`/${resource}/${id}`, cleanedData)
            : api.put(`/${resource}/${id}`, cleanedData)
        )
      )
      return { data: params.ids }
    } catch (error: unknown) {
      console.error(`Error in updateMany for ${resource}:`, error)
      const err = error as { status?: number; name?: string; message?: string }
      const status = err.status || (err.name === 'TypeError' ? 500 : 400)
      const message = err.message || 'Failed to update items'
      throw new HttpError(message, status, error)
    }
  },

  delete: async (resource, params) => {
    try {
      await api.delete(`/${resource}/${params.id}`)
      return { data: params.previousData as any }
    } catch (error: unknown) {
      console.error(`Error in delete for ${resource}:`, error)
      const err = error as { status?: number; name?: string; message?: string }
      const status = err.status || (err.name === 'TypeError' ? 500 : 400)
      const message = err.message || 'Failed to delete item'
      throw new HttpError(message, status, error)
    }
  },

  deleteMany: async (resource, params) => {
    try {
      await Promise.all(
        params.ids.map((id) => api.delete(`/${resource}/${id}`))
      )
      return { data: params.ids }
    } catch (error: unknown) {
      console.error(`Error in deleteMany for ${resource}:`, error)
      const err = error as { status?: number; name?: string; message?: string }
      const status = err.status || (err.name === 'TypeError' ? 500 : 400)
      const message = err.message || 'Failed to delete items'
      throw new HttpError(message, status, error)
    }
  },
}