'use client'

import React, { useEffect, useState } from 'react'
import {
  Alert,
  Anchor,
  Badge,
  Box,
  Button,
  Card,
  Container,
  Divider,
  Group,
  Loader,
  Progress,
  SimpleGrid,
  Stack,
  Text,
  Title,
  rem,
  useMantineTheme
} from '@mantine/core'
import { ArrowLeft, FileText, Quote, Dices, Calendar, BookOpen, Camera } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'motion/react'
import { api } from '../../../lib/api'
import { usePageView } from '../../../hooks/usePageView'
import UserProfileImage from '../../../components/UserProfileImage'
// GambleChip removed — using inline Badge chips for favorite gamble
import UserBadges from '../../../components/UserBadges'
import { UserRoleDisplay } from '../../../components/BadgeDisplay'

interface PublicUser {
  id: number
  username: string
  role: string
  customRole?: string | null
  userProgress: number
  profilePictureType?: 'discord' | 'character_media' | null
  selectedCharacterMediaId?: number | null
  selectedCharacterMedia?: {
    id: number
    url: string
    fileName?: string
    description?: string
    ownerType?: string
    ownerId?: number
    chapterNumber?: number
    character?: {
      id: number
      name: string
    }
  } | null
  discordId?: string | null
  discordAvatar?: string | null
  favoriteQuoteId?: number
  favoriteGambleId?: number
  profileImageId?: string
  createdAt: string
  guidesCount?: number
  totalViews?: number
  userStats?: {
    guidesWritten: number
    mediaSubmitted: number
    likesReceived: number
  }
  favoriteQuote?: any
  favoriteGamble?: any
}

interface UserGuide {
  id: number
  title: string
  description: string
  viewCount: number
  likeCount: number
  createdAt: string
}

interface UserProfileClientProps {
  initialUser: PublicUser
}

export default function UserProfileClient({ initialUser }: UserProfileClientProps) {
  const theme = useMantineTheme()

  const [user] = useState<PublicUser>(initialUser)
  const [guides, setGuides] = useState<UserGuide[]>([])
  const [favoriteQuote, setFavoriteQuote] = useState<any>(null)
  const [favoriteGamble, setFavoriteGamble] = useState<any>(null)
  const [userStats, setUserStats] = useState<{
    guidesWritten: number
    mediaSubmitted: number
    likesReceived: number
  } | null>(null)
  const [dataLoading, setDataLoading] = useState(true)

  usePageView('user', user.id.toString(), true)

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setDataLoading(true)

        if (user.userStats) {
          setUserStats(user.userStats)
        } else {
          try {
            const guidesResponse = await api.getGuides({ limit: 100, status: 'approved' })
            const userGuides = guidesResponse.data?.filter((guide) => guide.author?.id === user.id) || []
            setGuides(userGuides)
            setUserStats({
              guidesWritten: userGuides.length,
              mediaSubmitted: 0,
              likesReceived: userGuides.reduce((total, guide) => total + (guide.likeCount || 0), 0)
            })
          } catch (guidesError) {
            console.log('Could not fetch user guides:', guidesError)
            setUserStats({ guidesWritten: 0, mediaSubmitted: 0, likesReceived: 0 })
          }
        }

        try {
          const guidesResponse = await api.getGuides({ limit: 10, status: 'approved' })
          const userGuides = guidesResponse.data?.filter((guide) => guide.author?.id === user.id) || []
          setGuides(userGuides)
        } catch (guidesError) {
          console.log('Could not fetch user guides for display:', guidesError)
        }

        if (user.favoriteQuote) {
          setFavoriteQuote(user.favoriteQuote)
        }

        if (user.favoriteGamble) {
          setFavoriteGamble(user.favoriteGamble)
        }
      } catch (fetchError: unknown) {
        console.error('Error fetching additional user data:', fetchError)
      } finally {
        setDataLoading(false)
      }
    }

    fetchUserData()
  }, [user.id, user.userStats, user.favoriteQuote, user.favoriteGamble])

  const accentRed = theme.other?.usogui?.red ?? theme.colors.red[5]
  const accentPurple = theme.other?.usogui?.purple ?? theme.colors.purple[5]

  const stats = [
    {
      label: 'Guides Written',
      value: userStats ? userStats.guidesWritten : dataLoading ? '…' : '0',
      icon: <FileText size={22} color={accentRed} />,
      highlight: 'rgba(225, 29, 72, 0.08)'
    },
    {
      label: 'Media Submitted',
      value: userStats ? userStats.mediaSubmitted : dataLoading ? '…' : '0',
      icon: <Camera size={22} color={accentPurple} />,
      highlight: 'rgba(124, 58, 237, 0.08)'
    },
    {
      label: 'Likes Received',
      value: userStats ? userStats.likesReceived : dataLoading ? '…' : '0',
      icon: <BookOpen size={22} color={theme.colors.blue[5]} />,
      highlight: 'rgba(25, 118, 210, 0.08)'
    },
    {
      label: 'Joined',
      value: user.createdAt
        ? new Date(user.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          })
        : 'Unknown',
      icon: <Calendar size={22} color={theme.colors.green[5]} />,
      highlight: 'rgba(56, 142, 60, 0.08)'
    }
  ]

  const readingProgress = Math.min(Math.round((user.userProgress / 539) * 100), 100)

  return (
    <Container size="lg" py="xl">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Button
          component={Link}
          href="/users"
          variant="light"
          color="red"
          leftSection={<ArrowLeft size={16} />}
          mb="md"
        >
          Back to Users
        </Button>

        <Card
          className="gambling-card"
          withBorder
          radius="md"
          shadow="lg"
          p="xl"
          mb="xl"
          style={{
            background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.08) 0%, rgba(14, 116, 144, 0.05) 100%)'
          }}
        >
          <Stack gap="lg">
            <Group align="flex-start" gap="xl" wrap="wrap">
              <UserProfileImage user={user} size={120} showFallback className="user-profile-avatar-large" />

              <Stack gap="md" style={{ flex: 1, minWidth: rem(260) }}>
                <Group gap="sm" align="center" wrap="wrap">
                  <Title
                    order={2}
                    style={{
                      fontWeight: 700,
                      backgroundImage: `linear-gradient(135deg, ${theme.white} 0%, ${accentRed} 100%)`,
                      WebkitBackgroundClip: 'text',
                      color: 'transparent'
                    }}
                  >
                    {user.username}
                  </Title>
                  <UserRoleDisplay
                    userRole={user.role as 'admin' | 'moderator' | 'user'}
                    customRole={user.customRole}
                    size="medium"
                    spacing={1}
                  />
                </Group>

                <UserBadges userId={user.id} size="md" maxDisplay={6} />

                <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md">
                  {stats.map((stat) => (
                    <Card
                      key={stat.label}
                      shadow="sm"
                      radius="md"
                      padding="lg"
                      withBorder
                      style={{ backgroundColor: stat.highlight, borderColor: 'transparent' }}
                    >
                      <Group gap="sm" align="center">
                        {stat.icon}
                        <Stack gap={2} style={{ flex: 1 }}>
                          <Text size="sm" c="dimmed" fw={500}>
                            {stat.label}
                          </Text>
                          <Text size="lg" fw={600}>
                            {stat.value}
                          </Text>
                        </Stack>
                      </Group>
                    </Card>
                  ))}
                </SimpleGrid>

                <Card withBorder radius="md" padding="lg" shadow="sm">
                  <Group align="flex-start" gap="md">
                    <BookOpen size={24} color={theme.colors.green[5]} />
                    <Stack gap={4} style={{ flex: 1 }}>
                      <Text size="sm" c="dimmed" fw={500}>
                        Reading Progress
                      </Text>
                      <Text fw={600}>
                        Chapter {user.userProgress} of 539 ({readingProgress}%)
                      </Text>
                      <Progress value={readingProgress} color="red" radius="md" size="sm" />
                    </Stack>
                  </Group>
                </Card>

                {(favoriteQuote || favoriteGamble) && (
                  <Card withBorder radius="md" padding="lg" shadow="sm">
                    <Stack gap="md">
                      <Text fw={600} c={accentRed}>
                        Favorites
                      </Text>
                      <Group align="stretch" gap="lg" grow>
                        {favoriteQuote && (
                          <Card withBorder radius="md" padding="md" shadow="xs">
                            <Stack gap="sm">
                              <Group gap={6}>
                                <Quote size={18} color={theme.colors.teal[5]} />
                                <Text fw={600}>Favorite Quote</Text>
                              </Group>
                              <Text fs="italic" size="sm" style={{ lineHeight: 1.5 }}>
                                "{favoriteQuote.text}"
                              </Text>
                              <Group gap={8} wrap="wrap">
                                <Badge variant="outline" color="teal">
                                  {favoriteQuote.character?.name || 'Unknown'}
                                </Badge>
                                {favoriteQuote.chapterNumber && (
                                  <Badge variant="outline" color="red">
                                    Ch. {favoriteQuote.chapterNumber}
                                  </Badge>
                                )}
                              </Group>
                            </Stack>
                          </Card>
                        )}
                        {favoriteGamble && (
                          <Card withBorder radius="md" padding="md" shadow="xs">
                            <Stack gap="sm">
                              <Group gap={6}>
                                <Dices size={18} color={theme.colors.red[6]} />
                                <Text fw={600}>Favorite Gamble</Text>
                              </Group>
                              <Badge radius="lg" size="md" variant="filled" color="gamble" style={{ fontWeight: 700 }}>
                                {favoriteGamble.name}
                              </Badge>
                            </Stack>
                          </Card>
                        )}
                      </Group>
                    </Stack>
                  </Card>
                )}
              </Stack>
            </Group>
          </Stack>
        </Card>

        {guides.length > 0 && (
          <Card className="gambling-card" withBorder radius="md" shadow="lg" p="xl">
            <Stack gap="md">
              <Group justify="space-between" align="center">
                <Title order={3}>Guides by {user.username}</Title>
                <Button
                  component={Link}
                  href={`/guides?author=${user.id}&authorName=${encodeURIComponent(user.username)}`}
                  variant="outline"
                  color="red"
                  size="sm"
                >
                  View All
                </Button>
              </Group>

              <Stack gap="md">
                {guides.map((guide) => (
                  <Card key={guide.id} withBorder radius="md" padding="lg" shadow="sm">
                    <Stack gap="sm">
                      <Anchor
                        component={Link}
                        href={`/guides/${guide.id}`}
                        fw={600}
                        size="lg"
                        c={accentRed}
                        style={{ textDecoration: 'none' }}
                      >
                        {guide.title}
                      </Anchor>
                      <Text size="sm" c="dimmed">
                        {guide.description}
                      </Text>
                      <Group justify="space-between" align="center">
                        <Group gap="lg">
                          <Text size="xs" c="dimmed">
                            {guide.viewCount} views
                          </Text>
                          <Text size="xs" c="dimmed">
                            {guide.likeCount} likes
                          </Text>
                        </Group>
                        <Text size="xs" c="dimmed">
                          {new Date(guide.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </Text>
                      </Group>
                    </Stack>
                  </Card>
                ))}
              </Stack>
            </Stack>
          </Card>
        )}
      </motion.div>
    </Container>
  )
}