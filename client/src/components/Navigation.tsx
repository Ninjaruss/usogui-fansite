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

  const navItems = [
    { label: 'Characters', href: '/characters' },
    { label: 'Arcs', href: '/arcs' },
    { label: 'Gambles', href: '/gambles' },
    { label: 'Events', href: '/events' },
    { label: 'Guides', href: '/guides' }
  ]

  return (
    <AppBar position="sticky" sx={{ mb: 4 }}>
      <Toolbar>
        {/* Logo - Left Side */}
        <Typography
          variant="h6"
          component={Link}
          href="/"
          sx={{
            textDecoration: 'none',
            color: 'inherit',
            fontWeight: 'bold',
            mr: 2
          }}
        >
          usogui fansite
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
                <Avatar sx={{ width: 32, height: 32 }}>
                  {user.username[0].toUpperCase()}
                </Avatar>
              </IconButton>
            </>
          ) : (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button component={Link} href="/login" color="inherit">
                Login
              </Button>
              <Button component={Link} href="/register" variant="outlined" color="inherit">
                Sign Up
              </Button>
            </Box>
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
            [
              <MenuItem key="login" component={Link} href="/login">
                Login
              </MenuItem>,
              <MenuItem key="register" component={Link} href="/register">
                Sign Up
              </MenuItem>
            ]
          )}
        </Menu>
      </Toolbar>
    </AppBar>
  )
}