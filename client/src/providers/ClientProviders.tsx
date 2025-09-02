'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { theme } from '../lib/theme'
import { AuthProvider } from './AuthProvider'
import { Navigation } from '../components/Navigation'

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

export function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <ConditionalNavigation />
        <main className="min-h-screen">
          {children}
        </main>
      </AuthProvider>
    </ThemeProvider>
  )
}