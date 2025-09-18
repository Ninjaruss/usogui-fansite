'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import dynamic from 'next/dynamic'
import { MantineProvider } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { theme as muiTheme } from '../lib/theme'
import { theme as mantineTheme } from '../lib/mantine-theme'
import EmotionRegistry from '../lib/emotion-registry'
import { AuthProvider } from './AuthProvider'
import { ProgressProvider } from './ProgressProvider'
import { FloatingProgressIndicator } from '../components/FloatingProgressIndicator'

// Dynamically import Navigation with SSR disabled to prevent hydration issues
const Navigation = dynamic(() => import('../components/Navigation'), {
  ssr: false
})

interface ClientProvidersProps {
  children: React.ReactNode
}

function ConditionalNavigation() {
  const [isClient, setIsClient] = React.useState(false)
  const pathname = usePathname()
  
  React.useEffect(() => {
    setIsClient(true)
  }, [])
  
  if (!isClient) {
    return null
  }
  
  const isAdminPage = pathname?.startsWith('/admin')
  
  if (isAdminPage) {
    return null
  }
  
  return <Navigation />
}

function ConditionalFloatingProgress() {
  const [isClient, setIsClient] = React.useState(false)
  const pathname = usePathname()
  
  React.useEffect(() => {
    setIsClient(true)
  }, [])
  
  if (!isClient) {
    return null
  }
  
  const isAdminPage = pathname?.startsWith('/admin')
  
  if (isAdminPage) {
    return null
  }
  
  return <FloatingProgressIndicator />
}

export function ClientProviders({ children }: ClientProvidersProps) {
  const pathname = usePathname()
  const isAdminPage = pathname?.startsWith('/admin')

  if (isAdminPage) {
    // Use MUI for admin pages (React Admin compatibility) but include Mantine for shared components
    return (
      <MantineProvider theme={mantineTheme}>
        <EmotionRegistry options={{ key: 'mui' }}>
          <ThemeProvider theme={muiTheme}>
            <CssBaseline enableColorScheme />
            <AuthProvider>
              <ProgressProvider>
                <main className="min-h-screen bg-usogui-black">
                  {children}
                </main>
              </ProgressProvider>
            </AuthProvider>
          </ThemeProvider>
        </EmotionRegistry>
      </MantineProvider>
    )
  }

  // Use both Mantine and MUI for public pages (MUI needed for FloatingProgressIndicator)
  return (
    <MantineProvider theme={mantineTheme}>
      <EmotionRegistry options={{ key: 'mui' }}>
        <ThemeProvider theme={muiTheme}>
          <Notifications />
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
      </EmotionRegistry>
    </MantineProvider>
  )
}