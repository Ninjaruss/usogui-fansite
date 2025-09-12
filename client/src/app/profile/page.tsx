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
  InputLabel
} from '@mui/material'
import { User, Settings, Crown, BookOpen, Save } from 'lucide-react'
import { useAuth } from '../../providers/AuthProvider'
import { useProgress } from '../../providers/ProgressProvider'
import { api } from '../../lib/api'
import { motion } from 'motion/react'
import UserProfileImage from '../../components/UserProfileImage'

export default function ProfilePage() {
  const { user, refreshUser, loading: authLoading } = useAuth()
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
  const [refreshingAvatar, setRefreshingAvatar] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

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

  const handleRefreshDiscordAvatar = async () => {
    setRefreshingAvatar(true)
    setError('')
    setSuccess('')

    try {
      await api.refreshDiscordAvatar()
      await refreshUser()
      setSuccess('Discord avatar refreshed successfully!')
    } catch (error: unknown) {
      console.error('Discord avatar refresh error:', error)
      setError(error instanceof Error ? error.message : 'Failed to refresh Discord avatar')
    } finally {
      setRefreshingAvatar(false)
    }
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
              {/* Profile Image */}
              <UserProfileImage
                user={user}
                size={120}
              />
              
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

                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Profile Picture
                  </Typography>
                  
                  {/* Discord Profile Option - Default */}
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Default Option
                    </Typography>
                    {user.discordId && user.discordAvatar ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, border: selectedCharacterMedia === null ? 2 : 1, borderColor: selectedCharacterMedia === null ? 'primary.main' : 'divider', borderRadius: 2, cursor: 'pointer', bgcolor: selectedCharacterMedia === null ? 'primary.50' : 'transparent' }}
                           onClick={() => setSelectedCharacterMedia(null)}>
                        <Avatar
                          src={user.discordAvatar.startsWith('http') ? user.discordAvatar : `https://cdn.discordapp.com/avatars/${user.discordId}/${user.discordAvatar}.png`}
                          sx={{ width: 48, height: 48 }}
                        />
                        <Box>
                          <Typography variant="body1" fontWeight={selectedCharacterMedia === null ? 'bold' : 'normal'}>
                            Discord Profile Picture
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {user.discordUsername || user.username}
                          </Typography>
                        </Box>
                      </Box>
                    ) : (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, border: selectedCharacterMedia === null ? 2 : 1, borderColor: selectedCharacterMedia === null ? 'primary.main' : 'divider', borderRadius: 2, cursor: 'pointer', bgcolor: selectedCharacterMedia === null ? 'primary.50' : 'transparent' }}
                           onClick={() => setSelectedCharacterMedia(null)}>
                        <Avatar sx={{ width: 48, height: 48, bgcolor: 'grey.400' }}>
                          {user.username[0].toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography variant="body1" fontWeight={selectedCharacterMedia === null ? 'bold' : 'normal'}>
                            Default Profile Picture
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            No Discord profile available
                          </Typography>
                        </Box>
                      </Box>
                    )}
                    
                    {/* Refresh Discord Avatar Button */}
                    {user.discordId && (
                      <Box sx={{ mt: 2, mb: 1 }}>
                        <Button
                          onClick={handleRefreshDiscordAvatar}
                          disabled={refreshingAvatar}
                          variant="outlined"
                          size="small"
                          startIcon={refreshingAvatar ? <CircularProgress size={16} /> : undefined}
                        >
                          {refreshingAvatar ? 'Refreshing...' : 'Refresh Discord Avatar'}
                        </Button>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                          Click to fetch your latest Discord profile picture
                        </Typography>
                      </Box>
                    )}
                  </Box>
                  
                  
                  {/* Character Entity Display Media */}
                  {characterMedia.length > 0 && (
                    <>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Character Display Media (Based on Reading Progress)
                      </Typography>
                      <Box sx={{ mb: 2, maxHeight: 200, overflowY: 'auto' }}>
                        {characterMedia.map((media) => (
                          <Box key={media.id} 
                               sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, mb: 1, border: selectedCharacterMedia === media.id ? 2 : 1, borderColor: selectedCharacterMedia === media.id ? 'primary.main' : 'divider', borderRadius: 2, cursor: 'pointer' }}
                               onClick={() => setSelectedCharacterMedia(media.id)}>
                            <Avatar
                              src={media.url}
                              sx={{ width: 48, height: 48 }}
                            >
                              {media.character.name[0]}
                            </Avatar>
                            <Box>
                              <Typography variant="body1">
                                {media.character.name} - Chapter {media.chapterNumber}
                              </Typography>
                              {media.description && (
                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', fontStyle: 'italic' }}>
                                  {media.description}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        ))}
                      </Box>
                    </>
                  )}
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
    </Container>
  )
}
