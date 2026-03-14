'use client'

import React, { useCallback, useEffect, useState } from 'react'
import {
  Badge,
  Box,
  Card,
  Group,
  Stack,
  Text,
  Title,
  rem,
  useMantineTheme
} from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'
import { getEntityThemeColor, textColors } from '../../lib/mantine-theme'
import { notifications } from '@mantine/notifications'
import { Quote } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'motion/react'
import { api } from '../../lib/api'
import { usePaged } from '../../hooks/usePagedCache'
import { pagedCacheConfig } from '../../config/pagedCacheConfig'
import { ScrollToTop } from '../../components/ScrollToTop'
import TimelineSpoilerWrapper from '../../components/TimelineSpoilerWrapper'
import { useHoverModal } from '../../hooks/useHoverModal'
import { HoverModal } from '../../components/HoverModal'
import { ListPageLayout } from '../../components/layouts/ListPageLayout'
import { ActiveFilterBadge, ActiveFilterBadgeRow } from '../../components/layouts/ActiveFilterBadge'

interface QuoteData {
  id: number
  text: string
  speaker: string
  speakerId?: number
  context?: string
  tags: string[]
  chapter?: number
  volume?: number
  updatedAt: string
}

interface QuotesPageContentProps {
  initialQuotes?: QuoteData[]
  initialTotalPages?: number
  initialTotal?: number
  initialPage?: number
  initialSearch?: string
  initialCharacterId?: string
  initialCharacterName?: string | null
  initialError?: string
}

const PAGE_SIZE = 12

const sortOptions = [
  { value: 'newest', label: 'Newest' }
]

export default function QuotesPageContent({
  initialQuotes = [],
  initialTotalPages = 1,
  initialTotal = 0,
  initialPage = 1,
  initialSearch = '',
  initialCharacterId,
  initialCharacterName = null,
  initialError = ''
}: QuotesPageContentProps) {
  const theme = useMantineTheme()
  const router = useRouter()
  const searchParams = useSearchParams()

  const cardBgColor = theme.other?.usogui?.black ?? '#0a0a0a'
  const grayBadgeVariant = 'outline'

  const [quotes, setQuotes] = useState<QuoteData[]>(initialQuotes)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(initialError)
  const [searchInput, setSearchInput] = useState(initialSearch)
  const [searchQuery, setSearchQuery] = useState(initialSearch)
  const [currentPage, setCurrentPage] = useState(initialPage)

  // Debounce search input to prevent rate limiting
  const [debouncedSearch] = useDebouncedValue(searchInput, 300)
  const [totalPages, setTotalPages] = useState(initialTotalPages)
  const [total, setTotal] = useState(initialTotal)
  const [characterName, setCharacterName] = useState<string | null>(initialCharacterName)
  const [characterId, setCharacterId] = useState<string | undefined>(initialCharacterId)

  // Hover modal
  const {
    hoveredItem: hoveredQuote,
    hoverPosition,
    handleMouseEnter: handleQuoteMouseEnter,
    handleMouseLeave: handleQuoteMouseLeave,
    handleModalMouseEnter,
    handleModalMouseLeave,
    handleTap: handleQuoteTap,
    closeModal,
    isTouchDevice
  } = useHoverModal<QuoteData>()

  const accentQuote = theme.other?.usogui?.quote ?? theme.colors.violet?.[5] ?? '#7048e8'

  const fetcher = useCallback(async (page = 1) => {
    const params: any = { page, limit: PAGE_SIZE }
    if (searchQuery && searchQuery.trim()) params.search = searchQuery.trim()
    if (characterId && !isNaN(Number(characterId))) params.characterId = Number(characterId)

    const resAny = await api.getQuotes(params)
    const transformedQuotes = (resAny.data || []).map((quote: any) => ({
      id: quote.id,
      text: quote.text,
      speaker: quote.character?.name || 'Unknown',
      speakerId: quote.character?.id,
      context: quote.description || quote.context,
      tags: quote.tags ? (Array.isArray(quote.tags) ? quote.tags : [quote.tags]) : [],
      chapter: quote.chapterNumber,
      volume: quote.volumeNumber,
      updatedAt: quote.updatedAt
    }))

    return { data: transformedQuotes, total: resAny.total || 0, page: resAny.page || page, perPage: PAGE_SIZE, totalPages: resAny.totalPages || Math.max(1, Math.ceil((resAny.total || 0) / PAGE_SIZE)) }
  }, [searchQuery, characterId])

  const { data: pageData, loading: pageLoading, error: pageError, prefetch } = usePaged<QuoteData>(
    'quotes',
    currentPage,
    fetcher,
    { search: searchQuery, characterId },
    { ttlMs: pagedCacheConfig.lists.quotes.ttlMs, persist: pagedCacheConfig.defaults.persist, maxEntries: pagedCacheConfig.lists.quotes.maxEntries }
  )

  useEffect(() => {
    if (pageData) {
      setQuotes(pageData.data || [])
      setTotal(pageData.total || 0)
      setTotalPages(pageData.totalPages || 1)
    }
    setLoading(!!pageLoading)
    if (pageError) {
      const message = pageError instanceof Error ? pageError.message : String(pageError)
      setError(message)
      notifications.show({ message, color: 'red' })
    }
  }, [pageData, pageLoading, pageError])

  // Sync component state with URL params (supports browser back/forward)
  useEffect(() => {
    const urlSearch = searchParams.get('search') || ''
    const urlPage = parseInt(searchParams.get('page') || '1', 10)
    const urlCharacterId = searchParams.get('characterId') || undefined

    if (urlSearch !== searchQuery) {
      setSearchInput(urlSearch)
      setSearchQuery(urlSearch)
    }
    if (urlPage !== currentPage) {
      setCurrentPage(urlPage)
    }
    if (urlCharacterId !== characterId) {
      setCharacterId(urlCharacterId)
      if (!urlCharacterId) setCharacterName(null)
    }
  }, [searchParams]) // Only depend on searchParams to avoid infinite loops

  const updateUrl = useCallback((search: string, page: number, charId?: string) => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (charId) params.set('characterId', charId)
    if (page > 1) params.set('page', page.toString())

    const qs = params.toString()
    router.push(qs ? `/quotes?${qs}` : '/quotes', { scroll: false })
  }, [router])

  // Update search query when debounced value changes
  useEffect(() => {
    // Skip if input was cleared but debounce hasn't caught up yet
    if (searchInput.trim() === '' && debouncedSearch.trim() !== '') {
      return
    }
    if (debouncedSearch.trim() !== searchQuery) {
      setSearchQuery(debouncedSearch.trim())
      setCurrentPage(1)
      updateUrl(debouncedSearch.trim(), 1, characterId)
    }
  }, [debouncedSearch, searchInput, searchQuery, characterId, updateUrl])

  const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    setSearchInput(value)

    // Immediately clear search when input is emptied (bypass debounce)
    if (value.trim() === '' && searchQuery !== '') {
      setSearchQuery('')
      setCurrentPage(1)
      updateUrl('', 1, characterId)
    }
  }, [searchQuery, characterId, updateUrl])

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
    updateUrl(searchQuery, page, characterId)
    prefetch(page)
  }, [searchQuery, characterId, updateUrl, prefetch])

  const clearCharacterFilter = useCallback(() => {
    setCharacterId(undefined)
    setCharacterName(null)
    setCurrentPage(1)
    updateUrl(searchQuery, 1, undefined)
  }, [searchQuery, updateUrl])

  const handleClearAll = useCallback(() => {
    setSearchInput('')
    setSearchQuery('')
    setCharacterId(undefined)
    setCharacterName(null)
    setCurrentPage(1)
    updateUrl('', 1, undefined)
  }, [updateUrl])

  const hasSearchQuery = Boolean(searchQuery || characterId)

  const renderQuoteCard = useCallback((quote: QuoteData) => (
    <TimelineSpoilerWrapper chapterNumber={quote.chapter ?? 1}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ height: '100%' }}
      >
        <Card
          withBorder
          radius="lg"
          shadow="sm"
          padding="md"
          className="hoverable-card hoverable-card-quote"
          style={{
            height: '240px',
            cursor: 'pointer',
            position: 'relative',
            overflow: 'hidden',
            backgroundColor: cardBgColor,
          }}
          onClick={(e) => {
            if (isTouchDevice) {
              handleQuoteTap(quote, e)
            }
          }}
          onMouseEnter={(e) => {
            if (isTouchDevice) return
            handleQuoteMouseEnter(quote, e)
          }}
          onMouseLeave={() => {
            if (isTouchDevice) return
            handleQuoteMouseLeave()
          }}
        >
          <Stack gap="xs" h="100%" justify="space-between">
            {/* Header */}
            <Group justify="space-between" align="flex-start">
              <Group gap="xs" wrap="wrap">
                {quote.chapter && (
                  <Badge color="gray" variant={grayBadgeVariant as any} size="md">
                    Ch. {quote.chapter}
                  </Badge>
                )}
              </Group>
              <Quote size={20} color={accentQuote} />
            </Group>

            {/* Quote Text */}
            <Box style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Text
                size="lg"
                lineClamp={4}
                ta="center"
                fw={600}
                style={{
                  fontStyle: 'italic',
                  lineHeight: 1.3,
                  fontSize: rem(17),
                  color: textColors.primary
                }}
              >
                &quot;{quote.text}&quot;
              </Text>
            </Box>

            {/* Speaker */}
            <Text
              size="md"
              c={accentQuote}
              ta="center"
              style={{ fontSize: rem(15), fontFamily: 'var(--font-opti-goudy-text), serif', fontWeight: 400 }}
            >
              —{' '}
              {quote.speakerId ? (
                <Text
                  component={Link}
                  href={`/characters/${quote.speakerId}`}
                  inherit
                  style={{ textDecoration: 'none' }}
                  onClick={(e) => e.stopPropagation()}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.textDecoration = 'underline'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.textDecoration = 'none'
                  }}
                >
                  {quote.speaker}
                </Text>
              ) : (
                quote.speaker
              )}
            </Text>

            {/* Tags */}
            {quote.tags.length > 0 && (
              <Group gap={4} wrap="wrap" justify="center">
                {quote.tags.slice(0, 3).map((tag: string, tagIndex: number) => (
                  <Badge key={tagIndex} size="xs" color="gray" variant={grayBadgeVariant as any}>
                    {tag}
                  </Badge>
                ))}
                {quote.tags.length > 3 && (
                  <Badge size="xs" color="gray" variant={grayBadgeVariant as any}>
                    +{quote.tags.length - 3}
                  </Badge>
                )}
              </Group>
            )}

            {/* Footer */}
            {quote.volume && (
              <Text size="xs" style={{ color: theme.colors.gray[6] }} ta="center">
                {quote.volume && `Vol. ${quote.volume}`}
                {quote.volume && quote.chapter && ' • '}
                {quote.chapter && `Ch. ${quote.chapter}`}
              </Text>
            )}

            {/* Touch device hint */}
            {isTouchDevice && hoveredQuote?.id !== quote.id && (
              <Text
                size="xs"
                c="dimmed"
                ta="center"
                style={{ fontSize: rem(10), opacity: 0.7 }}
              >
                Tap to preview
              </Text>
            )}
          </Stack>
        </Card>
      </motion.div>
    </TimelineSpoilerWrapper>
  ), [isTouchDevice, hoveredQuote, accentQuote, cardBgColor, handleQuoteMouseEnter, handleQuoteMouseLeave, handleQuoteTap, theme])

  return (
    <ListPageLayout
      entityType="quote"
      icon={<Quote size={24} color="white" />}
      title="Memorable Quotes"
      subtitle={
        characterName
          ? `Iconic wisdom and memorable dialogue from ${characterName}`
          : 'Discover profound insights and memorable dialogue from the world of Usogui'
      }
      items={quotes}
      total={total}
      totalPages={totalPages}
      currentPage={currentPage}
      pageSize={PAGE_SIZE}
      loading={loading}
      error={error}
      searchPlaceholder="Search quotes, speakers, or context..."
      searchInput={searchInput}
      onSearchChange={handleSearchChange}
      onClearSearch={handleClearAll}
      hasActiveFilters={hasSearchQuery}
      sortOptions={sortOptions}
      sortValue="newest"
      onSortChange={() => {}}
      renderCard={renderQuoteCard}
      getKey={(q) => q.id}
      gridLayout="landscape"
      skeletonCardWidth={280}
      skeletonCardHeight={240}
      onPageChange={handlePageChange}
      entityNamePlural="quotes"
      emptyIcon={<Quote size={48} />}
      activeFilterBadges={
        characterId && characterName ? (
          <ActiveFilterBadgeRow>
            <ActiveFilterBadge
              label="Character"
              value={characterName}
              onClear={clearCharacterFilter}
              accentColor={accentQuote}
            />
          </ActiveFilterBadgeRow>
        ) : undefined
      }
      hoverModal={
        <HoverModal
          isOpen={!!hoveredQuote}
          position={hoverPosition}
          accentColor={accentQuote}
          onMouseEnter={handleModalMouseEnter}
          onMouseLeave={handleModalMouseLeave}
          onClose={closeModal}
          showCloseButton={isTouchDevice}
          entityLabel="quote"
        >
          {hoveredQuote && (
            <>
              <Text className="eyebrow-label" style={{ color: 'rgba(255,255,255,0.45)', marginBottom: 4 }}>
                Quote
              </Text>
              <Title order={4} size="md" c={accentQuote} ta="center" lineClamp={2} style={{ fontFamily: 'var(--font-opti-goudy-text), serif', fontWeight: 400 }}>
                {hoveredQuote.speakerId ? (
                  <Text
                    component={Link}
                    href={`/characters/${hoveredQuote.speakerId}`}
                    inherit
                    c={accentQuote}
                    style={{ textDecoration: 'none', fontFamily: 'var(--font-opti-goudy-text), serif', fontWeight: 400 }}
                    onMouseEnter={(e) => { e.currentTarget.style.textDecoration = 'underline' }}
                    onMouseLeave={(e) => { e.currentTarget.style.textDecoration = 'none' }}
                  >
                    {hoveredQuote.speaker}
                  </Text>
                ) : (
                  hoveredQuote.speaker
                )}
              </Title>

              <Box style={{ position: 'relative' }}>
                <Text
                  aria-hidden
                  style={{
                    position: 'absolute',
                    top: -8,
                    left: -4,
                    fontSize: '4rem',
                    fontFamily: 'var(--font-opti-goudy-text), serif',
                    color: 'rgba(32, 201, 151, 0.12)',
                    lineHeight: 1,
                    pointerEvents: 'none',
                    userSelect: 'none',
                  }}
                >&quot;</Text>
                <Text
                  size="sm"
                  ta="center"
                  lineClamp={4}
                  fs="italic"
                  style={{ lineHeight: 1.4, paddingTop: rem(8), paddingLeft: rem(12), paddingRight: rem(12) }}
                >
                  &ldquo;{hoveredQuote.text}&rdquo;
                </Text>
              </Box>

              {hoveredQuote.context && (
                <Box>
                  <Text size="xs" fw={600} style={{ color: theme.colors.gray[6] }} mb={4} ta="center">
                    Context
                  </Text>
                  <Text
                    size="sm"
                    c={textColors.primary}
                    ta="center"
                    lineClamp={4}
                    style={{ lineHeight: 1.4, fontWeight: 500 }}
                  >
                    {hoveredQuote.context}
                  </Text>
                </Box>
              )}

              {(hoveredQuote.volume || hoveredQuote.chapter) && (
                <Group justify="center" gap="xs">
                  <Badge
                    variant="filled"
                    c="white"
                    size="sm"
                    style={{ backgroundColor: getEntityThemeColor(theme, 'media') }}
                  >
                    {hoveredQuote.volume && `Vol. ${hoveredQuote.volume}`}
                    {hoveredQuote.volume && hoveredQuote.chapter && ' • '}
                    {hoveredQuote.chapter && `Ch. ${hoveredQuote.chapter}`}
                  </Badge>
                </Group>
              )}

              {hoveredQuote.tags.length > 0 && (
                <Group justify="center" gap="xs">
                  <Badge variant="outline" color="gray" size="xs">
                    {hoveredQuote.tags.length} tag{hoveredQuote.tags.length !== 1 ? 's' : ''}
                  </Badge>
                  {hoveredQuote.tags.slice(0, 2).map((tag: string, index: number) => (
                    <Badge key={index} variant="light" style={{ color: getEntityThemeColor(theme, 'character') }} size="xs">
                      {tag}
                    </Badge>
                  ))}
                  {hoveredQuote.tags.length > 2 && (
                    <Badge variant="light" style={{ color: getEntityThemeColor(theme, 'character') }} size="xs">
                      +{hoveredQuote.tags.length - 2}
                    </Badge>
                  )}
                </Group>
              )}

              {!hoveredQuote.context && (
                <Text size="sm" style={{ color: theme.colors.gray[6] }} ta="center" fs="italic">
                  No additional context available
                </Text>
              )}
            </>
          )}
        </HoverModal>
      }
      afterContent={<ScrollToTop accentColor={accentQuote} />}
    />
  )
}
