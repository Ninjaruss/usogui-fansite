'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'
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
  Divider,
  InputBase,
  Paper,
  List,
  ListItem,
  ListItemText,
  Chip,
  CircularProgress
} from '@mui/material'
import {
  Menu as MenuIcon,
  User,
  LogOut,
  Crown,
  BookOpen,
  Image,
  Heart,
  Users,
  Dices,
  CalendarSearch,
  Book,
  Shield,
  Quote,
  Search,
  Info,
  FileText,
  Zap
} from 'lucide-react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '../providers/AuthProvider'
import { useProgress } from '../providers/ProgressProvider'
import { api } from '../lib/api'
import { motion, AnimatePresence } from 'motion/react'
import { useNavDropdowns } from '../hooks/useNavDropdowns'
import { DropdownButton } from './DropdownButton'
import { DropdownMenu } from './DropdownMenu'
import { NavigationData, getCategoryColor } from '../types/navigation'

interface SearchResult {
  id: number
  type: string
  title: string
  description: string
  score: number
  hasSpoilers: boolean
  slug: string
  metadata?: any
}

const Navigation: React.FC = () => {
  const { user, logout } = useAuth()
  const { userProgress } = useProgress()
  const router = useRouter()
  const pathname = usePathname()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [mobileMenuAnchor, setMobileMenuAnchor] = useState<null | HTMLElement>(null)
  const [searchValue, setSearchValue] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [showSearchResults, setShowSearchResults] = useState(false)
  const searchTimeout = useRef<NodeJS.Timeout | null>(null)


  // Use refactored dropdown hooks
  const dropdowns = useNavDropdowns()

  // Enhanced mouse tracking for auto-close
  const anyDropdownOpen = dropdowns.browse[0].isOpen || dropdowns.community[0].isOpen || dropdowns.submit[0].isOpen

  const handleProfileMenuEnter = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleMenuLeave = () => {
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

  // Mouse tracking is now handled by the useMouseTracking hook

  // Search helper functions
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'character':
        return <Users size={16} />
      case 'organization':
        return <Shield size={16} />
      case 'arc':
        return <BookOpen size={16} />
      case 'gamble':
        return <Dices size={16} />
      case 'event':
        return <Zap size={16} />
      case 'chapter':
        return <FileText size={16} />
      default:
        return <Search size={16} />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'character':
        return '#1976d2'
      case 'organization':
        return '#9c27b0'
      case 'arc':
        return '#dc004e'
      case 'gamble':
        return '#d32f2f'
      case 'event':
        return '#f57c00'
      case 'chapter':
        return '#607d8b'
      case 'guide':
        return '#388e3c'
      case 'media':
        return '#7b1fa2'
      case 'quote':
        return '#00796b'
      default:
        return '#e11d48'
    }
  }

  // Search functionality
  const performSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([])
      setShowSearchResults(false)
      return
    }

    setSearchLoading(true)
    try {
      const response = await api.search(searchQuery, undefined, userProgress)

      // Sort results by priority: characters, organizations, arcs, gambles, events, chapters
      const priorityOrder = ['character', 'organization', 'arc', 'gamble', 'event', 'chapter']
      const sortedResults = response.results.sort((a, b) => {
        const aPriority = priorityOrder.indexOf(a.type)
        const bPriority = priorityOrder.indexOf(b.type)

        // If both types are in priority list, sort by priority
        if (aPriority !== -1 && bPriority !== -1) {
          return aPriority - bPriority
        }

        // If only one is in priority list, prioritize it
        if (aPriority !== -1) return -1
        if (bPriority !== -1) return 1

        // If neither is in priority list, maintain original order
        return 0
      })

      setSearchResults(sortedResults)
      setShowSearchResults(true)
    } catch (error) {
      console.error('Search failed:', error)
      setSearchResults([])
      setShowSearchResults(false)
    } finally {
      setSearchLoading(false)
    }
  }, [userProgress])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchValue(value)

    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current)
    }

    searchTimeout.current = setTimeout(() => {
      performSearch(value)
    }, 300)
  }

  const handleSearchResultClick = (result: SearchResult) => {
    setShowSearchResults(false)
    setSearchValue('')
    setSearchFocused(false)

    const path = `/${result.type}s/${result.id}`
    router.push(path)
  }

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowSearchResults(false)
      setSearchValue('')
      setSearchFocused(false)
    }
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchValue.trim()) {
      setShowSearchResults(false)
      setSearchValue('')
      setSearchFocused(false)
      router.push(`/search?q=${encodeURIComponent(searchValue.trim())}`)
    }
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

  // Check if current path is active
  const isActivePath = (path: string) => {
    return pathname === path || pathname.startsWith(path + '/')
  }

  // Navigation data
  const navigationData: NavigationData = {
    browse: [
      {
        name: 'Cast',
        color: getCategoryColor('Cast'),
        items: [
          { label: 'Characters', href: '/characters', icon: <Users size={16} /> },
          { label: 'Organizations', href: '/organizations', icon: <Shield size={16} /> },
          { label: 'Quotes', href: '/quotes', icon: <Quote size={16} /> }
        ]
      },
      {
        name: 'Story Elements',
        color: getCategoryColor('Story Elements'),
        items: [
          { label: 'Arcs', href: '/arcs', icon: <BookOpen size={16} /> },
          { label: 'Events', href: '/events', icon: <CalendarSearch size={16} /> },
          { label: 'Gambles', href: '/gambles', icon: <Dices size={16} /> }
        ]
      },
      {
        name: 'Reference Guide',
        color: getCategoryColor('Reference Guide'),
        items: [
          { label: 'Volumes', href: '/volumes', icon: <Book size={16} /> },
          { label: 'Chapters', href: '/chapters', icon: <FileText size={16} /> }
        ]
      }
    ],
    community: [
      { label: 'Guides', href: '/guides', icon: <BookOpen size={16} /> },
      { label: 'Users', href: '/users', icon: <Users size={16} /> },
      { label: 'About', href: '/about', icon: <Info size={16} /> }
    ],
    submit: [
      { label: 'Submit Guide', href: '/submit-guide', icon: <BookOpen size={16} /> },
      { label: 'Submit Media', href: '/submit-media', icon: <Image size={16} /> }
    ]
  }

  const avatarSrc = getAvatarSrc()

  // Cleanup search timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current)
      }
    }
  }, [])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (anyDropdownOpen) {
        dropdowns.closeAll()
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [anyDropdownOpen, dropdowns])

  return (
      <AppBar
        position="sticky"
        sx={{ mb: 4 }}
        data-testid="navigation-bar"
      >
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
            mr: 3,
            '&:hover': {
              opacity: 0.8
            }
          }}
        >
          L-File
        </Typography>

        {/* Desktop Navigation */}
        <Box
          sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 3, flexGrow: 1 }}
          data-testid="nav-buttons-container"
        >
          {/* Browse Dropdown */}
          <DropdownButton
            label="Browse"
            state={dropdowns.browse[0]}
            handlers={dropdowns.browse[1]}
          />

          {/* Community Dropdown */}
          <DropdownButton
            label="Community"
            state={dropdowns.community[0]}
            handlers={dropdowns.community[1]}
          />

          {/* Submit Dropdown */}
          <DropdownButton
            label="Submit"
            state={dropdowns.submit[0]}
            handlers={dropdowns.submit[1]}
          />
        </Box>

        {/* Search Bar - Desktop */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', mr: 3, position: 'relative' }}>
          <Box
            component="form"
            onSubmit={handleSearchSubmit}
            sx={{
              position: 'relative',
              borderRadius: 1,
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
              },
              transition: 'all 0.2s',
              width: searchFocused ? 280 : 180,
            }}
          >
            <Box
              sx={{
                padding: '0 12px',
                height: '100%',
                position: 'absolute',
                pointerEvents: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {searchLoading ? (
                <CircularProgress size={18} sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
              ) : (
                <Search size={18} color="rgba(255, 255, 255, 0.7)" />
              )}
            </Box>
            <InputBase
              placeholder="Search..."
              value={searchValue}
              onChange={handleSearchChange}
              onFocus={() => {
                setSearchFocused(true)
                if (searchValue.length >= 2) {
                  setShowSearchResults(true)
                }
              }}
              onBlur={() => {
                // Delay hiding results to allow clicks on results
                setTimeout(() => {
                  setSearchFocused(false)
                  setShowSearchResults(false)
                }, 200)
              }}
              onKeyDown={handleSearchKeyDown}
              sx={{
                color: 'white',
                '& .MuiInputBase-input': {
                  padding: '8px 8px 8px 40px',
                  width: '100%',
                  color: 'white',
                  '&::placeholder': {
                    color: 'rgba(255, 255, 255, 0.7)',
                    opacity: 1,
                  }
                },
              }}
            />
          </Box>

          {/* Search Results Dropdown */}
          <AnimatePresence>
            {showSearchResults && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  zIndex: 1400,
                  marginTop: '8px'
                }}
              >
                <Paper
                  elevation={8}
                  sx={{
                    maxHeight: 400,
                    overflow: 'auto',
                    borderRadius: 2,
                    backgroundColor: '#0a0a0a',
                    border: '1px solid rgba(225, 29, 72, 0.2)',
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 20px 25px -5px rgba(225, 29, 72, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.4)',
                  }}
                >
                  {searchResults.length > 0 ? (
                    <List
                      disablePadding
                      sx={{
                        backgroundColor: 'transparent',
                        '& .MuiListItem-root': {
                          backgroundColor: 'transparent !important',
                        }
                      }}
                    >
                      {searchResults.map((result) => (
                        <ListItem
                          key={`${result.type}-${result.id}`}
                          component="button"
                          onClick={() => handleSearchResultClick(result)}
                          sx={{
                            borderBottom: '1px solid rgba(225, 29, 72, 0.2)',
                            color: '#ffffff !important',
                            backgroundColor: 'transparent !important',
                            '&:hover': {
                              backgroundColor: 'rgba(225, 29, 72, 0.1) !important'
                            },
                            '&:last-child': {
                              borderBottom: 'none'
                            },
                            '&.MuiButtonBase-root': {
                              backgroundColor: 'transparent !important',
                            }
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                            <Box sx={{ color: getTypeColor(result.type) }}>
                              {getTypeIcon(result.type)}
                            </Box>
                          </Box>
                          <ListItemText
                            sx={{
                              '& .MuiListItemText-primary': {
                                color: '#ffffff !important',
                              },
                              '& .MuiListItemText-secondary': {
                                color: 'rgba(255, 255, 255, 0.7) !important',
                              }
                            }}
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', flex: 1 }}>
                                  <Typography
                                    variant="subtitle2"
                                    sx={{ color: '#ffffff !important' }}
                                  >
                                    {result.title}
                                  </Typography>
                                  {result.type === 'character' && result.metadata?.alternateNames && result.metadata.alternateNames.length > 0 && (
                                    <Typography
                                      variant="caption"
                                      sx={{
                                        color: 'rgba(255, 255, 255, 0.5) !important',
                                        fontStyle: 'italic'
                                      }}
                                    >
                                      {result.metadata.alternateNames.join(', ')}
                                    </Typography>
                                  )}
                                </Box>
                                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                  <Chip
                                    size="small"
                                    label={result.type}
                                    sx={{
                                      fontSize: '0.75rem',
                                      backgroundColor: getTypeColor(result.type),
                                      color: '#ffffff',
                                      fontWeight: 500,
                                      border: 'none'
                                    }}
                                  />
                                  {result.hasSpoilers && (
                                    <Chip
                                      size="small"
                                      label="Spoilers"
                                      sx={{
                                        fontSize: '0.75rem',
                                        backgroundColor: '#f57c00',
                                        color: '#ffffff',
                                        fontWeight: 500,
                                        border: 'none'
                                      }}
                                    />
                                  )}
                                </Box>
                              </Box>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Box sx={{
                      p: 3,
                      textAlign: 'center',
                      backgroundColor: 'transparent !important'
                    }}>
                      <Typography
                        variant="body2"
                        sx={{
                          color: 'rgba(255, 255, 255, 0.7) !important'
                        }}
                      >
                        {searchValue.trim().length < 2
                          ? 'Type at least 2 characters to search'
                          : 'No results found'
                        }
                      </Typography>
                    </Box>
                  )}
                </Paper>
              </motion.div>
            )}
          </AnimatePresence>
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
                onMouseEnter={handleProfileMenuEnter}
                color="inherit"
                disableRipple
              >
                <Avatar src={avatarSrc || undefined} sx={{ width: 32, height: 32 }} alt={user.username}>
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

        {/* Browse Dropdown Menu */}
        <DropdownMenu
          state={dropdowns.browse[0]}
          handlers={dropdowns.browse[1]}
          items={navigationData.browse}
          isActivePath={isActivePath}
          isCategorized={true}
        />

        {/* Community Dropdown Menu */}
        <DropdownMenu
          state={dropdowns.community[0]}
          handlers={dropdowns.community[1]}
          items={navigationData.community}
          isActivePath={isActivePath}
          isCategorized={false}
        />

        {/* Submit Dropdown Menu */}
        <DropdownMenu
          state={dropdowns.submit[0]}
          handlers={dropdowns.submit[1]}
          items={navigationData.submit}
          isActivePath={isActivePath}
          isCategorized={false}
        />

        {/* Profile Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          onClick={handleMenuClose}
          onMouseLeave={handleMenuLeave}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <MenuItem component={Link} href="/profile">
            <User size={16} style={{ marginRight: 8 }} />
            Profile
          </MenuItem>
          <MenuItem component={Link} href="/about">
            <Heart size={16} style={{ marginRight: 8 }} />
            Donate
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
          sx={{ mt: 1 }}
        >
          {/* Search on Mobile */}
          <Box sx={{ p: 2, pb: 1 }}>
            <Box
              component="form"
              onSubmit={handleSearchSubmit}
              sx={{
                position: 'relative',
                borderRadius: 1,
                backgroundColor: 'action.hover',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              {searchLoading ? (
                <CircularProgress size={18} style={{ marginLeft: 12, marginRight: 8 }} />
              ) : (
                <Search size={18} style={{ marginLeft: 12, marginRight: 8 }} />
              )}
              <InputBase
                placeholder="Search..."
                value={searchValue}
                onChange={handleSearchChange}
                onKeyDown={handleSearchKeyDown}
                sx={{
                  flex: 1,
                  color: 'text.primary',
                  '& .MuiInputBase-input': {
                    padding: '8px 12px 8px 0',
                    color: 'text.primary',
                    '&::placeholder': {
                      color: 'text.secondary',
                      opacity: 1,
                    }
                  },
                }}
              />
            </Box>
          </Box>
          <Divider />

          {/* User Section - Moved to top */}
          {user ? (
            [
              <MenuItem key="profile" component={Link} href="/profile">
                <User size={16} style={{ marginRight: 8 }} />
                Profile
              </MenuItem>,
              <MenuItem key="donate" component={Link} href="/about">
                <Heart size={16} style={{ marginRight: 8 }} />
                Donate
              </MenuItem>,
              ...(user.role === 'admin' || user.role === 'moderator' ? [
                <MenuItem key="admin" component={Link} href="/admin">
                  <Crown size={16} style={{ marginRight: 8 }} />
                  Admin
                </MenuItem>
              ] : []),
              <Divider key="user-divider" />
            ]
          ) : (
            [
              <MenuItem key="login" component={Link} href="/login">
                Login
              </MenuItem>,
              <Divider key="login-divider" />
            ]
          )}

          {/* Browse Section */}
          {navigationData.browse.map((category) => (
            <Box key={category.name}>
              <MenuItem disabled sx={{
                fontWeight: 'bold',
                opacity: '1 !important',
                color: `${category.color} !important`,
                fontSize: '0.9rem',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                '&.Mui-disabled': {
                  color: `${category.color} !important`,
                  opacity: '1 !important'
                }
              }}>
                {category.name}
              </MenuItem>
              {category.items.map((item) => (
                <MenuItem
                  key={item.href}
                  component={Link}
                  href={item.href}
                  sx={{
                    pl: 3,
                    backgroundColor: isActivePath(item.href) ? 'action.selected' : 'transparent'
                  }}
                >
                  <Box sx={{ mr: 1, display: 'flex' }}>{item.icon}</Box>
                  {item.label}
                </MenuItem>
              ))}
            </Box>
          ))}

          <Divider />

          {/* Community Section */}
          <MenuItem disabled sx={{ 
            fontWeight: 'bold', 
            opacity: '1 !important', 
            color: '#ff5722 !important',
            fontSize: '0.9rem',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            '&.Mui-disabled': {
              color: '#ff5722 !important',
              opacity: '1 !important'
            }
          }}>
            Community
          </MenuItem>
          {navigationData.community.map((item) => (
            <MenuItem
              key={item.href}
              component={Link}
              href={item.href}
              sx={{
                pl: 3,
                backgroundColor: isActivePath(item.href) ? 'action.selected' : 'transparent'
              }}
            >
              <Box sx={{ mr: 1, display: 'flex' }}>{item.icon}</Box>
              {item.label}
            </MenuItem>
          ))}

          <Divider />

          {/* Submit Section */}
          <MenuItem disabled sx={{ 
            fontWeight: 'bold', 
            opacity: '1 !important', 
            color: '#673ab7 !important',
            fontSize: '0.9rem',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            '&.Mui-disabled': {
              color: '#673ab7 !important',
              opacity: '1 !important'
            }
          }}>
            Submit
          </MenuItem>
          {navigationData.submit.map((item) => (
            <MenuItem
              key={item.href}
              component={Link}
              href={item.href}
              sx={{
                pl: 3,
                backgroundColor: isActivePath(item.href) ? 'action.selected' : 'transparent'
              }}
            >
              <Box sx={{ mr: 1, display: 'flex' }}>{item.icon}</Box>
              {item.label}
            </MenuItem>
          ))}

          {/* Logout at very bottom */}
          {user && [
            <Divider key="logout-divider" />,
            <MenuItem key="logout" onClick={handleLogout}>
              <LogOut size={16} style={{ marginRight: 8 }} />
              Logout
            </MenuItem>
          ]}
        </Menu>
      </Toolbar>
    </AppBar>
  )
}

export default Navigation
export { Navigation }