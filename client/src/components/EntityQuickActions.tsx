'use client'

import React from 'react'
import { ActionIcon, Paper, Tooltip, Group } from '@mantine/core'
import { MessageSquare, Image } from 'lucide-react'
import Link from 'next/link'
import { getEntityThemeColor } from '../lib/mantine-theme'
import { useMantineTheme } from '@mantine/core'

export type QuickActionEntityType = 'character' | 'gamble' | 'arc' | 'chapter'

interface EntityQuickActionsProps {
  entityType: QuickActionEntityType
  entityId: number
  isAuthenticated: boolean
}

export function EntityQuickActions({
  entityType,
  entityId,
  isAuthenticated
}: EntityQuickActionsProps) {
  const theme = useMantineTheme()

  if (!isAuthenticated) {
    return null
  }

  const annotationColor = theme.colors.violet[5]
  const mediaColor = getEntityThemeColor(theme, 'media')

  return (
    <Paper
      withBorder
      p="xs"
      radius="xl"
      shadow="lg"
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 100,
        backgroundColor: theme.colors.dark[7],
        borderColor: 'rgba(255, 255, 255, 0.1)'
      }}
    >
      <Group gap="xs">
        <Tooltip label="Add Annotation" position="left" withArrow>
          <ActionIcon
            component={Link}
            href={`/submit-annotation?type=${entityType}&id=${entityId}`}
            variant="light"
            size="lg"
            radius="xl"
            style={{
              backgroundColor: `${annotationColor}20`,
              color: annotationColor,
              border: `1px solid ${annotationColor}40`
            }}
          >
            <MessageSquare size={18} />
          </ActionIcon>
        </Tooltip>
        <Tooltip label="Submit Media" position="left" withArrow>
          <ActionIcon
            component={Link}
            href={`/submit-media?ownerType=${entityType}&ownerId=${entityId}`}
            variant="light"
            size="lg"
            radius="xl"
            style={{
              backgroundColor: `${mediaColor}20`,
              color: mediaColor,
              border: `1px solid ${mediaColor}40`
            }}
          >
            <Image size={18} />
          </ActionIcon>
        </Tooltip>
      </Group>
    </Paper>
  )
}

export default EntityQuickActions
