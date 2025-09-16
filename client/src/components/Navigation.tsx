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
  ChevronDown,
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

export const Navigation: React.FC = () => {
  const { user, logout } = useAuth()
  const { userProgress } = useProgress()
  const router = useRouter()
  const pathname = usePathname()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [mobileMenuAnchor, setMobileMenuAnchor] = useState<null | HTMLElement>(null)
  const [browseMenuAnchor, setBrowseMenuAnchor] = useState<null | HTMLElement>(null)
  const [communityMenuAnchor, setCommunityMenuAnchor] = useState<null | HTMLElement>(null)
  const [submitMenuAnchor, setSubmitMenuAnchor] = useState<null | HTMLElement>(null)
  const [searchValue, setSearchValue] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [showSearchResults, setShowSearchResults] = useState(false)
  const searchTimeout = useRef<NodeJS.Timeout | null>(null)
  const browseTimeout = useRef<NodeJS.Timeout | null>(null)
  const communityTimeout = useRef<NodeJS.Timeout | null>(null)
  const submitTimeout = useRef<NodeJS.Timeout | null>(null)


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

  // Dropdown menu handlers
  const handleBrowseMenuEnter = (event: React.MouseEvent<HTMLElement>) => {
    // Clear any pending timeouts
    if (browseTimeout.current) {
      clearTimeout(browseTimeout.current)
    }
    if (communityTimeout.current) {
      clearTimeout(communityTimeout.current)
    }
    if (submitTimeout.current) {
      clearTimeout(submitTimeout.current)
    }
    // Close other dropdowns first
    setCommunityMenuAnchor(null)
    setSubmitMenuAnchor(null)
    // Use the current target (the Box element) as the anchor
    setBrowseMenuAnchor(event.currentTarget)
  }

  const handleCommunityMenuEnter = (event: React.MouseEvent<HTMLElement>) => {
    // Clear any pending timeouts
    if (browseTimeout.current) {
      clearTimeout(browseTimeout.current)
    }
    if (communityTimeout.current) {
      clearTimeout(communityTimeout.current)
    }
    if (submitTimeout.current) {
      clearTimeout(submitTimeout.current)
    }
    // Close other dropdowns first
    setBrowseMenuAnchor(null)
    setSubmitMenuAnchor(null)
    // Use the current target (the Box element) as the anchor
    setCommunityMenuAnchor(event.currentTarget)
  }

  const handleSubmitMenuEnter = (event: React.MouseEvent<HTMLElement>) => {
    // Clear any pending timeouts
    if (browseTimeout.current) {
      clearTimeout(browseTimeout.current)
    }
    if (communityTimeout.current) {
      clearTimeout(communityTimeout.current)
    }
    if (submitTimeout.current) {
      clearTimeout(submitTimeout.current)
    }
    // Close other dropdowns first
    setBrowseMenuAnchor(null)
    setCommunityMenuAnchor(null)
    // Use the current target (the Box element) as the anchor
    setSubmitMenuAnchor(event.currentTarget)
  }

  const handleDropdownClose = () => {
    // Clear any pending timeouts
    if (browseTimeout.current) {
      clearTimeout(browseTimeout.current)
    }
    if (communityTimeout.current) {
      clearTimeout(communityTimeout.current)
    }
    if (submitTimeout.current) {
      clearTimeout(submitTimeout.current)
    }
    setBrowseMenuAnchor(null)
    setCommunityMenuAnchor(null)
    setSubmitMenuAnchor(null)
  }

  const handleDropdownLeave = () => {
    // Add a slightly longer delay to allow moving between button and dropdown
    browseTimeout.current = setTimeout(() => {
      setBrowseMenuAnchor(null)
      setCommunityMenuAnchor(null)
      setSubmitMenuAnchor(null)
    }, 250) // Increased from 150ms to 250ms for better UX
  }

  // Dropdown menu mouse handlers - these handle the actual dropdown closing
  const handleDropdownEnter = () => {
    // Clear any pending timeouts when entering the dropdown
    if (browseTimeout.current) {
      clearTimeout(browseTimeout.current)
    }
    if (communityTimeout.current) {
      clearTimeout(communityTimeout.current)
    }
    if (submitTimeout.current) {
      clearTimeout(submitTimeout.current)
    }
  }

  // Specific dropdown enter handlers to clear their specific timeouts
  const handleBrowseDropdownEnter = () => {
    if (browseTimeout.current) {
      clearTimeout(browseTimeout.current)
    }
  }

  const handleCommunityDropdownEnter = () => {
    if (communityTimeout.current) {
      clearTimeout(communityTimeout.current)
    }
  }

  const handleSubmitDropdownEnter = () => {
    if (submitTimeout.current) {
      clearTimeout(submitTimeout.current)
    }
  }

  // Specific dropdown leave handlers
  const handleBrowseDropdownLeave = () => {
    browseTimeout.current = setTimeout(() => {
      setBrowseMenuAnchor(null)
    }, 200)
  }

  const handleCommunityDropdownLeave = () => {
    communityTimeout.current = setTimeout(() => {
      setCommunityMenuAnchor(null)
    }, 200)
  }

  const handleSubmitDropdownLeave = () => {
    submitTimeout.current = setTimeout(() => {
      setSubmitMenuAnchor(null)
    }, 200)
  }

  // Individual button leave handlers - close specific dropdown when leaving button
  const handleBrowseButtonLeave = () => {
    browseTimeout.current = setTimeout(() => {
      setBrowseMenuAnchor(null)
    }, 300)
  }

  const handleCommunityButtonLeave = () => {
    communityTimeout.current = setTimeout(() => {
      setCommunityMenuAnchor(null)
    }, 300)
  }

  const handleSubmitButtonLeave = () => {
    submitTimeout.current = setTimeout(() => {
      setSubmitMenuAnchor(null)
    }, 300)
  }

  // Search helper functions
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'character':
        return <Users size={16} />
      case 'faction':
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
      case 'faction':
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

      // Sort results by priority: characters, factions, arcs, gambles, events, chapters
      const priorityOrder = ['character', 'faction', 'arc', 'gamble', 'event', 'chapter']
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

  // Navigation categories
  const browseItems = {
    'Characters & Factions': [
      { label: 'Characters', href: '/characters', icon: <Users size={16} /> },
      { label: 'Factions', href: '/factions', icon: <Shield size={16} /> },
      { label: 'Quotes', href: '/quotes', icon: <Quote size={16} /> }
    ],
    'Story Elements': [
      { label: 'Arcs', href: '/arcs', icon: <BookOpen size={16} /> },
      { label: 'Events', href: '/events', icon: <CalendarSearch size={16} /> },
      { label: 'Gambles', href: '/gambles', icon: <Dices size={16} /> }
    ],
    'Content Navigation': [
      { label: 'Volumes', href: '/volumes', icon: <Book size={16} /> },
      { label: 'Chapters', href: '/chapters', icon: <FileText size={16} /> }
    ]
  }

  // Category colors for enhanced visual distinction
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Characters & Factions':
        return '#2196f3' // Bright Material Blue
      case 'Story Elements':
        return '#e91e63' // Bright Material Pink
      case 'Content Navigation':
        return '#4caf50' // Bright Material Green
      default:
        return '#f44336' // Bright Material Red
    }
  }

  const communityItems = [
    { label: 'Guides', href: '/guides', icon: <BookOpen size={16} /> },
    { label: 'Users', href: '/users', icon: <Users size={16} /> },
    { label: 'About', href: '/about', icon: <Info size={16} /> }
  ]

  const submitItems = [
    { label: 'Submit Guide', href: '/submit-guide', icon: <BookOpen size={16} /> },
    { label: 'Submit Media', href: '/submit-media', icon: <Image size={16} /> }
  ]

  const avatarSrc = getAvatarSrc()

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current)
      }
      if (browseTimeout.current) {
        clearTimeout(browseTimeout.current)
      }
      if (communityTimeout.current) {
        clearTimeout(communityTimeout.current)
      }
      if (submitTimeout.current) {
        clearTimeout(submitTimeout.current)
      }
    }
  }, [])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Only close if we have open dropdowns
      if (browseMenuAnchor || communityMenuAnchor || submitMenuAnchor) {
        setBrowseMenuAnchor(null)
        setCommunityMenuAnchor(null)
        setSubmitMenuAnchor(null)
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [browseMenuAnchor, communityMenuAnchor, submitMenuAnchor])

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
          <Box 
            sx={{ position: 'relative' }}
            onMouseEnter={handleBrowseMenuEnter}
            onMouseLeave={handleBrowseButtonLeave}
          >
            <Button
              color="inherit"
              sx={{
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)'
                },
                backgroundColor: Boolean(browseMenuAnchor) ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                cursor: 'default'
              }}
              disableRipple
            >
              Browse
            </Button>
            {/* Arrow indicator */}
            <Box
              sx={{
                position: 'absolute',
                bottom: -2,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 0,
                height: 0,
                borderLeft: '4px solid transparent',
                borderRight: '4px solid transparent',
                borderTop: Boolean(browseMenuAnchor) ? '4px solid white' : 'none',
                borderBottom: Boolean(browseMenuAnchor) ? 'none' : '4px solid rgba(255, 255, 255, 0.4)',
                opacity: 1,
                transition: 'all 0.2s ease-in-out'
              }}
            />
          </Box>

          {/* Community Dropdown */}
          <Box 
            sx={{ position: 'relative' }}
            onMouseEnter={handleCommunityMenuEnter}
            onMouseLeave={handleCommunityButtonLeave}
          >
            <Button
              color="inherit"
              sx={{
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)'
                },
                backgroundColor: Boolean(communityMenuAnchor) ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                cursor: 'default'
              }}
              disableRipple
            >
              Community
            </Button>
            {/* Arrow indicator */}
            <Box
              sx={{
                position: 'absolute',
                bottom: -2,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 0,
                height: 0,
                borderLeft: '4px solid transparent',
                borderRight: '4px solid transparent',
                borderTop: Boolean(communityMenuAnchor) ? '4px solid white' : 'none',
                borderBottom: Boolean(communityMenuAnchor) ? 'none' : '4px solid rgba(255, 255, 255, 0.4)',
                opacity: 1,
                transition: 'all 0.2s ease-in-out'
              }}
            />
          </Box>

          {/* Submit Dropdown */}
          <Box 
            sx={{ position: 'relative' }}
            onMouseEnter={handleSubmitMenuEnter}
            onMouseLeave={handleSubmitButtonLeave}
          >
            <Button
              color="inherit"
              sx={{
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)'
                },
                backgroundColor: Boolean(submitMenuAnchor) ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                cursor: 'default'
              }}
              disableRipple
            >
              Submit
            </Button>
            {/* Arrow indicator */}
            <Box
              sx={{
                position: 'absolute',
                bottom: -2,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 0,
                height: 0,
                borderLeft: '4px solid transparent',
                borderRight: '4px solid transparent',
                borderTop: Boolean(submitMenuAnchor) ? '4px solid white' : 'none',
                borderBottom: Boolean(submitMenuAnchor) ? 'none' : '4px solid rgba(255, 255, 255, 0.4)',
                opacity: 1,
                transition: 'all 0.2s ease-in-out'
              }}
            />
          </Box>
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
        <Menu
          anchorEl={browseMenuAnchor}
          open={Boolean(browseMenuAnchor)}
          onClose={handleDropdownClose}
          onClick={handleDropdownClose}
          onMouseEnter={handleBrowseDropdownEnter}
          onMouseLeave={handleBrowseDropdownLeave}
          MenuListProps={{
            onMouseEnter: handleBrowseDropdownEnter,
            onMouseLeave: handleBrowseDropdownLeave
          }}
          transformOrigin={{ horizontal: 'left', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
          sx={{ 
            '& .MuiPaper-root': {
              marginTop: '4px', // Small gap to allow leaving button area
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'
            }
          }}
        >
          {Object.entries(browseItems).map(([category, items]) => (
            <Box key={category}>
              <MenuItem disabled sx={{ 
                fontWeight: 'bold', 
                opacity: '1 !important', 
                color: `${getCategoryColor(category)} !important`,
                fontSize: '0.9rem',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                '&.Mui-disabled': {
                  color: `${getCategoryColor(category)} !important`,
                  opacity: '1 !important'
                }
              }}>
                {category}
              </MenuItem>
              {items.map((item) => (
                <MenuItem
                  key={item.href}
                  component={Link}
                  href={item.href}
                  sx={{
                    pl: 3,
                    backgroundColor: isActivePath(item.href) ? 'action.selected' : 'transparent',
                    '&:hover': {
                      backgroundColor: 'action.hover'
                    }
                  }}
                >
                  <Box sx={{ mr: 1, display: 'flex' }}>{item.icon}</Box>
                  {item.label}
                </MenuItem>
              ))}
              <Divider sx={{ my: 0.5 }} />
            </Box>
          ))}
        </Menu>

        {/* Community Dropdown Menu */}
        <Menu
          anchorEl={communityMenuAnchor}
          open={Boolean(communityMenuAnchor)}
          onClose={handleDropdownClose}
          onClick={handleDropdownClose}
          onMouseEnter={handleCommunityDropdownEnter}
          onMouseLeave={handleCommunityDropdownLeave}
          MenuListProps={{
            onMouseEnter: handleCommunityDropdownEnter,
            onMouseLeave: handleCommunityDropdownLeave
          }}
          transformOrigin={{ horizontal: 'left', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
          sx={{ 
            '& .MuiPaper-root': {
              marginTop: '4px', // Small gap to allow leaving button area
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'
            }
          }}
        >
          {communityItems.map((item) => (
            <MenuItem
              key={item.href}
              component={Link}
              href={item.href}
              sx={{
                backgroundColor: isActivePath(item.href) ? 'action.selected' : 'transparent',
                '&:hover': {
                  backgroundColor: 'action.hover'
                }
              }}
            >
              <Box sx={{ mr: 1, display: 'flex' }}>{item.icon}</Box>
              {item.label}
            </MenuItem>
          ))}
        </Menu>

        {/* Submit Dropdown Menu */}
        <Menu
          anchorEl={submitMenuAnchor}
          open={Boolean(submitMenuAnchor)}
          onClose={handleDropdownClose}
          onClick={handleDropdownClose}
          onMouseEnter={handleSubmitDropdownEnter}
          onMouseLeave={handleSubmitDropdownLeave}
          MenuListProps={{
            onMouseEnter: handleSubmitDropdownEnter,
            onMouseLeave: handleSubmitDropdownLeave
          }}
          transformOrigin={{ horizontal: 'left', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
          sx={{ 
            '& .MuiPaper-root': {
              marginTop: '4px', // Small gap to allow leaving button area
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'
            }
          }}
        >
          {submitItems.map((item) => (
            <MenuItem
              key={item.href}
              component={Link}
              href={item.href}
              sx={{
                backgroundColor: isActivePath(item.href) ? 'action.selected' : 'transparent',
                '&:hover': {
                  backgroundColor: 'action.hover'
                }
              }}
            >
              <Box sx={{ mr: 1, display: 'flex' }}>{item.icon}</Box>
              {item.label}
            </MenuItem>
          ))}
        </Menu>

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

          {/* Browse Section */}
          {Object.entries(browseItems).map(([category, items]) => (
            <Box key={category}>
              <MenuItem disabled sx={{ 
                fontWeight: 'bold', 
                opacity: '1 !important', 
                color: `${getCategoryColor(category)} !important`,
                fontSize: '0.9rem',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                '&.Mui-disabled': {
                  color: `${getCategoryColor(category)} !important`,
                  opacity: '1 !important'
                }
              }}>
                {category}
              </MenuItem>
              {items.map((item) => (
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
          {communityItems.map((item) => (
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
          {submitItems.map((item) => (
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

          {/* User Section */}
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