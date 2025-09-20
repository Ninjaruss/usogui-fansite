'use client'

import { useEffect, useState } from 'react'

export default function AuthCallback() {
  const [status, setStatus] = useState('Processing authentication...')
  const [debugInfo, setDebugInfo] = useState<string[]>([])

  const addDebugInfo = (info: string) => {
    console.log('[AUTH CALLBACK]', info)
    setDebugInfo(prev => [...prev, info])
  }

  useEffect(() => {
    const processAuth = async () => {
      try {
        addDebugInfo('Starting Discord auth callback processing...')
        
        // Extract access token from URL (refresh token is set as httpOnly cookie by server)
        const urlParams = new URLSearchParams(window.location.search)
        const token = urlParams.get('token')
        const error = urlParams.get('error')
        
        addDebugInfo(`URL params - Token: ${token ? 'YES' : 'NO'}, Error: ${error || 'NONE'}`)
        addDebugInfo(`Full URL: ${window.location.href}`)
        
        if (error) {
          setStatus(`Authentication failed: ${error}`)
          addDebugInfo(`Discord OAuth error: ${error}`)
          setTimeout(() => {
            window.location.href = '/login?error=' + encodeURIComponent(error)
          }, 3000)
          return
        }
        
        if (!token) {
          setStatus('Authentication failed: Missing token')
          addDebugInfo('Missing token in URL parameters - Discord OAuth may have failed')
          addDebugInfo('Check Discord application configuration and server logs')
          setTimeout(() => {
            window.location.href = '/login?error=missing_token'
          }, 3000)
          return
        }

        // Validate token format
        if (!token.includes('.') || token.split('.').length !== 3) {
          addDebugInfo('Token appears to be invalid format (not a JWT)')
          setStatus('Authentication failed: Invalid token format')
          setTimeout(() => {
            window.location.href = '/login?error=invalid_token'
          }, 3000)
          return
        }

        addDebugInfo(`Received valid token (length: ${token.length})`)
        
        // Clear any existing token first
        localStorage.removeItem('accessToken')
        
        // Store access token
        localStorage.setItem('accessToken', token)
        addDebugInfo('Access token stored in localStorage')
        
        // Set callback flag for AuthProvider polling
        localStorage.setItem('authCallback', Date.now().toString())
        addDebugInfo('Auth callback flag set')
        
        // Check for return URL
        const returnUrl = localStorage.getItem('authReturnUrl')
        let redirectUrl = '/'
        
        if (returnUrl) {
          redirectUrl = returnUrl
          localStorage.removeItem('authReturnUrl') // Clean up
          addDebugInfo(`Return URL found: ${returnUrl}`)
        } else {
          addDebugInfo('No return URL found, redirecting to home page')
        }
        
        setStatus('Authentication successful! Redirecting...')
        addDebugInfo(`Authentication completed successfully, redirecting to ${redirectUrl}`)

        // Redirect to the intended destination after a brief delay
        setTimeout(() => {
          addDebugInfo(`Redirecting to ${redirectUrl}...`)
          window.location.href = redirectUrl
        }, 1500)
        
      } catch (error) {
        console.error('Auth callback error:', error)
        addDebugInfo(`Critical error in auth callback: ${error}`)
        setStatus('Authentication failed due to internal error')
        setTimeout(() => {
          window.location.href = '/login?error=callback_error'
        }, 3000)
      }
    }

    processAuth()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center max-w-md">
        <h1 className="text-2xl font-bold mb-4">Discord Authentication</h1>
        <p className="text-gray-300 mb-4">{status}</p>
        <div className="mt-4 animate-spin inline-block w-6 h-6 border-[3px] border-current border-t-transparent text-blue-400 rounded-full mb-4"></div>
        <p className="text-sm text-gray-400 mb-4">
          {status.includes('successful')
            ? "Redirecting you to the home page..."
            : "Please wait while we process your authentication..."
          }
        </p>
        
        {/* Debug information */}
        <div className="text-left bg-gray-800 p-3 rounded text-xs max-h-32 overflow-y-auto">
          <p className="font-bold mb-2">Debug Info:</p>
          {debugInfo.map((info, index) => (
            <p key={index} className="text-gray-300">{info}</p>
          ))}
        </div>
      </div>
    </div>
  )
}