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
  Grid,
  Divider,
  Tabs,
  Tab
} from '@mui/material'
import { ArrowLeft, Crown, Users, Trophy, Calendar, BookOpen } from 'lucide-react'
import { useTheme } from '@mui/material/styles'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { api } from '../../../lib/api'
import { motion } from 'motion/react'
import { usePageView } from '../../../hooks/usePageView'
import TimelineSpoilerWrapper from '../../../components/TimelineSpoilerWrapper'
import GambleTimeline from '../../../components/GambleTimeline'
import MediaGallery from '../../../components/MediaGallery'
import MediaThumbnail from '../../../components/MediaThumbnail'

interface Gamble {
  id: number
  name: string
  rules: string
  winCondition?: string
  chapterId: number
  participants?: Array<{
    id: number
    name: string
    description?: string
    alternateNames?: string[]
  }>
  chapter?: {
    id: number
    number: number
    title?: string
  }
  createdAt: string
  updatedAt: string
}

export default function GambleDetailsPage() {
  const theme = useTheme()
  const { id } = useParams()
  const [gamble, setGamble] = useState<Gamble | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [timelineEvents, setTimelineEvents] = useState<any[]>([])
  const [arcs, setArcs] = useState<any[]>([])
  const [timelineLoading, setTimelineLoading] = useState(false)
  const [activeTab, setActiveTab] = useState(0)

  // Track page view
  const gambleId = Array.isArray(id) ? id[0] : id
  usePageView('gamble', gambleId || '', !!gambleId)

  useEffect(() => {
    const fetchGamble = async () => {
      try {
        setLoading(true)
        
        const gambleId = Array.isArray(id) ? id[0] : id
        
        // Validate that ID is a valid number
        if (!gambleId || isNaN(Number(gambleId))) {
          setError('Invalid gamble ID')
          return
        }
        
        const numericId = Number(gambleId)
        
        // Additional safety check for negative or zero IDs
        if (numericId <= 0) {
          setError('Invalid gamble ID')
          return
        }
        
        const response = await api.getGamble(numericId)
        setGamble(response)
      } catch (error: unknown) {
        setError(error instanceof Error ? error.message : 'Failed to fetch gamble details')
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchGamble()
    }
  }, [id])

  // Fetch timeline events and arcs when gamble is loaded
  useEffect(() => {
    const fetchTimelineData = async () => {
      if (!gamble) return
      
      try {
        setTimelineLoading(true)
        
        // Fetch events and arcs in parallel
        const [eventsResponse, arcsResponse] = await Promise.all([
          api.getEvents({ limit: 100 }), // Get a large set of events to filter from
          api.getArcs({ limit: 100 })
        ])
        
        // Filter events to those directly related to this gamble
        // First priority: events with matching gambleId
        // Second priority: events in the same chapter as the gamble
        const gambleChapter = gamble.chapter?.number || gamble.chapterId
        
        const filteredEvents = eventsResponse.data.filter((event: any) => {
          // Include events directly linked to this gamble
          if (event.gambleId === gamble.id) {
            return true
          }
          
          // Include events in the same chapter as the gamble
          if (event.chapterNumber === gambleChapter) {
            return true
          }
          
          return false
        })
        
        setTimelineEvents(filteredEvents)
        setArcs(arcsResponse.data || [])
        
      } catch (error: unknown) {
        console.error('Failed to fetch timeline data:', error)
      } finally {
        setTimelineLoading(false)
      }
    }

    fetchTimelineData()
  }, [gamble])

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue)
  }

  // Remove difficulty logic as it's not in the backend structure

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
        <Button component={Link} href="/gambles" variant="outlined" startIcon={<ArrowLeft />}>
          Back to Gambles
        </Button>
      </Container>
    )
  }

  if (!gamble) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="warning" sx={{ mb: 3 }}>
          Gamble not found
        </Alert>
        <Button component={Link} href="/gambles" variant="outlined" startIcon={<ArrowLeft />}>
          Back to Gambles
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
          href="/gambles"
          variant="outlined"
          startIcon={<ArrowLeft />}
          sx={{ mb: 3 }}
        >
          Back to Gambles
        </Button>

        {/* Enhanced Gamble Header */}
        <Card className="gambling-card" sx={{ mb: 4, overflow: 'visible' }}>
          <CardContent sx={{ p: 4 }}>
            <Grid container spacing={4} alignItems="center">
              <Grid item xs={12} md={4} lg={3}>
                <Box sx={{ 
                  textAlign: 'center',
                  position: 'relative'
                }}>
                  <MediaThumbnail
                    entityType="gamble"
                    entityId={gamble.id}
                    entityName={gamble.name}
                    allowCycling={true}
                    maxWidth={280}
                    maxHeight={320}
                    className="gamble-thumbnail"
                  />
                </Box>
              </Grid>
              
              <Grid item xs={12} md={8} lg={9}>
                <Box sx={{ pl: { md: 2 } }}>
                  {/* Gamble Name with Gradient */}
                  <Typography 
                    variant="h2" 
                    component="h1" 
                    sx={{ 
                      mb: 2,
                      fontWeight: 700,
                      background: `linear-gradient(135deg, ${theme.palette.text.primary} 0%, ${theme.palette.usogui.gamble} 100%)`,
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      color: 'transparent',
                      fontSize: { xs: '2.5rem', md: '3rem' },
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2
                    }}
                  >
                    <Crown size={40} color={theme.palette.usogui.gamble} />
                    {gamble.name}
                  </Typography>
                  
                  {/* Key Information */}
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 2 }}>
                    <Chip
                      label={gamble.chapter 
                        ? `Chapter ${gamble.chapter.number}${gamble.chapter.title ? `: ${gamble.chapter.title}` : ''}`
                        : `Chapter ${gamble.chapterId}`
                      }
                      color="primary"
                      variant="filled"
                      sx={{ fontWeight: 600 }}
                    />
                    {gamble.participants && gamble.participants.length > 0 && (
                      <Chip
                        icon={<Users size={16} />}
                        label={`${gamble.participants.length} Participants`}
                        color="secondary"
                        variant="filled"
                        sx={{ fontWeight: 600 }}
                      />
                    )}
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Tab Navigation */}
        <Card className="gambling-card" sx={{ mb: 0 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs 
              value={activeTab} 
              onChange={handleTabChange}
              sx={{ px: 2 }}
            >
              <Tab 
                label="Overview" 
                icon={<Crown size={18} />}
                iconPosition="start"
                sx={{ minHeight: 48 }}
              />
              <Tab 
                label="Timeline" 
                icon={<Calendar size={18} />}
                iconPosition="start" 
                sx={{ minHeight: 48 }}
                disabled={timelineEvents.length === 0}
              />
              <Tab 
                label="Media" 
                icon={<BookOpen size={18} />}
                iconPosition="start"
                sx={{ minHeight: 48 }}
              />
            </Tabs>
          </Box>

          {/* Tab Content */}
          <Box sx={{ p: 0 }}>
            {/* Overview Tab */}
            {activeTab === 0 && (
              <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
                <Grid container spacing={4}>
                  <Grid item xs={12} md={8}>
                    <Card className="gambling-card" sx={{
                      background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`,
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: 3,
                      boxShadow: theme.shadows[2],
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        boxShadow: theme.shadows[6],
                        transform: 'translateY(-2px)'
                      }
                    }}>
                      <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                        <Box sx={{
                          display: 'flex',
                          alignItems: 'center',
                          mb: 3,
                          pb: 2,
                          borderBottom: `2px solid ${theme.palette.divider}`,
                          position: 'relative',
                          '&::after': {
                            content: '""',
                            position: 'absolute',
                            bottom: -2,
                            left: 0,
                            width: '60px',
                            height: '2px',
                            background: `linear-gradient(90deg, ${theme.palette.usogui.gamble} 0%, transparent 100%)`
                          }
                        }}>
                          <Crown size={24} style={{ marginRight: 12 }} color={theme.palette.usogui.gamble} />
                          <Typography variant="h4" sx={{
                            fontWeight: 700,
                            color: 'usogui.gamble',
                            letterSpacing: '-0.5px'
                          }}>
                            Rules
                          </Typography>
                        </Box>

                        <Typography variant="body1" sx={{
                          fontSize: { xs: '1rem', md: '1.1rem' },
                          lineHeight: 1.8,
                          mb: 3,
                          color: 'text.primary',
                          fontWeight: 400
                        }}>
                          {gamble.rules}
                        </Typography>

                        {gamble.winCondition && (
                          <>
                            <Divider sx={{ my: 3 }} />
                            <Box sx={{
                              display: 'flex',
                              alignItems: 'center',
                              mb: 2,
                              gap: 1
                            }}>
                              <Trophy size={20} color={theme.palette.secondary.main} />
                              <Typography variant="h5" sx={{
                                fontWeight: 600,
                                color: 'secondary.main'
                              }}>
                                Win Condition
                              </Typography>
                            </Box>
                            <Typography variant="body1" sx={{
                              fontSize: { xs: '1rem', md: '1.1rem' },
                              lineHeight: 1.8,
                              color: 'text.primary',
                              fontWeight: 400
                            }}>
                              {gamble.winCondition}
                            </Typography>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Card className="gambling-card" sx={{
                      background: `linear-gradient(135deg, ${theme.palette.usogui.gamble}08 0%, transparent 100%)`,
                      border: `1px solid ${theme.palette.usogui.gamble}15`,
                      borderRadius: 3,
                      boxShadow: theme.shadows[2],
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        boxShadow: theme.shadows[6],
                        transform: 'translateY(-2px)'
                      }
                    }}>
                      <CardContent sx={{ p: 3 }}>
                        <Typography variant="h5" sx={{
                          mb: 3,
                          fontWeight: 700,
                          color: 'usogui.gamble',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          letterSpacing: '-0.3px'
                        }}>
                          <Crown size={24} />
                          Details
                        </Typography>
                        
                        <Box sx={{ mb: 3 }}>
                          <Typography variant="body2" color="text.secondary" gutterBottom sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            Chapter
                          </Typography>
                          <Typography 
                            variant="h6"
                            component={Link}
                            href={`/chapters/${gamble.chapter ? gamble.chapter.number : gamble.chapterId}`}
                            sx={{ 
                              textDecoration: 'none', 
                              color: 'primary.main',
                              fontWeight: 600,
                              '&:hover': { textDecoration: 'underline' }
                            }}
                          >
                            {gamble.chapter 
                              ? `Chapter ${gamble.chapter.number}${gamble.chapter.title ? ` - ${gamble.chapter.title}` : ''}`
                              : `Chapter ${gamble.chapterId}`
                            }
                          </Typography>
                        </Box>

                        {gamble.participants && gamble.participants.length > 0 && (
                          <Box sx={{ mb: 3 }}>
                            <Typography variant="body2" color="text.secondary" gutterBottom sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                              Participants ({gamble.participants.length})
                            </Typography>
                            <TimelineSpoilerWrapper 
                              chapterNumber={gamble.chapter?.number || gamble.chapterId}
                            >
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                {gamble.participants.map((participant) => (
                                  <Box key={participant.id} sx={{ 
                                    p: 2, 
                                    borderRadius: 2,
                                    background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`,
                                    border: `1px solid ${theme.palette.divider}`,
                                    position: 'relative',
                                    '&::before': {
                                      content: '""',
                                      position: 'absolute',
                                      left: 0,
                                      top: 0,
                                      bottom: 0,
                                      width: 3,
                                      backgroundColor: 'usogui.gamble',
                                      borderRadius: '0 2px 2px 0'
                                    }
                                  }}>
                                    <Typography 
                                      variant="subtitle1" 
                                      component={Link} 
                                      href={`/characters/${participant.id}`}
                                      sx={{ 
                                        textDecoration: 'none', 
                                        color: 'primary.main',
                                        fontWeight: 600,
                                        display: 'block',
                                        pl: 1,
                                        '&:hover': { textDecoration: 'underline' }
                                      }}
                                    >
                                      {participant.name}
                                    </Typography>
                                  </Box>
                                ))}
                              </Box>
                            </TimelineSpoilerWrapper>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Box>
            )}

            {/* Timeline Tab */}
            {activeTab === 1 && timelineEvents.length > 0 && (
              <Box>
                <GambleTimeline
                  events={timelineEvents}
                  arcs={arcs}
                  gambleName={gamble.name}
                  gambleChapter={gamble.chapter?.number || gamble.chapterId}
                />
              </Box>
            )}

            {/* Media Tab */}
            {activeTab === 2 && (
              <Box sx={{ 
                p: { xs: 2, sm: 3, md: 4 },
                background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`
              }}>
                {/* Enhanced Media Header */}
                <Box sx={{ mb: 4 }}>
                  <Typography 
                    variant="h4" 
                    sx={{ 
                      mb: 2,
                      fontWeight: 700,
                      background: `linear-gradient(135deg, ${theme.palette.text.primary} 0%, ${theme.palette.usogui.gamble} 100%)`,
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      color: 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      letterSpacing: '-0.5px'
                    }}
                  >
                    <BookOpen size={32} color={theme.palette.usogui.gamble} />
                    Gamble Media
                  </Typography>
                  <Typography 
                    variant="body1" 
                    color="text.secondary" 
                    sx={{ 
                      fontSize: '1.1rem',
                      fontWeight: 500,
                      maxWidth: '600px'
                    }}
                  >
                    Explore fan art, videos, and other media related to {gamble.name}
                  </Typography>
                </Box>

                {/* Enhanced Media Gallery Container */}
                <Box sx={{
                  background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, rgba(255,255,255,0.02) 100%)`,
                  borderRadius: 3,
                  p: { xs: 2, md: 3 },
                  border: `1px solid ${theme.palette.divider}`,
                  boxShadow: theme.shadows[1],
                  position: 'relative',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: `radial-gradient(circle at 20% 80%, ${theme.palette.usogui.gamble}03 0%, transparent 50%)`,
                    borderRadius: 3,
                    pointerEvents: 'none'
                  }
                }}>
                  <MediaGallery 
                    limit={12}
                    showTitle={false}
                    compactMode={false}
                  />
                </Box>
              </Box>
            )}
          </Box>
        </Card>
      </motion.div>
    </Container>
  )
}