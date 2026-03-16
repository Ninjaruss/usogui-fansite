'use client'

import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  Badge,
  Box,
  Button,
  Card,
  Container,
  Grid,
  Group,
  Loader,
  Stack,
  Tabs,
  Text,
  useMantineTheme
} from '@mantine/core'
import { Crown, Users, Trophy, Calendar, BookOpen, Map, Image as ImageIcon, MessageSquare, Lightbulb } from 'lucide-react'
import Link from 'next/link'
import EnhancedSpoilerMarkdown from '../../../components/EnhancedSpoilerMarkdown'
import { motion } from 'motion/react'
import { pageEnter } from '../../../lib/motion-presets'
import { usePageView } from '../../../hooks/usePageView'
import TimelineSpoilerWrapper from '../../../components/TimelineSpoilerWrapper'
import GambleTimeline from '../../../components/GambleTimeline'
import MediaGallery from '../../../components/MediaGallery'
import ErrorBoundary from '../../../components/ErrorBoundary'
import { GambleStructuredData } from '../../../components/StructuredData'
import { BreadcrumbNav, createEntityBreadcrumbs } from '../../../components/Breadcrumb'
import { api } from '../../../lib/api'
import { AnnotationSection } from '../../../components/annotations'
import { useAuth } from '../../../providers/AuthProvider'
import { AnnotationOwnerType } from '../../../types'
import {
  getEntityThemeColor,
  textColors,
  getAlphaColor,
  spacing,
  setTabAccentColors,
  backgroundStyles,
  getCardStyles
} from '../../../lib/mantine-theme'
import { DetailPageHeader } from '../../../components/layouts/DetailPageHeader'
import { RelatedContentSection } from '../../../components/layouts/RelatedContentSection'

interface GambleFactionMember {
  id: number
  characterId: number
  character: {
    id: number
    name: string
    description?: string
    alternateNames?: string[]
  }
  role?: 'leader' | 'member' | 'supporter' | 'observer' | null
  displayOrder: number
}

interface GambleFaction {
  id: number
  name?: string | null
  supportedGamblerId?: number | null
  supportedGambler?: {
    id: number
    name: string
  } | null
  members: GambleFactionMember[]
  displayOrder: number
}

interface Gamble {
  id: number
  name: string
  description?: string
  rules: string
  winCondition?: string
  explanation?: string
  chapterId: number
  participants?: Array<{
    id: number
    name: string
    description?: string
    alternateNames?: string[]
  }>
  factions?: GambleFaction[]
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
  const searchParams = useSearchParams()
  const mediaId = searchParams.get('mediaId') ?? undefined
  const gambleColor = getEntityThemeColor(theme, 'gamble')
  const characterColor = getEntityThemeColor(theme, 'character')
  const arcColor = getEntityThemeColor(theme, 'arc')
  const [timelineEvents, setTimelineEvents] = useState<GambleTimelineEvent[]>([])
  const [arcs, setArcs] = useState<TimelineArc[]>([])
  const [timelineLoading, setTimelineLoading] = useState(false)

  const gambleArc = arcs.find(a =>
    initialGamble.chapter &&
    a.startChapter <= initialGamble.chapter.number &&
    (a.endChapter === null || a.endChapter >= initialGamble.chapter.number)
  )

  const [activeTab, setActiveTab] = useState<string>('overview')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.slice(1)
      if (['overview', 'timeline', 'media', 'annotations'].includes(hash)) {
        setActiveTab(hash)
      } else if (hash.startsWith('annotation-')) {
        setActiveTab('annotations')
        setTimeout(() => {
          const el = document.getElementById(hash)
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }, 600)
      }
    }
  }, [])

  usePageView('gamble', initialGamble.id.toString(), true)

  useEffect(() => {
    setTabAccentColors('gamble')
  }, [])

  useEffect(() => {
    const newHash = activeTab === 'overview' ? '' : `#${activeTab}`
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname + window.location.search
      window.history.replaceState(null, '', currentPath + newHash)
    }
  }, [activeTab])

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1)
      if (['overview', 'timeline', 'media', 'annotations'].includes(hash)) {
        setActiveTab(hash)
      } else if (hash.startsWith('annotation-')) {
        setActiveTab('annotations')
        setTimeout(() => {
          const el = document.getElementById(hash)
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }, 600)
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
          if (event.gambleId === initialGamble.id) return true
          if (event.chapterNumber === gambleChapter) return true
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

      <BreadcrumbNav
        items={createEntityBreadcrumbs('gamble', initialGamble.name)}
        entityType="gamble"
      />

      {/* Enhanced Gamble Header */}
      <DetailPageHeader
        entityType="gamble"
        entityId={initialGamble.id}
        entityName={initialGamble.name}
        stats={[
          { value: initialGamble.participants?.length ?? 0, label: 'Players' },
          ...(initialGamble.chapter != null
            ? [{ value: `Ch. ${initialGamble.chapter.number}`, label: 'Start' }]
            : initialGamble.chapterId != null
            ? [{ value: `Ch. ${initialGamble.chapterId}`, label: 'Start' }]
            : []),
          ...(gambleArc != null
            ? [{ value: gambleArc.name, label: 'Arc' }]
            : []),
        ].slice(0, 3)}
        spoilerChapter={initialGamble.chapter?.number ?? initialGamble.chapterId}
      />

      <motion.div {...pageEnter}>
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
            {(timelineEvents.length > 0 || timelineLoading) && (
              <Tabs.Tab
                value="timeline"
                leftSection={<Calendar size={16} />}
                rightSection={timelineEvents.length > 0 ? <Badge size="xs" variant="light" c={gambleColor}>{timelineEvents.length}</Badge> : null}
              >
                Timeline
              </Tabs.Tab>
            )}
            <Tabs.Tab value="media" leftSection={<ImageIcon size={16} />}>Media</Tabs.Tab>
            <Tabs.Tab value="annotations" leftSection={<MessageSquare size={16} />}>Annotations</Tabs.Tab>
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
              {/* Main column */}
              <Stack gap={theme.spacing.md}>
                {/* Gamble Description */}
                <Card withBorder radius="lg" shadow="lg" padding={0} style={{ background: backgroundStyles.card, border: `1px solid ${getAlphaColor(gambleColor, 0.4)}` }}>
                  <Box style={{ height: 3, borderRadius: '6px 6px 0 0', background: `linear-gradient(90deg, ${gambleColor}, transparent 70%)` }} />
                  <Box p="lg">
                    <Group gap={10} mb={14} align="center">
                      <Box style={{ width: 28, height: 28, borderRadius: 6, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: getAlphaColor(gambleColor, 0.15), border: `1px solid ${getAlphaColor(gambleColor, 0.30)}` }}>
                        <Crown size={16} color={gambleColor} />
                      </Box>
                      <Text style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: gambleColor, opacity: 0.85 }}>About This Gamble</Text>
                      <Box style={{ flex: 1, height: 1, background: `linear-gradient(to right, ${getAlphaColor(gambleColor, 0.20)}, transparent)` }} />
                    </Group>
                    {initialGamble.description ? (
                      <TimelineSpoilerWrapper chapterNumber={initialGamble.chapter?.number ?? initialGamble.chapterId}>
                        <Box style={{ fontSize: 14, lineHeight: 1.6 }}>
                          <EnhancedSpoilerMarkdown content={initialGamble.description} className="gamble-description" enableEntityEmbeds compactEntityCards={false} />
                        </Box>
                      </TimelineSpoilerWrapper>
                    ) : (
                      <Text size="sm" c={textColors.tertiary} style={{ fontStyle: 'italic', textAlign: 'center', padding: theme.spacing.xl }}>
                        No description available for this gamble yet. Check back later for updates!
                      </Text>
                    )}
                  </Box>
                </Card>

                {/* Rules */}
                <Card withBorder radius="lg" shadow="lg" padding={0} style={{ background: backgroundStyles.card, border: `1px solid ${getAlphaColor(gambleColor, 0.4)}` }}>
                  <Box style={{ height: 3, borderRadius: '6px 6px 0 0', background: `linear-gradient(90deg, ${gambleColor}, transparent 70%)` }} />
                  <Box p="lg">
                    <Group gap={10} mb={14} align="center">
                      <Box style={{ width: 28, height: 28, borderRadius: 6, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: getAlphaColor(gambleColor, 0.15), border: `1px solid ${getAlphaColor(gambleColor, 0.30)}` }}>
                        <BookOpen size={16} color={gambleColor} />
                      </Box>
                      <Text style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: gambleColor, opacity: 0.85 }}>Rules</Text>
                      <Box style={{ flex: 1, height: 1, background: `linear-gradient(to right, ${getAlphaColor(gambleColor, 0.20)}, transparent)` }} />
                    </Group>
                    <Box style={{ fontSize: 14, lineHeight: 1.6 }}>
                      <EnhancedSpoilerMarkdown content={initialGamble.rules} className="gamble-rules" enableEntityEmbeds compactEntityCards={false} />
                    </Box>
                  </Box>
                </Card>

                {/* Win Condition */}
                {initialGamble.winCondition && (
                  <Card withBorder radius="lg" shadow="lg" padding={0} style={{ background: backgroundStyles.card, border: `1px solid ${getAlphaColor(gambleColor, 0.4)}` }}>
                    <Box style={{ height: 3, borderRadius: '6px 6px 0 0', background: `linear-gradient(90deg, ${gambleColor}, transparent 70%)` }} />
                    <Box p="lg">
                      <Group gap={10} mb={14} align="center">
                        <Box style={{ width: 28, height: 28, borderRadius: 6, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: getAlphaColor(gambleColor, 0.15), border: `1px solid ${getAlphaColor(gambleColor, 0.30)}` }}>
                          <Trophy size={16} color={gambleColor} />
                        </Box>
                        <Text style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: gambleColor, opacity: 0.85 }}>Win Condition</Text>
                        <Box style={{ flex: 1, height: 1, background: `linear-gradient(to right, ${getAlphaColor(gambleColor, 0.20)}, transparent)` }} />
                      </Group>
                      <Box
                        className="manga-panel-border"
                        style={{
                          position: 'relative',
                          padding: '1rem 1.25rem',
                          background: `${getAlphaColor(gambleColor, 0.05)}`,
                          border: `1px solid ${gambleColor}30`,
                          borderRadius: '0.5rem',
                          marginTop: 12,
                          fontSize: 14,
                          lineHeight: 1.6
                        }}
                      >
                        <EnhancedSpoilerMarkdown content={initialGamble.winCondition} className="gamble-win-condition" enableEntityEmbeds compactEntityCards={false} />
                      </Box>
                    </Box>
                  </Card>
                )}

                {/* Explanation & Analysis */}
                {initialGamble.explanation && (
                  <Card withBorder radius="lg" shadow="lg" padding={0} style={{ background: backgroundStyles.card, border: `1px solid ${getAlphaColor(gambleColor, 0.4)}` }}>
                    <Box style={{ height: 3, borderRadius: '6px 6px 0 0', background: `linear-gradient(90deg, ${gambleColor}, transparent 70%)` }} />
                    <Box p="lg">
                      <Group gap={10} mb={14} align="center">
                        <Box style={{ width: 28, height: 28, borderRadius: 6, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: getAlphaColor(gambleColor, 0.15), border: `1px solid ${getAlphaColor(gambleColor, 0.30)}` }}>
                          <Lightbulb size={16} color={gambleColor} />
                        </Box>
                        <Text style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: gambleColor, opacity: 0.85 }}>Explanation & Analysis</Text>
                        <Box style={{ flex: 1, height: 1, background: `linear-gradient(to right, ${getAlphaColor(gambleColor, 0.20)}, transparent)` }} />
                      </Group>
                      <Box style={{ fontSize: 14, lineHeight: 1.6 }}>
                        <EnhancedSpoilerMarkdown content={initialGamble.explanation} className="gamble-explanation" enableEntityEmbeds compactEntityCards={false} />
                      </Box>
                    </Box>
                  </Card>
                )}

                {/* Participants - Factions (full detail view stays in main column) */}
                {initialGamble.factions && initialGamble.factions.length > 0 && (
                  <Card withBorder radius="lg" shadow="lg" padding={0} style={{ background: backgroundStyles.card, border: `1px solid ${getAlphaColor(gambleColor, 0.4)}` }}>
                    <Box style={{ height: 3, borderRadius: '6px 6px 0 0', background: `linear-gradient(90deg, ${gambleColor}, transparent 70%)` }} />
                    <Box p="lg">
                      <Group gap={10} mb={14} align="center">
                        <Box style={{ width: 28, height: 28, borderRadius: 6, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: getAlphaColor(gambleColor, 0.15), border: `1px solid ${getAlphaColor(gambleColor, 0.30)}` }}>
                          <Users size={16} color={gambleColor} />
                        </Box>
                        <Text style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: gambleColor, opacity: 0.85 }}>Participants</Text>
                        <Box style={{ flex: 1, height: 1, background: `linear-gradient(to right, ${getAlphaColor(gambleColor, 0.20)}, transparent)` }} />
                      </Group>
                      {initialGamble.factions.length === 2 ? (
                        <Box style={{ display: 'flex', alignItems: 'stretch', gap: 0 }}>
                          {initialGamble.factions
                            .sort((a, b) => a.displayOrder - b.displayOrder)
                            .map((faction, idx) => {
                              const factionAccent = idx === 0 ? gambleColor : characterColor
                              const factionName = faction.name || (faction.supportedGambler ? `${faction.supportedGambler.name}'s Side` : 'Faction')
                              return (
                                <React.Fragment key={faction.id}>
                                  <Box style={{ flex: 1, minWidth: 0, border: '1px solid #1e1e1e', borderRadius: 12, overflow: 'hidden' }}>
                                    {/* Faction header band */}
                                    <Box style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, background: getAlphaColor(factionAccent, 0.10), borderBottom: `1px solid ${getAlphaColor(factionAccent, 0.20)}` }}>
                                      <Box style={{ width: 8, height: 8, borderRadius: '50%', background: factionAccent, flexShrink: 0 }} />
                                      <Text style={{ fontSize: 13, fontWeight: 700, color: '#ddd' }}>{factionName}</Text>
                                      {faction.supportedGambler && faction.name && (
                                        <Badge variant="light" size="sm" radius="md" style={{ background: getAlphaColor(gambleColor, 0.2), border: `1px solid ${getAlphaColor(gambleColor, 0.4)}` }} c={textColors.gamble}>
                                          Supporting {faction.supportedGambler.name}
                                        </Badge>
                                      )}
                                    </Box>
                                    {/* Faction member rows */}
                                    <Box style={{ padding: '10px 12px', background: '#0e0e0e' }}>
                                      {faction.members
                                        .sort((a, b) => a.displayOrder - b.displayOrder)
                                        .map((member, mIdx) => (
                                          <Link key={member.id} href={`/characters/${member.character.id}`} style={{ textDecoration: 'none' }}>
                                            <Box style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: mIdx < faction.members.length - 1 ? '1px solid #161616' : 'none', cursor: 'pointer' }}>
                                              {/* Avatar — initials only */}
                                              <Box style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: getAlphaColor(factionAccent, 0.20), border: `1px solid ${getAlphaColor(factionAccent, 0.40)}`, fontSize: 9, fontWeight: 700, color: factionAccent }}>
                                                {member.character.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                                              </Box>
                                              <Text style={{ fontSize: 12, fontWeight: 600, color: '#ddd' }}>{member.character.name}</Text>
                                              {member.role && (
                                                <Box style={{ marginLeft: 'auto', background: '#1a1a1a', border: '1px solid #252525', borderRadius: 20, padding: '2px 8px', fontSize: 10, color: '#555', textTransform: 'capitalize', whiteSpace: 'nowrap' }}>
                                                  {member.role}
                                                </Box>
                                              )}
                                            </Box>
                                          </Link>
                                        ))}
                                    </Box>
                                  </Box>
                                  {/* VS divider between factions */}
                                  {idx === 0 && (
                                    <Box style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 6px', gap: 4, flexShrink: 0 }}>
                                      <Box style={{ flex: 1, width: 1, minHeight: 30, background: 'linear-gradient(to bottom, transparent, #333 40%, #333 60%, transparent)' }} />
                                      <Text style={{ fontFamily: 'Georgia, serif', fontSize: '1.1rem', fontWeight: 800, color: '#e11d48', textShadow: '0 0 14px rgba(225,29,72,0.5)', letterSpacing: '0.05em' }}>VS</Text>
                                      <Box style={{ flex: 1, width: 1, minHeight: 30, background: 'linear-gradient(to bottom, transparent, #333 40%, #333 60%, transparent)' }} />
                                    </Box>
                                  )}
                                </React.Fragment>
                              )
                            })}
                        </Box>
                      ) : (
                        <Grid gutter={theme.spacing.md}>
                          {initialGamble.factions
                            .sort((a, b) => a.displayOrder - b.displayOrder)
                            .map((faction) => {
                              const factionName = faction.name || (faction.supportedGambler ? `${faction.supportedGambler.name}'s Side` : 'Faction')
                              return (
                                <Grid.Col key={faction.id} span={{ base: 12, md: 6 }}>
                                  <Box style={{ flex: 1, minWidth: 0, border: '1px solid #1e1e1e', borderRadius: 12, overflow: 'hidden', height: '100%' }}>
                                    {/* Faction header band */}
                                    <Box style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, background: getAlphaColor(gambleColor, 0.10), borderBottom: `1px solid ${getAlphaColor(gambleColor, 0.20)}` }}>
                                      <Box style={{ width: 8, height: 8, borderRadius: '50%', background: gambleColor, flexShrink: 0 }} />
                                      <Text style={{ fontSize: 13, fontWeight: 700, color: '#ddd' }}>{factionName}</Text>
                                      {faction.supportedGambler && faction.name && (
                                        <Badge variant="light" size="sm" radius="md" style={{ background: getAlphaColor(gambleColor, 0.2), border: `1px solid ${getAlphaColor(gambleColor, 0.4)}` }} c={textColors.gamble}>
                                          Supporting {faction.supportedGambler.name}
                                        </Badge>
                                      )}
                                    </Box>
                                    {/* Faction member rows */}
                                    <Box style={{ padding: '10px 12px', background: '#0e0e0e' }}>
                                      {faction.members
                                        .sort((a, b) => a.displayOrder - b.displayOrder)
                                        .map((member, mIdx) => (
                                          <Link key={member.id} href={`/characters/${member.character.id}`} style={{ textDecoration: 'none' }}>
                                            <Box style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: mIdx < faction.members.length - 1 ? '1px solid #161616' : 'none', cursor: 'pointer' }}>
                                              {/* Avatar — initials only */}
                                              <Box style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: getAlphaColor(gambleColor, 0.20), border: `1px solid ${getAlphaColor(gambleColor, 0.40)}`, fontSize: 9, fontWeight: 700, color: gambleColor }}>
                                                {member.character.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                                              </Box>
                                              <Text style={{ fontSize: 12, fontWeight: 600, color: '#ddd' }}>{member.character.name}</Text>
                                              {member.role && (
                                                <Box style={{ marginLeft: 'auto', background: '#1a1a1a', border: '1px solid #252525', borderRadius: 20, padding: '2px 8px', fontSize: 10, color: '#555', textTransform: 'capitalize', whiteSpace: 'nowrap' }}>
                                                  {member.role}
                                                </Box>
                                              )}
                                            </Box>
                                          </Link>
                                        ))}
                                    </Box>
                                  </Box>
                                </Grid.Col>
                              )
                            })}
                        </Grid>
                      )}
                    </Box>
                  </Card>
                )}
              </Stack>

              {/* Aside column */}
              <Stack gap={theme.spacing.sm}>
                {/* Details card */}
                <Card withBorder radius="lg" shadow="md" padding={0} style={getCardStyles(theme, gambleColor)}>
                  <Box style={{ height: 3, borderRadius: '6px 6px 0 0', background: `linear-gradient(90deg, ${gambleColor}, transparent 70%)` }} />
                  <Box p="md">
                    <Group gap={10} mb={14} align="center">
                      <Text style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: gambleColor, opacity: 0.85 }}>Details</Text>
                      <Box style={{ flex: 1, height: 1, background: `linear-gradient(to right, ${getAlphaColor(gambleColor, 0.20)}, transparent)` }} />
                    </Group>
                    {(initialGamble.chapter != null || initialGamble.chapterId != null) && (
                      <Box style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #161616' }}>
                        <Box style={{ width: 24, height: 24, borderRadius: 5, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: getAlphaColor(gambleColor, 0.10), border: `1px solid ${getAlphaColor(gambleColor, 0.20)}` }}>
                          <BookOpen size={14} color={gambleColor} />
                        </Box>
                        <Text style={{ fontSize: 11, color: '#555', flex: 1 }}>Start</Text>
                        <Text style={{ fontSize: 12, fontWeight: 700, color: gambleColor }}>Ch. {initialGamble.chapter?.number ?? initialGamble.chapterId}</Text>
                      </Box>
                    )}
                    {gambleArc != null && (
                      <Box style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #161616' }}>
                        <Box style={{ width: 24, height: 24, borderRadius: 5, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: getAlphaColor(gambleColor, 0.10), border: `1px solid ${getAlphaColor(gambleColor, 0.20)}` }}>
                          <Map size={14} color={gambleColor} />
                        </Box>
                        <Text style={{ fontSize: 11, color: '#555', flex: 1 }}>Arc</Text>
                        <Text component={Link} href={`/arcs/${gambleArc.id}`} style={{ fontSize: 12, fontWeight: 700, color: arcColor, textDecoration: 'none' }}>{gambleArc.name}</Text>
                      </Box>
                    )}
                    <Box style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0' }}>
                      <Box style={{ width: 24, height: 24, borderRadius: 5, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: getAlphaColor(gambleColor, 0.10), border: `1px solid ${getAlphaColor(gambleColor, 0.20)}` }}>
                        <Users size={14} color={gambleColor} />
                      </Box>
                      <Text style={{ fontSize: 11, color: '#555', flex: 1 }}>Players</Text>
                      <Text style={{ fontSize: 12, fontWeight: 700, color: gambleColor }}>{initialGamble.participants?.length ?? 0}</Text>
                    </Box>
                  </Box>
                </Card>

                {/* Participants compact list (when no factions) */}
                {(!initialGamble.factions || initialGamble.factions.length === 0) && initialGamble.participants && initialGamble.participants.length > 0 && (
                  <RelatedContentSection
                    entityType="character"
                    title="Participants"
                    items={initialGamble.participants ?? []}
                    previewCount={4}
                    getKey={(p) => p.id}
                    variant="compact"
                    getLabel={(p) => p.name}
                    getHref={(p) => `/characters/${p.id}`}
                    itemDotColor={characterColor}
                  />
                )}

                {/* Factions compact list (when factions exist) */}
                {initialGamble.factions && initialGamble.factions.length > 0 && (
                  <RelatedContentSection
                    entityType="character"
                    title="Factions"
                    items={initialGamble.factions}
                    previewCount={4}
                    getKey={(f) => f.id}
                    variant="compact"
                    getLabel={(f) => f.name || (f.supportedGambler ? `${f.supportedGambler.name}'s Side` : 'Faction')}
                    getHref={() => `#`}
                    itemDotColor={gambleColor}
                  />
                )}
              </Stack>
            </Box>
          </Tabs.Panel>

          <Tabs.Panel value="timeline" pt="md">
            {timelineLoading ? (
              <Box style={{ display: 'flex', justifyContent: 'center', paddingBlock: '2rem' }}>
                <Loader c={gambleColor} />
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
              <Card withBorder radius="lg" shadow="lg" padding={0} style={{ background: backgroundStyles.card, border: `1px solid ${getAlphaColor(getEntityThemeColor(theme, 'media'), 0.4)}` }}>
                <Box style={{ height: 3, borderRadius: '6px 6px 0 0', background: `linear-gradient(90deg, ${getEntityThemeColor(theme, 'media')}, transparent 70%)` }} />
                <Box p="md">
                  <Group justify="space-between" align="center" mb={14}>
                    <Group gap={10} align="center">
                      <Box style={{ width: 28, height: 28, borderRadius: 6, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: getAlphaColor(getEntityThemeColor(theme, 'media'), 0.15), border: `1px solid ${getAlphaColor(getEntityThemeColor(theme, 'media'), 0.30)}` }}>
                        <ImageIcon size={16} color={getEntityThemeColor(theme, 'media')} />
                      </Box>
                      <Text style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: getEntityThemeColor(theme, 'media'), opacity: 0.85 }}>
                        Media Gallery
                      </Text>
                    </Group>
                    <Button component={Link} href={`/media?ownerType=gamble&ownerId=${initialGamble.id}`} variant="outline" c={getEntityThemeColor(theme, 'media')} size="sm" radius="xl">
                      View All
                    </Button>
                  </Group>
                  <ErrorBoundary>
                    <MediaGallery ownerType="gamble" ownerId={initialGamble.id} purpose="gallery" limit={8} showTitle={false} compactMode showFilters={false} initialMediaId={mediaId} />
                  </ErrorBoundary>
                </Box>
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

    </Container>
    </Box>
  )
}
