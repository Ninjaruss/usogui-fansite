import { DataProvider, HttpError } from 'react-admin'
import { api } from '../../lib/api'

// Function to clean update data by removing read-only fields and relationship objects
const cleanUpdateData = (resource: string, data: Record<string, unknown>) => {
  const cleaned = { ...data }
  
  // Common relationship fields to remove (these are populated by the server)
  const relationshipFields = [
    'user', 'author', 'character', 'characters', 'chapter', 'chapters', 'arc', 'arcs',
    'gamble', 'gambles', 'event', 'events', 'faction', 'factions', 'tag', 'tags',
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
    return eventCleaned
  }
  
  if (resource === 'gambles') {
    // Keep only the fields that are allowed in the CreateGambleDto/UpdateGambleDto
    const allowedFields = [
      'name', 'rules', 'winCondition', 'chapterId', 'participantIds'
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
    
    // Handle arcId - might be an object with id property
    try {
      if (guideCleaned.arcId && typeof guideCleaned.arcId === 'object' && guideCleaned.arcId !== null && 'id' in (guideCleaned.arcId as Record<string, unknown>)) {
        const id = (guideCleaned.arcId as Record<string, unknown>).id
        console.log('Extracting arcId from object:', guideCleaned.arcId, 'extracted:', id)
        guideCleaned.arcId = typeof id === 'number' ? id : Number(id)
      } else if (data.arc && typeof data.arc === 'object' && data.arc !== null && 'id' in (data.arc as Record<string, unknown>)) {
        const id = (data.arc as Record<string, unknown>).id
        console.log('Extracting arcId from data.arc:', data.arc, 'extracted:', id)
        guideCleaned.arcId = typeof id === 'number' ? id : Number(id)
      }
      
      // Validate arcId is a valid number
      if (guideCleaned.arcId !== undefined && (isNaN(Number(guideCleaned.arcId)) || guideCleaned.arcId === null)) {
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
    // Keep only the fields that are allowed in the media DTOs
    const allowedFields = [
      'url', 'type', 'description', 'characterId', 'arcId', 'eventId', 'status', 'rejectionReason'
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
    
    return mediaCleaned
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
      ...cleanFilter,
    }

    // Add sorting parameters based on resource type
    if (resource === 'guides') {
      query.sortBy = field
      query.sortOrder = order
    } else if (['characters', 'arcs', 'events', 'gambles', 'factions', 'tags', 'quotes', 'chapters', 'volumes'].includes(resource)) {
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
    } else if (['characters', 'arcs', 'events', 'gambles', 'factions', 'tags', 'quotes', 'chapters', 'volumes'].includes(resource)) {
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