'use client'

import React, { useEffect, useState } from 'react'
import {
  Anchor,
  Badge,
  Box,
  Button,
  Card,
  Container,
  Divider,
  Group,
  Progress,
  SegmentedControl,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  Title,
  rem,
  useMantineTheme
} from '@mantine/core'
import { getAlphaColor, getEntityThemeColor, headerColors, outlineStyles, textColors } from '../../../lib/mantine-theme'
import { BreadcrumbNav, createEntityBreadcrumbs } from '../../../components/Breadcrumb'
import { Camera, Dices, Eye, FileText, Heart, Quote, Star } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'motion/react'
import { api } from '../../../lib/api'
import UserProfileImage from '../../../components/UserProfileImage'
// GambleChip removed — using inline Badge chips for favorite gamble
import UserBadges from '../../../components/UserBadges'
import { UserRoleDisplay } from '../../../components/BadgeDisplay'
import SubmissionCard from '../../../components/SubmissionCard'
import type { SubmissionItem } from '../../../components/SubmissionCard'
import { MAX_CHAPTER } from '../../../lib/constants'

interface PublicUser {
  id: number
  username: string
  role: string
  customRole?: string | null
  userProgress: number
  profilePictureType?: 'fluxer' | 'character_media' | 'exclusive_artwork' | null
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
  fluxerId?: string | null
  fluxerAvatar?: string | null
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
    annotationsSubmitted: number
    eventsSubmitted?: number
  }
  favoriteQuote?: any
  favoriteGamble?: any
  favoriteCharacters?: Array<{
    id: number
    characterId: number
    isPrimary: boolean
    sortOrder: number
    character: { id: number; name: string }
  }>
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
  const [submissions, setSubmissions] = useState<any[]>([])
  const [favoriteQuote, setFavoriteQuote] = useState<any>(null)
  const [favoriteGamble, setFavoriteGamble] = useState<any>(null)
  const [userStats, setUserStats] = useState<{
    guidesWritten: number
    mediaSubmitted: number
    likesReceived: number
    annotationsSubmitted: number
    eventsSubmitted?: number
  } | null>(null)
  const [dataLoading, setDataLoading] = useState(true)
  const [contributionsVisible, setContributionsVisible] = useState(10)
  const [guidesVisible, setGuidesVisible] = useState(6)
  const [contributionFilter, setContributionFilter] = useState<string>('all')

  // Note: User profiles don't support page view tracking in the current system

  useEffect(() => {
    const fetchUserData = async () => {
      setDataLoading(true)

      const baseStats = {
        guidesWritten: user.userStats?.guidesWritten ?? 0,
        mediaSubmitted: user.userStats?.mediaSubmitted ?? 0,
        likesReceived: user.userStats?.likesReceived ?? 0,
        annotationsSubmitted: user.userStats?.annotationsSubmitted ?? 0,
      }

      try {
        const [guidesResponse, submissionsResponse] = await Promise.all([
          api.getGuides({
            limit: 100,
            status: 'approved',
            authorId: user.id
          }),
          api.getPublicUserSubmissions(user.id)
        ])

        const userGuides = guidesResponse.data ?? []
        setGuides(userGuides.slice(0, 10))

        const submissionsData = submissionsResponse as any
        setSubmissions(Array.isArray(submissionsData) ? submissionsData : submissionsData?.data || [])

        const aggregateLikes = userGuides.reduce((totalLikes, guide) => totalLikes + (guide.likeCount || 0), 0)
        const totalGuides = typeof guidesResponse.total === 'number' ? guidesResponse.total : userGuides.length

        setUserStats({
          guidesWritten: Math.max(totalGuides, baseStats.guidesWritten),
          mediaSubmitted: baseStats.mediaSubmitted,
          likesReceived: Math.max(aggregateLikes, baseStats.likesReceived),
          annotationsSubmitted: baseStats.annotationsSubmitted,
        })
      } catch (guidesError) {
        console.log('Could not fetch user guides:', guidesError)
        setGuides([])
        setUserStats(baseStats)
      } finally {
        setDataLoading(false)
      }
    }

    setFavoriteQuote(user.favoriteQuote ?? null)
    setFavoriteGamble(user.favoriteGamble ?? null)

    fetchUserData()
  }, [user.id, user.userStats, user.favoriteQuote, user.favoriteGamble])

  const characterColor = getEntityThemeColor(theme, 'character')
  const gambleColor = getEntityThemeColor(theme, 'gamble')
  const guideColor = getEntityThemeColor(theme, 'guide')
  const mediaColor = getEntityThemeColor(theme, 'media')
  const quoteColor = getEntityThemeColor(theme, 'quote')
  const eventColor = getEntityThemeColor(theme, 'event')
  const arcColor = getEntityThemeColor(theme, 'arc')
  const likesColor = '#e11d48'
  const accentColor = outlineStyles.accentColor
  const accentBorderColor = getAlphaColor(accentColor, 0.4)
  const accentHoverColor = getAlphaColor(accentColor, 0.18)
  const accentTextColor = theme.colors.gray?.[0] ?? '#ffffff'
  const cardBaseBackground = theme.colors.dark?.[7] ?? '#070707'

  const stats = [
    {
      label: 'Guides Written',
      value: userStats?.guidesWritten ?? 0,
      icon: <FileText size={22} color={guideColor} />,
      color: guideColor,
      isLoading: dataLoading && !userStats
    },
    {
      label: 'Media Submitted',
      value: userStats?.mediaSubmitted ?? 0,
      icon: <Camera size={22} color={mediaColor} />,
      color: mediaColor,
      isLoading: dataLoading && !userStats
    },
    {
      label: 'Likes Received',
      value: userStats?.likesReceived ?? 0,
      icon: <Heart size={22} color={likesColor} />,
      color: likesColor,
      isLoading: dataLoading && !userStats
    }
  ]

  const readingProgress = Math.min(Math.round((user.userProgress / MAX_CHAPTER) * 100), 100)

  return (
    <Container size="lg" py="xl">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <BreadcrumbNav
          items={createEntityBreadcrumbs('user', user.username)}
          entityType="user"
        />

        {/* Main Profile Card */}
        <Card
          className="gambling-card"
          withBorder
          radius="lg"
          shadow="xl"
          p="xl"
          mb="xl"
          style={{
            background: `linear-gradient(135deg, ${getAlphaColor('#7f1d1d', 0.45)}, ${getAlphaColor('#7f1d1d', 0.15)}), ${cardBaseBackground}`,
            border: `1px solid ${accentBorderColor}`,
            boxShadow: `0 20px 45px ${getAlphaColor(accentColor, 0.12)}`,
            color: theme.colors.gray?.[0] ?? '#ffffff'
          }}
        >
          <Stack gap="xl">
            {/* Profile Header Section */}
            <Group align="flex-start" gap="xl" wrap="nowrap">
              <Box style={{
                flexShrink: 0,
                borderRadius: '50%',
                border: `3px solid ${accentColor}50`,
                boxShadow: `0 0 16px ${accentColor}20`,
              }}>
                <UserProfileImage user={user} size={140} showFallback showHoverInfo className="user-profile-avatar-large" />
              </Box>

              <Stack gap="lg" style={{ flex: 1, minWidth: 0 }}>
                {/* Name and Role */}
                <Stack gap="sm">
                  <Group gap="sm" align="center" wrap="wrap">
                    <Title
                      order={1}
                      size="h2"
                      c={headerColors.h1}
                      fw={800}
                    >
                      {user.username}
                    </Title>
                    <UserRoleDisplay
                      userRole={user.role as 'admin' | 'moderator' | 'user'}
                      customRole={user.customRole}
                      size="medium"
                      spacing={2}
                    />
                  </Group>

                  <Text size="sm" c={textColors.tertiary}>
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
                <Group gap="md" wrap="wrap">
                  {stats.map((stat) => (
                    <Box
                      key={stat.label}
                      style={{
                        padding: '1rem 0.75rem',
                        background: `${stat.color}08`,
                        border: `1px solid ${stat.color}22`,
                        borderRadius: '0.5rem',
                        textAlign: 'center',
                        minWidth: 80,
                      }}
                    >
                      {stat.isLoading ? (
                        <Skeleton height={28} width={40} radius="sm" style={{ margin: '0 auto 4px' }} />
                      ) : (
                        <Text style={{
                          fontFamily: 'var(--font-opti-goudy-text), serif',
                          fontSize: '1.75rem',
                          fontWeight: 400,
                          color: stat.color,
                          lineHeight: 1,
                          marginBottom: 4,
                        }}>
                          {stat.value}
                        </Text>
                      )}
                      <Text className="eyebrow-label" style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.6rem' }}>
                        {stat.label.toUpperCase()}
                      </Text>
                    </Box>
                  ))}
                </Group>
              </Stack>
            </Group>

            <Divider color={getAlphaColor(accentColor, 0.25)} />

            {/* Reading Progress */}
            <Card
              withBorder
              radius="lg"
              padding="lg"
              shadow="lg"
              style={{
                background: getAlphaColor(arcColor, 0.12),
                border: `1px solid ${getAlphaColor(arcColor, 0.35)}`
              }}
            >
              <Stack gap="md">
                <Group justify="flex-start" gap="sm" style={{ marginBottom: 4 }}>
                  <Box style={{ height: 1, width: 40, background: `linear-gradient(to right, transparent, ${arcColor}40)` }} />
                  <Text className="eyebrow-label" style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.68rem' }}>
                    READING PROGRESS
                  </Text>
                  <Box style={{ height: 1, flex: 1, maxWidth: 120, background: `linear-gradient(to left, transparent, ${arcColor}20)` }} />
                </Group>

                <Stack gap="sm">
                  <Group justify="space-between" align="center">
                    <Stack gap={2}>
                      <Text className="eyebrow-label" style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>
                        Current Chapter
                      </Text>
                      <Text style={{
                        fontFamily: 'var(--font-opti-goudy-text), serif',
                        fontSize: '1.5rem',
                        fontWeight: 400,
                        color: arcColor,
                        lineHeight: 1,
                      }}>
                        {user.userProgress}
                      </Text>
                    </Stack>
                    <Stack gap={2} style={{ textAlign: 'right' }}>
                      <Text className="eyebrow-label" style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>
                        Total Chapters
                      </Text>
                      <Text style={{
                        fontFamily: 'var(--font-opti-goudy-text), serif',
                        fontSize: '1.5rem',
                        fontWeight: 400,
                        color: 'rgba(255,255,255,0.5)',
                        lineHeight: 1,
                      }}>
                        {MAX_CHAPTER}
                      </Text>
                    </Stack>
                  </Group>

                  <Progress
                    value={readingProgress}
                    color={arcColor}
                    radius="md"
                    size="lg"
                    striped
                    animated
                  />

                  <Group justify="space-between" align="center">
                    <Text size="xs" c={textColors.tertiary}>
                      0%
                    </Text>
                    <Text size="sm" fw={600} c={arcColor}>
                      {readingProgress}%
                    </Text>
                    <Text size="xs" c={textColors.tertiary}>
                      100%
                    </Text>
                  </Group>
                </Stack>
              </Stack>
            </Card>

            {/* Favorites Section */}
            {(favoriteQuote || favoriteGamble) && (
              <>
                <Divider color={getAlphaColor(accentColor, 0.25)} />
                <Stack gap="lg">
                  <Group justify="flex-start" gap="sm" style={{ marginBottom: 12, marginTop: 8 }}>
                    <Box style={{ height: 1, width: 40, background: `linear-gradient(to right, transparent, ${characterColor}40)` }} />
                    <Text className="eyebrow-label" style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.68rem' }}>
                      FAVORITES
                    </Text>
                    <Box style={{ height: 1, flex: 1, maxWidth: 120, background: `linear-gradient(to left, transparent, ${characterColor}20)` }} />
                  </Group>
                  
                  <SimpleGrid cols={{ base: 1, sm: favoriteQuote && favoriteGamble ? 2 : 1 }} spacing="lg">
                    {favoriteQuote && (
                      <Card
                        withBorder
                        radius="md"
                        padding="lg"
                        shadow="sm"
                        style={{
                          background: getAlphaColor(quoteColor, 0.12),
                          border: `1px solid ${getAlphaColor(quoteColor, 0.35)}`
                        }}
                      >
                        <Stack gap="md">
                          <Group gap="sm" justify="space-between" align="center">
                            <Group gap="sm">
                              <Quote size={20} color={quoteColor} />
                              <Text fw={600} c={quoteColor}>
                                Favorite Quote
                              </Text>
                            </Group>
                            <Anchor
                              component={Link}
                              href={`/quotes/${favoriteQuote.id}`}
                              size="xs"
                              c={quoteColor}
                            >
                              View Quote
                            </Anchor>
                          </Group>
                          
                          <Box
                            p="md"
                            style={{
                              backgroundColor: getAlphaColor('#ffffff', 0.08),
                              borderRadius: rem(8),
                              borderLeft: `4px solid ${quoteColor}`
                            }}
                          >
                            <Text fs="italic" size="sm" style={{ lineHeight: 1.6 }}>
                              "{favoriteQuote.text}"
                            </Text>
                          </Box>
                          
                          <Group gap="xs" wrap="wrap">
                            <Badge
                              variant="light"
                              size="sm"
                              style={{
                                background: getAlphaColor(quoteColor, 0.2),
                                border: `1px solid ${getAlphaColor(quoteColor, 0.4)}`,
                                color: quoteColor
                              }}
                            >
                              {favoriteQuote.character?.name || 'Unknown'}
                            </Badge>
                            {favoriteQuote.chapterNumber && (
                              <Badge
                                variant="light"
                                size="sm"
                                style={{
                                  background: getAlphaColor(characterColor, 0.2),
                                  border: `1px solid ${getAlphaColor(characterColor, 0.4)}`,
                                  color: characterColor
                                }}
                              >
                                Chapter {favoriteQuote.chapterNumber}
                              </Badge>
                            )}
                          </Group>
                        </Stack>
                      </Card>
                    )}
                    
                    {favoriteGamble && (
                      <Card
                        withBorder
                        radius="md"
                        padding="lg"
                        shadow="sm"
                        style={{
                          background: getAlphaColor(gambleColor, 0.12),
                          border: `1px solid ${getAlphaColor(gambleColor, 0.35)}`
                        }}
                      >
                        <Stack gap="md">
                          <Group gap="sm" justify="space-between" align="center">
                            <Group gap="sm">
                              <Dices size={20} color={gambleColor} />
                              <Text fw={600} c={gambleColor}>
                                Favorite Gamble
                              </Text>
                            </Group>
                            <Anchor
                              component={Link}
                              href={`/gambles/${favoriteGamble.id}`}
                              size="xs"
                              c={gambleColor}
                            >
                              View Gamble
                            </Anchor>
                          </Group>
                          
                          <Box style={{ textAlign: 'center' }}>
                            <Badge 
                              radius="lg" 
                              size="xl" 
                              variant="gradient" 
                              gradient={{ from: getAlphaColor(gambleColor, 0.8), to: gambleColor }}
                              style={{ fontWeight: 700, fontSize: rem(16), padding: rem(12) }}
                            >
                              {favoriteGamble.name}
                            </Badge>
                          </Box>
                          
                          {favoriteGamble.rules && (
                            <Text size="xs" c={textColors.tertiary} style={{ textAlign: 'center' }}>
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

            {/* Favorite Characters */}
            {user.favoriteCharacters && user.favoriteCharacters.length > 0 && (
              <>
                <Divider color={getAlphaColor(accentColor, 0.25)} />
                <Stack gap="lg">
                  <Group justify="flex-start" gap="sm" style={{ marginBottom: 12, marginTop: 8 }}>
                    <Box style={{ height: 1, width: 40, background: `linear-gradient(to right, transparent, ${characterColor}40)` }} />
                    <Text className="eyebrow-label" style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.68rem' }}>
                      FAVORITE CHARACTERS
                    </Text>
                    <Box style={{ height: 1, flex: 1, maxWidth: 120, background: `linear-gradient(to left, transparent, ${characterColor}20)` }} />
                  </Group>
                  <Stack gap="xs">
                    {user.favoriteCharacters
                      .slice()
                      .sort((a, b) => a.sortOrder - b.sortOrder)
                      .map((fav) => (
                        <Card
                          key={fav.characterId}
                          component={Link}
                          href={`/characters/${fav.characterId}`}
                          withBorder
                          radius="md"
                          padding="sm"
                          style={{
                            background: getAlphaColor(characterColor, 0.08),
                            border: `1px solid ${getAlphaColor(characterColor, 0.25)}`,
                            textDecoration: 'none',
                          }}
                        >
                          <Group gap="sm" align="center">
                            {fav.isPrimary && (
                              <Badge
                                size="xs"
                                color="yellow"
                                variant="filled"
                                leftSection={<Star size={10} fill="currentColor" />}
                              >
                                #1
                              </Badge>
                            )}
                            <Text size="sm" fw={fav.isPrimary ? 700 : 400} c={characterColor}>
                              {fav.character.name}
                            </Text>
                          </Group>
                        </Card>
                      ))}
                  </Stack>
                </Stack>
              </>
            )}
          </Stack>
        </Card>

        {/* User Contributions Section */}
        {submissions.length > 0 && (
          <Card
            className="gambling-card"
            withBorder
            radius="md"
            shadow="lg"
            p="xl"
            style={{
              background: `linear-gradient(135deg, ${getAlphaColor(accentColor, 0.14)}, ${getAlphaColor(accentColor, 0.04)}), ${cardBaseBackground}`,
              border: `1px solid ${getAlphaColor(accentColor, 0.35)}`,
              boxShadow: `0 16px 36px ${getAlphaColor(accentColor, 0.1)}`
            }}
          >
            <Stack gap="lg">
              <Group justify="flex-start" gap="sm" style={{ marginBottom: 12, marginTop: 8 }}>
                <Box style={{ height: 1, width: 40, background: `linear-gradient(to right, transparent, ${guideColor}40)` }} />
                <Text className="eyebrow-label" style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.68rem' }}>
                  CONTRIBUTIONS BY {user.username.toUpperCase()}
                </Text>
                <Badge
                  variant="light"
                  size="sm"
                  style={{
                    background: getAlphaColor(guideColor, 0.2),
                    border: `1px solid ${getAlphaColor(guideColor, 0.4)}`,
                    color: guideColor
                  }}
                >
                  {submissions.length}
                </Badge>
                <Box style={{ height: 1, flex: 1, maxWidth: 120, background: `linear-gradient(to left, transparent, ${guideColor}20)` }} />
              </Group>

              {/* Filter Controls */}
              <SegmentedControl
                value={contributionFilter}
                onChange={(value) => {
                  setContributionFilter(value)
                  setContributionsVisible(10) // Reset visible count when filter changes
                }}
                data={[
                  { label: 'All', value: 'all' },
                  { label: 'Guides', value: 'guide' },
                  { label: 'Media', value: 'media' },
                  { label: 'Events', value: 'event' },
                  { label: 'Annotations', value: 'annotation' },
                ]}
                color={guideColor}
                styles={{
                  root: {
                    backgroundColor: getAlphaColor(accentColor, 0.15),
                    border: `1px solid ${accentBorderColor}`,
                  },
                  indicator: {
                    backgroundColor: guideColor,
                  },
                  label: {
                    color: textColors.secondary,
                  },
                }}
              />

              <Stack gap="sm">
                {(() => {
                  const filteredSubmissions = contributionFilter === 'all'
                    ? submissions
                    : submissions.filter((s: any) => s.type === contributionFilter)

                  return (
                    <>
                      {filteredSubmissions.slice(0, contributionsVisible).map((submission: any) => (
                        <SubmissionCard
                          key={`${submission.type}-${submission.id}`}
                          submission={submission as SubmissionItem}
                          cardStyle={{
                            background: getAlphaColor(guideColor, 0.12),
                            border: `1px solid ${getAlphaColor(guideColor, 0.35)}`
                          }}
                        />
                      ))}
                      {filteredSubmissions.length === 0 && (
                        <Text c={textColors.tertiary} ta="center" py="xl">
                          No {contributionFilter === 'all' ? 'contributions' : `${contributionFilter}s`} found.
                        </Text>
                      )}
                      {filteredSubmissions.length > contributionsVisible && (
                        <Button
                          variant="subtle"
                          fullWidth
                          onClick={() => setContributionsVisible(v => v + 10)}
                        >
                          Show more ({filteredSubmissions.length - contributionsVisible} remaining)
                        </Button>
                      )}
                    </>
                  )
                })()}
              </Stack>
            </Stack>
          </Card>
        )}

        {/* User Guides Section */}
        {guides.length > 0 && (
          <Card
            className="gambling-card"
            withBorder
            radius="md"
            shadow="lg"
            p="xl"
            style={{
              background: `linear-gradient(135deg, ${getAlphaColor(accentColor, 0.14)}, ${getAlphaColor(accentColor, 0.04)}), ${cardBaseBackground}`,
              border: `1px solid ${getAlphaColor(accentColor, 0.35)}`,
              boxShadow: `0 16px 36px ${getAlphaColor(accentColor, 0.1)}`
            }}
          >
            <Stack gap="lg">
              <Group justify="space-between" align="center" wrap="wrap">
                <Group justify="flex-start" gap="sm" style={{ marginBottom: 4 }}>
                  <Box style={{ height: 1, width: 40, background: `linear-gradient(to right, transparent, ${guideColor}40)` }} />
                  <Text className="eyebrow-label" style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.68rem' }}>
                    GUIDES BY {user.username.toUpperCase()}
                  </Text>
                  <Badge
                    variant="light"
                    size="sm"
                    style={{
                      background: getAlphaColor(guideColor, 0.2),
                      border: `1px solid ${getAlphaColor(guideColor, 0.4)}`,
                      color: guideColor
                    }}
                  >
                    {guides.length}
                  </Badge>
                  <Box style={{ height: 1, flex: 1, maxWidth: 120, background: `linear-gradient(to left, transparent, ${guideColor}20)` }} />
                </Group>

                <Button
                  component={Link}
                  href={`/guides?author=${user.id}&authorName=${encodeURIComponent(user.username)}`}
                  variant="outline"
                  radius="md"
                  styles={{
                    root: {
                      borderColor: accentBorderColor,
                      color: accentTextColor,
                      backgroundColor: getAlphaColor(accentColor, 0.1),
                      _hover: {
                        backgroundColor: accentHoverColor
                      }
                    }
                  }}
                  size="sm"
                  leftSection={<FileText size={16} />}
                >
                  View All Guides
                </Button>
              </Group>

              <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                {guides.slice(0, guidesVisible).map((guide) => (
                  <Card
                    key={guide.id}
                    withBorder
                    radius="md"
                    padding="lg"
                    shadow="sm"
                    style={{
                      background: getAlphaColor(guideColor, 0.12),
                      border: `1px solid ${getAlphaColor(guideColor, 0.35)}`
                    }}
                  >
                    <Stack gap="sm">
                      <Anchor
                        component={Link}
                        href={`/guides/${guide.id}`}
                        fw={600}
                        size="lg"
                        c={guideColor}
                        style={{ textDecoration: 'none' }}
                      >
                        {guide.title}
                      </Anchor>

                      <Text size="sm" c={textColors.tertiary} lineClamp={2}>
                        {guide.description}
                      </Text>

                      <Group justify="space-between" align="center" mt="xs">
                        <Group gap="md">
                          <Group gap={4} align="center">
                            <Eye size={12} color={textColors.tertiary as string} />
                            <Text size="xs" c={textColors.tertiary}>
                              {guide.viewCount}
                            </Text>
                          </Group>
                          <Group gap={4} align="center">
                            <Heart size={12} color={textColors.tertiary as string} />
                            <Text size="xs" c={textColors.tertiary}>
                              {guide.likeCount}
                            </Text>
                          </Group>
                        </Group>

                        <Text size="xs" c={textColors.tertiary}>
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
              {guides.length > guidesVisible && (
                <Button
                  variant="subtle"
                  fullWidth
                  onClick={() => setGuidesVisible(v => v + 6)}
                >
                  Show more ({guides.length - guidesVisible} remaining)
                </Button>
              )}
            </Stack>
          </Card>
        )}
      </motion.div>
    </Container>
  )
}
