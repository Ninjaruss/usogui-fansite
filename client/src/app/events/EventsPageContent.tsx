'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  Accordion,
  ActionIcon,
  Alert,
  Badge,
  Box,
  Button,
  Card,
  Grid,
  Group,
  Loader,
  Paper,
  Select,
  Stack,
  Text,
  TextInput,
  Title,
  rem,
  useMantineTheme
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { CalendarSearch, Eye, Calendar, Search, BookOpen, Dice6, ChevronDown, AlertCircle, X } from 'lucide-react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'motion/react'
import { useRouter, useSearchParams } from 'next/navigation'
import EnhancedSpoilerMarkdown from '../../components/EnhancedSpoilerMarkdown'
import { api } from '../../lib/api'
import type { Arc, Event } from '../../types'
import { EventStatus } from '../../types'

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
  { value: EventStatus.APPROVED, label: 'Approved' },
  { value: EventStatus.PENDING, label: 'Pending' },
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
  initialError: string
}

export default function EventsPageContent({
  initialGroupedEvents,
  initialSearch,
  initialType,
  initialStatus,
  initialError
}: EventsPageContentProps) {
  const theme = useMantineTheme()
  const accentEvent = theme.other?.usogui?.event ?? theme.colors.orange?.[6] ?? '#ea580c'
  const router = useRouter()
  const searchParams = useSearchParams()

  const [groupedEvents, setGroupedEvents] = useState(initialGroupedEvents)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(initialError)
  const [searchTerm, setSearchTerm] = useState(initialSearch)
  const [selectedType, setSelectedType] = useState(initialType)
  const [selectedStatus, setSelectedStatus] = useState(initialStatus)
  const searchDebounceRef = useRef<number | null>(null)

  // Hover modal state
  const [hoveredEvent, setHoveredEvent] = useState<Event | null>(null)
  const [hoverModalPosition, setHoverModalPosition] = useState<{ x: number; y: number } | null>(null)
  const hoverTimeoutRef = useRef<number | null>(null)
  const hoveredElementRef = useRef<HTMLElement | null>(null)

  const hasSearchQuery = searchTerm.trim().length > 0

  const updateUrl = useCallback(
    (search: string, type: string, status: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (search) params.set('search', search)
      else params.delete('search')
      if (type) params.set('type', type)
      else params.delete('type')
      if (status) params.set('status', status)
      else params.delete('status')
      const qs = params.toString()
      router.push(qs ? `/events?${qs}` : '/events', { scroll: false })
    },
    [router, searchParams]
  )

  const fetchEvents = useCallback(
    async (search: string, type: string, status: string) => {
      setLoading(true)
      try {
        if (search) {
          const params: Record<string, string | number> = { page: 1, limit: 100, title: search }
          if (type) params.type = type
          if (status) params.status = status
          const response = await api.getEvents(params)
          setGroupedEvents({
            arcs: [],
            noArc: response.data || []
          })
        } else {
          const params: Record<string, string> = {}
          if (type) params.type = type
          if (status) params.status = status
          const groupedEventsData = await api.getEventsGroupedByArc(params)
          setGroupedEvents(groupedEventsData)
        }
        setError('')
      } catch (error: unknown) {
        setError(error instanceof Error ? error.message : 'Failed to fetch events')
      } finally {
        setLoading(false)
      }
    },
    []
  )

  useEffect(() => {
    const currentSearch = searchParams.get('search') || ''
    const currentType = searchParams.get('type') || ''
    const currentStatus = searchParams.get('status') || ''

    if (currentSearch !== initialSearch || currentType !== initialType || currentStatus !== initialStatus) {
      fetchEvents(currentSearch, currentType, currentStatus)
    }
  }, [searchParams, initialSearch, initialType, initialStatus, fetchEvents])

  // Function to update modal position based on hovered element
  const updateModalPosition = useCallback((event?: Event) => {
    const currentEvent = event || hoveredEvent
    if (hoveredElementRef.current && currentEvent) {
      const rect = hoveredElementRef.current.getBoundingClientRect()
      const modalWidth = 320 // rem(320) from the modal width
      const modalHeight = 200 // Approximate modal height
      const navbarHeight = 60 // Height of the sticky navbar
      const buffer = 10 // Additional buffer space

      let x = rect.left + rect.width / 2
      let y = rect.top - modalHeight - buffer

      // Check if modal would overlap with navbar
      if (y < navbarHeight + buffer) {
        // Position below the card instead
        y = rect.bottom + buffer
      }

      // Ensure modal doesn't go off-screen horizontally
      const modalLeftEdge = x - modalWidth / 2
      const modalRightEdge = x + modalWidth / 2

      if (modalLeftEdge < buffer) {
        x = modalWidth / 2 + buffer
      } else if (modalRightEdge > window.innerWidth - buffer) {
        x = window.innerWidth - modalWidth / 2 - buffer
      }

      setHoverModalPosition({ x, y })
    }
  }, [hoveredEvent])

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        window.clearTimeout(hoverTimeoutRef.current)
      }
      if (searchDebounceRef.current) {
        window.clearTimeout(searchDebounceRef.current)
      }
    }
  }, [])

  // Add scroll and resize listeners to update modal position
  useEffect(() => {
    if (hoveredEvent && hoveredElementRef.current) {
      const handleScroll = () => {
        updateModalPosition()
      }

      const handleResize = () => {
        updateModalPosition()
      }

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

    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current)
    }

    searchDebounceRef.current = window.setTimeout(() => {
      updateUrl(value, selectedType, selectedStatus)
      fetchEvents(value, selectedType, selectedStatus)
    }, 300)
  }

  const handleClearSearch = () => {
    setSearchTerm('')
    updateUrl('', selectedType, selectedStatus)
    fetchEvents('', selectedType, selectedStatus)
  }

  const handleTypeChange = (value: string | null) => {
    const newType = value || ''
    setSelectedType(newType)
    updateUrl(searchTerm, newType, selectedStatus)
    fetchEvents(searchTerm, newType, selectedStatus)
  }

  const handleStatusChange = (value: string | null) => {
    const newStatus = value || ''
    setSelectedStatus(newStatus)
    updateUrl(searchTerm, selectedType, newStatus)
    fetchEvents(searchTerm, selectedType, newStatus)
  }

  // Hover modal handlers
  const handleEventMouseEnter = (event: Event, mouseEvent: React.MouseEvent) => {
    const element = mouseEvent.currentTarget as HTMLElement
    hoveredElementRef.current = element

    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
    }

    hoverTimeoutRef.current = window.setTimeout(() => {
      setHoveredEvent(event)
      updateModalPosition(event)
    }, 500)
  }

  const handleEventMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
    }

    hoverTimeoutRef.current = window.setTimeout(() => {
      setHoveredEvent(null)
      setHoverModalPosition(null)
      hoveredElementRef.current = null
    }, 200)
  }

  const handleModalMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
    }
  }

  const handleModalMouseLeave = () => {
    setHoveredEvent(null)
    setHoverModalPosition(null)
    hoveredElementRef.current = null
  }

  const eventTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'gamble': return 'red'
      case 'decision': return 'blue'
      case 'reveal': return 'yellow'
      case 'shift': return 'green'
      case 'resolution': return 'violet'
      default: return 'gray'
    }
  }

  const statusColor = (status: string) => {
    switch (status) {
      case EventStatus.APPROVED: return 'green'
      case EventStatus.PENDING: return 'yellow'
      case EventStatus.REJECTED: return 'red'
      default: return 'gray'
    }
  }

  const renderEventCard = (event: Event, index?: number) => (
    <motion.div
      key={event.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: (index ?? 0) * 0.05 }}
      style={{
        width: '200px',
        height: '280px' // Playing card aspect ratio: 200px * 1.4 = 280px
      }}
    >
      <Card
        withBorder
        radius="lg"
        shadow="sm"
        padding="lg"
        style={{
          width: '100%',
          height: '100%',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          position: 'relative',
          overflow: 'hidden',
        }}
        onMouseEnter={(e) => handleEventMouseEnter(event, e)}
        onMouseLeave={handleEventMouseLeave}
        component={Link}
        href={`/events/${event.id}`}
        styles={{
          root: {
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: theme.shadows.lg,
            },
          },
        }}
      >
        <Stack gap="md" h="100%">
          {/* Header */}
          <Group justify="space-between" align="flex-start">
            <Stack gap={4} style={{ flex: 1 }}>
              <Title order={4} lineClamp={2} size="md" c={accentEvent}>
                {event.title}
              </Title>
              <Group gap="xs" wrap="wrap">
                <Badge color={eventTypeColor(event.type)} variant="light" size="sm">
                  {event.type}
                </Badge>
                <Badge color="gray" variant="light" size="sm">
                  Ch. {event.chapterNumber}
                </Badge>
              </Group>
            </Stack>
            <CalendarSearch size={24} color={accentEvent} />
          </Group>

          {/* Description */}
          <Box style={{ flex: 1, overflow: 'hidden' }}>
            <Text size="sm" c="dark" lineClamp={4}>
              {event.description}
            </Text>
          </Box>

          {/* Arc/Gamble Info */}
          {(event.arc || event.gamble) && (
            <Group gap={4} align="center">
              {event.arc && (
                <>
                  <BookOpen size={14} color={accentEvent} />
                  <Text size="xs" c={accentEvent} lineClamp={1}>
                    {event.arc.name}
                  </Text>
                </>
              )}
              {event.gamble && (
                <>
                  <Dice6 size={14} color={accentEvent} />
                  <Text size="xs" c={accentEvent} lineClamp={1}>
                    {event.gamble.name}
                  </Text>
                </>
              )}
            </Group>
          )}

          {/* Footer */}
          <Group justify="space-between" align="center" mt="auto">
            <Group gap={4} align="center">
              <Eye size={14} color={accentEvent} />
              <Text size="xs" c={accentEvent}>
                Details
              </Text>
            </Group>
            <Badge color={statusColor(event.status)} variant="light" size="sm">
              {event.status}
            </Badge>
          </Group>
        </Stack>
      </Card>
    </motion.div>
  )

  if (error && !loading) {
    return (
      <Alert color="red" radius="md" icon={<AlertCircle size={16} />}>
        <Text size="sm">{error}</Text>
      </Alert>
    )
  }

  const totalEvents = groupedEvents.arcs.reduce((total, group) => total + group.events.length, 0) + groupedEvents.noArc.length

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      {/* Hero Section */}
      <Box
        style={{
          background: `linear-gradient(135deg, ${accentEvent}15, ${accentEvent}08)`,
          borderRadius: theme.radius.lg,
          border: `1px solid ${accentEvent}25`,
          marginBottom: rem(24)
        }}
        p="md"
      >
        <Stack align="center" gap="xs">
          <Box
            style={{
              background: `linear-gradient(135deg, ${accentEvent}, ${accentEvent}CC)`,
              borderRadius: '50%',
              width: rem(40),
              height: rem(40),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 4px 16px ${accentEvent}40`
            }}
          >
            <CalendarSearch size={20} color="white" />
          </Box>

          <Stack align="center" gap="xs">
            <Title order={1} size="1.5rem" fw={700} ta="center" c={accentEvent}>
              Events
            </Title>
            <Text size="md" c="dimmed" ta="center" maw={400}>
              Explore key moments in the Usogui story, organized by story arcs
            </Text>

            {totalEvents > 0 && (
              <Badge size="md" variant="light" color="orange" radius="xl" mt="xs">
                {totalEvents} event{totalEvents !== 1 ? 's' : ''} available
              </Badge>
            )}
          </Stack>
        </Stack>
      </Box>

      {/* Search and Filters */}
      <Box mb="xl">
        <Group justify="center" mb="md">
          <Box style={{ maxWidth: rem(600), width: '100%' }}>
            <TextInput
              placeholder="Search events by title..."
              value={searchTerm}
              onChange={(event) => handleSearchInput(event.currentTarget.value)}
              leftSection={<Search size={20} />}
              size="lg"
              radius="xl"
              rightSection={
                hasSearchQuery ? (
                  <ActionIcon variant="subtle" color="gray" onClick={handleClearSearch} size="sm">
                    <X size={16} />
                  </ActionIcon>
                ) : null
              }
              styles={{
                input: {
                  fontSize: rem(16),
                  paddingLeft: rem(50),
                  paddingRight: hasSearchQuery ? rem(50) : rem(20)
                }
              }}
            />
          </Box>
        </Group>

        {/* Filters */}
        <Group justify="center" gap="md">
          <Select
            placeholder="All Types"
            value={selectedType}
            onChange={handleTypeChange}
            data={eventTypeOptions}
            clearable
            size="md"
            style={{ minWidth: rem(150) }}
          />
          <Select
            placeholder="All Statuses"
            value={selectedStatus}
            onChange={handleStatusChange}
            data={eventStatusOptions}
            clearable
            size="md"
            style={{ minWidth: rem(150) }}
          />
        </Group>
      </Box>

      {/* Loading State */}
      {loading ? (
        <Box style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingBlock: rem(80) }}>
          <Loader size="xl" color={accentEvent} mb="md" />
          <Text size="lg" c="dimmed">Loading events...</Text>
        </Box>
      ) : (
        <>
          {/* Empty State */}
          {totalEvents === 0 ? (
            <Box style={{ textAlign: 'center', paddingBlock: rem(80) }}>
              <CalendarSearch size={64} color={theme.colors.gray[4]} style={{ marginBottom: rem(20) }} />
              <Title order={3} c="dimmed" mb="sm">
                No events found
              </Title>
              <Text size="lg" c="dimmed" mb="xl">
                Try adjusting your search terms or filters
              </Text>
              {(hasSearchQuery || selectedType || selectedStatus) && (
                <Button
                  variant="outline"
                  color="orange"
                  onClick={() => {
                    handleClearSearch()
                    setSelectedType('')
                    setSelectedStatus('')
                  }}
                >
                  Clear all filters
                </Button>
              )}
            </Box>
          ) : (
            <>
              {/* Results */}
              {hasSearchQuery ? (
                // Search results - flat list
                <Box
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: rem(16),
                    justifyItems: 'center'
                  }}
                >
                  {groupedEvents.noArc.map((event, index) => renderEventCard(event, index))}
                </Box>
              ) : (
                // Grouped by arcs - accordion layout
                <Stack gap="md">
                  {groupedEvents.arcs.map(({ arc, events }) => (
                    <Accordion key={arc.id} defaultValue={`arc-${arc.id}`} radius="lg">
                      <Accordion.Item
                        value={`arc-${arc.id}`}
                        style={{
                          border: `1px solid ${theme.colors.dark?.[4] ?? theme.colors.gray?.[2]}`,
                          borderRadius: theme.radius.lg
                        }}
                      >
                        <Accordion.Control
                          icon={<ChevronDown size={16} />}
                          style={{
                            padding: rem(16),
                            fontSize: rem(16),
                            fontWeight: 600
                          }}
                        >
                          <Group gap="sm" align="center">
                            <Text size="lg" fw={600} c={accentEvent}>{arc.name}</Text>
                            <Badge color="orange" variant="light" radius="xl">
                              {events.length} event{events.length !== 1 ? 's' : ''}
                            </Badge>
                          </Group>
                        </Accordion.Control>
                        <Accordion.Panel pt={0} pb="md">
                          <Box
                            style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                              gap: rem(16),
                              justifyItems: 'center'
                            }}
                          >
                            {events.map((event, index) => renderEventCard(event, index))}
                          </Box>
                        </Accordion.Panel>
                      </Accordion.Item>
                    </Accordion>
                  ))}

                  {groupedEvents.noArc.length > 0 && (
                    <Accordion defaultValue="no-arc" radius="lg">
                      <Accordion.Item
                        value="no-arc"
                        style={{
                          border: `1px solid ${theme.colors.dark?.[4] ?? theme.colors.gray?.[2]}`,
                          borderRadius: theme.radius.lg
                        }}
                      >
                        <Accordion.Control
                          icon={<ChevronDown size={16} />}
                          style={{
                            padding: rem(16),
                            fontSize: rem(16),
                            fontWeight: 600
                          }}
                        >
                          <Group gap="sm" align="center">
                            <Text size="lg" fw={600} c="dimmed">Other Events</Text>
                            <Badge color="violet" variant="light" radius="xl">
                              {groupedEvents.noArc.length} event{groupedEvents.noArc.length !== 1 ? 's' : ''}
                            </Badge>
                          </Group>
                        </Accordion.Control>
                        <Accordion.Panel pt={0} pb="md">
                          <Box
                            style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                              gap: rem(16),
                              justifyItems: 'center'
                            }}
                          >
                            {groupedEvents.noArc.map((event, index) => renderEventCard(event, index))}
                          </Box>
                        </Accordion.Panel>
                      </Accordion.Item>
                    </Accordion>
                  )}
                </Stack>
              )}
            </>
          )}
        </>
      )}

      {/* Hover Modal */}
      <AnimatePresence>
        {hoveredEvent && hoverModalPosition && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'fixed',
              left: hoverModalPosition.x - 160, // Center horizontally (320px width / 2)
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
                <Title order={4} size="md" fw={700} c={accentEvent} ta="center" lineClamp={2}>
                  {hoveredEvent.title}
                </Title>

                <Group justify="center" gap="xs" wrap="wrap">
                  <Badge variant="light" color={eventTypeColor(hoveredEvent.type)} size="sm">
                    {hoveredEvent.type}
                  </Badge>
                  <Badge variant="outline" color="gray" size="sm">
                    Ch. {hoveredEvent.chapterNumber}
                  </Badge>
                  {hoveredEvent.arc && (
                    <Badge variant="outline" color="blue" size="sm">
                      {hoveredEvent.arc.name}
                    </Badge>
                  )}
                </Group>

                <Text size="sm" c="dimmed" ta="center" lineClamp={3} style={{ lineHeight: 1.4 }}>
                  {hoveredEvent.description}
                </Text>

                <Group justify="center">
                  <Badge color={statusColor(hoveredEvent.status)} variant="light" size="sm">
                    {hoveredEvent.status}
                  </Badge>
                </Group>
              </Stack>
            </Paper>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}