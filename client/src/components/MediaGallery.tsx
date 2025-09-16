'use client'

import React, { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress,
  Alert,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  useMediaQuery,
  Link as MuiLink,
  Fade,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip
} from '@mui/material'
import { Image, Play, ExternalLink, X, ZoomIn, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react'
import { useTheme } from '@mui/material/styles'
import NextImage from 'next/image'
import { api } from '../lib/api'

interface MediaItem {
  id: number
  url: string
  type: 'image' | 'video' | 'audio'
  description: string
  fileName?: string
  isUploaded?: boolean
  ownerType: 'character' | 'arc' | 'event' | 'gamble' | 'organization' | 'user'
  ownerId: number
  chapterNumber?: number
  purpose: 'gallery' | 'entity_display'
  submittedBy: {
    id: number
    username: string
  }
  createdAt: string
}

interface MediaGalleryProps {
  ownerType?: 'character' | 'arc' | 'event' | 'gamble' | 'organization' | 'user'
  ownerId?: number
  purpose?: 'gallery' | 'entity_display'
  limit?: number
  showTitle?: boolean
  compactMode?: boolean
  showFilters?: boolean
  allowMultipleTypes?: boolean
  // Legacy support - will be converted to polymorphic
  characterId?: number
  arcId?: number
}

export default function MediaGallery({ 
  ownerType,
  ownerId,
  purpose,
  characterId, 
  arcId, 
  limit = 12, 
  showTitle = true,
  compactMode = false,
  showFilters = false,
  allowMultipleTypes = true
}: MediaGalleryProps) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const [media, setMedia] = useState<MediaItem[]>([])
  const [filteredMedia, setFilteredMedia] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [imageZoomed, setImageZoomed] = useState(false)
  const [videoLoaded, setVideoLoaded] = useState(false)
  const [shouldLoadVideo, setShouldLoadVideo] = useState(false)
  
  // Filter states
  const [selectedMediaType, setSelectedMediaType] = useState<string>('all')
  const [selectedCharacter, setSelectedCharacter] = useState<string>('all')
  const [selectedArc, setSelectedArc] = useState<string>('all')

  useEffect(() => {
    const fetchMedia = async () => {
      try {
        setLoading(true)
        
        // Convert legacy props to polymorphic if needed
        let finalOwnerType = ownerType
        let finalOwnerId = ownerId
        
        // Handle migration from organization to organization
        if (finalOwnerType === 'organization' as any) {
          finalOwnerType = 'organization'
        }
        
        if (!finalOwnerType && !finalOwnerId) {
          if (characterId && !isNaN(characterId) && characterId > 0) {
            finalOwnerType = 'character'
            finalOwnerId = characterId
          } else if (arcId && !isNaN(arcId) && arcId > 0) {
            finalOwnerType = 'arc' 
            finalOwnerId = arcId
          }
        }
        
        // Additional validation for polymorphic props
        if (finalOwnerId && (isNaN(finalOwnerId) || finalOwnerId <= 0)) {
          setError('Invalid entity ID for media')
          return
        }
        
        // Use specific API methods based on purpose
        let response
        if (purpose === 'entity_display' && finalOwnerType && finalOwnerId) {
          response = await api.getEntityDisplayMedia(finalOwnerType, finalOwnerId, {
            page: 1,
            limit
          })
        } else if (purpose === 'gallery' && finalOwnerType && finalOwnerId) {
          response = await api.getGalleryMedia(finalOwnerType, finalOwnerId, {
            page: 1,
            limit
          })
        } else if (finalOwnerType && finalOwnerId) {
          // Default to gallery media for character pages to show only user-submitted content
          response = await api.getGalleryMedia(finalOwnerType, finalOwnerId, {
            page: 1,
            limit
          })
        } else {
          // Fallback to general approved media
          const params = {
            page: 1,
            limit,
            ...(purpose && { purpose })
          }
          response = await api.getApprovedMedia(params)
        }
        
        setMedia(response.data)
        setFilteredMedia(response.data)
      } catch (error: any) {
        console.error('Failed to fetch media:', error)
        setError(error.message || 'Failed to load media')
      } finally {
        setLoading(false)
      }
    }

    fetchMedia()
  }, [ownerType, ownerId, purpose, characterId, arcId, limit])

  // Apply filters when filter states change
  useEffect(() => {
    let filtered = [...media]

    // Filter by media type
    if (selectedMediaType !== 'all') {
      filtered = filtered.filter(item => item.type === selectedMediaType)
    }

    // Note: Owner-specific filtering is now handled by the API call
    // Additional filtering can be added here if needed for specific use cases

    setFilteredMedia(filtered)
  }, [media, selectedMediaType])

  // Since we're now using polymorphic ownership, we don't have separate character/arc objects
  // These could be populated from API calls if needed for filtering
  const availableCharacters: string[] = []
  const availableArcs: string[] = []

  const handleMediaClick = (mediaItem: MediaItem) => {
    const mediaIndex = filteredMedia.findIndex(m => m.id === mediaItem.id)
    setCurrentImageIndex(mediaIndex)
    setSelectedMedia(mediaItem)
    setDialogOpen(true)
    setImageZoomed(false)
    setVideoLoaded(false)
    setShouldLoadVideo(false)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setSelectedMedia(null)
    setImageZoomed(false)
    setVideoLoaded(false)
    setShouldLoadVideo(false)
  }

  const handlePrevious = () => {
    if (currentImageIndex > 0) {
      const newIndex = currentImageIndex - 1
      setCurrentImageIndex(newIndex)
      setSelectedMedia(filteredMedia[newIndex])
      setImageZoomed(false)
      setVideoLoaded(false)
      setShouldLoadVideo(false)
    }
  }

  const handleNext = () => {
    if (currentImageIndex < filteredMedia.length - 1) {
      const newIndex = currentImageIndex + 1
      setCurrentImageIndex(newIndex)
      setSelectedMedia(filteredMedia[newIndex])
      setImageZoomed(false)
      setVideoLoaded(false)
      setShouldLoadVideo(false)
    }
  }

  const handleImageZoom = () => {
    setImageZoomed(!imageZoomed)
  }

  const handleLoadVideo = () => {
    setShouldLoadVideo(true)
  }

  const getMediaThumbnail = (mediaItem: MediaItem) => {
    if (mediaItem.type === 'image') {
      return mediaItem.isUploaded 
        ? `${process.env.NEXT_PUBLIC_API_URL}/media/${mediaItem.fileName}`
        : mediaItem.url
    }
    
    // For videos, try to extract thumbnail from common platforms
    if (mediaItem.type === 'video') {
      if (mediaItem.url.includes('youtube.com') || mediaItem.url.includes('youtu.be')) {
        const videoId = extractYouTubeVideoId(mediaItem.url)
        if (videoId) {
          return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
        }
      }
      // Add other video platform thumbnails as needed
    }
    
    return null
  }

  const extractYouTubeVideoId = (url: string): string | null => {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/
    const match = url.match(regExp)
    return match && match[7].length === 11 ? match[7] : null
  }

  const getYouTubeEmbedUrl = (videoId: string): string => {
    return `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0&modestbranding=1&controls=1&enablejsapi=1&fs=1&cc_load_policy=0&disablekb=0&iv_load_policy=3`
  }

  const getVimeoVideoId = (url: string): string | null => {
    const regExp = /(?:vimeo\.com\/)(?:.*\/)?(\d+)/
    const match = url.match(regExp)
    return match ? match[1] : null
  }

  const getVimeoEmbedUrl = (videoId: string): string => {
    return `https://player.vimeo.com/video/${videoId}?byline=0&portrait=0&color=ffffff&title=0&autoplay=0&controls=1`
  }

  const isDirectVideoUrl = (url: string): boolean => {
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.wmv', '.flv', '.mkv']
    const urlPath = url.toLowerCase()
    return videoExtensions.some(ext => urlPath.includes(ext))
  }

  const canEmbedVideo = (url: string): boolean => {
    return !!(extractYouTubeVideoId(url) || getVimeoVideoId(url) || isDirectVideoUrl(url))
  }

  const getEmbedUrl = (url: string): string | null => {
    const youtubeId = extractYouTubeVideoId(url)
    if (youtubeId) {
      return getYouTubeEmbedUrl(youtubeId)
    }

    const vimeoId = getVimeoVideoId(url)
    if (vimeoId) {
      return getVimeoEmbedUrl(vimeoId)
    }

    return null
  }

  const getMediaTypeIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <Image size={20} />
      case 'video':
        return <Play size={20} />
      default:
        return <ExternalLink size={20} />
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress size={40} />
      </Box>
    )
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    )
  }

  if (media.length === 0) {
    const contextType = ownerType || (characterId ? 'character' : arcId ? 'arc' : 'content')
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h6" gutterBottom color="text.secondary">
          No Media Found
        </Typography>
        <Typography variant="body2" color="text.secondary">
          No approved media has been submitted for this {contextType} yet.
        </Typography>
      </Box>
    )
  }

  return (
    <Box>
      {showTitle && (
        <Typography variant={compactMode ? "h6" : "h5"} gutterBottom sx={{ mb: 3 }}>
          Media Gallery ({filteredMedia.length}{filteredMedia.length !== media.length ? ` of ${media.length}` : ''})
        </Typography>
      )}

      {/* Filter Controls */}
      {showFilters && (
        <Box sx={{ mb: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: 1, borderColor: 'divider' }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <FormControl size="small" fullWidth>
                <InputLabel>Media Type</InputLabel>
                <Select
                  value={selectedMediaType}
                  label="Media Type"
                  onChange={(e) => setSelectedMediaType(e.target.value)}
                >
                  <MenuItem value="all">All Types</MenuItem>
                  <MenuItem value="image">Images</MenuItem>
                  <MenuItem value="video">Videos</MenuItem>
                  <MenuItem value="audio">Audio</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            {/* Additional filters can be added here if needed */}
          </Grid>
        </Box>
      )}
      
      <Grid container spacing={compactMode ? 1 : 2}>
        {filteredMedia.map((mediaItem) => {
          const thumbnail = getMediaThumbnail(mediaItem)
          
          return (
            <Grid item xs={6} sm={4} md={compactMode ? 6 : 3} lg={compactMode ? 4 : 3} key={mediaItem.id}>
              <Card 
                sx={{ 
                  cursor: 'pointer',
                  transition: 'all 0.3s ease-in-out',
                  borderRadius: 2,
                  overflow: 'hidden',
                  '&:hover': {
                    transform: 'translateY(-4px) scale(1.02)',
                    boxShadow: theme.shadows[12],
                    '& .media-overlay': {
                      opacity: 1
                    }
                  }
                }}
                onClick={() => handleMediaClick(mediaItem)}
              >
                <Box 
                  sx={{ 
                    position: 'relative',
                    aspectRatio: '16/9',
                    overflow: 'hidden',
                    bgcolor: 'grey.100',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {thumbnail ? (
                    <NextImage
                      src={thumbnail}
                      alt={mediaItem.description}
                      fill
                      style={{
                        objectFit: 'cover'
                      }}
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                      }}
                    />
                  ) : (
                    <Box sx={{ color: 'text.secondary' }}>
                      {getMediaTypeIcon(mediaItem.type)}
                    </Box>
                  )}
                  
                  {/* Enhanced overlay with play button for videos */}
                  <Box
                    className="media-overlay"
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: mediaItem.type === 'video' 
                        ? 'linear-gradient(135deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.6) 100%)'
                        : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: mediaItem.type === 'video' ? 0 : 1,
                      transition: 'opacity 0.3s ease'
                    }}
                  >
                    {mediaItem.type === 'video' && (
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 56,
                          height: 56,
                          borderRadius: '50%',
                          bgcolor: 'rgba(255,255,255,0.9)',
                          color: 'primary.main',
                          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                          backdropFilter: 'blur(10px)',
                          border: '2px solid rgba(255,255,255,0.2)'
                        }}
                      >
                        <Play size={24} fill="currentColor" />
                      </Box>
                    )}
                  </Box>

                  {/* Media type indicator */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      bgcolor: 'rgba(0,0,0,0.8)',
                      color: 'white',
                      borderRadius: 1.5,
                      px: 1,
                      py: 0.5,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255,255,255,0.1)'
                    }}
                  >
                    {getMediaTypeIcon(mediaItem.type)}
                    <Typography variant="caption" sx={{ 
                      fontSize: '0.7rem', 
                      fontWeight: 600, 
                      textTransform: 'uppercase',
                      letterSpacing: 0.5
                    }}>
                      {mediaItem.type}
                    </Typography>
                  </Box>

                  {/* Owner type indicator */}
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 8,
                      left: 8,
                      right: 8,
                      display: 'flex',
                      gap: 0.5,
                      flexWrap: 'wrap',
                      justifyContent: 'flex-start'
                    }}
                  >
                    <Chip
                      label={`${mediaItem.ownerType} ${mediaItem.ownerId}`}
                      size="small"
                      color="primary"
                      variant="filled"
                      sx={{
                        fontSize: '0.7rem',
                        height: '22px',
                        backgroundColor: 'rgba(25, 118, 210, 0.95)',
                        color: 'white',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        fontWeight: 600,
                        textTransform: 'capitalize'
                      }}
                    />
                    {mediaItem.purpose === 'entity_display' && (
                      <Chip
                        label="Official"
                        size="small"
                        color="secondary"
                        variant="filled"
                        sx={{
                          fontSize: '0.7rem',
                          height: '22px',
                          backgroundColor: 'rgba(156, 39, 176, 0.95)',
                          color: 'white',
                          backdropFilter: 'blur(10px)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          fontWeight: 600
                        }}
                      />
                    )}
                  </Box>
                </Box>
                
                {!compactMode && (
                  <CardContent sx={{ p: 2 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        mb: 1,
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        lineHeight: 1.4
                      }}
                    >
                      {mediaItem.description || 'No description available'}
                    </Typography>
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      mt: 1
                    }}>
                      <Typography variant="caption" color="text.secondary" sx={{
                        fontSize: '0.75rem',
                        fontWeight: 500
                      }}>
                        By {mediaItem.submittedBy.username}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{
                        fontSize: '0.7rem',
                        opacity: 0.7
                      }}>
                        {new Date(mediaItem.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </Typography>
                    </Box>
                  </CardContent>
                )}
              </Card>
            </Grid>
          )
        })}
      </Grid>

      {/* Enhanced Media Viewer Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={handleCloseDialog}
        maxWidth="lg"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            ...(selectedMedia?.type === 'image' && imageZoomed && {
              maxWidth: '95vw',
              maxHeight: '95vh'
            })
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          pb: 1,
          bgcolor: 'background.paper',
          borderBottom: 1,
          borderColor: 'divider'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h6">
              {selectedMedia?.type === 'image' ? 'Image' : 
               selectedMedia?.type === 'video' ? 'Video' : 'Media'} Viewer
            </Typography>
            {filteredMedia.length > 1 && (
              <Typography variant="body2" color="text.secondary">
                {currentImageIndex + 1} of {filteredMedia.length}
              </Typography>
            )}
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Navigation buttons */}
            {filteredMedia.length > 1 && (
              <>
                <IconButton 
                  onClick={handlePrevious} 
                  disabled={currentImageIndex === 0}
                  size="small"
                  title="Previous"
                >
                  <ChevronLeft size={20} />
                </IconButton>
                <IconButton 
                  onClick={handleNext} 
                  disabled={currentImageIndex === filteredMedia.length - 1}
                  size="small"
                  title="Next"
                >
                  <ChevronRight size={20} />
                </IconButton>
              </>
            )}
            
            {/* Zoom button for images */}
            {selectedMedia?.type === 'image' && (
              <IconButton 
                onClick={handleImageZoom} 
                size="small"
                title={imageZoomed ? "Zoom out" : "Zoom in"}
              >
                {imageZoomed ? <Maximize2 size={20} /> : <ZoomIn size={20} />}
              </IconButton>
            )}
            
            <IconButton onClick={handleCloseDialog} size="small" title="Close">
              <X size={20} />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ p: 0 }}>
          {selectedMedia && (
            <Box>
              {/* Media Content */}
              <Box sx={{ 
                position: 'relative',
                minHeight: imageZoomed ? '80vh' : '60vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'grey.900'
              }}>
                {selectedMedia.type === 'image' ? (
                  <Fade in={true} timeout={300}>
                    <Box 
                      sx={{ 
                        position: 'relative',
                        maxWidth: '100%',
                        maxHeight: '100%',
                        cursor: imageZoomed ? 'zoom-out' : 'zoom-in'
                      }}
                      onClick={handleImageZoom}
                    >
                      <img
                        src={selectedMedia.isUploaded 
                          ? `${process.env.NEXT_PUBLIC_API_URL}/media/${selectedMedia.fileName}`
                          : selectedMedia.url
                        }
                        alt={selectedMedia.description}
                        style={{
                          maxWidth: imageZoomed ? 'none' : '100%',
                          maxHeight: imageZoomed ? 'none' : '80vh',
                          width: imageZoomed ? 'auto' : '100%',
                          height: imageZoomed ? 'auto' : 'auto',
                          objectFit: imageZoomed ? 'none' : 'contain',
                          transition: 'all 0.3s ease-in-out'
                        }}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.style.display = 'none'
                        }}
                      />
                    </Box>
                  </Fade>
                ) : selectedMedia.type === 'video' ? (
                  <Box sx={{ 
                    width: '100%', 
                    minHeight: '60vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'black'
                  }}>
                    <Box sx={{ width: '100%', maxWidth: '100%' }}>
                      {canEmbedVideo(selectedMedia.url) ? (
                        <Box sx={{ 
                          width: '100%', 
                          aspectRatio: '16/9',
                          minHeight: '400px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          {isDirectVideoUrl(selectedMedia.url) ? (
                            <Fade in={true} timeout={500}>
                              <video
                                controls
                                preload="metadata"
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  maxHeight: '70vh',
                                  objectFit: 'contain',
                                  backgroundColor: 'black'
                                }}
                                onLoadStart={() => setVideoLoaded(true)}
                              >
                                <source src={selectedMedia.url} />
                                Your browser does not support the video tag.
                              </video>
                            </Fade>
                          ) : !shouldLoadVideo ? (
                            <Box sx={{ 
                              textAlign: 'center',
                              p: 4,
                              bgcolor: 'rgba(0,0,0,0.9)',
                              borderRadius: 2,
                              color: 'white',
                              border: '2px solid rgba(255,255,255,0.1)'
                            }}>
                              <Box sx={{ mb: 3, position: 'relative', width: '320px', height: '180px', mx: 'auto' }}>
                                {getMediaThumbnail(selectedMedia) && (
                                  <NextImage
                                    src={getMediaThumbnail(selectedMedia)!}
                                    alt="Video thumbnail"
                                    fill
                                    style={{
                                      objectFit: 'cover',
                                      borderRadius: '12px',
                                      boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
                                    }}
                                    sizes="320px"
                                  />
                                )}
                              </Box>
                              <Button
                                variant="contained"
                                size="large"
                                startIcon={<Play size={24} />}
                                onClick={handleLoadVideo}
                                sx={{
                                  bgcolor: 'primary.main',
                                  color: 'white',
                                  px: 4,
                                  py: 1.5,
                                  fontSize: '1.1rem',
                                  fontWeight: 600,
                                  borderRadius: '12px',
                                  boxShadow: '0 4px 20px rgba(25, 118, 210, 0.4)',
                                  '&:hover': {
                                    bgcolor: 'primary.dark',
                                    transform: 'translateY(-2px)',
                                    boxShadow: '0 6px 24px rgba(25, 118, 210, 0.5)'
                                  }
                                }}
                              >
                                Play Video
                              </Button>
                              <Typography variant="body2" sx={{ mt: 2, opacity: 0.7 }}>
                                Click to load the video player with full controls
                              </Typography>
                            </Box>
                          ) : (
                            <Fade in={shouldLoadVideo} timeout={500}>
                              <iframe
                                src={getEmbedUrl(selectedMedia.url)!}
                                width="100%"
                                height="100%"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                                allowFullScreen
                                title={selectedMedia.description}
                                onLoad={() => setVideoLoaded(true)}
                                style={{
                                  minHeight: '400px',
                                  borderRadius: '8px'
                                }}
                              />
                            </Fade>
                          )}
                        </Box>
                      ) : (
                        <Box sx={{ 
                          textAlign: 'center',
                          p: 4,
                          bgcolor: 'rgba(0,0,0,0.8)',
                          borderRadius: 2,
                          color: 'white'
                        }}>
                          <Typography variant="h6" gutterBottom>
                            External Video
                          </Typography>
                          <Typography variant="body2" paragraph>
                            This video is hosted externally and cannot be embedded.
                          </Typography>
                          <Button
                            variant="contained"
                            href={selectedMedia.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            startIcon={<ExternalLink />}
                          >
                            Open in New Tab
                          </Button>
                        </Box>
                      )}
                    </Box>
                  </Box>
                ) : (
                  <Box sx={{ 
                    textAlign: 'center',
                    p: 4,
                    bgcolor: 'background.paper'
                  }}>
                    <ExternalLink size={48} color={theme.palette.text.secondary} />
                    <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                      External Media
                    </Typography>
                    <Button
                      variant="contained"
                      href={selectedMedia.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      startIcon={<ExternalLink />}
                      sx={{ mt: 2 }}
                    >
                      Open Media
                    </Button>
                  </Box>
                )}
              </Box>

              {/* Media Info Panel */}
              <Box sx={{ p: 3, bgcolor: 'background.paper' }}>
                <Typography variant="h6" gutterBottom>
                  {selectedMedia.description || 'No title'}
                </Typography>
                
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>By:</strong> {selectedMedia.submittedBy.username}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary">
                    <strong>Added:</strong> {new Date(selectedMedia.createdAt).toLocaleDateString()}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary">
                    <strong>Owner:</strong> {selectedMedia.ownerType} {selectedMedia.ownerId}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary">
                    <strong>Purpose:</strong> {selectedMedia.purpose.replace('_', ' ')}
                  </Typography>
                  
                  {selectedMedia.chapterNumber && (
                    <Typography variant="body2" color="text.secondary">
                      <strong>Chapter:</strong> {selectedMedia.chapterNumber}
                    </Typography>
                  )}
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  )
}

