'use client'

import React, { useState } from 'react'
import { Box, Typography, Tooltip, useTheme } from '@mui/material'
import { AlertTriangle } from 'lucide-react'
import { useProgress } from '../providers/ProgressProvider'
import { useSpoilerSettings } from '../hooks/useSpoilerSettings'

interface TimelineSpoilerWrapperProps {
  chapterNumber?: number
  children: React.ReactNode
}

/**
 * Unified spoiler wrapper component that matches the behavior of 
 * CharacterTimeline, MediaThumbnail, and profile picture spoiler wrappers.
 * 
 * This component provides:
 * - Blur + overlay spoiler protection
 * - Click-to-reveal functionality
 * - Consistent visual styling
 * - Unified spoiler logic based on user progress and settings
 */
export default function TimelineSpoilerWrapper({ 
  chapterNumber, 
  children 
}: TimelineSpoilerWrapperProps) {
  const [isRevealed, setIsRevealed] = useState(false)
  const { userProgress } = useProgress()
  const { settings } = useSpoilerSettings()
  const theme = useTheme()

  const shouldHideSpoiler = () => {
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

    // For content without chapter numbers, don't hide
    return false
  }

  // Always check client-side logic
  const clientSideShouldHide = shouldHideSpoiler()
  
  // Always render the content, but with spoiler protection overlay if needed
  if (!clientSideShouldHide || isRevealed) {
    return <>{children}</>
  }

  const handleReveal = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsRevealed(true)
  }

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
          borderRadius: 1,
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
