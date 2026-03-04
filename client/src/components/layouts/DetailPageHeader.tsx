'use client'

import React from 'react'
import { Box, Card, Group, Stack, useMantineTheme } from '@mantine/core'
import {
  getEntityThemeColor,
  getCardStyles,
  type EntityAccentKey
} from '../../lib/mantine-theme'
import { mangaPatterns } from '../../lib/manga-decorations'
import { EntitySuitWatermark } from '../decorative/MangaPatterns'
import MediaThumbnail from '../MediaThumbnail'
import ErrorBoundary from '../ErrorBoundary'

interface DetailPageHeaderProps {
  /** Entity type for theming */
  entityType: EntityAccentKey
  /** Entity ID for media lookup */
  entityId: number
  /** Entity display name */
  entityName: string
  /** Right-side content (title, badges, stats) */
  children: React.ReactNode
  /** Image width (default 200px) */
  imageWidth?: string
  /** Image height (default 280px) */
  imageHeight?: string
  /** Whether to show the entity image */
  showImage?: boolean
}

export function DetailPageHeader({
  entityType,
  entityId,
  entityName,
  children,
  imageWidth = '200px',
  imageHeight = '280px',
  showImage = true
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
        overflow: 'hidden'
      }}
    >
      {/* Halftone pattern overlay */}
      <Box
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          ...mangaPatterns.halftoneBackground(`${accentColor}0a`, 12),
          pointerEvents: 'none'
        }}
      />

      {/* Suit watermark */}
      <EntitySuitWatermark
        entityType={entityType}
        color={accentColor}
        size={120}
        style={{
          bottom: -20,
          right: -20,
          opacity: 0.04
        }}
      />

      {/* Content */}
      <Box p={theme.spacing.lg} style={{ position: 'relative', zIndex: 1 }}>
        <Group gap={theme.spacing.lg} align="flex-start" wrap="wrap" justify="center">
          {showImage && (
            <Box style={{ flexShrink: 0 }}>
              <Box
                style={{
                  width: imageWidth,
                  height: imageHeight,
                  borderRadius: theme.radius.md,
                  overflow: 'hidden',
                  border: `3px solid ${accentColor}`,
                  boxShadow: theme.shadows.xl,
                  transition: `all ${theme.other?.transitions?.durationStandard || 250}ms ${theme.other?.transitions?.easingStandard || 'ease-in-out'}`
                }}
              >
                <ErrorBoundary>
                  <MediaThumbnail
                    entityType={entityType}
                    entityId={entityId}
                    entityName={entityName}
                    maxWidth={imageWidth}
                    maxHeight={imageHeight}
                  />
                </ErrorBoundary>
              </Box>
            </Box>
          )}

          <Stack gap={theme.spacing.md} style={{ flex: 1, minWidth: '280px' }} justify="space-between">
            {children}
          </Stack>
        </Group>
      </Box>
    </Card>
  )
}

export default DetailPageHeader
