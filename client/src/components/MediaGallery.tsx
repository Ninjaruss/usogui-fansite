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
  Skeleton
} from '@mui/material'
import { Image, Play, ExternalLink, X, ZoomIn, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react'
import { useTheme } from '@mui/material/styles'
import { api } from '../lib/api'

interface MediaItem {
  id: number
  url: string
  type: 'image' | 'video' | 'audio'
  description: string
  fileName?: string
  isUploaded?: boolean
  character?: {
    id: number
    name: string
  }
  arc?: {
    id: number
    name: string
  }
  submittedBy: {
    id: number
    username: string
  }
  createdAt: string
}

interface MediaGalleryProps {
  characterId?: number
  arcId?: number
  limit?: number
  showTitle?: boolean
  compactMode?: boolean
}

export default function MediaGallery({ 
  characterId, 
  arcId, 
  limit = 12, 
  showTitle = true,
  compactMode = false 
}: MediaGalleryProps) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const [media, setMedia] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [imageZoomed, setImageZoomed] = useState(false)
  const [videoLoaded, setVideoLoaded] = useState(false)
  const [shouldLoadVideo, setShouldLoadVideo] = useState(false)

  useEffect(() => {
    const fetchMedia = async () => {
      try {
        setLoading(true)
        
        // Use the public media endpoint with filtering
        const params = {
          page: 1,
          limit,
          ...(characterId && { characterId }),
          ...(arcId && { arcId })
        }
        
        const response = await api.getApprovedMedia(params)
        
        setMedia(response.data)
      } catch (error: any) {
        console.error('Failed to fetch media:', error)
        setError(error.message || 'Failed to load media')
      } finally {
        setLoading(false)
      }
    }

    if (characterId || arcId) {
      fetchMedia()
    }
  }, [characterId, arcId, limit])

  const handleMediaClick = (mediaItem: MediaItem) => {
    const mediaIndex = media.findIndex(m => m.id === mediaItem.id)
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
      setSelectedMedia(media[newIndex])
      setImageZoomed(false)
      setVideoLoaded(false)
      setShouldLoadVideo(false)
    }
  }

  const handleNext = () => {
    if (currentImageIndex < media.length - 1) {
      const newIndex = currentImageIndex + 1
      setCurrentImageIndex(newIndex)
      setSelectedMedia(media[newIndex])
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
    return `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0&modestbranding=1`
  }

  const getVimeoVideoId = (url: string): string | null => {
    const regExp = /(?:vimeo\.com\/)(?:.*\/)?(\d+)/
    const match = url.match(regExp)
    return match ? match[1] : null
  }

  const getVimeoEmbedUrl = (videoId: string): string => {
    return `https://player.vimeo.com/video/${videoId}?byline=0&portrait=0`
  }

  const canEmbedVideo = (url: string): boolean => {
    return !!(extractYouTubeVideoId(url) || getVimeoVideoId(url))
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
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body2" color="text.secondary">
          No approved media found for this {characterId ? 'character' : 'arc'}.
        </Typography>
      </Box>
    )
  }

  return (
    <Box>
      {showTitle && (
        <Typography variant={compactMode ? "h6" : "h5"} gutterBottom sx={{ mb: 3 }}>
          Media Gallery ({media.length})
        </Typography>
      )}
      
      <Grid container spacing={compactMode ? 1 : 2}>
        {media.map((mediaItem) => {
          const thumbnail = getMediaThumbnail(mediaItem)
          
          return (
            <Grid item xs={6} sm={4} md={compactMode ? 6 : 3} key={mediaItem.id}>
              <Card 
                sx={{ 
                  cursor: 'pointer',
                  transition: 'transform 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: theme.shadows[8]
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
                    <img
                      src={thumbnail}
                      alt={mediaItem.description}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
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
                  
                  {/* Media type indicator */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      bgcolor: 'rgba(0,0,0,0.7)',
                      color: 'white',
                      borderRadius: 1,
                      p: 0.5,
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    {getMediaTypeIcon(mediaItem.type)}
                  </Box>
                </Box>
                
                {!compactMode && (
                  <CardContent sx={{ p: 1.5 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        mb: 0.5,
                        fontSize: '0.875rem'
                      }}
                    >
                      {mediaItem.description || 'No description'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      By {mediaItem.submittedBy.username}
                    </Typography>
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
            {media.length > 1 && (
              <Typography variant="body2" color="text.secondary">
                {currentImageIndex + 1} of {media.length}
              </Typography>
            )}
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Navigation buttons */}
            {media.length > 1 && (
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
                  disabled={currentImageIndex === media.length - 1}
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
                    {!shouldLoadVideo ? (
                      <Box sx={{ 
                        textAlign: 'center',
                        p: 4,
                        bgcolor: 'rgba(0,0,0,0.8)',
                        borderRadius: 2,
                        color: 'white'
                      }}>
                        <Box sx={{ mb: 2 }}>
                          {getMediaThumbnail(selectedMedia) && (
                            <img
                              src={getMediaThumbnail(selectedMedia)!}
                              alt="Video thumbnail"
                              style={{
                                maxWidth: '300px',
                                maxHeight: '200px',
                                objectFit: 'cover',
                                borderRadius: '8px'
                              }}
                            />
                          )}
                        </Box>
                        <Button
                          variant="contained"
                          size="large"
                          startIcon={<Play />}
                          onClick={handleLoadVideo}
                          sx={{
                            bgcolor: 'primary.main',
                            '&:hover': {
                              bgcolor: 'primary.dark'
                            }
                          }}
                        >
                          Load and Play Video
                        </Button>
                        <Typography variant="body2" sx={{ mt: 2, opacity: 0.8 }}>
                          Click to load the video player
                        </Typography>
                      </Box>
                    ) : (
                      <Box sx={{ width: '100%', aspectRatio: '16/9' }}>
                        {canEmbedVideo(selectedMedia.url) ? (
                          <Fade in={shouldLoadVideo} timeout={500}>
                            <iframe
                              src={getEmbedUrl(selectedMedia.url)!}
                              width="100%"
                              height="100%"
                              frameBorder="0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                              title={selectedMedia.description}
                              onLoad={() => setVideoLoaded(true)}
                              style={{
                                minHeight: '400px'
                              }}
                            />
                          </Fade>
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
                    )}
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
                  
                  {selectedMedia.character && (
                    <Typography variant="body2" color="text.secondary">
                      <strong>Character:</strong> {selectedMedia.character.name}
                    </Typography>
                  )}
                  
                  {selectedMedia.arc && (
                    <Typography variant="body2" color="text.secondary">
                      <strong>Arc:</strong> {selectedMedia.arc.name}
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