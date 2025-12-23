'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  ActionIcon,
  Alert,
  Badge,
  Box,
  Button,
  Card,
  Group,
  Loader,
  Pagination,
  Select,
  Stack,
  Text,
  TextInput,
  Title,
  rem,
  useMantineTheme
} from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'
import { getEntityThemeColor, backgroundStyles, getHeroStyles, getPlayingCardStyles } from '../../lib/mantine-theme'
import { Dices, Search, X, ArrowUpDown, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'motion/react'
import MediaThumbnail from '../../components/MediaThumbnail'
import { CardGridSkeleton } from '../../components/CardGridSkeleton'
import { api } from '../../lib/api'
import { usePaged } from '../../hooks/usePagedCache'
import { pagedCacheConfig } from '../../config/pagedCacheConfig'
import { useHoverModal } from '../../hooks/useHoverModal'
import { HoverModal } from '../../components/HoverModal'
import { ScrollToTop } from '../../components/ScrollToTop'
import { useProgress } from '../../providers/ProgressProvider'
import { useSpoilerSettings } from '../../hooks/useSpoilerSettings'
import { shouldHideSpoiler } from '../../lib/spoiler-utils'

type Participant = {
  id: number
  name: string
  description?: string
  alternateNames?: string[]
}

interface Gamble {
  id: number
  name: string
  description?: string
  rules: string
  winCondition?: string
  chapterId: number
  participants?: Participant[]
  createdAt: string
  updatedAt: string
}

interface GamblesPageContentProps {
  initialGambles: Gamble[]
  initialTotalPages: number
  initialTotal: number
  initialPage: number
  initialSearch: string
  initialCharacterFilter: string
  initialError: string
}

type SortOption = 'name' | 'chapter'

const sortOptions = [
  { value: 'name', label: 'Name (A-Z)' },
  { value: 'chapter', label: 'Chapter' }
]

export default function GamblesPageContent({
  initialGambles,
  initialTotalPages,
  initialTotal,
  initialPage,
  initialSearch,
  initialCharacterFilter,
  initialError
}: GamblesPageContentProps) {
  const theme = useMantineTheme()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { userProgress } = useProgress()
  const { settings: spoilerSettings } = useSpoilerSettings()

  const [gambles, setGambles] = useState<Gamble[]>(initialGambles)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(initialError)
  const [searchInput, setSearchInput] = useState(initialSearch)
  const [searchQuery, setSearchQuery] = useState(initialSearch)
  // Debounce search input to prevent rate limiting
  const [debouncedSearch] = useDebouncedValue(searchInput, 300)
  const [currentPage, setCurrentPage] = useState(initialPage)
  const [totalPages, setTotalPages] = useState(initialTotalPages)
  const [total, setTotal] = useState(initialTotal)
  const [characterFilter, setCharacterFilter] = useState<string | null>(initialCharacterFilter || null)
  const [sortBy, setSortBy] = useState<SortOption>((searchParams.get('sort') as SortOption) || 'chapter')

  // Track revealed spoilers
  const [revealedGambles, setRevealedGambles] = useState<Set<number>>(new Set())

  // Track currently hovered gamble (for triggering modal after reveal)
  const currentlyHoveredRef = useRef<{ gamble: Gamble; element: HTMLElement } | null>(null)

  // Hover modal
  const {
    hoveredItem: hoveredGamble,
    hoverPosition,
    handleMouseEnter: handleGambleMouseEnter,
    handleMouseLeave: handleGambleMouseLeave,
    handleModalMouseEnter,
    handleModalMouseLeave,
    handleTap: handleGambleTap,
    closeModal,
    isTouchDevice
  } = useHoverModal<Gamble>()

  const accentGamble = theme.other?.usogui?.gamble ?? theme.colors.red?.[5] ?? '#d32f2f'
  const hasSearchQuery = searchInput.trim().length > 0 || characterFilter !== null

  const updateURL = (newSearch: string, newPage: number, newCharacter?: string, newSort?: SortOption) => {
    const params = new URLSearchParams(searchParams.toString())
    if (newSearch) params.set('search', newSearch)
    else params.delete('search')

    if (newPage > 1) params.set('page', newPage.toString())
    else params.delete('page')

    if (newCharacter) params.set('character', newCharacter)
    else params.delete('character')

    if (newSort && newSort !== 'name') params.set('sort', newSort)
    else params.delete('sort')

    router.push(`/gambles${params.toString() ? `?${params.toString()}` : ''}`)
  }

  const fetcher = useCallback(async (page = 1) => {
    // Helper to sort gambles client-side
    const sortGambles = (gambles: Gamble[]) => {
      return [...gambles].sort((a, b) => {
        switch (sortBy) {
          case 'name':
            return (a.name || '').localeCompare(b.name || '')
          case 'chapter':
            return (a.chapterId || 999) - (b.chapterId || 999)
          default:
            return 0
        }
      })
    }

    if (characterFilter) {
      const charactersResponse = await api.getCharacters({ name: characterFilter, limit: 1 })
      if (charactersResponse.data.length > 0) {
        const characterId = charactersResponse.data[0].id
        const characterGamblesResponse = await api.getCharacterGambles(characterId, { limit: 1000 })
        const allGambles = sortGambles(characterGamblesResponse.data || [])
        const startIndex = (page - 1) * 12
        const endIndex = startIndex + 12
        return { data: allGambles.slice(startIndex, endIndex), total: allGambles.length, page, perPage: 12, totalPages: Math.max(1, Math.ceil(allGambles.length / 12)) }
      }
      return { data: [], total: 0, page: 1, perPage: 12, totalPages: 1 }
    }

    const params: any = { page, limit: 12 }
    if (searchQuery) params.gambleName = searchQuery
    // Map sort option to API params
    if (sortBy === 'name') {
      params.sortBy = 'name'
      params.sortOrder = 'ASC'
    } else if (sortBy === 'chapter') {
      params.sortBy = 'chapterId'
      params.sortOrder = 'ASC'
    }
    const resAny = await api.getGambles(params)
    return { data: resAny.data || [], total: resAny.total || 0, page: resAny.page || page, perPage: 12, totalPages: resAny.totalPages || Math.max(1, Math.ceil((resAny.total || 0) / 12)) }
  }, [characterFilter, searchQuery, sortBy])

  const { data: pageData, loading: pageLoading, error: pageError, prefetch, refresh } = usePaged<Gamble>(
    'gambles',
    currentPage,
    fetcher,
    { gambleName: searchQuery, character: characterFilter, sort: sortBy },
    { ttlMs: pagedCacheConfig.lists.gambles.ttlMs, persist: pagedCacheConfig.defaults.persist, maxEntries: pagedCacheConfig.lists.gambles.maxEntries }
  )

  useEffect(() => {
    if (pageData) {
      setGambles(pageData.data || [])
      setTotalPages(pageData.totalPages || 1)
      setTotal(pageData.total || 0)
    }
    setLoading(!!pageLoading)
  }, [pageData, pageLoading])

  const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    // Only update input - debounce effect handles search query and URL
    const value = event.currentTarget.value
    setSearchInput(value)

    // Immediately clear search when input is emptied (bypass debounce)
    if (value.trim() === '' && searchQuery !== '') {
      setSearchQuery('')
      setCurrentPage(1)
      const params = new URLSearchParams()
      if (characterFilter) params.set('character', characterFilter)
      if (sortBy !== 'chapter') params.set('sort', sortBy)
      params.set('page', '1')
      router.push(`/gambles?${params.toString()}`)
    }
  }, [searchQuery, characterFilter, sortBy, router])

  // Handle Enter key - bypass debounce for immediate search
  const handleSearchKeyDown = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      const value = searchInput.trim()
      if (value !== searchQuery) {
        setSearchQuery(value)
        setCurrentPage(1)
        const params = new URLSearchParams()
        if (value) params.set('search', value)
        if (characterFilter) params.set('character', characterFilter)
        if (sortBy !== 'chapter') params.set('sort', sortBy)
        params.set('page', '1')
        router.push(`/gambles?${params.toString()}`)
      }
    }
  }, [searchInput, searchQuery, characterFilter, sortBy, router])

  // Update search query when debounced value changes
  useEffect(() => {
    if (debouncedSearch.trim() !== searchQuery) {
      setSearchQuery(debouncedSearch.trim())
      setCurrentPage(1)
      const params = new URLSearchParams()
      if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim())
      if (characterFilter) params.set('character', characterFilter)
      if (sortBy !== 'chapter') params.set('sort', sortBy)
      params.set('page', '1')
      router.push(`/gambles?${params.toString()}`)
    }
  }, [debouncedSearch, searchQuery, characterFilter, sortBy, router])

  const handleClearSearch = useCallback(() => {
    setSearchInput('')
    setSearchQuery('')
    setCharacterFilter(null)

    const params = new URLSearchParams()
    if (sortBy !== 'chapter') params.set('sort', sortBy)
    params.set('page', '1')

    router.push(`/gambles?${params.toString()}`)
  }, [router, sortBy])

  const handlePageChange = useCallback((page: number) => {
    const params = new URLSearchParams()
    if (searchQuery) params.set('search', searchQuery)
    if (characterFilter) params.set('character', characterFilter)
    if (sortBy !== 'chapter') params.set('sort', sortBy)
    params.set('page', page.toString())

    router.push(`/gambles?${params.toString()}`)
  }, [router, searchQuery, characterFilter, sortBy])

  const handleSortChange = useCallback((value: string | null) => {
    const newSort = (value as SortOption) || 'chapter'
    setSortBy(newSort)
    setCurrentPage(1)

    const params = new URLSearchParams()
    if (searchQuery) params.set('search', searchQuery)
    if (characterFilter) params.set('character', characterFilter)
    if (newSort !== 'chapter') params.set('sort', newSort)
    params.set('page', '1')

    router.push(`/gambles?${params.toString()}`)
  }, [router, searchQuery, characterFilter])

  const clearCharacterFilter = () => {
    setCharacterFilter(null)
    setCurrentPage(1)
    updateURL(searchQuery, 1)
    // Use usePaged refresh to reload page data after clearing the character filter
    refresh(true)
  }

  return (
    <Box style={{ backgroundColor: backgroundStyles.page(theme), minHeight: '100vh' }}>
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      {/* Hero Section */}
      <Box
        style={getHeroStyles(theme, accentGamble)}
        p="md"
      >
        <Stack align="center" gap="xs">
          <Box
            style={{
              background: `linear-gradient(135deg, ${accentGamble}, ${accentGamble}CC)`,
              borderRadius: '50%',
              width: rem(40),
              height: rem(40),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 4px 16px ${accentGamble}40`
            }}
          >
            <Dices size={20} color="white" />
          </Box>

          <Stack align="center" gap="xs">
            <Title order={1} size="1.5rem" fw={700} ta="center" c={accentGamble}>
              Gambles
            </Title>
            <Text size="md" style={{ color: theme.colors.gray[6] }} ta="center" maw={400}>
              {characterFilter
                ? `High-stakes games featuring ${characterFilter}`
                : 'Discover the psychological battles and high-stakes games of Usogui'}
            </Text>

            {total > 0 && (
              <Badge
                size="md"
                variant="light"
                c={getEntityThemeColor(theme, 'gamble')}
                style={{
                  backgroundColor: `${getEntityThemeColor(theme, 'gamble')}20`,
                  borderColor: getEntityThemeColor(theme, 'gamble')
                }}
                radius="xl"
                mt="xs"
              >
                {total} gamble{total !== 1 ? 's' : ''} available
              </Badge>
            )}
          </Stack>
        </Stack>
      </Box>

      {/* Search and Filters */}
      <Box mb="xl" px="md">
        <Group justify="center" mb="md" gap="md">
          <Box style={{ maxWidth: rem(450), width: '100%' }}>
            <TextInput
              placeholder="Search gambles by name or description..."
              value={searchInput}
              onChange={handleSearchChange}
              onKeyDown={handleSearchKeyDown}
              leftSection={<Search size={20} />}
              size="lg"
              radius="xl"
              rightSection={
                hasSearchQuery ? (
                  <ActionIcon
                    variant="subtle"
                    color="gray"
                    onClick={handleClearSearch}
                    size="lg"
                    aria-label="Clear search"
                    style={{ minWidth: 44, minHeight: 44 }}
                  >
                    <X size={18} />
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
          <Select
            data={sortOptions}
            value={sortBy}
            onChange={handleSortChange}
            leftSection={<ArrowUpDown size={16} />}
            w={180}
            size="lg"
            radius="xl"
            styles={{
              input: {
                fontSize: rem(14)
              }
            }}
          />
        </Group>

        {characterFilter && (
          <Group justify="center">
            <Badge size="lg"
              variant="filled"
              style={{ backgroundColor: getEntityThemeColor(theme, 'gamble') }}
              radius="xl"
              rightSection={
                <ActionIcon
                  size="md"
                  style={{ color: getEntityThemeColor(theme, 'gamble') }}
                  variant="transparent"
                  onClick={clearCharacterFilter}
                  aria-label="Clear character filter"
                >
                  <X size={14} />
                </ActionIcon>
              }
            >
              Character: {characterFilter}
            </Badge>
          </Group>
        )}
      </Box>

      {/* Error State */}
      {error && (
        <Box px="md">
          <Alert
            color="red"
            radius="md"
            mb="xl"
            icon={<AlertCircle size={16} />}
            title="Error loading gambles"
          >
            {error}
          </Alert>
        </Box>
      )}

      {/* Loading State */}
      {loading ? (
        <CardGridSkeleton count={12} cardWidth={200} cardHeight={280} accentColor={accentGamble} />
      ) : (
        <>
          {/* Empty State */}
          {gambles.length === 0 ? (
            <Box style={{ textAlign: 'center', paddingBlock: rem(80) }}>
              <Dices size={64} color={theme.colors.gray[4]} style={{ marginBottom: rem(20) }} />
              <Title order={3} style={{ color: theme.colors.gray[6] }} mb="sm">
                {hasSearchQuery ? 'No gambles found' : 'No gambles available'}
              </Title>
              <Text size="lg" style={{ color: theme.colors.gray[6] }} mb="xl">
                {hasSearchQuery
                  ? 'Try adjusting your search terms or filters'
                  : 'Check back later for new gambles'}
              </Text>
              {hasSearchQuery && (
                <Button variant="outline" style={{ color: getEntityThemeColor(theme, 'gamble') }} onClick={handleClearSearch}>
                  Clear search
                </Button>
              )}
            </Box>
          ) : (
            <>
              {/* Results Grid */}
              <Box
                px="md"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: rem(16),
                  justifyItems: 'center'
                }}
              >
                {gambles.map((gamble, index) => (
                  <motion.div
                    key={gamble.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                    style={{
                      width: '200px',
                      height: '280px' // Playing card aspect ratio: 200px * 1.4 = 280px
                    }}
                  >
                    <Card
                      component={Link}
                      href={`/gambles/${gamble.id}`}
                      withBorder={false}
                      radius="lg"
                      shadow="sm"
                      style={getPlayingCardStyles(theme, accentGamble)}
                      onClick={(e) => {
                        // On touch devices, first tap shows preview, second tap navigates
                        if (isTouchDevice) {
                          const isSpoilered = shouldHideSpoiler(
                            gamble.chapterId,
                            userProgress,
                            spoilerSettings
                          )
                          const hasBeenRevealed = revealedGambles.has(gamble.id)
                          if (!isSpoilered || hasBeenRevealed) {
                            // If modal is not showing for this gamble, prevent navigation and show modal
                            if (hoveredGamble?.id !== gamble.id) {
                              e.preventDefault()
                              handleGambleTap(gamble, e)
                            }
                            // If modal is already showing, allow navigation (second tap)
                          }
                        }
                      }}
                      onMouseEnter={(e) => {
                        if (isTouchDevice) return // Skip hover on touch devices
                        e.currentTarget.style.transform = 'translateY(-4px)'
                        e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.25)'

                        // Store the currently hovered gamble and element
                        currentlyHoveredRef.current = { gamble, element: e.currentTarget as HTMLElement }

                        // Only show hover modal if content is not spoilered OR has been revealed
                        const isSpoilered = shouldHideSpoiler(
                          gamble.chapterId,
                          userProgress,
                          spoilerSettings
                        )
                        const hasBeenRevealed = revealedGambles.has(gamble.id)
                        if (!isSpoilered || hasBeenRevealed) {
                          handleGambleMouseEnter(gamble, e)
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (isTouchDevice) return // Skip hover on touch devices
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.boxShadow = theme.shadows.sm
                        currentlyHoveredRef.current = null
                        handleGambleMouseLeave()
                      }}
                    >
                      {/* Chapter Badge at Top Left */}
                      {gamble.chapterId && (
                        <Badge
                          variant="filled"
                          radius="sm"
                          size="sm"
                          c="white"
                          style={{
                            position: 'absolute',
                            top: rem(8),
                            left: rem(8),
                            backgroundColor: accentGamble,
                            fontSize: rem(10),
                            fontWeight: 700,
                            zIndex: 10,
                            backdropFilter: 'blur(4px)',
                            maxWidth: 'calc(100% - 16px)'
                          }}
                        >
                          Ch. {gamble.chapterId}
                        </Badge>
                      )}

                      {/* Main Image Section - Takes up most of the card */}
                      <Box style={{
                        position: 'relative',
                        overflow: 'hidden',
                        flex: 1,
                        minHeight: 0
                      }}>
                        <MediaThumbnail
                          entityType="gamble"
                          entityId={gamble.id}
                          entityName={gamble.name}
                          allowCycling={false}
                          maxWidth={200}
                          maxHeight={240}
                          disableExternalLinks={true}
                          spoilerChapter={gamble.chapterId}
                          onSpoilerRevealed={() => {
                            setRevealedGambles(prev => new Set(prev).add(gamble.id))
                            // If this gamble is currently being hovered, trigger the modal
                            if (currentlyHoveredRef.current?.gamble.id === gamble.id) {
                              const element = currentlyHoveredRef.current.element
                              // Create a synthetic event for the handleGambleMouseEnter function
                              const syntheticEvent = {
                                currentTarget: element,
                                target: element
                              } as unknown as React.MouseEvent
                              handleGambleMouseEnter(
                                currentlyHoveredRef.current.gamble,
                                syntheticEvent
                              )
                            }
                          }}
                        />
                      </Box>

                      {/* Gamble Name at Bottom */}
                      <Box
                        p={rem(6)}
                        ta="center"
                        style={{
                          backgroundColor: 'transparent',
                          minHeight: rem(40),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}
                      >
                        <Text
                          size="sm"
                          fw={700}
                          lineClamp={2}
                          ta="center"
                          style={{
                            lineHeight: 1.3,
                            fontSize: rem(15),
                            color: '#ffffff',
                            textShadow: '0 1px 3px rgba(0,0,0,0.8)',
                            background: `linear-gradient(135deg, ${accentGamble}dd, ${accentGamble}aa)`,
                            backdropFilter: 'blur(4px)',
                            borderRadius: rem(6),
                            padding: `${rem(6)} ${rem(10)}`,
                            border: `1px solid ${accentGamble}40`
                          }}
                        >
                          {gamble.name}
                        </Text>
                      </Box>
                    </Card>
                  </motion.div>
                ))}
              </Box>

              {/* Pagination */}
              {totalPages > 1 && (
                <Box style={{ display: 'flex', justifyContent: 'center', marginTop: rem(48) }}>
                  <Pagination
                    total={totalPages}
                    value={currentPage}
                    onChange={handlePageChange}
                    color="gamble"
                    size="lg"
                    radius="xl"
                    withEdges
                  />
                </Box>
              )}
            </>
          )}
        </>
      )}

      {/* Hover Modal */}
      <HoverModal
        isOpen={!!hoveredGamble}
        position={hoverPosition}
        accentColor={accentGamble}
        onMouseEnter={handleModalMouseEnter}
        onMouseLeave={handleModalMouseLeave}
        onClose={closeModal}
        showCloseButton={isTouchDevice}
      >
        {hoveredGamble && (
          <>
            {/* Gamble Name */}
            <Title
              order={4}
              size="md"
              fw={700}
              c={accentGamble}
              ta="center"
              lineClamp={2}
            >
              {hoveredGamble.name}
            </Title>

            {/* Description */}
            {hoveredGamble.description && (
              <Text
                size="sm"
                ta="center"
                lineClamp={3}
                style={{
                  color: theme.colors.gray[6],
                  lineHeight: 1.4,
                  maxHeight: rem(60)
                }}
              >
                {hoveredGamble.description}
              </Text>
            )}

            {/* Chapter and Participants */}
            <Group justify="center" gap="xs">
              <Badge
                variant="filled"
                c="white"
                style={{ backgroundColor: accentGamble }}
                size="sm"
                fw={600}
              >
                Ch. {hoveredGamble.chapterId}
              </Badge>
              {hoveredGamble.participants && hoveredGamble.participants.length > 0 && (
                <Badge
                  variant="light"
                  style={{ color: getEntityThemeColor(theme, 'event') }}
                  size="sm"
                  fw={500}
                >
                  {hoveredGamble.participants.length} participant{hoveredGamble.participants.length !== 1 ? 's' : ''}
                </Badge>
              )}
            </Group>

            {/* Participants */}
            {hoveredGamble.participants && hoveredGamble.participants.length > 0 && (
              <Group justify="center" gap="xs" wrap="wrap">
                {hoveredGamble.participants.slice(0, 3).map((participant) => (
                  <Badge
                    key={participant.id}
                    variant="outline"
                    style={{ color: getEntityThemeColor(theme, 'character') }}
                    size="xs"
                    fw={500}
                  >
                    {participant.name}
                  </Badge>
                ))}
                {hoveredGamble.participants.length > 3 && (
                  <Badge
                    variant="outline"
                    style={{ color: getEntityThemeColor(theme, 'character') }}
                    size="xs"
                    fw={500}
                  >
                    +{hoveredGamble.participants.length - 3}
                  </Badge>
                )}
              </Group>
            )}

            {/* Win Condition */}
            {hoveredGamble.winCondition && (
              <Box>
                <Text size="xs" fw={600} style={{ color: theme.colors.gray[6] }} mb={2} ta="center">
                  Win Condition:
                </Text>
                <Text
                  size="xs"
                  lineClamp={2}
                  ta="center"
                  style={{
                    color: theme.colors.gray[6],
                    lineHeight: 1.4
                  }}
                >
                  {hoveredGamble.winCondition}
                </Text>
              </Box>
            )}
          </>
        )}
      </HoverModal>

      <ScrollToTop accentColor={accentGamble} />
    </motion.div>
    </Box>
  )
}