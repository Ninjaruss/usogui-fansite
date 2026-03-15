'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ActionIcon,
  Badge,
  Box,
  Card,
  Group,
  Stack,
  Text,
  Title,
  Tooltip,
  rem,
  useMantineTheme
} from '@mantine/core'
import { getEntityThemeColor, backgroundStyles } from '../../lib/mantine-theme'
import { BookOpen, X } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ScrollToTop } from '../../components/ScrollToTop'
import { api } from '../../lib/api'
import { useHoverModal } from '../../hooks/useHoverModal'
import { HoverModal } from '../../components/HoverModal'
import { ListPageLayout } from '../../components/layouts/ListPageLayout'
import { PlayingCard } from '../../components/cards/PlayingCard'
import type { MediaItem } from '../../components/MediaThumbnail'

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
  initialMediaMap?: Record<number, MediaItem[]>
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
  initialError,
  initialMediaMap
}: ArcsPageContentProps) {
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
      return `Ch. ${arc.startChapter}–${arc.endChapter}`
    }
    if (typeof arc.startChapter === 'number') {
      return `Ch. ${arc.startChapter} – ongoing`
    }
    return null
  }

  // Card render - includes sub-arcs hierarchy
  const renderArcCard = useCallback((arc: Arc, index: number) => {
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
          noTruncate
          chapterBadge={chapterBadge}
          imagePriority={index < 6}
          initialMedia={initialMediaMap?.[arc.id]}
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
                    cursor: 'pointer',
                    borderLeft: '2px solid currentColor',
                    paddingLeft: 8
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
  }, [isTouchDevice, hoveredArc, accentArc, handleArcMouseEnter, handleArcMouseLeave, handleArcTap])

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
            entityLabel="arc"
          >
            {hoveredArc && (
              <>
                <Title order={4} size="md" ta="center" lineClamp={2} style={{ fontFamily: 'var(--font-opti-goudy-text), serif', fontWeight: 400, fontSize: '1.4rem', color: accentArc }}>
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

              </>
            )}
          </HoverModal>
        }
      />
  )
}
