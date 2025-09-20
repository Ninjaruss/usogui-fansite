'use client'

import React from 'react'
import {
  Badge,
  Button,
  Card,
  Container,
  Grid,
  Group,
  Stack,
  Text,
  Title,
  useMantineTheme
} from '@mantine/core'
import { ArrowLeft, CalendarSearch, Calendar, BookOpen, Dice6, Tag } from 'lucide-react'
import Link from 'next/link'
import EnhancedSpoilerMarkdown from '../../../components/EnhancedSpoilerMarkdown'
import { motion } from 'motion/react'
import { usePageView } from '../../../hooks/usePageView'
import TimelineSpoilerWrapper from '../../../components/TimelineSpoilerWrapper'
import type { Event } from '../../../types'

interface EventPageClientProps {
  initialEvent: Event
}

export default function EventPageClient({ initialEvent }: EventPageClientProps) {
  const theme = useMantineTheme()

  usePageView('event', initialEvent.id.toString(), true)

  return (
    <Container size="lg" py="xl">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Button
          component={Link}
          href="/events"
          variant="subtle"
          color="gray"
          leftSection={<ArrowLeft size={18} />}
          mb="lg"
        >
          Back to Events
        </Button>

        <Stack align="center" gap="sm" mb="xl">
          <CalendarSearch size={48} color={theme.other?.usogui?.event ?? theme.colors.orange?.[6]} />
          <Title order={1}>{initialEvent.title}</Title>
          <Group gap="sm" wrap="wrap" justify="center">
            <Badge radius="sm" variant="outline" leftSection={<Calendar size={14} />}>
              Chapter {initialEvent.chapterNumber}
            </Badge>
            {initialEvent.arc && (
              <Badge
                radius="sm"
                variant="outline"
                leftSection={<BookOpen size={14} />}
                component={Link}
                href={`/arcs/${initialEvent.arc.id}`}
                style={{ textDecoration: 'none' }}
              >
                {initialEvent.arc.name}
              </Badge>
            )}
            {initialEvent.gamble && (
              <Badge
                radius="sm"
                variant="outline"
                leftSection={<Dice6 size={14} />}
                component={Link}
                href={`/gambles/${initialEvent.gamble.id}`}
                style={{ textDecoration: 'none' }}
              >
                {initialEvent.gamble.name}
              </Badge>
            )}
            <Badge color="red" radius="sm" variant="light" leftSection={<Tag size={14} />}>
              {initialEvent.status}
            </Badge>
          </Group>
        </Stack>

        <Grid gutter="xl">
          <Grid.Col span={{ base: 12, md: 8 }}>
            <Card withBorder radius="md" className="gambling-card" shadow="sm">
              <Stack gap="md" p="lg">
                <Title order={3}>Description</Title>
                <TimelineSpoilerWrapper chapterNumber={initialEvent.chapterNumber}>
                  <EnhancedSpoilerMarkdown
                    content={initialEvent.description}
                    className="event-description"
                    enableEntityEmbeds
                    compactEntityCards={false}
                  />
                </TimelineSpoilerWrapper>

                {initialEvent.gamble && (
                  <Stack gap="sm" mt="lg">
                    <Title order={4}>Related Gamble</Title>
                    <TimelineSpoilerWrapper chapterNumber={initialEvent.chapterNumber}>
                      <Card withBorder radius="md" shadow="xs" padding="md">
                        <Stack gap="sm">
                          <Text fw={600}>{initialEvent.gamble.name}</Text>
                          <Stack gap={4}>
                            <Text size="sm" fw={600}>Rules</Text>
                            <EnhancedSpoilerMarkdown
                              content={initialEvent.gamble.rules}
                              className="event-gamble-rules"
                              enableEntityEmbeds
                              compactEntityCards
                            />
                          </Stack>
                          {initialEvent.gamble.winCondition && (
                            <Stack gap={4}>
                              <Text size="sm" fw={600}>Win Condition</Text>
                              <EnhancedSpoilerMarkdown
                                content={initialEvent.gamble.winCondition}
                                className="event-gamble-win-condition"
                                enableEntityEmbeds
                                compactEntityCards
                              />
                            </Stack>
                          )}
                        </Stack>
                      </Card>
                    </TimelineSpoilerWrapper>
                  </Stack>
                )}
              </Stack>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 4 }}>
            <Card withBorder radius="md" className="gambling-card" shadow="sm">
              <Stack gap="md" p="lg">
                <Title order={4}>Event Details</Title>

                <Stack gap={4}>
                  <Text size="xs" c="dimmed">
                    Chapter
                  </Text>
                  <Text
                    component={Link}
                    href={`/chapters/${initialEvent.chapterNumber}`}
                    fw={600}
                    style={{ textDecoration: 'none', color: theme.colors.red?.[4] ?? '#f87171' }}
                  >
                    Chapter {initialEvent.chapterNumber}
                  </Text>
                </Stack>

                {initialEvent.arc && (
                  <Stack gap={4}>
                    <Text size="xs" c="dimmed">
                      Arc
                    </Text>
                    <Text
                      component={Link}
                      href={`/arcs/${initialEvent.arc.id}`}
                      fw={600}
                      style={{ textDecoration: 'none', color: theme.colors.violet?.[4] ?? '#a855f7' }}
                    >
                      {initialEvent.arc.name}
                    </Text>
                  </Stack>
                )}

                {initialEvent.gamble && (
                  <Stack gap={4}>
                    <Text size="xs" c="dimmed">
                      Related Gamble
                    </Text>
                    <Text
                      component={Link}
                      href={`/gambles/${initialEvent.gamble.id}`}
                      fw={600}
                      style={{ textDecoration: 'none', color: theme.colors.red?.[5] ?? '#e11d48' }}
                    >
                      {initialEvent.gamble.name}
                    </Text>
                  </Stack>
                )}

                {initialEvent.tags && initialEvent.tags.length > 0 && (
                  <Stack gap={4}>
                    <Text size="xs" c="dimmed">
                      Tags
                    </Text>
                    <Group gap="xs" wrap="wrap">
                      {initialEvent.tags.map((tag) => (
                        <Badge key={tag.id} variant="outline" radius="sm">
                          {tag.name}
                        </Badge>
                      ))}
                    </Group>
                  </Stack>
                )}

                {initialEvent.characters && initialEvent.characters.length > 0 && (
                  <Stack gap="sm">
                    <Title order={5}>Featured Characters</Title>
                    <Stack gap={4}>
                      {initialEvent.characters.map((character) => (
                        <Text
                          key={character.id}
                          component={Link}
                          href={`/characters/${character.id}`}
                          style={{ textDecoration: 'none', color: theme.colors.blue?.[4] ?? '#60a5fa' }}
                        >
                          {character.name}
                        </Text>
                      ))}
                    </Stack>
                  </Stack>
                )}
              </Stack>
            </Card>
          </Grid.Col>
        </Grid>
      </motion.div>
    </Container>
  )
}
