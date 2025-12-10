'use client'

import React, { useCallback, useMemo, useRef, useState } from 'react'
import {
  Alert,
  Badge,
  Box,
  Button,
  Card,
  Divider,
  Group,
  Stack,
  Text,
  rem,
  useMantineTheme
} from '@mantine/core'
import { getEntityThemeColor, semanticColors, textColors } from '../lib/mantine-theme'
import { BookOpen, Calendar, ArrowUpDown, CheckCircle2, Dice1, Eye, Users, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { useSpoilerSettings } from '../hooks/useSpoilerSettings'
import { useProgress } from '../providers/ProgressProvider'

interface TimelineEvent {
  id: number
  title: string
  chapterNumber: number
  type?: 'gamble' | 'decision' | 'reveal' | 'shift' | 'resolution'
  characters?: string[]
  description?: string
  isSpoiler?: boolean
  spoilerChapter?: number
}

interface ArcTimelineProps {
  events: TimelineEvent[]
  arcName: string
  startChapter: number
  endChapter: number
}

const globalStyles = `
  .arc-timeline-highlight {
    background-color: rgba(250, 204, 21, 0.18) !important;
    border: 2px solid rgba(250, 204, 21, 0.45) !important;
    box-shadow: 0 0 12px rgba(250, 204, 21, 0.35) !important;
    transition: all 0.2s ease !important;
  }
`

if (typeof document !== 'undefined' && !document.getElementById('arc-timeline-styles')) {
  const styleSheet = document.createElement('style')
  styleSheet.id = 'arc-timeline-styles'
  styleSheet.textContent = globalStyles
  document.head.appendChild(styleSheet)
}

const EVENT_COLOR_MAP: Record<string, string> = {
  gamble: '#ff5555',     // 4.5:1 contrast - vibrant red
  decision: '#f39c12',   // 5.2:1 contrast - amber
  reveal: '#4dabf7',     // 4.7:1 contrast - bright blue
  shift: '#a855f7',      // 4.5:1 contrast - saturated purple
  resolution: '#51cf66'  // 4.9:1 contrast - bright green
}

const EVENT_ICON_MAP: Record<string, React.ComponentType<{ size?: number }>> = {
  gamble: Dice1,
  decision: Users,
  reveal: Eye,
  shift: ArrowUpDown,
  resolution: CheckCircle2
}

const EVENT_LABEL_MAP: Record<string, string> = {
  gamble: 'Gamble',
  decision: 'Decision',
  reveal: 'Reveal',
  shift: 'Shift',
  resolution: 'Resolution'
}

const DEFAULT_EVENT_COLOR = 'red'

const getEventTypeIcon = (type?: string) => {
  if (!type) return Calendar
  return EVENT_ICON_MAP[type] ?? Calendar
}

const getEventTypeColor = (type?: string) => {
  if (!type) return DEFAULT_EVENT_COLOR
  return EVENT_COLOR_MAP[type] ?? DEFAULT_EVENT_COLOR
}

const getEventTypeLabel = (type?: string) => {
  if (!type) return 'Event'
  return EVENT_LABEL_MAP[type] ?? 'Event'
}

const ArcTimeline = React.memo(function ArcTimeline({ events, arcName, startChapter, endChapter }: ArcTimelineProps) {
  const theme = useMantineTheme()
  const [selectedEventTypes, setSelectedEventTypes] = useState<Set<string>>(new Set())
  const [selectedCharacters, setSelectedCharacters] = useState<Set<string>>(new Set())
  const [showAllEvents, setShowAllEvents] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
  const timelineRef = useRef<HTMLDivElement>(null)
  const [globalModal, setGlobalModal] = useState<{ show: boolean; event: TimelineEvent | null; position: { x: number; y: number } }>(
    { show: false, event: null, position: { x: 0, y: 0 } }
  )

  const { uniqueEventTypes, uniqueCharacters } = useMemo(() => {
    const eventTypes = new Set<string>()
    const characters = new Set<string>()

    events.forEach((event) => {
      if (event.type) eventTypes.add(event.type)
      if (event.characters) {
        event.characters.forEach((char) => characters.add(char))
      }
    })

    return {
      uniqueEventTypes: Array.from(eventTypes),
      uniqueCharacters: Array.from(characters)
    }
  }, [events])

  const filteredEvents = useMemo(() => {
    if (selectedEventTypes.size === 0 && selectedCharacters.size === 0) {
      return events.slice().sort((a, b) => a.chapterNumber - b.chapterNumber)
    }

    let filtered = [...events]

    if (selectedEventTypes.size > 0) {
      filtered = filtered.filter((event) => event.type && selectedEventTypes.has(event.type))
    }

    if (selectedCharacters.size > 0) {
      filtered = filtered.filter((event) =>
        event.characters && event.characters.some((char) => selectedCharacters.has(char))
      )
    }

    return filtered.sort((a, b) => a.chapterNumber - b.chapterNumber)
  }, [events, selectedEventTypes, selectedCharacters])

  const timelineSections = useMemo(() => {
    const sections: Array<{
      type: 'section'
      sectionType: string
      sectionName: string
      events: TimelineEvent[]
      earliestChapter?: number
      latestChapter?: number
    }> = []

    if (filteredEvents.length === 0) return sections

    const sortedEvents = [...filteredEvents].sort((a, b) => a.chapterNumber - b.chapterNumber)
    const resolutionEvents = sortedEvents.filter((event) => event.type === 'resolution')
    const usedEventIds = new Set<number>()
    let narrativeUnitIndex = 1

    resolutionEvents.forEach((resolution) => {
      if (usedEventIds.has(resolution.id)) return

      const narrativeUnit: TimelineEvent[] = []
      const resolutionChapter = resolution.chapterNumber
      narrativeUnit.push(resolution)
      usedEventIds.add(resolution.id)

      let associatedGamble: TimelineEvent | null = null
      for (let i = sortedEvents.length - 1; i >= 0; i--) {
        const event = sortedEvents[i]
        if (event.type === 'gamble' && event.chapterNumber <= resolutionChapter && !usedEventIds.has(event.id)) {
          associatedGamble = event
          break
        }
      }

      if (associatedGamble) {
        narrativeUnit.unshift(associatedGamble)
        usedEventIds.add(associatedGamble.id)

        const gambleChapter = associatedGamble.chapterNumber
        sortedEvents.forEach((event) => {
          if (usedEventIds.has(event.id)) return
          if (
            event.chapterNumber >= gambleChapter &&
            event.chapterNumber <= resolutionChapter &&
            (event.type === 'decision' || event.type === 'reveal' || event.type === 'shift')
          ) {
            narrativeUnit.push(event)
            usedEventIds.add(event.id)
          }
        })

        narrativeUnit.sort((a, b) => a.chapterNumber - b.chapterNumber)
      }

      if (narrativeUnit.length > 0) {
        const earliestChapter = Math.min(...narrativeUnit.map((e) => e.chapterNumber))
        const latestChapter = Math.max(...narrativeUnit.map((e) => e.chapterNumber))

        let sectionName = `Narrative Unit ${narrativeUnitIndex}`
        if (associatedGamble && resolution) {
          const gambleTitle = associatedGamble.title.length > 30 ? `${associatedGamble.title.substring(0, 30)}...` : associatedGamble.title
          sectionName = `${gambleTitle} → Resolution`
        }

        sections.push({
          type: 'section',
          sectionType: `narrative-unit-${narrativeUnitIndex}`,
          sectionName,
          events: narrativeUnit,
          earliestChapter,
          latestChapter
        })

        narrativeUnitIndex += 1
      }
    })

    const orphanedEvents = sortedEvents.filter((event) => !usedEventIds.has(event.id))

    if (orphanedEvents.length > 0) {
      const orphanGroups: Array<{ events: TimelineEvent[]; startChapter: number; endChapter: number }>
        = []
      let currentGroup: TimelineEvent[] = []

      orphanedEvents.forEach((event, index) => {
        if (currentGroup.length === 0) {
          currentGroup.push(event)
        } else {
          const lastEvent = currentGroup[currentGroup.length - 1]
          const chapterGap = event.chapterNumber - lastEvent.chapterNumber

          if (chapterGap <= 5) {
            currentGroup.push(event)
          } else {
            if (currentGroup.length > 0) {
              orphanGroups.push({
                events: [...currentGroup],
                startChapter: currentGroup[0].chapterNumber,
                endChapter: currentGroup[currentGroup.length - 1].chapterNumber
              })
            }
            currentGroup = [event]
          }
        }

        if (index === orphanedEvents.length - 1 && currentGroup.length > 0) {
          orphanGroups.push({
            events: [...currentGroup],
            startChapter: currentGroup[0].chapterNumber,
            endChapter: currentGroup[currentGroup.length - 1].chapterNumber
          })
        }
      })

      orphanGroups.forEach((group, index) => {
        const sectionName =
          group.events.length === 1
            ? `${group.events[0].title.length > 25 ? `${group.events[0].title.substring(0, 25)}...` : group.events[0].title} (Transition)`
            : `Transition Events ${index + 1}`

        sections.push({
          type: 'section',
          sectionType: `transition-${index + 1}`,
          sectionName,
          events: group.events,
          earliestChapter: group.startChapter,
          latestChapter: group.endChapter
        })
      })
    }

    if (sections.length === 0 && sortedEvents.length > 0) {
      sections.push({
        type: 'section',
        sectionType: 'all-events',
        sectionName: `${arcName} Arc Events`,
        events: sortedEvents,
        earliestChapter: sortedEvents[0].chapterNumber,
        latestChapter: sortedEvents[sortedEvents.length - 1].chapterNumber
      })
    }

    return sections.sort((a, b) => (a.earliestChapter || 999) - (b.earliestChapter || 999))
  }, [filteredEvents, arcName])

  const scrollToSection = useCallback((sectionType: string) => {
    requestAnimationFrame(() => {
      const sectionElement = document.getElementById(`timeline-section-${sectionType}`)
      if (sectionElement && timelineRef.current) {
        const container = timelineRef.current
        const elementLeft = sectionElement.offsetLeft
        const elementWidth = sectionElement.offsetWidth
        const containerWidth = container.offsetWidth
        const scrollLeft = elementLeft - containerWidth / 2 + elementWidth / 2
        container.scrollTo({ left: Math.max(0, scrollLeft), behavior: 'smooth' })
      }
    })
  }, [])

  const scrollToChapter = useCallback(
    (chapterNumber: number) => {
      const eventWithChapter = filteredEvents.find((e) => e.chapterNumber === chapterNumber)
      if (eventWithChapter) {
        const section = timelineSections.find((s) => s.events.some((e) => e.id === eventWithChapter.id))
        if (section) {
          setExpandedSections((prev) => new Set(prev).add(section.sectionType))
          scrollToSection(section.sectionType)
          setTimeout(() => {
            requestAnimationFrame(() => {
              const eventElement = document.getElementById(`event-${eventWithChapter.id}`)
              if (eventElement) {
                eventElement.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' })
                eventElement.classList.add('arc-timeline-highlight')
                setTimeout(() => {
                  eventElement.classList.remove('arc-timeline-highlight')
                }, 3000)
              }
            })
          }, 500)
        }
      }
    },
    [filteredEvents, timelineSections, scrollToSection]
  )

  const toggleSectionExpansion = useCallback((sectionType: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev)
      if (next.has(sectionType)) {
        next.delete(sectionType)
      } else {
        next.add(sectionType)
      }
      return next
    })
  }, [])

  const toggleEventTypeFilter = useCallback((eventType: string) => {
    setSelectedEventTypes((prev) => {
      const next = new Set(prev)
      if (next.has(eventType)) {
        next.delete(eventType)
      } else {
        next.add(eventType)
      }
      return next
    })
  }, [])

  const toggleCharacterFilter = useCallback((character: string) => {
    setSelectedCharacters((prev) => {
      const next = new Set(prev)
      if (next.has(character)) {
        next.delete(character)
      } else {
        next.add(character)
      }
      return next
    })
  }, [])

  const clearAllFilters = useCallback(() => {
    setSelectedEventTypes(new Set())
    setSelectedCharacters(new Set())
  }, [])

  const toggleShowAllEvents = useCallback(() => {
    setShowAllEvents((prev) => !prev)
  }, [])

  const showEventModal = useCallback((event: TimelineEvent, targetElement: Element) => {
    const rect = targetElement.getBoundingClientRect()
    const modalWidth = 280
    const modalHeight = 150
    const spacing = 15

    let modalX = rect.left + rect.width / 2
    let modalY = rect.top - spacing

    const rightOverflow = modalX + modalWidth / 2 - (window.innerWidth - 20)
    const leftOverflow = modalX - modalWidth / 2 - 20

    if (rightOverflow > 0) {
      modalX -= rightOverflow
    } else if (leftOverflow < 0) {
      modalX -= leftOverflow
    }

    if (modalY - modalHeight < 20) {
      modalY = rect.bottom + spacing
    }

    setGlobalModal({ show: true, event, position: { x: modalX, y: modalY } })
  }, [])

  const hideEventModal = useCallback(() => {
    setGlobalModal({ show: false, event: null, position: { x: 0, y: 0 } })
  }, [])

  const visibleSections = useMemo(() => (showAllEvents ? timelineSections : timelineSections.slice(0, 4)), [showAllEvents, timelineSections])

  const uniqueChapters = useMemo(() => {
    return Array.from(new Set(filteredEvents.map((e) => e.chapterNumber)))
      .sort((a, b) => a - b)
      .slice(0, 10)
  }, [filteredEvents])

  return (
    <Card className="gambling-card" withBorder radius="md" shadow="lg" p="xl">
      <Stack gap="lg">
        <Group justify="space-between" align="flex-start">
          <Group gap="sm">
            <Calendar size={20} />
            <Text fw={600}>Arc Timeline</Text>
          </Group>
          <Button component={Link} href={`/events?arc=${arcName}`} size="xs" variant="outline" style={{ color: getEntityThemeColor(theme, 'gamble') }}>
            View All Events
          </Button>
        </Group>

        <Group gap="xs" align="center" wrap="wrap">
          <Badge style={{ color: getEntityThemeColor(theme, 'arc') }} variant="outline" leftSection={<BookOpen size={14} />} radius="sm">
            Arc Range: Chapters {startChapter}-{endChapter}
          </Badge>
          <Badge style={{ color: getEntityThemeColor(theme, 'gamble') }} variant="outline" leftSection={<Calendar size={14} />} radius="sm">
            {filteredEvents.length} Event{filteredEvents.length === 1 ? '' : 's'}
          </Badge>
          {(selectedEventTypes.size > 0 || selectedCharacters.size > 0) && (
            <Badge style={{ color: getEntityThemeColor(theme, 'character') }} variant="outline" radius="sm">
              {filteredEvents.length} Filtered
            </Badge>
          )}
        </Group>

        {(uniqueEventTypes.length > 0 || uniqueCharacters.length > 0) && (
          <Stack gap="sm">
            <Group justify="space-between" align="center">
              <Text size="sm" c="dimmed">
                Filters:
              </Text>
              {(selectedEventTypes.size > 0 || selectedCharacters.size > 0) && (
                <Button size="xs" variant="light" color="gray" onClick={clearAllFilters}>
                  Clear Filters
                </Button>
              )}
            </Group>

            {uniqueEventTypes.length > 0 && (
              <Stack gap={4}>
                <Text size="xs" c="dimmed">
                  Event Types
                </Text>
                <Group gap={6} wrap="wrap">
                  {uniqueEventTypes.map((eventType) => {
                    const Icon = getEventTypeIcon(eventType)
                    const isSelected = selectedEventTypes.has(eventType)
                    return (
                      <Badge
                        key={eventType}
                        variant={isSelected ? 'filled' : 'outline'}
                        leftSection={<Icon size={12} />}
                        radius="sm"
                        onClick={() => toggleEventTypeFilter(eventType)}
                        style={{
                          cursor: 'pointer',
                          backgroundColor: isSelected ? getEventTypeColor(eventType) : 'transparent',
                          borderColor: getEventTypeColor(eventType),
                          color: isSelected ? textColors.primary : getEventTypeColor(eventType)
                        }}
                      >
                        {getEventTypeLabel(eventType)}
                      </Badge>
                    )
                  })}
                </Group>
              </Stack>
            )}

            {uniqueCharacters.length > 0 && (
              <Stack gap={4}>
                <Text size="xs" c="dimmed">
                  Characters
                </Text>
                <Group gap={6} wrap="wrap">
                  {uniqueCharacters.map((character) => {
                    const isSelected = selectedCharacters.has(character)
                    return (
                      <Badge
                        key={character}
                        variant={isSelected ? 'filled' : 'outline'}
                        radius="sm"
                        leftSection={<Users size={12} />}
                        onClick={() => toggleCharacterFilter(character)}
                        style={{
                          cursor: 'pointer',
                          backgroundColor: isSelected ? getEntityThemeColor(theme, 'character') : 'transparent',
                          borderColor: getEntityThemeColor(theme, 'character'),
                          color: isSelected ? textColors.primary : getEntityThemeColor(theme, 'character')
                        }}
                      >
                        {character}
                      </Badge>
                    )
                  })}
                </Group>
              </Stack>
            )}
          </Stack>
        )}

        <Box style={{ position: 'relative' }}>
          <Box
            style={{
              position: 'absolute',
              top: '50%',
              left: 0,
              right: 0,
              height: rem(2),
              background: 'linear-gradient(90deg, rgba(225, 29, 72, 0.2), rgba(124, 58, 237, 0.6), rgba(225, 29, 72, 0.2))',
              transform: 'translateY(-50%)',
              zIndex: 1
            }}
          />

          <Box
            ref={timelineRef}
            style={{
              display: 'flex',
              gap: rem(24),
              paddingBottom: rem(16),
              overflowX: 'auto',
              alignItems: 'flex-start',
              position: 'relative',
              zIndex: 2
            }}
          >
            {visibleSections.map((section, index) => (
              <ArcTimelineSection
                key={`${section.sectionType}-${index}`}
                section={section}
                expandedSections={expandedSections}
                toggleSectionExpansion={toggleSectionExpansion}
                showEventModal={showEventModal}
                hideEventModal={hideEventModal}
              />
            ))}
          </Box>

          {timelineSections.length > 4 && (
            <Box style={{ textAlign: 'center', marginTop: rem(16) }}>
              <Button variant="light" size="xs" color="gray" onClick={toggleShowAllEvents}>
                {showAllEvents
                  ? 'Show Less'
                  : `Show ${timelineSections.length - 4} More Section${timelineSections.length - 4 !== 1 ? 's' : ''}`}
              </Button>
            </Box>
          )}
        </Box>

        {filteredEvents.length > 0 && (
          <Stack gap="md">
            <Divider color="rgba(255,255,255,0.08)" />
            <Stack gap="sm">
              <Text size="sm" c="dimmed">
                Quick Navigation
              </Text>

              {timelineSections.length > 1 && (
                <Stack gap={4}>
                  <Text size="xs" c="dimmed">
                    Jump to Section
                  </Text>
                  <Group gap={6} wrap="wrap">
                  {timelineSections.slice(0, 5).map((section) => (
                    <Badge
                      key={section.sectionType}
                      variant="outline"
                      style={{
                        color: getEntityThemeColor(theme, 'gamble'),
                        cursor: 'pointer'
                      }}
                      radius="sm"
                      onClick={() => scrollToSection(section.sectionType)}
                    >
                      {section.sectionName}
                    </Badge>
                  ))}
                  </Group>
                </Stack>
              )}

              <Stack gap={4}>
                <Text size="xs" c="dimmed">
                  Jump to Chapter
                </Text>
                <Group gap={6} wrap="wrap">
                  {uniqueChapters.map((chapter) => (
                    <Badge
                      key={chapter}
                      variant="outline"
                      style={{
                        color: getEntityThemeColor(theme, 'media'),
                        cursor: 'pointer'
                      }}
                      radius="sm"
                      onClick={() => scrollToChapter(chapter)}
                    >
                      Ch. {chapter}
                    </Badge>
                  ))}
                </Group>
              </Stack>
            </Stack>
          </Stack>
        )}

        {globalModal.show && globalModal.event && (
          <Box
            style={{
              position: 'fixed',
              left: globalModal.position.x,
              top: globalModal.position.y,
              transform: 'translate(-50%, -100%)',
              zIndex: 999999,
              width: rem(280),
              maxWidth: 'calc(100vw - 40px)',
              pointerEvents: 'none'
            }}
          >
            <Card withBorder radius="md" shadow="xl" p="md">
              <Stack gap="sm">
                <Text fw={600}>{globalModal.event.title}</Text>
                <Group gap={6}>
                  <Badge variant="outline" style={{ color: getEntityThemeColor(theme, 'gamble') }} radius="sm">
                    Chapter {globalModal.event.chapterNumber}
                  </Badge>
                  {globalModal.event.type && (
                    <Badge
                      variant="filled"
                      color={getEventTypeColor(globalModal.event.type)}
                      radius="sm"
                      leftSection={React.createElement(getEventTypeIcon(globalModal.event.type), { size: 12 })}
                    >
                      {getEventTypeLabel(globalModal.event.type)}
                    </Badge>
                  )}
                </Group>
                <Text size="sm" c="dimmed">
                  {globalModal.event.description || 'No description available'}
                </Text>
              </Stack>
            </Card>
          </Box>
        )}
      </Stack>
    </Card>
  )
})

export default ArcTimeline

const ArcTimelineSection = React.memo(function ArcTimelineSection({
  section,
  expandedSections,
  toggleSectionExpansion,
  showEventModal,
  hideEventModal
}: {
  section: any
  expandedSections: Set<string>
  toggleSectionExpansion: (sectionType: string) => void
  showEventModal: (event: TimelineEvent, targetElement: Element) => void
  hideEventModal: () => void
}) {
  const theme = useMantineTheme()
  const isExpanded = expandedSections.has(section.sectionType)

  return (
    <Box id={`timeline-section-${section.sectionType}`} style={{ minWidth: rem(260), maxWidth: rem(360) }}>
      <Card
        withBorder
        radius="md"
        shadow={isExpanded ? 'xl' : 'sm'}
        p="md"
        style={{
          background: `linear-gradient(135deg, rgba(124, 58, 237, 0.08), rgba(225, 29, 72, 0.05))`,
          cursor: 'pointer',
          marginBottom: rem(8)
        }}
        onClick={() => toggleSectionExpansion(section.sectionType)}
      >
        <Stack gap="xs">
          <Group justify="space-between" align="flex-start">
            <Text fw={600} size="sm" style={{ color: getEntityThemeColor(theme, 'arc') }}>
              {section.sectionName}
            </Text>
            <Badge variant="outline" style={{ color: getEntityThemeColor(theme, 'gamble') }} radius="sm">
              {section.events.length} events
            </Badge>
          </Group>
          {section.earliestChapter && section.latestChapter && (
            <Text size="xs" c="dimmed">
              Chapters {section.earliestChapter}-{section.latestChapter}
            </Text>
          )}
          <Group justify="center">
            <ArrowUpDown size={16} style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 150ms' }} />
          </Group>
        </Stack>
      </Card>

      <EventsInSection events={section.events} isExpanded={isExpanded} onShowModal={showEventModal} onHideModal={hideEventModal} />
    </Box>
  )
})

function EventsInSection({
  events,
  isExpanded,
  onShowModal,
  onHideModal
}: {
  events: TimelineEvent[]
  isExpanded: boolean
  onShowModal: (event: TimelineEvent, targetElement: Element) => void
  onHideModal: () => void
}) {
  const { shouldHideSpoiler } = useSpoilerSettings()

  if (!isExpanded) {
    const firstEvent = events[0]
    if (!firstEvent) return null

    return (
      <Box style={{ opacity: 0.8, transform: 'scale(0.95)' }}>
        <TimelineSpoilerWrapper event={firstEvent}>
          <EventContent event={firstEvent} onShowModal={onShowModal} onHideModal={onHideModal} isPreview />
        </TimelineSpoilerWrapper>
      </Box>
    )
  }

  return (
    <Stack gap="sm">
      {events.map((event) => (
        <TimelineSpoilerWrapper key={event.id} event={event}>
          <EventContent event={event} onShowModal={onShowModal} onHideModal={onHideModal} isPreview={false} />
        </TimelineSpoilerWrapper>
      ))}
    </Stack>
  )
}

function TimelineSpoilerWrapper({ event, children }: { event: TimelineEvent; children: React.ReactNode }) {
  const { shouldHideSpoiler } = useSpoilerSettings()
  const { userProgress } = useProgress()
  const shouldHide = shouldHideSpoiler(event.spoilerChapter ?? event.chapterNumber)

  if (!event.isSpoiler || !shouldHide) {
    return <>{children}</>
  }

  return (
    <Alert style={{ color: semanticColors.warning }} radius="md" title="Spoiler Warning" icon={<AlertTriangle size={18} />}>
      Reveals content beyond your current progress (Ch. {userProgress}).
    </Alert>
  )
}

function EventContent({
  event,
  isPreview,
  onShowModal,
  onHideModal
}: {
  event: TimelineEvent
  isPreview: boolean
  onShowModal: (event: TimelineEvent, targetElement: Element) => void
  onHideModal: () => void
}) {
  const theme = useMantineTheme()
  const eventRef = useRef<HTMLDivElement>(null)
  const EventTypeIcon = getEventTypeIcon(event.type)

  const handleMouseEnter = useCallback(() => {
    if (eventRef.current && !isPreview) {
      onShowModal(event, eventRef.current)
    }
  }, [event, onShowModal, isPreview])

  const handleMouseLeave = useCallback(() => {
    if (!isPreview) {
      onHideModal()
    }
  }, [onHideModal, isPreview])

  return (
    <Card
      ref={eventRef}
      id={`event-${event.id}`}
      withBorder
      radius="md"
      shadow={isPreview ? 'xs' : 'sm'}
      p={isPreview ? 'sm' : 'md'}
      style={{ cursor: isPreview ? 'default' : 'pointer' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Stack gap="xs">
        <Group justify="space-between" align="flex-start" gap="sm">
          <Group gap="xs" align="center" style={{ flex: 1, minWidth: 0 }}>
            <EventTypeIcon size={16} />
            <Text
              size={isPreview ? 'xs' : 'sm'}
              fw={600}
              c={getEventTypeColor(event.type)}
              style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            >
              {event.title}
            </Text>
          </Group>
          <Badge variant="outline" style={{ color: getEntityThemeColor(theme, 'gamble') }} radius="sm">
            Ch. {event.chapterNumber}
          </Badge>
        </Group>

        <Group gap={6} wrap="wrap">
          {event.type && (
            <Badge
              variant="filled"
              leftSection={<EventTypeIcon size={12} />}
              radius="sm"
              size="sm"
              style={{
                backgroundColor: getEventTypeColor(event.type),
                borderColor: getEventTypeColor(event.type),
                color: textColors.primary
              }}
            >
              {getEventTypeLabel(event.type)}
            </Badge>
          )}
        </Group>

        {!isPreview && event.description && (
          <Text size="xs" c="dimmed" style={{ lineHeight: 1.5 }}>
            {event.description}
          </Text>
        )}

        {!isPreview && event.characters && event.characters.length > 0 && (
          <Group gap={4} wrap="wrap">
            {event.characters.slice(0, 3).map((character, index) => (
              <Badge
                key={`${event.id}-${character}-${index}`}
                variant="outline"
                radius="sm"
                size="xs"
                style={{
                  borderColor: getEntityThemeColor(theme, 'character'),
                  color: getEntityThemeColor(theme, 'character')
                }}
              >
                {character}
              </Badge>
            ))}
            {event.characters.length > 3 && (
              <Badge variant="outline" style={{ color: getEntityThemeColor(theme, 'media') }} radius="sm" size="xs">
                +{event.characters.length - 3} more
              </Badge>
            )}
          </Group>
        )}
      </Stack>
    </Card>
  )
}
