'use client'

import React, { useState, useEffect } from 'react'
import {
  Badge,
  Box,
  Button,
  Card,
  Container,
  Group,
  Stack,
  Tabs,
  Title,
  Tooltip,
  useMantineTheme
} from '@mantine/core'
import {
  getEntityThemeColor,
  textColors,
  headerColors,
  getAlphaColor,
  spacing,
  fontSize,
  setTabAccentColors,
  backgroundStyles
} from '../../../lib/mantine-theme'
import { ArrowLeft, ArrowUp, BookOpen, Calendar, Image as ImageIcon, Layers, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import EnhancedSpoilerMarkdown from '../../../components/EnhancedSpoilerMarkdown'
import { motion } from 'motion/react'
import { usePageView } from '../../../hooks/usePageView'
import MediaGallery from '../../../components/MediaGallery'
import ArcTimeline from '../../../components/ArcTimeline'
import TimelineSpoilerWrapper from '../../../components/TimelineSpoilerWrapper'
import MediaThumbnail from '../../../components/MediaThumbnail'
import { ArcStructuredData } from '../../../components/StructuredData'
import { AnnotationSection } from '../../../components/annotations'
import { EntityQuickActions } from '../../../components/EntityQuickActions'
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
  const [activeTab, setActiveTab] = useState<string>('overview')
  const arcColor = getEntityThemeColor(theme, 'arc')
  const gambleColor = getEntityThemeColor(theme, 'gamble')

  usePageView('arc', initialArc.id.toString(), true)

  // Set tab accent colors for arc entity
  useEffect(() => {
    setTabAccentColors('arc')
  }, [])

  const chapterCount = initialArc.endChapter - initialArc.startChapter + 1

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

      <Button
        component={Link}
        href="/arcs"
        variant="subtle"
        c={textColors.secondary}
        leftSection={<ArrowLeft size={18} />}
        mb={initialArc.parent ? 'sm' : 'lg'}
        style={{
          alignSelf: 'flex-start',
          color: textColors.secondary,
          '&:hover': {
            color: textColors.primary,
            backgroundColor: getAlphaColor(getEntityThemeColor(theme, 'arc'), 0.1)
          }
        }}
      >
        Back to Arcs
      </Button>

      {/* Parent Arc Link - shown if this is a sub-arc */}
      {initialArc.parent && (
        <Card
          withBorder
          radius="md"
          p="sm"
          mb="lg"
          style={{
            background: backgroundStyles.card,
            borderColor: getAlphaColor(arcColor, 0.4)
          }}
        >
          <Group gap="sm">
            <ArrowUp size={16} color={arcColor} />
            <Badge size="sm" variant="light" c={arcColor}>Part of</Badge>
            <Button
              component={Link}
              href={`/arcs/${initialArc.parent.id}`}
              variant="subtle"
              size="sm"
              c={arcColor}
              style={{ fontWeight: 600 }}
            >
              {initialArc.parent.name}
            </Button>
            {initialArc.parent.startChapter && initialArc.parent.endChapter && (
              <Badge size="sm" variant="outline" c={arcColor}>
                Ch. {initialArc.parent.startChapter}-{initialArc.parent.endChapter}
              </Badge>
            )}
          </Group>
        </Card>
      )}

      {/* Enhanced Arc Header */}
      <Card
        withBorder
        radius="lg"
        shadow="lg"
        p={0}
        style={{
          background: backgroundStyles.card,
          border: `2px solid ${arcColor}`,
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
                  border: `3px solid ${arcColor}`,
                  boxShadow: theme.shadows.xl,
                  transition: `all ${theme.other?.transitions?.durationStandard || 250}ms ${theme.other?.transitions?.easingStandard || 'ease-in-out'}`
                }}
              >
                <MediaThumbnail
                  entityType="arc"
                  entityId={initialArc.id}
                  entityName={initialArc.name}
                  allowCycling={false}
                  maxWidth="200px"
                  maxHeight="280px"
                />
              </Box>
            </Box>

            <Stack gap={theme.spacing.md} style={{ flex: 1, minWidth: 0, height: '100%' }} justify="space-between">
              <Stack gap={theme.spacing.sm}>
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
                  {initialArc.name}
                </Title>

                {/* Chapter Range Info */}
                <Badge
                  variant="filled"
                  size="lg"
                  radius="md"
                  style={{
                    background: `linear-gradient(135deg, ${arcColor} 0%, ${arcColor}dd 100%)`,
                    border: `1px solid ${arcColor}`,
                    boxShadow: theme.shadows.md,
                    fontSize: fontSize.sm,
                    color: textColors.primary,
                    fontWeight: 600
                  }}
                >
                  Chapters {initialArc.startChapter} - {initialArc.endChapter}
                </Badge>
              </Stack>

              <Stack gap={theme.spacing.md} style={{ flex: 1, justifyContent: 'center' }}>
                {/* Content Stats */}
                <Group gap={theme.spacing.md} wrap="wrap" mt={theme.spacing.sm}>
                  <Badge size="lg" variant="light" c={textColors.arc} style={{
                    fontSize: fontSize.xs,
                    fontWeight: 600,
                    background: getAlphaColor(arcColor, 0.2),
                    border: `1px solid ${getAlphaColor(arcColor, 0.4)}`
                  }}>
                    {chapterCount} Chapters
                  </Badge>
                  <Badge size="lg" variant="light" c={textColors.arc} style={{
                    fontSize: fontSize.xs,
                    fontWeight: 600,
                    background: getAlphaColor(arcColor, 0.2),
                    border: `1px solid ${getAlphaColor(arcColor, 0.4)}`
                  }}>
                    {initialEvents.length} Events
                  </Badge>
                  <Badge size="lg" variant="light" c={textColors.gamble} style={{
                    fontSize: fontSize.xs,
                    fontWeight: 600,
                    background: getAlphaColor(gambleColor, 0.2),
                    border: `1px solid ${getAlphaColor(gambleColor, 0.4)}`
                  }}>
                    {initialGambles.length} Gambles
                  </Badge>
                  {initialArc.order && (
                    <Badge size="lg" variant="light" c={textColors.arc} style={{
                      fontSize: fontSize.xs,
                      fontWeight: 600,
                      background: getAlphaColor(arcColor, 0.2),
                      border: `1px solid ${getAlphaColor(arcColor, 0.4)}`
                    }}>
                      Arc #{initialArc.order}
                    </Badge>
                  )}
                  {initialArc.children && initialArc.children.length > 0 && (
                    <Badge size="lg" variant="light" c={textColors.arc} style={{
                      fontSize: fontSize.xs,
                      fontWeight: 600,
                      background: getAlphaColor(arcColor, 0.2),
                      border: `1px solid ${getAlphaColor(arcColor, 0.4)}`
                    }}>
                      {initialArc.children.length} Sub-arcs
                    </Badge>
                  )}
                  {initialArc.parent && (
                    <Badge size="lg" variant="outline" c={textColors.arc} style={{
                      fontSize: fontSize.xs,
                      fontWeight: 600,
                      borderColor: getAlphaColor(arcColor, 0.4)
                    }}>
                      Sub-arc
                    </Badge>
                  )}
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
          border: `1px solid ${getAlphaColor(arcColor, 0.4)}`
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
            <Tooltip
              label="No timeline events available for this arc"
              disabled={initialEvents.length > 0}
              position="bottom"
              withArrow
            >
              <Tabs.Tab
                value="timeline"
                leftSection={<Calendar size={16} />}
                rightSection={initialEvents.length > 0 ? <Badge size="xs" variant="light" c={arcColor}>{initialEvents.length}</Badge> : null}
                disabled={initialEvents.length === 0}
              >
                Timeline
              </Tabs.Tab>
            </Tooltip>
            <Tabs.Tab value="media" leftSection={<ImageIcon size={16} />}>Media</Tabs.Tab>
            <Tabs.Tab value="annotations" leftSection={<MessageSquare size={16} />}>Annotations</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="overview" pt={theme.spacing.md}>
            <Stack gap={theme.spacing.lg}>
              {/* Arc Description Section */}
              <Card withBorder radius="lg" shadow="lg" style={{
                background: backgroundStyles.card,
                border: `1px solid ${getAlphaColor(arcColor, 0.4)}`
              }}>
                <Stack gap={theme.spacing.md} p={theme.spacing.lg}>
                  <Group gap={theme.spacing.sm} align="center">
                    <BookOpen size={24} color={arcColor} />
                    <Title order={3} c={headerColors.h3}>About {initialArc.name}</Title>
                  </Group>
                  <TimelineSpoilerWrapper chapterNumber={initialArc.startChapter}>
                    <Box style={{ lineHeight: 1.6 }}>
                      <EnhancedSpoilerMarkdown
                        content={initialArc.description}
                        className="arc-description"
                        enableEntityEmbeds
                        compactEntityCards={false}
                      />
                    </Box>
                  </TimelineSpoilerWrapper>
                </Stack>
              </Card>

              {/* Chapter Navigation */}
              <Card withBorder radius="lg" shadow="lg" style={{
                background: backgroundStyles.card,
                border: `1px solid ${getAlphaColor(arcColor, 0.4)}`,
                transition: `all ${theme.other?.transitions?.durationShort || 200}ms ease-in-out`
              }}>
                <Stack gap={theme.spacing.md} p={theme.spacing.md}>
                  <Group justify="space-between" align="center">
                    <Group gap={theme.spacing.sm}>
                      <BookOpen size={20} color={arcColor} />
                      <Title order={4} c={textColors.arc}>Chapter Navigation</Title>
                    </Group>
                  </Group>
                  <Group gap={theme.spacing.md} wrap="wrap">
                    <Button
                      component={Link}
                      href={`/chapters/${initialArc.startChapter}`}
                      variant="outline"
                      c={arcColor}
                      size="md"
                      radius="xl"
                      style={{
                        fontWeight: 600,
                        border: `2px solid ${arcColor}`,
                        transition: `all ${theme.other?.transitions?.durationShort || 200}ms ease`,
                        flex: 1,
                        minWidth: '200px'
                      }}
                    >
                      Start: Chapter {initialArc.startChapter}
                    </Button>
                    <Button
                      component={Link}
                      href={`/chapters/${initialArc.endChapter}`}
                      variant="filled"
                      style={{
                        background: `linear-gradient(135deg, ${arcColor} 0%, ${arcColor}dd 100%)`,
                        border: `1px solid ${arcColor}`,
                        fontWeight: 600,
                        flex: 1,
                        minWidth: '200px'
                      }}
                    >
                      End: Chapter {initialArc.endChapter}
                    </Button>
                  </Group>
                </Stack>
              </Card>

              {/* Sub-arcs Section */}
              {initialArc.children && initialArc.children.length > 0 && (
                <Card withBorder radius="lg" shadow="lg" style={{
                  background: backgroundStyles.card,
                  border: `1px solid ${getAlphaColor(arcColor, 0.4)}`
                }}>
                  <Stack gap={theme.spacing.md} p={theme.spacing.lg}>
                    <Group gap={theme.spacing.sm} align="center">
                      <Layers size={24} color={arcColor} />
                      <Title order={3} c={headerColors.h3}>Sub-arcs</Title>
                      <Badge size="md" variant="light" c={arcColor}>
                        {initialArc.children.length}
                      </Badge>
                    </Group>
                    <Box
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                        gap: theme.spacing.md
                      }}
                    >
                      {initialArc.children.map((child) => (
                        <Card
                          key={child.id}
                          component={Link}
                          href={`/arcs/${child.id}`}
                          withBorder
                          radius="md"
                          padding="md"
                          style={{
                            textDecoration: 'none',
                            borderColor: getAlphaColor(arcColor, 0.3),
                            background: backgroundStyles.card,
                            transition: 'all 0.2s ease',
                            cursor: 'pointer'
                          }}
                          className="hoverable-card"
                        >
                          <Stack gap="xs">
                            <Group justify="space-between" align="flex-start">
                              <Title order={5} c={arcColor} lineClamp={2} style={{ flex: 1 }}>
                                {child.name}
                              </Title>
                            </Group>
                            <Group gap="xs">
                              {child.startChapter && child.endChapter && (
                                <Badge size="sm" variant="light" c={arcColor}>
                                  Ch. {child.startChapter}-{child.endChapter}
                                </Badge>
                              )}
                              {child.startChapter && child.endChapter && (
                                <Badge size="xs" variant="outline" c={textColors.secondary}>
                                  {child.endChapter - child.startChapter + 1} chapters
                                </Badge>
                              )}
                            </Group>
                            {child.description && (
                              <Box style={{ color: textColors.secondary, fontSize: fontSize.sm, lineClamp: 2 }}>
                                {child.description.slice(0, 120)}{child.description.length > 120 ? '...' : ''}
                              </Box>
                            )}
                          </Stack>
                        </Card>
                      ))}
                    </Box>
                  </Stack>
                </Card>
              )}
            </Stack>
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
                      href={`/media?ownerType=arc&ownerId=${initialArc.id}`}
                      variant="outline"
                      c={getEntityThemeColor(theme, 'media')}
                      size="sm"
                      radius="xl"
                    >
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
                  />
                </Stack>
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

    {/* Quick Actions for authenticated users */}
    <EntityQuickActions
      entityType="arc"
      entityId={initialArc.id}
      isAuthenticated={!!user}
    />
    </Container>
    </Box>
  )
}
