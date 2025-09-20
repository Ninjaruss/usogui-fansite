import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import {
  Badge,
  Box,
  Button,
  Card,
  Divider,
  Group,
  Stack,
  Text,
  Tooltip,
  rem,
  useMantineTheme,
  type MantineTheme
} from '@mantine/core'
import { Calendar, BookOpen, Eye, EyeOff, X, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { useProgress } from '../providers/ProgressProvider'
import { useSpoilerSettings } from '../hooks/useSpoilerSettings'
import { getAlphaColor } from '../lib/mantine-theme'

export interface TimelineEvent {
  id: number
  title: string
  description: string | null
  chapterNumber: number
  type: 'gamble' | 'decision' | 'reveal' | 'shift' | 'resolution' | null
  arcId: number
  arcName: string
  isSpoiler?: boolean
  spoilerChapter?: number
}

export interface Arc {
  id: number
  name: string
  description: string | null
  startChapter: number
  endChapter: number | null
}

interface CharacterTimelineProps {
  events: TimelineEvent[]
  arcs: Arc[]
  characterName: string
  firstAppearanceChapter: number
}

const EVENT_COLOR_KEYS: Record<string, keyof MantineTheme['colors']> = {
  gamble: 'orange',
  decision: 'blue',
  reveal: 'grape',
  shift: 'red',
  resolution: 'green'
}

const EVENT_LABELS: Record<string, string> = {
  gamble: 'Gamble',
  decision: 'Decision',
  reveal: 'Reveal',
  shift: 'Shift',
  resolution: 'Resolution'
}

const DEFAULT_EVENT_COLOR: keyof MantineTheme['colors'] = 'gray'

const globalStyles = `
  .timeline-event-highlight {
    background-color: rgba(251, 191, 36, 0.18) !important;
    border: 2px solid rgba(251, 191, 36, 0.45) !important;
    box-shadow: 0 0 12px rgba(251, 191, 36, 0.35) !important;
    transition: all 0.2s ease !important;
  }

  @keyframes badgePulse {
    0% {
      transform: scale(1) translateZ(0);
      box-shadow: 0 0 0 rgba(59, 130, 246, 0.4);
      background-color: transparent;
    }
    25% {
      transform: scale(1.08) translateZ(0);
      box-shadow: 0 0 20px rgba(59, 130, 246, 0.6);
    }
    50% {
      transform: scale(1.12) translateZ(0);
      box-shadow: 0 0 25px rgba(59, 130, 246, 0.8);
      background-color: rgba(59, 130, 246, 0.9);
    }
    75% {
      transform: scale(1.08) translateZ(0);
      box-shadow: 0 0 20px rgba(59, 130, 246, 0.6);
    }
    100% {
      transform: scale(1) translateZ(0);
      box-shadow: 0 0 0 rgba(59, 130, 246, 0.4);
      background-color: transparent;
    }
  }

  .chapter-badge-highlight {
    animation: badgePulse 1.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
    color: #fff !important;
    will-change: transform, box-shadow, background-color !important;
    backface-visibility: hidden !important;
    transform-style: preserve-3d !important;
  }

  .chapter-badge-highlight .mantine-Badge-label {
    color: #fff !important;
    font-weight: 600 !important;
  }

  .chapter-badge-fade-out {
    animation: badgeFadeOut 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards !important;
  }

  @keyframes badgeFadeOut {
    0% {
      transform: scale(1.05) translateZ(0);
      box-shadow: 0 0 20px rgba(59, 130, 246, 0.6);
      background-color: rgba(59, 130, 246, 0.9);
    }
    100% {
      transform: scale(1) translateZ(0);
      box-shadow: 0 0 0 rgba(59, 130, 246, 0);
      background-color: transparent;
    }
  }
`

if (typeof document !== 'undefined' && !document.getElementById('character-timeline-styles')) {
  const styleSheet = document.createElement('style')
  styleSheet.id = 'character-timeline-styles'
  styleSheet.textContent = globalStyles
  document.head.appendChild(styleSheet)
}

const resolveEventColorKey = (type?: string | null): keyof MantineTheme['colors'] => {
  if (!type) return DEFAULT_EVENT_COLOR
  return EVENT_COLOR_KEYS[type] ?? DEFAULT_EVENT_COLOR
}

const getEventTypeLabel = (type?: string | null) => {
  if (!type) return 'Event'
  return EVENT_LABELS[type] ?? 'Event'
}

const resolveEventColorHex = (theme: MantineTheme, type?: string | null) => {
  const key = resolveEventColorKey(type)
  const palette = theme.colors[key]
  return palette ? palette[5] : theme.colors.gray[5]
}

const CharacterTimeline = React.memo(function CharacterTimeline({
  events,
  arcs,
  characterName,
  firstAppearanceChapter
}: CharacterTimelineProps) {
  const theme = useMantineTheme()
  const [selectedEventTypes, setSelectedEventTypes] = useState<Set<string>>(new Set())
  const [showAllEvents, setShowAllEvents] = useState(false)

  const uniqueEventTypes = useMemo(() => {
    const types = new Set<string>()
    events.forEach((event) => {
      if (event.type) types.add(event.type)
    })
    return Array.from(types)
  }, [events])

  const filteredEvents = useMemo(() => {
    const sorted = [...events].sort((a, b) => a.chapterNumber - b.chapterNumber)
    if (selectedEventTypes.size === 0) {
      return sorted
    }
    return sorted.filter((event) => event.type && selectedEventTypes.has(event.type))
  }, [events, selectedEventTypes])

  const timelineSections = useMemo(() => {
    const arcLookup = new Map(arcs.map((arc) => [arc.id, arc]))
    const arcEvents = new Map<number, TimelineEvent[]>()

    filteredEvents.forEach((event) => {
      const arc = arcLookup.get(event.arcId)
      if (!arc) return
      if (!arcEvents.has(event.arcId)) {
        arcEvents.set(event.arcId, [])
      }
      arcEvents.get(event.arcId)!.push(event)
    })

    const sections = Array.from(arcEvents.entries()).map(([arcId, arcEventsList]) => {
      const arc = arcLookup.get(arcId)!
      return {
        arc,
        events: arcEventsList.sort((a, b) => a.chapterNumber - b.chapterNumber)
      }
    })

    return sections.sort((a, b) => a.arc.startChapter - b.arc.startChapter)
  }, [filteredEvents, arcs])

  const visibleSections = useMemo(
    () => (showAllEvents ? timelineSections : timelineSections.slice(0, 3)),
    [timelineSections, showAllEvents]
  )

  const scrollToArcRef = useRef<Record<number, () => void>>({})

  useEffect(() => {
    timelineSections.forEach((section) => {
      if (!scrollToArcRef.current[section.arc.id]) {
        scrollToArcRef.current[section.arc.id] = () => {
          requestAnimationFrame(() => {
            const element = document.getElementById(`timeline-arc-${section.arc.id}`)
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
            }
          })
        }
      }
    })
  }, [timelineSections])

  const scrollToArc = useCallback((arcId: number) => {
    scrollToArcRef.current[arcId]?.()
  }, [])

  const scrollToChapter = useCallback(
    (chapterNumber: number) => {
      requestAnimationFrame(() => {
        const elements = document.querySelectorAll(`[data-chapter="${chapterNumber}"]`)
        elements.forEach((node) => {
          const badge = node as HTMLElement
          badge.classList.remove('chapter-badge-highlight', 'chapter-badge-fade-out')
          // Force reflow
          // eslint-disable-next-line @typescript-eslint/no-unused-expressions
          badge.offsetHeight
          badge.classList.add('chapter-badge-highlight')
          setTimeout(() => {
            badge.classList.remove('chapter-badge-highlight')
            badge.classList.add('chapter-badge-fade-out')
            setTimeout(() => {
              badge.classList.remove('chapter-badge-fade-out')
            }, 500)
          }, 1200)
        })
      })

      const targetEvent = filteredEvents.find((event) => event.chapterNumber === chapterNumber)
      if (targetEvent) {
        scrollToArc(targetEvent.arcId)
        setTimeout(() => {
          requestAnimationFrame(() => {
            const eventElement = document.getElementById(`event-${targetEvent.id}`)
            if (eventElement) {
              eventElement.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' })
              eventElement.classList.add('timeline-event-highlight')
              setTimeout(() => {
                eventElement.classList.remove('timeline-event-highlight')
              }, 3000)
            }
          })
        }, 500)
      }
    },
    [filteredEvents, scrollToArc]
  )

  const clearAllFilters = useCallback(() => {
    setSelectedEventTypes(new Set())
  }, [])

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

  const toggleShowAllEvents = useCallback(() => {
    setShowAllEvents((prev) => !prev)
  }, [])

  const uniqueChapters = useMemo(() => {
    return Array.from(new Set(filteredEvents.map((event) => event.chapterNumber)))
      .sort((a, b) => a - b)
      .slice(0, 10)
  }, [filteredEvents])

  return (
    <Card className="gambling-card" withBorder radius="md" shadow="lg" p="xl">
      <Stack gap="lg">
        <Group justify="space-between" align="flex-start" gap="md">
          <Group gap="sm" align="center">
            <Calendar size={20} />
            <Text fw={600}>{characterName} Timeline</Text>
          </Group>
          <Button component={Link} href={`/events?character=${encodeURIComponent(characterName)}`} size="xs" variant="outline" color="red">
            View All Events
          </Button>
        </Group>

        {firstAppearanceChapter ? (
          <Badge
            color="purple"
            variant="filled"
            leftSection={<BookOpen size={14} />}
            radius="sm"
            onClick={() => scrollToChapter(firstAppearanceChapter)}
            data-chapter={firstAppearanceChapter}
            style={{ cursor: 'pointer', alignSelf: 'flex-start' }}
          >
            First Appearance: Chapter {firstAppearanceChapter}
          </Badge>
        ) : null}

        {uniqueEventTypes.length > 0 && (
          <Stack gap="xs">
            <Text size="sm" c="dimmed">
              Filter by Event Type
            </Text>
            <Group gap={8} wrap="wrap">
              {uniqueEventTypes.map((type) => {
                const colorKey = resolveEventColorKey(type)
                const isSelected = selectedEventTypes.has(type)
                return (
                  <Badge
                    key={type}
                    color={colorKey}
                    variant={isSelected ? 'filled' : 'outline'}
                    radius="sm"
                    onClick={() => toggleEventType(type)}
                    style={{ cursor: 'pointer' }}
                  >
                    {getEventTypeLabel(type)}
                  </Badge>
                )
              })}
              {selectedEventTypes.size > 0 && (
                <Button leftSection={<X size={14} />} size="xs" variant="light" color="gray" onClick={clearAllFilters}>
                  Clear Filters
                </Button>
              )}
            </Group>
          </Stack>
        )}

        {filteredEvents.length > 0 && (
          <Stack gap="sm">
            <Divider color="rgba(255,255,255,0.08)" />
            <Text size="sm" c="dimmed">
              Quick Navigation
            </Text>

            {timelineSections.length > 1 && (
              <Stack gap={4}>
                <Text size="xs" c="dimmed">
                  Jump to Arc
                </Text>
                <Group gap={6} wrap="wrap">
                  {timelineSections.slice(0, 5).map((section) => (
                    <Badge
                      key={section.arc.id}
                      variant="outline"
                      color="red"
                      radius="sm"
                      onClick={() => scrollToArc(section.arc.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      {section.arc.name}
                    </Badge>
                  ))}
                </Group>
              </Stack>
            )}

            {uniqueChapters.length > 0 && (
              <Stack gap={4}>
                <Text size="xs" c="dimmed">
                  Jump to Chapter
                </Text>
                <Group gap={6} wrap="wrap">
                  {uniqueChapters.map((chapter) => (
                    <Badge
                      key={chapter}
                      variant="outline"
                      color="purple"
                      radius="sm"
                      onClick={() => scrollToChapter(chapter)}
                      data-chapter={chapter}
                      style={{ cursor: 'pointer' }}
                    >
                      Ch. {chapter}
                    </Badge>
                  ))}
                </Group>
              </Stack>
            )}
          </Stack>
        )}

        <Divider color="rgba(255,255,255,0.08)" />

        {filteredEvents.length === 0 ? (
          <Box style={{ textAlign: 'center', paddingBlock: rem(24) }}>
            <Text size="sm" c="dimmed">
              No events found for this character{selectedEventTypes.size > 0 ? ' matching your filters' : ''}.
            </Text>
          </Box>
        ) : timelineSections.length === 0 ? (
          <Box style={{ textAlign: 'center', paddingBlock: rem(24) }}>
            <Stack gap={4} align="center">
              <Text size="sm" c="dimmed">
                No arc-associated events found for this character.
              </Text>
              <Text size="xs" c="dimmed">
                Found {filteredEvents.length} event(s), but none are associated with story arcs.
              </Text>
            </Stack>
          </Box>
        ) : null}

        {timelineSections.length > 3 && (
          <Box style={{ textAlign: 'center' }}>
            <Button
              leftSection={showAllEvents ? <EyeOff size={14} /> : <Eye size={14} />}
              size="xs"
              variant="light"
              color="gray"
              onClick={toggleShowAllEvents}
            >
              {showAllEvents ? 'Show Less' : `Show All ${timelineSections.length} Arcs`}
            </Button>
          </Box>
        )}

        {timelineSections.length > 0 && (
          <TimelineDisplay visibleSections={visibleSections} characterName={characterName} />
        )}
      </Stack>
    </Card>
  )
})

const TimelineDisplay = React.memo(function TimelineDisplay({
  visibleSections,
  characterName
}: {
  visibleSections: Array<{ arc: Arc; events: TimelineEvent[] }>
  characterName: string
}) {
  const theme = useMantineTheme()
  return (
    <Stack gap="xl">
      {visibleSections.map((section, index) => (
        <Stack key={section.arc.id} gap="lg">
          {index > 0 && <Divider color="rgba(255,255,255,0.08)" variant="dashed" />}

          <Stack id={`timeline-arc-${section.arc.id}`} gap="md" align="center">
            <Text fw={600} c="red.5" size="lg">
              {section.arc.name}
            </Text>
            <Text size="sm" c="dimmed" fs="italic">
              {characterName}'s events in this arc
            </Text>
            {section.arc.description && (
              <Text size="sm" c="dimmed" style={{ maxWidth: rem(600), textAlign: 'center' }}>
                {section.arc.description}
              </Text>
            )}
            <Badge color="purple" variant="outline" radius="sm">
              Chapters {section.arc.startChapter}
              {section.arc.endChapter && section.arc.endChapter !== section.arc.startChapter
                ? `-${section.arc.endChapter}`
                : ''}
            </Badge>
          </Stack>

          <Box
            style={{
              position: 'relative',
              paddingInline: rem(16)
            }}
          >
            <Box
              style={{
                position: 'absolute',
                top: '50%',
                left: 0,
                right: 0,
                height: rem(3),
                background: `linear-gradient(90deg, ${getAlphaColor(theme.colors.red[5], 0.1)}, ${theme.colors.red[5]}, ${getAlphaColor(theme.colors.red[5], 0.1)})`,
                transform: 'translateY(-50%)',
                borderRadius: rem(2)
              }}
            />
            <Box
              style={{
                display: 'flex',
                gap: rem(24),
                overflowX: 'auto',
                paddingBlock: rem(16)
              }}
            >
              {section.events.map((event) => (
                <TimelineEventCard key={event.id} event={event} />
              ))}
            </Box>
          </Box>
        </Stack>
      ))}
    </Stack>
  )
})

const TimelineEventCard = React.memo(function TimelineEventCard({ event }: { event: TimelineEvent }) {
  const theme = useMantineTheme()
  const eventColor = resolveEventColorHex(theme, event.type)

  return (
    <Box
      id={`event-${event.id}`}
      style={{
        minWidth: rem(280),
        maxWidth: rem(320),
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative'
      }}
    >
      <Box
        style={{
          width: rem(16),
          height: rem(16),
          borderRadius: '50%',
          background: eventColor,
          border: `3px solid ${theme.colors.dark[7]}`,
          boxShadow: `0 0 0 2px ${eventColor}`,
          marginBottom: rem(12),
          transition: 'transform 150ms'
        }}
      />
      <TimelineSpoilerWrapper event={event}>
        <Card withBorder radius="md" shadow="sm" p="md" style={{ width: '100%' }}>
          <Stack gap="sm" align="center">
            <Group gap={6} justify="center" wrap="wrap">
              <Badge color="red" variant="outline" radius="sm">
                Ch. {event.chapterNumber}
              </Badge>
              {event.type && (
                <Badge color={resolveEventColorKey(event.type)} radius="sm">
                  {getEventTypeLabel(event.type)}
                </Badge>
              )}
            </Group>

            <Text fw={600} size="sm" ta="center" style={{ lineHeight: 1.4 }}>
              {event.title}
            </Text>

            {event.description && (
              <Text size="xs" c="dimmed" ta="center" style={{ lineHeight: 1.5 }}>
                {event.description}
              </Text>
            )}
          </Stack>
        </Card>
      </TimelineSpoilerWrapper>
    </Box>
  )
})

function TimelineSpoilerWrapper({ event, children }: { event: TimelineEvent; children: React.ReactNode }) {
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
            <Text size="xs" c="rgba(255,255,255,0.85)">
              Click to reveal
            </Text>
          </Stack>
        </Card>
      </Tooltip>
    </Box>
  )
}

export default CharacterTimeline
