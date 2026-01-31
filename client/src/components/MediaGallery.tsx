'use client'

import React, { useEffect, useMemo, useState } from 'react'
import {
  ActionIcon,
  Alert,
  AspectRatio,
  Badge,
  Box,
  Button,
  Card,
  Group,
  Loader,
  Modal,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  Text,
  Transition,
  rem,
  useMantineTheme,
  rgba
} from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import { getEntityThemeColor, semanticColors, textColors } from '../lib/mantine-theme'
import {
  Image as ImageIcon,
  Play,
  ExternalLink,
  X,
  ZoomIn,
  ChevronLeft,
  ChevronRight,
  Maximize2
} from 'lucide-react'
import NextImage from 'next/image'
import { api } from '../lib/api'
import { API_BASE_URL } from '../lib/api'
import {
  extractYouTubeVideoId,
  extractVimeoVideoId,
  getYouTubeThumbnail,
  getYouTubeEmbedUrlEnhanced,
  getVimeoEmbedUrlEnhanced,
  isYouTubeUrl,
  isDirectVideoUrl,
  canEmbedVideo as canEmbedVideoUtil
} from '../lib/video-utils'

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
  status?: string
  isApproved?: boolean
}

interface MediaGalleryProps {
  ownerType?: 'character' | 'arc' | 'event' | 'gamble' | 'organization' | 'user' | 'volume' | 'chapter' | 'guide' | 'quote'
  ownerId?: number
  purpose?: 'gallery' | 'entity_display'
  limit?: number
  showTitle?: boolean
  compactMode?: boolean
  showFilters?: boolean
  allowMultipleTypes?: boolean
  // Legacy support - will be converted to polymorphic
  characterId?: number
  arcId?: number
  hideWhenEmpty?: boolean
  onMediaLoaded?: (items: MediaItem[]) => void
}

const MAX_DIALOG_WIDTH = 1280

const mediaTypeOptions = [
  { value: 'all', label: 'All Types' },
  { value: 'image', label: 'Images' },
  { value: 'video', label: 'Videos' },
  { value: 'audio', label: 'Audio' }
]

// Helper function to detect external URLs that aren't in our allowed domains
function isExternalUrl(url: string): boolean {
  try {
    const urlObj = new URL(url)
    const hostname = urlObj.hostname

    // List of our hosted/allowed domains that should use Next.js Image optimization
    const hostedDomains = [
      'localhost',
      'backblazeb2.com',
      'l-file.com'
    ]

    // Check if it's a hosted domain
    return !hostedDomains.some(domain => hostname.includes(domain))
  } catch {
    // If URL parsing fails, treat as relative URL (not external)
    return false
  }
}

export default function MediaGallery({
  ownerType,
  ownerId,
  purpose,
  characterId,
  arcId,
  limit = 12,
  showTitle = true,
  compactMode = false,
  showFilters = false,
  allowMultipleTypes = true,
  hideWhenEmpty = false,
  onMediaLoaded
}: MediaGalleryProps) {
  const theme = useMantineTheme()
  const isMobile = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`)
  const isTablet = useMediaQuery(`(max-width: ${theme.breakpoints.md})`)
  const isLaptop = useMediaQuery(`(max-width: ${theme.breakpoints.lg})`)

  // Determine column count based on screen size
  const getColumnCount = () => {
    if (compactMode) return isMobile ? 2 : isTablet ? 2 : 3
    if (isMobile) return 2
    if (isTablet) return 3
    if (isLaptop) return 4
    return 5
  }

  const palette = useMemo(() => {
    const baseBlack = theme.other?.usogui?.black ?? '#0a0a0a'
    const accent = theme.other?.usogui?.red ?? theme.colors.red?.[5] ?? '#e11d48'
    const secondaryAccent = theme.other?.usogui?.purple ?? theme.colors.violet?.[6] ?? '#7c3aed'

    return {
      panel: rgba(baseBlack, 0.95),
      border: '1px solid rgba(225, 29, 72, 0.2)',
      accent,
      secondaryAccent
    }
  }, [theme])

  const [media, setMedia] = useState<MediaItem[]>([])
  const [filteredMedia, setFilteredMedia] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [imageZoomed, setImageZoomed] = useState(false)
  const [shouldLoadVideo, setShouldLoadVideo] = useState(false)
  const [hoveredMediaId, setHoveredMediaId] = useState<number | null>(null)
  const [failedImageIds, setFailedImageIds] = useState<Set<number>>(new Set())
  const [touchStart, setTouchStart] = useState<number | null>(null)

  const handleImageError = (mediaId: number) => {
    setFailedImageIds(prev => new Set(prev).add(mediaId))
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX)
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return
    const touchEnd = e.changedTouches[0].clientX
    const diff = touchStart - touchEnd
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        handleNext()
      } else {
        handlePrevious()
      }
    }
    setTouchStart(null)
  }

  // Filter state
  const [selectedMediaType, setSelectedMediaType] = useState<string>('all')
  const [selectedCharacter, setSelectedCharacter] = useState<string>('all')
  const [selectedArc, setSelectedArc] = useState<string>('all')

  useEffect(() => {
    const fetchMedia = async () => {
    try {
      setLoading(true)

      let finalOwnerType = ownerType
      let finalOwnerId = ownerId

      if (finalOwnerType === ('organization' as any)) {
        finalOwnerType = 'organization'
      }

      if (!finalOwnerType && !finalOwnerId) {
        if (characterId && !isNaN(characterId) && characterId > 0) {
          finalOwnerType = 'character'
          finalOwnerId = characterId
        } else if (arcId && !isNaN(arcId) && arcId > 0) {
          finalOwnerType = 'arc'
          finalOwnerId = arcId
        }
      }

      if (finalOwnerId && (isNaN(finalOwnerId) || finalOwnerId <= 0)) {
        setError('Invalid entity ID for media')
        onMediaLoaded?.([])
        return
      }

      // Use the same API approach as the main media page
      const params: any = {
        page: 1,
        limit,
        purpose: purpose || 'gallery'
      }

      // Add entity filtering if we have entity info
      if (finalOwnerType && finalOwnerId) {
        params.ownerType = finalOwnerType
        params.ownerId = finalOwnerId
      }

      const response = await api.getApprovedMedia(params)

      setMedia(response.data)
      setFilteredMedia(response.data)
      onMediaLoaded?.(response.data)
    } catch (fetchError: any) {
      console.error('Failed to fetch media:', fetchError)
      setError(fetchError?.message || 'Failed to load media')
      onMediaLoaded?.([])
    } finally {
      setLoading(false)
    }
  }

    fetchMedia()
  }, [ownerType, ownerId, purpose, characterId, arcId, limit, onMediaLoaded])

  useEffect(() => {
    let filtered = [...media]

    if (selectedMediaType !== 'all') {
      filtered = filtered.filter((item) => item.type === selectedMediaType)
    }

    setFilteredMedia(filtered)
  }, [media, selectedMediaType])

  const handleMediaClick = (mediaItem: MediaItem) => {
    const mediaIndex = filteredMedia.findIndex((m) => m.id === mediaItem.id)
    setCurrentImageIndex(mediaIndex)
    setSelectedMedia(mediaItem)
    setDialogOpen(true)
    setImageZoomed(false)
    setShouldLoadVideo(false)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setSelectedMedia(null)
    setImageZoomed(false)
    setShouldLoadVideo(false)
  }

  const handlePrevious = () => {
    if (currentImageIndex > 0) {
      const newIndex = currentImageIndex - 1
      setCurrentImageIndex(newIndex)
      setSelectedMedia(filteredMedia[newIndex])
      setImageZoomed(false)
      setShouldLoadVideo(false)
    }
  }

  const handleNext = () => {
    if (currentImageIndex < filteredMedia.length - 1) {
      const newIndex = currentImageIndex + 1
      setCurrentImageIndex(newIndex)
      setSelectedMedia(filteredMedia[newIndex])
      setImageZoomed(false)
      setShouldLoadVideo(false)
    }
  }

  const handleImageZoom = () => {
    setImageZoomed((prev) => !prev)
  }

  const handleLoadVideo = () => {
    setShouldLoadVideo(true)
  }

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!dialogOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          handlePrevious()
          break
        case 'ArrowRight':
          handleNext()
          break
        case 'Escape':
          handleCloseDialog()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [dialogOpen])

  const getMediaThumbnail = (mediaItem: MediaItem) => {

    if (mediaItem.type === 'image') {
      // For uploaded images, use the API endpoint
      if (mediaItem.isUploaded) {
        const thumbnailUrl = `${API_BASE_URL}/media/${mediaItem.fileName}`
        return thumbnailUrl
      }

      // For external images, we need to handle different services
      const url = mediaItem.url
      // Check if it's a direct image URL (including DeviantArt CDN URLs)
      if (url.match(/\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i) ||
          url.includes('images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com') ||
          url.includes('i.pximg.net')) {
        return url
      }

      // For page URLs from DeviantArt or Pixiv, return null to show fallback
      if (url.includes('deviantart.com/') && !url.includes('images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com')) {
        return null
      }

      if (url.includes('pixiv.net/') && !url.includes('i.pximg.net')) {
        return null
      }

      // For other external services that aren't direct images, return null
      return null
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

  const canEmbedVideo = canEmbedVideoUtil

  const getEmbedUrl = (url: string): string | null => {
    const youtubeId = extractYouTubeVideoId(url)
    if (youtubeId) {
      return getYouTubeEmbedUrlEnhanced(youtubeId)
    }

    const vimeoId = extractVimeoVideoId(url)
    if (vimeoId) {
      return getVimeoEmbedUrlEnhanced(vimeoId)
    }

    return null
  }

  const getMediaTypeIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <ImageIcon size={20} />
      case 'video':
        return <Play size={20} />
      default:
        return <ExternalLink size={20} />
    }
  }

  if (loading) {
    return (
      <Box style={{ display: 'flex', justifyContent: 'center', paddingBlock: rem(32) }}>
        <Loader size="lg" style={{ color: getEntityThemeColor(theme, 'gamble') }} />
      </Box>
    )
  }

  if (error) {
    return (
      <Alert style={{ color: getEntityThemeColor(theme, 'gamble') }} variant="light" radius="md">
        {error}
      </Alert>
    )
  }


  if (media.length === 0) {
    if (hideWhenEmpty) {
      return null
    }
    const contextType = ownerType || (characterId ? 'character' : arcId ? 'arc' : 'content')
    return (
      <Stack align="center" gap="xs" py="xl">
        <Text size="lg" fw={600} c="dimmed">
          No Media Found
        </Text>
        <Text size="sm" c="dimmed">
          No approved media has been submitted for this {contextType} yet.
        </Text>
      </Stack>
    )
  }

  return (
    <Box style={{ background: 'transparent' }}>
      {showTitle && (
        <Text
          size={compactMode ? 'lg' : 'xl'}
          fw={600}
          mb="md"
        >
          Media Gallery ({filteredMedia.length}
          {filteredMedia.length !== media.length ? ` of ${media.length}` : ''})
        </Text>
      )}

      {showFilters && (
        <Paper
          p="md"
          mb="md"
          radius="md"
          withBorder
          style={{
            background: palette.panel,
            border: palette.border
          }}
        >
          <Group gap="md" wrap="wrap">
            <Select
              label="Media Type"
              data={mediaTypeOptions}
              value={selectedMediaType}
              onChange={(value) => setSelectedMediaType(value || 'all')}
              size="sm"
              style={{ flex: 1, minWidth: rem(180) }}
            />
            {/* Placeholder for additional filters */}
          </Group>
        </Paper>
      )}

      <Box
        style={{
          columnCount: getColumnCount(),
          columnGap: compactMode ? '8px' : '12px'
        }}
      >
        {filteredMedia.map((mediaItem) => {
          const thumbnail = getMediaThumbnail(mediaItem)
          const isHovered = hoveredMediaId === mediaItem.id
          const ownerLabel = mediaItem.ownerType === 'user' ? 'Community' : mediaItem.ownerType

          return (
            <Card
              key={mediaItem.id}
              padding={0}
              radius="md"
              withBorder
              onClick={() => handleMediaClick(mediaItem)}
              onMouseEnter={() => setHoveredMediaId(mediaItem.id)}
              onMouseLeave={() => setHoveredMediaId(null)}
              style={{
                cursor: 'pointer',
                transition: 'transform 200ms ease, box-shadow 200ms ease',
                transform: isHovered ? 'scale(1.02)' : 'scale(1)',
                boxShadow: isHovered
                  ? '0 12px 28px rgba(225, 29, 72, 0.4)'
                  : theme.shadows.sm,
                overflow: 'hidden',
                backgroundColor: theme.colors.dark?.[6] ?? '#373A40',
                breakInside: 'avoid',
                marginBottom: compactMode ? '8px' : '12px',
                zIndex: isHovered ? 10 : 1,
                position: 'relative'
              }}
            >
              <Box style={{ position: 'relative' }}>
                {(() => {
                  // Get display URL - use thumbnail if available, otherwise try direct media URL
                  let displayUrl = thumbnail
                  if (!displayUrl) {
                    // For items without thumbnail, try the direct URL (works for direct image links)
                    displayUrl = mediaItem.isUploaded
                      ? `${API_BASE_URL}/media/${mediaItem.fileName}`
                      : (mediaItem.type === 'image' ? mediaItem.url : null)
                  }

                  return displayUrl && !failedImageIds.has(mediaItem.id) ? (
                    <Box style={{ position: 'relative', width: '100%' }}>
                      <img
                        src={displayUrl}
                        alt={mediaItem.description || `Media submitted by ${mediaItem.submittedBy.username}`}
                        loading="lazy"
                        style={{
                          width: '100%',
                          height: 'auto',
                          display: 'block'
                        }}
                        onError={() => handleImageError(mediaItem.id)}
                      />

                      {/* Video play overlay */}
                      {mediaItem.type === 'video' && (
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
                        {mediaItem.description && (
                          <Text size="xs" c="white" fw={500} lineClamp={2} mb={6}>
                            {mediaItem.description}
                          </Text>
                        )}
                        <Group gap={6} wrap="wrap">
                          <Badge
                            size="xs"
                            radius="sm"
                            style={{
                              backgroundColor: palette.accent,
                              color: '#fff',
                              textTransform: 'capitalize'
                            }}
                          >
                            {ownerLabel}
                          </Badge>
                          {mediaItem.chapterNumber && (
                            <Badge size="xs" variant="filled" color="dark">
                              Ch. {mediaItem.chapterNumber}
                            </Badge>
                          )}
                        </Group>
                        <Text size="xs" c="dimmed" mt={4}>
                          by {mediaItem.submittedBy.username}
                        </Text>
                      </Box>

                      {/* Always visible badge */}
                      <Badge
                        variant="filled"
                        size="xs"
                        radius="sm"
                        style={{
                          position: 'absolute',
                          top: rem(6),
                          left: rem(6),
                          backgroundColor: palette.accent,
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
                        href={mediaItem.url}
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
                    /* Fallback when no preview available or image failed to load */
                    <Box
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: theme.colors.gray[5],
                        width: '100%',
                        height: rem(150),
                        backgroundColor: 'rgba(0,0,0,0.1)',
                        flexDirection: 'column',
                        gap: rem(8)
                      }}
                    >
                      {getMediaTypeIcon(mediaItem.type)}
                      <Text size="xs" c="dimmed" ta="center">
                        {failedImageIds.has(mediaItem.id) ? 'Failed to load' : 'Click to view'}
                      </Text>
                    </Box>
                  )
                })()}

              </Box>
            </Card>
          )
        })}
      </Box>

      <Modal
        opened={dialogOpen}
        onClose={handleCloseDialog}
        size="90%"
        centered
        withCloseButton={false}
        padding={0}
        overlayProps={{ opacity: 0.9, color: '#000' }}
      >
        {selectedMedia && (
          <Box style={{ position: 'relative' }} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
            <ActionIcon
              variant="subtle"
              size="lg"
              onClick={handleCloseDialog}
              style={{
                position: 'absolute',
                top: rem(16),
                right: rem(16),
                zIndex: 1000,
                backgroundColor: 'rgba(0,0,0,0.7)',
                color: 'white'
              }}
              aria-label="Close viewer"
            >
              <X size={20} />
            </ActionIcon>

            {currentImageIndex > 0 && (
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
                aria-label="Previous image"
              >
                <ChevronLeft size={24} />
              </ActionIcon>
            )}

            {currentImageIndex < filteredMedia.length - 1 && (
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
                aria-label="Next image"
              >
                <ChevronRight size={24} />
              </ActionIcon>
            )}

            <Stack gap={0}>
              <Box style={{ maxHeight: '70vh', overflow: 'hidden' }}>
                {selectedMedia.type === 'image' ? (
                  <NextImage
                    src={selectedMedia.isUploaded
                      ? `${API_BASE_URL}/media/${selectedMedia.fileName}`
                      : selectedMedia.url}
                    alt={selectedMedia.description || 'Media preview'}
                    width={1200}
                    height={800}
                    style={{
                      width: '100%',
                      height: 'auto',
                      maxHeight: '70vh',
                      objectFit: 'contain'
                    }}
                  />
                ) : selectedMedia.type === 'video' ? (
                  selectedMedia.url.includes('youtube.com') || selectedMedia.url.includes('youtu.be') ? (
                    <iframe
                      src={selectedMedia.url.replace('watch?v=', 'embed/')}
                      title={selectedMedia.description}
                      allowFullScreen
                      style={{ width: '100%', minHeight: '60vh', border: 'none' }}
                    />
                  ) : canEmbedVideo(selectedMedia.url) ? (
                    !shouldLoadVideo ? (
                      <Button
                        size="md"
                        leftSection={<Play size={18} />}
                        onClick={handleLoadVideo}
                        style={{
                          marginTop: '2rem'
                        }}
                      >
                        Load Video
                      </Button>
                    ) : (
                      <iframe
                        src={getEmbedUrl(selectedMedia.url)!}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                        allowFullScreen
                        title={selectedMedia.description}
                        style={{ width: '100%', minHeight: '60vh', border: 'none' }}
                      />
                    )
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
                          c={palette.accent}
                          size="sm"
                          style={{
                            backgroundColor: `${palette.accent}20`,
                            borderColor: palette.accent
                          }}
                        >
                          {selectedMedia.ownerType}
                        </Badge>
                        <Badge
                          variant="outline"
                          size="sm"
                          c={palette.accent}
                          style={{ borderColor: palette.accent }}
                        >
                          {selectedMedia.type}
                        </Badge>
                        {selectedMedia.chapterNumber && (
                          <Badge
                            variant="outline"
                            size="sm"
                            c={palette.secondaryAccent}
                            style={{ borderColor: palette.secondaryAccent }}
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
                        <Text size="sm" style={{ color: theme.colors.gray[6] }}>
                          Submitted by {selectedMedia.submittedBy.username}
                        </Text>

                        {selectedMedia.createdAt && (
                          <Text size="sm" style={{ color: theme.colors.gray[6] }}>
                            {new Date(selectedMedia.createdAt).toLocaleDateString()}
                          </Text>
                        )}
                      </Group>
                    </Stack>

                    <Group gap="xs">
                      <ActionIcon
                        variant="light"
                        component="a"
                        href={selectedMedia.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Open original"
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