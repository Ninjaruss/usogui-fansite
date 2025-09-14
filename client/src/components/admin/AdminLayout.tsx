import React, { useState, useEffect } from 'react'
import { Layout, AppBar, usePermissions } from 'react-admin'
import { Box, Typography, IconButton } from '@mui/material'
import { Crown, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { api } from '../../lib/api'

const CustomAppBar = () => {
  const { permissions } = usePermissions()
  const router = useRouter()
  
  const handleBackToHome = () => {
    router.push('/')
  }
  
  return (
    <AppBar>
      <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
        <IconButton
          onClick={handleBackToHome}
          sx={{ 
            color: 'inherit',
            mr: 1,
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.1)'
            }
          }}
          title="Back to Landing Page"
        >
          <ArrowLeft size={24} />
        </IconButton>
        
        <Typography variant="h6" component="div">
          Usogui Admin Dashboard
        </Typography>
        <PendingCounter />
        {permissions === 'admin' && (
          <Typography
            variant="caption"
            sx={{
              ml: 2,
              px: 1,
              py: 0.5,
              bgcolor: 'error.main',
              color: 'white',
              borderRadius: 1
            }}
          >
            ADMIN
          </Typography>
        )}
      </Box>
    </AppBar>
  )
}

const PendingCounter = () => {
  const [pendingCounts, setPendingCounts] = useState({ guides: 0, media: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPendingCounts = async () => {
      try {
        const [guidesRes, mediaRes] = await Promise.all([
          api.getGuidesAdmin({ status: 'pending', limit: 1 }),
          api.getAllMedia({ status: 'pending', limit: 1 })
        ])

        setPendingCounts({
          guides: guidesRes.total || 0,
          media: mediaRes.total || 0
        })
      } catch (error) {
        console.error('Failed to fetch pending counts:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPendingCounts()

    // Refresh counts every 30 seconds
    const interval = setInterval(fetchPendingCounts, 30000)
    return () => clearInterval(interval)
  }, [])

  const totalPending = pendingCounts.guides + pendingCounts.media

  if (loading || totalPending === 0) return null

  return (
    <Box sx={{
      ml: 2,
      px: 1,
      py: 0.5,
      bgcolor: 'warning.main',
      color: 'white',
      borderRadius: 1,
      display: 'flex',
      alignItems: 'center',
      gap: 0.5
    }}>
      <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
        {totalPending} PENDING
      </Typography>
      {(pendingCounts.guides > 0 || pendingCounts.media > 0) && (
        <Typography variant="caption" sx={{ fontSize: '0.7rem', opacity: 0.9 }}>
          ({pendingCounts.guides}G, {pendingCounts.media}M)
        </Typography>
      )}
    </Box>
  )
}

export const AdminLayout = (props: any) => (
  <Layout {...props} appBar={CustomAppBar} />
)