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
  Chip,
  Tabs,
  Tab
} from '@mui/material'
import { ArrowLeft, BookOpen, Calendar, Eye } from 'lucide-react'
import { useTheme } from '@mui/material/styles'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { api } from '../../../lib/api'
import { motion } from 'motion/react'
import { usePageView } from '../../../hooks/usePageView'
import MediaGallery from '../../../components/MediaGallery'
import ArcTimeline from '../../../components/ArcTimeline'
import TimelineSpoilerWrapper from '../../../components/TimelineSpoilerWrapper'
import MediaThumbnail from '../../../components/MediaThumbnail'

interface Arc {
  id: number
  name: string
  description: string
  startChapter: number
  endChapter: number
  order?: number
  imageFileName?: string
  imageDisplayName?: string
  createdAt: string
  updatedAt: string
}

interface Character {
  id: number
  name: string
}

interface Event {
  id: number
  title: string
  description: string
  type: string
  chapterNumber: number
  characters?: Character[]
}

interface ArcGroup {
  arc: Arc
  events: Event[]
}

export default function ArcDetailPage() {
  const theme = useTheme()
  const [arc, setArc] = useState<Arc | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [gambles, setGambles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState(0)
  const params = useParams()

  // Track page view
  const arcId = Array.isArray(params.id) ? params.id[0] : params.id
  usePageView('arc', arcId || '', !!arcId)

  useEffect(() => {
    const fetchArcData = async () => {
      try {
        const id = Array.isArray(params.id) ? params.id[0] : params.id
        setLoading(true)
        
        // Validate that ID is a valid number
        if (!id || isNaN(Number(id))) {
          setError('Invalid arc ID')
          return
        }
        
        const arcId = Number(id)
        
        // Additional safety check for negative or zero IDs
        if (arcId <= 0) {
          setError('Invalid arc ID')
          return
        }
        
        // Fetch arc details, arc events, and arc gambles in parallel
        const [arcData, eventsGroupedData, gamblesData] = await Promise.all([
          api.getArc(arcId),
          api.getEventsGroupedByArc(),
          api.getArcGambles(arcId)
        ])
        
        setArc(arcData)
        setGambles(gamblesData.data || [])
        
        // Find events for this specific arc
        const arcGroup = eventsGroupedData.arcs.find((group: ArcGroup) => group.arc.id === arcId)
        setEvents(arcGroup?.events || [])
        
      } catch (error: unknown) {
        setError(error instanceof Error ? error.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchArcData()
    }
  }, [params.id])

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue)
  }

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

        {/* Enhanced Arc Header */}
        <Card className="gambling-card" sx={{ mb: 4, overflow: 'visible' }}>
          <CardContent sx={{ p: 4 }}>
            <Grid container spacing={4} alignItems="center">
              <Grid item xs={12} md={4} lg={3}>
                <Box sx={{ 
                  textAlign: 'center',
                  position: 'relative'
                }}>
                  <MediaThumbnail
                    entityType="arc"
                    entityId={arc.id}
                    entityName={arc.name}
                    allowCycling={true}
                    maxWidth={280}
                    maxHeight={320}
                    className="arc-thumbnail"
                  />
                </Box>
              </Grid>
              
              <Grid item xs={12} md={8} lg={9}>
                <Box sx={{ pl: { md: 2 } }}>
                  {/* Arc Name with Gradient */}
                  <Typography 
                    variant="h2" 
                    component="h1" 
                    sx={{ 
                      mb: 2,
                      fontWeight: 700,
                      background: `linear-gradient(135deg, ${theme.palette.text.primary} 0%, ${theme.palette.usogui.arc} 100%)`,
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      color: 'transparent',
                      fontSize: { xs: '2.5rem', md: '3rem' }
                    }}
                  >
                    {arc.name}
                  </Typography>

                  {/* Key Information Cards */}
                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={12} sm={6} md={3}>
                      <Card sx={{ 
                        p: 2, 
                        background: `linear-gradient(135deg, ${theme.palette.usogui.arc}08 0%, transparent 100%)`,
                        border: `1px solid ${theme.palette.usogui.arc}20`,
                        transition: 'transform 0.2s ease',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: theme.shadows[4]
                        }
                      }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                          Chapter Range
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 600, color: 'usogui.arc' }}>
                          {arc.startChapter}-{arc.endChapter}
                        </Typography>
                      </Card>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                      <Card sx={{ 
                        p: 2, 
                        background: `linear-gradient(135deg, ${theme.palette.secondary.main}08 0%, transparent 100%)`,
                        border: `1px solid ${theme.palette.secondary.main}20`,
                        transition: 'transform 0.2s ease',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: theme.shadows[4]
                        }
                      }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                          Total Chapters
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {chapterCount} chapters
                        </Typography>
                      </Card>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                      <Card sx={{ 
                        p: 2, 
                        background: `linear-gradient(135deg, ${theme.palette.primary.main}08 0%, transparent 100%)`,
                        border: `1px solid ${theme.palette.primary.main}20`,
                        transition: 'transform 0.2s ease',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: theme.shadows[4]
                        }
                      }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                          Key Events
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {events.length} events
                        </Typography>
                      </Card>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                      <Card sx={{ 
                        p: 2, 
                        background: `linear-gradient(135deg, ${theme.palette.usogui.gamble}08 0%, transparent 100%)`,
                        border: `1px solid ${theme.palette.usogui.gamble}20`,
                        transition: 'transform 0.2s ease',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: theme.shadows[4]
                        }
                      }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                          Gambles
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 600, color: 'usogui.gamble' }}>
                          {gambles.length} gambles
                        </Typography>
                      </Card>
                    </Grid>
                  </Grid>

                  {/* Enhanced Stats Chips */}
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                    <Chip 
                      label={`${events.length} Event${events.length !== 1 ? 's' : ''}`} 
                      size="medium" 
                      variant="filled"
                      color="primary"
                      sx={{ 
                        fontWeight: 600,
                        '& .MuiChip-label': { px: 2 }
                      }}
                    />
                    <Chip 
                      label={`${gambles.length} Gamble${gambles.length !== 1 ? 's' : ''}`} 
                      size="medium" 
                      variant="filled"
                      sx={{ 
                        fontWeight: 600,
                        backgroundColor: theme.palette.usogui.gamble,
                        color: 'white',
                        '& .MuiChip-label': { px: 2 }
                      }}
                    />
                    <Chip 
                      label={`Arc ${arc.order || 'N/A'}`} 
                      size="medium" 
                      variant="filled"
                      sx={{ 
                        fontWeight: 600,
                        backgroundColor: theme.palette.usogui.arc,
                        color: 'white',
                        '& .MuiChip-label': { px: 2 }
                      }}
                    />
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
                icon={<BookOpen size={18} />}
                iconPosition="start"
                sx={{ minHeight: 48 }}
              />
              <Tab 
                label="Timeline" 
                icon={<Calendar size={18} />}
                iconPosition="start" 
                sx={{ minHeight: 48 }}
                disabled={events.length === 0}
              />
              <Tab 
                label="Media" 
                icon={<Eye size={18} />}
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
                <Grid container spacing={3}>
                  {/* Main Content - Left Column */}
                  <Grid item xs={12} lg={8}>
                    {/* Enhanced About Section */}
                    <Card className="gambling-card" sx={{ 
                      mb: 3,
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
                            background: `linear-gradient(90deg, ${theme.palette.usogui.arc} 0%, transparent 100%)`
                          }
                        }}>
                          <BookOpen size={24} style={{ marginRight: 12 }} color={theme.palette.usogui.arc} />
                          <Typography variant="h4" sx={{ 
                            fontWeight: 700, 
                            color: 'usogui.arc',
                            letterSpacing: '-0.5px'
                          }}>
                            About
                          </Typography>
                        </Box>

                        <TimelineSpoilerWrapper 
                          chapterNumber={arc.startChapter}
                        >
                          <Typography variant="body1" sx={{ 
                            fontSize: { xs: '1rem', md: '1.1rem' },
                            lineHeight: 1.8,
                            mb: 3,
                            color: 'text.primary',
                            fontWeight: 400
                          }}>
                            {arc.description}
                          </Typography>
                        </TimelineSpoilerWrapper>
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Right Column - Additional Info */}
                  <Grid item xs={12} lg={4}>
                    {/* Chapter Navigation */}
                    <Card className="gambling-card" sx={{
                      background: `linear-gradient(135deg, ${theme.palette.info.main}08 0%, transparent 100%)`,
                      border: `1px solid ${theme.palette.info.main}15`,
                      position: 'sticky',
                      top: 20,
                      borderRadius: 3,
                      boxShadow: theme.shadows[2],
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        boxShadow: theme.shadows[6],
                        transform: 'translateY(-2px)'
                      }
                    }}>
                      <CardContent sx={{ p: 3 }}>
                        <Typography variant="h6" sx={{ 
                          mb: 3,
                          fontWeight: 700,
                          color: 'info.main',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          letterSpacing: '-0.3px'
                        }}>
                          <BookOpen size={20} />
                          Chapter Range
                        </Typography>
                        
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <Button
                            component={Link}
                            href={`/chapters/${arc.startChapter}`}
                            variant="outlined"
                            color="info"
                            fullWidth
                            sx={{ 
                              borderRadius: '12px',
                              py: 1.5,
                              fontWeight: 600,
                              textTransform: 'none',
                              fontSize: '0.95rem',
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                transform: 'scale(1.02)',
                                boxShadow: theme.shadows[4]
                              }
                            }}
                          >
                            Start: Chapter {arc.startChapter}
                          </Button>
                          <Button
                            component={Link}
                            href={`/chapters/${arc.endChapter}`}
                            variant="contained"
                            color="info"
                            fullWidth
                            sx={{ 
                              borderRadius: '12px',
                              py: 1.5,
                              fontWeight: 600,
                              textTransform: 'none',
                              fontSize: '0.95rem',
                              boxShadow: theme.shadows[3],
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                transform: 'scale(1.02)',
                                boxShadow: theme.shadows[6]
                              }
                            }}
                          >
                            End: Chapter {arc.endChapter}
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Box>
            )}

            {/* Timeline Tab */}
            {activeTab === 1 && events.length > 0 && (
              <Box>
                <ArcTimeline
                  events={events.map(event => ({
                    id: event.id,
                    title: event.title,
                    chapterNumber: event.chapterNumber,
                    type: event.type as 'gamble' | 'decision' | 'reveal' | 'shift' | 'resolution',
                    characters: event.characters?.map(char => char.name),
                    description: event.description,
                    isSpoiler: event.chapterNumber > arc.startChapter
                  }))}
                  arcName={arc.name}
                  startChapter={arc.startChapter}
                  endChapter={arc.endChapter}
                />
              </Box>
            )}

            {/* Enhanced Media Tab */}
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
                      background: `linear-gradient(135deg, ${theme.palette.text.primary} 0%, ${theme.palette.primary.main} 100%)`,
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      color: 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      letterSpacing: '-0.5px'
                    }}
                  >
                    <Eye size={32} color={theme.palette.primary.main} />
                    Media Gallery
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
                    Explore fan art, videos, and other media related to {arc.name}
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
                    background: `radial-gradient(circle at 20% 80%, ${theme.palette.primary.main}03 0%, transparent 50%)`,
                    borderRadius: 3,
                    pointerEvents: 'none'
                  }
                }}>
                  <MediaGallery 
                    arcId={arc.id} 
                    limit={20}
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
