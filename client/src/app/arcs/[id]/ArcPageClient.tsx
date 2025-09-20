'use client'

import React, { useState } from 'react'
import {
  Badge,
  Box,
  Button,
  Card,
  Container,
  Grid,
  Group,
  Stack,
  Tabs,
  Text,
  Title,
  useMantineTheme
} from '@mantine/core'
import { ArrowLeft, BookOpen, Calendar, Eye } from 'lucide-react'
import Link from 'next/link'
import EnhancedSpoilerMarkdown from '../../../components/EnhancedSpoilerMarkdown'
import { motion } from 'motion/react'
import { usePageView } from '../../../hooks/usePageView'
import MediaGallery from '../../../components/MediaGallery'
import ArcTimeline from '../../../components/ArcTimeline'
import TimelineSpoilerWrapper from '../../../components/TimelineSpoilerWrapper'
import MediaThumbnail from '../../../components/MediaThumbnail'
import { ArcStructuredData } from '../../../components/StructuredData'

interface Arc {
  id: number
  name: string
  description: string
  startChapter: number
  endChapter: number
  order?: number
  imageFileName?: string
  imageDisplayName?: string
  createdAt: string
  updatedAt: string
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

interface ArcPageClientProps {
  initialArc: Arc
  initialEvents: Event[]
  initialGambles: any[]
}

export default function ArcPageClient({ initialArc, initialEvents, initialGambles }: ArcPageClientProps) {
  const theme = useMantineTheme()
  const [activeTab, setActiveTab] = useState<string>('overview')

  usePageView('arc', initialArc.id.toString(), true)

  const chapterCount = initialArc.endChapter - initialArc.startChapter + 1

  return (
    <Container size="lg" py="xl">
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
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Button
          component={Link}
          href="/arcs"
          variant="subtle"
          color="gray"
          leftSection={<ArrowLeft size={18} />}
          mb="lg"
        >
          Back to Arcs
        </Button>

        <Card withBorder radius="md" className="gambling-card" shadow="md" mb="xl">
          <Grid gutter="xl" align="center">
            <Grid.Col span={{ base: 12, md: 4, lg: 3 }}>
              <Box ta="center">
                <MediaThumbnail
                  entityType="arc"
                  entityId={initialArc.id}
                  entityName={initialArc.name}
                  allowCycling
                  maxWidth="260px"
                  maxHeight="320px"
                />
              </Box>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 8, lg: 9 }}>
              <Stack gap="md">
                <Title order={1}>{initialArc.name}</Title>

                <Grid gutter="md">
                  <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                    <Card withBorder radius="md" shadow="xs" padding="md">
                      <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                        Chapter Range
                      </Text>
                      <Text fw={600} size="lg" c="pink.4">
                        {initialArc.startChapter}-{initialArc.endChapter}
                      </Text>
                    </Card>
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                    <Card withBorder radius="md" shadow="xs" padding="md">
                      <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                        Total Chapters
                      </Text>
                      <Text fw={600} size="lg">
                        {chapterCount} chapters
                      </Text>
                    </Card>
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                    <Card withBorder radius="md" shadow="xs" padding="md">
                      <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                        Key Events
                      </Text>
                      <Text fw={600} size="lg">
                        {initialEvents.length} events
                      </Text>
                    </Card>
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                    <Card withBorder radius="md" shadow="xs" padding="md">
                      <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                        Gambles
                      </Text>
                      <Text fw={600} size="lg" c="red.4">
                        {initialGambles.length} gambles
                      </Text>
                    </Card>
                  </Grid.Col>
                </Grid>

                <Group gap="sm" wrap="wrap">
                  <Badge color="red" radius="lg" variant="filled">
                    {initialEvents.length} Event{initialEvents.length !== 1 ? 's' : ''}
                  </Badge>
                  <Badge color="violet" radius="lg" variant="filled">
                    {initialGambles.length} Gamble{initialGambles.length !== 1 ? 's' : ''}
                  </Badge>
                  <Badge color="pink" radius="lg" variant="light">
                    Arc {initialArc.order ?? 'N/A'}
                  </Badge>
                </Group>
              </Stack>
            </Grid.Col>
          </Grid>
        </Card>

        <Card withBorder radius="md" className="gambling-card" shadow="md">
          <Tabs value={activeTab} onChange={(value) => value && setActiveTab(value)} keepMounted={false}>
            <Tabs.List>
              <Tabs.Tab value="overview" leftSection={<BookOpen size={16} />}>Overview</Tabs.Tab>
              <Tabs.Tab value="timeline" leftSection={<Calendar size={16} />} disabled={initialEvents.length === 0}>
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
                        <BookOpen size={20} color={theme.colors.red?.[5]} />
                        <Title order={3}>About</Title>
                      </Group>
                      <TimelineSpoilerWrapper chapterNumber={initialArc.startChapter}>
                        <EnhancedSpoilerMarkdown
                          content={initialArc.description}
                          className="arc-description"
                          enableEntityEmbeds
                          compactEntityCards={false}
                        />
                      </TimelineSpoilerWrapper>
                    </Stack>
                  </Card>
                </Grid.Col>

                <Grid.Col span={{ base: 12, lg: 4 }}>
                  <Card withBorder radius="md" shadow="sm" style={{ position: 'sticky', top: 24 }}>
                    <Stack gap="md" p="lg">
                      <Title order={4}>Chapter Range</Title>
                      <Button component={Link} href={`/chapters/${initialArc.startChapter}`} variant="outline" color="red" fullWidth>
                        Start: Chapter {initialArc.startChapter}
                      </Button>
                      <Button component={Link} href={`/chapters/${initialArc.endChapter}`} color="red" fullWidth>
                        End: Chapter {initialArc.endChapter}
                      </Button>
                    </Stack>
                  </Card>
                </Grid.Col>
              </Grid>
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

            <Tabs.Panel value="media" pt="md">
              <Card withBorder radius="md" shadow="sm">
                <Stack gap="sm" p="lg">
                  <Title order={3}>Media Gallery</Title>
                  <Text size="sm" c="dimmed">
                    Explore fan art, videos, and other media related to {initialArc.name}
                  </Text>
                  <MediaGallery arcId={initialArc.id} limit={20} showTitle={false} compactMode={false} />
                </Stack>
              </Card>
            </Tabs.Panel>
          </Tabs>
        </Card>
      </motion.div>
    </Container>
  )
}
