import React, { useState } from 'react'
import { Layout, AppBar, usePermissions } from 'react-admin'
import { Box, Typography, IconButton, Popover, List, ListItem, ListItemText, ListItemButton } from '@mui/material'
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useNavigate } from 'react-router-dom'
import { AdminMenu } from './AdminMenu'
import { usePendingCounts } from '../../hooks/usePendingCounts'

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
  const { counts, loading } = usePendingCounts()
  const navigate = useNavigate()
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)

  if (loading || counts.total === 0) return null

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleNavigate = (resource: string) => {
    const filterParam = encodeURIComponent(JSON.stringify({ status: 'pending' }))
    navigate(`/${resource}?displayedFilters=${filterParam}&filter=${filterParam}&order=ASC&page=1&perPage=25&sort=id`)
    handleClose()
  }

  const open = Boolean(anchorEl)

  return (
    <>
      <Box
        onClick={handleClick}
        sx={{
          ml: 2,
          px: 1,
          py: 0.5,
          bgcolor: 'warning.main',
          color: 'white',
          borderRadius: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          cursor: 'pointer',
          '&:hover': {
            bgcolor: 'warning.dark'
          }
        }}
        title="Click to view pending items breakdown"
      >
        <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
          {counts.total} PENDING APPROVAL
        </Typography>
        <Typography variant="caption" sx={{ fontSize: '0.7rem', opacity: 0.9 }}>
          ({counts.guides}g, {counts.media}m, {counts.events}e, {counts.annotations}a)
        </Typography>
      </Box>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        sx={{
          '& .MuiPopover-paper': {
            backgroundColor: '#1a1a1a',
            border: '1px solid rgba(255, 152, 0, 0.3)',
            minWidth: 250
          }
        }}
      >
        <List sx={{ p: 0 }}>
          <ListItemButton onClick={() => handleNavigate('guides')} disabled={counts.guides === 0}>
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography sx={{ color: counts.guides > 0 ? '#ffffff' : 'text.disabled' }}>
                    Guides
                  </Typography>
                  <Typography sx={{
                    color: counts.guides > 0 ? '#ff9800' : 'text.disabled',
                    fontWeight: 'bold'
                  }}>
                    {counts.guides}
                  </Typography>
                </Box>
              }
            />
          </ListItemButton>
          <ListItemButton onClick={() => handleNavigate('media')} disabled={counts.media === 0}>
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography sx={{ color: counts.media > 0 ? '#ffffff' : 'text.disabled' }}>
                    Media
                  </Typography>
                  <Typography sx={{
                    color: counts.media > 0 ? '#ff9800' : 'text.disabled',
                    fontWeight: 'bold'
                  }}>
                    {counts.media}
                  </Typography>
                </Box>
              }
            />
          </ListItemButton>
          <ListItemButton onClick={() => handleNavigate('events')} disabled={counts.events === 0}>
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography sx={{ color: counts.events > 0 ? '#ffffff' : 'text.disabled' }}>
                    Events
                  </Typography>
                  <Typography sx={{
                    color: counts.events > 0 ? '#ff9800' : 'text.disabled',
                    fontWeight: 'bold'
                  }}>
                    {counts.events}
                  </Typography>
                </Box>
              }
            />
          </ListItemButton>
          <ListItemButton onClick={() => handleNavigate('annotations')} disabled={counts.annotations === 0}>
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography sx={{ color: counts.annotations > 0 ? '#ffffff' : 'text.disabled' }}>
                    Annotations
                  </Typography>
                  <Typography sx={{
                    color: counts.annotations > 0 ? '#ff9800' : 'text.disabled',
                    fontWeight: 'bold'
                  }}>
                    {counts.annotations}
                  </Typography>
                </Box>
              }
            />
          </ListItemButton>
        </List>
      </Popover>
    </>
  )
}

export const AdminLayout = (props: any) => (
  <Layout {...props} appBar={CustomAppBar} menu={AdminMenu} />
)