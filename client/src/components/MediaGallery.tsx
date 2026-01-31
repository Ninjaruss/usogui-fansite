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

  const handleImageError = (mediaId: number) => {
    setFailedImageIds(prev => new Set(prev).add(mediaId))
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

      <SimpleGrid
        spacing={compactMode ? 'xs' : 'md'}
        cols={{ base: compactMode ? 2 : 3, md: compactMode ? 2 : 3, lg: compactMode ? 3 : 4 }}
      >
        {filteredMedia.map((mediaItem) => {
          const thumbnail = getMediaThumbnail(mediaItem)
          const isHovered = hoveredMediaId === mediaItem.id

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
                transform: isHovered ? 'translateY(-4px) scale(1.02)' : 'none',
                boxShadow: isHovered
                  ? '0 20px 30px -15px rgba(225, 29, 72, 0.45)'
                  : '0 10px 20px -18px rgba(0, 0, 0, 0.65)',
                overflow: 'hidden',
                backgroundColor: theme.colors.dark?.[6] ?? '#373A40'
              }}
            >
              <Box style={{ position: 'relative' }}>
                <AspectRatio ratio={16 / 9} style={{ position: 'relative' }}>
                  {(() => {
                    const mediaUrl = mediaItem.isUploaded
                      ? `${API_BASE_URL}/media/${mediaItem.fileName}`
                      : mediaItem.url

                    return !failedImageIds.has(mediaItem.id) ? (
                      isExternalUrl(mediaUrl) ? (
                        <img
                          src={mediaUrl}
                          alt={mediaItem.description || `Media submitted by ${mediaItem.submittedBy.username}`}
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                          onError={() => handleImageError(mediaItem.id)}
                        />
                      ) : (
                        <NextImage
                          src={mediaUrl}
                          alt={mediaItem.description || `Media submitted by ${mediaItem.submittedBy.username}`}
                          fill
                          style={{ objectFit: 'cover' }}
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                          onError={() => handleImageError(mediaItem.id)}
                        />
                      )
                    ) : (
                      /* Fallback for failed images only */
                      <Box
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: theme.colors.gray[5],
                          width: '100%',
                          height: '100%',
                          backgroundColor: 'rgba(0,0,0,0.1)',
                          flexDirection: 'column',
                          gap: rem(8)
                        }}
                      >
                        {getMediaTypeIcon(mediaItem.type)}
                        <Text size="xs" c="dimmed" ta="center">
                          Failed to load
                        </Text>
                      </Box>
                    )
                  })()}
                </AspectRatio>

                <Box
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: mediaItem.type === 'video'
                      ? 'linear-gradient(135deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.6) 100%)'
                      : 'linear-gradient(135deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.4) 100%)',
                    opacity: isHovered ? 1 : 0,
                    transition: 'opacity 200ms ease'
                  }}
                >
                  <Group
                    justify="space-between"
                    style={{
                      position: 'absolute',
                      bottom: rem(12),
                      left: rem(16),
                      right: rem(16),
                      color: '#ffffff'
                    }}
                  >
                    <Group gap="xs">
                      {getMediaTypeIcon(mediaItem.type)}
                      <Text size="sm" fw={600}>
                        {mediaItem.type.toUpperCase()}
                      </Text>
                    </Group>
                    {mediaItem.type === 'video' ? <Play size={20} /> : <ExternalLink size={18} />}
                  </Group>
                </Box>

                {mediaItem.isUploaded && allowMultipleTypes && (
                  <Badge
                    size="sm"
                    radius="sm"
                    style={{
                      position: 'absolute',
                      top: rem(12),
                      right: rem(12),
                      backdropFilter: 'blur(10px)',
                      backgroundColor: 'rgba(156, 39, 176, 0.95)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      color: '#fff',
                      fontWeight: 600
                    }}
                  >
                    Official
                  </Badge>
                )}

                {/* Chapter number badge */}
                {mediaItem.chapterNumber && (
                  <Badge
                    size="sm"
                    radius="sm"
                    style={{
                      position: 'absolute',
                      top: rem(12),
                      left: rem(12),
                      backdropFilter: 'blur(10px)',
                      backgroundColor: 'rgba(225, 29, 72, 0.95)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      color: '#fff',
                      fontWeight: 600
                    }}
                  >
                    Ch. {mediaItem.chapterNumber}
                  </Badge>
                )}
              </Box>

              {!compactMode && (
                <Box style={{ padding: rem(16) }}>
                  <Text
                    size="sm"
                    fw={500}
                    style={{
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      marginBottom: rem(8),
                      lineHeight: 1.4
                    }}
                  >
                    {mediaItem.description || 'No description available'}
                  </Text>
                  <Group justify="space-between">
                    <Text size="xs" c="dimmed" fw={500}>
                      By {mediaItem.submittedBy.username}
                    </Text>
                    <Group gap="xs">
                      {mediaItem.chapterNumber && (
                        <Text size="xs" c="dimmed" style={{ opacity: 0.7 }}>
                          Ch. {mediaItem.chapterNumber}
                        </Text>
                      )}
                      <Text size="xs" c="dimmed" style={{ opacity: 0.7 }}>
                        {new Date(mediaItem.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </Text>
                    </Group>
                  </Group>
                </Box>
              )}
            </Card>
          )
        })}
      </SimpleGrid>

      <Modal
        opened={dialogOpen}
        onClose={handleCloseDialog}
        size="auto"
        radius="lg"
        fullScreen={isMobile}
        centered
        transitionProps={{ transition: 'fade', duration: 200 }}
        styles={{
          content: {
            width: '100%',
            maxWidth: isMobile ? '100%' : MAX_DIALOG_WIDTH,
            background: palette.panel,
            border: palette.border
          }
        }}
        title={
          <Group h="100%" gap="sm" justify="space-between">
            <Group gap="xs">
              <Text size="lg" fw={600}>
                {selectedMedia?.type === 'image'
                  ? 'Image'
                  : selectedMedia?.type === 'video'
                    ? 'Video'
                    : 'Media'}{' '}
                Viewer
              </Text>
              {filteredMedia.length > 1 && (
                <Text size="sm" c="dimmed">
                  {currentImageIndex + 1} of {filteredMedia.length}
                </Text>
              )}
            </Group>

            <Group gap="xs">
              {filteredMedia.length > 1 && (
                <>
                  <ActionIcon
                    variant="subtle"
                    onClick={handlePrevious}
                    disabled={currentImageIndex === 0}
                    aria-label="Previous media"
                  >
                    <ChevronLeft size={18} />
                  </ActionIcon>
                  <ActionIcon
                    variant="subtle"
                    onClick={handleNext}
                    disabled={currentImageIndex === filteredMedia.length - 1}
                    aria-label="Next media"
                  >
                    <ChevronRight size={18} />
                  </ActionIcon>
                </>
              )}

              {selectedMedia?.type === 'image' && (
                <ActionIcon
                  variant="subtle"
                  onClick={handleImageZoom}
                  aria-label={imageZoomed ? 'Zoom out' : 'Zoom in'}
                >
                  {imageZoomed ? <Maximize2 size={18} /> : <ZoomIn size={18} />}
                </ActionIcon>
              )}

              <ActionIcon variant="subtle" onClick={handleCloseDialog} aria-label="Close">
                <X size={18} />
              </ActionIcon>
            </Group>
          </Group>
        }
      >
        {selectedMedia && (
          <Stack gap="lg">
            <Box
              style={{
                position: 'relative',
                height: imageZoomed ? '80vh' : '60vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#090909',
                borderRadius: rem(12),
                overflow: 'hidden'
              }}
            >
              {selectedMedia.type === 'image' ? (
                <Transition mounted={true} transition="fade" duration={300}>
                  {(styles) => (
                    <Box
                      style={{
                        ...styles,
                        position: 'relative',
                        maxWidth: '100%',
                        maxHeight: '100%',
                        cursor: imageZoomed ? 'zoom-out' : 'zoom-in'
                      }}
                      onClick={handleImageZoom}
                    >
                      <img
                        src={selectedMedia.isUploaded
                          ? `${process.env.NEXT_PUBLIC_API_URL}/media/${selectedMedia.fileName}`
                          : selectedMedia.url}
                        alt={selectedMedia.description || `Media submitted by ${selectedMedia.submittedBy.username}`}
                        style={{
                          maxWidth: imageZoomed ? 'none' : '100%',
                          maxHeight: imageZoomed ? 'none' : '80vh',
                          width: imageZoomed ? 'auto' : '100%',
                          height: imageZoomed ? 'auto' : 'auto',
                          objectFit: imageZoomed ? 'none' : 'contain',
                          transition: 'transform 300ms ease'
                        }}
                        onError={() => {
                          // Show fallback instead of hiding - handled by parent component state
                        }}
                      />
                    </Box>
                  )}
                </Transition>
              ) : selectedMedia.type === 'video' ? (
                <Box
                  style={{
                    width: '100%',
                    minHeight: '60vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Box style={{ width: '100%', maxWidth: '100%' }}>
                    {canEmbedVideo(selectedMedia.url) ? (
                      <Box
                        style={{
                          position: 'relative',
                          width: '100%',
                          aspectRatio: '16 / 9',
                          minHeight: rem(400),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        {isDirectVideoUrl(selectedMedia.url) ? (
                          <Transition mounted={true} transition="fade" duration={500}>
                            {(styles) => (
                              <video
                                style={{
                                  ...styles,
                                  width: '100%',
                                  height: '100%',
                                  maxHeight: '70vh',
                                  objectFit: 'contain',
                                  backgroundColor: 'black'
                                }}
                                controls
                                preload="metadata"
                              >
                                <source src={selectedMedia.url} />
                                Your browser does not support the video tag.
                              </video>
                            )}
                          </Transition>
                        ) : !shouldLoadVideo ? (
                          <Stack
                            align="center"
                            gap="md"
                            justify="center"
                            p="lg"
                            style={{
                              background: 'rgba(0,0,0,0.9)',
                              borderRadius: rem(16),
                              color: '#ffffff',
                              border: '2px solid rgba(255,255,255,0.1)',
                              width: '100%',
                              maxWidth: rem(360)
                            }}
                          >
                            {getMediaThumbnail(selectedMedia) && (
                              <Box
                                style={{
                                  position: 'relative',
                                  width: rem(320),
                                  height: rem(180),
                                  borderRadius: rem(12),
                                  overflow: 'hidden',
                                  boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
                                }}
                              >
                                {isExternalUrl(getMediaThumbnail(selectedMedia)!) ? (
                                  <img
                                    src={getMediaThumbnail(selectedMedia)!}
                                    alt="Video thumbnail"
                                    style={{
                                      position: 'absolute',
                                      top: 0,
                                      left: 0,
                                      width: '100%',
                                      height: '100%',
                                      objectFit: 'cover'
                                    }}
                                  />
                                ) : (
                                  <NextImage
                                    src={getMediaThumbnail(selectedMedia)!}
                                    alt="Video thumbnail"
                                    fill
                                    style={{ objectFit: 'cover' }}
                                    sizes="320px"
                                  />
                                )}
                              </Box>
                            )}
                            <Button
                              size="md"
                              leftSection={<Play size={18} />}
                              onClick={handleLoadVideo}
                              fullWidth
                              styles={{
                                root: {
                                  backgroundImage: `linear-gradient(135deg, ${palette.secondaryAccent} 0%, ${palette.accent} 100%)`,
                                  boxShadow: '0 4px 20px rgba(25, 118, 210, 0.4)'
                                }
                              }}
                            >
                              Play Video
                            </Button>
                            <Text size="sm" c="gray.4" ta="center">
                              Click to load the video player with full controls
                            </Text>
                          </Stack>
                        ) : (
                          <Transition mounted={shouldLoadVideo} transition="fade" duration={500}>
                            {(styles) => (
                              <iframe
                                src={getEmbedUrl(selectedMedia.url)!}
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                                allowFullScreen
                                title={selectedMedia.description}
                                style={{
                                  ...styles,
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  width: '100%',
                                  height: '100%',
                                  borderRadius: rem(8)
                                }}
                              />
                            )}
                          </Transition>
                        )}
                      </Box>
                    ) : (
                      <Stack
                        align="center"
                        gap="sm"
                        p="lg"
                        style={{
                          textAlign: 'center',
                          background: 'rgba(0,0,0,0.8)',
                          borderRadius: rem(16),
                          color: '#ffffff'
                        }}
                      >
                        <Text size="lg" fw={600}>
                          External Video
                        </Text>
                        <Text size="sm" c="gray.4">
                          This video is hosted externally and cannot be embedded.
                        </Text>
                        <Button
                          component="a"
                          href={selectedMedia.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          leftSection={<ExternalLink size={18} />}
                        >
                          Open in New Tab
                        </Button>
                      </Stack>
                    )}
                  </Box>
                </Box>
              ) : (
                <Stack
                  align="center"
                  gap="sm"
                  p="xl"
                  style={{ textAlign: 'center', background: palette.panel, borderRadius: rem(16) }}
                >
                  <ExternalLink size={48} color={theme.colors.gray[4]} />
                  <Text size="lg" fw={600}>
                    External Media
                  </Text>
                  <Button
                    component="a"
                    href={selectedMedia.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    leftSection={<ExternalLink size={18} />}
                  >
                    Open Media
                  </Button>
                </Stack>
              )}
            </Box>

            <Paper
              radius="md"
              p="md"
              withBorder
              style={{
                background: palette.panel,
                border: palette.border
              }}
            >
              <Stack gap="sm">
                <Text size="lg" fw={600}>
                  {selectedMedia.description || 'No title'}
                </Text>
                <Group gap="md" wrap="wrap">
                  <Text size="sm" c="dimmed">
                    <strong>By:</strong> {selectedMedia.submittedBy.username}
                  </Text>
                  <Text size="sm" c="dimmed">
                    <strong>Added:</strong> {new Date(selectedMedia.createdAt).toLocaleDateString()}
                  </Text>
                  <Text size="sm" c="dimmed">
                    <strong>Owner:</strong> {selectedMedia.ownerType} {selectedMedia.ownerId}
                  </Text>
                  <Text size="sm" c="dimmed">
                    <strong>Purpose:</strong> {selectedMedia.purpose.replace('_', ' ')}
                  </Text>
                  {selectedMedia.chapterNumber && (
                    <Text size="sm" c="dimmed">
                      <strong>Chapter:</strong> {selectedMedia.chapterNumber}
                    </Text>
                  )}
                </Group>
              </Stack>
            </Paper>
          </Stack>
        )}
      </Modal>
    </Box>
  )
}