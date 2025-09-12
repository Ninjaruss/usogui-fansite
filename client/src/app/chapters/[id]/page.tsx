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
import { ArrowLeft, BookOpen } from 'lucide-react'
import { useTheme } from '@mui/material/styles'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { api } from '../../../lib/api'
import { motion } from 'motion/react'
import TimelineSpoilerWrapper from '../../../components/TimelineSpoilerWrapper'
import { usePageView } from '../../../hooks/usePageView'

interface Volume {
  id: number
  number: number
  title?: string
}

interface Character {
  id: number
  name: string
}

interface Event {
  id: number
  title: string
  description: string
}

interface Quote {
  id: number
  text: string
  pageNumber?: number
  character?: Character
}

interface Chapter {
  id: number
  number: number
  chapterNumber?: number
  title?: string | null
  summary?: string | null
  description?: string
  volumeId?: number
  volume?: Volume
  createdAt?: string
  updatedAt?: string
}

export default function ChapterDetailPage() {
  const theme = useTheme()
  const [chapter, setChapter] = useState<Chapter | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [characters, setCharacters] = useState<Character[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const params = useParams()

  // Track page view
  const chapterId = Array.isArray(params.id) ? params.id[0] : params.id
  usePageView('chapter', chapterId || '', !!chapterId)

  useEffect(() => {
    const fetchChapterData = async () => {
      try {
        const id = Array.isArray(params.id) ? params.id[0] : params.id
        const chapterIdNum = Number(id)
        
        // Fetch chapter data
        const chapterData = await api.getChapter(chapterIdNum)
        setChapter(chapterData)

        // Fetch related data - for now we'll just set empty arrays
        // In a real implementation, you'd have API endpoints for chapter-related data
        setEvents([])
        setQuotes([])
        setCharacters([])
      } catch (error: unknown) {
        setError(error instanceof Error ? error.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchChapterData()
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

  if (error || !chapter) {
    return (
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Alert severity="error">
          {error || 'Chapter not found'}
        </Alert>
        <Box sx={{ mt: 3 }}>
          <Button component={Link} href="/chapters" startIcon={<ArrowLeft />}>
            Back to Chapters
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
          href="/chapters"
          startIcon={<ArrowLeft />}
          sx={{ mb: 3 }}
        >
          Back to Chapters
        </Button>

        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <BookOpen size={48} color={theme.palette.primary.main} />
          </Box>
          
          <Typography variant="h3" component="h1" gutterBottom>
            Chapter {chapter.number}
          </Typography>
          
          {chapter.title && (
            <Typography variant="h5" color="text.secondary" gutterBottom>
              {chapter.title}
            </Typography>
          )}

          {chapter.volume && (
            <Box sx={{ mt: 2 }}>
              <Chip
                label={`Volume ${chapter.volume.number}${chapter.volume.title ? `: ${chapter.volume.title}` : ''}`}
                component={Link}
                href={`/volumes/${chapter.volume.id}`}
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
            </Box>
          )}
        </Box>

        <Grid container spacing={4}>
          <Grid item xs={12} md={8}>
            {(chapter.description || chapter.summary) && (
              <Card className="gambling-card">
                <CardContent>
                  <Typography variant="h5" gutterBottom>
                    Chapter Summary
                  </Typography>
                  <TimelineSpoilerWrapper 
                    chapterNumber={chapter.number}
                  >
                    <Typography variant="body1" paragraph>
                      {chapter.description || chapter.summary}
                    </Typography>
                  </TimelineSpoilerWrapper>
                </CardContent>
              </Card>
            )}

            {/* Events Section */}
            {events.length > 0 && (
              <Card className="gambling-card" sx={{ mt: 4 }}>
                <CardContent>
                  <Typography variant="h5" gutterBottom>
                    Chapter Events
                  </Typography>
                  {events.map((event) => (
                    <Card key={event.id} variant="outlined" sx={{ mb: 2 }}>
                      <CardContent>
                        <Typography variant="h6" component={Link} href={`/events/${event.id}`}
                                  sx={{ textDecoration: 'none', color: 'primary.main', '&:hover': { textDecoration: 'underline' } }}>
                          {event.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          {event.description}
                        </Typography>
                      </CardContent>
                    </Card>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Quotes Section */}
            {quotes.length > 0 && (
              <Card className="gambling-card" sx={{ mt: 4 }}>
                <CardContent>
                  <Typography variant="h5" gutterBottom>
                    Memorable Quotes
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {quotes.map((quote) => (
                      <Box key={quote.id} sx={{ 
                        p: 2, 
                        border: 1, 
                        borderColor: 'divider', 
                        borderRadius: 1,
                        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)'
                      }}>
                        <Typography variant="body2" sx={{ fontStyle: 'italic', mb: 1, lineHeight: 1.4 }}>
                          &ldquo;{quote.text}&rdquo;
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {quote.character && `— ${quote.character.name}`}
                          {quote.pageNumber && `, p.${quote.pageNumber}`}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            )}
          </Grid>

          <Grid item xs={12} md={4}>
            <Card className="gambling-card">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Chapter Info
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Chapter Number
                  </Typography>
                  <Typography variant="body1">
                    {chapter.number}
                  </Typography>
                </Box>

                {chapter.volume && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Volume
                    </Typography>
                    <Typography 
                      variant="body1" 
                      component={Link} 
                      href={`/volumes/${chapter.volume.id}`}
                      sx={{ 
                        textDecoration: 'none', 
                        color: 'primary.main',
                        '&:hover': { textDecoration: 'underline' }
                      }}
                    >
                      Volume {chapter.volume.number}
                      {chapter.volume.title && ` - ${chapter.volume.title}`}
                    </Typography>
                  </Box>
                )}

                {/* Characters Section */}
                {characters.length > 0 && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      Featured Characters
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                      {characters.map((character) => (
                        <Chip
                          key={character.id}
                          label={character.name}
                          size="small"
                          component={Link}
                          href={`/characters/${character.id}`}
                          clickable
                          color="secondary"
                          variant="outlined"
                          sx={{ 
                            textDecoration: 'none',
                            '&:hover': { 
                              backgroundColor: 'secondary.main',
                              color: 'white'
                            }
                          }}
                        />
                      ))}
                    </Box>
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