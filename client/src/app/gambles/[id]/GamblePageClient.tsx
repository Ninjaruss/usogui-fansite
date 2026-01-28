'use client'

import React, { useEffect, useState } from 'react'
import {
  Badge,
  Box,
  Button,
  Card,
  Container,
  Grid,
  Group,
  Loader,
  Paper,
  Stack,
  Tabs,
  Text,
  Title,
  Tooltip,
  useMantineTheme
} from '@mantine/core'
import { Crown, Users, Trophy, Calendar, BookOpen, Image as ImageIcon, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import EnhancedSpoilerMarkdown from '../../../components/EnhancedSpoilerMarkdown'
import { motion } from 'motion/react'
import { usePageView } from '../../../hooks/usePageView'
import TimelineSpoilerWrapper from '../../../components/TimelineSpoilerWrapper'
import GambleTimeline from '../../../components/GambleTimeline'
import MediaGallery from '../../../components/MediaGallery'
import MediaThumbnail from '../../../components/MediaThumbnail'
import ErrorBoundary from '../../../components/ErrorBoundary'
import { GambleStructuredData } from '../../../components/StructuredData'
import { BreadcrumbNav, createEntityBreadcrumbs } from '../../../components/Breadcrumb'
import { api } from '../../../lib/api'
import { AnnotationSection } from '../../../components/annotations'
import { EntityQuickActions } from '../../../components/EntityQuickActions'
import { useAuth } from '../../../providers/AuthProvider'
import { AnnotationOwnerType } from '../../../types'
import {
  getEntityThemeColor,
  textColors,
  headerColors,
  getAlphaColor,
  spacing,
  fontSize,
  setTabAccentColors,
  backgroundStyles,
  getCardStyles
} from '../../../lib/mantine-theme'

interface Gamble {
  id: number
  name: string
  description?: string
  rules: string
  winCondition?: string
  chapterId: number
  participants?: Array<{
    id: number
    name: string
    description?: string
    alternateNames?: string[]
  }>
  chapter?: {
    id: number
    number: number
    title?: string
  }
  createdAt: string
  updatedAt: string
}

interface GamblePageClientProps {
  initialGamble: Gamble
}

// Types for timeline data matching GambleTimeline component
interface GambleTimelineEvent {
  id: number
  title: string
  description: string | null
  chapterNumber: number
  type: 'gamble' | 'decision' | 'reveal' | 'shift' | 'resolution' | null
  arcId: number
  arcName: string
  isSpoiler?: boolean
  spoilerChapter?: number
  gambleId?: number
  characters?: Array<{ id: number; name: string }>
}

interface TimelineArc {
  id: number
  name: string
  description: string | null
  startChapter: number
  endChapter: number | null
}

export default function GamblePageClient({ initialGamble }: GamblePageClientProps) {
  const theme = useMantineTheme()
  const { user } = useAuth()
  const gambleColor = getEntityThemeColor(theme, 'gamble')
  const characterColor = getEntityThemeColor(theme, 'character')
  const [timelineEvents, setTimelineEvents] = useState<GambleTimelineEvent[]>([])
  const [arcs, setArcs] = useState<TimelineArc[]>([])
  const [timelineLoading, setTimelineLoading] = useState(false)

  // Get initial tab from URL hash or default to 'overview'
  const getInitialTab = () => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.slice(1)
      if (['overview', 'timeline', 'media', 'annotations'].includes(hash)) {
        return hash
      }
    }
    return 'overview'
  }

  const [activeTab, setActiveTab] = useState<string>(getInitialTab)

  usePageView('gamble', initialGamble.id.toString(), true)

  // Set tab accent colors for gamble entity
  useEffect(() => {
    setTabAccentColors('gamble')
  }, [])

  // Sync tab state with URL hash
  useEffect(() => {
    // Update URL hash when tab changes (without triggering navigation)
    const newHash = activeTab === 'overview' ? '' : `#${activeTab}`
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname + window.location.search
      window.history.replaceState(null, '', currentPath + newHash)
    }
  }, [activeTab])

  // Listen for hash changes (e.g., back/forward navigation)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1)
      if (['overview', 'timeline', 'media', 'annotations'].includes(hash)) {
        setActiveTab(hash)
      } else if (!hash) {
        setActiveTab('overview')
      }
    }

    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  useEffect(() => {
    const fetchTimelineData = async () => {
      try {
        setTimelineLoading(true)
        const [eventsResponse, arcsResponse] = await Promise.all([
          api.getEvents({ limit: 100 }),
          api.getArcs({ limit: 100 })
        ])

        const gambleChapter = initialGamble.chapter?.number || initialGamble.chapterId
        const filteredEvents = eventsResponse.data.filter((event: GambleTimelineEvent) => {
          if (event.gambleId === initialGamble.id) {
            return true
          }
          if (event.chapterNumber === gambleChapter) {
            return true
          }
          return false
        })

        setTimelineEvents(filteredEvents)
        setArcs(arcsResponse.data || [])
      } catch (error: unknown) {
        console.error('Failed to fetch timeline data:', error)
      } finally {
        setTimelineLoading(false)
      }
    }

    fetchTimelineData()
  }, [initialGamble])

  const chapterInfo = initialGamble.chapter
    ? `Chapter ${initialGamble.chapter.number}${initialGamble.chapter.title ? `: ${initialGamble.chapter.title}` : ''}`
    : `Chapter ${initialGamble.chapterId}`

  return (
    <Box style={{
      backgroundColor: backgroundStyles.page(theme),
      minHeight: '100vh',
      color: textColors.primary
    }}>
    <Container size="lg" py="md" style={{ backgroundColor: backgroundStyles.container(theme) }}>
    <Stack gap={theme.spacing.md}>
      <GambleStructuredData
        gamble={{
          id: initialGamble.id,
          name: initialGamble.name,
          description: initialGamble.description
        }}
      />

      {/* Breadcrumb Navigation */}
      <BreadcrumbNav
        items={createEntityBreadcrumbs('gamble', initialGamble.name)}
        entityType="gamble"
      />

      {/* Enhanced Gamble Header */}
      <Card
        withBorder
        radius="lg"
        shadow="lg"
        p={0}
        style={{
          background: backgroundStyles.card,
          border: `2px solid ${gambleColor}`,
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Subtle Pattern Overlay */}
        <Box
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `
              radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0),
              radial-gradient(circle at 20px 20px, rgba(255,255,255,0.03) 1px, transparent 0)
            `,
            backgroundSize: '40px 40px, 80px 80px',
            backgroundPosition: '0 0, 20px 20px',
            pointerEvents: 'none'
          }}
        />

        {/* Content */}
        <Box p={theme.spacing.lg} style={{ position: 'relative', zIndex: 1 }}>
          <Group gap={theme.spacing.lg} align="stretch" wrap="nowrap">
            <Box style={{ flexShrink: 0 }}>
              <Box
                style={{
                  width: '200px',
                  height: '280px',
                  borderRadius: theme.radius.md,
                  overflow: 'hidden',
                  border: `3px solid ${gambleColor}`,
                  boxShadow: theme.shadows.xl,
                  transition: `all ${theme.other?.transitions?.durationStandard || 250}ms ${theme.other?.transitions?.easingStandard || 'ease-in-out'}`
                }}
              >
                <ErrorBoundary>
                  <MediaThumbnail
                    entityType="gamble"
                    entityId={initialGamble.id}
                    entityName={initialGamble.name}
                    allowCycling={false}
                    maxWidth="200px"
                    maxHeight="280px"
                  />
                </ErrorBoundary>
              </Box>
            </Box>

            <Stack gap={theme.spacing.md} style={{ flex: 1, minWidth: 0, height: '100%' }} justify="space-between">
              <Stack gap={theme.spacing.sm}>
                <Group gap={theme.spacing.sm} align="center">
                  <Crown size={28} color={gambleColor} />
                  <Title
                    order={1}
                    size="2.8rem"
                    fw={800}
                    c={headerColors.h1}
                    style={{
                      lineHeight: 1.1,
                      textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
                      letterSpacing: '-0.02em'
                    }}
                  >
                    {initialGamble.name}
                  </Title>
                </Group>

                {/* Chapter Info */}
                <Badge
                  variant="filled"
                  size="lg"
                  radius="md"
                  style={{
                    background: `linear-gradient(135deg, ${gambleColor} 0%, ${gambleColor}dd 100%)`,
                    border: `1px solid ${gambleColor}`,
                    boxShadow: theme.shadows.md,
                    fontSize: fontSize.sm,
                    color: textColors.primary,
                    fontWeight: 600
                  }}
                >
                  {chapterInfo}
                </Badge>
              </Stack>

              <Stack gap={theme.spacing.md} style={{ flex: 1, justifyContent: 'center' }}>
                {/* Content Stats */}
                <Group gap={theme.spacing.md} wrap="wrap" mt={theme.spacing.sm}>
                  {initialGamble.participants && initialGamble.participants.length > 0 && (
                    <Badge size="lg" variant="light" c={textColors.character} style={{
                      fontSize: fontSize.xs,
                      fontWeight: 600,
                      background: getAlphaColor(characterColor, 0.2),
                      border: `1px solid ${getAlphaColor(characterColor, 0.4)}`
                    }}>
                      {initialGamble.participants.length} Participants
                    </Badge>
                  )}
                  {initialGamble.winCondition && (
                    <Badge size="lg" variant="light" c={textColors.gamble} style={{
                      fontSize: fontSize.xs,
                      fontWeight: 600,
                      background: getAlphaColor(gambleColor, 0.2),
                      border: `1px solid ${getAlphaColor(gambleColor, 0.4)}`
                    }}>
                      Win Condition
                    </Badge>
                  )}
                  <Badge size="lg" variant="light" c={textColors.gamble} style={{
                    fontSize: fontSize.xs,
                    fontWeight: 600,
                    background: getAlphaColor(gambleColor, 0.2),
                    border: `1px solid ${getAlphaColor(gambleColor, 0.4)}`
                  }}>
                    {timelineEvents.length} Events
                  </Badge>
                </Group>
              </Stack>
            </Stack>
          </Group>
        </Box>
      </Card>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card withBorder radius="lg" className="gambling-card" shadow="xl" style={{
          background: backgroundStyles.card,
          border: `1px solid ${getAlphaColor(gambleColor, 0.4)}`
        }}>
        <Tabs
          value={activeTab}
          onChange={(value) => value && setActiveTab(value)}
          keepMounted={false}
          variant="pills"
          className="gamble-tabs"
        >
          <Tabs.List>
            <Tabs.Tab value="overview" leftSection={<BookOpen size={16} />}>Overview</Tabs.Tab>
            <Tooltip
              label="No timeline events available for this gamble"
              disabled={timelineEvents.length > 0 || !timelineLoading}
              position="bottom"
              withArrow
            >
              <Tabs.Tab
                value="timeline"
                leftSection={<Calendar size={16} />}
                rightSection={timelineEvents.length > 0 ? <Badge size="xs" variant="light" c={gambleColor}>{timelineEvents.length}</Badge> : null}
                disabled={timelineEvents.length === 0 && timelineLoading}
              >
                Timeline
              </Tabs.Tab>
            </Tooltip>
            <Tabs.Tab value="media" leftSection={<ImageIcon size={16} />}>Media</Tabs.Tab>
            <Tabs.Tab value="annotations" leftSection={<MessageSquare size={16} />}>Annotations</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="overview" pt={theme.spacing.md}>
            <Stack gap={theme.spacing.lg}>
              {/* Gamble Description Section */}
              <Card withBorder radius="lg" shadow="lg" style={{
                background: backgroundStyles.card,
                border: `1px solid ${getAlphaColor(gambleColor, 0.4)}`
              }}>
                <Stack gap={theme.spacing.md} p={theme.spacing.lg}>
                  <Group gap={theme.spacing.sm} align="center">
                    <Crown size={24} color={gambleColor} />
                    <Title order={3} c={headerColors.h3}>About {initialGamble.name}</Title>
                  </Group>
                  {initialGamble.description ? (
                    <TimelineSpoilerWrapper chapterNumber={initialGamble.chapter?.number ?? initialGamble.chapterId}>
                      <Box style={{ lineHeight: 1.6 }}>
                        <EnhancedSpoilerMarkdown
                          content={initialGamble.description}
                          className="gamble-description"
                          enableEntityEmbeds
                          compactEntityCards={false}
                        />
                      </Box>
                    </TimelineSpoilerWrapper>
                  ) : (
                    <Text size="sm" c={textColors.tertiary} style={{ fontStyle: 'italic', textAlign: 'center', padding: theme.spacing.xl }}>
                      No description available for this gamble yet. Check back later for updates!
                    </Text>
                  )}
                </Stack>
              </Card>

              {/* Rules Section */}
              <Card withBorder radius="lg" shadow="lg" style={{
                background: backgroundStyles.card,
                border: `1px solid ${getAlphaColor(gambleColor, 0.4)}`
              }}>
                <Stack gap={theme.spacing.md} p={theme.spacing.lg}>
                  <Group gap={theme.spacing.sm} align="center">
                    <BookOpen size={24} color={gambleColor} />
                    <Title order={3} c={headerColors.h3}>Rules</Title>
                  </Group>
                  <Box style={{ lineHeight: 1.6 }}>
                    <EnhancedSpoilerMarkdown
                      content={initialGamble.rules}
                      className="gamble-rules"
                      enableEntityEmbeds
                      compactEntityCards={false}
                    />
                  </Box>
                </Stack>
              </Card>

              {/* Win Condition Section */}
              {initialGamble.winCondition && (
                <Card withBorder radius="lg" shadow="lg" style={{
                  background: backgroundStyles.card,
                  border: `1px solid ${getAlphaColor(gambleColor, 0.4)}`
                }}>
                  <Stack gap={theme.spacing.md} p={theme.spacing.lg}>
                    <Group gap={theme.spacing.sm} align="center">
                      <Trophy size={24} color={gambleColor} />
                      <Title order={3} c={headerColors.h3}>Win Condition</Title>
                    </Group>
                    <Box style={{ lineHeight: 1.6 }}>
                      <EnhancedSpoilerMarkdown
                        content={initialGamble.winCondition}
                        className="gamble-win-condition"
                        enableEntityEmbeds
                        compactEntityCards={false}
                      />
                    </Box>
                  </Stack>
                </Card>
              )}

              {/* Participants Section */}
              {initialGamble.participants && initialGamble.participants.length > 0 && (
                <Card withBorder radius="lg" shadow="lg" style={{
                  background: backgroundStyles.card,
                  border: `1px solid ${getAlphaColor(characterColor, 0.4)}`,
                  transition: `all ${theme.other?.transitions?.durationShort || 200}ms ease-in-out`
                }}>
                  <Stack gap={theme.spacing.md} p={theme.spacing.md}>
                    <Group justify="space-between" align="center">
                      <Group gap={theme.spacing.sm}>
                        <Users size={20} color={characterColor} />
                        <Title order={4} c={textColors.character}>Participants</Title>
                      </Group>
                    </Group>
                    <Stack gap={theme.spacing.sm}>
                      {initialGamble.participants.map((participant) => (
                        <Link
                          key={participant.id}
                          href={`/characters/${participant.id}`}
                          style={{ textDecoration: 'none' }}
                        >
                          <Paper
                            withBorder
                            radius="lg"
                            p={theme.spacing.md}
                            shadow="md"
                            style={{
                              border: `1px solid ${getAlphaColor(characterColor, 0.3)}`,
                              transition: `all ${theme.other?.transitions?.durationShort || 200}ms ease`,
                              cursor: 'pointer'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'translateY(-2px)'
                              e.currentTarget.style.boxShadow = theme.shadows.lg
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'translateY(0)'
                              e.currentTarget.style.boxShadow = theme.shadows.md
                            }}
                          >
                            <Group justify="space-between" align="flex-start">
                              <Box style={{ flex: 1 }}>
                                <Text
                                  fw={600}
                                  size="sm"
                                  c={textColors.character}
                                  style={{ textDecoration: 'none' }}
                                >
                                  {participant.name}
                                </Text>
                              {participant.alternateNames && participant.alternateNames.length > 0 && (
                                <Group gap={theme.spacing.xs} wrap="wrap" mt={spacing.xs}>
                                  {participant.alternateNames.slice(0, 2).map((name) => (
                                    <Badge
                                      key={name}
                                      variant="light"
                                      size="sm"
                                      radius="md"
                                      style={{
                                        background: `${theme.colors.dark[5]}80`,
                                        border: `1px solid ${theme.colors.dark[4]}`,
                                        fontWeight: 500,
                                        letterSpacing: '0.02em'
                                      }}
                                      c={textColors.secondary}
                                    >
                                      {name}
                                    </Badge>
                                  ))}
                                </Group>
                              )}
                              {participant.description && (
                                <Text size="xs" c={textColors.tertiary} lineClamp={2} mt={spacing.xs}>
                                  {participant.description}
                                </Text>
                              )}
                            </Box>
                          </Group>
                        </Paper>
                        </Link>
                      ))}
                    </Stack>
                  </Stack>
                </Card>
              )}
            </Stack>
          </Tabs.Panel>

            <Tabs.Panel value="timeline" pt="md">
              {timelineLoading ? (
                <Box style={{ display: 'flex', justifyContent: 'center', paddingBlock: '2rem' }}>
                  <Loader c={getEntityThemeColor(theme, 'gamble')} />
                </Box>
              ) : (
                <GambleTimeline
                  events={timelineEvents}
                  arcs={arcs}
                  gambleName={initialGamble.name}
                  gambleChapter={initialGamble.chapter?.number ?? initialGamble.chapterId}
                />
              )}
            </Tabs.Panel>

          <Tabs.Panel value="media" pt={theme.spacing.md}>
            <Stack gap="md">
              <Card withBorder radius="lg" shadow="lg" style={{
                background: backgroundStyles.card,
                border: `1px solid ${getAlphaColor(getEntityThemeColor(theme, 'media'), 0.4)}`
              }}>
                <Stack gap="md" p="md">
                  <Group justify="space-between" align="center">
                    <Group gap="sm">
                      <ImageIcon size={20} color={getEntityThemeColor(theme, 'media')} />
                      <Title order={4} c={textColors.media}>Media Gallery</Title>
                    </Group>
                    <Button
                      component={Link}
                      href={`/media?ownerType=gamble&ownerId=${initialGamble.id}`}
                      variant="outline"
                      c={getEntityThemeColor(theme, 'media')}
                      size="sm"
                      radius="xl"
                    >
                      View All
                    </Button>
                  </Group>
                  <ErrorBoundary>
                    <MediaGallery
                      ownerType="gamble"
                      ownerId={initialGamble.id}
                      purpose="gallery"
                      limit={8}
                      showTitle={false}
                      compactMode
                      showFilters={false}
                    />
                  </ErrorBoundary>
                </Stack>
              </Card>
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="annotations" pt={theme.spacing.md}>
            <AnnotationSection
              ownerType={AnnotationOwnerType.GAMBLE}
              ownerId={initialGamble.id}
              userProgress={user?.userProgress}
              currentUserId={user?.id}
              isAuthenticated={!!user}
            />
          </Tabs.Panel>
        </Tabs>
      </Card>

    </motion.div>
    </Stack>

    {/* Quick Actions for authenticated users */}
    <EntityQuickActions
      entityType="gamble"
      entityId={initialGamble.id}
      isAuthenticated={!!user}
    />
    </Container>
    </Box>
  )
}
