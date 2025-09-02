'use client'

import React, { useState, useCallback, useRef } from 'react'
import {
  TextField,
  InputAdornment,
  Paper,
  List,
  ListItem,
  ListItemText,
  Chip,
  Box,
  CircularProgress,
  Typography
} from '@mui/material'
import { Search, BookOpen, Users, Crown, Zap } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { api } from '../lib/api'
import { useAuth } from '../providers/AuthProvider'
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

export const SearchBar: React.FC = () => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const { user } = useAuth()
  const router = useRouter()
  const searchTimeout = useRef<NodeJS.Timeout | null>(null)

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'character':
        return <Users size={16} />
      case 'arc':
        return <BookOpen size={16} />
      case 'gamble':
        return <Crown size={16} />
      case 'event':
        return <Zap size={16} />
      default:
        return <Search size={16} />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'character':
        return '#1976d2' // theme.palette.usogui.character
      case 'arc':
        return '#dc004e' // theme.palette.usogui.arc
      case 'gamble':
        return '#d32f2f' // theme.palette.usogui.gamble
      case 'event':
        return '#f57c00' // theme.palette.usogui.event
      case 'guide':
        return '#388e3c' // theme.palette.usogui.guide
      case 'media':
        return '#7b1fa2' // theme.palette.usogui.media
      case 'quote':
        return '#00796b' // theme.palette.usogui.quote
      default:
        return '#e11d48' // theme.palette.usogui.red
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
      const response = await api.search(
        searchQuery,
        undefined,
        user?.userProgress
      )
      setResults(response.results)
      setShowResults(true)
    } catch (error) {
      console.error('Search failed:', error)
      setResults([])
      setShowResults(false)
    } finally {
      setLoading(false)
    }
  }, [user?.userProgress])

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
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
    
    const path = `/${result.type}s/${result.id}`
    router.push(path)
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      setShowResults(false)
      setQuery('')
    }
  }

  return (
    <Box sx={{ position: 'relative', width: '100%' }}>
      <TextField
        fullWidth
        variant="outlined"
        placeholder="Search characters, arcs, gambles, events..."
        value={query}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => query.length >= 2 && setShowResults(true)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              {loading ? (
                <CircularProgress 
                  size={20} 
                  sx={{ 
                    color: '#e11d48' 
                  }} 
                />
              ) : (
                <Search 
                  size={20} 
                  color="rgba(255, 255, 255, 0.7)" 
                />
              )}
            </InputAdornment>
          ),
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
            backgroundColor: '#0a0a0a', // Use solid Usogui black instead of transparent
            border: '1px solid rgba(225, 29, 72, 0.2)',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.3s ease',
            '&:hover': {
              borderColor: 'rgba(225, 29, 72, 0.5)',
              backgroundColor: 'rgba(10, 10, 10, 0.95)',
            },
            '&.Mui-focused': {
              borderColor: '#e11d48',
              backgroundColor: 'rgba(10, 10, 10, 0.95)',
              boxShadow: '0 0 0 2px rgba(225, 29, 72, 0.2)',
            },
            '& .MuiOutlinedInput-notchedOutline': {
              border: 'none', // Remove default border since we're using custom border
            }
          },
          '& .MuiInputBase-input': {
            color: '#ffffff !important',
            '&::placeholder': {
              color: 'rgba(255, 255, 255, 0.7) !important',
              opacity: 1,
            }
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
              elevation={0}
              sx={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                zIndex: 1300,
                maxHeight: 400,
                overflow: 'auto',
                mt: 1,
                borderRadius: 2,
                backgroundColor: '#0a0a0a !important', // Force Usogui black background
                border: '1px solid rgba(225, 29, 72, 0.2)',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 20px 25px -5px rgba(225, 29, 72, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.4)',
              }}
            >
              {results.length > 0 ? (
                <List 
                  disablePadding
                  sx={{
                    backgroundColor: 'transparent',
                    '& .MuiListItem-root': {
                      backgroundColor: 'transparent !important',
                    }
                  }}
                >
                  {results.map((result) => (
                    <ListItem
                      key={`${result.type}-${result.id}`}
                      component="button"
                      onClick={() => handleResultClick(result)}
                      sx={{
                        borderBottom: '1px solid rgba(225, 29, 72, 0.2)',
                        color: '#ffffff !important',
                        backgroundColor: 'transparent !important',
                        '&:hover': {
                          backgroundColor: 'rgba(225, 29, 72, 0.1) !important'
                        },
                        '&:last-child': {
                          borderBottom: 'none'
                        },
                        '&.MuiButtonBase-root': {
                          backgroundColor: 'transparent !important',
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                        <Box sx={{ color: getTypeColor(result.type) }}>
                          {getTypeIcon(result.type)}
                        </Box>
                      </Box>
                      <ListItemText
                        sx={{
                          '& .MuiListItemText-primary': {
                            color: '#ffffff !important',
                          },
                          '& .MuiListItemText-secondary': {
                            color: 'rgba(255, 255, 255, 0.7) !important',
                          }
                        }}
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography 
                              variant="subtitle2"
                              sx={{ color: '#ffffff !important' }}
                            >
                              {result.title}
                            </Typography>
                            <Chip
                              size="small"
                              label={result.type}
                              sx={{ 
                                fontSize: '0.75rem',
                                backgroundColor: getTypeColor(result.type),
                                color: '#ffffff',
                                fontWeight: 500,
                                border: 'none'
                              }}
                            />
                            {result.hasSpoilers && (
                              <Chip
                                size="small"
                                label="Spoilers"
                                sx={{
                                  fontSize: '0.75rem',
                                  backgroundColor: '#f57c00',
                                  color: '#ffffff',
                                  fontWeight: 500,
                                  border: 'none'
                                }}
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          <Typography
                            variant="body2"
                            sx={{
                              color: 'rgba(255, 255, 255, 0.7) !important',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              maxWidth: '100%'
                            }}
                          >
                            {result.description}
                          </Typography>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Box sx={{ 
                  p: 3, 
                  textAlign: 'center',
                  backgroundColor: 'transparent !important'
                }}>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: 'rgba(255, 255, 255, 0.7) !important'
                    }}
                  >
                    {query.trim().length < 2 
                      ? 'Type at least 2 characters to search'
                      : 'No results found'
                    }
                  </Typography>
                </Box>
              )}
            </Paper>
          </motion.div>
        )}
      </AnimatePresence>

      {showResults && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1200,
            backgroundColor: 'transparent'
          }}
          onClick={() => setShowResults(false)}
        />
      )}
    </Box>
  )
}