'use client'

import React, { useState, useEffect } from 'react'
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Avatar,
  Chip,
  Button,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  TextField,
  InputAdornment,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip,
  useTheme,
  LinearProgress
} from '@mui/material'
import { User, Crown, Save, X, Camera, Search, AlertTriangle, Quote, Dices, Edit, BookOpen, FileText, Calendar, Heart, Eye } from 'lucide-react'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import Link from 'next/link'
import { useAuth } from '../../providers/AuthProvider'
import { useProgress } from '../../providers/ProgressProvider'
import { useSpoilerSettings } from '../../hooks/useSpoilerSettings'
import { api } from '../../lib/api'
import { motion } from 'motion/react'
import UserProfileImage from '../../components/UserProfileImage'
import GambleChip from '../../components/GambleChip'
import QuoteSelectionPopup from '../../components/QuoteSelectionPopup'
import GambleSelectionPopup from '../../components/GambleSelectionPopup'
import UserBadges from '../../components/UserBadges'
import CustomRoleEditor from '../../components/CustomRoleEditor'
import CustomRoleDisplay from '../../components/CustomRoleDisplay'
import { UserRoleDisplay } from '../../components/BadgeDisplay'
import { GuideStatus } from '../../types'

// Profile Picture Spoiler Wrapper - matches CharacterTimeline spoiler behavior
function ProfilePictureSpoilerWrapper({ 
  media, 
  children 
}: { 
  media: { id: number, chapterNumber?: number },
  children: React.ReactNode 
}) {
  const [isRevealed, setIsRevealed] = useState(false)
  const { userProgress } = useProgress()
  const { settings } = useSpoilerSettings()
  const theme = useTheme()

  const shouldHideSpoiler = () => {
    const chapterNumber = media.chapterNumber
    
    // First check if spoiler settings say to show all spoilers
    if (settings.showAllSpoilers) {
      return false
    }

    // Determine the effective progress to use for spoiler checking
    // Priority: spoiler settings tolerance > user progress
    const effectiveProgress = settings.chapterTolerance > 0 
      ? settings.chapterTolerance 
      : userProgress

    // If we have a chapter number, use unified logic
    if (chapterNumber) {
      return chapterNumber > effectiveProgress
    }

    // For media without chapter numbers, don't hide
    return false
  }

  // Always check client-side logic
  const clientSideShouldHide = shouldHideSpoiler()
  
  // Always render the media, but with spoiler protection overlay if needed
  if (!clientSideShouldHide || isRevealed) {
    return <>{children}</>
  }

  const handleReveal = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsRevealed(true)
  }

  const chapterNumber = media.chapterNumber
  const effectiveProgress = settings.chapterTolerance > 0 
    ? settings.chapterTolerance 
    : userProgress

  return (
    <Box sx={{ position: 'relative' }}>
      {/* Render the actual content underneath */}
      <Box sx={{ opacity: 0.3, filter: 'blur(2px)', pointerEvents: 'none' }}>
        {children}
      </Box>
      
      {/* Spoiler overlay */}
      <Box 
        sx={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'error.light',
          borderRadius: 2,
          cursor: 'pointer',
          border: `1px solid ${theme.palette.error.main}`,
          '&:hover': {
            backgroundColor: 'error.dark'
          },
          zIndex: 100
        }}
        onClick={handleReveal}
      >
        <Tooltip 
          title={chapterNumber ? `Chapter ${chapterNumber} spoiler - You're at Chapter ${effectiveProgress}. Click to reveal.` : `Spoiler content. Click to reveal.`}
          placement="top"
          arrow
        >
          <Box sx={{ textAlign: 'center', width: '100%' }}>
            <Typography 
              variant="caption" 
              sx={{ 
                color: 'white',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 0.5,
                fontSize: '0.75rem',
                mb: 0.5
              }}
            >
              <AlertTriangle size={14} />
              {chapterNumber ? `Chapter ${chapterNumber} Spoiler` : 'Spoiler'}
            </Typography>
            <Typography 
              variant="caption" 
              sx={{ 
                color: 'rgba(255,255,255,0.8)',
                fontSize: '0.65rem',
                display: 'block'
              }}
            >
              Click to reveal
            </Typography>
          </Box>
        </Tooltip>
      </Box>
    </Box>
  )
}

export default function ProfilePage() {
  const { user, refreshUser, updateUserField, loading: authLoading } = useAuth()
  const { userProgress } = useProgress()
  const [selectedQuote, setSelectedQuote] = useState<number | null>(null)
  const [selectedGamble, setSelectedGamble] = useState<number | null>(null)
  const [selectedCharacterMedia, setSelectedCharacterMedia] = useState<number | null>(null)
  const [currentChapterInfo, setCurrentChapterInfo] = useState<{
    id: number
    number: number
    title: string | null
    summary: string | null
  } | null>(null)
  const [quotes, setQuotes] = useState<Array<{ id: number; text: string; character: string; chapterNumber: number }>>([])
  const [gambles, setGambles] = useState<Array<{ id: number; name: string; rules?: string }>>([])
  const [characterMedia, setCharacterMedia] = useState<Array<{
    id: number
    url: string
    fileName: string
    description: string
    character: { id: number; name: string }
    chapterNumber: number
  }>>([])
  const [userStats, setUserStats] = useState<{
    guidesWritten: number
    mediaSubmitted: number
    likesReceived: number
  } | null>(null)
  const [userBadges, setUserBadges] = useState<Array<{
    id: number
    badge: {
      type: string
      name: string
    }
    isActive: boolean
    expiresAt: string | null
  }>>([])
  const [userGuides, setUserGuides] = useState<Array<{
    id: number
    title: string
    description: string
    status: string
    likeCount: number
    viewCount: number
    createdAt: string
    updatedAt: string
  }>>([])
  const [loading, setLoading] = useState(false)
  const [dataLoading, setDataLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [profilePictureModalOpen, setProfilePictureModalOpen] = useState(false)
  const [quoteSelectionOpen, setQuoteSelectionOpen] = useState(false)
  const [gambleSelectionOpen, setGambleSelectionOpen] = useState(false)
  const [characterSearchTerm, setCharacterSearchTerm] = useState('')
  const [selectedTab, setSelectedTab] = useState(0) // 0 = Discord, 1 = Character Media

  // Helper function to check if user has active supporter badge
  const hasActiveSupporterBadge = () => {
    return userBadges.some(userBadge => 
      userBadge.badge.type === 'active_supporter' &&
      userBadge.isActive &&
      (!userBadge.expiresAt || new Date(userBadge.expiresAt) > new Date())
    )
  }

  // Handler for custom role updates
  const handleCustomRoleUpdate = async (newRole: string | null) => {
    if (user) {
      // Update the user's custom role immediately in the UI
      updateUserField('customRole', newRole)
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        setDataLoading(true)
        setError('')
        
        // Set user selections
        setSelectedQuote(user?.favoriteQuoteId || null)
        setSelectedGamble(user?.favoriteGambleId || null)
        
        // Handle profile picture selection based on user's current settings
        if (user?.profilePictureType === 'character_media' && user?.selectedCharacterMediaId) {
          setSelectedCharacterMedia(user.selectedCharacterMediaId)
        } else {
          setSelectedCharacterMedia(null) // null represents Discord profile (default)
        }

        // Fetch quotes and gambles from API
        const [quotesResponse, gamblesResponse] = await Promise.all([
          api.getQuotes({ limit: 100 }),
          api.getGambles({ limit: 100 })
        ])

        // Format quotes for display
        const formattedQuotes = quotesResponse.data.map((quote: any) => ({
          id: quote.id,
          text: quote.text,
          character: quote.character?.name || 'Unknown',
          chapterNumber: quote.chapter?.number || 0
        }))
        
        // Format gambles for display
        const formattedGambles = gamblesResponse.data.map((gamble: any) => ({
          id: gamble.id,
          name: gamble.name,
          rules: gamble.rules
        }))

        setQuotes(formattedQuotes)
        setGambles(formattedGambles)
        
        // Fetch all available characters and their entity display media
        try {
          const charactersResponse = await api.getCharacters({ limit: 50 }) // Get first 50 characters
          const characters = charactersResponse.data || []
          
          if (characters.length > 0) {
            const mediaPromises = characters.map(async (character: any) => {
              try {
                const response = await api.getEntityDisplayMediaForCycling('character', character.id, userProgress)
                const mediaArray = Array.isArray(response) ? response : (response as any).data || []
                return mediaArray.map((media: any) => ({
                  id: media.id,
                  url: media.url || media.fileName,
                  fileName: media.fileName,
                  description: media.description || '',
                  character: { id: character.id, name: character.name },
                  chapterNumber: media.chapterNumber
                }))
              } catch (error) {
                // Silently ignore errors for characters with no media
                return []
              }
            })
            
            const allMediaResults = await Promise.all(mediaPromises)
            const flattenedMedia = allMediaResults.flat()
            setCharacterMedia(flattenedMedia)
          }
        } catch (error) {
          console.error('Failed to fetch characters for entity display media:', error)
        }

        // Fetch current chapter information
        if (userProgress > 0) {
          try {
            const chapterInfo = await api.getChapterByNumber(userProgress)
            setCurrentChapterInfo(chapterInfo)
          } catch (error) {
            console.error('Failed to fetch chapter info:', error)
            // Set fallback info
            setCurrentChapterInfo({
              id: 0,
              number: userProgress,
              title: null,
              summary: null
            })
          }
        }

        // Fetch user profile stats
        try {
          const userStatsResponse = await api.getUserProfileStats()
          setUserStats(userStatsResponse)
        } catch (error) {
          console.error('Failed to fetch user stats:', error)
          // Set fallback stats
          setUserStats({
            guidesWritten: 0,
            mediaSubmitted: 0,
            likesReceived: 0
          })
        }

        // Fetch user badges to check for Active Supporter status
        if (user?.id) {
          try {
            const badgesResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${user.id}/badges`)
            if (badgesResponse.ok) {
              const badgesData = await badgesResponse.json()
              const badgesArray = Array.isArray(badgesData) ? badgesData : (badgesData.data || [])
              setUserBadges(badgesArray)
            }
          } catch (error) {
            console.error('Failed to fetch user badges:', error)
          }
        }

        // Fetch user's guides
        if (user?.id) {
          try {
            const guidesResponse = await api.getGuidesAdmin({ 
              authorId: user.id, 
              limit: 100 // Get all user's guides
            })
            setUserGuides(guidesResponse.data || [])
          } catch (error) {
            console.error('Failed to fetch user guides:', error)
            // Fallback to empty array
            setUserGuides([])
          }
        }
      } catch (error) {
        console.error('Failed to fetch profile data:', error)
        setError('Failed to load profile data. Some features may not work properly.')
      } finally {
        setDataLoading(false)
      }
    }

    if (user) {
      fetchData()
    } else {
      // Reset loading state when no user is available
      setDataLoading(false)
    }
  }, [user, userProgress])

  const handleSaveProfilePicture = async () => {
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      // Prepare the update data for profile picture only
      const updateData: {
        profilePictureType?: 'discord' | 'character_media' | null
        selectedCharacterMediaId?: number | null
      } = {}

      // Handle profile picture selection
      if (selectedCharacterMedia === null) {
        // Discord profile selected
        updateData.profilePictureType = 'discord'
        updateData.selectedCharacterMediaId = null
      } else {
        // Character media selected
        updateData.profilePictureType = 'character_media'
        updateData.selectedCharacterMediaId = selectedCharacterMedia
      }

      console.log('Sending profile picture update data:', updateData)
      
      const result = await api.updateProfile(updateData)
      console.log('Profile picture update result:', result)
      
      await refreshUser()
      setSuccess('Profile picture updated successfully!')
      setProfilePictureModalOpen(false)
    } catch (error: unknown) {
      console.error('Profile picture update error:', error)
      setError(error instanceof Error ? error.message : 'Failed to update profile picture')
    } finally {
      setLoading(false)
    }
  }

  // Helper function to organize character media by character
  const organizeCharacterMedia = () => {
    const filtered = characterMedia.filter(media => 
      characterSearchTerm === '' || 
      media.character.name.toLowerCase().includes(characterSearchTerm.toLowerCase())
    )
    
    const grouped = filtered.reduce((acc, media) => {
      const characterName = media.character.name
      if (!acc[characterName]) {
        acc[characterName] = []
      }
      acc[characterName].push(media)
      return acc
    }, {} as Record<string, typeof characterMedia>)
    
    // Sort each character's media by chapter number
    Object.keys(grouped).forEach(character => {
      grouped[character].sort((a, b) => a.chapterNumber - b.chapterNumber)
    })
    
    return grouped
  }

  if (authLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <CircularProgress size={50} />
        </Box>
      </Container>
    )
  }

  if (!user) {
    return (
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Alert severity="warning">
          Please log in to view your profile.
        </Alert>
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
              alignItems: 'flex-start', 
              gap: 3,
              flexDirection: 'row',
              textAlign: 'left'
            }}>
              {/* Profile Image - Clickable */}
              <Box 
                sx={{ 
                  position: 'relative',
                  cursor: 'pointer',
                  flexShrink: 0,
                  '&:hover .camera-overlay': {
                    opacity: 1
                  }
                }}
                onClick={() => setProfilePictureModalOpen(true)}
              >
                <UserProfileImage
                  user={user}
                  size={120}
                />
                
                {/* Camera Overlay */}
                <Box 
                  className="camera-overlay"
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%',
                    opacity: 0,
                    transition: 'opacity 0.2s ease-in-out'
                  }}
                >
                  <Camera size={32} color="white" />
                </Box>
              </Box>
              
              {/* User Info */}
              <Box sx={{ flex: 1 }}>
                {/* Username and Role Chip Row */}
                <Box sx={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  mb: 2,
                  flexWrap: 'wrap',
                  justifyContent: 'flex-start'
                }}>
                  <Typography 
                    variant="h3" 
                    component="h1" 
                    sx={{
                      background: 'linear-gradient(45deg, #1976d2 30%, #9c27b0 90%)',
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      fontWeight: 'bold',
                      mb: 0
                    }}
                  >
                    {user.username}
                  </Typography>
                  
                  <Chip
                    label={user.role === 'admin' ? 'Administrator' :
                           user.role === 'moderator' ? 'Moderator' : 'Member'}
                    color={user.role === 'admin' ? 'error' : user.role === 'moderator' ? 'warning' : 'default'}
                    variant="outlined"
                    icon={user.role === 'admin' || user.role === 'moderator' ? <Crown size={16} /> : undefined}
                    size="medium"
                    sx={{ fontWeight: 'bold' }}
                  />
                </Box>

                {/* User Role Display - Shows functional roles, custom roles, and badges in proper hierarchy */}
                <Box sx={{ mb: 2 }}>
                  <UserRoleDisplay
                    userRole={user.role as 'admin' | 'moderator' | 'user'}
                    customRole={user.customRole}
                    userBadges={userBadges as any[]}
                    size="medium"
                    spacing={1}
                  />
                </Box>

                {/* Custom Role Editor */}
                <CustomRoleEditor
                  currentRole={user.customRole || null}
                  isActiveSupporterUser={hasActiveSupporterBadge()}
                  onUpdate={handleCustomRoleUpdate}
                />
                
                {/* Improved Quick Stats */}
                <Box sx={{ 
                  display: 'flex', 
                  gap: 2, 
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                  mb: 3
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
                  px: 2,
                  py: 1.5,
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
                      Chapter {userProgress} of 539 ({Math.round((userProgress / 539) * 100)}%)
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={(userProgress / 539) * 100}
                      sx={{
                        height: 10,
                        borderRadius: 5,
                        backgroundColor: 'action.hover',
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 5,
                          background: 'linear-gradient(90deg, #e11d48 0%, #7c3aed 100%)',
                        },
                        mb: currentChapterInfo?.title ? 1 : 0
                      }}
                    />
                    {currentChapterInfo?.title && (
                      <Typography 
                        variant="body2" 
                        color="text.secondary" 
                        sx={{ 
                          fontStyle: 'italic',
                          fontSize: '0.875rem'
                        }}
                      >
                        &ldquo;{currentChapterInfo.title}&rdquo;
                      </Typography>
                    )}
                  </Box>
                </Box>

                {/* Enhanced Favorites Section */}
                {(user.favoriteQuoteId || user.favoriteGambleId) && (
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
                      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                        (Click to change)
                      </Typography>
                    </Box>
                    
                    <Box sx={{ 
                      display: 'flex', 
                      flexDirection: { xs: 'column', md: 'row' }, 
                      gap: 3,
                      alignItems: { xs: 'flex-start', md: 'flex-start' }
                    }}>
                      {user.favoriteQuoteId && (
                        <Box sx={{ 
                          flex: 1,
                          p: 2,
                          borderRadius: 2,
                          border: '1px solid',
                          borderColor: 'divider',
                          bgcolor: 'background.paper',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          '&:hover': { 
                            borderColor: 'primary.main',
                            transform: 'translateY(-2px)',
                            boxShadow: 2
                          }
                        }}
                        onClick={() => setQuoteSelectionOpen(true)}
                        >
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
                            <Edit size={14} color="#666" />
                          </Box>
                          <Box sx={{ maxWidth: '400px' }}>
                            {(() => {
                              const quote = quotes.find(q => q.id === user.favoriteQuoteId)
                              return quote ? (
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
                                    &ldquo;{quote.text}&rdquo;
                                  </Typography>
                                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                    <Chip 
                                      label={quote.character} 
                                      size="small" 
                                      variant="outlined"
                                      sx={{ bgcolor: 'rgba(0, 121, 107, 0.1)', borderColor: '#00796b' }}
                                    />
                                    <Chip 
                                      label={`Ch. ${quote.chapterNumber}`} 
                                      size="small" 
                                      variant="outlined"
                                      color="primary"
                                    />
                                  </Box>
                                </Box>
                              ) : (
                                <Typography variant="body2" color="text.secondary">Loading...</Typography>
                              )
                            })()}
                          </Box>
                        </Box>
                      )}

                      {user.favoriteGambleId && (
                        <Box sx={{ 
                          p: 2,
                          borderRadius: 2,
                          border: '1px solid',
                          borderColor: 'divider',
                          bgcolor: 'background.paper',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          minWidth: { md: 200 },
                          '&:hover': { 
                            borderColor: 'primary.main',
                            transform: 'translateY(-2px)',
                            boxShadow: 2
                          }
                        }}
                        onClick={() => setGambleSelectionOpen(true)}
                        >
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
                            <Edit size={14} color="#666" />
                          </Box>
                          {(() => {
                            const gamble = gambles.find(g => g.id === user.favoriteGambleId)
                            return gamble ? (
                              <GambleChip gamble={gamble} size="medium" />
                            ) : (
                              <Typography variant="body2" color="text.secondary">Loading...</Typography>
                            )
                          })()}
                        </Box>
                      )}
                    </Box>
                  </Box>
                )}

                {/* Add missing favorites section */}
                {(!user.favoriteQuoteId || !user.favoriteGambleId) && (
                  <Box sx={{
                    mt: 3,
                    p: 3,
                    bgcolor: 'background.paper',
                    borderRadius: 3,
                    border: '2px dashed',
                    borderColor: 'primary.main',
                    textAlign: 'center',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      borderColor: 'primary.dark',
                      bgcolor: 'rgba(225, 29, 72, 0.02)'
                    }
                  }}>
                    <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 'bold', mb: 1 }}>
                      {!user.favoriteQuoteId && !user.favoriteGambleId ? 'Add Your Favorites' : 'Complete Your Favorites'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
                      {!user.favoriteQuoteId && !user.favoriteGambleId
                        ? 'Showcase your favorite quote and gamble on your profile'
                        : 'Add your missing favorite to complete your profile'
                      }
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                      {!user.favoriteQuoteId && (
                        <Button
                          variant="contained"
                          startIcon={<Quote size={18} />}
                          onClick={() => setQuoteSelectionOpen(true)}
                          sx={{
                            bgcolor: '#00796b',
                            '&:hover': { bgcolor: '#005a52' },
                            borderRadius: 2,
                            px: 3
                          }}
                        >
                          Add Favorite Quote
                        </Button>
                      )}
                      {!user.favoriteGambleId && (
                        <Button
                          variant="contained"
                          startIcon={<Dices size={18} />}
                          onClick={() => setGambleSelectionOpen(true)}
                          sx={{
                            bgcolor: '#d32f2f',
                            '&:hover': { bgcolor: '#b71c1c' },
                            borderRadius: 2,
                            px: 3
                          }}
                        >
                          Add Favorite Gamble
                        </Button>
                      )}
                    </Box>
                  </Box>
                )}
              </Box>
            </Box>
          </CardContent>
        </Card>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {success}
          </Alert>
        )}

        {/* User Guides Section */}
        <Card className="gambling-card" sx={{ mb: 4 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <BookOpen size={24} />
              <Typography variant="h5" sx={{ ml: 1 }}>
                My Guides ({userGuides.length})
              </Typography>
            </Box>

            {userGuides.length > 0 ? (
              <Grid container spacing={3}>
                {userGuides.map((guide) => (
                  <Grid item xs={12} key={guide.id}>
                    <Card 
                      className="gambling-card"
                      sx={{ 
                        border: '1px solid',
                        borderColor: guide.status === GuideStatus.PENDING ? 'warning.main' : 'divider',
                        backgroundColor: guide.status === GuideStatus.PENDING ? 'rgba(255, 152, 0, 0.05)' : 'background.paper',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          borderColor: 'primary.main',
                          boxShadow: 2,
                          transform: 'translateY(-2px)'
                        }
                      }}
                    >
                      <CardContent>
                        {/* Pending indicator banner */}
                        {guide.status === GuideStatus.PENDING && (
                          <Box sx={{ 
                            mb: 2, 
                            p: 1.5, 
                            backgroundColor: 'rgba(255, 152, 0, 0.1)',
                            borderRadius: 1,
                            border: '1px solid rgba(255, 152, 0, 0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1
                          }}>
                            <BookOpen size={16} color="#ff9800" />
                            <Typography variant="body2" color="warning.main" sx={{ fontWeight: 'medium' }}>
                              This guide is under review and will be visible to others once approved.
                            </Typography>
                          </Box>
                        )}
                        
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                          <Box sx={{ flex: 1 }}>
                            <Typography 
                              variant="h6" 
                              component={Link}
                              href={`/guides/${guide.id}`}
                              sx={{
                                textDecoration: 'none',
                                color: 'inherit',
                                '&:hover': {
                                  color: 'primary.main'
                                }
                              }}
                            >
                              {guide.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                              {guide.description}
                            </Typography>
                          </Box>
                          <Box sx={{ ml: 2 }}>
                            <Chip
                              label={guide.status === GuideStatus.PENDING ? 'Under Review' : guide.status}
                              size="small"
                              color={
                                guide.status === GuideStatus.APPROVED ? 'success' :
                                guide.status === GuideStatus.PENDING ? 'warning' : 'error'
                              }
                              sx={{
                                textTransform: 'capitalize',
                                fontWeight: guide.status === GuideStatus.PENDING ? 'bold' : 'normal'
                              }}
                            />
                          </Box>
                        </Box>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, color: 'text.secondary' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Heart size={16} />
                            <Typography variant="body2">{guide.likeCount}</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Eye size={16} />
                            <Typography variant="body2">{guide.viewCount}</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Calendar size={16} />
                            <Typography variant="body2">
                              {new Date(guide.createdAt).toLocaleDateString()}
                            </Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Box sx={{
                textAlign: 'center',
                py: 4,
                color: 'text.secondary'
              }}>
                <FileText size={48} style={{ opacity: 0.5, marginBottom: 16 }} />
                <Typography variant="h6" gutterBottom>
                  No guides yet
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  You haven't written any guides yet.
                </Typography>
                <Button
                  component={Link}
                  href="/submit-guide"
                  variant="contained"
                  startIcon={<Edit size={18} />}
                  sx={{ mt: 2 }}
                >
                  Write Your First Guide
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Account Information - Centered */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
          <Card className="gambling-card" sx={{ maxWidth: 600, width: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <User size={24} />
                <Typography variant="h5" sx={{ ml: 1 }}>
                  Account Information
                </Typography>
              </Box>

              <Grid container spacing={3}>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Email
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                      {user.email}
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      User ID
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                      #{user.id}
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Discord Connection
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                      {user.discordId ? 'Connected' : 'Not Connected'}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Box>
      </motion.div>

      {/* Profile Picture Selection Modal */}
      <Dialog 
        open={profilePictureModalOpen} 
        onClose={() => setProfilePictureModalOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { height: '80vh' } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          Choose Profile Picture
          <IconButton onClick={() => setProfilePictureModalOpen(false)} size="small">
            <X size={20} />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ p: 0 }}>
          {error && (
            <Alert severity="error" sx={{ m: 2, mb: 0 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ m: 2, mb: 0 }}>
              {success}
            </Alert>
          )}

          {/* Tabs for different picture types */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={selectedTab} onChange={(e, newValue) => setSelectedTab(newValue)}>
              <Tab label="Discord Profile" />
              <Tab label="Character Media" />
            </Tabs>
          </Box>

          {/* Tab Content */}
          <Box sx={{ p: 2, height: 'calc(80vh - 200px)', overflowY: 'auto' }}>
            {selectedTab === 0 && (
              // Discord Profile Tab
              <Box>
                <Typography variant="h6" gutterBottom>
                  Discord Profile Picture
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 2 }}>
                  Use your Discord avatar as your profile picture
                </Typography>
                
                {user.discordId && user.discordAvatar ? (
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 2, 
                      p: 3, 
                      border: selectedCharacterMedia === null ? 2 : 1, 
                      borderColor: selectedCharacterMedia === null ? 'primary.main' : 'divider', 
                      borderRadius: 2, 
                      cursor: 'pointer', 
                      bgcolor: selectedCharacterMedia === null ? 'primary.50' : 'transparent',
                      '&:hover': {
                        bgcolor: selectedCharacterMedia === null ? 'primary.100' : 'action.hover'
                      }
                    }}
                    onClick={() => setSelectedCharacterMedia(null)}
                  >
                    <Avatar
                      src={user.discordAvatar.startsWith('http') ? user.discordAvatar : `https://cdn.discordapp.com/avatars/${user.discordId}/${user.discordAvatar}.png`}
                      sx={{ width: 64, height: 64 }}
                    />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" fontWeight={selectedCharacterMedia === null ? 'bold' : 'normal'}>
                        Discord Profile Picture
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {user.discordUsername || user.username}
                      </Typography>
                      {selectedCharacterMedia === null && (
                        <Chip label="Selected" color="primary" size="small" sx={{ mt: 1 }} />
                      )}
                    </Box>
                  </Box>
                ) : (
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 2, 
                      p: 3, 
                      border: selectedCharacterMedia === null ? 2 : 1, 
                      borderColor: selectedCharacterMedia === null ? 'primary.main' : 'divider', 
                      borderRadius: 2, 
                      cursor: 'pointer', 
                      bgcolor: selectedCharacterMedia === null ? 'primary.50' : 'transparent',
                      '&:hover': {
                        bgcolor: selectedCharacterMedia === null ? 'primary.100' : 'action.hover'
                      }
                    }}
                    onClick={() => setSelectedCharacterMedia(null)}
                  >
                    <Avatar sx={{ width: 64, height: 64, bgcolor: 'grey.400' }}>
                      {user.username[0].toUpperCase()}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" fontWeight={selectedCharacterMedia === null ? 'bold' : 'normal'}>
                        Default Profile Picture
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        No Discord profile available
                      </Typography>
                      {selectedCharacterMedia === null && (
                        <Chip label="Selected" color="primary" size="small" sx={{ mt: 1 }} />
                      )}
                    </Box>
                  </Box>
                )}
                
                {/* Discord Avatar Notice */}
                {user.discordId && (
                  <Box sx={{ mt: 3, p: 2, backgroundColor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                      💡 To update your Discord avatar, log out and log back in with Discord
                    </Typography>
                  </Box>
                )}
              </Box>
            )}

            {selectedTab === 1 && (
              // Character Media Tab
              <Box>
                <Typography variant="h6" gutterBottom>
                  Character Display Media
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Choose from character images based on your reading progress
                </Typography>
                
                {/* Search Box */}
                <TextField
                  fullWidth
                  placeholder="Search characters..."
                  value={characterSearchTerm}
                  onChange={(e) => setCharacterSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search size={20} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ mb: 2, mt: 2 }}
                />

                {characterMedia.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      No character media available based on your reading progress.
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Continue reading to unlock more profile picture options!
                    </Typography>
                  </Box>
                ) : (
                  <Box>
                    {Object.entries(organizeCharacterMedia()).map(([characterName, mediaItems]) => (
                      <Accordion key={characterName} defaultExpanded={Object.keys(organizeCharacterMedia()).length <= 3}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar
                              src={mediaItems[0]?.url}
                              sx={{ width: 32, height: 32 }}
                            >
                              {characterName[0]}
                            </Avatar>
                            <Typography variant="h6">{characterName}</Typography>
                            <Chip 
                              label={`${mediaItems.length} image${mediaItems.length !== 1 ? 's' : ''}`} 
                              size="small" 
                              variant="outlined" 
                            />
                          </Box>
                        </AccordionSummary>
                        <AccordionDetails>
                          <Grid container spacing={2}>
                            {mediaItems.map((media) => (
                              <Grid item xs={6} sm={4} key={media.id}>
                                <ProfilePictureSpoilerWrapper media={media}>
                                  <Box
                                    sx={{
                                      position: 'relative',
                                      cursor: 'pointer',
                                      border: selectedCharacterMedia === media.id ? 2 : 1,
                                      borderColor: selectedCharacterMedia === media.id ? 'primary.main' : 'divider',
                                      borderRadius: 2,
                                      overflow: 'hidden',
                                      bgcolor: selectedCharacterMedia === media.id ? 'primary.50' : 'transparent',
                                      '&:hover': {
                                        bgcolor: selectedCharacterMedia === media.id ? 'primary.100' : 'action.hover'
                                      }
                                    }}
                                    onClick={() => setSelectedCharacterMedia(media.id)}
                                  >
                                    <Avatar
                                      src={media.url}
                                      sx={{ width: '100%', height: 120, borderRadius: 1 }}
                                      variant="rounded"
                                    >
                                      {characterName[0]}
                                    </Avatar>
                                    <Box sx={{ p: 1 }}>
                                      <Typography variant="caption" color="text.secondary" display="block">
                                        Chapter {media.chapterNumber}
                                      </Typography>
                                      {media.description && (
                                        <Typography 
                                          variant="caption" 
                                          color="text.secondary" 
                                          sx={{ 
                                            fontSize: '0.7rem', 
                                            fontStyle: 'italic',
                                            display: '-webkit-box',
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: 'vertical',
                                            overflow: 'hidden'
                                          }}
                                        >
                                          {media.description}
                                        </Typography>
                                      )}
                                      {selectedCharacterMedia === media.id && (
                                        <Chip 
                                          label="Selected" 
                                          color="primary" 
                                          size="small" 
                                          sx={{ mt: 0.5, fontSize: '0.7rem', height: 20 }} 
                                        />
                                      )}
                                    </Box>
                                  </Box>
                                </ProfilePictureSpoilerWrapper>
                              </Grid>
                            ))}
                          </Grid>
                        </AccordionDetails>
                      </Accordion>
                    ))}
                  </Box>
                )}
              </Box>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setProfilePictureModalOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={loading ? <CircularProgress size={20} /> : <Save size={20} />}
            onClick={handleSaveProfilePicture}
            disabled={loading || dataLoading}
          >
            {loading ? 'Saving...' : 'Save Profile Picture'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Quote Selection Popup */}
      <QuoteSelectionPopup
        open={quoteSelectionOpen}
        onClose={() => setQuoteSelectionOpen(false)}
        quotes={quotes}
        selectedQuoteId={selectedQuote}
        onSelectQuote={async (quoteId) => {
          setSelectedQuote(quoteId)
          
          // Auto-save the selection with the new value
          setLoading(true)
          setError('')
          setSuccess('')

          try {
            const updateData: {
              favoriteQuoteId?: number | null
            } = {
              favoriteQuoteId: quoteId
            }

            console.log('Sending quote update data:', updateData)
            
            await api.updateProfile(updateData)
            await refreshUser()
            setSuccess('Favorite quote updated successfully!')
          } catch (error: unknown) {
            console.error('Quote update error:', error)
            setError(error instanceof Error ? error.message : 'Failed to update favorite quote')
          } finally {
            setLoading(false)
          }
        }}
        loading={loading}
      />

      {/* Gamble Selection Popup */}
      <GambleSelectionPopup
        open={gambleSelectionOpen}
        onClose={() => setGambleSelectionOpen(false)}
        gambles={gambles}
        selectedGambleId={selectedGamble}
        onSelectGamble={async (gambleId) => {
          setSelectedGamble(gambleId)
          
          // Auto-save the selection with the new value
          setLoading(true)
          setError('')
          setSuccess('')

          try {
            const updateData: {
              favoriteGambleId?: number | null
            } = {
              favoriteGambleId: gambleId
            }

            console.log('Sending gamble update data:', updateData)
            
            await api.updateProfile(updateData)
            await refreshUser()
            setSuccess('Favorite gamble updated successfully!')
          } catch (error: unknown) {
            console.error('Gamble update error:', error)
            setError(error instanceof Error ? error.message : 'Failed to update favorite gamble')
          } finally {
            setLoading(false)
          }
        }}
        loading={loading}
      />

    </Container>
  )
}
