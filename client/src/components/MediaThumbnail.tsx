'use client'

import React, { useEffect, useMemo, useState } from 'react'
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
import { ChevronLeft, ChevronRight, Image as ImageIcon, AlertTriangle } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import Image from 'next/image'
import { useProgress } from '../providers/ProgressProvider'
import { useSpoilerSettings } from '../hooks/useSpoilerSettings'
import { api } from '../lib/api'

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
  inline = false
}: MediaThumbnailProps) {
  const [currentThumbnail, setCurrentThumbnail] = useState<MediaItem | null>(null)
  const [allEntityMedia, setAllEntityMedia] = useState<MediaItem[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  const fetchCurrentThumbnail = async () => {
    try {
      const thumbnail = await api.getThumbnailForUserProgress(
        entityType,
        entityId,
        userProgress
      )
      setCurrentThumbnail(thumbnail)
    } catch (thumbnailError) {
      console.error(`Error fetching ${entityType} thumbnail:`, thumbnailError)
      setCurrentThumbnail(null)
    }
  }

  useEffect(() => {
    const loadMedia = async () => {
      setLoading(true)
      setError(null)

      let finalEntityType = entityType
      if (finalEntityType === ('organization' as any)) {
        finalEntityType = 'organization'
      }

      try {
        const response = await api.getEntityDisplayMediaForCycling(
          finalEntityType,
          entityId,
          userProgress
        )
        const mediaArray = response?.data || []
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
      } catch (loadError) {
        console.error(`Error fetching ${entityType} media:`, loadError)
        await fetchCurrentThumbnail()
      }

      setLoading(false)
    }

    loadMedia()
  }, [entityId, entityType, userProgress])

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
    if (media.type === 'image') {
      return (
        <Image
          src={media.url}
          alt={media.description || `${entityName} image`}
          fill
          style={{
            objectFit: 'cover',
            objectPosition: 'center'
          }}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          onError={() => {
            console.error('Image failed to load:', media.url)
            setError('Failed to load image')
          }}
        />
      )
    }

    if (media.type === 'video') {
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
        <Loader color="red" />
      </Box>
    )
  }

  if (error) {
    return (
      <Alert
        color="red"
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
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
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
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
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
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
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
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
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
