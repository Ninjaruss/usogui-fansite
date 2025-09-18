'use client'

import React, { useState, useCallback, useRef } from 'react'
import {
  Box,
  TextInput,
  Paper,
  Badge,
  Group,
  Stack,
  Loader,
  Text,
  ScrollArea,
  useMantineTheme
} from '@mantine/core'
import { Search, BookOpen, Users, Zap, Shield, FileText, Dices, Image as MediaIcon, Quote } from 'lucide-react'
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

const SPOILER_COLOR_FALLBACK = '#f57c00'

export const SearchBar: React.FC = () => {
  const theme = useMantineTheme()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const { userProgress } = useProgress()
  const router = useRouter()
  const searchTimeout = useRef<NodeJS.Timeout | null>(null)

  const accent = theme.other?.usogui?.red || theme.colors.red[5]
  const surface = theme.other?.usogui?.black || '#0a0a0a'

  const withAlpha = (color: string, alpha: number, fallback: string) => {
    try {
      return theme.fn?.rgba?.(color, alpha) ?? fallback
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
      setShowResults(false)
      return
    }

    setLoading(true)
    try {
      const response = await api.search(searchQuery, undefined, userProgress)

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
    setShowResults(false)
    setQuery('')
    router.push(`/${result.type}s/${result.id}`)
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      setShowResults(false)
      setQuery('')
    }
  }

  return (
    <Box style={{ position: 'relative', width: '100%' }}>
      <TextInput
        value={query}
        onChange={handleInputChange}
        onFocus={() => query.length >= 2 && setShowResults(true)}
        onKeyDown={handleKeyDown}
        placeholder="Discover characters, arcs, gambles, events, and more..."
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
              backgroundColor: withAlpha(surface, 0.92, surface)
            },
            '&:focus': {
              borderColor: accent,
              boxShadow: focusShadow,
              backgroundColor: withAlpha(surface, 0.95, surface)
            }
          },
          section: {
            color: accent
          }
        }}
      />

      <AnimatePresence>
        {showResults && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <Paper
              withBorder={false}
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                zIndex: 20,
                marginTop: '0.75rem',
                borderRadius: '1rem',
                maxHeight: 400,
                overflow: 'hidden',
                backgroundColor: dropdownBg,
                border: `1px solid ${borderColor}`,
                backdropFilter: 'blur(10px)',
                boxShadow: dropdownShadow
              }}
            >
              {results.length > 0 ? (
                <ScrollArea.Autosize mah={400} type="scroll">
                  <Stack gap={0} style={{ backgroundColor: 'transparent' }}>
                    {results.map((result, index) => {
                      const typeColor = getTypeColor(result.type)
                      const hoverColor = withAlpha(typeColor, 0.18, 'rgba(225, 29, 72, 0.18)')
                      const activeColor = withAlpha(typeColor, 0.26, 'rgba(225, 29, 72, 0.26)')
                      const badgeColor = withAlpha(typeColor, 0.32, 'rgba(225, 29, 72, 0.32)')
                      const spoilerColor = withAlpha(
                        theme.other?.usogui?.event || SPOILER_COLOR_FALLBACK,
                        0.28,
                        'rgba(245, 124, 0, 0.28)'
                      )
                      return (
                        <Box
                          key={`${result.type}-${result.id}`}
                          component="button"
                          onClick={() => handleResultClick(result)}
                          style={{
                            border: 'none',
                            background: 'transparent',
                            textAlign: 'left',
                            padding: '0.85rem 1.25rem',
                            display: 'flex',
                            gap: '0.85rem',
                            alignItems: 'flex-start',
                            borderBottom: index === results.length - 1 ? 'none' : `1px solid ${borderColor}`,
                            color: '#ffffff',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s ease'
                          }}
                          onMouseEnter={(event) => {
                            event.currentTarget.style.backgroundColor = hoverColor
                          }}
                          onMouseDown={(event) => {
                            event.currentTarget.style.backgroundColor = activeColor
                          }}
                          onMouseLeave={(event) => {
                            event.currentTarget.style.backgroundColor = 'transparent'
                          }}
                          onMouseUp={(event) => {
                            if (event.currentTarget.matches(':hover')) {
                              event.currentTarget.style.backgroundColor = hoverColor
                            } else {
                              event.currentTarget.style.backgroundColor = 'transparent'
                            }
                          }}
                          onFocus={(event) => {
                            event.currentTarget.style.backgroundColor = hoverColor
                          }}
                          onBlur={(event) => {
                            event.currentTarget.style.backgroundColor = 'transparent'
                          }}
                        >
                          <Box style={{ color: typeColor, marginTop: '0.15rem' }}>
                            {getTypeIcon(result.type)}
                          </Box>
                          <Box style={{ flex: 1 }}>
                            <Group gap="sm" wrap="nowrap" align="center" style={{ marginBottom: '0.25rem' }}>
                              <Text
                                fw={600}
                                size="sm"
                                style={{
                                  color: '#ffffff',
                                  flex: 1,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                {result.title}
                              </Text>
                              <Badge
                                size="sm"
                                variant="light"
                                style={{
                                  backgroundColor: badgeColor,
                                  color: '#ffffff',
                                  textTransform: 'capitalize'
                                }}
                              >
                                {result.type}
                              </Badge>
                              {result.hasSpoilers && (
                                <Badge
                                  size="sm"
                                  variant="light"
                                  style={{
                                    backgroundColor: spoilerColor,
                                    color: '#ffffff'
                                  }}
                                >
                                  Spoilers
                                </Badge>
                              )}
                            </Group>
                            <Text
                              size="xs"
                              style={{
                                color: mutedText,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {result.description}
                            </Text>
                          </Box>
                        </Box>
                      )
                    })}
                  </Stack>
                </ScrollArea.Autosize>
              ) : (
                <Box style={{ padding: '1.5rem', textAlign: 'center' }}>
                  <Text size="sm" style={{ color: mutedText }}>
                    {query.trim().length < 2 ? 'Type at least 2 characters to search' : 'No results found'}
                  </Text>
                </Box>
              )}
            </Paper>
          </motion.div>
        )}
      </AnimatePresence>

      {showResults && (
        <Box
          onClick={() => setShowResults(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10,
            background: 'transparent'
          }}
        />
      )}
    </Box>
  )
}
