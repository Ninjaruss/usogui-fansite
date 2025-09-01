const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'


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
    })

    if (!response.ok) {
      let errorMessage: string
      let errorDetails: any = null
      
      try {
        const errorResponse = await response.json()
        errorMessage = errorResponse.message || errorResponse.error || `HTTP ${response.status}: ${response.statusText}`
        errorDetails = errorResponse
      } catch {
        errorMessage = `HTTP ${response.status}: ${response.statusText}`
      }
      
      const error = new Error(errorMessage)
      ;(error as any).status = response.status
      ;(error as any).details = errorDetails
      ;(error as any).url = url
      ;(error as any).method = options.method || 'GET'
      
      throw error
    }

    return response.json()
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
      isEmailVerified: boolean
      userProgress: number
      profileImageId?: string
      favoriteQuoteId?: number
      favoriteGambleId?: number
    }>('/auth/me')
  }

  async refreshToken() {
    const response = await this.post<{
      access_token: string
      user: any
    }>('/auth/refresh', {})
    
    this.setToken(response.access_token)
    return response
  }

  // Content methods
  async getCharacters(params?: {
    page?: number
    limit?: number
    name?: string
    arc?: string
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

  async getCharacterGuides(characterId: number, params?: { page?: number; limit?: number }) {
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

  async getEvents(params?: { page?: number; limit?: number }) {
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

  async getEvent(id: number) {
    return this.get<any>(`/events/${id}`)
  }

  async search(query: string, type?: string, userProgress?: number) {
    const params = new URLSearchParams({ query })
    if (type) params.append('type', type)
    if (userProgress !== undefined) params.append('userProgress', userProgress.toString())
    
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

  async getGuides(params?: { page?: number; limit?: number; title?: string }) {
    const searchParams = new URLSearchParams()
    if (params) {
      // Map title to search parameter to match backend API
      if (params.title) {
        searchParams.append('search', params.title)
      }
      if (params.page) {
        searchParams.append('page', params.page.toString())
      }
      if (params.limit) {
        searchParams.append('limit', params.limit.toString())
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

  async createGuide(data: {
    title: string
    description: string
    content: string
    tags?: string[]
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

  async submitMedia(data: {
    url: string
    characterId?: number
    arcId?: number
    description?: string
  }) {
    return this.post<any>('/media', data)
  }

  async createMedia(data: {
    url: string
    type: 'image' | 'video' | 'audio'
    description?: string
    characterId?: number
    arcId?: number
    eventId?: number
    status?: 'pending' | 'approved' | 'rejected'
    rejectionReason?: string
  }) {
    return this.post<any>('/media', data)
  }

  async uploadMedia(file: File, data: {
    type: 'image' | 'video' | 'audio'
    description?: string
    characterId?: number
    arcId?: number
    eventId?: number
  }) {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', data.type)
    if (data.description) formData.append('description', data.description)
    if (data.characterId) formData.append('characterId', data.characterId.toString())
    if (data.arcId) formData.append('arcId', data.arcId.toString())
    if (data.eventId) formData.append('eventId', data.eventId.toString())

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
    profileImageId?: string
    favoriteQuoteId?: number
    favoriteGambleId?: number
  }) {
    return this.patch<any>('/users/profile', data)
  }

  async updateUserProgress(userProgress: number) {
    return this.put<{ message: string; userProgress: number }>('/users/profile/progress', { userProgress })
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
    character?: string
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

  async getFactions(params?: {
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
    }>(`/factions${query ? `?${query}` : ''}`)
  }

  async getFaction(id: number) {
    return this.get<any>(`/factions/${id}`)
  }

  async createFaction(data: any) {
    return this.post<any>('/factions', data)
  }

  async updateFaction(id: number, data: any) {
    return this.put<any>(`/factions/${id}`, data)
  }

  async deleteFaction(id: number) {
    return this.delete<any>(`/factions/${id}`)
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
  async getGuidesAdmin(params?: { page?: number; limit?: number; search?: string; status?: string; authorId?: number; sortBy?: string; sortOrder?: string }) {
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
}

export const api = new ApiClient(API_BASE_URL)

export default api