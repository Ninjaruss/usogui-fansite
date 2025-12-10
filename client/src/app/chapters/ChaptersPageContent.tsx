'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ActionIcon,
  Alert,
  Badge,
  Box,
  Button,
  Card,
  Loader,
  Pagination,
  Paper,
  Stack,
  Text,
  TextInput,
  Title,
  Group,
  rem,
  useMantineTheme
} from '@mantine/core'
import { getEntityThemeColor, backgroundStyles, getHeroStyles, getCardStyles } from '../../lib/mantine-theme'
import { AlertCircle, Search, BookOpen, X } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'motion/react'
import { api } from '../../lib/api'

interface Chapter {
  id: number
  number: number
  title?: string | null
  summary?: string | null
  description?: string
  volume?: {
    id: number
    number: number
    title?: string
  }
}

interface ChaptersPageContentProps {
  initialChapters: Chapter[]
  initialTotalPages: number
  initialTotal: number
  initialPage: number
  initialSearch: string
  initialError: string
}

const PAGE_SIZE = 20

export default function ChaptersPageContent({
  initialChapters,
  initialPage,
  initialSearch,
  initialError
}: ChaptersPageContentProps) {
  const theme = useMantineTheme()
  const accentChapter = theme.other?.usogui?.chapter ?? theme.colors.green?.[6] ?? '#16a34a'
  const router = useRouter()
  const searchParams = useSearchParams()

  // Load all chapters once - no pagination needed on API level
  const [allChapters, setAllChapters] = useState<Chapter[]>(initialChapters)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(initialError || null)
  const [searchQuery, setSearchQuery] = useState(initialSearch || '')

  // Client-side pagination
  const [currentPage, setCurrentPage] = useState<number>(initialPage)

  // Hover modal state
  const [hoveredChapter, setHoveredChapter] = useState<Chapter | null>(null)
  const [hoverModalPosition, setHoverModalPosition] = useState<{ x: number; y: number } | null>(null)
  const hoverTimeoutRef = useRef<number | null>(null)
  const hoveredElementRef = useRef<HTMLElement | null>(null)

  const hasSearchQuery = searchQuery.trim().length > 0

  // Load all chapters once on mount
  const loadAllChapters = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await api.get<any>('/chapters?limit=1000') // Get all chapters
      setAllChapters(response.data || [])
    } catch (err: any) {
      console.error('Error loading chapters:', err)
      if (err?.status === 429) {
        setError('Rate limit exceeded. Please wait a moment and try again.')
      } else {
        setError('Failed to load chapters. Please try again later.')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  // Client-side filtering and pagination
  const filteredChapters = useMemo(() => {
    if (!searchQuery.trim()) return allChapters

    const query = searchQuery.toLowerCase().trim()
    return allChapters.filter(chapter => {
      // Search by chapter number
      if (!isNaN(Number(query))) {
        return chapter.number.toString().includes(query)
      }

      // Search by title or description
      const title = chapter.title?.toLowerCase() || `chapter ${chapter.number}`
      const description = chapter.description?.toLowerCase() || ''
      const summary = chapter.summary?.toLowerCase() || ''

      return title.includes(query) || description.includes(query) || summary.includes(query)
    })
  }, [allChapters, searchQuery])

  const paginatedChapters = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE
    return filteredChapters.slice(startIndex, startIndex + PAGE_SIZE)
  }, [filteredChapters, currentPage])

  const totalPages = Math.ceil(filteredChapters.length / PAGE_SIZE)
  const total = filteredChapters.length

  // Load all chapters on mount if we don't have the expected full set
  useEffect(() => {
    if (allChapters.length === 0 || (allChapters.length > 0 && allChapters.length < 500)) {
      loadAllChapters()
    }
  }, [allChapters.length, loadAllChapters])

  // Sync with URL parameters - only react to searchParams changes
  useEffect(() => {
    const urlPage = parseInt(searchParams.get('page') || '1', 10)
    const urlSearch = searchParams.get('search') || ''

    setCurrentPage(urlPage)
    setSearchQuery(urlSearch)
  }, [searchParams])

  // Function to update modal position based on hovered element
  const updateModalPosition = useCallback((chapter?: Chapter) => {
    const currentChapter = chapter || hoveredChapter
    if (hoveredElementRef.current && currentChapter) {
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
  }, [hoveredChapter])

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        window.clearTimeout(hoverTimeoutRef.current)
      }
    }
  }, [])

  // Add scroll and resize listeners to update modal position
  useEffect(() => {
    if (hoveredChapter && hoveredElementRef.current) {
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
  }, [hoveredChapter, updateModalPosition])

  const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const newSearch = event.target.value
    setSearchQuery(newSearch)
    setCurrentPage(1) // Reset to first page immediately when search changes
  }, [])

  // Update URL when search or page changes (no API calls needed)
  useEffect(() => {
    const params = new URLSearchParams()
    if (searchQuery) params.set('search', searchQuery)
    if (currentPage > 1) params.set('page', currentPage.toString())

    const newUrl = params.toString() ? `/chapters?${params.toString()}` : '/chapters'
    router.push(newUrl, { scroll: false })
  }, [searchQuery, currentPage, router])

  const handleClearSearch = useCallback(() => {
    setSearchQuery('')
    setCurrentPage(1)
    router.push('/chapters', { scroll: false })
    // No API calls needed!
  }, [router])

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page) // Update local state immediately
    // No API calls needed - everything is client-side now!
  }, [])

  // Hover modal handlers
  const handleChapterMouseEnter = (chapter: Chapter, event: React.MouseEvent) => {
    const element = event.currentTarget as HTMLElement
    hoveredElementRef.current = element

    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
    }

    hoverTimeoutRef.current = window.setTimeout(() => {
      setHoveredChapter(chapter)
      updateModalPosition(chapter) // Pass chapter directly to ensure position calculation works immediately
    }, 500) // 500ms delay before showing
  }

  const handleChapterMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
    }

    // Small delay before hiding to allow moving to modal
    hoverTimeoutRef.current = window.setTimeout(() => {
      setHoveredChapter(null)
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
    setHoveredChapter(null)
    setHoverModalPosition(null)
    hoveredElementRef.current = null
  }

  return (
    <Box style={{ backgroundColor: backgroundStyles.page(theme), minHeight: '100vh' }}>
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      {/* Hero Section */}
      <Box
        style={getHeroStyles(theme, accentChapter)}
        p="md"
      >
        <Stack align="center" gap="xs">
          <Box
            style={{
              background: `linear-gradient(135deg, ${accentChapter}, ${accentChapter}CC)`,
              borderRadius: '50%',
              width: rem(40),
              height: rem(40),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 4px 16px ${accentChapter}40`
            }}
          >
            <BookOpen size={20} color="white" />
          </Box>

          <Stack align="center" gap="xs">
            <Title order={1} size="1.5rem" fw={700} ta="center" c={accentChapter}>
              Chapters
            </Title>
            <Text size="md" style={{ color: theme.colors.gray[6] }} ta="center" maw={400}>
              Explore the story chapter by chapter through the Usogui universe
            </Text>

            {allChapters.length > 0 && (
              <Badge
                size="md"
                variant="light"
                c={getEntityThemeColor(theme, 'guide')}
                radius="xl"
                mt="xs"
                style={{ backgroundColor: `${getEntityThemeColor(theme, 'guide')}20`, borderColor: getEntityThemeColor(theme, 'guide') }}
              >
                {searchQuery ? `${total} of ${allChapters.length}` : `${allChapters.length}`} chapter{(searchQuery ? total : allChapters.length) !== 1 ? 's' : ''} {searchQuery ? 'found' : 'available'}
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
              placeholder="Search chapters by number or title..."
              value={searchQuery}
              onChange={handleSearchChange}
              leftSection={<Search size={20} />}
              size="lg"
              radius="xl"
              disabled={loading}
              rightSection={
                hasSearchQuery ? (
                  <ActionIcon
                    variant="subtle"
                    color="gray"
                    onClick={handleClearSearch}
                    size="sm"
                    title="Clear search"
                  >
                    <X size={16} />
                  </ActionIcon>
                ) : loading ? (
                  <Loader size="sm" />
                ) : null
              }
              styles={{
                input: {
                  fontSize: rem(16),
                  paddingLeft: rem(50),
                  paddingRight: (hasSearchQuery || loading) ? rem(50) : rem(20)
                }
              }}
            />
          </Box>
        </Group>
      </Box>

      {/* Error State */}
      {error && (
        <Alert
          style={{ color: getEntityThemeColor(theme, 'gamble') }}
          radius="md"
          mb="xl"
          icon={<AlertCircle size={16} />}
          title={error.includes('Rate limit') ? 'Rate Limited' : 'Error loading chapters'}
          variant={error.includes('Rate limit') ? 'light' : 'filled'}
        >
          {error}
          {error.includes('Rate limit') && (
            <Text size="sm" mt="xs" style={{ color: theme.colors.gray[6] }}>
              The server is receiving too many requests. Please wait a moment before trying again.
            </Text>
          )}
        </Alert>
      )}

      {/* Loading State */}
      {loading ? (
        <Box style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingBlock: rem(80) }}>
          <Loader size="xl" color={accentChapter} mb="md" />
          <Text size="lg" style={{ color: theme.colors.gray[6] }}>Loading chapters...</Text>
        </Box>
      ) : (
        <>
          {/* Empty State */}
          {paginatedChapters.length === 0 ? (
            <Box style={{ textAlign: 'center', paddingBlock: rem(80) }}>
              <BookOpen size={64} color={theme.colors.gray[4]} style={{ marginBottom: rem(20) }} />
              <Title order={3} style={{ color: theme.colors.gray[6] }} mb="sm">
                {hasSearchQuery ? 'No chapters found' : 'No chapters available'}
              </Title>
              <Text size="lg" style={{ color: theme.colors.gray[6] }} mb="xl">
                {hasSearchQuery
                  ? 'Try adjusting your search terms or filters'
                  : 'Check back later for new chapters'}
              </Text>
              {hasSearchQuery && (
                <Button variant="outline" style={{ color: getEntityThemeColor(theme, 'guide') }} onClick={handleClearSearch}>
                  Clear search
                </Button>
              )}
            </Box>
          ) : (
            <>
              {/* Dense Results Grid - aim to fit ~10 small cards per row on wide screens */}
              <Box
                px="md"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(96px, 1fr))',
                  gap: rem(8)
                }}
              >
                {paginatedChapters.map((chapter, index) => (
                  <motion.div
                    key={chapter.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.01 }}
                    style={{ width: '100%' }}
                  >
                    <Card
                      component={Link}
                      href={`/chapters/${chapter.id}`}
                      withBorder
                      radius="sm"
                      shadow="xs"
                      style={{
                        ...getCardStyles(theme, accentChapter),
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: rem(6),
                        padding: `${rem(6)} ${rem(6)}`,
                        minHeight: rem(88),
                        justifyContent: 'center'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-4px)'
                        e.currentTarget.style.boxShadow = '0 12px 28px rgba(0,0,0,0.2)'
                        handleChapterMouseEnter(chapter, e)
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.boxShadow = theme.shadows.xs
                        handleChapterMouseLeave()
                      }}
                    >
                      <Badge
                        variant="filled"
                        radius="sm"
                        size="xs"
                        c="white"
                        style={{
                          backgroundColor: getEntityThemeColor(theme, 'guide'),
                          fontWeight: 800,
                          padding: `${rem(4)} ${rem(6)}`,
                          fontSize: rem(11)
                        }}
                      >
                        {chapter.number}
                      </Badge>

                      <Text
                        size="xs"
                        fw={700}
                        c={accentChapter}
                        lineClamp={2}
                        style={{ fontSize: rem(12), lineHeight: 1.1, wordBreak: 'break-word', textAlign: 'center' }}
                      >
                        {chapter.title || `Ch. ${chapter.number}`}
                      </Text>

                      {chapter.volume && (
                        <Badge
                          variant="filled"
                          radius="sm"
                          size="xs"
                          c="white"
                          style={{
                            backgroundColor: getEntityThemeColor(theme, 'media'),
                            fontSize: rem(10),
                            padding: `${rem(2)} ${rem(6)}`
                          }}
                        >
                          Vol. {chapter.volume.number}
                        </Badge>
                      )}
                    </Card>
                  </motion.div>
                ))}
              </Box>

              {/* Pagination Info & Controls */}
              <Box style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                marginTop: rem(48),
                gap: rem(12)
              }}>
                {/* Always show pagination info when we have chapters */}
                {allChapters.length > 0 && (
                  <Text size="sm" style={{ color: theme.colors.gray[6] }}>
                    Showing {paginatedChapters.length} of {total} chapters
                    {totalPages > 1 && ` • Page ${currentPage} of ${totalPages}`}
                  </Text>
                )}

                {/* Show pagination controls when we have multiple pages */}
                {totalPages > 1 && (
                  <Pagination
                    total={totalPages}
                    value={currentPage}
                    onChange={handlePageChange}
                    style={{ color: getEntityThemeColor(theme, 'guide') }}
                    size="lg"
                    radius="xl"
                    withEdges
                  />
                )}

                {loading && <Loader size="sm" color={accentChapter} />}
              </Box>
            </>
          )}
        </>
      )}

      {/* Hover Modal */}
      <AnimatePresence>
        {hoveredChapter && hoverModalPosition && (
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
                border: `2px solid ${accentChapter}`,
                backdropFilter: 'blur(10px)',
                width: rem(300),
                maxWidth: '90vw'
              }}
            >
              <Stack gap="sm">
                {/* Chapter Title */}
                <Title
                  order={4}
                  size="md"
                  fw={700}
                  c={accentChapter}
                  ta="center"
                  lineClamp={2}
                >
                  {hoveredChapter.title || `Chapter ${hoveredChapter.number}`}
                </Title>

                {/* Chapter Info */}
                <Group justify="center" gap="xs">
                  <Badge
                    variant="light"
                    c={getEntityThemeColor(theme, 'guide')}
                    size="sm"
                    fw={600}
                    style={{ backgroundColor: `${getEntityThemeColor(theme, 'guide')}20`, borderColor: getEntityThemeColor(theme, 'guide') }}
                  >
                    Chapter #{hoveredChapter.number}
                  </Badge>
                  {hoveredChapter.volume && (
                    <Badge
                      variant="filled"
                      c="white"
                      size="sm"
                      fw={600}
                      style={{ backgroundColor: getEntityThemeColor(theme, 'media') }}
                    >
                      Vol. {hoveredChapter.volume.number}
                    </Badge>
                  )}
                </Group>

                {/* Description */}
                {(hoveredChapter.description || hoveredChapter.summary) && (
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
                    {hoveredChapter.description || hoveredChapter.summary}
                  </Text>
                )}
              </Stack>
            </Paper>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
    </Box>
  )
}