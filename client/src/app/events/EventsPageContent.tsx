'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Accordion,
  Badge,
  Box,
  Card,
  Group,
  Paper,
  Select,
  Stack,
  Text,
  Title,
  rem,
  useMantineTheme
} from '@mantine/core'
import { getEntityThemeColor, backgroundStyles } from '../../lib/mantine-theme'
import { ActiveFilterBadge, ActiveFilterBadgeRow } from '../../components/layouts/ActiveFilterBadge'
import { CalendarSearch } from 'lucide-react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'motion/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useProgress } from '../../providers/ProgressProvider'
import { useSpoilerSettings } from '../../hooks/useSpoilerSettings'
import { api } from '../../lib/api'
import { usePaged } from '../../hooks/usePagedCache'
import type { Arc, Event } from '../../types'
import { EventStatus } from '../../types'
import { ListPageLayout } from '../../components/layouts/ListPageLayout'
import TimelineSpoilerWrapper from '../../components/TimelineSpoilerWrapper'

const eventTypeOptions = [
  { value: '', label: 'All Types' },
  { value: 'gamble', label: 'Gamble' },
  { value: 'decision', label: 'Decision' },
  { value: 'reveal', label: 'Reveal' },
  { value: 'shift', label: 'Shift' },
  { value: 'resolution', label: 'Resolution' }
]

const eventStatusOptions = [
  { value: '', label: 'All Statuses' },
  { value: EventStatus.APPROVED, label: 'Verified' },
  { value: EventStatus.PENDING, label: 'Unverified' },
  { value: EventStatus.REJECTED, label: 'Rejected' }
]

interface EventsPageContentProps {
  initialGroupedEvents: {
    arcs: Array<{ arc: Arc; events: Event[] }>
    noArc: Event[]
  }
  initialSearch: string
  initialType: string
  initialStatus: string
  initialCharacter: string
  initialError: string
}

type EventGroup = { arc: Arc | null; events: Event[] }


export default function EventsPageContent({
  initialGroupedEvents,
  initialSearch,
  initialType,
  initialStatus,
  initialCharacter,
  initialError
}: EventsPageContentProps) {
  const theme = useMantineTheme()
  const accentEvent = theme.other?.usogui?.event ?? theme.colors.orange?.[6] ?? '#ea580c'
  const router = useRouter()
  const searchParams = useSearchParams()

  const { userProgress } = useProgress()
  const { settings } = useSpoilerSettings()

  const [groupedEvents, setGroupedEvents] = useState(initialGroupedEvents)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(initialError)
  const [searchTerm, setSearchTerm] = useState(initialSearch)
  const [selectedType, setSelectedType] = useState(initialType)
  const [selectedStatus, setSelectedStatus] = useState(initialStatus)
  const [selectedCharacter, setSelectedCharacter] = useState(initialCharacter)
  const searchDebounceRef = useRef<number | null>(null)

  const [revealedEvents, setRevealedEvents] = useState<Set<number>>(new Set())
  const revealedEventsRef = useRef<Set<number>>(new Set())

  // Hover modal state
  const [hoveredEvent, setHoveredEvent] = useState<Event | null>(null)
  const [hoverModalPosition, setHoverModalPosition] = useState<{ x: number; y: number } | null>(null)
  const hoverTimeoutRef = useRef<number | null>(null)
  const hoveredElementRef = useRef<HTMLElement | null>(null)

  const hasSearchQuery = searchTerm.trim().length > 0
  const hasAnyFilter = Boolean(searchTerm.trim() || selectedType || selectedStatus || selectedCharacter)

  const shouldHideEventSpoiler = (event: Event) => {
    if (settings.showAllSpoilers) return false
    const chapterNumber = event.spoilerChapter || event.chapterNumber
    if (!chapterNumber) return false
    const effectiveProgress = settings.chapterTolerance > 0 ? settings.chapterTolerance : userProgress
    if (effectiveProgress === 0) return false
    return chapterNumber > effectiveProgress
  }

  const updateUrl = useCallback(
    (search: string, type: string, status: string, character: string) => {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (type) params.set('type', type)
      if (status) params.set('status', status)
      if (character) params.set('character', character)
      const qs = params.toString()
      router.push(qs ? `/events?${qs}` : '/events', { scroll: false })
    },
    [router]
  )

  const fetcher = useCallback(async () => {
    if (searchTerm) {
      const params: Record<string, string | number> = { page: 1, limit: 100, title: searchTerm }
      if (selectedStatus) params.status = selectedStatus
      if (selectedType) params.type = selectedType
      if (selectedCharacter) params.character = selectedCharacter
      const resAny = await api.getEvents(params)
      const payload = { arcs: [], noArc: resAny.data || [] }
      return { data: payload, total: resAny.total ?? (resAny.data ? resAny.data.length : 0), page: 1, perPage: 100, totalPages: 1 } as any
    }

    const params: Record<string, string> = {}
    if (selectedStatus) params.status = selectedStatus
    if (selectedType) params.type = selectedType
    if (selectedCharacter) params.character = selectedCharacter
    const grouped = await api.getEventsGroupedByArc(params)
    const total = grouped.arcs.reduce((sum: number, g: any) => sum + (g.events?.length || 0), 0) + (grouped.noArc?.length || 0)
    return { data: grouped, total, page: 1, perPage: total || 1, totalPages: 1 } as any
  }, [searchTerm, selectedType, selectedStatus, selectedCharacter])

  const { data: pageData, loading: pageLoading, error: pageError } = usePaged(
    'events', 1, fetcher,
    { search: searchTerm, type: selectedType, status: selectedStatus, character: selectedCharacter },
    { ttlMs: 120_000, persist: true, maxEntries: 100 }
  )

  useEffect(() => {
    if (pageData) {
      setGroupedEvents(pageData.data as any)
      setError('')
    }
    setLoading(!!pageLoading)
    if (pageError) setError(pageError instanceof Error ? pageError.message : String(pageError))
  }, [pageData, pageLoading, pageError])

  const updateModalPosition = useCallback((event?: Event) => {
    const currentEvent = event || hoveredEvent
    if (hoveredElementRef.current && currentEvent) {
      const rect = hoveredElementRef.current.getBoundingClientRect()
      const modalWidth = 320
      const modalHeight = 200
      const navbarHeight = 60
      const buffer = 10

      let x = rect.left + rect.width / 2
      let y = rect.top - modalHeight - buffer

      if (y < navbarHeight + buffer) y = rect.bottom + buffer

      const modalLeftEdge = x - modalWidth / 2
      const modalRightEdge = x + modalWidth / 2
      if (modalLeftEdge < buffer) x = modalWidth / 2 + buffer
      else if (modalRightEdge > window.innerWidth - buffer) x = window.innerWidth - modalWidth / 2 - buffer

      setHoverModalPosition({ x, y })
    }
  }, [hoveredEvent])

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) window.clearTimeout(hoverTimeoutRef.current)
      if (searchDebounceRef.current) window.clearTimeout(searchDebounceRef.current)
    }
  }, [])

  useEffect(() => {
    if (hoveredEvent && hoveredElementRef.current) {
      const handleScroll = () => updateModalPosition()
      const handleResize = () => updateModalPosition()
      window.addEventListener('scroll', handleScroll)
      document.addEventListener('scroll', handleScroll)
      window.addEventListener('resize', handleResize)
      return () => {
        window.removeEventListener('scroll', handleScroll)
        document.removeEventListener('scroll', handleScroll)
        window.removeEventListener('resize', handleResize)
      }
    }
  }, [hoveredEvent, updateModalPosition])

  const handleSearchInput = (value: string) => {
    setSearchTerm(value)
    if (value.trim() === '' && searchTerm.trim() !== '') {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
      updateUrl('', selectedType, selectedStatus, selectedCharacter)
      return
    }
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
    searchDebounceRef.current = window.setTimeout(() => {
      updateUrl(value, selectedType, selectedStatus, selectedCharacter)
    }, 300)
  }

  const handleClearAll = useCallback(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
    setSearchTerm('')
    setSelectedType('')
    setSelectedStatus('')
    setSelectedCharacter('')
    updateUrl('', '', '', '')
  }, [updateUrl])

  const handleTypeChange = (value: string | null) => {
    const newType = value || ''
    setSelectedType(newType)
    updateUrl(searchTerm, newType, selectedStatus, selectedCharacter)
  }

  const handleStatusChange = (value: string | null) => {
    const newStatus = value || ''
    setSelectedStatus(newStatus)
    updateUrl(searchTerm, selectedType, newStatus, selectedCharacter)
  }

  const handleEventMouseEnter = (event: Event, mouseEvent: React.MouseEvent) => {
    const isSpoilered = shouldHideEventSpoiler(event)
    const hasBeenRevealed = revealedEventsRef.current.has(event.id)
    if (isSpoilered && !hasBeenRevealed) return

    const element = mouseEvent.currentTarget as HTMLElement
    hoveredElementRef.current = element
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current)
    hoverTimeoutRef.current = window.setTimeout(() => {
      setHoveredEvent(event)
      updateModalPosition(event)
    }, 500)
  }

  const handleEventMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current)
    hoverTimeoutRef.current = window.setTimeout(() => {
      setHoveredEvent(null)
      setHoverModalPosition(null)
      hoveredElementRef.current = null
    }, 200)
  }

  const handleModalMouseEnter = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current)
  }

  const handleModalMouseLeave = () => {
    setHoveredEvent(null)
    setHoverModalPosition(null)
    hoveredElementRef.current = null
  }

  const eventTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'gamble': return '#e74c3c'
      case 'decision': return '#3498db'
      case 'reveal': return '#f39c12'
      case 'shift': return '#9b59b6'
      case 'resolution': return '#27ae60'
      default: return getEntityThemeColor(theme, 'event')
    }
  }

  const statusColor = (status: string) => {
    switch (status) {
      case EventStatus.APPROVED: return '#51cf66'
      case EventStatus.PENDING: return '#ffd43b'
      case EventStatus.REJECTED: return '#ff6b6b'
      default: return '#adb5bd'
    }
  }

  const renderEventCard = (event: Event, index?: number) => (
    <motion.div
      key={event.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: (index ?? 0) * 0.05 }}
      style={{ width: '200px', height: '100px' }}
    >
      <Card
        withBorder
        radius="lg"
        shadow="sm"
        padding="xs"
        className="hoverable-card hoverable-card-event"
        style={{ width: '100%', height: '100%', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
        onMouseEnter={(e) => handleEventMouseEnter(event, e)}
        onMouseLeave={handleEventMouseLeave}
        component={Link}
        href={`/events/${event.id}`}
      >
        <TimelineSpoilerWrapper
          chapterNumber={event.spoilerChapter || event.chapterNumber}
          onReveal={() => {
            revealedEventsRef.current = new Set(revealedEventsRef.current).add(event.id)
            setRevealedEvents(new Set(revealedEventsRef.current))
          }}
          style={{ height: '100%' }}
        >
          <Stack gap={6} h="100%" justify="center" align="center">
            <Title order={3} lineClamp={1} size="lg" c={accentEvent} style={{ lineHeight: 1.2, textAlign: 'center', width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {event.title}
            </Title>
            <Group gap={8} justify="center" align="center">
              <Badge c={eventTypeColor(event.type)} variant="light" size="sm" style={{ backgroundColor: `${eventTypeColor(event.type)}20`, borderColor: eventTypeColor(event.type) }}>
                {event.type}
              </Badge>
              <Badge c={getEntityThemeColor(theme, 'organization')} variant="light" size="sm" style={{ backgroundColor: `${getEntityThemeColor(theme, 'organization')}20`, borderColor: getEntityThemeColor(theme, 'organization') }}>
                Ch. {event.chapterNumber}
              </Badge>
            </Group>
          </Stack>
        </TimelineSpoilerWrapper>
      </Card>
    </motion.div>
  )

  const renderEventGroup = useCallback((group: EventGroup) => {
    if (hasSearchQuery) {
      return (
        <Box px="md" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: rem(20), justifyItems: 'center' }}>
          {group.events.map((event, index) => renderEventCard(event, index))}
        </Box>
      )
    }

    const arcId = group.arc?.id
    const accordionValue = arcId ? `arc-${arcId}` : 'no-arc'
    const badgeAccent = group.arc
      ? getEntityThemeColor(theme, 'event')
      : getEntityThemeColor(theme, 'media')

    return (
      <Accordion
        defaultValue={accordionValue}
        radius="lg"
        styles={{
          control: {
            backgroundColor: theme.colors.dark?.[7] ?? theme.white,
            '&:hover': { backgroundColor: theme.colors.dark?.[6] ?? theme.colors.gray?.[0] }
          }
        }}
      >
        <Accordion.Item
          value={accordionValue}
          style={{ border: `1px solid ${theme.colors.dark?.[4] ?? theme.colors.gray?.[3]}`, borderRadius: theme.radius.lg }}
        >
          <Accordion.Control style={{ padding: rem(16), fontSize: rem(16), fontWeight: 600, borderLeft: '3px solid currentColor', paddingLeft: 12 }}>
            <Group gap="sm" align="center">
              {group.arc ? (
                <Text size="xl" fw={600} c={accentEvent}>{group.arc.name}</Text>
              ) : (
                <Text size="xl" fw={600} style={{ color: theme.colors.gray[6] }}>Other Events</Text>
              )}
              <Badge c={badgeAccent} variant="light" radius="xl" style={{ backgroundColor: `${badgeAccent}20`, borderColor: badgeAccent }}>
                {group.events.length} event{group.events.length !== 1 ? 's' : ''}
              </Badge>
            </Group>
          </Accordion.Control>
          <Accordion.Panel pt="md" pb="md">
            <Box px="md" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: rem(16), justifyItems: 'center' }}>
              {group.events.map((event, index) => renderEventCard(event, index))}
            </Box>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>
    )
  }, [hasSearchQuery, theme, accentEvent])

  const items = useMemo((): EventGroup[] => {
    if (hasSearchQuery) {
      return groupedEvents.noArc.length > 0
        ? [{ arc: null, events: groupedEvents.noArc }]
        : []
    }
    const result: EventGroup[] = groupedEvents.arcs.map(g => ({ arc: g.arc, events: g.events }))
    if (groupedEvents.noArc.length > 0) {
      result.push({ arc: null, events: groupedEvents.noArc })
    }
    return result
  }, [groupedEvents, hasSearchQuery])

  const totalEvents = useMemo(
    () => groupedEvents.arcs.reduce((sum, g) => sum + g.events.length, 0) + groupedEvents.noArc.length,
    [groupedEvents]
  )

  return (
    <ListPageLayout
      entityType="event"
      icon={<CalendarSearch size={24} color="white" />}
      title="Events"
      subtitle="Explore key moments in the Usogui story, organized by story arcs"
      items={items}
      total={totalEvents}
      totalPages={1}
      currentPage={1}
      pageSize={totalEvents || 1}
      loading={loading}
      error={error}
      searchPlaceholder="Search events by title..."
      searchInput={searchTerm}
      onSearchChange={(e) => handleSearchInput(e.currentTarget.value)}
      onClearSearch={handleClearAll}
      hasActiveFilters={hasAnyFilter}
      sortOptions={[{ value: 'arc', label: 'By Arc' }]}
      sortValue="arc"
      onSortChange={() => {}}
      renderCard={renderEventGroup}
      getKey={(group) => group.arc?.id ?? 'no-arc'}
      gridLayout="list"
      skeletonCardWidth={280}
      skeletonCardHeight={100}
      onPageChange={() => {}}
      entityNamePlural="events"
      emptyIcon={<CalendarSearch size={48} />}
      filterSlot={
        <Group gap="sm" wrap="wrap">
          <Select
            placeholder="All Types"
            value={selectedType}
            onChange={handleTypeChange}
            data={eventTypeOptions}
            clearable
            size="md"
            style={{ minWidth: rem(140), flex: '1 1 140px' }}
            styles={{
              input: {
                backgroundColor: 'rgba(15, 10, 10, 0.65)',
                border: `1px solid ${accentEvent}35`,
                backdropFilter: 'blur(8px)',
                fontSize: rem(14),
                '&:focus': { borderColor: accentEvent }
              }
            }}
          />
          <Select
            placeholder="All Statuses"
            value={selectedStatus}
            onChange={handleStatusChange}
            data={eventStatusOptions}
            clearable
            size="md"
            style={{ minWidth: rem(140), flex: '1 1 140px' }}
            styles={{
              input: {
                backgroundColor: 'rgba(15, 10, 10, 0.65)',
                border: `1px solid ${accentEvent}35`,
                backdropFilter: 'blur(8px)',
                fontSize: rem(14),
                '&:focus': { borderColor: accentEvent }
              }
            }}
          />
        </Group>
      }
      activeFilterBadges={
        selectedCharacter ? (
          <ActiveFilterBadgeRow>
            <ActiveFilterBadge
              label="Character"
              value={selectedCharacter}
              onClear={() => {
                setSelectedCharacter('')
                updateUrl(searchTerm, selectedType, selectedStatus, '')
              }}
              accentColor={accentEvent}
            />
          </ActiveFilterBadgeRow>
        ) : undefined
      }
      hoverModal={
        <AnimatePresence>
          {hoveredEvent && hoverModalPosition && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              style={{
                position: 'fixed',
                left: hoverModalPosition.x - 160,
                top: hoverModalPosition.y,
                zIndex: 1001,
                pointerEvents: 'auto'
              }}
              onMouseEnter={handleModalMouseEnter}
              onMouseLeave={handleModalMouseLeave}
            >
              <Paper
                shadow="xl"
                radius="lg"
                p="md"
                style={{
                  backgroundColor: theme.colors.dark?.[7] ?? theme.white,
                  border: `2px solid ${accentEvent}`,
                  backdropFilter: 'blur(10px)',
                  width: rem(320),
                  maxWidth: '90vw'
                }}
              >
                <Stack gap="sm">
                  <Text className="eyebrow-label" style={{ color: 'rgba(255,255,255,0.45)', marginBottom: 4 }}>
                    Story Event
                  </Text>
                  <Title order={4} size="md" c={accentEvent} ta="center" lineClamp={2} style={{ fontFamily: 'var(--font-opti-goudy-text), serif', fontWeight: 400, fontSize: '1.3rem' }}>
                    {hoveredEvent.title}
                  </Title>
                  <Group justify="center" gap="xs" wrap="wrap">
                    <Badge c={eventTypeColor(hoveredEvent.type)} variant="light" size="sm" style={{ backgroundColor: `${eventTypeColor(hoveredEvent.type)}20`, borderColor: eventTypeColor(hoveredEvent.type) }}>
                      {hoveredEvent.type}
                    </Badge>
                    <Badge c={getEntityThemeColor(theme, 'organization')} variant="outline" size="sm" style={{ borderColor: getEntityThemeColor(theme, 'organization') }}>
                      Ch. {hoveredEvent.chapterNumber}
                    </Badge>
                    {hoveredEvent.arc && (
                      <Badge c={getEntityThemeColor(theme, 'character')} variant="outline" size="sm" style={{ borderColor: getEntityThemeColor(theme, 'character') }}>
                        {hoveredEvent.arc.name}
                      </Badge>
                    )}
                  </Group>
                  <Text size="sm" ta="center" lineClamp={3} style={{ color: theme.colors.gray[6], lineHeight: 1.4 }}>
                    {hoveredEvent.description}
                  </Text>
                  <Group justify="center">
                    <Badge c={statusColor(hoveredEvent.status)} variant="light" size="sm" style={{ backgroundColor: `${statusColor(hoveredEvent.status)}20`, borderColor: statusColor(hoveredEvent.status) }}>
                      {hoveredEvent.status === 'pending' ? 'Unverified' : hoveredEvent.status === 'approved' ? 'Verified' : hoveredEvent.status}
                    </Badge>
                  </Group>
                </Stack>
              </Paper>
            </motion.div>
          )}
        </AnimatePresence>
      }

    />
  )
}
