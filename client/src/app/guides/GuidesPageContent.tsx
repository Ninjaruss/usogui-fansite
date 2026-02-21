'use client'

import React, { useEffect, useState, useCallback, useRef } from 'react'
import {
  ActionIcon,
  Alert,
  Badge,
  Box,
  Button,
  Card,
  Group,
  Loader,
  Pagination,
  Paper,
  Select,
  Stack,
  Text,
  TextInput,
  Title,
  rem,
  useMantineTheme
} from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { getEntityThemeColor, backgroundStyles, getHeroStyles, getPlayingCardStyles } from '../../lib/mantine-theme'
import { Search, FileText, Eye, Calendar, ThumbsUp, Heart, X, Users, BookOpen, Dice6, AlertCircle, ArrowUpDown } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'motion/react'
import { api } from '../../lib/api'
import { usePaged } from '../../hooks/usePagedCache'
import { pagedCacheConfig } from '../../config/pagedCacheConfig'
import { useAuth } from '../../providers/AuthProvider'
import AuthorProfileImage from '../../components/AuthorProfileImage'
import { UserRoleDisplay } from '../../components/BadgeDisplay'
import { CardGridSkeleton } from '../../components/CardGridSkeleton'
import { ScrollToTop } from '../../components/ScrollToTop'
import { useHoverModal } from '../../hooks/useHoverModal'

type GuideEntity = {
  id: number
  name: string
}

interface Guide {
  id: number
  title: string
  content: string
  description: string
  tags: GuideEntity[]
  author: {
    id: number
    username: string
    role?: string
    customRole?: string
    profilePictureType?: 'fluxer' | 'character_media' | null
    selectedCharacterMediaId?: number | null
    selectedCharacterMedia?: {
      id: number
      url: string
      fileName?: string
      description?: string
    } | null
    discordId?: string | null
    discordAvatar?: string | null
    fluxerId?: string | null
    fluxerAvatar?: string | null
  }
  characters?: GuideEntity[]
  arc?: GuideEntity
  gambles?: GuideEntity[]
  likeCount: number
  userHasLiked?: boolean
  viewCount: number
  createdAt: string
  updatedAt: string
}

interface GuidesPageContentProps {
  initialGuides: Guide[]
  initialTotalPages: number
  initialTotal: number
  initialPage: number
  initialSearch: string
  initialAuthorId?: string
  initialAuthorName?: string
  initialError: string
}

export default function GuidesPageContent({
  initialGuides,
  initialTotalPages,
  initialTotal,
  initialPage,
  initialSearch,
  initialAuthorId,
  initialAuthorName,
  initialError
}: GuidesPageContentProps) {
  const { user } = useAuth()
  const theme = useMantineTheme()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [guides, setGuides] = useState<Guide[]>(initialGuides)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(initialError)
  const [searchInput, setSearchInput] = useState(initialSearch)
  const [searchQuery, setSearchQuery] = useState(initialSearch)
  // Debounce search input to prevent rate limiting
  const [debouncedSearch] = useDebouncedValue(searchInput, 300)
  const [currentPage, setCurrentPage] = useState(initialPage)
  const [totalPages, setTotalPages] = useState(initialTotalPages)
  const [total, setTotal] = useState(initialTotal)
  const [liking, setLiking] = useState<number | null>(null)
  const [authorFilter, setAuthorFilter] = useState<string | null>(initialAuthorId || null)
  const [authorName, setAuthorName] = useState<string | null>(initialAuthorName || null)
  const [tagFilter, setTagFilter] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'newest')

  // Sync component state with URL params on mount and when URL changes
  useEffect(() => {
    const urlSearch = searchParams.get('search') || ''
    const urlPage = parseInt(searchParams.get('page') || '1', 10)
    const urlAuthor = searchParams.get('author') || null
    const urlAuthorName = searchParams.get('authorName') || null
    const urlTag = searchParams.get('tag') || null
    const urlSort = searchParams.get('sort') || 'newest'

    // Only update if values differ to avoid unnecessary re-renders
    if (urlSearch !== searchQuery) {
      setSearchInput(urlSearch)
      setSearchQuery(urlSearch)
    }
    if (urlPage !== currentPage) {
      setCurrentPage(urlPage)
    }
    if (urlAuthor !== authorFilter) {
      setAuthorFilter(urlAuthor)
    }
    if (urlAuthorName !== authorName) {
      setAuthorName(urlAuthorName)
    }
    if (urlTag !== tagFilter) {
      setTagFilter(urlTag)
    }
    if (urlSort !== sortBy) {
      setSortBy(urlSort)
    }
  }, [searchParams]) // Only depend on searchParams to avoid infinite loops

  // Hover modal
  const {
    hoveredItem: hoveredGuide,
    hoverPosition: hoverModalPosition,
    handleMouseEnter: handleGuideMouseEnter,
    handleMouseLeave: handleGuideMouseLeave,
    handleModalMouseEnter,
    handleModalMouseLeave,
    handleTap: handleGuideTap,
    closeModal,
    isTouchDevice
  } = useHoverModal<Guide>()

  // Map sort UI values to API params
  const getSortParams = useCallback((sort: string) => {
    switch (sort) {
      case 'mostLiked': return { sortBy: 'likeCount', sortOrder: 'DESC' }
      case 'mostViewed': return { sortBy: 'viewCount', sortOrder: 'DESC' }
      case 'oldest': return { sortBy: 'createdAt', sortOrder: 'ASC' }
      case 'newest':
      default: return { sortBy: 'createdAt', sortOrder: 'DESC' }
    }
  }, [])

  const fetcher = useCallback(async (page: number) => {
    const sortParams = getSortParams(sortBy)
    const params: any = { page, limit: 12, status: 'approved', ...sortParams }
    if (searchQuery) params.search = searchQuery
    if (authorFilter) params.authorId = parseInt(authorFilter)
    if (tagFilter) params.tag = tagFilter
    const resAny = await api.getGuides(params)
    return { data: resAny.data || [], total: resAny.total || 0, page: resAny.page || page, perPage: 12, totalPages: resAny.totalPages || Math.max(1, Math.ceil((resAny.total || 0) / 12)) }
  }, [searchQuery, authorFilter, tagFilter, sortBy, getSortParams])

  const { data: pageData, loading: pageLoading, error: pageError, prefetch, refresh, invalidate } = usePaged<Guide>('guides', currentPage, fetcher, { search: searchQuery, authorId: authorFilter, tag: tagFilter, sort: sortBy }, { ttlMs: pagedCacheConfig.lists.guides.ttlMs, persist: pagedCacheConfig.defaults.persist, maxEntries: pagedCacheConfig.lists.guides.maxEntries })

  useEffect(() => {
    if (pageData) {
      setGuides(pageData.data || [])
      setTotalPages(pageData.totalPages || 1)
      setTotal(pageData.total || 0)
    }
    setLoading(!!pageLoading)
  }, [pageData, pageLoading])

  // Refetch guides when user becomes available to get userHasLiked status
  useEffect(() => {
    if (!user) return

    // Check if any guides are missing userHasLiked status
    const needsRefresh = guides.some(guide => typeof guide.userHasLiked !== 'boolean')
    if (needsRefresh) {
      refresh()
    }
  }, [user?.id, guides, refresh])

  const updateUrl = useCallback((page: number, search: string, authorId?: string, authorNameParam?: string, tag?: string, sort?: string) => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (authorId) params.set('author', authorId)
    if (authorNameParam) params.set('authorName', authorNameParam)
    if (tag) params.set('tag', tag)
    if (sort && sort !== 'newest') params.set('sort', sort)
    if (page > 1) params.set('page', page.toString())

    const newUrl = params.toString() ? `/guides?${params.toString()}` : '/guides'
    router.push(newUrl, { scroll: false })
  }, [router])

  const handleSortChange = useCallback((value: string | null) => {
    const newSort = value || 'newest'
    setSortBy(newSort)
    setCurrentPage(1)
    updateUrl(1, searchQuery, authorFilter || undefined, authorName || undefined, tagFilter || undefined, newSort)
  }, [searchQuery, authorFilter, authorName, tagFilter, updateUrl])

  const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    // Only update input - debounce effect handles search query and URL
    const value = event.target.value
    setSearchInput(value)

    // Immediately clear search when input is emptied (bypass debounce)
    if (value.trim() === '' && searchQuery !== '') {
      setSearchQuery('')
      setCurrentPage(1)
      setAuthorFilter(null)
      setAuthorName(null)
      setTagFilter(null)
      updateUrl(1, '', undefined, undefined, undefined, sortBy)
    }
  }, [searchQuery, sortBy, updateUrl])

  // Handle Enter key - bypass debounce for immediate search
  const handleSearchKeyDown = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      const value = searchInput.trim()
      if (value !== searchQuery) {
        setSearchQuery(value)
        setCurrentPage(1)
        updateUrl(1, value, authorFilter || undefined, authorName || undefined, tagFilter || undefined, sortBy)
      }
    }
  }, [searchInput, searchQuery, authorFilter, authorName, tagFilter, sortBy, updateUrl])

  // Update search query when debounced value changes
  useEffect(() => {
    // Skip if input was cleared but debounce hasn't caught up yet
    if (searchInput.trim() === '' && debouncedSearch.trim() !== '') {
      return
    }
    if (debouncedSearch.trim() !== searchQuery) {
      setSearchQuery(debouncedSearch.trim())
      setCurrentPage(1)
      updateUrl(1, debouncedSearch.trim(), authorFilter || undefined, authorName || undefined, tagFilter || undefined, sortBy)
    }
  }, [debouncedSearch, searchInput, searchQuery, authorFilter, authorName, tagFilter, sortBy, updateUrl])

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
    updateUrl(page, searchQuery, authorFilter || undefined, authorName || undefined, tagFilter || undefined, sortBy)
    prefetch(page)
  }, [searchQuery, authorFilter, authorName, tagFilter, sortBy, updateUrl, prefetch])

  const handleClearSearch = useCallback(() => {
    setSearchInput('')
    setSearchQuery('')
    setCurrentPage(1)
    setAuthorFilter(null)
    setAuthorName(null)
    setTagFilter(null)
    updateUrl(1, '', undefined, undefined, undefined, sortBy)
  }, [sortBy, updateUrl])

  const clearAuthorFilter = () => {
    setAuthorFilter(null)
    setAuthorName(null)
    setCurrentPage(1)
    updateUrl(1, searchQuery, undefined, undefined, tagFilter || undefined, sortBy)
  }

  const clearTagFilter = () => {
    setTagFilter(null)
    setCurrentPage(1)
    updateUrl(1, searchQuery, authorFilter || undefined, authorName || undefined, undefined, sortBy)
  }

  const handleTagClick = (tagName: string) => {
    setTagFilter(tagName)
    setCurrentPage(1)
    updateUrl(1, searchQuery, authorFilter || undefined, authorName || undefined, tagName, sortBy)
  }

  const getContentPreview = (content: string, maxLength = 150) => {
    if (!content) return 'No content available'
    if (content.length <= maxLength) return content
    return content.slice(0, maxLength).replace(/\s+\S*$/, '') + '...'
  }

  const handleLikeToggle = async (guideId: number) => {
    if (liking === guideId) return

    if (!user) {
      notifications.show({
        title: 'Login Required',
        message: 'Please log in to like guides',
        color: 'yellow',
        autoClose: 3000
      })
      return
    }

    setLiking(guideId)
    try {
      const response = await api.toggleGuideLike(guideId)
      setGuides((previous) =>
        previous.map((guide) =>
          guide.id === guideId
            ? { ...guide, likeCount: response.likeCount, userHasLiked: response.liked }
            : guide
        )
      )
      // Invalidate cache to ensure fresh data on next load
      invalidate()
    } catch (toggleError: unknown) {
      console.error('Error toggling like:', toggleError)
    } finally {
      setLiking(null)
    }
  }

  const accentGuide = theme.other?.usogui?.guide ?? theme.colors.green?.[5] ?? '#4ade80'
  const hasSearchQuery = searchInput.trim().length > 0

  return (
    <Box style={{ backgroundColor: backgroundStyles.page(theme), minHeight: '100vh' }}>
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      {/* Hero Section */}
      <Box
        style={getHeroStyles(theme, accentGuide)}
        p="md"
      >
        <Stack align="center" gap="xs">
          <Box
            style={{
              background: `linear-gradient(135deg, ${accentGuide}, ${accentGuide}CC)`,
              borderRadius: '50%',
              width: rem(40),
              height: rem(40),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 4px 16px ${accentGuide}40`
            }}
          >
            <FileText size={20} color="white" />
          </Box>

          <Stack align="center" gap="xs">
            <Title order={1} size="1.5rem" fw={700} ta="center" c={accentGuide}>
              Community Guides
            </Title>
            <Text size="md" style={{ color: theme.colors.gray[6] }} ta="center" maw={400}>
              In-depth analysis and insights from the Usogui community
            </Text>

            {total > 0 && (
              <Badge size="md" variant="light" c={accentGuide} radius="xl" mt="xs">
                {total} guide{total !== 1 ? 's' : ''} published
              </Badge>
            )}
          </Stack>

          {user && (
            <Button
              component={Link}
              href="/submit-guide"
              size="md"
              leftSection={<FileText size={16} />}
              radius="md"
              variant="gradient"
              gradient={{ from: accentGuide, to: theme.other?.usogui?.red ?? theme.colors.red?.[6] ?? '#e11d48' }}
            >
              Write Guide
            </Button>
          )}
        </Stack>
      </Box>

      {/* Search and Filters */}
      <Box mb="xl" px="md">
        <Group justify="center" mb="md" gap="md">
          <Box style={{ maxWidth: rem(500), width: '100%' }}>
            <TextInput
              placeholder="Search guides by title or description..."
              value={searchInput}
              onChange={handleSearchChange}
              onKeyDown={handleSearchKeyDown}
              leftSection={<Search size={20} />}
              size="lg"
              radius="xl"
              rightSection={
                hasSearchQuery ? (
                  <ActionIcon variant="subtle" color="gray" onClick={handleClearSearch} size="lg" aria-label="Clear search" style={{ minWidth: 44, minHeight: 44 }}>
                    <X size={18} />
                  </ActionIcon>
                ) : null
              }
              styles={{
                input: {
                  fontSize: rem(16),
                  paddingLeft: rem(50),
                  paddingRight: hasSearchQuery ? rem(50) : rem(20)
                }
              }}
            />
          </Box>
          <Select
            data={[
              { value: 'newest', label: 'Newest' },
              { value: 'oldest', label: 'Oldest' },
              { value: 'mostLiked', label: 'Most Liked' },
              { value: 'mostViewed', label: 'Most Viewed' },
            ]}
            value={sortBy}
            onChange={handleSortChange}
            leftSection={<ArrowUpDown size={16} />}
            w={180}
            size="lg"
            radius="xl"
            styles={{
              input: {
                fontSize: rem(14)
              }
            }}
          />
        </Group>

        {(authorFilter && authorName) || tagFilter ? (
          <Group justify="center" gap="sm" wrap="wrap">
            {authorFilter && authorName && (
              <>
                <Badge
                  size="md"
                  c="white"
                  variant="filled"
                  style={{ backgroundColor: getEntityThemeColor(theme, 'character') }}
                >
                  Author: {authorName}
                </Badge>
                <Button
                  variant="subtle"
                  size="xs"
                  style={{ color: getEntityThemeColor(theme, 'character') }}
                  leftSection={<X size={14} />}
                  onClick={clearAuthorFilter}
                >
                  Clear Author
                </Button>
              </>
            )}
            {tagFilter && (
              <>
                <Badge
                  size="md"
                  c="white"
                  variant="filled"
                  style={{ backgroundColor: getEntityThemeColor(theme, 'organization') }}
                >
                  Tag: #{tagFilter}
                </Badge>
                <Button
                  variant="subtle"
                  size="xs"
                  style={{ color: getEntityThemeColor(theme, 'organization') }}
                  leftSection={<X size={14} />}
                  onClick={clearTagFilter}
                >
                  Clear Tag
                </Button>
              </>
            )}
          </Group>
        ) : null}
      </Box>

      {/* Error State */}
      {error && (
        <Box px="md">
          <Alert
            color="red"
            radius="md"
            mb="xl"
            icon={<AlertCircle size={16} />}
            title="Error loading guides"
          >
            {error}
          </Alert>
        </Box>
      )}

      {/* Loading State */}
      {loading ? (
        <CardGridSkeleton count={12} cardWidth={280} cardHeight={200} accentColor={accentGuide} />
      ) : (
        <>
          {/* Empty State */}
          {guides.length === 0 ? (
            <Box style={{ textAlign: 'center', paddingBlock: rem(80) }}>
              <FileText size={64} color={theme.colors.gray[4]} style={{ marginBottom: rem(20) }} />
              <Title order={3} style={{ color: theme.colors.gray[6] }} mb="sm">
                {hasSearchQuery ? 'No guides found' : 'No guides available'}
              </Title>
              <Text size="lg" style={{ color: theme.colors.gray[6] }} mb="xl">
                {hasSearchQuery
                  ? 'Try adjusting your search terms or filters'
                  : 'Check back later for new guides'}
              </Text>
              {hasSearchQuery && (
                <Button variant="outline" c={accentGuide} onClick={handleClearSearch}>
                  Clear search
                </Button>
              )}
            </Box>
          ) : (
            <>
              {/* Results Grid */}
              <Box
                px="md"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                  gap: rem(20),
                  justifyItems: 'center',
                  maxWidth: '1400px',
                  margin: '0 auto'
                }}
              >
                {guides.map((guide: Guide, index: number) => (
                  <motion.div
                    key={guide.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                    style={{
                      width: '100%',
                      maxWidth: '380px',
                      minHeight: '400px'
                    }}
                  >
                    <Card
                      component={Link}
                      href={`/guides/${guide.id}`}
                      withBorder={false}
                      radius="lg"
                      shadow="sm"
                      className="hoverable-card hoverable-card-guide"
                      style={getPlayingCardStyles(theme, accentGuide)}
                      onClick={(e) => {
                        // On touch devices, first tap shows preview, second tap navigates
                        if (isTouchDevice) {
                          // If modal is not showing for this guide, prevent navigation and show modal
                          if (hoveredGuide?.id !== guide.id) {
                            e.preventDefault()
                            handleGuideTap(guide, e)
                          }
                          // If modal is already showing, allow navigation (second tap)
                        }
                      }}
                      onMouseEnter={(e) => {
                        if (isTouchDevice) return // Skip hover on touch devices
                        handleGuideMouseEnter(guide, e)
                      }}
                      onMouseLeave={() => {
                        if (isTouchDevice) return // Skip hover on touch devices
                        handleGuideMouseLeave()
                      }}
                    >
                      {/* Author Badge at Top Left */}
                      <Group
                        gap={8}
                        wrap="nowrap"
                        style={{
                          position: 'absolute',
                          top: rem(12),
                          left: rem(12),
                          backgroundColor: accentGuide,
                          borderRadius: rem(16),
                          padding: `${rem(4)} ${rem(10)} ${rem(4)} ${rem(4)}`,
                          zIndex: 10,
                          backdropFilter: 'blur(4px)',
                          maxWidth: 'calc(100% - 24px)',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                        }}
                      >
                        <AuthorProfileImage author={guide.author} size={24} showFallback />
                        <Text
                          size="xs"
                          fw={600}
                          c="white"
                          style={{
                            fontSize: rem(12),
                            lineHeight: 1.2,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxWidth: rem(120)
                          }}
                        >
                          {guide.author.username}
                        </Text>
                      </Group>

                      {/* Main Content Section */}
                      <Stack
                        style={{
                          position: 'relative',
                          flex: 1,
                          minHeight: 0,
                          padding: rem(16),
                          paddingTop: rem(48), // Account for author badge
                          justifyContent: 'space-between',
                          height: '100%'
                        }}
                        gap={rem(12)}
                      >
                        {/* Title */}
                        <Title
                          order={3}
                          size="lg"
                          lineClamp={2}
                          c={accentGuide}
                          style={{
                            fontSize: rem(20),
                            fontWeight: 700,
                            lineHeight: 1.3,
                            textAlign: 'center',
                            marginBottom: rem(12)
                          }}
                        >
                          {guide.title}
                        </Title>

                        {/* Description Preview */}
                        {guide.description && (
                          <Text
                            size="sm"
                            c="dimmed"
                            lineClamp={2}
                            style={{
                              textAlign: 'center',
                              fontSize: rem(13),
                              lineHeight: 1.4,
                              marginBottom: rem(12),
                              minHeight: rem(36)
                            }}
                          >
                            {guide.description}
                          </Text>
                        )}

                        {/* Tags Section - Much more prominent */}
                        <Box style={{ minHeight: rem(54) }}>
                          <Group gap={6} justify="center" wrap="wrap">
                            {guide.tags?.slice(0, 3).map((tag) => (
                              <Badge
                                key={tag.id}
                                size="sm"
                                c={getEntityThemeColor(theme, 'organization')}
                                variant="light"
                                className="hoverable-badge"
                                style={{
                                  backgroundColor: `${getEntityThemeColor(theme, 'organization')}15`,
                                  borderColor: getEntityThemeColor(theme, 'organization'),
                                  border: `1px solid ${getEntityThemeColor(theme, 'organization')}40`,
                                  fontSize: rem(11),
                                  height: rem(24),
                                  paddingInline: rem(8)
                                }}
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  handleTagClick(tag.name)
                                }}
                              >
                                #{tag.name}
                              </Badge>
                            ))}
                            {guide.tags && guide.tags.length > 3 && (
                              <Badge
                                size="sm"
                                c={getEntityThemeColor(theme, 'organization')}
                                variant="light"
                                style={{
                                  backgroundColor: `${getEntityThemeColor(theme, 'organization')}15`,
                                  borderColor: getEntityThemeColor(theme, 'organization'),
                                  border: `1px solid ${getEntityThemeColor(theme, 'organization')}40`,
                                  fontSize: rem(11),
                                  height: rem(24),
                                  paddingInline: rem(8)
                                }}
                              >
                                +{guide.tags.length - 3}
                              </Badge>
                            )}
                          </Group>
                        </Box>

                        {/* Stats Section - Much more prominent */}
                        <Box
                          style={{
                            borderTop: `1px solid ${theme.colors.gray[2]}`,
                            paddingTop: rem(12),
                            marginTop: 'auto'
                          }}
                        >
                          <Group justify="space-between" align="center">
                            <Group gap={12} align="center">
                              <Group gap={4} align="center">
                                <Heart size={16} color={guide.userHasLiked ? theme.other?.usogui?.red ?? theme.colors.red?.[6] : theme.colors.gray[5]} />
                                <Text size="sm" c="dimmed" fw={600} style={{ fontSize: rem(13) }}>{guide.likeCount}</Text>
                              </Group>
                              <Group gap={4} align="center">
                                <Eye size={16} color={theme.colors.gray[5]} />
                                <Text size="sm" c="dimmed" fw={600} style={{ fontSize: rem(13) }}>{guide.viewCount}</Text>
                              </Group>
                            </Group>

                            {/* Like Button - Much more prominent */}
                            <Button
                              size="sm"
                              variant={guide.userHasLiked ? 'filled' : 'outline'}
                              color={accentGuide}
                              style={{
                                height: rem(32),
                                fontSize: rem(12),
                                fontWeight: 600,
                                minWidth: rem(70)
                              }}
                              leftSection={<ThumbsUp size={14} />}
                              loading={liking === guide.id}
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                handleLikeToggle(guide.id)
                              }}
                            >
                              {guide.userHasLiked ? 'Liked' : 'Like'}
                            </Button>
                          </Group>
                        </Box>

                        {/* Touch device hint */}
                        {isTouchDevice && hoveredGuide?.id !== guide.id && (
                          <Text
                            size="xs"
                            c="dimmed"
                            ta="center"
                            style={{
                              fontSize: rem(10),
                              opacity: 0.7
                            }}
                          >
                            Tap to preview
                          </Text>
                        )}
                      </Stack>
                    </Card>
                  </motion.div>
                ))}
              </Box>

              {/* Pagination Info & Controls */}
              <Box
                px="md"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  marginTop: rem(48),
                  gap: rem(12)
                }}>
                {/* Always show pagination info when we have guides */}
                {total > 0 && (
                  <Text size="sm" style={{ color: theme.colors.gray[6] }}>
                    Showing {guides.length} of {total} guides
                    {totalPages > 1 && ` • Page ${currentPage} of ${totalPages}`}
                  </Text>
                )}

                {/* Show pagination controls when we have multiple pages */}
                {totalPages > 1 && (
                  <Pagination
                    total={totalPages}
                    value={currentPage}
                    onChange={handlePageChange}
                    color="guide"
                    size="lg"
                    radius="xl"
                    withEdges
                  />
                )}

                {loading && <Loader size="sm" color={accentGuide} />}
              </Box>
            </>
          )}
        </>
      )}

      {/* Hover Modal */}
      <AnimatePresence>
        {hoveredGuide && hoverModalPosition && (
          <>
            {/* Backdrop for touch devices */}
            {isTouchDevice && (
              <Box
                onClick={closeModal}
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: 1000,
                  backgroundColor: 'transparent'
                }}
              />
            )}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              style={{
                position: 'fixed',
                left: hoverModalPosition.x - 150, // Center horizontally (300px width / 2)
                top: hoverModalPosition.y, // Use calculated position directly
                zIndex: 1001, // Higher than navbar (which is 1000)
                pointerEvents: 'auto'
              }}
              onMouseEnter={handleModalMouseEnter}
              onMouseLeave={handleModalMouseLeave}
            >
              <Paper
                shadow="xl"
                radius="lg"
                p="md"
                style={{
                  backgroundColor: backgroundStyles.modal,
                  border: `2px solid ${accentGuide}`,
                  backdropFilter: 'blur(10px)',
                  width: rem(300),
                  maxWidth: '90vw',
                  position: 'relative'
                }}
              >
                {/* Close button for touch devices */}
                {isTouchDevice && (
                  <ActionIcon
                    onClick={closeModal}
                    size="xs"
                    variant="subtle"
                    color="gray"
                    style={{
                      position: 'absolute',
                      top: rem(8),
                      right: rem(8),
                      zIndex: 10
                    }}
                  >
                    <X size={14} />
                  </ActionIcon>
                )}
              <Stack gap="sm">
                {/* Guide Title */}
                <Title
                  order={4}
                  size="md"
                  fw={700}
                  c={accentGuide}
                  ta="center"
                  lineClamp={2}
                >
                  {hoveredGuide.title}
                </Title>

                {/* Author Info */}
                <Group justify="center" gap="sm" align="center">
                  <AuthorProfileImage author={hoveredGuide.author} size={24} showFallback />
                  <Stack gap={2}>
                    <Text size="sm" c="dimmed" ta="center">
                      by {hoveredGuide.author.username}
                    </Text>
                    <UserRoleDisplay
                      userRole={(hoveredGuide.author.role as 'admin' | 'moderator' | 'user') || 'user'}
                      customRole={hoveredGuide.author.customRole}
                      size="small"
                    />
                  </Stack>
                </Group>

                {/* Description */}
                <Text
                  size="sm"
                  ta="center"
                  lineClamp={3}
                  style={{
                    color: theme.colors.gray[6],
                    lineHeight: 1.4,
                    maxHeight: rem(60)
                  }}
                >
                  {getContentPreview(hoveredGuide.description || hoveredGuide.content, 120)}
                </Text>

                {/* Related Entities */}
                {(hoveredGuide.characters?.length || hoveredGuide.arc || hoveredGuide.gambles?.length) && (
                  <Stack gap={6}>
                    {hoveredGuide.characters && hoveredGuide.characters.length > 0 && (
                      <Group justify="center" gap={4} wrap="wrap">
                        <Users size={12} />
                        {hoveredGuide.characters.slice(0, 2).map((character) => (
                          <Badge
                            key={character.id}
                            size="xs"
                            c={getEntityThemeColor(theme, 'character')}
                            variant="light"
                            style={{ backgroundColor: `${getEntityThemeColor(theme, 'character')}20` }}
                          >
                            {character.name}
                          </Badge>
                        ))}
                        {hoveredGuide.characters.length > 2 && (
                          <Badge size="xs" variant="light">+{hoveredGuide.characters.length - 2}</Badge>
                        )}
                      </Group>
                    )}

                    {hoveredGuide.arc && (
                      <Group justify="center" gap={4}>
                        <BookOpen size={12} />
                        <Badge
                          size="xs"
                          c={getEntityThemeColor(theme, 'arc')}
                          variant="light"
                          style={{ backgroundColor: `${getEntityThemeColor(theme, 'arc')}20` }}
                        >
                          {hoveredGuide.arc.name}
                        </Badge>
                      </Group>
                    )}

                    {hoveredGuide.gambles && hoveredGuide.gambles.length > 0 && (
                      <Group justify="center" gap={4} wrap="wrap">
                        <Dice6 size={12} />
                        {hoveredGuide.gambles.slice(0, 2).map((gamble) => (
                          <Badge
                            key={gamble.id}
                            size="xs"
                            c={getEntityThemeColor(theme, 'gamble')}
                            variant="light"
                            style={{ backgroundColor: `${getEntityThemeColor(theme, 'gamble')}20` }}
                          >
                            {gamble.name}
                          </Badge>
                        ))}
                        {hoveredGuide.gambles.length > 2 && (
                          <Badge size="xs" variant="light">+{hoveredGuide.gambles.length - 2}</Badge>
                        )}
                      </Group>
                    )}
                  </Stack>
                )}

                {/* Creation Date */}
                <Group justify="center" gap={4} align="center">
                  <Calendar size={14} color={theme.colors.gray[5]} />
                  <Text size="sm">{new Date(hoveredGuide.createdAt).toLocaleDateString()}</Text>
                </Group>
              </Stack>
              </Paper>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <ScrollToTop accentColor={accentGuide} />
    </motion.div>
    </Box>
  )
}
