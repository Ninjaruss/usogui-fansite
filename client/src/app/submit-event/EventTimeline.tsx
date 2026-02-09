'use client'

import React, { useEffect, useState, useMemo } from 'react'
import {
  Box,
  Card,
  Loader,
  Stack,
  Text,
  ThemeIcon,
  Timeline,
  Title,
  Badge,
  useMantineTheme
} from '@mantine/core'
import { Zap, Calendar, BookOpen, Dices } from 'lucide-react'
import { api } from '../../lib/api'

interface Event {
  id: number
  title: string
  chapterNumber: number
  type?: string
  description?: string
}

interface EventTimelineProps {
  arcId: number | null
  gambleId: number | null
  accentColor: string
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  gamble: 'Gamble',
  decision: 'Decision',
  reveal: 'Reveal',
  shift: 'Shift',
  resolution: 'Resolution'
}

const EVENT_TYPE_COLORS: Record<string, string> = {
  gamble: '#f59e0b',
  decision: '#3b82f6',
  reveal: '#10b981',
  shift: '#8b5cf6',
  resolution: '#ef4444'
}

export default function EventTimeline({ arcId, gambleId, accentColor }: EventTimelineProps) {
  const theme = useMantineTheme()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(false)
  const [source, setSource] = useState<'arc' | 'gamble' | null>(null)

  useEffect(() => {
    const fetchEvents = async () => {
      if (!arcId && !gambleId) {
        setEvents([])
        setSource(null)
        return
      }

      setLoading(true)
      try {
        let fetchedEvents: Event[] = []

        if (gambleId) {
          // Prioritize gamble if both are selected
          fetchedEvents = await api.getEventsByGamble(gambleId, { status: 'approved' })
          setSource('gamble')
        } else if (arcId) {
          fetchedEvents = await api.getEventsByArc(arcId, { status: 'approved' })
          setSource('arc')
        }

        setEvents(fetchedEvents || [])
      } catch (error) {
        console.error('Error fetching events:', error)
        setEvents([])
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [arcId, gambleId])

  const sortedEvents = useMemo(() =>
    [...events].sort((a, b) => a.chapterNumber - b.chapterNumber),
    [events]
  )

  if (!arcId && !gambleId) {
    return (
      <Card
        withBorder
        radius="md"
        p="lg"
        style={{
          backgroundColor: theme.colors.dark?.[7] ?? '#070707',
          borderColor: 'rgba(255, 255, 255, 0.1)'
        }}
      >
        <Stack align="center" gap="md" py="xl">
          <ThemeIcon size={48} radius="xl" variant="light" style={{ backgroundColor: 'rgba(250, 176, 5, 0.15)', color: accentColor }}>
            <BookOpen size={24} />
          </ThemeIcon>
          <Text c="dimmed" ta="center" size="sm">
            Select an arc or gamble to see existing events
          </Text>
        </Stack>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card
        withBorder
        radius="md"
        p="lg"
        style={{
          backgroundColor: theme.colors.dark?.[7] ?? '#070707',
          borderColor: 'rgba(255, 255, 255, 0.1)'
        }}
      >
        <Stack align="center" gap="md" py="xl">
          <Loader size="md" color={accentColor} />
          <Text c="dimmed" size="sm">Loading events...</Text>
        </Stack>
      </Card>
    )
  }

  return (
    <Card
      withBorder
      radius="md"
      p="lg"
      style={{
        backgroundColor: theme.colors.dark?.[7] ?? '#070707',
        borderColor: `${accentColor}40`,
        maxHeight: '600px',
        overflow: 'auto'
      }}
    >
      <Stack gap="md">
        <Box>
          <Title order={4} c={accentColor} mb="xs">
            {source === 'gamble' ? (
              <><Dices size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />Gamble Events</>
            ) : (
              <><BookOpen size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />Arc Events</>
            )}
          </Title>
          <Text size="xs" c="dimmed">
            {sortedEvents.length} existing event{sortedEvents.length !== 1 ? 's' : ''}
          </Text>
        </Box>

        {sortedEvents.length === 0 ? (
          <Text c="dimmed" ta="center" py="md" size="sm">
            No events found for this {source}. Be the first to add one!
          </Text>
        ) : (
          <Timeline
            active={-1}
            bulletSize={28}
            lineWidth={2}
            color={accentColor}
          >
            {sortedEvents.map((event) => (
              <Timeline.Item
                key={event.id}
                bullet={
                  <ThemeIcon
                    size={28}
                    radius="xl"
                    style={{
                      backgroundColor: event.type ? EVENT_TYPE_COLORS[event.type] ?? accentColor : accentColor
                    }}
                  >
                    <Zap size={14} />
                  </ThemeIcon>
                }
                title={
                  <Text size="sm" fw={600} lineClamp={1}>
                    {event.title}
                  </Text>
                }
              >
                <Stack gap={4}>
                  <Badge
                    size="xs"
                    variant="light"
                    leftSection={<Calendar size={10} />}
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      color: 'rgba(255, 255, 255, 0.7)'
                    }}
                  >
                    Chapter {event.chapterNumber}
                  </Badge>
                  {event.type && (
                    <Badge
                      size="xs"
                      variant="light"
                      style={{
                        backgroundColor: `${EVENT_TYPE_COLORS[event.type] ?? accentColor}20`,
                        color: EVENT_TYPE_COLORS[event.type] ?? accentColor
                      }}
                    >
                      {EVENT_TYPE_LABELS[event.type] ?? event.type}
                    </Badge>
                  )}
                  {event.description && (
                    <Text size="xs" c="dimmed" lineClamp={2} mt={4}>
                      {event.description}
                    </Text>
                  )}
                </Stack>
              </Timeline.Item>
            ))}
          </Timeline>
        )}
      </Stack>
    </Card>
  )
}
