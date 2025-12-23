'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'
import {
  Box,
  TextInput,
  Paper,
  Badge,
  Button,
  Group,
  Stack,
  Loader,
  Text,
  ScrollArea,
  useMantineTheme,
  rgba
} from '@mantine/core'
import { Search, BookOpen, Users, Zap, Shield, FileText, Dices, Image as MediaIcon, Quote, TrendingUp, Clock, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { api } from '../lib/api'
import { useProgress } from '../providers/ProgressProvider'
import { motion, AnimatePresence } from 'motion/react'

interface SearchResult {
  id: number
  type: string
  title: string
  description: string
  score: number
  hasSpoilers: boolean
  slug: string
  metadata?: any
}

// Helper function to get display title with chapter number for chapter results
const getDisplayTitle = (result: SearchResult): string => {
  if (result.type === 'chapter' && result.metadata?.chapterNumber) {
    return `Ch. ${result.metadata.chapterNumber} - ${result.title}`
  }
  return result.title
}

interface TrendingData {
  characters?: Array<{
    id: number
    name: string
    description?: string
    viewCount: number
    recentViewCount: number
  }>
  gambles?: Array<{
    id: number
    name: string
    rules: string
    viewCount: number
    recentViewCount: number
  }>
  guides?: Array<{
    id: number
    title: string
    description: string
    viewCount: number
    recentViewCount: number
    author: { username: string }
  }>
  events?: Array<{
    id: number
    title: string
    description: string
    viewCount: number
    recentViewCount: number
  }>
}

interface EnhancedSearchBarProps {
  trendingData?: TrendingData
}

const SPOILER_COLOR_FALLBACK = '#f57c00'

// Fallback popular searches if no trending data is available
const FALLBACK_POPULAR_SEARCHES = [
  { term: 'Baku Madarame', type: 'character' },
  { term: 'Hal', type: 'character' },
  { term: 'Kaji Takaomi', type: 'character' },
  { term: 'Protoporos', type: 'gamble' },
  { term: 'Air Poker', type: 'gamble' },
  { term: 'Surpassing the Leader', type: 'arc' },
  { term: 'Kakerou', type: 'organization' }
]

export const EnhancedSearchBar: React.FC<EnhancedSearchBarProps> = ({ trendingData }) => {
  const theme = useMantineTheme()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const { userProgress } = useProgress()
  const router = useRouter()
  const searchTimeout = useRef<NodeJS.Timeout | null>(null)
  const searchContainerRef = useRef<HTMLDivElement>(null)

  const accent = theme.other?.usogui?.red || theme.colors.red[5]
  const surface = theme.other?.usogui?.black || '#0a0a0a'

  const withAlpha = (color: string, alpha: number, fallback: string) => {
    try {
      return rgba(color, alpha)
    } catch (error) {
      return fallback
    }
  }

  const borderColor = withAlpha(accent, 0.22, 'rgba(225, 29, 72, 0.22)')
  const borderHoverColor = withAlpha(accent, 0.48, 'rgba(225, 29, 72, 0.48)')
  const focusShadow = `0 0 0 2px ${withAlpha(accent, 0.18, 'rgba(225, 29, 72, 0.18)')}`
  const dropdownBg = withAlpha(surface, 0.96, surface)
  const dropdownShadow = `0 20px 25px -5px ${withAlpha(accent, 0.35, 'rgba(225, 29, 72, 0.35)')}, 0 10px 10px -5px rgba(0, 0, 0, 0.45)`
  const mutedText = 'rgba(255, 255, 255, 0.7)'

  // Load recent searches from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('usogui-recent-searches')
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored))
      } catch (e) {
        // Invalid JSON, ignore
      }
    }
  }, [])

  // Handle clicking outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }

    if (showResults) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [showResults])

  const addToRecentSearches = (searchTerm: string) => {
    const updated = [searchTerm, ...recentSearches.filter(s => s !== searchTerm)].slice(0, 5)
    setRecentSearches(updated)
    localStorage.setItem('usogui-recent-searches', JSON.stringify(updated))
  }

  // Generate popular searches from trending data
  const getPopularSearches = () => {
    if (!trendingData) {
      return FALLBACK_POPULAR_SEARCHES
    }

    const popular: { term: string; type: string }[] = []

    // Add top characters (sorted by view count)
    if (trendingData.characters) {
      const topCharacters = [...trendingData.characters]
        .sort((a, b) => b.recentViewCount - a.recentViewCount)
        .slice(0, 3)
      topCharacters.forEach(char => {
        popular.push({ term: char.name, type: 'character' })
      })
    }

    // Add top gambles (sorted by view count)
    if (trendingData.gambles) {
      const topGambles = [...trendingData.gambles]
        .sort((a, b) => b.recentViewCount - a.recentViewCount)
        .slice(0, 2)
      topGambles.forEach(gamble => {
        popular.push({ term: gamble.name, type: 'gamble' })
      })
    }

    // Add top guides (sorted by view count)
    if (trendingData.guides) {
      const topGuides = [...trendingData.guides]
        .sort((a, b) => b.recentViewCount - a.recentViewCount)
        .slice(0, 2)
      topGuides.forEach(guide => {
        popular.push({ term: guide.title, type: 'guide' })
      })
    }

    // Add top events (sorted by view count)
    if (trendingData.events) {
      const topEvents = [...trendingData.events]
        .sort((a, b) => b.recentViewCount - a.recentViewCount)
        .slice(0, 2)
      topEvents.forEach(event => {
        popular.push({ term: event.title, type: 'event' })
      })
    }

    // Return limited number of items (max 8-10 for good UX)
    return popular.slice(0, 9)
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'character':
        return <Users size={16} />
      case 'organization':
        return <Shield size={16} />
      case 'arc':
        return <BookOpen size={16} />
      case 'gamble':
        return <Dices size={16} />
      case 'event':
        return <Zap size={16} />
      case 'chapter':
        return <FileText size={16} />
      case 'media':
        return <MediaIcon size={16} />
      case 'quote':
        return <Quote size={16} />
      default:
        return <Search size={16} />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'character':
        return theme.other?.usogui?.character || '#1976d2'
      case 'organization':
        return theme.other?.usogui?.purple || '#7c3aed'
      case 'arc':
        return theme.other?.usogui?.arc || '#dc004e'
      case 'gamble':
        return theme.other?.usogui?.gamble || '#d32f2f'
      case 'event':
        return theme.other?.usogui?.event || '#f57c00'
      case 'chapter':
        return theme.colors.gray?.[5] || '#607d8b'
      case 'guide':
        return theme.other?.usogui?.guide || '#388e3c'
      case 'media':
        return theme.other?.usogui?.media || '#7b1fa2'
      case 'quote':
        return theme.other?.usogui?.quote || '#00796b'
      default:
        return accent
    }
  }

  const performSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.trim().length < 2) {
      setResults([])
      setShowResults(true) // Show suggestions when no query
      return
    }

    setLoading(true)
    try {
      const response = await api.search({
        query: searchQuery,
        userProgress
      })

      const priorityOrder = ['character', 'organization', 'arc', 'gamble', 'event', 'chapter']
      const sortedResults = response.results.sort((a, b) => {
        const aPriority = priorityOrder.indexOf(a.type)
        const bPriority = priorityOrder.indexOf(b.type)

        if (aPriority !== -1 && bPriority !== -1) {
          return aPriority - bPriority
        }

        if (aPriority !== -1) return -1
        if (bPriority !== -1) return 1
        return 0
      })

      setResults(sortedResults)
      setShowResults(true)
    } catch (error) {
      console.error('Search failed:', error)
      setResults([])
      setShowResults(false)
    } finally {
      setLoading(false)
    }
  }, [userProgress])

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.currentTarget.value
    setQuery(value)

    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current)
    }

    searchTimeout.current = setTimeout(() => {
      performSearch(value)
    }, 300)
  }

  const handleResultClick = (result: SearchResult) => {
    addToRecentSearches(result.title)
    setShowResults(false)
    setQuery('')
    router.push(`/${result.type}s/${result.id}`)
  }

  const handleSuggestionClick = (term: string) => {
    setQuery(term)
    addToRecentSearches(term)
    performSearch(term)
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      setShowResults(false)
      setQuery('')
    }
  }

  const renderSuggestions = () => {
    if (query.length >= 2) return null

    return (
      <Stack gap="md" style={{ padding: '1rem' }}>
        {/* Recent Searches */}
        {recentSearches.length > 0 && (
          <Box>
            <Group gap="xs" style={{ marginBottom: '0.75rem' }}>
              <Clock size={16} style={{ color: mutedText }} />
              <Text size="sm" fw={600} style={{ color: mutedText }}>
                Recent Searches
              </Text>
            </Group>
            <Group gap="xs">
              {recentSearches.map((search, index) => (
                <Badge
                  key={index}
                  size="sm"
                  variant="light"
                  style={{
                    backgroundColor: withAlpha(accent, 0.15, 'rgba(225, 29, 72, 0.15)'),
                    color: '#ffffff',
                    cursor: 'pointer',
                    border: `1px solid ${withAlpha(accent, 0.3, 'rgba(225, 29, 72, 0.3)')}`,
                    borderColor: accent
                  }}
                  onClick={() => handleSuggestionClick(search)}
                >
                  {search}
                </Badge>
              ))}
            </Group>
          </Box>
        )}

        {/* Popular Searches */}
        <Box>
          <Group gap="xs" style={{ marginBottom: '0.75rem' }}>
            <TrendingUp size={16} style={{ color: mutedText }} />
            <Text size="sm" fw={600} style={{ color: mutedText }}>
              Popular Searches
            </Text>
          </Group>
          <Group gap="xs" style={{ flexWrap: 'wrap' }}>
            {getPopularSearches().map((item, index) => (
              <Badge
                key={index}
                size="sm"
                variant="light"
                leftSection={getTypeIcon(item.type)}
                style={{
                  backgroundColor: withAlpha(getTypeColor(item.type), 0.15, 'rgba(225, 29, 72, 0.15)'),
                  color: '#ffffff',
                  cursor: 'pointer',
                  border: `1px solid ${withAlpha(getTypeColor(item.type), 0.3, 'rgba(225, 29, 72, 0.3)')}`,
                  borderColor: getTypeColor(item.type)
                }}
                onClick={() => handleSuggestionClick(item.term)}
              >
                {item.term}
              </Badge>
            ))}
          </Group>
        </Box>
      </Stack>
    )
  }

  return (
    <Box ref={searchContainerRef} style={{ position: 'relative', width: '100%' }}>
      <TextInput
        value={query}
        onChange={handleInputChange}
        onFocus={() => setShowResults(true)}
        onKeyDown={handleKeyDown}
        placeholder="Discover characters, arcs, gambles, events, and more..."
        aria-label="Search the Usogui database"
        radius="xl"
        size="md"
        leftSection={
          loading ? <Loader size="sm" color={accent} /> : <Search size={20} color={mutedText} />
        }
        leftSectionPointerEvents="none"
        styles={{
          input: {
            backgroundColor: surface,
            border: `1px solid ${borderColor}`,
            color: '#ffffff',
            transition: 'all 0.3s ease',
            paddingLeft: '3rem',
            '::placeholder': {
              color: mutedText
            },
            '&:hover': {
              borderColor: borderHoverColor,
            },
            '&:focus': {
              borderColor: accent,
              boxShadow: focusShadow
            }
          }
        }}
      />

      <AnimatePresence>
        {showResults && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              zIndex: 1000,
              marginTop: '0.5rem'
            }}
          >
            <Paper
              style={{
                backgroundColor: dropdownBg,
                border: `1px solid ${borderColor}`,
                borderRadius: '0.75rem',
                boxShadow: dropdownShadow,
                backdropFilter: 'blur(8px)',
                maxHeight: '400px',
                overflow: 'hidden'
              }}
            >
              {query.length < 2 ? (
                renderSuggestions()
              ) : (
                <ScrollArea style={{ maxHeight: '350px' }}>
                  <Stack gap={0}>
                    {results.length === 0 && !loading ? (
                      <Box style={{ padding: '1.5rem', textAlign: 'center' }}>
                        <Text size="sm" c="dimmed" mb="xs">
                          No results found for "{query}"
                        </Text>
                        <Text size="xs" c="dimmed">
                          Try a different spelling, or browse Characters, Gambles, or Arcs
                        </Text>
                      </Box>
                    ) : (
                      <>
                        {results.slice(0, 8).map((result, index) => (
                          <motion.div
                            key={`${result.type}-${result.id}-${index}`}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.2, delay: index * 0.05 }}
                          >
                            <Box
                              className="search-result-item"
                              style={{
                                padding: '0.75rem 1rem',
                                cursor: 'pointer',
                                borderBottom: `1px solid ${borderColor}`
                              }}
                              onClick={() => handleResultClick(result)}
                            >
                              <Group gap="sm" align="flex-start">
                                <Box style={{ color: getTypeColor(result.type), marginTop: '0.2rem' }}>
                                  {getTypeIcon(result.type)}
                                </Box>
                                <Box style={{ flex: 1, minWidth: 0 }}>
                                  <Group gap="xs" align="center" style={{ marginBottom: '0.25rem' }}>
                                    <Text fw={600} size="sm" style={{ color: '#ffffff' }}>
                                      {getDisplayTitle(result)}
                                    </Text>
                                    <Badge
                                      size="xs"
                                      variant="light"
                                      style={{
                                        backgroundColor: withAlpha(getTypeColor(result.type), 0.2, 'rgba(225, 29, 72, 0.2)'),
                                        color: getTypeColor(result.type),
                                        textTransform: 'capitalize'
                                      }}
                                    >
                                      {result.type}
                                    </Badge>
                                    {result.hasSpoilers && (
                                      <Badge
                                        size="xs"
                                        variant="filled"
                                        style={{
                                          backgroundColor: SPOILER_COLOR_FALLBACK,
                                          color: '#ffffff'
                                        }}
                                      >
                                        Spoiler
                                      </Badge>
                                    )}
                                  </Group>
                                  <Text
                                    size="xs"
                                    c="dimmed"
                                    style={{
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      display: '-webkit-box',
                                      WebkitLineClamp: 2,
                                      WebkitBoxOrient: 'vertical'
                                    }}
                                  >
                                    {result.description}
                                  </Text>
                                </Box>
                              </Group>
                            </Box>
                          </motion.div>
                        ))}
                        {/* View all results link */}
                        <Box
                          style={{
                            padding: '0.75rem 1rem',
                            borderTop: `1px solid ${borderColor}`,
                            backgroundColor: withAlpha(accent, 0.05, 'rgba(225, 29, 72, 0.05)')
                          }}
                        >
                          <Button
                            variant="subtle"
                            fullWidth
                            rightSection={<ArrowRight size={16} />}
                            onClick={() => {
                              setShowResults(false)
                              router.push(`/search?q=${encodeURIComponent(query)}`)
                            }}
                            style={{
                              color: accent,
                              fontWeight: 600
                            }}
                          >
                            View all {results.length > 8 ? `${results.length}+ ` : ''}results for "{query}"
                          </Button>
                        </Box>
                      </>
                    )}
                  </Stack>
                </ScrollArea>
              )}
            </Paper>
          </motion.div>
        )}
      </AnimatePresence>

    </Box>
  )
}
