'use client'

import React, { useState, useEffect, Suspense } from 'react'
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Box,
  TextField,
  InputAdornment,
  Pagination,
  CircularProgress,
  Alert,
  Chip,
  Avatar
} from '@mui/material'
import { Search, FileText, Eye, Calendar, ThumbsUp, Heart, X } from 'lucide-react'
import { useTheme } from '@mui/material/styles'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { api } from '../../lib/api'
import { motion } from 'motion/react'
import { useAuth } from '../../providers/AuthProvider'

interface Guide {
  id: number
  title: string
  content: string
  tags: string[]
  author: {
    id: number
    username: string
  }
  likeCount: number
  userHasLiked?: boolean
  viewCount: number
  createdAt: string
  updatedAt: string
}

function GuidesPageContent() {
  const { user } = useAuth()
  const theme = useTheme()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [guides, setGuides] = useState<Guide[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [liking, setLiking] = useState<number | null>(null)
  const [authorFilter, setAuthorFilter] = useState<string | null>(null)
  const [authorName, setAuthorName] = useState<string | null>(null)

  const fetchGuides = async (page = 1, search = '', authorId?: string) => {
    setLoading(true)
    try {
      const params: { page: number; limit: number; title?: string; authorId?: string } = { page, limit: 12 }
      if (search) params.title = search
      if (authorId) params.authorId = authorId
      
      const response = await api.getGuides(params)
      setGuides(response.data)
      setTotalPages(response.totalPages)
      setTotal(response.total)
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Failed to fetch guides')
    } finally {
      setLoading(false)
    }
  }

  // Handle URL parameter changes
  useEffect(() => {
    const authorParam = searchParams.get('author')
    const authorNameParam = searchParams.get('authorName')
    
    console.log('URL params changed:', { authorParam, authorNameParam })
    
    // Update state
    setAuthorFilter(authorParam)
    setAuthorName(authorNameParam)
    setCurrentPage(1)
    
    // Only clear search when initially setting an author filter from URL
    // Don't clear it if user is searching within an author's guides
    if (authorParam && !searchQuery) {
      setSearchQuery('')
    }
  }, [searchParams])

  // Handle data fetching - this will trigger when authorFilter changes from the above effect
  useEffect(() => {
    fetchGuides(currentPage, searchQuery, authorFilter || undefined)
  }, [currentPage, searchQuery, authorFilter])

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value)
    setCurrentPage(1)
  }

  const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
    setCurrentPage(page)
  }

  const clearAuthorFilter = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('author')
    params.delete('authorName')
    router.push(`/guides${params.toString() ? `?${params.toString()}` : ''}`)
  }

  const getContentPreview = (content: string, maxLength = 150) => {
    if (!content) return 'No content available'
    if (content.length <= maxLength) return content
    return content.slice(0, maxLength).replace(/\s+\S*$/, '') + '...'
  }

  const handleLikeToggle = async (guideId: number) => {
    if (!user || liking === guideId) return
    
    setLiking(guideId)
    try {
      const response = await api.toggleGuideLike(guideId)
      setGuides(guides.map(guide => 
        guide.id === guideId 
          ? { ...guide, likeCount: response.likeCount, userHasLiked: response.liked }
          : guide
      ))
    } catch (error: unknown) {
      console.error('Error toggling like:', error)
    } finally {
      setLiking(null)
    }
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
            <FileText size={48} color={theme.palette.usogui.guide} />
          </Box>
          <Typography variant="h3" component="h1" gutterBottom>
            Community Guides
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
            In-depth analysis and insights from the Usogui community
          </Typography>
          
          <Button
            component={Link}
            href="/submit-guide"
            variant="contained"
            size="large"
            startIcon={<FileText size={20} />}
            sx={{ 
              mb: 2,
              px: 4,
              py: 1.5,
              fontSize: '1.1rem'
            }}
          >
            Write Guide
          </Button>
        </Box>

        <Box sx={{ mb: 4 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search guides..."
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

        {authorFilter && authorName && (
          <Box sx={{ mb: 3 }}>
            <Chip
              label={`Author: ${authorName}`}
              onDelete={clearAuthorFilter}
              deleteIcon={<X size={16} />}
              color="primary"
              variant="outlined"
              sx={{ fontSize: '0.875rem' }}
            />
          </Box>
        )}

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
              {total} guide{total !== 1 ? 's' : ''} published
            </Typography>

            <Grid container spacing={4}>
              {guides.map((guide, index) => (
                <Grid item xs={12} md={6} key={guide.id}>
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
                        <Typography variant="h6" component="h2" gutterBottom>
                          {guide.title}
                        </Typography>

                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <Avatar sx={{ width: 24, height: 24, mr: 1, fontSize: '0.875rem' }}>
                            {guide.author.username[0].toUpperCase()}
                          </Avatar>
                          <Typography 
                            variant="body2" 
                            color="text.secondary" 
                            component={Link}
                            href={`/users/${guide.author.id}`}
                            sx={{ 
                              mr: 2,
                              textDecoration: 'none',
                              '&:hover': { 
                                color: 'primary.main',
                                textDecoration: 'underline'
                              }
                            }}
                          >
                            by {guide.author.username}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Calendar size={14} />
                            <Typography variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
                              {new Date(guide.createdAt).toLocaleDateString()}
                            </Typography>
                          </Box>
                        </Box>
                        
                        {guide.tags?.length > 0 && (
                          <Box sx={{ mb: 2 }}>
                            {guide.tags.slice(0, 3).map((tag, index) => (
                              <Chip
                                key={`${guide.id}-tag-${index}`}
                                label={typeof tag === 'object' ? (tag as any)?.name || String(tag) : tag}
                                size="small"
                                variant="outlined"
                                color="secondary"
                                sx={{ mr: 0.5, mb: 0.5 }}
                              />
                            ))}
                            {guide.tags.length > 3 && (
                              <Chip
                                label={`+${guide.tags.length - 3} more`}
                                size="small"
                                variant="outlined"
                                color="default"
                                sx={{ mb: 0.5 }}
                              />
                            )}
                          </Box>
                        )}

                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mb: 2 }}
                        >
                          {getContentPreview(guide.content)}
                        </Typography>

                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Eye size={16} />
                              <Typography variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
                                {guide.viewCount || 0} views
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <ThumbsUp size={16} />
                              <Typography variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
                                {guide.likeCount || 0} likes
                              </Typography>
                            </Box>
                          </Box>
                          {user && (
                            <Button
                              size="small"
                              variant={guide.userHasLiked ? "contained" : "outlined"}
                              color="primary"
                              startIcon={<Heart size={14} />}
                              onClick={(e) => {
                                e.preventDefault()
                                handleLikeToggle(guide.id)
                              }}
                              disabled={liking === guide.id}
                              sx={{ minWidth: 'auto', px: 1 }}
                            >
                              {liking === guide.id ? '...' : guide.userHasLiked ? 'Liked' : 'Like'}
                            </Button>
                          )}
                        </Box>
                      </CardContent>

                      <CardActions>
                        <Button
                          component={Link}
                          href={`/guides/${guide.id}`}
                          variant="outlined"
                          startIcon={<Eye size={16} />}
                          fullWidth
                        >
                          Read Guide
                        </Button>
                      </CardActions>
                    </Card>
                  </motion.div>
                </Grid>
              ))}
            </Grid>

            {guides.length === 0 && !loading && (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <FileText size={64} color={theme.palette.text.secondary} />
                <Typography variant="h6" color="text.secondary" sx={{ mt: 2, mb: 1 }}>
                  No guides found
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  Be the first to contribute to the community knowledge base!
                </Typography>
                <Button
                  component={Link}
                  href="/submit-guide"
                  variant="contained"
                  startIcon={<FileText size={20} />}
                >
                  Write Your First Guide
                </Button>
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

export default function GuidesPage() {
  return (
    <Suspense fallback={
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress size={50} />
        </Box>
      </Container>
    }>
      <GuidesPageContent />
    </Suspense>
  )
}