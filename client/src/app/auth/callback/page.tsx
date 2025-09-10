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
        
        setStatus('Authentication successful! Redirecting...')

        // Simplified communication strategy - use BroadcastChannel as primary method
        
        try {
          addDebugInfo('Sending auth success via BroadcastChannel...')
          const channel = new BroadcastChannel('auth_channel')
          channel.postMessage({
            type: 'DISCORD_AUTH_SUCCESS',
            token,
            timestamp: Date.now(),
            refreshUser: true
          })
          
          setTimeout(() => {
            channel.close()
            addDebugInfo('BroadcastChannel closed')
          }, 500)
          
          addDebugInfo('BroadcastChannel message sent successfully')
        } catch (error) {
          addDebugInfo(`BroadcastChannel failed: ${error}`)
        }
        
        // Fallback: Try postMessage to opener window
        if (window.opener && !window.opener.closed) {
          try {
            addDebugInfo('Sending postMessage to opener window...')
            window.opener.postMessage({ 
              type: 'DISCORD_AUTH_SUCCESS', 
              token,
              timestamp: Date.now()
            }, window.location.origin)
            addDebugInfo('PostMessage sent successfully')
          } catch (error) {
            addDebugInfo(`PostMessage failed: ${error}`)
          }
        } else {
          addDebugInfo('No opener window available')
        }
        
        // Give the main app time to process the auth success
        setTimeout(() => {
          addDebugInfo('Attempting to close popup window...')
          
          // Try multiple methods to close the window
          try {
            if (window.opener && !window.opener.closed) {
              addDebugInfo('Opener window detected, closing popup...')
              window.close()
              
              // Fallback: if window.close() didn't work, try to redirect the opener
              setTimeout(() => {
                try {
                  if (window.opener && window.opener.location.origin === window.location.origin) {
                    window.opener.location.reload()
                  }
                } catch (e) {
                  addDebugInfo('Could not reload opener window')
                }
              }, 500)
            } else {
              addDebugInfo('No opener window, redirecting to home page...')
              window.location.href = '/'
            }
          } catch (error) {
            addDebugInfo(`Error closing window: ${error}`)
            // Final fallback
            window.location.href = '/'
          }
        }, 2000)
        
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
        <p className="text-gray-600 mb-4">{status}</p>
        <div className="mt-4 animate-spin inline-block w-6 h-6 border-[3px] border-current border-t-transparent text-blue-600 rounded-full mb-4"></div>
        <p className="text-sm text-gray-400 mb-4">
          {status.includes('successful') 
            ? "This tab will close automatically..." 
            : "Please wait while we process your authentication..."
          }
        </p>
        
        {/* Debug information */}
        <div className="text-left bg-gray-100 p-3 rounded text-xs max-h-32 overflow-y-auto">
          <p className="font-bold mb-2">Debug Info:</p>
          {debugInfo.map((info, index) => (
            <p key={index} className="text-gray-600">{info}</p>
          ))}
        </div>
      </div>
    </div>
  )
}