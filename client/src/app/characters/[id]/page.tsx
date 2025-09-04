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
import { useTheme } from '@mui/material/styles'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { api } from '../../../lib/api'
import { motion } from 'motion/react'
import SpoilerWrapper from '../../../components/SpoilerWrapper'
import { usePageView } from '../../../hooks/usePageView'
import MediaGallery from '../../../components/MediaGallery'

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
  imageFileName?: string
  imageDisplayName?: string
  arcs?: Array<{
    id: number
    name: string
    order: number
  }>
}

export default function CharacterDetailPage() {
  const theme = useTheme()
  const [character, setCharacter] = useState<Character | null>(null)
  const [gambles, setGambles] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [guides, setGuides] = useState<any[]>([])
  const [quotes, setQuotes] = useState<any[]>([])
  const [arcs, setArcs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const params = useParams()

  // Track page view
  const characterId = Array.isArray(params.id) ? params.id[0] : params.id
  usePageView('character', characterId || '', !!characterId)

  useEffect(() => {
    const fetchCharacterData = async () => {
      try {
        const id = Array.isArray(params.id) ? params.id[0] : params.id
        const characterId = Number(id)
        
        // Fetch character and related data in parallel
        const [characterData, gamblesData, eventsData, guidesData, quotesData, arcsData] = await Promise.all([
          api.getCharacter(characterId),
          api.getCharacterGambles(characterId, { limit: 5 }),
          api.getCharacterEvents(characterId, { limit: 5 }),
          api.getCharacterGuides(characterId, { limit: 5 }),
          api.getCharacterQuotes(characterId, { limit: 10 }),
          api.getCharacterArcs(characterId)
        ])
        
        setCharacter(characterData)
        setGambles(gamblesData.data || [])
        setEvents(eventsData.data || [])
        setGuides(guidesData.data || [])
        setQuotes(quotesData.data || [])
        setArcs(arcsData.data || [])
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
          <Typography variant="h3" component="h1" gutterBottom>
            {character.name}
          </Typography>
          
          {character.imageFileName ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
              <img 
                src={`/api/media/character/${character.imageFileName}`}
                alt={character.imageDisplayName || `${character.name} portrait`}
                style={{ 
                  maxWidth: '200px',
                  maxHeight: '300px',
                  borderRadius: '8px',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                }}
              />
            </Box>
          ) : (
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
              <User size={48} color={theme.palette.usogui.character} />
            </Box>
          )}
          
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
                <SpoilerWrapper 
                  chapterNumber={character.firstAppearanceChapter}
                  spoilerType="minor"
                  description="Character background and story role"
                >
                  <Typography variant="body1" paragraph>
                    {character.description}
                  </Typography>
                </SpoilerWrapper>

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
                    <SpoilerWrapper 
                      chapterNumber={character.firstAppearanceChapter}
                      spoilerType="major"
                      description="Character's story roles and significance"
                    >
                      <List dense>
                        {character.notableRoles.map((role, index) => (
                          <ListItem key={index} sx={{ pl: 0 }}>
                            <ListItemText primary={role} />
                          </ListItem>
                        ))}
                      </List>
                    </SpoilerWrapper>
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
                    <SpoilerWrapper 
                      chapterNumber={character.firstAppearanceChapter}
                      spoilerType="major"
                      description="Character's group affiliations and alliances"
                    >
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {character.affiliations.map((affiliation) => (
                          <Chip
                            key={affiliation}
                            label={affiliation}
                            color="secondary"
                            variant="filled"
                            icon={<UsersIcon size={16} />}
                            component={Link}
                            href={`/factions?name=${encodeURIComponent(affiliation)}`}
                            clickable
                            sx={{ 
                              textDecoration: 'none',
                              '&:hover': { 
                                backgroundColor: 'secondary.dark'
                              }
                            }}
                          />
                        ))}
                      </Box>
                    </SpoilerWrapper>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Quotes Section - Streamlined */}
            {quotes.length > 0 && (
              <Card className="gambling-card" sx={{ mt: 4 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h5" gutterBottom>
                      Memorable Quotes
                    </Typography>
                    <Button
                      component={Link}
                      href={`/quotes?character=${character.name}`}
                      size="small"
                      color="primary"
                    >
                      View All
                    </Button>
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {quotes.slice(0, 3).map((quote) => (
                      <Box key={quote.id} sx={{ 
                        p: 2, 
                        border: 1, 
                        borderColor: 'divider', 
                        borderRadius: 1,
                        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)'
                      }}>
                        <SpoilerWrapper 
                          chapterNumber={quote.chapterNumber}
                          spoilerType="minor"
                          description="Character quote and context"
                        >
                          <Typography variant="body2" sx={{ fontStyle: 'italic', mb: 1, lineHeight: 1.4 }}>
                            "{quote.text}"
                          </Typography>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="caption" color="text.secondary">
                              Ch. {quote.chapterNumber}{quote.pageNumber && `, p.${quote.pageNumber}`}
                            </Typography>
                          </Box>
                        </SpoilerWrapper>
                      </Box>
                    ))}
                    {quotes.length > 3 && (
                      <Box sx={{ textAlign: 'center', pt: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          Showing 3 of {quotes.length} quotes
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>
            )}

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
                                {event.outcome && (
                                  <Typography variant="body2" sx={{ mt: 1 }}>
                                    <strong>Outcome:</strong> {event.outcome}
                                  </Typography>
                                )}
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
                                {event.outcome && (
                                  <Typography variant="body2" sx={{ mt: 1 }}>
                                    <strong>Outcome:</strong> {event.outcome}
                                  </Typography>
                                )}
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
                <MediaGallery 
                  characterId={character.id} 
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
                  Character Stats
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    First Appearance
                  </Typography>
                  <Typography 
                    variant="body1"
                    component={Link}
                    href={`/chapters/${character.firstAppearanceChapter}`}
                    sx={{ 
                      textDecoration: 'none', 
                      color: 'primary.main',
                      '&:hover': { textDecoration: 'underline' }
                    }}
                  >
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
                    Arc Appearances
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                    {arcs.length > 0 ? (
                      arcs.map((arc) => (
                        <Chip
                          key={arc.id}
                          label={arc.name}
                          size="small"
                          component={Link}
                          href={`/arcs/${arc.id}`}
                          clickable
                          color="primary"
                          variant="outlined"
                          sx={{ 
                            textDecoration: 'none',
                            '&:hover': { 
                              backgroundColor: 'primary.main',
                              color: 'white'
                            }
                          }}
                        />
                      ))
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No arc appearances found
                      </Typography>
                    )}
                  </Box>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Gamble Appearances
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                    {gambles.length > 0 ? (
                      gambles.map((gamble) => (
                        <Chip
                          key={gamble.id}
                          label={gamble.name}
                          size="small"
                          component={Link}
                          href={`/gambles/${gamble.id}`}
                          clickable
                          color="primary"
                          variant="outlined"
                          sx={{ 
                            textDecoration: 'none',
                            '&:hover': { 
                              backgroundColor: 'primary.main',
                              color: 'white'
                            }
                          }}
                        />
                      ))
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No gamble appearances found
                      </Typography>
                    )}
                  </Box>
                </Box>

                
                {/* Guides Section - Moved here */}
                {guides.length > 0 && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6" gutterBottom>
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
                        <CardContent sx={{ py: 1 }}>
                          <Typography variant="subtitle2" component={Link} href={`/guides/${guide.id}`}
                                    sx={{ textDecoration: 'none', color: 'primary.main', '&:hover': { textDecoration: 'underline' } }}>
                            {guide.title}
                          </Typography>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                            <Typography variant="caption" color="text.secondary">
                              By {guide.author?.username || 'Unknown'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {guide.viewCount || 0} views
                            </Typography>
                          </Box>
                        </CardContent>
                      </Card>
                    ))}
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </motion.div>
    </Container>
  )
}