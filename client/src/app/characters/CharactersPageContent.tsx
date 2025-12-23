'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ActionIcon,
  Alert,
  Badge,
  Box,
  Button,
  Card,
  FileInput,
  Loader,
  Modal,
  Pagination,
  Select,
  Stack,
  Text,
  TextInput,
  Title,
  Group,
  rem,
  useMantineTheme
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { useDebouncedValue } from '@mantine/hooks'
import { getEntityThemeColor, backgroundStyles, getHeroStyles, getPlayingCardStyles } from '../../lib/mantine-theme'
import { AlertCircle, Camera, User, Search, X, ArrowUpDown, Building2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'motion/react'
import { useAuth } from '../../providers/AuthProvider'
import { api } from '../../lib/api'
import MediaThumbnail from '../../components/MediaThumbnail'
import { useHoverModal } from '../../hooks/useHoverModal'
import { HoverModal } from '../../components/HoverModal'
import { CardGridSkeleton } from '../../components/CardGridSkeleton'
import { ScrollToTop } from '../../components/ScrollToTop'
import { useProgress } from '../../providers/ProgressProvider'
import { useSpoilerSettings } from '../../hooks/useSpoilerSettings'
import { shouldHideSpoiler } from '../../lib/spoiler-utils'

interface Character {
  id: number
  name: string
  alias?: string
  alternateNames: string[] | null
  description: string
  firstAppearanceChapter: number
  imageFileName?: string
  imageDisplayName?: string
  tags?: string[]
  organizations?: Array<{
    id: number
    name: string
    description?: string
  }>
}

interface CharactersPageContentProps {
  initialCharacters?: Character[]
  initialTotalPages?: number
  initialTotal?: number
  initialSearch?: string
  initialError?: string
}

const PAGE_SIZE = 12

type SortOption = 'name' | 'firstAppearance'

const sortOptions = [
  { value: 'name', label: 'Name (A-Z)' },
  { value: 'firstAppearance', label: 'First Appearance' }
]

export default function CharactersPageContent({
  initialCharacters = [],
  initialSearch = '',
  initialError = ''
}: CharactersPageContentProps) {
  const theme = useMantineTheme()
  const accentCharacter = theme.other?.usogui?.character ?? theme.colors.blue?.[5] ?? '#1976d2'
  const router = useRouter()
  const searchParams = useSearchParams()

  const [characters, setCharacters] = useState<Character[]>(initialCharacters)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(initialError || null)
  const [searchInput, setSearchInput] = useState(initialSearch || '')
  const [searchQuery, setSearchQuery] = useState(initialSearch || '')
  const [sortBy, setSortBy] = useState<SortOption>((searchParams.get('sort') as SortOption) || 'firstAppearance')

  // Server-side pagination
  const [currentPage, setCurrentPage] = useState<number>(parseInt(searchParams.get('page') || '1', 10))
  const [totalPages, setTotalPages] = useState(Math.ceil((initialCharacters?.length || 0) / PAGE_SIZE))
  const [total, setTotal] = useState(initialCharacters?.length || 0)

  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [imageDialogOpen, setImageDialogOpen] = useState(false)
  const [imageDisplayName, setImageDisplayName] = useState('')
  const { isModeratorOrAdmin } = useAuth()
  const { userProgress } = useProgress()
  const { settings: spoilerSettings } = useSpoilerSettings()

  // Organization filter
  const [organizationFilter, setOrganizationFilter] = useState<string | null>(
    searchParams.get('org') || null
  )
  const [organizations, setOrganizations] = useState<Array<{ id: number; name: string }>>([])
  const [organizationsLoading, setOrganizationsLoading] = useState(false)

  // Track revealed spoilers
  const [revealedCharacters, setRevealedCharacters] = useState<Set<number>>(new Set())

  // Track currently hovered character (for triggering modal after reveal)
  const currentlyHoveredRef = useRef<{ character: Character; element: HTMLElement } | null>(null)

  // Hover modal
  const {
    hoveredItem: hoveredCharacter,
    hoverPosition,
    handleMouseEnter: handleCharacterMouseEnter,
    handleMouseLeave: handleCharacterMouseLeave,
    handleModalMouseEnter,
    handleModalMouseLeave,
    handleTap: handleCharacterTap,
    closeModal,
    isTouchDevice
  } = useHoverModal<Character>()

  const hasSearchQuery = searchQuery.trim().length > 0 || organizationFilter !== null

  // Filter characters by organization client-side
  const filteredCharacters = useMemo(() => {
    if (!organizationFilter) return characters

    // Filter characters that belong to the selected organization
    return characters.filter(character =>
      character.organizations?.some(org => org.id.toString() === organizationFilter)
    )
  }, [characters, organizationFilter])

  // Group characters by organization for visual display
  const groupedByOrganization = useMemo(() => {
    if (!organizationFilter) return null

    const orgName = organizations.find(o => o.id.toString() === organizationFilter)?.name || 'Unknown'
    return { name: orgName, characters: filteredCharacters }
  }, [organizationFilter, organizations, filteredCharacters])

  // Load characters with server-side pagination
  const loadCharacters = useCallback(async (page: number, search: string, sort: SortOption) => {
    setLoading(true)
    setError(null)

    try {
      const params: any = {
        page,
        limit: PAGE_SIZE,
        includeOrganizations: true
      }
      if (search) {
        params.name = search
      }
      // Map sort option to API params (backend uses 'sort' and 'order')
      if (sort === 'name') {
        params.sort = 'name'
        params.order = 'ASC'
      } else if (sort === 'firstAppearance') {
        params.sort = 'firstAppearanceChapter'
        params.order = 'ASC'
      }

      const response = await api.getCharacters(params)
      setCharacters(response.data || [])
      setTotal(response.total || 0)
      setTotalPages(response.totalPages || 1)
    } catch (err: any) {
      console.error('Error loading characters:', err)
      if (err?.status === 429) {
        setError('Rate limit exceeded. Please wait a moment and try again.')
      } else {
        setError('Failed to load characters. Please try again later.')
      }
      setCharacters([])
      setTotal(0)
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }, [])

  // Update URL when search, page, or sort changes
  const updateURL = useCallback((page: number, search: string, sort: SortOption) => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (page > 1) params.set('page', page.toString())
    if (sort !== 'firstAppearance') params.set('sort', sort)

    const url = params.toString() ? `/characters?${params.toString()}` : '/characters'
    router.push(url, { scroll: false })
  }, [router])

  // Load characters when page, search, or sort changes
  useEffect(() => {
    loadCharacters(currentPage, searchQuery, sortBy)
  }, [currentPage, searchQuery, sortBy, loadCharacters])

  // Debounced search with useDebouncedValue
  const [debouncedSearch] = useDebouncedValue(searchInput, 300)

  useEffect(() => {
    if (debouncedSearch.trim() !== searchQuery) {
      setSearchQuery(debouncedSearch.trim())
      setCurrentPage(1)
      updateURL(1, debouncedSearch.trim(), sortBy)
    }
  }, [debouncedSearch, searchQuery, sortBy, updateURL])

  // Fetch organizations on mount
  useEffect(() => {
    const fetchOrganizations = async () => {
      setOrganizationsLoading(true)
      try {
        const response = await api.getOrganizations({ limit: 100 })
        setOrganizations(response.data || [])
      } catch (err) {
        console.error('Error fetching organizations:', err)
      } finally {
        setOrganizationsLoading(false)
      }
    }
    fetchOrganizations()
  }, [])

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    setSearchInput(value)

    // Immediately clear search when input is emptied (bypass debounce)
    if (value.trim() === '' && searchQuery !== '') {
      setSearchQuery('')
      setCurrentPage(1)
      updateURL(1, '', sortBy)
    }
  }

  const handleClearSearch = () => {
    setSearchInput('')
    setSearchQuery('')
    setOrganizationFilter(null)
    setCurrentPage(1)
    updateURL(1, '', sortBy)
  }

  const handleOrganizationFilterChange = (value: string | null) => {
    setOrganizationFilter(value)
    setCurrentPage(1)
    // Update URL with org filter
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set('org', value)
    } else {
      params.delete('org')
    }
    params.set('page', '1')
    router.push(params.toString() ? `/characters?${params.toString()}` : '/characters')
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    updateURL(page, searchQuery, sortBy)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSortChange = (value: string | null) => {
    const newSort = (value as SortOption) || 'name'
    setSortBy(newSort)
    setCurrentPage(1)
    updateURL(1, searchQuery, newSort)
  }

  const handleEditImage = (character: Character) => {
    setSelectedCharacter(character)
    setImageDisplayName(character.imageDisplayName || '')
    setImageDialogOpen(true)
  }

  const handleUploadImage = async () => {
    if (!selectedFile || !selectedCharacter) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('entityType', 'character')
      formData.append('entityId', selectedCharacter.id.toString())
      if (imageDisplayName) {
        formData.append('displayName', imageDisplayName)
      }

      const response = await api.post('/media', formData) as Response

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      notifications.show({
        title: 'Success',
        message: 'Image uploaded successfully',
        color: 'green'
      })

      // Close dialog and refresh
      handleCloseImageDialog()
      loadCharacters(currentPage, searchQuery, sortBy)
    } catch (error) {
      console.error('Upload error:', error)
      notifications.show({
        title: 'Error',
        message: 'Failed to upload image',
        color: 'red'
      })
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveImage = async () => {
    if (!selectedCharacter?.imageFileName) return

    setUploading(true)
    try {
      const response = await api.delete(`/media/character/${selectedCharacter.imageFileName}`) as Response
      if (!response.ok) {
        throw new Error('Failed to remove image')
      }

      notifications.show({
        title: 'Success',
        message: 'Image removed successfully',
        color: 'green'
      })

      handleCloseImageDialog()
      loadCharacters(currentPage, searchQuery, sortBy)
    } catch (error) {
      console.error('Error removing image:', error)
      notifications.show({
        title: 'Error',
        message: 'Failed to remove image',
        color: 'red'
      })
    } finally {
      setUploading(false)
    }
  }

  const handleCloseImageDialog = () => {
    setSelectedCharacter(null)
    setSelectedFile(null)
    setImageDisplayName('')
    setImageDialogOpen(false)
  }

  return (
    <Box style={{ backgroundColor: backgroundStyles.page(theme), minHeight: '100vh' }}>
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      {/* Hero Section */}
      <Box
        style={getHeroStyles(theme, accentCharacter)}
        p="md"
      >
        <Stack align="center" gap="xs">
          <Box
            style={{
              background: `linear-gradient(135deg, ${accentCharacter}, ${accentCharacter}CC)`,
              borderRadius: '50%',
              width: rem(40),
              height: rem(40),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 4px 16px ${accentCharacter}40`
            }}
          >
            <User size={20} color="white" />
          </Box>

          <Stack align="center" gap="xs">
            <Title order={1} size="1.5rem" fw={700} ta="center" c={accentCharacter}>
              Characters
            </Title>
            <Text size="md" style={{ color: theme.colors.gray[6] }} ta="center" maw={400}>
              Explore the rich cast of Usogui characters, from cunning gamblers to mysterious adversaries
            </Text>

            {total > 0 && (
              <Badge size="md" variant="light" c={accentCharacter} radius="xl" mt="xs">
                {total} character{total !== 1 ? 's' : ''} {searchQuery ? 'found' : 'available'}
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
              placeholder="Search characters by name, alias, or tag..."
              value={searchInput}
              onChange={handleSearchChange}
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
          <Select
            data={[
              { value: '', label: 'All Organizations' },
              ...organizations.map(org => ({ value: org.id.toString(), label: org.name }))
            ]}
            value={organizationFilter || ''}
            onChange={(value) => handleOrganizationFilterChange(value || null)}
            leftSection={<Building2 size={16} />}
            w={200}
            size="lg"
            radius="xl"
            placeholder="Filter by organization"
            clearable
            disabled={organizationsLoading}
            styles={{
              input: {
                fontSize: rem(14)
              }
            }}
          />
        </Group>

        {/* Active Organization Filter Badge */}
        {organizationFilter && (
          <Group justify="center" mt="sm">
            <Badge
              size="lg"
              variant="filled"
              style={{ backgroundColor: accentCharacter }}
              radius="xl"
              rightSection={
                <ActionIcon
                  size="md"
                  color="white"
                  variant="transparent"
                  onClick={() => handleOrganizationFilterChange(null)}
                  aria-label="Clear organization filter"
                  style={{ minWidth: 32, minHeight: 32 }}
                >
                  <X size={14} />
                </ActionIcon>
              }
            >
              {organizations.find(o => o.id.toString() === organizationFilter)?.name || 'Organization'}
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
            title="Error loading characters"
          >
            {error}
          </Alert>
        </Box>
      )}

      {/* Loading State */}
      {loading ? (
        <CardGridSkeleton count={12} cardWidth={200} cardHeight={280} accentColor={accentCharacter} />
      ) : (
        <>
          {/* Empty State */}
          {filteredCharacters.length === 0 ? (
            <Box style={{ textAlign: 'center', paddingBlock: rem(80) }}>
              <User size={64} color={theme.colors.gray[4]} style={{ marginBottom: rem(20) }} />
              <Title order={3} style={{ color: theme.colors.gray[6] }} mb="sm">
                {hasSearchQuery ? 'No characters found' : 'No characters available'}
              </Title>
              <Text size="lg" style={{ color: theme.colors.gray[6] }} mb="xl">
                {hasSearchQuery
                  ? 'Try adjusting your search terms or filters'
                  : 'Check back later for new characters'}
              </Text>
              {hasSearchQuery && (
                <Button variant="outline" c={accentCharacter} onClick={handleClearSearch}>
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
                  gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 220px))',
                  gap: rem(16),
                  justifyContent: 'center'
                }}
              >
                {filteredCharacters.map((character: Character, index: number) => (
                  <motion.div
                    key={character.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                    style={{
                      width: '100%',
                      maxWidth: '220px',
                      aspectRatio: '5/7' // Playing card aspect ratio
                    }}
                  >
                    <Card
                      component={Link}
                      href={`/characters/${character.id}`}
                      withBorder={false}
                      radius="lg"
                      shadow="sm"
                      style={getPlayingCardStyles(theme, accentCharacter)}
                      onClick={(e) => {
                        // On touch devices, first tap shows preview, second tap navigates
                        if (isTouchDevice) {
                          const isSpoilered = shouldHideSpoiler(
                            character.firstAppearanceChapter,
                            userProgress,
                            spoilerSettings
                          )
                          const hasBeenRevealed = revealedCharacters.has(character.id)
                          if (!isSpoilered || hasBeenRevealed) {
                            // If modal is not showing for this character, prevent navigation and show modal
                            if (hoveredCharacter?.id !== character.id) {
                              e.preventDefault()
                              handleCharacterTap(character, e)
                            }
                            // If modal is already showing, allow navigation (second tap)
                          }
                        }
                      }}
                      onMouseEnter={(e) => {
                        if (isTouchDevice) return // Skip hover on touch devices
                        e.currentTarget.style.transform = 'translateY(-4px)'
                        e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.25)'

                        // Store the currently hovered character and element
                        currentlyHoveredRef.current = { character, element: e.currentTarget as HTMLElement }

                        // Only show hover modal if content is not spoilered OR has been revealed
                        const isSpoilered = shouldHideSpoiler(
                          character.firstAppearanceChapter,
                          userProgress,
                          spoilerSettings
                        )
                        const hasBeenRevealed = revealedCharacters.has(character.id)
                        if (!isSpoilered || hasBeenRevealed) {
                          handleCharacterMouseEnter(character, e)
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (isTouchDevice) return // Skip hover on touch devices
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.boxShadow = theme.shadows.sm
                        currentlyHoveredRef.current = null
                        handleCharacterMouseLeave()
                      }}
                    >
                      {/* Chapter Badge at Top Left */}
                      {character.firstAppearanceChapter && (
                        <Badge
                          variant="filled"
                          radius="sm"
                          size="sm"
                          c="white"
                          style={{
                            position: 'absolute',
                            top: rem(8),
                            left: rem(8),
                            backgroundColor: accentCharacter,
                            fontSize: rem(10),
                            fontWeight: 700,
                            zIndex: 10,
                            backdropFilter: 'blur(4px)',
                            maxWidth: isModeratorOrAdmin ? 'calc(100% - 60px)' : 'calc(100% - 16px)'
                          }}
                        >
                          Ch. {character.firstAppearanceChapter}
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
                            handleEditImage(character)
                          }}
                        >
                          <Camera size={12} />
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
                          entityType="character"
                          entityId={character.id}
                          entityName={character.name}
                          allowCycling={false}
                          maxWidth={200}
                          maxHeight={230}
                          spoilerChapter={character.firstAppearanceChapter}
                          onSpoilerRevealed={() => {
                            setRevealedCharacters(prev => new Set(prev).add(character.id))
                            // If this character is currently being hovered, trigger the modal
                            if (currentlyHoveredRef.current?.character.id === character.id) {
                              const element = currentlyHoveredRef.current.element
                              // Create a synthetic event for the handleCharacterMouseEnter function
                              const syntheticEvent = {
                                currentTarget: element,
                                target: element
                              } as unknown as React.MouseEvent
                              handleCharacterMouseEnter(
                                currentlyHoveredRef.current.character,
                                syntheticEvent
                              )
                            }
                          }}
                        />
                      </Box>

                      {/* Character Name at Bottom */}
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
                            background: `linear-gradient(135deg, ${accentCharacter}dd, ${accentCharacter}aa)`,
                            backdropFilter: 'blur(4px)',
                            borderRadius: rem(6),
                            padding: `${rem(6)} ${rem(10)}`,
                            border: `1px solid ${accentCharacter}40`
                          }}
                        >
                          {character.name}
                        </Text>
                      </Box>
                    </Card>
                  </motion.div>
                ))}
              </Box>

              {/* Pagination Info & Controls */}
              <Box
                px="md"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  marginTop: rem(48),
                  gap: rem(12)
                }}>
                {/* Always show pagination info when we have characters */}
                {(total > 0 || filteredCharacters.length > 0) && (
                  <Text size="sm" style={{ color: theme.colors.gray[6] }}>
                    {organizationFilter
                      ? `${filteredCharacters.length} character${filteredCharacters.length !== 1 ? 's' : ''} in this organization`
                      : `Showing ${filteredCharacters.length} of ${total} characters`}
                    {!organizationFilter && totalPages > 1 && ` • Page ${currentPage} of ${totalPages}`}
                  </Text>
                )}

                {/* Show pagination controls when we have multiple pages */}
                {totalPages > 1 && (
                  <Pagination
                    total={totalPages}
                    value={currentPage}
                    onChange={handlePageChange}
                    color="character"
                    size="lg"
                    radius="xl"
                    withEdges
                  />
                )}

                {loading && <Loader size="sm" color={accentCharacter} />}
              </Box>
            </>
          )}
        </>
      )}

      {/* Image Upload Modal */}
      <Modal
        opened={imageDialogOpen}
        onClose={handleCloseImageDialog}
        title="Edit Character Image"
        size="md"
      >
        <div className="space-y-4">
          {selectedCharacter && (
            <>
              <Text size="lg" fw={500}>
                {selectedCharacter.name}
              </Text>

              <TextInput
                label="Display Name (optional)"
                value={imageDisplayName}
                onChange={(e) => setImageDisplayName(e.currentTarget.value)}
                placeholder="Enter display name for the image"
              />

              <div>
                <Text size="sm" mb={8}>Select Image File:</Text>
                <FileInput
                  placeholder="Choose image file"
                  accept="image/*"
                  onChange={(file) => setSelectedFile(file)}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleUploadImage}
                  disabled={!selectedFile || uploading}
                  loading={uploading}
                  c={accentCharacter}
                  flex={1}
                >
                  Upload
                </Button>

                {selectedCharacter.imageFileName && (
                  <Button
                    onClick={handleRemoveImage}
                    disabled={uploading}
                    loading={uploading}
                    color="red"
                    variant="outline"
                    flex={1}
                  >
                    Remove Current
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Hover Modal */}
      <HoverModal
        isOpen={!!hoveredCharacter}
        position={hoverPosition}
        accentColor={accentCharacter}
        onMouseEnter={handleModalMouseEnter}
        onMouseLeave={handleModalMouseLeave}
        onClose={closeModal}
        showCloseButton={isTouchDevice}
      >
        {hoveredCharacter && (
          <>
            {/* Character Name */}
            <Title
              order={4}
              size="md"
              fw={700}
              c={accentCharacter}
              ta="center"
              lineClamp={2}
            >
              {hoveredCharacter.name}
            </Title>

            {/* Character Alias */}
            {hoveredCharacter.alias && (
              <Text
                size="sm"
                style={{ color: theme.colors.gray[6] }}
                ta="center"
                className="italic"
              >
                &ldquo;{hoveredCharacter.alias}&rdquo;
              </Text>
            )}

            {/* Alternate Names */}
            {hoveredCharacter.alternateNames && hoveredCharacter.alternateNames.length > 0 && (
              <Group justify="center" gap="xs" wrap="wrap">
                {hoveredCharacter.alternateNames.map((name, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    c={getEntityThemeColor(theme, 'character')}
                    style={{ borderColor: getEntityThemeColor(theme, 'character') }}
                    size="xs"
                    fw={500}
                  >
                    {name}
                  </Badge>
                ))}
              </Group>
            )}

            {/* Start Chapter */}
            {hoveredCharacter.firstAppearanceChapter && (
              <Group justify="center" gap="xs">
                <Badge
                  variant="filled"
                  c="white"
                  style={{ backgroundColor: accentCharacter }}
                  size="sm"
                  fw={600}
                >
                  Ch. {hoveredCharacter.firstAppearanceChapter}
                </Badge>
              </Group>
            )}

            {/* Organizations/Factions */}
            {hoveredCharacter.organizations && hoveredCharacter.organizations.length > 0 && (
              <Group justify="center" gap="xs">
                {hoveredCharacter.organizations.slice(0, 2).map((org) => (
                  <Badge
                    key={org.id}
                    variant="light"
                    c={getEntityThemeColor(theme, 'event')}
                    style={{
                      backgroundColor: `${getEntityThemeColor(theme, 'event')}20`,
                      borderColor: getEntityThemeColor(theme, 'event')
                    }}
                    size="xs"
                    fw={500}
                  >
                    {org.name}
                  </Badge>
                ))}
                {hoveredCharacter.organizations.length > 2 && (
                  <Badge
                    variant="light"
                    c={getEntityThemeColor(theme, 'event')}
                    style={{
                      backgroundColor: `${getEntityThemeColor(theme, 'event')}20`,
                      borderColor: getEntityThemeColor(theme, 'event')
                    }}
                    size="xs"
                    fw={500}
                  >
                    +{hoveredCharacter.organizations.length - 2}
                  </Badge>
                )}
              </Group>
            )}

            {/* Description */}
            {hoveredCharacter.description && (
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
                {hoveredCharacter.description}
              </Text>
            )}

            {/* Tags */}
            {hoveredCharacter.tags && hoveredCharacter.tags.length > 0 && (
              <Group justify="center" gap="xs">
                {hoveredCharacter.tags.slice(0, 3).map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    c={getEntityThemeColor(theme, 'character')}
                    style={{ borderColor: getEntityThemeColor(theme, 'character') }}
                    size="xs"
                  >
                    {tag}
                  </Badge>
                ))}
                {hoveredCharacter.tags.length > 3 && (
                  <Badge
                    variant="outline"
                    c={getEntityThemeColor(theme, 'character')}
                    style={{ borderColor: getEntityThemeColor(theme, 'character') }}
                    size="xs"
                  >
                    +{hoveredCharacter.tags.length - 3}
                  </Badge>
                )}
              </Group>
            )}
          </>
        )}
      </HoverModal>

      <ScrollToTop accentColor={accentCharacter} />
    </motion.div>
    </Box>
  )
}