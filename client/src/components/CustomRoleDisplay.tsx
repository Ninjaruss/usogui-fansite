'use client'

import React from 'react'
import { Badge, useMantineTheme } from '@mantine/core'
import { Star } from 'lucide-react'

interface CustomRoleDisplayProps {
  customRole: string | null
  size?: 'small' | 'medium'
  showIcon?: boolean
}

export default function CustomRoleDisplay({
  customRole,
  size = 'medium',
  showIcon = true
}: CustomRoleDisplayProps) {
  const theme = useMantineTheme()

  if (!customRole) {
    return null
  }

  const gradient = 'linear-gradient(135deg, #9c27b0 0%, #673ab7 100%)'
  const hoverGradient = 'linear-gradient(135deg, #8e24aa 0%, #5e35b1 100%)'
  const fontSize = size === 'small' ? '0.75rem' : '0.8125rem'

  return (
    <Badge
      size={size === 'small' ? 'sm' : 'md'}
      variant="filled"
      radius="md"
      leftSection={showIcon ? <Star size={size === 'small' ? 12 : 14} /> : undefined}
      styles={{
        root: {
          backgroundImage: gradient,
          color: '#ffffff',
          border: '1px solid rgba(156, 39, 176, 0.3)',
          fontWeight: 600,
          fontSize,
          boxShadow: '0 2px 4px rgba(156, 39, 176, 0.2)',
          maxWidth: '300px',
          transition: 'all 0.2s ease-in-out',
          display: 'flex',
          alignItems: 'center',
          whiteSpace: 'normal',
          wordBreak: 'break-word',
          lineHeight: 1.2,
          textAlign: 'center',
          paddingLeft: showIcon ? theme.spacing.sm : theme.spacing.md,
          paddingRight: theme.spacing.md,
          '&:hover': {
            backgroundImage: hoverGradient,
            boxShadow: '0 4px 8px rgba(156, 39, 176, 0.3)',
            transform: 'translateY(-1px)'
          }
        }
      }}
    >
      {customRole}
    </Badge>
  )
}
