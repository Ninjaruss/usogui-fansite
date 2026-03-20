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
  Stack,
  Text,
  useMantineTheme
} from '@mantine/core'
import { getAlphaColor, getEntityThemeColor, outlineStyles, textColors } from '../../../lib/mantine-theme'
import { Eye, FileText, Heart, Star } from 'lucide-react'
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
  const quoteColor = getEntityThemeColor(theme, 'quote')
  const arcColor = getEntityThemeColor(theme, 'arc')
  const guideColor = getEntityThemeColor(theme, 'guide')
  const accentColor = outlineStyles.accentColor
  const accentBorderColor = getAlphaColor(accentColor, 0.4)
  const accentHoverColor = getAlphaColor(accentColor, 0.18)
  const accentTextColor = theme.colors.gray?.[0] ?? '#ffffff'
  const cardBaseBackground = theme.colors.dark?.[7] ?? '#070707'

  const readPercent = Math.min(Math.round((user.userProgress / MAX_CHAPTER) * 100), 100)
  const caseRef = String(user.id).padStart(4, '0')
  const memberSince = user.createdAt
    ? new Date(user.createdAt).toISOString().split('T')[0]
    : '—'

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <Container size="lg" py="xl">
        <Stack gap={0}>
        {/* ── Header ── */}
        <Box
          style={{
            background: 'linear-gradient(180deg, #100508 0%, #0a0a0a 100%)',
            borderBottom: '1px solid #1a1a1a',
            padding: '20px 24px 0',
            position: 'relative',
          }}
        >
          {/* Top accent bar */}
          <Box
            style={{
              position: 'absolute',
              top: 0, left: 0, right: 0,
              height: '2px',
              background: 'linear-gradient(90deg, #e11d48 0%, rgba(124,58,237,0.5) 55%, transparent 100%)',
            }}
          />

          {/* Main row */}
          <Group justify="space-between" align="flex-end" gap="lg" wrap="wrap">
            <Group align="flex-end" gap="lg">
              {/* Avatar */}
              <Box style={{ borderRadius: '4px', border: '1px solid #2a2a2a', boxShadow: '0 0 0 2px rgba(225,29,72,0.15)', flexShrink: 0 }}>
                <UserProfileImage user={user} size={72} />
              </Box>

              {/* Name + role */}
              <Stack gap={4} style={{ paddingBottom: '4px' }}>
                <Text
                  style={{
                    fontFamily: 'var(--font-opti-goudy-text)',
                    fontSize: '2rem',
                    fontWeight: 900,
                    color: '#f5f5f5',
                    lineHeight: 1,
                  }}
                >
                  {user.username}
                </Text>
                <Group gap="xs" wrap="wrap">
                  <UserRoleDisplay
                    userRole={user.role as 'admin' | 'moderator' | 'user'}
                    customRole={user.customRole ?? null}
                    size="medium"
                    spacing={2}
                  />
                  <UserBadges userId={user.id} />
                </Group>
              </Stack>
            </Group>

            {/* Dossier metadata */}
            <Stack gap={2} style={{ textAlign: 'right', paddingBottom: '6px' }}>
              <Text style={{ fontSize: '13px', color: '#555', letterSpacing: '0.06em', fontFamily: 'monospace', lineHeight: 1.9 }}>
                #{caseRef}<br />
                {memberSince}
              </Text>
            </Stack>
          </Group>

          {/* Stat strip */}
          <Group gap={0} style={{ marginTop: '16px', borderTop: '1px solid #1a1a1a' }}>
            {[
              { value: userStats?.guidesWritten ?? 0, label: 'Guides', accent: true },
              { value: userStats?.mediaSubmitted ?? 0, label: 'Media', accent: false },
              { value: userStats?.annotationsSubmitted ?? 0, label: 'Annotations', accent: false },
              { value: `${readPercent}%`, label: 'Read', accent: false },
            ].map((stat, i, arr) => (
              <Box
                key={stat.label}
                style={{
                  padding: '8px 16px',
                  paddingLeft: i === 0 ? 0 : '16px',
                  borderRight: i < arr.length - 1 ? '1px solid #1a1a1a' : 'none',
                }}
              >
                <Text style={{ fontSize: '22px', fontWeight: 800, color: stat.accent ? '#e11d48' : '#bbb', lineHeight: 1, marginBottom: '2px', display: 'block' }}>
                  {stat.value}
                </Text>
                <Text style={{ fontSize: '14px', color: '#888' }}>{stat.label}</Text>
              </Box>
            ))}
          </Group>
        </Box>

        {/* ── 2-column grid ── */}
        <Box
          className="profile-section-grid"
          style={{ padding: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}
        >
          {/* Left: Favorites */}
          <Box style={{ background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: '4px', padding: '16px' }}>
            <Stack gap="md">
              <Text fw={700}>Favorites</Text>

              {/* Favorite Quote */}
              <div>
                <Text fw={600} size="sm" mb="xs">Favorite Quote</Text>
                {favoriteQuote ? (
                  <Stack gap="sm">
                    <Box style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: '8px', borderLeft: `4px solid ${quoteColor}`, padding: '12px' }}>
                      <Text fs="italic" size="sm" style={{ lineHeight: 1.6 }} lineClamp={4}>
                        &ldquo;{favoriteQuote.text}&rdquo;
                      </Text>
                    </Box>
                    <Group gap="xs" wrap="wrap">
                      <Badge size="sm" style={{ background: getAlphaColor(quoteColor, 0.2), border: `1px solid ${getAlphaColor(quoteColor, 0.4)}`, color: quoteColor }}>
                        {favoriteQuote.character?.name || 'Unknown'}
                      </Badge>
                      {favoriteQuote.chapterNumber && (
                        <Badge size="sm" style={{ background: getAlphaColor(characterColor, 0.2), border: `1px solid ${getAlphaColor(characterColor, 0.4)}`, color: characterColor }}>
                          Chapter {favoriteQuote.chapterNumber}
                        </Badge>
                      )}
                    </Group>
                    <Anchor component={Link} href={`/quotes/${favoriteQuote.id}`} size="xs" c={quoteColor}>
                      View Quote
                    </Anchor>
                  </Stack>
                ) : (
                  <Text size="sm" c="dimmed">No favorite quote set.</Text>
                )}
              </div>

              <Divider color="rgba(255,255,255,0.06)" />

              {/* Favorite Gamble */}
              <div>
                <Text fw={600} size="sm" mb="xs">Favorite Gamble</Text>
                {favoriteGamble ? (
                  <Stack gap="sm" align="center">
                    <Badge
                      radius="lg"
                      size="xl"
                      variant="gradient"
                      gradient={{ from: getAlphaColor(gambleColor, 0.8), to: gambleColor }}
                      style={{ fontWeight: 700 }}
                    >
                      {favoriteGamble.name}
                    </Badge>
                    {favoriteGamble.rules && (
                      <Text size="xs" c="dimmed" ta="center">
                        {favoriteGamble.rules.length > 100 ? `${favoriteGamble.rules.substring(0, 100)}...` : favoriteGamble.rules}
                      </Text>
                    )}
                    <Anchor component={Link} href={`/gambles/${favoriteGamble.id}`} size="xs" c={gambleColor}>
                      View Gamble
                    </Anchor>
                  </Stack>
                ) : (
                  <Text size="sm" c="dimmed">No favorite gamble set.</Text>
                )}
              </div>

              <Divider color="rgba(255,255,255,0.06)" />

              {/* Favorite Characters */}
              <div>
                <Text fw={600} size="sm" mb="xs">Favorite Characters</Text>
                {user.favoriteCharacters && user.favoriteCharacters.length > 0 ? (
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
                          radius="sm"
                          padding="xs"
                          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid #2a2a2a', textDecoration: 'none' }}
                        >
                          <Group gap="sm" align="center">
                            {fav.isPrimary && (
                              <Badge size="xs" color="yellow" variant="filled" leftSection={<Star size={10} fill="currentColor" />}>
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
                ) : (
                  <Text size="sm" c="dimmed">No favorite characters set.</Text>
                )}
              </div>
            </Stack>
          </Box>

          {/* Right: Reading Progress */}
          <Box style={{ background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: '4px', padding: '16px' }}>
            <Stack gap="md">
              <Text fw={700}>Reading Progress</Text>

              <Group justify="space-between" align="flex-end">
                <Stack gap={2}>
                  <Text size="xs" c="dimmed">Chapter</Text>
                  <Text style={{ fontFamily: 'var(--font-opti-goudy-text)', fontSize: '1.5rem', color: arcColor, lineHeight: 1 }}>
                    {user.userProgress}
                  </Text>
                </Stack>
                <Stack gap={2} style={{ textAlign: 'right' }}>
                  <Text size="xs" c="dimmed">Total</Text>
                  <Text style={{ fontFamily: 'var(--font-opti-goudy-text)', fontSize: '1.5rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1 }}>
                    {MAX_CHAPTER}
                  </Text>
                </Stack>
              </Group>

              <Progress value={readPercent} color={arcColor} size="lg" radius="md" striped animated />

              <Group justify="space-between">
                <Text size="xs" c="dimmed">0%</Text>
                <Text size="sm" fw={600} c={arcColor}>{readPercent}%</Text>
                <Text size="xs" c="dimmed">100%</Text>
              </Group>
            </Stack>
          </Box>
        </Box>

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
          </Stack>
      </Container>
    </motion.div>
  )
}
