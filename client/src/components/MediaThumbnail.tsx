'use client'

import React, { useState, useEffect } from 'react'
import { Box, IconButton, Typography, CircularProgress, Tooltip, useTheme } from '@mui/material'
import { ChevronLeft, ChevronRight, Image as ImageIcon, AlertTriangle } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { useProgress } from '../providers/ProgressProvider'
import { useSpoilerSettings } from '../hooks/useSpoilerSettings'
import { api } from '../lib/api'

interface MediaItem {
  id: number
  url: string
  type: 'image' | 'video' | 'audio'
  description?: string
  chapterNumber?: number
  isSpoiler?: boolean
}

interface MediaThumbnailProps {
  entityType: 'character' | 'arc' | 'gamble' | 'faction' | 'volume'
  entityId: number
  entityName?: string
  className?: string
  allowCycling?: boolean
  showGallery?: boolean
  maxWidth?: string | number
  maxHeight?: string | number
}

export default function MediaThumbnail({
  entityType,
  entityId,
  entityName,
  className,
  allowCycling = true,
  showGallery = false,
  maxWidth = 300,
  maxHeight = 300,
}: MediaThumbnailProps) {
  const [currentThumbnail, setCurrentThumbnail] = useState<MediaItem | null>(null)
  const [allEntityMedia, setAllEntityMedia] = useState<MediaItem[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const { userProgress } = useProgress()
  const theme = useTheme()

  // Fetch current thumbnail using polymorphic media API
  const fetchCurrentThumbnail = async () => {
    try {
      const thumbnail = await api.getThumbnailForUserProgress(
        entityType,
        entityId,
        userProgress
      )
      setCurrentThumbnail(thumbnail)
    } catch (err) {
      console.error(`Error fetching ${entityType} thumbnail:`, err)
      setCurrentThumbnail(null)
    }
  }


  useEffect(() => {
    const loadMedia = async () => {
      setLoading(true)
      setError(null)
      
      // Load entity display media first
      try {
        const response = await api.getEntityDisplayMediaForCycling(
          entityType,
          entityId,
          userProgress
        )
        const mediaArray = response?.data || []
        setAllEntityMedia(mediaArray)
        
        // If we have entity display media, start with closest chapter that meets user progress
        if (mediaArray && mediaArray.length > 0) {
          // Find the latest chapter that the user has reached (chapter <= userProgress)
          let startIndex = 0
          for (let i = mediaArray.length - 1; i >= 0; i--) {
            const media = mediaArray[i]
            if (!media.chapterNumber || media.chapterNumber <= userProgress) {
              startIndex = i
              break
            }
          }
          
          setCurrentIndex(startIndex)
          setCurrentThumbnail(mediaArray[startIndex])
        } else {
          // Fallback to fetching current thumbnail if no entity display media
          await fetchCurrentThumbnail()
        }
      } catch (err) {
        console.error(`Error fetching ${entityType} media:`, err)
        // Fallback to fetching current thumbnail
        await fetchCurrentThumbnail()
      }
      
      setLoading(false)
    }

    loadMedia()
  }, [entityId, entityType, userProgress])

  const handlePrevious = () => {
    if (allEntityMedia.length > 1) {
      const newIndex = currentIndex > 0 ? currentIndex - 1 : allEntityMedia.length - 1
      setCurrentIndex(newIndex)
      setCurrentThumbnail(allEntityMedia[newIndex])
    }
  }

  const handleNext = () => {
    if (allEntityMedia.length > 1) {
      const newIndex = currentIndex < allEntityMedia.length - 1 ? currentIndex + 1 : 0
      setCurrentIndex(newIndex)
      setCurrentThumbnail(allEntityMedia[newIndex])
    }
  }

  const renderMediaContent = (media: MediaItem) => {
    if (media.type === 'image') {
      return (
        <img
          src={media.url}
          alt={media.description || `${entityName} image`}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            borderRadius: '8px',
          }}
          onError={(e) => {
            console.error('Image failed to load:', media.url)
            setError('Failed to load image')
          }}
        />
      )
    } else if (media.type === 'video') {
      return (
        <video
          src={media.url}
          controls
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '8px',
          }}
          onError={(e) => {
            console.error('Video failed to load:', media.url)
            setError('Failed to load video')
          }}
        />
      )
    }
    
    // Fallback for other media types
    return (
      <Box
        sx={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'grey.100',
          borderRadius: '8px',
        }}
      >
        <ImageIcon size={48} color="grey" />
        <Typography variant="body2" color="text.secondary" ml={1}>
          {media.type.toUpperCase()}
        </Typography>
      </Box>
    )
  }

  const renderEmptyState = () => (
    <Box
      sx={{
        width: maxWidth,
        height: maxHeight,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'grey.50',
        borderRadius: '8px',
        border: '2px dashed',
        borderColor: 'grey.300',
      }}
    >
      <Box textAlign="center">
        <ImageIcon size={48} color="grey" />
        <Typography variant="body2" color="text.secondary" mt={1}>
          No thumbnail available
        </Typography>
      </Box>
    </Box>
  )

  if (loading) {
    return (
      <Box
        className={className}
        sx={{
          width: maxWidth,
          height: maxHeight,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Box
        className={className}
        sx={{
          width: maxWidth,
          height: maxHeight,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'error.light',
          borderRadius: '8px',
        }}
      >
        <Typography variant="body2" color="error.main">
          {error}
        </Typography>
      </Box>
    )
  }

  if (!currentThumbnail) {
    return renderEmptyState()
  }

  const mediaContent = (
    <Box
      sx={{
        width: '100%',
        height: '100%',
      }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentThumbnail.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          style={{ width: '100%', height: '100%' }}
        >
          {renderMediaContent(currentThumbnail)}
        </motion.div>
      </AnimatePresence>

      {/* Chapter indicator */}
      {currentThumbnail.chapterNumber && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 8,
            left: 8,
            bgcolor: 'rgba(0, 0, 0, 0.6)',
            color: 'white',
            px: 1,
            py: 0.5,
            borderRadius: 1,
            fontSize: '0.75rem',
          }}
        >
          Ch. {currentThumbnail.chapterNumber}
        </Box>
      )}
    </Box>
  )

  // Use the same spoiler wrapper as CharacterTimeline, but controls are outside
  return (
    <Box
      className={className}
      sx={{
        position: 'relative',
        width: maxWidth,
        height: maxHeight,
      }}
    >
      <MediaSpoilerWrapper 
        media={currentThumbnail} 
        userProgress={userProgress}
      >
        {mediaContent}
      </MediaSpoilerWrapper>

      {/* Cycling controls - outside spoiler wrapper */}
      {allowCycling && allEntityMedia.length > 1 && (
        <>
          <IconButton
            onClick={handlePrevious}
            sx={{
              position: 'absolute',
              left: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              bgcolor: 'rgba(0, 0, 0, 0.6)',
              color: 'white',
              '&:hover': {
                bgcolor: 'rgba(0, 0, 0, 0.8)',
              },
              zIndex: 30,
            }}
            size="small"
          >
            <ChevronLeft size={20} />
          </IconButton>

          <IconButton
            onClick={handleNext}
            sx={{
              position: 'absolute',
              right: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              bgcolor: 'rgba(0, 0, 0, 0.6)',
              color: 'white',
              '&:hover': {
                bgcolor: 'rgba(0, 0, 0, 0.8)',
              },
              zIndex: 30,
            }}
            size="small"
          >
            <ChevronRight size={20} />
          </IconButton>

          {/* Media counter */}
          <Box
            sx={{
              position: 'absolute',
              bottom: 8,
              right: 8,
              bgcolor: 'rgba(0, 0, 0, 0.6)',
              color: 'white',
              px: 1,
              py: 0.5,
              borderRadius: 1,
              fontSize: '0.75rem',
              zIndex: 30,
            }}
          >
            {currentIndex + 1} / {allEntityMedia.length}
          </Box>
        </>
      )}
    </Box>
  )
}

// Media Spoiler Wrapper - matches CharacterTimeline spoiler behavior
function MediaSpoilerWrapper({ 
  media, 
  userProgress, 
  children 
}: { 
  media: MediaItem, 
  userProgress: number,
  children: React.ReactNode 
}) {
  const [isRevealed, setIsRevealed] = useState(false)
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

    // For media without chapter numbers, check the isSpoiler flag
    return media.isSpoiler || false
  }

  // Always check client-side logic, don't rely solely on server's isSpoiler
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
    <Box sx={{ 
      position: 'relative', 
      width: '100%', 
      height: '100%',
    }}>
      {/* Render the actual content underneath with cycling controls accessible */}
      <Box sx={{ 
        opacity: 0.3, 
        filter: 'blur(2px)',
        width: '100%',
        height: '100%',
      }}>
        {children}
      </Box>
      
      {/* Spoiler overlay - centered within the media area */}
      <Box 
        sx={{ 
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '80%',
          height: '60%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'error.light',
          borderRadius: '8px',
          cursor: 'pointer',
          border: `1px solid ${theme.palette.error.main}`,
          boxShadow: theme.shadows[4],
          '&:hover': {
            backgroundColor: 'error.dark'
          },
          zIndex: 10,
          pointerEvents: 'auto',
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