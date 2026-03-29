'use client'

import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  Badge,
  Box,
  Button,
  Card,
  Container,
  Group,
  Stack,
  Tabs,
  Text,
  useMantineTheme
} from '@mantine/core'
import {
  getEntityThemeColor,
  textColors,
  getAlphaColor,
  setTabAccentColors,
  backgroundStyles,
} from '../../../lib/mantine-theme'
import { ArrowUp, BookOpen, Calendar, Image as ImageIcon, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import { BreadcrumbNav, createEntityBreadcrumbs } from '../../../components/Breadcrumb'
import EnhancedSpoilerMarkdown from '../../../components/EnhancedSpoilerMarkdown'
import { motion } from 'motion/react'
import { pageEnter } from '../../../lib/motion-presets'
import { usePageView } from '../../../hooks/usePageView'
import MediaGallery from '../../../components/MediaGallery'
import ArcTimeline from '../../../components/ArcTimeline'
import TimelineSpoilerWrapper from '../../../components/TimelineSpoilerWrapper'
import { DetailPageHeader } from '../../../components/layouts/DetailPageHeader'
import { RelatedContentSection } from '../../../components/layouts/RelatedContentSection'
import { CinematicCard, CinematicSectionHeader } from '../../../components/layouts/CinematicCard'
import { ArcStructuredData } from '../../../components/StructuredData'
import { AnnotationSection } from '../../../components/annotations'
import { useAuth } from '../../../providers/AuthProvider'
import { AnnotationOwnerType } from '../../../types'

interface ArcBase {
  id: number
  name: string
  description?: string
  startChapter?: number
  endChapter?: number
  order?: number
  imageFileName?: string
  imageDisplayName?: string
}

interface Arc extends ArcBase {
  description: string
  startChapter: number
  endChapter: number
  createdAt: string
  updatedAt: string
  parentId?: number | null
  parent?: ArcBase | null
  children?: ArcBase[]
}

interface Character {
  id: number
  name: string
}

interface Event {
  id: number
  title: string
  description: string
  type: string
  chapterNumber: number
  characters?: Character[]
}

interface Gamble {
  id: number
  name: string
  chapterId?: number
}

interface Chapter {
  id: number
  number: number
  title: string | null
  summary: string | null
}

interface ArcPageClientProps {
  initialArc: Arc
  initialEvents: Event[]
  initialGambles: Gamble[]
  initialChapters: Chapter[]
}

export default function ArcPageClient({ initialArc, initialEvents, initialGambles, initialChapters }: ArcPageClientProps) {
  const theme = useMantineTheme()
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const mediaId = searchParams.get('mediaId') ?? undefined
  const [activeTab, setActiveTab] = useState<string>('overview')

  const entityColors = {
    arc: getEntityThemeColor(theme, 'arc'),
    gamble: getEntityThemeColor(theme, 'gamble'),
    media: getEntityThemeColor(theme, 'media'),
  }

  usePageView('arc', initialArc.id.toString(), true)

  // Set tab accent colors for arc entity
  useEffect(() => {
    setTabAccentColors('arc')
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.slice(1)
      if (['overview', 'gambles', 'media', 'annotations'].includes(hash)) {
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

  return (
    <Box style={{
      backgroundColor: backgroundStyles.page(theme),
      minHeight: '100vh',
      color: textColors.primary
    }}>
    <Container size="lg" py="md" style={{ backgroundColor: backgroundStyles.container(theme) }}>
    <Stack gap={theme.spacing.md}>
      <ArcStructuredData
        arc={{
          id: initialArc.id,
          name: initialArc.name,
          description: initialArc.description,
          startChapter: initialArc.startChapter,
          endChapter: initialArc.endChapter,
          imageUrl: initialArc.imageFileName ? `/api/media/arc/${initialArc.imageFileName}` : undefined
        }}
      />

      {/* Breadcrumb Navigation */}
      <BreadcrumbNav
        items={createEntityBreadcrumbs('arc', initialArc.name)}
        entityType="arc"
      />

      {/* Parent Arc Link - shown if this is a sub-arc */}
      {initialArc.parent && (
        <Card
          withBorder
          radius="md"
          p="sm"
          mb="lg"
          style={{
            background: backgroundStyles.card,
            borderColor: getAlphaColor(entityColors.arc, 0.4)
          }}
        >
          <Group gap="sm">
            <ArrowUp size={16} color={entityColors.arc} />
            <Badge size="sm" variant="light" c={entityColors.arc}>Part of</Badge>
            <Button
              component={Link}
              href={`/arcs/${initialArc.parent.id}`}
              variant="subtle"
              size="sm"
              c={entityColors.arc}
              style={{ fontWeight: 600 }}
            >
              {initialArc.parent.name}
            </Button>
            {initialArc.parent.startChapter && initialArc.parent.endChapter && (
              <Badge size="sm" variant="outline" c={entityColors.arc}>
                Ch. {initialArc.parent.startChapter}-{initialArc.parent.endChapter}
              </Badge>
            )}
          </Group>
        </Card>
      )}

      {/* Enhanced Arc Header */}
      <DetailPageHeader
        entityType="arc"
        entityId={initialArc.id}
        entityName={initialArc.name}
        stats={[
          { value: initialGambles.length ?? 0, label: 'Gambles' },
          ...(initialArc.startChapter != null && initialArc.endChapter != null
            ? [{ value: `Ch. ${initialArc.startChapter}–${initialArc.endChapter}`, label: 'Chapters' }]
            : initialArc.startChapter != null
            ? [{ value: `Ch. ${initialArc.startChapter}+`, label: 'Chapters' }]
            : []),
          ...(initialArc.children != null && initialArc.children.length > 0
            ? [{ value: initialArc.children.length, label: 'Sub-arcs' }]
            : []),
        ].slice(0, 3)}
        spoilerChapter={initialArc.startChapter}
      />

      <motion.div {...pageEnter}>
        <Card withBorder radius="lg" className="gambling-card" shadow="xl" style={{
          background: backgroundStyles.card,
          border: `1px solid ${getAlphaColor(entityColors.arc, 0.4)}`
        }}>
        <Tabs
          value={activeTab}
          onChange={(value) => value && setActiveTab(value)}
          keepMounted={false}
          variant="pills"
          className="arc-tabs"
        >
          <Tabs.List>
            <Tabs.Tab value="overview" leftSection={<BookOpen size={16} />}>Overview</Tabs.Tab>
            {initialEvents.length > 0 && (
              <Tabs.Tab
                value="timeline"
                leftSection={<Calendar size={16} />}
                rightSection={<Badge size="xs" variant="light" c={entityColors.arc}>{initialEvents.length}</Badge>}
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
                {/* Arc Description Section */}
                <CinematicCard entityColor={entityColors.arc}>
                  <CinematicSectionHeader label="About This Arc" entityColor={entityColors.arc} />
                  <TimelineSpoilerWrapper chapterNumber={initialArc.startChapter}>
                    <Box style={{ fontSize: 14, lineHeight: 1.6 }}>
                      <EnhancedSpoilerMarkdown
                        content={initialArc.description}
                        className="arc-description"
                        enableEntityEmbeds
                        compactEntityCards={false}
                      />
                    </Box>
                  </TimelineSpoilerWrapper>
                </CinematicCard>

                {/* Chapter Navigation */}
                {initialChapters.length > 0 && (
                  <CinematicCard entityColor={entityColors.arc} padding="md">
                    <CinematicSectionHeader label="Chapters" entityColor={entityColors.arc} />
                    {(() => {
                      const COLLAPSE_THRESHOLD = 6
                      const PREVIEW_HEAD = 3
                      const PREVIEW_TAIL = 1
                      const chapters = initialChapters
                      const showCollapsed = chapters.length > COLLAPSE_THRESHOLD
                      const visibleChapters = showCollapsed
                        ? [...chapters.slice(0, PREVIEW_HEAD), null, ...chapters.slice(-PREVIEW_TAIL)]
                        : chapters
                      const hiddenCount = chapters.length - PREVIEW_HEAD - PREVIEW_TAIL

                      return (
                        <Box>
                          {visibleChapters.map((ch, idx) => {
                            if (ch === null) {
                              return (
                                <Box key="ellipsis" style={{ padding: '6px 0', fontSize: 11, color: `${entityColors.arc}44`, borderBottom: `1px solid ${entityColors.arc}10`, fontStyle: 'italic' }}>
                                  ··· {hiddenCount} more chapters
                                </Box>
                              )
                            }
                            const isFirst = ch.number === initialArc.startChapter
                            const isLast = ch.number === initialArc.endChapter
                            const isLastVisible = idx === visibleChapters.length - 1
                            return (
                              <Box
                                key={ch.id}
                                component={Link}
                                href={`/chapters/${ch.number}`}
                                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: isLastVisible ? 'none' : `1px solid ${entityColors.arc}10`, textDecoration: 'none' }}
                              >
                                <Text style={{ fontSize: 11, fontWeight: 700, color: entityColors.arc, minWidth: 36, flexShrink: 0 }}>
                                  Ch. {ch.number}
                                </Text>
                                {isFirst && (
                                  <Box style={{ background: `${entityColors.arc}20`, border: `1px solid ${entityColors.arc}40`, borderRadius: 3, padding: '1px 5px', fontSize: 9, color: entityColors.arc, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', flexShrink: 0 }}>
                                    Start
                                  </Box>
                                )}
                                {isLast && (
                                  <Box style={{ background: `${entityColors.arc}20`, border: `1px solid ${entityColors.arc}40`, borderRadius: 3, padding: '1px 5px', fontSize: 9, color: entityColors.arc, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', flexShrink: 0 }}>
                                    End
                                  </Box>
                                )}
                                <Text style={{ fontSize: 13, color: '#aaa', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {ch.title || `Chapter ${ch.number}`}
                                </Text>
                                <Text style={{ fontSize: 12, color: `${entityColors.arc}44` }}>→</Text>
                              </Box>
                            )
                          })}
                        </Box>
                      )
                    })()}
                  </CinematicCard>
                )}
              </Stack>

              {/* Aside column */}
              <Stack gap={theme.spacing.sm}>
                {/* Details card */}
                <CinematicCard entityColor={entityColors.arc} padding="md">
                  <CinematicSectionHeader label="Details" entityColor={entityColors.arc} />
                  {(initialArc.startChapter != null && initialArc.endChapter != null) && (
                    <Box style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: `1px solid ${entityColors.arc}14` }}>
                      <Box style={{ width: 5, height: 5, borderRadius: '50%', background: entityColors.arc, flexShrink: 0 }} />
                      <Text style={{ fontSize: 11, color: `${entityColors.arc}66`, flex: 1 }}>Chapters</Text>
                      <Text style={{ fontSize: 12, fontWeight: 700, color: entityColors.arc }}>Ch. {initialArc.startChapter}–{initialArc.endChapter}</Text>
                    </Box>
                  )}
                  <Box style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: `1px solid ${entityColors.arc}14` }}>
                    <Box style={{ width: 5, height: 5, borderRadius: '50%', background: entityColors.arc, flexShrink: 0 }} />
                    <Text style={{ fontSize: 11, color: `${entityColors.arc}66`, flex: 1 }}>Gambles</Text>
                    <Text style={{ fontSize: 12, fontWeight: 700, color: entityColors.arc }}>{initialGambles.length}</Text>
                  </Box>
                  {initialArc.children && initialArc.children.length > 0 && (
                    <Box style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0' }}>
                      <Box style={{ width: 5, height: 5, borderRadius: '50%', background: entityColors.arc, flexShrink: 0 }} />
                      <Text style={{ fontSize: 11, color: `${entityColors.arc}66`, flex: 1 }}>Sub-arcs</Text>
                      <Text style={{ fontSize: 12, fontWeight: 700, color: entityColors.arc }}>{initialArc.children.length}</Text>
                    </Box>
                  )}
                </CinematicCard>

                {/* Gambles compact list */}
                <RelatedContentSection
                  entityType="gamble"
                  title="Gambles"
                  items={initialGambles ?? []}
                  previewCount={4}
                  getKey={(g) => g.id}
                  variant="compact"
                  getLabel={(g) => g.name}
                  getHref={(g) => `/gambles/${g.id}`}
                  itemDotColor={entityColors.gamble}
                />

                {/* Sub-arcs compact list */}
                {initialArc.children != null && initialArc.children.length > 0 && (
                  <RelatedContentSection
                    entityType="arc"
                    title="Sub-arcs"
                    items={initialArc.children ?? []}
                    previewCount={4}
                    getKey={(a) => a.id}
                    variant="compact"
                    getLabel={(a) => a.name}
                    getHref={(a) => `/arcs/${a.id}`}
                    itemDotColor={entityColors.arc}
                  />
                )}
              </Stack>
            </Box>
          </Tabs.Panel>

            <Tabs.Panel value="timeline" pt="md">
              <ArcTimeline
                events={initialEvents.map((event) => ({
                  id: event.id,
                  title: event.title,
                  chapterNumber: event.chapterNumber,
                  type: event.type as 'gamble' | 'decision' | 'reveal' | 'shift' | 'resolution',
                  characters: event.characters?.map((char) => char.name),
                  description: event.description,
                  isSpoiler: event.chapterNumber > initialArc.startChapter
                }))}
                arcName={initialArc.name}
                startChapter={initialArc.startChapter}
                endChapter={initialArc.endChapter}
              />
            </Tabs.Panel>

          <Tabs.Panel value="media" pt={theme.spacing.md}>
            <Stack gap="md">
              <CinematicCard entityColor={entityColors.media} padding="md">
                <Group justify="space-between" align="center" mb={14}>
                  <Box style={{ fontSize: '0.55rem', fontWeight: 900, letterSpacing: '0.22em', textTransform: 'uppercase', borderRadius: 4, padding: '3px 8px', background: `${entityColors.media}18`, border: `1px solid ${entityColors.media}30`, color: entityColors.media }}>
                    Media Gallery
                  </Box>
                  <Box component={Link} href={`/media?ownerType=arc&ownerId=${initialArc.id}`} style={{ fontSize: 11, color: `${entityColors.media}88`, textDecoration: 'none' }}>
                    View All →
                  </Box>
                </Group>
                <MediaGallery
                  ownerType="arc"
                  ownerId={initialArc.id}
                  purpose="gallery"
                  limit={8}
                  showTitle={false}
                  compactMode
                  showFilters={false}
                  initialMediaId={mediaId}
                />
              </CinematicCard>
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="annotations" pt={theme.spacing.md}>
            <AnnotationSection
              ownerType={AnnotationOwnerType.ARC}
              ownerId={initialArc.id}
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
