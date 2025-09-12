'use client'

import React, { useState, useEffect } from 'react'
import {
  Container,
  Typography,
  Box,
  Chip,
  Card,
  CardContent,
  Grid,
  Button,
  CircularProgress,
  Alert,
  Divider
} from '@mui/material'
import { ArrowLeft, Users, Shield, Crown } from 'lucide-react'
import { useTheme } from '@mui/material/styles'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { api } from '../../../lib/api'
import { motion } from 'motion/react'
import SpoilerWrapper from '../../../components/SpoilerWrapper'
import MediaThumbnail from '../../../components/MediaThumbnail'
import MediaGallery from '../../../components/MediaGallery'
import { usePageView } from '../../../hooks/usePageView'

interface Faction {
  id: number
  name: string
  description?: string
  createdAt: string
  updatedAt: string
}

export default function FactionDetailPage() {
  const theme = useTheme()
  const [faction, setFaction] = useState<Faction | null>(null)
  const [members, setMembers] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [gambles, setGambles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const params = useParams()

  // Track page view
  const factionId = Array.isArray(params.id) ? params.id[0] : params.id
  usePageView('faction', factionId || '', !!factionId)

  useEffect(() => {
    const fetchFactionData = async () => {
      try {
        const id = Array.isArray(params.id) ? params.id[0] : params.id
        
        // Validate that ID is a valid number
        if (!id || isNaN(Number(id))) {
          setError('Invalid faction ID')
          return
        }
        
        const factionIdNum = Number(id)
        
        // Additional safety check for negative or zero IDs
        if (factionIdNum <= 0) {
          setError('Invalid faction ID')
          return
        }
        
        // Fetch faction data
        const factionData = await api.getFaction(factionIdNum)
        setFaction(factionData)

        // For now, we'll set empty arrays for related data
        // In a real implementation, you'd have API endpoints for faction-related data
        setMembers([])
        setEvents([])
        setGambles([])
      } catch (error: any) {
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchFactionData()
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

  if (error || !faction) {
    return (
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Alert severity="error">
          {error || 'Faction not found'}
        </Alert>
        <Box sx={{ mt: 3 }}>
          <Button component={Link} href="/factions" startIcon={<ArrowLeft />}>
            Back to Factions
          </Button>
        </Box>
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
          href="/factions"
          startIcon={<ArrowLeft />}
          sx={{ mb: 3 }}
        >
          Back to Factions
        </Button>

        {/* Enhanced Faction Header */}
        <Card className="gambling-card" sx={{ mb: 4, overflow: 'visible' }}>
          <CardContent sx={{ p: 4 }}>
            <Grid container spacing={4} alignItems="center">
              <Grid item xs={12} md={4} lg={3}>
                <Box sx={{ 
                  textAlign: 'center',
                  position: 'relative'
                }}>
                  <MediaThumbnail
                    entityType="faction"
                    entityId={faction.id}
                    entityName={faction.name}
                    allowCycling={true}
                    maxWidth={280}
                    maxHeight={320}
                    className="faction-thumbnail"
                  />
                </Box>
              </Grid>
              
              <Grid item xs={12} md={8} lg={9}>
                <Box sx={{ pl: { md: 2 } }}>
                  {/* Faction Name with Gradient */}
                  <Typography 
                    variant="h2" 
                    component="h1" 
                    sx={{ 
                      mb: 2,
                      fontWeight: 700,
                      background: `linear-gradient(135deg, ${theme.palette.text.primary} 0%, ${theme.palette.secondary.main} 100%)`,
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      color: 'transparent',
                      fontSize: { xs: '2.5rem', md: '3rem' },
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2
                    }}
                  >
                    <Shield size={40} color={theme.palette.secondary.main} />
                    {faction.name}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Grid container spacing={4}>
          <Grid item xs={12} md={8}>
            {faction.description && (
              <Card className="gambling-card">
                <CardContent>
                  <Typography variant="h5" gutterBottom>
                    About {faction.name}
                  </Typography>
                  <SpoilerWrapper 
                    chapterNumber={1}
                    spoilerType="minor"
                    description="Faction overview and background"
                  >
                    <Typography variant="body1" paragraph>
                      {faction.description}
                    </Typography>
                  </SpoilerWrapper>
                </CardContent>
              </Card>
            )}

            {/* Members Section */}
            {members.length > 0 && (
              <Card className="gambling-card" sx={{ mt: 4 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h5" gutterBottom>
                      Known Members
                    </Typography>
                    <Button
                      component={Link}
                      href={`/characters?faction=${faction.name}`}
                      size="small"
                      color="primary"
                    >
                      View All
                    </Button>
                  </Box>
                  <Grid container spacing={2}>
                    {members.map((member) => (
                      <Grid item xs={12} sm={6} md={4} key={member.id}>
                        <Card variant="outlined">
                          <CardContent sx={{ py: 2 }}>
                            <Typography 
                              variant="h6" 
                              component={Link} 
                              href={`/characters/${member.id}`}
                              sx={{ textDecoration: 'none', color: 'primary.main', '&:hover': { textDecoration: 'underline' } }}
                            >
                              {member.name}
                            </Typography>
                            {member.role && (
                              <Typography variant="body2" color="text.secondary">
                                {member.role}
                              </Typography>
                            )}
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            )}

            {/* Related Gambles Section */}
            {gambles.length > 0 && (
              <Card className="gambling-card" sx={{ mt: 4 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h5" gutterBottom>
                      Related Gambles
                    </Typography>
                    <Button
                      component={Link}
                      href={`/gambles?faction=${faction.name}`}
                      size="small"
                      color="primary"
                    >
                      View All
                    </Button>
                  </Box>
                  {gambles.map((gamble) => (
                    <Card key={gamble.id} variant="outlined" sx={{ mb: 2 }}>
                      <CardContent>
                        <Typography variant="h6" component={Link} href={`/gambles/${gamble.id}`} 
                                  sx={{ textDecoration: 'none', color: 'primary.main', '&:hover': { textDecoration: 'underline' } }}>
                          {gamble.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          {gamble.rules}
                        </Typography>
                        {gamble.winnerTeam && (
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            <strong>Winner:</strong> {gamble.winnerTeam}
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Related Events Section */}
            {events.length > 0 && (
              <Card className="gambling-card" sx={{ mt: 4 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h5" gutterBottom>
                      Related Events
                    </Typography>
                    <Button
                      component={Link}
                      href={`/events?faction=${faction.name}`}
                      size="small"
                      color="primary"
                    >
                      View All
                    </Button>
                  </Box>
                  {events.map((event) => (
                    <Card key={event.id} variant="outlined" sx={{ mb: 2 }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Box sx={{ flex: 1 }}>
                            {event.isSpoiler ? (
                              <SpoilerWrapper 
                                chapterNumber={event.spoilerChapter || event.chapterNumber}
                                spoilerType="major"
                                description="Event details and outcome"
                              >
                                <Typography variant="h6" component={Link} href={`/events/${event.id}`}
                                          sx={{ textDecoration: 'none', color: 'primary.main', '&:hover': { textDecoration: 'underline' } }}>
                                  {event.title}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                  {event.description}
                                </Typography>
                              </SpoilerWrapper>
                            ) : (
                              <>
                                <Typography variant="h6" component={Link} href={`/events/${event.id}`}
                                          sx={{ textDecoration: 'none', color: 'primary.main', '&:hover': { textDecoration: 'underline' } }}>
                                  {event.title}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                  {event.description}
                                </Typography>
                              </>
                            )}
                          </Box>
                          {(event.chapterNumber || event.chapter_number) && (
                            <Chip 
                              label={`Ch. ${event.chapterNumber || event.chapter_number}`} 
                              size="small" 
                              color={event.isSpoiler ? "error" : "secondary"} 
                              variant={event.isSpoiler ? "filled" : "outlined"}
                            />
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Media Gallery Section */}
            <Card className="gambling-card" sx={{ mt: 4 }}>
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  Media Gallery
                </Typography>
                <MediaGallery
                  ownerType="faction"
                  ownerId={faction.id}
                  purpose="gallery"
                  showTitle={false}
                  compactMode={false}
                  showFilters={true}
                  allowMultipleTypes={true}
                />
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card className="gambling-card">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Faction Details
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Faction Name
                  </Typography>
                  <Typography variant="body1">
                    {faction.name}
                  </Typography>
                </Box>

                {members.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Known Members
                    </Typography>
                    <Typography variant="body1">
                      {members.length} members
                    </Typography>
                  </Box>
                )}

                <Divider sx={{ my: 2 }} />
                
                <Typography variant="h6" gutterBottom>
                  Quick Links
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Button
                    component={Link}
                    href="/characters"
                    variant="outlined"
                    size="small"
                    fullWidth
                    startIcon={<Users size={16} />}
                  >
                    Browse Characters
                  </Button>
                  <Button
                    component={Link}
                    href="/events"
                    variant="outlined"
                    size="small"
                    fullWidth
                    startIcon={<Crown size={16} />}
                  >
                    Browse Events
                  </Button>
                  <Button
                    component={Link}
                    href="/gambles"
                    variant="outlined"
                    size="small"
                    fullWidth
                    startIcon={<Shield size={16} />}
                  >
                    Browse Gambles
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </motion.div>
    </Container>
  )
}