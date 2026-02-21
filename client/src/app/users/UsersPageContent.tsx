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
  Pagination,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
  rem,
  useMantineTheme,
  Select,
  ActionIcon,
  Tooltip
} from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'
import {
  backgroundStyles,
  getHeroStyles,
  getCardStyles
} from '../../lib/mantine-theme'
import { Search, Users as UsersIcon, ArrowUpDown, X } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { api } from '../../lib/api'
import { usePaged } from '../../hooks/usePagedCache'
import { pagedCacheConfig } from '../../config/pagedCacheConfig'
import { motion } from 'motion/react'
import UserProfileImage from '../../components/UserProfileImage'
import UserBadges from '../../components/UserBadges'
import { UserRoleDisplay } from '../../components/BadgeDisplay'
import { CardGridSkeleton } from '../../components/CardGridSkeleton'

interface PublicUser {
  id: number
  username: string
  role: string
  customRole?: string | null
  profilePictureType?: 'fluxer' | 'character_media' | null
  selectedCharacterMediaId?: number | null
  selectedCharacterMedia?: {
    id: number
    url: string
    fileName?: string
    description?: string
    ownerType?: string
    ownerId?: number
  } | null
  discordId?: string | null
  discordAvatar?: string | null
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

  const rangeStart = (page - 1) * RESULTS_PER_PAGE + (users.length > 0 ? 1 : 0)
  const rangeEnd = rangeStart + users.length - 1

  return (
    <Box style={{ backgroundColor: backgroundStyles.page(theme), minHeight: '100vh' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box p="md" style={getHeroStyles(theme, accentCommunity)}>
          <Stack align="center" gap="sm">
            <Box
              style={{
                background: `linear-gradient(135deg, ${accentCommunity}, ${accentCommunity}CC)`,
                borderRadius: '50%',
                width: rem(40),
                height: rem(40),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 10px 30px ${accentCommunity}40`
              }}
            >
              <UsersIcon size={20} color="#ffffff" />
            </Box>

            <Stack align="center" gap={4} maw={520} ta="center">
              <Title order={1} size="1.5rem" fw={700} c={accentCommunity}>
                Community Hub
              </Title>
              <Text size="sm" c="dimmed">
                Discover fellow readers, track progress, and celebrate community contributions.
              </Text>
              <Badge
                size="sm"
                variant="light"
                c={accentCommunity}
                radius="sm"
                style={{ backgroundColor: `${accentCommunity}20` }}
              >
                {total.toLocaleString()} member{total === 1 ? '' : 's'}
              </Badge>
            </Stack>
          </Stack>
        </Box>

        <Container size="lg" px="md" mb="md">
          <Paper
            withBorder
            radius="md"
            p="md"
            style={{
              background: backgroundStyles.card,
              borderColor: `${accentCommunity}25`
            }}
          >
            <Stack gap="md">
              <Group gap="md" align="flex-end" wrap="wrap">
                <Box style={{ flex: '1 1 auto', minWidth: '0', width: '100%' }} maw={{ sm: '100%', md: 'calc(100% - 250px)' }}>
                  <TextInput
                    size="md"
                    radius="md"
                    placeholder="Search by username..."
                    value={searchInput}
                    onChange={handleSearch}
                    onKeyDown={handleSearchKeyDown}
                    leftSection={<Search size={16} />}
                    rightSection={
                      searchInput && (
                        <ActionIcon
                          size="sm"
                          variant="subtle"
                          onClick={handleClearSearch}
                          style={{ color: accentCommunity }}
                          aria-label="Clear search"
                        >
                          <X size={14} />
                        </ActionIcon>
                      )
                    }
                    styles={{
                      input: {
                        backgroundColor: backgroundStyles.input,
                        border: `1px solid ${accentCommunity}30`,
                        color: '#ffffff',
                        '&:focus': {
                          borderColor: accentCommunity
                        }
                      }
                    }}
                  />
                </Box>

                <Select
                  size="md"
                  radius="md"
                  placeholder="Sort by..."
                  value={sortBy}
                  onChange={handleSortChange}
                  leftSection={<ArrowUpDown size={16} />}
                  data={[
                    { value: 'newest', label: 'Newest Members' },
                    { value: 'username', label: 'Username (A-Z)' }
                  ]}
                  w={{ base: '100%', md: 220 }}
                  styles={{
                    input: {
                      backgroundColor: backgroundStyles.input,
                      border: `1px solid ${accentCommunity}30`,
                      color: '#ffffff'
                    },
                    dropdown: {
                      backgroundColor: backgroundStyles.card
                    }
                  }}
                />
              </Group>
            </Stack>
          </Paper>
        </Container>

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
              <CardGridSkeleton count={12} cardWidth={280} cardHeight={160} accentColor={accentCommunity} />
            ) : (
              <>
                {users.length === 0 ? (
                  <Stack align="center" gap="sm" py="xl">
                    <UsersIcon size={48} color={theme.colors.dark?.[3] ?? '#4b4d52'} />
                    <Title order={4} c="dimmed">
                      {hasSearch ? 'No users match your search' : 'No community members yet'}
                    </Title>
                    <Text size="sm" c="dimmed">
                      Try adjusting your search or check back soon.
                    </Text>
                  </Stack>
                ) : (
                  <Stack gap="md">
                    <Group justify="space-between" gap={6} align="center" wrap="wrap">
                      <Text size="sm" c="dimmed">
                        Showing {rangeStart.toLocaleString()}–{rangeEnd.toLocaleString()} of {total.toLocaleString()} members
                      </Text>
                      {isRefreshing && (
                        <Group gap={6} align="center">
                          <Loader size="xs" color={accentCommunity} />
                          <Text size="xs" c="dimmed">Updating…</Text>
                        </Group>
                      )}
                    </Group>

                    <SimpleGrid cols={{ base: 1, xs: 2, sm: 2, md: 3, lg: 4, xl: 5 }} spacing="sm">
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
                              padding="md"
                              style={{
                                ...getCardStyles(theme, accentCommunity),
                                height: '100%',
                                textDecoration: 'none',
                                cursor: 'pointer'
                              }}
                            >
                              <Stack gap="xs" align="center" style={{ height: '100%' }}>
                                <UserProfileImage
                                  user={user}
                                  size={56}
                                  showFallback
                                  className="user-profile-avatar"
                                />

                                <Stack gap={2} align="center" w="100%">
                                  <Text
                                    fw={600}
                                    c={accentCommunity}
                                    ta="center"
                                    size="sm"
                                    lineClamp={1}
                                    title={user.username}
                                  >
                                    {user.username}
                                  </Text>
                                  <UserRoleDisplay
                                    userRole={user.role as 'admin' | 'moderator' | 'user'}
                                    customRole={user.customRole}
                                    size="small"
                                    spacing={0.5}
                                  />
                                </Stack>

                                <UserBadges userId={user.id} size="sm" maxDisplay={3} />

                                <Text size="xs" c="dimmed" ta="center" mt="auto">
                                  Ch. {user.userProgress ?? 0}
                                </Text>
                              </Stack>
                            </Card>
                          </motion.div>
                      ))}
                    </SimpleGrid>

                    {totalPages > 1 && (
                      <Group justify="center">
                        <Pagination
                          total={totalPages}
                          value={page}
                          onChange={handlePageChange}
                          color="grape"
                          radius="lg"
                        />
                      </Group>
                    )}
                  </Stack>
                )}
              </>
            )}
          </Container>
        )}
      </motion.div>
    </Box>
  )
}
