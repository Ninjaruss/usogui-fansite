'use client'

import React, { useState, useEffect } from 'react'
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Alert,
  CircularProgress,
  Chip,
  Grid
} from '@mui/material'
import { ArrowLeft, CalendarSearch, Calendar, Users, BookOpen, Dice6, Tag } from 'lucide-react'
import { useTheme } from '@mui/material/styles'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { api } from '../../../lib/api'
import { motion } from 'motion/react'
import SpoilerWrapper from '../../../components/SpoilerWrapper'
import { usePageView } from '../../../hooks/usePageView'

interface Event {
  id: number
  title: string
  description: string
  chapterNumber: number
  spoilerChapter?: number
  type: 'gamble' | 'decision' | 'reveal' | 'shift' | 'resolution'
  status: 'draft' | 'pending_review' | 'approved'
  arcId?: number
  gambleId?: number
  arc?: {
    id: number
    name: string
  }
  gamble?: {
    id: number
    name: string
    rules: string
    winCondition?: string
  }
  characters: Array<{
    id: number
    name: string
  }>
  tags?: Array<{
    id: number
    name: string
  }>
  createdAt: string
  updatedAt: string
}

export default function EventDetailsPage() {
  const theme = useTheme()
  const { id } = useParams()
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Track page view
  const eventId = Array.isArray(id) ? id[0] : id
  usePageView('event', eventId || '', !!eventId)

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true)
        const response = await api.getEvent(Number(id))
        setEvent(response)
      } catch (error: unknown) {
        setError(error instanceof Error ? error.message : 'Failed to fetch event details')
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchEvent()
    }
  }, [id])

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <CircularProgress size={50} />
        </Box>
      </Container>
    )
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button component={Link} href="/events" variant="outlined" startIcon={<ArrowLeft />}>
          Back to Events
        </Button>
      </Container>
    )
  }

  if (!event) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="warning" sx={{ mb: 3 }}>
          Event not found
        </Alert>
        <Button component={Link} href="/events" variant="outlined" startIcon={<ArrowLeft />}>
          Back to Events
        </Button>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Button
          component={Link}
          href="/events"
          variant="outlined"
          startIcon={<ArrowLeft />}
          sx={{ mb: 3 }}
        >
          Back to Events
        </Button>

        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <CalendarSearch size={48} color={theme.palette.usogui.event} />
          </Box>
          <Typography variant="h3" component="h1" gutterBottom>
            {event.title}
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            <Chip
              icon={<Calendar size={16} />}
              label={`Chapter ${event.chapterNumber}`}
              color="primary"
              variant="outlined"
            />
            {event.arc && (
              <Chip
                icon={<BookOpen size={16} />}
                label={event.arc.name}
                color="secondary"
                variant="outlined"
                component={Link}
                href={`/arcs/${event.arc.id}`}
                clickable
              />
            )}
            {event.gamble && (
              <Chip
                icon={<Dice6 size={16} />}
                label={event.gamble.name}
                color="info"
                variant="outlined"
                component={Link}
                href={`/gambles/${event.gamble.id}`}
                clickable
              />
            )}
          </Box>
        </Box>

        <Grid container spacing={4}>
          <Grid item xs={12} md={8}>
            <Card className="gambling-card">
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  Description
                </Typography>
                <SpoilerWrapper 
                  chapterNumber={event.chapterNumber} 
                  spoilerType="major"
                  description="Event outcome and plot details"
                >
                  <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.7 }}>
                    {event.description}
                  </Typography>
                </SpoilerWrapper>

                {event.gamble && (
                  <>
                    <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                      Related Gamble
                    </Typography>
                    <SpoilerWrapper 
                      chapterNumber={event.chapterNumber}
                      spoilerType="minor"
                      description={`Gamble details: ${event.gamble.name}`}
                    >
                      <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                        <Typography variant="h6" gutterBottom>
                          {event.gamble.name}
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          <strong>Rules:</strong> {event.gamble.rules}
                        </Typography>
                        {event.gamble.winCondition && (
                          <Typography variant="body2">
                            <strong>Win Condition:</strong> {event.gamble.winCondition}
                          </Typography>
                        )}
                      </Box>
                    </SpoilerWrapper>
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card className="gambling-card">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Event Details
                </Typography>
                
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Chapter
                  </Typography>
                  <Typography 
                    variant="body1"
                    component={Link}
                    href={`/chapters/${event.chapterNumber}`}
                    sx={{ 
                      textDecoration: 'none', 
                      color: 'primary.main',
                      '&:hover': { textDecoration: 'underline' }
                    }}
                  >
                    {event.chapterNumber}
                  </Typography>
                </Box>

                {event.arc && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Arc
                    </Typography>
                    <Typography 
                      variant="body1"
                      component={Link}
                      href={`/arcs/${event.arc.id}`}
                      sx={{ 
                        textDecoration: 'none', 
                        color: 'primary.main',
                        '&:hover': { textDecoration: 'underline' }
                      }}
                    >
                      {event.arc.name}
                    </Typography>
                  </Box>
                )}

                {event.gamble && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Related Gamble
                    </Typography>
                    <Typography 
                      variant="body1"
                      component={Link}
                      href={`/gambles/${event.gamble.id}`}
                      sx={{ 
                        textDecoration: 'none', 
                        color: 'primary.main',
                        '&:hover': { textDecoration: 'underline' }
                      }}
                    >
                      {event.gamble.name}
                    </Typography>
                  </Box>
                )}

                {event.spoilerChapter && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Spoiler Chapter
                    </Typography>
                    <Typography variant="body1">
                      Chapter {event.spoilerChapter}
                    </Typography>
                  </Box>
                )}

                {event.type && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Event Type
                    </Typography>
                    <Chip
                      label={event.type.replace('_', ' ').toUpperCase()}
                      size="small"
                      color="secondary"
                      variant="outlined"
                    />
                  </Box>
                )}

                {event.characters?.length > 0 && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Characters
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      {event.characters.map((character) => (
                        <Chip
                          key={character.id}
                          label={character.name}
                          size="small"
                          variant="outlined"
                          color="primary"
                          icon={<Users size={14} />}
                          component={Link}
                          href={`/characters/${character.id}`}
                          clickable
                        />
                      ))}
                    </Box>
                  </Box>
                )}

                {event.tags && event.tags.length > 0 && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Tags
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {event.tags.map((tag) => (
                        <Chip
                          key={tag.id}
                          label={tag.name}
                          size="small"
                          variant="outlined"
                          color="default"
                          icon={<Tag size={14} />}
                        />
                      ))}
                    </Box>
                  </Box>
                )}

                {event.status && (
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Status
                    </Typography>
                    <Chip
                      label={event.status.replace('_', ' ').toUpperCase()}
                      size="small"
                      color={event.status === 'approved' ? 'success' : event.status === 'pending_review' ? 'warning' : 'default'}
                      variant="outlined"
                    />
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </motion.div>
    </Container>
  )
}