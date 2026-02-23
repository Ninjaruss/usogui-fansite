'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Card,
  Group,
  Modal,
  Stack,
  Text,
  TextInput,
  Title,
  Tooltip,
  rem,
  useMantineTheme
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { getEntityThemeColor, backgroundStyles } from '../../lib/mantine-theme'
import { BookOpen, Upload, X } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import MediaThumbnail from '../../components/MediaThumbnail'
import { ScrollToTop } from '../../components/ScrollToTop'
import { api } from '../../lib/api'
import { useAuth } from '../../providers/AuthProvider'
import { useHoverModal } from '../../hooks/useHoverModal'
import { HoverModal } from '../../components/HoverModal'
import { ListPageLayout } from '../../components/layouts/ListPageLayout'
import { PlayingCard } from '../../components/cards/PlayingCard'

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
  parentId?: number | null
  children?: Arc[]
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

type SortOption = 'name' | 'startChapter'

const sortOptions = [
  { value: 'name', label: 'Name (A-Z)' },
  { value: 'startChapter', label: 'Start Chapter' }
]

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
  const searchParams = useSearchParams()

  const accentArc = theme.other?.usogui?.arc ?? theme.colors.pink?.[5] ?? '#dc004e'

  const [allArcs, setAllArcs] = useState<Arc[]>(initialArcs)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(initialError)
  const [searchQuery, setSearchQuery] = useState(initialSearch)
  const [currentPage, setCurrentPage] = useState(initialPage)
  const [characterFilter, setCharacterFilter] = useState<string | null>(initialCharacter || null)
  const [sortBy, setSortBy] = useState<SortOption>((searchParams.get('sort') as SortOption) || 'startChapter')

  // Image upload state
  const [imageDialogOpen, setImageDialogOpen] = useState(false)
  const [selectedArc, setSelectedArc] = useState<Arc | null>(null)
  const [imageDisplayName, setImageDisplayName] = useState('')
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  // Track revealed spoilers
  const currentlyHoveredRef = useRef<{ arc: Arc; element: HTMLElement } | null>(null)

  // Hover modal
  const {
    hoveredItem: hoveredArc,
    hoverPosition,
    handleMouseEnter: handleArcMouseEnter,
    handleMouseLeave: handleArcMouseLeave,
    handleModalMouseEnter,
    handleModalMouseLeave,
    handleTap: handleArcTap,
    closeModal,
    isTouchDevice
  } = useHoverModal<Arc>()

  const canEditContent = user?.role === 'moderator' || user?.role === 'admin'
  const hasSearchQuery = Boolean(searchQuery || characterFilter)

  // Load all arcs once on mount
  const loadAllArcs = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await api.getArcs({ limit: 100, includeHierarchy: true })
      setAllArcs(response.data || [])
    } catch (err: any) {
      console.error('Error loading arcs:', err)
      setError(err?.status === 429 ? 'Rate limit exceeded. Please wait a moment and try again.' : 'Failed to load arcs. Please try again later.')
    } finally {
      setLoading(false)
    }
  }, [])

  // Client-side filtering, sorting, and pagination
  const filteredArcs = useMemo(() => {
    let filtered = allArcs

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter(arc => {
        const nameMatch = arc.name?.toLowerCase().includes(query)
        const descMatch = arc.description?.toLowerCase().includes(query)
        const childMatch = arc.children?.some(child =>
          child.name?.toLowerCase().includes(query) ||
          child.description?.toLowerCase().includes(query)
        )
        return nameMatch || descMatch || childMatch
      })
    }

    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.name || '').localeCompare(b.name || '')
        case 'startChapter':
          return (a.startChapter || 999) - (b.startChapter || 999)
        default:
          return 0
      }
    })
  }, [allArcs, searchQuery, sortBy])

  const paginatedArcs = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE
    return filteredArcs.slice(startIndex, startIndex + PAGE_SIZE)
  }, [filteredArcs, currentPage])

  const totalPages = Math.ceil(filteredArcs.length / PAGE_SIZE)
  const total = filteredArcs.length

  useEffect(() => {
    if (allArcs.length === 0) {
      loadAllArcs()
    }
  }, [allArcs.length, loadAllArcs])

  const updateUrl = useCallback(
    (newPage: number, newSearch: string, newCharacter?: string | null, newSort?: SortOption) => {
      const params = new URLSearchParams()
      if (newSearch) params.set('search', newSearch)
      if (newCharacter) params.set('character', newCharacter)
      if (newPage > 1) params.set('page', newPage.toString())
      if (newSort && newSort !== 'startChapter') params.set('sort', newSort)
      const href = params.toString() ? `/arcs?${params.toString()}` : '/arcs'
      router.push(href, { scroll: false })
    },
    [router]
  )

  const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    setSearchQuery(value)
    setCurrentPage(1)
    updateUrl(1, value, characterFilter, sortBy)
  }, [characterFilter, sortBy, updateUrl])

  const handlePageChange = useCallback((pageValue: number) => {
    setCurrentPage(pageValue)
    updateUrl(pageValue, searchQuery, characterFilter, sortBy)
  }, [searchQuery, characterFilter, sortBy, updateUrl])

  const handleClearSearch = useCallback(() => {
    setSearchQuery('')
    setCurrentPage(1)
    setCharacterFilter(null)
    updateUrl(1, '', null, sortBy)
  }, [sortBy, updateUrl])

  const handleSortChange = useCallback((value: string | null) => {
    const newSort = (value as SortOption) || 'name'
    setSortBy(newSort)
    setCurrentPage(1)
    updateUrl(1, searchQuery, characterFilter, newSort)
  }, [searchQuery, characterFilter, updateUrl])

  const formatChapterRange = (arc: Arc) => {
    if (typeof arc.startChapter === 'number' && typeof arc.endChapter === 'number') {
      return `Ch. ${arc.startChapter}-${arc.endChapter}`
    }
    return null
  }

  // Image upload handlers
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
      notifications.show({ message: 'Please select a valid image file (JPEG, PNG, WebP, or GIF)', color: 'red' })
      return false
    }
    if (file.size > 10 * 1024 * 1024) {
      notifications.show({ message: 'File size must be less than 10MB', color: 'red' })
      return false
    }
    setSelectedFile(file)
    const reader = new FileReader()
    reader.onload = (e) => setPreviewUrl(e.target?.result as string)
    reader.readAsDataURL(file)
    return true
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) validateAndSetFile(file)
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true)
    else if (e.type === 'dragleave') setDragActive(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    const files = e.dataTransfer.files
    if (files?.[0]) validateAndSetFile(files[0])
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
      notifications.show({ message: error instanceof Error ? error.message : 'Failed to upload image', color: 'red' })
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
      notifications.show({ message: error instanceof Error ? error.message : 'Failed to remove image', color: 'red' })
    } finally {
      setUploading(false)
    }
  }

  // Card render - includes sub-arcs hierarchy
  const renderArcCard = useCallback((arc: Arc) => {
    const chapterBadge = formatChapterRange(arc) || undefined

    const handleCardClick = (e: React.MouseEvent) => {
      if (isTouchDevice) {
        if (hoveredArc?.id !== arc.id) {
          e.preventDefault()
          handleArcTap(arc, e)
        }
      }
    }

    return (
      <Stack gap="xs">
        <PlayingCard
          entityType="arc"
          href={`/arcs/${arc.id}`}
          entityId={arc.id}
          name={arc.name}
          chapterBadge={chapterBadge}
          canEdit={canEditContent}
          onEditClick={() => handleEditImage(arc)}
          spoilerChapter={arc.startChapter}
          onSpoilerRevealed={() => {}}
          onClick={handleCardClick}
          onMouseEnter={(e) => {
            if (!isTouchDevice) {
              currentlyHoveredRef.current = { arc, element: e.currentTarget as HTMLElement }
              handleArcMouseEnter(arc, e)
            }
          }}
          onMouseLeave={() => {
            if (!isTouchDevice) {
              currentlyHoveredRef.current = null
              handleArcMouseLeave()
            }
          }}
          isTouchDevice={isTouchDevice}
          isHovered={hoveredArc?.id === arc.id}
        />

        {/* Sub-arcs section */}
        {arc.children && arc.children.length > 0 && (
          <Stack gap="xs">
            <Box
              px="xs"
              py={4}
              style={{
                borderLeft: `3px solid ${accentArc}`,
                background: `linear-gradient(90deg, ${accentArc}15, transparent)`,
                borderRadius: `0 ${rem(4)} ${rem(4)} 0`
              }}
            >
              <Text size="xs" fw={700} c={accentArc} tt="uppercase" style={{ letterSpacing: '0.5px' }}>
                {arc.children.length} Sub-arc{arc.children.length > 1 ? 's' : ''}
              </Text>
            </Box>

            <Stack gap={4} px="xs">
              {arc.children.map((child) => (
                <Card
                  key={child.id}
                  component={Link}
                  href={`/arcs/${child.id}`}
                  withBorder
                  radius="sm"
                  padding="xs"
                  style={{
                    textDecoration: 'none',
                    borderColor: `${accentArc}40`,
                    backgroundColor: backgroundStyles.card,
                    transition: 'all 0.2s ease',
                    cursor: 'pointer'
                  }}
                  className="hoverable-card"
                  onMouseEnter={(e) => {
                    currentlyHoveredRef.current = { arc: child, element: e.currentTarget as HTMLElement }
                    handleArcMouseEnter(child, e)
                  }}
                  onMouseLeave={() => {
                    currentlyHoveredRef.current = null
                    handleArcMouseLeave()
                  }}
                >
                  <Group gap="xs" justify="space-between" wrap="nowrap">
                    <Tooltip label={child.name} position="top" withArrow multiline maw={300}>
                      <Text size="xs" fw={600} c={accentArc} lineClamp={1} style={{ flex: 1 }}>
                        {child.name}
                      </Text>
                    </Tooltip>
                    {formatChapterRange(child) && (
                      <Badge size="xs" variant="light" c={accentArc} style={{ flexShrink: 0 }}>
                        {formatChapterRange(child)}
                      </Badge>
                    )}
                  </Group>
                </Card>
              ))}
            </Stack>
          </Stack>
        )}
      </Stack>
    )
  }, [isTouchDevice, hoveredArc, canEditContent, accentArc, handleArcMouseEnter, handleArcMouseLeave, handleArcTap])

  // Character filter badge
  const activeFilterBadges = characterFilter ? (
    <Group justify="center" mb="md">
      <Badge
        size="lg"
        variant="filled"
        style={{ backgroundColor: getEntityThemeColor(theme, 'arc') }}
        radius="xl"
        rightSection={
          <ActionIcon
            size="xs"
            style={{ color: getEntityThemeColor(theme, 'arc') }}
            variant="transparent"
            onClick={() => {
              setCharacterFilter(null)
              setCurrentPage(1)
              updateUrl(1, searchQuery, null, sortBy)
              loadAllArcs()
            }}
            aria-label="Clear character filter"
          >
            <X size={12} />
          </ActionIcon>
        }
      >
        Character: {characterFilter}
      </Badge>
    </Group>
  ) : undefined

  return (
    <>
      <ListPageLayout
        entityType="arc"
        icon={<BookOpen size={24} color="white" />}
        title="Story Arcs"
        subtitle={characterFilter
          ? `Discover the epic arcs featuring ${characterFilter}`
          : 'Explore the major storylines and narrative arcs that define the world of Usogui'}
        items={paginatedArcs}
        total={total}
        totalPages={totalPages}
        currentPage={currentPage}
        pageSize={PAGE_SIZE}
        loading={loading}
        error={error}
        searchPlaceholder="Search arcs by name or description..."
        searchInput={searchQuery}
        onSearchChange={handleSearchChange}
        onClearSearch={handleClearSearch}
        hasActiveFilters={hasSearchQuery}
        sortOptions={sortOptions}
        sortValue={sortBy}
        onSortChange={handleSortChange}
        activeFilterBadges={activeFilterBadges}
        renderCard={renderArcCard}
        getKey={(a) => a.id}
        onPageChange={handlePageChange}
        entityNamePlural="arcs"
        emptyIcon={<BookOpen size={48} />}
        afterContent={<ScrollToTop accentColor={accentArc} />}
        hoverModal={
          <HoverModal
            isOpen={!!hoveredArc}
            position={hoverPosition}
            accentColor={accentArc}
            onMouseEnter={handleModalMouseEnter}
            onMouseLeave={handleModalMouseLeave}
            onClose={closeModal}
            showCloseButton={isTouchDevice}
          >
            {hoveredArc && (
              <>
                <Title order={4} size="md" fw={700} c={accentArc} ta="center" lineClamp={2}>
                  {hoveredArc.name}
                </Title>

                <Group justify="center" gap="xs">
                  <Badge variant="light" style={{ color: getEntityThemeColor(theme, 'arc') }} size="sm" fw={600}>
                    Arc #{filteredArcs.findIndex(a => a.id === hoveredArc.id) + 1}
                  </Badge>
                  {formatChapterRange(hoveredArc) && (
                    <Badge variant="filled" style={{ color: 'white', backgroundColor: accentArc }} size="sm" fw={600}>
                      {formatChapterRange(hoveredArc)}
                    </Badge>
                  )}
                </Group>

                {hoveredArc.description && (
                  <Text size="sm" ta="center" lineClamp={3} style={{ color: theme.colors.gray[6], lineHeight: 1.4, maxHeight: rem(60) }}>
                    {hoveredArc.description}
                  </Text>
                )}

                {hoveredArc.startChapter && (
                  <Group justify="center" gap="xs">
                    <Text size="xs" style={{ color: theme.colors.gray[6] }}>Starts:</Text>
                    <Text size="xs" fw={500} c={accentArc}>Chapter {hoveredArc.startChapter}</Text>
                  </Group>
                )}
              </>
            )}
          </HoverModal>
        }
      />

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
                <Text size="lg" fw={600} c={accentArc}>{selectedFile.name}</Text>
                <Text size="sm" style={{ color: theme.colors.gray[6] }}>{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</Text>
              </Stack>
            ) : (
              <Stack gap="xs" align="center">
                <Text size="lg" fw={600} c={dragActive ? theme.colors.green?.[5] : accentArc}>
                  {dragActive ? 'Drop image here' : 'Select or Drop Image File'}
                </Text>
                <Text size="sm" style={{ color: theme.colors.gray[6] }}>Supported: JPEG, PNG, WebP, GIF - Max size: 10MB</Text>
              </Stack>
            )}
          </Box>

          {previewUrl && (
            <Box ta="center">
              <Text size="sm" style={{ color: theme.colors.gray[6] }} mb="md" fw={500}>New Image Preview</Text>
              <Box style={{ maxWidth: rem(300), margin: '0 auto', border: `1px solid ${theme.colors.gray?.[3]}`, borderRadius: theme.radius.md, overflow: 'hidden' }}>
                <Image src={previewUrl} alt="Preview" width={400} height={200} style={{ width: '100%', height: 'auto', maxHeight: rem(200), objectFit: 'contain' }} />
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
              <Text size="sm" style={{ color: theme.colors.gray[6] }} mb="md" fw={500}>Current Image</Text>
              <MediaThumbnail entityType="arc" entityId={selectedArc.id} entityName={selectedArc.name} maxWidth="200px" maxHeight="200px" allowCycling={false} />
            </Box>
          )}

          <Group justify="space-between" mt="md">
            {selectedArc?.imageFileName ? (
              <Button variant="outline" color="gray" leftSection={<X size={16} />} onClick={handleRemoveImage} loading={uploading} radius="xl">Remove Image</Button>
            ) : (
              <Box />
            )}
            <Group gap="sm">
              <Button variant="subtle" color="gray" onClick={handleCloseImageDialog} disabled={uploading} radius="xl">Cancel</Button>
              <Button variant="gradient" gradient={{ from: accentArc, to: 'pink' }} leftSection={!uploading ? <Upload size={16} /> : undefined} onClick={handleUploadImage} disabled={!selectedFile} loading={uploading} radius="xl">
                {uploading ? 'Uploading…' : 'Upload Image'}
              </Button>
            </Group>
          </Group>
        </Stack>
      </Modal>
    </>
  )
}
