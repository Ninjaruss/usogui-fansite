'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Badge,
  Group,
  Stack,
  Text,
  Title,
  rem,
  useMantineTheme
} from '@mantine/core'
import { getEntityThemeColor } from '../../lib/mantine-theme'
import { Shield, Users } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { api } from '../../lib/api'
import { useHoverModal } from '../../hooks/useHoverModal'
import { HoverModal } from '../../components/HoverModal'
import { ListPageLayout } from '../../components/layouts/ListPageLayout'
import { PlayingCard } from '../../components/cards/PlayingCard'
import type { MediaItem } from '../../components/MediaThumbnail'

interface Organization {
  id: number
  name: string
  description?: string
  memberCount?: number
}

interface OrganizationsPageContentProps {
  initialOrganizations: Organization[]
  initialTotalPages: number
  initialTotal: number
  initialPage: number
  initialSearch: string
  initialError: string
  initialMediaMap?: Record<number, MediaItem[]>
}

const PAGE_SIZE = 12

const sortOptions = [
  { value: 'name', label: 'Name (A-Z)' },
  { value: 'memberCount', label: 'Member Count' }
]

export default function OrganizationsPageContent({
  initialOrganizations,
  initialPage,
  initialSearch,
  initialError,
  initialMediaMap
}: OrganizationsPageContentProps) {
  const theme = useMantineTheme()
  const accentOrganization = theme.other?.usogui?.organization ?? theme.colors.grape?.[5] ?? '#9c36b5'
  const router = useRouter()
  const searchParams = useSearchParams()

  const [allOrganizations, setAllOrganizations] = useState<Organization[]>(initialOrganizations)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(initialError || null)
  const [searchQuery, setSearchQuery] = useState(initialSearch || '')
  const [currentPage, setCurrentPage] = useState<number>(initialPage)
  const [sortBy, setSortBy] = useState<string>('name')

  // Hover modal
  const {
    hoveredItem: hoveredOrganization,
    hoverPosition,
    handleMouseEnter: handleOrganizationMouseEnter,
    handleMouseLeave: handleOrganizationMouseLeave,
    handleModalMouseEnter,
    handleModalMouseLeave,
    handleTap: handleOrganizationTap,
    closeModal,
    isTouchDevice
  } = useHoverModal<Organization>()

  const hasSearchQuery = searchQuery.trim().length > 0

  // Load all organizations on mount
  const loadAllOrganizations = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await api.get<any>('/organizations?limit=200')
      setAllOrganizations(response.data || [])
    } catch (err: any) {
      console.error('Error loading organizations:', err)
      setError(err?.status === 429 ? 'Rate limit exceeded. Please wait a moment and try again.' : 'Failed to load organizations. Please try again later.')
    } finally {
      setLoading(false)
    }
  }, [])

  // Client-side filtering and sorting
  const filteredOrganizations = useMemo(() => {
    let results = allOrganizations
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      results = results.filter(org => {
        const name = org.name?.toLowerCase() || ''
        const description = org.description?.toLowerCase() || ''
        return name.includes(query) || description.includes(query)
      })
    }
    return [...results].sort((a, b) => {
      if (sortBy === 'memberCount') {
        return (b.memberCount ?? 0) - (a.memberCount ?? 0)
      }
      return (a.name || '').localeCompare(b.name || '')
    })
  }, [allOrganizations, searchQuery, sortBy])

  const paginatedOrganizations = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE
    return filteredOrganizations.slice(startIndex, startIndex + PAGE_SIZE)
  }, [filteredOrganizations, currentPage])

  const totalPages = Math.ceil(filteredOrganizations.length / PAGE_SIZE)
  const total = filteredOrganizations.length

  useEffect(() => {
    if (allOrganizations.length === 0 || (allOrganizations.length > 0 && allOrganizations.length < 10)) {
      loadAllOrganizations()
    }
  }, [allOrganizations.length, loadAllOrganizations])

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
    const newUrl = params.toString() ? `/organizations?${params.toString()}` : '/organizations'
    router.push(newUrl, { scroll: false })
  }, [searchQuery, currentPage, router])

  const handleClearSearch = useCallback(() => {
    setSearchQuery('')
    setCurrentPage(1)
    router.push('/organizations', { scroll: false })
  }, [router])

  const handleSortChange = useCallback((value: string | null) => {
    setSortBy(value || 'name')
    setCurrentPage(1)
  }, [])

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
  }, [])

  // Card render
  const renderOrganizationCard = useCallback((org: Organization, index: number) => {
    const handleCardClick = (e: React.MouseEvent) => {
      if (isTouchDevice && hoveredOrganization?.id !== org.id) {
        e.preventDefault()
        handleOrganizationTap(org, e)
      }
    }

    return (
      <PlayingCard
        entityType="organization"
        href={`/organizations/${org.id}`}
        entityId={org.id}
        name={org.name}
        chapterBadge={org.memberCount !== undefined ? `${org.memberCount} members` : undefined}
        imagePriority={index < 6}
        initialMedia={initialMediaMap?.[org.id]}
        onClick={handleCardClick}
        onMouseEnter={(e) => {
          if (!isTouchDevice) handleOrganizationMouseEnter(org, e)
        }}
        onMouseLeave={() => {
          if (!isTouchDevice) handleOrganizationMouseLeave()
        }}
        isTouchDevice={isTouchDevice}
        isHovered={hoveredOrganization?.id === org.id}
      />
    )
  }, [isTouchDevice, hoveredOrganization, handleOrganizationMouseEnter, handleOrganizationMouseLeave, handleOrganizationTap])

  return (
    <ListPageLayout
      entityType="organization"
      icon={<Shield size={24} color="white" />}
      title="Organizations"
      subtitle="Explore the various groups and organizations in the Usogui universe"
      items={paginatedOrganizations}
      total={total}
      totalPages={totalPages}
      currentPage={currentPage}
      pageSize={PAGE_SIZE}
      loading={loading}
      error={error}
      searchPlaceholder="Search organizations by name..."
      searchInput={searchQuery}
      onSearchChange={handleSearchChange}
      onClearSearch={handleClearSearch}
      hasActiveFilters={hasSearchQuery}
      sortOptions={sortOptions}
      sortValue={sortBy}
      onSortChange={handleSortChange}
      renderCard={renderOrganizationCard}
      getKey={(o) => o.id}
      onPageChange={handlePageChange}
      entityNamePlural="organizations"
      emptyIcon={<Shield size={48} />}
      hoverModal={
        <HoverModal
          isOpen={!!hoveredOrganization}
          position={hoverPosition}
          accentColor={accentOrganization}
          onMouseEnter={handleModalMouseEnter}
          onMouseLeave={handleModalMouseLeave}
          onClose={closeModal}
          showCloseButton={isTouchDevice}
        >
          {hoveredOrganization && (
            <>
              <Title order={4} size="md" fw={700} c={accentOrganization} ta="center" lineClamp={2}>
                {hoveredOrganization.name}
              </Title>

              {hoveredOrganization.memberCount !== undefined && (
                <Group justify="center" gap="xs">
                  <Badge
                    variant="filled"
                    c="white"
                    size="sm"
                    fw={600}
                    leftSection={<Users size={12} />}
                    style={{ backgroundColor: getEntityThemeColor(theme, 'organization') }}
                  >
                    {hoveredOrganization.memberCount} members
                  </Badge>
                </Group>
              )}

              {hoveredOrganization.description && (
                <Text size="sm" ta="center" lineClamp={3} style={{ color: theme.colors.gray[6], lineHeight: 1.4, maxHeight: rem(60) }}>
                  {hoveredOrganization.description}
                </Text>
              )}
            </>
          )}
        </HoverModal>
      }
    />
  )
}
