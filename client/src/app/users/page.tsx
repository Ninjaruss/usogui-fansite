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
  InputAdornment,
  Avatar,
  LinearProgress
} from '@mui/material'
import { Search, User, Crown, Users, BookOpen } from 'lucide-react'
import Link from 'next/link'
import { api } from '../../lib/api'
import { motion } from 'motion/react'
import UserProfileImage from '../../components/UserProfileImage'

interface PublicUser {
  id: number
  username: string
  role: string
  userProgress: number
  profilePictureType?: 'discord' | 'character_media' | null
  selectedCharacterMediaId?: number | null
  selectedCharacterMedia?: {
    id: number
    url: string
    fileName?: string
    description?: string
    ownerType?: string
    ownerId?: number
  } | null
  discordId?: string | null
  discordAvatar?: string | null
  createdAt: string
  guidesCount?: number
}

export default function UsersPage() {
  const [users, setUsers] = useState<PublicUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [total, setTotal] = useState(0)

  const limit = 12

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true)
        const params: any = { page, limit }
        if (searchTerm.trim()) {
          params.username = searchTerm
        }
        
        const response = await api.getPublicUsers(params)
        setUsers(response.data)
        setTotalPages(response.totalPages)
        setTotal(response.total)
      } catch (error: any) {
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
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
          <Users size={48} style={{ marginBottom: 16 }} />
          <Typography variant="h2" component="h1" gutterBottom>
            Community
          </Typography>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Meet the L-file community members
          </Typography>
        </Box>

        <Box sx={{ mb: 4 }}>
          <TextField
            fullWidth
            placeholder="Search users by username..."
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
                {total} community members
              </Typography>
            </Box>

            <Grid container spacing={3}>
              {users.map((user) => {
                const progressPercentage = Math.round((user.userProgress / 539) * 100)
                
                return (
                  <Grid item xs={12} sm={6} md={4} key={user.id}>
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
                        <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <UserProfileImage
                            user={user}
                            size={60}
                            showFallback={true}
                            className="user-profile-avatar"
                          />
                          
                          <Typography 
                            variant="h6" 
                            component={Link}
                            href={`/users/${user.id}`}
                            sx={{ 
                              textDecoration: 'none', 
                              color: 'primary.main',
                              '&:hover': { textDecoration: 'underline' },
                              mb: 1,
                              textAlign: 'center',
                              mt: 2
                            }}
                          >
                            {user.username}
                          </Typography>

                          <Box sx={{ mb: 2 }}>
                            <Chip
                              label={user.role === 'admin' ? 'Admin' : 
                                     user.role === 'moderator' ? 'Mod' : 'Member'}
                              size="small"
                              color={user.role === 'admin' ? 'error' : user.role === 'moderator' ? 'warning' : 'default'}
                              icon={user.role === 'admin' || user.role === 'moderator' ? <Crown size={14} /> : <User size={14} />}
                            />
                          </Box>

                          <Box sx={{ width: '100%', mb: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                              <Typography variant="caption" color="text.secondary">
                                Reading Progress
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Ch. {user.userProgress}
                              </Typography>
                            </Box>
                            <LinearProgress
                              variant="determinate"
                              value={progressPercentage}
                              sx={{
                                height: 6,
                                borderRadius: 1,
                                '& .MuiLinearProgress-bar': {
                                  borderRadius: 1,
                                },
                              }}
                            />
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 0.5 }}>
                              {progressPercentage}% complete
                            </Typography>
                          </Box>

                          {user.guidesCount !== undefined && user.guidesCount > 0 && (
                            <Box sx={{ mt: 'auto', pt: 1, borderTop: 1, borderColor: 'divider', width: '100%' }}>
                              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                                <Chip
                                  label={`${user.guidesCount} guide${user.guidesCount !== 1 ? 's' : ''}`}
                                  size="small"
                                  color="secondary"
                                  variant="outlined"
                                  icon={<BookOpen size={14} />}
                                />
                              </Box>
                            </Box>
                          )}

                          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
                            Joined {new Date(user.createdAt).toLocaleDateString()}
                          </Typography>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </Grid>
                )
              })}
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

            {users.length === 0 && !loading && (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Typography variant="h6" color="text.secondary">
                  No users found
                </Typography>
              </Box>
            )}
          </>
        )}
      </motion.div>
    </Container>
  )
}