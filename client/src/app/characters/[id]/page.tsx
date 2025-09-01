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
  Divider,
  List,
  ListItem,
  ListItemText
} from '@mui/material'
import { ArrowLeft, User, Crown, Users as UsersIcon } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { api } from '../../../lib/api'
import { motion } from 'motion/react'

interface Character {
  id: number
  name: string
  alternateNames: string[]
  description: string
  firstAppearanceChapter: number
  notableRoles: string[]
  notableGames: string[]
  occupation: string
  affiliations: string[]
}

export default function CharacterDetailPage() {
  const [character, setCharacter] = useState<Character | null>(null)
  const [gambles, setGambles] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [guides, setGuides] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const params = useParams()

  useEffect(() => {
    const fetchCharacterData = async () => {
      try {
        const id = Array.isArray(params.id) ? params.id[0] : params.id
        const characterId = Number(id)
        
        // Fetch character and related data in parallel
        const [characterData, gamblesData, eventsData, guidesData] = await Promise.all([
          api.getCharacter(characterId),
          api.getCharacterGambles(characterId, { limit: 5 }),
          api.getCharacterEvents(characterId, { limit: 5 }),
          api.getCharacterGuides(characterId, { limit: 5 })
        ])
        
        setCharacter(characterData)
        setGambles(gamblesData.data || [])
        setEvents(eventsData.data || [])
        setGuides(guidesData.data || [])
      } catch (error: any) {
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchCharacterData()
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

  if (error || !character) {
    return (
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Alert severity="error">
          {error || 'Character not found'}
        </Alert>
        <Box sx={{ mt: 3 }}>
          <Button component={Link} href="/characters" startIcon={<ArrowLeft />}>
            Back to Characters
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
          href="/characters"
          startIcon={<ArrowLeft />}
          sx={{ mb: 3 }}
        >
          Back to Characters
        </Button>

        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <User size={48} color="#1976d2" />
          </Box>
          <Typography variant="h3" component="h1" gutterBottom>
            {character.name}
          </Typography>
          
          {character.alternateNames?.length > 0 && (
            <Box sx={{ mb: 2 }}>
              {character.alternateNames.map((name) => (
                <Chip
                  key={name}
                  label={name}
                  size="medium"
                  variant="outlined"
                  color="secondary"
                  sx={{ mr: 1, mb: 1 }}
                />
              ))}
            </Box>
          )}
        </Box>

        <Grid container spacing={4}>
          <Grid item xs={12} md={8}>
            <Card className="gambling-card">
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  About
                </Typography>
                <Typography variant="body1" paragraph>
                  {character.description}
                </Typography>

                {character.occupation && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      Occupation
                    </Typography>
                    <Typography variant="body1" paragraph>
                      {character.occupation}
                    </Typography>
                  </>
                )}

                {character.notableRoles?.length > 0 && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      Notable Roles
                    </Typography>
                    <List dense>
                      {character.notableRoles.map((role, index) => (
                        <ListItem key={index} sx={{ pl: 0 }}>
                          <ListItemText primary={role} />
                        </ListItem>
                      ))}
                    </List>
                  </>
                )}

                {character.notableGames?.length > 0 && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      Notable Gambles
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {character.notableGames.map((game) => (
                        <Chip
                          key={game}
                          label={game}
                          color="primary"
                          variant="outlined"
                          icon={<Crown size={16} />}
                        />
                      ))}
                    </Box>
                  </>
                )}

                {character.affiliations?.length > 0 && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      Affiliations
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {character.affiliations.map((affiliation) => (
                        <Chip
                          key={affiliation}
                          label={affiliation}
                          color="secondary"
                          variant="filled"
                          icon={<UsersIcon size={16} />}
                        />
                      ))}
                    </Box>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Gambles Section */}
            {gambles.length > 0 && (
              <Card className="gambling-card" sx={{ mt: 4 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h5" gutterBottom>
                      Related Gambles
                    </Typography>
                    <Button
                      component={Link}
                      href={`/gambles?character=${character.name}`}
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

            {/* Events Section */}
            {events.length > 0 && (
              <Card className="gambling-card" sx={{ mt: 4 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h5" gutterBottom>
                      Related Events (Chronological)
                    </Typography>
                    <Button
                      component={Link}
                      href={`/events?character=${character.name}`}
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
                            <Typography variant="h6" component={Link} href={`/events/${event.id}`}
                                      sx={{ textDecoration: 'none', color: 'primary.main', '&:hover': { textDecoration: 'underline' } }}>
                              {event.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                              {event.description}
                            </Typography>
                            {event.outcome && (
                              <Typography variant="body2" sx={{ mt: 1 }}>
                                <strong>Outcome:</strong> {event.outcome}
                              </Typography>
                            )}
                          </Box>
                          {event.chapter_number && (
                            <Chip 
                              label={`Ch. ${event.chapter_number}`} 
                              size="small" 
                              color="secondary" 
                              variant="outlined" 
                            />
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Guides Section */}
            {guides.length > 0 && (
              <Card className="gambling-card" sx={{ mt: 4 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h5" gutterBottom>
                      Related Guides
                    </Typography>
                    <Button
                      component={Link}
                      href={`/guides?character=${character.name}`}
                      size="small"
                      color="primary"
                    >
                      View All
                    </Button>
                  </Box>
                  {guides.map((guide) => (
                    <Card key={guide.id} variant="outlined" sx={{ mb: 2 }}>
                      <CardContent>
                        <Typography variant="h6" component={Link} href={`/guides/${guide.id}`}
                                  sx={{ textDecoration: 'none', color: 'primary.main', '&:hover': { textDecoration: 'underline' } }}>
                          {guide.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          {guide.description}
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                          <Typography variant="caption" color="text.secondary">
                            By {guide.author?.username || 'Unknown'}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Typography variant="caption" color="text.secondary">
                              {guide.like_count} likes
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {guide.view_count} views
                            </Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </CardContent>
              </Card>
            )}
          </Grid>

          <Grid item xs={12} md={4}>
            <Card className="gambling-card">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Character Stats
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    First Appearance
                  </Typography>
                  <Typography variant="body1">
                    Chapter {character.firstAppearanceChapter}
                  </Typography>
                </Box>

                {character.occupation && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Primary Role
                    </Typography>
                    <Typography variant="body1">
                      {character.occupation}
                    </Typography>
                  </Box>
                )}

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Total Aliases
                  </Typography>
                  <Typography variant="body1">
                    {character.alternateNames?.length || 0}
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Known Gambles
                  </Typography>
                  <Typography variant="body1">
                    {character.notableGames?.length || 0}
                  </Typography>
                </Box>

                <Divider sx={{ my: 2 }} />
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Related Content
                  </Typography>
                  <Typography variant="body1">
                    {gambles.length} Gambles
                  </Typography>
                  <Typography variant="body1">
                    {events.length} Events
                  </Typography>
                  <Typography variant="body1">
                    {guides.length} Guides
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </motion.div>
    </Container>
  )
}