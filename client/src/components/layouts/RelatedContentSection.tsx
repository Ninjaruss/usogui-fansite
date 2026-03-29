'use client'

import React from 'react'
import { Box, Group, Stack, Text, useMantineTheme } from '@mantine/core'
import Link from 'next/link'
import {
  getEntityThemeColor,
  type EntityAccentKey
} from '../../lib/mantine-theme'
import { CinematicCard, CinematicSectionHeader } from './CinematicCard'

interface RelatedContentSectionProps<T> {
  /** Entity type for section theming */
  entityType: EntityAccentKey
  /** Section icon (lucide-react) */
  icon?: React.ReactNode
  /** Section title (e.g., "Related Story Arcs") */
  title: string
  /** All items */
  items: T[]
  /** Max items to show in preview (default 4) */
  previewCount?: number
  /** "View All" link destination */
  viewAllHref?: string
  /** Render function for each item */
  renderItem?: (item: T, index: number) => React.ReactNode
  /** Key extractor */
  getKey: (item: T) => string | number
  /** Use title text color from entity type */
  titleColorKey?: string
  /** 'cards' (default) uses renderItem. 'compact' renders a flat linked list. */
  variant?: 'cards' | 'compact'
  /** Required when variant="compact": returns the display label for an item */
  getLabel?: (item: T) => string
  /** Required when variant="compact": returns the href for an item */
  getHref?: (item: T) => string
  /** Dot color for compact rows (defaults to accentColor) */
  itemDotColor?: string
}

export function RelatedContentSection<T>({
  entityType,
  icon,
  title,
  items,
  previewCount = 4,
  viewAllHref,
  renderItem,
  getKey,
  titleColorKey,
  variant = 'cards',
  getLabel,
  getHref,
  itemDotColor,
}: RelatedContentSectionProps<T>) {
  const theme = useMantineTheme()
  const accentColor = getEntityThemeColor(theme, entityType)

  if (items.length === 0) return null

  const displayItems = items.slice(0, previewCount)

  if (variant === 'compact') {
    const dotColor = itemDotColor ?? accentColor
    return (
      <CinematicCard entityColor={accentColor} padding="md">
        <CinematicSectionHeader label={title} entityColor={accentColor} />
        {displayItems.map((item) => (
          <Box
            key={getKey(item)}
            component={Link}
            href={getHref!(item)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 0',
              borderBottom: `1px solid ${accentColor}14`,
              textDecoration: 'none',
            }}
          >
            <Box
              aria-hidden
              style={{
                width: 5,
                height: 5,
                borderRadius: '50%',
                background: dotColor,
                flexShrink: 0,
              }}
            />
            <Text style={{ fontSize: 13, color: `${accentColor}88`, flex: 1 }}>
              {getLabel!(item)}
            </Text>
            <Text style={{ fontSize: 12, color: `${accentColor}44` }}>›</Text>
          </Box>
        ))}
        {viewAllHref && items.length > (previewCount ?? 4) && (
          <Box pt={8}>
            <Text
              component={Link}
              href={viewAllHref}
              style={{ fontSize: 12, color: `${accentColor}55`, textDecoration: 'none' }}
            >
              View all {items.length} →
            </Text>
          </Box>
        )}
      </CinematicCard>
    )
  }

  return (
    <CinematicCard entityColor={accentColor}>
      <Stack gap={theme.spacing.md}>
        <CinematicSectionHeader
          label={title}
          entityColor={accentColor}
          extra={
            viewAllHref && items.length > previewCount ? (
              <Box
                component={Link}
                href={viewAllHref}
                style={{
                  fontSize: 11,
                  color: `${accentColor}88`,
                  textDecoration: 'none',
                  marginLeft: 'auto',
                  flexShrink: 0,
                }}
              >
                View All ({items.length}) →
              </Box>
            ) : undefined
          }
        />
        <Stack gap={theme.spacing.sm}>
          {displayItems.map((item, index) => (
            <React.Fragment key={getKey(item)}>
              {renderItem!(item, index)}
            </React.Fragment>
          ))}
        </Stack>
      </Stack>
    </CinematicCard>
  )
}

export default RelatedContentSection
