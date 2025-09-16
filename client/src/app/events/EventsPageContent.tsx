'use client'

import React, { useState, useEffect } from 'react'
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Box,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material'
import { CalendarSearch, Eye, Calendar, Search, BookOpen, Dice6, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'motion/react'
import { useRouter, useSearchParams } from 'next/navigation'
import EnhancedSpoilerMarkdown from '../../components/EnhancedSpoilerMarkdown'
import { api } from '../../lib/api'
import type { Event, Arc } from '../../types'
import { EventStatus } from '../../types'

const eventTypes = [
  { value: '', label: 'All Types' },
  { value: 'gamble', label: 'Gamble' },
  { value: 'decision', label: 'Decision' },
  { value: 'reveal', label: 'Reveal' },
  { value: 'shift', label: 'Shift' },
  { value: 'resolution', label: 'Resolution' }
]

const eventStatuses = [
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
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [groupedEvents, setGroupedEvents] = useState(initialGroupedEvents)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(initialError)
  const [searchTerm, setSearchTerm] = useState(initialSearch)
  const [selectedType, setSelectedType] = useState(initialType)
  const [selectedStatus, setSelectedStatus] = useState(initialStatus)

  const updateURL = (search: string, type: string, status: string) => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (type) params.set('type', type)
    if (status) params.set('status', status)
    
    const queryString = params.toString()
    router.push(`/events${queryString ? `?${queryString}` : ''}`)
  }

  const fetchEvents = async (search: string, type: string, status: string) => {
    try {
      setLoading(true)
      setError('')
      
      if (search) {
        // Fall back to regular search when searching
        const params: Record<string, string | number> = { page: 1, limit: 100, title: search }
        if (type) params.type = type
        if (status) params.status = status
        
        const response = await api.getEvents(params)
        setGroupedEvents({
          arcs: [],
          noArc: response.data
        })
      } else {
        // Use grouped endpoint when not searching
        const params: Record<string, string> = {}
        if (type) params.type = type
        if (status) params.status = status
        
        const response = await api.getEventsGroupedByArc(params)
        setGroupedEvents(response)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch events')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    setSearchTerm(value)
  }

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    updateURL(searchTerm, selectedType, selectedStatus)
    fetchEvents(searchTerm, selectedType, selectedStatus)
  }

  const handleTypeChange = (event: SelectChangeEvent) => {
    const value = event.target.value
    setSelectedType(value)
    updateURL(searchTerm, value, selectedStatus)
    fetchEvents(searchTerm, value, selectedStatus)
  }

  const handleStatusChange = (event: SelectChangeEvent) => {
    const value = event.target.value
    setSelectedStatus(value)
    updateURL(searchTerm, selectedType, value)
    fetchEvents(searchTerm, selectedType, value)
  }

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'gamble': return 'error'
      case 'decision': return 'warning'
      case 'reveal': return 'info'
      case 'shift': return 'secondary'
      case 'resolution': return 'success'
      default: return 'default'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case EventStatus.APPROVED: return 'success'
      case EventStatus.PENDING: return 'warning'
      case EventStatus.REJECTED: return 'error'
      default: return 'default'
    }
  }

  const renderEvent = (event: Event) => (
    <Grid item xs={12} sm={6} md={4} key={event.id}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Card 
          className="gambling-card"
          sx={{ 
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
            '&:hover': { 
              transform: 'translateY(-4px)',
              boxShadow: 6
            }
          }}
        >
          <CardContent sx={{ flexGrow: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Typography variant="h6" component="h3" sx={{ flexGrow: 1, mr: 1 }}>
                {event.title}
              </Typography>
              <Chip
                size="small"
                label={event.type}
                color={getEventTypeColor(event.type) as any}
                sx={{ minWidth: 'fit-content' }}
              />
            </Box>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
              <Chip
                icon={<Calendar size={14} />}
                label={`Ch. ${event.chapterNumber}`}
                size="small"
                variant="outlined"
              />
              {event.arc && (
                <Chip
                  icon={<BookOpen size={14} />}
                  label={event.arc.name}
                  size="small"
                  variant="outlined"
                />
              )}
              {event.gamble && (
                <Chip
                  icon={<Dice6 size={14} />}
                  label={event.gamble.name}
                  size="small"
                  variant="outlined"
                />
              )}
            </Box>

            <Typography 
              component="div"
              variant="body2" 
              color="text.secondary" 
              sx={{ 
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                mb: 2
              }}
            >
              <EnhancedSpoilerMarkdown
                content={event.description}
                className="event-description-preview"
                enableEntityEmbeds={false}
                compactEntityCards={true}
              />
            </Typography>

            <Box sx={{ mt: 'auto' }}>
              <Chip
                size="small"
                label={event.status}
                color={getStatusColor(event.status) as any}
                variant="outlined"
              />
            </Box>
          </CardContent>

          <CardActions>
            <Button
              component={Link}
              href={`/events/${event.id}`}
              size="small"
              startIcon={<Eye size={16} />}
            >
              View Details
            </Button>
          </CardActions>
        </Card>
      </motion.div>
    </Grid>
  )

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    )
  }

  const totalEvents = groupedEvents.arcs.reduce((total, group) => total + group.events.length, 0) + groupedEvents.noArc.length
  const hasSearch = searchTerm.trim() !== ''

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <CalendarSearch size={48} style={{ marginBottom: 16 }} />
          <Typography variant="h2" component="h1" gutterBottom>
            Events
          </Typography>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Explore key moments in the Usogui story
          </Typography>
        </Box>

        {/* Search and Filters */}
        <Box sx={{ mb: 4 }}>
          <form onSubmit={handleSearchSubmit}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  placeholder="Search events by title..."
                  value={searchTerm}
                  onChange={handleSearch}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search size={20} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={selectedType}
                    label="Type"
                    onChange={handleTypeChange}
                  >
                    {eventTypes.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        {type.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={selectedStatus}
                    label="Status"
                    onChange={handleStatusChange}
                  >
                    {eventStatuses.map((status) => (
                      <MenuItem key={status.value} value={status.value}>
                        {status.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </form>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress size={50} />
          </Box>
        ) : (
          <>
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="text.secondary">
                {totalEvents} event{totalEvents !== 1 ? 's' : ''} found
              </Typography>
            </Box>

            {hasSearch ? (
              // Show flat list when searching
              <Grid container spacing={3}>
                {groupedEvents.noArc.map(renderEvent)}
              </Grid>
            ) : (
              // Show grouped by arc when not searching
              <>
                {groupedEvents.arcs.map(({ arc, events }) => (
                  <Accordion key={arc.id} defaultExpanded sx={{ mb: 2 }}>
                    <AccordionSummary
                      expandIcon={<ChevronDown />}
                      aria-controls={`arc-${arc.id}-content`}
                      id={`arc-${arc.id}-header`}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="h6">{arc.name}</Typography>
                        <Chip 
                          label={`${events.length} event${events.length !== 1 ? 's' : ''}`}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Grid container spacing={3}>
                        {events.map(renderEvent)}
                      </Grid>
                    </AccordionDetails>
                  </Accordion>
                ))}

                {groupedEvents.noArc.length > 0 && (
                  <Accordion defaultExpanded sx={{ mb: 2 }}>
                    <AccordionSummary
                      expandIcon={<ChevronDown />}
                      aria-controls="no-arc-content"
                      id="no-arc-header"
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="h6">Other Events</Typography>
                        <Chip 
                          label={`${groupedEvents.noArc.length} event${groupedEvents.noArc.length !== 1 ? 's' : ''}`}
                          size="small"
                          color="secondary"
                          variant="outlined"
                        />
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Grid container spacing={3}>
                        {groupedEvents.noArc.map(renderEvent)}
                      </Grid>
                    </AccordionDetails>
                  </Accordion>
                )}
              </>
            )}

            {totalEvents === 0 && (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Typography variant="h6" color="text.secondary">
                  No events found
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Try adjusting your search terms or filters
                </Typography>
              </Box>
            )}
          </>
        )}
      </motion.div>
    </Container>
  )
}
