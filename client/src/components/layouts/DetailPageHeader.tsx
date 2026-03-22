'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Box, Title, Text, Modal, ActionIcon, Loader, rem, useMantineTheme } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import Image from 'next/image'
import {
  getEntityThemeColor,
  type EntityAccentKey,
} from '../../lib/mantine-theme'
import { analyzeMediaUrl, isExternalUrl } from '../../lib/media-utils'
import { api } from '../../lib/api'
import { useProgress } from '../../providers/ProgressProvider'
import MediaThumbnail, { type MediaItem } from '../MediaThumbnail'

interface StatItem {
  value: string | number
  label: string
}

interface TagItem {
  label: string
  variant: 'accent' | 'neutral'
}

interface DetailPageHeaderProps {
  /** Entity type key — drives theming */
  entityType: EntityAccentKey
  /** Entity ID for MediaThumbnail */
  entityId: number
  /** Large serif name */
  entityName: string
  /** Up to 3 key stats shown below the name */
  stats?: StatItem[]
  /** Chips shown below stats */
  tags?: TagItem[]
  /** Whether to render the portrait area */
  showImage?: boolean
  /** Spoiler gate chapter for the portrait */
  spoilerChapter?: number | null
  /** Called when portrait spoiler is dismissed */
  onSpoilerRevealed?: () => void
  /** Any per-page additions rendered at the bottom of the content column */
  children?: React.ReactNode
  /** Optional pre-fetched media list; skips the internal API call if provided. */
  initialMedia?: MediaItem[]
}

export function DetailPageHeader({
  entityType,
  entityId,
  entityName,
  stats,
  tags,
  showImage = true,
  spoilerChapter,
  onSpoilerRevealed,
  children,
  initialMedia,
}: DetailPageHeaderProps) {
  const theme = useMantineTheme()
  const accentColor = getEntityThemeColor(theme, entityType)

  const { userProgress } = useProgress()
  const isMobile = useMediaQuery('(max-width: 768px)')

  const [allMedia, setAllMedia]           = useState<MediaItem[]>(initialMedia ?? [])
  const [currentIndex, setCurrentIndex]   = useState(0)
  const [isPortraitHovered, setIsPortraitHovered] = useState(false)
  const [isModalOpen, setIsModalOpen]     = useState(false)

  const loadMedia = useCallback(async () => {
    // Skip API call if caller provided pre-fetched media
    if (initialMedia && initialMedia.length > 0) {
      setAllMedia(initialMedia)
      return
    }
    try {
      const validMediaOwnerTypes = [
        'character', 'arc', 'event', 'gamble', 'organization', 'user',
        'volume', 'chapter', 'guide', 'quote', 'media',
      ] as const
      type ValidMediaOwnerType = typeof validMediaOwnerTypes[number]
      if (!(validMediaOwnerTypes as readonly string[]).includes(entityType)) return
      const response = await api.getEntityDisplayMediaForCycling(
        entityType as ValidMediaOwnerType,
        entityId,
        userProgress
      )
      const mediaArray: MediaItem[] = response?.data ?? []
      setAllMedia(mediaArray)
      if (mediaArray.length > 0) {
        const available = mediaArray.filter(
          m => !m.isSpoiler && (!m.chapterNumber || m.chapterNumber <= userProgress)
        )
        const selected =
          available.length > 0
            ? available.reduce((best, curr) =>
                (curr.chapterNumber ?? 0) > (best.chapterNumber ?? 0) ? curr : best
              )
            : mediaArray[0]
        setCurrentIndex(mediaArray.indexOf(selected))
      }
    } catch {
      // Silently fail — header renders without portrait
    }
  }, [entityType, entityId, userProgress, initialMedia])

  useEffect(() => {
    if (showImage !== false) loadMedia()
  }, [loadMedia, showImage])

  const currentMedia = allMedia[currentIndex] ?? null

  const handlePrev = useCallback(() => {
    setCurrentIndex(i => (i > 0 ? i - 1 : allMedia.length - 1))
  }, [allMedia.length])

  const handleNext = useCallback(() => {
    setCurrentIndex(i => (i < allMedia.length - 1 ? i + 1 : 0))
  }, [allMedia.length])

  const renderLightboxImage = (media: MediaItem) => {
    const mediaInfo = analyzeMediaUrl(media.url)
    if (media.type === 'image' && mediaInfo.isDirectImage) {
      const url = mediaInfo.directImageUrl || media.url
      if (isExternalUrl(url)) {
        // eslint-disable-next-line @next/next/no-img-element
        return (
          <img
            src={url}
            alt={media.description || entityName}
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block' }}
          />
        )
      }
      return (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
          <Image
            src={url}
            alt={media.description || entityName}
            fill
            style={{ objectFit: 'contain' }}
            sizes="90vw"
            priority
          />
        </div>
      )
    }
    return <Text c="dimmed" size="sm">{media.description || 'Media'}</Text>
  }

  return (
    <Box
      style={{
        position: 'relative',
        height: 280,
        overflow: 'hidden',
        borderRadius: 10,
        background: '#080c14',
      }}
    >
      {/* Atmospheric background */}
      <Box
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse 60% 80% at 70% 50%, ${accentColor}12 0%, transparent 60%), linear-gradient(135deg, #0a0f1e 0%, #080c14 100%)`,
        }}
      />

      {/* Dot texture */}
      <Box
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '16px 16px',
          opacity: 0.5,
          pointerEvents: 'none',
        }}
      />

      {/* Left-edge entity color strip */}
      <Box
        aria-hidden
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 3,
          background: `linear-gradient(180deg, ${accentColor} 0%, ${accentColor}10 100%)`,
          zIndex: 4,
        }}
      />

      {/* Portrait area — full bleed background */}
      {showImage ? (
        <Box
          className="detail-hero-portrait"
          style={{
            position: 'absolute',
            inset: 0,
            overflow: 'hidden',
          }}
        >
          <MediaThumbnail
            entityType={entityType}
            entityId={entityId}
            entityName={entityName}
            allowCycling={true}
            allowFullView={true}
            maxWidth="100%"
            maxHeight="100%"
            spoilerChapter={spoilerChapter ?? undefined}
            onSpoilerRevealed={onSpoilerRevealed}
            objectFit="contain"
            objectPosition="center top"
            controlsPosition="right"
            showBlurredBackground={true}
          />
          {/* Left-edge fade blending portrait into content */}
          <Box
            aria-hidden
            className="detail-hero-portrait-fade"
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: '60%',
              background: 'linear-gradient(90deg, #080c14 0%, rgba(8,12,20,0.75) 55%, transparent 100%)',
              zIndex: 2,
              pointerEvents: 'none',
            }}
          />
          {/* Bottom fade */}
          <Box
            aria-hidden
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: 60,
              background: 'linear-gradient(0deg, #080c14, transparent)',
              zIndex: 2,
              pointerEvents: 'none',
            }}
          />
        </Box>
      ) : (
        /* No-image fallback: entity-tinted glow on right side */
        <Box
          aria-hidden
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: '42%',
            background: `linear-gradient(160deg, ${accentColor}18 0%, transparent 70%)`,
          }}
        />
      )}

      {/* Content column — left 65% desktop, full width mobile, bottom-anchored */}
      {/* pointerEvents: none so cycling arrows in the portrait beneath remain clickable */}
      <Box
        className="detail-hero-content"
        style={{
          position: 'absolute',
          left: 0,
          bottom: 0,
          top: 0,
          width: '65%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          padding: '28px 32px',
          zIndex: 3,
          pointerEvents: 'none',
        }}
      >
        <Box style={{ pointerEvents: 'auto' }}>
        {/* Eyebrow label */}
        <Box style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <Box
            aria-hidden
            style={{ width: 18, height: 2, background: accentColor, flexShrink: 0 }}
          />
          <Text
            style={{
              fontSize: 10,
              letterSpacing: '3px',
              textTransform: 'uppercase',
              color: accentColor,
              fontWeight: 700,
            }}
          >
            {entityType}
          </Text>
        </Box>

        {/* Entity name */}
        <Title
          order={1}
          style={{
            fontSize: 'clamp(28px, 4vw, 46px)',
            fontFamily: 'var(--font-opti-goudy-text)',
            fontWeight: 900,
            letterSpacing: -1,
            color: '#fff',
            lineHeight: 1,
            marginBottom: 14,
            textShadow: '0 2px 24px rgba(0,0,0,0.9)',
          }}
        >
          {entityName}
        </Title>

        {/* Stats row */}
        {stats && stats.length > 0 && (
          <Box style={{ display: 'flex', alignItems: 'center', marginBottom: 14 }}>
            {stats.map((stat, i) => (
              <React.Fragment key={stat.label}>
                {i > 0 && (
                  <Box
                    aria-hidden
                    style={{
                      width: 1,
                      background: '#222',
                      alignSelf: 'stretch',
                      marginLeft: 20,
                    }}
                  />
                )}
                <Box
                  style={{
                    paddingLeft: i > 0 ? 20 : 0,
                    paddingRight: 20,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                  }}
                >
                  <Text
                    style={{ fontSize: 20, fontWeight: 800, color: accentColor, lineHeight: 1 }}
                  >
                    {stat.value}
                  </Text>
                  <Text
                    style={{
                      fontSize: 9,
                      textTransform: 'uppercase',
                      letterSpacing: '1.5px',
                      color: '#555',
                    }}
                  >
                    {stat.label}
                  </Text>
                </Box>
              </React.Fragment>
            ))}
          </Box>
        )}

        {/* Tags */}
        {tags && tags.length > 0 && (
          <Box style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: children ? 12 : 0 }}>
            {tags.map((tag) => (
              <Box
                key={tag.label}
                style={{
                  padding: '3px 9px',
                  borderRadius: 3,
                  fontSize: 10,
                  fontWeight: 600,
                  ...(tag.variant === 'accent'
                    ? {
                        background: `${accentColor}1f`,
                        border: `1px solid ${accentColor}38`,
                        color: accentColor,
                      }
                    : {
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        color: '#666',
                      }),
                }}
              >
                {tag.label}
              </Box>
            ))}
          </Box>
        )}

        {children}
        </Box>
      </Box>
    </Box>
  )
}

export default DetailPageHeader
