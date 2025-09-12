'use client'

import React, { useState, useMemo, useCallback, useRef } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Button,
  Divider,
  useTheme
} from '@mui/material'
import { BookOpen, Calendar, AlertTriangle, Dice1, Users, Eye, ArrowUpDown, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { useProgress } from '../providers/ProgressProvider'
import { useSpoilerSettings } from '../hooks/useSpoilerSettings'

interface TimelineEvent {
  id: number
  title: string
  chapterNumber: number
  type?: 'gamble' | 'decision' | 'reveal' | 'shift' | 'resolution'
  characters?: string[]
  description?: string
  isSpoiler?: boolean
}

interface ArcTimelineProps {
  events: TimelineEvent[]
  arcName: string
  startChapter: number
  endChapter: number
}

// Event type styling helpers
const getEventTypeIcon = (type?: string) => {
  switch (type) {
    case 'gamble': return Dice1
    case 'decision': return Users
    case 'reveal': return Eye
    case 'shift': return ArrowUpDown
    case 'resolution': return CheckCircle2
    default: return Calendar
  }
}

const getEventTypeColor = (type?: string): 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' => {
  switch (type) {
    case 'gamble': return 'error'
    case 'decision': return 'warning'
    case 'reveal': return 'info'
    case 'shift': return 'secondary'
    case 'resolution': return 'success'
    default: return 'primary'
  }
}

const getEventTypeLabel = (type?: string): string => {
  switch (type) {
    case 'gamble': return 'Gamble'
    case 'decision': return 'Decision'
    case 'reveal': return 'Reveal'
    case 'shift': return 'Shift'
    case 'resolution': return 'Resolution'
    default: return 'Event'
  }
}

// CSS-in-JS styles for performance
const globalStyles = `
  .arc-timeline-highlight {
    background-color: var(--mui-palette-warning-light) !important;
    border: 2px solid var(--mui-palette-warning-main) !important;
    box-shadow: 0 0 8px var(--mui-palette-warning-light) !important;
    transition: all 0.2s ease !important;
  }
`

// Inject styles once
if (typeof document !== 'undefined' && !document.getElementById('arc-timeline-styles')) {
  const styleSheet = document.createElement('style')
  styleSheet.id = 'arc-timeline-styles'
  styleSheet.textContent = globalStyles
  document.head.appendChild(styleSheet)
}

const ArcTimeline = React.memo(function ArcTimeline({ 
  events, 
  arcName, 
  startChapter, 
  endChapter 
}: ArcTimelineProps) {
  const theme = useTheme()
  const [selectedEventTypes, setSelectedEventTypes] = useState<Set<string>>(new Set())
  const [selectedCharacters, setSelectedCharacters] = useState<Set<string>>(new Set())
  const [showAllEvents, setShowAllEvents] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
  const timelineRef = useRef<HTMLDivElement>(null)
  
  // Global modal state for all events
  const [globalModal, setGlobalModal] = useState<{
    show: boolean
    event: TimelineEvent | null
    position: { x: number, y: number }
  }>({
    show: false,
    event: null,
    position: { x: 0, y: 0 }
  })

  // Get all unique event types and characters from events with optimized memoization
  const { uniqueEventTypes, uniqueCharacters } = useMemo(() => {
    const eventTypes = new Set<string>()
    const characters = new Set<string>()
    
    events.forEach(event => {
      if (event.type) eventTypes.add(event.type)
      if (event.characters) {
        event.characters.forEach((char: string) => characters.add(char))
      }
    })
    
    return {
      uniqueEventTypes: Array.from(eventTypes),
      uniqueCharacters: Array.from(characters)
    }
  }, [events])

  // Filter events based on selected filters with optimized dependencies
  const filteredEvents = useMemo(() => {
    if (selectedEventTypes.size === 0 && selectedCharacters.size === 0) {
      return events.slice().sort((a, b) => a.chapterNumber - b.chapterNumber)
    }
    
    let filtered = [...events]
    
    // Filter by event types
    if (selectedEventTypes.size > 0) {
      filtered = filtered.filter(event => 
        event.type && selectedEventTypes.has(event.type)
      )
    }
    
    // Filter by characters
    if (selectedCharacters.size > 0) {
      filtered = filtered.filter(event =>
        event.characters && event.characters.some((char: string) => selectedCharacters.has(char))
      )
    }
    
    return filtered.sort((a, b) => a.chapterNumber - b.chapterNumber)
  }, [events, selectedEventTypes, selectedCharacters])

  // Group events by event type for horizontal timeline sections - enhanced for performance
  const timelineSections = useMemo(() => {
    const sections: Array<{
      type: 'section'
      sectionType: string
      sectionName: string
      events: TimelineEvent[]
      earliestChapter?: number
      latestChapter?: number
    }> = []

    if (filteredEvents.length === 0) return sections

    // Sort events by chapter first
    const sortedEvents = [...filteredEvents].sort((a, b) => a.chapterNumber - b.chapterNumber)
    
    // Step 1: Identify all RESOLUTION events as primary anchors
    const resolutionEvents = sortedEvents.filter(event => event.type === 'resolution')
    
    // Step 2: Create narrative units by grouping backwards from each RESOLUTION
    const usedEventIds = new Set<number>()
    let narrativeUnitIndex = 1

    resolutionEvents.forEach((resolution) => {
      if (usedEventIds.has(resolution.id)) return

      // Find events that led to this resolution
      const narrativeUnit: TimelineEvent[] = []
      const resolutionChapter = resolution.chapterNumber
      
      // Look backwards from this resolution to find the complete gamble cycle
      // Include the resolution itself
      narrativeUnit.push(resolution)
      usedEventIds.add(resolution.id)
      
      // Find the initial GAMBLE that started this cycle
      // Look for the most recent gamble before this resolution
      let associatedGamble: TimelineEvent | null = null
      for (let i = sortedEvents.length - 1; i >= 0; i--) {
        const event = sortedEvents[i]
        if (event.type === 'gamble' && 
            event.chapterNumber <= resolutionChapter && 
            !usedEventIds.has(event.id)) {
          associatedGamble = event
          break
        }
      }
      
      if (associatedGamble) {
        narrativeUnit.unshift(associatedGamble) // Add at beginning
        usedEventIds.add(associatedGamble.id)
        
        // Now find all events between this gamble and resolution that belong to this cycle
        const gambleChapter = associatedGamble.chapterNumber
        
        sortedEvents.forEach(event => {
          if (usedEventIds.has(event.id)) return
          
          // Include events between gamble and resolution that are part of this narrative
          if (event.chapterNumber >= gambleChapter && 
              event.chapterNumber <= resolutionChapter &&
              (event.type === 'decision' || event.type === 'reveal' || event.type === 'shift')) {
            narrativeUnit.push(event)
            usedEventIds.add(event.id)
          }
        })
        
        // Sort the narrative unit by chapter
        narrativeUnit.sort((a, b) => a.chapterNumber - b.chapterNumber)
      }
      
      // Create section for this narrative unit
      if (narrativeUnit.length > 0) {
        const earliestChapter = Math.min(...narrativeUnit.map(e => e.chapterNumber))
        const latestChapter = Math.max(...narrativeUnit.map(e => e.chapterNumber))
        
        // Create descriptive name based on the gamble and resolution
        let sectionName = `Narrative Unit ${narrativeUnitIndex}`
        if (associatedGamble && resolution) {
          // Try to create a more descriptive name from the events
          const gambleTitle = associatedGamble.title.length > 30 
            ? associatedGamble.title.substring(0, 30) + '...' 
            : associatedGamble.title
          sectionName = `${gambleTitle} → Resolution`
        }
        
        sections.push({
          type: 'section' as const,
          sectionType: `narrative-unit-${narrativeUnitIndex}`,
          sectionName,
          events: narrativeUnit,
          earliestChapter,
          latestChapter
        })
        
        narrativeUnitIndex++
      }
    })
    
    // Step 3: Handle orphaned events (events not part of complete GAMBLE->RESOLUTION cycles)
    const orphanedEvents = sortedEvents.filter(event => !usedEventIds.has(event.id))
    
    if (orphanedEvents.length > 0) {
      // Group orphaned events as connectors/transitions
      // These are events that set up future gambles or are consequences of past resolutions
      const orphanGroups: Array<{
        events: TimelineEvent[]
        startChapter: number
        endChapter: number
        type: 'setup' | 'consequence' | 'standalone'
      }> = []
      
      // Simple grouping by proximity (within 5 chapters of each other)
      let currentGroup: TimelineEvent[] = []
      
      orphanedEvents.forEach((event, index) => {
        if (currentGroup.length === 0) {
          currentGroup.push(event)
        } else {
          const lastEvent = currentGroup[currentGroup.length - 1]
          const chapterGap = event.chapterNumber - lastEvent.chapterNumber
          
          if (chapterGap <= 5) {
            currentGroup.push(event)
          } else {
            // End current group and start new one
            if (currentGroup.length > 0) {
              const groupStart = currentGroup[0].chapterNumber
              const groupEnd = currentGroup[currentGroup.length - 1].chapterNumber
              
              orphanGroups.push({
                events: [...currentGroup],
                startChapter: groupStart,
                endChapter: groupEnd,
                type: 'standalone' // Could be enhanced to detect setup vs consequence
              })
            }
            currentGroup = [event]
          }
        }
        
        // Handle last group
        if (index === orphanedEvents.length - 1 && currentGroup.length > 0) {
          const groupStart = currentGroup[0].chapterNumber
          const groupEnd = currentGroup[currentGroup.length - 1].chapterNumber
          
          orphanGroups.push({
            events: [...currentGroup],
            startChapter: groupStart,
            endChapter: groupEnd,
            type: 'standalone'
          })
        }
      })
      
      // Add orphan groups as connector sections
      orphanGroups.forEach((group, index) => {
        const sectionName = group.events.length === 1 
          ? `${group.events[0].title.length > 25 ? group.events[0].title.substring(0, 25) + '...' : group.events[0].title} (Transition)`
          : `Transition Events ${index + 1}`
        
        sections.push({
          type: 'section' as const,
          sectionType: `transition-${index + 1}`,
          sectionName,
          events: group.events,
          earliestChapter: group.startChapter,
          latestChapter: group.endChapter
        })
      })
    }
    
    // If no sections were created (no resolutions found), fall back to basic grouping
    if (sections.length === 0 && sortedEvents.length > 0) {
      sections.push({
        type: 'section' as const,
        sectionType: 'all-events',
        sectionName: `${arcName} Arc Events`,
        events: sortedEvents,
        earliestChapter: sortedEvents[0].chapterNumber,
        latestChapter: sortedEvents[sortedEvents.length - 1].chapterNumber
      })
    }

    // Sort sections by earliest chapter
    return sections.sort((a, b) => (a.earliestChapter || 999) - (b.earliestChapter || 999))
  }, [filteredEvents, arcName])

  // Optimize scroll functions with requestAnimationFrame
  const scrollToSection = useCallback((sectionType: string) => {
    requestAnimationFrame(() => {
      const sectionElement = document.getElementById(`timeline-section-${sectionType}`)
      if (sectionElement && timelineRef.current) {
        const container = timelineRef.current
        const elementLeft = sectionElement.offsetLeft
        const elementWidth = sectionElement.offsetWidth
        const containerWidth = container.offsetWidth
        
        // Center the section in view
        const scrollLeft = elementLeft - (containerWidth / 2) + (elementWidth / 2)
        
        container.scrollTo({
          left: Math.max(0, scrollLeft),
          behavior: 'smooth'
        })
      }
    })
  }, [])

  const scrollToChapter = useCallback((chapterNumber: number) => {
    // Find which section contains this chapter
    const eventWithChapter = filteredEvents.find(e => e.chapterNumber === chapterNumber)
    if (eventWithChapter) {
      // Find the section that contains this event
      const section = timelineSections.find(s => s.events.some(e => e.id === eventWithChapter.id))
      if (section) {
        // Expand the section's events automatically
        setExpandedSections(prev => new Set(prev).add(section.sectionType))
        
        // Scroll to the section first
        scrollToSection(section.sectionType)
        
        // After scrolling to section, scroll to the specific event within that section
        setTimeout(() => {
          requestAnimationFrame(() => {
            const eventElement = document.getElementById(`event-${eventWithChapter.id}`)
            if (eventElement) {
              eventElement.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center',
                inline: 'nearest' 
              })
              
              // Use CSS classes instead of direct style manipulation for better performance
              eventElement.classList.add('arc-timeline-highlight')
              setTimeout(() => {
                eventElement.classList.remove('arc-timeline-highlight')
              }, 3000)
            }
          })
        }, 500)
      }
    }
  }, [filteredEvents, timelineSections, scrollToSection])

  // Use useCallback for all event handlers to prevent recreation
  const toggleSectionExpansion = useCallback((sectionType: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev)
      if (newSet.has(sectionType)) {
        newSet.delete(sectionType)
      } else {
        newSet.add(sectionType)
      }
      return newSet
    })
  }, [])

  const toggleEventTypeFilter = useCallback((eventType: string) => {
    setSelectedEventTypes(prev => {
      const newSet = new Set(prev)
      if (newSet.has(eventType)) {
        newSet.delete(eventType)
      } else {
        newSet.add(eventType)
      }
      return newSet
    })
  }, [])

  const toggleCharacterFilter = useCallback((character: string) => {
    setSelectedCharacters(prev => {
      const newSet = new Set(prev)
      if (newSet.has(character)) {
        newSet.delete(character)
      } else {
        newSet.add(character)
      }
      return newSet
    })
  }, [])

  const clearAllFilters = useCallback(() => {
    setSelectedEventTypes(new Set())
    setSelectedCharacters(new Set())
  }, [])

  const toggleShowAllEvents = useCallback(() => {
    setShowAllEvents(prev => !prev)
  }, [])

  // Optimize modal functions
  const showEventModal = useCallback((event: TimelineEvent, targetElement: Element) => {
    const rect = targetElement.getBoundingClientRect()
    const modalWidth = 280
    const modalHeight = 150
    const spacing = 15
    
    // Calculate position relative to viewport
    let modalX = rect.left + rect.width / 2
    let modalY = rect.top - spacing
    
    // Horizontal boundary checking
    const rightOverflow = (modalX + modalWidth / 2) - (window.innerWidth - 20)
    const leftOverflow = (modalX - modalWidth / 2) - 20
    
    if (rightOverflow > 0) {
      modalX -= rightOverflow
    } else if (leftOverflow < 0) {
      modalX -= leftOverflow
    }
    
    // Vertical boundary checking - if not enough space above, show below
    if (modalY - modalHeight < 20) {
      modalY = rect.bottom + spacing
    }
    
    setGlobalModal({
      show: true,
      event,
      position: { x: modalX, y: modalY }
    })
  }, [])

  const hideEventModal = useCallback(() => {
    setGlobalModal({
      show: false,
      event: null,
      position: { x: 0, y: 0 }
    })
  }, [])

  const visibleSections = useMemo(() => {
    return showAllEvents ? timelineSections : timelineSections.slice(0, 4)
  }, [showAllEvents, timelineSections])

  // Memoize unique chapters for navigation
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
            Arc Timeline
          </Typography>
          <Button
            component={Link}
            href={`/events?arc=${arcName}`}
            size="small"
            color="primary"
          >
            View All Events
          </Button>
        </Box>

        {/* Arc Range Marker */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip
              label={`Arc Range: Chapters ${startChapter}-${endChapter}`}
              color="secondary"
              variant="filled"
              icon={<BookOpen size={16} />}
              sx={{ 
                fontWeight: 'bold',
              }}
            />
            <Chip
              label={`${filteredEvents.length} Event${filteredEvents.length !== 1 ? 's' : ''}`}
              color="primary"
              variant="outlined"
              icon={<Calendar size={16} />}
            />
            {(selectedEventTypes.size > 0 || selectedCharacters.size > 0) && (
              <Chip
                label={`${filteredEvents.length} Filtered`}
                color="info"
                variant="outlined"
                size="small"
              />
            )}
          </Box>
        </Box>

        {/* Filter Controls */}
        {(uniqueEventTypes.length > 0 || uniqueCharacters.length > 0) && (
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Filters:
              </Typography>
              {(selectedEventTypes.size > 0 || selectedCharacters.size > 0) && (
                <Button
                  size="small"
                  variant="outlined"
                  onClick={clearAllFilters}
                  color="secondary"
                >
                  Clear Filters
                </Button>
              )}
            </Box>

            {/* Event Type Filters */}
            {uniqueEventTypes.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                  Event Types:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {uniqueEventTypes.map(eventType => {
                    const EventTypeIcon = getEventTypeIcon(eventType)
                    const isSelected = selectedEventTypes.has(eventType)
                    return (
                      <Chip
                        key={eventType}
                        icon={<EventTypeIcon size={12} />}
                        label={getEventTypeLabel(eventType)}
                        size="small"
                        variant={isSelected ? "filled" : "outlined"}
                        color={getEventTypeColor(eventType)}
                        clickable
                        onClick={() => toggleEventTypeFilter(eventType)}
                        sx={{
                          transition: 'all 0.2s ease', // Reduced transition duration
                          '&:hover': {
                            transform: 'scale(1.05)'
                          }
                        }}
                      />
                    )
                  })}
                </Box>
              </Box>
            )}

            {/* Character Filters */}
            {uniqueCharacters.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                  Characters:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {uniqueCharacters.map(character => {
                    const isSelected = selectedCharacters.has(character)
                    return (
                      <Chip
                        key={character}
                        icon={<Users size={12} />}
                        label={character}
                        size="small"
                        variant={isSelected ? "filled" : "outlined"}
                        color="primary"
                        clickable
                        onClick={() => toggleCharacterFilter(character)}
                        sx={{
                          transition: 'all 0.2s ease', // Reduced transition duration
                          '&:hover': {
                            transform: 'scale(1.05)'
                          }
                        }}
                      />
                    )
                  })}
                </Box>
              </Box>
            )}
          </Box>
        )}

        {/* Timeline Container */}
        <Box sx={{ position: 'relative' }}>
          {/* Horizontal Timeline Line */}
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: 0,
              right: 0,
              height: '2px',
              backgroundColor: 'primary.main',
              opacity: 0.3,
              zIndex: 1
            }}
          />

          {/* Timeline Sections */}
          <Box 
            ref={timelineRef}
            sx={{ 
              display: 'flex', 
              overflowX: 'auto',
              gap: 3,
              pb: 2,
              minHeight: '220px',
              alignItems: 'flex-start',
              position: 'relative',
              zIndex: 2,
              scrollBehavior: 'smooth',
              // Performance optimizations for scrolling
              willChange: 'scroll-position',
              transform: 'translateZ(0)', // Force hardware acceleration
              '&::-webkit-scrollbar': {
                height: '8px',
              },
              '&::-webkit-scrollbar-track': {
                backgroundColor: 'rgba(0,0,0,0.1)',
                borderRadius: '4px',
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: 'rgba(0,0,0,0.3)',
                borderRadius: '4px',
                '&:hover': {
                  backgroundColor: 'rgba(0,0,0,0.5)',
                }
              }
            }}
          >
            {visibleSections.map((section, index) => (
              <ArcTimelineSection
                key={`${section.sectionType}-${index}`}
                section={section}
                index={index}
                expandedSections={expandedSections}
                toggleSectionExpansion={toggleSectionExpansion}
                showEventModal={showEventModal}
                hideEventModal={hideEventModal}
                theme={theme}
              />
            ))}
          </Box>

          {/* Show More Button */}
          {timelineSections.length > 4 && (
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Button
                variant="outlined"
                onClick={toggleShowAllEvents}
                size="small"
              >
                {showAllEvents 
                  ? 'Show Less' 
                  : `Show ${timelineSections.length - 4} More Section${timelineSections.length - 4 !== 1 ? 's' : ''}`
                }
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
              
              {/* Section Navigation */}
              {timelineSections.length > 1 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                    Jump to Section:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {timelineSections.slice(0, 5).map(section => (
                      <Chip
                        key={section.sectionType}
                        label={section.sectionName}
                        size="small"
                        variant="outlined"
                        color="primary"
                        clickable
                        onClick={() => scrollToSection(section.sectionType)}
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
            </Box>
          </>
        )}

        {/* Global Modal - Rendered at top level */}
        {globalModal.show && globalModal.event && (
          <Box
            sx={{
              position: 'fixed',
              left: globalModal.position.x,
              top: globalModal.position.y,
              transform: 'translate(-50%, -100%)',
              zIndex: 999999,
              width: '300px',
              maxWidth: 'calc(100vw - 40px)',
              backgroundColor: 'background.paper',
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 3,
              boxShadow: theme.shadows[12],
              p: 2.5,
              pointerEvents: 'none',
              backdropFilter: 'blur(8px)',
              // Add subtle gradient overlay for better depth
              background: theme.palette.mode === 'dark' 
                ? `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.grey[900]} 100%)`
                : `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.grey[50]} 100%)`,
              // Add border accent
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '3px',
                background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                borderRadius: '12px 12px 0 0'
              }
            }}
          >
            <Typography 
              variant="subtitle2" 
              fontWeight="bold" 
              sx={{ 
                mb: 1.5, 
                color: 'text.primary',
                fontSize: '1rem'
              }}
            >
              {globalModal.event.title}
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Chip
                label={`Chapter ${globalModal.event.chapterNumber}`}
                size="small"
                variant="outlined"
                color="primary"
                sx={{ 
                  fontSize: '0.75rem',
                  height: '24px',
                  fontWeight: 'medium'
                }}
              />
              {globalModal.event.type && (
                <Chip
                  icon={React.createElement(getEventTypeIcon(globalModal.event.type), { size: 12 })}
                  label={getEventTypeLabel(globalModal.event.type)}
                  size="small"
                  variant="filled"
                  color={getEventTypeColor(globalModal.event.type)}
                  sx={{ fontSize: '0.7rem', height: '24px' }}
                />
              )}
            </Box>

            <Typography 
              variant="body2" 
              color="text.primary"
              sx={{ 
                lineHeight: 1.5,
                fontSize: '0.875rem'
              }}
            >
              {globalModal.event.description || 'No description available'}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  )
})

export default ArcTimeline

// Memoized Arc Timeline Section Component (placeholder - using existing components)
const ArcTimelineSection = React.memo(function ArcTimelineSection({ 
  section, 
  index, 
  expandedSections, 
  toggleSectionExpansion, 
  showEventModal, 
  hideEventModal, 
  theme 
}: {
  section: any
  index: number
  expandedSections: Set<string>
  toggleSectionExpansion: (sectionType: string) => void
  showEventModal: (event: any, targetElement: Element) => void
  hideEventModal: () => void
  theme: any
}) {
  const isExpanded = expandedSections.has(section.sectionType)
  
  return (
    <Box
      id={`timeline-section-${section.sectionType}`}
      sx={{
        minWidth: '300px',
        maxWidth: '400px',
        position: 'relative'
      }}
    >
      {/* Section Header */}
      <Card
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`,
          border: `2px solid ${theme.palette.divider}`,
          borderRadius: '16px 16px 4px 4px',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          mb: 1,
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: theme.shadows[6],
            borderColor: theme.palette.primary.main
          }
        }}
        onClick={() => toggleSectionExpansion(section.sectionType)}
      >
        <CardContent sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ 
              color: 'primary.main',
              fontSize: '0.95rem'
            }}>
              {section.sectionName}
            </Typography>
            <Chip 
              label={`${section.events.length} events`}
              size="small"
              color="primary"
              variant="outlined"
            />
          </Box>
          
          {section.earliestChapter && section.latestChapter && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Chapters {section.earliestChapter}-{section.latestChapter}
            </Typography>
          )}
          
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
            <Box
              sx={{
                transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s ease'
              }}
            >
              <ArrowUpDown size={16} />
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Events Container */}
      <EventsInSection
        events={section.events}
        isExpanded={isExpanded}
        onShowModal={showEventModal}
        onHideModal={hideEventModal}
      />
    </Box>
  )
})

// Other components remain the same as original
function EventsInSection({ 
  events, 
  isExpanded = false, 
  onShowModal, 
  onHideModal 
}: {
  events: TimelineEvent[]
  isExpanded: boolean
  onShowModal: (event: TimelineEvent, targetElement: Element) => void
  onHideModal: () => void
}) {
  const { shouldHideSpoiler } = useSpoilerSettings()
  
  if (!isExpanded) {
    // Show just a preview of the first event when collapsed
    const firstEvent = events[0]
    if (!firstEvent) return null
    
    return (
      <Box sx={{ 
        opacity: 0.7,
        transform: 'scale(0.95)',
        transition: 'all 0.3s ease'
      }}>
        <TimelineSpoilerWrapper event={firstEvent}>
          <EventContent 
            event={firstEvent}
            onShowModal={onShowModal}
            onHideModal={onHideModal}
            isPreview={true}
          />
        </TimelineSpoilerWrapper>
      </Box>
    )
  }

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: 1.5,
      mt: 1
    }}>
      {events.map((event, eventIndex) => (
        <TimelineSpoilerWrapper key={event.id} event={event}>
          <EventContent 
            event={event}
            onShowModal={onShowModal}
            onHideModal={onHideModal}
            isPreview={false}
          />
        </TimelineSpoilerWrapper>
      ))}
    </Box>
  )
}

function TimelineSpoilerWrapper({ 
  event, 
  children 
}: {
  event: TimelineEvent
  children: React.ReactNode
}) {
  const [isRevealed, setIsRevealed] = useState(false)
  const { userProgress } = useProgress()
  const { settings } = useSpoilerSettings()

  const shouldHideSpoiler = () => {
    // First check if spoiler settings say to show all spoilers
    if (settings.showAllSpoilers) {
      return false
    }

    // Determine the effective progress to use for spoiler checking
    const effectiveProgress = settings.chapterTolerance > 0 
      ? settings.chapterTolerance 
      : userProgress

    // Use event's spoiler flag if available, otherwise use chapter comparison
    if (event.isSpoiler !== undefined) {
      return event.isSpoiler && event.chapterNumber > effectiveProgress
    }

    // Default: hide if event chapter is ahead of user progress
    return event.chapterNumber > effectiveProgress
  }

  const handleReveal = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsRevealed(true)
  }

  // Always show content if manually revealed
  if (isRevealed) {
    return <>{children}</>
  }

  // If spoiler should not be hidden, show content directly
  if (!shouldHideSpoiler()) {
    return <>{children}</>
  }

  // Show spoiler warning with reveal button
  return (
    <Box
      sx={{
        position: 'relative',
        border: '2px dashed',
        borderColor: 'warning.main',
        borderRadius: 2,
        p: 2,
        background: 'rgba(255, 152, 0, 0.1)',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        '&:hover': {
          borderColor: 'warning.dark',
          background: 'rgba(255, 152, 0, 0.15)'
        }
      }}
      onClick={handleReveal}
    >
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        gap: 1,
        minHeight: '60px'
      }}>
        <AlertTriangle size={20} color="#ed6c02" />
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="body2" sx={{ fontWeight: 600, color: 'warning.dark' }}>
            Spoiler Content
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Chapter {event.chapterNumber} • Click to reveal
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}

function EventContent({ 
  event, 
  onShowModal, 
  onHideModal, 
  isPreview = false 
}: {
  event: TimelineEvent
  onShowModal: (event: TimelineEvent, targetElement: Element) => void
  onHideModal: () => void
  isPreview?: boolean
}) {
  const eventRef = useRef<HTMLDivElement>(null)
  const EventTypeIcon = getEventTypeIcon(event.type)

  const handleMouseEnter = useCallback(() => {
    if (eventRef.current && !isPreview) {
      onShowModal(event, eventRef.current)
    }
  }, [event, onShowModal, isPreview])

  const handleMouseLeave = useCallback(() => {
    if (!isPreview) {
      onHideModal()
    }
  }, [onHideModal, isPreview])

  return (
    <Card
      ref={eventRef}
      id={`event-${event.id}`}
      sx={{
        cursor: isPreview ? 'default' : 'pointer',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        transition: 'all 0.3s ease',
        background: `linear-gradient(135deg, ${isPreview ? 'transparent' : 'background.paper'} 0%, ${'background.default'} 100%)`,
        transform: isPreview ? 'scale(0.9)' : 'scale(1)',
        opacity: isPreview ? 0.8 : 1,
        '&:hover': isPreview ? {} : {
          transform: 'translateY(-2px) scale(1.02)',
          boxShadow: 6,
          borderColor: `${getEventTypeColor(event.type)}.main`
        }
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <CardContent sx={{ p: isPreview ? 1.5 : 2 }}>
        {/* Event Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, minWidth: 0 }}>
            <EventTypeIcon size={16} />
            <Typography 
              variant={isPreview ? "caption" : "subtitle2"} 
              sx={{ 
                fontWeight: 600,
                color: `${getEventTypeColor(event.type)}.main`,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {event.title}
            </Typography>
          </Box>
          <Chip
            label={`Ch. ${event.chapterNumber}`}
            size="small"
            variant="outlined"
            color="primary"
            sx={{ 
              fontSize: '0.7rem',
              height: isPreview ? '18px' : '24px',
              flexShrink: 0,
              ml: 1
            }}
          />
        </Box>

        {/* Event Type and Characters */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: isPreview ? 0 : 1 }}>
          {event.type && (
            <Chip
              icon={<EventTypeIcon size={12} />}
              label={getEventTypeLabel(event.type)}
              size="small"
              variant="filled"
              color={getEventTypeColor(event.type)}
              sx={{ 
                fontSize: '0.65rem',
                height: isPreview ? '16px' : '20px'
              }}
            />
          )}
          
          {!isPreview && event.characters && event.characters.length > 0 && (
            <Chip
              icon={<Users size={12} />}
              label={`${event.characters.length} character${event.characters.length !== 1 ? 's' : ''}`}
              size="small"
              variant="outlined"
              color="secondary"
              sx={{ 
                fontSize: '0.65rem',
                height: '20px'
              }}
            />
          )}
        </Box>

        {/* Description - only show in full view */}
        {!isPreview && event.description && (
          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ 
              fontSize: '0.8rem',
              lineHeight: 1.4,
              mt: 1,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}
          >
            {event.description}
          </Typography>
        )}

        {/* Characters list - only in full view */}
        {!isPreview && event.characters && event.characters.length > 0 && (
          <Box sx={{ 
            mt: 1, 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: 0.5,
            maxHeight: '40px',
            overflow: 'hidden'
          }}>
            {event.characters.slice(0, 3).map((character, index) => (
              <Chip
                key={`${event.id}-${character}-${index}`}
                label={character}
                size="small"
                variant="outlined"
                color="default"
                sx={{ 
                  fontSize: '0.6rem',
                  height: '18px'
                }}
              />
            ))}
            {event.characters.length > 3 && (
              <Chip
                label={`+${event.characters.length - 3} more`}
                size="small"
                variant="outlined"
                color="secondary"
                sx={{ 
                  fontSize: '0.6rem',
                  height: '18px'
                }}
              />
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  )
}

