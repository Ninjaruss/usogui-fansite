'use client'

import React, { useState, useEffect } from 'react'
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
  Chip
} from '@mui/material'
import { Search, FileText, Eye, Calendar, ThumbsUp, Heart, X, Users, BookOpen, Dice6 } from 'lucide-react'
import { useTheme } from '@mui/material/styles'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { api } from '../../lib/api'
import { motion } from 'motion/react'
import { useAuth } from '../../providers/AuthProvider'
import AuthorProfileImage from '../../components/AuthorProfileImage'
import { UserRoleDisplay } from '../../components/BadgeDisplay'

interface Guide {
  id: number
  title: string
  content: string
  description: string
  tags: string[]
  author: {
    id: number
    username: string
    role?: string
    customRole?: string
    profilePictureType?: 'discord' | 'character_media' | null
    selectedCharacterMediaId?: number | null
    selectedCharacterMedia?: {
      id: number
      url: string
      fileName?: string
      description?: string
    } | null
    discordId?: string | null
    discordAvatar?: string | null
  }
  characters?: Array<{
    id: number
    name: string
  }>
  arc?: {
    id: number
    name: string
  }
  gambles?: Array<{
    id: number
    name: string
  }>
  likeCount: number
  userHasLiked?: boolean
  viewCount: number
  createdAt: string
  updatedAt: string
}

interface GuidesPageContentProps {
  initialGuides: Guide[]
  initialTotalPages: number
  initialTotal: number
  initialPage: number
  initialSearch: string
  initialAuthorId?: string
  initialAuthorName?: string
  initialError: string
}

export default function GuidesPageContent({
  initialGuides,
  initialTotalPages,
  initialTotal,
  initialPage,
  initialSearch,
  initialAuthorId,
  initialAuthorName,
  initialError
}: GuidesPageContentProps) {
  const { user } = useAuth()
  const theme = useTheme()
  const router = useRouter()

  const [guides, setGuides] = useState<Guide[]>(initialGuides)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(initialError)
  const [searchQuery, setSearchQuery] = useState(initialSearch)
  const [currentPage, setCurrentPage] = useState(initialPage)
  const [totalPages, setTotalPages] = useState(initialTotalPages)
  const [total, setTotal] = useState(initialTotal)
  const [liking, setLiking] = useState<number | null>(null)
  const [authorFilter, setAuthorFilter] = useState<string | null>(initialAuthorId || null)
  const [authorName, setAuthorName] = useState<string | null>(initialAuthorName || null)

  const fetchGuides = async (page = 1, search = '', authorId?: string) => {
    setLoading(true)
    try {
      const params: { page: number; limit: number; title?: string; authorId?: string; status?: string } = { page, limit: 12, status: 'approved' }
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

  useEffect(() => {
    // Only fetch if different from initial data
    if (
      currentPage !== initialPage ||
      searchQuery !== initialSearch ||
      authorFilter !== initialAuthorId
    ) {
      fetchGuides(currentPage, searchQuery, authorFilter || undefined)
    }
  }, [currentPage, searchQuery, authorFilter, initialPage, initialSearch, initialAuthorId])

  const updateUrl = (newPage: number, newSearch: string, newAuthorId?: string, newAuthorName?: string) => {
    const params = new URLSearchParams()
    if (newSearch) params.set('search', newSearch)
    if (newAuthorId) params.set('author', newAuthorId)
    if (newAuthorName) params.set('authorName', newAuthorName)
    if (newPage > 1) params.set('page', newPage.toString())

    const newUrl = params.toString() ? `?${params.toString()}` : '/guides'
    router.push(newUrl, { scroll: false })
  }

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSearch = event.target.value
    setSearchQuery(newSearch)
    setCurrentPage(1)
    updateUrl(1, newSearch, authorFilter || undefined, authorName || undefined)
  }

  const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
    setCurrentPage(page)
    updateUrl(page, searchQuery, authorFilter || undefined, authorName || undefined)
  }

  const clearAuthorFilter = () => {
    setAuthorFilter(null)
    setAuthorName(null)
    setCurrentPage(1)
    updateUrl(1, searchQuery)
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
                        <AuthorProfileImage
                          author={guide.author}
                          size={24}
                          showFallback={true}
                          className="guide-author-avatar"
                        />
                        <Box sx={{ ml: 1, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0.5 }}>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            component={Link}
                            href={`/users/${guide.author.id}`}
                            sx={{
                              textDecoration: 'none',
                              '&:hover': {
                                color: 'primary.main',
                                textDecoration: 'underline'
                              }
                            }}
                          >
                            by {guide.author.username}
                          </Typography>
                          <UserRoleDisplay
                            userRole={guide.author.role as 'admin' | 'moderator' | 'user' || 'user'}
                            customRole={guide.author.customRole}
                            size="small"
                          />
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', ml: 'auto' }}>
                          <Calendar size={14} />
                          <Typography variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
                            {new Date(guide.createdAt).toLocaleDateString()}
                          </Typography>
                        </Box>
                      </Box>

                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {getContentPreview(guide.description || guide.content)}
                      </Typography>

                      {/* Related Content */}
                      {((guide.characters && guide.characters.length > 0) || guide.arc || (guide.gambles && guide.gambles.length > 0)) && (
                        <Box sx={{ mb: 2 }}>
                          {guide.characters && guide.characters.length > 0 && (
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              <Users size={14} style={{ marginRight: 4 }} />
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {guide.characters.slice(0, 2).map((character) => (
                                  <Chip
                                    key={character.id}
                                    label={character.name}
                                    size="small"
                                    color="primary"
                                    sx={{ fontSize: '0.75rem', height: '20px' }}
                                  />
                                ))}
                                {guide.characters.length > 2 && (
                                  <Chip
                                    label={`+${guide.characters.length - 2}`}
                                    size="small"
                                    color="default"
                                    sx={{ fontSize: '0.75rem', height: '20px' }}
                                  />
                                )}
                              </Box>
                            </Box>
                          )}
                          {guide.arc && (
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              <BookOpen size={14} style={{ marginRight: 4 }} />
                              <Chip
                                label={guide.arc.name}
                                size="small"
                                color="secondary"
                                sx={{ fontSize: '0.75rem', height: '20px' }}
                              />
                            </Box>
                          )}
                          {guide.gambles && guide.gambles.length > 0 && (
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              <Dice6 size={14} style={{ marginRight: 4 }} />
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {guide.gambles.slice(0, 2).map((gamble) => (
                                  <Chip
                                    key={gamble.id}
                                    label={gamble.name}
                                    size="small"
                                    color="info"
                                    sx={{ fontSize: '0.75rem', height: '20px' }}
                                  />
                                ))}
                                {guide.gambles.length > 2 && (
                                  <Chip
                                    label={`+${guide.gambles.length - 2}`}
                                    size="small"
                                    color="default"
                                    sx={{ fontSize: '0.75rem', height: '20px' }}
                                  />
                                )}
                              </Box>
                            </Box>
                          )}
                        </Box>
                      )}

                      {guide.tags?.length > 0 && (
                        <Box sx={{ mb: 2 }}>
                          {guide.tags.slice(0, 3).map((tag, index) => (
                            <Chip
                              key={`${guide.id}-tag-${index}`}
                              label={typeof tag === 'object' ? (tag as any)?.name || String(tag) : tag}
                              size="small"
                              variant="outlined"
                              color="default"
                              sx={{ mr: 0.5, mb: 0.5, fontSize: '0.7rem', opacity: 0.8 }}
                            />
                          ))}
                          {guide.tags.length > 3 && (
                            <Chip
                              label={`+${guide.tags.length - 3} more`}
                              size="small"
                              variant="outlined"
                              color="default"
                              sx={{ mb: 0.5, fontSize: '0.7rem', opacity: 0.8 }}
                            />
                          )}
                        </Box>
                      )}

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
  )
}