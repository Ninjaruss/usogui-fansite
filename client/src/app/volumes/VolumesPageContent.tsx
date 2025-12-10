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
import { getEntityThemeColor, semanticColors, textColors, backgroundStyles, getHeroStyles, getPlayingCardStyles } from '../../lib/mantine-theme'
import { AlertCircle, Search, Book, Hash, X } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'motion/react'
import { api } from '../../lib/api'
import MediaThumbnail from '../../components/MediaThumbnail'
import ErrorBoundary from '../../components/ErrorBoundary'

interface Volume {
  id: number
  number: number
  title?: string
  description?: string
  coverUrl?: string
  startChapter: number
  endChapter: number
}

interface VolumesPageContentProps {
  initialVolumes: Volume[]
  initialTotalPages: number
  initialTotal: number
  initialPage: number
  initialSearch: string
  initialError: string
}

const PAGE_SIZE = 10

export default function VolumesPageContent({
  initialVolumes,
  initialTotalPages,
  initialTotal,
  initialPage,
  initialSearch,
  initialError
}: VolumesPageContentProps) {
  const theme = useMantineTheme()
  const accentVolume = theme.other?.usogui?.volume ?? theme.colors.red?.[5] ?? '#ef4444'
  const router = useRouter()
  const searchParams = useSearchParams()

  // Load all volumes once - no pagination needed on API level
  const [allVolumes, setAllVolumes] = useState<Volume[]>(initialVolumes)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(initialError || null)
  const [searchQuery, setSearchQuery] = useState(initialSearch || '')

  // Client-side pagination
  const [currentPage, setCurrentPage] = useState<number>(initialPage)

  // Hover modal state
  const [hoveredVolume, setHoveredVolume] = useState<Volume | null>(null)
  const [hoverModalPosition, setHoverModalPosition] = useState<{ x: number; y: number } | null>(null)
  const hoverTimeoutRef = useRef<number | null>(null)
  const hoveredElementRef = useRef<HTMLElement | null>(null)

  const hasSearchQuery = searchQuery.trim().length > 0

  // Load all volumes once on mount
  const loadAllVolumes = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await api.get<any>('/volumes?limit=100') // Get all volumes
      setAllVolumes(response.data || [])
    } catch (err: any) {
      console.error('Error loading volumes:', err)
      if (err?.status === 429) {
        setError('Rate limit exceeded. Please wait a moment and try again.')
      } else {
        setError('Failed to load volumes. Please try again later.')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  // Client-side filtering and pagination
  const filteredVolumes = useMemo(() => {
    if (!searchQuery.trim()) return allVolumes

    const query = searchQuery.toLowerCase().trim()
    return allVolumes.filter(volume => {
      // Search by volume number
      if (!isNaN(Number(query))) {
        return volume.number.toString().includes(query)
      }

      // Search by title or description
      const title = volume.title?.toLowerCase() || `volume ${volume.number}`
      const description = volume.description?.toLowerCase() || ''

      return title.includes(query) || description.includes(query)
    })
  }, [allVolumes, searchQuery])

  const paginatedVolumes = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE
    return filteredVolumes.slice(startIndex, startIndex + PAGE_SIZE)
  }, [filteredVolumes, currentPage])

  const totalPages = Math.ceil(filteredVolumes.length / PAGE_SIZE)
  const total = filteredVolumes.length

  // Load all volumes on mount if we don't have the expected full set
  useEffect(() => {
    if (allVolumes.length === 0 || (allVolumes.length > 0 && allVolumes.length < 40)) {
      loadAllVolumes()
    }
  }, [allVolumes.length, loadAllVolumes])

  // Sync with URL parameters - only react to searchParams changes
  useEffect(() => {
    const urlPage = parseInt(searchParams.get('page') || '1', 10)
    const urlSearch = searchParams.get('search') || ''

    setCurrentPage(urlPage)
    setSearchQuery(urlSearch)
  }, [searchParams])


  // Function to update modal position based on hovered element
  const updateModalPosition = useCallback((volume?: Volume) => {
    const currentVolume = volume || hoveredVolume
    if (hoveredElementRef.current && currentVolume) {
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
  }, [hoveredVolume])

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        window.clearTimeout(hoverTimeoutRef.current)
      }
    }
  }, [])

  // Add scroll and resize listeners to update modal position
  useEffect(() => {
    if (hoveredVolume && hoveredElementRef.current) {
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
  }, [hoveredVolume, updateModalPosition])

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

    const newUrl = params.toString() ? `/volumes?${params.toString()}` : '/volumes'
    router.push(newUrl, { scroll: false })
  }, [searchQuery, currentPage, router])

  const handleClearSearch = useCallback(() => {
    setSearchQuery('')
    setCurrentPage(1)
    router.push('/volumes', { scroll: false })
    // No API calls needed!
  }, [router])

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page) // Update local state immediately
    // No API calls needed - everything is client-side now!
  }, [])

  // Hover modal handlers
  const handleVolumeMouseEnter = (volume: Volume, event: React.MouseEvent) => {
    const element = event.currentTarget as HTMLElement
    hoveredElementRef.current = element

    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
    }

    hoverTimeoutRef.current = window.setTimeout(() => {
      setHoveredVolume(volume)
      updateModalPosition(volume) // Pass volume directly to ensure position calculation works immediately
    }, 500) // 500ms delay before showing
  }

  const handleVolumeMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
    }

    // Small delay before hiding to allow moving to modal
    hoverTimeoutRef.current = window.setTimeout(() => {
      setHoveredVolume(null)
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
    setHoveredVolume(null)
    setHoverModalPosition(null)
    hoveredElementRef.current = null
  }

  return (
    <Box style={{ backgroundColor: backgroundStyles.page(theme), minHeight: '100vh' }}>
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      {/* Hero Section */}
      <Box
        style={getHeroStyles(theme, accentVolume)}
        p="md"
      >
        <Stack align="center" gap="xs">
          <Box
            style={{
              background: `linear-gradient(135deg, ${accentVolume}, ${accentVolume}CC)`,
              borderRadius: '50%',
              width: rem(40),
              height: rem(40),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 4px 16px ${accentVolume}40`
            }}
          >
            <Book size={20} color="white" />
          </Box>

          <Stack align="center" gap="xs">
            <Title order={1} size="1.5rem" fw={700} ta="center" c={accentVolume}>
              Volumes
            </Title>
            <Text size="md" style={{ color: theme.colors.gray[6] }} ta="center" maw={400}>
              Explore the complete collection of Usogui manga volumes
            </Text>

            {allVolumes.length > 0 && (
              <Badge
                size="md"
                variant="light"
                c={accentVolume}
                radius="xl"
                mt="xs"
              >
                {searchQuery ? `${total} of ${allVolumes.length}` : `${allVolumes.length}`} volume{(searchQuery ? total : allVolumes.length) !== 1 ? 's' : ''} {searchQuery ? 'found' : 'available'}
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
              placeholder="Search volumes by number or title..."
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
          title={error.includes('Rate limit') ? 'Rate Limited' : 'Error loading volumes'}
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
          <Loader size="xl" color={accentVolume} mb="md" />
          <Text size="lg" style={{ color: theme.colors.gray[6] }}>Loading volumes...</Text>
        </Box>
      ) : (
        <>
          {/* Empty State */}
          {paginatedVolumes.length === 0 ? (
            <Box style={{ textAlign: 'center', paddingBlock: rem(80) }}>
              <Book size={64} color={theme.colors.gray[4]} style={{ marginBottom: rem(20) }} />
              <Title order={3} style={{ color: theme.colors.gray[6] }} mb="sm">
                {hasSearchQuery ? 'No volumes found' : 'No volumes available'}
              </Title>
              <Text size="lg" style={{ color: theme.colors.gray[6] }} mb="xl">
                {hasSearchQuery
                  ? 'Try adjusting your search terms or filters'
                  : 'Check back later for new volumes'}
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
                {paginatedVolumes.map((volume, index) => (
                  <motion.div
                    key={volume.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: Math.min(index * 0.1, 1.0) }} // Increased stagger for better loading
                    style={{
                      width: '200px',
                      height: '280px' // Playing card aspect ratio: 200px * 1.4 = 280px
                    }}
                  >
                    <Card
                      component={Link}
                      href={`/volumes/${volume.id}`}
                      withBorder={false}
                      radius="lg"
                      shadow="sm"
                      style={getPlayingCardStyles(theme, accentVolume)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-4px)'
                        e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.25)'
                        handleVolumeMouseEnter(volume, e)
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.boxShadow = theme.shadows.sm
                        handleVolumeMouseLeave()
                      }}
                    >
                      {/* Chapter range Badge at Top Left */}
                      <Badge
                        variant="filled"
                        radius="sm"
                        size="sm"
                        c="white"
                        style={{
                          position: 'absolute',
                          top: rem(8),
                          left: rem(8),
                          backgroundColor: accentVolume,
                          fontSize: rem(10),
                          fontWeight: 700,
                          zIndex: 10,
                          backdropFilter: 'blur(4px)',
                          maxWidth: 'calc(100% - 16px)'
                        }}
                      >
                        Ch. {volume.startChapter}-{volume.endChapter}
                      </Badge>

                      {/* Main Image Section - Takes up most of the card */}
                      <Box style={{
                        position: 'relative',
                        overflow: 'hidden',
                        flex: 1,
                        minHeight: 0
                      }}>
                        <ErrorBoundary>
                          <MediaThumbnail
                            entityType="volume"
                            entityId={volume.id}
                            entityName={`Volume ${volume.number}`}
                            maxWidth={200}
                            maxHeight={240}
                            allowCycling={false}
                            inline={false}
                          />
                        </ErrorBoundary>
                      </Box>

                      {/* Volume Title at Bottom */}
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
                          c={accentVolume}
                          ta="center"
                          style={{
                            lineHeight: 1.2,
                            fontSize: rem(13),
                            background: `linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))`,
                            backdropFilter: 'blur(4px)',
                            borderRadius: rem(6),
                            padding: `${rem(4)} ${rem(8)}`,
                            border: `1px solid rgba(255,255,255,0.1)`
                          }}
                        >
                          {volume.title || `Volume ${volume.number}`}
                        </Text>
                      </Box>
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
                {/* Always show pagination info when we have volumes */}
                {allVolumes.length > 0 && (
                  <Text size="sm" style={{ color: theme.colors.gray[6] }}>
                    Showing {paginatedVolumes.length} of {total} volumes
                    {totalPages > 1 && ` • Page ${currentPage} of ${totalPages}`}
                  </Text>
                )}

                {/* Show pagination controls when we have multiple pages */}
                {totalPages > 1 && (
                  <Pagination
                    total={totalPages}
                    value={currentPage}
                    onChange={handlePageChange}
                    style={{ color: getEntityThemeColor(theme, 'gamble') }}
                    size="lg"
                    radius="xl"
                    withEdges
                  />
                )}

                {loading && <Loader size="sm" color={accentVolume} />}
              </Box>
            </>
          )}
        </>
      )}

      {/* Hover Modal */}
      <AnimatePresence>
        {hoveredVolume && hoverModalPosition && (
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
                border: `2px solid ${accentVolume}`,
                backdropFilter: 'blur(10px)',
                width: rem(300),
                maxWidth: '90vw'
              }}
            >
              <Stack gap="sm">
                {/* Volume Title */}
                <Title
                  order={4}
                  size="md"
                  fw={700}
                  c={accentVolume}
                  ta="center"
                  lineClamp={2}
                >
                  {hoveredVolume.title || `Volume ${hoveredVolume.number}`}
                </Title>

                {/* Volume Info */}
                <Group justify="center" gap="xs">
                  <Badge
                    variant="filled"
                    c="white"
                    size="sm"
                    fw={600}
                    leftSection={<Hash size={12} />}
                    style={{ backgroundColor: getEntityThemeColor(theme, 'media') }}
                  >
                    Ch. {hoveredVolume.startChapter}-{hoveredVolume.endChapter}
                  </Badge>
                </Group>

                {/* Description */}
                {hoveredVolume.description && (
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
                    {hoveredVolume.description}
                  </Text>
                )}

                {/* Chapter Count */}
                <Group justify="center">
                  <Text size="xs" style={{ color: theme.colors.gray[6] }}>
                    {hoveredVolume.endChapter - hoveredVolume.startChapter + 1} chapters
                  </Text>
                </Group>
              </Stack>
            </Paper>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
    </Box>
  )
}
