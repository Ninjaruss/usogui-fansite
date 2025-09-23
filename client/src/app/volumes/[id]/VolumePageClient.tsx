'use client'

import React from 'react'
import {
  Anchor,
  Badge,
  Box,
  Button,
  Card,
  Container,
  Grid,
  Group,
  Stack,
  Text,
  Title,
  rem,
  useMantineTheme
} from '@mantine/core'
import { getEntityThemeColor, semanticColors } from '../../../lib/mantine-theme'
import { ArrowLeft, Book, Hash, Clock, FileText } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'motion/react'
import TimelineSpoilerWrapper from '../../../components/TimelineSpoilerWrapper'
import { usePageView } from '../../../hooks/usePageView'
import MediaThumbnail from '../../../components/MediaThumbnail'

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

interface VolumePageClientProps {
  initialVolume: Volume
  initialChapters: Chapter[]
}

export default function VolumePageClient({ initialVolume, initialChapters }: VolumePageClientProps) {
  const theme = useMantineTheme()

  // Track page view
  usePageView('volume', initialVolume.id.toString(), true)

  return (
    <Container size="lg" py="xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box mb="lg" ta={{ base: 'center', sm: 'left' }}>
          <Button
            component={Link}
            href="/volumes"
            variant="subtle"
            c={semanticColors.neutral}
            leftSection={<ArrowLeft size={18} />}
          >
            Back to Volumes
          </Button>
        </Box>

        {/* Enhanced Volume Header */}
        <Card
          withBorder
          radius="lg"
          shadow="lg"
          p={0}
          mb="xl"
          style={{
            border: `1px solid ${getEntityThemeColor(theme, 'guide')}`,
            overflow: 'hidden'
          }}
        >
          <Grid gutter="md" align="center" justify="center">
            <Grid.Col span={{ base: 12, md: 4, lg: 3 }}>
              <Stack align="center" p="xl">
                <MediaThumbnail
                  entityType="volume"
                  entityId={initialVolume.id}
                  entityName={`Volume ${initialVolume.number}`}
                  maxWidth="250px"
                  maxHeight="350px"
                  allowCycling
                />
              </Stack>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 8, lg: 9 }}>
              <Stack align="center" gap="md" p="lg">
                <Stack align="center" gap={4}>
                  <Title
                    order={1}
                    size={rem(36)}
                    ta={{ base: 'center', md: 'left' }}
                    style={{
                      background: `linear-gradient(45deg, ${getEntityThemeColor(theme, 'guide')}, ${getEntityThemeColor(theme, 'guide')})`,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}
                  >
                    Volume {initialVolume.number}
                  </Title>

                  {initialVolume.title && (
                    <Text size="lg" c="dimmed" fw={500} ta={{ base: 'center', md: 'left' }}>
                      {initialVolume.title}
                    </Text>
                  )}
                </Stack>

                <Group gap="sm" justify="center">
                  <Badge
                    size="lg"
                    radius="sm"
                    variant="light"
                    c={getEntityThemeColor(theme, 'gamble')}
                    leftSection={<Hash size={16} />}
                    style={{ backgroundColor: `${getEntityThemeColor(theme, 'gamble')}20`, borderColor: getEntityThemeColor(theme, 'gamble') }}
                  >
                    Chapters {initialVolume.startChapter}-{initialVolume.endChapter}
                  </Badge>

                  <Badge
                    size="lg"
                    radius="sm"
                    variant="light"
                    c={getEntityThemeColor(theme, 'character')}
                    leftSection={<Book size={16} />}
                    style={{ backgroundColor: `${getEntityThemeColor(theme, 'character')}20`, borderColor: getEntityThemeColor(theme, 'character') }}
                  >
                    {initialVolume.endChapter - initialVolume.startChapter + 1} Chapters
                  </Badge>
                </Group>
              </Stack>
            </Grid.Col>
          </Grid>
        </Card>

        <Grid gutter="xl" justify="center">
          <Grid.Col span={{ base: 12, lg: 8 }}>
            {/* Volume Summary */}
            {initialVolume.description && (
              <Card withBorder radius="lg" className="gambling-card" shadow="md" mb="xl">
                <Stack gap="lg" align="center">
                  <Group gap="sm" justify="center">
                    <FileText size={24} color={getEntityThemeColor(theme, 'guide')} />
                    <Title order={3} c={getEntityThemeColor(theme, 'guide')} ta="center">Volume Summary</Title>
                  </Group>
                  <TimelineSpoilerWrapper chapterNumber={initialVolume.startChapter}>
                    <Text size="md" style={{ lineHeight: 1.7 }} ta="center">
                      {initialVolume.description}
                    </Text>
                  </TimelineSpoilerWrapper>
                </Stack>
              </Card>
            )}

            {/* Chapters List */}
            {initialChapters.length > 0 && (
              <Card withBorder radius="lg" className="gambling-card" shadow="md">
                <Stack gap="lg" align="center">
                  <Group gap="md" justify="center" wrap="wrap">
                    <Group gap="sm">
                      <Book size={24} color={getEntityThemeColor(theme, 'guide')} />
                      <Title order={3} c={getEntityThemeColor(theme, 'guide')} ta="center">Chapters in this Volume</Title>
                    </Group>
                    <Badge
                      variant="light"
                      c={getEntityThemeColor(theme, 'organization')}
                      size="lg"
                      style={{ backgroundColor: `${getEntityThemeColor(theme, 'organization')}20`, borderColor: getEntityThemeColor(theme, 'organization') }}
                    >
                      {initialChapters.length} chapters
                    </Badge>
                  </Group>

                  <Grid gutter="md" justify="center">
                    {initialChapters.map((chapter) => (
                      <Grid.Col span={{ base: 12, sm: 6, lg: 4 }} key={chapter.number}>
                        <Card
                          component={Link}
                          href={`/chapters/${chapter.number}`}
                          withBorder
                          radius="md"
                          p="md"
                          style={{
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            height: '100%'
                          }}
                          classNames={{
                            root: 'hover:scale-[1.02] hover:shadow-lg hover:border-red-500'
                          }}
                        >
                          <Stack gap="xs" align="center" h="100%" justify="center">
                            <Group gap="xs" justify="center">
                              <Hash size={16} color={semanticColors.neutral} />
                              <Text size="lg" fw={600} c="red.5" ta="center">
                                Chapter {chapter.number}
                              </Text>
                            </Group>
                            {chapter.title && (
                              <Text size="sm" c="dimmed" lineClamp={2} ta="center">
                                {chapter.title}
                              </Text>
                            )}
                          </Stack>
                        </Card>
                      </Grid.Col>
                    ))}
                  </Grid>
                </Stack>
              </Card>
            )}
          </Grid.Col>

          <Grid.Col span={{ base: 12, lg: 4 }}>
            {/* Volume Statistics */}
            <Card withBorder radius="lg" className="gambling-card" shadow="md" mb="xl">
              <Stack gap="lg" align="center">
                <Group gap="sm" justify="center">
                  <Clock size={24} color={getEntityThemeColor(theme, 'arc')} />
                  <Title order={4} c="blue.5" ta="center">Volume Statistics</Title>
                </Group>

                <Stack gap="md">
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">Volume Number</Text>
                    <Badge
                      variant="light"
                      c={getEntityThemeColor(theme, 'character')}
                      size="lg"
                      style={{ backgroundColor: `${getEntityThemeColor(theme, 'character')}20`, borderColor: getEntityThemeColor(theme, 'character') }}
                    >
                      #{initialVolume.number}
                    </Badge>
                  </Group>

                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">First Chapter</Text>
                    <Anchor
                      component={Link}
                      href={`/chapters/${initialVolume.startChapter}`}
                      size="sm"
                      c="red.5"
                    >
                      Chapter {initialVolume.startChapter}
                    </Anchor>
                  </Group>

                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">Last Chapter</Text>
                    <Anchor
                      component={Link}
                      href={`/chapters/${initialVolume.endChapter}`}
                      size="sm"
                      c="red.5"
                    >
                      Chapter {initialVolume.endChapter}
                    </Anchor>
                  </Group>

                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">Total Chapters</Text>
                    <Text fw={600} c="green.5">
                      {initialVolume.endChapter - initialVolume.startChapter + 1}
                    </Text>
                  </Group>
                </Stack>
              </Stack>
            </Card>
            
          </Grid.Col>
        </Grid>
      </motion.div>
    </Container>
  )
}
