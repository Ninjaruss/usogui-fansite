'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { api } from '../lib/api'
import { API_BASE_URL } from '../lib/api'

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
  profilePictureType?: 'discord' | 'character_media' | 'premium_character_media' | 'animated_avatar' | 'custom_frame' | 'exclusive_artwork' | null
  selectedCharacterMediaId?: number | null
  customRole?: string | null
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
  loginWithFluxer: () => void
  devLogin: (asAdmin?: boolean) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  updateUserField: (field: keyof User, value: any) => void
  isModeratorOrAdmin: boolean // For moderation tasks (comments, bans)
  isEditor: boolean // Editor role specifically
  canEditContent: boolean // Can edit official content (Admin, Moderator, Editor)
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
  const [mounted, setMounted] = useState(false)
  const hasInitialized = useRef(false)
  const initializeAuthRef = useRef<(() => Promise<void>) | null>(null)

  // Track when component is mounted (client-side only)
  useEffect(() => {
    setMounted(true)
  }, [])

  const initializeAuth = useCallback(async () => {
    // Only initialize on client side
    if (!mounted || typeof window === 'undefined') {
      return
    }

    // Prevent multiple simultaneous initialization attempts
    if (isInitializing) {
      console.log('[AUTH PROVIDER] Already initializing, skipping...')
      return
    }

    setIsInitializing(true)
    console.log('[AUTH PROVIDER] Initializing auth...')

    try {
      // SECURITY: Access tokens are now stored in memory only (not localStorage)
      // On page load, we always try to get a new token via refresh token cookie
      // This is more secure as tokens can't be stolen via XSS

      // Check if we have a token in memory (e.g., from a previous auth in this session)
      if (api.hasToken()) {
        console.log('[AUTH PROVIDER] Token exists in memory, fetching user data')
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

                // Fetch user data again with new token
                const userData = await api.getCurrentUser()
                console.log('[AUTH PROVIDER] User data received after token refresh:', userData.username)
                setUser(userData)
              } else {
                console.error('[AUTH PROVIDER] Token refresh response missing data')
                api.setToken(null)
                setUser(null)
              }
            } catch (refreshError) {
              console.error('[AUTH PROVIDER] Token refresh failed:', refreshError)
              api.setToken(null)
              setUser(null)
            }
          } else {
            console.error('[AUTH PROVIDER] Error fetching user not related to token expiration')
            api.setToken(null)
            setUser(null)
          }
        }
      } else {
        // No token in memory - try silent refresh via httpOnly refresh token cookie
        console.log('[AUTH PROVIDER] No token in memory, attempting silent refresh...')
        try {
          const refreshResult = await api.refreshToken()
          if (refreshResult && refreshResult.access_token) {
            console.log('[AUTH PROVIDER] Silent refresh successful, fetching user data')
            api.setToken(refreshResult.access_token)

            // Fetch user data with new token
            const userData = await api.getCurrentUser()
            console.log('[AUTH PROVIDER] User data received after refresh:', userData.username)
            setUser(userData)
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
      api.setToken(null)
      setUser(null)
    } finally {
      console.log('[AUTH PROVIDER] Auth initialization complete, setting loading to false')
      setLoading(false)
      setIsInitializing(false)
    }
  }, [mounted])  // Only depend on mounted state

  // Update the ref when the function changes
  useEffect(() => {
    initializeAuthRef.current = initializeAuth
  }, [initializeAuth])

  useEffect(() => {
    // Only initialize auth once when component is mounted (client-side)
    if (!mounted || hasInitialized.current) return

    hasInitialized.current = true
    initializeAuth()
  }, [mounted]) // Only depend on mounted state

  useEffect(() => {
    // Only start polling when component is mounted (client-side)
    if (!mounted) return

    // SECURITY: Removed localStorage polling for auth callback
    // Auth state is now managed via:
    // 1. BroadcastChannel for same-origin tab communication
    // 2. postMessage from auth popup
    // 3. Silent refresh via httpOnly cookie on page load

    // No polling needed - this is more efficient and secure
    return () => {}
  }, [mounted]) // Only depend on mounted state

  useEffect(() => {
    // Only add event listeners when component is mounted (client-side)
    if (!mounted || typeof window === 'undefined') return

    // SECURITY: Storage event listener for cross-tab logout only
    // Access tokens are no longer stored in localStorage
    const handleStorageChange = (event: StorageEvent) => {
      // Only handle logout signals - tokens are not in localStorage anymore
      if (event.key === 'logout_signal' && event.newValue) {
        console.log('[AUTH PROVIDER] Logout signal detected from another tab')
        api.setToken(null)
        setUser(null)
        // Clear sessionStorage to remove cached data (like guide likes)
        sessionStorage.clear()
        // Clear the signal
        localStorage.removeItem('logout_signal')
        // Reload the page to clear all cached state
        window.location.reload()
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

          // SECURITY: Token stored in memory only (not localStorage)
          api.setToken(token)

          try {
            // Get user data and set it
            const userData = await api.getCurrentUser()
            setUser(userData)
            console.log('[AUTH PROVIDER] User data fetched and set:', userData.username)

            // Check for return URL (still using sessionStorage for non-sensitive data)
            const returnUrl = sessionStorage.getItem('authReturnUrl')
            if (returnUrl) {
              console.log('[AUTH PROVIDER] Redirecting to return URL:', returnUrl)
              sessionStorage.removeItem('authReturnUrl')
              window.location.href = returnUrl
            } else if (window.location.pathname === '/login') {
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

          // SECURITY: Token stored in memory only (not localStorage)
          api.setToken(token)

          console.log('[AUTH PROVIDER] Token set in memory, attempting to fetch user data...')

          try {
            // Get user data and set it
            const userData = await api.getCurrentUser()
            setUser(userData)
            console.log('[AUTH PROVIDER] User data fetched from broadcast:', userData.username, 'Role:', userData.role)

            // Check for return URL (using sessionStorage for non-sensitive data)
            const returnUrl = sessionStorage.getItem('authReturnUrl')
            if (returnUrl) {
              console.log('[AUTH PROVIDER] Redirecting to return URL from broadcast:', returnUrl)
              sessionStorage.removeItem('authReturnUrl')
              window.location.href = returnUrl
            } else if (window.location.pathname === '/login') {
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

        // SECURITY: Token stored in memory only (not localStorage)
        api.setToken(token)

        try {
          // Get user data and set it
          const userData = await api.getCurrentUser()
          setUser(userData)
          console.log('[AUTH PROVIDER] User data fetched from custom event:', userData.username)

          // Check for return URL (using sessionStorage for non-sensitive data)
          const returnUrl = sessionStorage.getItem('authReturnUrl')
          if (returnUrl) {
            console.log('[AUTH PROVIDER] Redirecting to return URL from custom event:', returnUrl)
            sessionStorage.removeItem('authReturnUrl')
            window.location.href = returnUrl
          } else if (window.location.pathname === '/login') {
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
  }, [mounted, user]) // Remove initializeAuth dependency

  const loginWithDiscord = () => {
    // Open in popup window instead of new tab for better communication
    const popup = window.open(
      `${API_BASE_URL}/auth/discord`,
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

  const loginWithFluxer = () => {
    const popup = window.open(
      `${API_BASE_URL}/auth/fluxer`,
      'fluxer-login',
      'width=500,height=600,scrollbars=yes,resizable=yes'
    )

    if (popup) {
      popup.focus()
      window.authPopup = popup
    }
  }

  const devLogin = async (asAdmin: boolean = false) => {
    // SECURITY: Dev login is strictly for local development only
    // Never expose secrets in client bundles via NEXT_PUBLIC_* variables
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Development login is not available in production')
    }

    try {
      // SECURITY: Prompt for secret at runtime instead of storing in bundle
      // This prevents the secret from being extracted from JS source
      let devSecret = sessionStorage.getItem('_dev_secret')
      if (!devSecret) {
        devSecret = window.prompt('Enter development bypass secret:')
        if (!devSecret) {
          throw new Error('Development secret is required')
        }
        // Store in sessionStorage (cleared when browser closes, not persisted)
        sessionStorage.setItem('_dev_secret', devSecret)
      }

      const response = await fetch(`${API_BASE_URL}/auth/dev-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Dev-Secret': devSecret,
          'X-Requested-With': 'Fetch', // CSRF protection
        },
        credentials: 'include', // Important for cookies (refresh token)
        body: JSON.stringify({ asAdmin, devSecret }),
      })

      if (!response.ok) {
        // Clear stored secret on auth failure (might be wrong)
        sessionStorage.removeItem('_dev_secret')
        throw new Error('Development login failed - check your secret')
      }

      const data = await response.json()

      // SECURITY: Token stored in memory only (refresh token is in httpOnly cookie)
      api.setToken(data.access_token)

      setUser(data.user)

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
      api.setToken(null)
      setUser(null)
      // Clear sessionStorage to remove cached data (like guide likes)
      sessionStorage.clear()
      // Signal other tabs to logout (non-sensitive, just a trigger)
      localStorage.setItem('logout_signal', Date.now().toString())
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

  const updateUserField = (field: keyof User, value: any) => {
    if (user) {
      setUser({
        ...user,
        [field]: value
      })
    }
  }

  const value = {
    user,
    loading,
    loginWithDiscord,
    loginWithFluxer,
    devLogin,
    logout,
    refreshUser,
    updateUserField,
    isModeratorOrAdmin: user?.role === 'admin' || user?.role === 'moderator',
    isEditor: user?.role === 'editor',
    canEditContent: user?.role === 'admin' || user?.role === 'moderator' || user?.role === 'editor',
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