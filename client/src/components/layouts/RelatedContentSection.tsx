'use client'

import React from 'react'
import { Box, Button, Card, Group, Stack, Text, Title, useMantineTheme } from '@mantine/core'
import Link from 'next/link'
import {
  getEntityThemeColor,
  textColors,
  getCardStyles,
  type EntityAccentKey
} from '../../lib/mantine-theme'

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
  /** Use title text color from entity type (default: uses textColors[entityType]) */
  titleColorKey?: keyof typeof textColors
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
  const titleColor = titleColorKey
    ? (textColors as Record<string, string>)[titleColorKey] || accentColor
    : (textColors as Record<string, string>)[entityType] || accentColor

  if (items.length === 0) return null

  const displayItems = items.slice(0, previewCount)

  if (variant === 'compact') {
    const dotColor = itemDotColor ?? accentColor
    return (
      <Box>
        <Text
          style={{
            fontSize: 9,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '2px',
            color: '#555',
            marginBottom: 10,
          }}
        >
          {title}
        </Text>
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
              borderBottom: '1px solid #181818',
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
            <Text style={{ fontSize: 13, color: '#777', flex: 1 }}>
              {getLabel!(item)}
            </Text>
            <Text style={{ fontSize: 12, color: '#333' }}>›</Text>
          </Box>
        ))}
        {viewAllHref && items.length > (previewCount ?? 4) && (
          <Box pt={8}>
            <Text
              component={Link}
              href={viewAllHref}
              style={{ fontSize: 12, color: '#444', textDecoration: 'none' }}
            >
              View all {items.length} →
            </Text>
          </Box>
        )}
      </Box>
    )
  }

  return (
    <Card withBorder radius="lg" shadow="lg" style={getCardStyles(theme, accentColor)}>
      <Stack gap={theme.spacing.md} p={theme.spacing.md}>
        <Group
          justify="space-between"
          align="center"
          pb={theme.spacing.sm}
          style={{ borderBottom: `1px solid ${accentColor}25` }}
        >
          <Group gap={theme.spacing.sm}>
            {icon}
            <Title order={4} c={titleColor}>{title}</Title>
          </Group>
          {viewAllHref && items.length > previewCount && (
            <Button
              component={Link}
              href={viewAllHref}
              variant="outline"
              c={accentColor}
              size="sm"
              radius="xl"
              style={{
                fontWeight: 600,
                border: `2px solid ${accentColor}`,
                transition: `all ${theme.other?.transitions?.durationShort || 200}ms ease`
              }}
              styles={{
                root: {
                  '&:hover': {
                    boxShadow: `0 0 10px ${accentColor}30`,
                    transform: 'translateY(-1px)'
                  }
                }
              }}
            >
              View All ({items.length})
            </Button>
          )}
        </Group>
        <Stack gap={theme.spacing.sm}>
          {displayItems.map((item, index) => (
            <React.Fragment key={getKey(item)}>
              {renderItem!(item, index)}
            </React.Fragment>
          ))}
        </Stack>
      </Stack>
    </Card>
  )
}

export default RelatedContentSection
