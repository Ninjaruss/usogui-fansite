const resolvedApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim()

const defaultApiUrl = process.env.NODE_ENV === 'production'
  ? 'https://l-file.com/api'
  : 'http://localhost:3001/api'

export const API_BASE_URL = resolvedApiUrl || defaultApiUrl

// Debug logging helper - only logs in development
const isDev = process.env.NODE_ENV === 'development'
const debugLog = (...args: unknown[]) => {
  if (isDev) {
    console.log(...args)
  }
}


class ApiClient {
  private baseURL: string
  // SECURITY: Access token stored in memory only (not localStorage)
  // This prevents XSS attacks from stealing tokens
  // Refresh tokens are stored in httpOnly cookies (handled by server)
  private token: string | null = null

  // SECURITY: Prevent race conditions in token refresh
  // When multiple requests get 401 simultaneously, only one should refresh
  private refreshPromise: Promise<any> | null = null

  constructor(baseURL: string) {
    this.baseURL = baseURL
    // NOTE: Token is no longer loaded from localStorage on init
    // It will be set via setToken() after authentication or silent refresh
  }

  setToken(token: string | null) {
    // SECURITY: Token stored in memory only - not persisted to localStorage
    this.token = token
  }

  getToken(): string | null {
    return this.token
  }

  hasToken(): boolean {
    return this.token !== null
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`
    const headers: Record<string, string> = {
      ...(typeof options.headers === 'object' && options.headers ? options.headers as Record<string, string> : {}),
      // SECURITY: Custom header for CSRF protection
      // This header can't be sent cross-origin without CORS preflight approval
      'X-Requested-With': 'Fetch',
    }

    // Only set Content-Type if body is not FormData
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json'
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }

    // RELIABILITY: Add timeout to prevent hanging requests
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

    let response: Response
    try {
      response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include', // Important for cookies (refresh token)
        signal: controller.signal,
      })
    } catch (fetchError) {
      clearTimeout(timeoutId)
      // Handle abort/timeout errors
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        throw new Error(`Request timeout: ${endpoint} took longer than 30 seconds`)
      }
      throw fetchError
    } finally {
      clearTimeout(timeoutId)
    }

    // Handle token expiration (401 Unauthorized)
    if (response.status === 401 && 
        endpoint !== '/auth/refresh' && 
        endpoint !== '/auth/login' &&
        endpoint !== '/auth/logout') {
      debugLog('[API] Token expired, attempting to refresh...')
      try {
        // Try to refresh the token
        const refreshResult = await this.refreshToken()
        if (refreshResult && refreshResult.access_token) {
          debugLog('[API] Token refresh successful, retrying original request')
          // Retry the original request with the new token
          return this.request<T>(endpoint, options)
        }
      } catch (refreshError) {
        console.error('[API] Token refresh failed:', refreshError)
        // If refresh fails, clear token and fall through to handle 401 gracefully
        this.setToken(null)
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
        // Empty response body is valid for some endpoints
        return undefined as T
      }
      return JSON.parse(text)
    } catch (jsonError) {
      // RELIABILITY: Don't silently swallow JSON parse errors
      // This prevents downstream "Cannot read property of undefined" errors
      console.error('[API] JSON parse error for endpoint:', endpoint, 'Response text:', text?.substring(0, 500))
      console.error('[API] JSON parse error details:', jsonError)

      // Throw a proper error instead of returning undefined
      // This lets callers handle the error appropriately
      const parseError = new Error(`Invalid JSON response from ${endpoint}`)
      ;(parseError as any).status = response.status
      ;(parseError as any).responseText = text?.substring(0, 200) // Truncate for debugging
      ;(parseError as any).isParseError = true
      throw parseError
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
    // SECURITY: Prevent multiple concurrent refresh attempts (race condition fix)
    // If a refresh is already in progress, wait for it instead of starting another
    if (this.refreshPromise) {
      debugLog('[API] Token refresh already in progress, waiting...')
      return this.refreshPromise
    }

    this.refreshPromise = this._doRefreshToken()

    try {
      return await this.refreshPromise
    } finally {
      // Clear the promise so future refreshes can proceed
      this.refreshPromise = null
    }
  }

  private async _doRefreshToken() {
    try {
      debugLog('[API] Attempting to refresh token')
      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'Fetch', // CSRF protection
        },
        credentials: 'include', // Important for cookies (refresh token)
      });

      if (!response.ok) {
        // Only log as error for unexpected status codes (not 401, which is expected when no refresh token exists)
        if (response.status !== 401) {
          console.error('[API] Token refresh failed:', response.status, response.statusText)
        } else {
          debugLog('[API] No valid refresh token available (401)')
        }
        throw new Error('Token refresh failed')
      }

      const data = await response.json();
      debugLog('[API] Token refresh successful')

      // Update token
      this.setToken(data.access_token)
      return data
    } catch (error) {
      // Only log as error if it's not the expected "Token refresh failed" error from 401 response
      if (error instanceof Error && error.message === 'Token refresh failed') {
        debugLog('[API] Token refresh unavailable - user needs to log in')
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
    includeHierarchy?: boolean
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

  async getEvents(params?: { page?: number; limit?: number; title?: string; type?: string; status?: string; character?: string }) {
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
    status?: string;
    character?: string;
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

  async getMyGuideSubmission(id: number) {
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
    usageType: 'character_image' | 'guide_image' | 'gallery_upload'
  }) {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', data.type)
    formData.append('ownerType', data.ownerType)
    formData.append('ownerId', data.ownerId.toString())
    formData.append('usageType', data.usageType)
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

  async getUserSubmissions() {
    return this.request('/users/my-submissions');
  }

  async getPublicUserSubmissions(userId: number) {
    return this.request(`/users/${userId}/submissions`);
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

  async getMediaItem(id: string) {
    return this.get<any>(`/media/${id}`)
  }

  async updateMedia(id: string, data: any) {
    return this.put<any>(`/media/${id}`, data)
  }

  async deleteMedia(id: string) {
    return this.delete<any>(`/media/${id}`)
  }

  async getMyMediaSubmission(id: string) {
    return this.get<any>(`/media/${id}`)
  }

  async updateOwnMedia(id: string, formData: FormData) {
    return this.request<any>(`/media/my-submissions/${id}`, {
      method: 'PATCH',
      body: formData,
    })
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

  async setMediaAsDefault(mediaId: string) {
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

  async updateOwnEvent(id: number, data: any) {
    return this.put<any>(`/events/${id}/own`, data)
  }

  async deleteEvent(id: number) {
    return this.delete<any>(`/events/${id}`)
  }

  async approveEvent(id: number) {
    return this.put<any>(`/events/${id}/approve`, {})
  }

  async rejectEvent(id: number, rejectionReason: string) {
    return this.put<any>(`/events/${id}/reject`, { rejectionReason })
  }

  async getEventsByArc(arcId: number, options?: { status?: string; userProgress?: number }) {
    const params = new URLSearchParams()
    if (options?.status) params.append('status', options.status)
    if (options?.userProgress) params.append('userProgress', options.userProgress.toString())
    const query = params.toString()
    return this.get<any[]>(`/events/by-arc/${arcId}${query ? `?${query}` : ''}`)
  }

  async getEventsByGamble(gambleId: number, options?: { status?: string; userProgress?: number }) {
    const params = new URLSearchParams()
    if (options?.status) params.append('status', options.status)
    if (options?.userProgress) params.append('userProgress', options.userProgress.toString())
    const query = params.toString()
    return this.get<any[]>(`/events/by-gamble/${gambleId}${query ? `?${query}` : ''}`)
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

  // Annotation methods
  async getAnnotationsForCharacter(characterId: number) {
    const response = await this.get<{ data: any[] }>(`/annotations/character/${characterId}`)
    return response.data
  }

  async getAnnotationsForGamble(gambleId: number) {
    const response = await this.get<{ data: any[] }>(`/annotations/gamble/${gambleId}`)
    return response.data
  }

  async getAnnotationsForChapter(chapterId: number) {
    const response = await this.get<{ data: any[] }>(`/annotations/chapter/${chapterId}`)
    return response.data
  }

  async getAnnotationsForArc(arcId: number) {
    const response = await this.get<{ data: any[] }>(`/annotations/arc/${arcId}`)
    return response.data
  }

  async getMyAnnotations() {
    const response = await this.get<{ data: any[] }>('/annotations/my')
    return response.data
  }

  async createAnnotation(data: {
    ownerType: 'character' | 'gamble' | 'chapter' | 'arc'
    ownerId: number
    title: string
    content: string
    sourceUrl?: string
    chapterReference?: number
    isSpoiler?: boolean
    spoilerChapter?: number
  }) {
    return this.post<any>('/annotations', data)
  }

  async updateAnnotation(id: number, data: {
    title?: string
    content?: string
    sourceUrl?: string
    chapterReference?: number
    isSpoiler?: boolean
    spoilerChapter?: number
  }) {
    return this.patch<any>(`/annotations/${id}`, data)
  }

  async deleteAnnotation(id: number) {
    return this.delete<void>(`/annotations/${id}`)
  }

  async getAnnotationsAdmin(params?: {
    status?: 'pending' | 'approved' | 'rejected'
    ownerType?: 'character' | 'gamble' | 'chapter' | 'arc'
    authorId?: number
    page?: number
    limit?: number
    sortOrder?: 'ASC' | 'DESC'
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
    }>(`/annotations${query ? `?${query}` : ''}`)
  }

  async getPendingAnnotations(params?: { page?: number; limit?: number }) {
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
    }>(`/annotations/pending${query ? `?${query}` : ''}`)
  }

  async getPendingAnnotationsCount() {
    return this.get<{ count: number }>('/annotations/pending/count')
  }

  async getAnnotation(id: number) {
    return this.get<any>(`/annotations/${id}`)
  }

  async approveAnnotation(id: number) {
    return this.post<any>(`/annotations/${id}/approve`, {})
  }

  async rejectAnnotation(id: number, rejectionReason: string) {
    return this.post<any>(`/annotations/${id}/reject`, { rejectionReason })
  }

  // Contribution methods
  async getUserContributions(userId: number) {
    return this.get<{
      userId: number
      username: string
      submissions: {
        guides: number
        media: number
        annotations: number
        quotes: number
        total: number
      }
      edits: {
        characters: number
        gambles: number
        arcs: number
        organizations: number
        events: number
        total: number
      }
      totalContributions: number
    }>(`/contributions/user/${userId}`)
  }

  async getUserContributionCount(userId: number) {
    return this.get<{ count: number }>(`/contributions/user/${userId}/count`)
  }

  async getUserContributionDetails(userId: number) {
    return this.get<{
      guides: Array<{
        id: number
        title: string
        status: string
        createdAt: string
      }>
      media: Array<{
        id: number
        description: string
        url: string
        ownerType: string
        status: string
        createdAt: string
      }>
      annotations: Array<{
        id: number
        title: string
        ownerType: string
        ownerId: number
        status: string
        createdAt: string
      }>
    }>(`/contributions/user/${userId}/details`)
  }
}

export const api = new ApiClient(API_BASE_URL)

export default api
