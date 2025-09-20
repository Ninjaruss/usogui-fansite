'use client'

import React, { useCallback, useMemo, useState } from 'react'
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Card,
  Group,
  Stack,
  Text,
  Tooltip,
  rem,
  useMantineTheme,
  type MantineTheme
} from '@mantine/core'
import { AlertTriangle, ArrowRight, Calendar, Crown, Filter, X } from 'lucide-react'
import Link from 'next/link'
import { useProgress } from '../providers/ProgressProvider'
import { useSpoilerSettings } from '../hooks/useSpoilerSettings'
import { getAlphaColor } from '../lib/mantine-theme'

const EVENT_COLOR_KEYS: Record<string, keyof MantineTheme['colors']> = {
  gamble: 'orange',
  decision: 'blue',
  reveal: 'grape',
  shift: 'red',
  resolution: 'green'
}

const EVENT_ICON_MAP: Record<string, React.ComponentType<{ size?: number }>> = {
  gamble: Crown,
  decision: ArrowRight,
  reveal: Calendar,
  shift: Filter,
  resolution: X
}

const EVENT_LABEL_MAP: Record<string, string> = {
  gamble: 'Gamble',
  decision: 'Decision',
  reveal: 'Reveal',
  shift: 'Shift',
  resolution: 'Resolution'
}

const DEFAULT_EVENT_COLOR: keyof MantineTheme['colors'] = 'red'

const resolveEventColorKey = (type?: string | null): keyof MantineTheme['colors'] => {
  if (!type) return DEFAULT_EVENT_COLOR
  return EVENT_COLOR_KEYS[type] ?? DEFAULT_EVENT_COLOR
}

const resolveEventColorHex = (theme: MantineTheme, type?: string | null) => {
  const key = resolveEventColorKey(type)
  const palette = theme.colors[key]
  return palette ? palette[5] : theme.colors.red[5]
}

const getEventTypeLabel = (type?: string | null) => {
  if (!type) return 'Event'
  return EVENT_LABEL_MAP[type] ?? 'Event'
}

const getEventTypeIcon = (type?: string | null) => {
  if (!type) return Calendar
  return EVENT_ICON_MAP[type] ?? Calendar
}

interface GambleTimelineEvent {
  id: number
  title: string
  description: string | null
  chapterNumber: number
  type: 'gamble' | 'decision' | 'reveal' | 'shift' | 'resolution' | null
  arcId: number
  arcName: string
  isSpoiler?: boolean
  spoilerChapter?: number
  gambleId?: number
  characters?: Array<{ id: number; name: string }>
}

interface Arc {
  id: number
  name: string
  description: string | null
  startChapter: number
  endChapter: number | null
}

interface GambleTimelineProps {
  events: GambleTimelineEvent[]
  arcs: Arc[]
  gambleName: string
  gambleChapter: number
}

const PHASE_COLOR_KEYS: Record<string, keyof MantineTheme['colors']> = {
  setup: 'blue',
  gamble: 'orange',
  reveals: 'grape',
  resolution: 'green'
}

const resolvePhaseColor = (theme: MantineTheme, phase: string) => {
  const key = PHASE_COLOR_KEYS[phase] ?? 'red'
  const palette = theme.colors[key]
  return palette ? palette[5] : theme.colors.red[5]
}

export default React.memo(function GambleTimeline({ events, arcs, gambleName, gambleChapter }: GambleTimelineProps) {
  const theme = useMantineTheme()
  const [selectedEventTypes, setSelectedEventTypes] = useState<Set<string>>(new Set())
  const [showAllEvents, setShowAllEvents] = useState(false)

  const uniqueEventTypes = useMemo(() => {
    const eventTypes = new Set<string>()
    events.forEach((event) => {
      if (event.type) eventTypes.add(event.type)
    })

    return Array.from(eventTypes)
  }, [events])

  const filteredEvents = useMemo(() => {
    const base = [...events]
    const sorted = base.sort((a, b) => a.chapterNumber - b.chapterNumber)
    if (selectedEventTypes.size === 0) {
      return sorted
    }
    return sorted.filter((event) => event.type && selectedEventTypes.has(event.type))
  }, [events, selectedEventTypes])

  const timelinePhases = useMemo(() => {
    const phases: Array<{
      title: string
      description: string
      events: GambleTimelineEvent[]
      phase: string
    }> = []

    const pre = filteredEvents.filter((event) => event.chapterNumber < gambleChapter)
    if (pre.length > 0) {
      phases.push({
        title: 'Setup & Lead-up',
        description: 'Events leading to the gamble',
        events: pre,
        phase: 'setup'
      })
    }

    const main = filteredEvents.find((event) => event.type === 'gamble' && event.chapterNumber === gambleChapter)
    if (main) {
      phases.push({
        title: 'The Gamble',
        description: gambleName,
        events: [main],
        phase: 'gamble'
      })
    }

    const post = filteredEvents.filter((event) => event.chapterNumber > gambleChapter)
    if (post.length > 0) {
      const reveals = post.filter((event) => event.type === 'reveal' || event.type === 'shift')
      const resolutions = post.filter((event) => event.type === 'resolution')
      const others = post.filter((event) => !reveals.includes(event) && !resolutions.includes(event))

      if (reveals.length > 0 || others.length > 0) {
        phases.push({
          title: 'Reveals & Developments',
          description: 'Unfolding consequences and revelations',
          events: [...reveals, ...others].sort((a, b) => a.chapterNumber - b.chapterNumber),
          phase: 'reveals'
        })
      }

      if (resolutions.length > 0) {
        phases.push({
          title: 'Resolution',
          description: 'Final outcome and conclusions',
          events: resolutions,
          phase: 'resolution'
        })
      }
    }

    return phases
  }, [filteredEvents, gambleName, gambleChapter])

  const visiblePhases = useMemo(() => (showAllEvents ? timelinePhases : timelinePhases.slice(0, 3)), [timelinePhases, showAllEvents])

  const toggleEventType = useCallback((type: string) => {
    setSelectedEventTypes((prev) => {
      const next = new Set(prev)
      if (next.has(type)) {
        next.delete(type)
      } else {
        next.add(type)
      }
      return next
    })
  }, [])

  const clearFilters = useCallback(() => {
    setSelectedEventTypes(new Set())
  }, [])

  const toggleShowAll = useCallback(() => {
    setShowAllEvents((prev) => !prev)
  }, [])

  return (
    <Card className="gambling-card" withBorder radius="md" shadow="lg" p="xl">
      <Stack gap="lg">
        <Group justify="space-between" align="flex-start" gap="md">
          <Group gap="sm" align="center">
            <Calendar size={22} />
            <Text fw={600}>Gamble Timeline</Text>
          </Group>
          {uniqueEventTypes.length > 0 && (
            <Group gap={6} align="center" wrap="wrap">
              <Filter size={16} />
              {uniqueEventTypes.map((type) => {
                const colorKey = resolveEventColorKey(type)
                const isSelected = selectedEventTypes.has(type)
                const label = getEventTypeLabel(type)
                return (
                  <Badge
                    key={type}
                    color={colorKey}
                    variant={isSelected ? 'filled' : 'outline'}
                    radius="sm"
                    onClick={() => toggleEventType(type)}
                    style={{ cursor: 'pointer' }}
                  >
                    {label}
                  </Badge>
                )
              })}
              {selectedEventTypes.size > 0 && (
                <ActionIcon variant="subtle" color="red" size="sm" onClick={clearFilters}>
                  <X size={14} />
                </ActionIcon>
              )}
            </Group>
          )}
        </Group>

        {visiblePhases.length === 0 ? (
          <Box style={{ textAlign: 'center', paddingBlock: rem(24) }}>
            <Text c="dimmed">No timeline events found for this gamble.</Text>
          </Box>
        ) : (
          <TimelineDisplay
            phases={visiblePhases}
            arcs={arcs}
            resolvePhaseColor={(phase) => resolvePhaseColor(theme, phase)}
            theme={theme}
          />
        )}

        {timelinePhases.length > visiblePhases.length && (
          <Box style={{ textAlign: 'center' }}>
            <Button variant="light" color="gray" size="xs" onClick={toggleShowAll}>
              {showAllEvents ? 'Show Less' : `Show All (${timelinePhases.length} phases)`}
            </Button>
          </Box>
        )}
      </Stack>
    </Card>
  )
})

const TimelineDisplay = React.memo(function TimelineDisplay({
  phases,
  arcs,
  resolvePhaseColor,
  theme
}: {
  phases: Array<{ title: string; description: string; events: GambleTimelineEvent[]; phase: string }>
  arcs: Arc[]
  resolvePhaseColor: (phase: string) => string
  theme: MantineTheme
}) {
  return (
    <Stack gap="xl">
      {phases.map((phase, index) => (
        <Stack key={`${phase.phase}-${index}`} gap="lg">
          <Group align="flex-start" gap="md" pb="sm" style={{ borderBottom: `2px solid ${resolvePhaseColor(phase.phase)}` }}>
            <Crown size={20} color={resolvePhaseColor(phase.phase)} />
            <Stack gap={2} style={{ flex: 1 }}>
              <Text fw={600} c={resolvePhaseColor(phase.phase)}>
                {phase.title}
              </Text>
              <Text size="sm" c="dimmed">
                {phase.description}
              </Text>
            </Stack>
          </Group>

          <Stack gap="md">
            {phase.events.map((event, eventIndex) => (
              <TimelineEventCard
                key={event.id}
                event={event}
                arcs={arcs}
                theme={theme}
                phaseColor={resolvePhaseColor(phase.phase)}
                isLastInPhase={eventIndex === phase.events.length - 1}
              />
            ))}
          </Stack>

          {index < phases.length - 1 && (
            <Group justify="center" c="dimmed">
              <ArrowRight size={20} />
            </Group>
          )}
        </Stack>
      ))}
    </Stack>
  )
})

const TimelineEventCard = React.memo(function TimelineEventCard({
  event,
  arcs,
  theme,
  phaseColor,
  isLastInPhase
}: {
  event: GambleTimelineEvent
  arcs: Arc[]
  theme: MantineTheme
  phaseColor: string
  isLastInPhase: boolean
}) {
  const arc = arcs.find((a) => a.id === event.arcId)
  const iconColor = resolveEventColorHex(theme, event.type)
  const EventIcon = getEventTypeIcon(event.type)

  return (
    <TimelineSpoilerWrapper event={event}>
      <Card withBorder radius="md" shadow="sm" p="md" style={{ position: 'relative' }}>
        <Group align="flex-start" gap="md">
          <Box
            style={{
              width: rem(36),
              height: rem(36),
              borderRadius: '50%',
              background: iconColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              flexShrink: 0
            }}
          >
            <EventIcon size={18} />
          </Box>

          <Stack gap="sm" style={{ flex: 1, minWidth: 0 }}>
            <Text fw={600}>{event.title}</Text>

            {event.description && (
              <Text size="sm" c="dimmed">
                {event.description}
              </Text>
            )}

            <Group gap={6} wrap="wrap">
              <Badge component={Link} href={`/chapters/${event.chapterNumber}`} variant="outline" color="red" radius="sm">
                Chapter {event.chapterNumber}
              </Badge>

              {arc && (
                <Badge component={Link} href={`/arcs/${arc.id}`} variant="outline" color="purple" radius="sm">
                  {arc.name}
                </Badge>
              )}

              {event.type && (
                <Badge color={resolveEventColorKey(event.type)} radius="sm">
                  {getEventTypeLabel(event.type)}
                </Badge>
              )}
            </Group>
          </Stack>
        </Group>

        {!isLastInPhase && (
          <Box
            style={{
              position: 'absolute',
              left: rem(18),
              bottom: rem(-16),
              width: rem(2),
              height: rem(16),
              background: phaseColor,
              opacity: 0.35
            }}
          />
        )}
      </Card>
    </TimelineSpoilerWrapper>
  )
})

function TimelineSpoilerWrapper({ event, children }: { event: GambleTimelineEvent; children: React.ReactNode }) {
  const [revealed, setRevealed] = useState(false)
  const { userProgress } = useProgress()
  const { settings } = useSpoilerSettings()
  const theme = useMantineTheme()

  const effectiveProgress = settings.chapterTolerance > 0 ? settings.chapterTolerance : userProgress
  const chapterNumber = event.chapterNumber
  const spoilerChapter = event.spoilerChapter ?? chapterNumber

  const shouldHide = !settings.showAllSpoilers && spoilerChapter > effectiveProgress

  if (!shouldHide || revealed) {
    return <>{children}</>
  }

  return (
    <Box style={{ position: 'relative' }}>
      <Box style={{ opacity: 0.25, filter: 'blur(2px)', pointerEvents: 'none' }}>{children}</Box>
      <Tooltip
        label={`Chapter ${chapterNumber} spoiler – you're at Chapter ${effectiveProgress}. Click to reveal.`}
        withArrow
        position="top"
      >
        <Card
          withBorder
          radius="md"
          shadow="lg"
          p="sm"
          onClick={() => setRevealed(true)}
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: getAlphaColor(theme.colors.red[7], 0.9),
            cursor: 'pointer',
            zIndex: 10
          }}
        >
          <Stack gap={4} align="center">
            <Group gap={6} align="center" c="white">
              <AlertTriangle size={16} />
              <Text size="xs" fw={700}>
                Chapter {chapterNumber} Spoiler
              </Text>
            </Group>
            <Text size="xs" c="rgba(255,255,255,0.8)">
              Click to reveal
            </Text>
          </Stack>
        </Card>
      </Tooltip>
    </Box>
  )
}
