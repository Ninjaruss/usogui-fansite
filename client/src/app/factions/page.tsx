'use client'

import React, { useState, useEffect } from 'react'
import {
  Container,
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
import { Search, Shield, Users } from 'lucide-react'
import Link from 'next/link'
import { api } from '../../lib/api'
import { motion } from 'motion/react'
import MediaThumbnail from '../../components/MediaThumbnail'

interface Faction {
  id: number
  name: string
  description?: string
  memberCount?: number
}

export default function FactionsPage() {
  const [factions, setFactions] = useState<Faction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [total, setTotal] = useState(0)

  const limit = 12

  useEffect(() => {
    const fetchFactions = async () => {
      try {
        setLoading(true)
        const params: any = { page, limit }
        if (searchTerm.trim()) {
          params.name = searchTerm
        }
        
        const response = await api.getFactions(params)
        setFactions(response.data)
        setTotalPages(response.totalPages)
        setTotal(response.total)
      } catch (error: any) {
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    fetchFactions()
  }, [page, searchTerm])

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value)
    setPage(1) // Reset to first page when searching
  }

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value)
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Alert severity="error">{error}</Alert>
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
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Shield size={48} style={{ marginBottom: 16 }} />
          <Typography variant="h2" component="h1" gutterBottom>
            Factions
          </Typography>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Explore the various groups and organizations in Usogui
          </Typography>
        </Box>

        <Box sx={{ mb: 4 }}>
          <TextField
            fullWidth
            placeholder="Search factions by name..."
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
                {total} factions found
              </Typography>
            </Box>

            <Grid container spacing={3}>
              {factions.map((faction) => (
                <Grid item xs={12} sm={6} md={4} key={faction.id}>
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
                          entityType="faction"
                          entityId={faction.id}
                          entityName={faction.name}
                          maxWidth="100%"
                          maxHeight="200px"
                          allowCycling={false}
                        />
                      </Box>

                      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <Shield size={24} style={{ marginRight: 8 }} />
                          <Typography 
                            variant="h5" 
                            component={Link}
                            href={`/factions/${faction.id}`}
                            sx={{ 
                              textDecoration: 'none', 
                              color: 'primary.main',
                              '&:hover': { textDecoration: 'underline' },
                              flex: 1
                            }}
                          >
                            {faction.name}
                          </Typography>
                        </Box>

                        {faction.description && (
                          <Typography 
                            variant="body2" 
                            color="text.secondary"
                            sx={{ 
                              display: '-webkit-box',
                              WebkitLineClamp: 4,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              mb: 2,
                              flexGrow: 1
                            }}
                          >
                            {faction.description}
                          </Typography>
                        )}

                        {faction.memberCount !== undefined && (
                          <Box sx={{ mt: 'auto', pt: 2, borderTop: 1, borderColor: 'divider' }}>
                            <Chip
                              label={`${faction.memberCount} members`}
                              size="small"
                              color="secondary"
                              variant="outlined"
                              icon={<Users size={14} />}
                            />
                          </Box>
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

            {factions.length === 0 && !loading && (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Typography variant="h6" color="text.secondary">
                  No factions found
                </Typography>
              </Box>
            )}
          </>
        )}
      </motion.div>
    </Container>
  )
}