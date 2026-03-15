'use client'

import React, { useEffect, useState } from 'react'
import {
  Box,
  Button,
  Card,
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
  getCardStyles
} from '../../../lib/mantine-theme'
import { Book, Hash, BookOpen, ArrowRight, Bookmark } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'motion/react'
import { pageEnter } from '../../../lib/motion-presets'
import TimelineSpoilerWrapper from '../../../components/TimelineSpoilerWrapper'
import { usePageView } from '../../../hooks/usePageView'
import { BreadcrumbNav, createEntityBreadcrumbs } from '../../../components/Breadcrumb'
import { DetailPageHeader } from '../../../components/layouts/DetailPageHeader'
import { RelatedContentSection } from '../../../components/layouts/RelatedContentSection'

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
            <Card withBorder radius="lg" className="gambling-card" shadow="xl" style={getCardStyles(theme)}>
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
                      <Card withBorder radius="lg" shadow="lg" padding={0} style={getCardStyles(theme, entityColors.volume)}>
                        <Box style={{ height: 3, borderRadius: '6px 6px 0 0', background: `linear-gradient(90deg, ${entityColors.volume}, transparent 70%)` }} />
                        <Box p="lg">
                          <Group gap={10} mb={14} align="center">
                            <Box style={{ width: 28, height: 28, borderRadius: 6, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: getAlphaColor(entityColors.volume, 0.15), border: `1px solid ${getAlphaColor(entityColors.volume, 0.30)}` }}>
                              <Book size={16} color={entityColors.volume} />
                            </Box>
                            <Text style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: entityColors.volume, opacity: 0.85 }}>Volume Summary</Text>
                            <Box style={{ flex: 1, height: 1, background: `linear-gradient(to right, ${getAlphaColor(entityColors.volume, 0.20)}, transparent)` }} />
                          </Group>
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
                        </Box>
                      </Card>

                      {/* Chapter Navigation Section */}
                      <Card withBorder radius="lg" shadow="lg" padding={0} style={getCardStyles(theme, entityColors.volume)}>
                        <Box style={{ height: 3, borderRadius: '6px 6px 0 0', background: `linear-gradient(90deg, ${entityColors.volume}, transparent 70%)` }} />
                        <Box p="md">
                          <Group gap={10} mb={14} align="center">
                            <Box style={{ width: 28, height: 28, borderRadius: 6, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: getAlphaColor(entityColors.volume, 0.15), border: `1px solid ${getAlphaColor(entityColors.volume, 0.30)}` }}>
                              <ArrowRight size={16} color={entityColors.volume} />
                            </Box>
                            <Text style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: entityColors.volume, opacity: 0.85 }}>Chapter Navigation</Text>
                            <Box style={{ flex: 1, height: 1, background: `linear-gradient(to right, ${getAlphaColor(entityColors.volume, 0.20)}, transparent)` }} />
                          </Group>
                          <Group gap={theme.spacing.md} wrap="wrap">
                            <Button
                              component={Link}
                              href={`/chapters/${initialVolume.startChapter}`}
                              variant="outline"
                              c={entityColors.volume}
                              size="md"
                              radius="xl"
                              style={{
                                fontWeight: 600,
                                border: `2px solid ${entityColors.volume}`,
                                transition: `all ${theme.other?.transitions?.durationShort || 200}ms ease`,
                                flex: 1,
                                minWidth: '200px'
                              }}
                            >
                              Start: Chapter {initialVolume.startChapter}
                            </Button>
                            <Button
                              component={Link}
                              href={`/chapters/${initialVolume.endChapter}`}
                              variant="filled"
                              style={{
                                background: `linear-gradient(135deg, ${entityColors.volume} 0%, ${entityColors.volume}dd 100%)`,
                                border: `1px solid ${entityColors.volume}`,
                                fontWeight: 600,
                                flex: 1,
                                minWidth: '200px'
                              }}
                            >
                              End: Chapter {initialVolume.endChapter}
                            </Button>
                          </Group>
                        </Box>
                      </Card>
                    </Stack>

                    {/* Aside column */}
                    <Stack gap={theme.spacing.sm}>
                      {/* Details card */}
                      <Card withBorder radius="lg" shadow="lg" padding={0} style={getCardStyles(theme, entityColors.volume)}>
                        <Box style={{ height: 3, borderRadius: '6px 6px 0 0', background: `linear-gradient(90deg, ${entityColors.volume}, transparent 70%)` }} />
                        <Box p="md">
                          <Group gap={10} mb={14} align="center">
                            <Text style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: entityColors.volume, opacity: 0.85 }}>Details</Text>
                            <Box style={{ flex: 1, height: 1, background: `linear-gradient(to right, ${getAlphaColor(entityColors.volume, 0.20)}, transparent)` }} />
                          </Group>
                          {initialVolume.startChapter != null && initialVolume.endChapter != null && (
                            <Box style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #161616' }}>
                              <Box style={{ width: 24, height: 24, borderRadius: 5, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: getAlphaColor(entityColors.volume, 0.10), border: `1px solid ${getAlphaColor(entityColors.volume, 0.20)}` }}>
                                <BookOpen size={14} color={entityColors.volume} />
                              </Box>
                              <Text style={{ fontSize: 11, color: '#555', flex: 1 }}>Chapter Range</Text>
                              <Text style={{ fontSize: 12, fontWeight: 700, color: entityColors.volume }}>Ch. {initialVolume.startChapter}–{initialVolume.endChapter}</Text>
                            </Box>
                          )}
                          <Box style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #161616' }}>
                            <Box style={{ width: 24, height: 24, borderRadius: 5, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: getAlphaColor(entityColors.volume, 0.10), border: `1px solid ${getAlphaColor(entityColors.volume, 0.20)}` }}>
                              <Book size={14} color={entityColors.volume} />
                            </Box>
                            <Text style={{ fontSize: 11, color: '#555', flex: 1 }}>Chapter Count</Text>
                            <Text style={{ fontSize: 12, fontWeight: 700, color: entityColors.volume }}>{initialChapters?.length ?? 0}</Text>
                          </Box>
                          <Box style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0' }}>
                            <Box style={{ width: 24, height: 24, borderRadius: 5, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: getAlphaColor(entityColors.volume, 0.10), border: `1px solid ${getAlphaColor(entityColors.volume, 0.20)}` }}>
                              <Bookmark size={14} color={entityColors.volume} />
                            </Box>
                            <Text style={{ fontSize: 11, color: '#555', flex: 1 }}>Arc Count</Text>
                            <Text style={{ fontSize: 12, fontWeight: 700, color: entityColors.volume }}>{initialArcs?.length ?? 0}</Text>
                          </Box>
                        </Box>
                      </Card>

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
                    <Card withBorder radius="lg" shadow="lg" padding={0} style={getCardStyles(theme, entityColors.volume)}>
                      <Box style={{ height: 3, borderRadius: '6px 6px 0 0', background: `linear-gradient(90deg, ${entityColors.volume}, transparent 70%)` }} />
                      <Box p="md">
                        <Group justify="space-between" align="center" mb={14}>
                          <Group gap={10} align="center">
                            <Box style={{ width: 28, height: 28, borderRadius: 6, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: getAlphaColor(entityColors.volume, 0.15), border: `1px solid ${getAlphaColor(entityColors.volume, 0.30)}` }}>
                              <BookOpen size={16} color={entityColors.volume} />
                            </Box>
                            <Text style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: entityColors.volume, opacity: 0.85 }}>Chapters in This Volume</Text>
                          </Group>
                          <Box
                            style={{
                              padding: '2px 10px',
                              borderRadius: 4,
                              fontSize: fontSize.xs,
                              fontWeight: 600,
                              backgroundColor: getAlphaColor(entityColors.volume, 0.2),
                              border: `1px solid ${getAlphaColor(entityColors.volume, 0.4)}`,
                              color: textColors.volume,
                            }}
                          >
                            {initialChapters.length} chapters
                          </Box>
                        </Group>

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
                      </Box>
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
