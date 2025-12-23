'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ActionIcon,
  Alert,
  Badge,
  Box,
  Button,
  Card,
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
import { getEntityThemeColor, semanticColors, textColors, backgroundStyles, getHeroStyles, getPlayingCardStyles } from '../../lib/mantine-theme'
import { AlertCircle, Search, Shield, Users, X } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'motion/react'
import { api } from '../../lib/api'
import MediaThumbnail from '../../components/MediaThumbnail'
import { CardGridSkeleton } from '../../components/CardGridSkeleton'

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
}

const PAGE_SIZE = 12

export default function OrganizationsPageContent({
  initialOrganizations,
  initialPage,
  initialSearch,
  initialError
}: OrganizationsPageContentProps) {
  const theme = useMantineTheme()
  const accentOrganization = theme.other?.usogui?.organization ?? theme.colors.grape?.[5] ?? '#9c36b5'
  const router = useRouter()
  const searchParams = useSearchParams()

  // Load all organizations once - no pagination needed on API level
  const [allOrganizations, setAllOrganizations] = useState<Organization[]>(initialOrganizations)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(initialError || null)
  const [searchQuery, setSearchQuery] = useState(initialSearch || '')

  // Client-side pagination
  const [currentPage, setCurrentPage] = useState<number>(initialPage)

  // Hover modal state
  const [hoveredOrganization, setHoveredOrganization] = useState<Organization | null>(null)
  const [hoverModalPosition, setHoverModalPosition] = useState<{ x: number; y: number } | null>(null)
  const hoverTimeoutRef = useRef<number | null>(null)
  const hoveredElementRef = useRef<HTMLElement | null>(null)

  const hasSearchQuery = searchQuery.trim().length > 0

  // Load all organizations once on mount
  const loadAllOrganizations = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await api.get<any>('/organizations?limit=200') // Get all organizations (small dataset)
      setAllOrganizations(response.data || [])
    } catch (err: any) {
      console.error('Error loading organizations:', err)
      if (err?.status === 429) {
        setError('Rate limit exceeded. Please wait a moment and try again.')
      } else {
        setError('Failed to load organizations. Please try again later.')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  // Client-side filtering and pagination
  const filteredOrganizations = useMemo(() => {
    if (!searchQuery.trim()) return allOrganizations

    const query = searchQuery.toLowerCase().trim()
    return allOrganizations.filter(organization => {
      const name = organization.name?.toLowerCase() || ''
      const description = organization.description?.toLowerCase() || ''

      return name.includes(query) || description.includes(query)
    })
  }, [allOrganizations, searchQuery])

  const paginatedOrganizations = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE
    return filteredOrganizations.slice(startIndex, startIndex + PAGE_SIZE)
  }, [filteredOrganizations, currentPage])

  const totalPages = Math.ceil(filteredOrganizations.length / PAGE_SIZE)
  const total = filteredOrganizations.length

  // Load all organizations on mount if we don't have the expected full set
  useEffect(() => {
    if (allOrganizations.length === 0 || (allOrganizations.length > 0 && allOrganizations.length < 10)) {
      loadAllOrganizations()
    }
  }, [allOrganizations.length, loadAllOrganizations])

  // Sync with URL parameters - only react to searchParams changes
  useEffect(() => {
    const urlPage = parseInt(searchParams.get('page') || '1', 10)
    const urlSearch = searchParams.get('search') || ''

    setCurrentPage(urlPage)
    setSearchQuery(urlSearch)
  }, [searchParams])

  // Function to update modal position based on hovered element
  const updateModalPosition = useCallback((organization?: Organization) => {
    const currentOrganization = organization || hoveredOrganization
    if (hoveredElementRef.current && currentOrganization) {
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
  }, [hoveredOrganization])

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        window.clearTimeout(hoverTimeoutRef.current)
      }
    }
  }, [])

  // Add scroll and resize listeners to update modal position
  useEffect(() => {
    if (hoveredOrganization && hoveredElementRef.current) {
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
  }, [hoveredOrganization, updateModalPosition])

  const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const newSearch = event.target.value
    setSearchQuery(newSearch)
    setCurrentPage(1) // Reset to first page immediately when search changes
  }, [])

  // Update URL when search or page changes (no API calls needed)
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
    // No API calls needed!
  }, [router])

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page) // Update local state immediately
    // No API calls needed - everything is client-side now!
  }, [])

  // Hover modal handlers
  const handleOrganizationMouseEnter = (organization: Organization, event: React.MouseEvent) => {
    const element = event.currentTarget as HTMLElement
    hoveredElementRef.current = element

    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
    }

    hoverTimeoutRef.current = window.setTimeout(() => {
      setHoveredOrganization(organization)
      updateModalPosition(organization) // Pass organization directly to ensure position calculation works immediately
    }, 500) // 500ms delay before showing
  }

  const handleOrganizationMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
    }

    // Small delay before hiding to allow moving to modal
    hoverTimeoutRef.current = window.setTimeout(() => {
      setHoveredOrganization(null)
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
    setHoveredOrganization(null)
    setHoverModalPosition(null)
    hoveredElementRef.current = null
  }

  return (
    <Box style={{ backgroundColor: backgroundStyles.page(theme), minHeight: '100vh' }}>
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      {/* Hero Section */}
      <Box
        style={{
          background: `linear-gradient(135deg, ${accentOrganization}15, ${accentOrganization}08)`,
          borderRadius: theme.radius.lg,
          border: `1px solid ${accentOrganization}25`,
          marginBottom: rem(24)
        }}
        p="md"
      >
        <Stack align="center" gap="xs">
          <Box
            style={{
              background: `linear-gradient(135deg, ${accentOrganization}, ${accentOrganization}CC)`,
              borderRadius: '50%',
              width: rem(40),
              height: rem(40),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 4px 16px ${accentOrganization}40`
            }}
          >
            <Shield size={20} color="white" />
          </Box>

          <Stack align="center" gap="xs">
            <Title order={1} size="1.5rem" fw={700} ta="center" c={accentOrganization}>
              Organizations
            </Title>
            <Text size="md" style={{ color: theme.colors.gray[6] }} ta="center" maw={400}>
              Explore the various groups and organizations in the Usogui universe
            </Text>

            {allOrganizations.length > 0 && (
              <Badge
                size="md"
                variant="light"
                c={accentOrganization}
                radius="xl"
                mt="xs"
              >
                {searchQuery ? `${total} of ${allOrganizations.length}` : `${allOrganizations.length}`} organization{(searchQuery ? total : allOrganizations.length) !== 1 ? 's' : ''} {searchQuery ? 'found' : 'available'}
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
              placeholder="Search organizations by name..."
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
          style={{ color: getEntityThemeColor(theme, 'gamble') }}
          radius="md"
          mb="xl"
          icon={<AlertCircle size={16} />}
          title="Error loading organizations"
        >
          {error}
        </Alert>
      )}

      {/* Loading State */}
      {loading ? (
        <CardGridSkeleton count={12} cardWidth={200} cardHeight={280} accentColor={accentOrganization} />
      ) : (
        <>
          {/* Empty State */}
          {paginatedOrganizations.length === 0 ? (
            <Box style={{ textAlign: 'center', paddingBlock: rem(80) }}>
              <Shield size={64} color={theme.colors.gray[4]} style={{ marginBottom: rem(20) }} />
              <Title order={3} style={{ color: theme.colors.gray[6] }} mb="sm">
                {hasSearchQuery ? 'No organizations found' : 'No organizations available'}
              </Title>
              <Text size="lg" style={{ color: theme.colors.gray[6] }} mb="xl">
                {hasSearchQuery
                  ? 'Try adjusting your search terms or filters'
                  : 'Check back later for new organizations'}
              </Text>
              {hasSearchQuery && (
                <Button variant="outline" color="grape" onClick={handleClearSearch}>
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
                {paginatedOrganizations.map((organization: Organization, index: number) => (
                  <motion.div
                    key={organization.id}
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
                      href={`/organizations/${organization.id}`}
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
                        border: `1px solid ${theme.colors.dark?.[4] ?? theme.colors.gray?.[3]}`,
                        width: '100%',
                        height: '100%'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-4px)'
                        e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.25)'
                        handleOrganizationMouseEnter(organization, e)
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.boxShadow = theme.shadows.sm
                        handleOrganizationMouseLeave()
                      }}
                    >
                      {/* Member Count Badge at Top Left */}
                      {organization.memberCount !== undefined && (
                        <Badge
                          variant="filled"
                          c="white"
                          radius="sm"
                          size="sm"
                          style={{
                            position: 'absolute',
                            top: rem(8),
                            left: rem(8),
                            backgroundColor: accentOrganization,
                            fontSize: rem(10),
                            fontWeight: 700,
                            zIndex: 10,
                            backdropFilter: 'blur(4px)',
                            maxWidth: 'calc(100% - 16px)'
                          }}
                        >
                          {organization.memberCount} members
                        </Badge>
                      )}

                      {/* Main Image Section - Takes up most of the card */}
                      <Box style={{
                        position: 'relative',
                        overflow: 'hidden',
                        flex: 1,
                        minHeight: 0
                      }}>
                        <MediaThumbnail
                          entityType="organization"
                          entityId={organization.id}
                          entityName={organization.name}
                          maxWidth={200}
                          maxHeight={240}
                          allowCycling={false}
                        />
                      </Box>

                      {/* Organization Name at Bottom */}
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
                          c={accentOrganization}
                          ta="center"
                          style={{
                            lineHeight: 1.2,
                            fontSize: rem(15),
                            background: `linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))`,
                            backdropFilter: 'blur(4px)',
                            borderRadius: rem(6),
                            padding: `${rem(4)} ${rem(8)}`,
                            border: `1px solid rgba(255,255,255,0.1)`
                          }}
                        >
                          {organization.name}
                        </Text>
                      </Box>
                    </Card>
                  </motion.div>
                ))}
              </Box>

              {/* Pagination Info & Controls */}
              <Box style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                marginTop: rem(48),
                gap: rem(12)
              }}>
                {/* Always show pagination info when we have organizations */}
                {allOrganizations.length > 0 && (
                  <Text size="sm" style={{ color: theme.colors.gray[6] }}>
                    Showing {paginatedOrganizations.length} of {total} organizations
                    {totalPages > 1 && ` • Page ${currentPage} of ${totalPages}`}
                  </Text>
                )}

                {/* Show pagination controls when we have multiple pages */}
                {totalPages > 1 && (
                  <Pagination
                    total={totalPages}
                    value={currentPage}
                    onChange={handlePageChange}
                    color="grape"
                    size="lg"
                    radius="xl"
                    withEdges
                  />
                )}

                {loading && <Loader size="sm" color={accentOrganization} />}
              </Box>
            </>
          )}
        </>
      )}

      {/* Hover Modal */}
      <AnimatePresence>
        {hoveredOrganization && hoverModalPosition && (
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
                border: `2px solid ${accentOrganization}`,
                backdropFilter: 'blur(10px)',
                width: rem(300),
                maxWidth: '90vw'
              }}
            >
              <Stack gap="sm">
                {/* Organization Name */}
                <Title
                  order={4}
                  size="md"
                  fw={700}
                  c={accentOrganization}
                  ta="center"
                  lineClamp={2}
                >
                  {hoveredOrganization.name}
                </Title>

                {/* Member count (kept) */}
                <Group justify="center" gap="xs">
                  {hoveredOrganization.memberCount !== undefined && (
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
                  )}
                </Group>

                {/* Description */}
                {hoveredOrganization.description && (
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
                    {hoveredOrganization.description}
                  </Text>
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
