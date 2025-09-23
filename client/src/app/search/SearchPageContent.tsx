'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Title,
  Text,
  Group,
  Select,
  TextInput,
  Button,
  Card,
  Badge,
  ActionIcon,
  Loader,
  Stack,
  Pagination,
  Alert,
  Box,
  Paper,
  useMantineTheme,
  Anchor,
  Divider,
  SimpleGrid
} from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'
import {
  Search,
  Users,
  Shield,
  BookOpen,
  Dices,
  Zap,
  FileText,
  Quote,
  Image as ImageIcon,
  ExternalLink,
  CalendarSearch
} from 'lucide-react'
import Link from 'next/link'
import { api } from '../../lib/api'
import { getEntityThemeColor, getEntityAccent } from '../../lib/mantine-theme'
import { useProgress } from '../../providers/ProgressProvider'

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

interface SearchPageContentProps {
  initialQuery: string
  initialType?: string
  initialPage: number
}

const ITEMS_PER_PAGE = 20

export default function SearchPageContent({
  initialQuery,
  initialType,
  initialPage
}: SearchPageContentProps) {
  const theme = useMantineTheme()
  const { userProgress } = useProgress()

  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Search state
  const [query, setQuery] = useState(initialQuery)
  const [debouncedQuery] = useDebouncedValue(query, 300)
  const [selectedType, setSelectedType] = useState(initialType || 'all')
  const [currentPage, setCurrentPage] = useState(initialPage)

  // Pagination
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const searchTypes = [
    { value: 'all', label: 'All Types', icon: <Search size={16} /> },
    { value: 'character', label: 'Characters', icon: <Users size={16} /> },
    { value: 'organization', label: 'Organizations', icon: <Shield size={16} /> },
    { value: 'arc', label: 'Arcs', icon: <BookOpen size={16} /> },
    { value: 'gamble', label: 'Gambles', icon: <Dices size={16} /> },
    { value: 'event', label: 'Events', icon: <Zap size={16} /> },
    { value: 'chapter', label: 'Chapters', icon: <FileText size={16} /> },
    { value: 'quote', label: 'Quotes', icon: <Quote size={16} /> },
    { value: 'guide', label: 'Guides', icon: <BookOpen size={16} /> }
  ]

  const performSearch = useCallback(async () => {
    if (!debouncedQuery.trim()) {
      setResults([])
      setTotal(0)
      setTotalPages(1)
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await api.search(
        debouncedQuery,
        selectedType === 'all' ? undefined : selectedType,
        userProgress
      )

      setResults(response.results || [])
      setTotal(response.total || 0)
      setTotalPages(response.totalPages || 1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed')
      setResults([])
      setTotal(0)
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }, [debouncedQuery, selectedType, userProgress])

  useEffect(() => {
    performSearch()
  }, [performSearch])

  // Reset to page 1 when search changes
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1)
    }
  }, [debouncedQuery, selectedType])

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const getTypeIcon = (type: string) => {
    const typeData = searchTypes.find(t => t.value === type)
    return typeData?.icon || <Search size={16} />
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'character':
        return getEntityThemeColor(theme, 'character')
      case 'organization':
        return getEntityThemeColor(theme, 'organization')
      case 'arc':
        return getEntityThemeColor(theme, 'arc')
      case 'gamble':
        return getEntityThemeColor(theme, 'gamble')
      case 'event':
        return getEntityThemeColor(theme, 'event')
      case 'quote':
        return getEntityThemeColor(theme, 'quote')
      case 'guide':
        return getEntityThemeColor(theme, 'guide')
      case 'chapter':
        return '#607d8b'
      default:
        return theme.colors.gray[6]
    }
  }

  const getResultUrl = (result: SearchResult) => {
    if (result.type === 'guide') {
      return `/guides/${result.id}`
    }
    return `/${result.type}s/${result.id}`
  }

  const formatResultDescription = (description: string, maxLength = 150) => {
    if (description.length <= maxLength) return description
    return description.slice(0, maxLength) + '...'
  }

  return (
    <Stack gap="xl">
      {/* Header */}
      <Stack gap="md">
        <Title order={1} size="h1" style={{ color: getEntityThemeColor(theme, 'guide') }}>
          Search Results
        </Title>
        {initialQuery && (
          <Text c="dimmed">
            Showing results for <Text span fw={500}>"{initialQuery}"</Text>
          </Text>
        )}
      </Stack>

      {/* Search Form */}
      <Paper p="md" radius="md" withBorder>
        <Group gap="md" align="flex-end">
          <TextInput
            placeholder="Search characters, arcs, events, guides..."
            leftSection={<Search size={16} />}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ flex: 1, minWidth: 300 }}
            size="md"
          />

          <Select
            data={searchTypes.map(type => ({
              value: type.value,
              label: type.label
            }))}
            value={selectedType}
            onChange={(value) => setSelectedType(value || 'all')}
            placeholder="Type"
            leftSection={getTypeIcon(selectedType)}
            w={140}
            size="md"
          />
        </Group>
      </Paper>

      {/* Results Summary */}
      {!loading && query && (
        <Group justify="space-between" align="center">
          <Text size="sm" c="dimmed">
            {total} {total === 1 ? 'result' : 'results'} found
          </Text>
          {selectedType !== 'all' && (
            <Badge
              variant="light"
              color={getTypeColor(selectedType)}
              leftSection={getTypeIcon(selectedType)}
            >
              {searchTypes.find(t => t.value === selectedType)?.label}
            </Badge>
          )}
        </Group>
      )}

      {/* Error State */}
      {error && (
        <Alert color="red" title="Search Error">
          {error}
        </Alert>
      )}

      {/* Loading State */}
      {loading && (
        <Group justify="center" py="xl">
          <Loader size="lg" />
        </Group>
      )}

      {/* Results */}
      {!loading && !error && results.length > 0 && (
        <Stack gap="md">
          {results.map((result) => (
            <Card key={`${result.type}-${result.id}`} padding="lg" radius="md" withBorder>
              <Stack gap="sm">
                <Group justify="space-between" align="flex-start">
                  <Group gap="sm" align="center">
                    <Badge
                      variant="light"
                      color={getTypeColor(result.type)}
                      leftSection={getTypeIcon(result.type)}
                      size="sm"
                    >
                      {result.type}
                    </Badge>
                    {result.hasSpoilers && (
                      <Badge variant="filled" color="orange" size="xs">
                        Spoilers
                      </Badge>
                    )}
                  </Group>
                  <Text size="xs" c="dimmed">
                    Score: {Math.round(result.score * 100)}%
                  </Text>
                </Group>

                <Box>
                  <Anchor
                    component={Link}
                    href={getResultUrl(result)}
                    size="lg"
                    fw={600}
                    style={{ color: getTypeColor(result.type) }}
                  >
                    {result.title}
                  </Anchor>
                </Box>

                {result.description && (
                  <Text size="sm" c="dimmed" lineClamp={2}>
                    {formatResultDescription(result.description)}
                  </Text>
                )}

                {result.metadata && (
                  <Group gap="xs">
                    {result.metadata.chapterNumber && (
                      <Badge variant="outline" size="xs">
                        Chapter {result.metadata.chapterNumber}
                      </Badge>
                    )}
                    {result.metadata.authorName && (
                      <Badge variant="outline" size="xs">
                        by {result.metadata.authorName}
                      </Badge>
                    )}
                  </Group>
                )}
              </Stack>
            </Card>
          ))}
        </Stack>
      )}

      {/* Empty State */}
      {!loading && !error && query && results.length === 0 && (
        <Paper p="xl" radius="md" withBorder ta="center">
          <Stack gap="md" align="center">
            <Search size={48} style={{ color: theme.colors.gray[5] }} />
            <Stack gap="xs" align="center">
              <Text fw={500}>No results found</Text>
              <Text size="sm" c="dimmed">
                Try different keywords or check your spelling
              </Text>
            </Stack>
            <Group gap="sm">
              <Button
                variant="light"
                onClick={() => setSelectedType('all')}
                disabled={selectedType === 'all'}
              >
                Search all types
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setQuery('')
                  setSelectedType('all')
                }}
              >
                Clear search
              </Button>
            </Group>
          </Stack>
        </Paper>
      )}

      {/* No Query State */}
      {!loading && !error && !query && (
        <Paper p="xl" radius="md" withBorder ta="center">
          <Stack gap="md" align="center">
            <Search size={48} style={{ color: theme.colors.gray[5] }} />
            <Stack gap="xs" align="center">
              <Text fw={500}>Enter a search term</Text>
              <Text size="sm" c="dimmed">
                Search for characters, arcs, events, gambles, guides, and more
              </Text>
            </Stack>
          </Stack>
        </Paper>
      )}

      {/* Pagination */}
      {!loading && !error && totalPages > 1 && (
        <Group justify="center" py="md">
          <Pagination
            value={currentPage}
            onChange={handlePageChange}
            total={totalPages}
            size="md"
          />
        </Group>
      )}
    </Stack>
  )
}