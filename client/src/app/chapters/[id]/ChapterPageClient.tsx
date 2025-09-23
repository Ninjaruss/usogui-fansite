'use client'

import React from 'react'
import {
  Alert,
  Badge,
  Button,
  Card,
  Container,
  Divider,
  Grid,
  Stack,
  Text,
  Title,
  useMantineTheme
} from '@mantine/core'
import { ArrowLeft, BookOpen } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'motion/react'
import TimelineSpoilerWrapper from '../../../components/TimelineSpoilerWrapper'
import { usePageView } from '../../../hooks/usePageView'
import { getEntityThemeColor, semanticColors } from '../../../lib/mantine-theme'

interface Volume {
  id: number
  number: number
  title?: string
}

interface Character {
  id: number
  name: string
}

interface Event {
  id: number
  title: string
  description: string
}

interface Quote {
  id: number
  text: string
  pageNumber?: number
  character?: Character
}

interface Chapter {
  id: number
  number: number
  chapterNumber?: number
  title?: string | null
  summary?: string | null
  description?: string
  volumeId?: number
  volume?: Volume
  createdAt?: string
  updatedAt?: string
}

interface ChapterPageClientProps {
  initialChapter: Chapter
  initialEvents?: Event[]
  initialQuotes?: Quote[]
  initialCharacters?: Character[]
}

export default function ChapterPageClient({
  initialChapter,
  initialEvents = [],
  initialQuotes = [],
  initialCharacters = []
}: ChapterPageClientProps) {
  const theme = useMantineTheme()

  usePageView('chapter', initialChapter.id.toString(), true)

  return (
    <Container size="lg" py="xl">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Button
          component={Link}
          href="/chapters"
          variant="subtle"
          style={{ color: semanticColors.neutral }}
          leftSection={<ArrowLeft size={18} />}
          mb="lg"
        >
          Back to Chapters
        </Button>

        <Stack align="center" gap="sm" mb="xl">
          <BookOpen size={48} color={getEntityThemeColor(theme, 'guide')} />
          <Title order={1}>Chapter {initialChapter.number}</Title>
          {initialChapter.title && (
            <Text size="lg" c="dimmed">
              {initialChapter.title}
            </Text>
          )}
          {initialChapter.volume && (
            <Badge
              component={Link}
              href={`/volumes/${initialChapter.volume.id}`}
              variant="outline"
              radius="lg"
              c={getEntityThemeColor(theme, 'media')}
              style={{ textDecoration: 'none', borderColor: getEntityThemeColor(theme, 'media') }}
            >
              Volume {initialChapter.volume.number}
              {initialChapter.volume.title ? `: ${initialChapter.volume.title}` : ''}
            </Badge>
          )}
        </Stack>

        <Grid gutter="xl">
          <Grid.Col span={{ base: 12, md: 8 }}>
            {(initialChapter.description || initialChapter.summary) && (
              <Card withBorder radius="md" className="gambling-card" shadow="sm" mb="lg">
                <Stack gap="md" p="lg">
                  <Title order={3}>Chapter Summary</Title>
                  <TimelineSpoilerWrapper chapterNumber={initialChapter.number}>
                    <Text size="sm" lh={1.6}>
                      {initialChapter.description || initialChapter.summary}
                    </Text>
                  </TimelineSpoilerWrapper>
                </Stack>
              </Card>
            )}

            {initialEvents && initialEvents.length > 0 && (
              <Card withBorder radius="md" className="gambling-card" shadow="sm" mb="lg">
                <Stack gap="md" p="lg">
                  <Title order={3}>Chapter Events</Title>
                  <Stack gap="sm">
                    {initialEvents.map((event) => (
                      <Card key={event.id} withBorder radius="md" shadow="xs" padding="md">
                        <Stack gap={4}>
                          <Text
                            component={Link}
                            href={`/events/${event.id}`}
                            fw={600}
                            c={getEntityThemeColor(theme, 'character')}
                            style={{ textDecoration: 'none' }}
                          >
                            {event.title}
                          </Text>
                          <Text size="sm" c="dimmed" lh={1.6}>
                            {event.description}
                          </Text>
                        </Stack>
                      </Card>
                    ))}
                  </Stack>
                </Stack>
              </Card>
            )}

            {initialQuotes && initialQuotes.length > 0 && (
              <Card withBorder radius="md" className="gambling-card" shadow="sm">
                <Stack gap="md" p="lg">
                  <Title order={3}>Memorable Quotes</Title>
                  <Stack gap="sm">
                    {initialQuotes.map((quote) => (
                      <Card key={quote.id} withBorder radius="md" shadow="xs" padding="md">
                        <Stack gap={4}>
                          <Text size="sm" style={{ fontStyle: 'italic' }}>
                            “{quote.text}”
                          </Text>
                          <Text size="xs" c="dimmed">
                            {quote.character ? `— ${quote.character.name}` : ''}
                            {quote.pageNumber ? `, p.${quote.pageNumber}` : ''}
                          </Text>
                        </Stack>
                      </Card>
                    ))}
                  </Stack>
                </Stack>
              </Card>
            )}
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 4 }}>
            <Card withBorder radius="md" className="gambling-card" shadow="sm">
              <Stack gap="md" p="lg">
                <Title order={4}>Chapter Info</Title>

                <Stack gap={4}>
                  <Text size="xs" c="dimmed">
                    Chapter Number
                  </Text>
                  <Text fw={600}>{initialChapter.number}</Text>
                </Stack>

                {initialChapter.volume && (
                  <Stack gap={4}>
                    <Text size="xs" c="dimmed">
                      Volume
                    </Text>
                    <Text
                      component={Link}
                      href={`/volumes/${initialChapter.volume.id}`}
                      fw={600}
                      c={getEntityThemeColor(theme, 'gamble')}
                      style={{ textDecoration: 'none' }}
                    >
                      Volume {initialChapter.volume.number}
                      {initialChapter.volume.title ? ` — ${initialChapter.volume.title}` : ''}
                    </Text>
                  </Stack>
                )}

                <Divider color="rgba(255, 255, 255, 0.12)" />

                {initialCharacters && initialCharacters.length > 0 ? (
                  <Stack gap="sm">
                    <Title order={5}>Featured Characters</Title>
                    <Stack gap={4}>
                      {initialCharacters.map((character) => (
                        <Text
                          key={character.id}
                          component={Link}
                          href={`/characters/${character.id}`}
                          style={{ textDecoration: 'none', color: getEntityThemeColor(theme, 'event') }}
                        >
                          {character.name}
                        </Text>
                      ))}
                    </Stack>
                  </Stack>
                ) : (
                  <Alert radius="md" style={{ color: semanticColors.neutral }} title="No character data" variant="light">
                    Character information isn’t available for this chapter yet.
                  </Alert>
                )}
              </Stack>
            </Card>
          </Grid.Col>
        </Grid>
      </motion.div>
    </Container>
  )
}
