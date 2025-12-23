'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Title,
  Text,
  Group,
  Select,
  TextInput,
  Button,
  Card,
  Badge,
  ActionIcon,
  Loader,
  Stack,
  Alert,
  Box,
  Container,
  Paper,
  useMantineTheme,
  rem,
  Modal,
  Image,
  Anchor
} from '@mantine/core'
import { useDebouncedValue, useIntersection } from '@mantine/hooks'
import {
  Search,
  Image as ImageIcon,
  Play,
  Volume2,
  ExternalLink,
  User,
  Calendar,
  X,
  ChevronLeft,
  ChevronRight,
  Upload
} from 'lucide-react'
import Link from 'next/link'
import { api } from '../../lib/api'
import { getEntityThemeColor, backgroundStyles, getHeroStyles } from '../../lib/mantine-theme'

interface MediaItem {
  id: number
  url: string
  type: 'image' | 'video' | 'audio'
  description: string
  fileName?: string
  isUploaded?: boolean
  ownerType: 'character' | 'arc' | 'event' | 'gamble' | 'organization' | 'user'
  ownerId: number
  chapterNumber?: number
  purpose: 'gallery' | 'entity_display'
  submittedBy: {
    id: number
    username: string
  }
  createdAt: string
  character?: { id: number; name: string }
  arc?: { id: number; name: string }
  event?: { id: number; title: string }
  gamble?: { id: number; name: string }
  organization?: { id: number; name: string }
}

interface MediaPageContentProps {
  initialPage: number
  initialType?: string
  initialOwnerType?: 'character' | 'arc' | 'event' | 'gamble' | 'organization' | 'user'
  initialOwnerId?: number
  initialSearch?: string
}

const ITEMS_PER_PAGE = 24 // Increased for infinite scroll

export default function MediaPageContent({
  initialPage,
  initialType,
  initialOwnerType,
  initialOwnerId,
  initialSearch
}: MediaPageContentProps) {
  const theme = useMantineTheme()
  const accentMedia = getEntityThemeColor(theme, 'media')

  const [media, setMedia] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null)
  const [viewerOpen, setViewerOpen] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [imageDimensions, setImageDimensions] = useState<Record<number, { width: number; height: number }>>({})
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set())
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hoveredMediaId, setHoveredMediaId] = useState<number | null>(null)

  // Intersection observer for infinite scroll
  const { ref: loadMoreRef, entry } = useIntersection({ threshold: 0.5 })

  // Filters
  const [currentPage, setCurrentPage] = useState(initialPage)
  const [searchValue, setSearchValue] = useState(initialSearch || '')
  const [debouncedSearch] = useDebouncedValue(searchValue, 300)
  const [selectedType, setSelectedType] = useState(initialType || 'all')
  const [selectedOwnerType, setSelectedOwnerType] = useState(initialOwnerType || 'all')
  const [selectedPurpose, setSelectedPurpose] = useState<string>('gallery')

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

  // Initial load
  useEffect(() => {
    setCurrentPage(1)
    setHasMore(true)
    fetchMedia(1, false)
  }, [selectedType, selectedOwnerType, selectedPurpose, debouncedSearch, fetchMedia])

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
  }, [])

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleMediaClick = (item: MediaItem, index: number) => {
    setSelectedMedia(item)
    setCurrentIndex(index)
    setViewerOpen(true)
  }

  const handleCloseViewer = () => {
    setViewerOpen(false)
    setSelectedMedia(null)
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1
      setCurrentIndex(newIndex)
      setSelectedMedia(media[newIndex])
    }
  }

  const handleNext = () => {
    if (currentIndex < media.length - 1) {
      const newIndex = currentIndex + 1
      setCurrentIndex(newIndex)
      setSelectedMedia(media[newIndex])
    }
  }

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!viewerOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          handlePrevious()
          break
        case 'ArrowRight':
          handleNext()
          break
        case 'Escape':
          handleCloseViewer()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [viewerOpen, currentIndex, media])

  const handleImageLoad = (itemId: number, event: React.SyntheticEvent<HTMLImageElement>) => {
    const img = event.currentTarget
    setImageDimensions(prev => ({
      ...prev,
      [itemId]: { width: img.naturalWidth, height: img.naturalHeight }
    }))
    setLoadedImages(prev => new Set(prev).add(itemId))
  }

  const getOptimalAspectRatio = (itemId: number) => {
    const dims = imageDimensions[itemId]
    if (!dims) return 1

    const ratio = dims.width / dims.height
    if (ratio > 1.3) return 1.3
    if (ratio < 0.8) return 0.8

    return ratio
  }

  const getMediaThumbnail = (mediaItem: MediaItem) => {
    if (mediaItem.type === 'image') {
      return mediaItem.isUploaded
        ? `${process.env.NEXT_PUBLIC_API_URL}/media/${mediaItem.fileName}`
        : mediaItem.url
    }

    if (mediaItem.type === 'video') {
      if (mediaItem.url.includes('youtube.com') || mediaItem.url.includes('youtu.be')) {
        const videoId = extractYouTubeVideoId(mediaItem.url)
        if (videoId) {
          return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
        }
      }
    }

    return null
  }

  const extractYouTubeVideoId = (url: string): string | null => {
    const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
    const match = url.match(regExp)
    return match ? match[1] : null
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

  const getEntityName = (item: MediaItem) => {
    if (item.character) return item.character.name
    if (item.arc) return item.arc.name
    if (item.event) return item.event.title
    if (item.gamble) return item.gamble.name
    if (item.organization) return item.organization.name
    if (item.ownerType === 'user') return item.submittedBy.username
    return 'Unknown'
  }

  const getEntityUrl = (item: MediaItem) => {
    if (item.character) return `/characters/${item.character.id}`
    if (item.arc) return `/arcs/${item.arc.id}`
    if (item.event) return `/events/${item.event.id}`
    if (item.gamble) return `/gambles/${item.gamble.id}`
    if (item.organization) return `/organizations/${item.organization.id}`
    if (item.ownerType === 'user') return `/users/${item.ownerId}`
    return '#'
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
    const filters: Array<{ key: string; label: string; onClear: () => void }> = []

    if (searchValue.trim()) {
      filters.push({
        key: 'search',
        label: `Keyword: ${searchValue.trim()}`,
        onClear: () => setSearchValue('')
      })
    }

    if (selectedType !== 'all') {
      filters.push({
        key: 'type',
        label: `Type: ${selectedType}`,
        onClear: () => setSelectedType('all')
      })
    }

    if (selectedOwnerType !== 'all') {
      filters.push({
        key: 'owner',
        label: `Content: ${selectedOwnerType}`,
        onClear: () => setSelectedOwnerType('all')
      })
    }

    if (selectedPurpose !== 'gallery') {
      filters.push({
        key: 'purpose',
        label: 'Official media',
        onClear: () => setSelectedPurpose('gallery')
      })
    }

    return filters
  }, [searchValue, selectedType, selectedOwnerType, selectedPurpose])

  const hasActiveFilters = activeFilters.length > 0
  const totalLabel = total === 1 ? 'item' : 'items'
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
      <Stack gap="md">
        <Box p="md" style={getHeroStyles(theme, accentMedia)}>
          <Stack align="center" gap="sm">
            <Box
              style={{
                background: `linear-gradient(135deg, ${accentMedia}, ${accentMedia}CC)`,
                borderRadius: '50%',
                width: rem(40),
                height: rem(40),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 10px 30px ${accentMedia}40`
              }}
            >
              <ImageIcon size={20} color="#ffffff" />
            </Box>

            <Stack align="center" gap={4} maw={520} ta="center">
              <Title order={1} size="1.5rem" fw={700} c="#ffffff">
                Media Gallery
              </Title>
              <Text size="sm" c="dimmed">
                Community fanart, videos, and official artwork celebrating Usogui.
              </Text>
              <Group gap={6} justify="center">
                <Badge
                  size="sm"
                  variant="light"
                  radius="sm"
                  c={accentMedia}
                  style={{ backgroundColor: `${accentMedia}20` }}
                >
                  {total.toLocaleString()} {totalLabel}
                </Badge>
                <Button
                  component={Link}
                  href="/submit-media"
                  size="xs"
                  radius="sm"
                  variant="outline"
                  color="grape"
                  leftSection={<Upload size={14} />}
                >
                  Submit Media
                </Button>
              </Group>
            </Stack>
          </Stack>
        </Box>

        <Container size="lg" px="md">
          <Paper
            withBorder
            radius="md"
            p="md"
            style={{ background: backgroundStyles.card, borderColor: `${accentMedia}25` }}
          >
            <Stack gap="md">
              <Group gap="md" wrap="wrap">
                <Box style={{ flex: '1 1 280px', minWidth: '200px' }}>
                  <TextInput
                    placeholder="Search descriptions..."
                    leftSection={<Search size={16} />}
                    value={searchValue}
                    onChange={(e) => {
                      const value = e.target.value
                      setSearchValue(value)
                      // Immediately trigger search when cleared
                      if (value.trim() === '' && searchValue.trim() !== '') {
                        setCurrentPage(1)
                        setHasMore(true)
                      }
                    }}
                    rightSection={
                      searchValue && (
                        <ActionIcon
                          size="sm"
                          variant="subtle"
                          onClick={() => {
                            setSearchValue('')
                            setCurrentPage(1)
                            setHasMore(true)
                          }}
                          style={{ color: accentMedia }}
                        >
                          <X size={14} />
                        </ActionIcon>
                      )
                    }
                    styles={{
                      input: {
                        backgroundColor: backgroundStyles.input,
                        border: `1px solid ${accentMedia}30`,
                        color: '#ffffff',
                        '&:focus': {
                          borderColor: accentMedia
                        }
                      }
                    }}
                  />
                </Box>

                <Group gap="sm" wrap="wrap">
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
                    w={140}
                    styles={{
                      input: {
                        backgroundColor: backgroundStyles.input,
                        border: `1px solid ${accentMedia}30`,
                        color: '#ffffff'
                      },
                      dropdown: {
                        backgroundColor: backgroundStyles.card
                      }
                    }}
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
                    w={160}
                    styles={{
                      input: {
                        backgroundColor: backgroundStyles.input,
                        border: `1px solid ${accentMedia}30`,
                        color: '#ffffff'
                      },
                      dropdown: {
                        backgroundColor: backgroundStyles.card
                      }
                    }}
                  />

                  <Select
                    data={[
                      { value: 'gallery', label: 'Community' },
                      { value: 'entity_display', label: 'Official' }
                    ]}
                    value={selectedPurpose}
                    onChange={(value) => setSelectedPurpose(value || 'gallery')}
                    placeholder="Source"
                    w={130}
                    styles={{
                      input: {
                        backgroundColor: backgroundStyles.input,
                        border: `1px solid ${accentMedia}30`,
                        color: '#ffffff'
                      },
                      dropdown: {
                        backgroundColor: backgroundStyles.card
                      }
                    }}
                  />

                  {hasActiveFilters && (
                    <Button
                      variant="light"
                      size="sm"
                      onClick={handleClearFilters}
                      color="grape"
                      leftSection={<X size={14} />}
                    >
                      Clear
                    </Button>
                  )}
                </Group>
              </Group>

              {(media.length > 0 || total > 0) && (
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
              )}
            </Stack>
          </Paper>
        </Container>

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
              <Group justify="center" py="xl">
                <Loader size="lg" color={accentMedia} />
              </Group>
            ) : (
              <>
                {media.length === 0 ? (
                  <Paper p="md" radius="md" withBorder ta="center" style={{ background: backgroundStyles.card, borderColor: `${accentMedia}25` }}>
                    <Stack gap="md" align="center">
                      <ImageIcon size={40} style={{ color: accentMedia, opacity: 0.6 }} />
                      <Stack gap="xs" align="center">
                        <Text fw={600}>No media found</Text>
                        <Text size="sm" c="dimmed">
                          Try adjusting your filters or search terms
                        </Text>
                      </Stack>
                      <Button variant="light" color="grape" size="sm" onClick={handleClearFilters} leftSection={<X size={14} />}>
                        Reset filters
                      </Button>
                    </Stack>
                  </Paper>
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
                    <Box className="masonry-grid">
                      <style>{`
                        .masonry-grid { column-count: 5; column-gap: 12px; }
                        @media (max-width: 1400px) { .masonry-grid { column-count: 4; } }
                        @media (max-width: 1100px) { .masonry-grid { column-count: 3; } }
                        @media (max-width: 768px) { .masonry-grid { column-count: 2; } }
                        .masonry-item { break-inside: avoid; margin-bottom: 12px; }
                      `}</style>
                      {media.map((item, index) => {
                        const thumbnail = getMediaThumbnail(item)
                        const ownerLabel = item.ownerType === 'user'
                          ? 'Community'
                          : item.ownerType
                        const isHovered = hoveredMediaId === item.id

                        return (
                          <Card
                            key={item.id}
                            className="masonry-item"
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
                                <img
                                  src={thumbnail}
                                  alt={item.description || 'Media item'}
                                  style={{
                                    width: '100%',
                                    height: 'auto',
                                    display: 'block'
                                  }}
                                  onLoad={(e) => handleImageLoad(item.id, e)}
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement
                                    target.style.display = 'none'
                                  }}
                                />

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
                                >
                                  <ExternalLink size={12} />
                                </ActionIcon>
                              </Box>
                            ) : (
                              <Box
                                style={{
                                  background: `${accentMedia}10`,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  width: '100%',
                                  height: rem(150)
                                }}
                              >
                                {getMediaTypeIcon(item.type)}
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

      <Modal
        opened={viewerOpen}
        onClose={handleCloseViewer}
        size="90%"
        centered
        withCloseButton={false}
        padding={0}
        overlayProps={{ opacity: 0.9, color: '#000' }}
      >
        {selectedMedia && (
          <Box style={{ position: 'relative' }}>
            <ActionIcon
              variant="subtle"
              size="lg"
              onClick={handleCloseViewer}
              style={{
                position: 'absolute',
                top: rem(16),
                right: rem(16),
                zIndex: 1000,
                backgroundColor: 'rgba(0,0,0,0.7)',
                color: 'white'
              }}
            >
              <X size={20} />
            </ActionIcon>

            {currentIndex > 0 && (
              <ActionIcon
                variant="subtle"
                size="lg"
                onClick={handlePrevious}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: rem(16),
                  transform: 'translateY(-50%)',
                  zIndex: 1000,
                  backgroundColor: 'rgba(0,0,0,0.7)',
                  color: 'white'
                }}
              >
                <ChevronLeft size={24} />
              </ActionIcon>
            )}

            {currentIndex < media.length - 1 && (
              <ActionIcon
                variant="subtle"
                size="lg"
                onClick={handleNext}
                style={{
                  position: 'absolute',
                  top: '50%',
                  right: rem(16),
                  transform: 'translateY(-50%)',
                  zIndex: 1000,
                  backgroundColor: 'rgba(0,0,0,0.7)',
                  color: 'white'
                }}
              >
                <ChevronRight size={24} />
              </ActionIcon>
            )}

            <Stack gap={0}>
              <Box style={{ maxHeight: '70vh', overflow: 'hidden' }}>
                {selectedMedia.type === 'image' ? (
                  <Image
                    src={selectedMedia.url}
                    alt={selectedMedia.description || 'Media preview'}
                    fit="contain"
                    fallbackSrc="/images/placeholder-media.png"
                  />
                ) : selectedMedia.type === 'video' ? (
                  selectedMedia.url.includes('youtube.com') || selectedMedia.url.includes('youtu.be') ? (
                    <iframe
                      src={selectedMedia.url.replace('watch?v=', 'embed/')}
                      title={selectedMedia.description}
                      allowFullScreen
                      style={{ width: '100%', minHeight: '60vh', border: 'none' }}
                    />
                  ) : (
                    <video controls style={{ width: '100%', maxHeight: '70vh' }}>
                      <source src={selectedMedia.url} />
                      Your browser does not support the video tag.
                    </video>
                  )
                ) : (
                  <Box
                    p="xl"
                    ta="center"
                    style={{
                      minHeight: '300px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'rgba(0,0,0,0.1)'
                    }}
                  >
                    {getMediaTypeIcon(selectedMedia.type)}
                    <Text ml="md">Media type not supported for preview</Text>
                  </Box>
                )}
              </Box>

              <Paper p="md" radius={0}>
                <Stack gap="md">
                  <Group justify="space-between" align="flex-start">
                    <Stack gap="xs" style={{ flex: 1 }}>
                      <Group gap="xs" align="center">
                        <Badge
                          variant="light"
                          c={getOwnerTypeColor(selectedMedia.ownerType)}
                          size="sm"
                          style={{
                            backgroundColor: `${getOwnerTypeColor(selectedMedia.ownerType)}20`,
                            borderColor: getOwnerTypeColor(selectedMedia.ownerType)
                          }}
                        >
                          {selectedMedia.ownerType}
                        </Badge>
                        <Badge
                          variant="outline"
                          size="sm"
                          c={accentMedia}
                          style={{ borderColor: accentMedia }}
                        >
                          {selectedMedia.type}
                        </Badge>
                        {selectedMedia.chapterNumber && (
                          <Badge
                            variant="outline"
                            size="sm"
                            c={getEntityThemeColor(theme, 'organization')}
                            style={{ borderColor: getEntityThemeColor(theme, 'organization') }}
                          >
                            Chapter {selectedMedia.chapterNumber}
                          </Badge>
                        )}
                      </Group>

                      {selectedMedia.description && (
                        <Text size="sm" fw={500}>
                          {selectedMedia.description}
                        </Text>
                      )}

                      <Group gap="md" align="center">
                        <Group gap="xs" align="center">
                          <User size={14} />
                          <Text size="sm" style={{ color: theme.colors.gray[6] }}>
                            Submitted by {selectedMedia.submittedBy.username}
                          </Text>
                        </Group>

                        {selectedMedia.createdAt && (
                          <Group gap="xs" align="center">
                            <Calendar size={14} />
                            <Text size="sm" style={{ color: theme.colors.gray[6] }}>
                              {new Date(selectedMedia.createdAt).toLocaleDateString()}
                            </Text>
                          </Group>
                        )}
                      </Group>

                      {(selectedMedia.character || selectedMedia.arc || selectedMedia.event || selectedMedia.gamble || selectedMedia.organization) && (
                        <Group gap="xs" align="center">
                          <Text size="sm" style={{ color: theme.colors.gray[6] }}>Related to:</Text>
                          <Anchor
                            href={getEntityUrl(selectedMedia)}
                            size="sm"
                            style={{ color: getOwnerTypeColor(selectedMedia.ownerType) }}
                          >
                            {getEntityName(selectedMedia)}
                          </Anchor>
                        </Group>
                      )}
                    </Stack>

                    <Group gap="xs">
                      <ActionIcon
                        variant="light"
                        component="a"
                        href={selectedMedia.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink size={16} />
                      </ActionIcon>
                    </Group>
                  </Group>
                </Stack>
              </Paper>
            </Stack>
          </Box>
        )}
      </Modal>
    </Box>
  )
}
