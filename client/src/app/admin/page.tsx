'use client'

import React, { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../providers/AuthProvider'
import { Container, Box, Typography, CircularProgress } from '@mui/material'

// Dynamically import the admin app to avoid SSR issues with react-admin
const AdminApp = dynamic(() => import('./AdminApp'), {
  ssr: false,
  loading: () => <div>Loading admin dashboard...</div>
})

export default function AdminPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [checkingPermissions, setCheckingPermissions] = useState(true)

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Not logged in, redirect to login
        router.replace('/login')
      } else if (user.role !== 'admin' && user.role !== 'moderator') {
        // Not authorized, redirect to home
        router.replace('/')
      } else {
        // User is authorized
        setCheckingPermissions(false)
      }
    }
  }, [user, loading, router])

  // Show loading while checking authentication and permissions
  if (loading || checkingPermissions) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Box textAlign="center">
          <CircularProgress size={60} sx={{ mb: 3 }} />
          <Typography variant="h6" gutterBottom>
            Checking permissions...
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Please wait while we verify your access level.
          </Typography>
        </Box>
      </Container>
    )
  }

  // Show nothing while redirecting unauthorized users
  if (!user || (user.role !== 'admin' && user.role !== 'moderator')) {
    return null
  }

  // User is authorized, show admin app
  return <AdminApp />
}