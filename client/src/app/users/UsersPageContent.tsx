'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Alert,
  Badge,
  Box,
  Card,
  Container,
  Group,
  Loader,
  SimpleGrid,
  Stack,
  Text,
  rem,
  useMantineTheme
} from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'
import {
  backgroundStyles,
  getCardStyles
} from '../../lib/mantine-theme'
import { ListPageHero } from '../../components/layouts/ListPageHero'
import { Users as UsersIcon } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { api } from '../../lib/api'
import { usePaged } from '../../hooks/usePagedCache'
import { pagedCacheConfig } from '../../config/pagedCacheConfig'
import { motion } from 'motion/react'
import { pageEnter } from '../../lib/motion-presets'
import UserProfileImage from '../../components/UserProfileImage'
import UserBadges from '../../components/UserBadges'
import { UserRoleDisplay } from '../../components/BadgeDisplay'
import { CardGridSkeleton } from '../../components/CardGridSkeleton'
import { PaginationBar } from '../../components/layouts/PaginationBar'
import { EmptyState, SearchEmptyState } from '../../components/EmptyState'
import { SearchToolbar } from '../../components/layouts/SearchToolbar'

interface PublicUser {
  id: number
  username: string
  role: string
  customRole?: string | null
  profilePictureType?: 'fluxer' | 'character_media' | 'exclusive_artwork' | null
  selectedCharacterMediaId?: number | null
  selectedCharacterMedia?: {
    id: number
    url: string
    fileName?: string
    description?: string
    ownerType?: string
    ownerId?: number
  } | null
  fluxerId?: string | null
  fluxerAvatar?: string | null
  createdAt: string
  userProgress?: number
}

const RESULTS_PER_PAGE = 12

type SortOption = 'username' | 'newest'

export default function UsersPageContent() {
  const theme = useMantineTheme()
  const router = useRouter()
  const searchParams = useSearchParams()
  const accentCommunity = theme.other?.usogui?.organization ?? theme.colors.purple?.[6] ?? '#7c3aed'

  // Initialize from URL params
  const initialSearch = searchParams.get('search') || ''
  const initialPage = parseInt(searchParams.get('page') || '1', 10)
  const initialSort = (searchParams.get('sort') as SortOption) || 'newest'

  const [users, setUsers] = useState<PublicUser[]>([])
  const [searchInput, setSearchInput] = useState(initialSearch)
  const [debouncedSearch] = useDebouncedValue(searchInput, 300)
  const [searchQuery, setSearchQuery] = useState(initialSearch)
  const [sortBy, setSortBy] = useState<SortOption>(initialSort)
  const [page, setPage] = useState(initialPage)
  const [totalPages, setTotalPages] = useState(0)
  const [total, setTotal] = useState(0)

  const fetcher = useCallback(async (p: number) => {
    const params: Record<string, string | number> = { page: p, limit: RESULTS_PER_PAGE }
    if (searchQuery) params.username = searchQuery
    const resAny = await api.getPublicUsers(params)

    return {
      data: resAny.data || [],
      total: resAny.total || 0,
      page: resAny.page || p,
      perPage: RESULTS_PER_PAGE,
      totalPages: resAny.totalPages || Math.max(1, Math.ceil((resAny.total || 0) / RESULTS_PER_PAGE))
    }
  }, [searchQuery])

  const { data: pageData, loading: pageLoading, error: pageError } = usePaged<PublicUser>(
    'users',
    page,
    fetcher,
    searchQuery ? { username: searchQuery } : {},
    {
      ttlMs: pagedCacheConfig.lists.users.ttlMs,
      persist: pagedCacheConfig.defaults.persist,
      maxEntries: pagedCacheConfig.lists.users.maxEntries
    }
  )

  // Update URL when search, sort, or page changes
  const updateURL = useCallback((newSearch: string, newPage: number, newSort: SortOption) => {
    const params = new URLSearchParams()
    if (newSearch) params.set('search', newSearch)
    if (newPage > 1) params.set('page', newPage.toString())
    if (newSort !== 'newest') params.set('sort', newSort)

    const url = params.toString() ? `/users?${params.toString()}` : '/users'
    router.push(url, { scroll: false })
  }, [router])

  useEffect(() => {
    if (pageData) {
      setUsers(pageData.data || [])
      setTotalPages(pageData.totalPages || 0)
      setTotal(pageData.total || 0)
    }
  }, [pageData])

  useEffect(() => {
    // Skip if input was cleared but debounce hasn't caught up yet
    if (searchInput.trim() === '' && debouncedSearch.trim() !== '') {
      return
    }
    const normalized = debouncedSearch.trim()
    if (searchQuery === normalized) {
      return
    }

    setSearchQuery(normalized)
    setPage(1)
    updateURL(normalized, 1, sortBy)
  }, [debouncedSearch, searchInput, searchQuery, sortBy, updateURL])

  const sortedUsers = useMemo(() => {
    const usersCopy = [...users]

    switch (sortBy) {
      case 'username':
        return usersCopy.sort((a, b) => a.username.localeCompare(b.username))
      case 'newest':
        return usersCopy.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      default:
        return usersCopy
    }
  }, [users, sortBy])

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    setSearchInput(value)

    // Immediately clear search when input is emptied (bypass debounce)
    if (value.trim() === '' && searchQuery !== '') {
      setSearchQuery('')
      setPage(1)
      updateURL('', 1, sortBy)
    }
  }

  const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      const value = searchInput.trim()
      if (value !== searchQuery) {
        setSearchQuery(value)
        setPage(1)
        updateURL(value, 1, sortBy)
      }
    }
  }

  const handleClearSearch = useCallback(() => {
    setSearchInput('')
    setSearchQuery('')
    setPage(1)
    updateURL('', 1, sortBy)
  }, [sortBy, updateURL])

  const handlePageChange = (value: number) => {
    setPage(value)
    updateURL(searchQuery, value, sortBy)
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleSortChange = (value: string | null) => {
    const newSort = (value as SortOption) || 'newest'
    setSortBy(newSort)
    setPage(1)
    updateURL(searchQuery, 1, newSort)
  }

  const errorMessage = pageError
    ? pageError instanceof Error
      ? pageError.message
      : String(pageError)
    : ''

  const hasSearch = searchQuery.length > 0
  const isLoading = pageLoading && users.length === 0
  const isRefreshing = pageLoading && users.length > 0

  return (
    <Box style={{ backgroundColor: backgroundStyles.page(theme), minHeight: '100vh' }}>
      <motion.div {...pageEnter}>
        <Box style={{ maxWidth: '75em', margin: '0 auto' }}>
        <ListPageHero
          icon={<UsersIcon size={26} color="#ffffff" />}
          title="Community Hub"
          subtitle="Discover fellow readers, track progress, and celebrate community contributions."
          entityType="organization"
          count={total}
          countLabel={`member${total === 1 ? '' : 's'}`}
          hasActiveSearch={hasSearch}
        />

        <SearchToolbar
          searchPlaceholder="Search by username..."
          searchInput={searchInput}
          onSearchChange={handleSearch}
          onClearSearch={handleClearSearch}
          onSearchKeyDown={handleSearchKeyDown}
          hasActiveFilters={hasSearch}
          sortOptions={[
            { value: 'newest', label: 'Newest Members' },
            { value: 'username', label: 'Username (A-Z)' },
          ]}
          sortValue={sortBy}
          onSortChange={handleSortChange}
          accentColor={accentCommunity}
        />

        {errorMessage && (
          <Container size="lg" px="md" pb="xl">
            <Alert
              color={accentCommunity}
              variant="light"
              radius="lg"
              title="Unable to load community members"
            >
              {errorMessage}
            </Alert>
          </Container>
        )}

        {!errorMessage && (
          <Container size="lg" px="md" pb="xl">
            {isLoading ? (
              <CardGridSkeleton count={12} cardWidth={280} cardHeight={220} accentColor={accentCommunity} />
            ) : (
              <>
                {users.length === 0 ? (
                  hasSearch ? (
                    <SearchEmptyState
                      query={searchInput}
                      onClearSearch={handleClearSearch}
                      accentColor={accentCommunity}
                    />
                  ) : (
                    <EmptyState
                      title="No community members yet"
                      description="Be the first to join the community."
                      accentColor={accentCommunity}
                    />
                  )
                ) : (
                  <Stack gap="md">
                    {isRefreshing && (
                      <Group gap={6} justify="flex-end">
                        <Loader size="xs" color={accentCommunity} />
                        <Text size="xs" c="dimmed">Updating…</Text>
                      </Group>
                    )}

                    <SimpleGrid cols={{ base: 1, xs: 2, sm: 2, md: 3, lg: 4, xl: 4 }} spacing={rem(20)}>
                      {sortedUsers.map((user, index) => (
                          <motion.div
                            key={user.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.02 }}
                            whileHover={{ y: -3, transition: { duration: 0.15 } }}
                          >
                            <Card
                              component={Link}
                              href={`/users/${user.id}`}
                              shadow="sm"
                              radius="md"
                              withBorder
                              padding={0}
                              style={{
                                ...getCardStyles(theme, accentCommunity),
                                display: 'flex',
                                flexDirection: 'column',
                                overflow: 'hidden',
                                height: '100%',
                                minHeight: rem(220),
                                position: 'relative',
                                textDecoration: 'none',
                                cursor: 'pointer',
                              }}
                            >
                              {/* Accent strip */}
                              <Box
                                style={{
                                  height: 4,
                                  background: accentCommunity,
                                  width: '100%',
                                }}
                              />

                              {/* Role chip */}
                              {(user.role === 'admin' || user.role === 'moderator' || user.role === 'editor') && (
                                <Badge
                                  size="xs"
                                  style={{
                                    position: 'absolute',
                                    top: rem(14),
                                    right: rem(10),
                                    zIndex: 10,
                                    backgroundColor: user.role === 'admin'
                                      ? 'rgba(225,29,72,0.15)'
                                      : user.role === 'moderator'
                                      ? 'rgba(77,171,247,0.12)'
                                      : 'rgba(59,130,246,0.12)',
                                    border: user.role === 'admin'
                                      ? '1px solid rgba(225,29,72,0.4)'
                                      : user.role === 'moderator'
                                      ? '1px solid rgba(77,171,247,0.35)'
                                      : '1px solid rgba(59,130,246,0.35)',
                                    color: user.role === 'admin' ? '#e11d48' : user.role === 'moderator' ? '#4dabf7' : '#3b82f6',
                                  }}
                                >
                                  {user.role === 'admin' ? 'Admin' : user.role === 'moderator' ? 'Mod' : 'Editor'}
                                </Badge>
                              )}

                              {/* Inner content */}
                              <Box p="md" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                <Stack gap="xs" align="center" style={{ height: '100%' }}>
                                  <Box style={{ boxShadow: '0 0 0 3px rgba(168,85,247,0.2)', borderRadius: '50%', overflow: 'hidden' }}>
                                    <UserProfileImage
                                      user={user}
                                      size={72}
                                      showFallback
                                      className="user-profile-avatar"
                                    />
                                  </Box>

                                  <Text
                                    fw={700}
                                    c={accentCommunity}
                                    ta="center"
                                    size="sm"
                                    lineClamp={1}
                                    title={user.username}
                                  >
                                    {user.username}
                                  </Text>

                                  <UserRoleDisplay
                                    userRole={user.role as 'admin' | 'moderator' | 'editor' | 'user'}
                                    customRole={user.customRole}
                                    size="small"
                                    spacing={0.5}
                                  />

                                  <UserBadges userId={user.id} size="sm" maxDisplay={3} />

                                  <Text
                                    mt="auto"
                                    ta="center"
                                    style={{
                                      background: 'rgba(168,85,247,0.1)',
                                      border: '1px solid rgba(168,85,247,0.3)',
                                      color: accentCommunity,
                                      borderRadius: rem(20),
                                      padding: '3px 12px',
                                      fontFamily: 'monospace',
                                      fontSize: rem(11),
                                    }}
                                  >
                                    Ch. {user.userProgress ?? 0}
                                  </Text>
                                </Stack>
                              </Box>
                            </Card>
                          </motion.div>
                      ))}
                    </SimpleGrid>

                    <PaginationBar
                      currentPage={page}
                      totalPages={totalPages}
                      total={total}
                      pageSize={RESULTS_PER_PAGE}
                      onPageChange={handlePageChange}
                      entityType="organization"
                      entityName="members"
                    />
                  </Stack>
                )}
              </>
            )}
          </Container>
        )}
        </Box>
      </motion.div>
    </Box>
  )
}
