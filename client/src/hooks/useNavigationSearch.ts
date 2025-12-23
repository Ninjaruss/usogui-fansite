'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '../lib/api'
import { useProgress } from '../providers/ProgressProvider'

interface SearchResult {
  id: number
  type: string
  title: string
  description?: string
  score?: number
  hasSpoilers?: boolean
  slug?: string
  metadata?: Record<string, unknown>
}

export interface UseNavigationSearchReturn {
  searchValue: string
  setSearchValue: (value: string) => void
  searchResults: SearchResult[]
  searchLoading: boolean
  searchFocused: boolean
  setSearchFocused: (focused: boolean) => void
  showSearchResults: boolean
  setShowSearchResults: (show: boolean) => void
  handleSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleSearchResultClick: (result: SearchResult) => void
  handleSearchKeyDown: (e: React.KeyboardEvent) => void
  handleSearchSubmit: (e: React.FormEvent) => void
  shouldShowSearchDropdown: boolean
}

export function useNavigationSearch(): UseNavigationSearchReturn {
  const router = useRouter()
  const { userProgress } = useProgress()
  const [searchValue, setSearchValue] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [showSearchResults, setShowSearchResults] = useState(false)
  const searchTimeout = useRef<NodeJS.Timeout | null>(null)

  const trimmedSearchValue = searchValue.trim()
  const shouldShowSearchDropdown = searchFocused && (showSearchResults || trimmedSearchValue.length < 2)

  // Cleanup search timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current)
      }
    }
  }, [])

  const performSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([])
      setShowSearchResults(false)
      return
    }

    setSearchLoading(true)
    try {
      const response = await api.search({
        query: searchQuery,
        userProgress
      })

      // Sort results by priority: characters, organizations, arcs, gambles, events, chapters
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

      setSearchResults(sortedResults)
      setShowSearchResults(true)
    } catch (error) {
      console.error('Search failed:', error)
      setSearchResults([])
      setShowSearchResults(false)
    } finally {
      setSearchLoading(false)
    }
  }, [userProgress])

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchValue(value)

    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current)
    }

    searchTimeout.current = setTimeout(() => {
      performSearch(value)
    }, 300)
  }, [performSearch])

  const handleSearchResultClick = useCallback((result: SearchResult) => {
    setShowSearchResults(false)
    setSearchValue('')
    setSearchFocused(false)
    router.push(`/${result.type}s/${result.id}`)
  }, [router])

  const handleSearchKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowSearchResults(false)
      setSearchValue('')
      setSearchFocused(false)
    }
  }, [])

  const handleSearchSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = searchValue.trim()
    if (trimmed) {
      setShowSearchResults(false)
      setSearchValue('')
      setSearchFocused(false)
      router.push(`/search?q=${encodeURIComponent(trimmed)}`)
    }
  }, [router, searchValue])

  return {
    searchValue,
    setSearchValue,
    searchResults,
    searchLoading,
    searchFocused,
    setSearchFocused,
    showSearchResults,
    setShowSearchResults,
    handleSearchChange,
    handleSearchResultClick,
    handleSearchKeyDown,
    handleSearchSubmit,
    shouldShowSearchDropdown
  }
}
