'use client'

import React, { useEffect, useState } from 'react'
import {
  Badge,
  Box,
  Button,
  Card,
  Container,
  Group,
  Paper,
  Stack,
  Tabs,
  Text,
  useMantineTheme
} from '@mantine/core'
import {
  getEntityThemeColor,
  textColors,
  getAlphaColor,
  fontSize,
  setTabAccentColors,
  backgroundStyles,
  getCardStyles
} from '../../../lib/mantine-theme'
import { CalendarSearch, Image as ImageIcon, Edit } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '../../../providers/AuthProvider'
import EnhancedSpoilerMarkdown from '../../../components/EnhancedSpoilerMarkdown'
import { motion } from 'motion/react'
import { pageEnter } from '../../../lib/motion-presets'
import { usePageView } from '../../../hooks/usePageView'
import TimelineSpoilerWrapper from '../../../components/TimelineSpoilerWrapper'
import MediaGallery from '../../../components/MediaGallery'
import { BreadcrumbNav, createEntityBreadcrumbs } from '../../../components/Breadcrumb'
import { DetailPageHeader } from '../../../components/layouts/DetailPageHeader'
import type { Event } from '../../../types'
import { api } from '../../../lib/api'

interface EventPageClientProps {
  initialEvent: Event
}

interface ArcGamble {
  id: number
  name: string
  chapterId?: number
  chapter?: { number: number }
}

export default function EventPageClient({ initialEvent }: EventPageClientProps) {
  const theme = useMantineTheme()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<string>('overview')
  const [arcGambles, setArcGambles] = useState<ArcGamble[]>([])

  usePageView('event', initialEvent.id.toString(), true)

  // Check if current user can edit this event
  const canEdit = user &&
    initialEvent.createdBy?.id === user.id &&
    (initialEvent.status === 'pending' || initialEvent.status === 'rejected')
  const isRejected = initialEvent.status === 'rejected'

  // Set tab accent colors for event entity
  useEffect(() => {
    setTabAccentColors('event')
  }, [])

  // Fetch gambles from the same arc
  useEffect(() => {
    if (!initialEvent.arcId) return
    api.getArcGambles(initialEvent.arcId).then(result => {
      const gambles: ArcGamble[] = result.data || []
      // Exclude the already-shown primary gamble
      setArcGambles(gambles.filter(g => g.id !== initialEvent.gambleId))
    }).catch(() => {})
  }, [initialEvent.arcId, initialEvent.gambleId])

  // Use consistent theme colors
  const entityColors = {
    event: getEntityThemeColor(theme, 'event'),
    character: getEntityThemeColor(theme, 'character'),
    arc: getEntityThemeColor(theme, 'arc'),
    gamble: getEntityThemeColor(theme, 'gamble'),
    media: getEntityThemeColor(theme, 'media')
  }

  return (
    <Box style={{
      backgroundColor: backgroundStyles.page(theme),
      minHeight: '100vh',
      color: textColors.primary
    }}>
      <Container size="lg" py="md" style={{ backgroundColor: backgroundStyles.container(theme) }}>
        <Stack gap={theme.spacing.md}>
          {/* Breadcrumb Navigation */}
          <BreadcrumbNav
            items={createEntityBreadcrumbs('event', initialEvent.title)}
            entityType="event"
          />

          {/* Enhanced Event Header */}
          <DetailPageHeader
            entityType="event"
            entityId={initialEvent.id}
            entityName={initialEvent.title}
            stats={[
              ...(initialEvent.chapterNumber != null
                ? [{ value: `Ch. ${initialEvent.chapterNumber}`, label: 'Chapter' }]
                : []),
              ...(initialEvent.arc != null
                ? [{ value: initialEvent.arc.name, label: 'Arc' }]
                : []),
              ...(initialEvent.type != null
                ? [{ value: initialEvent.type.charAt(0).toUpperCase() + initialEvent.type.slice(1), label: 'Type' }]
                : []),
            ].slice(0, 3)}
            spoilerChapter={initialEvent.chapterNumber}
          />

          <motion.div {...pageEnter}>
            <Card withBorder radius="lg" className="gambling-card" shadow="xl" style={getCardStyles(theme)}>
              <Tabs
                value={activeTab}
                onChange={(value) => value && setActiveTab(value)}
                keepMounted={false}
                variant="pills"
                className="event-tabs"
              >
                <Tabs.List>
                  <Tabs.Tab value="overview" leftSection={<CalendarSearch size={16} />}>Overview</Tabs.Tab>
                  <Tabs.Tab value="media" leftSection={<ImageIcon size={16} />}>Media</Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="overview" pt={theme.spacing.md}>
                  <Box
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'minmax(0, 1fr) 260px',
                      gap: 12,
                      alignItems: 'start',
                    }}
                    className="detail-editorial-grid"
                  >
                    {/* Main column — narrative content */}
                    <Stack gap={theme.spacing.md}>
                      {/* Event Description Section */}
                      <Card withBorder radius="lg" shadow="lg" style={{ ...getCardStyles(theme, entityColors.event), borderLeft: `3px solid ${entityColors.event}` }}>
                        <Stack gap={theme.spacing.md} p={theme.spacing.lg}>
                          <Group justify="flex-start" gap="sm" style={{ marginBottom: 12, marginTop: 8 }}>
                            <Box style={{ height: 1, width: 40, background: `linear-gradient(to right, transparent, ${entityColors.event}40)` }} />
                            <Text className="eyebrow-label" style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.68rem' }}>
                              DESCRIPTION
                            </Text>
                            <Box style={{ height: 1, flex: 1, maxWidth: 120, background: `linear-gradient(to left, transparent, ${entityColors.event}20)` }} />
                          </Group>
                          <TimelineSpoilerWrapper chapterNumber={initialEvent.chapterNumber}>
                            <Box style={{ lineHeight: 1.6, fontSize: 14 }}>
                              <EnhancedSpoilerMarkdown
                                content={initialEvent.description}
                                className="event-description"
                                enableEntityEmbeds
                                compactEntityCards={false}
                              />
                            </Box>
                          </TimelineSpoilerWrapper>
                        </Stack>
                      </Card>

                      {/* Related Gamble Section */}
                      {initialEvent.gamble && (
                        <Card withBorder radius="lg" shadow="lg" style={getCardStyles(theme, entityColors.gamble)}>
                          <Stack gap={theme.spacing.md} p={theme.spacing.lg}>
                            <Group justify="space-between" align="center">
                              <Group justify="flex-start" gap="sm">
                                <Box style={{ height: 1, width: 40, background: `linear-gradient(to right, transparent, ${entityColors.gamble}40)` }} />
                                <Text className="eyebrow-label" style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.68rem' }}>
                                  RELATED GAMBLE
                                </Text>
                                <Box style={{ height: 1, flex: 1, maxWidth: 120, background: `linear-gradient(to left, transparent, ${entityColors.gamble}20)` }} />
                              </Group>
                              <Button
                                component={Link}
                                href={`/gambles/${initialEvent.gamble.id}`}
                                variant="outline"
                                c={entityColors.gamble}
                                size="sm"
                                radius="xl"
                                style={{
                                  fontWeight: 600,
                                  border: `2px solid ${entityColors.gamble}`,
                                  transition: `all ${theme.other?.transitions?.durationShort || 200}ms ease`
                                }}
                              >
                                View Gamble
                              </Button>
                            </Group>
                            <TimelineSpoilerWrapper chapterNumber={initialEvent.chapterNumber}>
                              <Paper withBorder radius="lg" p={theme.spacing.md} shadow="md" style={{
                                border: `1px solid ${getAlphaColor(entityColors.gamble, 0.3)}`
                              }}>
                                <Stack gap={theme.spacing.sm}>
                                  <Text fw={600} c={textColors.gamble}>{initialEvent.gamble.name}</Text>
                                  <Stack gap={4}>
                                    <Text size="sm" fw={600} c={textColors.secondary}>Rules</Text>
                                    <EnhancedSpoilerMarkdown
                                      content={initialEvent.gamble.rules}
                                      className="event-gamble-rules"
                                      enableEntityEmbeds
                                      compactEntityCards
                                    />
                                  </Stack>
                                  {initialEvent.gamble.winCondition && (
                                    <Stack gap={4}>
                                      <Text size="sm" fw={600} c={textColors.secondary}>Win Condition</Text>
                                      <EnhancedSpoilerMarkdown
                                        content={initialEvent.gamble.winCondition}
                                        className="event-gamble-win-condition"
                                        enableEntityEmbeds
                                        compactEntityCards
                                      />
                                    </Stack>
                                  )}
                                </Stack>
                              </Paper>
                            </TimelineSpoilerWrapper>
                          </Stack>
                        </Card>
                      )}
                    </Stack>

                    {/* Aside column — details and related content */}
                    <Stack gap={theme.spacing.sm}>
                      {/* Details card */}
                      <Card withBorder radius="lg" shadow="lg" style={getCardStyles(theme, entityColors.event)}>
                        <Stack gap={theme.spacing.sm} p={theme.spacing.md}>
                          <Group justify="flex-start" gap="sm" style={{ marginBottom: 8, marginTop: 4 }}>
                            <Box style={{ height: 1, width: 40, background: `linear-gradient(to right, transparent, ${entityColors.event}40)` }} />
                            <Text className="eyebrow-label" style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.68rem' }}>
                              DETAILS
                            </Text>
                            <Box style={{ height: 1, flex: 1, maxWidth: 120, background: `linear-gradient(to left, transparent, ${entityColors.event}20)` }} />
                          </Group>
                          <Stack gap={6}>
                            {initialEvent.chapterNumber != null && (
                              <Group justify="space-between">
                                <Text size="xs" c={textColors.secondary} fw={600}>Chapter</Text>
                                <Text size="xs" c={textColors.primary}>{initialEvent.chapterNumber}</Text>
                              </Group>
                            )}
                            {initialEvent.arc && (
                              <Group justify="space-between">
                                <Text size="xs" c={textColors.secondary} fw={600}>Arc</Text>
                                <Text
                                  size="xs"
                                  component={Link}
                                  href={`/arcs/${initialEvent.arc.id}`}
                                  style={{ color: entityColors.arc, textDecoration: 'none' }}
                                >
                                  {initialEvent.arc.name}
                                </Text>
                              </Group>
                            )}
                            {initialEvent.type && (
                              <Group justify="space-between">
                                <Text size="xs" c={textColors.secondary} fw={600}>Type</Text>
                                <Text size="xs" c={textColors.primary} style={{ textTransform: 'capitalize' }}>{initialEvent.type}</Text>
                              </Group>
                            )}
                            <Group justify="space-between">
                              <Text size="xs" c={textColors.secondary} fw={600}>Status</Text>
                              <Text size="xs" c={textColors.primary}>
                                {initialEvent.status === 'pending' ? 'Unverified' : initialEvent.status === 'approved' ? 'Verified' : initialEvent.status}
                              </Text>
                            </Group>
                          </Stack>
                          {canEdit && (
                            <Button
                              component={Link}
                              href={`/submit-event?edit=${initialEvent.id}`}
                              variant="outline"
                              size="sm"
                              radius="xl"
                              leftSection={<Edit size={14} />}
                              color={isRejected ? 'orange' : 'gray'}
                              style={{ fontWeight: 600, marginTop: 4 }}
                              fullWidth
                            >
                              {isRejected ? 'Edit & Resubmit' : 'Edit'}
                            </Button>
                          )}
                        </Stack>
                      </Card>

                      {/* Featured Characters Section */}
                      {initialEvent.characters && initialEvent.characters.length > 0 && (
                        <Card withBorder radius="lg" shadow="lg" style={getCardStyles(theme, entityColors.character)}>
                          <Stack gap={theme.spacing.sm} p={theme.spacing.md}>
                            <Group justify="flex-start" gap="sm" style={{ marginBottom: 8, marginTop: 4 }}>
                              <Box style={{ height: 1, width: 40, background: `linear-gradient(to right, transparent, ${entityColors.character}40)` }} />
                              <Text className="eyebrow-label" style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.68rem' }}>
                                FEATURED CHARACTERS
                              </Text>
                              <Box style={{ height: 1, flex: 1, maxWidth: 120, background: `linear-gradient(to left, transparent, ${entityColors.character}20)` }} />
                            </Group>
                            <Group gap={theme.spacing.xs} wrap="wrap">
                              {initialEvent.characters.map((character) => (
                                <Badge
                                  key={character.id}
                                  component={Link}
                                  href={`/characters/${character.id}`}
                                  variant="light"
                                  size="md"
                                  radius="md"
                                  c={textColors.character}
                                  style={{
                                    background: getAlphaColor(entityColors.character, 0.2),
                                    border: `1px solid ${getAlphaColor(entityColors.character, 0.4)}`,
                                    textDecoration: 'none',
                                    cursor: 'pointer',
                                    transition: `all ${theme.other?.transitions?.durationShort || 200}ms ease`
                                  }}
                                >
                                  {character.name}
                                </Badge>
                              ))}
                            </Group>
                          </Stack>
                        </Card>
                      )}

                      {/* Tags Section */}
                      {initialEvent.tags && initialEvent.tags.length > 0 && (
                        <Card withBorder radius="lg" shadow="lg" style={getCardStyles(theme, entityColors.event)}>
                          <Stack gap={theme.spacing.sm} p={theme.spacing.md}>
                            <Group justify="flex-start" gap="sm" style={{ marginBottom: 8, marginTop: 4 }}>
                              <Box style={{ height: 1, width: 40, background: `linear-gradient(to right, transparent, ${entityColors.event}40)` }} />
                              <Text className="eyebrow-label" style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.68rem' }}>
                                TAGS
                              </Text>
                              <Box style={{ height: 1, flex: 1, maxWidth: 120, background: `linear-gradient(to left, transparent, ${entityColors.event}20)` }} />
                            </Group>
                            <Group gap="xs" wrap="wrap">
                              {initialEvent.tags.map((tag) => (
                                <Badge
                                  key={tag.id}
                                  variant="outline"
                                  radius="sm"
                                  size="sm"
                                  c={entityColors.event}
                                  style={{ borderColor: entityColors.event }}
                                >
                                  {tag.name}
                                </Badge>
                              ))}
                            </Group>
                          </Stack>
                        </Card>
                      )}

                      {/* Other Gambles in this Arc */}
                      {arcGambles.length > 0 && (
                        <Card withBorder radius="lg" shadow="lg" style={getCardStyles(theme, entityColors.gamble)}>
                          <Stack gap={theme.spacing.sm} p={theme.spacing.md}>
                            <Group justify="flex-start" gap="sm" style={{ marginBottom: 8, marginTop: 4 }}>
                              <Box style={{ height: 1, width: 40, background: `linear-gradient(to right, transparent, ${entityColors.gamble}40)` }} />
                              <Text className="eyebrow-label" style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.68rem' }}>
                                GAMBLES IN THIS ARC
                              </Text>
                              <Badge size="sm" variant="light" c={entityColors.gamble}>
                                {arcGambles.length}
                              </Badge>
                              <Box style={{ height: 1, flex: 1, maxWidth: 120, background: `linear-gradient(to left, transparent, ${entityColors.gamble}20)` }} />
                            </Group>
                            <Group gap={theme.spacing.xs} wrap="wrap">
                              {arcGambles.map(gamble => (
                                <Badge
                                  key={gamble.id}
                                  component={Link}
                                  href={`/gambles/${gamble.id}`}
                                  size="md"
                                  variant="light"
                                  c={textColors.gamble}
                                  style={{
                                    fontSize: fontSize.xs,
                                    fontWeight: 600,
                                    background: getAlphaColor(entityColors.gamble, 0.2),
                                    border: `1px solid ${getAlphaColor(entityColors.gamble, 0.4)}`,
                                    textDecoration: 'none',
                                    cursor: 'pointer'
                                  }}
                                >
                                  {gamble.name}
                                  {gamble.chapter && (
                                    <Text span size="xs" c={textColors.tertiary} ml={4}>
                                      Ch.{gamble.chapter.number}
                                    </Text>
                                  )}
                                </Badge>
                              ))}
                            </Group>
                          </Stack>
                        </Card>
                      )}
                    </Stack>
                  </Box>
                </Tabs.Panel>

                <Tabs.Panel value="media" pt={theme.spacing.md}>
                  <Stack gap="md">
                    <Card withBorder radius="lg" shadow="lg" style={getCardStyles(theme, entityColors.media)}>
                      <Stack gap="md" p="md">
                        <Group justify="space-between" align="center">
                          <Group justify="flex-start" gap="sm">
                            <Box style={{ height: 1, width: 40, background: `linear-gradient(to right, transparent, ${entityColors.media}40)` }} />
                            <Text className="eyebrow-label" style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.68rem' }}>
                              MEDIA GALLERY
                            </Text>
                            <Box style={{ height: 1, flex: 1, maxWidth: 120, background: `linear-gradient(to left, transparent, ${entityColors.media}20)` }} />
                          </Group>
                          <Button
                            component={Link}
                            href={`/media?ownerType=event&ownerId=${initialEvent.id}`}
                            variant="outline"
                            c={entityColors.media}
                            size="sm"
                            radius="xl"
                          >
                            View All
                          </Button>
                        </Group>
                        <MediaGallery
                          ownerType="event"
                          ownerId={initialEvent.id}
                          purpose="gallery"
                          limit={8}
                          showTitle={false}
                          compactMode
                          showFilters={false}
                        />
                      </Stack>
                    </Card>
                  </Stack>
                </Tabs.Panel>
              </Tabs>
            </Card>
          </motion.div>
        </Stack>
      </Container>
    </Box>
  )
}
