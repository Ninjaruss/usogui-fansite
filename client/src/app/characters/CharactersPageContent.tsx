'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ActionIcon,
  Badge,
  Group,
  Select,
  Text,
  Title,
  rem,
  useMantineTheme
} from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'
import { getEntityThemeColor } from '../../lib/mantine-theme'
import { Building2, User, X } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { api } from '../../lib/api'
import { useHoverModal } from '../../hooks/useHoverModal'
import { HoverModal } from '../../components/HoverModal'
import { ScrollToTop } from '../../components/ScrollToTop'
import { useProgress } from '../../providers/ProgressProvider'
import { useSpoilerSettings } from '../../hooks/useSpoilerSettings'
import { shouldHideSpoiler } from '../../lib/spoiler-utils'
import { ListPageLayout } from '../../components/layouts/ListPageLayout'
import { PlayingCard } from '../../components/cards/PlayingCard'

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
  initialTotalPages = 1,
  initialTotal = 0,
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
  const [totalPages, setTotalPages] = useState(initialTotalPages)
  const [total, setTotal] = useState(initialTotal)

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

  // Sync component state with URL params on mount and when URL changes
  useEffect(() => {
    const urlSearch = searchParams.get('search') || ''
    const urlPage = parseInt(searchParams.get('page') || '1', 10)
    const urlSort = (searchParams.get('sort') as SortOption) || 'firstAppearance'
    const urlOrg = searchParams.get('org') || null

    if (urlSearch !== searchQuery) {
      setSearchInput(urlSearch)
      setSearchQuery(urlSearch)
    }
    if (urlPage !== currentPage) {
      setCurrentPage(urlPage)
    }
    if (urlSort !== sortBy) {
      setSortBy(urlSort)
    }
    if (urlOrg !== organizationFilter) {
      setOrganizationFilter(urlOrg)
    }
  }, [searchParams]) // Only depend on searchParams to avoid infinite loops

  // Filter characters by organization client-side
  const filteredCharacters = useMemo(() => {
    if (!organizationFilter) return characters
    return characters.filter(character =>
      character.organizations?.some(org => org.id.toString() === organizationFilter)
    )
  }, [characters, organizationFilter])

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

  // Update URL when search, page, sort, or org filter changes
  const updateURL = useCallback((page: number, search: string, sort: SortOption, org: string | null = organizationFilter) => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (page > 1) params.set('page', page.toString())
    if (sort !== 'firstAppearance') params.set('sort', sort)
    if (org) params.set('org', org)

    const url = params.toString() ? `/characters?${params.toString()}` : '/characters'
    router.push(url, { scroll: false })
  }, [router, organizationFilter])

  // Load characters when page, search, or sort changes
  useEffect(() => {
    loadCharacters(currentPage, searchQuery, sortBy)
  }, [currentPage, searchQuery, sortBy, loadCharacters])

  // Debounced search
  const [debouncedSearch] = useDebouncedValue(searchInput, 300)

  useEffect(() => {
    if (searchInput.trim() === '' && debouncedSearch.trim() !== '') {
      return
    }
    if (debouncedSearch.trim() !== searchQuery) {
      setSearchQuery(debouncedSearch.trim())
      setCurrentPage(1)
      updateURL(1, debouncedSearch.trim(), sortBy)
    }
  }, [debouncedSearch, searchInput, searchQuery, sortBy, updateURL])

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
    if (value.trim() === '' && searchQuery !== '') {
      setSearchQuery('')
      setCurrentPage(1)
      updateURL(1, '', sortBy, organizationFilter)
    }
  }

  const handleClearSearch = () => {
    setSearchInput('')
    setSearchQuery('')
    setOrganizationFilter(null)
    setCurrentPage(1)
    updateURL(1, '', sortBy, null)
  }

  const handleOrganizationFilterChange = (value: string | null) => {
    setOrganizationFilter(value)
    setCurrentPage(1)
    updateURL(1, searchQuery, sortBy, value)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    updateURL(page, searchQuery, sortBy)
  }

  const handleSortChange = (value: string | null) => {
    const newSort = (value as SortOption) || 'name'
    setSortBy(newSort)
    setCurrentPage(1)
    updateURL(1, searchQuery, newSort)
  }

  // Card render function (entity-specific)
  const renderCharacterCard = useCallback((character: Character) => {
    const handleCardClick = (e: React.MouseEvent) => {
      if (isTouchDevice) {
        const isSpoilered = shouldHideSpoiler(character.firstAppearanceChapter, userProgress, spoilerSettings)
        const hasBeenRevealed = revealedCharacters.has(character.id)
        if (!isSpoilered || hasBeenRevealed) {
          if (hoveredCharacter?.id !== character.id) {
            e.preventDefault()
            handleCharacterTap(character, e)
          }
        }
      }
    }

    const handleCardMouseEnter = (e: React.MouseEvent) => {
      if (isTouchDevice) return
      currentlyHoveredRef.current = { character, element: e.currentTarget as HTMLElement }
      const isSpoilered = shouldHideSpoiler(character.firstAppearanceChapter, userProgress, spoilerSettings)
      const hasBeenRevealed = revealedCharacters.has(character.id)
      if (!isSpoilered || hasBeenRevealed) {
        handleCharacterMouseEnter(character, e)
      }
    }

    const handleCardMouseLeave = () => {
      if (isTouchDevice) return
      currentlyHoveredRef.current = null
      handleCharacterMouseLeave()
    }

    return (
      <PlayingCard
        entityType="character"
        href={`/characters/${character.id}`}
        entityId={character.id}
        name={character.name}
        chapterBadge={character.firstAppearanceChapter ? `Ch. ${character.firstAppearanceChapter}` : undefined}
        onClick={handleCardClick}
        onMouseEnter={handleCardMouseEnter}
        onMouseLeave={handleCardMouseLeave}
        isTouchDevice={isTouchDevice}
        isHovered={hoveredCharacter?.id === character.id}
        spoilerChapter={character.firstAppearanceChapter}
        onSpoilerRevealed={() => {
          setRevealedCharacters(prev => new Set(prev).add(character.id))
          if (currentlyHoveredRef.current?.character.id === character.id) {
            const element = currentlyHoveredRef.current.element
            const syntheticEvent = {
              currentTarget: element,
              target: element
            } as unknown as React.MouseEvent
            handleCharacterMouseEnter(currentlyHoveredRef.current.character, syntheticEvent)
          }
        }}
      />
    )
  }, [
    isTouchDevice, hoveredCharacter, userProgress, spoilerSettings,
    revealedCharacters, handleCharacterMouseEnter,
    handleCharacterMouseLeave, handleCharacterTap
  ])

  return (
    <>
      <ListPageLayout
        entityType="character"
        icon={<User size={24} color="white" />}
        title="Characters"
        subtitle="Explore the rich cast of Usogui characters, from cunning gamblers to mysterious adversaries"
        items={filteredCharacters}
        total={total}
        totalPages={totalPages}
        currentPage={currentPage}
        pageSize={PAGE_SIZE}
        loading={loading}
        error={error}
        searchPlaceholder="Search characters by name, alias, or tag..."
        searchInput={searchInput}
        onSearchChange={handleSearchChange}
        onClearSearch={handleClearSearch}
        hasActiveFilters={hasSearchQuery}
        sortOptions={sortOptions}
        sortValue={sortBy}
        onSortChange={handleSortChange}
        renderCard={renderCharacterCard}
        getKey={(c) => c.id}
        onPageChange={handlePageChange}
        entityNamePlural="characters"
        emptyIcon={<User size={48} />}
        filterSlot={
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
            styles={{ input: { fontSize: rem(14) } }}
          />
        }
        activeFilterBadges={
          organizationFilter ? (
            <Group justify="center" mt="sm" mb="md">
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
          ) : undefined
        }
        hoverModal={
          <HoverModal
            isOpen={
              !!hoveredCharacter &&
              (!shouldHideSpoiler(hoveredCharacter.firstAppearanceChapter, userProgress, spoilerSettings) ||
                revealedCharacters.has(hoveredCharacter.id))
            }
            position={hoverPosition}
            accentColor={accentCharacter}
            onMouseEnter={handleModalMouseEnter}
            onMouseLeave={handleModalMouseLeave}
            onClose={closeModal}
            showCloseButton={isTouchDevice}
          >
            {hoveredCharacter &&
              (!shouldHideSpoiler(hoveredCharacter.firstAppearanceChapter, userProgress, spoilerSettings) ||
                revealedCharacters.has(hoveredCharacter.id)) && (
              <>
                <Title order={4} size="md" fw={700} c={accentCharacter} ta="center" lineClamp={2}>
                  {hoveredCharacter.name}
                </Title>

                {hoveredCharacter.alias && (
                  <Text size="sm" style={{ color: theme.colors.gray[6] }} ta="center" className="italic">
                    &ldquo;{hoveredCharacter.alias}&rdquo;
                  </Text>
                )}

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

                {hoveredCharacter.firstAppearanceChapter && (
                  <Group justify="center" gap="xs">
                    <Badge variant="filled" c="white" style={{ backgroundColor: accentCharacter }} size="sm" fw={600}>
                      Ch. {hoveredCharacter.firstAppearanceChapter}
                    </Badge>
                  </Group>
                )}

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

                {hoveredCharacter.description && (
                  <Text
                    size="sm"
                    ta="center"
                    lineClamp={3}
                    style={{ color: theme.colors.gray[6], lineHeight: 1.4, maxHeight: rem(60) }}
                  >
                    {hoveredCharacter.description}
                  </Text>
                )}

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
        }
        afterContent={<ScrollToTop accentColor={accentCharacter} />}
      />

    </>
  )
}
