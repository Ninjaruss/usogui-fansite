'use client'

import React from 'react'
import { Badge, useMantineTheme, darken, rgba } from '@mantine/core'
import Link from 'next/link'

interface GambleChipProps {
  gamble: {
    id: number
    name: string
    rules?: string
  }
  size?: 'small' | 'medium'
  variant?: 'filled' | 'outlined'
  // Accept 'outline' legacy naming as well
  // (the component will map 'outlined' -> Mantine 'outline')
  onClick?: () => void
  clickable?: boolean
}

export default function GambleChip({
  gamble,
  size = 'medium',
  variant = 'filled',
  onClick,
  clickable = true
}: GambleChipProps) {
  const theme = useMantineTheme()

  // Normalize size mapping: 'small' -> 'sm', 'medium' -> 'md' to align with other badges
  const badgeSize = size === 'small' ? 'sm' : 'md'

  // Accept either 'outline' or legacy 'outlined' for compatibility
  const mantineVariant = variant === 'outlined' ? 'outline' : 'filled'

  const badge = (
    <Badge
      size={badgeSize}
      radius="lg"
      variant={mantineVariant as any}
      color="gamble"
      onClick={onClick}
      styles={{ root: { fontWeight: 700, cursor: clickable || onClick ? 'pointer' : 'default', display: 'inline-block' } } as any}
    >
      {gamble.name}
    </Badge>
  )

  if (onClick) {
    return badge
  }

  if (clickable) {
    return (
      <Link href={`/gambles/${gamble.id}`} style={{ textDecoration: 'none', display: 'inline-block' }}>
        {badge}
      </Link>
    )
  }

  return badge
}
