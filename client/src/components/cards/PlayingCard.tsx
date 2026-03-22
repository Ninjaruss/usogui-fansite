'use client'

import React from 'react'
import { Card, Box, Badge, Text, ActionIcon, rem, useMantineTheme } from '@mantine/core'
import Link from 'next/link'
import { Camera } from 'lucide-react'
import { getPlayingCardStyles, getEntityThemeColor, type EntityAccentKey } from '../../lib/mantine-theme'
import MediaThumbnail, { type MediaItem } from '../MediaThumbnail'
import classes from './PlayingCard.module.css'

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
  /** When true, the entity name is never truncated (always fully visible) */
  noTruncate?: boolean
  /** Additional content rendered below the name */
  subtitle?: React.ReactNode
  /** When true, the image is loaded eagerly (above-the-fold optimization) */
  imagePriority?: boolean
  /** Pre-loaded media to skip the API call in MediaThumbnail */
  initialMedia?: MediaItem[]
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
  noTruncate = false,
  subtitle,
  imagePriority = false,
  initialMedia
}: PlayingCardProps) {
  const theme = useMantineTheme()
  const accentColor = getEntityThemeColor(theme, entityType)
  const dims = variantDimensions[variant]

  return (
    <Card
      component={Link}
      href={href}
      withBorder={false}
      radius="lg"
      shadow="sm"
      className={`hoverable-card hoverable-card-${entityType} ledger-lines ${classes.card}`}
      style={{
        ...getPlayingCardStyles(theme, accentColor),
        position: 'relative',
        transform: 'perspective(700px) rotateY(0deg) translateY(0px)',
        transition: 'transform 250ms ease, box-shadow 250ms ease',
        boxShadow: `inset 0 0 0 1px ${accentColor}35, 0 0 20px ${accentColor}40, 0 4px 20px rgba(0,0,0,0.6)`
      }}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >

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
          priority={imagePriority}
          initialMedia={initialMedia}
        />
        {/* Scan-line texture */}
        <Box aria-hidden style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.18) 3px, rgba(0,0,0,0.18) 4px)',
          pointerEvents: 'none', zIndex: 1,
        }} />
        {/* Radial top-center glow */}
        <Box aria-hidden style={{
          position: 'absolute', inset: 0,
          background: `radial-gradient(ellipse at 50% 30%, ${accentColor}07, transparent 65%)`,
          pointerEvents: 'none', zIndex: 1,
        }} />
      </Box>

      {/* Layer 1: Deep black gradient */}
      <Box
        aria-hidden
        style={{
          position: 'absolute',
          bottom: 0, left: 0, right: 0,
          height: '70%',
          background: 'linear-gradient(0deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />
      {/* Layer 2: Accent tint */}
      <Box
        aria-hidden
        style={{
          position: 'absolute',
          bottom: 0, left: 0, right: 0,
          height: '30%',
          background: `linear-gradient(0deg, ${accentColor}15 0%, transparent 100%)`,
          pointerEvents: 'none',
          zIndex: 2,
        }}
      />

      {/* Name at Bottom with diagonal stripe accent */}
      <Box
        p={rem(6)}
        ta="center"
        style={{
          position: 'relative',
          zIndex: 3,
          minHeight: rem(40),
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          gap: rem(4)
        }}
      >
        <Text
          size="sm"
          fw={600}
          ta="center"
          className={noTruncate ? undefined : classes.name}
          style={{
            position: 'relative',
            lineHeight: 1.4,
            fontSize: rem(15),
            color: '#ffffff',
            borderRadius: rem(6),
            padding: `${rem(6)} ${rem(10)}`,
            border: `1px solid ${accentColor}40`,
            boxShadow: `0 0 14px ${accentColor}20`,
            fontFamily: 'var(--font-opti-goudy-text), serif',
            fontWeight: 600,
            letterSpacing: '0.025em',
          }}
        >
          {name}
        </Text>

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
