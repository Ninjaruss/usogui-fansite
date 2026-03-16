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
  getCardStyles
} from '../../../lib/mantine-theme'
import { ArrowUp, BookOpen, ArrowRight, Crown, GitBranch, Calendar, Image as ImageIcon, MessageSquare } from 'lucide-react'
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

interface ArcPageClientProps {
  initialArc: Arc
  initialEvents: Event[]
  initialGambles: Gamble[]
}

export default function ArcPageClient({ initialArc, initialEvents, initialGambles }: ArcPageClientProps) {
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
                <Card withBorder radius="lg" shadow="lg" padding={0} style={getCardStyles(theme, entityColors.arc)}>
                  <Box style={{ height: 3, borderRadius: '6px 6px 0 0', background: `linear-gradient(90deg, ${entityColors.arc}, transparent 70%)` }} />
                  <Box p="lg">
                    <Group gap={10} mb={14} align="center">
                      <Box style={{ width: 28, height: 28, borderRadius: 6, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: getAlphaColor(entityColors.arc, 0.15), border: `1px solid ${getAlphaColor(entityColors.arc, 0.30)}` }}>
                        <BookOpen size={16} color={entityColors.arc} />
                      </Box>
                      <Text style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: entityColors.arc, opacity: 0.85 }}>
                        About This Arc
                      </Text>
                      <Box style={{ flex: 1, height: 1, background: `linear-gradient(to right, ${getAlphaColor(entityColors.arc, 0.20)}, transparent)` }} />
                    </Group>
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
                  </Box>
                </Card>

                {/* Chapter Navigation */}
                <Card withBorder radius="lg" shadow="lg" padding={0} style={{ background: backgroundStyles.card, border: `1px solid ${getAlphaColor(entityColors.arc, 0.4)}` }}>
                  <Box style={{ height: 3, borderRadius: '6px 6px 0 0', background: `linear-gradient(90deg, ${entityColors.arc}, transparent 70%)` }} />
                  <Box p="md">
                    <Group gap={10} mb={14} align="center">
                      <Box style={{ width: 28, height: 28, borderRadius: 6, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: getAlphaColor(entityColors.arc, 0.15), border: `1px solid ${getAlphaColor(entityColors.arc, 0.30)}` }}>
                        <ArrowRight size={16} color={entityColors.arc} />
                      </Box>
                      <Text style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: entityColors.arc, opacity: 0.85 }}>
                        Chapter Navigation
                      </Text>
                      <Box style={{ flex: 1, height: 1, background: `linear-gradient(to right, ${getAlphaColor(entityColors.arc, 0.20)}, transparent)` }} />
                    </Group>
                    <Group gap={theme.spacing.md} wrap="wrap">
                      <Button
                        component={Link}
                        href={`/chapters/${initialArc.startChapter}`}
                        variant="outline"
                        c={entityColors.arc}
                        size="md"
                        radius="xl"
                        style={{
                          fontWeight: 700,
                          fontFamily: 'var(--font-opti-goudy-text), serif',
                          border: `2px solid ${entityColors.arc}`,
                          transition: `all ${theme.other?.transitions?.durationShort || 200}ms ease`,
                          flex: 1,
                          minWidth: '200px',
                          letterSpacing: '0.02em'
                        }}
                      >
                        Start: Chapter {initialArc.startChapter}
                      </Button>
                      <Button
                        component={Link}
                        href={`/chapters/${initialArc.endChapter}`}
                        variant="filled"
                        style={{
                          background: `linear-gradient(135deg, ${entityColors.arc} 0%, ${entityColors.arc}dd 100%)`,
                          border: `1px solid ${entityColors.arc}`,
                          fontWeight: 700,
                          fontFamily: 'var(--font-opti-goudy-text), serif',
                          flex: 1,
                          minWidth: '200px',
                          letterSpacing: '0.02em'
                        }}
                      >
                        End: Chapter {initialArc.endChapter}
                      </Button>
                    </Group>
                  </Box>
                </Card>
              </Stack>

              {/* Aside column */}
              <Stack gap={theme.spacing.sm}>
                {/* Details card */}
                <Card withBorder radius="lg" shadow="lg" padding={0} style={getCardStyles(theme, entityColors.arc)}>
                  <Box style={{ height: 3, borderRadius: '6px 6px 0 0', background: `linear-gradient(90deg, ${entityColors.arc}, transparent 70%)` }} />
                  <Box p="md">
                    <Group gap={10} mb={14} align="center">
                      <Text style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: entityColors.arc, opacity: 0.85 }}>Details</Text>
                      <Box style={{ flex: 1, height: 1, background: `linear-gradient(to right, ${getAlphaColor(entityColors.arc, 0.20)}, transparent)` }} />
                    </Group>
                    {initialArc.startChapter != null && initialArc.endChapter != null && (
                      <Box style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #161616' }}>
                        <Box style={{ width: 24, height: 24, borderRadius: 5, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: getAlphaColor(entityColors.arc, 0.10), border: `1px solid ${getAlphaColor(entityColors.arc, 0.20)}` }}>
                          <BookOpen size={14} color={entityColors.arc} />
                        </Box>
                        <Text style={{ fontSize: 11, color: '#555', flex: 1 }}>Chapters</Text>
                        <Text style={{ fontSize: 12, fontWeight: 700, color: entityColors.arc }}>{initialArc.startChapter}–{initialArc.endChapter}</Text>
                      </Box>
                    )}
                    <Box style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: initialArc.children?.length ? '1px solid #161616' : 'none' }}>
                      <Box style={{ width: 24, height: 24, borderRadius: 5, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: getAlphaColor(entityColors.arc, 0.10), border: `1px solid ${getAlphaColor(entityColors.arc, 0.20)}` }}>
                        <Crown size={14} color={entityColors.arc} />
                      </Box>
                      <Text style={{ fontSize: 11, color: '#555', flex: 1 }}>Gambles</Text>
                      <Text style={{ fontSize: 12, fontWeight: 700, color: entityColors.arc }}>{initialGambles.length}</Text>
                    </Box>
                    {initialArc.children != null && initialArc.children.length > 0 && (
                      <Box style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0' }}>
                        <Box style={{ width: 24, height: 24, borderRadius: 5, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: getAlphaColor(entityColors.arc, 0.10), border: `1px solid ${getAlphaColor(entityColors.arc, 0.20)}` }}>
                          <GitBranch size={14} color={entityColors.arc} />
                        </Box>
                        <Text style={{ fontSize: 11, color: '#555', flex: 1 }}>Sub-arcs</Text>
                        <Text style={{ fontSize: 12, fontWeight: 700, color: entityColors.arc }}>{initialArc.children.length}</Text>
                      </Box>
                    )}
                  </Box>
                </Card>

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
                    <Button component={Link} href={`/media?ownerType=arc&ownerId=${initialArc.id}`} variant="outline" c={getEntityThemeColor(theme, 'media')} size="sm" radius="xl">
                      View All
                    </Button>
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
                </Box>
              </Card>
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
