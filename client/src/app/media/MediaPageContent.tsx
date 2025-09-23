'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Title,
  Text,
  Group,
  Select,
  TextInput,
  Button,
  SimpleGrid,
  Card,
  Badge,
  AspectRatio,
  ActionIcon,
  Loader,
  Stack,
  Pagination,
  Alert,
  Box,
  Paper,
  useMantineTheme,
  rem,
  Modal,
  Image,
  Anchor
} from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'
import {
  Search,
  Filter,
  Image as ImageIcon,
  Play,
  Volume2,
  ExternalLink,
  User,
  Calendar,
  X,
  ChevronLeft,
  ChevronRight,
  Maximize2
} from 'lucide-react'
import Link from 'next/link'
import { api } from '../../lib/api'
import { getEntityThemeColor } from '../../lib/mantine-theme'
import MediaGallery from '../../components/MediaGallery'
import { useProgress } from '../../providers/ProgressProvider'

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
  // Related entity info
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

const ITEMS_PER_PAGE = 24

export default function MediaPageContent({
  initialPage,
  initialType,
  initialOwnerType,
  initialOwnerId,
  initialSearch
}: MediaPageContentProps) {
  const theme = useMantineTheme()
  const { userProgress } = useProgress()

  const [media, setMedia] = useState<MediaItem[]>([])
  const [allMedia, setAllMedia] = useState<MediaItem[]>([]) // Store all media for client-side filtering
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null)
  const [viewerOpen, setViewerOpen] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [imageDimensions, setImageDimensions] = useState<Record<number, { width: number; height: number }>>({})
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set())

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

  const fetchMedia = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const params: any = {
        page: currentPage,
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

      const response = await api.getApprovedMedia(params)
      const fetchedMedia = response.data || []

      // Store all media for client-side filtering
      setAllMedia(fetchedMedia)
      setMedia(fetchedMedia)
      setTotalPages(response.totalPages || 1)
      setTotal(fetchedMedia.length)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load media')
      setMedia([])
    } finally {
      setLoading(false)
    }
  }, [currentPage, selectedType, selectedOwnerType, selectedPurpose, initialOwnerId])

  useEffect(() => {
    fetchMedia()
  }, [fetchMedia])

  // Separate effect for client-side search filtering
  useEffect(() => {
    if (allMedia.length > 0) {
      let filteredMedia = allMedia
      if (debouncedSearch && debouncedSearch.trim()) {
        const searchTerm = debouncedSearch.toLowerCase()
        filteredMedia = allMedia.filter(item =>
          item.description?.toLowerCase().includes(searchTerm) ||
          item.submittedBy?.username?.toLowerCase().includes(searchTerm) ||
          getEntityName(item).toLowerCase().includes(searchTerm)
        )
      }
      setMedia(filteredMedia)
      setTotal(filteredMedia.length)

      // Reset to page 1 when search changes
      if (currentPage !== 1) {
        setCurrentPage(1)
      }
    }
  }, [debouncedSearch, allMedia, currentPage])

  // Reset to page 1 when filters change (non-search filters)
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1)
    }
  }, [selectedType, selectedOwnerType, selectedPurpose])

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
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
    if (!dims) return 1 // Default square

    const ratio = dims.width / dims.height

    // Constrain to more compact ratios
    if (ratio > 1.3) return 1.3 // Max 1.3:1 (slightly wide)
    if (ratio < 0.8) return 0.8 // Max 1:1.25 (slightly tall)

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
      default:
        return getEntityThemeColor(theme, 'media')
    }
  }

  const getEntityName = (item: MediaItem) => {
    if (item.character) return item.character.name
    if (item.arc) return item.arc.name
    if (item.event) return item.event.title
    if (item.gamble) return item.gamble.name
    if (item.organization) return item.organization.name
    return 'Unknown'
  }

  const getEntityUrl = (item: MediaItem) => {
    if (item.character) return `/characters/${item.character.id}`
    if (item.arc) return `/arcs/${item.arc.id}`
    if (item.event) return `/events/${item.event.id}`
    if (item.gamble) return `/gambles/${item.gamble.id}`
    if (item.organization) return `/organizations/${item.organization.id}`
    return '#'
  }

  return (
    <Stack gap="xl">
      {/* Header */}
      <Stack gap="md">
        <Group justify="space-between" align="flex-end">
          <Stack gap="xs">
            <Title order={1} size="h1" style={{ color: getEntityThemeColor(theme, 'media') }}>
              Media Gallery
            </Title>
            <Text c="dimmed">
              Browse community-submitted fanart, videos, and other media related to Usogui
            </Text>
          </Stack>

          <Group gap="xs">
            <Text size="sm" c="dimmed">
              {total} {total === 1 ? 'item' : 'items'}
            </Text>
          </Group>
        </Group>
      </Stack>

      {/* Filters */}
      <Paper p="md" radius="md" withBorder>
        <Group gap="md" align="flex-end">
          <TextInput
            placeholder="Search media descriptions..."
            leftSection={<Search size={16} />}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            style={{ flex: 1, minWidth: 200 }}
          />

          <Select
            data={[
              { value: 'all', label: 'All Types' },
              { value: 'image', label: 'Images' },
              { value: 'video', label: 'Videos' },
              { value: 'audio', label: 'Audio' }
            ]}
            value={selectedType}
            onChange={(value) => setSelectedType(value || 'all')}
            placeholder="Media Type"
            leftSection={getMediaTypeIcon(selectedType)}
            w={140}
          />

          <Select
            data={[
              { value: 'all', label: 'All Content' },
              { value: 'character', label: 'Characters' },
              { value: 'arc', label: 'Arcs' },
              { value: 'event', label: 'Events' },
              { value: 'gamble', label: 'Gambles' },
              { value: 'organization', label: 'Organizations' }
            ]}
            value={selectedOwnerType}
            onChange={(value) => setSelectedOwnerType(value as any || 'all')}
            placeholder="Content Type"
            w={140}
          />

          <Select
            data={[
              { value: 'gallery', label: 'Community Media' },
              { value: 'entity_display', label: 'Official Media' }
            ]}
            value={selectedPurpose}
            onChange={(value) => setSelectedPurpose(value || 'gallery')}
            placeholder="Purpose"
            w={160}
          />
        </Group>
      </Paper>

      {/* Error State */}
      {error && (
        <Alert color="red" title="Error loading media">
          {error}
        </Alert>
      )}

      {/* Loading State */}
      {loading && (
        <Group justify="center" py="xl">
          <Loader size="lg" style={{ color: getEntityThemeColor(theme, 'media') }} />
        </Group>
      )}

      {/* Media Grid */}
      {!loading && !error && media.length > 0 && (
        <SimpleGrid cols={{ base: 3, sm: 4, md: 6, lg: 8, xl: 10 }} spacing="xs">
          {media.map((item, index) => {
            const thumbnail = getMediaThumbnail(item)
            const aspectRatio = getOptimalAspectRatio(item.id)
            const isImageLoaded = loadedImages.has(item.id)

            return (
              <Card
                key={item.id}
                withBorder
                radius="sm"
                shadow="xs"
                p={0}
                style={{
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  height: 'auto'
                }}
                onClick={() => handleMediaClick(item, index)}
              >
                <AspectRatio ratio={isImageLoaded ? aspectRatio : 1}>
                  {thumbnail ? (
                    <Box style={{ position: 'relative' }}>
                      <img
                        src={thumbnail}
                        alt={item.description}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          transition: 'opacity 0.3s ease'
                        }}
                        onLoad={(e) => handleImageLoad(item.id, e)}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.style.display = 'none'
                          const fallback = document.createElement('div')
                          fallback.style.cssText = `
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            background: rgba(0,0,0,0.1);
                            width: 100%;
                            height: 100%;
                            border-radius: 8px;
                          `
                          fallback.innerHTML = item.type === 'image'
                            ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>'
                            : '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5,3 19,12 5,21 5,3"/></svg>'
                          target.parentElement?.appendChild(fallback)
                        }}
                      />
                      {item.type === 'video' && (
                        <Box
                          style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            backgroundColor: 'rgba(0,0,0,0.7)',
                            borderRadius: '50%',
                            padding: rem(4),
                            color: 'white'
                          }}
                        >
                          <Play size={14} />
                        </Box>
                      )}
                      <Badge
                        variant="light"
                        color={getOwnerTypeColor(item.ownerType)}
                        size="xs"
                        style={{
                          position: 'absolute',
                          top: rem(2),
                          left: rem(2),
                          fontSize: '7px',
                          padding: '1px 4px',
                          height: '14px',
                          minHeight: '14px'
                        }}
                      >
                        {item.ownerType}
                      </Badge>
                      <ActionIcon
                        variant="subtle"
                        size="xs"
                        component="a"
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          position: 'absolute',
                          top: rem(2),
                          right: rem(2),
                          backgroundColor: 'rgba(0,0,0,0.7)',
                          color: 'white',
                          width: '16px',
                          height: '16px',
                          minWidth: '16px',
                          minHeight: '16px'
                        }}
                      >
                        <ExternalLink size={8} />
                      </ActionIcon>
                    </Box>
                  ) : (
                    <Box
                      style={{
                        background: 'rgba(0,0,0,0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: rem(8)
                      }}
                    >
                      {getMediaTypeIcon(item.type)}
                    </Box>
                  )}
                </AspectRatio>

                <Stack gap={2} p={4}>
                  <Group justify="space-between" align="center" gap={2}>
                    <Group gap={2} align="center">
                      <User size={8} />
                      <Text size="xs" c="dimmed" style={{ fontSize: '8px' }} truncate>
                        {item.submittedBy.username}
                      </Text>
                    </Group>

                    {item.chapterNumber && (
                      <Badge variant="outline" size="xs" style={{ fontSize: '7px', padding: '1px 3px', height: '12px', minHeight: '12px' }}>
                        Ch. {item.chapterNumber}
                      </Badge>
                    )}
                  </Group>
                </Stack>
              </Card>
            )
          })}
        </SimpleGrid>
      )}

      {/* Empty State */}
      {!loading && !error && media.length === 0 && (
        <Paper p="xl" radius="md" withBorder ta="center">
          <Stack gap="md" align="center">
            <ImageIcon size={48} style={{ color: getEntityThemeColor(theme, 'media'), opacity: 0.5 }} />
            <Stack gap="xs" align="center">
              <Text fw={500}>No media found</Text>
              <Text size="sm" c="dimmed">
                Try adjusting your filters or search terms
              </Text>
            </Stack>
            <Button
              variant="light"
              color={getEntityThemeColor(theme, 'media')}
              onClick={() => {
                setSearchValue('')
                setSelectedType('all')
                setSelectedOwnerType('all')
                setSelectedPurpose('gallery')
                setCurrentPage(1)
              }}
            >
              Clear filters
            </Button>
          </Stack>
        </Paper>
      )}

      {/* Pagination */}
      {!loading && !error && totalPages > 1 && (
        <Group justify="center" py="md">
          <Pagination
            value={currentPage}
            onChange={handlePageChange}
            total={totalPages}
            color={getEntityThemeColor(theme, 'media')}
            size="md"
          />
        </Group>
      )}

      {/* Media Viewer Modal */}
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
            {/* Close Button */}
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

            {/* Navigation Buttons */}
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

            {/* Media Content */}
            <Stack gap={0}>
              <Box style={{ maxHeight: '70vh', overflow: 'hidden' }}>
                {selectedMedia.type === 'image' ? (
                  <Image
                    src={getMediaThumbnail(selectedMedia) || selectedMedia.url}
                    alt={selectedMedia.description}
                    style={{
                      width: '100%',
                      height: 'auto',
                      maxHeight: '70vh',
                      objectFit: 'contain'
                    }}
                  />
                ) : selectedMedia.type === 'video' ? (
                  selectedMedia.url.includes('youtube.com') || selectedMedia.url.includes('youtu.be') ? (
                    <Box style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
                      <iframe
                        src={`https://www.youtube.com/embed/${extractYouTubeVideoId(selectedMedia.url)}`}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          border: 'none'
                        }}
                        allowFullScreen
                      />
                    </Box>
                  ) : (
                    <video
                      controls
                      style={{
                        width: '100%',
                        maxHeight: '70vh'
                      }}
                    >
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

              {/* Media Info */}
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
                          c={getEntityThemeColor(theme, 'media')}
                          style={{ borderColor: getEntityThemeColor(theme, 'media') }}
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
                          <Text size="sm" c="dimmed">
                            Submitted by {selectedMedia.submittedBy.username}
                          </Text>
                        </Group>

                        {selectedMedia.createdAt && (
                          <Group gap="xs" align="center">
                            <Calendar size={14} />
                            <Text size="sm" c="dimmed">
                              {new Date(selectedMedia.createdAt).toLocaleDateString()}
                            </Text>
                          </Group>
                        )}
                      </Group>

                      {(selectedMedia.character || selectedMedia.arc || selectedMedia.event || selectedMedia.gamble || selectedMedia.organization) && (
                        <Group gap="xs" align="center">
                          <Text size="sm" c="dimmed">Related to:</Text>
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
    </Stack>
  )
}