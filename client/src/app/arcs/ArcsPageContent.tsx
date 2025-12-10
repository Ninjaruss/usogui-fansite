'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ActionIcon,
  Alert,
  Badge,
  Box,
  Button,
  Card,
  Group,
  Loader,
  Modal,
  Pagination,
  Paper,
  Stack,
  Text,
  TextInput,
  Title,
  rem,
  useMantineTheme
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { getEntityThemeColor, backgroundStyles, getHeroStyles, getPlayingCardStyles } from '../../lib/mantine-theme'
import { Search, BookOpen, Edit, Upload, X } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'motion/react'
import MediaThumbnail from '../../components/MediaThumbnail'
import { api } from '../../lib/api'
import { useAuth } from '../../providers/AuthProvider'

interface Arc {
  id: number
  name: string
  description?: string
  startChapter?: number
  endChapter?: number
  createdAt?: string
  updatedAt?: string
  imageFileName?: string
  imageDisplayName?: string
}

interface ArcsPageContentProps {
  initialArcs: Arc[]
  initialTotalPages: number
  initialTotal: number
  initialPage: number
  initialSearch: string
  initialCharacter?: string
  initialError: string
}

const PAGE_SIZE = 12

export default function ArcsPageContent({
  initialArcs,
  initialPage,
  initialSearch,
  initialCharacter,
  initialError
}: ArcsPageContentProps) {
  const { user } = useAuth()
  const theme = useMantineTheme()
  const router = useRouter()

  // Load all arcs once - no pagination needed on API level
  const [allArcs, setAllArcs] = useState<Arc[]>(initialArcs)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(initialError)
  const [searchQuery, setSearchQuery] = useState(initialSearch)
  const [currentPage, setCurrentPage] = useState(initialPage)
  const [characterFilter, setCharacterFilter] = useState<string | null>(initialCharacter || null)

  const [imageDialogOpen, setImageDialogOpen] = useState(false)
  const [selectedArc, setSelectedArc] = useState<Arc | null>(null)
  const [imageDisplayName, setImageDisplayName] = useState('')
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const searchDebounceRef = useRef<number | null>(null)

  // Hover modal state
  const [hoveredArc, setHoveredArc] = useState<Arc | null>(null)
  const [hoverModalPosition, setHoverModalPosition] = useState<{ x: number; y: number } | null>(null)
  const hoverTimeoutRef = useRef<number | null>(null)
  const hoveredElementRef = useRef<HTMLElement | null>(null)

  const isModeratorOrAdmin = user?.role === 'moderator' || user?.role === 'admin'

  // Load all arcs once on mount
  const loadAllArcs = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      // Load all arcs (small dataset)
      const response = await api.getArcs({ limit: 100 })
      setAllArcs(response.data || [])
    } catch (err: any) {
      console.error('Error loading arcs:', err)
      if (err?.status === 429) {
        setError('Rate limit exceeded. Please wait a moment and try again.')
      } else {
        setError('Failed to load arcs. Please try again later.')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  // Client-side filtering and pagination
  const filteredArcs = useMemo(() => {
    let filtered = allArcs

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter(arc => {
        const name = arc.name?.toLowerCase() || ''
        const description = arc.description?.toLowerCase() || ''
        return name.includes(query) || description.includes(query)
      })
    }

    // Note: Character filtering would require additional API calls,
    // keeping it simple for now since it's complex to implement client-side

    return filtered
  }, [allArcs, searchQuery])

  const paginatedArcs = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE
    return filteredArcs.slice(startIndex, startIndex + PAGE_SIZE)
  }, [filteredArcs, currentPage])

  const totalPages = Math.ceil(filteredArcs.length / PAGE_SIZE)
  const total = filteredArcs.length

  // Load all arcs on mount
  useEffect(() => {
    if (allArcs.length === 0) {
      loadAllArcs()
    }
  }, [allArcs.length, loadAllArcs])

  // Function to update modal position based on hovered element
  const updateModalPosition = useCallback((arc?: Arc) => {
    const currentArc = arc || hoveredArc
    if (hoveredElementRef.current && currentArc) {
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
  }, [hoveredArc])

  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) {
        window.clearTimeout(searchDebounceRef.current)
      }
      if (hoverTimeoutRef.current) {
        window.clearTimeout(hoverTimeoutRef.current)
      }
    }
  }, [])

  // Add scroll and resize listeners to update modal position
  useEffect(() => {
    if (hoveredArc && hoveredElementRef.current) {
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
  }, [hoveredArc, updateModalPosition])

  const updateUrl = useCallback(
    (newPage: number, newSearch: string, newCharacter?: string | null) => {
      const params = new URLSearchParams()
      if (newSearch) params.set('search', newSearch)
      if (newCharacter) params.set('character', newCharacter)
      if (newPage > 1) params.set('page', newPage.toString())
      const href = params.toString() ? `/arcs?${params.toString()}` : '/arcs'
      router.push(href, { scroll: false })
    },
    [router]
  )

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    setSearchQuery(value)
    setCurrentPage(1)
    updateUrl(1, value, characterFilter)

    if (searchDebounceRef.current) {
      window.clearTimeout(searchDebounceRef.current)
    }

    searchDebounceRef.current = window.setTimeout(() => {
      loadAllArcs().catch(() => {})
    }, 300)
  }

  const handlePageChange = (pageValue: number) => {
    setCurrentPage(pageValue)
    updateUrl(pageValue, searchQuery, characterFilter)
  }

  const handleClearSearch = () => {
    setSearchQuery('')
    setCurrentPage(1)
    setCharacterFilter(null)
    updateUrl(1, '', null)
    loadAllArcs().catch(() => {})
  }


  const formatChapterRange = (arc: Arc) => {
    if (typeof arc.startChapter === 'number' && typeof arc.endChapter === 'number') {
      return `Ch. ${arc.startChapter}-${arc.endChapter}`
    }
    return null
  }

  const handleEditImage = (arc: Arc) => {
    setSelectedArc(arc)
    setImageDisplayName(arc.imageDisplayName || '')
    setSelectedFile(null)
    setImageDialogOpen(true)
  }

  const handleCloseImageDialog = () => {
    setImageDialogOpen(false)
    setSelectedArc(null)
    setImageDisplayName('')
    setSelectedFile(null)
    setPreviewUrl(null)
    setDragActive(false)
  }

  const validateAndSetFile = (file: File) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      notifications.show({
        message: 'Please select a valid image file (JPEG, PNG, WebP, or GIF)',
        color: 'red'
      })
      return false
    }

    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      notifications.show({ message: 'File size must be less than 10MB', color: 'red' })
      return false
    }

    setSelectedFile(file)

    // Create preview URL
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    return true
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    validateAndSetFile(file)
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = e.dataTransfer.files
    if (files && files[0]) {
      validateAndSetFile(files[0])
    }
  }

  const handleUploadImage = async () => {
    if (!selectedArc || !selectedFile) return

    setUploading(true)
    try {
  await api.uploadArcImage(selectedArc.id, selectedFile, imageDisplayName.trim() || undefined)
  await loadAllArcs()
      notifications.show({ message: 'Arc image uploaded successfully!', color: 'green' })
      handleCloseImageDialog()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to upload image'
      notifications.show({ message, color: 'red' })
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveImage = async () => {
    if (!selectedArc) return

    setUploading(true)
    try {
  await api.removeArcImage(selectedArc.id)
  await loadAllArcs()
      notifications.show({ message: 'Arc image removed successfully!', color: 'green' })
      handleCloseImageDialog()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to remove image'
      notifications.show({ message, color: 'red' })
    } finally {
      setUploading(false)
    }
  }

  // Hover modal handlers
  const handleArcMouseEnter = (arc: Arc, event: React.MouseEvent) => {
    const element = event.currentTarget as HTMLElement
    hoveredElementRef.current = element

    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
    }

    hoverTimeoutRef.current = window.setTimeout(() => {
      setHoveredArc(arc)
      updateModalPosition(arc) // Pass arc directly to ensure position calculation works immediately
    }, 500) // 500ms delay before showing
  }

  const handleArcMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
    }

    // Small delay before hiding to allow moving to modal
    hoverTimeoutRef.current = window.setTimeout(() => {
      setHoveredArc(null)
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
    setHoveredArc(null)
    setHoverModalPosition(null)
    hoveredElementRef.current = null
  }

  const accentArc = theme.other?.usogui?.arc ?? theme.colors.pink?.[5] ?? '#dc004e'
  const hasSearchQuery = Boolean(searchQuery || characterFilter)

  return (
    <Box style={{ backgroundColor: backgroundStyles.page(theme), minHeight: '100vh' }}>
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      {/* Hero Section */}
      <Box
        style={getHeroStyles(theme, accentArc)}
        p="md"
      >
        <Stack align="center" gap="xs">
          <Box
            style={{
              background: `linear-gradient(135deg, ${accentArc}, ${accentArc}CC)`,
              borderRadius: '50%',
              width: rem(40),
              height: rem(40),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 4px 16px ${accentArc}40`
            }}
          >
            <BookOpen size={20} color="white" />
          </Box>

          <Stack align="center" gap="xs">
            <Title order={1} size="1.5rem" fw={700} ta="center" c={accentArc}>
              Story Arcs
            </Title>
            <Text size="md" style={{ color: theme.colors.gray[6] }} ta="center" maw={400}>
              {characterFilter
                ? `Discover the epic arcs featuring ${characterFilter}`
                : 'Explore the major storylines and narrative arcs that define the world of Usogui'}
            </Text>

            {total > 0 && (
              <Badge
                size="md"
                variant="light"
                c={getEntityThemeColor(theme, 'arc')}
                style={{
                  backgroundColor: `${getEntityThemeColor(theme, 'arc')}20`,
                  borderColor: getEntityThemeColor(theme, 'arc')
                }}
                radius="xl"
                mt="xs"
              >
                {total} arc{total !== 1 ? 's' : ''} available
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
              placeholder="Search arcs by name or description..."
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
            <Badge size="lg"
              variant="filled"
              style={{ backgroundColor: getEntityThemeColor(theme, 'arc') }}
              radius="xl"
              rightSection={
                <ActionIcon size="xs" style={{ color: getEntityThemeColor(theme, 'arc') }} variant="transparent" onClick={() => {
                  setCharacterFilter(null)
                  setCurrentPage(1)
                  updateUrl(1, searchQuery, null)
                  loadAllArcs()
                }}>
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
        <Box px="md">
          <Alert
            style={{ color: getEntityThemeColor(theme, 'gamble') }}
            radius="md"
            mb="xl"
            icon={<X size={16} />}
            title="Error loading arcs"
          >
            {error}
          </Alert>
        </Box>
      )}

      {/* Loading State */}
      {loading ? (
        <Box style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingBlock: rem(80) }}>
          <Loader size="xl" color={accentArc} mb="md" />
          <Text size="lg" style={{ color: theme.colors.gray[6] }}>Loading arcs...</Text>
        </Box>
      ) : (
        <>
          {/* Empty State */}
          {filteredArcs.length === 0 ? (
            <Box style={{ textAlign: 'center', paddingBlock: rem(80) }}>
              <BookOpen size={64} color={theme.colors.gray[4]} style={{ marginBottom: rem(20) }} />
              <Title order={3} style={{ color: theme.colors.gray[6] }} mb="sm">
                {hasSearchQuery ? 'No arcs found' : 'No arcs available'}
              </Title>
              <Text size="lg" style={{ color: theme.colors.gray[6] }} mb="xl">
                {hasSearchQuery
                  ? 'Try adjusting your search terms or filters'
                  : 'Check back later for new story arcs'}
              </Text>
              {hasSearchQuery && (
                <Button variant="outline" style={{ color: getEntityThemeColor(theme, 'arc') }} onClick={handleClearSearch}>
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
                {paginatedArcs.map((arc, index) => (
                  <motion.div
                    key={arc.id}
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
                        href={`/arcs/${arc.id}`}
                        withBorder={false}
                        radius="lg"
                        shadow="sm"
                        style={getPlayingCardStyles(theme, accentArc)}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-4px)'
                          e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.25)'
                          handleArcMouseEnter(arc, e)
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)'
                          e.currentTarget.style.boxShadow = theme.shadows.sm
                          handleArcMouseLeave()
                        }}
                      >
                        {/* Chapter Number Badge at Top Left */}
                        {formatChapterRange(arc) && (
                          <Badge
                            variant="filled"
                            radius="sm"
                            size="sm"
                            style={{
                              color: 'white',
                              position: 'absolute',
                              top: rem(8),
                              left: rem(8),
                              backgroundColor: accentArc,
                              fontSize: rem(10),
                              fontWeight: 700,
                              zIndex: 10,
                              backdropFilter: 'blur(4px)',
                              maxWidth: isModeratorOrAdmin ? 'calc(100% - 60px)' : 'calc(100% - 16px)'
                            }}
                          >
                            {formatChapterRange(arc)}
                          </Badge>
                        )}

                        {/* Edit Button at Top Right */}
                        {isModeratorOrAdmin && (
                          <ActionIcon
                            size="xs"
                            variant="filled"
                            color="dark"
                            radius="xl"
                            style={{
                              position: 'absolute',
                              top: rem(8),
                              right: rem(8),
                              backgroundColor: 'rgba(0, 0, 0, 0.8)',
                              backdropFilter: 'blur(4px)',
                              zIndex: 10,
                              width: rem(24),
                              height: rem(24)
                            }}
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              handleEditImage(arc)
                            }}
                          >
                            <Edit size={12} />
                          </ActionIcon>
                        )}

                        {/* Main Image Section - Takes up most of the card */}
                        <Box style={{
                          position: 'relative',
                          overflow: 'hidden',
                          flex: 1,
                          minHeight: 0
                        }}>
                          <MediaThumbnail
                            entityType="arc"
                            entityId={arc.id}
                            entityName={arc.name}
                            maxWidth={200}
                            maxHeight={240}
                            allowCycling={false}
                          />
                        </Box>

                        {/* Arc Name at Bottom */}
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
                            c={accentArc}
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
                            {arc.name}
                          </Text>
                        </Box>
                      </Card>
                    </motion.div>
                ))}
              </Box>

              {/* Pagination */}
              {totalPages > 1 && (
                <Box px="md" style={{ display: 'flex', justifyContent: 'center', marginTop: rem(48) }}>
                  <Pagination
                    total={totalPages}
                    value={currentPage}
                    onChange={handlePageChange}
                    style={{ color: getEntityThemeColor(theme, 'arc') }}
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

      {/* Image Upload Modal */}
      <Modal
        opened={imageDialogOpen}
        onClose={handleCloseImageDialog}
        title={`Edit Image for ${selectedArc?.name || 'Arc'}`}
        radius="lg"
        centered
        size="lg"
        overlayProps={{ opacity: 0.65, blur: 8 }}
      >
        <Stack gap="lg">
          <Box
            onClick={() => document.getElementById('arc-image-upload')?.click()}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            style={{
              border: `2px dashed ${dragActive ? theme.colors.green?.[5] : accentArc}`,
              borderRadius: theme.radius.lg,
              padding: rem(24),
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'all 0.3s ease',
              backgroundColor: dragActive ? `${theme.colors.green?.[5]}08` : `${accentArc}08`,
              transform: dragActive ? 'scale(1.02)' : 'scale(1)'
            }}
          >
            <input
              id="arc-image-upload"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              style={{ display: 'none' }}
              onChange={handleFileSelect}
            />
            <Upload size={40} color={dragActive ? theme.colors.green?.[5] : accentArc} style={{ marginBottom: rem(16) }} />
            {selectedFile ? (
              <Stack gap="xs" align="center">
                <Text size="lg" fw={600} c={accentArc}>
                  {selectedFile.name}
                </Text>
                <Text size="sm" style={{ color: theme.colors.gray[6] }}>
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                </Text>
              </Stack>
            ) : (
              <Stack gap="xs" align="center">
                <Text size="lg" fw={600} c={dragActive ? theme.colors.green?.[5] : accentArc}>
                  {dragActive ? 'Drop image here' : 'Select or Drop Image File'}
                </Text>
                <Text size="sm" style={{ color: theme.colors.gray[6] }}>
                  Supported: JPEG, PNG, WebP, GIF • Max size: 10MB
                </Text>
              </Stack>
            )}
          </Box>

          {/* Image Preview */}
          {previewUrl && (
            <Box ta="center">
              <Text size="sm" style={{ color: theme.colors.gray[6] }} mb="md" fw={500}>
                New Image Preview
              </Text>
              <Box
                style={{
                  maxWidth: rem(300),
                  margin: '0 auto',
                  border: `1px solid ${theme.colors.gray?.[3]}`,
                  borderRadius: theme.radius.md,
                  overflow: 'hidden'
                }}
              >
                <Image
                  src={previewUrl}
                  alt="Preview"
                  width={400}
                  height={200}
                  style={{
                    width: '100%',
                    height: 'auto',
                    maxHeight: rem(200),
                    objectFit: 'contain'
                  }}
                />
              </Box>
            </Box>
          )}

          <TextInput
            label="Display Name (Optional)"
            placeholder="e.g., Official Cover Art"
            value={imageDisplayName}
            onChange={(event) => setImageDisplayName(event.currentTarget.value)}
            size="md"
            radius="md"
          />

          {selectedFile && (
            <Group justify="center">
              <Button
                variant="subtle"
                color="gray"
                leftSection={<X size={16} />}
                onClick={() => {
                  setSelectedFile(null)
                  setPreviewUrl(null)
                  const input = document.getElementById('arc-image-upload') as HTMLInputElement
                  if (input) input.value = ''
                }}
                size="sm"
                radius="xl"
              >
                Clear Selection
              </Button>
            </Group>
          )}

          {selectedArc?.imageFileName && (
            <Box ta="center">
              <Text size="sm" style={{ color: theme.colors.gray[6] }} mb="md" fw={500}>
                Current Image
              </Text>
              <MediaThumbnail
                entityType="arc"
                entityId={selectedArc.id}
                entityName={selectedArc.name}
                maxWidth="200px"
                maxHeight="200px"
                allowCycling={false}
              />
            </Box>
          )}

          <Group justify="space-between" mt="md">
            {selectedArc?.imageFileName ? (
              <Button
                variant="outline"
                color="gray"
                leftSection={<X size={16} />}
                onClick={handleRemoveImage}
                loading={uploading}
                radius="xl"
              >
                Remove Image
              </Button>
            ) : (
              <Box />
            )}

            <Group gap="sm">
              <Button
                variant="subtle"
                color="gray"
                onClick={handleCloseImageDialog}
                disabled={uploading}
                radius="xl"
              >
                Cancel
              </Button>
              <Button
                variant="gradient"
                gradient={{ from: accentArc, to: 'pink' }}
                leftSection={!uploading ? <Upload size={16} /> : undefined}
                onClick={handleUploadImage}
                disabled={!selectedFile}
                loading={uploading}
                radius="xl"
              >
                {uploading ? 'Uploading…' : 'Upload Image'}
              </Button>
            </Group>
          </Group>
        </Stack>
      </Modal>

      {/* Hover Modal */}
      <AnimatePresence>
        {hoveredArc && hoverModalPosition && (
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
                backgroundColor: backgroundStyles.modal,
                border: `2px solid ${accentArc}`,
                backdropFilter: 'blur(10px)',
                width: rem(300),
                maxWidth: '90vw'
              }}
            >
              <Stack gap="sm">
                {/* Arc Name */}
                <Title
                  order={4}
                  size="md"
                  fw={700}
                  c={accentArc}
                  ta="center"
                  lineClamp={2}
                >
                  {hoveredArc.name}
                </Title>

                {/* Arc Number/Order */}
                <Group justify="center" gap="xs">
                  <Badge
                    variant="light"
                    style={{ color: getEntityThemeColor(theme, 'arc') }}
                    size="sm"
                    fw={600}
                  >
                    Arc #{filteredArcs.findIndex(a => a.id === hoveredArc.id) + 1}
                  </Badge>
                  {formatChapterRange(hoveredArc) && (
                    <Badge
                      variant="filled"
                      style={{ color: 'white', backgroundColor: accentArc }}
                      size="sm"
                      fw={600}
                    >
                      {formatChapterRange(hoveredArc)}
                    </Badge>
                  )}
                </Group>

                {/* Description */}
                {hoveredArc.description && (
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
                    {hoveredArc.description}
                  </Text>
                )}

                {/* Start Chapter */}
                {hoveredArc.startChapter && (
                  <Group justify="center" gap="xs">
                    <Text size="xs" style={{ color: theme.colors.gray[6] }}>
                      Starts:
                    </Text>
                    <Text size="xs" fw={500} c={accentArc}>
                      Chapter {hoveredArc.startChapter}
                    </Text>
                  </Group>
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
