'use client'

import React, { useEffect, useState } from 'react'
import {
  Badge,
  Box,
  Card,
  Container,
  Group,
  Stack,
  Tabs,
  Text,
  Tooltip,
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
import { BookOpen, Book, FileText, Users, MessageSquareQuote, CalendarSearch, MessageSquare, Map } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'motion/react'
import { pageEnter } from '../../../lib/motion-presets'
import TimelineSpoilerWrapper from '../../../components/TimelineSpoilerWrapper'
import { usePageView } from '../../../hooks/usePageView'
import { BreadcrumbNav, createEntityBreadcrumbs } from '../../../components/Breadcrumb'
import { DetailPageHeader } from '../../../components/layouts/DetailPageHeader'
import { RelatedContentSection } from '../../../components/layouts/RelatedContentSection'
import type { Chapter as ChapterResource } from '../../../types'
import { AnnotationSection } from '../../../components/annotations'
import { EntityQuickActions } from '../../../components/EntityQuickActions'
import { useAuth } from '../../../providers/AuthProvider'
import { AnnotationOwnerType } from '../../../types'

interface Character {
  id: number
  name: string
}

interface Event {
  id: number
  title: string
  description: string
  type?: 'gamble' | 'decision' | 'reveal' | 'shift' | 'resolution'
}

interface Quote {
  id: number
  text: string
  pageNumber?: number
  character?: Character
}

type Chapter = ChapterResource & {
  chapterNumber?: number | null
}

interface ArcBase {
  id: number
  name: string
  startChapter: number
  endChapter: number
}

interface ChapterPageClientProps {
  initialChapter: Chapter
  initialEvents?: Event[]
  initialQuotes?: Quote[]
  initialCharacters?: Character[]
  initialArc?: ArcBase | null
}

export default function ChapterPageClient({
  initialChapter,
  initialEvents = [],
  initialQuotes = [],
  initialCharacters = [],
  initialArc
}: ChapterPageClientProps) {
  const theme = useMantineTheme()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<string>('overview')

  usePageView('chapter', initialChapter.id.toString(), true)

  // Set tab accent colors for chapter entity
  useEffect(() => {
    setTabAccentColors('chapter')
  }, [])

  // Use consistent theme colors
  const entityColors = {
    chapter: getEntityThemeColor(theme, 'chapter'),
    character: getEntityThemeColor(theme, 'character'),
    event: getEntityThemeColor(theme, 'event'),
    quote: getEntityThemeColor(theme, 'quote'),
    volume: getEntityThemeColor(theme, 'volume'),
    arc: getEntityThemeColor(theme, 'arc')
  }

  const eventTypeColor: Record<string, string> = {
    gamble: '#e11d48',
    reveal: '#f59e0b',
    decision: '#3b82f6',
    shift: '#a855f7',
    resolution: '#22c55e',
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
            items={createEntityBreadcrumbs('chapter', initialChapter.title || `Chapter ${initialChapter.number}`)}
            entityType="chapter"
          />

          {/* Enhanced Chapter Header */}
          <DetailPageHeader
            entityType="chapter"
            entityId={initialChapter.id}
            entityName={`Chapter ${initialChapter.number}`}
            stats={[
              { value: initialEvents?.length ?? 0, label: 'Events' },
              ...(initialChapter.volume != null
                ? [{ value: `Vol. ${initialChapter.volume.number}`, label: 'Volume' }]
                : []),
              ...(initialArc != null
                ? [{ value: initialArc.name, label: 'Arc' }]
                : []),
            ].slice(0, 3)}
            spoilerChapter={initialChapter.number}
            showImage={false}
          />

          <motion.div {...pageEnter}>
            <Card withBorder radius="lg" className="gambling-card" shadow="xl" style={getCardStyles(theme)}>
              <Tabs
                value={activeTab}
                onChange={(value) => value && setActiveTab(value)}
                keepMounted={false}
                variant="pills"
                className="chapter-tabs"
              >
                <Tabs.List>
                  <Tabs.Tab value="overview" leftSection={<BookOpen size={16} />}>Overview</Tabs.Tab>
                  <Tooltip
                    label="No events available for this chapter"
                    disabled={Array.isArray(initialEvents) && initialEvents.length > 0}
                    position="bottom"
                    withArrow
                  >
                    <Tabs.Tab
                      value="events"
                      leftSection={<CalendarSearch size={16} />}
                      rightSection={Array.isArray(initialEvents) && initialEvents.length > 0 ? <Badge size="xs" variant="light" c={entityColors.event}>{initialEvents.length}</Badge> : null}
                      disabled={!Array.isArray(initialEvents) || initialEvents.length === 0}
                    >
                      Events
                    </Tabs.Tab>
                  </Tooltip>
                  <Tooltip
                    label="No quotes available for this chapter"
                    disabled={Array.isArray(initialQuotes) && initialQuotes.length > 0}
                    position="bottom"
                    withArrow
                  >
                    <Tabs.Tab
                      value="quotes"
                      leftSection={<MessageSquareQuote size={16} />}
                      rightSection={Array.isArray(initialQuotes) && initialQuotes.length > 0 ? <Badge size="xs" variant="light" c={entityColors.quote}>{initialQuotes.length}</Badge> : null}
                      disabled={!Array.isArray(initialQuotes) || initialQuotes.length === 0}
                    >
                      Quotes
                    </Tabs.Tab>
                  </Tooltip>
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
                      {/* Chapter Summary Section */}
                      <Card withBorder radius="lg" shadow="lg" padding={0} style={getCardStyles(theme, entityColors.chapter)}>
                        <Box style={{ height: 3, borderRadius: '6px 6px 0 0', background: `linear-gradient(90deg, ${entityColors.chapter}, transparent 70%)` }} />
                        <Box p="lg">
                          <Group gap={10} mb={14} align="center">
                            <Box style={{ width: 28, height: 28, borderRadius: 6, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: getAlphaColor(entityColors.chapter, 0.15), border: `1px solid ${getAlphaColor(entityColors.chapter, 0.30)}` }}>
                              <FileText size={16} color={entityColors.chapter} />
                            </Box>
                            <Text style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: entityColors.chapter, opacity: 0.85 }}>Chapter Summary</Text>
                            <Box style={{ flex: 1, height: 1, background: `linear-gradient(to right, ${getAlphaColor(entityColors.chapter, 0.20)}, transparent)` }} />
                          </Group>
                          {(initialChapter.description || initialChapter.summary) ? (
                            <TimelineSpoilerWrapper chapterNumber={initialChapter.number}>
                              <Box style={{ lineHeight: 1.6 }}>
                                <Text style={{ fontSize: 14, lineHeight: 1.6 }}>{initialChapter.description || initialChapter.summary}</Text>
                              </Box>
                            </TimelineSpoilerWrapper>
                          ) : (
                            <Text size="sm" c={textColors.tertiary} style={{ fontStyle: 'italic', textAlign: 'center', padding: theme.spacing.xl }}>
                              No summary available for this chapter yet. Check back later for updates!
                            </Text>
                          )}
                        </Box>
                      </Card>

                      {/* Featured Characters Section */}
                      {initialCharacters.length > 0 && (
                        <Card withBorder radius="lg" shadow="lg" padding={0} style={getCardStyles(theme, entityColors.character)}>
                          <Box style={{ height: 3, borderRadius: '6px 6px 0 0', background: `linear-gradient(90deg, ${entityColors.character}, transparent 70%)` }} />
                          <Box p="md">
                            <Group gap={10} mb={14} align="center">
                              <Box style={{ width: 28, height: 28, borderRadius: 6, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: getAlphaColor(entityColors.character, 0.15), border: `1px solid ${getAlphaColor(entityColors.character, 0.30)}` }}>
                                <Users size={16} color={entityColors.character} />
                              </Box>
                              <Text style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: entityColors.character, opacity: 0.85 }}>Featured Characters</Text>
                              <Box style={{ flex: 1, height: 1, background: `linear-gradient(to right, ${getAlphaColor(entityColors.character, 0.20)}, transparent)` }} />
                            </Group>
                            <Box style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                              {initialCharacters.map((character) => (
                                <Box
                                  key={character.id}
                                  component={Link}
                                  href={`/characters/${character.id}`}
                                  style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#131313', border: '1px solid #222', borderRadius: 8, padding: '6px 10px', textDecoration: 'none', cursor: 'pointer', transition: `all ${theme.other?.transitions?.durationShort || 200}ms ease` }}
                                  onMouseEnter={(e: React.MouseEvent<HTMLElement>) => { (e.currentTarget as HTMLElement).style.borderColor = entityColors.character }}
                                  onMouseLeave={(e: React.MouseEvent<HTMLElement>) => { (e.currentTarget as HTMLElement).style.borderColor = '#222' }}
                                >
                                  <Box style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: getAlphaColor(entityColors.character, 0.20), border: `1px solid ${getAlphaColor(entityColors.character, 0.40)}`, fontSize: 10, fontWeight: 700, color: entityColors.character }}>
                                    {character.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                                  </Box>
                                  <Text style={{ fontSize: 13, fontWeight: 600, color: '#ddd' }}>{character.name}</Text>
                                </Box>
                              ))}
                            </Box>
                          </Box>
                        </Card>
                      )}
                    </Stack>

                    {/* Aside column */}
                    <Stack gap={theme.spacing.sm}>
                      {/* Details card */}
                      <Card withBorder radius="lg" shadow="md" padding={0} style={getCardStyles(theme, entityColors.chapter)}>
                        <Box style={{ height: 3, borderRadius: '6px 6px 0 0', background: `linear-gradient(90deg, ${entityColors.chapter}, transparent 70%)` }} />
                        <Box p="md">
                          <Group gap={10} mb={14} align="center">
                            <Text style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: entityColors.chapter, opacity: 0.85 }}>Details</Text>
                            <Box style={{ flex: 1, height: 1, background: `linear-gradient(to right, ${getAlphaColor(entityColors.chapter, 0.20)}, transparent)` }} />
                          </Group>
                          <Box style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #161616' }}>
                            <Box style={{ width: 24, height: 24, borderRadius: 5, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: getAlphaColor(entityColors.chapter, 0.10), border: `1px solid ${getAlphaColor(entityColors.chapter, 0.20)}` }}>
                              <BookOpen size={14} color={entityColors.chapter} />
                            </Box>
                            <Text style={{ fontSize: 11, color: '#555', flex: 1 }}>Chapter</Text>
                            <Text style={{ fontSize: 12, fontWeight: 700, color: entityColors.chapter }}>#{initialChapter.number}</Text>
                          </Box>
                          {initialChapter.volume != null && (
                            <Box style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #161616' }}>
                              <Box style={{ width: 24, height: 24, borderRadius: 5, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: getAlphaColor(entityColors.chapter, 0.10), border: `1px solid ${getAlphaColor(entityColors.chapter, 0.20)}` }}>
                                <Book size={14} color={entityColors.volume} />
                              </Box>
                              <Text style={{ fontSize: 11, color: '#555', flex: 1 }}>Volume</Text>
                              <Text component={Link} href={`/volumes/${initialChapter.volume.id}`} style={{ fontSize: 12, fontWeight: 700, color: entityColors.volume, textDecoration: 'none' }}>
                                Vol. {initialChapter.volume.number}{initialChapter.volume.title ? `: ${initialChapter.volume.title}` : ''}
                              </Text>
                            </Box>
                          )}
                          {initialArc != null && (
                            <Box style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #161616' }}>
                              <Box style={{ width: 24, height: 24, borderRadius: 5, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: getAlphaColor(entityColors.chapter, 0.10), border: `1px solid ${getAlphaColor(entityColors.chapter, 0.20)}` }}>
                                <Map size={14} color={entityColors.arc} />
                              </Box>
                              <Text style={{ fontSize: 11, color: '#555', flex: 1 }}>Arc</Text>
                              <Text component={Link} href={`/arcs/${initialArc.id}`} style={{ fontSize: 12, fontWeight: 700, color: entityColors.arc, textDecoration: 'none' }}>{initialArc.name}</Text>
                            </Box>
                          )}
                          <Box style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0' }}>
                            <Box style={{ width: 24, height: 24, borderRadius: 5, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: getAlphaColor(entityColors.chapter, 0.10), border: `1px solid ${getAlphaColor(entityColors.chapter, 0.20)}` }}>
                              <CalendarSearch size={14} color={entityColors.chapter} />
                            </Box>
                            <Text style={{ fontSize: 11, color: '#555', flex: 1 }}>Events</Text>
                            <Text style={{ fontSize: 12, fontWeight: 700, color: entityColors.chapter }}>{initialEvents?.length ?? 0}</Text>
                          </Box>
                        </Box>
                      </Card>

                      {/* Events compact list */}
                      <RelatedContentSection
                        entityType="event"
                        title="Events"
                        items={initialEvents ?? []}
                        previewCount={4}
                        getKey={(e) => e.id}
                        variant="compact"
                        getLabel={(e) => e.title}
                        getHref={(e) => `/events/${e.id}`}
                        itemDotColor={entityColors.event}
                      />

                      {/* Quotes compact list */}
                      <RelatedContentSection
                        entityType="quote"
                        title="Quotes"
                        items={initialQuotes ?? []}
                        previewCount={4}
                        getKey={(q) => q.id}
                        variant="compact"
                        getLabel={(q) => q.text?.slice(0, 60) ?? '(quote)'}
                        getHref={(q) => `/quotes/${q.id}`}
                        itemDotColor={entityColors.quote}
                      />
                    </Stack>
                  </Box>
                </Tabs.Panel>

                <Tabs.Panel value="events" pt={theme.spacing.md}>
                  <Stack gap={theme.spacing.lg}>
                    <Card withBorder radius="lg" shadow="lg" padding={0} style={getCardStyles(theme, entityColors.event)}>
                      <Box style={{ height: 3, borderRadius: '6px 6px 0 0', background: `linear-gradient(90deg, ${entityColors.event}, transparent 70%)` }} />
                      <Box p="md">
                        <Group gap={10} mb={14} align="center">
                          <Box style={{ width: 28, height: 28, borderRadius: 6, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: getAlphaColor(entityColors.event, 0.15), border: `1px solid ${getAlphaColor(entityColors.event, 0.30)}` }}>
                            <CalendarSearch size={16} color={entityColors.event} />
                          </Box>
                          <Text style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: entityColors.event, opacity: 0.85 }}>Chapter Events</Text>
                          <Box style={{ flex: 1, height: 1, background: `linear-gradient(to right, ${getAlphaColor(entityColors.event, 0.20)}, transparent)` }} />
                        </Group>
                        <Stack gap={6}>
                          {Array.isArray(initialEvents) && initialEvents.map((event) => {
                            const typeColor = event.type ? (eventTypeColor[event.type] ?? entityColors.event) : entityColors.event
                            return (
                              <Box
                                key={event.id}
                                component={Link}
                                href={`/events/${event.id}`}
                                style={{ background: backgroundStyles.card, border: '1px solid #1e1e1e', borderLeft: `3px solid ${typeColor}`, borderRadius: '0 10px 10px 0', padding: '12px 14px', display: 'flex', gap: 12, alignItems: 'flex-start', textDecoration: 'none', cursor: 'pointer', transition: 'background 150ms ease' }}
                                onMouseEnter={(e: React.MouseEvent<HTMLElement>) => { (e.currentTarget as HTMLElement).style.background = '#131313' }}
                                onMouseLeave={(e: React.MouseEvent<HTMLElement>) => { (e.currentTarget as HTMLElement).style.background = backgroundStyles.card as string }}
                              >
                                {event.type && (
                                  <Box style={{ background: getAlphaColor(typeColor, 0.15), border: `1px solid ${getAlphaColor(typeColor, 0.30)}`, borderRadius: 4, padding: '2px 6px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.05em', color: typeColor, flexShrink: 0, marginTop: 2, whiteSpace: 'nowrap' as const }}>
                                    {event.type}
                                  </Box>
                                )}
                                <Box>
                                  <Text style={{ fontSize: 14, fontWeight: 600, color: '#ddd' }}>{event.title}</Text>
                                  <Text style={{ fontSize: 12, color: '#666', marginTop: 3, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' } as React.CSSProperties}>
                                    {event.description}
                                  </Text>
                                </Box>
                              </Box>
                            )
                          })}
                        </Stack>
                      </Box>
                    </Card>
                  </Stack>
                </Tabs.Panel>

                <Tabs.Panel value="quotes" pt={theme.spacing.md}>
                  <Stack gap={theme.spacing.lg}>
                    <Card withBorder radius="lg" shadow="lg" padding={0} style={getCardStyles(theme, entityColors.quote)}>
                      <Box style={{ height: 3, borderRadius: '6px 6px 0 0', background: `linear-gradient(90deg, ${entityColors.quote}, transparent 70%)` }} />
                      <Box p="md">
                        <Group gap={10} mb={14} align="center">
                          <Box style={{ width: 28, height: 28, borderRadius: 6, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: getAlphaColor(entityColors.quote, 0.15), border: `1px solid ${getAlphaColor(entityColors.quote, 0.30)}` }}>
                            <MessageSquareQuote size={16} color={entityColors.quote} />
                          </Box>
                          <Text style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: entityColors.quote, opacity: 0.85 }}>Memorable Quotes</Text>
                          <Box style={{ flex: 1, height: 1, background: `linear-gradient(to right, ${getAlphaColor(entityColors.quote, 0.20)}, transparent)` }} />
                        </Group>
                        <Stack gap={theme.spacing.sm}>
                          {Array.isArray(initialQuotes) && initialQuotes.map((quote) => (
                            <Card key={quote.id} radius="xl" padding={0} style={getCardStyles(theme, entityColors.quote)}>
                              <Box style={{ height: 3, borderRadius: '12px 12px 0 0', background: `linear-gradient(90deg, ${entityColors.quote}, transparent 70%)` }} />
                              <Box p="md" style={{ position: 'relative' }}>
                                <Box style={{ position: 'absolute', top: 8, left: 14, fontSize: 60, lineHeight: 1, color: entityColors.quote, opacity: 0.12, fontFamily: 'Georgia, serif', pointerEvents: 'none', userSelect: 'none' } as React.CSSProperties}>
                                  &ldquo;
                                </Box>
                                <Text style={{ position: 'relative', fontStyle: 'italic', fontSize: 14, lineHeight: 1.65, paddingLeft: 10, borderLeft: `2px solid ${getAlphaColor(entityColors.quote, 0.40)}` }}>
                                  {quote.text}
                                </Text>
                                <Box style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
                                  {quote.character && (
                                    <Box style={{ borderRadius: 20, padding: '3px 10px', background: getAlphaColor(entityColors.quote, 0.12), border: `1px solid ${getAlphaColor(entityColors.quote, 0.25)}`, fontSize: 12, fontWeight: 600, color: entityColors.quote }}>
                                      — {quote.character.name}
                                    </Box>
                                  )}
                                </Box>
                              </Box>
                            </Card>
                          ))}
                        </Stack>
                      </Box>
                    </Card>
                  </Stack>
                </Tabs.Panel>

                <Tabs.Panel value="annotations" pt={theme.spacing.md}>
                  <AnnotationSection
                    chapterReference={initialChapter.id}
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
          entityType="chapter"
          entityId={initialChapter.id}
          isAuthenticated={!!user}
        />
      </Container>
    </Box>
  )
}
