'use client'

import React, { useMemo, useState } from 'react'
import { Box, Text, Tooltip, useMantineTheme } from '@mantine/core'
import { AlertTriangle } from 'lucide-react'
import { useProgress } from '../providers/ProgressProvider'
import { useSpoilerSettings } from '../hooks/useSpoilerSettings'
import { getAlphaColor } from '../lib/mantine-theme'

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
  const theme = useMantineTheme()
  const [isHovered, setIsHovered] = useState(false)

  const accentColor = useMemo(() => {
    return theme.other?.usogui?.arc ?? theme.colors.red?.[6] ?? '#dc004e'
  }, [theme])

  const overlayBase = useMemo(() => {
    return getAlphaColor(accentColor, 0.78)
  }, [accentColor])

  const overlayHover = useMemo(() => {
    return getAlphaColor(accentColor, 0.9)
  }, [accentColor])

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
    <Box style={{ position: 'relative' }}>
      {/* Render the actual content underneath */}
      <Box style={{ opacity: 0.3, filter: 'blur(2px)', pointerEvents: 'none' }}>
        {children}
      </Box>
      
      {/* Spoiler overlay */}
      <Box 
        onClick={handleReveal}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isHovered ? overlayHover : overlayBase,
          borderRadius: theme.radius.sm,
          cursor: 'pointer',
          border: `1px solid ${accentColor}`,
          zIndex: 100,
          transition: `background-color 200ms cubic-bezier(0.4, 0, 0.2, 1)`
        }}
      >
        <Tooltip 
          label={chapterNumber ? `Chapter ${chapterNumber} spoiler - You're at Chapter ${effectiveProgress}. Click to reveal.` : 'Spoiler content. Click to reveal.'}
          position="top"
          withArrow
        >
          <Box style={{ textAlign: 'center', width: '100%' }}>
            <Text 
              size="xs"
              span
              fw={700}
              style={{ 
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                fontSize: '0.75rem',
                marginBottom: '0.5rem'
              }}
            >
              <AlertTriangle size={14} />
              {chapterNumber ? `Chapter ${chapterNumber} Spoiler` : 'Spoiler'}
            </Text>
            <Text 
              size="xs"
              style={{ 
                color: 'rgba(255, 255, 255, 0.8)',
                fontSize: '0.65rem'
              }}
            >
              Click to reveal
            </Text>
          </Box>
        </Tooltip>
      </Box>
    </Box>
  )
}
