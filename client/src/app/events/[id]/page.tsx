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
import { ArrowLeft, Zap, Calendar, Users, BookOpen } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { api } from '../../../lib/api'
import { motion } from 'motion/react'

interface Event {
  id: number
  title: string
  description: string
  startChapter: number
  endChapter?: number
  type: string
  arc?: {
    id: number
    name: string
  }
  characters: Array<{
    id: number
    name: string
  }>
  pageNumbers?: number[]
  chapterReferences?: Array<{
    chapterNumber: number
    context: string
  }>
  createdAt: string
  updatedAt: string
}

export default function EventDetailsPage() {
  const { id } = useParams()
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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
            <Zap size={48} color="#ff9800" />
          </Box>
          <Typography variant="h3" component="h1" gutterBottom>
            {event.title}
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            <Chip
              icon={<Calendar size={16} />}
              label={event.endChapter ? `Chapters ${event.startChapter}-${event.endChapter}` : `Chapter ${event.startChapter}`}
              color="primary"
              variant="outlined"
            />
            {event.arc && (
              <Chip
                icon={<BookOpen size={16} />}
                label={event.arc.name}
                color="secondary"
                variant="outlined"
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
                <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.7 }}>
                  {event.description}
                </Typography>

                {event.chapterReferences && event.chapterReferences.length > 0 && (
                  <>
                    <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                      Related Chapters
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {event.chapterReferences.map((ref, index) => (
                        <Typography key={index} variant="body2" sx={{ mb: 0.5 }}>
                          <strong>Chapter {ref.chapterNumber}:</strong> {ref.context}
                        </Typography>
                      ))}
                    </Box>
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
                    Chapters
                  </Typography>
                  <Typography variant="body1">
                    {event.endChapter ? `${event.startChapter} - ${event.endChapter}` : event.startChapter}
                  </Typography>
                </Box>

                {event.arc && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Arc
                    </Typography>
                    <Typography variant="body1">
                      {event.arc.name}
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
                        />
                      ))}
                    </Box>
                  </Box>
                )}

                {event.pageNumbers && event.pageNumbers.length > 0 && (
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Page References
                    </Typography>
                    <Typography variant="body2">
                      Pages: {event.pageNumbers.join(', ')}
                    </Typography>
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