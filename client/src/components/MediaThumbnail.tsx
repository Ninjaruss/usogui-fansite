'use client'

import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import {
  ActionIcon,
  Alert,
  Box,
  Loader,
  Text,
  Tooltip,
  rem,
  useMantineTheme,
  rgba
} from '@mantine/core'
import { getEntityThemeColor, semanticColors, textColors } from '../lib/mantine-theme'
import { ChevronLeft, ChevronRight, Image as ImageIcon, AlertTriangle } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import Image from 'next/image'
import { useProgress } from '../providers/ProgressProvider'
import { useSpoilerSettings } from '../hooks/useSpoilerSettings'
import { api } from '../lib/api'
import { analyzeMediaUrl, analyzeMediaUrlAsync, getPlaceholderInfo } from '../lib/media-utils'

interface MediaItem {
  id: number
  url: string
  type: 'image' | 'video' | 'audio'
  description?: string
  chapterNumber?: number
  isSpoiler?: boolean
}

interface MediaThumbnailProps {
  entityType: 'character' | 'arc' | 'gamble' | 'organization' | 'volume'
  entityId: number
  entityName?: string
  className?: string
  allowCycling?: boolean
  showGallery?: boolean
  maxWidth?: string | number
  maxHeight?: string | number
  inline?: boolean
  disableExternalLinks?: boolean
}

// Cache for media data to avoid redundant API calls
const mediaCache = new Map<string, { data: MediaItem[], timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

// Retry configuration
const RETRY_DELAYS = [1000, 2000, 4000] // Progressive backoff
const MAX_RETRIES = 3
// Image component with loading states and retry logic
function ImageWithRetry({ 
  src, 
  alt, 
  onLoad, 
  onError,
  ...props 
}: {
  src: string
  alt: string
  onLoad?: () => void
  onError?: () => void
  [key: string]: any
}) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const theme = useMantineTheme()

  const handleLoad = () => {
    setLoading(false)
    setError(false)
    onLoad?.()
  }

  const handleError = () => {
    console.error('Image failed to load:', src)
    
    if (retryCount < 2) {
      // Retry with progressive delay
      setTimeout(() => {
        setRetryCount(prev => prev + 1)
        setError(false)
        setLoading(true)
      }, 1000 * (retryCount + 1))
    } else {
      setLoading(false)
      setError(true)
      onError?.()
    }
  }

  if (error) {
    return (
      <Box
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.colors.gray?.[1],
          color: theme.colors.gray?.[6]
        }}
      >
        <ImageIcon size={24} style={{ marginBottom: '8px' }} />
        <Text size="xs" ta="center">Image unavailable</Text>
      </Box>
    )
  }

  return (
    <>
      {loading && (
        <Box
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: `${theme.colors.dark?.[5] ?? theme.colors.gray?.[2]}20`,
            zIndex: 1
          }}
        >
          <Loader size="sm" color={theme.colors.red?.[5]} />
        </Box>
      )}
      <Image
        {...props}
        src={`${src}?retry=${retryCount}`}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        priority={false}
        loading="lazy"
      />
    </>
  )
}

export default function MediaThumbnail({
  entityType,
  entityId,
  entityName,
  className,
  allowCycling = true,
  showGallery = false,
  maxWidth = 300,
  maxHeight = 300,
  inline = false,
  disableExternalLinks = false
}: MediaThumbnailProps) {
  const [currentThumbnail, setCurrentThumbnail] = useState<MediaItem | null>(null)
  const [allEntityMedia, setAllEntityMedia] = useState<MediaItem[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [resolvedMediaInfo, setResolvedMediaInfo] = useState<Record<string, any>>({})
  const abortControllerRef = useRef<AbortController | null>(null)

  const { userProgress } = useProgress()
  const theme = useMantineTheme()

  const containerComponent = inline ? 'span' : 'div'
  const numericMaxWidth = typeof maxWidth === 'number' ? maxWidth : Number(maxWidth)
  const numericMaxHeight = typeof maxHeight === 'number' ? maxHeight : Number(maxHeight)

  const containerStyles = useMemo(
    () => ({
      width: maxWidth,
      height: maxHeight,
      display: inline ? 'inline-block' : 'block',
      position: 'relative' as const,
      overflow: 'hidden',
      borderRadius: rem(8),
      backgroundColor: theme.colors.gray?.[0] ?? '#f8f9fa'
    }),
    [inline, maxHeight, maxWidth, theme]
  )

  const contentWrapperStyles = useMemo(
    () => ({
      position: 'relative' as const,
      width: '100%',
      height: '100%'
    }),
    []
  )

  // Optimized fetchCurrentThumbnail with retry logic
  const fetchCurrentThumbnail = useCallback(async (retryAttempt = 0): Promise<void> => {
    try {
      const thumbnail = await api.getThumbnailForUserProgress(
        entityType,
        entityId,
        userProgress
      )
      setCurrentThumbnail(thumbnail)
      setRetryCount(0) // Reset retry count on success
    } catch (thumbnailError: any) {
      console.error(`Error fetching ${entityType} thumbnail (attempt ${retryAttempt + 1}):`, thumbnailError)

      // Implement retry logic with progressive backoff
      if (retryAttempt < MAX_RETRIES && thumbnailError?.status !== 404) {
        const delay = RETRY_DELAYS[retryAttempt] || RETRY_DELAYS[RETRY_DELAYS.length - 1]
        setTimeout(() => {
          setRetryCount(retryAttempt + 1)
          fetchCurrentThumbnail(retryAttempt + 1)
        }, delay)
      } else {
        setCurrentThumbnail(null)
        // Don't show error for 404s (normal when no media exists)
        if (thumbnailError?.status !== 404) {
          setError(`Failed to load thumbnail after ${MAX_RETRIES} attempts`)
        }
      }
    }
  }, [entityType, entityId, userProgress])

  // Optimized loadMedia with caching and abort controllers
  const loadMedia = useCallback(async () => {
    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    abortControllerRef.current = new AbortController()
    const signal = abortControllerRef.current.signal

    setLoading(true)
    setError(null)
    setRetryCount(0)

    let finalEntityType = entityType
    if (finalEntityType === ('organization' as any)) {
      finalEntityType = 'organization'
    }

    // Check cache first
    const cacheKey = `${finalEntityType}-${entityId}-${userProgress}`
    const cachedData = mediaCache.get(cacheKey)
    const now = Date.now()

    if (cachedData && (now - cachedData.timestamp) < CACHE_TTL) {
      const mediaArray = cachedData.data
      setAllEntityMedia(mediaArray)

      if (mediaArray && mediaArray.length > 0) {
        let startIndex = 0
        for (let i = mediaArray.length - 1; i >= 0; i -= 1) {
          const media = mediaArray[i]
          if (!media.chapterNumber || media.chapterNumber <= userProgress) {
            startIndex = i
            break
          }
        }
        setCurrentIndex(startIndex)
        setCurrentThumbnail(mediaArray[startIndex])
      } else {
        await fetchCurrentThumbnail()
      }
      setLoading(false)
      return
    }

    try {
      const response = await api.getEntityDisplayMediaForCycling(
        finalEntityType,
        entityId,
        userProgress
      )

      // Check if request was aborted
      if (signal.aborted) return

      const mediaArray = response?.data || []

      // Cache the response
      mediaCache.set(cacheKey, { data: mediaArray, timestamp: now })

      setAllEntityMedia(mediaArray)

      if (mediaArray && mediaArray.length > 0) {
        let startIndex = 0
        for (let i = mediaArray.length - 1; i >= 0; i -= 1) {
          const media = mediaArray[i]
          if (!media.chapterNumber || media.chapterNumber <= userProgress) {
            startIndex = i
            break
          }
        }

        setCurrentIndex(startIndex)
        setCurrentThumbnail(mediaArray[startIndex])
      } else {
        await fetchCurrentThumbnail()
      }
    } catch (loadError: any) {
      if (signal.aborted) return

      console.error(`Error fetching ${entityType} media:`, loadError)
      // Only try fallback thumbnail if not a rate limit error
      if (loadError?.status !== 429) {
        await fetchCurrentThumbnail()
      } else {
        setError('Rate limit exceeded. Please wait a moment and try again.')
      }
    }

    setLoading(false)
  }, [entityId, entityType, userProgress, fetchCurrentThumbnail])

  useEffect(() => {
    loadMedia()

    // Cleanup function to abort request on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [loadMedia])

  // Resolve media URLs for special platforms
  useEffect(() => {
    if (!currentThumbnail) return

    const resolveMediaUrl = async () => {
      // Skip if already resolved
      if (resolvedMediaInfo[currentThumbnail.url]) return

      try {
        const mediaInfo = await analyzeMediaUrlAsync(currentThumbnail.url)

        if (mediaInfo.directImageUrl || mediaInfo.thumbnailUrl) {
          setResolvedMediaInfo(prev => ({
            ...prev,
            [currentThumbnail.url]: mediaInfo
          }))
        }
      } catch (error) {
        console.warn('Failed to resolve media URL:', currentThumbnail.url, error)
      }
    }

    resolveMediaUrl()
  }, [currentThumbnail, resolvedMediaInfo])

  const handlePrevious = () => {
    if (allEntityMedia.length > 1) {
      const newIndex = currentIndex > 0 ? currentIndex - 1 : allEntityMedia.length - 1
      setCurrentIndex(newIndex)
      setCurrentThumbnail(allEntityMedia[newIndex])
    }
  }

  const handleNext = () => {
    if (allEntityMedia.length > 1) {
      const newIndex = currentIndex < allEntityMedia.length - 1 ? currentIndex + 1 : 0
      setCurrentIndex(newIndex)
      setCurrentThumbnail(allEntityMedia[newIndex])
    }
  }

  const renderMediaContent = (media: MediaItem) => {
    const resolvedInfo = resolvedMediaInfo[media.url]
    const mediaInfo = resolvedInfo || analyzeMediaUrl(media.url)

    if (media.type === 'image') {
      // Handle direct images (including resolved DeviantArt images)
      if (mediaInfo.isDirectImage) {
        const imageUrl = mediaInfo.directImageUrl || media.url
        return (
          <Box style={{ position: 'relative', width: '100%', height: '100%' }}>
            <ImageWithRetry
              src={imageUrl}
              alt={media.description || mediaInfo.title || `${entityName} image`}
              fill
              style={{
                objectFit: 'cover',
                objectPosition: 'center'
              }}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </Box>
        )
      }

      // Handle YouTube thumbnails
      if (mediaInfo.platform === 'youtube' && mediaInfo.thumbnailUrl) {
        return (
          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <ImageWithRetry
              src={mediaInfo.thumbnailUrl}
              alt={media.description || `${entityName} video thumbnail`}
              fill
              style={{
                objectFit: 'cover',
                objectPosition: 'center'
              }}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            <Box
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                backgroundColor: `${theme.colors.dark?.[7] ?? theme.colors.gray?.[0]}E6`,
                color: 'white',
                padding: rem(8),
                borderRadius: rem(4),
                fontSize: rem(24)
              }}
            >
              ▶️
            </Box>
          </div>
        )
      }

      // Handle non-direct image URLs (DeviantArt, Twitter, etc.) that couldn't be resolved
      if (mediaInfo.platform && mediaInfo.platform !== 'direct') {
        const placeholder = getPlaceholderInfo(mediaInfo.platform)
        const displayTitle = mediaInfo.title || media.description
        const displayAuthor = mediaInfo.author

        const content = (
          <>
            <Text size={rem(32)} style={{ lineHeight: 1 }}>
              {placeholder.icon}
            </Text>
            <Text size="sm" fw={600} ta="center" style={{ color: placeholder.color }}>
              {placeholder.label}
            </Text>
            {displayTitle && (
              <Text size="xs" ta="center" style={{ color: theme.colors.gray[7], maxWidth: '80%' }}>
                {displayTitle.length > 50
                  ? `${displayTitle.substring(0, 50)}...`
                  : displayTitle}
              </Text>
            )}
            {displayAuthor && (
              <Text size="xs" ta="center" style={{ color: theme.colors.gray[6], maxWidth: '80%' }}>
                by {displayAuthor}
              </Text>
            )}
          </>
        )

        return (
          <Box
            component={disableExternalLinks ? 'div' : 'a'}
            href={disableExternalLinks ? undefined : media.url}
            target={disableExternalLinks ? undefined : '_blank'}
            rel={disableExternalLinks ? undefined : 'noopener noreferrer'}
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: theme.colors.gray[1],
              color: theme.colors.gray[7],
              borderRadius: rem(8),
              gap: rem(8),
              textDecoration: 'none',
              cursor: disableExternalLinks ? 'default' : 'pointer',
              transition: 'all 0.2s ease',
              border: `2px solid ${placeholder.color}20`,
              '&:hover': disableExternalLinks ? {} : {
                backgroundColor: theme.colors.gray[2],
                transform: 'scale(1.02)'
              }
            }}
          >
            {content}
          </Box>
        )
      }

      // Fallback for unknown image types
      return (
        <Box style={{ position: 'relative', width: '100%', height: '100%' }}>
          <ImageWithRetry
            src={media.url}
            alt={media.description || `${entityName} image`}
            fill
            style={{
              objectFit: 'cover',
              objectPosition: 'center'
            }}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </Box>
      )
    }

    if (media.type === 'video') {
      // Handle YouTube videos
      if (mediaInfo.platform === 'youtube' && mediaInfo.embedUrl) {
        return (
          <iframe
            src={mediaInfo.embedUrl}
            title={media.description || `${entityName} video`}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              borderRadius: rem(8)
            }}
            allowFullScreen
          />
        )
      }

      // Handle other videos
      return (
        <video
          src={media.url}
          controls
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center'
          }}
          onError={() => {
            console.error('Video failed to load:', media.url)
            setError('Failed to load video')
          }}
        />
      )
    }

    return (
      <Box
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.colors.gray[1],
          color: theme.colors.gray[6],
          borderRadius: rem(8),
          gap: rem(8)
        }}
      >
        <ImageIcon size={36} />
        <Text size="sm" fw={600}>
          {media.type.toUpperCase()}
        </Text>
      </Box>
    )
  }

  const renderEmptyState = () => {
    const isSmallContainer =
      (typeof maxWidth === 'number' && maxWidth <= 32) ||
      (typeof maxHeight === 'number' && maxHeight <= 32)

    if (isSmallContainer) {
      return (
        <Box
          component={containerComponent}
          style={{
            width: maxWidth,
            height: maxHeight,
            display: inline ? 'inline-flex' : 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: theme.colors.gray[1],
            borderRadius: rem(4),
            border: `1px solid ${theme.colors.gray[4]}`
          }}
        >
          <ImageIcon size={16} color={theme.colors.gray[5]} />
        </Box>
      )
    }

    return (
      <Box
        component={containerComponent}
        style={{
          width: maxWidth,
          height: maxHeight,
          display: inline ? 'inline-flex' : 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.colors.gray[0],
          borderRadius: rem(8),
          border: `2px dashed ${theme.colors.gray[4]}`
        }}
      >
        <Box component={containerComponent} style={{ textAlign: 'center' }}>
          <ImageIcon size={48} color={theme.colors.gray[5]} />
          <Text size="sm" c="dimmed" mt={rem(4)}>
            No thumbnail available
          </Text>
        </Box>
      </Box>
    )
  }

  if (loading) {
    return (
      <Box
        component={containerComponent}
        className={className}
        style={{
          width: maxWidth,
          height: maxHeight,
          display: inline ? 'inline-flex' : 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Loader style={{ color: getEntityThemeColor(theme, 'gamble') }} />
      </Box>
    )
  }

  if (error) {
    return (
      <Alert
        style={{ color: getEntityThemeColor(theme, 'gamble') }}
        variant="light"
        radius="md"
        icon={<AlertTriangle size={16} />}
        style={{ width: maxWidth, maxWidth: typeof maxWidth === 'number' ? undefined : '100%' }}
      >
        {error}
      </Alert>
    )
  }

  if (!currentThumbnail) {
    return renderEmptyState()
  }

  const mediaContent = (
    <Box component={containerComponent} style={contentWrapperStyles}>
      <AnimatePresence mode="wait">
        {inline ? (
          <motion.span
            key={currentThumbnail.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ width: '100%', height: '100%', display: 'inline-block', position: 'relative' }}
          >
            {renderMediaContent(currentThumbnail)}
          </motion.span>
        ) : (
          <motion.div
            key={currentThumbnail.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ width: '100%', height: '100%', position: 'relative' }}
          >
            {renderMediaContent(currentThumbnail)}
          </motion.div>
        )}
      </AnimatePresence>

      {currentThumbnail.chapterNumber && (
        <Box
          style={{
            position: 'absolute',
            bottom: numericMaxHeight && numericMaxHeight <= 32 ? rem(2) : rem(8),
            left: numericMaxWidth && numericMaxWidth <= 32 ? rem(2) : rem(8),
            backgroundColor: `${theme.colors.dark?.[7] ?? theme.colors.gray?.[0]}E6`,
            color: 'white',
            paddingInline: numericMaxWidth && numericMaxWidth <= 32 ? rem(2) : rem(8),
            paddingBlock: numericMaxHeight && numericMaxHeight <= 32 ? rem(1) : rem(4),
            borderRadius: numericMaxWidth && numericMaxWidth <= 32 ? rem(4) : rem(8),
            fontSize: numericMaxWidth && numericMaxWidth <= 32 ? '0.5rem' : '0.75rem',
            lineHeight: 1,
            whiteSpace: 'nowrap'
          }}
        >
          Ch. {currentThumbnail.chapterNumber}
        </Box>
      )}
    </Box>
  )

  const showControls =
    allowCycling &&
    allEntityMedia.length > 1 &&
    !inline &&
    (!numericMaxWidth || numericMaxWidth > 64) &&
    (!numericMaxHeight || numericMaxHeight > 64)

  return (
    <Box component={containerComponent} className={className} style={containerStyles}>
      <MediaSpoilerWrapper media={currentThumbnail} userProgress={userProgress}>
        {mediaContent}
      </MediaSpoilerWrapper>

      {showControls && (
        <>
          <ActionIcon
            variant="light"
            size="sm"
            radius="xl"
            onClick={handlePrevious}
            style={{
              position: 'absolute',
              left: rem(8),
              top: '50%',
              transform: 'translateY(-50%)',
              backgroundColor: `${theme.colors.dark?.[7] ?? theme.colors.gray?.[0]}CC`,
              color: '#ffffff',
              zIndex: 30
            }}
          >
            <ChevronLeft size={20} />
          </ActionIcon>

          <ActionIcon
            variant="light"
            size="sm"
            radius="xl"
            onClick={handleNext}
            style={{
              position: 'absolute',
              right: rem(8),
              top: '50%',
              transform: 'translateY(-50%)',
              backgroundColor: `${theme.colors.dark?.[7] ?? theme.colors.gray?.[0]}CC`,
              color: '#ffffff',
              zIndex: 30
            }}
          >
            <ChevronRight size={20} />
          </ActionIcon>

          <Box
            style={{
              position: 'absolute',
              bottom: rem(8),
              right: rem(8),
              backgroundColor: `${theme.colors.dark?.[7] ?? theme.colors.gray?.[0]}CC`,
              color: '#ffffff',
              paddingInline: rem(8),
              paddingBlock: rem(4),
              borderRadius: rem(8),
              fontSize: '0.75rem',
              zIndex: 30
            }}
          >
            {currentIndex + 1} / {allEntityMedia.length}
          </Box>
        </>
      )}
    </Box>
  )
}

function MediaSpoilerWrapper({
  media,
  userProgress,
  children
}: {
  media: MediaItem
  userProgress: number
  children: React.ReactNode
}) {
  const [isRevealed, setIsRevealed] = useState(false)
  const { settings } = useSpoilerSettings()
  const theme = useMantineTheme()

  const chapterNumber = media.chapterNumber

  const effectiveProgress = settings.chapterTolerance > 0
    ? settings.chapterTolerance
    : userProgress

  const shouldHideSpoiler = () => {
    if (settings.showAllSpoilers) {
      return false
    }

    if (chapterNumber) {
      return chapterNumber > effectiveProgress
    }

    return media.isSpoiler ?? false
  }

  const clientSideShouldHide = shouldHideSpoiler()

  if (!clientSideShouldHide || isRevealed) {
    return <>{children}</>
  }

  const handleReveal = (event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    setIsRevealed(true)
  }

  return (
    <Box style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Box style={{ opacity: 0.3, filter: 'blur(2px)', width: '100%', height: '100%' }}>
        {children}
      </Box>

      <Box
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '80%',
          height: '60%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: rgba(theme.colors.red[6] ?? '#e11d48', 0.9),
          borderRadius: rem(8),
          cursor: 'pointer',
          border: `1px solid ${theme.colors.red[5] ?? '#f87171'}`,
          boxShadow: theme.shadows.lg,
          zIndex: 10
        }}
        onClick={handleReveal}
      >
        <Tooltip
          label={chapterNumber
            ? `Chapter ${chapterNumber} spoiler – you're at Chapter ${effectiveProgress}. Click to reveal.`
            : 'Spoiler content. Click to reveal.'}
          position="top"
          withArrow
        >
          <Box style={{ textAlign: 'center', width: '100%' }}>
            <Text
              size="xs"
              fw={700}
              style={{
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: rem(6),
                marginBottom: rem(4)
              }}
            >
              <AlertTriangle size={14} />
              {chapterNumber ? `Chapter ${chapterNumber} Spoiler` : 'Spoiler'}
            </Text>
            <Text size="xs" style={{ color: 'rgba(255,255,255,0.85)' }}>
              Click to reveal
            </Text>
          </Box>
        </Tooltip>
      </Box>
    </Box>
  )
}
