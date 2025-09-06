'use client'

import React, { useState, useMemo, useCallback } from 'react'
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Chip, 
  IconButton,
  Button,
  useTheme,
  Tooltip
} from '@mui/material'
import { Calendar, Crown, ArrowRight, Filter, X, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { useProgress } from '../providers/ProgressProvider'
import { useSpoilerSettings } from '../hooks/useSpoilerSettings'

// Helper functions for event types (these should match the existing ones)
const getEventTypeColor = (type: string): string => {
  switch (type) {
    case 'gamble': return '#ff9800' // orange
    case 'decision': return '#2196f3' // blue  
    case 'reveal': return '#9c27b0' // purple
    case 'shift': return '#ff5722' // deep orange
    case 'resolution': return '#4caf50' // green
    default: return '#757575' // grey
  }
}

const getEventTypeIcon = (type: string) => {
  // Return a component function that accepts props
  const EventTypeIcon = ({ size = 16 }: { size?: number }) => {
    switch (type) {
      case 'gamble': return <Crown size={size} />
      case 'decision': return <ArrowRight size={size} />
      case 'reveal': return <Calendar size={size} />
      case 'shift': return <Filter size={size} />
      case 'resolution': return <X size={size} />
      default: return <Calendar size={size} />
    }
  }
  EventTypeIcon.displayName = `EventTypeIcon_${type}`
  return EventTypeIcon
}

const getEventTypeLabel = (type: string): string => {
  switch (type) {
    case 'gamble': return 'Gamble'
    case 'decision': return 'Decision'
    case 'reveal': return 'Reveal'
    case 'shift': return 'Shift'
    case 'resolution': return 'Resolution'
    default: return type.charAt(0).toUpperCase() + type.slice(1)
  }
}
// CSS-in-JS styles for performance
const globalStyles = `
  .gamble-timeline-highlight {
    background-color: var(--mui-palette-warning-light) !important;
    border: 2px solid var(--mui-palette-warning-main) !important;
    box-shadow: 0 0 8px var(--mui-palette-warning-light) !important;
    transition: all 0.2s ease !important;
  }
`

// Inject styles once
if (typeof document !== 'undefined' && !document.getElementById('gamble-timeline-styles')) {
  const styleSheet = document.createElement('style')
  styleSheet.id = 'gamble-timeline-styles'
  styleSheet.textContent = globalStyles
  document.head.appendChild(styleSheet)
}

// Memoized Timeline Display Component
const TimelineDisplay = React.memo(function TimelineDisplay({ 
  visiblePhases, 
  arcs, 
  getPhaseColor, 
  theme 
}: {
  visiblePhases: Array<{
    title: string
    description: string
    events: GambleTimelineEvent[]
    phase: string
  }>
  arcs: Arc[]
  getPhaseColor: (phase: string) => string
  theme: any
}) {
  return (
    <Box>
      {visiblePhases.map((phase, phaseIndex) => (
        <Box key={phaseIndex} sx={{ mb: 3 }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 2, 
            mb: 2,
            pb: 1,
            borderBottom: `2px solid ${getPhaseColor(phase.phase)}`
          }}>
            <Crown size={20} color={getPhaseColor(phase.phase)} />
            <Typography variant="h6" sx={{ color: getPhaseColor(phase.phase) }}>
              {phase.title}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {phase.description}
            </Typography>
          </Box>
          
          <Box sx={{ pl: 2 }}>
            {phase.events.map((event, eventIndex) => (
              <TimelineEventCard
                key={event.id}
                event={event}
                arcs={arcs}
                theme={theme}
                getEventTypeColor={getEventTypeColor}
                getEventTypeIcon={getEventTypeIcon}
                getEventTypeLabel={getEventTypeLabel}
                isLastInPhase={eventIndex === phase.events.length - 1}
                getPhaseColor={getPhaseColor}
                phaseType={phase.phase}
              />
            ))}
          </Box>
          
          {/* Phase transition arrow */}
          {phaseIndex < visiblePhases.length - 1 && (
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              my: 2 
            }}>
              <ArrowRight size={24} color={theme.palette.text.secondary} />
            </Box>
          )}
        </Box>
      ))}
    </Box>
  )
})

// Memoized Event Card Component 
const TimelineEventCard = React.memo(function TimelineEventCard({ 
  event,
  arcs,
  theme,
  getEventTypeColor,
  getEventTypeIcon,
  getEventTypeLabel,
  isLastInPhase,
  getPhaseColor,
  phaseType
}: {
  event: GambleTimelineEvent
  arcs: Arc[]
  theme: any
  getEventTypeColor: (type: string) => string
  getEventTypeIcon: (type: string) => React.ComponentType<{ size?: number }>
  getEventTypeLabel: (type: string) => string
  isLastInPhase: boolean
  getPhaseColor: (phase: string) => string
  phaseType: string
}) {
  const arc = arcs.find(a => a.id === event.arcId)
  
  return (
    <TimelineSpoilerWrapper event={event}>
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'flex-start', 
        gap: 2, 
        mb: 2,
        p: 2,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 1,
        backgroundColor: theme.palette.background.paper,
        position: 'relative',
        // Performance optimizations
        willChange: 'transform',
        transform: 'translateZ(0)', // Hardware acceleration
        transition: 'transform 0.2s ease, box-shadow 0.2s ease', // Reduced transition duration
        '&:hover': {
          transform: 'translateY(-2px) translateZ(0)',
          boxShadow: theme.shadows[4],
        }
      }}>
        {/* Event type indicator */}
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 32,
          height: 32,
          borderRadius: '50%',
          backgroundColor: event.type ? getEventTypeColor(event.type) : theme.palette.grey[400],
          color: 'white',
          flexShrink: 0,
          // Performance optimization
          willChange: 'transform',
        }}>
          {event.type && React.createElement(getEventTypeIcon(event.type), { size: 16 })}
        </Box>
        
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'medium', mb: 1 }}>
            {event.title}
          </Typography>
          
          {event.description && (
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              {event.description}
            </Typography>
          )}
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Chip
              label={`Chapter ${event.chapterNumber}`}
              size="small"
              component={Link}
              href={`/chapters/${event.chapterNumber}`}
              clickable
              sx={{ textDecoration: 'none' }}
            />
            
            {arc && (
              <Chip
                label={arc.name}
                size="small"
                variant="outlined"
                component={Link}
                href={`/arcs/${arc.id}`}
                clickable
                sx={{ textDecoration: 'none' }}
              />
            )}
            
            {event.type && (
              <Chip
                label={getEventTypeLabel(event.type)}
                size="small"
                sx={{
                  backgroundColor: getEventTypeColor(event.type),
                  color: 'white'
                }}
              />
            )}
          </Box>
        </Box>
        
        {/* Connection line to next event */}
        {!isLastInPhase && (
          <Box sx={{
            position: 'absolute',
            left: 31,
            bottom: -16,
            width: 2,
            height: 16,
            backgroundColor: getPhaseColor(phaseType),
            opacity: 0.3
          }} />
        )}
      </Box>
    </TimelineSpoilerWrapper>
  )
})

interface GambleTimelineEvent {
  id: number
  title: string
  description: string | null
  chapterNumber: number
  type: 'gamble' | 'decision' | 'reveal' | 'shift' | 'resolution' | null
  arcId: number
  arcName: string
  isSpoiler?: boolean
  spoilerChapter?: number
  gambleId?: number
}

interface Arc {
  id: number
  name: string
  description: string | null
  startChapter: number
  endChapter: number | null
}

interface GambleTimelineProps {
  events: GambleTimelineEvent[]
  arcs: Arc[]
  gambleName: string
  gambleChapter: number
}

const GambleTimeline = React.memo(function GambleTimeline({ 
  events, 
  arcs, 
  gambleName, 
  gambleChapter 
}: GambleTimelineProps) {
  const theme = useTheme()
  const [selectedEventTypes, setSelectedEventTypes] = useState<Set<string>>(new Set())
  const [showAllEvents, setShowAllEvents] = useState(false)
  const { userProgress } = useProgress()
  const { settings } = useSpoilerSettings()

  // Get all unique event types from events with memoization
  const uniqueEventTypes = useMemo(() => {
    const eventTypes = new Set<string>()
    
    events.forEach(event => {
      if (event.type) eventTypes.add(event.type)
    })
    
    return Array.from(eventTypes).map(type => ({
      type,
      label: getEventTypeLabel(type),
      icon: getEventTypeIcon(type),
      color: getEventTypeColor(type)
    }))
  }, [events])

  // Filter events based on event types with optimized dependencies
  const filteredEvents = useMemo(() => {
    if (selectedEventTypes.size === 0) {
      return events.slice().sort((a, b) => a.chapterNumber - b.chapterNumber)
    }

    return events
      .filter(event => event.type && selectedEventTypes.has(event.type))
      .sort((a, b) => a.chapterNumber - b.chapterNumber)
  }, [events, selectedEventTypes])

  // Group events chronologically with context - enhanced for performance
  const timelinePhases = useMemo(() => {
    const sortedEvents = filteredEvents.sort((a, b) => a.chapterNumber - b.chapterNumber)
    
    // Find the main gamble event
    const mainGambleEvent = sortedEvents.find(event => 
      event.type === 'gamble' && event.chapterNumber === gambleChapter
    )
    
    const phases = []
    
    // Pre-gamble events (setup, decisions leading to the gamble)
    const preGambleEvents = sortedEvents.filter(event => 
      event.chapterNumber < gambleChapter
    )
    if (preGambleEvents.length > 0) {
      phases.push({
        title: "Setup & Lead-up",
        description: "Events leading to the gamble",
        events: preGambleEvents,
        phase: 'setup'
      })
    }
    
    // The gamble event itself
    if (mainGambleEvent) {
      phases.push({
        title: "The Gamble",
        description: gambleName,
        events: [mainGambleEvent],
        phase: 'gamble'
      })
    }
    
    // Post-gamble events (reveals, resolutions, consequences)
    const postGambleEvents = sortedEvents.filter(event => 
      event.chapterNumber > gambleChapter
    )
    if (postGambleEvents.length > 0) {
      // Try to separate reveals from final resolution
      const revealEvents = postGambleEvents.filter(event => 
        event.type === 'reveal' || event.type === 'shift'
      )
      const resolutionEvents = postGambleEvents.filter(event => 
        event.type === 'resolution'
      )
      const otherEvents = postGambleEvents.filter(event => 
        !revealEvents.includes(event) && !resolutionEvents.includes(event)
      )
      
      if (revealEvents.length > 0 || otherEvents.length > 0) {
        phases.push({
          title: "Reveals & Developments", 
          description: "Unfolding consequences and revelations",
          events: [...revealEvents, ...otherEvents].sort((a, b) => a.chapterNumber - b.chapterNumber),
          phase: 'reveals'
        })
      }
      
      if (resolutionEvents.length > 0) {
        phases.push({
          title: "Resolution",
          description: "Final outcome and conclusions",
          events: resolutionEvents,
          phase: 'resolution'
        })
      }
    }
    
    return phases
  }, [filteredEvents, gambleName, gambleChapter])

  // Get visible phases based on showAllEvents with memoization
  const visiblePhases = useMemo(() => {
    if (showAllEvents) return timelinePhases
    return timelinePhases.slice(0, 3) // Show first 3 phases by default
  }, [timelinePhases, showAllEvents])

  // Use useCallback for event handlers to prevent recreation
  const clearAllFilters = useCallback(() => {
    setSelectedEventTypes(new Set())
  }, [])

  const toggleEventType = useCallback((type: string) => {
    setSelectedEventTypes(prev => {
      const newSelected = new Set(prev)
      if (newSelected.has(type)) {
        newSelected.delete(type)
      } else {
        newSelected.add(type)
      }
      return newSelected
    })
  }, [])

  const toggleShowAllEvents = useCallback(() => {
    setShowAllEvents(prev => !prev)
  }, [])

  const getPhaseColor = useCallback((phase: string) => {
    switch (phase) {
      case 'setup': return theme.palette.info.main
      case 'gamble': return theme.palette.usogui?.gamble || theme.palette.warning.main
      case 'reveals': return theme.palette.secondary.main
      case 'resolution': return theme.palette.success.main
      default: return theme.palette.primary.main
    }
  }, [theme])

  return (
    <Card className="gambling-card">
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Calendar size={24} />
            Gamble Timeline
          </Typography>
          
          {uniqueEventTypes.length > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Filter size={16} />
              {uniqueEventTypes.map(({ type, label, color }) => (
                <Chip
                  key={type}
                  label={label}
                  size="small"
                  variant={selectedEventTypes.has(type) ? "filled" : "outlined"}
                  sx={{ 
                    backgroundColor: selectedEventTypes.has(type) ? color : 'transparent',
                    borderColor: color,
                    color: selectedEventTypes.has(type) ? 'white' : color
                  }}
                  onClick={() => toggleEventType(type)}
                />
              ))}
              {selectedEventTypes.size > 0 && (
                <IconButton size="small" onClick={clearAllFilters}>
                  <X size={16} />
                </IconButton>
              )}
            </Box>
          )}
        </Box>

        {visiblePhases.length === 0 ? (
          <Typography color="textSecondary" sx={{ textAlign: 'center', py: 4 }}>
            No timeline events found for this gamble.
          </Typography>
        ) : (
          <TimelineDisplay 
            visiblePhases={visiblePhases}
            arcs={arcs}
            getPhaseColor={getPhaseColor}
            theme={theme}
          />
        )}
        
        {timelinePhases.length > visiblePhases.length && (
          <Box sx={{ textAlign: 'center', mt: 3 }}>
            <Button
              variant="outlined"
              onClick={toggleShowAllEvents}
              sx={{ minWidth: 120 }}
            >
              {showAllEvents ? 'Show Less' : `Show All (${timelinePhases.length} phases)`}
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  )
})

export default GambleTimeline

// Timeline Spoiler Wrapper Component
function TimelineSpoilerWrapper({ event, children }: { event: GambleTimelineEvent, children: React.ReactNode }) {
  const [isRevealed, setIsRevealed] = useState(false)
  const { userProgress } = useProgress()
  const { settings } = useSpoilerSettings()
  const theme = useTheme()

  const shouldHideSpoiler = () => {
    const chapterNumber = event.chapterNumber
    
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
      // Check if this is a spoiler based on spoilerChapter or chapterNumber
      const spoilerChapter = event.spoilerChapter || chapterNumber
      return spoilerChapter > effectiveProgress
    }

    // For events without chapter numbers, be conservative and hide them
    // unless user has made significant progress
    return effectiveProgress <= 5
  }

  // Always check client-side logic, don't rely solely on server's isSpoiler
  // This ensures spoilers work properly when not logged in
  const clientSideShouldHide = shouldHideSpoiler()
  
  // Always render the event, but with spoiler protection overlay if needed
  if (!clientSideShouldHide || isRevealed) {
    return <>{children}</>
  }

  const handleReveal = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsRevealed(true)
  }

  const chapterNumber = event.chapterNumber
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
          title={`Chapter ${chapterNumber} spoiler - You're at Chapter ${effectiveProgress}. Click to reveal.`}
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
              Chapter {chapterNumber} Spoiler
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
