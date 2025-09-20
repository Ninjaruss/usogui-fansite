'use client'

import React, { useEffect, useState } from 'react'
import {
  Alert,
  Badge,
  Box,
  Button,
  Card,
  Center,
  Grid,
  Group,
  Loader,
  Pagination,
  Stack,
  Text,
  TextInput,
  Title,
  rem,
  useMantineTheme
} from '@mantine/core'
import { Search, FileText, Eye, Calendar, ThumbsUp, Heart, X, Users, BookOpen, Dice6 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'motion/react'
import { api } from '../../lib/api'
import { useAuth } from '../../providers/AuthProvider'
import AuthorProfileImage from '../../components/AuthorProfileImage'
import { UserRoleDisplay } from '../../components/BadgeDisplay'

type GuideEntity = {
  id: number
  name: string
}

interface Guide {
  id: number
  title: string
  content: string
  description: string
  tags: GuideEntity[]
  author: {
    id: number
    username: string
    role?: string
    customRole?: string
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
  characters?: GuideEntity[]
  arc?: GuideEntity
  gambles?: GuideEntity[]
  likeCount: number
  userHasLiked?: boolean
  viewCount: number
  createdAt: string
  updatedAt: string
}

interface GuidesPageContentProps {
  initialGuides: Guide[]
  initialTotalPages: number
  initialTotal: number
  initialPage: number
  initialSearch: string
  initialAuthorId?: string
  initialAuthorName?: string
  initialError: string
}

const sectionSpacing = rem(24)

export default function GuidesPageContent({
  initialGuides,
  initialTotalPages,
  initialTotal,
  initialPage,
  initialSearch,
  initialAuthorId,
  initialAuthorName,
  initialError
}: GuidesPageContentProps) {
  const { user } = useAuth()
  const theme = useMantineTheme()
  const router = useRouter()

  const [guides, setGuides] = useState<Guide[]>(initialGuides)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(initialError)
  const [searchQuery, setSearchQuery] = useState(initialSearch)
  const [currentPage, setCurrentPage] = useState(initialPage)
  const [totalPages, setTotalPages] = useState(initialTotalPages)
  const [total, setTotal] = useState(initialTotal)
  const [liking, setLiking] = useState<number | null>(null)
  const [authorFilter, setAuthorFilter] = useState<string | null>(initialAuthorId || null)
  const [authorName, setAuthorName] = useState<string | null>(initialAuthorName || null)

  const fetchGuides = async (page = 1, search = '', authorId?: string) => {
    setLoading(true)
    try {
      const params: { page: number; limit: number; title?: string; authorId?: string; status?: string } = {
        page,
        limit: 12,
        status: 'approved'
      }
      if (search) params.title = search
      if (authorId) params.authorId = authorId

      const response = await api.getGuides(params)
      setGuides(response.data)
      setTotalPages(response.totalPages)
      setTotal(response.total)
      setError('')
    } catch (fetchError: unknown) {
      setError(fetchError instanceof Error ? fetchError.message : 'Failed to fetch guides')
      setGuides([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (
      currentPage !== initialPage ||
      searchQuery !== initialSearch ||
      authorFilter !== initialAuthorId
    ) {
      fetchGuides(currentPage, searchQuery, authorFilter || undefined)
    }
  }, [currentPage, searchQuery, authorFilter, initialPage, initialSearch, initialAuthorId])

  const updateUrl = (page: number, search: string, authorId?: string, authorNameParam?: string) => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (authorId) params.set('author', authorId)
    if (authorNameParam) params.set('authorName', authorNameParam)
    if (page > 1) params.set('page', page.toString())

    const newUrl = params.toString() ? `/guides?${params.toString()}` : '/guides'
    router.push(newUrl, { scroll: false })
  }

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSearch = event.target.value
    setSearchQuery(newSearch)
    setCurrentPage(1)
  }

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      updateUrl(currentPage, searchQuery, authorFilter || undefined, authorName || undefined)
      fetchGuides(currentPage, searchQuery, authorFilter || undefined)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    updateUrl(page, searchQuery, authorFilter || undefined, authorName || undefined)
  }

  const clearAuthorFilter = () => {
    setAuthorFilter(null)
    setAuthorName(null)
    setCurrentPage(1)
    updateUrl(1, searchQuery)
  }

  const getContentPreview = (content: string, maxLength = 150) => {
    if (!content) return 'No content available'
    if (content.length <= maxLength) return content
    return content.slice(0, maxLength).replace(/\s+\S*$/, '') + '...'
  }

  const handleLikeToggle = async (guideId: number) => {
    if (!user || liking === guideId) return

    setLiking(guideId)
    try {
      const response = await api.toggleGuideLike(guideId)
      setGuides((previous) =>
        previous.map((guide) =>
          guide.id === guideId
            ? { ...guide, likeCount: response.likeCount, userHasLiked: response.liked }
            : guide
        )
      )
    } catch (toggleError: unknown) {
      console.error('Error toggling like:', toggleError)
    } finally {
      setLiking(null)
    }
  }

  const accentGuide = theme.other?.usogui?.guide ?? theme.colors.green?.[5] ?? '#4ade80'
  const accentRed = theme.other?.usogui?.red ?? theme.colors.red?.[6] ?? '#e11d48'

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <Stack gap="xl">
        <Stack gap="xs" align="center" mb={sectionSpacing}>
          <FileText size={48} color={accentGuide} />
          <Title order={2}>Community Guides</Title>
          <Text size="sm" c="dimmed">
            In-depth analysis and insights from the Usogui community
          </Text>
          <Button
            component={Link}
            href="/submit-guide"
            size="md"
            leftSection={<FileText size={16} />}
            radius="md"
            variant="gradient"
            gradient={{ from: accentGuide, to: accentRed }}
          >
            Write Guide
          </Button>
        </Stack>

        <Box maw={500} mx="auto" w="100%">
          <TextInput
            size="md"
            radius="md"
            placeholder="Search guides..."
            value={searchQuery}
            onChange={handleSearchChange}
            leftSection={<Search size={16} />}
          />
        </Box>

        {authorFilter && authorName && (
          <Group justify="center" gap="sm">
            <Badge size="md" color="red" variant="filled">
              Author: {authorName}
            </Badge>
            <Button
              variant="subtle"
              size="xs"
              color="red"
              leftSection={<X size={14} />}
              onClick={clearAuthorFilter}
            >
              Clear
            </Button>
          </Group>
        )}

        {error && (
          <Alert color="red" variant="light" radius="md">
            {error}
          </Alert>
        )}

        {loading ? (
          <Center py="xl">
            <Loader size="lg" />
          </Center>
        ) : (
          <Stack gap="xl">
            <Text size="sm" c="dimmed">
              {total} guide{total !== 1 ? 's' : ''} published
            </Text>

            <Grid gutter="xl">
              {guides.map((guide, index) => (
                <Grid.Col span={{ base: 12, md: 6 }} key={guide.id}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                  >
                    <Card withBorder radius="lg" shadow="sm" h="100%" padding="lg">
                      <Stack gap="md" h="100%">
                        <Stack gap={4}>
                          <Title order={4}>
                            <Link href={`/guides/${guide.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                              {guide.title}
                            </Link>
                          </Title>
                          <Group gap="sm" align="center">
                            <AuthorProfileImage author={guide.author} size={28} showFallback />
                            <Stack gap={2}>
                              <Text size="sm" c="dimmed" component={Link} href={`/users/${guide.author.id}`} style={{ textDecoration: 'none' }}>
                                by {guide.author.username}
                              </Text>
                              <UserRoleDisplay
                                userRole={(guide.author.role as 'admin' | 'moderator' | 'user') || 'user'}
                                customRole={guide.author.customRole}
                                size="small"
                              />
                            </Stack>
                            <Group gap={4} ml="auto" align="center" c="dimmed">
                              <Calendar size={14} />
                              <Text size="xs">
                                {new Date(guide.createdAt).toLocaleDateString()}
                              </Text>
                            </Group>
                          </Group>
                        </Stack>

                        <Text size="sm" c="dimmed">
                          {getContentPreview(guide.description || guide.content)}
                        </Text>

                        {(guide.characters?.length || guide.arc || guide.gambles?.length) && (
                          <Stack gap={6}>
                            {guide.characters && guide.characters.length > 0 && (
                              <Group gap={6} align="center">
                                <Users size={14} />
                                <Group gap={4} wrap="wrap">
                                  {guide.characters.slice(0, 2).map((character) => (
                                    <Badge key={character.id} size="sm" color="red" variant="light">
                                      {character.name}
                                    </Badge>
                                  ))}
                                  {guide.characters.length > 2 && (
                                    <Badge size="sm" color="gray" variant="light">
                                      +{guide.characters.length - 2}
                                    </Badge>
                                  )}
                                </Group>
                              </Group>
                            )}

                            {guide.arc && (
                              <Group gap={6} align="center">
                                <BookOpen size={14} />
                                <Badge size="sm" color="purple" variant="light">
                                  {guide.arc.name}
                                </Badge>
                              </Group>
                            )}

                            {guide.gambles && guide.gambles.length > 0 && (
                              <Group gap={6} align="center">
                                <Dice6 size={14} />
                                <Group gap={4} wrap="wrap">
                                  {guide.gambles.slice(0, 2).map((gamble) => (
                                    <Badge key={gamble.id} size="sm" color="red" variant="light">
                                      {gamble.name}
                                    </Badge>
                                  ))}
                                  {guide.gambles.length > 2 && (
                                    <Badge size="sm" color="gray" variant="light">
                                      +{guide.gambles.length - 2}
                                    </Badge>
                                  )}
                                </Group>
                              </Group>
                            )}
                          </Stack>
                        )}

                        {guide.tags?.length > 0 && (
                          <Group gap={6} wrap="wrap">
                            {guide.tags.slice(0, 4).map((tag) => (
                              <Badge key={tag.id} size="sm" color="gray" variant="outline">
                                #{tag.name}
                              </Badge>
                            ))}
                          </Group>
                        )}

                        <Group gap="sm" mt="auto" align="center" justify="space-between">
                          <Group gap={8} align="center">
                            <Heart size={16} color={guide.userHasLiked ? accentRed : undefined} />
                            <Text size="sm">{guide.likeCount}</Text>
                          </Group>
                          <Group gap={8} align="center">
                            <Eye size={16} />
                            <Text size="sm">{guide.viewCount}</Text>
                          </Group>
                          <Button
                            size="xs"
                            variant={guide.userHasLiked ? 'filled' : 'outline'}
                            color="red"
                            leftSection={<ThumbsUp size={14} />}
                            loading={liking === guide.id}
                            onClick={() => handleLikeToggle(guide.id)}
                          >
                            {guide.userHasLiked ? 'Liked' : 'Like'}
                          </Button>
                        </Group>
                      </Stack>
                    </Card>
                  </motion.div>
                </Grid.Col>
              ))}
            </Grid>

            {totalPages > 1 && (
              <Group justify="center">
                <Pagination total={totalPages} value={currentPage} onChange={handlePageChange} color="red" radius="md" />
              </Group>
            )}
          </Stack>
        )}
      </Stack>
    </motion.div>
  )
}
