'use client'

import React, { useState, useEffect } from 'react'
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Button,
  CircularProgress,
  Alert,
  Divider,
  Chip
} from '@mui/material'
import { ArrowLeft, BookOpen, Hash, CalendarSearch, Users } from 'lucide-react'
import { useTheme } from '@mui/material/styles'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { api } from '../../../lib/api'
import { motion } from 'motion/react'
import { usePageView } from '../../../hooks/usePageView'
import MediaGallery from '../../../components/MediaGallery'

interface Arc {
  id: number
  name: string
  description: string
  startChapter: number
  endChapter: number
  createdAt: string
  updatedAt: string
}

export default function ArcDetailPage() {
  const theme = useTheme()
  const [arc, setArc] = useState<Arc | null>(null)
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [eventsLoading, setEventsLoading] = useState(false)
  const [error, setError] = useState('')
  const [eventsError, setEventsError] = useState('')
  const params = useParams()

  // Track page view
  const arcId = Array.isArray(params.id) ? params.id[0] : params.id
  usePageView('arc', arcId || '', !!arcId)

  useEffect(() => {
    const fetchArcData = async () => {
      try {
        const id = Array.isArray(params.id) ? params.id[0] : params.id
        setLoading(true)
        setEventsLoading(true)
        
        // Fetch arc details and arc events in parallel
        const [arcData, eventsGroupedData] = await Promise.all([
          api.getArc(Number(id)),
          api.getEventsGroupedByArc()
        ])
        
        setArc(arcData)
        
        // Find events for this specific arc
        const arcGroup = eventsGroupedData.arcs.find((group: any) => group.arc.id === Number(id))
        setEvents(arcGroup?.events || [])
        
      } catch (error: any) {
        setError(error.message)
        setEventsError('Failed to load arc events')
      } finally {
        setLoading(false)
        setEventsLoading(false)
      }
    }

    if (params.id) {
      fetchArcData()
    }
  }, [params.id])

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <CircularProgress size={50} />
        </Box>
      </Container>
    )
  }

  if (error || !arc) {
    return (
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Alert severity="error">
          {error || 'Arc not found'}
        </Alert>
        <Box sx={{ mt: 3 }}>
          <Button component={Link} href="/arcs" startIcon={<ArrowLeft />}>
            Back to Arcs
          </Button>
        </Box>
      </Container>
    )
  }

  const chapterCount = arc.endChapter - arc.startChapter + 1

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Button
          component={Link}
          href="/arcs"
          startIcon={<ArrowLeft />}
          sx={{ mb: 3 }}
        >
          Back to Arcs
        </Button>

        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <BookOpen size={48} color={theme.palette.usogui.arc} />
          </Box>
          <Typography variant="h3" component="h1" gutterBottom>
            {arc.name}
          </Typography>
          
          <Box sx={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            <Chip
              label={`Chapters ${arc.startChapter}-${arc.endChapter}`}
              color="secondary"
              variant="filled"
              icon={<Hash size={16} />}
            />
            <Chip
              label={`${chapterCount} chapters total`}
              color="primary"
              variant="outlined"
              icon={<BookOpen size={16} />}
            />
            {events.length > 0 && (
              <Chip
                label={`${events.length} key events`}
                color="warning"
                variant="outlined"
                icon={<CalendarSearch size={16} />}
              />
            )}
          </Box>
        </Box>

        <Grid container spacing={4}>
          <Grid item xs={12} md={8}>
            <Card className="gambling-card" sx={{ mb: 4 }}>
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  Story Summary
                </Typography>
                <Typography variant="body1" paragraph>
                  {arc.description}
                </Typography>
              </CardContent>
            </Card>

            {/* Events Section */}
            <Card className="gambling-card">
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <CalendarSearch size={24} color={theme.palette.usogui.event} style={{ marginRight: 8 }} />
                  <Typography variant="h5" gutterBottom sx={{ mb: 0 }}>
                    Key Events in This Arc
                  </Typography>
                </Box>

                {eventsLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress size={40} />
                  </Box>
                ) : eventsError ? (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    {eventsError}
                  </Alert>
                ) : events.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body1" color="text.secondary" gutterBottom>
                      No key events have been documented for this arc yet.
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Be the first to contribute by submitting guides about important moments in this storyline!
                    </Typography>
                  </Box>
                ) : (
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      Major story moments and turning points in chronological order:
                    </Typography>
                    
                    <Box sx={{ position: 'relative' }}>
                      {/* Timeline line */}
                      <Box
                        sx={{
                          position: 'absolute',
                          left: '20px',
                          top: '20px',
                          bottom: '20px',
                          width: '2px',
                          background: `linear-gradient(to bottom, ${theme.palette.usogui.event}, ${theme.palette.primary.main})`,
                          opacity: 0.3
                        }}
                      />
                      
                      {events.map((event: any, index: number) => (
                        <motion.div
                          key={event.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                        >
                          <Box
                            sx={{
                              position: 'relative',
                              display: 'flex',
                              mb: 3,
                              alignItems: 'flex-start'
                            }}
                          >
                            {/* Timeline dot */}
                            <Box
                              sx={{
                                width: '12px',
                                height: '12px',
                                borderRadius: '50%',
                                backgroundColor: theme.palette.usogui.event,
                                border: `3px solid ${theme.palette.background.paper}`,
                                flexShrink: 0,
                                mt: 1,
                                mr: 3,
                                zIndex: 1
                              }}
                            />
                            
                            <Card 
                              sx={{ 
                                flexGrow: 1,
                                transition: 'all 0.2s ease-in-out',
                                cursor: 'pointer',
                                textDecoration: 'none',
                                '&:hover': {
                                  transform: 'translateY(-2px)',
                                  boxShadow: theme.shadows[8]
                                }
                              }}
                              component={Link}
                              href={`/events/${event.id}`}
                            >
                              <CardContent sx={{ pb: 2 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                  <Typography variant="h6" gutterBottom sx={{ mb: 0 }}>
                                    {event.title}
                                  </Typography>
                                  <Chip 
                                    label={`Ch. ${event.chapterNumber}`}
                                    size="small" 
                                    color="primary"
                                    variant="outlined"
                                  />
                                </Box>
                                
                                <Typography 
                                  variant="body2" 
                                  color="text.secondary" 
                                  sx={{ 
                                    mb: 2,
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden'
                                  }}
                                >
                                  {event.description}
                                </Typography>

                                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                  <Chip 
                                    label={event.type}
                                    size="small"
                                    color="secondary"
                                    variant="filled"
                                  />
                                  {event.characters?.slice(0, 3).map((character: any) => (
                                    <Chip
                                      key={character.id}
                                      label={character.name}
                                      size="small"
                                      variant="outlined"
                                    />
                                  ))}
                                  {event.characters?.length > 3 && (
                                    <Chip
                                      label={`+${event.characters.length - 3} more`}
                                      size="small"
                                      variant="outlined"
                                      color="default"
                                    />
                                  )}
                                </Box>
                              </CardContent>
                            </Card>
                          </Box>
                        </motion.div>
                      ))}
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>

            {/* Media Gallery Section */}
            <Card className="gambling-card" sx={{ mt: 4 }}>
              <CardContent>
                <MediaGallery 
                  arcId={arc.id} 
                  limit={8}
                  showTitle={true}
                />
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card className="gambling-card">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Arc Details
                </Typography>
                
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    Start Chapter
                  </Typography>
                  <Typography variant="h6" color="primary">
                    {arc.startChapter}
                  </Typography>
                </Box>

                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    End Chapter
                  </Typography>
                  <Typography variant="h6" color="secondary">
                    {arc.endChapter}
                  </Typography>
                </Box>

                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    Total Chapters
                  </Typography>
                  <Typography variant="h6">
                    {chapterCount}
                  </Typography>
                </Box>

                {events.length > 0 && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" color="text.secondary">
                      Documented Events
                    </Typography>
                    <Typography variant="h6" color="warning.main">
                      {events.length}
                    </Typography>
                  </Box>
                )}

                <Divider sx={{ my: 2 }} />

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Added to Database
                  </Typography>
                  <Typography variant="body1">
                    {new Date(arc.createdAt).toLocaleDateString()}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Last Updated
                  </Typography>
                  <Typography variant="body1">
                    {new Date(arc.updatedAt).toLocaleDateString()}
                  </Typography>
                </Box>
              </CardContent>
            </Card>

            {/* Quick Navigation */}
            <Card className="gambling-card" sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Quick Navigation
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Button
                    component={Link}
                    href={`/chapters?search=${arc.startChapter}`}
                    variant="outlined"
                    size="small"
                    startIcon={<BookOpen size={16} />}
                  >
                    View Arc Chapters
                  </Button>
                  
                  <Button
                    component={Link}
                    href={`/events?search=${arc.name}`}
                    variant="outlined"
                    size="small"
                    startIcon={<CalendarSearch size={16} />}
                  >
                    All Arc Events
                  </Button>
                  
                  <Button
                    component={Link}
                    href={`/characters?search=${arc.name}`}
                    variant="outlined"
                    size="small"
                    startIcon={<Users size={16} />}
                  >
                    Arc Characters
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            Want to contribute?
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            Help expand this arc&apos;s information by submitting media or guides about key events
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              component={Link}
              href="/submit-media"
              variant="outlined"
              color="primary"
            >
              Submit Media
            </Button>
            <Button
              component={Link}
              href="/submit-guide"
              variant="outlined"
              color="secondary"
            >
              Write a Guide
            </Button>
          </Box>
        </Box>
      </motion.div>
    </Container>
  )
}