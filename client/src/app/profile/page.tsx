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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
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
  useTheme
} from '@mui/material'
import { User, Settings, Crown, BookOpen, Save, X, Camera, Search, AlertTriangle } from 'lucide-react'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { useAuth } from '../../providers/AuthProvider'
import { useProgress } from '../../providers/ProgressProvider'
import { useSpoilerSettings } from '../../hooks/useSpoilerSettings'
import { api } from '../../lib/api'
import { motion } from 'motion/react'
import UserProfileImage from '../../components/UserProfileImage'

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
  const { user, refreshUser, logout, loading: authLoading } = useAuth()
  const { userProgress, updateProgress } = useProgress()
  const [selectedQuote, setSelectedQuote] = useState<number | null>(null)
  const [selectedGamble, setSelectedGamble] = useState<number | null>(null)
  const [selectedCharacterMedia, setSelectedCharacterMedia] = useState<number | null>(null)
  const [selectedChapter, setSelectedChapter] = useState<number>(1)
  const [currentChapterInfo, setCurrentChapterInfo] = useState<{
    id: number
    number: number
    title: string | null
    summary: string | null
  } | null>(null)
  const [quotes, setQuotes] = useState<Array<{ id: number; text: string; character: string }>>([])
  const [gambles, setGambles] = useState<Array<{ id: number; name: string; description?: string }>>([])
  const [characterMedia, setCharacterMedia] = useState<Array<{
    id: number
    url: string
    fileName: string
    description: string
    character: { id: number; name: string }
    chapterNumber: number
  }>>([])
  const [loading, setLoading] = useState(false)
  const [progressLoading, setProgressLoading] = useState(false)
  const [dataLoading, setDataLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [profilePictureModalOpen, setProfilePictureModalOpen] = useState(false)
  const [characterSearchTerm, setCharacterSearchTerm] = useState('')
  const [selectedTab, setSelectedTab] = useState(0) // 0 = Discord, 1 = Character Media

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
        
        setSelectedChapter(userProgress)

        // Fetch quotes and gambles from API
        const [quotesResponse, gamblesResponse] = await Promise.all([
          api.getQuotes({ limit: 100 }),
          api.getGambles({ limit: 100 })
        ])

        // Format quotes for display
        const formattedQuotes = quotesResponse.data.map((quote: any) => ({
          id: quote.id,
          text: quote.text,
          character: quote.character?.name || 'Unknown'
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

  const handleSaveProfile = async () => {
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      // Prepare the update data based on selection type
      const updateData: {
        favoriteQuoteId?: number | null
        favoriteGambleId?: number | null
        profilePictureType?: 'discord' | 'character_media' | null
        selectedCharacterMediaId?: number | null
      } = {}

      // Add basic preferences only if they have values
      if (selectedQuote) {
        updateData.favoriteQuoteId = selectedQuote
      }
      if (selectedGamble) {
        updateData.favoriteGambleId = selectedGamble
      }

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

      console.log('Sending profile update data:', updateData)
      
      const result = await api.updateProfile(updateData)
      console.log('Profile update result:', result)
      
      await refreshUser()
      setSuccess('Profile updated successfully!')
    } catch (error: unknown) {
      console.error('Profile update error:', error)
      setError(error instanceof Error ? error.message : 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateProgress = async () => {
    setProgressLoading(true)
    setError('')
    setSuccess('')

    try {
      await updateProgress(selectedChapter)
      setSuccess('Reading progress updated successfully!')
      
      // Update chapter info after progress change
      if (selectedChapter) {
        try {
          const chapterInfo = await api.getChapterByNumber(selectedChapter)
          setCurrentChapterInfo(chapterInfo)
        } catch (error) {
          console.error('Failed to fetch updated chapter info:', error)
        }
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Failed to update reading progress')
    } finally {
      setProgressLoading(false)
    }
  }

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
              alignItems: 'center', 
              gap: 3,
              flexDirection: { xs: 'column', sm: 'row' },
              textAlign: { xs: 'center', sm: 'left' }
            }}>
              {/* Profile Image - Clickable */}
              <Box 
                sx={{ 
                  position: 'relative',
                  cursor: 'pointer',
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
                <Typography 
                  variant="h3" 
                  component="h1" 
                  sx={{
                    background: 'linear-gradient(45deg, #1976d2 30%, #9c27b0 90%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    fontWeight: 'bold',
                    mb: 1
                  }}
                >
                  {user.username}
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, justifyContent: { xs: 'center', sm: 'flex-start' } }}>
                  <Chip
                    label={user.role === 'admin' ? 'Administrator' : 
                           user.role === 'moderator' ? 'Moderator' : 'Member'}
                    color={user.role === 'admin' ? 'error' : user.role === 'moderator' ? 'warning' : 'default'}
                    variant="outlined"
                    icon={user.role === 'admin' || user.role === 'moderator' ? <Crown size={16} /> : undefined}
                  />
                  
                  <Chip
                    label={user.isEmailVerified ? 'Verified' : 'Not Verified'}
                    color={user.isEmailVerified ? 'success' : 'warning'}
                    size="small"
                  />
                </Box>
                
                {/* Quick Stats */}
                <Box sx={{ 
                  display: 'flex', 
                  gap: 3, 
                  flexDirection: { xs: 'column', sm: 'row' },
                  alignItems: { xs: 'center', sm: 'flex-start' }
                }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>
                      {userProgress}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Current Chapter
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" color="secondary" sx={{ fontWeight: 'bold' }}>
                      {Math.round((userProgress / 539) * 100)}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Progress
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" color="info.main" sx={{ fontWeight: 'bold' }}>
                      {user.role === 'admin' ? '∞' : '0'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Contributions
                    </Typography>
                  </Box>
                </Box>
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

        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Card className="gambling-card">
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <User size={24} />
                  <Typography variant="h5" sx={{ ml: 1 }}>
                    Account Information
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Email
                  </Typography>
                  <Typography variant="body1">
                    {user.email}
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    User ID
                  </Typography>
                  <Typography variant="body1">
                    #{user.id}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Discord Connection
                  </Typography>
                  <Typography variant="body1">
                    {user.discordId ? 'Connected' : 'Not Connected'}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card className="gambling-card">
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Settings size={24} />
                  <Typography variant="h5" sx={{ ml: 1 }}>
                    Preferences
                  </Typography>
                </Box>

                {/* Current Favorites Display */}
                {(user.favoriteQuoteId || user.favoriteGambleId) && (
                  <Box sx={{ mb: 3, p: 2, backgroundColor: 'action.hover', borderRadius: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Current Favorites
                    </Typography>
                    {user.favoriteQuoteId && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Favorite Quote
                        </Typography>
                        <Typography variant="body1">
                          {(() => {
                            const quote = quotes.find(q => q.id === user.favoriteQuoteId)
                            return quote ? `"${quote.text}" - ${quote.character}` : 'Loading...'
                          })()}
                        </Typography>
                      </Box>
                    )}
                    {user.favoriteGambleId && (
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Favorite Gamble
                        </Typography>
                        <Typography variant="body1">
                          {(() => {
                            const gamble = gambles.find(g => g.id === user.favoriteGambleId)
                            return gamble ? gamble.name : 'Loading...'
                          })()}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                )}

                <Box sx={{ mb: 3 }}>
                  <FormControl fullWidth disabled={dataLoading}>
                    <InputLabel>Favorite Quote</InputLabel>
                    <Select
                      value={selectedQuote || ''}
                      label="Favorite Quote"
                      onChange={(e) => setSelectedQuote(e.target.value as number)}
                    >
                      <MenuItem value="">
                        <em>None</em>
                      </MenuItem>
                      {quotes.map((quote) => (
                        <MenuItem key={quote.id} value={quote.id}>
                          &ldquo;{quote.text}&rdquo; - {quote.character}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>

                <Box sx={{ mb: 3 }}>
                  <FormControl fullWidth disabled={dataLoading}>
                    <InputLabel>Favorite Gamble</InputLabel>
                    <Select
                      value={selectedGamble || ''}
                      label="Favorite Gamble"
                      onChange={(e) => setSelectedGamble(e.target.value as number)}
                    >
                      <MenuItem value="">
                        <em>None</em>
                      </MenuItem>
                      {gambles.map((gamble) => (
                        <MenuItem key={gamble.id} value={gamble.id}>
                          {gamble.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>

                <Button
                  variant="contained"
                  startIcon={loading ? <CircularProgress size={20} /> : <Save size={20} />}
                  onClick={handleSaveProfile}
                  disabled={loading || dataLoading}
                  fullWidth
                  size="large"
                >
                  {loading ? 'Saving...' : dataLoading ? 'Loading...' : 'Save Preferences'}
                </Button>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card className="gambling-card">
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <BookOpen size={24} />
                  <Typography variant="h5" sx={{ ml: 1 }}>
                    Reading Progress
                  </Typography>
                </Box>

                <Grid container spacing={3} sx={{ mb: 4 }}>
                  <Grid item xs={12} sm={4}>
                    <Box sx={{ textAlign: 'center', p: 2, backgroundColor: 'action.hover', borderRadius: 2 }}>
                      <Typography variant="h3" color="primary" gutterBottom>
                        {userProgress}
                      </Typography>
                      <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                        Current Chapter
                      </Typography>
                      {currentChapterInfo?.title && (
                        <Typography variant="body2" color="text.secondary" sx={{ 
                          fontStyle: 'italic',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical'
                        }}>
                          &ldquo;{currentChapterInfo.title}&rdquo;
                        </Typography>
                      )}
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Box sx={{ textAlign: 'center', p: 2, backgroundColor: 'action.hover', borderRadius: 2 }}>
                      <Typography variant="h3" color="secondary" gutterBottom>
                        {Math.round((userProgress / 539) * 100)}%
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
                        Progress Complete
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Box sx={{ textAlign: 'center', p: 2, backgroundColor: 'action.hover', borderRadius: 2 }}>
                      <Typography variant="h3" color="warning.main" gutterBottom>
                        {539 - userProgress}
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
                        Chapters Remaining
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                <Box sx={{ mb: 3 }}>
                  <FormControl fullWidth disabled={dataLoading || progressLoading}>
                    <InputLabel>Update Current Chapter</InputLabel>
                    <Select
                      value={selectedChapter}
                      label="Update Current Chapter"
                      onChange={(e) => setSelectedChapter(e.target.value as number)}
                    >
                      {Array.from({ length: 539 }, (_, i) => i + 1).map((chapter) => (
                        <MenuItem key={chapter} value={chapter}>
                          Chapter {chapter}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Select the highest chapter number you have read (1-539)
                  </Typography>
                </Box>

                <Button
                  variant="contained"
                  startIcon={progressLoading ? <CircularProgress size={20} /> : <BookOpen size={20} />}
                  onClick={handleUpdateProgress}
                  disabled={progressLoading || dataLoading}
                  fullWidth
                  size="large"
                  color="secondary"
                >
                  {progressLoading ? 'Updating...' : dataLoading ? 'Loading...' : `Update Reading Progress (Chapter ${userProgress})`}
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Box sx={{ mt: 4 }}>
          <Card className="gambling-card">
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Activity & Contributions
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Track your contributions to the L-file community
              </Typography>

              <Grid container spacing={3}>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="primary">
                      0
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Guides Written
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="secondary">
                      0
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Media Submitted
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="info.main">
                      0
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Comments Made
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="success.main">
                      0
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Likes Received
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

    </Container>
  )
}
