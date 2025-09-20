'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
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
import { AlertCircle, Search, Book, Hash, X } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'motion/react'
import { api } from '../../lib/api'
import MediaThumbnail from '../../components/MediaThumbnail'

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

const PAGE_SIZE = 12

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
  const [volumes, setVolumes] = useState<Volume[]>(initialVolumes)
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentPage = parseInt(searchParams.get('page') || '1', 10)
  const currentSearch = searchParams.get('search') || ''

  const [totalPages, setTotalPages] = useState<number>(initialTotalPages)
  const [total, setTotal] = useState<number>(initialTotal)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(initialError || null)
  const [searchQuery, setSearchQuery] = useState(currentSearch || initialSearch)

  // Hover modal state
  const [hoveredVolume, setHoveredVolume] = useState<Volume | null>(null)
  const [hoverModalPosition, setHoverModalPosition] = useState<{ x: number; y: number } | null>(null)
  const hoverTimeoutRef = useRef<number | null>(null)
  const hoveredElementRef = useRef<HTMLElement | null>(null)

  const hasSearchQuery = searchQuery.trim().length > 0

  const fetchVolumes = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: PAGE_SIZE.toString()
      })

      if (searchQuery) {
        // If search query is numeric, use number parameter, otherwise use title/search
        if (!isNaN(Number(searchQuery))) {
          params.set('number', searchQuery)
        } else {
          params.set('title', searchQuery)
        }
      }

      const response = await api.get(`/volumes?${params}`)
      const data = await response.json()

      setVolumes(data.data || [])
      setTotal(data.total || 0)
      setTotalPages(data.totalPages || Math.ceil((data.total || 0) / PAGE_SIZE))
    } catch (error) {
      console.error('Error fetching volumes:', error)
      setError('Failed to load volumes. Please try again later.')
    } finally {
      setLoading(false)
    }
  }, [currentPage, searchQuery])

  useEffect(() => {
    if (searchQuery !== currentSearch || volumes.length === 0) {
      fetchVolumes()
    }
  }, [currentPage, searchQuery, currentSearch, volumes.length, fetchVolumes])

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
    const newSearch = event.currentTarget.value
    setSearchQuery(newSearch)
  }, [])

  // Debounce search query changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const params = new URLSearchParams()
      if (searchQuery) params.set('search', searchQuery)
      params.set('page', '1') // Reset to first page on new search

      router.push(`/volumes?${params.toString()}`)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery, router])

  const handleClearSearch = useCallback(() => {
    setSearchQuery('')

    const params = new URLSearchParams()
    params.set('page', '1')

    router.push(`/volumes?${params.toString()}`)
  }, [router])

  const handlePageChange = useCallback((page: number) => {
    const params = new URLSearchParams()
    if (searchQuery) params.set('search', searchQuery)
    params.set('page', page.toString())

    router.push(`/volumes?${params.toString()}`)
  }, [router, searchQuery])

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
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      {/* Hero Section */}
      <Box
        style={{
          background: `linear-gradient(135deg, ${accentVolume}15, ${accentVolume}08)`,
          borderRadius: theme.radius.lg,
          border: `1px solid ${accentVolume}25`,
          marginBottom: rem(24)
        }}
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
            <Text size="md" c="dimmed" ta="center" maw={400}>
              Explore the complete collection of Usogui manga volumes
            </Text>

            {total > 0 && (
              <Badge size="md" variant="light" color="red" radius="xl" mt="xs">
                {total} volume{total !== 1 ? 's' : ''} available
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
              placeholder="Search volumes by number or title..."
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
      </Box>

      {/* Error State */}
      {error && (
        <Alert
          color="red"
          radius="md"
          mb="xl"
          icon={<AlertCircle size={16} />}
          title="Error loading volumes"
        >
          {error}
        </Alert>
      )}

      {/* Loading State */}
      {loading ? (
        <Box style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingBlock: rem(80) }}>
          <Loader size="xl" color={accentVolume} mb="md" />
          <Text size="lg" c="dimmed">Loading volumes...</Text>
        </Box>
      ) : (
        <>
          {/* Empty State */}
          {volumes.length === 0 ? (
            <Box style={{ textAlign: 'center', paddingBlock: rem(80) }}>
              <Book size={64} color={theme.colors.gray[4]} style={{ marginBottom: rem(20) }} />
              <Title order={3} c="dimmed" mb="sm">
                {hasSearchQuery ? 'No volumes found' : 'No volumes available'}
              </Title>
              <Text size="lg" c="dimmed" mb="xl">
                {hasSearchQuery
                  ? 'Try adjusting your search terms or filters'
                  : 'Check back later for new volumes'}
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
                {volumes.map((volume, index) => (
                  <motion.div
                    key={volume.id}
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
                      href={`/volumes/${volume.id}`}
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
                        handleVolumeMouseEnter(volume, e)
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.boxShadow = theme.shadows.sm
                        handleVolumeMouseLeave()
                      }}
                    >
                      {/* Volume Number Badge at Top Left */}
                      <Badge
                        variant="filled"
                        color="red"
                        radius="sm"
                        size="sm"
                        style={{
                          position: 'absolute',
                          top: rem(8),
                          left: rem(8),
                          backgroundColor: 'rgba(239, 68, 68, 0.95)',
                          color: 'white',
                          fontSize: rem(10),
                          fontWeight: 700,
                          zIndex: 10,
                          backdropFilter: 'blur(4px)',
                          maxWidth: 'calc(100% - 16px)'
                        }}
                      >
                        Vol. {volume.number}
                      </Badge>

                      {/* Main Image Section - Takes up most of the card */}
                      <Box style={{
                        position: 'relative',
                        overflow: 'hidden',
                        flex: 1,
                        minHeight: 0
                      }}>
                        <MediaThumbnail
                          entityType="volume"
                          entityId={volume.id}
                          entityName={`Volume ${volume.number}`}
                          maxWidth="100%"
                          maxHeight="100%"
                          allowCycling={false}
                        />
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
                            textShadow: '0 2px 4px rgba(0,0,0,0.8), 0 1px 2px rgba(255,255,255,0.2)',
                            fontSize: rem(13),
                            background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
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
                    variant="light"
                    color="red"
                    size="sm"
                    fw={600}
                  >
                    Volume #{hoveredVolume.number}
                  </Badge>
                  <Badge
                    variant="filled"
                    color="violet"
                    size="sm"
                    fw={600}
                    leftSection={<Hash size={12} />}
                  >
                    Ch. {hoveredVolume.startChapter}-{hoveredVolume.endChapter}
                  </Badge>
                </Group>

                {/* Description */}
                {hoveredVolume.description && (
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
                    {hoveredVolume.description}
                  </Text>
                )}

                {/* Chapter Count */}
                <Group justify="center">
                  <Text size="xs" c="dimmed">
                    {hoveredVolume.endChapter - hoveredVolume.startChapter + 1} chapters
                  </Text>
                </Group>
              </Stack>
            </Paper>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}