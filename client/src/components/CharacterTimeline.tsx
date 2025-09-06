import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { 
  Card, CardContent, Box, Typography, Chip, Button, 
  Divider, Tooltip, useTheme
} from '@mui/material'
import { Calendar, BookOpen, Eye, EyeOff, X, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { useProgress } from '../providers/ProgressProvider'
import { useSpoilerSettings } from '../hooks/useSpoilerSettings'

export interface TimelineEvent {
  id: number
  title: string
  description: string | null
  chapterNumber: number
  type: 'gamble' | 'decision' | 'reveal' | 'shift' | 'resolution' | null
  arcId: number
  arcName: string
  isSpoiler?: boolean
  spoilerChapter?: number
}

export interface Arc {
  id: number
  name: string
  description: string | null
  startChapter: number
  endChapter: number | null
}

interface CharacterTimelineProps {
  events: TimelineEvent[]
  arcs: Arc[]
  characterName: string
  firstAppearanceChapter: number
}


function getEventTypeLabel(type: string | null): string {
  switch (type) {
    case 'gamble': return 'Gamble'
    case 'decision': return 'Decision'
    case 'reveal': return 'Reveal'
    case 'shift': return 'Shift'
    case 'resolution': return 'Resolution'
    default: return 'Event'
  }
}

function getEventTypeColor(type: string | null): "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" {
  switch (type) {
    case 'gamble': return 'warning'
    case 'decision': return 'primary'
    case 'reveal': return 'info'
    case 'shift': return 'secondary'
    case 'resolution': return 'success'
    default: return 'default'
  }
}

// CSS-in-JS styles for performance
const globalStyles = `
  .timeline-event-highlight {
    background-color: var(--mui-palette-warning-light) !important;
    border: 2px solid var(--mui-palette-warning-main) !important;
    box-shadow: 0 0 8px var(--mui-palette-warning-light) !important;
    transition: all 0.2s ease !important;
  }
`

// Inject styles once
if (typeof document !== 'undefined' && !document.getElementById('timeline-styles')) {
  const styleSheet = document.createElement('style')
  styleSheet.id = 'timeline-styles'
  styleSheet.textContent = globalStyles
  document.head.appendChild(styleSheet)
}

// Memoized Timeline Display Component
const TimelineDisplay = React.memo(function TimelineDisplay({ 
  visibleSections, 
  characterName, 
  theme 
}: {
  visibleSections: Array<{ arc: Arc; events: TimelineEvent[] }>
  characterName: string
  theme: any
}) {
  return (
    <Box sx={{ mb: 3 }}>
      {visibleSections.map((section, index) => (
        <Box key={section.arc.id} sx={{ mb: 8 }}>
          {/* Add separator between arcs (except for the first one) */}
          {index > 0 && (
            <Divider sx={{ mb: 6, borderStyle: 'dashed', borderColor: 'primary.main', opacity: 0.3 }} />
          )}
          
          <Box id={`timeline-arc-${section.arc.id}`}>
            {/* Arc Header */}
            <Box sx={{ mb: 3, textAlign: 'center' }}>
              <Typography variant="h5" sx={{ mb: 1, color: 'primary.main', fontWeight: 'bold' }}>
                {section.arc.name}
              </Typography>
              <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 1, fontStyle: 'italic' }}>
                {characterName}'s events in this arc
              </Typography>
              {section.arc.description && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, maxWidth: '600px', mx: 'auto' }}>
                  {section.arc.description}
                </Typography>
              )}
              <Chip
                label={`Chapters ${section.arc.startChapter}${section.arc.endChapter && section.arc.endChapter !== section.arc.startChapter ? `-${section.arc.endChapter}` : ''}`}
                size="small"
                variant="outlined"
                color="secondary"
              />
            </Box>

            {/* Horizontal Timeline */}
            <Box sx={{ position: 'relative', px: 2 }}>
              {/* Timeline Line */}
              <Box
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: 0,
                  right: 0,
                  height: '3px',
                  background: `linear-gradient(90deg, ${theme.palette.primary.main}20, ${theme.palette.primary.main}, ${theme.palette.primary.main}20)`,
                  transform: 'translateY(-50%)',
                  zIndex: 1,
                  borderRadius: '1.5px'
                }}
              />
              
              {/* Horizontal Scrollable Container with Performance Optimizations */}
              <Box
                sx={{
                  display: 'flex',
                  gap: 4,
                  overflowX: 'auto',
                  overflowY: 'visible',
                  pb: 2,
                  pt: 2,
                  position: 'relative',
                  zIndex: 2,
                  // Performance optimizations for scrolling
                  willChange: 'scroll-position',
                  transform: 'translateZ(0)', // Force hardware acceleration
                  '&::-webkit-scrollbar': {
                    height: '8px',
                  },
                  '&::-webkit-scrollbar-track': {
                    backgroundColor: 'transparent',
                    borderRadius: '4px',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    backgroundColor: theme.palette.primary.main + '40',
                    borderRadius: '4px',
                    '&:hover': {
                      backgroundColor: theme.palette.primary.main + '60',
                    }
                  },
                }}
              >
                {section.events.map((event) => (
                  <TimelineEventCard key={event.id} event={event} theme={theme} />
                ))}
              </Box>
            </Box>
          </Box>
        </Box>
      ))}
    </Box>
  )
})

// Memoized Event Card Component 
const TimelineEventCard = React.memo(function TimelineEventCard({ 
  event, 
  theme 
}: {
  event: TimelineEvent
  theme: any
}) {
  return (
    <Box
      id={`event-${event.id}`}
      sx={{
        minWidth: '280px',
        maxWidth: '320px',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 1,
        // Performance optimization
        willChange: 'transform',
      }}
    >
      {/* Timeline Node */}
      <Box
        sx={{
          width: '16px',
          height: '16px',
          borderRadius: '50%',
          backgroundColor: theme.palette.primary.main,
          border: `3px solid ${theme.palette.background.paper}`,
          boxShadow: `0 0 0 2px ${theme.palette.primary.main}`,
          position: 'relative',
          zIndex: 3,
          mb: 2,
          transition: 'transform 0.2s ease', // Reduced transition duration
          '&:hover': {
            transform: 'scale(1.2)',
            boxShadow: `0 0 0 3px ${theme.palette.primary.main}`,
          }
        }}
      />
      
      {/* Event Card with Spoiler Protection */}
      <TimelineSpoilerWrapper event={event}>
        <Card
          sx={{
            width: '100%',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease', // Reduced transition duration
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: theme.shadows[8],
            },
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 2,
            // Performance optimization
            willChange: 'transform',
          }}
        >
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            {/* Event Header */}
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1, justifyContent: 'center' }}>
                <Chip
                  label={`Ch. ${event.chapterNumber}`}
                  size="small"
                  variant="outlined"
                  color="primary"
                  sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}
                />
                {event.type && (
                  <Chip
                    label={getEventTypeLabel(event.type)}
                    size="small"
                    variant="filled"
                    color={getEventTypeColor(event.type)}
                    sx={{ fontSize: '0.7rem' }}
                  />
                )}
              </Box>
            </Box>
            
            {/* Event Title */}
            <Typography 
              variant="subtitle2" 
              fontWeight="bold" 
              sx={{ 
                mb: 1, 
                textAlign: 'center',
                fontSize: '0.9rem',
                lineHeight: 1.3,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}
            >
              {event.title}
            </Typography>
            
            {/* Event Description */}
            {event.description && (
              <Typography 
                variant="body2" 
                color="text.secondary" 
                sx={{ 
                  fontSize: '0.8rem',
                  lineHeight: 1.4,
                  textAlign: 'center',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}
              >
                {event.description}
              </Typography>
            )}
          </CardContent>
        </Card>
      </TimelineSpoilerWrapper>
    </Box>
  )
})

const CharacterTimeline = React.memo(function CharacterTimeline({ 
  events, 
  arcs, 
  characterName, 
  firstAppearanceChapter 
}: CharacterTimelineProps) {
  const theme = useTheme()
  const [selectedEventTypes, setSelectedEventTypes] = useState<Set<string>>(new Set())
  const [showAllEvents, setShowAllEvents] = useState(false)

  // Memoize event types calculation with proper dependencies
  const uniqueEventTypes = useMemo(() => {
    const eventTypes = new Set<string>()
    
    events.forEach(event => {
      if (event.type) eventTypes.add(event.type)
    })
    
    return Array.from(eventTypes).map(type => ({
      type,
      label: getEventTypeLabel(type),
      color: getEventTypeColor(type)
    }))
  }, [events])

  // Optimize filtered events calculation
  const filteredEvents = useMemo(() => {
    if (selectedEventTypes.size === 0) {
      return events.slice().sort((a, b) => a.chapterNumber - b.chapterNumber)
    }
    
    return events
      .filter(event => event.type && selectedEventTypes.has(event.type))
      .sort((a, b) => a.chapterNumber - b.chapterNumber)
  }, [events, selectedEventTypes])

  // Optimize timeline sections grouping
  const timelineSections = useMemo(() => {
    const arcEvents = new Map<number, TimelineEvent[]>()
    
    // Create arc lookup for O(1) access
    const arcLookup = new Map(arcs.map(arc => [arc.id, arc]))
    
    // Only group events that have valid arc IDs and corresponding arc data
    filteredEvents.forEach(event => {
      const arcId = event.arcId
      if (arcId !== null && arcId !== undefined && arcLookup.has(arcId)) {
        if (!arcEvents.has(arcId)) {
          arcEvents.set(arcId, [])
        }
        arcEvents.get(arcId)!.push(event)
      }
    })

    // Convert to sections with proper arc information
    const sections = Array.from(arcEvents.entries())
      .map(([arcId, events]) => {
        const arc = arcLookup.get(arcId)!
        return {
          arc,
          events: events.sort((a, b) => a.chapterNumber - b.chapterNumber)
        }
      })

    // Sort sections by arc start chapter
    return sections.sort((a, b) => a.arc.startChapter - b.arc.startChapter)
  }, [filteredEvents, arcs])

  // Get visible sections based on showAllEvents
  const visibleSections = useMemo(() => {
    return showAllEvents ? timelineSections : timelineSections.slice(0, 3)
  }, [timelineSections, showAllEvents])

  // Optimize scroll functions with throttling and requestAnimationFrame
  const scrollToArcRef = useRef<{ [key: number]: () => void }>({})
  
  useEffect(() => {
    timelineSections.forEach(section => {
      if (!scrollToArcRef.current[section.arc.id]) {
        scrollToArcRef.current[section.arc.id] = () => {
          requestAnimationFrame(() => {
            const element = document.getElementById(`timeline-arc-${section.arc.id}`)
            if (element) {
              element.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'nearest',
                inline: 'center'
              })
            }
          })
        }
      }
    })
  }, [timelineSections])

  const scrollToArc = useCallback((arcId: number) => {
    scrollToArcRef.current[arcId]?.()
  }, [])

  const scrollToChapter = useCallback((chapterNumber: number) => {
    // Find the event with this chapter and scroll to its arc
    const event = filteredEvents.find(e => e.chapterNumber === chapterNumber)
    if (event) {
      scrollToArc(event.arcId)
      
      // After scrolling to arc, find and highlight the specific event
      setTimeout(() => {
        requestAnimationFrame(() => {
          const eventElement = document.getElementById(`event-${event.id}`)
          if (eventElement) {
            eventElement.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'center',
              inline: 'center' 
            })
            
            // Use CSS classes instead of direct style manipulation for better performance
            eventElement.classList.add('timeline-event-highlight')
            setTimeout(() => {
              eventElement.classList.remove('timeline-event-highlight')
            }, 3000)
          }
        })
      }, 500)
    }
  }, [filteredEvents, scrollToArc])

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

  // Get some quick navigation chapters - limit to reduce DOM size
  const uniqueChapters = useMemo(() => {
    return Array.from(new Set(filteredEvents.map(e => e.chapterNumber)))
      .sort((a, b) => a - b)
      .slice(0, 10)
  }, [filteredEvents])

  return (
    <Card className="gambling-card">
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Calendar size={20} />
            {characterName} Timeline
          </Typography>
          <Button
            component={Link}
            href={`/events?character=${encodeURIComponent(characterName)}`}
            size="small"
            color="primary"
          >
            View All Events
          </Button>
        </Box>

        {/* Character First Appearance */}
        {firstAppearanceChapter && (
          <Box sx={{ mb: 3 }}>
            <Chip
              label={`First Appearance: Chapter ${firstAppearanceChapter}`}
              color="secondary"
              variant="filled"
              icon={<BookOpen size={16} />}
              onClick={() => scrollToChapter(firstAppearanceChapter)}
              clickable
              sx={{ 
                fontWeight: 'bold',
                '&:hover': {
                  backgroundColor: 'secondary.dark'
                }
              }}
            />
          </Box>
        )}

        {/* Filters */}
        <Box sx={{ mb: 3 }}>
          {/* Event Type Filter */}
          {uniqueEventTypes.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                Filter by Event Type:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {uniqueEventTypes.map(({ type, label, color }) => (
                  <Chip
                    key={type}
                    label={label}
                    size="small"
                    variant={selectedEventTypes.has(type) ? 'filled' : 'outlined'}
                    color={color}
                    clickable
                    onClick={() => toggleEventType(type)}
                  />
                ))}
              </Box>
            </Box>
          )}

          {/* Clear Filters */}
          {selectedEventTypes.size > 0 && (
            <Box>
              <Button
                startIcon={<X size={16} />}
                size="small"
                variant="outlined"
                onClick={clearAllFilters}
              >
                Clear Filters
              </Button>
            </Box>
          )}
        </Box>

        {/* Quick Navigation */}
        {filteredEvents.length > 0 && (
          <>
            <Divider sx={{ my: 3 }} />
            <Box>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
                Quick Navigation:
              </Typography>
              
              {/* Arc Navigation */}
              {timelineSections.length > 1 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                    Jump to Arc:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {timelineSections.slice(0, 5).map(section => (
                      <Chip
                        key={section.arc.id}
                        label={section.arc.name}
                        size="small"
                        variant="outlined"
                        color="primary"
                        clickable
                        onClick={() => scrollToArc(section.arc.id)}
                        sx={{
                          '&:hover': {
                            backgroundColor: 'primary.main',
                            color: 'white'
                          }
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              )}
              
              {/* Chapter Navigation */}
              {uniqueChapters.length > 0 && (
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                    Jump to Chapter:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {uniqueChapters.map(chapter => (
                      <Chip
                        key={chapter}
                        label={`Ch. ${chapter}`}
                        size="small"
                        variant="outlined"
                        clickable
                        onClick={() => scrollToChapter(chapter)}
                        sx={{
                          '&:hover': {
                            backgroundColor: 'primary.main',
                            color: 'white'
                          }
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          </>
        )}

        <Divider sx={{ my: 3 }} />

        {filteredEvents.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              No events found for this character{selectedEventTypes.size > 0 ? ' matching your filters' : ''}.
            </Typography>
          </Box>
        ) : timelineSections.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              No arc-associated events found for this character.
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
              Found {filteredEvents.length} event(s), but none are properly associated with story arcs.
            </Typography>
          </Box>
        ) : null}

        {/* Show All Arcs Toggle */}
        {timelineSections.length > 3 && (
          <Box sx={{ mb: 3, textAlign: 'center' }}>
            <Button
              startIcon={showAllEvents ? <EyeOff size={16} /> : <Eye size={16} />}
              onClick={toggleShowAllEvents}
              size="small"
              variant="outlined"
            >
              {showAllEvents ? 'Show Less' : `Show All ${timelineSections.length} Arcs`}
            </Button>
          </Box>
        )}

        {/* Horizontal Timeline Display */}
        {timelineSections.length > 0 && (
          <TimelineDisplay 
            visibleSections={visibleSections}
            characterName={characterName}
            theme={theme}
          />
        )}

      </CardContent>
    </Card>
  )
})

// Timeline Spoiler Wrapper
function TimelineSpoilerWrapper({ event, children }: { event: TimelineEvent, children: React.ReactNode }) {
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

export default CharacterTimeline

