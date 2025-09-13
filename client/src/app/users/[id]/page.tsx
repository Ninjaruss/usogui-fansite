'use client'

import React, { useState, useEffect } from 'react'
import {
  Container,
  Typography,
  Box,
  Chip,
  Card,
  CardContent,
  Grid,
  Button,
  CircularProgress,
  Alert,
  Divider,
  Avatar,
  LinearProgress
} from '@mui/material'
import { ArrowLeft, User, Crown, BookOpen, FileText, Quote, Dices, Calendar } from 'lucide-react'
import { useTheme } from '@mui/material/styles'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { api } from '../../../lib/api'
import { motion } from 'motion/react'
import { usePageView } from '../../../hooks/usePageView'
import UserProfileImage from '../../../components/UserProfileImage'
import GambleChip from '../../../components/GambleChip'

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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const params = useParams()

  // Track page view
  const userId = Array.isArray(params.id) ? params.id[0] : params.id
  usePageView('user', userId || '', !!userId)

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const id = Array.isArray(params.id) ? params.id[0] : params.id
        const userIdNum = Number(id)
        
        // Fetch user data using the public endpoint
        const userData = await api.getPublicUserProfile(userIdNum)
        setUser(userData)

        // Fetch user's public guides
        try {
          const guidesResponse = await api.getGuides({ limit: 10 })
          // Filter guides by author on the client side for now
          setGuides(guidesResponse.data?.filter(guide => guide.author?.id === userIdNum) || [])
        } catch (guidesError) {
          // Guides might not be available, continue without them
          console.log('Could not fetch user guides:', guidesError)
        }

        // No need to fetch favorite quote and gamble separately anymore
        // as they are included in the public profile response
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

  const progressPercentage = Math.round((user.userProgress / 539) * 100)

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
        <Card className="gambling-card" sx={{ mb: 4, overflow: 'visible' }}>
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
                {/* Username and Role Chip Row */}
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

                  <Chip
                    label={user.role === 'admin' ? 'Admin' : 
                           user.role === 'moderator' ? 'Mod' : 'Member'}
                    color={user.role === 'admin' ? 'error' : user.role === 'moderator' ? 'warning' : 'primary'}
                    icon={user.role === 'admin' || user.role === 'moderator' ? <Crown size={14} /> : <User size={14} />}
                    size="medium"
                    sx={{
                      fontWeight: 'bold',
                      boxShadow: 1
                    }}
                  />
                </Box>

                <Typography 
                  variant="body1" 
                  color="text.secondary" 
                  sx={{ mb: 3, fontSize: '1.1rem' }}
                >
                  Member since {new Date(user.createdAt).toLocaleDateString()}
                </Typography>

                {/* Improved Quick Stats */}
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: { xs: 'column', sm: 'row' },
                  gap: 3,
                  mt: 2
                }}>
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
                    minWidth: 140,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      borderColor: 'primary.main',
                      bgcolor: 'rgba(225, 29, 72, 0.05)'
                    }
                  }}>
                    <BookOpen size={24} color={theme.palette.primary.main} />
                    <Box>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                        Current Chapter
                      </Typography>
                      <Typography variant="h5" fontWeight="bold" color="primary.main">
                        {user.userProgress}
                      </Typography>
                    </Box>
                  </Box>
                  
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
                    minWidth: 140,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      borderColor: 'secondary.main',
                      bgcolor: 'rgba(124, 58, 237, 0.05)'
                    }
                  }}>
                    <FileText size={24} color={theme.palette.secondary.main} />
                    <Box>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                        Guides Written
                      </Typography>
                      <Typography variant="h5" fontWeight="bold" color="secondary.main">
                        {guides.length}
                      </Typography>
                    </Box>
                  </Box>
                  
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
                    minWidth: 140,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      borderColor: 'success.main',
                      bgcolor: 'rgba(56, 142, 60, 0.05)'
                    }
                  }}>
                    <Calendar size={24} color={theme.palette.success.main} />
                    <Box>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                        Joined
                      </Typography>
                      <Typography variant="h6" fontWeight="bold" color="success.main" sx={{ fontSize: '1.1rem' }}>
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { 
                          month: 'short', 
                          year: 'numeric' 
                        }) : 'Unknown'}
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                {/* Enhanced Favorites Section */}
                {(favoriteQuote || favoriteGamble) && (
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="h6" gutterBottom sx={{ 
                      fontWeight: 'bold', 
                      mb: 3,
                      color: 'primary.main' 
                    }}>
                      Favorites
                    </Typography>
                    
                    <Box sx={{ 
                      display: 'grid', 
                      gap: 2,
                      gridTemplateColumns: { xs: '1fr', md: 'repeat(auto-fit, minmax(300px, 1fr))' }
                    }}>
                      {favoriteQuote && (
                        <Card sx={{ 
                          p: 3, 
                          borderRadius: 3,
                          border: '1px solid',
                          borderColor: 'divider',
                          bgcolor: 'background.paper',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            borderColor: '#7c3aed',
                            bgcolor: 'rgba(124, 58, 237, 0.02)',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 4px 12px rgba(124, 58, 237, 0.1)'
                          }
                        }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                            <Quote size={20} color="#7c3aed" />
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#7c3aed' }}>
                              Favorite Quote
                            </Typography>
                          </Box>
                          <Typography variant="body2" sx={{ 
                            fontStyle: 'italic',
                            mb: 2,
                            lineHeight: 1.5,
                            color: 'text.primary'
                          }}>
                            "{favoriteQuote.text}"
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                            <Chip 
                              label={favoriteQuote.character?.name || 'Unknown'} 
                              size="small" 
                              sx={{
                                bgcolor: 'rgba(124, 58, 237, 0.1)',
                                color: '#7c3aed',
                                fontWeight: 'medium'
                              }}
                            />
                            {favoriteQuote.chapterNumber && (
                              <Chip 
                                label={`Ch. ${favoriteQuote.chapterNumber}`} 
                                size="small" 
                                sx={{
                                  bgcolor: 'rgba(225, 29, 72, 0.1)',
                                  color: '#e11d48',
                                  fontWeight: 'medium'
                                }}
                              />
                            )}
                          </Box>
                        </Card>
                      )}

                      {favoriteGamble && (
                        <Card sx={{ 
                          p: 3, 
                          borderRadius: 3,
                          border: '1px solid',
                          borderColor: 'divider',
                          bgcolor: 'background.paper',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            borderColor: '#e11d48',
                            bgcolor: 'rgba(225, 29, 72, 0.02)',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 4px 12px rgba(225, 29, 72, 0.1)'
                          }
                        }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                            <Dices size={20} color="#e11d48" />
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#e11d48' }}>
                              Favorite Gamble
                            </Typography>
                          </Box>
                          <Box sx={{ mt: 1 }}>
                            <GambleChip 
                              gamble={{
                                id: favoriteGamble.id,
                                name: favoriteGamble.name,
                                rules: favoriteGamble.rules
                              }} 
                              size="medium" 
                            />
                          </Box>
                        </Card>
                      )}
                    </Box>
                  </Box>
                )}
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Profile Picture Information */}
        {user.profilePictureType === 'character_media' && user.selectedCharacterMedia && (
          <Card className="gambling-card" sx={{ mb: 4 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <User size={20} />
                Profile Picture
              </Typography>
              
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 2,
                p: 2,
                bgcolor: 'action.hover',
                borderRadius: 2
              }}>
                <Avatar
                  src={user.selectedCharacterMedia.url}
                  sx={{ width: 64, height: 64 }}
                >
                  {user.selectedCharacterMedia.character?.name?.[0] || '?'}
                </Avatar>
                
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" gutterBottom>
                    {user.selectedCharacterMedia.character?.name || 'Unknown Character'}
                  </Typography>
                  
                  {user.selectedCharacterMedia.chapterNumber && (
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Chapter {user.selectedCharacterMedia.chapterNumber}
                    </Typography>
                  )}
                  
                  {user.selectedCharacterMedia.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                      {user.selectedCharacterMedia.description}
                    </Typography>
                  )}
                </Box>
              </Box>
            </CardContent>
          </Card>
        )}

        <Grid container spacing={4}>
          <Grid item xs={12} md={8}>
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
                            {new Date(guide.createdAt).toLocaleDateString()}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </CardContent>
              </Card>
            )}
          </Grid>

          <Grid item xs={12} md={4}>
            <Card className="gambling-card">
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <BookOpen size={20} />
                  Reading Progress
                </Typography>
                
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Current Chapter
                    </Typography>
                    <Typography variant="h5" fontWeight="bold" color="primary.main">
                      {user.userProgress}
                    </Typography>
                  </Box>
                  
                  <LinearProgress
                    variant="determinate"
                    value={progressPercentage}
                    sx={{
                      height: 12,
                      borderRadius: 2,
                      bgcolor: 'action.hover',
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 2,
                        background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                      },
                    }}
                  />
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                    <Typography variant="body2" fontWeight="medium" color="primary.main">
                      {progressPercentage}% complete
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {539 - user.userProgress} chapters remaining
                    </Typography>
                  </Box>
                </Box>

                <Divider sx={{ my: 3 }} />
                
                <Typography variant="h6" gutterBottom>
                  Quick Links
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Button
                    component={Link}
                    href="/guides"
                    variant="outlined"
                    size="small"
                    fullWidth
                    startIcon={<FileText size={16} />}
                  >
                    Browse Guides
                  </Button>
                  <Button
                    component={Link}
                    href="/characters"
                    variant="outlined"
                    size="small"
                    fullWidth
                    startIcon={<User size={16} />}
                  >
                    Browse Characters
                  </Button>
                  <Button
                    component={Link}
                    href={`/chapters/${user.userProgress}`}
                    variant="outlined"
                    size="small"
                    fullWidth
                    startIcon={<BookOpen size={16} />}
                  >
                    Current Chapter
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </motion.div>
    </Container>
  )
}