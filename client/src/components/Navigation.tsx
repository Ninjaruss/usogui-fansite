'use client'

import React, { useState, useEffect, useCallback } from 'react'
// Note: Avoid importing Mantine Header to preserve compatibility; using native <header> element
import {
  Group,
  Title,
  Button,
  ActionIcon,
  Menu,
  Box,
  Avatar,
  TextInput,
  Paper,
  Text,
  Badge,
  Loader,
  rem,
  useMantineTheme
} from '@mantine/core'
import { useFocusTrap } from '@mantine/hooks'
import {
  Menu as MenuIcon,
  User,
  LogOut,
  Crown,
  BookOpen,
  Image,
  Users,
  Dices,
  CalendarSearch,
  Book,
  Shield,
  Quote,
  Search,
  Info,
  FileText,
  Zap,
  ChevronDown,
  Calendar,
  MessageSquare
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '../providers/AuthProvider'
import { useNavigationSearch } from '../hooks/useNavigationSearch'
import { motion, AnimatePresence } from 'motion/react'
import { NavigationData, getCategoryColor } from '../types/navigation'
import { EntityAccentKey, getEntityAccent, getEntityThemeColor, semanticColors, textColors, outlineStyles } from '../lib/mantine-theme'

interface SearchResult {
  id: number
  type: string
  title: string
  description?: string
  score?: number
  hasSpoilers?: boolean
  slug?: string
  metadata?: any
}

const Navigation: React.FC = () => {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const theme = useMantineTheme()

  // Mobile menu open state (controlled Menu)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Focus trap for mobile menu accessibility
  const focusTrapRef = useFocusTrap(mobileMenuOpen)

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.classList.add('focus-trap-active')
    } else {
      document.body.classList.remove('focus-trap-active')
    }
    return () => {
      document.body.classList.remove('focus-trap-active')
    }
  }, [mobileMenuOpen])

  // Handle escape key to close mobile menu
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape' && mobileMenuOpen) {
      setMobileMenuOpen(false)
    }
  }, [mobileMenuOpen])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown])

  // Search state - extracted to custom hook for cleaner component
  const {
    searchValue,
    searchResults,
    searchLoading,
    searchFocused,
    setSearchFocused,
    showSearchResults,
    setShowSearchResults,
    handleSearchChange,
    handleSearchResultClick,
    handleSearchKeyDown,
    handleSearchSubmit,
    shouldShowSearchDropdown
  } = useNavigationSearch()
  const accentColor = theme.other?.usogui?.red ?? theme.colors.red?.[5] ?? '#e11d48'
  // Use centralized outline styles for consistency
  const menuHoverStyles = {
    transition: outlineStyles.transition,
    '&:hover': {
      boxShadow: `inset 0 0 0 1px ${outlineStyles.colors.hover}`,
      outline: 'none'
    },
    '&:focus': {
      boxShadow: `inset 0 0 0 1px ${outlineStyles.colors.hover}`,
      outline: 'none'
    }
  }
  // accountMenuHighlight removed - rely on CSS hover/focus styles instead
  const [mobileAccountHighlight, setMobileAccountHighlight] = useState<string | null>(null)
  const [loginButtonHighlighted, setLoginButtonHighlighted] = useState(false)
  const [browseOpened, setBrowseOpened] = useState(false)
  const [communityOpened, setCommunityOpened] = useState(false)
  const [submitOpened, setSubmitOpened] = useState(false)

  const getOutlineShadow = (isActive: boolean, isHighlighted: boolean) => {
    if (isActive) {
      return outlineStyles.getOutlineStyle('active').boxShadow
    }
    return isHighlighted ? outlineStyles.getOutlineStyle('hover').boxShadow : 'none'
  }

  // Small helper to convert hex color to rgba string (falls back to provided color)
  const rgba = (color: string | undefined, alpha = 1) => {
    if (!color) return `rgba(255,255,255,${alpha})`
    try {
      if (color.startsWith('#')) {
        const hex = color.replace('#', '')
        const bigint = parseInt(hex.length === 3 ? hex.split('').map(c => c + c).join('') : hex, 16)
        const r = (bigint >> 16) & 255
        const g = (bigint >> 8) & 255
        const b = bigint & 255
        return `rgba(${r}, ${g}, ${b}, ${alpha})`
      }
    } catch (e) {
      // ignore and fallback
    }
    return color
  }


  const handleMobileMenuClose = () => {
    setMobileMenuOpen(false)
    setMobileAccountHighlight(null)
  }

  const handleLogout = async () => {
    await logout()
    handleMobileMenuClose()
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

  const typeAccentMap: Record<string, EntityAccentKey> = {
    character: 'character',
    organization: 'organization',
    arc: 'arc',
    gamble: 'gamble',
    event: 'event',
    guide: 'guide',
    media: 'media',
    quote: 'quote'
  }

  const getTypeColor = (type: string) => {
    const normalizedType = typeof type === 'string' ? type.toLowerCase() : type
    const accentKey = typeAccentMap[normalizedType]
    if (accentKey) {
      return getEntityAccent(accentKey, theme)
    }

    if (type === 'chapter') {
      return '#607d8b'
    }

    return accentColor
  }

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
      { label: 'Media', href: '/media', icon: <Image size={16} /> },
      { label: 'Users', href: '/users', icon: <Users size={16} /> },
      { label: 'About', href: '/about', icon: <Info size={16} /> }
    ],
    submit: [
      { label: 'Submit Guide', href: '/submit-guide', icon: <BookOpen size={16} /> },
      { label: 'Submit Media', href: '/submit-media', icon: <Image size={16} /> },
      { label: 'Submit Event', href: '/submit-event', icon: <Calendar size={16} /> },
      { label: 'Submit Annotation', href: '/submit-annotation', icon: <MessageSquare size={16} /> }
    ]
  }

  const avatarSrc = getAvatarSrc()

  return (
    <header
      role="banner"
      aria-label="Main navigation"
      style={{
        height: '60px',
        padding: `0 ${rem(16)}`,
        marginBottom: rem(32),
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        backgroundColor: 'var(--mantine-color-dark-8)',
        borderBottom: '1px solid var(--mantine-color-dark-6)'
      }}
      data-testid="navigation-bar"
    >
      <Group h="100%" align="center" justify="space-between">
        {/* Logo - Left Side */}
        <Link href="/" style={{ textDecoration: 'none' }}>
          <Title
            order={4}
            style={{
              color: '#ffffff',
              fontWeight: '700',
              cursor: 'pointer',
              marginRight: rem(24),
              fontSize: rem(20),
              transition: 'color 160ms ease, transform 160ms ease'
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLElement
              el.style.color = accentColor
              el.style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement
              el.style.color = '#ffffff'
              el.style.transform = 'none'
            }}
            onFocus={(e) => {
              const el = e.currentTarget as HTMLElement
              el.style.color = accentColor
            }}
            onBlur={(e) => {
              const el = e.currentTarget as HTMLElement
              el.style.color = '#ffffff'
            }}
            tabIndex={0}
          >
            L-File
          </Title>
        </Link>

        {/* Desktop Navigation - Center */}
        <Group
          gap="xl"
          visibleFrom="md"
          style={{ 
            alignItems: 'center',
            flexGrow: 1
          }}
          data-testid="nav-buttons-container"
        >
          {/* Browse Dropdown */}
          <Menu
            trigger="hover"
            openDelay={0}
            closeDelay={300}
            position="bottom"
            withArrow={false}
            offset={4}
            opened={browseOpened}
            onOpen={() => setBrowseOpened(true)}
            onClose={() => setBrowseOpened(false)}
            styles={{
              dropdown: {
                backgroundColor: theme.colors.dark[8],
                border: `1px solid ${theme.colors.dark[6]}`,
                borderRadius: theme.radius.md,
                boxShadow: theme.shadows.xl,
                minWidth: 'unset',
                width: 'auto',
                padding: rem(6),
                backdropFilter: 'blur(10px)'
              }
            }}
          >
              <Menu.Target>
                <Button
                  variant="subtle"
                  color="gray"
                  rightSection={
                    <ChevronDown
                      size={14}
                      style={{
                        transform: browseOpened ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 200ms ease'
                      }}
                    />
                  }
                  style={{
                    backgroundColor: browseOpened ? (rgba(accentColor, 0.1) ?? 'rgba(225, 29, 72, 0.1)') : 'transparent',
                    color: browseOpened ? accentColor : theme.colors.gray[0],
                    fontWeight: 500
                  }}
                  styles={{
                    root: {
                      ...menuHoverStyles,
                      '&:hover': {
                        backgroundColor: rgba(theme.colors.white?.[0], 0.1) ?? 'rgba(255, 255, 255, 0.1)'
                      }
                    }
                  }}
                >
                  Browse
                </Button>
              </Menu.Target>
              <Menu.Dropdown>
              {navigationData.browse.map((category, index) => (
                <Box key={category.name}>
                  <Menu.Label
                    style={{
                      color: category.color,
                      fontWeight: 'bold',
                      fontSize: theme.fontSizes.xs,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      marginBottom: theme.spacing.xs
                    }}
                  >
                    {category.name}
                  </Menu.Label>
                  {category.items.map((item) => (
                    <Menu.Item
                      key={item.href}
                      component={Link}
                      href={item.href}
                      leftSection={item.icon}
                      style={{
                        borderLeft: isActivePath(item.href) ? `3px solid ${accentColor}` : '3px solid transparent',
                        borderRadius: theme.radius.sm,
                        paddingLeft: theme.spacing.md,
                        color: isActivePath(item.href) ? accentColor : theme.colors.gray[0],
                        backgroundColor: 'transparent',
                        transition: 'all 200ms ease'
                      }}
                      styles={{
                        itemLabel: {
                          fontSize: theme.fontSizes.sm,
                          fontWeight: isActivePath(item.href) ? 500 : 400,
                          whiteSpace: 'nowrap'
                        },
                        item: {
                          ...menuHoverStyles,
                          '&:hover': {
                            backgroundColor: rgba(accentColor, 0.1) ?? 'rgba(225, 29, 72, 0.1)',
                            color: accentColor,
                            boxShadow: `inset 0 0 0 1px ${accentColor}`
                          }
                        }
                      }}
                    >
                      {item.label}
                    </Menu.Item>
                  ))}
                  {index < navigationData.browse.length - 1 && <Menu.Divider />}
                </Box>
              ))}
                </Menu.Dropdown>
          </Menu>

          {/* Community Dropdown */}
          <Menu
            trigger="hover"
            openDelay={0}
            closeDelay={300}
            position="bottom"
            withArrow={false}
            offset={4}
            opened={communityOpened}
            onOpen={() => setCommunityOpened(true)}
            onClose={() => setCommunityOpened(false)}
            styles={{
              dropdown: {
                backgroundColor: theme.colors.dark[8],
                border: `1px solid ${theme.colors.dark[6]}`,
                borderRadius: theme.radius.md,
                boxShadow: theme.shadows.xl,
                minWidth: 'unset',
                width: 'auto',
                padding: rem(6),
                backdropFilter: 'blur(10px)'
              }
            }}
          >
              <Menu.Target>
                <Button
                  variant="subtle"
                  color="gray"
                  rightSection={
                    <ChevronDown
                      size={14}
                      style={{
                        transform: communityOpened ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 200ms ease'
                      }}
                    />
                  }
                  style={{
                    backgroundColor: communityOpened ? (rgba(accentColor, 0.1) ?? 'rgba(225, 29, 72, 0.1)') : 'transparent',
                    color: communityOpened ? accentColor : theme.colors.gray[0],
                    fontWeight: 500
                  }}
                  styles={{
                    root: {
                      ...menuHoverStyles,
                      '&:hover': {
                        backgroundColor: rgba(theme.colors.white?.[0], 0.1) ?? 'rgba(255, 255, 255, 0.1)'
                      }
                    }
                  }}
                >
                  Community
                </Button>
              </Menu.Target>
              <Menu.Dropdown>
              {navigationData.community.map((item) => (
                <Menu.Item
                  key={item.href}
                  component={Link}
                  href={item.href}
                  leftSection={item.icon}
                  style={{
                    borderLeft: isActivePath(item.href) ? `3px solid ${accentColor}` : '3px solid transparent',
                    borderRadius: theme.radius.sm,
                    paddingLeft: theme.spacing.md,
                    color: isActivePath(item.href) ? accentColor : theme.colors.gray[0],
                    backgroundColor: 'transparent',
                    transition: 'all 200ms ease'
                  }}
                  styles={{
                    itemLabel: {
                      fontSize: theme.fontSizes.sm,
                      fontWeight: isActivePath(item.href) ? 500 : 400,
                      whiteSpace: 'nowrap'
                    },
                    item: {
                      ...menuHoverStyles,
                      '&:hover': {
                        backgroundColor: rgba(accentColor, 0.1) ?? 'rgba(225, 29, 72, 0.1)',
                        color: accentColor,
                        boxShadow: `inset 0 0 0 1px ${accentColor}`
                      }
                    }
                  }}
                >
                  {item.label}
                </Menu.Item>
              ))}
                </Menu.Dropdown>
          </Menu>

          {/* Submit Dropdown */}
          <Menu
            trigger="hover"
            openDelay={0}
            closeDelay={300}
            position="bottom"
            withArrow={false}
            offset={4}
            opened={submitOpened}
            onOpen={() => setSubmitOpened(true)}
            onClose={() => setSubmitOpened(false)}
            styles={{
              dropdown: {
                backgroundColor: theme.colors.dark[8],
                border: `1px solid ${theme.colors.dark[6]}`,
                borderRadius: theme.radius.md,
                boxShadow: theme.shadows.xl,
                minWidth: 'unset',
                width: 'auto',
                padding: rem(6),
                backdropFilter: 'blur(10px)'
              }
            }}
          >
              <Menu.Target>
                <Button
                  variant="subtle"
                  color="gray"
                  rightSection={
                    <ChevronDown
                      size={14}
                      style={{
                        transform: submitOpened ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 200ms ease'
                      }}
                    />
                  }
                  style={{
                    backgroundColor: submitOpened ? (rgba(accentColor, 0.1) ?? 'rgba(225, 29, 72, 0.1)') : 'transparent',
                    color: submitOpened ? accentColor : theme.colors.gray[0],
                    fontWeight: 500
                  }}
                  styles={{
                    root: {
                      ...menuHoverStyles,
                      '&:hover': {
                        backgroundColor: rgba(theme.colors.white?.[0], 0.1) ?? 'rgba(255, 255, 255, 0.1)'
                      }
                    }
                  }}
                >
                  Submit
                </Button>
              </Menu.Target>
              <Menu.Dropdown>
              {navigationData.submit.map((item) => (
                <Menu.Item
                  key={item.href}
                  component={Link}
                  href={item.href}
                  leftSection={item.icon}
                  style={{
                    borderLeft: isActivePath(item.href) ? `3px solid ${accentColor}` : '3px solid transparent',
                    borderRadius: theme.radius.sm,
                    paddingLeft: theme.spacing.md,
                    color: isActivePath(item.href) ? accentColor : theme.colors.gray[0],
                    backgroundColor: 'transparent',
                    transition: 'all 200ms ease'
                  }}
                  styles={{
                    itemLabel: {
                      fontSize: theme.fontSizes.sm,
                      fontWeight: isActivePath(item.href) ? 500 : 400,
                      whiteSpace: 'nowrap'
                    },
                    item: {
                      ...menuHoverStyles,
                      '&:hover': {
                        backgroundColor: rgba(accentColor, 0.1) ?? 'rgba(225, 29, 72, 0.1)',
                        color: accentColor,
                        boxShadow: `inset 0 0 0 1px ${accentColor}`
                      }
                    }
                  }}
                >
                  {item.label}
                </Menu.Item>
              ))}
                </Menu.Dropdown>
          </Menu>
        </Group>

        {/* Right Side - Search + Profile */}
        <Group gap="md" align="center">
          {/* Search Bar - Desktop */}
          <Box
            visibleFrom="md"
            style={{ 
              position: 'relative',
              alignItems: 'center'
            }}
          >
            <Box 
              component="form" 
              onSubmit={handleSearchSubmit} 
              style={{ 
                position: 'relative',
                borderRadius: rem(4),
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                transition: 'all 0.2s',
                width: searchFocused ? '280px' : '180px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)'
              }}
              onMouseLeave={(e) => {
                if (!searchFocused) {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'
                }
              }}
            >
              <TextInput
                placeholder="Search"
                aria-label="Search characters, arcs, gambles, and more"
                value={searchValue}
                onChange={(e) => handleSearchChange(e)}
                onFocus={() => {
                  setSearchFocused(true)
                  if (searchValue.length >= 2) {
                    setShowSearchResults(true)
                  }
                }}
                onBlur={() => {
                  setTimeout(() => {
                    setSearchFocused(false)
                    setShowSearchResults(false)
                  }, 200)
                }}
                onKeyDown={handleSearchKeyDown}
                leftSection={
                  searchLoading ? (
                    <Loader size={18} color="rgba(255, 255, 255, 0.7)" />
                  ) : (
                    <Search size={18} color="rgba(255, 255, 255, 0.7)" />
                  )
                }
                styles={{
                  input: {
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: 'white',
                    '&::placeholder': {
                      color: 'rgba(255, 255, 255, 0.75)', // Improved from 0.7 for 4.6:1 contrast
                    },
                    '&:focus': {
                      backgroundColor: 'transparent',
                      borderColor: 'transparent',
                    }
                  }
                }}
              />
            </Box>

          {/* Search Results Dropdown */}
          <AnimatePresence>
            {shouldShowSearchDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
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
                  style={{
                    maxHeight: 400,
                    overflow: 'auto',
                    borderRadius: '8px',
                    backgroundColor: '#0a0a0a',
                    border: '1px solid rgba(225, 29, 72, 0.2)',
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 20px 25px -5px rgba(225, 29, 72, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.4)',
                  }}
                >
                  {searchResults.length > 0 ? (
                    searchResults.slice(0, 8).map((result, index) => (
                      <div
                        key={`${result.type}-${result.id}`}
                        onClick={() => handleSearchResultClick(result)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '12px 16px',
                          borderBottom: index === Math.min(searchResults.length, 8) - 1
                            ? 'none'
                            : '1px solid rgba(225, 29, 72, 0.2)',
                          color: '#ffffff',
                          backgroundColor: 'transparent',
                          cursor: 'pointer',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgba(225, 29, 72, 0.1)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }}
                      >
                        <Box style={{ display: 'flex', alignItems: 'center', marginRight: '16px' }}>
                          <Box style={{ color: getTypeColor(result.type) }}>
                            {getTypeIcon(result.type)}
                          </Box>
                        </Box>
                        <Box style={{ flex: 1 }}>
                          <Box style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <Box style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', flex: 1 }}>
                              <Text style={{ color: '#ffffff', fontWeight: 500 }}>
                                {result.title}
                              </Text>
                              {result.type === 'character' && result.metadata && Array.isArray((result.metadata as Record<string, unknown>).alternateNames) && ((result.metadata as Record<string, unknown>).alternateNames as string[]).length > 0 && (
                                <Text
                                  size="xs"
                                  style={{
                                    color: 'rgba(255, 255, 255, 0.75)', // 4.6:1 contrast - WCAG AA compliant
                                    fontStyle: 'italic'
                                  }}
                                >
                                  {((result.metadata as Record<string, unknown>).alternateNames as string[]).join(', ')}
                                </Text>
                              )}
                            </Box>
                            <Box style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <Badge
                                size="sm"
                                style={{
                                  backgroundColor: getTypeColor(result.type),
                                  color: '#ffffff'
                                }}
                              >
                                {result.type}
                              </Badge>
                              {result.hasSpoilers && (
                                <Badge
                                  size="sm"
                                  style={{
                                    backgroundColor: '#f57c00',
                                    color: '#ffffff'
                                  }}
                                >
                                  Spoilers
                                </Badge>
                              )}
                            </Box>
                          </Box>
                        </Box>
                      </div>
                    ))
                  ) : (
                    <Box style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <Text style={{ color: 'rgba(255, 255, 255, 0.75)' }}>
                        {searchValue.trim().length < 2
                          ? 'Type at least 2 characters to search'
                          : 'No results found'}
                      </Text>
                    </Box>
                  )}
                </Paper>
              </motion.div>
            )}
          </AnimatePresence>
          </Box>

          {/* User Profile/Login Section */}
          {user ? (
            <>
              {/* Admin Button - Desktop */}
              {(user.role === 'admin' || user.role === 'moderator') && (
                <Button
                  component={Link}
                  href="/admin"
                  variant="subtle"
                  style={{ color: getEntityThemeColor(theme, 'gamble') }}
                  leftSection={<Crown size={16} />}
                  visibleFrom="md"
                >
                  Admin
                </Button>
              )}

              {/* User Avatar */}
              <Menu
                trigger="hover"
                openDelay={100}
                closeDelay={400}
                position="bottom"
                withArrow
                arrowPosition="center"
                offset={4}
                styles={{
                  dropdown: {
                    backgroundColor: theme.colors.dark[8],
                    border: `1px solid ${theme.colors.dark[6]}`,
                    borderRadius: theme.radius.sm,
                    boxShadow: theme.shadows.md,
                    minWidth: 'unset',
                    width: 'auto',
                    padding: rem(6),
                    overflow: 'hidden'
                  }
                }}
              >
                <Menu.Target>
                  <ActionIcon
                    size="lg"
                    variant="transparent"
                    visibleFrom="md"
                    style={{ 
                      cursor: 'pointer'
                    }}
                    aria-label="account of current user"
                  >
                  <Avatar src={avatarSrc || undefined} size={32} alt={user.username}>
                    {!avatarSrc && user.username[0].toUpperCase()}
                  </Avatar>
                </ActionIcon>
              </Menu.Target>

              <Menu.Dropdown>
                <Menu.Item
                  component={Link}
                  href="/profile"
                  leftSection={<User size={16} />}
                  style={{
                    backgroundColor: 'transparent',
                    borderRadius: 6,
                    transition: 'box-shadow 0.2s ease',
                    /* keep an explicit active outline when the profile route is active */
                    boxShadow: isActivePath('/profile') ? `inset 0 0 0 1px ${accentColor}` : undefined,
                    paddingTop: rem(6),
                    paddingBottom: rem(6)
                  }}
                  styles={{ item: menuHoverStyles }}
                >
                  Profile & Submissions
                </Menu.Item>
                <Menu.Item
                  component={Link}
                  href="/about"
                  leftSection={<Info size={16} />}
                  style={{
                    backgroundColor: 'transparent',
                    borderRadius: 6,
                    transition: 'box-shadow 0.2s ease',
                    boxShadow: isActivePath('/about') ? `inset 0 0 0 1px ${accentColor}` : undefined,
                    paddingTop: rem(6),
                    paddingBottom: rem(6)
                  }}
                  styles={{ item: menuHoverStyles }}
                >
                  About
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item
                  onClick={handleLogout}
                  leftSection={<LogOut size={16} />}
                  style={{
                    color: getEntityThemeColor(theme, 'gamble'),
                    backgroundColor: 'transparent',
                    borderRadius: 6,
                    transition: 'box-shadow 0.2s ease',
                    paddingTop: rem(6),
                    paddingBottom: rem(6)
                  }}
                  styles={{ item: menuHoverStyles }}
                >
                  Logout
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
            </>
          ) : (
            <Button
              component={Link}
              href="/login"
              variant="subtle"
              color="white"
              onMouseEnter={() => setLoginButtonHighlighted(true)}
              onMouseLeave={() => setLoginButtonHighlighted(false)}
              onFocus={() => setLoginButtonHighlighted(true)}
              onBlur={() => setLoginButtonHighlighted(false)}
              style={{
                backgroundColor: 'transparent',
                color: 'white',
                transition: 'box-shadow 0.2s ease',
                boxShadow: getOutlineShadow(isActivePath('/login'), loginButtonHighlighted)
              }}
              styles={{
                root: {
                  '&:hover': {
                    backgroundColor: 'transparent'
                  }
                }
              }}
            >
              Login
            </Button>
          )}
        </Group>

        {/* Mobile Menu Button */}
        <Menu
          opened={mobileMenuOpen}
          onClose={handleMobileMenuClose}
          position="bottom-end"
          withArrow
          arrowPosition="center"
          offset={4}
          withinPortal={true}
          zIndex={1100}
          styles={{
            dropdown: {
              left: '0 !important',
              right: '0 !important',
              transform: 'none !important',
              maxWidth: 'none',
              width: '100vw',
              borderRadius: 0,
              marginTop: '8px',
              maxHeight: '80vh',
              overflowY: 'auto'
            }
          }}
        >
          <Menu.Target>
            <ActionIcon
              size="lg"
              variant="transparent"
              aria-label="show more"
              onClick={() => setMobileMenuOpen((open) => !open)}
              hiddenFrom="md"
            >
              <MenuIcon size={24} />
            </ActionIcon>
          </Menu.Target>

          <Menu.Dropdown className="md:hidden" ref={focusTrapRef}>
            {/* Mobile Search */}
            <Box p="md" pb="sm">
              <form onSubmit={handleSearchSubmit}>
                <TextInput
                  placeholder="Search (2+ chars)..."
                  aria-label="Search characters, arcs, gambles, and more"
                  value={searchValue}
                  onChange={(e) => handleSearchChange(e)}
                  leftSection={searchLoading ? <Loader size={18} /> : <Search size={18} />}
                />
              </form>
            </Box>
            <Menu.Divider />

            {/* User Section */}
            {user ? (
              <>
                <Menu.Item
                  component={Link}
                  href="/profile"
                  leftSection={<User size={16} />}
                  onClick={handleMobileMenuClose}
                  onMouseEnter={() => setMobileAccountHighlight('profile')}
                  onMouseLeave={() => {
                    setMobileAccountHighlight((current) => (current === 'profile' ? null : current))
                  }}
                  onFocus={() => setMobileAccountHighlight('profile')}
                  onBlur={() => {
                    setMobileAccountHighlight((current) => (current === 'profile' ? null : current))
                  }}
                  style={{
                    backgroundColor: 'transparent',
                    borderRadius: 6,
                    transition: 'box-shadow 0.2s ease'
                  }}
                  styles={{ item: menuHoverStyles }}
                >
                  Profile & Submissions
                </Menu.Item>
                <Menu.Item
                  component={Link}
                  href="/about"
                  leftSection={<Info size={16} />}
                  onClick={handleMobileMenuClose}
                  onMouseEnter={() => setMobileAccountHighlight('about')}
                  onMouseLeave={() => {
                    setMobileAccountHighlight((current) => (current === 'about' ? null : current))
                  }}
                  onFocus={() => setMobileAccountHighlight('about')}
                  onBlur={() => {
                    setMobileAccountHighlight((current) => (current === 'about' ? null : current))
                  }}
                  style={{
                    backgroundColor: 'transparent',
                    borderRadius: 6,
                    transition: 'box-shadow 0.2s ease'
                  }}
                  styles={{ item: menuHoverStyles }}
                >
                  About
                </Menu.Item>
                {(user.role === 'admin' || user.role === 'moderator') && (
                  <Menu.Item
                    component={Link}
                    href="/admin"
                    leftSection={<Crown size={16} />}
                    onClick={handleMobileMenuClose}
                  >
                    Admin
                  </Menu.Item>
                )}
                <Menu.Divider />
              </>
            ) : (
              <>
                <Menu.Item
                  component={Link}
                  href="/login"
                  onClick={handleMobileMenuClose}
                  onMouseEnter={() => setMobileAccountHighlight('login')}
                  onMouseLeave={() => {
                    setMobileAccountHighlight((current) => (current === 'login' ? null : current))
                  }}
                  onFocus={() => setMobileAccountHighlight('login')}
                  onBlur={() => {
                    setMobileAccountHighlight((current) => (current === 'login' ? null : current))
                  }}
                    style={{
                      backgroundColor: 'transparent',
                      borderRadius: 6,
                      transition: 'box-shadow 0.2s ease'
                    }}
                    styles={{ item: menuHoverStyles }}
                >
                  Login
                </Menu.Item>
                <Menu.Divider />
              </>
            )}

            {/* Browse Section */}
            {navigationData.browse.map((category) => (
              <Box key={category.name}>
                <Menu.Label
                  style={{
                    color: category.color,
                    fontWeight: 'bold',
                    fontSize: '0.9rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}
                >
                  {category.name}
                </Menu.Label>
                {category.items.map((item) => (
                  <Menu.Item
                    key={item.href}
                    component={Link}
                    href={item.href}
                    leftSection={item.icon}
                    onClick={handleMobileMenuClose}
                    style={{
                      paddingLeft: '2rem',
                      borderLeft: isActivePath(item.href) ? '3px solid #e11d48' : '3px solid transparent'
                    }}
                    styles={{ item: menuHoverStyles }}
                  >
                    {item.label}
                  </Menu.Item>
                ))}
              </Box>
            ))}

            <Menu.Divider />

            {/* Community Section */}
            <Menu.Label
              style={{
                color: '#ff7043', // Improved from #ff5722 for 4.6:1 contrast ratio
                fontWeight: 'bold',
                fontSize: '0.9rem',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}
            >
              Community
            </Menu.Label>
            {navigationData.community.map((item) => (
              <Menu.Item
                key={item.href}
                component={Link}
                href={item.href}
                leftSection={item.icon}
                onClick={handleMobileMenuClose}
                style={{
                  paddingLeft: '2rem',
                  borderLeft: isActivePath(item.href) ? '3px solid #e11d48' : '3px solid transparent'
                }}
                styles={{ item: menuHoverStyles }}
              >
                {item.label}
              </Menu.Item>
            ))}

            <Menu.Divider />

            {/* Submit Section */}
            <Menu.Label
              style={{
                color: '#8e24aa', // Improved from #673ab7 for 4.5:1 contrast ratio
                fontWeight: 'bold',
                fontSize: '0.9rem',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}
            >
              Submit
            </Menu.Label>
            {navigationData.submit.map((item) => (
              <Menu.Item
                key={item.href}
                component={Link}
                href={item.href}
                leftSection={item.icon}
                onClick={handleMobileMenuClose}
                style={{
                  paddingLeft: '2rem',
                  borderLeft: isActivePath(item.href) ? '3px solid #e11d48' : '3px solid transparent'
                }}
                styles={{ item: menuHoverStyles }}
              >
                {item.label}
              </Menu.Item>
            ))}

            {/* Logout at bottom */}
            {user && (
              <>
                <Menu.Divider />
                <Menu.Item
                  onClick={handleLogout}
                  leftSection={<LogOut size={16} />}
                  style={{
                    color: getEntityThemeColor(theme, 'gamble'),
                    backgroundColor: 'transparent',
                    borderRadius: 6,
                    transition: 'box-shadow 0.2s ease',
                    boxShadow: getOutlineShadow(false, mobileAccountHighlight === 'logout')
                  }}
                  onMouseEnter={() => setMobileAccountHighlight('logout')}
                  onMouseLeave={() => {
                    setMobileAccountHighlight((current) => (current === 'logout' ? null : current))
                  }}
                  onFocus={() => setMobileAccountHighlight('logout')}
                  onBlur={() => {
                    setMobileAccountHighlight((current) => (current === 'logout' ? null : current))
                  }}
                >
                  Logout
                </Menu.Item>
              </>
            )}
          </Menu.Dropdown>
        </Menu>
      </Group>
    </header>
  )
}

export default Navigation
