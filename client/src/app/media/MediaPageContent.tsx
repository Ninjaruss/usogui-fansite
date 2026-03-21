'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Text,
  Group,
  Select,
  Button,
  Card,
  Badge,
  ActionIcon,
  Loader,
  Stack,
  Alert,
  Box,
  Container,
  useMantineTheme,
  rem
} from '@mantine/core'
import { useDebouncedValue, useIntersection } from '@mantine/hooks'
import {
  Image as ImageIcon,
  Play,
  Volume2,
  ExternalLink,
  X,
  Upload,
  ImageOff
} from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { BackToTop } from '../../components/BackToTop'
import { api } from '../../lib/api'
import { getEntityThemeColor, backgroundStyles } from '../../lib/mantine-theme'
import { ListPageHero } from '../../components/layouts/ListPageHero'
import { useAuth } from '../../providers/AuthProvider'
import { CardGridSkeleton } from '../../components/CardGridSkeleton'
import { FilterEmptyState } from '../../components/EmptyState'
import { ActiveFilterBadge, ActiveFilterBadgeRow } from '../../components/layouts/ActiveFilterBadge'
import { SearchToolbar } from '../../components/layouts/SearchToolbar'
import { motion } from 'motion/react'
import { pageEnter } from '../../lib/motion-presets'
import { extractYouTubeVideoId, getYouTubeThumbnail, isYouTubeUrl } from '../../lib/video-utils'
import styles from './media.module.css'
import { MediaItem } from '../../types/media'
import MediaLightbox from '../../components/MediaLightbox'


interface MediaPageContentProps {
  initialPage: number
  initialType?: string
  initialOwnerType?: 'character' | 'arc' | 'event' | 'gamble' | 'organization' | 'user'
  initialOwnerId?: number
  initialSearch?: string
  initialPurpose?: string
}

const ITEMS_PER_PAGE = 24 // Increased for infinite scroll

export default function MediaPageContent({
  initialPage,
  initialType,
  initialOwnerType,
  initialOwnerId,
  initialSearch,
  initialPurpose
}: MediaPageContentProps) {
  const { user } = useAuth()
  const theme = useMantineTheme()
  const router = useRouter()
  const searchParams = useSearchParams()
  const accentMedia = getEntityThemeColor(theme, 'media')

  const [media, setMedia] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [viewerOpen, setViewerOpen] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [failedImages, setFailedImages] = useState<Set<number>>(new Set())
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hoveredMediaId, setHoveredMediaId] = useState<number | null>(null)

  // Intersection observer for infinite scroll
  const { ref: loadMoreRef, entry } = useIntersection({ threshold: 0.5 })

  // Filters - initialize from URL params via server component props
  const [currentPage, setCurrentPage] = useState(initialPage)
  const [searchValue, setSearchValue] = useState(initialSearch || '')
  const [debouncedSearch] = useDebouncedValue(searchValue, 300)
  const [selectedType, setSelectedType] = useState(initialType || 'all')
  const [selectedOwnerType, setSelectedOwnerType] = useState(initialOwnerType || 'all')
  const [selectedPurpose, setSelectedPurpose] = useState<string>(initialPurpose || 'gallery')

  // Sync filter state to URL for shareable links and back button support
  const updateUrl = useCallback((type: string, ownerType: string, search: string, purpose: string) => {
    const urlParams = new URLSearchParams()
    if (type && type !== 'all') urlParams.set('type', type)
    if (ownerType && ownerType !== 'all') urlParams.set('ownerType', ownerType)
    if (search?.trim()) urlParams.set('search', search.trim())
    if (purpose && purpose !== 'gallery') urlParams.set('purpose', purpose)

    const qs = urlParams.toString()
    router.push(qs ? `/media?${qs}` : '/media', { scroll: false })
  }, [router])

  // Pagination
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const fetchMedia = useCallback(async (page: number, append = false) => {
    if (append) {
      setLoadingMore(true)
    } else {
      setLoading(true)
    }
    setError('')

    try {
      const params: Record<string, string | number> = {
        page,
        limit: ITEMS_PER_PAGE,
        purpose: selectedPurpose
      }

      if (selectedType && selectedType !== 'all') {
        params.type = selectedType
      }

      if (selectedOwnerType && selectedOwnerType !== 'all') {
        params.ownerType = selectedOwnerType
      }

      if (initialOwnerId) {
        params.ownerId = initialOwnerId
      }

      if (debouncedSearch.trim()) {
        params.description = debouncedSearch.trim()
      }

      const response = await api.getApprovedMedia(params)
      const fetchedMedia = response.data || []

      if (append) {
        setMedia(prev => [...prev, ...fetchedMedia])
      } else {
        setMedia(fetchedMedia)
      }
      setTotal(response.total ?? fetchedMedia.length)
      setTotalPages(response.totalPages ?? 1)
      setHasMore(page < (response.totalPages ?? 1))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load media')
      if (!append) {
        setMedia([])
        setTotal(0)
        setTotalPages(1)
      }
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [selectedType, selectedOwnerType, selectedPurpose, initialOwnerId, debouncedSearch])

  // Initial load when filters change
  useEffect(() => {
    setCurrentPage(1)
    setHasMore(true)
    fetchMedia(1, false)
  }, [selectedType, selectedOwnerType, selectedPurpose, debouncedSearch, fetchMedia])

  // Sync filter state to URL (separate effect to avoid coupling with data fetch)
  useEffect(() => {
    updateUrl(selectedType, selectedOwnerType, debouncedSearch, selectedPurpose)
  }, [selectedType, selectedOwnerType, selectedPurpose, debouncedSearch, updateUrl])

  // Infinite scroll - load more when sentinel is visible
  useEffect(() => {
    if (entry?.isIntersecting && hasMore && !loading && !loadingMore) {
      const nextPage = currentPage + 1
      setCurrentPage(nextPage)
      fetchMedia(nextPage, true)
    }
  }, [entry?.isIntersecting, hasMore, loading, loadingMore, currentPage, fetchMedia])

  const handleClearFilters = useCallback(() => {
    setSearchValue('')
    setSelectedType('all')
    setSelectedOwnerType('all')
    setSelectedPurpose('gallery')
    setCurrentPage(1)
    setHasMore(true)
    router.push('/media', { scroll: false })
  }, [router])

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleMediaClick = useCallback((_item: MediaItem, index: number) => {
    setCurrentIndex(index)
    setViewerOpen(true)
  }, [])

  const handleCloseViewer = useCallback(() => setViewerOpen(false), [])

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }, [currentIndex])

  const handleNext = useCallback(() => {
    if (currentIndex < media.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }, [currentIndex, media.length])


  const getMediaThumbnail = (mediaItem: MediaItem) => {
    if (mediaItem.type === 'image') {
      // Use the url field directly - it contains the full B2 URL for uploads
      // or the external URL for submissions
      return mediaItem.url
    }

    if (mediaItem.type === 'video') {
      if (isYouTubeUrl(mediaItem.url)) {
        const videoId = extractYouTubeVideoId(mediaItem.url)
        if (videoId) {
          return getYouTubeThumbnail(videoId)
        }
      }
    }

    return null
  }

  const getMediaTypeIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <ImageIcon size={16} />
      case 'video':
        return <Play size={16} />
      case 'audio':
        return <Volume2 size={16} />
      default:
        return <ImageIcon size={16} />
    }
  }

  const getOwnerTypeColor = (ownerType: string) => {
    switch (ownerType) {
      case 'character':
        return getEntityThemeColor(theme, 'character')
      case 'arc':
        return getEntityThemeColor(theme, 'arc')
      case 'event':
        return getEntityThemeColor(theme, 'event')
      case 'gamble':
        return getEntityThemeColor(theme, 'gamble')
      case 'organization':
        return getEntityThemeColor(theme, 'organization')
      case 'user':
        return getEntityThemeColor(theme, 'media')
      default:
        return accentMedia
    }
  }

  const mediaInsights = useMemo(() => {
    const contributorIds = new Set<number>()
    const counts: Record<'image' | 'video' | 'audio', number> = { image: 0, video: 0, audio: 0 }

    media.forEach(item => {
      contributorIds.add(item.submittedBy.id)
      counts[item.type] += 1
    })

    return {
      contributors: contributorIds.size,
      counts,
      typeSummary: `${counts.image} image${counts.image === 1 ? '' : 's'} • ${counts.video} video${counts.video === 1 ? '' : 's'} • ${counts.audio} audio${counts.audio === 1 ? '' : 's'}`
    }
  }, [media])

  const activeFilters = useMemo(() => {
    const filters: Array<{ key: string; label: string; value: string; onClear: () => void }> = []

    if (searchValue.trim()) {
      filters.push({
        key: 'search',
        label: 'Keyword',
        value: searchValue.trim(),
        onClear: () => setSearchValue('')
      })
    }

    if (selectedType !== 'all') {
      filters.push({
        key: 'type',
        label: 'Type',
        value: selectedType,
        onClear: () => setSelectedType('all')
      })
    }

    if (selectedOwnerType !== 'all') {
      filters.push({
        key: 'owner',
        label: 'Content',
        value: selectedOwnerType,
        onClear: () => setSelectedOwnerType('all')
      })
    }

    if (selectedPurpose !== 'gallery') {
      filters.push({
        key: 'purpose',
        label: 'Source',
        value: 'Official',
        onClear: () => setSelectedPurpose('gallery')
      })
    }

    return filters
  }, [searchValue, selectedType, selectedOwnerType, selectedPurpose])

  const hasActiveFilters = activeFilters.length > 0
  const totalLabel = total === 1 ? 'media file' : 'media files'
  const rangeStart = media.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0
  const rangeEnd = rangeStart ? rangeStart + media.length - 1 : 0

  const selectionSummary = useMemo(() => {
    const isDefaultView =
      selectedPurpose === 'gallery' &&
      selectedType === 'all' &&
      selectedOwnerType === 'all' &&
      !searchValue.trim()

    if (isDefaultView) {
      return 'All submissions'
    }

    const parts: string[] = []

    parts.push(selectedPurpose === 'entity_display' ? 'Official media' : 'Community gallery')

    if (selectedType !== 'all') {
      parts.push(`${selectedType.charAt(0).toUpperCase()}${selectedType.slice(1)}`)
    }

    if (selectedOwnerType !== 'all') {
      const formattedOwner = selectedOwnerType === 'user'
        ? 'Community members'
        : `${selectedOwnerType.charAt(0).toUpperCase()}${selectedOwnerType.slice(1)}`
      parts.push(formattedOwner)
    }

    if (searchValue.trim()) {
      parts.push(`“${searchValue.trim()}”`)
    }

    return parts.join(' • ')
  }, [selectedPurpose, selectedType, selectedOwnerType, searchValue])

  return (
    <Box style={{ backgroundColor: backgroundStyles.page(theme), minHeight: '100vh' }}>
      <motion.div {...pageEnter}>
      <Box style={{ maxWidth: '75em', margin: '0 auto' }}>
      <Stack gap="md">
        <ListPageHero
          icon={<ImageIcon size={26} color="#ffffff" />}
          title="Media Gallery"
          subtitle="Community fanart, videos, and official artwork celebrating Usogui."
          entityType="media"
          count={total}
          countLabel={totalLabel}
          hasActiveSearch={hasActiveFilters}
        >
          {user && (
            <Button
              component={Link}
              href="/submit-media"
              size="xs"
              radius="sm"
              variant="outline"
              style={{ color: accentMedia, borderColor: accentMedia }}
              leftSection={<Upload size={14} />}
            >
              Submit Media
            </Button>
          )}
        </ListPageHero>

        <SearchToolbar
          searchPlaceholder="Search descriptions..."
          searchInput={searchValue}
          onSearchChange={(e) => {
            const value = e.target.value
            setSearchValue(value)
            if (value.trim() === '' && searchValue.trim() !== '') {
              setCurrentPage(1)
              setHasMore(true)
            }
          }}
          onClearSearch={handleClearFilters}
          hasActiveFilters={hasActiveFilters}
          sortOptions={[]}
          sortValue=""
          onSortChange={() => {}}
          accentColor={accentMedia}
        >
          <Select
            data={[
              { value: 'all', label: 'All Types' },
              { value: 'image', label: 'Images' },
              { value: 'video', label: 'Videos' },
              { value: 'audio', label: 'Audio' }
            ]}
            value={selectedType}
            onChange={(value) => setSelectedType(value || 'all')}
            placeholder="Type"
            leftSection={getMediaTypeIcon(selectedType)}
            size="lg"
            radius="xl"
            style={{ minWidth: rem(120), flex: '1 1 120px' }}
          />
          <Select
            data={[
              { value: 'all', label: 'All Content' },
              { value: 'character', label: 'Characters' },
              { value: 'arc', label: 'Arcs' },
              { value: 'event', label: 'Events' },
              { value: 'gamble', label: 'Gambles' },
              { value: 'organization', label: 'Organizations' },
              { value: 'user', label: 'Community' }
            ]}
            value={selectedOwnerType}
            onChange={(value) => setSelectedOwnerType((value as typeof selectedOwnerType) || 'all')}
            placeholder="Category"
            size="lg"
            radius="xl"
            style={{ minWidth: rem(140), flex: '1 1 140px' }}
          />
          <Select
            data={[
              { value: 'gallery', label: 'Community' },
              { value: 'entity_display', label: 'Official' }
            ]}
            value={selectedPurpose}
            onChange={(value) => setSelectedPurpose(value || 'gallery')}
            placeholder="Source"
            size="lg"
            radius="xl"
            style={{ minWidth: rem(120), flex: '1 1 120px' }}
          />
          {hasActiveFilters && (
            <Button
              variant="light"
              size="sm"
              onClick={handleClearFilters}
              color={accentMedia}
              leftSection={<X size={14} />}
            >
              Clear
            </Button>
          )}
        </SearchToolbar>

        {(media.length > 0 || total > 0) && (
          <Container size="lg" px="md">
            <Group gap="xs" wrap="wrap">
              <Group gap={6}>
                <ImageIcon size={12} color={accentMedia} />
                <Text size="xs" c="dimmed">
                  {total.toLocaleString()} total
                </Text>
              </Group>
              <Text size="xs" c="dimmed">•</Text>
              <Text size="xs" c="dimmed">
                {mediaInsights.contributors} creator{mediaInsights.contributors !== 1 ? 's' : ''}
              </Text>
              <Text size="xs" c="dimmed">•</Text>
              <Text size="xs" c="dimmed">
                {selectionSummary}
              </Text>
            </Group>
          </Container>
        )}

        {activeFilters.length > 0 && (
          <Container size="lg" px="md">
            <ActiveFilterBadgeRow>
              {activeFilters.map(f => (
                <ActiveFilterBadge
                  key={f.key}
                  label={f.label}
                  value={f.value}
                  onClear={f.onClear}
                  accentColor={accentMedia}
                />
              ))}
            </ActiveFilterBadgeRow>
          </Container>
        )}

        {error && (
          <Container size="lg" px="md">
            <Alert color={accentMedia} variant="light" radius="lg" title="Error loading media">
              {error}
            </Alert>
          </Container>
        )}

        {!error && (
          <Container size="lg" px="md" pb="xl">
            {loading ? (
              <CardGridSkeleton count={12} cardWidth={280} cardHeight={200} accentColor={accentMedia} />
            ) : (
              <>
                {media.length === 0 ? (
                  <FilterEmptyState
                    entityName="media"
                    onClearFilters={handleClearFilters}
                    accentColor={accentMedia}
                  />
                ) : (
                  <Stack gap="md">
                    <Group justify="space-between" align="center" wrap="wrap">
                      <Text size="sm" c="dimmed">
                        Showing {rangeStart.toLocaleString()}–{rangeEnd.toLocaleString()} of {total.toLocaleString()}
                      </Text>
                      {loading && (
                        <Group gap={6}>
                          <Loader size="xs" color={accentMedia} />
                          <Text size="xs" c="dimmed">Loading...</Text>
                        </Group>
                      )}
                    </Group>

                    {/* Masonry Grid Layout */}
                    <Box className={styles.masonryGrid}>
                      {media.map((item, index) => {
                        const thumbnail = getMediaThumbnail(item)
                        const ownerLabel = item.ownerType === 'user'
                          ? 'Community'
                          : item.ownerType
                        const isHovered = hoveredMediaId === item.id

                        return (
                          <Card
                            key={item.id}
                            className={styles.masonryItem}
                            withBorder
                            radius="md"
                            shadow="sm"
                            p={0}
                            style={{
                              background: backgroundStyles.card,
                              borderColor: `${accentMedia}20`,
                              cursor: 'pointer',
                              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                              overflow: 'hidden',
                              transform: isHovered ? 'scale(1.02)' : 'scale(1)',
                              boxShadow: isHovered ? `0 12px 28px ${accentMedia}40` : theme.shadows.sm,
                              zIndex: isHovered ? 10 : 1,
                              position: 'relative'
                            }}
                            onClick={() => handleMediaClick(item, index)}
                            onMouseEnter={() => setHoveredMediaId(item.id)}
                            onMouseLeave={() => setHoveredMediaId(null)}
                          >
                            {/* Image container - no AspectRatio for true masonry */}
                            {thumbnail ? (
                              <Box style={{ position: 'relative', width: '100%' }}>
                                {!failedImages.has(item.id) ? (
                                  <img
                                    src={thumbnail}
                                    alt={item.description || 'Media item'}
                                    loading="lazy"
                                    style={{
                                      width: '100%',
                                      height: 'auto',
                                      display: 'block'
                                    }}
                                    onError={() => {
                                      setFailedImages(prev => new Set(prev).add(item.id))
                                    }}
                                  />
                                ) : (
                                  <Box
                                    style={{
                                      width: '100%',
                                      minHeight: 150,
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      backgroundColor: theme.colors.dark[6],
                                      borderRadius: 8
                                    }}
                                  >
                                    <Stack align="center" gap="xs">
                                      <ImageOff size={32} color={theme.colors.dark[3]} />
                                      <Text size="xs" c="dimmed">Image unavailable</Text>
                                    </Stack>
                                  </Box>
                                )}

                                {/* Video play overlay */}
                                {item.type === 'video' && (
                                  <Box
                                    style={{
                                      position: 'absolute',
                                      top: '50%',
                                      left: '50%',
                                      transform: 'translate(-50%, -50%)',
                                      backgroundColor: 'rgba(0,0,0,0.75)',
                                      borderRadius: '50%',
                                      padding: rem(12),
                                      color: 'white',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center'
                                    }}
                                  >
                                    <Play size={20} fill="white" />
                                  </Box>
                                )}

                                {/* Hover overlay with details */}
                                <Box
                                  style={{
                                    position: 'absolute',
                                    bottom: 0,
                                    left: 0,
                                    right: 0,
                                    background: 'linear-gradient(transparent, rgba(0,0,0,0.85))',
                                    padding: rem(12),
                                    paddingTop: rem(32),
                                    opacity: isHovered ? 1 : 0,
                                    transition: 'opacity 0.2s ease',
                                    pointerEvents: isHovered ? 'auto' : 'none'
                                  }}
                                >
                                  {item.description && (
                                    <Text size="xs" c="white" fw={500} lineClamp={2} mb={6}>
                                      {item.description}
                                    </Text>
                                  )}
                                  <Group gap={6} wrap="wrap">
                                    <Badge
                                      size="xs"
                                      radius="sm"
                                      style={{
                                        backgroundColor: getOwnerTypeColor(item.ownerType),
                                        color: '#fff',
                                        textTransform: 'capitalize'
                                      }}
                                    >
                                      {ownerLabel}
                                    </Badge>
                                    {item.chapterNumber && (
                                      <Badge size="xs" variant="filled" color="dark">
                                        Ch. {item.chapterNumber}
                                      </Badge>
                                    )}
                                  </Group>
                                  <Text size="xs" c="dimmed" mt={4}>
                                    by {item.submittedBy.username}
                                  </Text>
                                </Box>

                                {/* Always visible badges */}
                                <Badge
                                  variant="filled"
                                  size="xs"
                                  radius="sm"
                                  style={{
                                    position: 'absolute',
                                    top: rem(6),
                                    left: rem(6),
                                    backgroundColor: getOwnerTypeColor(item.ownerType),
                                    color: '#fff',
                                    textTransform: 'capitalize',
                                    fontSize: rem(10),
                                    opacity: isHovered ? 0 : 1,
                                    transition: 'opacity 0.2s ease'
                                  }}
                                >
                                  {ownerLabel}
                                </Badge>

                                <ActionIcon
                                  variant="filled"
                                  size="sm"
                                  component="a"
                                  href={item.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  style={{
                                    position: 'absolute',
                                    top: rem(6),
                                    right: rem(6),
                                    backgroundColor: 'rgba(0,0,0,0.75)',
                                    color: 'white'
                                  }}
                                  aria-label="Open in new tab"
                                >
                                  <ExternalLink size={12} />
                                </ActionIcon>
                              </Box>
                            ) : (
                              <Box
                                style={{
                                  background: isHovered
                                    ? `linear-gradient(135deg, ${accentMedia}1a, ${theme.colors.dark[6]})`
                                    : theme.colors.dark[6],
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  width: '100%',
                                  minHeight: rem(120),
                                  flexDirection: 'column',
                                  gap: rem(8),
                                  transition: 'background 0.2s ease',
                                }}
                              >
                                <Stack align="center" gap="xs">
                                  <Box
                                    style={{
                                      background: `${accentMedia}26`,
                                      border: `1px solid ${accentMedia}59`,
                                      borderRadius: '50%',
                                      width: rem(44),
                                      height: rem(44),
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      color: accentMedia,
                                    }}
                                  >
                                    {getMediaTypeIcon(item.type)}
                                  </Box>
                                  <Text size="xs" c="white" style={{ opacity: 0.7 }} fw={500} tt="capitalize">
                                    {item.type}
                                  </Text>
                                  <Text size="xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Click to open</Text>
                                </Stack>
                              </Box>
                            )}
                          </Card>
                        )
                      })}
                    </Box>

                    {/* Infinite scroll sentinel */}
                    <Box ref={loadMoreRef} style={{ height: 1, marginTop: rem(16) }} />

                    {/* Loading more indicator */}
                    {loadingMore && (
                      <Group justify="center" py="md">
                        <Loader size="sm" color={accentMedia} />
                        <Text size="sm" c="dimmed">Loading more...</Text>
                      </Group>
                    )}

                    {/* End of results */}
                    {!hasMore && media.length > 0 && (
                      <Text size="sm" c="dimmed" ta="center" py="md">
                        You&apos;ve reached the end • {total} total items
                      </Text>
                    )}
                  </Stack>
                )}
              </>
            )}
          </Container>
        )}
      </Stack>
      </Box>
      </motion.div>

      <MediaLightbox
        opened={viewerOpen}
        media={media}
        currentIndex={currentIndex}
        onClose={handleCloseViewer}
        onPrevious={handlePrevious}
        onNext={handleNext}
      />

      <BackToTop />
    </Box>
  )
}
