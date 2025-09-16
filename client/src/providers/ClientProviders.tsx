'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import { ThemeProvider } from '@mui/material/styles'
import { CacheProvider } from '@emotion/react'
import CssBaseline from '@mui/material/CssBaseline'
import { theme } from '../lib/theme'
import createEmotionCache from '../lib/emotion-cache'
import { AuthProvider } from './AuthProvider'
import { ProgressProvider } from './ProgressProvider'
import { Navigation } from '../components/Navigation'
import { FloatingProgressIndicator } from '../components/FloatingProgressIndicator'

// Client-side cache, shared for the whole session of the user in the browser.
const clientSideEmotionCache = createEmotionCache()

interface ClientProvidersProps {
  children: React.ReactNode
}

function ConditionalNavigation() {
  const pathname = usePathname()
  const isAdminPage = pathname?.startsWith('/admin')
  
  if (isAdminPage) {
    return null
  }
  
  return <Navigation />
}

function ConditionalFloatingProgress() {
  const pathname = usePathname()
  const isAdminPage = pathname?.startsWith('/admin')
  
  if (isAdminPage) {
    return null
  }
  
  return <FloatingProgressIndicator />
}

export function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <CacheProvider value={clientSideEmotionCache}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <ProgressProvider>
            <ConditionalNavigation />
            <main className="min-h-screen bg-usogui-black">
              {children}
            </main>
            <ConditionalFloatingProgress />
          </ProgressProvider>
        </AuthProvider>
      </ThemeProvider>
    </CacheProvider>
  )
}