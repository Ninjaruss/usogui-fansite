const resolvedApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim()

const defaultApiUrl = process.env.NODE_ENV === 'production'
  ? 'https://l-file.com/api'
  : 'http://localhost:3001/api'

export const API_BASE_URL = resolvedApiUrl || defaultApiUrl


class ApiClient {
  private baseURL: string
  private token: string | null = null

  constructor(baseURL: string) {
    this.baseURL = baseURL
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('accessToken')
    }
  }

  setToken(token: string | null) {
    this.token = token
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('accessToken', token)
      } else {
        localStorage.removeItem('accessToken')
      }
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`
    const headers: Record<string, string> = {
      ...(typeof options.headers === 'object' && options.headers ? options.headers as Record<string, string> : {}),
    }

    // Only set Content-Type if body is not FormData
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json'
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include', // Important for cookies (refresh token)
    })

    // Handle token expiration (401 Unauthorized)
    if (response.status === 401 && 
        endpoint !== '/auth/refresh' && 
        endpoint !== '/auth/login' &&
        endpoint !== '/auth/logout') {
      console.log('[API] Token expired, attempting to refresh...')
      try {
        // Try to refresh the token
        const refreshResult = await this.refreshToken()
        if (refreshResult && refreshResult.access_token) {
          console.log('[API] Token refresh successful, retrying original request')
          // Retry the original request with the new token
          return this.request<T>(endpoint, options)
        }
      } catch (refreshError) {
        console.error('[API] Token refresh failed:', refreshError)
        // If refresh fails, clear token and fall through to handle 401 gracefully
        this.setToken(null)
        localStorage.removeItem('accessToken')
      }
      
      // If we reach here, authentication failed - provide user-friendly error
      // instead of exposing technical 401 details
      const userFriendlyError = new Error('Please log in to access this content')
      ;(userFriendlyError as any).status = 401
      ;(userFriendlyError as any).isAuthError = true
      ;(userFriendlyError as any).url = url
      ;(userFriendlyError as any).method = options.method || 'GET'
      throw userFriendlyError
    }

    if (!response.ok) {
      let errorMessage: string
      let errorDetails: any = null
      
      try {
        const errorResponse = await response.json()
        errorMessage = String(errorResponse.message || errorResponse.error || `HTTP ${response.status}: ${response.statusText}`)
        errorDetails = errorResponse
      } catch {
        errorMessage = `HTTP ${response.status}: ${response.statusText}`
      }
      
      // Create a more robust error object
      class APIError extends Error {
        public status: number
        public details: any
        public url: string
        public method: string
        
        constructor(message: string, status: number, details: any, url: string, method: string) {
          super(message)
          this.name = 'APIError'
          this.status = status
          this.details = details
          this.url = url
          this.method = method
        }
      }

      // Log error for debugging with proper structure
      // Skip logging expected 404s for public guide endpoints (normal fallback behavior)
      const isExpected404 = response.status === 404 && endpoint.includes('/guides/public/')

      if (!isExpected404) {
        console.error('[API Error]', JSON.stringify({
          url,
          method: options.method || 'GET',
          status: response.status,
          statusText: response.statusText,
          message: errorMessage,
          details: errorDetails,
          endpoint
        }, null, 2))
      }

      throw new APIError(errorMessage, response.status, errorDetails, url, options.method || 'GET')
    }

    // Handle 204 No Content responses
    if (response.status === 204) {
      return undefined as T
    }

    // Always try to read response as text first, then parse JSON if content exists
    let text = ''
    try {
      text = await response.text()
      if (!text.trim()) {
        return undefined as T
      }
      return JSON.parse(text)
    } catch (jsonError) {
      console.error('[API] JSON parse error for endpoint:', endpoint, 'Response text:', text)
      console.error('[API] JSON parse error details:', jsonError)
      // If JSON parsing fails, return undefined for empty responses
      return undefined as T
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' })
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async put<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async patch<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }

  // Auth methods
  async login(username: string, password: string) {
    const response = await this.post<{
      access_token: string
      user: {
        id: number
        username: string
        email: string
        role: string
        isEmailVerified: boolean
        userProgress: number
      }
    }>('/auth/login', { username, password })
    
    this.setToken(response.access_token)
    return response
  }

  async register(username: string, email: string, password: string) {
    return this.post<{ message: string; userId: string }>('/auth/register', {
      username,
      email,
      password,
    })
  }

  async logout() {
    try {
      // Refresh token is now handled via httpOnly cookie
      await this.post('/auth/logout', {})
    } finally {
      this.setToken(null)
    }
  }

  async getCurrentUser() {
    return this.get<{
      id: number
      username: string
      email: string
      role: string
      customRole?: string | null
      isEmailVerified: boolean
      userProgress: number
      profileImageId?: string
      favoriteQuoteId?: number
      favoriteGambleId?: number
      createdAt?: string
      // Discord fields
      discordId?: string | null
      discordUsername?: string | null
      discordAvatar?: string | null
      // Profile picture fields  
      profilePictureType?: 'discord' | 'character_media' | null
      selectedCharacterMediaId?: number | null
      // Full relation objects
      selectedCharacterMedia?: {
        id: number
        url: string
        fileName: string
        description?: string
      } | null
    }>('/auth/me')
  }

  async refreshToken() {
    try {
      console.log('[API] Attempting to refresh token')
      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important for cookies (refresh token)
      });
      
      if (!response.ok) {
        // Only log as error for unexpected status codes (not 401, which is expected when no refresh token exists)
        if (response.status !== 401) {
          console.error('[API] Token refresh failed:', response.status, response.statusText)
        } else {
          console.log('[API] No valid refresh token available (401)')
        }
        throw new Error('Token refresh failed')
      }
      
      const data = await response.json();
      console.log('[API] Token refresh successful')
      
      // Update token
      this.setToken(data.access_token)
      return data
    } catch (error) {
      // Only log as error if it's not the expected "Token refresh failed" error from 401 response
      if (error instanceof Error && error.message === 'Token refresh failed') {
        console.log('[API] Token refresh unavailable - user needs to log in')
      } else {
        console.error('[API] Error refreshing token:', error)
      }
      // Clear token on refresh error
      this.setToken(null)
      throw error
    }
  }

  // Content methods
  async getCharacters(params?: {
    page?: number
    limit?: number
    name?: string
    arc?: string
    includeOrganizations?: boolean
    sort?: string
    order?: string
  }) {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString())
        }
      })
    }
    const query = searchParams.toString()
    return this.get<{
      data: any[]
      total: number
      page: number
      totalPages: number
    }>(`/characters${query ? `?${query}` : ''}`)
  }

  async getCharacter(id: number) {
    return this.get<any>(`/characters/${id}`)
  }

  async getCharacterGambles(characterId: number, params?: { page?: number; limit?: number }) {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString())
        }
      })
    }
    const query = searchParams.toString()
    return this.get<{
      data: any[]
      total: number
      page: number
      totalPages: number
    }>(`/characters/${characterId}/gambles${query ? `?${query}` : ''}`)
  }

  async getCharacterEvents(characterId: number, params?: { page?: number; limit?: number }) {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString())
        }
      })
    }
    const query = searchParams.toString()
    return this.get<{
      data: any[]
      total: number
      page: number
      totalPages: number
    }>(`/characters/${characterId}/events${query ? `?${query}` : ''}`)
  }

  async getCharacterGuides(characterId: number, params?: { page?: number; limit?: number; status?: string }) {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString())
        }
      })
    }
    const query = searchParams.toString()
    return this.get<{
      data: any[]
      total: number
      page: number
      totalPages: number
    }>(`/characters/${characterId}/guides${query ? `?${query}` : ''}`)
  }

  async getCharacterQuotes(characterId: number, params?: { page?: number; limit?: number }) {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString())
        }
      })
    }
    const query = searchParams.toString()
    return this.get<{
      data: any[]
      total: number
      page: number
      totalPages: number
    }>(`/characters/${characterId}/quotes${query ? `?${query}` : ''}`)
  }

  async getCharacterArcs(characterId: number) {
    return this.get<{
      data: Array<{
        id: number
        name: string
        order: number
        description?: string
      }>
      total: number
    }>(`/characters/${characterId}/arcs`)
  }

  async getCharacterRelationships(characterId: number, userProgress?: number, grouped?: boolean) {
    const params = new URLSearchParams()
    if (userProgress !== undefined) {
      params.append('userProgress', userProgress.toString())
    }
    if (grouped) {
      params.append('grouped', 'true')
    }
    const query = params.toString()
    return this.get<any>(`/character-relationships/character/${characterId}${query ? `?${query}` : ''}`)
  }

  async getCharacterOrganizations(characterId: number, userProgress?: number) {
    const params = new URLSearchParams()
    if (userProgress !== undefined) {
      params.append('userProgress', userProgress.toString())
    }
    const query = params.toString()
    return this.get<any[]>(`/character-organizations/character/${characterId}${query ? `?${query}` : ''}`)
  }

  async getOrganizationMembers(organizationId: number, userProgress?: number) {
    const params = new URLSearchParams()
    if (userProgress !== undefined) {
      params.append('userProgress', userProgress.toString())
    }
    const query = params.toString()
    return this.get<any[]>(`/character-organizations/organization/${organizationId}${query ? `?${query}` : ''}`)
  }

  async getArcs(params?: {
    page?: number
    limit?: number
    name?: string
  }) {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString())
        }
      })
    }
    const query = searchParams.toString()
    return this.get<{
      data: any[]
      total: number
      page: number
      totalPages: number
    }>(`/arcs${query ? `?${query}` : ''}`)
  }

  async getArc(id: number) {
    return this.get<any>(`/arcs/${id}`)
  }

  async getArcGambles(arcId: number) {
    return this.get<{
      data: any[]
      total: number
    }>(`/arcs/${arcId}/gambles`)
  }

  async getGambles(params?: { page?: number; limit?: number; gambleName?: string }) {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString())
        }
      })
    }
    const query = searchParams.toString()
    return this.get<{
      data: any[]
      total: number
      page: number
      totalPages: number
    }>(`/gambles${query ? `?${query}` : ''}`)
  }

  async getGamble(id: number) {
    return this.get<any>(`/gambles/${id}`)
  }

  async getEvents(params?: { page?: number; limit?: number; title?: string }) {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString())
        }
      })
    }
    const query = searchParams.toString()
    return this.get<{
      data: any[]
      total: number
      page: number
      totalPages: number
    }>(`/events${query ? `?${query}` : ''}`)
  }

  async getEventsGroupedByArc(params?: {
    userProgress?: number;
    type?: string;
    status?: string
  }) {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString())
        }
      })
    }
    const query = searchParams.toString()
    return this.get<{
      arcs: Array<{
        arc: any
        events: any[]
      }>
      noArc: any[]
    }>(`/events/grouped/by-arc${query ? `?${query}` : ''}`)
  }

  async getEvent(id: number) {
    return this.get<any>(`/events/${id}`)
  }

  async getEventsByChapter(chapterNumber: number) {
    return this.get<any[]>(`/events/by-chapter/${chapterNumber}`)
  }

  async search(options: {
    query: string
    type?: string
    userProgress?: number
    page?: number
    limit?: number
  }) {
    const params = new URLSearchParams({ query: options.query })
    if (options.type) params.append('type', options.type)
    if (options.userProgress !== undefined && !Number.isNaN(options.userProgress)) {
      params.append('userProgress', options.userProgress.toString())
    }
    if (options.page !== undefined && !Number.isNaN(options.page)) {
      params.append('page', options.page.toString())
    }
    if (options.limit !== undefined && !Number.isNaN(options.limit)) {
      params.append('limit', options.limit.toString())
    }

    return this.get<{
      results: Array<{
        id: number
        type: string
        title: string
        description: string
        score: number
        hasSpoilers: boolean
        slug: string
        metadata?: any
      }>
      total: number
      page: number
      perPage: number
      totalPages: number
    }>(`/search?${params.toString()}`)
  }

  async getGuides(params?: { page?: number; limit?: number; search?: string; authorId?: number; status?: string; tag?: string }) {
    const searchParams = new URLSearchParams()
    if (params) {
      if (params.search) {
        searchParams.append('search', params.search)
      }
      if (params.page) {
        searchParams.append('page', params.page.toString())
      }
      if (params.limit) {
        searchParams.append('limit', params.limit.toString())
      }
      if (params.authorId) {
        searchParams.append('authorId', params.authorId.toString())
      }
      if (params.status) {
        searchParams.append('status', params.status)
      }
      if (params.tag) {
        searchParams.append('tag', params.tag)
      }
    }
    const query = searchParams.toString()
    return this.get<{
      data: any[]
      total: number
      page: number
      totalPages: number
    }>(`/guides/public${query ? `?${query}` : ''}`)
  }

  async getGuide(id: number) {
    return this.get<any>(`/guides/public/${id}`)
  }

  async getGuideAuthenticated(id: number) {
    return this.get<any>(`/guides/${id}`)
  }

  async createGuide(data: {
    title: string
    description: string
    content: string
    tags?: string[]
    characterIds?: number[]
    arcId?: number
    gambleIds?: number[]
  }) {
    const { tags, ...rest } = data
    return this.post<any>('/guides', {
      ...rest,
      tagNames: tags
    })
  }

  async toggleGuideLike(id: number) {
    return this.post<{
      liked: boolean
      likeCount: number
    }>(`/guides/${id}/like`, {})
  }

  async submitMediaPolymorphic(data: {
    url: string
    type: 'image' | 'video' | 'audio'
    ownerType: 'character' | 'arc' | 'event' | 'gamble' | 'organization' | 'user'
    ownerId: number
    chapterNumber?: number
    description?: string
  }) {
    return this.post<any>('/media', data)
  }

  async uploadMedia(file: File, data: {
    type: 'image' | 'video' | 'audio'
    ownerType: 'character' | 'arc' | 'event' | 'gamble' | 'organization' | 'user' | 'volume'
    ownerId: number
    chapterNumber?: number
    purpose?: 'gallery' | 'entity_display'
    description?: string
  }) {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', data.type)
    formData.append('ownerType', data.ownerType)
    formData.append('ownerId', data.ownerId.toString())
    if (data.description) formData.append('description', data.description)
    if (data.chapterNumber) formData.append('chapterNumber', data.chapterNumber.toString())
    if (data.purpose) formData.append('purpose', data.purpose)

    return this.request<any>('/media/upload', {
      method: 'POST',
      body: formData,
      // Don't set Content-Type header - let browser set it with boundary
    })
  }

  async uploadCharacterImage(characterId: number, file: File, imageDisplayName?: string) {
    const formData = new FormData()
    formData.append('file', file)
    if (imageDisplayName) formData.append('imageDisplayName', imageDisplayName)

    return this.request<any>(`/characters/${characterId}/upload-image`, {
      method: 'POST',
      body: formData,
    })
  }

  async uploadArcImage(arcId: number, file: File, imageDisplayName?: string) {
    const formData = new FormData()
    formData.append('file', file)
    if (imageDisplayName) formData.append('imageDisplayName', imageDisplayName)

    return this.request<any>(`/arcs/${arcId}/upload-image`, {
      method: 'POST',
      body: formData,
    })
  }

  async updateProfile(data: {
    favoriteQuoteId?: number | null
    favoriteGambleId?: number | null
    profilePictureType?: 'discord' | 'character_media' | null
    selectedCharacterMediaId?: number | null
  }) {
    return this.patch<any>('/users/profile', data)
  }

  async refreshDiscordAvatar() {
    return this.post<any>('/users/profile/refresh-discord-avatar', {})
  }


  async updateUserProgress(userProgress: number) {
    return this.put<{ message: string; userProgress: number }>('/users/profile/progress', { userProgress })
  }

  async getUserProfileStats() {
    return this.get<{
      guidesWritten: number
      mediaSubmitted: number
      likesReceived: number
    }>('/users/profile/stats')
  }

  async updateCustomRole(customRole: string | null) {
    return this.patch<{ message: string }>('/users/profile/custom-role', { customRole })
  }

  async removeCustomRole() {
    return this.delete<{ message: string }>('/users/profile/custom-role')
  }

  // Chapter methods
  async getChapters(params?: {
    title?: string
    number?: number
    page?: number
    limit?: number
    sort?: string
    order?: 'ASC' | 'DESC'
  }) {
    const searchParams = new URLSearchParams()
    if (params?.title) searchParams.append('title', params.title)
    if (params?.number !== undefined) searchParams.append('number', params.number.toString())
    if (params?.page) searchParams.append('page', params.page.toString())
    if (params?.limit) searchParams.append('limit', params.limit.toString())
    if (params?.sort) searchParams.append('sort', params.sort)
    if (params?.order) searchParams.append('order', params.order)
    
    return this.get<{
      data: Array<{
        id: number
        number: number
        title: string | null
        summary: string | null
      }>
      total: number
      page: number
      totalPages: number
    }>(`/chapters?${searchParams.toString()}`)
  }

  async getChapter(id: number) {
    return this.get<{
      id: number
      number: number
      title: string | null
      summary: string | null
    }>(`/chapters/${id}`)
  }

  async getChapterByNumber(number: number) {
    return this.get<{
      id: number
      number: number
      title: string | null
      summary: string | null
    }>(`/chapters/by-number/${number}`)
  }

  // Admin endpoints for missing resources
  async getUsers(params?: {
    page?: number
    limit?: number
    username?: string
    email?: string
    role?: string
  }) {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString())
        }
      })
    }
    const query = searchParams.toString()
    return this.get<{
      data: any[]
      total: number
      page: number
      totalPages: number
    }>(`/users${query ? `?${query}` : ''}`)
  }

  async getUser(id: number) {
    return this.get<any>(`/users/${id}`)
  }

  async getPublicUserProfile(id: number) {
    return this.get<any>(`/users/public/${id}`)
  }

  async getUserBadges(userId: number) {
    return this.get<any>(`/users/${userId}/badges`)
  }

  async getPublicUsers(params?: {
    page?: number
    limit?: number
    username?: string
  }) {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString())
        }
      })
    }
    const query = searchParams.toString()
    return this.get<{
      data: any[]
      total: number
      page: number
      totalPages: number
    }>(`/users/public${query ? `?${query}` : ''}`)
  }

  async updateUser(id: number, data: any) {
    return this.put<any>(`/users/${id}`, data)
  }

  async deleteUser(id: number) {
    return this.delete<any>(`/users/${id}`)
  }

  async getQuotes(params?: {
    page?: number
    limit?: number
    search?: string
    characterId?: number
  }) {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString())
        }
      })
    }
    const query = searchParams.toString()
    return this.get<{
      data: any[]
      total: number
      page: number
      totalPages: number
    }>(`/quotes${query ? `?${query}` : ''}`)
  }

  async getQuote(id: number) {
    return this.get<any>(`/quotes/${id}`)
  }

  async getQuotesByChapter(chapterNumber: number) {
    return this.get<any[]>(`/quotes/chapter/${chapterNumber}`)
  }

  async createQuote(data: any) {
    return this.post<any>('/quotes', data)
  }

  async updateQuote(id: number, data: any) {
    return this.patch<any>(`/quotes/${id}`, data)
  }

  async deleteQuote(id: number) {
    return this.delete<any>(`/quotes/${id}`)
  }

  async getTags(params?: {
    page?: number
    limit?: number
    name?: string
  }) {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString())
        }
      })
    }
    const query = searchParams.toString()
    return this.get<{
      data: any[]
      total: number
      page: number
      totalPages: number
    }>(`/tags${query ? `?${query}` : ''}`)
  }

  async getTag(id: number) {
    return this.get<any>(`/tags/${id}`)
  }

  async createTag(data: any) {
    return this.post<any>('/tags', data)
  }

  async updateTag(id: number, data: any) {
    return this.put<any>(`/tags/${id}`, data)
  }

  async deleteTag(id: number) {
    return this.delete<any>(`/tags/${id}`)
  }

  async getOrganizations(params?: {
    page?: number
    limit?: number
    name?: string
  }) {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString())
        }
      })
    }
    const query = searchParams.toString()
    return this.get<{
      data: any[]
      total: number
      page: number
      totalPages: number
    }>(`/organizations${query ? `?${query}` : ''}`)
  }

  async getVolumes(params?: {
    page?: number
    limit?: number
    number?: number
  }) {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString())
        }
      })
    }
    const query = searchParams.toString()
    return this.get<{
      data: any[]
      total: number
      page: number
      totalPages: number
    }>(`/volumes${query ? `?${query}` : ''}`)
  }

  async getVolume(id: number) {
    return this.get<any>(`/volumes/${id}`)
  }

  async getVolumeByChapter(chapterNumber: number) {
    return this.get<any>(`/volumes/by-chapter/${chapterNumber}`)
  }

  async getVolumeChapters(id: number) {
    return this.get<{
      chapters: number[]
      startChapter: number
      endChapter: number
    }>(`/volumes/${id}/chapters`)
  }

  async getOrganization(id: number) {
    return this.get<any>(`/organizations/${id}`)
  }

  async createOrganization(data: any) {
    return this.post<any>('/organizations', data)
  }

  async updateOrganization(id: number, data: any) {
    return this.put<any>(`/organizations/${id}`, data)
  }

  async deleteOrganization(id: number) {
    return this.delete<any>(`/organizations/${id}`)
  }

  async getAllMedia(params?: {
    page?: number
    limit?: number
    status?: string
    type?: string
  }) {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString())
        }
      })
    }
    const query = searchParams.toString()
    return this.get<{
      data: any[]
      total: number
      page: number
      totalPages: number
    }>(`/media${query ? `?${query}` : ''}`)
  }

  async getMediaItem(id: number) {
    return this.get<any>(`/media/${id}`)
  }

  async updateMedia(id: number, data: any) {
    return this.put<any>(`/media/${id}`, data)
  }

  async deleteMedia(id: number) {
    return this.delete<any>(`/media/${id}`)
  }

  async getApprovedMedia(params?: {
    page?: number
    limit?: number
    type?: string
    ownerType?: 'character' | 'arc' | 'event' | 'gamble' | 'organization' | 'user' | 'volume'
    ownerId?: number
    purpose?: 'gallery' | 'entity_display'
    description?: string
  }) {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString())
        }
      })
    }
    const query = searchParams.toString()
    return this.get<{
      data: any[]
      total: number
      page: number
      perPage: number
      totalPages: number
    }>(`/media/public${query ? `?${query}` : ''}`)
  }

  async getMediaForOwner(
    ownerType: 'character' | 'arc' | 'event' | 'gamble' | 'organization' | 'user' | 'volume',
    ownerId: number,
    params?: {
      chapter?: number
      type?: string
      page?: number
      limit?: number
    }
  ) {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString())
        }
      })
    }
    const query = searchParams.toString()
    return this.get<{
      data: any[]
      total: number
      page: number
      perPage: number
      totalPages: number
    }>(`/media/owner/${ownerType}/${ownerId}${query ? `?${query}` : ''}`)
  }

  async getDefaultMediaForOwner(
    ownerType: 'character' | 'arc' | 'event' | 'gamble' | 'organization' | 'user' | 'volume',
    ownerId: number
  ) {
    return this.get<any>(`/media/owner/${ownerType}/${ownerId}/default`)
  }

  async getEntityDisplayMedia(
    ownerType: 'character' | 'arc' | 'event' | 'gamble' | 'organization' | 'user' | 'volume',
    ownerId: number,
    params?: {
      chapter?: number
      type?: string
      page?: number
      limit?: number
    }
  ) {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString())
        }
      })
    }
    const query = searchParams.toString()
    return this.get<{
      data: any[]
      total: number
      page: number
      perPage: number
      totalPages: number
    }>(`/media/entity-display/${ownerType}/${ownerId}${query ? `?${query}` : ''}`)
  }

  async getGalleryMedia(
    ownerType: 'character' | 'arc' | 'event' | 'gamble' | 'organization' | 'user' | 'volume',
    ownerId: number,
    params?: {
      chapter?: number
      type?: string
      page?: number
      limit?: number
    }
  ) {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString())
        }
      })
    }
    const query = searchParams.toString()
    return this.get<{
      data: any[]
      total: number
      page: number
      perPage: number
      totalPages: number
    }>(`/media/gallery/${ownerType}/${ownerId}${query ? `?${query}` : ''}`)
  }


  async getThumbnailForUserProgress(
    ownerType: 'character' | 'arc' | 'event' | 'gamble' | 'organization' | 'user' | 'volume' | 'chapter' | 'guide' | 'quote' | 'media',
    ownerId: number,
    userProgress: number
  ) {
    return this.get<any>(`/media/thumbnail/${ownerType}/${ownerId}/${userProgress}`)
  }

  async getEntityDisplayMediaForCycling(
    ownerType: 'character' | 'arc' | 'event' | 'gamble' | 'organization' | 'user' | 'volume' | 'chapter' | 'guide' | 'quote' | 'media',
    ownerId: number,
    userProgress?: number
  ): Promise<{ data: any[] }> {
    const query = userProgress !== undefined ? `?userProgress=${userProgress}` : ''
    const response = await this.get<any>(`/media/entity-display/${ownerType}/${ownerId}/cycling${query}`)

    if (Array.isArray(response)) {
      return { data: response }
    }

    if (response && Array.isArray(response.data)) {
      return { data: response.data }
    }

    return { data: [] }
  }

  async setMediaAsDefault(mediaId: number) {
    return this.put<any>(`/media/${mediaId}/set-default`, {})
  }

  async createArc(data: any) {
    return this.post<any>('/arcs', data)
  }

  async updateArc(id: number, data: any) {
    return this.put<any>(`/arcs/${id}`, data)
  }

  async deleteArc(id: number) {
    return this.delete<any>(`/arcs/${id}`)
  }

  async updateArcImage(id: number, data: {
    imageFileName: string
    imageDisplayName?: string
  }) {
    return this.put<any>(`/arcs/${id}/image`, data)
  }

  async removeArcImage(id: number) {
    return this.delete<any>(`/arcs/${id}/image`)
  }

  async createCharacter(data: any) {
    return this.post<any>('/characters', data)
  }

  async updateCharacter(id: number, data: any) {
    return this.put<any>(`/characters/${id}`, data)
  }

  async deleteCharacter(id: number) {
    return this.delete<any>(`/characters/${id}`)
  }

  async updateCharacterImage(id: number, data: {
    imageFileName: string
    imageDisplayName?: string
  }) {
    return this.put<any>(`/characters/${id}/image`, data)
  }

  async removeCharacterImage(id: number) {
    return this.delete<any>(`/characters/${id}/image`)
  }

  async createGamble(data: any) {
    return this.post<any>('/gambles', data)
  }

  async updateGamble(id: number, data: any) {
    return this.put<any>(`/gambles/${id}`, data)
  }

  async deleteGamble(id: number) {
    return this.delete<any>(`/gambles/${id}`)
  }

  async createEvent(data: any) {
    return this.post<any>('/events', data)
  }

  async updateEvent(id: number, data: any) {
    return this.put<any>(`/events/${id}`, data)
  }

  async deleteEvent(id: number) {
    return this.delete<any>(`/events/${id}`)
  }

  // Admin guide methods (authenticated)
  async getGuidesAdmin(params?: { 
    page?: number; 
    limit?: number; 
    search?: string; 
    status?: string; 
    authorId?: number; 
    sortBy?: string; 
    sortOrder?: string;
    characterIds?: string;
    arcIds?: string;
    gambleIds?: string;
  }) {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString())
        }
      })
    }
    const query = searchParams.toString()
    return this.get<{
      data: any[]
      total: number
      page: number
      totalPages: number
    }>(`/guides${query ? `?${query}` : ''}`)
  }

  async getGuideAdmin(id: number) {
    return this.get<any>(`/guides/${id}`)
  }

  async updateGuide(id: number, data: any) {
    return this.patch<any>(`/guides/${id}`, data)
  }

  async deleteGuide(id: number) {
    return this.delete<any>(`/guides/${id}`)
  }

  // Guide approval methods (admin/moderator)
  async getPendingGuides(params?: { page?: number; limit?: number }) {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString())
        }
      })
    }
    const query = searchParams.toString()
    return this.get<{
      data: any[]
      total: number
      page: number
      totalPages: number
    }>(`/guides/pending${query ? `?${query}` : ''}`)
  }

  async approveGuide(id: number) {
    return this.post<any>(`/guides/${id}/approve`, {})
  }

  async rejectGuide(id: number, rejectionReason: string) {
    return this.post<any>(`/guides/${id}/reject`, { rejectionReason })
  }

  // Page Views and Trending methods
  async getLandingPageData(params?: { limit?: number; daysBack?: number }) {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString())
        }
      })
    }
    const query = searchParams.toString()
    return this.get<{
      trending: {
        guides: Array<{
          id: number
          title: string
          description: string
          viewCount: number
          recentViewCount: number
          author: { id: number; username: string }
          createdAt: string
        }>
        characters: Array<{
          id: number
          name: string
          description?: string
          viewCount: number
          recentViewCount: number
        }>
        events: Array<{
          id: number
          title: string
          description: string
          viewCount: number
          recentViewCount: number
        }>
        gambles: Array<{
          id: number
          name: string
          rules: string
          viewCount: number
          recentViewCount: number
        }>
      }
      stats: {
        totalGuides: number
        totalCharacters: number
        totalEvents: number
        totalGambles: number
      }
    }>(`/${query ? `?${query}` : ''}`)
  }

  async getFavoritesData() {
    return this.get<{
      favoriteQuotes: Array<{
        quote: {
          id: number
          text: string
          description?: string
          chapterNumber: number
          pageNumber?: number
          character: {
            id: number
            name: string
          }
        }
        userCount: number
      }>
      favoriteGambles: Array<{
        gamble: {
          id: number
          name: string
          rules: string
          winCondition?: string
          chapterId: number
        }
        userCount: number
      }>
      favoriteCharacterMedia: Array<{
        media: {
          id: number
          url: string
          fileName: string
          description?: string
          ownerType: string
          ownerId: number
          chapterNumber?: number
          character: {
            id: number
            name: string
          }
          submittedBy?: {
            id: number
            username: string
          } | null
        }
        userCount: number
      }>
    }>('/favorites')
  }

  async getTrendingPages(params?: { limit?: number; daysBack?: number }) {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString())
        }
      })
    }
    const query = searchParams.toString()
    return this.get<Array<{
      pageId: number
      pageType: 'guide' | 'character' | 'event' | 'gamble' | 'arc' | 'volume' | 'chapter' | 'quote'
      viewCount: number
      recentViewCount: number
      title: string
      description: string
    }>>(`/trending${query ? `?${query}` : ''}`)
  }

  async recordPageView(pageType: string, pageId: number) {
    return this.post<void>(`/page-views/${pageType}/${pageId}/view`, {})
  }

  async getPageViewCount(pageType: string, pageId: number) {
    return this.get<{ viewCount: number }>(`/page-views/${pageType}/${pageId}/count`)
  }

  async getUniquePageViewCount(pageType: string, pageId: number, hoursBack?: number) {
    const params = hoursBack ? `?hoursBack=${hoursBack}` : ''
    return this.get<{ uniqueViewCount: number; totalViewCount: number; hoursBack: number }>(
      `/page-views/${pageType}/${pageId}/unique-count${params}`
    )
  }


  async getTrendingPagesByType(limit?: number, daysBack?: number) {
    const params = new URLSearchParams()
    if (limit) params.append('limit', limit.toString())
    if (daysBack) params.append('daysBack', daysBack.toString())
    
    const queryString = params.toString()
    return this.get<Record<string, Array<{
      pageId: number
      pageType: string
      viewCount: number
      recentViewCount: number
      totalViewCount?: number
      recentTotalViewCount?: number
    }>>>(`/page-views/trending/by-type${queryString ? '?' + queryString : ''}`)
  }
}

export const api = new ApiClient(API_BASE_URL)

export default api
