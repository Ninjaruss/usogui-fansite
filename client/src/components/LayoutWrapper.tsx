'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import { Box } from '@mantine/core'
import { Footer } from './Footer'

interface LayoutWrapperProps {
  children: React.ReactNode
}

export const LayoutWrapper: React.FC<LayoutWrapperProps> = ({ children }) => {
  const pathname = usePathname()
  const isAdminPage = pathname?.startsWith('/admin')

  return (
    <Box
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh'
      }}
    >
      <Box style={{ flex: 1 }}>
        {children}
      </Box>
      {!isAdminPage && <Footer />}
    </Box>
  )
}