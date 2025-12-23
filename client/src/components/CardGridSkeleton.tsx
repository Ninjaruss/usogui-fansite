'use client'

import React from 'react'
import { Box, Skeleton, rem } from '@mantine/core'

interface CardGridSkeletonProps {
  count?: number
  cardWidth?: number
  cardHeight?: number
  accentColor?: string
}

export function CardGridSkeleton({
  count = 12,
  cardWidth = 200,
  cardHeight = 280,
  accentColor = '#1976d2'
}: CardGridSkeletonProps) {
  return (
    <Box
      px="md"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(auto-fill, minmax(${cardWidth - 20}px, ${cardWidth + 20}px))`,
        gap: rem(16),
        justifyContent: 'center'
      }}
    >
      {Array.from({ length: count }).map((_, index) => (
        <Box
          key={index}
          style={{
            width: rem(cardWidth),
            height: rem(cardHeight),
            borderRadius: rem(12),
            overflow: 'hidden',
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Chapter badge skeleton */}
          <Box style={{ padding: rem(8), position: 'relative' }}>
            <Skeleton
              width={60}
              height={20}
              radius="sm"
              style={{ opacity: 0.6 }}
            />
          </Box>

          {/* Image skeleton */}
          <Box style={{ flex: 1, padding: `0 ${rem(8)}` }}>
            <Skeleton
              height="100%"
              radius="md"
              style={{ opacity: 0.4 }}
            />
          </Box>

          {/* Name skeleton */}
          <Box
            style={{
              padding: rem(8),
              display: 'flex',
              justifyContent: 'center'
            }}
          >
            <Skeleton
              width="70%"
              height={24}
              radius="md"
              style={{ opacity: 0.5 }}
            />
          </Box>
        </Box>
      ))}
    </Box>
  )
}

export default CardGridSkeleton
