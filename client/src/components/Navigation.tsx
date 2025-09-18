'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'
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
  rem
} from '@mantine/core'
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
import { NavigationData, getCategoryColor } from '../types/navigation'

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
  const { userProgress } = useProgress()
  const router = useRouter()
  const pathname = usePathname()
  // Mobile menu open state (controlled Menu)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
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

  const trimmedSearchValue = searchValue.trim()
  const shouldShowSearchDropdown = searchFocused && (showSearchResults || trimmedSearchValue.length < 2)

  const handleMobileMenuClose = () => setMobileMenuOpen(false)

  const handleLogout = async () => {
    await logout()
    handleMobileMenuClose()
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
    if (trimmedSearchValue) {
      setShowSearchResults(false)
      setSearchValue('')
      setSearchFocused(false)
      router.push(`/search?q=${encodeURIComponent(trimmedSearchValue)}`)
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

  return (
    <header
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
              color: 'inherit',
              fontWeight: 'bold',
              cursor: 'pointer',
              marginRight: rem(24)
            }}
            onMouseEnter={(e) => (e.target as HTMLElement).style.opacity = '0.8'}
            onMouseLeave={(e) => (e.target as HTMLElement).style.opacity = '1'}
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
          <DropdownButton
            label="Browse"
            state={dropdowns.browse[0]}
            handlers={dropdowns.browse[1]}
            items={navigationData.browse}
            isActivePath={isActivePath}
            isCategorized={true}
          />

          {/* Community Dropdown */}
          <DropdownButton
            label="Community"
            state={dropdowns.community[0]}
            handlers={dropdowns.community[1]}
            items={navigationData.community}
            isActivePath={isActivePath}
            isCategorized={false}
          />

          {/* Submit Dropdown */}
          <DropdownButton
            label="Submit"
            state={dropdowns.submit[0]}
            handlers={dropdowns.submit[1]}
            items={navigationData.submit}
            isActivePath={isActivePath}
            isCategorized={false}
          />
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
                placeholder="Search..."
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
                      color: 'rgba(255, 255, 255, 0.7)',
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
                              {result.type === 'character' && result.metadata?.alternateNames?.length > 0 && (
                                <Text
                                  size="xs"
                                  style={{
                                    color: 'rgba(255, 255, 255, 0.45)',
                                    fontStyle: 'italic'
                                  }}
                                >
                                  {result.metadata.alternateNames.join(', ')}
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
                      <Text style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                        {trimmedSearchValue.length < 2
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
                  color="red"
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
                position="bottom-end"
                withArrow
                arrowPosition="center"
                offset={4}
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
                >
                  Profile
                </Menu.Item>
                <Menu.Item
                  component={Link}
                  href="/about"
                  leftSection={<Heart size={16} />}
                >
                  Donate
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item
                  onClick={handleLogout}
                  leftSection={<LogOut size={16} />}
                  color="red"
                >
                  Logout
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
            </>
          ) : (
            <Button component={Link} href="/login" variant="subtle" color="white">
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
          withinPortal={false}
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

          <Menu.Dropdown className="md:hidden">
            {/* Mobile Search */}
            <Box p="md" pb="sm">
              <form onSubmit={handleSearchSubmit}>
                <TextInput
                  placeholder="Search..."
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
                >
                  Profile
                </Menu.Item>
                <Menu.Item
                  component={Link}
                  href="/about"
                  leftSection={<Heart size={16} />}
                  onClick={handleMobileMenuClose}
                >
                  Donate
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
                color: '#ff5722',
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
              >
                {item.label}
              </Menu.Item>
            ))}

            <Menu.Divider />

            {/* Submit Section */}
            <Menu.Label
              style={{
                color: '#673ab7',
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
                  color="red"
                >
                  Logout
                </Menu.Item>
              </>
            )}
          </Menu.Dropdown>
        </Menu>
      </Group>
        {/* Click outside handler for dropdowns */}
        {anyDropdownOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 30
          }}
          onClick={() => {
            dropdowns.browse[1].onClose()
            dropdowns.community[1].onClose()
            dropdowns.submit[1].onClose()
          }}
        />
      )}
    </header>
  )
}

export default Navigation
