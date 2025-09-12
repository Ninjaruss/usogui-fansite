'use client'

import React, { useState } from 'react'
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Box,
  Avatar,
  Divider
} from '@mui/material'
import { Menu as MenuIcon, User, LogOut, Settings, Crown } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '../providers/AuthProvider'

export const Navigation: React.FC = () => {
  const { user, logout } = useAuth()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [mobileMenuAnchor, setMobileMenuAnchor] = useState<null | HTMLElement>(null)

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleMobileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMobileMenuAnchor(event.currentTarget)
  }

  const handleMobileMenuClose = () => {
    setMobileMenuAnchor(null)
  }

  const handleLogout = async () => {
    await logout()
    handleMenuClose()
  }

  // Helper function to get the appropriate avatar source
  const getAvatarSrc = () => {
    if (!user) return null
    
    // If user has selected character media as profile picture type
    if (user.profilePictureType === 'character_media' && user.selectedCharacterMedia) {
      return user.selectedCharacterMedia.url
    }
    
    // If user has Discord avatar and either no profile picture type set or discord type
    if (user.discordId && user.discordAvatar && 
        (user.profilePictureType === 'discord' || !user.profilePictureType)) {
      return user.discordAvatar.startsWith('http') 
        ? user.discordAvatar 
        : `https://cdn.discordapp.com/avatars/${user.discordId}/${user.discordAvatar}.png`
    }
    
    // Default: no image, show initials
    return null
  }

  const navItems = [
    { label: 'Characters', href: '/characters' },
    { label: 'Arcs', href: '/arcs' },
    { label: 'Gambles', href: '/gambles' },
    { label: 'Events', href: '/events' },
    { label: 'Guides', href: '/guides' }
  ]

  const avatarSrc = getAvatarSrc()

  return (
    <AppBar position="sticky" sx={{ mb: 4 }}>
      <Toolbar>
        {/* Logo - Left Side */}
        <Typography
          variant="h4"
          component={Link}
          href="/"
          sx={{
            textDecoration: 'none',
            color: 'inherit',
            fontWeight: 'bold',
            mr: 2
          }}
        >
        L-File
        </Typography>

        {/* Desktop Navigation */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, flexGrow: 1, justifyContent: 'center' }}>
          {/* Centered Main Navigation Items */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {navItems.map((item) => (
              <Button
                key={item.href}
                component={Link}
                href={item.href}
                color="inherit"
              >
                {item.label}
              </Button>
            ))}
          </Box>
        </Box>

        {/* Right Side - Admin and Auth */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 2 }}>
          {user ? (
            <>
              {(user.role === 'admin' || user.role === 'moderator') && (
                <Button
                  component={Link}
                  href="/admin"
                  color="inherit"
                  startIcon={<Crown size={16} />}
                >
                  Admin
                </Button>
              )}
              <IconButton
                size="large"
                edge="end"
                aria-label="account of current user"
                aria-haspopup="true"
                onClick={handleProfileMenuOpen}
                color="inherit"
              >
                <Avatar src={avatarSrc || undefined} sx={{ width: 32, height: 32 }}>
                  {!avatarSrc && user.username[0].toUpperCase()}
                </Avatar>
              </IconButton>
            </>
          ) : (
            <Button component={Link} href="/login" color="inherit">
              Login
            </Button>
          )}
        </Box>

        {/* Mobile Navigation */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, ml: 'auto' }}>
          <IconButton
            size="large"
            aria-label="show more"
            aria-haspopup="true"
            onClick={handleMobileMenuOpen}
            color="inherit"
          >
            <MenuIcon />
          </IconButton>
        </Box>

        {/* Profile Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          onClick={handleMenuClose}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <MenuItem component={Link} href="/profile">
            <User size={16} style={{ marginRight: 8 }} />
            Profile
          </MenuItem>
          <MenuItem component={Link} href="/submit-guide">
            <Settings size={16} style={{ marginRight: 8 }} />
            Submit Guide
          </MenuItem>
          <MenuItem component={Link} href="/submit-media">
            <Settings size={16} style={{ marginRight: 8 }} />
            Submit Media
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleLogout}>
            <LogOut size={16} style={{ marginRight: 8 }} />
            Logout
          </MenuItem>
        </Menu>

        {/* Mobile Menu */}
        <Menu
          anchorEl={mobileMenuAnchor}
          open={Boolean(mobileMenuAnchor)}
          onClose={handleMobileMenuClose}
          onClick={handleMobileMenuClose}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          {navItems.map((item) => (
            <MenuItem key={item.href} component={Link} href={item.href}>
              {item.label}
            </MenuItem>
          ))}
          <Divider />
          {user ? (
            [
              <MenuItem key="profile" component={Link} href="/profile">
                <User size={16} style={{ marginRight: 8 }} />
                Profile
              </MenuItem>,
              (user.role === 'admin' || user.role === 'moderator') && (
                <MenuItem key="admin" component={Link} href="/admin">
                  <Crown size={16} style={{ marginRight: 8 }} />
                  Admin
                </MenuItem>
              ),
              <MenuItem key="logout" onClick={handleLogout}>
                <LogOut size={16} style={{ marginRight: 8 }} />
                Logout
              </MenuItem>
            ]
          ) : (
            <MenuItem component={Link} href="/login">
              Login
            </MenuItem>
          )}
        </Menu>
      </Toolbar>
    </AppBar>
  )
}