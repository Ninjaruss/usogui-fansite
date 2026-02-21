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
        const rt = urlParams.get('rt')
        const error = urlParams.get('error')
        const linked = urlParams.get('linked')

        // Handle account linking success (no new token, just signal the opener)
        if (linked) {
          setStatus(`${linked.charAt(0).toUpperCase() + linked.slice(1)} account linked successfully!`)
          try {
            const authChannel = new BroadcastChannel('auth_channel')
            authChannel.postMessage({ type: 'ACCOUNT_LINKED', provider: linked })
            authChannel.close()
          } catch {
            if (window.opener) {
              window.opener.postMessage({ type: 'ACCOUNT_LINKED', provider: linked }, window.location.origin)
            }
          }
          // Always close the popup — window.opener may be null due to browser policy
          setTimeout(() => window.close(), 500)
          return
        }

        if (error) {
          setStatus('Authentication failed. Redirecting to login...')
          setIsError(true)
          // If in a popup, signal the opener about the error and close
          if (window.opener) {
            try {
              const authChannel = new BroadcastChannel('auth_channel')
              authChannel.postMessage({ type: 'ACCOUNT_LINK_ERROR', error })
              authChannel.close()
            } catch {
              window.opener.postMessage({ type: 'ACCOUNT_LINK_ERROR', error }, window.location.origin)
            }
          }
          // Close if in a popup; otherwise redirect to login
          if (window.opener) {
            setTimeout(() => window.close(), 1500)
          } else {
            setTimeout(() => {
              window.location.href = '/login?error=' + encodeURIComponent(error)
            }, 2000)
          }
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

        // Establish the refresh token cookie via a direct POST.
        // Cookies set on redirect responses are unreliable across browsers and
        // cross-domain setups, so we use a separate fetch with credentials: 'include'
        // which always works correctly.
        if (rt) {
          try {
            const apiBase = (process.env.NEXT_PUBLIC_API_URL || 'https://l-file.com/api').replace(/\/$/, '')
            await fetch(`${apiBase}/auth/establish-session`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ refreshToken: rt }),
            })
            // Remove rt from URL so it doesn't linger in browser history
            const cleanUrl = new URL(window.location.href)
            cleanUrl.searchParams.delete('rt')
            window.history.replaceState({}, '', cleanUrl.toString())
          } catch {
            // Non-fatal: access token still works for the current session
          }
        }

        // Store token as a short-lived sessionStorage bridge so AuthProvider can pick it
        // up on the next page. BroadcastChannel does NOT dispatch to the sender tab
        // (per spec), so this is the only reliable mechanism for direct-navigation OAuth.
        // The bridge is consumed (deleted) immediately by AuthProvider on init.
        try {
          sessionStorage.setItem('_oauth_token_bridge', JSON.stringify({
            token,
            expires: Date.now() + 60000 // 60s window
          }))
        } catch {
          // sessionStorage unavailable (e.g. private mode on some browsers)
        }

        // Also broadcast to any OTHER open tabs that may have a parent AuthProvider
        // (covers the popup flow where BroadcastChannel IS received by the opener tab)
        try {
          const authChannel = new BroadcastChannel('auth_channel')
          authChannel.postMessage({
            type: 'OAUTH_AUTH_SUCCESS',
            token: token,
            refreshUser: true
          })
          authChannel.close()
        } catch {
          if (window.opener) {
            window.opener.postMessage({
              type: 'OAUTH_AUTH_SUCCESS',
              token: token,
              refreshUser: true
            }, window.location.origin)
          }
        }

        // Check for return URL from sessionStorage
        // SECURITY: Validate URL to prevent open redirect attacks
        const returnUrl = sessionStorage.getItem('authReturnUrl')
        let redirectUrl = '/'

        if (returnUrl && isValidReturnUrl(returnUrl)) {
          redirectUrl = returnUrl
          sessionStorage.removeItem('authReturnUrl')
        }

        setStatus('Authentication successful! Redirecting...')

        // Notify opener to close the popup (if accessible)
        if (window.opener) {
          window.opener.postMessage({ type: 'CLOSE_AUTH_POPUP' }, window.location.origin)
        }

        // Always attempt to close the popup — window.opener may be null due to browser policy.
        // The redirect below acts as a fallback: if window.close() succeeds (popup), the page
        // is gone before the redirect fires; if it fails (regular tab), the redirect runs.
        setTimeout(() => window.close(), 500)
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
