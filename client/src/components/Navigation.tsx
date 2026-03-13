'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
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
  Tooltip,
  Kbd,
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
  MessageSquare,
  Activity
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
  const searchInputRef = useRef<HTMLInputElement>(null)

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

  // Handle global keyboard shortcuts
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape' && mobileMenuOpen) {
      setMobileMenuOpen(false)
    }
    // "/" to focus search (when not typing in an input/textarea)
    if (event.key === '/' && !event.ctrlKey && !event.metaKey) {
      const target = event.target as HTMLElement
      const tagName = target.tagName.toLowerCase()
      if (tagName !== 'input' && tagName !== 'textarea' && !target.isContentEditable) {
        event.preventDefault()
        searchInputRef.current?.focus()
      }
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

    // If user has Fluxer avatar
    if (user.fluxerAvatar &&
        (user.profilePictureType === 'fluxer' || !user.profilePictureType)) {
      return user.fluxerAvatar.startsWith('http')
        ? user.fluxerAvatar
        : `https://fluxerusercontent.com/avatars/${user.fluxerId}/${user.fluxerAvatar}.png`
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
      { label: 'Changelog', href: '/changelog', icon: <Activity size={16} /> },
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
      className="nav-header"
      style={{
        height: '60px',
        padding: `0 ${rem(16)}`,
        marginBottom: rem(32),
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        background: 'linear-gradient(180deg, rgba(14,14,16,0.98) 0%, rgba(10,10,12,0.96) 100%)',
        backdropFilter: 'blur(24px) saturate(180%)',
        borderBottom: 'none',
        boxShadow: '0 1px 0 rgba(255,255,255,0.06), 0 0 0 1px rgba(225,29,72,0.08), 0 4px 32px rgba(0,0,0,0.6)'
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
              fontFamily: 'var(--font-opti-goudy-text)',
              transition: 'color 160ms ease, transform 160ms ease',
              display: 'flex',
              alignItems: 'center',
              gap: rem(6)
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
            <span aria-hidden="true" style={{ color: 'var(--usogui-red)', fontSize: '0.75em', lineHeight: 1, display: 'inline-block', transform: 'translateY(-1px)' }}>◆</span>
            <span style={{ letterSpacing: '0.04em' }}>L-File</span>
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
            offset={6}
            opened={browseOpened}
            onOpen={() => setBrowseOpened(true)}
            onClose={() => setBrowseOpened(false)}
            styles={{
              dropdown: {
                backgroundColor: 'rgba(10, 10, 12, 0.97)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderTop: '2px solid rgba(225, 29, 72, 0.3)',
                borderRadius: '6px',
                boxShadow: '0 24px 48px rgba(0,0,0,0.7), 0 0 0 1px rgba(225,29,72,0.06), inset 0 1px 0 rgba(255,255,255,0.04)',
                minWidth: 'unset',
                width: 'auto',
                padding: rem(6),
                backdropFilter: 'blur(24px) saturate(160%)'
              }
            }}
          >
              <Menu.Target>
                <Button
                  variant="transparent"
                  className={`nav-trigger${browseOpened ? ' nav-trigger--active' : ''}`}
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
                    backgroundColor: browseOpened ? 'rgba(225, 29, 72, 0.07)' : 'transparent',
                    color: browseOpened ? accentColor : 'rgba(255, 255, 255, 0.88)',
                    fontWeight: 500,
                    fontSize: rem(13),
                    textTransform: 'uppercase',
                    letterSpacing: '0.10em',
                    padding: '0 8px',
                    height: '36px',
                    borderRadius: '4px'
                  }}
                  styles={{
                    root: {
                      '&:hover': { backgroundColor: 'rgba(225, 29, 72, 0.05)', color: accentColor },
                      '&:active': { backgroundColor: 'transparent' }
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
                      fontFamily: 'var(--font-noto-sans)',
                      fontWeight: 600,
                      fontSize: '10px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.12em',
                      marginTop: rem(8),
                      marginBottom: rem(2),
                      paddingTop: rem(5),
                      paddingBottom: rem(5),
                      paddingLeft: rem(12),
                      paddingRight: rem(8),
                      borderLeft: '3px solid currentColor',
                      borderRadius: '0 3px 3px 0',
                      backgroundColor: `${category.color}14`
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
                        boxShadow: isActivePath(item.href) ? 'inset 3px 0 8px rgba(225,29,72,0.15)' : 'none',
                        borderRadius: theme.radius.sm,
                        paddingLeft: theme.spacing.md,
                        color: isActivePath(item.href) ? accentColor : theme.colors.gray[0],
                        backgroundColor: 'transparent',
                        transition: 'background-color 150ms ease, color 150ms ease'
                      }}
                      styles={{
                        itemLabel: {
                          fontSize: theme.fontSizes.sm,
                          fontWeight: isActivePath(item.href) ? 500 : 400,
                          whiteSpace: 'nowrap'
                        },
                        item: {
                          transition: 'background-color 150ms ease, color 150ms ease',
                          '&:hover': {
                            backgroundColor: `${category.color}20`,
                            color: 'rgba(255, 255, 255, 0.98)',
                            boxShadow: 'none'
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
            offset={6}
            opened={communityOpened}
            onOpen={() => setCommunityOpened(true)}
            onClose={() => setCommunityOpened(false)}
            styles={{
              dropdown: {
                backgroundColor: 'rgba(10, 10, 12, 0.97)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderTop: '2px solid rgba(225, 29, 72, 0.4)',
                borderRadius: '6px',
                boxShadow: '0 24px 48px rgba(0,0,0,0.7), 0 0 0 1px rgba(225,29,72,0.06), inset 0 1px 0 rgba(255,255,255,0.04)',
                minWidth: 'unset',
                width: 'auto',
                padding: rem(6),
                backdropFilter: 'blur(24px) saturate(160%)'
              }
            }}
          >
              <Menu.Target>
                <Button
                  variant="transparent"
                  className={`nav-trigger${communityOpened ? ' nav-trigger--active' : ''}`}
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
                    backgroundColor: communityOpened ? 'rgba(225, 29, 72, 0.07)' : 'transparent',
                    color: communityOpened ? accentColor : 'rgba(255, 255, 255, 0.88)',
                    fontWeight: 500,
                    fontSize: rem(13),
                    textTransform: 'uppercase',
                    letterSpacing: '0.10em',
                    padding: '0 8px',
                    height: '36px',
                    borderRadius: '4px'
                  }}
                  styles={{
                    root: {
                      '&:hover': { backgroundColor: 'rgba(225, 29, 72, 0.05)', color: accentColor },
                      '&:active': { backgroundColor: 'transparent' }
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
                    transition: 'background-color 150ms ease, color 150ms ease'
                  }}
                  styles={{
                    itemLabel: {
                      fontSize: theme.fontSizes.sm,
                      fontWeight: isActivePath(item.href) ? 500 : 400,
                      whiteSpace: 'nowrap'
                    },
                    item: {
                      transition: 'background-color 150ms ease, color 150ms ease',
                      '&:hover': {
                        backgroundColor: 'rgba(225, 29, 72, 0.08)',
                        color: 'rgba(255, 255, 255, 0.95)',
                        boxShadow: 'none'
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
            offset={6}
            opened={submitOpened}
            onOpen={() => setSubmitOpened(true)}
            onClose={() => setSubmitOpened(false)}
            styles={{
              dropdown: {
                backgroundColor: 'rgba(10, 10, 12, 0.97)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderTop: '2px solid rgba(225, 29, 72, 0.4)',
                borderRadius: '6px',
                boxShadow: '0 24px 48px rgba(0,0,0,0.7), 0 0 0 1px rgba(225,29,72,0.06), inset 0 1px 0 rgba(255,255,255,0.04)',
                minWidth: 'unset',
                width: 'auto',
                padding: rem(6),
                backdropFilter: 'blur(24px) saturate(160%)'
              }
            }}
          >
              <Menu.Target>
                <Button
                  variant="transparent"
                  className={`nav-trigger${submitOpened ? ' nav-trigger--active' : ''}`}
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
                    backgroundColor: submitOpened ? 'rgba(225, 29, 72, 0.07)' : 'transparent',
                    color: submitOpened ? accentColor : 'rgba(255, 255, 255, 0.88)',
                    fontWeight: 500,
                    fontSize: rem(13),
                    textTransform: 'uppercase',
                    letterSpacing: '0.10em',
                    padding: '0 8px',
                    height: '36px',
                    borderRadius: '4px'
                  }}
                  styles={{
                    root: {
                      '&:hover': { backgroundColor: 'rgba(225, 29, 72, 0.05)', color: accentColor },
                      '&:active': { backgroundColor: 'transparent' }
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
                    transition: 'background-color 150ms ease, color 150ms ease'
                  }}
                  styles={{
                    itemLabel: {
                      fontSize: theme.fontSizes.sm,
                      fontWeight: isActivePath(item.href) ? 500 : 400,
                      whiteSpace: 'nowrap'
                    },
                    item: {
                      transition: 'background-color 150ms ease, color 150ms ease',
                      '&:hover': {
                        backgroundColor: 'rgba(225, 29, 72, 0.08)',
                        color: 'rgba(255, 255, 255, 0.95)',
                        boxShadow: 'none'
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
              className="nav-search-box"
              onSubmit={handleSearchSubmit}
              style={{
                position: 'relative',
                borderRadius: rem(4),
                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                transition: 'width 0.2s, border-color 200ms ease, box-shadow 200ms ease',
                width: searchFocused ? '280px' : '180px',
              }}
            >
              <TextInput
                ref={searchInputRef}
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
                rightSection={
                  !searchFocused ? (
                    <Tooltip label="Press / to search" position="left" withArrow>
                      <Kbd size="xs" style={{ opacity: 0.55, cursor: 'default', pointerEvents: 'none' }}>/</Kbd>
                    </Tooltip>
                  ) : null
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
                    borderRadius: '6px',
                    backgroundColor: 'rgba(10, 10, 12, 0.97)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderTop: '2px solid rgba(225, 29, 72, 0.35)',
                    backdropFilter: 'blur(24px) saturate(160%)',
                    boxShadow: '0 24px 48px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.04)'
                  }}
                >
                  {searchResults.length > 0 ? (
                    searchResults.slice(0, 8).map((result, index) => (
                      <div
                        key={`${result.type}-${result.id}`}
                        className="search-result-item"
                        onClick={() => handleSearchResultClick(result)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '12px 16px',
                          borderBottom: index === Math.min(searchResults.length, 8) - 1
                            ? 'none'
                            : '1px solid rgba(255, 255, 255, 0.04)',
                          color: '#ffffff',
                          backgroundColor: 'transparent',
                          cursor: 'pointer'
                        }}
                      >
                        <Box style={{ display: 'flex', alignItems: 'center', marginRight: '16px' }}>
                          <Box style={{ color: getTypeColor(result.type), opacity: 0.75 }}>
                            {getTypeIcon(result.type)}
                          </Box>
                        </Box>
                        <Box style={{ flex: 1 }}>
                          <Box style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <Box style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', flex: 1 }}>
                              <Text style={{ color: '#ffffff', fontWeight: 500, letterSpacing: '0.01em' }}>
                                {result.title}
                              </Text>
                              {result.type === 'character' && result.metadata && Array.isArray((result.metadata as Record<string, unknown>).alternateNames) && ((result.metadata as Record<string, unknown>).alternateNames as string[]).length > 0 && (
                                <Text
                                  size="xs"
                                  style={{
                                    color: 'rgba(255, 255, 255, 0.75)',
                                    fontStyle: 'italic',
                                    letterSpacing: '0.01em'
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
                                  backgroundColor: `${getTypeColor(result.type)}22`,
                                  color: getTypeColor(result.type),
                                  border: `1px solid ${getTypeColor(result.type)}44`,
                                  fontSize: '10px',
                                  letterSpacing: '0.08em',
                                  textTransform: 'uppercase'
                                }}
                              >
                                {result.type}
                              </Badge>
                              {result.hasSpoilers && (
                                <Badge
                                  size="sm"
                                  style={{
                                    backgroundColor: 'rgba(245, 124, 0, 0.15)',
                                    color: '#f57c00',
                                    border: '1px solid rgba(245, 124, 0, 0.3)',
                                    fontSize: '10px',
                                    letterSpacing: '0.08em'
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
                    <Box style={{ padding: '20px 16px', textAlign: 'center' }}>
                      <Text style={{
                        color: 'rgba(255, 255, 255, 0.45)',
                        fontFamily: 'var(--font-opti-goudy-text)',
                        fontSize: '13px',
                        fontStyle: 'italic'
                      }}>
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
                offset={6}
                styles={{
                  dropdown: {
                    backgroundColor: 'rgba(10, 10, 12, 0.97)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderTop: '2px solid rgba(225, 29, 72, 0.4)',
                    borderRadius: '6px',
                    boxShadow: '0 24px 48px rgba(0,0,0,0.7), 0 0 0 1px rgba(225,29,72,0.06), inset 0 1px 0 rgba(255,255,255,0.04)',
                    minWidth: '180px',
                    width: 'auto',
                    padding: 0,
                    overflow: 'hidden',
                    backdropFilter: 'blur(24px) saturate(160%)'
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
                    onMouseEnter={(e) => {
                      const avatar = e.currentTarget.querySelector('[data-avatar]') as HTMLElement
                      if (avatar) {
                        avatar.style.borderColor = 'rgba(225, 29, 72, 0.8)'
                        avatar.style.boxShadow = '0 0 0 3px rgba(225, 29, 72, 0.12)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      const avatar = e.currentTarget.querySelector('[data-avatar]') as HTMLElement
                      if (avatar) {
                        avatar.style.borderColor = 'rgba(225, 29, 72, 0.4)'
                        avatar.style.boxShadow = 'none'
                      }
                    }}
                  >
                  <Avatar
                    src={avatarSrc || undefined}
                    size={32}
                    alt={user.username}
                    data-avatar
                    style={{
                      border: '2px solid rgba(225, 29, 72, 0.4)',
                      transition: 'border-color 200ms ease, box-shadow 200ms ease',
                      borderRadius: '50%'
                    }}
                  >
                    {!avatarSrc && user.username[0].toUpperCase()}
                  </Avatar>
                </ActionIcon>
              </Menu.Target>

              <Menu.Dropdown>
                {/* User identity header */}
                <Box
                  style={{
                    padding: `${rem(12)} ${rem(14)} ${rem(10)}`,
                    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                    background: 'rgba(255, 255, 255, 0.03)',
                    marginBottom: rem(4)
                  }}
                >
                  <Group gap="xs" wrap="nowrap">
                    <Avatar
                      src={avatarSrc || undefined}
                      size={28}
                      style={{ border: '1px solid rgba(225, 29, 72, 0.3)', flexShrink: 0 }}
                    >
                      {!avatarSrc && user.username[0].toUpperCase()}
                    </Avatar>
                    <Box style={{ minWidth: 0 }}>
                      <Text
                        size="sm"
                        fw={600}
                        style={{
                          color: '#ffffff',
                          lineHeight: 1.2,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {user.username}
                      </Text>
                      <Text
                        style={{
                          fontSize: '10px',
                          letterSpacing: '0.12em',
                          textTransform: 'uppercase',
                          color: 'rgba(225, 29, 72, 0.85)',
                          lineHeight: 1.2,
                          fontWeight: 600
                        }}
                      >
                        {user.customRole || user.role || 'operative'}
                      </Text>
                    </Box>
                  </Group>
                </Box>
                <Box style={{ padding: rem(4) }}>
                <Menu.Item
                  component={Link}
                  href="/profile"
                  leftSection={<User size={15} />}
                  style={{
                    backgroundColor: 'transparent',
                    borderRadius: 6,
                    color: isActivePath('/profile') ? accentColor : theme.colors.gray[0],
                    borderLeft: isActivePath('/profile') ? `3px solid ${accentColor}` : '3px solid transparent',
                    boxShadow: isActivePath('/profile') ? 'inset 3px 0 8px rgba(225,29,72,0.15)' : 'none',
                    transition: 'background-color 150ms ease, color 150ms ease',
                    paddingTop: rem(6),
                    paddingBottom: rem(6)
                  }}
                  styles={{
                    item: {
                      '&:hover': {
                        backgroundColor: 'rgba(225, 29, 72, 0.08)',
                        color: '#ffffff'
                      }
                    }
                  }}
                >
                  Profile
                </Menu.Item>
                <Menu.Item
                  component={Link}
                  href="/about"
                  leftSection={<Info size={15} />}
                  style={{
                    backgroundColor: 'transparent',
                    borderRadius: 6,
                    color: isActivePath('/about') ? accentColor : theme.colors.gray[0],
                    borderLeft: isActivePath('/about') ? `3px solid ${accentColor}` : '3px solid transparent',
                    boxShadow: isActivePath('/about') ? 'inset 3px 0 8px rgba(225,29,72,0.15)' : 'none',
                    transition: 'background-color 150ms ease, color 150ms ease',
                    paddingTop: rem(6),
                    paddingBottom: rem(6)
                  }}
                  styles={{
                    item: {
                      '&:hover': {
                        backgroundColor: 'rgba(225, 29, 72, 0.08)',
                        color: '#ffffff'
                      }
                    }
                  }}
                >
                  About
                </Menu.Item>
                <Menu.Divider style={{ margin: `${rem(4)} 0` }} />
                <Menu.Item
                  onClick={handleLogout}
                  leftSection={<LogOut size={15} />}
                  style={{
                    color: getEntityThemeColor(theme, 'gamble'),
                    backgroundColor: 'transparent',
                    borderRadius: 6,
                    borderLeft: '3px solid transparent',
                    transition: 'background-color 150ms ease, border-color 150ms ease',
                    paddingTop: rem(6),
                    paddingBottom: rem(6)
                  }}
                  styles={{
                    item: {
                      '&:hover': {
                        backgroundColor: 'rgba(255, 85, 85, 0.08)',
                        borderLeft: '3px solid rgba(255, 85, 85, 0.4)',
                        color: getEntityThemeColor(theme, 'gamble')
                      }
                    }
                  }}
                >
                  Logout
                </Menu.Item>
                </Box>
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
              overflowY: 'auto',
              borderTop: '2px solid rgba(225, 29, 72, 0.35)',
              borderLeft: 'none',
              borderRight: 'none',
              borderBottom: '1px solid rgba(225, 29, 72, 0.15)'
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
              <Box
                component="form"
                className="nav-search-box"
                onSubmit={handleSearchSubmit}
                style={{
                  borderRadius: rem(6),
                  backgroundColor: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  transition: 'border-color 200ms ease, box-shadow 200ms ease'
                }}
              >
                <TextInput
                  placeholder="Search (2+ chars)..."
                  aria-label="Search characters, arcs, gambles, and more"
                  value={searchValue}
                  onChange={(e) => handleSearchChange(e)}
                  leftSection={searchLoading ? <Loader size={18} /> : <Search size={18} />}
                  styles={{
                    input: {
                      backgroundColor: 'transparent',
                      border: 'none',
                      color: 'white',
                      '&:focus': { backgroundColor: 'transparent', borderColor: 'transparent' }
                    }
                  }}
                />
              </Box>
            </Box>
            <Menu.Divider />

            {/* User Section */}
            {user ? (
              <>
                <Menu.Label
                  style={{
                    fontFamily: 'var(--font-noto-sans)',
                    fontWeight: 600,
                    fontSize: '10px',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: 'rgba(255, 255, 255, 0.4)',
                    paddingLeft: rem(12),
                    borderLeft: '2px solid rgba(255, 255, 255, 0.15)'
                  }}
                >
                  Account
                </Menu.Label>
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
                  Profile
                </Menu.Item>
                <Menu.Item
                  component={Link}
                  href="/changelog"
                  leftSection={<Activity size={16} />}
                  onClick={handleMobileMenuClose}
                  onMouseEnter={() => setMobileAccountHighlight('changelog')}
                  onMouseLeave={() => {
                    setMobileAccountHighlight((current) => (current === 'changelog' ? null : current))
                  }}
                  onFocus={() => setMobileAccountHighlight('changelog')}
                  onBlur={() => {
                    setMobileAccountHighlight((current) => (current === 'changelog' ? null : current))
                  }}
                  style={{
                    backgroundColor: 'transparent',
                    borderRadius: 6,
                    transition: 'box-shadow 0.2s ease'
                  }}
                  styles={{ item: menuHoverStyles }}
                >
                  Changelog
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
                    fontFamily: 'var(--font-noto-sans)',
                    fontWeight: 600,
                    fontSize: '10px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                    paddingLeft: rem(12),
                    paddingTop: rem(5),
                    paddingBottom: rem(5),
                    borderLeft: '3px solid currentColor',
                    borderRadius: '0 3px 3px 0',
                    backgroundColor: `${category.color}14`
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
                      paddingLeft: rem(20),
                      borderLeft: isActivePath(item.href) ? '3px solid #e11d48' : '3px solid transparent',
                      boxShadow: isActivePath(item.href) ? 'inset 3px 0 8px rgba(225,29,72,0.15)' : 'none'
                    }}
                    styles={{ item: menuHoverStyles }}
                  >
                    {item.label}
                  </Menu.Item>
                ))}
              </Box>
            ))}

            <Box style={{ margin: '4px 0' }}><Menu.Divider /></Box>

            {/* Community Section */}
            <Menu.Label
              style={{
                color: 'rgba(225, 29, 72, 0.85)',
                fontFamily: 'var(--font-noto-sans)',
                fontWeight: 600,
                fontSize: '10px',
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                paddingLeft: rem(12),
                paddingTop: rem(5),
                paddingBottom: rem(5),
                borderLeft: '3px solid currentColor',
                borderRadius: '0 3px 3px 0',
                backgroundColor: 'rgba(225, 29, 72, 0.08)'
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
                  paddingLeft: rem(20),
                  borderLeft: isActivePath(item.href) ? '3px solid #e11d48' : '3px solid transparent',
                  boxShadow: isActivePath(item.href) ? 'inset 3px 0 8px rgba(225,29,72,0.15)' : 'none'
                }}
                styles={{ item: menuHoverStyles }}
              >
                {item.label}
              </Menu.Item>
            ))}

            <Box style={{ margin: '4px 0' }}><Menu.Divider /></Box>

            {/* Submit Section */}
            <Menu.Label
              style={{
                color: '#7c3aed',
                fontFamily: 'var(--font-noto-sans)',
                fontWeight: 600,
                fontSize: '10px',
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                paddingLeft: rem(12),
                paddingTop: rem(5),
                paddingBottom: rem(5),
                borderLeft: '3px solid currentColor',
                borderRadius: '0 3px 3px 0',
                backgroundColor: 'rgba(124, 58, 237, 0.08)'
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
                  paddingLeft: rem(20),
                  borderLeft: isActivePath(item.href) ? '3px solid #e11d48' : '3px solid transparent',
                  boxShadow: isActivePath(item.href) ? 'inset 3px 0 8px rgba(225,29,72,0.15)' : 'none'
                }}
                styles={{ item: menuHoverStyles }}
              >
                {item.label}
              </Menu.Item>
            ))}

            {/* Logout at bottom */}
            {user && (
              <>
                <Box style={{ margin: '4px 0' }}><Menu.Divider /></Box>
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
