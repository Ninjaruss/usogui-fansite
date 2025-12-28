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
import { Building2 } from 'lucide-react'
import Link from 'next/link'
import {
  getEntityThemeColor,
  textColors,
  getAlphaColor,
  spacing,
  getCardStyles
} from '../lib/mantine-theme'
import TimelineSpoilerWrapper from './TimelineSpoilerWrapper'
import api from '../lib/api'
import { type CharacterOrganization } from '../types'

interface CharacterOrganizationMembershipsProps {
  characterId: number
  characterName: string
}

export default function CharacterOrganizationMemberships({
  characterId,
  characterName
}: CharacterOrganizationMembershipsProps) {
  const theme = useMantineTheme()
  const [memberships, setMemberships] = useState<CharacterOrganization[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const entityColor = getEntityThemeColor(theme, 'character')

  useEffect(() => {
    const fetchMemberships = async () => {
      try {
        setLoading(true)
        // Fetch all memberships - spoiler protection is handled by TimelineSpoilerWrapper
        const response = await api.getCharacterOrganizations(characterId)
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
        console.error('[CharacterOrganizationMemberships] Failed to fetch:', err)
        setMemberships([])
        setError('Failed to load organization memberships')
      } finally {
        setLoading(false)
      }
    }

    fetchMemberships()
  }, [characterId])

  // Group memberships by organization and compute metadata for sorting/spoiler protection
  const sortedOrganizations = React.useMemo(() => {
    const groups: Record<number, CharacterOrganization[]> = {}

    for (const m of memberships) {
      if (!groups[m.organizationId]) {
        groups[m.organizationId] = []
      }
      groups[m.organizationId].push(m)
    }

    // Sort each group by startChapter and compute metadata
    const orgList = Object.entries(groups).map(([orgId, orgMemberships]) => {
      // Sort memberships within this org by startChapter
      orgMemberships.sort((a, b) => a.startChapter - b.startChapter)

      // Get the minimum spoilerChapter (earliest reveal) and startChapter for sorting
      const minSpoilerChapter = Math.min(...orgMemberships.map(m => m.spoilerChapter))
      const earliestStartChapter = orgMemberships[0]?.startChapter ?? 0

      return {
        orgId: Number(orgId),
        memberships: orgMemberships,
        organization: orgMemberships[0]?.organization,
        minSpoilerChapter,
        earliestStartChapter
      }
    })

    // Sort organizations by their earliest chapter range
    orgList.sort((a, b) => a.earliestStartChapter - b.earliestStartChapter)

    return orgList
  }, [memberships])

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
        No organization memberships recorded
      </Text>
    )
  }

  return (
    <Stack gap={spacing.md}>
      {sortedOrganizations.map(({ orgId, memberships: orgMemberships, organization: org, minSpoilerChapter }) => {
        if (!org) return null

        return (
          <TimelineSpoilerWrapper
            key={orgId}
            chapterNumber={minSpoilerChapter}
          >
            <Card
              padding="md"
              radius="md"
              style={getCardStyles(theme)}
            >
              <Stack gap={spacing.sm}>
                {/* Organization header */}
                <Group gap={spacing.sm}>
                  <Box
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      backgroundColor: getAlphaColor(entityColor, 0.15),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Building2 size={18} color={entityColor} />
                  </Box>
                  <Box style={{ flex: 1 }}>
                    <Link
                      href={`/organizations/${orgId}`}
                      style={{ textDecoration: 'none' }}
                    >
                      <Title
                        order={5}
                        style={{
                          color: textColors.primary,
                          cursor: 'pointer',
                          transition: 'color 0.2s',
                        }}
                      >
                        {org.name}
                      </Title>
                    </Link>
                  </Box>
                </Group>

                {/* Role history */}
                <Stack gap={spacing.xs} pl={40}>
                  {orgMemberships.map((membership) => (
                    <MembershipCard
                      key={membership.id}
                      membership={membership}
                      entityColor={entityColor}
                    />
                  ))}
                </Stack>
              </Stack>
            </Card>
          </TimelineSpoilerWrapper>
        )
      })}
    </Stack>
  )
}

// Individual membership card component
function MembershipCard({
  membership,
  entityColor
}: {
  membership: CharacterOrganization
  entityColor: string
}) {
  const theme = useMantineTheme()

  // Format chapter range
  const chapterRange = membership.endChapter
    ? `Ch. ${membership.startChapter} - ${membership.endChapter}`
    : `Ch. ${membership.startChapter}+`

  const isOngoing = !membership.endChapter

  return (
    <Box
      p="xs"
      style={{
        backgroundColor: getAlphaColor(entityColor, 0.05),
        borderRadius: theme.radius.sm,
        borderLeft: `3px solid ${entityColor}`
      }}
    >
      <Group justify="space-between" wrap="nowrap">
        <Group gap={spacing.xs}>
          <Badge
            size="sm"
            variant="light"
            color="violet"
            style={{
              backgroundColor: getAlphaColor('#8b5cf6', 0.15),
              color: '#8b5cf6'
            }}
          >
            {membership.role}
          </Badge>
          {isOngoing && (
            <Badge size="xs" variant="outline" color="green">
              Current
            </Badge>
          )}
        </Group>
        <Text size="xs" c="dimmed">
          {chapterRange}
        </Text>
      </Group>
      {membership.notes && (
        <Text size="xs" c="dimmed" mt={4}>
          {membership.notes}
        </Text>
      )}
    </Box>
  )
}
