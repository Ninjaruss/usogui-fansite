'use client'

import React, { useState } from 'react'
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
import { Search, Book, Hash } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { api } from '../../lib/api'
import { motion } from 'motion/react'
import MediaThumbnail from '../../components/MediaThumbnail'

interface Volume {
  id: number
  number: number
  title?: string
  description?: string
  coverUrl?: string
  startChapter: number
  endChapter: number
}

interface VolumesPageContentProps {
  initialVolumes: Volume[]
  initialTotalPages: number
  initialTotal: number
  initialPage: number
  initialSearch: string
  initialError: string
}

export default function VolumesPageContent({
  initialVolumes,
  initialTotalPages,
  initialTotal,
  initialPage,
  initialSearch,
  initialError
}: VolumesPageContentProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [volumes, setVolumes] = useState<Volume[]>(initialVolumes)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(initialError)
  const [searchTerm, setSearchTerm] = useState(initialSearch)
  const [page, setPage] = useState(initialPage)
  const [totalPages, setTotalPages] = useState(initialTotalPages)
  const [total, setTotal] = useState(initialTotal)

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
    router.push(`/volumes?${params.toString()}`)
  }

  const fetchVolumes = async (searchValue: string, pageValue: number) => {
    try {
      setLoading(true)
      const params: { page: number; limit: number; search?: string } = { page: pageValue, limit: 12 }
      if (searchValue.trim()) {
        params.search = searchValue
      }
      
      const response = await api.getVolumes(params)
      setVolumes(response.data)
      setTotalPages(response.totalPages)
      setTotal(response.total)
      setError('')
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSearch = event.target.value
    setSearchTerm(newSearch)
    setPage(1)
    updateURL(newSearch, 1)
    
    // Debounce the API call
    const timeoutId = setTimeout(() => {
      fetchVolumes(newSearch, 1)
    }, 300)
    
    return () => clearTimeout(timeoutId)
  }

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value)
    updateURL(searchTerm, value)
    fetchVolumes(searchTerm, value)
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
        <Book size={48} style={{ marginBottom: 16 }} />
        <Typography variant="h2" component="h1" gutterBottom>
          Volumes
        </Typography>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          Explore the complete collection of Usogui volumes
        </Typography>
      </Box>

      <Box sx={{ mb: 4 }}>
        <TextField
          fullWidth
          placeholder="Search volumes by number..."
          value={searchTerm}
          onChange={handleSearchChange}
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
              {total} volumes found
            </Typography>
          </Box>

          <Grid container spacing={3}>
            {volumes.map((volume) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={volume.id}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card 
                    className="gambling-card"
                    sx={{ 
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                      '&:hover': { 
                        transform: 'translateY(-4px)',
                        boxShadow: 6
                      }
                    }}
                  >
                    <Box sx={{ position: 'relative' }}>
                      <MediaThumbnail
                        entityType="volume"
                        entityId={volume.id}
                        entityName={`Volume ${volume.number}`}
                        maxWidth="100%"
                        maxHeight="200px"
                        allowCycling={false}
                      />
                    </Box>
                    
                    <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Typography 
                          variant="h5" 
                          component={Link}
                          href={`/volumes/${volume.id}`}
                          sx={{ 
                            textDecoration: 'none', 
                            color: 'primary.main',
                            '&:hover': { textDecoration: 'underline' }
                          }}
                        >
                          Volume {volume.number}
                        </Typography>
                        <Chip 
                          label={`Vol. ${volume.number}`}
                          size="small"
                          variant="outlined"
                          color="primary"
                        />
                      </Box>

                      {volume.title && (
                        <Typography 
                          variant="h6" 
                          color="text.secondary" 
                          gutterBottom
                          sx={{ fontSize: '1rem', fontWeight: 500 }}
                        >
                          {volume.title}
                        </Typography>
                      )}

                      <Box sx={{ mb: 2 }}>
                        <Chip
                          label={`Ch. ${volume.startChapter}-${volume.endChapter}`}
                          size="small"
                          color="secondary"
                          variant="outlined"
                          icon={<Hash size={14} />}
                        />
                      </Box>

                      {volume.description && (
                        <Typography 
                          variant="body2" 
                          color="text.secondary"
                          sx={{ 
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            mt: 'auto'
                          }}
                        >
                          {volume.description}
                        </Typography>
                      )}

                      <Box sx={{ mt: 2, pt: 1, borderTop: 1, borderColor: 'divider' }}>
                        <Typography variant="caption" color="text.secondary">
                          {volume.endChapter - volume.startChapter + 1} chapters
                        </Typography>
                      </Box>
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

          {volumes.length === 0 && !loading && (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h6" color="text.secondary">
                No volumes found
              </Typography>
            </Box>
          )}
        </>
      )}
    </motion.div>
  )
}
