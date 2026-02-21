'use client'

import { useEffect, useState } from 'react'

// SECURITY: Validate that a URL is same-origin to prevent open redirect attacks
function isValidReturnUrl(url: string): boolean {
  try {
    const parsed = new URL(url, window.location.origin)
    // Only allow same-origin redirects
    return parsed.origin === window.location.origin
  } catch {
    // If URL parsing fails, check if it's a relative path
    return url.startsWith('/') && !url.startsWith('//')
  }
}

export default function AuthCallback() {
  const [status, setStatus] = useState('Processing authentication...')
  const [isError, setIsError] = useState(false)
  const [hasProcessed, setHasProcessed] = useState(false)

  useEffect(() => {
    // Prevent processing the callback multiple times (infinite loop guard)
    if (hasProcessed) {
      console.log('[AUTH CALLBACK] Already processed, skipping')
      return
    }

    const processAuth = async () => {
      try {
        // Mark as processed immediately to prevent re-entry
        setHasProcessed(true)
        // Extract tokens from URL
        const urlParams = new URLSearchParams(window.location.search)
        const token = urlParams.get('token')
        const refreshToken = urlParams.get('refreshToken')
        const error = urlParams.get('error')

        if (error) {
          setStatus('Authentication failed. Redirecting to login...')
          setIsError(true)
          setTimeout(() => {
            window.location.href = '/login?error=' + encodeURIComponent(error)
          }, 2000)
          return
        }

        if (!token) {
          setStatus('Authentication failed. Redirecting to login...')
          setIsError(true)
          setTimeout(() => {
            window.location.href = '/login?error=missing_token'
          }, 2000)
          return
        }

        // Validate token format (basic JWT structure check)
        if (!token.includes('.') || token.split('.').length !== 3) {
          setStatus('Authentication failed. Redirecting to login...')
          setIsError(true)
          setTimeout(() => {
            window.location.href = '/login?error=invalid_token'
          }, 2000)
          return
        }

        // If we have a refresh token, store it as httpOnly cookie via backend endpoint
        // This avoids third-party cookie blocking issues with popup-based OAuth
        if (refreshToken) {
          console.log('[AUTH CALLBACK] Setting refresh token cookie via API')
          const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === 'production' ? 'https://l-file.com/api' : 'http://localhost:3001/api')

          try {
            const response = await fetch(`${API_BASE_URL}/auth/set-cookie`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'Fetch',
              },
              credentials: 'include',
              body: JSON.stringify({ refreshToken }),
            })

            if (!response.ok) {
              console.error('[AUTH CALLBACK] Failed to set cookie:', response.status)
            } else {
              console.log('[AUTH CALLBACK] Cookie set successfully')
            }
          } catch (err) {
            console.error('[AUTH CALLBACK] Error setting cookie:', err)
          }

          // IMPORTANT: Remove refresh token from URL for security
          // Replace URL without the refreshToken parameter
          const newUrl = new URL(window.location.href)
          newUrl.searchParams.delete('refreshToken')
          window.history.replaceState({}, '', newUrl.toString())
        }

        // SECURITY: Use BroadcastChannel to communicate token to main tab
        // Token is NOT stored in localStorage to prevent XSS token theft
        // The AuthProvider will receive this and store token in memory only
        try {
          const authChannel = new BroadcastChannel('auth_channel')
          authChannel.postMessage({
            type: 'DISCORD_AUTH_SUCCESS',
            token: token,
            refreshUser: true
          })
          authChannel.close()
        } catch (broadcastError) {
          // BroadcastChannel not supported, try postMessage to opener
          console.log('[AUTH CALLBACK] BroadcastChannel failed, trying opener.postMessage')
          if (window.opener) {
            window.opener.postMessage({
              type: 'DISCORD_AUTH_SUCCESS',
              token: token,
              refreshUser: true
            }, window.location.origin)
          }
        }

        // Check for return URL from sessionStorage (not localStorage for slightly better security)
        // SECURITY: Validate URL to prevent open redirect attacks
        const returnUrl = sessionStorage.getItem('authReturnUrl')
        let redirectUrl = '/'

        if (returnUrl && isValidReturnUrl(returnUrl)) {
          redirectUrl = returnUrl
          sessionStorage.removeItem('authReturnUrl')
        }

        setStatus('Authentication successful! Redirecting...')

        // If this is a popup, try to close it and let the opener handle redirect
        if (window.opener) {
          window.opener.postMessage({ type: 'CLOSE_AUTH_POPUP' }, window.location.origin)
          setTimeout(() => {
            window.close()
          }, 500)
          return
        }

        // Redirect to the intended destination after a brief delay
        setTimeout(() => {
          window.location.href = redirectUrl
        }, 1000)

      } catch (error) {
        console.error('[AUTH CALLBACK] Error processing auth:', error)
        setStatus('Authentication failed. Redirecting to login...')
        setIsError(true)
        setTimeout(() => {
          window.location.href = '/login?error=callback_error'
        }, 2000)
      }
    }

    processAuth()
  }, [hasProcessed])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center max-w-md">
        <h1 className="text-2xl font-bold mb-4">Authentication</h1>
        <p className={`mb-4 ${isError ? 'text-red-400' : 'text-gray-300'}`}>{status}</p>
        <div className="mt-4 animate-spin inline-block w-6 h-6 border-[3px] border-current border-t-transparent text-blue-400 rounded-full mb-4"></div>
        <p className="text-sm text-gray-400">
          {isError
            ? "Please wait..."
            : status.includes('successful')
              ? "Taking you to your destination..."
              : "Please wait while we complete the process..."
          }
        </p>
      </div>
    </div>
  )
}
