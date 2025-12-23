'use client'

import { useEffect, useState } from 'react'

export default function AuthCallback() {
  const [status, setStatus] = useState('Processing authentication...')
  const [isError, setIsError] = useState(false)

  useEffect(() => {
    const processAuth = async () => {
      try {
        // Extract access token from URL (refresh token is set as httpOnly cookie by server)
        const urlParams = new URLSearchParams(window.location.search)
        const token = urlParams.get('token')
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

        // Validate token format
        if (!token.includes('.') || token.split('.').length !== 3) {
          setStatus('Authentication failed. Redirecting to login...')
          setIsError(true)
          setTimeout(() => {
            window.location.href = '/login?error=invalid_token'
          }, 2000)
          return
        }

        // Clear any existing token first
        localStorage.removeItem('accessToken')

        // Store access token
        localStorage.setItem('accessToken', token)

        // Set callback flag for AuthProvider polling
        localStorage.setItem('authCallback', Date.now().toString())

        // Check for return URL
        const returnUrl = localStorage.getItem('authReturnUrl')
        let redirectUrl = '/'

        if (returnUrl) {
          redirectUrl = returnUrl
          localStorage.removeItem('authReturnUrl')
        }

        setStatus('Authentication successful! Redirecting...')

        // Redirect to the intended destination after a brief delay
        setTimeout(() => {
          window.location.href = redirectUrl
        }, 1000)

      } catch (error) {
        setStatus('Authentication failed. Redirecting to login...')
        setIsError(true)
        setTimeout(() => {
          window.location.href = '/login?error=callback_error'
        }, 2000)
      }
    }

    processAuth()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center max-w-md">
        <h1 className="text-2xl font-bold mb-4">Discord Authentication</h1>
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
