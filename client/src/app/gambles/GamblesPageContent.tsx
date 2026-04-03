'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  ActionIcon,
  Badge,
  Box,
  Group,
  Stack,
  Text,
  Title,
  rem,
  useMantineTheme
} from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'
import { getEntityThemeColor } from '../../lib/mantine-theme'
import { Dices, X } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { api } from '../../lib/api'
import { usePaged } from '../../hooks/usePagedCache'
import { pagedCacheConfig } from '../../config/pagedCacheConfig'
import { useHoverModal } from '../../hooks/useHoverModal'
import { HoverModal } from '../../components/HoverModal'
import { useProgress } from '../../providers/ProgressProvider'
import { useSpoilerSettings } from '../../hooks/useSpoilerSettings'
import { shouldHideSpoiler } from '../../lib/spoiler-utils'
import { ListPageLayout } from '../../components/layouts/ListPageLayout'
import { PlayingCard } from '../../components/cards/PlayingCard'
import type { MediaItem } from '../../components/MediaThumbnail'

type Participant = {
  id: number
  name: string
  description?: string
  alternateNames?: string[]
}

interface GambleFactionMember {
  id: number
  characterId: number
  character: { id: number; name: string }
  role?: 'leader' | 'member' | 'supporter' | 'observer' | null
  displayOrder: number
}

interface GambleFaction {
  id: number
  name?: string | null
  supportedGamblerId?: number | null
  supportedGambler?: { id: number; name: string } | null
  members: GambleFactionMember[]
  displayOrder: number
}

interface Gamble {
  id: number
  name: string
  description?: string
  rules: string
  winCondition?: string
  chapterId: number
  participants?: Participant[]
  factions?: GambleFaction[]
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
  initialMediaMap?: Record<number, MediaItem[]>
}

type SortOption = 'name' | 'chapter'

const sortOptions = [
  { value: 'name', label: 'Name (A-Z)' },
  { value: 'chapter', label: 'Chapter' }
]

export default function GamblesPageContent({
  initialGambles,
  initialTotalPages,
  initialTotal,
  initialPage,
  initialSearch,
  initialCharacterFilter,
  initialError,
  initialMediaMap
}: GamblesPageContentProps) {
  const theme = useMantineTheme()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { userProgress } = useProgress()
  const { settings: spoilerSettings } = useSpoilerSettings()

  const [gambles, setGambles] = useState<Gamble[]>(initialGambles)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(initialError)
  const [searchInput, setSearchInput] = useState(initialSearch)
  const [searchQuery, setSearchQuery] = useState(initialSearch)
  const [debouncedSearch] = useDebouncedValue(searchInput, 300)
  const [currentPage, setCurrentPage] = useState(initialPage)
  const [totalPages, setTotalPages] = useState(initialTotalPages)
  const [total, setTotal] = useState(initialTotal)
  const [characterFilter, setCharacterFilter] = useState<string | null>(initialCharacterFilter || null)
  const [sortBy, setSortBy] = useState<SortOption>((searchParams.get('sort') as SortOption) || 'chapter')

  // Spoiler tracking
  const [revealedGambles, setRevealedGambles] = useState<Set<number>>(new Set())
  const currentlyHoveredRef = useRef<{ gamble: Gamble; element: HTMLElement } | null>(null)

  // Hover modal
  const {
    hoveredItem: hoveredGamble,
    hoverPosition,
    handleMouseEnter: handleGambleMouseEnter,
    handleMouseLeave: handleGambleMouseLeave,
    handleModalMouseEnter,
    handleModalMouseLeave,
    handleTap: handleGambleTap,
    closeModal,
    isTouchDevice
  } = useHoverModal<Gamble>()

  const accentGamble = theme.other?.usogui?.gamble ?? theme.colors.red?.[5] ?? '#d32f2f'
  const hasSearchQuery = searchInput.trim().length > 0 || characterFilter !== null

  // URL sync
  useEffect(() => {
    const urlSearch = searchParams.get('search') || ''
    const urlPage = parseInt(searchParams.get('page') || '1', 10)
    const urlCharacter = searchParams.get('character') || null
    const urlSort = (searchParams.get('sort') as SortOption) || 'chapter'

    if (urlSearch !== searchQuery) { setSearchInput(urlSearch); setSearchQuery(urlSearch) }
    if (urlPage !== currentPage) setCurrentPage(urlPage)
    if (urlCharacter !== characterFilter) setCharacterFilter(urlCharacter)
    if (urlSort !== sortBy) setSortBy(urlSort)
  }, [searchParams])

  const updateURL = useCallback((newSearch: string, newPage: number, newCharacter?: string, newSort?: SortOption) => {
    const params = new URLSearchParams()
    if (newSearch) params.set('search', newSearch)
    if (newPage > 1) params.set('page', newPage.toString())
    if (newCharacter) params.set('character', newCharacter)
    if (newSort && newSort !== 'chapter') params.set('sort', newSort)
    router.push(`/gambles${params.toString() ? `?${params.toString()}` : ''}`, { scroll: false })
  }, [router])

  // Data fetching
  const fetcher = useCallback(async (page = 1) => {
    const sortGambles = (gambles: Gamble[]) => {
      return [...gambles].sort((a, b) => {
        switch (sortBy) {
          case 'name': return (a.name || '').localeCompare(b.name || '')
          case 'chapter': return (a.chapterId || 999) - (b.chapterId || 999)
          default: return 0
        }
      })
    }

    if (characterFilter) {
      const charactersResponse = await api.getCharacters({ name: characterFilter, limit: 1 })
      if (charactersResponse.data.length > 0) {
        const characterId = charactersResponse.data[0].id
        const characterGamblesResponse = await api.getCharacterGambles(characterId, { limit: 1000 })
        const allGambles = sortGambles(characterGamblesResponse.data || [])
        const startIndex = (page - 1) * 12
        return { data: allGambles.slice(startIndex, startIndex + 12), total: allGambles.length, page, perPage: 12, totalPages: Math.max(1, Math.ceil(allGambles.length / 12)) }
      }
      return { data: [], total: 0, page: 1, perPage: 12, totalPages: 1 }
    }

    const params: any = { page, limit: 12 }
    if (searchQuery) params.name = searchQuery
    if (sortBy === 'name') { params.sort = 'name'; params.order = 'ASC' }
    else if (sortBy === 'chapter') { params.sort = 'chapterId'; params.order = 'ASC' }
    const resAny = await api.getGambles(params)
    return { data: resAny.data || [], total: resAny.total || 0, page: resAny.page || page, perPage: 12, totalPages: resAny.totalPages || Math.max(1, Math.ceil((resAny.total || 0) / 12)) }
  }, [characterFilter, searchQuery, sortBy])

  const { data: pageData, loading: pageLoading, prefetch } = usePaged<Gamble>(
    'gambles', currentPage, fetcher,
    { gambleName: searchQuery, character: characterFilter, sort: sortBy },
    { ttlMs: pagedCacheConfig.lists.gambles.ttlMs, persist: pagedCacheConfig.defaults.persist, maxEntries: pagedCacheConfig.lists.gambles.maxEntries }
  )

  useEffect(() => {
    if (pageData) {
      setGambles(pageData.data || [])
      setTotalPages(pageData.totalPages || 1)
      setTotal(pageData.total || 0)
    }
    setLoading(!!pageLoading)
  }, [pageData, pageLoading])

  // Search handlers
  const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.currentTarget.value
    setSearchInput(value)
    if (value.trim() === '' && searchQuery !== '') {
      setSearchQuery('')
      setCurrentPage(1)
      updateURL('', 1, characterFilter || undefined, sortBy)
    }
  }, [searchQuery, characterFilter, sortBy, updateURL])

  useEffect(() => {
    if (searchInput.trim() === '' && debouncedSearch.trim() !== '') return
    if (debouncedSearch.trim() !== searchQuery) {
      setSearchQuery(debouncedSearch.trim())
      setCurrentPage(1)
      updateURL(debouncedSearch.trim(), 1, characterFilter || undefined, sortBy)
    }
  }, [debouncedSearch, searchInput, searchQuery, characterFilter, sortBy, updateURL])

  const handleClearSearch = useCallback(() => {
    setSearchInput(''); setSearchQuery(''); setCharacterFilter(null); setCurrentPage(1)
    updateURL('', 1, undefined, sortBy)
  }, [sortBy, updateURL])

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
    updateURL(searchQuery, page, characterFilter || undefined, sortBy)
    prefetch(page)
  }, [searchQuery, characterFilter, sortBy, updateURL, prefetch])

  const handleSortChange = useCallback((value: string | null) => {
    const newSort = (value as SortOption) || 'chapter'
    setSortBy(newSort); setCurrentPage(1)
    updateURL(searchQuery, 1, characterFilter || undefined, newSort)
  }, [searchQuery, characterFilter, updateURL])

  const clearCharacterFilter = useCallback(() => {
    setCharacterFilter(null); setCurrentPage(1)
    updateURL(searchQuery, 1, undefined, sortBy)
  }, [searchQuery, sortBy, updateURL])

  // Card render
  const renderGambleCard = useCallback((gamble: Gamble, index: number) => {
    const handleCardClick = (e: React.MouseEvent) => {
      if (isTouchDevice) {
        const isSpoilered = shouldHideSpoiler(gamble.chapterId, userProgress, spoilerSettings)
        const hasBeenRevealed = revealedGambles.has(gamble.id)
        if (!isSpoilered || hasBeenRevealed) {
          if (hoveredGamble?.id !== gamble.id) {
            e.preventDefault()
            handleGambleTap(gamble, e)
          }
        }
      }
    }

    const handleCardMouseEnter = (e: React.MouseEvent) => {
      if (isTouchDevice) return
      currentlyHoveredRef.current = { gamble, element: e.currentTarget as HTMLElement }
      const isSpoilered = shouldHideSpoiler(gamble.chapterId, userProgress, spoilerSettings)
      const hasBeenRevealed = revealedGambles.has(gamble.id)
      if (!isSpoilered || hasBeenRevealed) handleGambleMouseEnter(gamble, e)
    }

    return (
      <PlayingCard
        entityType="gamble"
        href={`/gambles/${gamble.id}`}
        entityId={gamble.id}
        name={gamble.name}
        chapterBadge={gamble.chapterId ? `Ch. ${gamble.chapterId}` : undefined}
        imagePriority={index < 6}
        initialMedia={initialMediaMap?.[gamble.id]}
        onClick={handleCardClick}
        onMouseEnter={handleCardMouseEnter}
        onMouseLeave={() => { if (!isTouchDevice) { currentlyHoveredRef.current = null; handleGambleMouseLeave() } }}
        isTouchDevice={isTouchDevice}
        isHovered={hoveredGamble?.id === gamble.id}
        spoilerChapter={gamble.chapterId}
        onSpoilerRevealed={() => {
          setRevealedGambles(prev => new Set(prev).add(gamble.id))
          if (currentlyHoveredRef.current?.gamble.id === gamble.id) {
            const element = currentlyHoveredRef.current.element
            const syntheticEvent = { currentTarget: element, target: element } as unknown as React.MouseEvent
            handleGambleMouseEnter(currentlyHoveredRef.current.gamble, syntheticEvent)
          }
        }}
      />
    )
  }, [isTouchDevice, hoveredGamble, userProgress, spoilerSettings, revealedGambles, handleGambleMouseEnter, handleGambleMouseLeave, handleGambleTap])

  return (
    <ListPageLayout
      entityType="gamble"
      icon={<Dices size={24} color="white" />}
      title="Gambles"
      subtitle={characterFilter ? `High-stakes games featuring ${characterFilter}` : 'Discover the psychological battles and high-stakes games of Usogui'}
      items={gambles}
      total={total}
      totalPages={totalPages}
      currentPage={currentPage}
      pageSize={12}
      loading={loading}
      error={error}
      searchPlaceholder="Search gambles by name or description..."
      searchInput={searchInput}
      onSearchChange={handleSearchChange}
      onClearSearch={handleClearSearch}
      hasActiveFilters={hasSearchQuery}
      sortOptions={sortOptions}
      sortValue={sortBy}
      onSortChange={handleSortChange}
      renderCard={renderGambleCard}
      getKey={(g) => g.id}
      onPageChange={handlePageChange}
      entityNamePlural="match records"
      emptyIcon={<Dices size={48} />}
      activeFilterBadges={
        characterFilter ? (
          <Group justify="center" mb="md">
            <Badge
              size="lg"
              variant="filled"
              style={{ backgroundColor: accentGamble }}
              radius="xl"
              rightSection={
                <ActionIcon size="md" color="white" variant="transparent" onClick={clearCharacterFilter} aria-label="Clear character filter" style={{ minWidth: 32, minHeight: 32 }}>
                  <X size={14} />
                </ActionIcon>
              }
            >
              Character: {characterFilter}
            </Badge>
          </Group>
        ) : undefined
      }
      hoverModal={
        <HoverModal
          isOpen={!!hoveredGamble}
          position={hoverPosition}
          accentColor={accentGamble}
          onMouseEnter={handleModalMouseEnter}
          onMouseLeave={handleModalMouseLeave}
          onClose={closeModal}
          showCloseButton={isTouchDevice}
          entityLabel="gamble"
        >
          {hoveredGamble && (
            <>
              <Title order={4} size="md" ta="center" lineClamp={2} style={{ fontFamily: 'var(--font-opti-goudy-text), serif', fontWeight: 400, fontSize: '1.4rem', color: accentGamble }}>
                {hoveredGamble.name}
              </Title>

              {hoveredGamble.description && (
                <Text size="sm" ta="center" lineClamp={3} style={{ color: theme.colors.gray[6], lineHeight: 1.4, maxHeight: rem(60) }}>
                  {hoveredGamble.description}
                </Text>
              )}

              <Group justify="center" gap="xs">
                <Badge variant="filled" c="white" style={{ backgroundColor: accentGamble }} size="sm" fw={600}>
                  Ch. {hoveredGamble.chapterId}
                </Badge>
                {(() => {
                  const participantCount = hoveredGamble.factions && hoveredGamble.factions.length > 0
                    ? hoveredGamble.factions.reduce((sum, f) => sum + f.members.length, 0)
                    : (hoveredGamble.participants?.length || 0)
                  const factionCount = hoveredGamble.factions?.length || 0
                  if (participantCount > 0) {
                    return (
                      <>
                        <Badge variant="light" style={{ color: getEntityThemeColor(theme, 'event') }} size="sm" fw={500}>
                          {participantCount} participant{participantCount !== 1 ? 's' : ''}
                        </Badge>
                        {factionCount > 0 && (
                          <Badge variant="light" style={{ color: accentGamble }} size="sm" fw={500}>
                            {factionCount} faction{factionCount !== 1 ? 's' : ''}
                          </Badge>
                        )}
                      </>
                    )
                  }
                  return null
                })()}
              </Group>

              {hoveredGamble.factions && hoveredGamble.factions.length > 0 ? (() => {
                const sortedFactions = hoveredGamble.factions.slice().sort((a, b) => a.displayOrder - b.displayOrder)
                const renderFactionBox = (faction: GambleFaction) => {
                  const factionName = faction.name || (faction.supportedGambler ? `${faction.supportedGambler.name}'s Side` : 'Faction')
                  return (
                    <Box key={faction.id} style={{ flex: 1, minWidth: 0 }}>
                      <Text size="xs" fw={600} c={accentGamble} ta="center" mb={2}>{factionName}</Text>
                      <Group justify="center" gap="xs" wrap="wrap">
                        {faction.members.slice(0, 3).map((member) => (
                          <Badge key={member.id} variant="outline" style={{ color: getEntityThemeColor(theme, 'character') }} size="xs" fw={500}>
                            {member.character.name}
                          </Badge>
                        ))}
                        {faction.members.length > 3 && (
                          <Badge variant="outline" style={{ color: getEntityThemeColor(theme, 'character') }} size="xs" fw={500}>
                            +{faction.members.length - 3}
                          </Badge>
                        )}
                      </Group>
                    </Box>
                  )
                }

                if (sortedFactions.length >= 2) {
                  return (
                    <Stack gap="xs">
                      <Box style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginTop: 8 }}>
                        {renderFactionBox(sortedFactions[0])}
                        <Text style={{
                          fontFamily: 'var(--font-opti-goudy-text), serif',
                          fontSize: '1.1rem',
                          fontWeight: 400,
                          color: '#e11d48',
                          flexShrink: 0,
                          padding: '0 4px',
                          marginTop: 2
                        }}>VS</Text>
                        {renderFactionBox(sortedFactions[1])}
                      </Box>
                      {sortedFactions.length > 2 && (
                        <Text size="xs" c="dimmed" ta="center">+{sortedFactions.length - 2} more faction{sortedFactions.length - 2 !== 1 ? 's' : ''}</Text>
                      )}
                    </Stack>
                  )
                }

                return (
                  <Stack gap="xs">
                    {sortedFactions.map(renderFactionBox)}
                  </Stack>
                )
              })() : hoveredGamble.participants && hoveredGamble.participants.length > 0 ? (
                <Group justify="center" gap="xs" wrap="wrap">
                  {hoveredGamble.participants.slice(0, 3).map((p) => (
                    <Badge key={p.id} variant="outline" style={{ color: getEntityThemeColor(theme, 'character') }} size="xs" fw={500}>{p.name}</Badge>
                  ))}
                  {hoveredGamble.participants.length > 3 && (
                    <Badge variant="outline" style={{ color: getEntityThemeColor(theme, 'character') }} size="xs" fw={500}>+{hoveredGamble.participants.length - 3}</Badge>
                  )}
                </Group>
              ) : null}

              {hoveredGamble.winCondition && (
                <Box>
                  <Text size="xs" fw={600} style={{ color: theme.colors.gray[6] }} mb={2} ta="center">Win Condition:</Text>
                  <Text size="xs" lineClamp={2} ta="center" style={{ color: theme.colors.gray[6], lineHeight: 1.4 }}>{hoveredGamble.winCondition}</Text>
                </Box>
              )}
            </>
          )}
        </HoverModal>
      }

    />
  )
}
