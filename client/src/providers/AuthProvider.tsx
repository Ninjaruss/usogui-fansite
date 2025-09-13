'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { api } from '../lib/api'

// Extend Window interface to include authPopup
declare global {
  interface Window {
    authPopup?: Window | null
  }
}

interface User {
  id: number
  username: string
  email: string | null
  role: string
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
}

interface AuthContextType {
  user: User | null
  loading: boolean
  loginWithDiscord: () => void
  devLogin: (asAdmin?: boolean) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  // Legacy methods (keep for compatibility)
  login: (username: string, password: string) => Promise<void>
  register: (username: string, email: string, password: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isInitializing, setIsInitializing] = useState(false)

  const initializeAuth = async () => {
    // Prevent multiple simultaneous initialization attempts
    if (isInitializing) {
      console.log('[AUTH PROVIDER] Already initializing, skipping...')
      return
    }
    
    setIsInitializing(true)
    console.log('[AUTH PROVIDER] Initializing auth...')
    try {
      // Try existing token
      const existingToken = localStorage.getItem('accessToken')
      console.log('[AUTH PROVIDER] Existing token found:', existingToken ? 'YES' : 'NO')
      
      if (existingToken) {
        console.log('[AUTH PROVIDER] Setting API token and fetching user data')
        api.setToken(existingToken)
        try {
          const userData = await api.getCurrentUser()
          console.log('[AUTH PROVIDER] User data received:', userData.username)
          setUser(userData)
        } catch (error) {
          console.error('[AUTH PROVIDER] Error fetching user data:', error)
          
          // If token is expired, try refreshing it
          if ((error as any).status === 401) {
            console.log('[AUTH PROVIDER] Token expired, attempting refresh...')
            try {
              const refreshResult = await api.refreshToken()
              if (refreshResult && refreshResult.access_token) {
                console.log('[AUTH PROVIDER] Token refresh successful, setting user')
                api.setToken(refreshResult.access_token)
                localStorage.setItem('accessToken', refreshResult.access_token)
                
                // Fetch user data again with new token
                try {
                  const userData = await api.getCurrentUser()
                  console.log('[AUTH PROVIDER] User data received after token refresh:', userData.username)
                  setUser(userData)
                } catch (userError) {
                  console.error('[AUTH PROVIDER] Error fetching user data after token refresh:', userError)
                  localStorage.removeItem('accessToken')
                  api.setToken(null)
                  setUser(null)
                }
              } else {
                console.error('[AUTH PROVIDER] Token refresh response missing data')
                localStorage.removeItem('accessToken')
                api.setToken(null)
                setUser(null)
              }
            } catch (refreshError) {
              console.error('[AUTH PROVIDER] Token refresh failed:', refreshError)
              localStorage.removeItem('accessToken')
              api.setToken(null)
              setUser(null)
            }
          } else {
            console.error('[AUTH PROVIDER] Error fetching user not related to token expiration')
            localStorage.removeItem('accessToken')
            api.setToken(null)
            setUser(null)
          }
        }
      } else {
        console.log('[AUTH PROVIDER] No existing token, checking for refresh token...')
        // No access token in localStorage, but there might be a refresh token cookie
        // Try to refresh to get a new access token
        try {
          console.log('[AUTH PROVIDER] Attempting to refresh token without access token')
          const refreshResult = await api.refreshToken()
          if (refreshResult && refreshResult.access_token) {
            console.log('[AUTH PROVIDER] Token refresh successful, fetching user data')
            api.setToken(refreshResult.access_token)
            localStorage.setItem('accessToken', refreshResult.access_token)
            
            // Fetch user data with new token
            try {
              const userData = await api.getCurrentUser()
              console.log('[AUTH PROVIDER] User data received after refresh:', userData.username)
              setUser(userData)
            } catch (userError) {
              console.error('[AUTH PROVIDER] Error fetching user data after refresh:', userError)
              localStorage.removeItem('accessToken')
              api.setToken(null)
              setUser(null)
            }
          } else {
            console.log('[AUTH PROVIDER] No refresh token available or refresh failed')
            setUser(null)
          }
        } catch (refreshError) {
          console.log('[AUTH PROVIDER] No refresh token available, user remains null')
          // This is expected if no refresh token exists
          setUser(null)
        }
      }
    } catch (error) {
      console.error('[AUTH PROVIDER] Failed to initialize auth:', error)
      localStorage.removeItem('accessToken')
      api.setToken(null)
      setUser(null)
    } finally {
      console.log('[AUTH PROVIDER] Auth initialization complete, setting loading to false')
      setLoading(false)
      setIsInitializing(false)
    }
  }

  useEffect(() => {
    initializeAuth()
    
    // Simplified polling for auth callback detection only
    const pollForAuth = setInterval(() => {
      const authCallback = localStorage.getItem('authCallback')
      
      // Check if authCallback flag was set (indicates callback completed)
      if (authCallback) {
        console.log('[AUTH PROVIDER] Auth callback flag detected, refreshing auth state')
        initializeAuth()
        localStorage.removeItem('authCallback')
      }
    }, 1000) // Check every 1 second for faster response
    
    // Clear polling after 2 minutes (shorter timeout for auth callback)
    const clearPolling = setTimeout(() => {
      clearInterval(pollForAuth)
      console.log('[AUTH PROVIDER] Auth callback polling stopped after 2 minutes')
    }, 120000) // 2 minutes

    return () => {
      clearInterval(pollForAuth)
      clearTimeout(clearPolling)
    }
  }, []) // Remove user dependency to prevent loops

  useEffect(() => {
    // Listen for storage changes to detect when auth tokens are added from another tab
    const handleStorageChange = (event: StorageEvent) => {
      console.log('[AUTH PROVIDER] Storage event:', event.key, event.newValue)
      
      if (event.key === 'accessToken' && event.newValue && !user) {
        console.log('[AUTH PROVIDER] New access token detected, refreshing auth state')
        // New auth token detected, refresh auth state
        initializeAuth()
      }
      
      if (event.key === 'authCallback' && event.newValue) {
        console.log('[AUTH PROVIDER] Auth callback flag detected, refreshing auth state')
        // Auth callback completed, refresh auth state
        initializeAuth()
      }
    }

    // Listen for postMessage from auth callback tab
    const handleMessage = async (event: MessageEvent) => {
      console.log('[AUTH PROVIDER] Received message:', event.origin, event.data)

      // Ensure the message is from our domain
      if (event.origin !== window.location.origin) {
        console.log('[AUTH PROVIDER] Message origin mismatch:', event.origin, 'vs', window.location.origin)
        return
      }

      if (event.data.type === 'CLOSE_AUTH_POPUP') {
        console.log('[AUTH PROVIDER] Received close popup message')
        // Close the popup window if it exists
        if (window.authPopup && !window.authPopup.closed) {
          console.log('[AUTH PROVIDER] Closing auth popup window via close message')
          window.authPopup.close()
          window.authPopup = null
        }
        return
      }

      if (event.data.type === 'DISCORD_AUTH_SUCCESS') {
        console.log('[AUTH PROVIDER] Discord auth success message received')

        // Close the popup window if it exists
        if (window.authPopup && !window.authPopup.closed) {
          console.log('[AUTH PROVIDER] Closing auth popup window')
          window.authPopup.close()
          window.authPopup = null
        }

        // Process authentication success
        const { token, refreshUser } = event.data
        if (token) {
          console.log('[AUTH PROVIDER] Processing token from message')

          // Clear any existing token first
          localStorage.removeItem('accessToken')
          localStorage.setItem('accessToken', token)
          api.setToken(token)

          try {
            // Get user data and set it
            const userData = await api.getCurrentUser()
            setUser(userData)
            console.log('[AUTH PROVIDER] User data fetched and set:', userData.username)

            // Redirect to homepage if currently on login page
            if (window.location.pathname === '/login') {
              console.log('[AUTH PROVIDER] Redirecting to homepage')
              window.location.href = '/'
            } else if (refreshUser) {
              // If not on login page and refreshUser flag is set, refresh the current page
              console.log('[AUTH PROVIDER] Refreshing current page after auth')
              window.location.reload()
            }
          } catch (error) {
            console.error('[AUTH PROVIDER] Failed to fetch user data after auth:', error)
          }
        }
      }
    }

    // Listen for BroadcastChannel messages
    const handleBroadcastMessage = async (event: MessageEvent) => {
      console.log('[AUTH PROVIDER] Received broadcast message:', event.data)
      
      if (event.data.type === 'DISCORD_AUTH_SUCCESS') {
        console.log('[AUTH PROVIDER] Discord auth success broadcast received')

        // Close the popup window if it exists
        if (window.authPopup && !window.authPopup.closed) {
          console.log('[AUTH PROVIDER] Closing auth popup window from broadcast')
          window.authPopup.close()
          window.authPopup = null
        }

        // Process authentication success
        const { token, refreshUser } = event.data
        if (token) {
          console.log('[AUTH PROVIDER] Processing token from broadcast - Token length:', token.length)

          // Clear any existing token first
          localStorage.removeItem('accessToken')

          // Store token in this tab's localStorage
          localStorage.setItem('accessToken', token)
          api.setToken(token)

          console.log('[AUTH PROVIDER] Tokens stored, attempting to fetch user data...')

          try {
            // Get user data and set it
            const userData = await api.getCurrentUser()
            setUser(userData)
            console.log('[AUTH PROVIDER] User data fetched from broadcast:', userData.username, 'Role:', userData.role)

            // Redirect to homepage if currently on login page
            if (window.location.pathname === '/login') {
              console.log('[AUTH PROVIDER] Redirecting to homepage from broadcast')
              window.location.href = '/'
            } else if (refreshUser) {
              // If not on login page and refreshUser flag is set, refresh the current page
              console.log('[AUTH PROVIDER] Refreshing current page after broadcast auth')
              window.location.reload()
            }
          } catch (error) {
            console.error('[AUTH PROVIDER] Failed to fetch user data from broadcast:', error)
          }
        } else {
          console.error('[AUTH PROVIDER] Broadcast message missing token:', { token: !!token })
        }
      }
    }

    // Listen for custom event from auth callback
    const handleCustomEvent = async (event: Event) => {
      const customEvent = event as CustomEvent
      console.log('[AUTH PROVIDER] Custom event received:', customEvent.detail)
      
      if (customEvent.detail && customEvent.detail.token) {
        console.log('[AUTH PROVIDER] Processing token from custom event')
        const { token, refreshUser } = customEvent.detail
        
        // Clear any existing token first
        localStorage.removeItem('accessToken')
        localStorage.setItem('accessToken', token)
        api.setToken(token)
        
        try {
          // Get user data and set it
          const userData = await api.getCurrentUser()
          setUser(userData)
          console.log('[AUTH PROVIDER] User data fetched from custom event:', userData.username)
          
          // Redirect to homepage if currently on login page
          if (window.location.pathname === '/login') {
            console.log('[AUTH PROVIDER] Redirecting to homepage from custom event')
            window.location.href = '/'
          } else if (refreshUser) {
            // If not on login page and refreshUser flag is set, refresh the current page
            console.log('[AUTH PROVIDER] Refreshing current page after custom event auth')
            window.location.reload()
          }
        } catch (error) {
          console.error('[AUTH PROVIDER] Failed to fetch user data from custom event:', error)
        }
      }
    }

    // Set up BroadcastChannel for same-origin communication
    let authChannel: BroadcastChannel | null = null
    try {
      authChannel = new BroadcastChannel('auth_channel')
      authChannel.addEventListener('message', handleBroadcastMessage)
      console.log('[AUTH PROVIDER] BroadcastChannel setup successful')
    } catch (error) {
      console.log('[AUTH PROVIDER] BroadcastChannel not supported:', error)
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('message', handleMessage)
    window.addEventListener('discord-auth-success', handleCustomEvent)
    return () => {
      if (authChannel) {
        authChannel.removeEventListener('message', handleBroadcastMessage)
        authChannel.close()
      }
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('message', handleMessage)
      window.removeEventListener('discord-auth-success', handleCustomEvent)
    }
  }, []) // Remove user dependency to prevent loops

  const loginWithDiscord = () => {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    
    // Open in popup window instead of new tab for better communication
    const popup = window.open(
      `${API_BASE_URL}/api/auth/discord`, 
      'discord-login',
      'width=500,height=600,scrollbars=yes,resizable=yes'
    )
    
    // Focus the popup window
    if (popup) {
      popup.focus()
      
      // Store popup reference for later closing
      window.authPopup = popup
    }
  }

  const devLogin = async (asAdmin: boolean = false) => {
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      const response = await fetch(`${API_BASE_URL}/api/auth/dev-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important for cookies (refresh token)
        body: JSON.stringify({ asAdmin }),
      })
      
      if (!response.ok) {
        throw new Error('Development login failed')
      }
      
      const data = await response.json()
      
      // Store access token (refresh token is now handled via httpOnly cookie)
      localStorage.setItem('accessToken', data.access_token)
      api.setToken(data.access_token)
      
      setUser(data.user)
      
      // Return to the current page instead of forcing a reload
      // This prevents the login/logout cycle
      console.log('[AUTH PROVIDER] Dev login successful, user set:', data.user.username)
    } catch (error) {
      console.error('Dev login failed:', error)
      throw error
    }
  }

  const logout = async () => {
    try {
      // Call logout endpoint (refresh token is handled via httpOnly cookie)
      await api.logout()
    } catch (error) {
      console.error('Logout failed:', error)
    } finally {
      localStorage.removeItem('accessToken')
      api.setToken(null)
      setUser(null)
      // Redirect to home page after logout
      window.location.href = '/'
    }
  }

  // Legacy methods (keep for compatibility but may not be used)
  const login = async (username: string, password: string) => {
    try {
      const response = await api.login(username, password)
      setUser(response.user)
      // Force a page reload to ensure all data is refreshed with new auth state
      window.location.reload()
    } catch (error) {
      console.error('Login failed:', error)
      throw error
    }
  }

  const register = async (username: string, email: string, password: string) => {
    try {
      await api.register(username, email, password)
    } catch (error) {
      console.error('Registration failed:', error)
      throw error
    }
  }

  const refreshUser = async () => {
    try {
      const userData = await api.getCurrentUser()
      setUser(userData)
    } catch (error) {
      console.error('Failed to refresh user:', error)
      throw error
    }
  }

  const value = {
    user,
    loading,
    loginWithDiscord,
    devLogin,
    logout,
    refreshUser,
    // Legacy methods
    login,
    register,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}