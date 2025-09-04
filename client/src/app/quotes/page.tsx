'use client'

import React, { useState, useEffect, Suspense } from 'react'
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
  Chip,
  Avatar
} from '@mui/material'
import { Search, Quote, Calendar } from 'lucide-react'
import { useTheme } from '@mui/material/styles'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { motion } from 'motion/react'

interface Quote {
  id: number
  text: string
  speaker: string
  context?: string
  tags: string[]
  chapter?: number
  volume?: number
  submittedBy: {
    id: number
    username: string
  }
  createdAt: string
  updatedAt: string
}

function QuotesPageContent() {
  const theme = useTheme()
  const searchParams = useSearchParams()
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  // Mock data for now - replace with actual API call
  const mockQuotes: Quote[] = [
    {
      id: 1,
      text: "I don't gamble. I calculate.",
      speaker: "Baku Madarame",
      context: "When explaining his approach to games",
      tags: ["Strategy", "Philosophy"],
      chapter: 45,
      volume: 5,
      submittedBy: { id: 1, username: "admin" },
      createdAt: "2024-01-15T10:30:00Z",
      updatedAt: "2024-01-15T10:30:00Z"
    },
    {
      id: 2,
      text: "The moment you think you've won, you've already lost.",
      speaker: "Kaji Takaomi",
      context: "During the Tower of Karma arc",
      tags: ["Wisdom", "Psychology"],
      chapter: 128,
      volume: 12,
      submittedBy: { id: 2, username: "fan123" },
      createdAt: "2024-01-14T15:45:00Z",
      updatedAt: "2024-01-14T15:45:00Z"
    },
    {
      id: 3,
      text: "Fear and excitement... they're the same thing.",
      speaker: "Marco",
      context: "Before entering a high-stakes gamble",
      tags: ["Psychology", "Emotion"],
      chapter: 89,
      volume: 9,
      submittedBy: { id: 3, username: "quotelover" },
      createdAt: "2024-01-13T09:15:00Z",
      updatedAt: "2024-01-13T09:15:00Z"
    }
  ]

  const fetchQuotes = async (page = 1, search = '') => {
    setLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500))
      
      let filteredQuotes = mockQuotes
      if (search) {
        filteredQuotes = mockQuotes.filter(quote => 
          quote.text.toLowerCase().includes(search.toLowerCase()) ||
          quote.speaker.toLowerCase().includes(search.toLowerCase()) ||
          quote.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()))
        )
      }
      
      setQuotes(filteredQuotes)
      setTotal(filteredQuotes.length)
      setTotalPages(Math.ceil(filteredQuotes.length / 12))
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Failed to fetch quotes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchQuotes(currentPage, searchQuery)
  }, [currentPage, searchQuery])

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
                          "{quote.text}"
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

                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 'auto' }}>
                          <Avatar sx={{ width: 20, height: 20, mr: 1, fontSize: '0.75rem' }}>
                            {quote.submittedBy.username[0].toUpperCase()}
                          </Avatar>
                          <Typography 
                            variant="body2" 
                            color="text.secondary"
                            component={Link}
                            href={`/users/${quote.submittedBy.id}`}
                            sx={{ 
                              mr: 1,
                              textDecoration: 'none',
                              '&:hover': { 
                                color: 'primary.main',
                                textDecoration: 'underline'
                              }
                            }}
                          >
                            by {quote.submittedBy.username}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Calendar size={12} />
                            <Typography variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
                              {new Date(quote.createdAt).toLocaleDateString()}
                            </Typography>
                          </Box>
                        </Box>
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

export default function QuotesPage() {
  return (
    <Suspense fallback={
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress size={50} />
        </Box>
      </Container>
    }>
      <QuotesPageContent />
    </Suspense>
  )
}