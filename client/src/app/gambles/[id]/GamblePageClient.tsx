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
  Stack,
  Tabs,
  Text,
  Title,
  useMantineTheme
} from '@mantine/core'
import { ArrowLeft, Crown, Users, Trophy, Calendar, BookOpen, Eye } from 'lucide-react'
import Link from 'next/link'
import EnhancedSpoilerMarkdown from '../../../components/EnhancedSpoilerMarkdown'
import { motion } from 'motion/react'
import { usePageView } from '../../../hooks/usePageView'
import TimelineSpoilerWrapper from '../../../components/TimelineSpoilerWrapper'
import GambleTimeline from '../../../components/GambleTimeline'
import MediaGallery from '../../../components/MediaGallery'
import MediaThumbnail from '../../../components/MediaThumbnail'
import { GambleStructuredData } from '../../../components/StructuredData'
import { api } from '../../../lib/api'
import { getEntityThemeColor, semanticColors, setTabAccentColors } from '../../../lib/mantine-theme'

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

export default function GamblePageClient({ initialGamble }: GamblePageClientProps) {
  const theme = useMantineTheme()
  const gambleColor = getEntityThemeColor(theme, 'gamble')
  const characterColor = getEntityThemeColor(theme, 'character')
  const [timelineEvents, setTimelineEvents] = useState<any[]>([])
  const [arcs, setArcs] = useState<any[]>([])
  const [timelineLoading, setTimelineLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<string>('overview')

  usePageView('gamble', initialGamble.id.toString(), true)

  // Set tab accent colors for gamble entity
  useEffect(() => {
    setTabAccentColors('gamble')
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
        const filteredEvents = eventsResponse.data.filter((event: any) => {
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
    <Container size="lg" py="xl">
      <GambleStructuredData
        gamble={{
          id: initialGamble.id,
          name: initialGamble.name,
          description: initialGamble.description
        }}
      />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Button
          component={Link}
          href="/gambles"
          variant="subtle"
          c={semanticColors.neutral}
          leftSection={<ArrowLeft size={18} />}
          mb="lg"
        >
          Back to Gambles
        </Button>

        <Card withBorder radius="md" className="gambling-card" shadow="md" mb="xl">
          <Grid gutter="xl" align="center">
            <Grid.Col span={{ base: 12, md: 4, lg: 3 }}>
              <Box ta="center">
                <MediaThumbnail
                  entityType="gamble"
                  entityId={initialGamble.id}
                  entityName={initialGamble.name}
                  allowCycling
                  maxWidth="260px"
                  maxHeight="320px"
                />
              </Box>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 8, lg: 9 }}>
              <Stack gap="md">
                <Group gap="sm" align="center">
                  <Crown size={32} color={gambleColor} />
                  <Title order={1}>{initialGamble.name}</Title>
                </Group>

                <Group gap="sm" wrap="wrap">
                  <Badge
                    c="white"
                    radius="lg"
                    variant="filled"
                    style={{ backgroundColor: gambleColor }}
                  >
                    {chapterInfo}
                  </Badge>
                  {initialGamble.participants && initialGamble.participants.length > 0 && (
                    <Badge
                      c="white"
                      radius="lg"
                      variant="filled"
                      leftSection={<Users size={14} />}
                      style={{ backgroundColor: characterColor }}
                    >
                      {initialGamble.participants.length} Participant{initialGamble.participants.length !== 1 ? 's' : ''}
                    </Badge>
                  )}
                  {initialGamble.winCondition && (
                    <Badge
                      c={getEntityThemeColor(theme, 'quote')}
                      radius="lg"
                      variant="light"
                      leftSection={<Trophy size={14} />}
                      style={{
                        backgroundColor: `${getEntityThemeColor(theme, 'quote')}20`,
                        borderColor: getEntityThemeColor(theme, 'quote')
                      }}
                    >
                      Win Condition Included
                    </Badge>
                  )}
                </Group>
              </Stack>
            </Grid.Col>
          </Grid>
        </Card>

        <Card withBorder radius="md" className="gambling-card" shadow="md">
          <Tabs value={activeTab} onChange={(value) => value && setActiveTab(value)} keepMounted={false}>
            <Tabs.List>
              <Tabs.Tab value="overview" leftSection={<BookOpen size={16} />}>Overview</Tabs.Tab>
              <Tabs.Tab value="timeline" leftSection={<Calendar size={16} />} disabled={timelineEvents.length === 0 && timelineLoading}>
                Timeline
              </Tabs.Tab>
              <Tabs.Tab value="media" leftSection={<Eye size={16} />}>Media</Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="overview" pt="md">
              <Grid gutter="xl">
                <Grid.Col span={{ base: 12, lg: 8 }}>
                  <Card withBorder radius="md" shadow="sm" mb="lg">
                    <Stack gap="md" p="lg">
                      <Group gap="sm">
                        <Crown size={20} color={gambleColor} />
                        <Title order={3}>Gamble Overview</Title>
                      </Group>

                      {initialGamble.description ? (
                        <TimelineSpoilerWrapper chapterNumber={initialGamble.chapter?.number ?? initialGamble.chapterId}>
                          <EnhancedSpoilerMarkdown
                            content={initialGamble.description}
                            className="gamble-description"
                            enableEntityEmbeds
                            compactEntityCards={false}
                          />
                        </TimelineSpoilerWrapper>
                      ) : (
                        <Text size="sm" c="dimmed">
                          No description supplied for this gamble yet.
                        </Text>
                      )}

                      <Stack gap="sm">
                        <Title order={4}>Rules</Title>
                        <EnhancedSpoilerMarkdown
                          content={initialGamble.rules}
                          className="gamble-rules"
                          enableEntityEmbeds
                          compactEntityCards={false}
                        />
                      </Stack>

                      {initialGamble.winCondition && (
                        <Stack gap="sm">
                          <Title order={4}>Win Condition</Title>
                          <EnhancedSpoilerMarkdown
                            content={initialGamble.winCondition}
                            className="gamble-win-condition"
                            enableEntityEmbeds
                            compactEntityCards={false}
                          />
                        </Stack>
                      )}
                    </Stack>
                  </Card>
                </Grid.Col>

                <Grid.Col span={{ base: 12, lg: 4 }}>
                  <Card withBorder radius="md" shadow="sm" style={{ position: 'sticky', top: 24 }}>
                    <Stack gap="md" p="lg">
                      <Title order={4}>Participants</Title>
                      {initialGamble.participants && initialGamble.participants.length > 0 ? (
                        <Stack gap="sm">
                          {initialGamble.participants.map((participant) => (
                            <Card key={participant.id} withBorder radius="md" shadow="xs" padding="md">
                              <Stack gap={4}>
                                <Text fw={600}>{participant.name}</Text>
                                {participant.alternateNames && participant.alternateNames.length > 0 && (
                                  <Group gap="xs" wrap="wrap">
                                    {participant.alternateNames.slice(0, 2).map((name) => (
                                      <Badge
                                        key={name}
                                        variant="outline"
                                        c={characterColor}
                                        style={{ borderColor: characterColor }}
                                        radius="sm"
                                      >
                                        {name}
                                      </Badge>
                                    ))}
                                  </Group>
                                )}
                                {participant.description && (
                                  <Text size="xs" c="dimmed">
                                    {participant.description}
                                  </Text>
                                )}
                              </Stack>
                            </Card>
                          ))}
                        </Stack>
                      ) : (
                        <Text size="sm" c="dimmed">
                          Participant details are not available for this gamble.
                        </Text>
                      )}
                    </Stack>
                  </Card>
                </Grid.Col>
              </Grid>
            </Tabs.Panel>

            <Tabs.Panel value="timeline" pt="md">
              {timelineLoading ? (
                <Box style={{ display: 'flex', justifyContent: 'center', paddingBlock: '2rem' }}>
                  <Loader c={getEntityThemeColor(theme, 'gamble')} />
                </Box>
              ) : (
                <GambleTimeline
                  events={timelineEvents as any}
                  arcs={arcs as any}
                  gambleName={initialGamble.name}
                  gambleChapter={initialGamble.chapter?.number ?? initialGamble.chapterId}
                />
              )}
            </Tabs.Panel>

            <Tabs.Panel value="media" pt="md">
              <Stack gap="md">
                {/* Gallery Media Section */}
                <Card withBorder radius="md" shadow="sm">
                  <Stack gap="md" p="lg">
                    <Group justify="space-between" align="center">
                      <Group gap="sm">
                        <Eye size={20} color={getEntityThemeColor(theme, 'media')} />
                        <Title order={4}>Community Media</Title>
                      </Group>
                      <Button
                        component={Link}
                        href={`/media?ownerType=gamble&ownerId=${initialGamble.id}`}
                        variant="outline"
                        color={getEntityThemeColor(theme, 'media')}
                        size="sm"
                        radius="xl"
                      >
                        View All
                      </Button>
                    </Group>
                    <Text size="sm" c="dimmed">
                      Explore media related to {initialGamble.name}
                    </Text>
                    <MediaGallery
                      ownerType="gamble"
                      ownerId={initialGamble.id}
                      purpose="gallery"
                      limit={8}
                      showTitle={false}
                      compactMode={true}
                      showFilters={false}
                    />
                  </Stack>
                </Card>

                {/* Official Media Section */}
                <Card withBorder radius="md" shadow="sm">
                  <Stack gap="md" p="lg">
                    <Group gap="sm">
                      <Crown size={20} color={getEntityThemeColor(theme, 'media')} />
                      <Title order={4}>Official Media</Title>
                    </Group>
                    <MediaGallery
                      ownerType="gamble"
                      ownerId={initialGamble.id}
                      purpose="entity_display"
                      limit={6}
                      showTitle={false}
                      compactMode={true}
                      showFilters={false}
                    />
                  </Stack>
                </Card>
              </Stack>
            </Tabs.Panel>
          </Tabs>
        </Card>
      </motion.div>
    </Container>
  )
}
