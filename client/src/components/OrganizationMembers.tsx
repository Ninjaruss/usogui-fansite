'use client'

import React, { useState, useEffect } from 'react'
import {
  Box,
  Card,
  Group,
  Stack,
  Text,
  Title,
  Badge,
  Loader,
  useMantineTheme
} from '@mantine/core'
import { User } from 'lucide-react'
import Link from 'next/link'
import {
  getEntityThemeColor,
  textColors,
  getAlphaColor,
  spacing,
  getCardStyles
} from '../lib/mantine-theme'
import TimelineSpoilerWrapper from './TimelineSpoilerWrapper'
import MediaThumbnail from './MediaThumbnail'
import api from '../lib/api'
import { type CharacterOrganization } from '../types'

interface OrganizationMembersProps {
  organizationId: number
  organizationName?: string
}

export default function OrganizationMembers({
  organizationId,
}: OrganizationMembersProps) {
  const theme = useMantineTheme()
  const [memberships, setMemberships] = useState<CharacterOrganization[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const entityColor = getEntityThemeColor(theme, 'organization')
  const characterColor = getEntityThemeColor(theme, 'character')

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        setLoading(true)
        // Fetch all memberships - spoiler protection is handled by TimelineSpoilerWrapper
        const response = await api.getOrganizationMembers(organizationId)
        // Handle both wrapped { data: [...] } and raw array responses
        // The server's TransformResponseInterceptor wraps arrays in { data: [...] }
        const membershipsArray = Array.isArray(response)
          ? response
          : (response && typeof response === 'object' && 'data' in response && Array.isArray((response as { data: CharacterOrganization[] }).data))
            ? (response as { data: CharacterOrganization[] }).data
            : []
        setMemberships(membershipsArray)
        setError(null)
      } catch (err) {
        console.error('Failed to fetch organization members:', err)
        setMemberships([])
        setError('Failed to load organization members')
      } finally {
        setLoading(false)
      }
    }

    fetchMembers()
  }, [organizationId])

  // Group memberships by character (to handle role changes)
  const groupedByCharacter = React.useMemo(() => {
    const groups: Record<number, CharacterOrganization[]> = {}
    for (const m of memberships) {
      if (!groups[m.characterId]) {
        groups[m.characterId] = []
      }
      groups[m.characterId].push(m)
    }
    // Sort each group by startChapter
    for (const key of Object.keys(groups)) {
      groups[Number(key)].sort((a, b) => a.startChapter - b.startChapter)
    }
    return groups
  }, [memberships])

  // Get current role for each character (most recent with no endChapter)
  const getCurrentRole = (charMemberships: CharacterOrganization[]): CharacterOrganization | undefined => {
    return charMemberships.find(m => m.endChapter === null) || charMemberships[charMemberships.length - 1]
  }

  if (loading) {
    return (
      <Box py="xl" style={{ display: 'flex', justifyContent: 'center' }}>
        <Loader color={entityColor} size="md" />
      </Box>
    )
  }

  if (error) {
    return (
      <Text c="dimmed" ta="center" py="md">
        {error}
      </Text>
    )
  }

  if (memberships.length === 0) {
    return (
      <Text c="dimmed" ta="center" py="md">
        No members recorded for this organization
      </Text>
    )
  }

  return (
    <Stack gap={spacing.md}>
      {Object.entries(groupedByCharacter).map(([charId, charMemberships]) => {
        const character = charMemberships[0]?.character
        if (!character) return null

        const currentRole = getCurrentRole(charMemberships)
        const isCurrentMember = currentRole?.endChapter === null

        return (
          <TimelineSpoilerWrapper
            key={charId}
            chapterNumber={currentRole?.spoilerChapter ?? charMemberships[0].spoilerChapter}
          >
            <Card
              padding="md"
              radius="md"
              style={{
                ...getCardStyles(theme),
                borderLeft: `3px solid ${characterColor}`
              }}
            >
              <Group gap={spacing.md} wrap="nowrap">
                {/* Character thumbnail */}
                <Box
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: theme.radius.md,
                    overflow: 'hidden',
                    flexShrink: 0
                  }}
                >
                  <MediaThumbnail
                    entityType="character"
                    entityId={Number(charId)}
                    entityName={character.name}
                    allowCycling={false}
                    maxWidth="48px"
                    maxHeight="48px"
                  />
                </Box>

                {/* Character info */}
                <Box style={{ flex: 1, minWidth: 0 }}>
                  <Group justify="space-between" wrap="nowrap">
                    <Link
                      href={`/characters/${charId}`}
                      style={{ textDecoration: 'none' }}
                    >
                      <Text
                        fw={600}
                        size="sm"
                        c={textColors.primary}
                        style={{
                          cursor: 'pointer',
                          transition: 'color 0.2s',
                        }}
                      >
                        {character.name}
                      </Text>
                    </Link>
                    {isCurrentMember && (
                      <Badge size="xs" variant="outline" color="green">
                        Active
                      </Badge>
                    )}
                  </Group>

                  {/* Role history */}
                  <Stack gap={4} mt={spacing.xs}>
                    {charMemberships.map((membership) => (
                      <Group key={membership.id} gap={spacing.xs} wrap="nowrap">
                        <Badge
                          size="xs"
                          variant="light"
                          color="violet"
                          style={{
                            backgroundColor: getAlphaColor('#8b5cf6', 0.15),
                            color: '#8b5cf6'
                          }}
                        >
                          {membership.role}
                        </Badge>
                        <Text size="xs" c="dimmed">
                          {membership.endChapter
                            ? `Ch. ${membership.startChapter} - ${membership.endChapter}`
                            : `Ch. ${membership.startChapter}+`}
                        </Text>
                      </Group>
                    ))}
                  </Stack>
                </Box>
              </Group>
            </Card>
          </TimelineSpoilerWrapper>
        )
      })}
    </Stack>
  )
}
