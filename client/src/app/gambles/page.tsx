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
import { Crown, Eye, Users, Trophy, Search } from 'lucide-react'
import Link from 'next/link'
import { api } from '../../lib/api'
import { motion } from 'motion/react'

interface Gamble {
  id: number
  name: string
  rules: string
  winCondition?: string
  chapterId: number
  hasTeams: boolean
  winnerTeam?: string
  participants: any[]
  rounds?: any[]
  observers: any[]
  createdAt: string
  updatedAt: string
}

export default function GamblesPage() {
  const [gambles, setGambles] = useState<Gamble[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const fetchGambles = async (page = 1, search = '') => {
    setLoading(true)
    try {
      const params: { page: number; limit: number; gambleName?: string } = { page, limit: 12 }
      if (search) params.gambleName = search
      
      const response = await api.getGambles(params)
      setGambles(response.data)
      setTotalPages(response.totalPages)
      setTotal(response.total)
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Failed to fetch gambles')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchGambles(currentPage, searchQuery)
  }, [currentPage, searchQuery])

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value)
    setCurrentPage(1)
  }

  const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
    setCurrentPage(page)
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
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <Crown size={48} color="#d32f2f" />
          </Box>
          <Typography variant="h3" component="h1" gutterBottom>
            Gambles
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Discover the high-stakes games and competitions of Usogui
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
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" component="h2" gutterBottom>
                          {gamble.name}
                        </Typography>
                        
                        <Box sx={{ mb: 2 }}>
                          {gamble.participants?.length > 0 && (
                            <Chip
                              label={`${gamble.participants.length} Participants`}
                              size="small"
                              color="primary"
                              variant="outlined"
                              icon={<Users size={14} />}
                              sx={{ mb: 1 }}
                            />
                          )}
                          {gamble.hasTeams && (
                            <Chip
                              label="Team Game"
                              size="small"
                              color="secondary"
                              variant="outlined"
                              sx={{ mr: 1, mb: 1 }}
                            />
                          )}
                        </Box>

                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            mb: 2,
                            overflow: 'hidden',
                            display: '-webkit-box',
                            WebkitBoxOrient: 'vertical',
                            WebkitLineClamp: 3,
                          }}
                        >
                          {gamble.rules}
                        </Typography>

                        {gamble.winnerTeam && (
                          <Box sx={{ mt: 'auto' }}>
                            <Chip
                              label={`Winner: ${gamble.winnerTeam}`}
                              size="small"
                              color="success"
                              variant="filled"
                              icon={<Trophy size={14} />}
                            />
                          </Box>
                        )}
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
    </Container>
  )
}