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
import { CinematicCard, CinematicSectionHeader } from '../../../components/layouts/CinematicCard'
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
            <Card withBorder radius="lg" className="gambling-card" shadow="xl" style={{ background: backgroundStyles.card, border: `1px solid #1a1a1a` }}>
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
                      <CinematicCard entityColor={entityColors.event}>
                        <CinematicSectionHeader label="Description" entityColor={entityColors.event} />
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
                      </CinematicCard>

                      {/* Related Gamble Section */}
                      {initialEvent.gamble && (
                        <CinematicCard entityColor={entityColors.gamble}>
                          <CinematicSectionHeader
                            label="Related Gamble"
                            entityColor={entityColors.gamble}
                            extra={
                              <Button component={Link} href={`/gambles/${initialEvent.gamble.id}`} variant="outline" c={entityColors.gamble} size="sm" radius="xl" style={{ fontWeight: 600, border: `2px solid ${entityColors.gamble}`, marginLeft: 'auto' }}>
                                View Gamble
                              </Button>
                            }
                          />
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
                        </CinematicCard>
                      )}
                    </Stack>

                    {/* Aside column — details and related content */}
                    <Stack gap={theme.spacing.sm}>
                      {/* Details card */}
                      <CinematicCard entityColor={entityColors.event} padding="md">
                        <CinematicSectionHeader label="Details" entityColor={entityColors.event} />
                        {/* Chapter row */}
                        {initialEvent.chapterNumber != null && (
                          <Box style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: `1px solid ${entityColors.event}14` }}>
                            <Box style={{ width: 5, height: 5, borderRadius: '50%', background: entityColors.event, flexShrink: 0 }} />
                            <Text style={{ fontSize: 11, color: `${entityColors.event}66`, flex: 1 }}>Chapter</Text>
                            <Text style={{ fontSize: 12, fontWeight: 700, color: entityColors.event }}>Ch. {initialEvent.chapterNumber}</Text>
                          </Box>
                        )}
                        {/* Arc row */}
                        {initialEvent.arc != null && (
                          <Box style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: `1px solid ${entityColors.event}14` }}>
                            <Box style={{ width: 5, height: 5, borderRadius: '50%', background: entityColors.arc, flexShrink: 0 }} />
                            <Text style={{ fontSize: 11, color: `${entityColors.event}66`, flex: 1 }}>Arc</Text>
                            <Text component={Link} href={`/arcs/${initialEvent.arc.id}`} style={{ fontSize: 12, fontWeight: 700, color: entityColors.arc, textDecoration: 'none' }}>{initialEvent.arc.name}</Text>
                          </Box>
                        )}
                        {/* Type row */}
                        {initialEvent.type != null && (
                          <Box style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: `1px solid ${entityColors.event}14` }}>
                            <Box style={{ width: 5, height: 5, borderRadius: '50%', background: entityColors.event, flexShrink: 0 }} />
                            <Text style={{ fontSize: 11, color: `${entityColors.event}66`, flex: 1 }}>Type</Text>
                            <Text style={{ fontSize: 12, fontWeight: 700, color: entityColors.event, textTransform: 'capitalize' }}>{initialEvent.type}</Text>
                          </Box>
                        )}
                        {/* Status row */}
                        {initialEvent.status != null && (
                          <Box style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: canEdit ? `1px solid ${entityColors.event}14` : undefined }}>
                            <Box style={{ width: 5, height: 5, borderRadius: '50%', background: entityColors.event, flexShrink: 0 }} />
                            <Text style={{ fontSize: 11, color: `${entityColors.event}66`, flex: 1 }}>Status</Text>
                            <Text style={{ fontSize: 12, fontWeight: 700, color: entityColors.event, textTransform: 'capitalize' }}>
                              {initialEvent.status === 'pending' ? 'Unverified' : initialEvent.status === 'approved' ? 'Verified' : initialEvent.status}
                            </Text>
                          </Box>
                        )}
                        {canEdit && (
                          <Button
                            component={Link}
                            href={`/submit-event?edit=${initialEvent.id}`}
                            variant="outline"
                            size="sm"
                            radius="xl"
                            leftSection={<Edit size={14} />}
                            color={isRejected ? 'orange' : 'gray'}
                            style={{ fontWeight: 600, marginTop: 12 }}
                            fullWidth
                          >
                            {isRejected ? 'Edit & Resubmit' : 'Edit'}
                          </Button>
                        )}
                      </CinematicCard>

                      {/* Featured Characters Section */}
                      {initialEvent.characters && initialEvent.characters.length > 0 && (
                        <CinematicCard entityColor={entityColors.character} padding="md">
                          <CinematicSectionHeader label="Featured Characters" entityColor={entityColors.character} />
                          <Box style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {initialEvent.characters.map((character) => (
                              <Box
                                key={character.id}
                                component={Link}
                                href={`/characters/${character.id}`}
                                style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#131313', border: '1px solid #222', borderRadius: 8, padding: '6px 10px', textDecoration: 'none', cursor: 'pointer', transition: `all ${theme.other?.transitions?.durationShort || 200}ms ease` }}
                                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = entityColors.character }}
                                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#222' }}
                              >
                                <Box style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: getAlphaColor(entityColors.character, 0.20), border: `1px solid ${getAlphaColor(entityColors.character, 0.40)}`, fontSize: 10, fontWeight: 700, color: entityColors.character }}>
                                  {character.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                                </Box>
                                <Text style={{ fontSize: 13, fontWeight: 600, color: '#ddd' }}>{character.name}</Text>
                              </Box>
                            ))}
                          </Box>
                        </CinematicCard>
                      )}

                      {/* Tags Section */}
                      {initialEvent.tags && initialEvent.tags.length > 0 && (
                        <CinematicCard entityColor={entityColors.event} padding="md">
                          <CinematicSectionHeader label="Tags" entityColor={entityColors.event} />
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
                        </CinematicCard>
                      )}

                      {/* Other Gambles in this Arc */}
                      {arcGambles.length > 0 && (
                        <CinematicCard entityColor={entityColors.gamble} padding="md">
                          <CinematicSectionHeader
                            label="Gambles in this Arc"
                            entityColor={entityColors.gamble}
                            extra={
                              <Badge size="sm" variant="light" c={entityColors.gamble}>
                                {arcGambles.length}
                              </Badge>
                            }
                          />
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
                        </CinematicCard>
                      )}
                    </Stack>
                  </Box>
                </Tabs.Panel>

                <Tabs.Panel value="media" pt={theme.spacing.md}>
                  <Stack gap="md">
                    <CinematicCard entityColor={entityColors.media} padding="md">
                      <CinematicSectionHeader
                        label="Media Gallery"
                        entityColor={entityColors.media}
                        extra={
                          <Button component={Link} href={`/media?ownerType=event&ownerId=${initialEvent.id}`} variant="outline" c={entityColors.media} size="sm" radius="xl" style={{ marginLeft: 'auto' }}>
                            View All
                          </Button>
                        }
                      />
                      <MediaGallery
                        ownerType="event"
                        ownerId={initialEvent.id}
                        purpose="gallery"
                        limit={8}
                        showTitle={false}
                        compactMode
                        showFilters={false}
                      />
                    </CinematicCard>
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
