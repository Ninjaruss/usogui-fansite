'use client'

import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
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
  useMantineTheme
} from '@mantine/core'
import { getEntityThemeColor, textColors, getAlphaColor, backgroundStyles } from '../lib/mantine-theme'
import { getEventColorKey, getEventColorHex, getEventLabel, getEventIcon } from '../lib/timeline-constants'
import { BookOpen, Calendar, ChevronDown, ChevronUp, Users, AlertTriangle } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
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

const ArcTimeline = React.memo(function ArcTimeline({ events, arcName, startChapter, endChapter }: ArcTimelineProps) {
  const theme = useMantineTheme()
  const [selectedEventTypes, setSelectedEventTypes] = useState<Set<string>>(new Set())
  const [selectedCharacters, setSelectedCharacters] = useState<Set<string>>(new Set())
  const [showAllEvents, setShowAllEvents] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
  const timelineRef = useRef<HTMLDivElement>(null)
  const hideTimeoutRef = useRef<number | null>(null)
  const hoveredElementRef = useRef<Element | null>(null)
  const [globalModal, setGlobalModal] = useState<{ show: boolean; event: TimelineEvent | null; position: { x: number; y: number }; positionBelow: boolean }>(
    { show: false, event: null, position: { x: 0, y: 0 }, positionBelow: false }
  )

  // Update modal position on scroll/resize
  const updateModalPosition = useCallback(() => {
    if (!hoveredElementRef.current || !globalModal.event) return

    const rect = hoveredElementRef.current.getBoundingClientRect()
    const modalWidth = 260
    const estimatedModalHeight = 140 // Reduced estimate for tighter positioning
    const arrowHeight = 8
    const navbarHeight = 60

    let x = rect.left + rect.width / 2
    // Position modal above with minimal gap (just arrow height)
    let y = rect.top - estimatedModalHeight - arrowHeight
    let positionBelow = false

    // Check if modal would overlap with navbar - position below instead
    if (y < navbarHeight) {
      y = rect.bottom + arrowHeight
      positionBelow = true
    }

    // Ensure modal doesn't go off-screen horizontally
    const modalLeftEdge = x - modalWidth / 2
    const modalRightEdge = x + modalWidth / 2
    const buffer = 10

    if (modalLeftEdge < buffer) {
      x = modalWidth / 2 + buffer
    } else if (modalRightEdge > window.innerWidth - buffer) {
      x = window.innerWidth - modalWidth / 2 - buffer
    }

    setGlobalModal(prev => ({ ...prev, position: { x, y }, positionBelow }))
  }, [globalModal.event])

  // Listen for scroll and resize to update modal position
  useEffect(() => {
    if (globalModal.show && globalModal.event) {
      window.addEventListener('scroll', updateModalPosition, true)
      window.addEventListener('resize', updateModalPosition)
      return () => {
        window.removeEventListener('scroll', updateModalPosition, true)
        window.removeEventListener('resize', updateModalPosition)
      }
    }
  }, [globalModal.show, globalModal.event, updateModalPosition])

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
    // Clear any pending hide timeout
    if (hideTimeoutRef.current) {
      window.clearTimeout(hideTimeoutRef.current)
      hideTimeoutRef.current = null
    }

    // Store element reference for position updates
    hoveredElementRef.current = targetElement

    const rect = targetElement.getBoundingClientRect()
    const modalWidth = 260
    const estimatedModalHeight = 140 // Reduced for tighter positioning
    const arrowHeight = 8
    const navbarHeight = 60

    // Center horizontally on the card
    let x = rect.left + rect.width / 2
    // Position modal above with minimal gap
    let y = rect.top - estimatedModalHeight - arrowHeight
    let positionBelow = false

    // Check if modal would overlap with navbar - position below instead
    if (y < navbarHeight) {
      y = rect.bottom + arrowHeight
      positionBelow = true
    }

    // Ensure modal doesn't go off-screen horizontally
    const modalLeftEdge = x - modalWidth / 2
    const modalRightEdge = x + modalWidth / 2
    const buffer = 10

    if (modalLeftEdge < buffer) {
      x = modalWidth / 2 + buffer
    } else if (modalRightEdge > window.innerWidth - buffer) {
      x = window.innerWidth - modalWidth / 2 - buffer
    }

    setGlobalModal({ show: true, event, position: { x, y }, positionBelow })
  }, [])

  const hideEventModal = useCallback(() => {
    // Use a small delay to allow moving to the modal
    hideTimeoutRef.current = window.setTimeout(() => {
      setGlobalModal({ show: false, event: null, position: { x: 0, y: 0 }, positionBelow: false })
      hoveredElementRef.current = null
    }, 150)
  }, [])

  const handleModalMouseEnter = useCallback(() => {
    // Clear hide timeout when entering the modal
    if (hideTimeoutRef.current) {
      window.clearTimeout(hideTimeoutRef.current)
      hideTimeoutRef.current = null
    }
  }, [])

  const handleModalMouseLeave = useCallback(() => {
    // Hide immediately when leaving the modal
    if (hideTimeoutRef.current) {
      window.clearTimeout(hideTimeoutRef.current)
    }
    setGlobalModal({ show: false, event: null, position: { x: 0, y: 0 }, positionBelow: false })
    hoveredElementRef.current = null
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
                    const Icon = getEventIcon(eventType)
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
                          backgroundColor: isSelected ? getEventColorHex(eventType) : 'transparent',
                          borderColor: getEventColorHex(eventType),
                          color: isSelected ? textColors.primary : getEventColorHex(eventType)
                        }}
                      >
                        {getEventLabel(eventType)}
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

        {/* Render modal in portal to avoid CSS containment issues */}
        {typeof document !== 'undefined' && createPortal(
          <AnimatePresence>
            {globalModal.show && globalModal.event && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.15 }}
                onMouseEnter={handleModalMouseEnter}
                onMouseLeave={handleModalMouseLeave}
                style={{
                  position: 'fixed',
                  left: globalModal.position.x,
                  top: globalModal.position.y,
                  transform: 'translateX(-50%)',
                  zIndex: 999999,
                  width: rem(260),
                  maxWidth: 'calc(100vw - 40px)',
                  pointerEvents: 'auto'
                }}
              >
                {/* Pointer arrow - positioned based on modal placement */}
                <Box
                  style={{
                    position: 'absolute',
                    ...(globalModal.positionBelow
                      ? {
                          top: rem(-8),
                          left: '50%',
                          transform: 'translateX(-50%)',
                          borderLeft: '8px solid transparent',
                          borderRight: '8px solid transparent',
                          borderBottom: `8px solid ${getEventColorHex(globalModal.event.type)}`
                        }
                      : {
                          bottom: rem(-8),
                          left: '50%',
                          transform: 'translateX(-50%)',
                          borderLeft: '8px solid transparent',
                          borderRight: '8px solid transparent',
                          borderTop: `8px solid ${getEventColorHex(globalModal.event.type)}`
                        }),
                    width: 0,
                    height: 0,
                    zIndex: 1
                  }}
                />
                <Card
                  withBorder
                  radius="md"
                  shadow="xl"
                  p="sm"
                  style={{
                    backgroundColor: backgroundStyles.modal,
                    border: `2px solid ${getEventColorHex(globalModal.event.type)}`,
                    backdropFilter: 'blur(10px)'
                  }}
                >
                  <Stack gap="xs">
                    <Text fw={600} size="sm" style={{ userSelect: 'text' }}>{globalModal.event.title}</Text>
                    <Group gap={6}>
                      <Badge variant="outline" size="xs" style={{ color: getEntityThemeColor(theme, 'gamble') }} radius="sm">
                        Chapter {globalModal.event.chapterNumber}
                      </Badge>
                      {globalModal.event.type && (() => {
                        const EventIcon = getEventIcon(globalModal.event.type)
                        return (
                          <Badge
                            variant="filled"
                            radius="sm"
                            size="xs"
                            leftSection={<EventIcon size={10} />}
                            style={{
                              backgroundColor: getEventColorHex(globalModal.event.type),
                              color: textColors.primary
                            }}
                          >
                            {getEventLabel(globalModal.event.type)}
                          </Badge>
                        )
                      })()}
                    </Group>
                    {globalModal.event.description && (
                      <Text size="xs" c="dimmed" style={{ userSelect: 'text', lineHeight: 1.4 }}>
                        {globalModal.event.description}
                      </Text>
                    )}
                    {globalModal.event.characters && globalModal.event.characters.length > 0 && (
                      <Group gap={4} wrap="wrap">
                        {globalModal.event.characters.slice(0, 4).map((character, index) => (
                          <Badge
                            key={`modal-${globalModal.event!.id}-${character}-${index}`}
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
                        {globalModal.event.characters.length > 4 && (
                          <Badge variant="outline" style={{ color: getEntityThemeColor(theme, 'media') }} radius="sm" size="xs">
                            +{globalModal.event.characters.length - 4} more
                          </Badge>
                        )}
                      </Group>
                    )}
                  </Stack>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
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
  const hiddenCount = section.events.length - 1

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
          marginBottom: rem(8),
          border: isExpanded ? `2px solid ${getEntityThemeColor(theme, 'arc')}` : undefined,
          transition: 'all 150ms ease'
        }}
        onClick={() => toggleSectionExpansion(section.sectionType)}
      >
        <Stack gap="xs">
          <Group justify="space-between" align="flex-start">
            <Text fw={600} size="sm" style={{ color: getEntityThemeColor(theme, 'arc'), flex: 1, minWidth: 0 }} lineClamp={1}>
              {section.events[0]?.title || section.sectionName}
            </Text>
            <Badge variant="outline" style={{ color: getEntityThemeColor(theme, 'gamble'), flexShrink: 0 }} radius="sm">
              {section.events.length} events
            </Badge>
          </Group>
          {section.earliestChapter && section.latestChapter && (
            <Text size="xs" c="dimmed">
              Chapters {section.earliestChapter}-{section.latestChapter}
            </Text>
          )}
          <Group justify="center" gap="xs">
            {isExpanded ? (
              <>
                <ChevronUp size={16} />
                <Text size="xs" c="dimmed">Click to collapse</Text>
              </>
            ) : (
              <>
                <ChevronDown size={16} />
                <Text size="xs" c="dimmed">
                  {hiddenCount > 0 ? `Click to expand (+${hiddenCount} more)` : 'Click to expand'}
                </Text>
              </>
            )}
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
  const [revealed, setRevealed] = useState(false)
  const { settings } = useSpoilerSettings()
  const { userProgress } = useProgress()
  const theme = useMantineTheme()

  const effectiveProgress = settings.chapterTolerance > 0 ? settings.chapterTolerance : userProgress
  const chapterNumber = event.chapterNumber
  const spoilerChapter = event.spoilerChapter ?? chapterNumber

  // Hide events that are ahead of user's progress (no explicit isSpoiler flag needed)
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
            <Text size="xs" c="rgba(255,255,255,0.9)">
              Click to reveal
            </Text>
          </Stack>
        </Card>
      </Tooltip>
    </Box>
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
  const EventTypeIcon = getEventIcon(event.type)

  const handleMouseEnter = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isPreview) {
      // Use first child element (the Card) for accurate positioning
      const cardElement = e.currentTarget.firstElementChild || e.currentTarget
      onShowModal(event, cardElement)
    }
  }, [event, onShowModal, isPreview])

  const handleMouseLeave = useCallback(() => {
    if (!isPreview) {
      onHideModal()
    }
  }, [onHideModal, isPreview])

  return (
    <div
      id={`event-${event.id}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ cursor: isPreview ? 'default' : 'pointer', width: '100%' }}
    >
      <Card
        data-event-card
        withBorder
        radius="sm"
        shadow={isPreview ? 'xs' : 'sm'}
        p="xs"
      >
        <Group justify="space-between" align="center" gap="xs" wrap="nowrap">
          <Group gap={6} align="center" style={{ flex: 1, minWidth: 0 }}>
            <Box
              style={{
                width: rem(24),
                height: rem(24),
                borderRadius: '50%',
                background: getEventColorHex(event.type),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                color: '#fff'
              }}
            >
              <EventTypeIcon size={12} />
            </Box>
            <Text
              size="xs"
              fw={600}
              style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            >
              {event.title}
            </Text>
          </Group>
          <Badge variant="outline" size="xs" style={{ color: getEntityThemeColor(theme, 'gamble'), flexShrink: 0 }} radius="sm">
            Ch. {event.chapterNumber}
          </Badge>
        </Group>
      </Card>
    </div>
  )
}
