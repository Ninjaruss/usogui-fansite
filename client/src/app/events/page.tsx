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
  Pagination,
  CircularProgress,
  Alert,
  Chip
} from '@mui/material'
import { Zap, Eye, Calendar, AlertTriangle, Search } from 'lucide-react'
import Link from 'next/link'
import { api } from '../../lib/api'
import { motion } from 'motion/react'

interface Event {
  id: number
  title: string
  name: string
  description: string
  eventType: string
  chapter: number
  significance: string
  participants: string[]
  outcome: string
  createdAt: string
  updatedAt: string
}

export default function EventsPage() {
  const [groupedEvents, setGroupedEvents] = useState<{
    mainArcs: Array<{ arc: any; events: any[] }>
    miniArcs: Array<{ arc: any; events: any[] }>
    noArc: any[]
  }>({ mainArcs: [], miniArcs: [], noArc: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const fetchEvents = async (search = '') => {
    setLoading(true)
    try {
      if (search) {
        // Fall back to regular search when searching
        const response = await api.getEvents({ page: 1, limit: 100, title: search })
        setGroupedEvents({
          mainArcs: [],
          miniArcs: [],
          noArc: response.data
        })
      } else {
        // Use grouped endpoint when not searching
        const response = await api.getEventsGroupedByArc()
        setGroupedEvents(response)
      }
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEvents(searchQuery)
  }, [searchQuery])

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value)
  }

  const getEventTypeColor = (eventType: string) => {
    switch (eventType?.toLowerCase()) {
      case 'arc':
        return 'primary'
      case 'character_reveal':
        return 'secondary'
      case 'plot_twist':
        return 'warning'
      case 'death':
        return 'error'
      case 'backstory':
        return 'info'
      case 'plot':
        return 'success'
      default:
        return 'default'
    }
  }

  const renderEvent = (event: any, index: number) => (
    <Grid item xs={12} sm={6} md={4} key={event.id}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: index * 0.1 }}
      >
        <Card
          className="gambling-card h-full"
          sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            transition: 'transform 0.2s',
            '&:hover': { transform: 'translateY(-4px)' }
          }}
        >
          <CardContent sx={{ flexGrow: 1 }}>
            <Typography variant="h6" component="h2" gutterBottom>
              {event.title}
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              {event.chapterNumber && (
                <Chip
                  label={`Chapter ${event.chapterNumber}`}
                  size="small"
                  color="primary"
                  variant="outlined"
                  icon={<Calendar size={14} />}
                  sx={{ mr: 1, mb: 1 }}
                />
              )}
              {event.type && (
                <Chip
                  label={event.type.replace('_', ' ').toUpperCase()}
                  size="small"
                  color={getEventTypeColor(event.type) as any}
                  variant="outlined"
                  sx={{ mr: 1, mb: 1 }}
                />
              )}
              {event.isVerified && (
                <Chip
                  label="Verified"
                  size="small"
                  color="success"
                  variant="filled"
                  icon={<Eye size={14} />}
                  sx={{ mb: 1 }}
                />
              )}
            </Box>

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mb: 2,
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitBoxOrient: 'vertical',
                WebkitLineClamp: 3,
              }}
            >
              {event.description}
            </Typography>

            {event.arc && (
              <Typography variant="body2" color="text.secondary">
                <strong>Arc:</strong> {event.arc.name}
              </Typography>
            )}
          </CardContent>

          <CardActions>
            <Button
              component={Link}
              href={`/events/${event.id}`}
              variant="outlined"
              startIcon={<Eye size={16} />}
              fullWidth
            >
              View Details
            </Button>
          </CardActions>
        </Card>
      </motion.div>
    </Grid>
  )

  const renderArcSection = (title: string, arcs: Array<{ arc: any; events: any[] }>, color: string) => (
    arcs.length > 0 && (
      <Box sx={{ mb: 6 }}>
        <Typography variant="h4" component="h2" sx={{ mb: 3, color, fontWeight: 'bold' }}>
          {title}
        </Typography>
        {arcs.map((arcGroup) => (
          <Box key={arcGroup.arc.id} sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Typography variant="h5" component="h3" sx={{ flexGrow: 1 }}>
                {arcGroup.arc.name}
              </Typography>
              {arcGroup.arc.startChapter && arcGroup.arc.endChapter && (
                <Chip
                  label={`Chapters ${arcGroup.arc.startChapter}-${arcGroup.arc.endChapter}`}
                  color="secondary"
                  variant="outlined"
                />
              )}
            </Box>
            {arcGroup.arc.description && (
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                {arcGroup.arc.description}
              </Typography>
            )}
            <Grid container spacing={3}>
              {arcGroup.events.map((event, index) => renderEvent(event, index))}
            </Grid>
          </Box>
        ))}
      </Box>
    )
  )

  const totalEvents = groupedEvents.mainArcs.reduce((sum, arc) => sum + arc.events.length, 0) +
                     groupedEvents.miniArcs.reduce((sum, arc) => sum + arc.events.length, 0) +
                     groupedEvents.noArc.length

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <Zap size={48} color="#f57c00" />
          </Box>
          <Typography variant="h3" component="h1" gutterBottom>
            Events
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Key moments and turning points in the Usogui story, organized by story arcs
          </Typography>
        </Box>

        <Box sx={{ mb: 4 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search events..."
            value={searchQuery}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={20} />
                </InputAdornment>
              ),
            }}
            sx={{ maxWidth: 500, mx: 'auto', display: 'block' }}
          />
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress size={50} />
          </Box>
        ) : (
          <>
            <Typography variant="h6" sx={{ mb: 3 }}>
              {totalEvents} event{totalEvents !== 1 ? 's' : ''} found
            </Typography>

            {searchQuery ? (
              // Show flat list when searching
              <Grid container spacing={4}>
                {groupedEvents.noArc.map((event, index) => renderEvent(event, index))}
              </Grid>
            ) : (
              // Show grouped structure when not searching
              <>
                {renderArcSection('Main Arcs', groupedEvents.mainArcs, '#1976d2')}
                {renderArcSection('Mini Arcs', groupedEvents.miniArcs, '#9c27b0')}
                
                {groupedEvents.noArc.length > 0 && (
                  <Box sx={{ mb: 4 }}>
                    <Typography variant="h4" component="h2" sx={{ mb: 3, color: '#757575', fontWeight: 'bold' }}>
                      Other Events
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                      Events that are not currently associated with any specific arc.
                    </Typography>
                    <Grid container spacing={3}>
                      {groupedEvents.noArc.map((event, index) => renderEvent(event, index))}
                    </Grid>
                  </Box>
                )}
              </>
            )}
          </>
        )}
      </motion.div>
    </Container>
  )
}
