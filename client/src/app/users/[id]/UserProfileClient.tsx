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
import { getEntityThemeColor, semanticColors, textColors } from '../../../lib/mantine-theme'
import { ArrowLeft, FileText, Quote, Dices, Calendar, BookOpen, Camera } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'motion/react'
import { api } from '../../../lib/api'
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

  // Note: User profiles don't support page view tracking in the current system

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

  const accentRed = getEntityThemeColor(theme, 'character')
  const accentPurple = getEntityThemeColor(theme, 'gamble')
  const accentBlue = getEntityThemeColor(theme, 'guide')
  const accentGreen = getEntityThemeColor(theme, 'event')

  const stats = [
    {
      label: 'Guides Written',
      value: userStats ? userStats.guidesWritten : dataLoading ? '…' : '0',
      icon: <FileText size={22} color={accentRed} />,
      highlight: 'rgba(225, 29, 72, 0.08)',
      color: accentRed
    },
    {
      label: 'Media Submitted',
      value: userStats ? userStats.mediaSubmitted : dataLoading ? '…' : '0',
      icon: <Camera size={22} color={accentPurple} />,
      highlight: 'rgba(124, 58, 237, 0.08)',
      color: accentPurple
    },
    {
      label: 'Likes Received',
      value: userStats ? userStats.likesReceived : dataLoading ? '…' : '0',
      icon: <BookOpen size={22} color={accentBlue} />,
      highlight: 'rgba(25, 118, 210, 0.08)',
      color: accentBlue
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
          style={{ color: accentPurple }}
          leftSection={<ArrowLeft size={16} />}
          mb="xl"
        >
          Back to Users
        </Button>

        {/* Main Profile Card */}
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
          <Stack gap="xl">
            {/* Profile Header Section */}
            <Group align="flex-start" gap="xl" wrap="nowrap">
              <Box style={{ flexShrink: 0 }}>
                <UserProfileImage user={user} size={140} showFallback className="user-profile-avatar-large" />
              </Box>

              <Stack gap="lg" style={{ flex: 1, minWidth: 0 }}>
                {/* Name and Role */}
                <Stack gap="sm">
                  <Group gap="sm" align="center" wrap="wrap">
                    <Title
                      order={1}
                      size="h2"
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
                      size="large"
                      spacing={2}
                    />
                  </Group>

                  <Text size="sm" c="dimmed">
                    Joined {user.createdAt
                      ? new Date(user.createdAt).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric'
                        })
                      : 'Unknown'}
                  </Text>

                  <UserBadges userId={user.id} size="lg" maxDisplay={8} />
                </Stack>

                {/* Quick Stats Row */}
                <SimpleGrid cols={{ base: 2, sm: 3 }} spacing="md">
                  {stats.map((stat) => (
                    <Card
                      key={stat.label}
                      shadow="sm"
                      radius="md"
                      padding="md"
                      withBorder
                      style={{ 
                        backgroundColor: stat.highlight, 
                        borderColor: 'transparent',
                        textAlign: 'center'
                      }}
                    >
                      <Stack gap="xs" align="center">
                        {stat.icon}
                        <Stack gap={2} align="center">
                          <Text size="xl" fw={700} c={stat.color}>
                            {stat.value}
                          </Text>
                          <Text size="xs" c="dimmed" fw={500}>
                            {stat.label}
                          </Text>
                        </Stack>
                      </Stack>
                    </Card>
                  ))}
                </SimpleGrid>
              </Stack>
            </Group>

            <Divider />

            {/* Reading Progress */}
            <Card withBorder radius="md" padding="lg" shadow="sm">
              <Stack gap="md">
                <Group gap="sm" align="center">
                  <BookOpen size={24} color={accentBlue} />
                  <Text fw={600} size="lg">
                    Reading Progress
                  </Text>
                </Group>

                <Stack gap="sm">
                  <Group justify="space-between" align="center">
                    <Text size="sm" c="dimmed">
                      Current Chapter
                    </Text>
                    <Text fw={600}>
                      {user.userProgress} / 539
                    </Text>
                  </Group>

                  <Progress
                    value={readingProgress}
                    style={{ color: accentBlue }}
                    radius="md"
                    size="lg"
                    striped
                    animated
                  />

                  <Group justify="space-between" align="center">
                    <Text size="xs" c="dimmed">
                      0%
                    </Text>
                    <Text size="sm" fw={600} c={accentBlue}>
                      {readingProgress}%
                    </Text>
                    <Text size="xs" c="dimmed">
                      100%
                    </Text>
                  </Group>
                </Stack>
              </Stack>
            </Card>

            {/* Favorites Section */}
            {(favoriteQuote || favoriteGamble) && (
              <>
                <Divider />
                <Stack gap="lg">
                  <Group gap="sm" align="center">
                    <Text fw={700} size="xl" c={accentRed}>
                      ⭐ Favorites
                    </Text>
                  </Group>
                  
                  <SimpleGrid cols={{ base: 1, sm: favoriteQuote && favoriteGamble ? 2 : 1 }} spacing="lg">
                    {favoriteQuote && (
                      <Card withBorder radius="md" padding="lg" shadow="sm" bg="rgba(255, 193, 7, 0.05)">
                        <Stack gap="md">
                          <Group gap="sm" justify="space-between" align="center">
                            <Group gap="sm">
                              <Quote size={20} color={getEntityThemeColor(theme, 'quote')} />
                              <Text fw={600} c={getEntityThemeColor(theme, 'quote')}>
                                Favorite Quote
                              </Text>
                            </Group>
                            <Anchor
                              component={Link}
                              href={`/quotes/${favoriteQuote.id}`}
                              size="xs"
                              c={getEntityThemeColor(theme, 'quote')}
                            >
                              View Quote
                            </Anchor>
                          </Group>
                          
                          <Box
                            p="md"
                            style={{
                              backgroundColor: 'rgba(255, 255, 255, 0.5)',
                              borderRadius: rem(8),
                              borderLeft: `4px solid ${getEntityThemeColor(theme, 'quote')}`
                            }}
                          >
                            <Text fs="italic" size="sm" style={{ lineHeight: 1.6 }}>
                              "{favoriteQuote.text}"
                            </Text>
                          </Box>
                          
                          <Group gap="xs" wrap="wrap">
                            <Badge variant="outline" color="yellow" size="sm">
                              {favoriteQuote.character?.name || 'Unknown'}
                            </Badge>
                            {favoriteQuote.chapterNumber && (
                              <Badge variant="outline" color="blue" size="sm">
                                Chapter {favoriteQuote.chapterNumber}
                              </Badge>
                            )}
                          </Group>
                        </Stack>
                      </Card>
                    )}
                    
                    {favoriteGamble && (
                      <Card withBorder radius="md" padding="lg" shadow="sm" bg="rgba(124, 58, 237, 0.05)">
                        <Stack gap="md">
                          <Group gap="sm" justify="space-between" align="center">
                            <Group gap="sm">
                              <Dices size={20} color={accentPurple} />
                              <Text fw={600} c={accentPurple}>
                                Favorite Gamble
                              </Text>
                            </Group>
                            <Anchor
                              component={Link}
                              href={`/gambles/${favoriteGamble.id}`}
                              size="xs"
                              c={accentPurple}
                            >
                              View Gamble
                            </Anchor>
                          </Group>
                          
                          <Box style={{ textAlign: 'center' }}>
                            <Badge 
                              radius="lg" 
                              size="xl" 
                              variant="gradient" 
                              gradient={{ from: 'violet', to: 'purple' }}
                              style={{ fontWeight: 700, fontSize: rem(16), padding: rem(12) }}
                            >
                              {favoriteGamble.name}
                            </Badge>
                          </Box>
                          
                          {favoriteGamble.rules && (
                            <Text size="xs" c="dimmed" style={{ textAlign: 'center' }}>
                              {favoriteGamble.rules.length > 100 
                                ? `${favoriteGamble.rules.substring(0, 100)}...`
                                : favoriteGamble.rules}
                            </Text>
                          )}
                        </Stack>
                      </Card>
                    )}
                  </SimpleGrid>
                </Stack>
              </>
            )}
          </Stack>
        </Card>

        {/* User Guides Section */}
        {guides.length > 0 && (
          <Card className="gambling-card" withBorder radius="md" shadow="lg" p="xl">
            <Stack gap="lg">
              <Group justify="space-between" align="center" wrap="wrap">
                <Group gap="sm" align="center">
                  <FileText size={24} color={accentRed} />
                  <Title order={2} size="h3">
                    Guides by {user.username}
                  </Title>
                  <Badge variant="light" color="red" size="lg">
                    {guides.length}
                  </Badge>
                </Group>
                
                <Button
                  component={Link}
                  href={`/guides?author=${user.id}&authorName=${encodeURIComponent(user.username)}`}
                  variant="outline"
                  style={{ color: accentPurple }}
                  size="sm"
                  leftSection={<BookOpen size={16} />}
                >
                  View All Guides
                </Button>
              </Group>

              <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                {guides.map((guide) => (
                  <Card key={guide.id} withBorder radius="md" padding="lg" shadow="sm" bg="rgba(225, 29, 72, 0.02)">
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
                      
                      <Text size="sm" c="dimmed" lineClamp={2}>
                        {guide.description}
                      </Text>
                      
                      <Group justify="space-between" align="center" mt="xs">
                        <Group gap="md">
                          <Group gap="xs">
                            <Text size="xs" c="dimmed">
                              👁 {guide.viewCount}
                            </Text>
                          </Group>
                          <Group gap="xs">
                            <Text size="xs" c="dimmed">
                              ❤️ {guide.likeCount}
                            </Text>
                          </Group>
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
              </SimpleGrid>
            </Stack>
          </Card>
        )}
      </motion.div>
    </Container>
  )
}