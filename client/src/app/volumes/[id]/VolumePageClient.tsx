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
import { Book, Hash, BookOpen } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'motion/react'
import { pageEnter } from '../../../lib/motion-presets'
import TimelineSpoilerWrapper from '../../../components/TimelineSpoilerWrapper'
import { usePageView } from '../../../hooks/usePageView'
import { BreadcrumbNav, createEntityBreadcrumbs } from '../../../components/Breadcrumb'
import { DetailPageHeader } from '../../../components/layouts/DetailPageHeader'

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

  const chapterCount = initialVolume.endChapter - initialVolume.startChapter + 1

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
          >
            <Box style={{ position: 'relative' }}>
              <Text
                aria-hidden
                style={{
                  position: 'absolute',
                  top: -16,
                  right: -8,
                  fontSize: '5rem',
                  fontFamily: 'var(--font-opti-goudy-text), serif',
                  fontWeight: 400,
                  color: `${entityColors.volume}10`,
                  lineHeight: 1,
                  pointerEvents: 'none',
                  userSelect: 'none',
                  zIndex: 0,
                }}
              >
                {initialVolume.number}
              </Text>
              <Box style={{ position: 'relative', zIndex: 1 }}>
            <Stack gap={theme.spacing.sm}>
              {initialVolume.title && (
                <Text size="lg" c={textColors.secondary} fw={500}>
                  {initialVolume.title}
                </Text>
              )}

              {/* Chapter Range Badge */}
              <Badge
                variant="filled"
                size="lg"
                radius="md"
                leftSection={<Hash size={14} />}
                style={{
                  background: `linear-gradient(135deg, ${entityColors.volume} 0%, ${entityColors.volume}dd 100%)`,
                  border: `1px solid ${entityColors.volume}`,
                  boxShadow: theme.shadows.md,
                  fontSize: fontSize.sm,
                  color: textColors.primary,
                  fontWeight: 600,
                  alignSelf: 'flex-start'
                }}
              >
                Chapters {initialVolume.startChapter} - {initialVolume.endChapter}
              </Badge>
            </Stack>
              </Box>
            </Box>

            <Stack gap={theme.spacing.md} style={{ flex: 1, justifyContent: 'center' }}>
              {/* Content Stats */}
              <Group gap={theme.spacing.md} wrap="wrap" mt={theme.spacing.sm}>
                <Badge
                  size="lg"
                  variant="light"
                  c={textColors.volume}
                  leftSection={<BookOpen size={14} />}
                  style={{
                    fontSize: fontSize.xs,
                    fontWeight: 600,
                    background: getAlphaColor(entityColors.volume, 0.2),
                    border: `1px solid ${getAlphaColor(entityColors.volume, 0.4)}`
                  }}
                >
                  {chapterCount} Chapters
                </Badge>
                <Badge
                  size="lg"
                  variant="light"
                  c={textColors.volume}
                  style={{
                    fontSize: fontSize.xs,
                    fontWeight: 600,
                    background: getAlphaColor(entityColors.volume, 0.2),
                    border: `1px solid ${getAlphaColor(entityColors.volume, 0.4)}`
                  }}
                >
                  Volume #{initialVolume.number}
                </Badge>
                {initialArcs.map(arc => (
                  <Badge
                    key={arc.id}
                    component={Link}
                    href={`/arcs/${arc.id}`}
                    size="lg"
                    variant="light"
                    c={textColors.arc}
                    style={{
                      fontSize: fontSize.xs,
                      fontWeight: 600,
                      background: getAlphaColor(entityColors.arc, 0.2),
                      border: `1px solid ${getAlphaColor(entityColors.arc, 0.4)}`,
                      textDecoration: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    {arc.name}
                  </Badge>
                ))}
              </Group>
            </Stack>
          </DetailPageHeader>

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
                  <Stack gap={theme.spacing.lg}>
                    {/* Volume Summary Section */}
                    <Card withBorder radius="lg" shadow="lg" style={getCardStyles(theme, entityColors.volume)}>
                      <Stack gap={theme.spacing.md} p={theme.spacing.lg}>
                        <Group justify="flex-start" gap="sm" style={{ marginBottom: 12, marginTop: 24 }}>
                          <Box style={{ height: 1, width: 40, background: `linear-gradient(to right, transparent, ${entityColors.volume}40)` }} />
                          <Text className="eyebrow-label" style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.68rem' }}>
                            VOLUME SUMMARY
                          </Text>
                          <Box style={{ height: 1, flex: 1, maxWidth: 120, background: `linear-gradient(to left, transparent, ${entityColors.volume}20)` }} />
                        </Group>
                        {initialVolume.description ? (
                          <TimelineSpoilerWrapper chapterNumber={initialVolume.startChapter}>
                            <Box style={{ lineHeight: 1.7 }}>
                              <Text size="md">{initialVolume.description}</Text>
                            </Box>
                          </TimelineSpoilerWrapper>
                        ) : (
                          <Text size="sm" c={textColors.tertiary} style={{ fontStyle: 'italic', textAlign: 'center', padding: theme.spacing.xl }}>
                            No summary available for this volume yet. Check back later for updates!
                          </Text>
                        )}
                      </Stack>
                    </Card>

                    {/* Chapter Navigation Section */}
                    <Card withBorder radius="lg" shadow="lg" style={getCardStyles(theme, entityColors.volume)}>
                      <Stack gap={theme.spacing.md} p={theme.spacing.md}>
                        <Group justify="flex-start" gap="sm" style={{ marginBottom: 12, marginTop: 24 }}>
                          <Box style={{ height: 1, width: 40, background: `linear-gradient(to right, transparent, ${entityColors.volume}40)` }} />
                          <Text className="eyebrow-label" style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.68rem' }}>
                            CHAPTER NAVIGATION
                          </Text>
                          <Box style={{ height: 1, flex: 1, maxWidth: 120, background: `linear-gradient(to left, transparent, ${entityColors.volume}20)` }} />
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
                      </Stack>
                    </Card>

                  </Stack>
                </Tabs.Panel>

                <Tabs.Panel value="chapters" pt={theme.spacing.md}>
                  <Stack gap={theme.spacing.lg}>
                    <Card withBorder radius="lg" shadow="lg" style={getCardStyles(theme, entityColors.chapter)}>
                      <Stack gap={theme.spacing.md} p={theme.spacing.md}>
                        <Group justify="space-between" align="center">
                          <Group justify="flex-start" gap="sm" style={{ marginBottom: 12, marginTop: 24 }}>
                            <Box style={{ height: 1, width: 40, background: `linear-gradient(to right, transparent, ${entityColors.chapter}40)` }} />
                            <Text className="eyebrow-label" style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.68rem' }}>
                              CHAPTERS IN THIS VOLUME
                            </Text>
                            <Box style={{ height: 1, flex: 1, maxWidth: 120, background: `linear-gradient(to left, transparent, ${entityColors.chapter}20)` }} />
                          </Group>
                          <Badge
                            variant="light"
                            c={textColors.volume}
                            size="lg"
                            style={{
                              backgroundColor: getAlphaColor(entityColors.volume, 0.2),
                              border: `1px solid ${getAlphaColor(entityColors.volume, 0.4)}`
                            }}
                          >
                            {initialChapters.length} chapters
                          </Badge>
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
