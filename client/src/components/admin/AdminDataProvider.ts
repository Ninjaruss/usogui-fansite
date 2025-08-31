import { DataProvider, HttpError } from 'react-admin'
import { api } from '../../lib/api'

// Function to clean update data by removing read-only fields and relationship objects
const cleanUpdateData = (resource: string, data: any): any => {
  const cleaned = { ...data }
  
  // Remove common read-only fields
  delete cleaned.id
  delete cleaned.createdAt
  delete cleaned.updatedAt
  
  // Remove relationship objects/arrays that shouldn't be sent in updates
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
      'title', 'description', 'type', 'arcId', 'chapterIds', 
      'startChapter', 'endChapter', 'spoilerChapter', 'pageNumbers',
      'chapterReferences', 'isVerified'
    ]
    
    const eventCleaned: any = {}
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
      'name', 'rules', 'winCondition', 'chapterId', 'hasTeams', 'participants', 'rounds', 'observerIds'
    ]
    
    const gambleCleaned: any = {}
    allowedFields.forEach(field => {
      if (cleaned[field] !== undefined) {
        gambleCleaned[field] = cleaned[field]
      }
    })
    
    // Transform participants from admin form format to DTO format
    if (gambleCleaned.participants && Array.isArray(gambleCleaned.participants)) {
      gambleCleaned.participants = gambleCleaned.participants.map((p: any) => ({
        characterId: p.characterId,
        teamName: p.teamName || undefined,
        isWinner: p.isWinner || false,
        stake: p.stake || undefined
      }))
    }
    
    // Transform rounds from admin form format to DTO format
    if (gambleCleaned.rounds && Array.isArray(gambleCleaned.rounds)) {
      gambleCleaned.rounds = gambleCleaned.rounds.map((r: any) => ({
        roundNumber: r.roundNumber,
        outcome: r.outcome,
        winnerTeam: r.winnerTeam || undefined,
        reward: r.reward || undefined,
        penalty: r.penalty || undefined
      }))
    }
    
    // Transform observers from admin form format to DTO format
    if (gambleCleaned.observers && Array.isArray(gambleCleaned.observers)) {
      gambleCleaned.observerIds = gambleCleaned.observers.map((o: any) => 
        typeof o === 'object' ? o.id : o
      )
      delete gambleCleaned.observers
    }
    
    return gambleCleaned
  }
  
  if (resource === 'guides') {
    // Keep only the fields that are allowed in the CreateGuideDto/UpdateGuideDto
    const allowedFields = [
      'title', 'description', 'content', 'status', 'tagNames', 'authorId'
    ]
    
    const guideCleaned: any = {}
    allowedFields.forEach(field => {
      if (cleaned[field] !== undefined) {
        guideCleaned[field] = cleaned[field]
      }
    })
    
    // Remove read-only fields that are auto-calculated by backend
    delete guideCleaned.viewCount
    delete guideCleaned.likeCount  
    delete guideCleaned.author
    delete guideCleaned.likes
    
    return guideCleaned
  }
  
  if (resource === 'media') {
    // Keep only the fields that are allowed in the media DTOs
    const allowedFields = [
      'url', 'type', 'description', 'characterId', 'status', 'rejectionReason'
    ]
    
    const mediaCleaned: any = {}
    allowedFields.forEach(field => {
      if (cleaned[field] !== undefined) {
        mediaCleaned[field] = cleaned[field]
      }
    })
    
    // Remove read-only fields that are auto-populated
    delete mediaCleaned.submittedBy
    delete mediaCleaned.character
    
    return mediaCleaned
  }
  
  if (resource === 'quotes') {
    // Keep only the fields that are allowed in the CreateQuoteDto/UpdateQuoteDto
    const allowedFields = [
      'text', 'chapterNumber', 'description', 'pageNumber', 'characterId'
    ]
    
    const quoteCleaned: any = {}
    allowedFields.forEach(field => {
      if (cleaned[field] !== undefined) {
        quoteCleaned[field] = cleaned[field]
      }
    })
    
    // Remove read-only relationship objects that shouldn't be sent in updates
    delete quoteCleaned.character
    delete quoteCleaned.submittedBy
    
    // If character object exists but characterId doesn't, extract characterId
    if (data.character && data.character.id && !quoteCleaned.characterId) {
      quoteCleaned.characterId = data.character.id
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
        const response = await api.get<any>('/media/pending')
        const items = Array.isArray(response) ? response : (response?.data || [])
        
        return {
          data: items.map((item: any) => ({ ...item, id: item.id })),
          total: items.length,
        }
      } catch (error: any) {
        console.error('Error in getList for media-approval:', error)
        const status = error.status || (error.name === 'TypeError' ? 500 : 400)
        const message = error.message || 'Failed to fetch pending media items'
        throw new HttpError(message, status, error)
      }
    }
    
    // Base query parameters
    const query: Record<string, string> = {
      page: page.toString(),
      limit: perPage.toString(),
      ...params.filter,
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
      const response = await api.get<any>(`/${resource}?${new URLSearchParams(query).toString()}`)
      
      // Handle different response structures
      const responseData = response?.data ?? response
      const items = Array.isArray(responseData) ? responseData : (responseData?.data || [])
      const total = response?.total ?? responseData?.total ?? items.length
      
      return {
        data: items.map((item: any) => ({ ...item, id: item.id })),
        total,
      }
    } catch (error: any) {
      console.error(`Error in getList for ${resource}:`, error)
      const status = error.status || (error.name === 'TypeError' ? 500 : 400)
      const message = error.message || 'Failed to fetch items'
      throw new HttpError(message, status, error)
    }
  },

  getOne: async (resource, params) => {
    // Special handling for media-approval resource
    if (resource === 'media-approval') {
      try {
        const response = await api.get<any>(`/media/${params.id}`)
        const data = response?.data ?? response
        
        if (!data) {
          throw new HttpError('No data returned from server', 404)
        }
        
        const item = { ...data, id: data.id ?? params.id }
        return { data: item as any }
      } catch (error: any) {
        console.error('Error in getOne for media-approval:', error)
        throw new HttpError(
          error.message || 'Failed to fetch media item',
          error.status || (error.name === 'TypeError' ? 500 : 404),
          error
        )
      }
    }
    
    try {
      const response = await api.get<any>(`/${resource}/${params.id}`)
      
      // Handle different response structures
      // For single item endpoints, response might be the item directly or wrapped in data
      const data = response?.data ?? response
      
      if (!data) {
        throw new HttpError('No data returned from server', 404)
      }
      
      // Ensure the item has an id, using the requested id as fallback
      const item = { ...data, id: data.id ?? params.id }
      
      return { data: item as any }
    } catch (error: any) {
      console.error(`Error in getOne for ${resource}:`, error)
      throw new HttpError(
        error.message || 'Failed to fetch item',
        error.status || (error.name === 'TypeError' ? 500 : 404),
        error
      )
    }
  },

  getMany: async (resource, params) => {
    try {
      const responses = await Promise.all(
        params.ids.map((id) => api.get<any>(`/${resource}/${id}`))
      )
      
      const data = responses.map((response, index) => {
        const item = response?.data ?? response
        return item ? { ...item, id: item.id ?? params.ids[index] } : null
      }).filter(Boolean) // Remove any null entries
      
      return { data: data as any[] }
    } catch (error: any) {
      console.error(`Error in getMany for ${resource}:`, error)
      const status = error.status || (error.name === 'TypeError' ? 500 : 400)
      const message = error.message || 'Failed to fetch items'
      throw new HttpError(message, status, error)
    }
  },

  getManyReference: async (resource, params) => {
    const { page, perPage } = params.pagination || { page: 1, perPage: 20 }
    const { field, order } = params.sort || { field: 'id', order: 'ASC' }
    
    // Base query parameters
    const query: Record<string, string> = {
      page: page.toString(),
      limit: perPage.toString(),
      [params.target]: params.id.toString(),
      ...params.filter,
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
      const response = await api.get<any>(`/${resource}?${new URLSearchParams(query).toString()}`)
      
      // Handle different response structures
      const responseData = response?.data ?? response
      const items = Array.isArray(responseData) ? responseData : (responseData?.data || [])
      const total = response?.total ?? responseData?.total ?? items.length
      
      return {
        data: items.map((item: any) => ({ ...item, id: item.id })),
        total,
      }
    } catch (error: any) {
      console.error(`Error in getManyReference for ${resource}:`, error)
      const status = error.status || (error.name === 'TypeError' ? 500 : 400)
      const message = error.message || 'Failed to fetch referenced items'
      throw new HttpError(message, status, error)
    }
  },

  create: async (resource, params) => {
    try {
      // Clean the create data by removing read-only and relationship fields
      const cleanedData = cleanUpdateData(resource, params.data)
      const response = await api.post<any>(`/${resource}`, cleanedData)
      
      const data = response?.data ?? response
      
      if (!data) {
        throw new HttpError('No data returned from server', 500)
      }
      
      // Ensure created item has an id
      const item = { ...data, id: data.id }
      
      if (!item.id) {
        throw new HttpError('Created item missing required id field', 500)
      }
      
      return { data: item as any }
    } catch (error: any) {
      console.error(`Error in create for ${resource}:`, error)
      const status = error.status || (error.name === 'TypeError' ? 500 : 400)
      const message = error.message || 'Failed to create item'
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
      
      // Use PATCH for resources that support it, PUT for others
      const usePatch = ['quotes', 'guides', 'media'].includes(resource)
      const response = usePatch 
        ? await api.patch<any>(`/${resource}/${params.id}`, cleanedData)
        : await api.put<any>(`/${resource}/${params.id}`, cleanedData)
      
      const data = response?.data ?? response
      
      if (resource === 'guides') {
        console.log('Server response data:', data)
      }
      
      // Ensure the returned item has proper id and includes all the updated data
      const item = { 
        ...data, 
        id: data.id ?? params.id,
        // For guides, ensure authorId is properly set if it was in the response
        ...(resource === 'guides' && data.authorId && { authorId: data.authorId })
      }
      
      if (resource === 'guides') {
        console.log('Final item being returned to React Admin:', item)
        console.log('=== END GUIDE UPDATE DEBUG ===')
      }
      
      return { data: item as any }
    } catch (error: any) {
      console.error(`Error in update for ${resource}:`, error)
      const status = error.status || (error.name === 'TypeError' ? 500 : 400)
      const message = error.message || 'Failed to update item'
      
      if (error.status === 404) {
        throw new HttpError(`${resource} not found`, 404, error)
      }
      if (error.status === 401 || error.status === 403) {
        throw new HttpError('Authentication required or insufficient permissions', error.status, error)
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
    } catch (error: any) {
      console.error(`Error in updateMany for ${resource}:`, error)
      const status = error.status || (error.name === 'TypeError' ? 500 : 400)
      const message = error.message || 'Failed to update items'
      throw new HttpError(message, status, error)
    }
  },

  delete: async (resource, params) => {
    try {
      await api.delete(`/${resource}/${params.id}`)
      return { data: params.previousData as any }
    } catch (error: any) {
      console.error(`Error in delete for ${resource}:`, error)
      const status = error.status || (error.name === 'TypeError' ? 500 : 400)
      const message = error.message || 'Failed to delete item'
      throw new HttpError(message, status, error)
    }
  },

  deleteMany: async (resource, params) => {
    try {
      await Promise.all(
        params.ids.map((id) => api.delete(`/${resource}/${id}`))
      )
      return { data: params.ids }
    } catch (error: any) {
      console.error(`Error in deleteMany for ${resource}:`, error)
      const status = error.status || (error.name === 'TypeError' ? 500 : 400)
      const message = error.message || 'Failed to delete items'
      throw new HttpError(message, status, error)
    }
  },
}