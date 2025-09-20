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
  Paper,
  Pagination,
  Stack,
  Text,
  TextInput,
  Title,
  rem,
  useMantineTheme
} from '@mantine/core'
import { Dices, Search, X } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'motion/react'
import MediaThumbnail from '../../components/MediaThumbnail'
import { api } from '../../lib/api'

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

  const [gambles, setGambles] = useState<Gamble[]>(initialGambles)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(initialError)
  const [searchQuery, setSearchQuery] = useState(initialSearch)
  const [currentPage, setCurrentPage] = useState(initialPage)
  const [totalPages, setTotalPages] = useState(initialTotalPages)
  const [total, setTotal] = useState(initialTotal)
  const [characterFilter, setCharacterFilter] = useState<string | null>(initialCharacterFilter || null)

  // Hover modal state
  const [hoveredGamble, setHoveredGamble] = useState<Gamble | null>(null)
  const [hoverModalPosition, setHoverModalPosition] = useState<{ x: number; y: number } | null>(null)
  const hoverTimeoutRef = useRef<number | null>(null)
  const hoveredElementRef = useRef<HTMLElement | null>(null)

  const accentGamble = theme.other?.usogui?.gamble ?? theme.colors.red?.[5] ?? '#d32f2f'
  const hasSearchQuery = searchQuery.trim().length > 0

  const updateURL = (newSearch: string, newPage: number, newCharacter?: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (newSearch) params.set('search', newSearch)
    else params.delete('search')

    if (newPage > 1) params.set('page', newPage.toString())
    else params.delete('page')

    if (newCharacter) params.set('character', newCharacter)
    else params.delete('character')

    router.push(`/gambles${params.toString() ? `?${params.toString()}` : ''}`)
  }

  const fetchGambles = async (page = 1, search = '', characterName?: string) => {
    setLoading(true)
    try {
      let response

      if (characterName) {
        const charactersResponse = await api.getCharacters({ name: characterName, limit: 1 })
        if (charactersResponse.data.length > 0) {
          const characterId = charactersResponse.data[0].id
          const characterGamblesResponse = await api.getCharacterGambles(characterId, { limit: 1000 })
          const allGambles = characterGamblesResponse.data || []
          const startIndex = (page - 1) * 12
          const endIndex = startIndex + 12
          response = {
            data: allGambles.slice(startIndex, endIndex),
            total: allGambles.length,
            totalPages: Math.ceil(allGambles.length / 12),
            page
          }
        } else {
          response = { data: [], total: 0, totalPages: 1, page: 1 }
        }
      } else {
        const params: { page: number; limit: number; gambleName?: string } = { page, limit: 12 }
        if (search) params.gambleName = search
        response = await api.getGambles(params)
      }

      setGambles(response.data)
      setTotalPages(response.totalPages)
      setTotal(response.total)
      setError('')
    } catch (fetchError: unknown) {
      setError(fetchError instanceof Error ? fetchError.message : 'Failed to fetch gambles')
      setGambles([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (
      currentPage !== initialPage ||
      searchQuery !== initialSearch ||
      characterFilter !== (initialCharacterFilter || null)
    ) {
      fetchGambles(currentPage, searchQuery, characterFilter || undefined)
    }
  }, [currentPage, searchQuery, characterFilter, initialPage, initialSearch, initialCharacterFilter])

  // Function to update modal position based on hovered element
  const updateModalPosition = useCallback((gamble?: Gamble) => {
    const currentGamble = gamble || hoveredGamble
    if (hoveredElementRef.current && currentGamble) {
      const rect = hoveredElementRef.current.getBoundingClientRect()
      const modalWidth = 300 // rem(300) from the modal width
      const modalHeight = 180 // Approximate modal height
      const navbarHeight = 60 // Height of the sticky navbar
      const buffer = 10 // Additional buffer space

      let x = rect.left + rect.width / 2
      let y = rect.top - modalHeight - buffer

      // Check if modal would overlap with navbar
      if (y < navbarHeight + buffer) {
        // Position below the card instead
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
  }, [hoveredGamble])

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        window.clearTimeout(hoverTimeoutRef.current)
      }
    }
  }, [])

  // Add scroll and resize listeners to update modal position
  useEffect(() => {
    if (hoveredGamble && hoveredElementRef.current) {
      const handleScroll = () => {
        updateModalPosition()
      }

      const handleResize = () => {
        updateModalPosition()
      }

      window.addEventListener('scroll', handleScroll)
      document.addEventListener('scroll', handleScroll)
      window.addEventListener('resize', handleResize)

      return () => {
        window.removeEventListener('scroll', handleScroll)
        document.removeEventListener('scroll', handleScroll)
        window.removeEventListener('resize', handleResize)
      }
    }
  }, [hoveredGamble, updateModalPosition])

  const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const newSearch = event.currentTarget.value
    setSearchQuery(newSearch)
  }, [])

  // Debounce search query changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const params = new URLSearchParams()
      if (searchQuery) params.set('search', searchQuery)
      params.set('page', '1') // Reset to first page on new search

      router.push(`/gambles?${params.toString()}`)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery, router])

  const handleClearSearch = useCallback(() => {
    setSearchQuery('')
    setCharacterFilter(null)

    const params = new URLSearchParams()
    params.set('page', '1')

    router.push(`/gambles?${params.toString()}`)
  }, [router])

  const handlePageChange = useCallback((page: number) => {
    const params = new URLSearchParams()
    if (searchQuery) params.set('search', searchQuery)
    if (characterFilter) params.set('character', characterFilter)
    params.set('page', page.toString())

    router.push(`/gambles?${params.toString()}`)
  }, [router, searchQuery, characterFilter])

  const clearCharacterFilter = () => {
    setCharacterFilter(null)
    setCurrentPage(1)
    updateURL(searchQuery, 1)
    fetchGambles(1, searchQuery)
  }

  // Hover modal handlers
  const handleGambleMouseEnter = (gamble: Gamble, event: React.MouseEvent) => {
    const element = event.currentTarget as HTMLElement
    hoveredElementRef.current = element

    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
    }

    hoverTimeoutRef.current = window.setTimeout(() => {
      setHoveredGamble(gamble)
      updateModalPosition(gamble) // Pass gamble directly to ensure position calculation works immediately
    }, 500) // 500ms delay before showing
  }

  const handleGambleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
    }

    // Small delay before hiding to allow moving to modal
    hoverTimeoutRef.current = window.setTimeout(() => {
      setHoveredGamble(null)
      setHoverModalPosition(null)
      hoveredElementRef.current = null
    }, 200)
  }

  const handleModalMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
    }
  }

  const handleModalMouseLeave = () => {
    setHoveredGamble(null)
    setHoverModalPosition(null)
    hoveredElementRef.current = null
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      {/* Hero Section */}
      <Box
        style={{
          background: `linear-gradient(135deg, ${accentGamble}15, ${accentGamble}08)`,
          borderRadius: theme.radius.lg,
          border: `1px solid ${accentGamble}25`,
          marginBottom: rem(24)
        }}
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
            <Text size="md" c="dimmed" ta="center" maw={400}>
              {characterFilter
                ? `High-stakes games featuring ${characterFilter}`
                : 'Discover the psychological battles and high-stakes games of Usogui'}
            </Text>

            {total > 0 && (
              <Badge size="md" variant="light" color="red" radius="xl" mt="xs">
                {total} gamble{total !== 1 ? 's' : ''} available
              </Badge>
            )}
          </Stack>
        </Stack>
      </Box>

      {/* Search and Filters */}
      <Box mb="xl">
        <Group justify="center" mb="md">
          <Box style={{ maxWidth: rem(600), width: '100%' }}>
            <TextInput
              placeholder="Search gambles by name or description..."
              value={searchQuery}
              onChange={handleSearchChange}
              leftSection={<Search size={20} />}
              size="lg"
              radius="xl"
              rightSection={
                hasSearchQuery ? (
                  <ActionIcon variant="subtle" color="gray" onClick={handleClearSearch} size="sm">
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

        {characterFilter && (
          <Group justify="center">
            <Badge
              size="lg"
              variant="filled"
              color="red"
              radius="xl"
              rightSection={
                <ActionIcon size="xs" color="red" variant="transparent" onClick={clearCharacterFilter}>
                  <X size={12} />
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
        <Alert
          color="red"
          radius="md"
          mb="xl"
          icon={<X size={16} />}
          title="Error loading gambles"
        >
          {error}
        </Alert>
      )}

      {/* Loading State */}
      {loading ? (
        <Box style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingBlock: rem(80) }}>
          <Loader size="xl" color={accentGamble} mb="md" />
          <Text size="lg" c="dimmed">Loading gambles...</Text>
        </Box>
      ) : (
        <>
          {/* Empty State */}
          {gambles.length === 0 ? (
            <Box style={{ textAlign: 'center', paddingBlock: rem(80) }}>
              <Dices size={64} color={theme.colors.gray[4]} style={{ marginBottom: rem(20) }} />
              <Title order={3} c="dimmed" mb="sm">
                {hasSearchQuery ? 'No gambles found' : 'No gambles available'}
              </Title>
              <Text size="lg" c="dimmed" mb="xl">
                {hasSearchQuery
                  ? 'Try adjusting your search terms or filters'
                  : 'Check back later for new gambles'}
              </Text>
              {hasSearchQuery && (
                <Button variant="outline" color="red" onClick={handleClearSearch}>
                  Clear search
                </Button>
              )}
            </Box>
          ) : (
            <>
              {/* Results Grid */}
              <Box
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
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        transition: 'all 0.2s ease',
                        cursor: 'pointer',
                        textDecoration: 'none',
                        backgroundColor: theme.colors.dark?.[7] ?? theme.white,
                        border: `1px solid ${theme.colors.dark?.[4] ?? theme.colors.gray?.[2]}`,
                        width: '100%',
                        height: '100%'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-4px)'
                        e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.25)'
                        handleGambleMouseEnter(gamble, e)
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.boxShadow = theme.shadows.sm
                        handleGambleMouseLeave()
                      }}
                    >
                      {/* Chapter Badge at Top Left */}
                      {gamble.chapterId && (
                        <Badge
                          variant="filled"
                          color="red"
                          radius="sm"
                          size="sm"
                          style={{
                            position: 'absolute',
                            top: rem(8),
                            left: rem(8),
                            backgroundColor: 'rgba(211, 47, 47, 0.95)',
                            color: 'white',
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
                          maxWidth="100%"
                          maxHeight="100%"
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
                          c={accentGamble}
                          ta="center"
                          style={{
                            lineHeight: 1.2,
                            textShadow: '0 2px 4px rgba(0,0,0,0.8), 0 1px 2px rgba(255,255,255,0.2)',
                            fontSize: rem(13),
                            background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
                            backdropFilter: 'blur(4px)',
                            borderRadius: rem(6),
                            padding: `${rem(4)} ${rem(8)}`,
                            border: `1px solid rgba(255,255,255,0.1)`
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
                    color="red"
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
      <AnimatePresence>
        {hoveredGamble && hoverModalPosition && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'fixed',
              left: hoverModalPosition.x - 150, // Center horizontally (300px width / 2)
              top: hoverModalPosition.y, // Use calculated position directly
              zIndex: 1001, // Higher than navbar (which is 1000)
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
                backgroundColor: theme.colors.dark?.[7] ?? theme.white,
                border: `2px solid ${accentGamble}`,
                backdropFilter: 'blur(10px)',
                width: rem(300),
                maxWidth: '90vw'
              }}
            >
              <Stack gap="sm">
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
                    c="dimmed"
                    ta="center"
                    lineClamp={3}
                    style={{
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
                    color="red"
                    size="sm"
                    fw={600}
                  >
                    Ch. {hoveredGamble.chapterId}
                  </Badge>
                  {hoveredGamble.participants && hoveredGamble.participants.length > 0 && (
                    <Badge
                      variant="light"
                      color="orange"
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
                        color="blue"
                        size="xs"
                        fw={500}
                      >
                        {participant.name}
                      </Badge>
                    ))}
                    {hoveredGamble.participants.length > 3 && (
                      <Badge
                        variant="outline"
                        color="blue"
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
                    <Text size="xs" fw={600} c="dimmed" mb={2} ta="center">
                      Win Condition:
                    </Text>
                    <Text
                      size="xs"
                      c="dimmed"
                      lineClamp={2}
                      ta="center"
                      style={{ lineHeight: 1.4 }}
                    >
                      {hoveredGamble.winCondition}
                    </Text>
                  </Box>
                )}
              </Stack>
            </Paper>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}