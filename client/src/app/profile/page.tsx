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
import { api } from '../../lib/api'
import { motion } from 'motion/react'

export default function ProfilePage() {
  const { user, refreshUser } = useAuth()
  const [selectedQuote, setSelectedQuote] = useState<number | null>(null)
  const [selectedGamble, setSelectedGamble] = useState<number | null>(null)
  const [selectedProfileImage, setSelectedProfileImage] = useState<string | null>(null)
  const [selectedChapter, setSelectedChapter] = useState<number>(1)
  const [currentChapterInfo, setCurrentChapterInfo] = useState<{
    id: number
    number: number
    title: string | null
    summary: string | null
  } | null>(null)
  const [quotes, setQuotes] = useState<Array<{ id: number; text: string; character: string }>>([])
  const [gambles, setGambles] = useState<Array<{ id: number; name: string; description?: string }>>([])
  const [loading, setLoading] = useState(false)
  const [progressLoading, setProgressLoading] = useState(false)
  const [dataLoading, setDataLoading] = useState(true)
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
        setSelectedProfileImage(user?.profileImageId || null)
        setSelectedChapter(user?.userProgress || 1)

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
          description: gamble.description
        }))

        setQuotes(formattedQuotes)
        setGambles(formattedGambles)

        // Fetch current chapter information
        if (user?.userProgress) {
          try {
            const chapterInfo = await api.getChapterByNumber(user.userProgress)
            setCurrentChapterInfo(chapterInfo)
          } catch (error) {
            console.error('Failed to fetch chapter info:', error)
            // Set fallback info
            setCurrentChapterInfo({
              id: 0,
              number: user.userProgress,
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
    }
  }, [user])

  const handleSaveProfile = async () => {
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      await api.updateProfile({
        profileImageId: selectedProfileImage || undefined,
        favoriteQuoteId: selectedQuote || undefined,
        favoriteGambleId: selectedGamble || undefined,
      })
      
      await refreshUser()
      setSuccess('Profile updated successfully!')
    } catch (error: unknown) {
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
      await api.updateUserProgress(selectedChapter)
      await refreshUser()
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
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Avatar
            sx={{
              width: 80,
              height: 80,
              mx: 'auto',
              mb: 2,
              bgcolor: 'primary.main',
              fontSize: '2rem'
            }}
          >
            {user.username[0].toUpperCase()}
          </Avatar>
          <Typography variant="h3" component="h1" gutterBottom>
            {user.username}
          </Typography>
          <Typography variant="h6" color="text.secondary">
            {user.role === 'admin' ? 'Administrator' : 
             user.role === 'moderator' ? 'Moderator' : 'Member'}
          </Typography>
        </Box>

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
                    Username
                  </Typography>
                  <Typography variant="body1">
                    {user.username}
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
                    Email Status
                  </Typography>
                  <Chip
                    label={user.isEmailVerified ? 'Verified' : 'Not Verified'}
                    color={user.isEmailVerified ? 'success' : 'warning'}
                    size="small"
                  />
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Role
                  </Typography>
                  <Chip
                    label={user.role}
                    color={user.role === 'admin' ? 'error' : user.role === 'moderator' ? 'warning' : 'default'}
                    variant="outlined"
                    icon={user.role === 'admin' || user.role === 'moderator' ? <Crown size={16} /> : undefined}
                  />
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
                        {user.userProgress}
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
                        {Math.round((user.userProgress / 539) * 100)}%
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
                        Progress Complete
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Box sx={{ textAlign: 'center', p: 2, backgroundColor: 'action.hover', borderRadius: 2 }}>
                      <Typography variant="h3" color="warning.main" gutterBottom>
                        {539 - user.userProgress}
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
                  {progressLoading ? 'Updating...' : dataLoading ? 'Loading...' : 'Update Reading Progress'}
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
                Track your contributions to the Usogui fansite community
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
