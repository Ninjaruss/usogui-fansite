'use client'

import React, { useMemo, useRef, useState, useEffect } from 'react'
import {
  Badge,
  Box,
  Button,
  Card,
  Container,
  Group,
  Skeleton,
  Stack,
  Tabs,
  Text,
  Textarea,
  ThemeIcon,
  Title,
  useMantineTheme
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import {
  getEntityThemeColor,
  textColors,
  headerColors,
  getAlphaColor,
  fontSize,
  setTabAccentColors,
  backgroundStyles,
  getCardStyles
} from '../../../lib/mantine-theme'
import { FileText, Calendar, Heart, Edit, Save, X, Users, BookOpen, Dice6, Eye, Tag } from 'lucide-react'
import Link from 'next/link'
import { api } from '../../../lib/api'
import { useAuth } from '../../../providers/AuthProvider'
import EnhancedSpoilerMarkdown from '../../../components/EnhancedSpoilerMarkdown'
import EntityEmbedHelperWithSearch from '../../../components/EntityEmbedHelperWithSearch'
import TimelineSpoilerWrapper from '../../../components/TimelineSpoilerWrapper'
import MediaThumbnail from '../../../components/MediaThumbnail'
import { motion } from 'motion/react'
import { GuideStatus } from '../../../types'
import AuthorProfileImage from '../../../components/AuthorProfileImage'
import { UserRoleDisplay } from '../../../components/BadgeDisplay'
import { usePageView } from '../../../hooks/usePageView'
import { BreadcrumbNav, createEntityBreadcrumbs } from '../../../components/Breadcrumb'

interface Guide {
  id: number
  title: string
  description: string
  content: string
  status: GuideStatus
  viewCount: number
  likeCount: number
  userHasLiked?: boolean
  author: {
    id: number
    username: string
    role?: string
    customRole?: string | null
    profilePictureType?: 'fluxer' | 'character_media' | null
    selectedCharacterMediaId?: number | null
    selectedCharacterMedia?: {
      id: number
      url: string
      fileName?: string
      description?: string
    } | null
    discordId?: string | null
    discordAvatar?: string | null
    fluxerId?: string | null
    fluxerAvatar?: string | null
  }
  tags: Array<{
    id: number
    name: string
  }>
  characters?: Array<{
    id: number
    name: string
  }>
  arc?: {
    id: number
    name: string
  }
  gambles?: Array<{
    id: number
    name: string
  }>
  createdAt: string
  updatedAt: string
}

interface GuidePageClientProps {
  initialGuide?: Guide
  guideId?: number
}

export default function GuidePageClient({ initialGuide, guideId }: GuidePageClientProps) {
  const theme = useMantineTheme()
  const { user, loading: authLoading } = useAuth()
  const [guide, setGuide] = useState<Guide | null>(initialGuide || null)
  const [editedContent, setEditedContent] = useState(initialGuide?.content || '')
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<string>('content')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  // Call usePageView hook early to maintain hook order (Rules of Hooks)
  usePageView('guide', guide?.id?.toString() || '', !!guide?.id)

  // Set tab accent colors for guide entity
  useEffect(() => {
    setTabAccentColors('guide')
  }, [])

  // Use consistent theme colors
  const entityColors = {
    guide: getEntityThemeColor(theme, 'guide'),
    character: getEntityThemeColor(theme, 'character'),
    arc: getEntityThemeColor(theme, 'arc'),
    gamble: getEntityThemeColor(theme, 'gamble'),
    media: getEntityThemeColor(theme, 'media'),
    organization: getEntityThemeColor(theme, 'organization')
  }

  // When the server-rendered page couldn't see the user's session,
  // initialGuide.userHasLiked may be undefined. If we have a logged-in
  // user on the client, refresh the guide like status so the button
  // correctly reflects whether the current user already liked it.
  React.useEffect(() => {
    if (!guide || !user) return

    let cancelled = false
    const ensureLikeStatus = async () => {
      // Only refetch if server didn't provide a boolean for userHasLiked
      if (typeof guide.userHasLiked === 'boolean') return
      try {
        const fresh = await api.getGuide(guide.id)
        if (cancelled) return
        setGuide((prev) => prev ? ({ ...prev, userHasLiked: fresh.userHasLiked, likeCount: fresh.likeCount }) : null)
      } catch {
        // ignore silently
      }
    }

    ensureLikeStatus()

    return () => {
      cancelled = true
    }
  }, [user?.id, guide?.id, guide?.userHasLiked])

  // Role badge computation
  const roleBadge = useMemo(() => {
    if (!guide?.author?.role) return null
    switch (guide.author.role) {
      case 'admin':
        return { label: 'Admin', color: theme.other?.usogui?.red ?? '#e11d48' }
      case 'moderator':
        return { label: 'Moderator', color: theme.other?.usogui?.warning ?? '#facc15' }
      default:
        return null
    }
  }, [guide?.author?.role, theme.other?.usogui])

  // Fetch guide with authentication when guideId is provided but no initialGuide
  // FIX: Added AbortController for proper cleanup and race condition prevention
  useEffect(() => {
    if (!initialGuide && guideId && !authLoading) {
      // Create AbortController for this effect instance
      const abortController = new AbortController()
      let isCancelled = false

      setLoading(true)
      setError(null)

      const fetchGuide = async () => {
        try {
          let fetchedGuide: Guide

          // Capture user at the start to avoid closure issues
          const currentUser = user

          if (currentUser) {
            // User is authenticated, try authenticated endpoint first
            try {
              fetchedGuide = await api.getGuideAuthenticated(guideId)
            } catch (authError: unknown) {
              // Check if request was cancelled
              if (isCancelled) return

              const err = authError as { status?: number }
              // If authenticated request fails with 401/403, try public endpoint
              if (err?.status === 401 || err?.status === 403) {
                fetchedGuide = await api.getGuide(guideId)
              } else {
                throw authError
              }
            }
          } else {
            // User not authenticated, use public endpoint
            fetchedGuide = await api.getGuide(guideId)
          }

          // Check if cancelled before updating state
          if (isCancelled) return

          // Check if user can view this guide
          if (fetchedGuide.status !== GuideStatus.APPROVED) {
            // Only allow authors to see their own non-approved guides
            if (!currentUser || currentUser.id !== fetchedGuide.author.id) {
              setError('This guide is not available to the public.')
              return
            }
          }

          setGuide(fetchedGuide)
          setEditedContent(fetchedGuide.content)
        } catch (err: unknown) {
          // Don't update state if cancelled
          if (isCancelled) return

          const error = err as { status?: number; isAuthError?: boolean; name?: string }
          // Ignore abort errors
          if (error?.name === 'AbortError') return

          if (error?.status === 404) {
            setError('Guide not found.')
          } else if (error?.isAuthError) {
            setError('Please log in to access this content.')
          } else {
            setError('Failed to load guide.')
          }
        } finally {
          if (!isCancelled) {
            setLoading(false)
          }
        }
      }

      fetchGuide()

      // Cleanup function: cancel any in-flight requests
      return () => {
        isCancelled = true
        abortController.abort()
      }
    }
  }, [guideId, initialGuide, user, authLoading])

  // Reusable loading skeleton component
  const LoadingSkeleton = () => (
    <Box style={{ backgroundColor: backgroundStyles.page(theme), minHeight: '100vh' }}>
      <Container size="lg" py="xl">
        <Stack gap="md">
          {/* Breadcrumb skeleton */}
          <Skeleton height={36} width={160} radius="md" />

          {/* Header card skeleton - responsive layout */}
          <Card withBorder radius="lg" shadow="lg" p="lg">
            <Stack gap="md">
              {/* Title skeleton - always visible */}
              <Skeleton height={32} width="80%" radius="sm" />
              <Skeleton height={24} width="60%" radius="sm" />

              {/* Description skeleton */}
              <Skeleton height={20} width="100%" radius="sm" />
              <Skeleton height={20} width="90%" radius="sm" />

              {/* Author skeleton */}
              <Group gap="md" mt="md">
                <Skeleton height={40} width={40} radius="xl" />
                <Stack gap={4}>
                  <Skeleton height={16} width={120} radius="sm" />
                  <Skeleton height={14} width={80} radius="sm" />
                </Stack>
              </Group>

              {/* Stats badges skeleton */}
              <Group gap="sm" mt="md" wrap="wrap">
                <Skeleton height={28} width={100} radius="xl" />
                <Skeleton height={28} width={80} radius="xl" />
                <Skeleton height={28} width={90} radius="xl" />
              </Group>
            </Stack>
          </Card>

          {/* Content card skeleton */}
          <Card withBorder radius="lg" shadow="lg" p="lg">
            <Stack gap="md">
              <Skeleton height={40} width={200} radius="md" />
              <Skeleton height={20} width="100%" radius="sm" />
              <Skeleton height={20} width="95%" radius="sm" />
              <Skeleton height={20} width="100%" radius="sm" />
              <Skeleton height={20} width="85%" radius="sm" />
              <Skeleton height={20} width="90%" radius="sm" />
              <Skeleton height={20} width="100%" radius="sm" />
              <Skeleton height={20} width="70%" radius="sm" />
            </Stack>
          </Card>
        </Stack>
      </Container>
    </Box>
  )

  // Show loading state with skeleton
  if (authLoading || loading) {
    return <LoadingSkeleton />
  }

  // Show error state
  if (error) {
    return (
      <Box style={{ backgroundColor: backgroundStyles.page(theme), minHeight: '100vh' }}>
        <Container size="lg" py="xl">
          <Stack gap="md">
            <BreadcrumbNav
              items={[{ label: 'Guides', href: '/guides' }, { label: 'Error' }]}
              entityType="guide"
            />
            <Card withBorder radius="md" className="gambling-card" shadow="md">
              <Stack gap="md" p="xl">
                <Text c={textColors.warning}>{error}</Text>
              </Stack>
            </Card>
          </Stack>
        </Container>
      </Box>
    )
  }

  // Show loading state if guide is still null
  if (!guide) {
    return <LoadingSkeleton />
  }


  // Only the guide owner or admins can edit. Moderators cannot edit guides.
  const canEdit = user?.id === guide.author.id || user?.role === 'admin'

  const handleLikeToggle = async () => {
    if (!user) {
      notifications.show({
        title: 'Login Required',
        message: 'Please log in to like guides',
        color: 'yellow',
        autoClose: 3000
      })
      return
    }

    try {
      const response = await api.toggleGuideLike(guide.id)
      setGuide((prev) => prev ? ({
        ...prev,
        likeCount: response.likeCount,
        userHasLiked: response.liked
      }) : null)
    } catch {
      notifications.show({ message: 'Failed to toggle like.', color: 'red' })
    }
  }

  const handleSave = async () => {
    if (!canEdit) return
    setSaving(true)
    try {
      const updatedGuide = await api.updateGuide(guide.id, {
        content: editedContent.replace(/\r\n/g, '\n'),
        description: guide.description,
        title: guide.title
      })
      setGuide(updatedGuide)
      notifications.show({ message: 'Guide updated successfully.', color: 'green' })
    } catch (error: unknown) {
      notifications.show({ message: error instanceof Error ? error.message : 'Failed to save guide.', color: 'red' })
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setEditedContent(guide.content)
  }

  // Show pending status banner for authors
  const showPendingBanner = guide.status !== GuideStatus.APPROVED && user?.id === guide.author.id

  // Check if there are related entities
  const hasRelatedEntities = guide.arc || (guide.gambles && guide.gambles.length > 0) || (guide.characters && guide.characters.length > 0)

  return (
    <Box style={{
      backgroundColor: backgroundStyles.page(theme),
      minHeight: '100vh',
      color: textColors.primary
    }}>
      <Container size="lg" py="md" style={{ backgroundColor: backgroundStyles.container(theme) }}>
        <Stack gap={theme.spacing.md}>
          {/* Breadcrumb and Like Button Row */}
          <Group justify="space-between" align="center" wrap="wrap">
            <BreadcrumbNav
              items={createEntityBreadcrumbs('guide', guide.title)}
              entityType="guide"
            />
            <Button
              variant={guide.userHasLiked ? 'filled' : 'outline'}
              c={guide.userHasLiked ? textColors.primary : entityColors.gamble}
              leftSection={<Heart size={16} fill={guide.userHasLiked ? 'currentColor' : 'none'} />}
              onClick={handleLikeToggle}
              radius="xl"
              style={{
                border: `2px solid ${entityColors.gamble}`,
                backgroundColor: guide.userHasLiked ? entityColors.gamble : 'transparent'
              }}
            >
              {guide.likeCount} Like{guide.likeCount !== 1 ? 's' : ''}
            </Button>
          </Group>

          {/* Pending status banner */}
          {showPendingBanner && (
            <Card withBorder radius="md" shadow="md" style={{ borderColor: textColors.warning, backgroundColor: getAlphaColor(textColors.warning, 0.1) }}>
              <Stack gap="sm" p="md">
                <Text size="sm" c={textColors.warning} fw={500}>
                  📝 This is your {guide.status} guide. It's only visible to you until it gets approved by moderators.
                </Text>
              </Stack>
            </Card>
          )}

          {/* Enhanced Guide Header */}
          <Card
            withBorder
            radius="lg"
            shadow="lg"
            p={0}
            style={{
              ...getCardStyles(theme, entityColors.guide),
              border: `2px solid ${entityColors.guide}`,
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Subtle Pattern Overlay */}
            <Box
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundImage: `
                  radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0),
                  radial-gradient(circle at 20px 20px, rgba(255,255,255,0.03) 1px, transparent 0)
                `,
                backgroundSize: '40px 40px, 80px 80px',
                backgroundPosition: '0 0, 20px 20px',
                pointerEvents: 'none'
              }}
            />

            {/* Content */}
            <Box p={theme.spacing.lg} style={{ position: 'relative', zIndex: 1 }}>
              <Stack gap={theme.spacing.md}>
                {/* Header with title - thumbnail shown inline when available */}
                <Stack gap={theme.spacing.md}>
                  {/* Title and description */}
                  <Stack gap={theme.spacing.sm}>
                    <Title
                      order={1}
                      size="2rem"
                      fw={800}
                      c={headerColors.h1}
                      style={{
                        lineHeight: 1.2,
                        textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
                        letterSpacing: '-0.02em',
                        wordBreak: 'break-word'
                      }}
                    >
                      {guide.title}
                    </Title>

                    {guide.description && (
                      <Text size="md" c={textColors.secondary} style={{ lineHeight: 1.5 }}>
                        {guide.description}
                      </Text>
                    )}
                  </Stack>

                  {/* Thumbnail - only takes space when media exists */}
                  <MediaThumbnail
                    entityType="guide"
                    entityId={guide.id}
                    entityName={guide.title}
                    allowCycling
                    maxWidth="200px"
                    maxHeight="280px"
                    hideIfEmpty
                  />
                </Stack>

                {/* Author Info */}
                <Group gap={theme.spacing.md} align="center">
                  <AuthorProfileImage author={guide.author} size={40} showFallback />
                  <Stack gap={2}>
                    <Text
                      size="md"
                      c={textColors.secondary}
                      component={Link}
                      href={`/users/${guide.author.id}`}
                      style={{ textDecoration: 'none', fontWeight: 600 }}
                    >
                      {guide.author.username}
                    </Text>
                    <Group gap="xs">
                      {guide.author.customRole && (
                        <Badge
                          c={entityColors.media}
                          variant="outline"
                          radius="sm"
                          size="xs"
                          style={{ borderColor: entityColors.media }}
                        >
                          {guide.author.customRole}
                        </Badge>
                      )}
                      <UserRoleDisplay
                        userRole={(guide.author.role === 'admin' || guide.author.role === 'moderator') ? guide.author.role : 'user'}
                        customRole={guide.author.customRole}
                        size="small"
                      />
                    </Group>
                  </Stack>
                </Group>

                {/* Stats Badges */}
                <Group gap={theme.spacing.sm} wrap="wrap">
                  <Badge
                    size="lg"
                    variant="light"
                    c={textColors.guide}
                    leftSection={<Calendar size={14} />}
                    style={{
                      fontSize: fontSize.xs,
                      fontWeight: 600,
                      background: getAlphaColor(entityColors.guide, 0.2),
                      border: `1px solid ${getAlphaColor(entityColors.guide, 0.4)}`
                    }}
                  >
                    {new Date(guide.createdAt).toLocaleDateString()}
                  </Badge>
                  <Badge
                    size="lg"
                    variant="light"
                    c={textColors.character}
                    leftSection={<Eye size={14} />}
                    style={{
                      fontSize: fontSize.xs,
                      fontWeight: 600,
                      background: getAlphaColor(entityColors.character, 0.2),
                      border: `1px solid ${getAlphaColor(entityColors.character, 0.4)}`
                    }}
                  >
                    {guide.viewCount} view{guide.viewCount !== 1 ? 's' : ''}
                  </Badge>
                  <Badge
                    size="lg"
                    variant="light"
                    c={textColors.gamble}
                    leftSection={<Heart size={14} />}
                    style={{
                      fontSize: fontSize.xs,
                      fontWeight: 600,
                      background: getAlphaColor(entityColors.gamble, 0.2),
                      border: `1px solid ${getAlphaColor(entityColors.gamble, 0.4)}`
                    }}
                  >
                    {guide.likeCount} like{guide.likeCount !== 1 ? 's' : ''}
                  </Badge>
                </Group>

                {/* Related Entities - Consolidated */}
                {hasRelatedEntities && (
                  <Group gap={theme.spacing.sm} wrap="wrap">
                    {guide.arc && (
                      <Badge
                        component={Link}
                        href={`/arcs/${guide.arc.id}`}
                        radius="lg"
                        variant="light"
                        size="lg"
                        c={textColors.arc}
                        leftSection={<BookOpen size={14} />}
                        style={{
                          textDecoration: 'none',
                          cursor: 'pointer',
                          background: getAlphaColor(entityColors.arc, 0.2),
                          border: `1px solid ${getAlphaColor(entityColors.arc, 0.4)}`
                        }}
                      >
                        {guide.arc.name}
                      </Badge>
                    )}
                    {guide.gambles && guide.gambles.map((gamble) => (
                      <Badge
                        key={gamble.id}
                        component={Link}
                        href={`/gambles/${gamble.id}`}
                        radius="lg"
                        variant="light"
                        size="lg"
                        c={textColors.gamble}
                        leftSection={<Dice6 size={14} />}
                        style={{
                          textDecoration: 'none',
                          cursor: 'pointer',
                          background: getAlphaColor(entityColors.gamble, 0.2),
                          border: `1px solid ${getAlphaColor(entityColors.gamble, 0.4)}`
                        }}
                      >
                        {gamble.name}
                      </Badge>
                    ))}
                    {guide.characters && guide.characters.map((character) => (
                      <Badge
                        key={character.id}
                        component={Link}
                        href={`/characters/${character.id}`}
                        radius="lg"
                        variant="light"
                        size="lg"
                        c={textColors.character}
                        leftSection={<Users size={14} />}
                        style={{
                          textDecoration: 'none',
                          cursor: 'pointer',
                          background: getAlphaColor(entityColors.character, 0.2),
                          border: `1px solid ${getAlphaColor(entityColors.character, 0.4)}`
                        }}
                      >
                        {character.name}
                      </Badge>
                    ))}
                  </Group>
                )}

                {/* Tags */}
                {guide.tags.length > 0 && (
                  <Group gap="xs" wrap="wrap">
                    {guide.tags.map((tag) => (
                      <Badge
                        key={tag.id}
                        variant="outline"
                        radius="sm"
                        c={entityColors.organization}
                        leftSection={<Tag size={12} />}
                        style={{ borderColor: entityColors.organization }}
                      >
                        {tag.name}
                      </Badge>
                    ))}
                  </Group>
                )}
              </Stack>
            </Box>
          </Card>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card withBorder radius="lg" className="gambling-card" shadow="xl" style={getCardStyles(theme)}>
              <Tabs
                value={activeTab}
                onChange={(value) => value && setActiveTab(value)}
                keepMounted={false}
                variant="pills"
                className="guide-tabs"
              >
                <Tabs.List>
                  <Tabs.Tab value="content" leftSection={<FileText size={16} />}>Guide Content</Tabs.Tab>
                  {canEdit && (
                    <Tabs.Tab value="edit" leftSection={<Edit size={16} />}>Edit Guide</Tabs.Tab>
                  )}
                </Tabs.List>

                <Tabs.Panel value="content" pt={theme.spacing.md}>
                  <Card withBorder radius="lg" shadow="lg" style={getCardStyles(theme, entityColors.guide)}>
                    <Stack gap={theme.spacing.md} p={theme.spacing.lg}>
                      <TimelineSpoilerWrapper chapterNumber={undefined}>
                        <EnhancedSpoilerMarkdown
                          content={guide.content}
                          enableEntityEmbeds
                          compactEntityCards={false}
                          className="guide-content"
                        />
                      </TimelineSpoilerWrapper>
                    </Stack>
                  </Card>
                </Tabs.Panel>

                {canEdit && (
                  <Tabs.Panel value="edit" pt={theme.spacing.md}>
                    <Card withBorder radius="lg" shadow="lg" style={getCardStyles(theme, entityColors.guide)}>
                      <Stack gap={theme.spacing.md} p={theme.spacing.lg}>
                        <EntityEmbedHelperWithSearch onInsertEmbed={(embed) => {
                          const textarea = textareaRef.current
                          if (!textarea) {
                            setEditedContent((prev) => prev + embed)
                            return
                          }

                          const start = textarea.selectionStart ?? editedContent.length
                          const end = textarea.selectionEnd ?? start
                          const newContent = editedContent.slice(0, start) + embed + editedContent.slice(end)
                          setEditedContent(newContent)

                          requestAnimationFrame(() => {
                            textarea.focus()
                            const pos = start + embed.length
                            try {
                              textarea.setSelectionRange(pos, pos)
                            } catch {
                              // ignore
                            }
                          })
                        }} />

                        <Textarea
                          ref={textareaRef}
                          value={editedContent}
                          onChange={(event) => setEditedContent(event.currentTarget.value)}
                          autosize
                          minRows={15}
                          placeholder="Update guide content..."
                          styles={{
                            input: {
                              backgroundColor: theme.colors.dark?.[5] ?? '#0b0b0b',
                              color: theme.colors.gray?.[0] ?? '#fff',
                              borderColor: 'rgba(255,255,255,0.06)',
                              fontFamily: 'monospace',
                              fontSize: fontSize.sm,
                              lineHeight: 1.6,
                              '&:focus': {
                                borderColor: entityColors.guide,
                                boxShadow: `0 0 0 2px ${getAlphaColor(entityColors.guide, 0.2)}`
                              }
                            }
                          }}
                        />
                        <Group gap={theme.spacing.sm}>
                          <Button
                            variant="outline"
                            c={textColors.secondary}
                            onClick={handleCancel}
                            leftSection={<X size={16} />}
                            radius="xl"
                          >
                            Reset
                          </Button>
                          <Button
                            onClick={handleSave}
                            loading={saving}
                            leftSection={!saving ? <Save size={16} /> : undefined}
                            radius="xl"
                            style={{
                              background: `linear-gradient(135deg, ${entityColors.guide} 0%, ${entityColors.guide}dd 100%)`,
                              border: `1px solid ${entityColors.guide}`
                            }}
                          >
                            Save Guide
                          </Button>
                        </Group>
                      </Stack>
                    </Card>
                  </Tabs.Panel>
                )}
              </Tabs>
            </Card>
          </motion.div>
        </Stack>
      </Container>
    </Box>
  )
}
