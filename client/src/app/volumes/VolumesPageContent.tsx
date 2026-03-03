'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Badge,
  Group,
  Text,
  Title,
  rem,
  useMantineTheme
} from '@mantine/core'
import { getEntityThemeColor } from '../../lib/mantine-theme'
import { Book, Hash } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { api } from '../../lib/api'
import { useHoverModal } from '../../hooks/useHoverModal'
import { HoverModal } from '../../components/HoverModal'
import { ListPageLayout } from '../../components/layouts/ListPageLayout'
import { PlayingCard } from '../../components/cards/PlayingCard'
import { EXPECTED_VOLUME_COUNT } from '../../lib/constants'

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

// No sort UI needed - always by volume number
const sortOptions = [
  { value: 'number', label: 'Volume Number' }
]

export default function VolumesPageContent({
  initialVolumes,
  initialPage,
  initialSearch,
  initialError
}: VolumesPageContentProps) {
  const theme = useMantineTheme()
  const accentVolume = theme.other?.usogui?.volume ?? theme.colors.red?.[5] ?? '#ef4444'
  const router = useRouter()
  const searchParams = useSearchParams()

  const [allVolumes, setAllVolumes] = useState<Volume[]>(initialVolumes)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(initialError || null)
  const [searchQuery, setSearchQuery] = useState(initialSearch || '')
  const [currentPage, setCurrentPage] = useState<number>(initialPage)

  // Hover modal
  const {
    hoveredItem: hoveredVolume,
    hoverPosition,
    handleMouseEnter: handleVolumeMouseEnter,
    handleMouseLeave: handleVolumeMouseLeave,
    handleModalMouseEnter,
    handleModalMouseLeave,
    handleTap: handleVolumeTap,
    closeModal,
    isTouchDevice
  } = useHoverModal<Volume>()

  const hasSearchQuery = searchQuery.trim().length > 0

  // Load all volumes once on mount
  const loadAllVolumes = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await api.get<any>('/volumes?limit=100')
      setAllVolumes(response.data || [])
    } catch (err: any) {
      console.error('Error loading volumes:', err)
      setError(err?.status === 429 ? 'Rate limit exceeded. Please wait a moment and try again.' : 'Failed to load volumes. Please try again later.')
    } finally {
      setLoading(false)
    }
  }, [])

  // Client-side filtering
  const filteredVolumes = useMemo(() => {
    if (!searchQuery.trim()) return allVolumes
    const query = searchQuery.toLowerCase().trim()
    return allVolumes.filter(volume => {
      if (!isNaN(Number(query))) {
        return volume.number.toString().includes(query)
      }
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

  useEffect(() => {
    if (allVolumes.length === 0 || allVolumes.length < EXPECTED_VOLUME_COUNT) {
      loadAllVolumes()
    }
  }, [allVolumes.length, loadAllVolumes])

  useEffect(() => {
    const urlPage = parseInt(searchParams.get('page') || '1', 10)
    const urlSearch = searchParams.get('search') || ''
    setCurrentPage(urlPage)
    setSearchQuery(urlSearch)
  }, [searchParams])

  const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const newSearch = event.target.value
    setSearchQuery(newSearch)
    setCurrentPage(1)
  }, [])

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
  }, [router])

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
  }, [])

  // Card render
  const renderVolumeCard = useCallback((volume: Volume, index: number) => {
    const handleCardClick = (e: React.MouseEvent) => {
      if (isTouchDevice && hoveredVolume?.id !== volume.id) {
        e.preventDefault()
        handleVolumeTap(volume, e)
      }
    }

    return (
      <PlayingCard
        entityType="volume"
        href={`/volumes/${volume.id}`}
        entityId={volume.id}
        name={volume.title || `Volume ${volume.number}`}
        chapterBadge={`Ch. ${volume.startChapter}-${volume.endChapter}`}
        imagePriority={index < 6}
        onClick={handleCardClick}
        onMouseEnter={(e) => {
          if (!isTouchDevice) handleVolumeMouseEnter(volume, e)
        }}
        onMouseLeave={() => {
          if (!isTouchDevice) handleVolumeMouseLeave()
        }}
        isTouchDevice={isTouchDevice}
        isHovered={hoveredVolume?.id === volume.id}
      />
    )
  }, [isTouchDevice, hoveredVolume, handleVolumeMouseEnter, handleVolumeMouseLeave, handleVolumeTap])

  return (
    <ListPageLayout
      entityType="volume"
      icon={<Book size={24} color="white" />}
      title="Volumes"
      subtitle="Explore the complete collection of Usogui manga volumes"
      items={paginatedVolumes}
      total={total}
      totalPages={totalPages}
      currentPage={currentPage}
      pageSize={PAGE_SIZE}
      loading={loading}
      error={error}
      searchPlaceholder="Search volumes by number or title..."
      searchInput={searchQuery}
      onSearchChange={handleSearchChange}
      onClearSearch={handleClearSearch}
      hasActiveFilters={hasSearchQuery}
      sortOptions={sortOptions}
      sortValue="number"
      onSortChange={() => {}}
      renderCard={renderVolumeCard}
      getKey={(v) => v.id}
      onPageChange={handlePageChange}
      entityNamePlural="volumes"
      emptyIcon={<Book size={48} />}
      hoverModal={
        <HoverModal
          isOpen={!!hoveredVolume}
          position={hoverPosition}
          accentColor={accentVolume}
          onMouseEnter={handleModalMouseEnter}
          onMouseLeave={handleModalMouseLeave}
          onClose={closeModal}
          showCloseButton={isTouchDevice}
        >
          {hoveredVolume && (
            <>
              <Title order={4} size="md" fw={700} c={accentVolume} ta="center" lineClamp={2}>
                {hoveredVolume.title || `Volume ${hoveredVolume.number}`}
              </Title>

              <Group justify="center" gap="xs">
                <Badge
                  variant="filled"
                  c="white"
                  size="sm"
                  fw={600}
                  leftSection={<Hash size={12} />}
                  style={{ backgroundColor: getEntityThemeColor(theme, 'volume') }}
                >
                  Ch. {hoveredVolume.startChapter}-{hoveredVolume.endChapter}
                </Badge>
              </Group>

              {hoveredVolume.description && (
                <Text size="sm" ta="center" lineClamp={3} style={{ color: theme.colors.gray[6], lineHeight: 1.4, maxHeight: rem(60) }}>
                  {hoveredVolume.description}
                </Text>
              )}

              <Group justify="center">
                <Text size="xs" style={{ color: theme.colors.gray[6] }}>
                  {hoveredVolume.endChapter - hoveredVolume.startChapter + 1} chapters
                </Text>
              </Group>
            </>
          )}
        </HoverModal>
      }
    />
  )
}
