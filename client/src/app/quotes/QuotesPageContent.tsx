'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  ActionIcon,
  Alert,
  Badge,
  Box,
  Button,
  Card,
  Grid,
  Group,
  Loader,
  Pagination,
  Paper,
  Stack,
  Text,
  TextInput,
  Title,
  rem,
  useMantineTheme
} from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'
import { getEntityThemeColor, semanticColors, textColors, backgroundStyles, getHeroStyles, getCardStyles } from '../../lib/mantine-theme'
import { notifications } from '@mantine/notifications'
import { Quote, Search, X } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'motion/react'
import { api } from '../../lib/api'
import { usePaged } from '../../hooks/usePagedCache'
import { pagedCacheConfig } from '../../config/pagedCacheConfig'
import { CardGridSkeleton } from '../../components/CardGridSkeleton'
import { ScrollToTop } from '../../components/ScrollToTop'

interface QuoteData {
  id: number
  text: string
  speaker: string
  context?: string
  tags: string[]
  chapter?: number
  volume?: number
  updatedAt: string
}

interface QuotesPageContentProps {
  initialQuotes?: QuoteData[]
  initialTotalPages?: number
  initialTotal?: number
  initialPage?: number
  initialSearch?: string
  initialCharacterId?: string
  initialCharacterName?: string | null
  initialError?: string
}

const PAGE_SIZE = 12

export default function QuotesPageContent({
  initialQuotes = [],
  initialTotalPages = 1,
  initialTotal = 0,
  initialPage = 1,
  initialSearch = '',
  initialCharacterId,
  initialCharacterName = null,
  initialError = ''
}: QuotesPageContentProps) {
  const theme = useMantineTheme()
  const router = useRouter()
  const searchParams = useSearchParams()

  // The app forces dark mode globally, but use safe theme fallbacks here.
  const textColor = theme.other?.usogui?.white ?? '#ffffff'
  const cardBgColor = theme.other?.usogui?.black ?? '#0a0a0a'
  const badgeVariant = 'filled'
  const grayBadgeVariant = 'outline'
  const iconColor = theme.colors?.gray?.[4] ?? '#94a3b8'

  const [quotes, setQuotes] = useState<QuoteData[]>(initialQuotes)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(initialError)
  const [searchInput, setSearchInput] = useState(initialSearch)
  const [searchQuery, setSearchQuery] = useState(initialSearch)
  const [currentPage, setCurrentPage] = useState(initialPage)

  // Debounce search input to prevent rate limiting
  const [debouncedSearch] = useDebouncedValue(searchInput, 300)
  const [totalPages, setTotalPages] = useState(initialTotalPages)
  const [total, setTotal] = useState(initialTotal)
  const [characterName, setCharacterName] = useState<string | null>(initialCharacterName)
  const [characterId, setCharacterId] = useState<string | undefined>(initialCharacterId)
  const [hoveredQuote, setHoveredQuote] = useState<QuoteData | null>(null)
  const [hoverModalPosition, setHoverModalPosition] = useState<{ x: number; y: number } | null>(null)
  const hoverTimeoutRef = useRef<number | null>(null)
  const hoveredElementRef = useRef<HTMLElement | null>(null)

  // Use the quote accent color from the theme
  const accentQuote = theme.other?.usogui?.quote ?? theme.colors.violet?.[5] ?? '#7048e8'

  const fetcher = useCallback(async (page = 1) => {
    const params: any = { page, limit: PAGE_SIZE }
    if (searchQuery && searchQuery.trim()) params.search = searchQuery.trim()
    if (characterId && !isNaN(Number(characterId))) params.characterId = Number(characterId)

    const resAny = await api.getQuotes(params)
    const transformedQuotes = (resAny.data || []).map((quote: any) => ({
      id: quote.id,
      text: quote.text,
      speaker: quote.character?.name || 'Unknown',
      context: quote.description || quote.context,
      tags: quote.tags ? (Array.isArray(quote.tags) ? quote.tags : [quote.tags]) : [],
      chapter: quote.chapterNumber,
      volume: quote.volumeNumber,
      updatedAt: quote.updatedAt
    }))

    return { data: transformedQuotes, total: resAny.total || 0, page: resAny.page || page, perPage: PAGE_SIZE, totalPages: resAny.totalPages || Math.max(1, Math.ceil((resAny.total || 0) / PAGE_SIZE)) }
  }, [searchQuery, characterId])

  const { data: pageData, loading: pageLoading, error: pageError, prefetch, refresh } = usePaged<QuoteData>(
    'quotes',
    currentPage,
    fetcher,
    { search: searchQuery, characterId },
    { ttlMs: pagedCacheConfig.lists.quotes.ttlMs, persist: pagedCacheConfig.defaults.persist, maxEntries: pagedCacheConfig.lists.quotes.maxEntries }
  )

  useEffect(() => {
    if (pageData) {
      setQuotes(pageData.data || [])
      setTotal(pageData.total || 0)
      setTotalPages(pageData.totalPages || 1)
    }
    setLoading(!!pageLoading)
    if (pageError) {
      const message = pageError instanceof Error ? pageError.message : String(pageError)
      setError(message)
      notifications.show({ message, color: 'red' })
    }
  }, [pageData, pageLoading, pageError])

  // Update search query when debounced value changes
  useEffect(() => {
    if (debouncedSearch.trim() !== searchQuery) {
      setSearchQuery(debouncedSearch.trim())
      setCurrentPage(1)
      // Update URL
      const params = new URLSearchParams(searchParams.toString())
      if (debouncedSearch.trim()) {
        params.set('search', debouncedSearch.trim())
      } else {
        params.delete('search')
      }
      params.set('page', '1')
      const queryString = params.toString()
      router.push(queryString ? `/quotes?${queryString}` : '/quotes')
    }
  }, [debouncedSearch, searchQuery, searchParams, router])

  // Function to update modal position based on hovered element (following arcs pattern)
  const updateModalPosition = useCallback((quote?: QuoteData) => {
    const currentQuote = quote || hoveredQuote
    if (hoveredElementRef.current && currentQuote) {
      const rect = hoveredElementRef.current.getBoundingClientRect()
      const modalWidth = 300
      const modalHeight = 180
      const navbarHeight = 60
      const buffer = 10

      let x = rect.left + rect.width / 2
      let y = rect.top - modalHeight - buffer

      // Check if modal would overlap with navbar
      if (y < navbarHeight + buffer) {
        y = rect.bottom + buffer
      }

      // Ensure modal doesn't go off-screen horizontally
      const modalLeftEdge = x - modalWidth / 2
      const modalRightEdge = x + modalWidth / 2

      if (modalLeftEdge < buffer) {
        x = modalWidth / 2 + buffer
      } else if (modalRightEdge > window.innerWidth - buffer) {
        x = window.innerWidth - modalWidth / 2 - buffer
      }

      setHoverModalPosition({ x, y })
    }
  }, [hoveredQuote])

  // Hover handlers following the arcs pattern
  const handleCardMouseEnter = (quote: QuoteData, element: HTMLElement) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
    }

    setHoveredQuote(quote)
    hoveredElementRef.current = element

    hoverTimeoutRef.current = window.setTimeout(() => {
      updateModalPosition(quote)
    }, 500)
  }

  const handleCardMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
    }
    setHoveredQuote(null)
    setHoverModalPosition(null)
    hoveredElementRef.current = null
  }

  const handleModalMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
    }
  }

  const handleModalMouseLeave = () => {
    setHoveredQuote(null)
    setHoverModalPosition(null)
    hoveredElementRef.current = null
  }

  // Search and page handlers
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    // Only update input - debounce effect handles search query and URL
    const value = event.target.value
    setSearchInput(value)

    // Immediately clear search when input is emptied (bypass debounce)
    if (value.trim() === '' && searchQuery !== '') {
      setSearchQuery('')
      setCurrentPage(1)
      const params = new URLSearchParams(searchParams.toString())
      params.delete('search')
      params.set('page', '1')
      router.push(params.toString() ? `/quotes?${params.toString()}` : '/quotes')
      refresh(true)
    }
  }

  // Handle Enter key - bypass debounce for immediate search
  const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      const value = searchInput.trim()
      if (value !== searchQuery) {
        setSearchQuery(value)
        setCurrentPage(1)
        // Update URL
        const params = new URLSearchParams(searchParams.toString())
        if (value) {
          params.set('search', value)
        } else {
          params.delete('search')
        }
        params.set('page', '1')
        const queryString = params.toString()
        router.push(queryString ? `/quotes?${queryString}` : '/quotes')
      }
    }
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    
    // Update URL
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', page.toString())
    const queryString = params.toString()
    router.push(`/quotes?${queryString}`)
    // prefetch the page
    prefetch(page)
  }

  const clearCharacterFilter = () => {
    setCharacterId(undefined)
    setCharacterName(null)
    setCurrentPage(1)
    
    const params = new URLSearchParams(searchParams.toString())
    params.delete('characterId')
    params.set('page', '1')
    const queryString = params.toString()
    router.push(queryString ? `/quotes?${queryString}` : '/quotes')
    refresh(true)
  }

  const clearSearch = () => {
    setSearchInput('')
    setSearchQuery('')
    setCurrentPage(1)

    const params = new URLSearchParams(searchParams.toString())
    params.delete('search')
    params.set('page', '1')
    const queryString = params.toString()
    router.push(queryString ? `/quotes?${queryString}` : '/quotes')
    refresh(true)
  }

  const hasSearchQuery = Boolean(searchQuery || characterId)

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current)
      }
    }
  }, [])

  return (
    <Box style={{ backgroundColor: backgroundStyles.page(theme), minHeight: '100vh' }}>
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      {/* Hero Section */}
      <Box
        style={{
          background: `linear-gradient(135deg, ${accentQuote}15, ${accentQuote}08)`,
          borderRadius: theme.radius.lg,
          border: `1px solid ${accentQuote}25`,
          marginBottom: rem(24)
        }}
        p="md"
      >
        <Stack align="center" gap="xs">
          <Box
            style={{
              background: `linear-gradient(135deg, ${accentQuote}, ${accentQuote}CC)`,
              borderRadius: '50%',
              width: rem(40),
              height: rem(40),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 4px 16px ${accentQuote}40`
            }}
          >
            <Quote size={20} color="white" />
          </Box>

          <Stack align="center" gap="xs">
            <Title order={1} size="1.5rem" fw={700} ta="center" c={accentQuote}>
              Memorable Quotes
            </Title>
            <Text size="md" style={{ color: theme.colors.gray[6] }} ta="center" maw={400}>
              {characterName
                ? `Iconic wisdom and memorable dialogue from ${characterName}`
                : 'Discover profound insights and memorable dialogue from the world of Usogui'}
            </Text>

            {total > 0 && (
              <Badge size="md" variant="light" c={accentQuote} radius="xl" mt="xs">
                {total} quote{total !== 1 ? 's' : ''} collected
              </Badge>
            )}
          </Stack>
        </Stack>
      </Box>

      {/* Search and Filters */}
      <Box mb="xl" px="md">
        <Group justify="center" mb="md">
          <Box style={{ maxWidth: rem(600), width: '100%' }}>
            <TextInput
              placeholder="Search quotes, speakers, or context..."
              value={searchInput}
              onChange={handleSearchChange}
              onKeyDown={handleSearchKeyDown}
              leftSection={<Search size={20} />}
              size="lg"
              radius="xl"
              rightSection={
                hasSearchQuery ? (
                  <ActionIcon variant="subtle" color="gray" onClick={clearSearch} size="sm">
                    <X size={16} />
                  </ActionIcon>
                ) : null
              }
              styles={{
                input: {
                  fontSize: rem(16),
                  paddingLeft: rem(50),
                  paddingRight: hasSearchQuery ? rem(50) : rem(20)
                }
              }}
            />
          </Box>
        </Group>

        {characterId && characterName && (
          <Group justify="center">
            <Badge
              size="lg"
              variant={badgeVariant as any}
              radius="xl"
              rightSection={
                <ActionIcon size="xs" style={{ color: getEntityThemeColor(theme, 'media') }} variant="transparent" onClick={clearCharacterFilter}>
                  <X size={12} />
                </ActionIcon>
              }
            >
              Character: {characterName}
            </Badge>
          </Group>
        )}
      </Box>

      {/* Error Alert */}
      {error && (
        <Box px="md">
          <Alert style={{ color: getEntityThemeColor(theme, 'gamble') }} variant="light" mb="xl">
            {error}
          </Alert>
        </Box>
      )}

      {/* Loading State */}
      {loading ? (
        <CardGridSkeleton count={12} cardWidth={180} cardHeight={240} accentColor={accentQuote} />
      ) : (
        <Box px="md">
          <Stack gap="xl">
            {/* Quotes Grid */}
            <Grid gutter="md">
            {quotes.map((quote, index) => (
              // base: 1 column, sm: 2 columns, md: 4 columns, lg: 6 columns
              <Grid.Col span={{ base: 12, sm: 6, md: 3, lg: 2 }} key={quote.id}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                >
                  <Card
                    withBorder
                    radius="lg"
                    shadow="sm"
                    padding="md"
                    style={{
                      height: '240px', // More compact height
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      position: 'relative',
                      overflow: 'hidden',
                      backgroundColor: cardBgColor,
                    }}
                    onMouseEnter={(e) => handleCardMouseEnter(quote, e.currentTarget)}
                    onMouseLeave={handleCardMouseLeave}
                    styles={{
                      root: {
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: theme.shadows.lg,
                        },
                      },
                    }}
                  >
                    <Stack gap="xs" h="100%" justify="space-between">
                      {/* Header */}
                      <Group justify="space-between" align="flex-start">
                        <Group gap="xs" wrap="wrap">
                          {quote.chapter && (
                            <Badge color="gray" variant={grayBadgeVariant as any} size="md">
                              Ch. {quote.chapter}
                            </Badge>
                          )}
                        </Group>
                        <Quote size={20} color={accentQuote} />
                      </Group>

                      {/* Quote Text - Centered and Clear */}
                      <Box style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Text
                          size="lg"
                          lineClamp={4}
                          ta="center"
                          fw={600}
                          style={{
                            fontStyle: 'italic',
                            lineHeight: 1.3,
                            fontSize: rem(17),
                            color: textColor
                          }}
                        >
                          &quot;{quote.text}&quot;
                        </Text>
                      </Box>

                      {/* Speaker - More prominent */}
                      <Text
                        size="md"
                        fw={700}
                        c={accentQuote}
                        ta="center"
                        style={{ fontSize: rem(15) }}
                      >
                        — {quote.speaker}
                      </Text>

                      {/* Tags */}
                      {quote.tags.length > 0 && (
                        <Group gap={4} wrap="wrap" justify="center">
                          {quote.tags.slice(0, 3).map((tag: string, tagIndex: number) => (
                            <Badge key={tagIndex} size="xs" color="gray" variant={grayBadgeVariant as any}>
                              {tag}
                            </Badge>
                          ))}
                          {quote.tags.length > 3 && (
                            <Badge size="xs" color="gray" variant={grayBadgeVariant as any}>
                              +{quote.tags.length - 3}
                            </Badge>
                          )}
                        </Group>
                      )}

                      {/* Footer - Remove "Full Quote" text */}
                      {quote.volume && (
                        <Text size="xs" style={{ color: theme.colors.gray[6] }} ta="center">
                          {quote.volume && `Vol. ${quote.volume}`}
                          {quote.volume && quote.chapter && ' • '}
                          {quote.chapter && `Ch. ${quote.chapter}`}
                        </Text>
                      )}
                    </Stack>
                  </Card>
                </motion.div>
              </Grid.Col>
            ))}
          </Grid>

          {/* Empty State */}
          {quotes.length === 0 && !loading && (
            <Stack align="center" gap="md" py="xl">
              <Quote size={64} color={iconColor} />
              <Title order={3} style={{ color: theme.colors.gray[6] }}>
                No quotes found
              </Title>
              <Text size="lg" style={{ color: theme.colors.gray[6] }} ta="center">
                {searchQuery ? 'Try adjusting your search terms.' : 'Be the first to submit a memorable quote!'}
              </Text>
            </Stack>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <Group justify="center">
              <Pagination
                total={totalPages}
                value={currentPage}
                onChange={handlePageChange}
                style={{ color: getEntityThemeColor(theme, 'media') }}
                radius="md"
                size="lg"
              />
            </Group>
          )}
          </Stack>
        </Box>
      )}

      {/* Hover Modal */}
      <AnimatePresence>
        {hoveredQuote && hoverModalPosition && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'fixed',
              left: hoverModalPosition.x - 150, // Center horizontally (300px width / 2)
              top: hoverModalPosition.y,
              zIndex: 1001, // Higher than navbar
              pointerEvents: 'auto'
            }}
            onMouseEnter={handleModalMouseEnter}
            onMouseLeave={handleModalMouseLeave}
          >
            <Paper
              shadow="xl"
              radius="lg"
              p="md"
              style={{
                backgroundColor: cardBgColor,
                border: `2px solid ${accentQuote}`,
                backdropFilter: 'blur(10px)',
                width: rem(300),
                maxWidth: '90vw'
              }}
            >
              <Stack gap="sm">
                {/* Quote Speaker */}
                <Title
                  order={4}
                  size="md"
                  fw={700}
                  c={accentQuote}
                  ta="center"
                  lineClamp={2}
                >
                  {hoveredQuote.speaker}
                </Title>

                {/* Context - Emphasized */}
                {hoveredQuote.context && (
                  <Box>
                    <Text size="xs" fw={600} style={{ color: theme.colors.gray[6] }} mb={4} ta="center">
                      Context
                    </Text>
                    <Text 
                      size="sm" 
                      c={textColor}
                      ta="center"
                      lineClamp={4}
                      style={{
                        lineHeight: 1.4,
                        fontWeight: 500
                      }}
                    >
                      {hoveredQuote.context}
                    </Text>
                  </Box>
                )}

                {/* Chapter and Volume Info */}
                {(hoveredQuote.volume || hoveredQuote.chapter) && (
                  <Group justify="center" gap="xs">
                    <Badge
                      variant="filled"
                      c="white"
                      size="sm"
                      style={{ backgroundColor: getEntityThemeColor(theme, 'media') }}
                    >
                      {hoveredQuote.volume && `Vol. ${hoveredQuote.volume}`}
                      {hoveredQuote.volume && hoveredQuote.chapter && ' • '}
                      {hoveredQuote.chapter && `Ch. ${hoveredQuote.chapter}`}
                    </Badge>
                  </Group>
                )}

                {/* Tags Info */}
                {hoveredQuote.tags.length > 0 && (
                  <Group justify="center" gap="xs">
                    <Badge variant="outline" color="gray" size="xs">
                      {hoveredQuote.tags.length} tag{hoveredQuote.tags.length !== 1 ? 's' : ''}
                    </Badge>
                    {hoveredQuote.tags.slice(0, 2).map((tag: string, index: number) => (
                      <Badge key={index} variant="light" style={{ color: getEntityThemeColor(theme, 'character') }} size="xs">
                        {tag}
                      </Badge>
                    ))}
                    {hoveredQuote.tags.length > 2 && (
                      <Badge variant="light" style={{ color: getEntityThemeColor(theme, 'character') }} size="xs">
                        +{hoveredQuote.tags.length - 2}
                      </Badge>
                    )}
                  </Group>
                )}

                {/* Show message if no context */}
                {!hoveredQuote.context && (
                  <Text size="sm" style={{ color: theme.colors.gray[6] }} ta="center" fs="italic">
                    No additional context available
                  </Text>
                )}
              </Stack>
            </Paper>
          </motion.div>
        )}
      </AnimatePresence>

      <ScrollToTop accentColor={accentQuote} />
    </motion.div>
    </Box>
  )
}