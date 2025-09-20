'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
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
  Paper,
  Stack,
  Text,
  TextInput,
  Title,
  Group,
  rem,
  useMantineTheme
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { AlertCircle, Camera, User, Search, X } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'motion/react'
import { useAuth } from '../../providers/AuthProvider'
import { api } from '../../lib/api'
import MediaThumbnail from '../../components/MediaThumbnail'

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

export default function CharactersPageContent({
  initialCharacters = [],
  initialTotalPages = 1,
  initialTotal = 0,
  initialSearch = '',
  initialError = ''
}: CharactersPageContentProps) {
  const theme = useMantineTheme()
  const accentCharacter = theme.other?.usogui?.character ?? theme.colors.blue?.[5] ?? '#1976d2'
  const [characters, setCharacters] = useState<Character[]>(initialCharacters)
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentPage = parseInt(searchParams.get('page') || '1', 10)
  const currentSearch = searchParams.get('search') || ''

  const [totalPages, setTotalPages] = useState<number>(initialTotalPages)
  const [total, setTotal] = useState<number>(initialTotal)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(initialError || null)
  const [searchQuery, setSearchQuery] = useState(currentSearch || initialSearch)
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [imageDialogOpen, setImageDialogOpen] = useState(false)
  const [imageDisplayName, setImageDisplayName] = useState('')
  const { isModeratorOrAdmin } = useAuth()

  // Hover modal state
  const [hoveredCharacter, setHoveredCharacter] = useState<Character | null>(null)
  const [hoverModalPosition, setHoverModalPosition] = useState<{ x: number; y: number } | null>(null)
  const hoverTimeoutRef = useRef<number | null>(null)
  const hoveredElementRef = useRef<HTMLElement | null>(null)

  const hasSearchQuery = searchQuery.trim().length > 0

  const fetchCharacters = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: PAGE_SIZE.toString(),
        includeOrganizations: 'true',
        ...(searchQuery && { name: searchQuery })
      })

      const data = await api.get<{
        data: Character[]
        characters: Character[]
        total: number
        page: number
        totalPages: number
      }>(`/characters?${params}`)

      setCharacters(data.characters || data.data || [])
      setTotal(data.total || 0)
      setTotalPages(Math.ceil((data.total || 0) / PAGE_SIZE))
    } catch (error) {
      console.error('Error fetching characters:', error)
      setError('Failed to load characters. Please try again later.')
    } finally {
      setLoading(false)
    }
  }, [currentPage, searchQuery])

  useEffect(() => {
    if (searchQuery !== currentSearch || characters.length === 0) {
      fetchCharacters()
    }
  }, [currentPage, searchQuery, currentSearch, characters.length, fetchCharacters])

  // Function to update modal position based on hovered element
  const updateModalPosition = useCallback((character?: Character) => {
    const currentCharacter = character || hoveredCharacter
    if (hoveredElementRef.current && currentCharacter) {
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
  }, [hoveredCharacter])

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        window.clearTimeout(hoverTimeoutRef.current)
      }
    }
  }, [])

  // Add scroll and resize listeners to update modal position
  useEffect(() => {
    if (hoveredCharacter && hoveredElementRef.current) {
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
  }, [hoveredCharacter, updateModalPosition])

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

      router.push(`/characters?${params.toString()}`)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery, router])

  const handleClearSearch = useCallback(() => {
    setSearchQuery('')

    const params = new URLSearchParams()
    params.set('page', '1')

    router.push(`/characters?${params.toString()}`)
  }, [router])

  const handlePageChange = useCallback((page: number) => {
    const params = new URLSearchParams()
    if (searchQuery) params.set('search', searchQuery)
    params.set('page', page.toString())

    router.push(`/characters?${params.toString()}`)
  }, [router, searchQuery])

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
      fetchCharacters()
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
      fetchCharacters()
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

  // Hover modal handlers
  const handleCharacterMouseEnter = (character: Character, event: React.MouseEvent) => {
    const element = event.currentTarget as HTMLElement
    hoveredElementRef.current = element

    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
    }

    hoverTimeoutRef.current = window.setTimeout(() => {
      setHoveredCharacter(character)
      updateModalPosition(character) // Pass character directly to ensure position calculation works immediately
    }, 500) // 500ms delay before showing
  }

  const handleCharacterMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
    }

    // Small delay before hiding to allow moving to modal
    hoverTimeoutRef.current = window.setTimeout(() => {
      setHoveredCharacter(null)
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
    setHoveredCharacter(null)
    setHoverModalPosition(null)
    hoveredElementRef.current = null
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      {/* Hero Section */}
      <Box
        style={{
          background: `linear-gradient(135deg, ${accentCharacter}15, ${accentCharacter}08)`,
          borderRadius: theme.radius.lg,
          border: `1px solid ${accentCharacter}25`,
          marginBottom: rem(24)
        }}
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
            <Text size="md" c="dimmed" ta="center" maw={400}>
              Explore the rich cast of Usogui characters, from cunning gamblers to mysterious adversaries
            </Text>

            {total > 0 && (
              <Badge size="md" variant="light" color="blue" radius="xl" mt="xs">
                {total} character{total !== 1 ? 's' : ''} available
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
              placeholder="Search characters by name, alias, or tag..."
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
          title="Error loading characters"
        >
          {error}
        </Alert>
      )}

      {/* Loading State */}
      {loading ? (
        <Box style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingBlock: rem(80) }}>
          <Loader size="xl" color={accentCharacter} mb="md" />
          <Text size="lg" c="dimmed">Loading characters...</Text>
        </Box>
      ) : (
        <>
          {/* Empty State */}
          {characters.length === 0 ? (
            <Box style={{ textAlign: 'center', paddingBlock: rem(80) }}>
              <User size={64} color={theme.colors.gray[4]} style={{ marginBottom: rem(20) }} />
              <Title order={3} c="dimmed" mb="sm">
                {hasSearchQuery ? 'No characters found' : 'No characters available'}
              </Title>
              <Text size="lg" c="dimmed" mb="xl">
                {hasSearchQuery
                  ? 'Try adjusting your search terms or filters'
                  : 'Check back later for new characters'}
              </Text>
              {hasSearchQuery && (
                <Button variant="outline" color="blue" onClick={handleClearSearch}>
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
                {characters.map((character, index) => (
                  <motion.div
                    key={character.id}
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
                      href={`/characters/${character.id}`}
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
                        handleCharacterMouseEnter(character, e)
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.boxShadow = theme.shadows.sm
                        handleCharacterMouseLeave()
                      }}
                    >
                      {/* Chapter Badge at Top Left */}
                      {character.firstAppearanceChapter && (
                        <Badge
                          variant="filled"
                          color="blue"
                          radius="sm"
                          size="sm"
                          style={{
                            position: 'absolute',
                            top: rem(8),
                            left: rem(8),
                            backgroundColor: 'rgba(25, 118, 210, 0.95)',
                            color: 'white',
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
                          maxWidth="100%"
                          maxHeight="100%"
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
                          c={accentCharacter}
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
                          {character.name}
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
                    color="blue"
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
                  color="blue"
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
      <AnimatePresence>
        {hoveredCharacter && hoverModalPosition && (
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
                border: `2px solid ${accentCharacter}`,
                backdropFilter: 'blur(10px)',
                width: rem(300),
                maxWidth: '90vw'
              }}
            >
              <Stack gap="sm">
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
                    c="dimmed"
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
                        color="violet"
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
                      color="blue"
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
                        color="orange"
                        size="xs"
                        fw={500}
                      >
                        {org.name}
                      </Badge>
                    ))}
                    {hoveredCharacter.organizations.length > 2 && (
                      <Badge
                        variant="light"
                        color="orange"
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
                    c="dimmed"
                    ta="center"
                    lineClamp={3}
                    style={{
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
                      <Badge key={tag} variant="outline" color="gray" size="xs">
                        {tag}
                      </Badge>
                    ))}
                    {hoveredCharacter.tags.length > 3 && (
                      <Badge variant="outline" color="gray" size="xs">
                        +{hoveredCharacter.tags.length - 3}
                      </Badge>
                    )}
                  </Group>
                )}
              </Stack>
            </Paper>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}