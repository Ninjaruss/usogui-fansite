'use client'

import React, { useEffect, useState } from 'react'
import {
  Box,
  Container,
  Grid,
  Group,
  Paper,
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
} from '../../../lib/mantine-theme'
import { Book, Hash, BookOpen } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'motion/react'
import { pageEnter } from '../../../lib/motion-presets'
import TimelineSpoilerWrapper from '../../../components/TimelineSpoilerWrapper'
import { usePageView } from '../../../hooks/usePageView'
import { BreadcrumbNav, createEntityBreadcrumbs } from '../../../components/Breadcrumb'
import { DetailPageHeader } from '../../../components/layouts/DetailPageHeader'
import { RelatedContentSection } from '../../../components/layouts/RelatedContentSection'
import { CinematicCard, CinematicSectionHeader } from '../../../components/layouts/CinematicCard'

interface Volume {
  id: number
  number: number
  title?: string
  description?: string
  coverUrl?: string
  startChapter: number
  endChapter: number
  createdAt: string
  updatedAt: string
}

interface Chapter {
  id: number
  number: number
  title: string | null
  summary: string | null
}

interface ArcBase {
  id: number
  name: string
  startChapter: number
  endChapter: number
}

interface VolumePageClientProps {
  initialVolume: Volume
  initialChapters: Chapter[]
  initialArcs?: ArcBase[]
}

export default function VolumePageClient({ initialVolume, initialChapters, initialArcs = [] }: VolumePageClientProps) {
  const theme = useMantineTheme()
  const [activeTab, setActiveTab] = useState<string>('overview')

  // Track page view
  usePageView('volume', initialVolume.id.toString(), true)

  // Set tab accent colors for volume entity
  useEffect(() => {
    setTabAccentColors('volume')
  }, [])

  // Use consistent theme colors
  const entityColors = {
    volume: getEntityThemeColor(theme, 'volume'),
    chapter: getEntityThemeColor(theme, 'chapter'),
    guide: getEntityThemeColor(theme, 'guide'),
    arc: getEntityThemeColor(theme, 'arc')
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
            items={createEntityBreadcrumbs('volume', initialVolume.title || `Volume ${initialVolume.number}`)}
            entityType="volume"
          />

          {/* Enhanced Volume Header */}
          <DetailPageHeader
            entityType="volume"
            entityId={initialVolume.id}
            entityName={`Volume ${initialVolume.number}`}
            stats={[
              { value: initialChapters?.length ?? 0, label: 'Chapters' },
              ...(initialVolume.startChapter != null && initialVolume.endChapter != null
                ? [{ value: `Ch. ${initialVolume.startChapter}–${initialVolume.endChapter}`, label: 'Range' }]
                : []),
              { value: initialArcs?.length ?? 0, label: 'Arcs' },
            ].slice(0, 3)}
          />

          <motion.div {...pageEnter}>
            <Tabs
              value={activeTab}
              onChange={(value) => value && setActiveTab(value)}
              keepMounted={false}
              variant="pills"
              className="volume-tabs"
            >
              <Tabs.List>
                <Tabs.Tab value="overview" leftSection={<Book size={16} />}>Overview</Tabs.Tab>
                <Tooltip
                  label="No chapters available for this volume"
                  disabled={initialChapters.length > 0}
                  position="bottom"
                  withArrow
                >
                  <Tabs.Tab value="chapters" leftSection={<BookOpen size={16} />} disabled={initialChapters.length === 0}>
                    Chapters ({initialChapters.length})
                  </Tabs.Tab>
                </Tooltip>
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
                    {/* Volume Summary Section */}
                    <CinematicCard entityColor={entityColors.volume}>
                      <CinematicSectionHeader label="Volume Summary" entityColor={entityColors.volume} />
                      {initialVolume.description ? (
                        <TimelineSpoilerWrapper chapterNumber={initialVolume.startChapter}>
                          <Box style={{ lineHeight: 1.6 }}>
                            <Text style={{ fontSize: 14, lineHeight: 1.6 }}>{initialVolume.description}</Text>
                          </Box>
                        </TimelineSpoilerWrapper>
                      ) : (
                        <Text size="sm" c={textColors.tertiary} style={{ fontStyle: 'italic', textAlign: 'center', padding: theme.spacing.xl }}>
                          No summary available for this volume yet. Check back later for updates!
                        </Text>
                      )}
                    </CinematicCard>

                    {/* Chapter Navigation List */}
                    {initialChapters.length > 0 && (
                      <CinematicCard entityColor={entityColors.volume} padding="md">
                        <CinematicSectionHeader label="Chapters" entityColor={entityColors.volume} />
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
                                    <Box key="ellipsis" style={{ padding: '6px 0', fontSize: 11, color: `${entityColors.volume}44`, borderBottom: `1px solid ${entityColors.volume}10`, fontStyle: 'italic' }}>
                                      ··· {hiddenCount} more chapters
                                    </Box>
                                  )
                                }
                                const isFirst = ch.number === initialVolume.startChapter
                                const isLast = ch.number === initialVolume.endChapter
                                const isLastVisible = idx === visibleChapters.length - 1
                                return (
                                  <Box
                                    key={ch.id}
                                    component={Link}
                                    href={`/chapters/${ch.number}`}
                                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: isLastVisible ? 'none' : `1px solid ${entityColors.volume}10`, textDecoration: 'none' }}
                                  >
                                    <Text style={{ fontSize: 11, fontWeight: 700, color: entityColors.chapter, minWidth: 36, flexShrink: 0 }}>
                                      Ch. {ch.number}
                                    </Text>
                                    {isFirst && (
                                      <Box style={{ background: `${entityColors.volume}20`, border: `1px solid ${entityColors.volume}40`, borderRadius: 3, padding: '1px 5px', fontSize: 9, color: entityColors.volume, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', flexShrink: 0 }}>
                                        Start
                                      </Box>
                                    )}
                                    {isLast && (
                                      <Box style={{ background: `${entityColors.volume}20`, border: `1px solid ${entityColors.volume}40`, borderRadius: 3, padding: '1px 5px', fontSize: 9, color: entityColors.volume, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', flexShrink: 0 }}>
                                        End
                                      </Box>
                                    )}
                                    <Text style={{ fontSize: 13, color: '#aaa', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                      {ch.title || `Chapter ${ch.number}`}
                                    </Text>
                                    <Text style={{ fontSize: 12, color: `${entityColors.volume}44` }}>→</Text>
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
                    <CinematicCard entityColor={entityColors.volume} padding="md">
                      <CinematicSectionHeader label="Details" entityColor={entityColors.volume} />
                      <Box style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: `1px solid ${entityColors.volume}14` }}>
                        <Box style={{ width: 5, height: 5, borderRadius: '50%', background: entityColors.volume, flexShrink: 0 }} />
                        <Text style={{ fontSize: 11, color: `${entityColors.volume}66`, flex: 1 }}>Chapter Range</Text>
                        <Text style={{ fontSize: 12, fontWeight: 700, color: entityColors.volume }}>Ch. {initialVolume.startChapter}–{initialVolume.endChapter}</Text>
                      </Box>
                      <Box style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: `1px solid ${entityColors.volume}14` }}>
                        <Box style={{ width: 5, height: 5, borderRadius: '50%', background: entityColors.volume, flexShrink: 0 }} />
                        <Text style={{ fontSize: 11, color: `${entityColors.volume}66`, flex: 1 }}>Chapters</Text>
                        <Text style={{ fontSize: 12, fontWeight: 700, color: entityColors.volume }}>{initialChapters.length}</Text>
                      </Box>
                      <Box style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0' }}>
                        <Box style={{ width: 5, height: 5, borderRadius: '50%', background: entityColors.volume, flexShrink: 0 }} />
                        <Text style={{ fontSize: 11, color: `${entityColors.volume}66`, flex: 1 }}>Arcs</Text>
                        <Text style={{ fontSize: 12, fontWeight: 700, color: entityColors.volume }}>{initialArcs.length}</Text>
                      </Box>
                    </CinematicCard>

                    {/* Chapters compact list */}
                    <RelatedContentSection
                      entityType="chapter"
                      title="Chapters"
                      items={initialChapters ?? []}
                      previewCount={4}
                      getKey={(c) => c.id}
                      variant="compact"
                      getLabel={(c) => `Chapter ${c.number}`}
                      getHref={(c) => `/chapters/${c.id}`}
                      itemDotColor={entityColors.chapter}
                    />

                    {/* Arcs compact list */}
                    <RelatedContentSection
                      entityType="arc"
                      title="Arcs"
                      items={initialArcs ?? []}
                      previewCount={4}
                      getKey={(a) => a.id}
                      variant="compact"
                      getLabel={(a) => a.name}
                      getHref={(a) => `/arcs/${a.id}`}
                      itemDotColor={entityColors.arc}
                    />
                  </Stack>
                </Box>
              </Tabs.Panel>

              <Tabs.Panel value="chapters" pt={theme.spacing.md}>
                <Stack gap={theme.spacing.lg}>
                  <CinematicCard entityColor={entityColors.volume} padding="md">
                    <CinematicSectionHeader label="Chapters in This Volume" entityColor={entityColors.volume} extra={
                      <Box
                        style={{
                          padding: '2px 10px',
                          borderRadius: 4,
                          fontSize: fontSize.xs,
                          fontWeight: 600,
                          backgroundColor: getAlphaColor(entityColors.volume, 0.2),
                          border: `1px solid ${getAlphaColor(entityColors.volume, 0.4)}`,
                          color: entityColors.volume,
                        }}
                      >
                        {initialChapters.length} chapters
                      </Box>
                    } />

                    <Grid gutter="md">
                      {initialChapters.map((chapter) => (
                        <Grid.Col span={{ base: 12, sm: 6, lg: 4 }} key={chapter.number}>
                          <Paper
                            component={Link}
                            href={`/chapters/${chapter.number}`}
                            withBorder
                            radius="md"
                            p="md"
                            shadow="md"
                            style={{
                              cursor: 'pointer',
                              transition: `all ${theme.other?.transitions?.durationShort || 200}ms ease`,
                              height: '100%',
                              border: `1px solid ${getAlphaColor(entityColors.chapter, 0.3)}`,
                              textDecoration: 'none'
                            }}
                          >
                            <Stack gap="xs" h="100%" justify="center">
                              <Group gap="xs" justify="center">
                                <Hash size={16} color={entityColors.chapter} />
                                <Text size="lg" fw={600} c={entityColors.chapter}>
                                  Chapter {chapter.number}
                                </Text>
                              </Group>
                              {chapter.title && (
                                <Text size="sm" c={textColors.tertiary} lineClamp={2} ta="center">
                                  {chapter.title}
                                </Text>
                              )}
                            </Stack>
                          </Paper>
                        </Grid.Col>
                      ))}
                    </Grid>
                  </CinematicCard>
                </Stack>
              </Tabs.Panel>
            </Tabs>
          </motion.div>
        </Stack>
      </Container>
    </Box>
  )
}
