'use client'

import React, { useState, useEffect } from 'react'
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Grid,
  Tabs,
  Tab
} from '@mui/material'
import { Upload, Link as LinkIcon, Image, Video, Music } from 'lucide-react'
import { useTheme } from '@mui/material/styles'
import { useAuth } from '../../providers/AuthProvider'
import { api } from '../../lib/api'
import { motion } from 'motion/react'
import MediaUploadForm from '../../components/MediaUploadForm'

interface Character {
  id: number
  name: string
}

interface Arc {
  id: number
  name: string
}

interface Event {
  id: number
  title: string
}

interface Gamble {
  id: number
  name: string
}

interface Organization {
  id: number
  name: string
}

type MediaOwnerType = 'character' | 'arc' | 'event' | 'gamble' | 'organization' | 'user'

export default function SubmitMediaPageContent() {
  const { user, loading: authLoading } = useAuth()
  const theme = useTheme()
  const [formData, setFormData] = useState({
    url: '',
    description: '',
    ownerType: '' as MediaOwnerType | '',
    ownerId: null as number | null,
    chapterNumber: null as number | null,
  })
  const [characters, setCharacters] = useState<Character[]>([])
  const [arcs, setArcs] = useState<Arc[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [gambles, setGambles] = useState<Gamble[]>([])
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [users, setUsers] = useState<{id: number, username: string}[]>([])
  const [loading, setLoading] = useState(false)
  const [dataLoading, setDataLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [activeTab, setActiveTab] = useState(0)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setDataLoading(true)
        const [charactersResponse, arcsResponse, eventsResponse, gamblesResponse, organizationsResponse, usersResponse] = await Promise.all([
          api.getCharacters({ limit: 500 }),
          api.getArcs({ limit: 200 }),
          api.getEvents({ limit: 200 }),
          api.getGambles({ limit: 500 }),
          api.getOrganizations({ limit: 100 }),
          api.getPublicUsers({ limit: 200 })
        ])
        setCharacters(charactersResponse.data || [])
        setArcs(arcsResponse.data || [])
        setEvents(eventsResponse.data || [])
        setGambles(gamblesResponse.data || [])
        setOrganizations(organizationsResponse.data || [])
        setUsers(usersResponse.data || [])
      } catch (error) {
        console.error('Failed to fetch data:', error)
        setError('Failed to load form data. Please refresh the page.')
      } finally {
        setDataLoading(false)
      }
    }

    if (user) {
      fetchData()
    }
  }, [user])

  const handleInputChange = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const validateForm = () => {
    if (!formData.url.trim()) {
      return 'Media URL is required'
    }

    if (!isValidUrl(formData.url)) {
      return 'Please enter a valid URL'
    }

    if (!formData.ownerType) {
      return 'Please select an entity type'
    }

    if (!formData.ownerId) {
      return 'Please select a specific entity'
    }

    return null
  }

  const isValidUrl = (url: string) => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setSuccess('')

    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)

    try {
      const mediaType = getMediaType(formData.url)
      
      await api.submitMediaPolymorphic({
        url: formData.url.trim(),
        type: mediaType,
        ownerType: formData.ownerType as MediaOwnerType,
        ownerId: formData.ownerId!,
        chapterNumber: formData.chapterNumber || undefined,
        description: formData.description.trim() || undefined
      })
      
      setSuccess('Media submitted successfully! It will be reviewed by moderators before appearing on the site.')
      setFormData({
        url: '',
        description: '',
        ownerType: '',
        ownerId: null,
        chapterNumber: null,
      })
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Failed to submit media. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (file: File, uploadData: {
    type: 'image' | 'video' | 'audio'
    description?: string
    ownerType: 'character' | 'arc' | 'event' | 'gamble' | 'organization' | 'user'
    ownerId: number
    chapterNumber?: number
    purpose?: 'gallery' | 'entity_display'
  }) => {
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      await api.uploadMedia(file, uploadData)
      setSuccess('Media uploaded successfully! It has been automatically approved.')
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Failed to upload media. Please try again.')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const getMediaType = (url: string): 'image' | 'video' | 'audio' => {
    const lowerUrl = url.toLowerCase()
    
    // Video platforms
    if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be') || 
        lowerUrl.includes('tiktok.com') || lowerUrl.includes('vm.tiktok.com') ||
        lowerUrl.includes('vimeo.com') || lowerUrl.includes('twitch.tv')) {
      return 'video'
    }
    
    // Audio platforms
    if (lowerUrl.includes('soundcloud.com') || lowerUrl.includes('spotify.com') ||
        lowerUrl.includes('apple.com/music')) {
      return 'audio'
    }
    
    // Image platforms and social media
    if (lowerUrl.includes('twitter.com') || lowerUrl.includes('x.com') || 
        lowerUrl.includes('instagram.com') || lowerUrl.includes('deviantart.com') ||
        lowerUrl.includes('pixiv.net') || lowerUrl.includes('imgur.com') ||
        lowerUrl.includes('artstation.com') || lowerUrl.includes('pinterest.com')) {
      return 'image'
    }
    
    // File extensions
    if (lowerUrl.match(/\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i)) {
      return 'image'
    }
    if (lowerUrl.match(/\.(mp4|mov|avi|webm|mkv|flv)(\?|$)/i)) {
      return 'video'
    }
    if (lowerUrl.match(/\.(mp3|wav|ogg|flac|aac|m4a)(\?|$)/i)) {
      return 'audio'
    }
    
    // Default to image for most cases
    return 'image'
  }

  const getMediaTypeIcon = (url: string) => {
    const type = getMediaType(url)
    switch (type) {
      case 'video': return <Video size={20} />
      case 'audio': return <Music size={20} />
      case 'image': return <Image size={20} />
      default: return <LinkIcon size={20} />
    }
  }

  const getEntityOptions = () => {
    switch (formData.ownerType) {
      case 'character':
        return characters.map(item => ({ id: item.id, name: item.name }))
      case 'arc':
        return arcs.map(item => ({ id: item.id, name: item.name }))
      case 'event':
        return events.map(item => ({ id: item.id, name: item.title }))
      case 'gamble':
        return gambles.map(item => ({ id: item.id, name: item.name }))
      case 'organization':
        return organizations.map((item: Organization) => ({ id: item.id, name: item.name }))
      case 'user':
        return users.map(item => ({ id: item.id, name: item.username }))
      default:
        return []
    }
  }

  if (authLoading) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <CircularProgress size={50} />
        </Box>
      </Container>
    )
  }

  if (!user) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Alert severity="warning">
          Please log in to submit media.
        </Alert>
      </Container>
    )
  }

  const isFormValid = !validateForm()

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <Upload size={48} color={theme.palette.info.main} />
          </Box>
          <Typography variant="h3" component="h1" gutterBottom>
            Submit Media
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Share fanart, videos, audio, or other media from YouTube, TikTok, Instagram, Pixiv, DeviantArt, Imgur, SoundCloud, and more
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

        <Card className="gambling-card">
          <CardContent>
            {/* Tabs for moderators/admins */}
            {(user.role === 'moderator' || user.role === 'admin') && (
              <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
                  <Tab label="Submit URL" />
                  <Tab label="Upload File" />
                </Tabs>
              </Box>
            )}

            {/* URL Submission Form */}
            {activeTab === 0 && (
              <form onSubmit={handleSubmit}>
                <Grid container spacing={3}>
                  {/* Media URL */}
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Media URL"
                      placeholder="https://..."
                      value={formData.url}
                      onChange={(e) => handleInputChange('url', e.target.value)}
                      required
                      error={formData.url.length > 0 && !isValidUrl(formData.url)}
                      helperText={
                        formData.url.length > 0 && !isValidUrl(formData.url)
                          ? 'Please enter a valid URL'
                          : 'Link to fanart, video, or other media (YouTube, TikTok, Instagram, Twitter, DeviantArt, Pixiv, Imgur, SoundCloud, direct links, etc.)'
                      }
                      InputProps={{
                        startAdornment: (
                          <Box sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                            {formData.url ? getMediaTypeIcon(formData.url) : <LinkIcon size={20} />}
                          </Box>
                        )
                      }}
                    />
                  </Grid>

                  {/* Entity Selection */}
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth disabled={dataLoading} required>
                      <InputLabel>Related Entity *</InputLabel>
                      <Select
                        value={formData.ownerType}
                        label="Related Entity *"
                        onChange={(e) => {
                          handleInputChange('ownerType', e.target.value)
                          handleInputChange('ownerId', null)
                        }}
                      >
                        <MenuItem value="">
                          <em>Select entity type...</em>
                        </MenuItem>
                        <MenuItem value="character">Character</MenuItem>
                        <MenuItem value="arc">Arc</MenuItem>
                        <MenuItem value="event">Event</MenuItem>
                        <MenuItem value="gamble">Gamble</MenuItem>
                        <MenuItem value="organization">Organization</MenuItem>
                        <MenuItem value="user">User</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth disabled={dataLoading || !formData.ownerType} required>
                      <InputLabel>Specific Entity *</InputLabel>
                      <Select
                        value={formData.ownerId || ''}
                        label="Specific Entity *"
                        onChange={(e) => handleInputChange('ownerId', e.target.value || null)}
                      >
                        <MenuItem value="">
                          <em>{!formData.ownerType ? 'Select entity type first' : `Choose ${formData.ownerType}...`}</em>
                        </MenuItem>
                        {dataLoading ? (
                          <MenuItem value="" disabled>
                            Loading...
                          </MenuItem>
                        ) : (
                          getEntityOptions().map((entity) => (
                            <MenuItem key={entity.id} value={entity.id}>
                              {entity.name}
                            </MenuItem>
                          ))
                        )}
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* Optional Chapter Number */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Chapter Number (Optional)"
                      placeholder="e.g., 45"
                      value={formData.chapterNumber || ''}
                      onChange={(e) => handleInputChange('chapterNumber', e.target.value ? parseInt(e.target.value) : null)}
                      helperText="Associate with a specific chapter if relevant"
                      inputProps={{ min: 1 }}
                    />
                  </Grid>

                  {/* Description */}
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      label="Description (Optional)"
                      placeholder="Describe this media, credit the artist if known, or provide context..."
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      helperText="Please provide credit to the original artist if known"
                    />
                  </Grid>

                  {/* Submit Button */}
                  <Grid item xs={12}>
                    <Button
                      type="submit"
                      variant="contained"
                      size="large"
                      fullWidth
                      disabled={loading || !isFormValid}
                      startIcon={loading ? <CircularProgress size={20} /> : <Upload size={20} />}
                    >
                      {loading ? 'Submitting...' : 'Submit Media'}
                    </Button>
                  </Grid>
                </Grid>
              </form>
            )}

            {/* File Upload Form (Moderators/Admins only) */}
            {activeTab === 1 && (user.role === 'moderator' || user.role === 'admin') && (
              <Box>
                <Alert severity="info" sx={{ mb: 3 }}>
                  <Typography variant="body2">
                    <strong>Direct Upload (Moderators/Admins)</strong>
                    <br />• Files are automatically approved
                    <br />• Uploaded to Backblaze B2 storage
                    <br />• Supports JPEG, PNG, WebP, GIF (max 10MB)
                  </Typography>
                </Alert>
                <MediaUploadForm
                  onUpload={handleUpload}
                  characters={characters}
                  arcs={arcs}
                  events={events}
                  gambles={gambles}
                  organizations={organizations}
                  users={users}
                  loading={loading}
                  dataLoading={dataLoading}
                  error={error}
                />
              </Box>
            )}
          </CardContent>
        </Card>

        <Box sx={{ mt: 4 }}>
          <Alert severity="info">
            <Typography variant="body2">
              <strong>Submission Guidelines:</strong>
              <br />• Only submit media you have permission to share
              <br />• Always credit the original artist when possible
              <br />• Media will be reviewed by moderators before appearing on the site
              <br />• Inappropriate or copyrighted content will be removed
              <br />• Supported platforms: YouTube, TikTok, Instagram, Twitter/X, DeviantArt, Pixiv, Imgur, SoundCloud, and direct file links
            </Typography>
          </Alert>
        </Box>
      </motion.div>
    </Container>
  )
}
