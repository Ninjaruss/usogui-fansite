'use client'

import React from 'react'
import { Box, Title, Text, useMantineTheme } from '@mantine/core'
import {
  getEntityThemeColor,
  type EntityAccentKey,
} from '../../lib/mantine-theme'
import MediaThumbnail from '../MediaThumbnail'

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
}: DetailPageHeaderProps) {
  const theme = useMantineTheme()
  const accentColor = getEntityThemeColor(theme, entityType)

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

      {/* Portrait area — right 42% */}
      {showImage ? (
        <Box
          className="detail-hero-portrait"
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: '42%',
            overflow: 'hidden',
          }}
        >
          <MediaThumbnail
            entityType={entityType}
            entityId={entityId}
            entityName={entityName}
            allowCycling={false}
            maxWidth="100%"
            maxHeight="100%"
            spoilerChapter={spoilerChapter ?? undefined}
            onSpoilerRevealed={onSpoilerRevealed}
          />
          {/* Left-edge fade blending portrait into content */}
          <Box
            aria-hidden
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: '55%',
              background: 'linear-gradient(90deg, #080c14 0%, rgba(8,12,20,0.6) 50%, transparent 100%)',
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

      {/* Content column — left 65%, bottom-anchored */}
      <Box
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
        }}
      >
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
  )
}

export default DetailPageHeader
