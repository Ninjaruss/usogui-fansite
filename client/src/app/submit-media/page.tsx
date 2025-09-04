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

export default function SubmitMediaPage() {
  const { user, loading: authLoading } = useAuth()
  const theme = useTheme()
  const [formData, setFormData] = useState({
    url: '',
    characterId: null as number | null,
    arcId: null as number | null,
    description: ''
  })
  const [characters, setCharacters] = useState<Character[]>([])
  const [arcs, setArcs] = useState<Arc[]>([])
  const [loading, setLoading] = useState(false)
  const [dataLoading, setDataLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [activeTab, setActiveTab] = useState(0)
  // const [urlPreview, setUrlPreview] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        setDataLoading(true)
        const [charactersResponse, arcsResponse] = await Promise.all([
          api.getCharacters({ limit: 100 }),
          api.getArcs({ limit: 100 })
        ])
        setCharacters(charactersResponse.data)
        setArcs(arcsResponse.data)
      } catch (error) {
        console.error('Failed to fetch data:', error)
      } finally {
        setDataLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleInputChange = (field: string, value: string | number | null) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))

    // if (field === 'url') {
    //   setUrlPreview(value)
    // }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const mediaType = getMediaType(formData.url)
      await api.submitMedia({
        url: formData.url,
        type: mediaType,
        characterId: formData.characterId || undefined,
        arcId: formData.arcId || undefined,
        description: formData.description
      })
      setSuccess('Media submitted successfully! It will be reviewed by moderators.')
      setFormData({
        url: '',
        characterId: null,
        arcId: null,
        description: ''
      })
      // setUrlPreview('')
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Failed to submit media')
    } finally {
      setLoading(false)
    }
  }
  const handleUpload = async (file: File, uploadData: {
    type: 'image' | 'video' | 'audio'
    description?: string
    characterId?: number
    arcId?: number
    eventId?: number
  }) => {
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      await api.uploadMedia(file, uploadData)
      setSuccess('Media uploaded successfully! It has been automatically approved.')
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Failed to upload media')
      throw error // Re-throw to handle in the upload form
    } finally {
      setLoading(false)
    }
  }

  const getMediaType = (url: string): 'image' | 'video' | 'audio' => {
    if (url.includes('youtube.com') || url.includes('youtu.be') || 
        url.includes('tiktok.com') || url.includes('vm.tiktok.com')) {
      return 'video'
    }
    if (url.includes('soundcloud.com')) {
      return 'audio'
    }
    if (url.includes('twitter.com') || url.includes('x.com') || 
        url.includes('instagram.com') || url.includes('deviantart.com') ||
        url.includes('pixiv.net') || url.includes('imgur.com')) {
      return 'image'
    }
    if (url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
      return 'image'
    }
    if (url.match(/\.(mp4|mov|avi|webm)$/i)) {
      return 'video'
    }
    if (url.match(/\.(mp3|wav|ogg|flac)$/i)) {
      return 'audio'
    }
    // Default to image for most social media and art platforms
    return 'image'
  }

  const getMediaTypeForIcon = (url: string) => {
    const type = getMediaType(url)
    if (type === 'video') return 'video'
    if (type === 'audio') return 'audio'
    if (type === 'image') return 'image'
    return 'link'
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
            {/* Show tabs for moderators/admins */}
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
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Media URL"
                      placeholder="https://..."
                      value={formData.url}
                      onChange={(e) => handleInputChange('url', e.target.value)}
                      required
                      helperText="Link to fanart, video, or other media (YouTube, TikTok, Instagram, Twitter, DeviantArt, Pixiv, Imgur, SoundCloud, direct links, etc.)"
                      InputProps={{
                        startAdornment: (
                          <Box sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                            {getMediaTypeForIcon(formData.url) === 'video' ? (
                              <Video size={20} />
                            ) : getMediaTypeForIcon(formData.url) === 'audio' ? (
                              <Music size={20} />
                            ) : getMediaTypeForIcon(formData.url) === 'image' ? (
                              <Image size={20} />
                            ) : (
                              <LinkIcon size={20} />
                            )}
                          </Box>
                        )
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth disabled={dataLoading}>
                      <InputLabel>Related Character (Optional)</InputLabel>
                      <Select
                        value={formData.characterId || ''}
                        label="Related Character (Optional)"
                        onChange={(e) => handleInputChange('characterId', e.target.value || null)}
                      >
                        <MenuItem value="">
                          <em>None</em>
                        </MenuItem>
                        {dataLoading ? (
                          <MenuItem value="" disabled>
                            Loading characters...
                          </MenuItem>
                        ) : (
                          characters.map((character) => (
                            <MenuItem key={character.id} value={character.id}>
                              {character.name}
                            </MenuItem>
                          ))
                        )}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth disabled={dataLoading}>
                      <InputLabel>Related Arc (Optional)</InputLabel>
                      <Select
                        value={formData.arcId || ''}
                        label="Related Arc (Optional)"
                        onChange={(e) => handleInputChange('arcId', e.target.value || null)}
                      >
                        <MenuItem value="">
                          <em>None</em>
                        </MenuItem>
                        {dataLoading ? (
                          <MenuItem value="" disabled>
                            Loading arcs...
                          </MenuItem>
                        ) : (
                          arcs.map((arc) => (
                            <MenuItem key={arc.id} value={arc.id}>
                              {arc.name}
                            </MenuItem>
                          ))
                        )}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      label="Description"
                      placeholder="Describe this media, credit the artist if known, or provide context..."
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      helperText="Please provide credit to the original artist if known"
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Button
                      type="submit"
                      variant="contained"
                      size="large"
                      fullWidth
                      disabled={loading || !formData.url}
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
            </Typography>
          </Alert>
        </Box>
      </motion.div>
    </Container>
  )
}