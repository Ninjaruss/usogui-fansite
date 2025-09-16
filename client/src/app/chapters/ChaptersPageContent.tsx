'use client'

import React, { useState, useEffect } from 'react'
import {
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  TextField,
  Chip,
  CircularProgress,
  Alert,
  Pagination,
  InputAdornment
} from '@mui/material'
import { Search, BookOpen } from 'lucide-react'
import Link from 'next/link'
import { api } from '../../lib/api'
import { motion } from 'motion/react'
import { useRouter, useSearchParams } from 'next/navigation'

interface Chapter {
  id: number
  number: number
  title?: string | null
  summary?: string | null
  description?: string
  volume?: {
    id: number
    number: number
    title?: string
  }
}

interface ChaptersPageContentProps {
  initialChapters: Chapter[]
  initialTotalPages: number
  initialTotal: number
  initialPage: number
  initialSearch: string
  initialError: string
}

export default function ChaptersPageContent({
  initialChapters,
  initialTotalPages,
  initialTotal,
  initialPage,
  initialSearch,
  initialError
}: ChaptersPageContentProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [chapters, setChapters] = useState<Chapter[]>(initialChapters)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(initialError)
  const [searchTerm, setSearchTerm] = useState(initialSearch)
  const [page, setPage] = useState(initialPage)
  const [totalPages, setTotalPages] = useState(initialTotalPages)
  const [total, setTotal] = useState(initialTotal)

  const limit = 20

  // Update URL params when search or page changes
  const updateURL = (newSearch: string, newPage: number) => {
    const params = new URLSearchParams(searchParams.toString())
    if (newSearch) {
      params.set('search', newSearch)
    } else {
      params.delete('search')
    }
    if (newPage > 1) {
      params.set('page', newPage.toString())
    } else {
      params.delete('page')
    }
    router.push(`/chapters?${params.toString()}`)
  }

  const fetchChapters = async (searchValue: string, pageValue: number) => {
    try {
      setLoading(true)
      const params: Record<string, string | number> = { page: pageValue, limit }
      if (searchValue.trim()) {
        // If searchTerm is a number, search by chapter number
        if (!isNaN(Number(searchValue))) {
          params.number = Number(searchValue)
        } else {
          params.title = searchValue
        }
      }
      
      const response = await api.getChapters(params)
      setChapters(response.data)
      setTotalPages(response.totalPages)
      setTotal(response.total)
      setError('')
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSearch = event.target.value
    setSearchTerm(newSearch)
    setPage(1)
    updateURL(newSearch, 1)
    
    // Debounce the API call
    const timeoutId = setTimeout(() => {
      fetchChapters(newSearch, 1)
    }, 300)
    
    return () => clearTimeout(timeoutId)
  }

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value)
    updateURL(searchTerm, value)
    fetchChapters(searchTerm, value)
  }

  if (error) {
    return (
      <Alert severity="error">{error}</Alert>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <BookOpen size={48} style={{ marginBottom: 16 }} />
        <Typography variant="h2" component="h1" gutterBottom>
          Chapters
        </Typography>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          Explore the story chapter by chapter
        </Typography>
      </Box>

      <Box sx={{ mb: 4 }}>
        <TextField
          fullWidth
          placeholder="Search chapters by number or title..."
          value={searchTerm}
          onChange={handleSearch}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search size={20} />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress size={50} />
        </Box>
      ) : (
        <>
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary">
              {total} chapters found
            </Typography>
          </Box>

          <Grid container spacing={3}>
            {chapters.map((chapter) => (
              <Grid item xs={12} sm={6} md={4} key={chapter.id}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card 
                    className="gambling-card"
                    sx={{ 
                      height: '100%',
                      transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                      '&:hover': { 
                        transform: 'translateY(-4px)',
                        boxShadow: 6
                      }
                    }}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Typography 
                          variant="h5" 
                          component={Link}
                          href={`/chapters/${chapter.id}`}
                          sx={{ 
                            textDecoration: 'none', 
                            color: 'primary.main',
                            '&:hover': { textDecoration: 'underline' }
                          }}
                        >
                          Chapter {chapter.number}
                        </Typography>
                        <Chip 
                          label={`#${chapter.number}`}
                          size="small"
                          variant="outlined"
                          color="primary"
                        />
                      </Box>

                      {chapter.title && (
                        <Typography 
                          variant="h6" 
                          color="text.secondary" 
                          gutterBottom
                          sx={{ fontSize: '1rem', fontWeight: 500 }}
                        >
                          {chapter.title}
                        </Typography>
                      )}

                      {chapter.volume && (
                        <Box sx={{ mb: 1 }}>
                          <Chip
                            label={`Vol. ${chapter.volume.number}`}
                            size="small"
                            component={Link}
                            href={`/volumes/${chapter.volume.id}`}
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
                        </Box>
                      )}

                      {(chapter.description || chapter.summary) && (
                        <Typography 
                          variant="body2" 
                          color="text.secondary"
                          sx={{ 
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            mt: 1
                          }}
                        >
                          {chapter.description || chapter.summary}
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>

          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={handlePageChange}
                color="primary"
                size="large"
              />
            </Box>
          )}

          {chapters.length === 0 && !loading && (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h6" color="text.secondary">
                No chapters found
              </Typography>
            </Box>
          )}
        </>
      )}
    </motion.div>
  )
}
