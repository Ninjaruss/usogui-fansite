'use client'

import React, { useEffect, useMemo, useState } from 'react'
import {
  ActionIcon,
  Alert,
  Badge,
  Box,
  Card,
  Group,
  Loader,
  Paper,
  Select,
  Stack,
  Text,
  rem,
  useMantineTheme,
  rgba
} from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import { getEntityThemeColor } from '../lib/mantine-theme'
import {
  Image as ImageIcon,
  Play,
  ExternalLink,
  ImageOff
} from 'lucide-react'
import { api } from '../lib/api'
import {
  extractYouTubeVideoId,
  getYouTubeThumbnail,
  isYouTubeUrl,
} from '../lib/video-utils'
import MediaLightbox from './MediaLightbox'

export interface MediaItem {
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
  /** When set, auto-opens the lightbox for the media item with this ID after loading */
  initialMediaId?: number | string
}

const mediaTypeOptions = [
  { value: 'all', label: 'All Types' },
  { value: 'image', label: 'Images' },
  { value: 'video', label: 'Videos' },
  { value: 'audio', label: 'Audio' }
]

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
  onMediaLoaded,
  initialMediaId
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
  const [dialogOpen, setDialogOpen] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [hoveredMediaId, setHoveredMediaId] = useState<number | null>(null)
  const [failedImageIds, setFailedImageIds] = useState<Set<number>>(new Set())

  const handleImageError = (mediaId: number) => {
    setFailedImageIds(prev => new Set(prev).add(mediaId))
  }

  // Filter state
  const [selectedMediaType, setSelectedMediaType] = useState<string>('all')

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

  // Auto-open lightbox for a specific media item when initialMediaId is provided
  useEffect(() => {
    if (!initialMediaId || filteredMedia.length === 0) return
    const targetId = typeof initialMediaId === 'string' ? parseInt(initialMediaId, 10) : initialMediaId
    const index = filteredMedia.findIndex((m) => m.id === targetId)
    if (index !== -1) {
      setCurrentImageIndex(index)
      setDialogOpen(true)
    }
  }, [initialMediaId, filteredMedia])

  const handleMediaClick = (mediaItem: MediaItem) => {
    const mediaIndex = filteredMedia.findIndex((m) => m.id === mediaItem.id)
    setCurrentImageIndex(mediaIndex)
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
  }

  const handlePrevious = () => {
    if (currentImageIndex > 0) {
      const newIndex = currentImageIndex - 1
      setCurrentImageIndex(newIndex)
    }
  }

  const handleNext = () => {
    if (currentImageIndex < filteredMedia.length - 1) {
      const newIndex = currentImageIndex + 1
      setCurrentImageIndex(newIndex)
    }
  }

  const getMediaThumbnail = (mediaItem: MediaItem) => {

    if (mediaItem.type === 'image') {
      // For uploaded images, use the url field directly (contains full B2 URL)
      if (mediaItem.isUploaded) {
        return mediaItem.url
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
                    // For items without thumbnail, use the url field directly
                    // (contains full B2 URL for uploads, external URL for submissions)
                    displayUrl = mediaItem.type === 'image' ? mediaItem.url : null
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
                        minHeight: rem(150),
                        backgroundColor: theme.colors.dark[6],
                        borderRadius: 8,
                        flexDirection: 'column',
                        gap: rem(8)
                      }}
                    >
                      <Stack align="center" gap="xs">
                        {failedImageIds.has(mediaItem.id) ? (
                          <>
                            <ImageOff size={32} color={theme.colors.dark[3]} />
                            <Text size="xs" c="dimmed">Image unavailable</Text>
                          </>
                        ) : (
                          <>
                            {getMediaTypeIcon(mediaItem.type)}
                            <Text size="xs" c="dimmed" ta="center">Click to view</Text>
                          </>
                        )}
                      </Stack>
                    </Box>
                  )
                })()}

              </Box>
            </Card>
          )
        })}
      </Box>

      <MediaLightbox
        opened={dialogOpen}
        media={filteredMedia}
        currentIndex={currentImageIndex}
        onClose={handleCloseDialog}
        onPrevious={handlePrevious}
        onNext={handleNext}
      />
    </Box>
  )
}