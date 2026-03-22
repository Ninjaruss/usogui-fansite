'use client'

import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import type { CSSProperties } from 'react'
import {
  ActionIcon,
  Alert,
  Box,
  Loader,
  Modal,
  Text,
  rem,
  useMantineTheme,
} from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import { getEntityThemeColor, semanticColors, textColors } from '../lib/mantine-theme'
import { ChevronLeft, ChevronRight, Image as ImageIcon, AlertTriangle, X } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import Image from 'next/image'
import { useProgress } from '../providers/ProgressProvider'
import { useSpoilerSettings } from '../hooks/useSpoilerSettings'
import { api } from '../lib/api'
import { analyzeMediaUrl, analyzeMediaUrlAsync, getPlaceholderInfo, isExternalUrl } from '../lib/media-utils'
import SpoilerOverlay from './SpoilerOverlay'

export interface MediaItem {
  id: number
  url: string
  type: 'image' | 'video' | 'audio'
  description?: string
  chapterNumber?: number
  isSpoiler?: boolean
}

interface MediaThumbnailProps {
  entityType: 'character' | 'arc' | 'gamble' | 'organization' | 'volume' | 'chapter' | 'event' | 'guide' | 'media' | 'quote' | 'annotation'
  entityId: number
  entityName?: string
  className?: string
  allowCycling?: boolean
  showGallery?: boolean
  maxWidth?: string | number
  maxHeight?: string | number
  inline?: boolean
  disableExternalLinks?: boolean
  spoilerChapter?: number // Entity's chapter (e.g., firstAppearanceChapter) for spoiler protection
  hideIfEmpty?: boolean // If true, returns null when no media is available
  onSpoilerRevealed?: () => void // Callback when spoiler is revealed
  priority?: boolean // If true, loads image eagerly (above-the-fold optimization)
  initialMedia?: MediaItem[] // Pre-loaded media to skip the API call on first render
  allowFullView?: boolean // If true, shows expand button and fullscreen modal
  /** CSS object-position for image rendering. Defaults to 'center center'. */
  objectPosition?: string
  /** CSS object-fit for image rendering. Defaults to 'cover'. */
  objectFit?: React.CSSProperties['objectFit']
  /** When true, renders a blurred, darkened copy of the current image behind the main image for a full-bleed background effect. */
  showBlurredBackground?: boolean
  /** Controls placement. 'right' shifts arrows and dots to the right portrait zone (for hero headers). */
  controlsPosition?: 'center' | 'right'
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

    // For DeviantArt CDN URLs with expired tokens, don't retry
    if (src.includes('images-wixmp-') && src.includes('token=')) {
      console.warn('DeviantArt CDN image failed (likely expired token):', src)
      setLoading(false)
      setError(true)
      onError?.()
      return
    }

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

  const isExternal = isExternalUrl(src)

  // Filter out Next.js Image-specific props for regular img tag
  const { fill, sizes, quality, priority, placeholder, blurDataURL, unoptimized, loader, ...imgProps } = props

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
      {isExternal ? (
        // Use regular img tag for external URLs to bypass Next.js image domain restrictions
        <img
          {...imgProps}
          src={`${src}?retry=${retryCount}`}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          loading="eager"
          style={{
            position: fill ? 'absolute' : undefined,
            top: fill ? 0 : undefined,
            left: fill ? 0 : undefined,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            ...imgProps.style
          }}
        />
      ) : (
        // Use Next.js Image for hosted domains to get optimization benefits
        <Image
          {...props}
          src={`${src}?retry=${retryCount}`}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          priority={priority ?? false}
          loading="eager"
        />
      )}
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
  disableExternalLinks = false,
  spoilerChapter,
  hideIfEmpty = false,
  onSpoilerRevealed,
  priority = false,
  initialMedia,
  allowFullView = false,
  objectPosition = 'center center',
  objectFit = 'cover' as React.CSSProperties['objectFit'],
  showBlurredBackground = false,
  controlsPosition = 'center',
}: MediaThumbnailProps) {
  const [currentThumbnail, setCurrentThumbnail] = useState<MediaItem | null>(null)
  const [allEntityMedia, setAllEntityMedia] = useState<MediaItem[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [resolvedMediaInfo, setResolvedMediaInfo] = useState<Record<string, any>>({})
  const [isModalOpen, setIsModalOpen] = useState(false)
  const resolvedUrlsRef = useRef<Set<string>>(new Set())
  const abortControllerRef = useRef<AbortController | null>(null)
  const modalContainerRef = useRef<HTMLDivElement>(null)

  // Viewport detection — gates loadMedia() so only visible/near-viewport cards
  // fire their media API call, preventing a burst of 12 simultaneous requests.
  // When initialMedia is already provided (server pre-fetched), skip the observer
  // entirely — there's no API call to throttle and the data is ready immediately.
  const hasInitialMedia = !!initialMedia && initialMedia.length > 0
  const containerRef = useRef<HTMLElement | null>(null)
  const [isNearViewport, setIsNearViewport] = useState<boolean>(!!priority || hasInitialMedia)

  useEffect(() => {
    if (priority) setIsNearViewport(true)
  }, [priority])

  useEffect(() => {
    if (isNearViewport) return
    const el = containerRef.current
    if (!el) return
    // Immediate check: fire for cards already on screen or within 400px on mount
    // (handles initial page load and pagination page changes).
    const rect = el.getBoundingClientRect()
    if (rect.top < window.innerHeight + 400 && rect.bottom > -400) {
      setIsNearViewport(true)
      return
    }
    // For cards further down the page, pre-load when they approach the viewport.
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsNearViewport(true)
          observer.disconnect()
        }
      },
      { rootMargin: '400px 0px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // mount only; priority changes handled above

  const { userProgress } = useProgress()
  const theme = useMantineTheme()
  const isMobile = useMediaQuery('(max-width: 768px)')

  const containerComponent = inline ? 'span' : 'div'
  const numericMaxWidth = typeof maxWidth === 'number' ? maxWidth : Number(maxWidth)
  const numericMaxHeight = typeof maxHeight === 'number' ? maxHeight : Number(maxHeight)

  const containerStyles = useMemo<CSSProperties>(
    () => ({
      width: '100%',
      height: '100%',
      maxWidth: maxWidth,
      maxHeight: maxHeight,
      display: inline ? 'inline-block' : 'block',
      position: 'relative',
      overflow: 'hidden',
      borderRadius: controlsPosition === 'right' ? 0 : rem(8),
      backgroundColor: controlsPosition === 'right' ? 'transparent' : (theme.colors.gray?.[0] ?? '#f8f9fa'),
      isolation: 'isolate',
      contain: 'layout size style',
      boxSizing: 'border-box',
      margin: 0,
      padding: 0
    }),
    [inline, maxHeight, maxWidth, theme, controlsPosition]
  )

  const contentWrapperStyles = useMemo(
    () => ({
      position: 'relative' as const,
      width: '100%',
      height: '100%',
      overflow: 'hidden',
      boxSizing: 'border-box' as const,
      margin: 0,
      padding: 0
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
      console.error(`Error fetching ${entityType} thumbnail (attempt ${retryAttempt + 1}) for ID ${entityId}:`, thumbnailError)

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

    let finalEntityType = entityType
    if (finalEntityType === ('organization' as any)) {
      finalEntityType = 'organization'
    }

    const cacheKey = `${finalEntityType}-${entityId}-${userProgress}`
    const now = Date.now()

    // Use pre-loaded media if provided (skips API call, pre-warms cache, no loading flash)
    if (initialMedia && initialMedia.length > 0) {
      mediaCache.set(cacheKey, { data: initialMedia, timestamp: now })
      setAllEntityMedia(initialMedia)
      const availableMedia = initialMedia.filter(media =>
        !media.chapterNumber || media.chapterNumber <= userProgress
      )
      let selectedMedia
      if (availableMedia.length > 0) {
        selectedMedia = availableMedia.reduce((best, current) => {
          const bestChapter = best.chapterNumber || 0
          const currentChapter = current.chapterNumber || 0
          return currentChapter > bestChapter ? current : best
        })
      } else {
        selectedMedia = initialMedia[0]
      }
      setCurrentIndex(initialMedia.indexOf(selectedMedia))
      setCurrentThumbnail(selectedMedia)
      setLoading(false)
      return
    }

    // Check cache first — also avoids a loading flash for repeat visits
    const cachedData = mediaCache.get(cacheKey)

    if (cachedData && (now - cachedData.timestamp) < CACHE_TTL) {
      const mediaArray = cachedData.data
      setAllEntityMedia(mediaArray)

      if (mediaArray && mediaArray.length > 0) {
        // Find the best media based on user progress
        const availableMedia = mediaArray.filter(media => 
          !media.chapterNumber || media.chapterNumber <= userProgress
        )
        
        let selectedMedia
        if (availableMedia.length > 0) {
          // Get the media with the highest chapter number that user has unlocked
          selectedMedia = availableMedia.reduce((best, current) => {
            const bestChapter = best.chapterNumber || 0
            const currentChapter = current.chapterNumber || 0
            return currentChapter > bestChapter ? current : best
          })
        } else {
          // If no media meets progress requirements, use the first available
          selectedMedia = mediaArray[0]
        }
        
        const startIndex = mediaArray.indexOf(selectedMedia)
        setCurrentIndex(startIndex)
        setCurrentThumbnail(selectedMedia)
      } else {
        await fetchCurrentThumbnail()
      }
      setLoading(false)
      return
    }

    // Only show loading spinner when we actually need a network request
    setLoading(true)
    setError(null)
    setRetryCount(0)

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
        // Find the best media based on user progress
        const availableMedia = mediaArray.filter(media => 
          !media.chapterNumber || media.chapterNumber <= userProgress
        )
        
        let selectedMedia
        if (availableMedia.length > 0) {
          // Get the media with the highest chapter number that user has unlocked
          selectedMedia = availableMedia.reduce((best, current) => {
            const bestChapter = best.chapterNumber || 0
            const currentChapter = current.chapterNumber || 0
            return currentChapter > bestChapter ? current : best
          })
        } else {
          // If no media meets progress requirements, use the first available
          selectedMedia = mediaArray[0]
        }
        
        const startIndex = mediaArray.indexOf(selectedMedia)
        setCurrentIndex(startIndex)
        setCurrentThumbnail(selectedMedia)
      } else {
        await fetchCurrentThumbnail()
      }
    } catch (loadError: any) {
      if (signal.aborted) return

      console.error(`Error fetching ${entityType} media for ID ${entityId}:`, loadError)
      // Only try fallback thumbnail if not a rate limit error
      if (loadError?.status !== 429) {
        await fetchCurrentThumbnail()
      } else {
        setError('Rate limit exceeded. Please wait a moment and try again.')
      }
    }

    setLoading(false)
  }, [entityId, entityType, userProgress, fetchCurrentThumbnail, initialMedia])

  useEffect(() => {
    if (!isNearViewport) return

    loadMedia()

    // Cleanup function to abort request on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [loadMedia, isNearViewport])

  // Resolve media URLs for special platforms
  useEffect(() => {
    if (!currentThumbnail) return

    const url = currentThumbnail.url
    // Use a ref for the "already resolved" guard to avoid adding resolvedMediaInfo to deps
    if (resolvedUrlsRef.current.has(url)) return
    resolvedUrlsRef.current.add(url)

    const resolveMediaUrl = async () => {
      try {
        const mediaInfo = await analyzeMediaUrlAsync(url)

        if (mediaInfo.directImageUrl || mediaInfo.thumbnailUrl) {
          setResolvedMediaInfo(prev => ({
            ...prev,
            [url]: mediaInfo
          }))
        }
      } catch (error) {
        console.warn('Failed to resolve media URL:', url, error)
      }
    }

    resolveMediaUrl()
  }, [currentThumbnail])

  // Focus modal container for keyboard navigation
  useEffect(() => {
    if (isModalOpen) {
      const timer = setTimeout(() => modalContainerRef.current?.focus(), 50)
      return () => clearTimeout(timer)
    }
  }, [isModalOpen])

  const handleModalKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') handlePrevious()
    else if (e.key === 'ArrowRight') handleNext()
    else if (e.key === 'Escape') setIsModalOpen(false)
  }

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
          <div style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            overflow: 'hidden',
            display: 'block',
            contain: 'layout size style',
            margin: 0,
            padding: 0,
            boxSizing: 'border-box'
          }}>
            <ImageWithRetry
              src={imageUrl}
              alt={media.description || mediaInfo.title || `${entityName} image`}
              fill
              priority={priority}
              style={{
                objectFit: objectFit,
                objectPosition: objectPosition,
                margin: 0,
                padding: 0,
                border: 'none',
                outline: 'none'
              }}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        )
      }

      // Handle YouTube thumbnails
      if (mediaInfo.platform === 'youtube' && mediaInfo.thumbnailUrl) {
        return (
          <div style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <ImageWithRetry
              src={mediaInfo.thumbnailUrl}
              alt={media.description || `${entityName} video thumbnail`}
              fill
              priority={priority}
              style={{
                objectFit: objectFit,
                objectPosition: objectPosition,
                margin: 0,
                padding: 0,
                border: 'none',
                outline: 'none'
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

        // For DeviantArt CDN URLs with expired tokens, show a more specific message
        const isExpiredDeviantArt = mediaInfo.platform === 'deviantart' &&
          (media.url.includes('images-wixmp-') && media.url.includes('token='))

        // For DeviantArt, try to reconstruct a usable link to the original
        const getDeviantArtOriginalUrl = () => {
          // Try to extract the original DeviantArt page URL from the CDN URL
          // CDN URLs don't directly map back, so we link to DeviantArt search or the mediaInfo.originalUrl if available
          if (mediaInfo.originalUrl) {
            return mediaInfo.originalUrl
          }
          // Fallback to DeviantArt homepage if we can't determine the original
          return 'https://www.deviantart.com/'
        }

        const content = (
          <>
            <Text size={rem(32)} style={{ lineHeight: 1 }}>
              {placeholder.icon}
            </Text>
            <Text size="sm" fw={600} ta="center" style={{ color: placeholder.color }}>
              {placeholder.label}
            </Text>
            {isExpiredDeviantArt ? (
              <>
                <Text size="xs" ta="center" style={{ color: theme.colors.gray[6], maxWidth: '90%' }}>
                  Image temporarily unavailable
                </Text>
                <Text
                  component="a"
                  href={getDeviantArtOriginalUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  size="xs"
                  ta="center"
                  style={{
                    color: placeholder.color,
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    marginTop: rem(4)
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  View on DeviantArt
                </Text>
              </>
            ) : (
              <>
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
        <Box style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <ImageWithRetry
            src={media.url}
            alt={media.description || `${entityName} image`}
            fill
            style={{
              objectFit: 'cover',
              objectPosition: objectPosition,
              margin: 0,
              padding: 0,
              border: 'none',
              outline: 'none'
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
            objectFit: objectFit,
            objectPosition: objectPosition
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

  const renderModalMediaContent = (media: MediaItem) => {
    const resolvedInfo = resolvedMediaInfo[media.url]
    const mediaInfo = resolvedInfo || analyzeMediaUrl(media.url)

    if (media.type === 'image' && mediaInfo.isDirectImage) {
      const imageUrl = mediaInfo.directImageUrl || media.url
      const external = isExternalUrl(imageUrl)
      return external ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt={media.description || `${entityName} image`}
          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block' }}
        />
      ) : (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
          <Image
            src={imageUrl}
            alt={media.description || `${entityName} image`}
            fill
            style={{ objectFit: 'contain' }}
            sizes="90vw"
            priority
          />
        </div>
      )
    }

    if (media.type === 'video' && mediaInfo.platform === 'youtube' && mediaInfo.embedUrl) {
      return (
        <iframe
          src={mediaInfo.embedUrl}
          title={media.description || `${entityName} video`}
          style={{ width: '100%', height: '100%', border: 'none' }}
          allowFullScreen
        />
      )
    }

    if (media.type === 'video') {
      return (
        <video
          src={media.url}
          controls
          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
        />
      )
    }

    // Fallback: link to source
    return (
      <Box style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: rem(12) }}>
        <ImageIcon size={48} color="rgba(255,255,255,0.4)" />
        <Text c="dimmed" size="sm">
          {media.description || 'Media'}
        </Text>
        {media.url && (
          <Text
            component="a"
            href={media.url}
            target="_blank"
            rel="noopener noreferrer"
            size="sm"
            style={{ color: '#888', textDecoration: 'underline' }}
          >
            View source
          </Text>
        )}
      </Box>
    )
  }

  const renderEmptyState = () => {
    const smallestDimension = Math.min(
      typeof maxWidth === 'number' ? maxWidth : Infinity,
      typeof maxHeight === 'number' ? maxHeight : Infinity
    )
    const isSmallContainer = smallestDimension <= 32
    const isMediumContainer = smallestDimension > 32 && smallestDimension <= 80

    if (isSmallContainer) {
      return (
        <Box
          component={containerComponent}
          style={{
            width: '100%',
            height: '100%',
            maxWidth: maxWidth,
            maxHeight: maxHeight,
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

    if (isMediumContainer) {
      // Medium container - show icon only, no text
      const iconSize = Math.min(smallestDimension * 0.5, 32)
      return (
        <Box
          component={containerComponent}
          style={{
            width: '100%',
            height: '100%',
            maxWidth: maxWidth,
            maxHeight: maxHeight,
            display: inline ? 'inline-flex' : 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: theme.colors.gray[1],
            borderRadius: rem(6),
            border: `1px solid ${theme.colors.gray[4]}`
          }}
        >
          <ImageIcon size={iconSize} color={theme.colors.gray[5]} />
        </Box>
      )
    }

    return (
      <Box
        component={containerComponent}
        style={{
          width: '100%',
          height: '100%',
          maxWidth: maxWidth,
          maxHeight: maxHeight,
          display: inline ? 'inline-flex' : 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.colors.gray[0],
          borderRadius: rem(8),
          border: `2px dashed ${theme.colors.gray[4]}`
        }}
      >
        <Box style={{ textAlign: 'center' }}>
          <ImageIcon size={48} color={theme.colors.gray[5]} />
          <Text size="sm" c="dimmed" mt={rem(4)}>
            No thumbnail available
          </Text>
        </Box>
      </Box>
    )
  }

  // Not yet near the viewport — show an empty placeholder with the same
  // dimensions/background as the container so the layout doesn't shift.
  // The containerRef attached here is what the IntersectionObserver watches.
  if (!isNearViewport) {
    return (
      <Box
        component={containerComponent}
        ref={containerRef as React.Ref<HTMLDivElement>}
        className={className}
        style={containerStyles}
      />
    )
  }

  if (loading) {
    return (
      <Box
        component={containerComponent}
        className={className}
        style={{
          width: '100%',
          height: '100%',
          maxWidth: maxWidth,
          maxHeight: maxHeight,
          display: inline ? 'inline-flex' : 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.colors.gray?.[0] ?? '#f8f9fa',
          borderRadius: rem(8)
        }}
      >
        <Loader style={{ color: getEntityThemeColor(theme, 'gamble') }} />
      </Box>
    )
  }

  if (error) {
    return (
      <Alert
        variant="light"
        radius="md"
        icon={<AlertTriangle size={16} />}
        style={{
          color: getEntityThemeColor(theme, 'gamble'),
          width: '100%',
          height: '100%',
          maxWidth: maxWidth,
          maxHeight: maxHeight,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {error}
      </Alert>
    )
  }

  if (!currentThumbnail) {
    // If hideIfEmpty is true, return null instead of showing empty state
    if (hideIfEmpty) {
      return null
    }

    // Create a dummy media item for spoiler logic when there's no actual media
    const dummyMedia: MediaItem = {
      id: 0,
      url: '',
      type: 'image',
      chapterNumber: spoilerChapter
    }

    // Wrap empty state in spoiler wrapper if there's a spoiler chapter
    if (spoilerChapter) {
      return (
        <Box component={containerComponent} className={className} style={containerStyles}>
          <MediaSpoilerWrapper media={dummyMedia} userProgress={userProgress} spoilerChapter={spoilerChapter} onRevealed={onSpoilerRevealed}>
            {renderEmptyState()}
          </MediaSpoilerWrapper>
        </Box>
      )
    }

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

  const canExpand = allowFullView && currentThumbnail && !inline &&
    (!numericMaxWidth || numericMaxWidth > 64)

  const currentMediaInfo = currentThumbnail
    ? (resolvedMediaInfo[currentThumbnail.url] || analyzeMediaUrl(currentThumbnail.url))
    : null
  const showBlurLayer =
    showBlurredBackground &&
    !!currentThumbnail &&
    currentThumbnail.type === 'image' &&
    !!currentMediaInfo?.isDirectImage

  return (
    <>
      <Box
        component={containerComponent}
        ref={containerRef as React.Ref<HTMLDivElement>}
        className={className}
        style={{
          ...containerStyles,
          ...(canExpand ? { cursor: 'zoom-in' } : {})
        }}
        onClick={canExpand ? () => setIsModalOpen(true) : undefined}
      >
        {showBlurLayer && currentThumbnail && (
          <Box
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 0,
              pointerEvents: 'none',
              overflow: 'hidden',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentMediaInfo?.directImageUrl || currentThumbnail.url}
              alt=""
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: 'scale(1.08)',
                filter: 'blur(20px) brightness(0.3) saturate(0.6)',
                display: 'block',
              }}
            />
          </Box>
        )}
        <MediaSpoilerWrapper media={currentThumbnail} userProgress={userProgress} spoilerChapter={spoilerChapter} onRevealed={onSpoilerRevealed}>
          {mediaContent}
        </MediaSpoilerWrapper>

        {showControls && (
          // TODO: controlsPosition='right' hero path is no longer used by DetailPageHeader
          // (hero controls are now rendered directly in DetailPageHeader).
          // Can be removed once confirmed no other callers use it.
          controlsPosition === 'right' ? (
            /* Hero mode: clickable dot strip + count badge, no arrows */
            <Box
              style={{
                position: 'absolute',
                bottom: rem(10),
                right: rem(10),
                display: 'flex',
                gap: rem(2),
                alignItems: 'center',
                backgroundColor: 'rgba(0,0,0,0.72)',
                borderRadius: rem(20),
                border: '1px solid rgba(255,255,255,0.08)',
                paddingInline: rem(10),
                paddingBlock: rem(7),
                zIndex: 30,
              }}
            >
              {allEntityMedia.map((_, idx) => (
                <Box
                  key={idx}
                  onClick={(e) => { e.stopPropagation(); setCurrentIndex(idx); setCurrentThumbnail(allEntityMedia[idx]) }}
                  style={{
                    padding: rem(4),
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Box
                    style={{
                      width: idx === currentIndex ? rem(14) : rem(9),
                      height: idx === currentIndex ? rem(14) : rem(9),
                      borderRadius: '50%',
                      backgroundColor: idx === currentIndex ? '#ffffff' : 'rgba(255,255,255,0.45)',
                      transition: 'all 0.22s ease',
                      flexShrink: 0,
                      boxShadow: idx === currentIndex ? '0 0 0 3px rgba(255,255,255,0.15)' : 'none',
                    }}
                  />
                </Box>
              ))}
              <Box style={{ width: 1, height: rem(14), backgroundColor: 'rgba(255,255,255,0.15)', marginInline: rem(2), flexShrink: 0 }} />
              <Text style={{ fontSize: rem(11), color: 'rgba(255,255,255,0.65)', lineHeight: 1, whiteSpace: 'nowrap' }}>
                {currentIndex + 1} / {allEntityMedia.length}
              </Text>
            </Box>
          ) : isMobile ? (
            <>
              {/* Mobile: single › arrow on right edge */}
              <ActionIcon
                variant="light"
                size="md"
                radius="xl"
                onClick={(e) => { e.stopPropagation(); handleNext() }}
                aria-label="Next image"
                style={{
                  position: 'absolute',
                  right: rem(8),
                  top: '50%',
                  transform: 'translateY(-50%)',
                  backgroundColor: 'rgba(0,0,0,0.58)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#ffffff',
                  zIndex: 30,
                }}
              >
                <ChevronRight size={18} />
              </ActionIcon>

              {/* Mobile: full-width dot strip pinned at bottom */}
              <Box
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: rem(18),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: rem(5),
                  backgroundColor: 'rgba(0,0,0,0.72)',
                  zIndex: 30,
                  pointerEvents: 'none',
                }}
              >
                {allEntityMedia.map((_, idx) => (
                  <Box
                    key={idx}
                    style={{
                      width: idx === currentIndex ? rem(6) : rem(5),
                      height: idx === currentIndex ? rem(6) : rem(5),
                      borderRadius: '50%',
                      backgroundColor: idx === currentIndex ? '#ffffff' : 'rgba(255,255,255,0.35)',
                      transition: 'all 0.22s ease',
                      flexShrink: 0,
                    }}
                  />
                ))}
              </Box>
            </>
          ) : (
            <>
              {/* Desktop center: both ‹ › arrows */}
              <ActionIcon
                variant="light"
                size="md"
                radius="xl"
                onClick={(e) => { e.stopPropagation(); handlePrevious() }}
                aria-label="Previous image"
                style={{
                  position: 'absolute',
                  left: rem(8),
                  top: '50%',
                  transform: 'translateY(-50%)',
                  backgroundColor: 'rgba(0,0,0,0.58)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#ffffff',
                  zIndex: 30,
                }}
              >
                <ChevronLeft size={18} />
              </ActionIcon>

              <ActionIcon
                variant="light"
                size="md"
                radius="xl"
                onClick={(e) => { e.stopPropagation(); handleNext() }}
                aria-label="Next image"
                style={{
                  position: 'absolute',
                  right: rem(8),
                  top: '50%',
                  transform: 'translateY(-50%)',
                  backgroundColor: 'rgba(0,0,0,0.58)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#ffffff',
                  zIndex: 30,
                }}
              >
                <ChevronRight size={18} />
              </ActionIcon>

              {/* Desktop center: frosted-pill dot indicator */}
              <Box
                style={{
                  position: 'absolute',
                  bottom: rem(10),
                  left: '50%',
                  transform: 'translateX(-50%)',
                  display: 'flex',
                  gap: rem(5),
                  alignItems: 'center',
                  backgroundColor: 'rgba(0,0,0,0.52)',
                  borderRadius: rem(12),
                  paddingInline: rem(8),
                  paddingBlock: rem(5),
                  zIndex: 30,
                  pointerEvents: 'none',
                }}
              >
                {allEntityMedia.map((_, idx) => (
                  <Box
                    key={idx}
                    style={{
                      width: idx === currentIndex ? rem(8) : rem(5),
                      height: idx === currentIndex ? rem(8) : rem(5),
                      borderRadius: '50%',
                      backgroundColor: idx === currentIndex ? '#ffffff' : 'rgba(255,255,255,0.35)',
                      transition: 'all 0.22s ease',
                      flexShrink: 0,
                    }}
                  />
                ))}
              </Box>
            </>
          )
        )}

      </Box>

      {/* Fullscreen lightbox modal */}
      {allowFullView && currentThumbnail && (
        <Modal
          opened={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          size="auto"
          centered
          withCloseButton={false}
          padding={0}
          overlayProps={{ blur: 10, backgroundOpacity: 0.94, color: '#000' }}
          styles={{
            content: {
              background: '#080c14',
              borderRadius: rem(12),
              border: '1px solid rgba(255,255,255,0.07)',
              overflow: 'hidden',
              maxWidth: '92vw',
              width: 'auto',
            },
            body: { padding: 0 },
          }}
        >
          <div
            ref={modalContainerRef}
            tabIndex={-1}
            onKeyDown={handleModalKeyDown}
            style={{ outline: 'none' }}
          >
            {/* Top bar */}
            <Box
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: `${rem(12)} ${rem(16)}`,
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                background: 'rgba(0,0,0,0.4)',
              }}
            >
              <Text
                size="xs"
                style={{
                  color: 'rgba(255,255,255,0.5)',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  fontWeight: 600,
                }}
              >
                {entityName || 'Image'}
                {allEntityMedia.length > 1 && (
                  <span style={{ marginLeft: rem(10), color: 'rgba(255,255,255,0.28)' }}>
                    {currentIndex + 1} of {allEntityMedia.length}
                  </span>
                )}
              </Text>
              <ActionIcon
                variant="subtle"
                size="sm"
                onClick={() => setIsModalOpen(false)}
                aria-label="Close"
                style={{ color: 'rgba(255,255,255,0.6)' }}
              >
                <X size={16} />
              </ActionIcon>
            </Box>

            {/* Image area */}
            <Box
              style={{
                position: 'relative',
                width: 'min(88vw, 860px)',
                height: 'min(76vh, 640px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#050810',
              }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentThumbnail.id}
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {renderModalMediaContent(currentThumbnail)}
                </motion.div>
              </AnimatePresence>

              {/* Prev / Next buttons in modal */}
              {allEntityMedia.length > 1 && (
                <>
                  <ActionIcon
                    variant="light"
                    size="lg"
                    radius="xl"
                    onClick={handlePrevious}
                    aria-label="Previous image"
                    style={{
                      position: 'absolute',
                      left: rem(12),
                      top: '50%',
                      transform: 'translateY(-50%)',
                      backgroundColor: 'rgba(0,0,0,0.6)',
                      color: '#fff',
                      zIndex: 10,
                      border: '1px solid rgba(255,255,255,0.1)',
                    }}
                  >
                    <ChevronLeft size={22} />
                  </ActionIcon>
                  <ActionIcon
                    variant="light"
                    size="lg"
                    radius="xl"
                    onClick={handleNext}
                    aria-label="Next image"
                    style={{
                      position: 'absolute',
                      right: rem(12),
                      top: '50%',
                      transform: 'translateY(-50%)',
                      backgroundColor: 'rgba(0,0,0,0.6)',
                      color: '#fff',
                      zIndex: 10,
                      border: '1px solid rgba(255,255,255,0.1)',
                    }}
                  >
                    <ChevronRight size={22} />
                  </ActionIcon>
                </>
              )}
            </Box>

            {/* Bottom bar: dots + description */}
            <Box
              style={{
                padding: `${rem(12)} ${rem(20)}`,
                borderTop: '1px solid rgba(255,255,255,0.06)',
                background: 'rgba(0,0,0,0.3)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: rem(8),
              }}
            >
              {/* Dot indicators */}
              {allEntityMedia.length > 1 && (
                <Box style={{ display: 'flex', gap: rem(6), alignItems: 'center' }}>
                  {allEntityMedia.map((_, idx) => (
                    <Box
                      key={idx}
                      onClick={() => {
                        setCurrentIndex(idx)
                        setCurrentThumbnail(allEntityMedia[idx])
                      }}
                      style={{
                        width: idx === currentIndex ? rem(10) : rem(6),
                        height: idx === currentIndex ? rem(10) : rem(6),
                        borderRadius: '50%',
                        backgroundColor: idx === currentIndex ? '#fff' : 'rgba(255,255,255,0.28)',
                        transition: 'all 0.22s ease',
                        cursor: 'pointer',
                        flexShrink: 0,
                      }}
                    />
                  ))}
                </Box>
              )}

              {/* Description */}
              {currentThumbnail.description && (
                <Text
                  size="xs"
                  ta="center"
                  style={{ color: 'rgba(255,255,255,0.45)', maxWidth: 520 }}
                >
                  {currentThumbnail.description}
                </Text>
              )}

              {/* Chapter badge */}
              {currentThumbnail.chapterNumber && (
                <Text
                  size="xs"
                  style={{
                    color: 'rgba(255,255,255,0.3)',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    fontSize: rem(10),
                  }}
                >
                  Chapter {currentThumbnail.chapterNumber}
                </Text>
              )}
            </Box>
          </div>
        </Modal>
      )}
    </>
  )
}

function MediaSpoilerWrapper({
  media,
  userProgress,
  spoilerChapter,
  onRevealed,
  children
}: {
  media: MediaItem
  userProgress: number
  spoilerChapter?: number
  onRevealed?: () => void
  children: React.ReactNode
}) {
  const [isRevealed, setIsRevealed] = useState(false)
  const { settings } = useSpoilerSettings()

  const chapterNumber = media.chapterNumber ?? spoilerChapter

  const effectiveProgress = settings.chapterTolerance > 0
    ? settings.chapterTolerance
    : userProgress

  const shouldHide = (() => {
    if (settings.showAllSpoilers) return false
    if (chapterNumber) {
      if (effectiveProgress === 0) return false
      return chapterNumber > effectiveProgress
    }
    return media.isSpoiler ?? false
  })()

  if (!shouldHide || isRevealed) {
    return <>{children}</>
  }

  return (
    <Box style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Box style={{ opacity: 0.3, filter: 'blur(2px)', width: '100%', height: '100%', pointerEvents: 'none' }}>
        {children}
      </Box>
      <SpoilerOverlay
        chapterNumber={chapterNumber}
        onReveal={() => {
          setIsRevealed(true)
          onRevealed?.()
        }}
      />
    </Box>
  )
}
