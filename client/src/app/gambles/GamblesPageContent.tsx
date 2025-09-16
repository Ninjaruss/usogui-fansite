'use client'

import React, { useState, useEffect } from 'react'
import {
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
import { Eye, Users, Dices, Search } from 'lucide-react'
import { useTheme } from '@mui/material/styles'
import Link from 'next/link'
import EnhancedSpoilerMarkdown from '../../components/EnhancedSpoilerMarkdown'
import { useRouter, useSearchParams } from 'next/navigation'
import { api } from '../../lib/api'
import { motion } from 'motion/react'
import MediaThumbnail from '../../components/MediaThumbnail'

interface Gamble {
  id: number
  name: string
  description?: string
  rules: string
  winCondition?: string
  chapterId: number
  participants?: Array<{
    id: number
    name: string
    description?: string
    alternateNames?: string[]
  }>
  createdAt: string
  updatedAt: string
}

interface GamblesPageContentProps {
  initialGambles: Gamble[]
  initialTotalPages: number
  initialTotal: number
  initialPage: number
  initialSearch: string
  initialCharacterFilter: string
  initialError: string
}

export default function GamblesPageContent({
  initialGambles,
  initialTotalPages,
  initialTotal,
  initialPage,
  initialSearch,
  initialCharacterFilter,
  initialError
}: GamblesPageContentProps) {
  const theme = useTheme()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [gambles, setGambles] = useState<Gamble[]>(initialGambles)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(initialError)
  const [searchQuery, setSearchQuery] = useState(initialSearch)
  const [currentPage, setCurrentPage] = useState(initialPage)
  const [totalPages, setTotalPages] = useState(initialTotalPages)
  const [total, setTotal] = useState(initialTotal)
  const [characterFilter, setCharacterFilter] = useState<string | null>(initialCharacterFilter || null)

  // Update URL params when search, page, or character changes
  const updateURL = (newSearch: string, newPage: number, newCharacter?: string) => {
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
    if (newCharacter) {
      params.set('character', newCharacter)
    } else {
      params.delete('character')
    }
    router.push(`/gambles?${params.toString()}`)
  }

  const fetchGambles = async (page = 1, search = '', characterName?: string) => {
    setLoading(true)
    try {
      let response
      
      if (characterName) {
        // First find the character ID by name
        const charactersResponse = await api.getCharacters({ name: characterName, limit: 1 })
        if (charactersResponse.data.length > 0) {
          const characterId = charactersResponse.data[0].id
          // Get character-specific gambles
          const characterGamblesResponse = await api.getCharacterGambles(characterId, { limit: 1000 })
          // For character filtering, we'll simulate pagination client-side
          const allGambles = characterGamblesResponse.data || []
          const startIndex = (page - 1) * 12
          const endIndex = startIndex + 12
          const paginatedGambles = allGambles.slice(startIndex, endIndex)
          
          response = {
            data: paginatedGambles,
            total: allGambles.length,
            totalPages: Math.ceil(allGambles.length / 12),
            page
          }
        } else {
          // Character not found, return empty results
          response = { data: [], total: 0, totalPages: 1, page: 1 }
        }
      } else {
        // Normal gamble fetching with search
        const params: { page: number; limit: number; gambleName?: string } = { page, limit: 12 }
        if (search) params.gambleName = search
        response = await api.getGambles(params)
      }
      
      setGambles(response.data)
      setTotalPages(response.totalPages)
      setTotal(response.total)
      setError('')
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Failed to fetch gambles')
    } finally {
      setLoading(false)
    }
  }

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSearch = event.target.value
    setSearchQuery(newSearch)
    setCurrentPage(1)
    updateURL(newSearch, 1, characterFilter || undefined)
    
    // Debounce the API call
    const timeoutId = setTimeout(() => {
      fetchGambles(1, newSearch, characterFilter || undefined)
    }, 300)
    
    return () => clearTimeout(timeoutId)
  }

  const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
    setCurrentPage(page)
    updateURL(searchQuery, page, characterFilter || undefined)
    fetchGambles(page, searchQuery, characterFilter || undefined)
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy':
        return 'success'
      case 'medium':
        return 'warning'
      case 'hard':
        return 'error'
      default:
        return 'default'
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
          <Dices size={48} color={theme.palette.usogui?.gamble} />
        </Box>
        
        <Typography variant="h3" component="h1" gutterBottom>
          Gambles
        </Typography>
        <Typography variant="h6" color="text.secondary">
          {characterFilter 
            ? `Gambles featuring ${characterFilter}`
            : 'Discover the high-stakes games and competitions of Usogui'
          }
        </Typography>
      </Box>

      <Box sx={{ mb: 4 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search gambles..."
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
            {total} gamble{total !== 1 ? 's' : ''} found
          </Typography>

          <Grid container spacing={4}>
            {gambles.map((gamble, index) => (
              <Grid item xs={12} sm={6} md={4} key={gamble.id}>
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
                    <Box sx={{ position: 'relative' }}>
                      <MediaThumbnail
                        entityType="gamble"
                        entityId={gamble.id}
                        entityName={gamble.name}
                        maxWidth="100%"
                        maxHeight="200px"
                        allowCycling={false}
                      />
                    </Box>

                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" component="h2" gutterBottom>
                        {gamble.name}
                      </Typography>

                      <Box sx={{ mb: 2 }}>
                        {gamble.participants && gamble.participants.length > 0 && (
                          <Chip
                            label={`${gamble.participants?.length || 0} Participants`}
                            size="small"
                            color="primary"
                            variant="outlined"
                            icon={<Users size={14} />}
                            sx={{ mb: 1 }}
                          />
                        )}
                      </Box>

                      <Box sx={{
                        mb: 2,
                        overflow: 'hidden',
                        display: '-webkit-box',
                        WebkitBoxOrient: 'vertical',
                        WebkitLineClamp: 3,
                      }}>
                        <EnhancedSpoilerMarkdown
                          content={gamble.description || gamble.rules}
                          className="gamble-description-preview"
                          enableEntityEmbeds={true}
                          compactEntityCards={true}
                        />
                      </Box>

                    </CardContent>

                    <CardActions>
                      <Button
                        component={Link}
                        href={`/gambles/${gamble.id}`}
                        variant="outlined"
                        startIcon={<Eye size={16} />}
                        fullWidth
                      >
                        View Details
                      </Button>
                    </CardActions>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>

          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
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
