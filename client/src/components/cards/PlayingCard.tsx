'use client'

import React from 'react'
import { Card, Box, Badge, Text, ActionIcon, Tooltip, rem, useMantineTheme } from '@mantine/core'
import Link from 'next/link'
import { Camera } from 'lucide-react'
import { getPlayingCardStyles, getEntityThemeColor, type EntityAccentKey } from '../../lib/mantine-theme'
import { entitySuit, suitPaths, mangaPatterns } from '../../lib/manga-decorations'
import MediaThumbnail from '../MediaThumbnail'

export type CardVariant = 'portrait' | 'landscape' | 'square'

interface PlayingCardProps {
  /** Entity type for theming */
  entityType: EntityAccentKey
  /** Link destination */
  href: string
  /** Entity ID for media lookup */
  entityId: number
  /** Entity display name */
  name: string
  /** Chapter badge text (e.g., "Ch. 42") */
  chapterBadge?: string
  /** Whether the current user can edit content */
  canEdit?: boolean
  /** Handler for edit button click */
  onEditClick?: (e: React.MouseEvent) => void

  // Hover/touch behavior
  onMouseEnter?: (e: React.MouseEvent) => void
  onMouseLeave?: () => void
  onClick?: (e: React.MouseEvent) => void
  isTouchDevice?: boolean
  isHovered?: boolean

  // Spoiler
  spoilerChapter?: number | null
  onSpoilerRevealed?: () => void

  // Visual
  variant?: CardVariant
  /** Additional content rendered below the name */
  subtitle?: React.ReactNode
}

const variantDimensions: Record<CardVariant, { maxWidth: number; maxHeight: number }> = {
  portrait: { maxWidth: 200, maxHeight: 230 },
  landscape: { maxWidth: 300, maxHeight: 180 },
  square: { maxWidth: 220, maxHeight: 220 }
}

export function PlayingCard({
  entityType,
  href,
  entityId,
  name,
  chapterBadge,
  canEdit,
  onEditClick,
  onMouseEnter,
  onMouseLeave,
  onClick,
  isTouchDevice,
  isHovered,
  spoilerChapter,
  onSpoilerRevealed,
  variant = 'portrait',
  subtitle
}: PlayingCardProps) {
  const theme = useMantineTheme()
  const accentColor = getEntityThemeColor(theme, entityType)
  const suit = entitySuit[entityType]
  const dims = variantDimensions[variant]

  return (
    <Card
      component={Link}
      href={href}
      withBorder={false}
      radius="lg"
      shadow="sm"
      className={`hoverable-card hoverable-card-${entityType}`}
      style={{
        ...getPlayingCardStyles(theme, accentColor),
        position: 'relative'
      }}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Suit icon in top-right corner */}
      <Box
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: rem(6),
          right: rem(6),
          zIndex: 5,
          opacity: 0.12,
          width: rem(16),
          height: rem(16)
        }}
      >
        <svg viewBox="0 0 24 24" width={16} height={16} fill={accentColor}>
          <path d={suitPaths[suit]} />
        </svg>
      </Box>

      {/* Chapter Badge at Top Left */}
      {chapterBadge && (
        <Badge
          variant="filled"
          radius="sm"
          size="sm"
          c="white"
          style={{
            position: 'absolute',
            top: rem(8),
            left: rem(8),
            backgroundColor: accentColor,
            fontSize: rem(10),
            fontWeight: 700,
            zIndex: 10,
            backdropFilter: 'blur(4px)',
            maxWidth: canEdit ? 'calc(100% - 60px)' : 'calc(100% - 16px)'
          }}
        >
          {chapterBadge}
        </Badge>
      )}

      {/* Edit Button at Top Right (for moderators) */}
      {canEdit && onEditClick && (
        <ActionIcon
          size="xs"
          variant="filled"
          color="dark"
          radius="xl"
          aria-label={`Edit ${name} image`}
          style={{
            position: 'absolute',
            top: rem(8),
            right: rem(8),
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(4px)',
            zIndex: 10,
            width: rem(24),
            height: rem(24)
          }}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onEditClick(e)
          }}
        >
          <Camera size={12} />
        </ActionIcon>
      )}

      {/* Main Image Section */}
      <Box style={{
        position: 'relative',
        overflow: 'hidden',
        flex: 1,
        minHeight: 0
      }}>
        <MediaThumbnail
          entityType={entityType}
          entityId={entityId}
          entityName={name}
          allowCycling={false}
          maxWidth={dims.maxWidth}
          maxHeight={dims.maxHeight}
          spoilerChapter={spoilerChapter ?? undefined}
          onSpoilerRevealed={onSpoilerRevealed}
        />
      </Box>

      {/* Name at Bottom with diagonal stripe accent */}
      <Box
        p={rem(6)}
        ta="center"
        style={{
          position: 'relative',
          minHeight: rem(40),
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          gap: rem(4)
        }}
      >
        {/* Diagonal stripe background accent */}
        <Box
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: mangaPatterns.diagonalStripes(`${accentColor}10`, 1, 6),
            borderRadius: `0 0 ${rem(8)} ${rem(8)}`,
            pointerEvents: 'none'
          }}
        />

        <Tooltip label={name} position="bottom" withArrow multiline maw={300} disabled={name.length < 25}>
          <Text
            size="sm"
            fw={700}
            lineClamp={2}
            ta="center"
            style={{
              position: 'relative',
              lineHeight: 1.3,
              fontSize: rem(15),
              color: '#ffffff',
              textShadow: '0 1px 3px rgba(0,0,0,0.8)',
              background: `linear-gradient(135deg, ${accentColor}dd, ${accentColor}aa)`,
              backdropFilter: 'blur(4px)',
              borderRadius: rem(6),
              padding: `${rem(6)} ${rem(10)}`,
              border: `1px solid ${accentColor}40`
            }}
          >
            {name}
          </Text>
        </Tooltip>

        {/* Subtitle or touch hint */}
        {subtitle || (isTouchDevice && !isHovered && (
          <Text
            size="xs"
            c="dimmed"
            ta="center"
            style={{ fontSize: rem(10), opacity: 0.7 }}
          >
            Tap to preview
          </Text>
        ))}
      </Box>
    </Card>
  )
}

export default PlayingCard
