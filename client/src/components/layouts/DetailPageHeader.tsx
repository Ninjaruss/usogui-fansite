'use client'

import React from 'react'
import { Box, Card, Stack, Title, useMantineTheme } from '@mantine/core'
import {
  getEntityThemeColor,
  backgroundStyles,
  getCardStyles,
  type EntityAccentKey
} from '../../lib/mantine-theme'
import { mangaPatterns } from '../../lib/manga-decorations'
import { EntitySuitWatermark, SpeedLines } from '../decorative/MangaPatterns'
import MediaThumbnail from '../MediaThumbnail'

interface DetailPageHeaderProps {
  /** Entity type for theming */
  entityType: EntityAccentKey
  /** Entity ID for media lookup */
  entityId: number
  /** Entity display name */
  entityName: string
  /** Below-portrait content (badges, stats, etc.) */
  children?: React.ReactNode
  /** Image width (default 200px) */
  imageWidth?: string
  /** Image height (default 280px) */
  imageHeight?: string
  /** Whether to show the entity image */
  showImage?: boolean
  /** Chapter number for spoiler protection */
  spoilerChapter?: number | null
  /** Callback when spoiler is revealed */
  onSpoilerRevealed?: () => void
}

export function DetailPageHeader({
  entityType,
  entityId,
  entityName,
  children,
  imageWidth = '200px',
  imageHeight = '280px',
  showImage = true,
  spoilerChapter,
  onSpoilerRevealed,
}: DetailPageHeaderProps) {
  const theme = useMantineTheme()
  const accentColor = getEntityThemeColor(theme, entityType)

  return (
    <Card
      withBorder
      radius="lg"
      shadow="lg"
      p={0}
      style={{
        ...getCardStyles(theme, accentColor),
        border: `2px solid ${accentColor}`,
        position: 'relative',
        overflow: 'hidden',
        boxShadow: `0 24px 64px ${accentColor}22, 0 8px 24px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)`
      }}
    >
      {/* Top accent stripe */}
      <Box
        aria-hidden
        style={{
          height: 4,
          background: `linear-gradient(90deg, ${accentColor}FF 0%, ${accentColor}88 40%, transparent 100%)`,
        }}
      />

      {/* Halftone pattern overlay */}
      <Box
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          ...mangaPatterns.halftoneBackground(`${accentColor}20`, 12),
          pointerEvents: 'none'
        }}
      />

      {/* Speed lines overlay */}
      <SpeedLines color={`${accentColor}05`} angle={-20} />

      {/* Suit watermark */}
      <EntitySuitWatermark
        entityType={entityType}
        color={accentColor}
        size={150}
        style={{
          bottom: -20,
          right: -20,
          opacity: 0.09
        }}
      />

      {/* Cinematic centered layout */}
      <Box style={{ position: 'relative', zIndex: 1 }}>
        {/* Page-colored fade at bottom */}
        <Box
          aria-hidden
          style={{
            position: 'absolute',
            bottom: 0, left: 0, right: 0,
            height: '40%',
            background: `linear-gradient(0deg, ${backgroundStyles.page(theme)} 0%, transparent 100%)`,
            pointerEvents: 'none',
            zIndex: 2,
          }}
        />

        {/* Portrait */}
        {showImage && (
          <Box style={{ display: 'flex', justifyContent: 'center', paddingTop: theme.spacing.xl, position: 'relative', zIndex: 1 }}>
            <Card
              style={{
                ...getCardStyles(theme, accentColor),
                width: imageWidth,
                height: imageHeight,
                overflow: 'hidden',
                position: 'relative',
              }}
              p={0}
              radius="md"
            >
              <MediaThumbnail
                entityType={entityType}
                entityId={entityId}
                entityName={entityName}
                allowCycling={false}
                maxWidth={imageWidth}
                maxHeight={imageHeight}
                spoilerChapter={spoilerChapter ?? undefined}
                onSpoilerRevealed={onSpoilerRevealed}
              />
            </Card>
          </Box>
        )}

        {/* Name + children below portrait */}
        <Stack
          align="center"
          gap={theme.spacing.sm}
          style={{
            padding: `${theme.spacing.lg} ${theme.spacing.xl} ${theme.spacing.xl}`,
            position: 'relative',
            zIndex: 3,
          }}
        >
          <Title
            order={1}
            ta="center"
            style={{
              fontSize: 'clamp(1.6rem, 4vw, 2.8rem)',
              fontFamily: 'var(--font-opti-goudy-text)',
              textShadow: `0 2px 24px ${accentColor}50`,
            }}
          >
            {entityName}
          </Title>
          {children}
        </Stack>
      </Box>
    </Card>
  )
}

export default DetailPageHeader
