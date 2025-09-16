'use client'

import React, { useState, useEffect } from 'react'
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  TextField,
  InputAdornment,
  Pagination,
  CircularProgress,
  Alert,
  Chip
} from '@mui/material'
import { Search, Quote } from 'lucide-react'
import { useTheme } from '@mui/material/styles'
import { useSearchParams } from 'next/navigation'
import { motion } from 'motion/react'
import api from '@/lib/api'

interface Quote {
  id: number
  text: string
  speaker: string
  context?: string
  tags: string[]
  chapter?: number
  volume?: number
  updatedAt: string
}

export default function QuotesPageContent() {
  const theme = useTheme()
  const searchParams = useSearchParams()
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [characterName, setCharacterName] = useState<string | null>(null)

  const fetchQuotes = async (page = 1, search = '', characterId?: string | null) => {
    setLoading(true)
    try {
      const data = await api.getQuotes({
        page,
        limit: 12,
        search: search || undefined,
        characterId: characterId && !isNaN(Number(characterId)) ? Number(characterId) : undefined
      })

      // Transform the API response to match the expected format
      const transformedQuotes = data.data.map((quote: any) => ({
        id: quote.id,
        text: quote.text,
        speaker: quote.character?.name || 'Unknown',
        context: quote.description || quote.context,
        tags: quote.tags ? (Array.isArray(quote.tags) ? quote.tags : [quote.tags]) : [],
        chapter: quote.chapterNumber,
        volume: quote.volumeNumber,
        updatedAt: quote.updatedAt
      }))

      setQuotes(transformedQuotes)
      setTotal(data.total || 0)
      setTotalPages(data.totalPages || Math.ceil((data.total || 0) / 12))
    } catch (error: unknown) {
      console.error('Error fetching quotes:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch quotes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const characterIdFilter = searchParams.get('characterId')
    fetchQuotes(currentPage, searchQuery, characterIdFilter)

    // Fetch character name for display
    if (characterIdFilter && !characterName && !isNaN(Number(characterIdFilter))) {
      const numericId = Number(characterIdFilter)
      if (numericId > 0) {
        api.getCharacter(numericId)
          .then(character => setCharacterName(character.name))
          .catch(() => setCharacterName('Unknown'))
      }
    } else if (!characterIdFilter) {
      setCharacterName(null)
    }
  }, [currentPage, searchQuery, searchParams, characterName])

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value)
    setCurrentPage(1)
  }

  const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
    setCurrentPage(page)
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <Quote size={48} color={theme.palette.primary.main} />
          </Box>
          <Typography variant="h3" component="h1" gutterBottom>
            Memorable Quotes
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
            Iconic lines and wisdom from the world of Usogui
          </Typography>
        </Box>

        <Box sx={{ mb: 4 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search quotes, speakers, or tags..."
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
          {searchParams.get('characterId') && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Chip
                label={`Filtered by character: ${characterName || 'Loading...'}`}
                variant="filled"
                color="primary"
                onDelete={() => {
                  const newUrl = new URL(window.location.href)
                  newUrl.searchParams.delete('characterId')
                  window.history.pushState({}, '', newUrl.toString())
                  window.location.reload()
                }}
              />
            </Box>
          )}
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
              {total} quote{total !== 1 ? 's' : ''} found
            </Typography>

            <Grid container spacing={4}>
              {quotes.map((quote, index) => (
                <Grid item xs={12} md={6} lg={4} key={quote.id}>
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
                        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                          <Quote size={24} color={theme.palette.primary.main} />
                        </Box>

                        <Typography
                          variant="body1"
                          sx={{
                            mb: 3,
                            fontStyle: 'italic',
                            textAlign: 'center',
                            fontSize: '1.1rem',
                            lineHeight: 1.6
                          }}
                        >
                          &ldquo;{quote.text}&rdquo;
                        </Typography>

                        <Typography
                          variant="h6"
                          component="div"
                          sx={{
                            mb: 1,
                            textAlign: 'center',
                            fontWeight: 'bold',
                            color: 'primary.main'
                          }}
                        >
                          — {quote.speaker}
                        </Typography>

                        {quote.context && (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mb: 2, textAlign: 'center', fontStyle: 'italic' }}
                          >
                            {quote.context}
                          </Typography>
                        )}

                        {(quote.chapter || quote.volume) && (
                          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                            <Typography variant="body2" color="text.secondary">
                              {quote.volume && `Volume ${quote.volume}`}
                              {quote.volume && quote.chapter && ', '}
                              {quote.chapter && `Chapter ${quote.chapter}`}
                            </Typography>
                          </Box>
                        )}

                        {quote.tags?.length > 0 && (
                          <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
                            {quote.tags.map((tag, tagIndex) => (
                              <Chip
                                key={`${quote.id}-tag-${tagIndex}`}
                                label={tag}
                                size="small"
                                variant="outlined"
                                color="secondary"
                                sx={{ mr: 0.5, mb: 0.5 }}
                              />
                            ))}
                          </Box>
                        )}

                      </CardContent>
                    </Card>
                  </motion.div>
                </Grid>
              ))}
            </Grid>

            {quotes.length === 0 && !loading && (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Quote size={64} color={theme.palette.text.secondary} />
                <Typography variant="h6" color="text.secondary" sx={{ mt: 2, mb: 1 }}>
                  No quotes found
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  {searchQuery ? 'Try adjusting your search terms.' : 'Be the first to submit a memorable quote!'}
                </Typography>
              </Box>
            )}

            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
                <Pagination
                  count={totalPages}
                  page={currentPage}
                  onChange={handlePageChange}
                  color="primary"
                  size="large"
                />
              </Box>
            )}
          </>
        )}
      </motion.div>
    </Container>
  )
}