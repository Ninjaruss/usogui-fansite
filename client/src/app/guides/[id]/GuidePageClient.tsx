'use client'

import React, { useMemo, useRef, useState, useEffect } from 'react'
import {
  Badge,
  Box,
  Button,
  Card,
  Container,
  Group,
  Stack,
  Tabs,
  Text,
  Textarea,
  Title,
  useMantineTheme
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { getEntityThemeColor, semanticColors, textColors, backgroundStyles } from '../../../lib/mantine-theme'
import { ArrowLeft, FileText, Calendar, Heart, Edit, Save, X, Users, BookOpen, Dice6 } from 'lucide-react'
import Link from 'next/link'
import { api } from '../../../lib/api'
import { useAuth } from '../../../providers/AuthProvider'
import EnhancedSpoilerMarkdown from '../../../components/EnhancedSpoilerMarkdown'
// GambleChip removed — using simple Badge chips inline for gambles
import EntityEmbedHelperWithSearch from '../../../components/EntityEmbedHelperWithSearch'
import TimelineSpoilerWrapper from '../../../components/TimelineSpoilerWrapper'
import { motion } from 'motion/react'
import { GuideStatus } from '../../../types'
import AuthorProfileImage from '../../../components/AuthorProfileImage'
import { UserRoleDisplay } from '../../../components/BadgeDisplay'
import { usePageView } from '../../../hooks/usePageView'

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
    profilePictureType?: 'discord' | 'character_media' | null
    selectedCharacterMediaId?: number | null
    selectedCharacterMedia?: {
      id: number
      url: string
      fileName?: string
      description?: string
    } | null
    discordId?: string | null
    discordAvatar?: string | null
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
  const [isEditing, setIsEditing] = useState(false)
  const [editedContent, setEditedContent] = useState(initialGuide?.content || '')
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<string>('content')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Tab styling handled by Mantine theme
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  // Call usePageView hook early to maintain hook order (Rules of Hooks)
  usePageView('guide', guide?.id?.toString() || '', !!guide?.id)

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
      } catch (e) {
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
  useEffect(() => {
    if (!initialGuide && guideId && !authLoading) {
      setLoading(true)
      setError(null)
      
      const fetchGuide = async () => {
        try {
          let fetchedGuide: Guide
          
          if (user) {
            // User is authenticated, try authenticated endpoint first
            try {
              fetchedGuide = await api.getGuideAuthenticated(guideId)
            } catch (authError: any) {
              // If authenticated request fails with 401/403, try public endpoint
              if (authError?.status === 401 || authError?.status === 403) {
                console.log('[GuidePageClient] Authenticated request failed, trying public endpoint')
                fetchedGuide = await api.getGuide(guideId)
              } else {
                throw authError
              }
            }
          } else {
            // User not authenticated, use public endpoint
            fetchedGuide = await api.getGuide(guideId)
          }
          
          // Check if user can view this guide
          if (fetchedGuide.status !== GuideStatus.APPROVED) {
            // Only allow authors to see their own non-approved guides
            if (!user || user.id !== fetchedGuide.author.id) {
              setError('This guide is not available to the public.')
              return
            }
          }
          
          setGuide(fetchedGuide)
          setEditedContent(fetchedGuide.content)
        } catch (err: any) {
          console.error('[GuidePageClient] Failed to fetch guide:', err)
          if (err?.status === 404) {
            setError('Guide not found.')
          } else if (err?.isAuthError) {
            setError('Please log in to access this content.')
          } else {
            setError('Failed to load guide.')
          }
        } finally {
          setLoading(false)
        }
      }
      
      fetchGuide()
    }
  }, [guideId, initialGuide, user, authLoading])

  // Show loading state
  if (authLoading || loading) {
    return (
      <Box style={{ backgroundColor: backgroundStyles.page(theme), minHeight: '100vh' }}>
        <Container size="lg" py="xl">
          <Text>Loading guide...</Text>
        </Container>
      </Box>
    )
  }

  // Show error state
  if (error) {
    return (
      <Box style={{ backgroundColor: backgroundStyles.page(theme), minHeight: '100vh' }}>
        <Container size="lg" py="xl">
          <Stack gap="md">
            <Button component={Link} href="/guides" variant="subtle" c={semanticColors.neutral} leftSection={<ArrowLeft size={18} />}>
              Back to Guides
            </Button>
            <Card withBorder radius="md" className="gambling-card" shadow="md">
              <Stack gap="md" p="xl">
                <Text c={semanticColors.warning}>{error}</Text>
              </Stack>
            </Card>
          </Stack>
        </Container>
      </Box>
    )
  }

  // Show loading state if guide is still null
  if (!guide) {
    return (
      <Box style={{ backgroundColor: backgroundStyles.page(theme), minHeight: '100vh' }}>
        <Container size="lg" py="xl">
          <Text>Loading guide...</Text>
        </Container>
      </Box>
    )
  }


  // Only the guide owner or admins can edit. Moderators cannot edit guides.
  const canEdit = user?.id === guide.author.id || user?.role === 'admin'

  // Remove publish/unpublish button from the guide detail page UI. Publish actions are handled elsewhere.
  const canPublish = false


  const handleLikeToggle = async () => {
    try {
      const response = await api.toggleGuideLike(guide.id)
      setGuide((prev) => prev ? ({
        ...prev,
        likeCount: response.likeCount,
        userHasLiked: response.liked
      }) : null)
    } catch (error) {
      notifications.show({ message: 'Failed to toggle like.', color: 'red' })
    }
  }

  // Publish/unpublish is not available in this client view; server/admin UI handles it.

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
      setIsEditing(false)
      notifications.show({ message: 'Guide updated successfully.', color: 'green' })
    } catch (error: unknown) {
      notifications.show({ message: error instanceof Error ? error.message : 'Failed to save guide.', color: 'red' })
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditedContent(guide.content)
  }

  // Show pending status banner for authors
  const showPendingBanner = guide.status !== GuideStatus.APPROVED && user?.id === guide.author.id

  return (
    <Box style={{ backgroundColor: backgroundStyles.page(theme), minHeight: '100vh' }}>
    <Container size="lg" py="xl">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Group justify="space-between" align="flex-start" mb="lg">
          <Button component={Link} href="/guides" variant="subtle" c={semanticColors.neutral} leftSection={<ArrowLeft size={18} />}>
            Back to Guides
          </Button>
          <Group gap="sm">
            {/* publish/unpublish removed from UI per requirements */}
            <Button
              variant={guide.userHasLiked ? 'filled' : 'outline'}
              style={{ color: getEntityThemeColor(theme, 'gamble') }}
              leftSection={<Heart size={16} />}
              onClick={handleLikeToggle}
            >
              {guide.likeCount} Like{guide.likeCount !== 1 ? 's' : ''}
            </Button>
          </Group>
        </Group>

        {/* Pending status banner */}
        {showPendingBanner && (
          <Card withBorder radius="md" className="gambling-card" shadow="md" mb="lg" style={{ borderColor: semanticColors.warning }}>
            <Stack gap="sm" p="md">
              <Text size="sm" c={semanticColors.warning} fw={500}>
                📝 This is your {guide.status} guide. It's only visible to you until it gets approved by moderators.
              </Text>
            </Stack>
          </Card>
        )}

        <Card withBorder radius="md" className="gambling-card" shadow="md" mb="xl">
          <Stack gap="xl" p="xl">
            <Stack gap="sm">
              <Title order={1} mb="xs">{guide.title}</Title>
              <Group gap="lg" align="center" mb="sm">
                <AuthorProfileImage author={guide.author} size={40} showFallback />
                <Text size="lg" c="dimmed" component={Link} href={`/users/${guide.author.id}`} style={{ textDecoration: 'none', fontWeight: 500 }}>
                  By {guide.author.username}
                </Text>
                  {guide.author.customRole && (
                    <Badge
                      c={getEntityThemeColor(theme, 'media')}
                      variant="outline"
                      radius="sm"
                      style={{ borderColor: getEntityThemeColor(theme, 'media') }}
                    >
                      {guide.author.customRole}
                    </Badge>
                  )}
                  {roleBadge && (
                    <Badge
                      c={roleBadge.color}
                      variant="light"
                      radius="sm"
                      style={{ backgroundColor: `${roleBadge.color}20`, borderColor: roleBadge.color }}
                    >
                      {roleBadge.label}
                    </Badge>
                  )}
                  {/* adapt author.role to the UserRoleDisplay props */}
                  <UserRoleDisplay
                    userRole={(guide.author.role === 'admin' || guide.author.role === 'moderator') ? guide.author.role : 'user'}
                    customRole={guide.author.customRole}
                    size="small"
                  />
                </Group>

                <Group gap="md" align="center" mt="md">
                  <Badge
                    c={getEntityThemeColor(theme, 'gamble')}
                    radius="sm"
                    variant="light"
                    leftSection={<Calendar size={14} />}
                    style={{ backgroundColor: `${getEntityThemeColor(theme, 'gamble')}20`, borderColor: getEntityThemeColor(theme, 'gamble') }}
                  >
                    Published {new Date(guide.createdAt).toLocaleDateString()}
                  </Badge>
                  <Badge
                    c={getEntityThemeColor(theme, 'character')}
                    radius="sm"
                    variant="light"
                    style={{ backgroundColor: `${getEntityThemeColor(theme, 'character')}20`, borderColor: getEntityThemeColor(theme, 'character') }}
                  >
                    {guide.viewCount} view{guide.viewCount !== 1 ? 's' : ''}
                  </Badge>
                  <Badge
                    c={getEntityThemeColor(theme, 'media')}
                    radius="sm"
                    variant="light"
                    style={{ backgroundColor: `${getEntityThemeColor(theme, 'media')}20`, borderColor: getEntityThemeColor(theme, 'media') }}
                  >
                    {guide.likeCount} like{guide.likeCount !== 1 ? 's' : ''}
                  </Badge>
                </Group>

                {guide.description && (
                  <Text size="sm" c="dimmed" mt="lg" mb="md">
                    {guide.description}
                  </Text>
                )}

                {/* Related chips: arc, gambles, characters (moved into header) - placed above tags */}
                <Group style={{ flexWrap: 'wrap', gap: 12 }} mt="lg">
                  {guide.arc && (
                    <Link href={`/arcs/${guide.arc.id}`} style={{ textDecoration: 'none', display: 'inline-block' }}>
                      <Badge
                        radius="lg"
                        variant="outline"
                        size="sm"
                        c={getEntityThemeColor(theme, 'arc')}
                        style={{ borderColor: getEntityThemeColor(theme, 'arc') }}
                      >
                        {guide.arc.name}
                      </Badge>
                    </Link>
                  )}

                  {guide.gambles && guide.gambles.length > 0 && guide.gambles.map((gamble) => (
                    <Link key={gamble.id} href={`/gambles/${gamble.id}`} style={{ textDecoration: 'none', display: 'inline-block' }}>
                      <Badge
                        radius="lg"
                        variant="outline"
                        size="sm"
                        c={getEntityThemeColor(theme, 'gamble')}
                        style={{ borderColor: getEntityThemeColor(theme, 'gamble'), fontWeight: 700 }}
                      >
                        {gamble.name}
                      </Badge>
                    </Link>
                  ))}

                  {guide.characters && guide.characters.length > 0 && guide.characters.map((character) => (
                    <Link key={character.id} href={`/characters/${character.id}`} style={{ textDecoration: 'none', display: 'inline-block' }}>
                      <Badge
                        radius="lg"
                        variant="outline"
                        size="sm"
                        c={getEntityThemeColor(theme, 'character')}
                        style={{ borderColor: getEntityThemeColor(theme, 'character') }}
                      >
                        {character.name}
                      </Badge>
                    </Link>
                  ))}
                </Group>

                <Group gap="xs" style={{ flexWrap: 'wrap' }}>
                  {guide.tags.map((tag) => (
                    <Badge
                      key={tag.id}
                      variant="outline"
                      radius="sm"
                      c={getEntityThemeColor(theme, 'organization')}
                      style={{ borderColor: getEntityThemeColor(theme, 'organization') }}
                    >
                      {tag.name}
                    </Badge>
                  ))}
                </Group>
              </Stack>
          </Stack>
        </Card>

        <Card withBorder radius="md" className="gambling-card" shadow="md">
          <Tabs value={activeTab} onChange={(v) => setActiveTab(v ?? 'content')} keepMounted={false}>
            <Tabs.List>
              <Tabs.Tab value="content" leftSection={<FileText size={16} />}>Guide Content</Tabs.Tab>
              {canEdit && (
                <Tabs.Tab value="edit" leftSection={<Edit size={16} />}>Edit Guide</Tabs.Tab>
              )}
            </Tabs.List>

            <Tabs.Panel value="content" pt="md">
              <TimelineSpoilerWrapper chapterNumber={undefined}>
                <EnhancedSpoilerMarkdown
                  content={guide.content}
                  enableEntityEmbeds
                  compactEntityCards={false}
                  className="guide-content"
                />
              </TimelineSpoilerWrapper>

              {/* Related items shown as chips below the content */}
              <Stack gap="sm" mt="md">
                {/* related chips moved to header */}
              </Stack>
            </Tabs.Panel>

            {canEdit && (
              <Tabs.Panel value="edit" pt="md">
                <Card withBorder radius="md" shadow="sm">
                  <Stack gap="md" p="lg">
                    {/* Provide an insertion handler so embeds are inserted at the current cursor position */}
                    <EntityEmbedHelperWithSearch onInsertEmbed={(embed) => {
                      const textarea = textareaRef.current
                      if (!textarea) {
                        // fallback: append to content
                        setEditedContent((prev) => prev + embed)
                        return
                      }

                      const start = textarea.selectionStart ?? editedContent.length
                      const end = textarea.selectionEnd ?? start
                      const newContent = editedContent.slice(0, start) + embed + editedContent.slice(end)
                      setEditedContent(newContent)

                      // restore focus and place cursor after the inserted embed
                      requestAnimationFrame(() => {
                        textarea.focus()
                        const pos = start + embed.length
                        try {
                          textarea.setSelectionRange(pos, pos)
                        } catch (e) {
                          // ignore
                        }
                      })
                    }} />

                    <Textarea
                      ref={textareaRef}
                      value={editedContent}
                      onChange={(event) => setEditedContent(event.currentTarget.value)}
                      autosize
                      minRows={10}
                      placeholder="Update guide content"
                    />
                    <Group gap="sm">
                      <Button variant="outline" c={semanticColors.neutral} onClick={handleCancel} leftSection={<X size={16} />}>
                        Cancel
                      </Button>
                      <Button style={{ color: getEntityThemeColor(theme, 'gamble') }} onClick={handleSave} loading={saving} leftSection={!saving ? <Save size={16} /> : undefined}>
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
    </Container>
    </Box>
  )
}
