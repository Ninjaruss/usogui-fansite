'use client'

import React, { useState, useEffect } from 'react'
import {
  Container,
  Typography,
  Box,
  Chip,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Alert,
  LinearProgress
} from '@mui/material'
import { ArrowLeft, FileText, Quote, Dices, Calendar, BookOpen, Camera } from 'lucide-react'
import { useTheme } from '@mui/material/styles'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { api } from '../../../lib/api'
import { motion } from 'motion/react'
import { usePageView } from '../../../hooks/usePageView'
import UserProfileImage from '../../../components/UserProfileImage'
import GambleChip from '../../../components/GambleChip'
import UserBadges from '../../../components/UserBadges'
import { UserRoleDisplay } from '../../../components/BadgeDisplay'

interface PublicUser {
  id: number
  username: string
  role: string
  customRole?: string | null
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
    chapterNumber?: number
    character?: {
      id: number
      name: string
    }
  } | null
  discordId?: string | null
  discordAvatar?: string | null
  favoriteQuoteId?: number
  favoriteGambleId?: number
  profileImageId?: string
  createdAt: string
  // Additional computed fields we might add
  guidesCount?: number
  totalViews?: number
  userStats?: {
    guidesWritten: number
    mediaSubmitted: number
    likesReceived: number
  }
}

interface UserGuide {
  id: number
  title: string
  description: string
  viewCount: number
  likeCount: number
  createdAt: string
}

export default function UserProfilePage() {
  const theme = useTheme()
  const [user, setUser] = useState<PublicUser | null>(null)
  const [guides, setGuides] = useState<UserGuide[]>([])
  const [favoriteQuote, setFavoriteQuote] = useState<any>(null)
  const [favoriteGamble, setFavoriteGamble] = useState<any>(null)
  const [userStats, setUserStats] = useState<{
    guidesWritten: number
    mediaSubmitted: number
    likesReceived: number
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [dataLoading, setDataLoading] = useState(true)
  const [error, setError] = useState('')
  const params = useParams()

  // Track page view
  const userId = Array.isArray(params.id) ? params.id[0] : params.id
  usePageView('user', userId || '', !!userId)

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setDataLoading(true)
        const id = Array.isArray(params.id) ? params.id[0] : params.id
        const userIdNum = Number(id)
        
        // Fetch user data using the public endpoint
        const userData = await api.getPublicUserProfile(userIdNum)
        setUser(userData)

        // Use stats from API response if available, otherwise fetch user's public guides for fallback stats
        if (userData.userStats) {
          // Use stats from API response
          setUserStats(userData.userStats)
        } else {
          // Fetch user's public guides for fallback stats calculation
          try {
            const guidesResponse = await api.getGuides({ limit: 100 })
            // Filter guides by author on the client side for now
            const userGuides = guidesResponse.data?.filter(guide => guide.author?.id === userIdNum) || []
            setGuides(userGuides)
            
            // Set user stats based on available data as fallback
            setUserStats({
              guidesWritten: userGuides.length,
              mediaSubmitted: 0, // TODO: Fetch from API when available
              likesReceived: userGuides.reduce((total, guide) => total + (guide.likeCount || 0), 0)
            })
          } catch (guidesError) {
            // Guides might not be available, set default values
            console.log('Could not fetch user guides:', guidesError)
            setUserStats({
              guidesWritten: 0,
              mediaSubmitted: 0,
              likesReceived: 0
            })
          }
        }

        // Fetch user's guides separately for display (regardless of stats source)
        try {
          const guidesResponse = await api.getGuides({ limit: 10 })
          const userGuides = guidesResponse.data?.filter(guide => guide.author?.id === userIdNum) || []
          setGuides(userGuides)
        } catch (guidesError) {
          console.log('Could not fetch user guides for display:', guidesError)
        }

        // Set favorite quote and gamble from API response
        if (userData.favoriteQuote) {
          setFavoriteQuote(userData.favoriteQuote)
        }

        if (userData.favoriteGamble) {
          setFavoriteGamble(userData.favoriteGamble)
        }
      } catch (error: any) {
        setError(error.message)
      } finally {
        setLoading(false)
        setDataLoading(false)
      }
    }

    if (params.id) {
      fetchUserData()
    }
  }, [params.id])

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <CircularProgress size={50} />
        </Box>
      </Container>
    )
  }

  if (error || !user) {
    return (
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Alert severity="error">
          {error || 'User not found'}
        </Alert>
        <Box sx={{ mt: 3 }}>
          <Button component={Link} href="/users" startIcon={<ArrowLeft />}>
            Back to Users
          </Button>
        </Box>
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
        <Button
          component={Link}
          href="/users"
          startIcon={<ArrowLeft />}
          sx={{ mb: 3 }}
        >
          Back to Users
        </Button>

        {/* Modern Profile Header */}
        <Card 
          className="gambling-card" 
          sx={{ 
            mb: 4,
            background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.05) 0%, rgba(156, 39, 176, 0.05) 100%)',
            border: '1px solid',
            borderColor: 'divider'
          }}
        >
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: { xs: 'center', sm: 'flex-start' },
              gap: 3
            }}>
              {/* Profile Image - Now on the left */}
              <Box sx={{ 
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}>
                <UserProfileImage
                  user={user}
                  size={120}
                  showFallback={true}
                  className="user-profile-avatar-large"
                />
              </Box>

              {/* User Information and Role Chip */}
              <Box sx={{ 
                flex: 1,
                minWidth: 0,
                display: 'flex',
                flexDirection: 'column'
              }}>
                {/* Username and Role Display Row */}
                <Box sx={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  mb: 2,
                  flexWrap: 'wrap'
                }}>
                  <Typography 
                    variant="h3" 
                    component="h1" 
                    sx={{ 
                      fontWeight: 700,
                      background: `linear-gradient(135deg, ${theme.palette.text.primary} 0%, ${theme.palette.primary.main} 100%)`,
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      color: 'transparent',
                      mb: 0
                    }}
                  >
                    {user.username}
                  </Typography>
                  
                  <UserRoleDisplay
                    userRole={user.role as 'admin' | 'moderator' | 'user'}
                    customRole={user.customRole}
                    size="medium"
                    spacing={1}
                  />
                </Box>

                {/* User Badges */}
                <Box sx={{ mb: 2 }}>
                  <UserBadges userId={user.id} size="md" maxDisplay={6} />
                </Box>

                {/* Improved Quick Stats */}
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  gap: 2,
                  mt: 2
                }}>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 2,
                    px: 2,
                    py: 1.5,
                    bgcolor: 'action.hover',
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: 'divider',
                    minWidth: 120,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      borderColor: 'primary.main',
                      bgcolor: 'rgba(225, 29, 72, 0.05)'
                    }
                  }}>
                    <FileText size={24} color="#e11d48" />
                    <Box sx={{ textAlign: 'left' }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                        Guides Written
                      </Typography>
                      <Typography variant="h5" color="primary" sx={{ fontWeight: 'bold' }}>
                        {userStats ? userStats.guidesWritten : dataLoading ? '...' : '0'}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 2,
                    px: 2,
                    py: 1.5,
                    bgcolor: 'action.hover',
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: 'divider',
                    minWidth: 120,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      borderColor: 'secondary.main',
                      bgcolor: 'rgba(124, 58, 237, 0.05)'
                    }
                  }}>
                    <Camera size={24} color="#7c3aed" />
                    <Box sx={{ textAlign: 'left' }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                        Media Submitted
                      </Typography>
                      <Typography variant="h5" color="secondary" sx={{ fontWeight: 'bold' }}>
                        {userStats ? userStats.mediaSubmitted : dataLoading ? '...' : '0'}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 2,
                    px: 2,
                    py: 1.5,
                    bgcolor: 'action.hover',
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: 'divider',
                    minWidth: 120,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      borderColor: 'info.main',
                      bgcolor: 'rgba(25, 118, 210, 0.05)'
                    }
                  }}>
                    <BookOpen size={24} color="#1976d2" />
                    <Box sx={{ textAlign: 'left' }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                        Likes Received
                      </Typography>
                      <Typography variant="h5" color="info.main" sx={{ fontWeight: 'bold' }}>
                        {userStats ? userStats.likesReceived : dataLoading ? '...' : '0'}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 2,
                    px: 2,
                    py: 1.5,
                    bgcolor: 'action.hover',
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: 'divider',
                    minWidth: 120,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      borderColor: 'success.main',
                      bgcolor: 'rgba(56, 142, 60, 0.05)'
                    }
                  }}>
                    <Calendar size={24} color="#388e3c" />
                    <Box sx={{ textAlign: 'left' }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                        Joined
                      </Typography>
                      <Typography variant="h6" color="success.main" sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          year: 'numeric' 
                        }) : 'Unknown'}
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                {/* Improved Reading Progress Section */}
                <Box sx={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  px: 3,
                  py: 2,
                  bgcolor: 'action.hover',
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: 'divider',
                  mt: 2,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    borderColor: 'success.main',
                    bgcolor: 'rgba(56, 142, 60, 0.05)'
                  }
                }}>
                  <BookOpen size={24} color="#388e3c" />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                      Reading Progress
                    </Typography>
                    <Typography variant="h6" color="success.main" sx={{ fontWeight: 'bold', mb: 1 }}>
                      Chapter {user.userProgress} of 539 ({Math.round((user.userProgress / 539) * 100)}%)
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={(user.userProgress / 539) * 100}
                      sx={{
                        height: 10,
                        borderRadius: 5,
                        backgroundColor: 'action.hover',
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 5,
                          background: 'linear-gradient(90deg, #e11d48 0%, #7c3aed 100%)',
                        },
                        mb: 0
                      }}
                    />
                  </Box>
                </Box>

                {/* Enhanced Favorites Section */}
                {(favoriteQuote || favoriteGamble) && (
                  <Box sx={{ 
                    mt: 3, 
                    p: 3, 
                    bgcolor: 'action.hover', 
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: 'divider',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      borderColor: 'primary.main',
                      bgcolor: 'rgba(225, 29, 72, 0.02)'
                    }
                  }}>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1, 
                      mb: 2 
                    }}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                        Favorites
                      </Typography>
                    </Box>
                    
                    <Box sx={{ 
                      display: 'flex', 
                      flexDirection: { xs: 'column', md: 'row' }, 
                      gap: 3,
                      alignItems: { xs: 'flex-start', md: 'flex-start' }
                    }}>
                      {favoriteQuote && (
                        <Box sx={{ 
                          flex: 1,
                          p: 2,
                          borderRadius: 2,
                          border: '1px solid',
                          borderColor: 'divider',
                          bgcolor: 'background.paper',
                          transition: 'all 0.2s ease'
                        }}>
                          <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 1, 
                            mb: 2
                          }}>
                            <Quote size={18} color="#00796b" />
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                              Favorite Quote
                            </Typography>
                          </Box>
                          <Box sx={{ maxWidth: '400px' }}>
                            <Box>
                              <Typography variant="body2" sx={{ 
                                fontStyle: 'italic',
                                mb: 1.5,
                                overflow: 'hidden',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                lineHeight: 1.4,
                                color: 'text.primary'
                              }}>
                                &ldquo;{favoriteQuote.text}&rdquo;
                              </Typography>
                              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                <Chip 
                                  label={favoriteQuote.character?.name || 'Unknown'} 
                                  size="small" 
                                  variant="outlined"
                                  sx={{ bgcolor: 'rgba(0, 121, 107, 0.1)', borderColor: '#00796b' }}
                                />
                                {favoriteQuote.chapterNumber && (
                                  <Chip 
                                    label={`Ch. ${favoriteQuote.chapterNumber}`} 
                                    size="small" 
                                    variant="outlined"
                                    color="primary"
                                  />
                                )}
                              </Box>
                            </Box>
                          </Box>
                        </Box>
                      )}

                      {favoriteGamble && (
                        <Box sx={{ 
                          p: 2,
                          borderRadius: 2,
                          border: '1px solid',
                          borderColor: 'divider',
                          bgcolor: 'background.paper',
                          transition: 'all 0.2s ease',
                          minWidth: { md: 200 }
                        }}>
                          <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 1, 
                            mb: 2
                          }}>
                            <Dices size={18} color="#d32f2f" />
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                              Favorite Gamble
                            </Typography>
                          </Box>
                          <GambleChip gamble={{
                            id: favoriteGamble.id,
                            name: favoriteGamble.name,
                            rules: favoriteGamble.rules
                          }} size="medium" />
                        </Box>
                      )}
                    </Box>
                  </Box>
                )}
              </Box>
            </Box>
          </CardContent>
        </Card>


        {/* User's Guides Section */}
        {guides.length > 0 && (
          <Card className="gambling-card">
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5" gutterBottom>
                  Guides by {user.username}
                </Typography>
                <Button
                  component={Link}
                  href={`/guides?author=${user.id}&authorName=${encodeURIComponent(user.username)}`}
                  size="small"
                  color="primary"
                >
                  View All
                </Button>
              </Box>
              
              {guides.map((guide) => (
                <Card key={guide.id} variant="outlined" sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography 
                      variant="h6" 
                      component={Link} 
                      href={`/guides/${guide.id}`}
                      sx={{ textDecoration: 'none', color: 'primary.main', '&:hover': { textDecoration: 'underline' } }}
                    >
                      {guide.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
                      {guide.description}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <Typography variant="caption" color="text.secondary">
                          {guide.viewCount} views
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {guide.likeCount} likes
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(guide.createdAt).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          year: 'numeric' 
                        })}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        )}
      </motion.div>
    </Container>
  )
}