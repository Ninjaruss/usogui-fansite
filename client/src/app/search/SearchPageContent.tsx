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
  Loader,
  Stack,
  Pagination,
  Alert,
  Box,
  Paper,
  useMantineTheme,
  Anchor,
  Container
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
import {
  backgroundStyles,
  borderStyles,
  getAlphaColor,
  getEntityThemeColor,
  textColors
} from '../../lib/mantine-theme'
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

type SearchFilterValue = 'all' | 'characters' | 'organizations' | 'arcs' | 'gambles' | 'events' | 'chapters'

const searchFilterOptions: Array<{ value: SearchFilterValue; label: string; icon: React.ReactElement }> = [
  { value: 'all', label: 'All Types', icon: <Search size={16} /> },
  { value: 'characters', label: 'Characters', icon: <Users size={16} /> },
  { value: 'organizations', label: 'Organizations', icon: <Shield size={16} /> },
  { value: 'arcs', label: 'Arcs', icon: <BookOpen size={16} /> },
  { value: 'gambles', label: 'Gambles', icon: <Dices size={16} /> },
  { value: 'events', label: 'Events', icon: <Zap size={16} /> },
  { value: 'chapters', label: 'Chapters', icon: <FileText size={16} /> }
] as const

const validSearchFilterValues = new Set<SearchFilterValue>(searchFilterOptions.map(option => option.value))

const filterToResultTypeMap: Record<string, string> = {
  characters: 'character',
  organizations: 'organization',
  arcs: 'arc',
  gambles: 'gamble',
  events: 'event',
  chapters: 'chapter'
}

const typeIconMap: Record<string, React.ReactElement> = {
  all: <Search size={16} />,
  character: <Users size={16} />,
  characters: <Users size={16} />,
  organization: <Shield size={16} />,
  organizations: <Shield size={16} />,
  arc: <BookOpen size={16} />,
  arcs: <BookOpen size={16} />,
  gamble: <Dices size={16} />,
  gambles: <Dices size={16} />,
  event: <Zap size={16} />,
  events: <Zap size={16} />,
  chapter: <FileText size={16} />,
  chapters: <FileText size={16} />,
  guide: <BookOpen size={16} />,
  quote: <Quote size={16} />
}

const toResultType = (type: string) => filterToResultTypeMap[type] ?? type

const resolveTypeIcon = (type: string) => typeIconMap[type] ?? <Search size={16} />

const RESULTS_PER_PAGE = 20

export default function SearchPageContent({
  initialQuery,
  initialType,
  initialPage
}: SearchPageContentProps) {
  const theme = useMantineTheme()
  const { userProgress } = useProgress()
  const guideAccent = getEntityThemeColor(theme, 'guide')
  const gambleAccent = getEntityThemeColor(theme, 'gamble')
  const eventAccent = getEntityThemeColor(theme, 'event')

  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Search state
  const [query, setQuery] = useState(initialQuery)
  const [debouncedQuery] = useDebouncedValue(query, 300)
  const defaultType: SearchFilterValue = initialType && validSearchFilterValues.has(initialType as SearchFilterValue)
    ? (initialType as SearchFilterValue)
    : 'all'
  const [selectedType, setSelectedType] = useState<SearchFilterValue>(defaultType)
  const [currentPage, setCurrentPage] = useState(initialPage)

  // Pagination
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const performSearch = useCallback(async () => {
    const trimmedQuery = debouncedQuery.trim()
    if (!trimmedQuery) {
      setResults([])
      setTotal(0)
      setTotalPages(1)
      if (currentPage !== 1) {
        setCurrentPage(1)
      }
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await api.search({
        query: trimmedQuery,
        type: selectedType === 'all' ? undefined : toResultType(selectedType),
        userProgress,
        page: currentPage,
        limit: RESULTS_PER_PAGE
      })

      setResults(response.results || [])
      setTotal(response.total || 0)
      setTotalPages(response.totalPages || 1)

      if (typeof response.page === 'number' && response.page !== currentPage) {
        setCurrentPage(response.page)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed')
      setResults([])
      setTotal(0)
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }, [debouncedQuery, selectedType, userProgress, currentPage])

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
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const getTypeIcon = (type: string) => resolveTypeIcon(type)

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'character':
      case 'characters':
        return getEntityThemeColor(theme, 'character')
      case 'organization':
      case 'organizations':
        return getEntityThemeColor(theme, 'organization')
      case 'arc':
      case 'arcs':
        return getEntityThemeColor(theme, 'arc')
      case 'gamble':
      case 'gambles':
        return getEntityThemeColor(theme, 'gamble')
      case 'event':
      case 'events':
        return getEntityThemeColor(theme, 'event')
      case 'quote':
        return getEntityThemeColor(theme, 'quote')
      case 'guide':
        return getEntityThemeColor(theme, 'guide')
      case 'chapter':
      case 'chapters':
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

  const getBadgeStyles = (accent: string) => {
    const safeAccent = accent || theme.colors.gray[6]
    return {
      background: getAlphaColor(safeAccent, 0.18),
      border: `1px solid ${getAlphaColor(safeAccent, 0.35)}`,
      color: safeAccent,
    }
  }

  return (
    <Box style={{ backgroundColor: backgroundStyles.page(theme), minHeight: '100vh' }}>
    <Container
      size="lg"
      py="xl"
      style={{
        backgroundColor: backgroundStyles.container(theme),
        borderRadius: theme.radius.xl,
        boxShadow: theme.shadows.xl
      }}
    >
    <Stack gap="xl">
      {/* Header */}
      <Stack gap="md">
        <Title order={1} size="h1" c={guideAccent}>
          Search Results
        </Title>
        {query.trim() && (
          <Text c={textColors.tertiary}>
            Showing results for <Text span fw={500} c={textColors.primary}>"{query.trim()}"</Text>
          </Text>
        )}
      </Stack>

      {/* Search Form */}
      <Paper
        p="md"
        radius="lg"
        withBorder
        style={{
          background: backgroundStyles.card,
          border: borderStyles.card(theme)
        }}
      >
        <Group gap="md" align="flex-end">
          <TextInput
            placeholder="Search characters, arcs, events, gambles..."
            leftSection={<Search size={16} />}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ flex: 1, minWidth: 300 }}
            size="md"
            variant="filled"
            styles={{
              input: {
                backgroundColor: backgroundStyles.input,
                borderColor: getAlphaColor(guideAccent, 0.35),
                color: textColors.primary
              }
            }}
          />

          <Select
            data={searchFilterOptions.map(option => ({
              value: option.value,
              label: option.label
            }))}
            value={selectedType}
            onChange={(value) => setSelectedType((value as SearchFilterValue) || 'all')}
            placeholder="Type"
            leftSection={getTypeIcon(selectedType)}
            w={140}
            size="md"
            variant="filled"
            styles={{
              input: {
                backgroundColor: backgroundStyles.input,
                borderColor: getAlphaColor(guideAccent, 0.35),
                color: textColors.primary
              },
              dropdown: {
                backgroundColor: backgroundStyles.card,
                border: borderStyles.card(theme)
              },
              option: {
                color: textColors.primary
              }
            }}
          />
        </Group>
      </Paper>

      {/* Results Summary */}
      {!loading && query && (
        <Group justify="space-between" align="center">
          <Text size="sm" c={textColors.tertiary}>
            {total} {total === 1 ? 'result' : 'results'} found
          </Text>
          {selectedType !== 'all' && (
            <Badge
              variant="light"
              color={getTypeColor(selectedType)}
              style={getBadgeStyles(getTypeColor(selectedType))}
              leftSection={getTypeIcon(selectedType)}
            >
              {searchFilterOptions.find(option => option.value === selectedType)?.label}
            </Badge>
          )}
        </Group>
      )}

      {/* Error State */}
      {error && (
        <Alert color="red" title="Search Error" radius="lg">
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
                      style={getBadgeStyles(getTypeColor(result.type))}
                      leftSection={getTypeIcon(result.type)}
                      size="sm"
                    >
                      {result.type}
                    </Badge>
                    {result.hasSpoilers && (
                      <Badge
                        variant="light"
                        color="orange"
                        size="xs"
                        style={getBadgeStyles(eventAccent)}
                      >
                        Spoilers
                      </Badge>
                    )}
                  </Group>
                  <Text size="xs" c={textColors.tertiary}>
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
                  <Text size="sm" c={textColors.tertiary} lineClamp={2}>
                    {formatResultDescription(result.description)}
                  </Text>
                )}

                {result.metadata && (
                  <Group gap="xs">
                    {result.metadata.chapterNumber && (
                      <Badge
                        variant="light"
                        size="xs"
                        style={getBadgeStyles(getTypeColor('chapters'))}
                      >
                        Chapter {result.metadata.chapterNumber}
                      </Badge>
                    )}
                    {result.metadata.authorName && (
                      <Badge
                        variant="light"
                        size="xs"
                        style={getBadgeStyles(guideAccent)}
                      >
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
        <Paper
          p="xl"
          radius="lg"
          withBorder
          ta="center"
          style={{
            background: backgroundStyles.card,
            border: borderStyles.card(theme)
          }}
        >
          <Stack gap="md" align="center">
            <Search size={48} style={{ color: textColors.tertiary }} />
            <Stack gap="xs" align="center">
              <Text fw={500}>No results found</Text>
              <Text size="sm" c={textColors.tertiary}>
                Try different keywords or check your spelling
              </Text>
            </Stack>
            <Group gap="sm">
              <Button
                variant="light"
                onClick={() => setSelectedType('all')}
                disabled={selectedType === 'all'}
                styles={{
                  root: {
                    backgroundColor: getAlphaColor(guideAccent, 0.2),
                    color: guideAccent,
                    border: `1px solid ${getAlphaColor(guideAccent, 0.35)}`
                  }
                }}
              >
                Search all types
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setQuery('')
                  setSelectedType('all')
                }}
                styles={{
                  root: {
                    borderColor: getAlphaColor(gambleAccent, 0.4),
                    color: gambleAccent,
                    backgroundColor: getAlphaColor(gambleAccent, 0.12)
                  }
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
        <Paper
          p="xl"
          radius="lg"
          withBorder
          ta="center"
          style={{
            background: backgroundStyles.card,
            border: borderStyles.card(theme)
          }}
        >
          <Stack gap="md" align="center">
            <Search size={48} style={{ color: textColors.tertiary }} />
            <Stack gap="xs" align="center">
              <Text fw={500}>Enter a search term</Text>
              <Text size="sm" c={textColors.tertiary}>
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
    </Container>
    </Box>
  )
}
