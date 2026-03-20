'use client'

import React, { useEffect, useState } from 'react'
import {
  Anchor,
  Badge,
  Box,
  Button,
  Container,
  Divider,
  Group,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Text,
  useMantineTheme,
} from '@mantine/core'
import { getAlphaColor, getEntityThemeColor } from '../../../lib/mantine-theme'
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
import ReadingProgressBar from '../../../components/ReadingProgressBar'
import PublicActivityTimeline from '../../../components/PublicActivityTimeline'

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
  const guideColor = getEntityThemeColor(theme, 'guide')
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
                        <Box
                          key={fav.characterId}
                          component={Link}
                          href={`/characters/${fav.characterId}`}
                          style={{ display: 'block', background: '#111', border: '1px solid #1a1a1a', borderRadius: '4px', padding: '8px 12px', textDecoration: 'none' }}
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
                        </Box>
                      ))}
                  </Stack>
                ) : (
                  <Text size="sm" c="dimmed">No favorite characters set.</Text>
                )}
              </div>
            </Stack>
          </Box>

          {/* Right column: Reading Progress + Activity */}
          <Stack gap="md">
            <ReadingProgressBar userProgress={user.userProgress} />
            <PublicActivityTimeline submissions={submissions} />
          </Stack>
        </Box>

        {/* User Contributions Section */}
        {submissions.length > 0 && (
          <Box style={{ background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: '4px', padding: '20px' }}>
            <Stack gap="lg">
              {/* Heading */}
              <Group gap="sm">
                <Text fw={700}>Contributions</Text>
                <Badge variant="light" size="sm">{submissions.length}</Badge>
              </Group>

              {/* Filter */}
              <SegmentedControl
                value={contributionFilter}
                onChange={(value) => { setContributionFilter(value); setContributionsVisible(10) }}
                data={[
                  { label: 'All', value: 'all' },
                  { label: 'Guides', value: 'guide' },
                  { label: 'Media', value: 'media' },
                  { label: 'Events', value: 'event' },
                  { label: 'Annotations', value: 'annotation' },
                ]}
                styles={{ indicator: { backgroundColor: guideColor } }}
              />

              {/* List */}
              <Stack gap="sm">
                {(() => {
                  const filtered = contributionFilter === 'all'
                    ? submissions
                    : submissions.filter((s: any) => s.type === contributionFilter)
                  return (
                    <>
                      {filtered.slice(0, contributionsVisible).map((submission: any) => (
                        <SubmissionCard
                          key={`${submission.type}-${submission.id}`}
                          submission={submission as SubmissionItem}
                        />
                      ))}
                      {filtered.length === 0 && (
                        <Text c="dimmed" ta="center" py="xl">
                          No {contributionFilter === 'all' ? 'contributions' : `${contributionFilter}s`} found.
                        </Text>
                      )}
                      {filtered.length > contributionsVisible && (
                        <Button variant="subtle" fullWidth onClick={() => setContributionsVisible(v => v + 10)}>
                          Show more ({filtered.length - contributionsVisible} remaining)
                        </Button>
                      )}
                    </>
                  )
                })()}
              </Stack>
            </Stack>
          </Box>
        )}

        {/* User Guides Section */}
        {guides.length > 0 && (
          <Box style={{ background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: '4px', padding: '20px' }}>
            <Stack gap="lg">
              {/* Heading */}
              <Group justify="space-between" align="center" wrap="wrap">
                <Group gap="sm">
                  <Text fw={700}>Guides</Text>
                  <Badge variant="light" size="sm">{userStats?.guidesWritten ?? guides.length}</Badge>
                </Group>
                <Button
                  component={Link}
                  href={`/guides?author=${user.id}&authorName=${encodeURIComponent(user.username)}`}
                  variant="outline"
                  size="sm"
                  radius="md"
                  leftSection={<FileText size={16} />}
                  styles={{ root: { borderColor: '#2a2a2a', color: '#bbb', backgroundColor: 'transparent' } }}
                >
                  View All Guides
                </Button>
              </Group>

              {/* Grid */}
              <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                {guides.slice(0, guidesVisible).map((guide) => (
                  <Box key={guide.id} style={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: '4px', padding: '16px' }}>
                    <Stack gap="sm">
                      <Anchor component={Link} href={`/guides/${guide.id}`} fw={600} c="gray.2" style={{ textDecoration: 'none' }}>
                        {guide.title}
                      </Anchor>
                      <Text size="sm" c="dimmed" lineClamp={2}>{guide.description}</Text>
                      <Group justify="space-between" align="center">
                        <Group gap="md">
                          <Group gap={4} align="center">
                            <Eye size={12} color="#666" />
                            <Text size="xs" c="dimmed">{guide.viewCount}</Text>
                          </Group>
                          <Group gap={4} align="center">
                            <Heart size={12} color="#666" />
                            <Text size="xs" c="dimmed">{guide.likeCount}</Text>
                          </Group>
                        </Group>
                        <Text size="xs" c="dimmed">
                          {new Date(guide.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </Text>
                      </Group>
                    </Stack>
                  </Box>
                ))}
              </SimpleGrid>

              {guides.length > guidesVisible && (
                <Button variant="subtle" fullWidth onClick={() => setGuidesVisible(v => v + 6)}>
                  Show more ({guides.length - guidesVisible} remaining)
                </Button>
              )}
            </Stack>
          </Box>
        )}
          </Stack>
      </Container>
    </motion.div>
  )
}
