'use client'

import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
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
  Title,
  useMantineTheme
} from '@mantine/core'
import {
  getEntityThemeColor,
  getAlphaColor,
  textColors,
  setTabAccentColors,
  backgroundStyles,
  getCardStyles
} from '../../../lib/mantine-theme'
import { User, Scroll, Users, BookOpen, Crown, Building2, Bookmark, Calendar, Image as ImageIcon, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'motion/react'
import { pageEnter } from '../../../lib/motion-presets'
import { usePageView } from '../../../hooks/usePageView'
import MediaGallery from '../../../components/MediaGallery'
import CharacterTimeline, { TimelineEvent } from '../../../components/CharacterTimeline'
import TimelineSpoilerWrapper from '../../../components/TimelineSpoilerWrapper'
import EnhancedSpoilerMarkdown from '../../../components/EnhancedSpoilerMarkdown'
import type { Arc, Gamble, Guide, Quote } from '../../../types'
import CharacterRelationships from '../../../components/CharacterRelationships'
import CharacterOrganizationMemberships from '../../../components/CharacterOrganizationMemberships'
import { BreadcrumbNav, createEntityBreadcrumbs } from '../../../components/Breadcrumb'
import { AnnotationSection } from '../../../components/annotations'
import { useAuth } from '../../../providers/AuthProvider'
import { AnnotationOwnerType } from '../../../types'
import { DetailPageHeader } from '../../../components/layouts/DetailPageHeader'
import { RelatedContentSection } from '../../../components/layouts/RelatedContentSection'

interface Character {
  id: number
  name: string
  alternateNames: string[] | null
  description: string | null
  backstory?: string | null
  firstAppearanceChapter: number | null
  imageFileName?: string | null
  imageDisplayName?: string | null
  organizations?: Array<{
    id: number
    name: string
    description?: string
  }>
  arcs?: Array<{
    id: number
    name: string
    order?: number
  }>
}

interface CharacterPageClientProps {
  character: Character
  gambles: Gamble[]
  events: TimelineEvent[]
  guides: Guide[]
  quotes: Quote[]
  arcs: Arc[]
}

export default function CharacterPageClient({
  character,
  gambles,
  events,
  guides,
  quotes,
  arcs
}: CharacterPageClientProps) {
  const theme = useMantineTheme()
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const mediaId = searchParams.get('mediaId') ?? undefined

  const [activeTab, setActiveTab] = useState<string>('overview')

  useEffect(() => {
    const hash = window.location.hash.slice(1)
    if (['overview', 'timeline', 'media', 'annotations'].includes(hash)) {
      setActiveTab(hash)
    } else if (hash.startsWith('annotation-')) {
      setActiveTab('annotations')
      // Scroll to the specific annotation after tab renders
      setTimeout(() => {
        const el = document.getElementById(hash)
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 600)
    }
  }, [])

  usePageView('character', character.id.toString(), true)

  useEffect(() => {
    setTabAccentColors('character')
  }, [])

  useEffect(() => {
    const newHash = activeTab === 'overview' ? '' : `#${activeTab}`
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname + window.location.search
      window.history.replaceState(null, '', currentPath + newHash)
    }
  }, [activeTab])

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1)
      if (['overview', 'timeline', 'media', 'annotations'].includes(hash)) {
        setActiveTab(hash)
      } else if (hash.startsWith('annotation-')) {
        setActiveTab('annotations')
        setTimeout(() => {
          const el = document.getElementById(hash)
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }, 600)
      } else if (!hash) {
        setActiveTab('overview')
      }
    }
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  const entityColors = {
    character: getEntityThemeColor(theme, 'character'),
    arc: getEntityThemeColor(theme, 'arc'),
    gamble: getEntityThemeColor(theme, 'gamble'),
    guide: getEntityThemeColor(theme, 'guide'),
    quote: getEntityThemeColor(theme, 'quote'),
    media: getEntityThemeColor(theme, 'media'),
    organization: getEntityThemeColor(theme, 'organization')
  }

  return (
    <Box style={{
      backgroundColor: backgroundStyles.page(theme),
      minHeight: '100vh',
      color: textColors.primary
    }}>
    <Container size="lg" py="md" style={{ backgroundColor: backgroundStyles.container(theme) }}>
    <Stack gap={theme.spacing.md}>
      <BreadcrumbNav
        items={createEntityBreadcrumbs('character', character.name)}
        entityType="character"
      />

      {/* Enhanced Character Header */}
      <DetailPageHeader
        entityType="character"
        entityId={character.id}
        entityName={character.name}
        stats={[
          { value: gambles.length, label: 'Gambles' },
          ...(character.firstAppearanceChapter != null
            ? [{ value: `Ch. ${character.firstAppearanceChapter}`, label: 'Debut' }]
            : []),
          { value: arcs.length, label: 'Arcs' },
        ].slice(0, 3)}
        tags={[
          ...(character.organizations?.map((o) => ({
            label: o.name,
            variant: 'accent' as const,
          })) ?? []),
        ]}
        spoilerChapter={character.firstAppearanceChapter}
      />

      <motion.div {...pageEnter}>
        <Card withBorder radius="lg" className="gambling-card" shadow="xl" style={getCardStyles(theme)}>
        <Tabs
          value={activeTab}
          onChange={(value) => value && setActiveTab(value)}
          keepMounted={false}
          variant="pills"
          className="character-tabs"
        >
          <Tabs.List>
            <Tabs.Tab value="overview" leftSection={<User size={16} />}>Overview</Tabs.Tab>
            {events.length > 0 && (
              <Tabs.Tab
                value="timeline"
                leftSection={<Calendar size={16} />}
                rightSection={<Badge size="xs" variant="light" c={entityColors.character}>{events.length}</Badge>}
              >
                Timeline
              </Tabs.Tab>
            )}
            <Tabs.Tab value="media" leftSection={<ImageIcon size={16} />}>Media</Tabs.Tab>
            <Tabs.Tab value="annotations" leftSection={<MessageSquare size={16} />}>Annotations</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="overview" pt={theme.spacing.md}>
            <Box
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1fr) 260px',
                gap: 12,
                alignItems: 'start',
              }}
              className="detail-editorial-grid"
            >
              {/* ── Main column ── */}
              <Stack gap={theme.spacing.md}>
                {/* Description */}
                <Card
                  withBorder
                  radius="lg"
                  shadow="lg"
                  padding={0}
                  style={getCardStyles(theme, entityColors.character)}
                >
                  <Box style={{ height: 3, borderRadius: '6px 6px 0 0', background: `linear-gradient(90deg, ${entityColors.character}, transparent 70%)` }} />
                  <Box p="lg">
                    <Group gap={10} mb={14} align="center">
                      <Box style={{ width: 28, height: 28, borderRadius: 6, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: getAlphaColor(entityColors.character, 0.15), border: `1px solid ${getAlphaColor(entityColors.character, 0.30)}` }}>
                        <User size={16} color={entityColors.character} />
                      </Box>
                      <Text style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: entityColors.character, opacity: 0.85 }}>
                        Description
                      </Text>
                      <Box style={{ flex: 1, height: 1, background: `linear-gradient(to right, ${getAlphaColor(entityColors.character, 0.20)}, transparent)` }} />
                    </Group>
                    {character.description ? (
                      <TimelineSpoilerWrapper chapterNumber={character.firstAppearanceChapter ?? undefined}>
                        <Box style={{ lineHeight: 1.6, fontSize: 14 }}>
                          <EnhancedSpoilerMarkdown
                            content={character.description}
                            enableEntityEmbeds
                            compactEntityCards={false}
                          />
                        </Box>
                      </TimelineSpoilerWrapper>
                    ) : (
                      <Text size="sm" c={textColors.tertiary} style={{ fontStyle: 'italic' }}>
                        No description available yet.
                      </Text>
                    )}
                  </Box>
                </Card>

                {/* Backstory */}
                {character.backstory && (
                  <Card
                    withBorder
                    radius="lg"
                    shadow="lg"
                    padding={0}
                    style={getCardStyles(theme, entityColors.character)}
                  >
                    <Box style={{ height: 3, borderRadius: '6px 6px 0 0', background: `linear-gradient(90deg, ${entityColors.character}, transparent 70%)` }} />
                    <Box p="lg">
                      <Group gap={10} mb={14} align="center">
                        <Box style={{ width: 28, height: 28, borderRadius: 6, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: getAlphaColor(entityColors.character, 0.15), border: `1px solid ${getAlphaColor(entityColors.character, 0.30)}` }}>
                          <Scroll size={16} color={entityColors.character} />
                        </Box>
                        <Text style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: entityColors.character, opacity: 0.85 }}>
                          Backstory
                        </Text>
                        <Box style={{ flex: 1, height: 1, background: `linear-gradient(to right, ${getAlphaColor(entityColors.character, 0.20)}, transparent)` }} />
                      </Group>
                      <TimelineSpoilerWrapper chapterNumber={character.firstAppearanceChapter ?? undefined}>
                        <Box style={{ lineHeight: 1.6, fontSize: 14 }}>
                          <EnhancedSpoilerMarkdown
                            content={character.backstory}
                            enableEntityEmbeds
                            compactEntityCards={false}
                          />
                        </Box>
                      </TimelineSpoilerWrapper>
                    </Box>
                  </Card>
                )}

                {/* Relationships */}
                <CharacterRelationships characterId={character.id} characterName={character.name} />

                {/* Organization memberships */}
                {character.organizations && character.organizations.length > 0 && (
                  <Card
                    withBorder
                    radius="lg"
                    shadow="lg"
                    padding={0}
                    style={getCardStyles(theme, entityColors.organization)}
                  >
                    <Box style={{ height: 3, borderRadius: '6px 6px 0 0', background: `linear-gradient(90deg, ${entityColors.organization}, transparent 70%)` }} />
                    <Box p="md">
                      <Group gap={10} mb={14} align="center">
                        <Box style={{ width: 28, height: 28, borderRadius: 6, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: getAlphaColor(entityColors.organization, 0.15), border: `1px solid ${getAlphaColor(entityColors.organization, 0.30)}` }}>
                          <Users size={16} color={entityColors.organization} />
                        </Box>
                        <Text style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: entityColors.organization, opacity: 0.85 }}>
                          Organizations
                        </Text>
                        <Box style={{ flex: 1, height: 1, background: `linear-gradient(to right, ${getAlphaColor(entityColors.organization, 0.20)}, transparent)` }} />
                      </Group>
                      <CharacterOrganizationMemberships
                        characterId={character.id}
                        characterName={character.name}
                      />
                    </Box>
                  </Card>
                )}
              </Stack>

              {/* ── Aside column ── */}
              <Stack gap={theme.spacing.sm}>
                {/* Details card */}
                <Card
                  withBorder
                  radius="lg"
                  shadow="md"
                  padding={0}
                  style={getCardStyles(theme, entityColors.character)}
                >
                  <Box style={{ height: 3, borderRadius: '6px 6px 0 0', background: `linear-gradient(90deg, ${entityColors.character}, transparent 70%)` }} />
                  <Box p="md">
                    <Group gap={10} mb={14} align="center">
                      <Text style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: entityColors.character, opacity: 0.85 }}>
                        Details
                      </Text>
                      <Box style={{ flex: 1, height: 1, background: `linear-gradient(to right, ${getAlphaColor(entityColors.character, 0.20)}, transparent)` }} />
                    </Group>
                    {character.firstAppearanceChapter != null && (
                      <Box style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #161616' }}>
                        <Box style={{ width: 24, height: 24, borderRadius: 5, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: getAlphaColor(entityColors.character, 0.10), border: `1px solid ${getAlphaColor(entityColors.character, 0.20)}` }}>
                          <BookOpen size={14} color={entityColors.character} />
                        </Box>
                        <Text style={{ fontSize: 11, color: '#555', flex: 1 }}>Debut</Text>
                        <Text style={{ fontSize: 12, fontWeight: 700, color: entityColors.character }}>Ch. {character.firstAppearanceChapter}</Text>
                      </Box>
                    )}
                    {character.organizations && character.organizations.length > 0 && (
                      <Box style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #161616' }}>
                        <Box style={{ width: 24, height: 24, borderRadius: 5, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: getAlphaColor(entityColors.character, 0.10), border: `1px solid ${getAlphaColor(entityColors.character, 0.20)}` }}>
                          <Building2 size={14} color={entityColors.character} />
                        </Box>
                        <Text style={{ fontSize: 11, color: '#555', flex: 1 }}>Organization</Text>
                        <Text
                          component={Link}
                          href={`/organizations/${character.organizations[0].id}`}
                          style={{ fontSize: 12, fontWeight: 700, color: entityColors.organization, textDecoration: 'none' }}
                        >
                          {character.organizations[0].name}
                        </Text>
                      </Box>
                    )}
                    <Box style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #161616' }}>
                      <Box style={{ width: 24, height: 24, borderRadius: 5, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: getAlphaColor(entityColors.character, 0.10), border: `1px solid ${getAlphaColor(entityColors.character, 0.20)}` }}>
                        <Crown size={14} color={entityColors.character} />
                      </Box>
                      <Text style={{ fontSize: 11, color: '#555', flex: 1 }}>Gambles</Text>
                      <Text style={{ fontSize: 12, fontWeight: 700, color: entityColors.character }}>{gambles.length}</Text>
                    </Box>
                    <Box style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0' }}>
                      <Box style={{ width: 24, height: 24, borderRadius: 5, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: getAlphaColor(entityColors.character, 0.10), border: `1px solid ${getAlphaColor(entityColors.character, 0.20)}` }}>
                        <Bookmark size={14} color={entityColors.character} />
                      </Box>
                      <Text style={{ fontSize: 11, color: '#555', flex: 1 }}>Arcs</Text>
                      <Text style={{ fontSize: 12, fontWeight: 700, color: entityColors.character }}>{arcs.length}</Text>
                    </Box>
                  </Box>
                </Card>

                {/* Story Arcs compact */}
                {arcs.length > 0 && (
                  <Card
                    withBorder
                    radius="lg"
                    shadow="md"
                    style={getCardStyles(theme, entityColors.arc)}
                    p="md"
                  >
                    <RelatedContentSection
                      entityType="arc"
                      title="Story Arcs"
                      items={arcs}
                      previewCount={4}
                      viewAllHref={`/arcs?character=${character.name}`}
                      getKey={(arc) => arc.id}
                      variant="compact"
                      getLabel={(arc) => arc.name}
                      getHref={(arc) => `/arcs/${arc.id}`}
                      itemDotColor={entityColors.arc}
                    />
                  </Card>
                )}

                {/* Gambles compact */}
                {gambles.length > 0 && (
                  <Card
                    withBorder
                    radius="lg"
                    shadow="md"
                    style={getCardStyles(theme, entityColors.gamble)}
                    p="md"
                  >
                    <RelatedContentSection
                      entityType="gamble"
                      title="Gambles"
                      items={gambles}
                      previewCount={4}
                      viewAllHref={`/gambles?character=${character.name}`}
                      getKey={(g) => g.id}
                      variant="compact"
                      getLabel={(g) => g.name}
                      getHref={(g) => `/gambles/${g.id}`}
                      itemDotColor={entityColors.gamble}
                    />
                  </Card>
                )}

                {/* Quotes compact */}
                {quotes && quotes.length > 0 && (
                  <Card
                    withBorder
                    radius="lg"
                    shadow="md"
                    style={getCardStyles(theme, entityColors.quote)}
                    p="md"
                  >
                    <RelatedContentSection
                      entityType="quote"
                      title="Quotes"
                      items={quotes}
                      previewCount={4}
                      viewAllHref={`/quotes?character=${character.id}`}
                      getKey={(q) => q.id}
                      variant="compact"
                      getLabel={(q) => q.text?.slice(0, 60) ?? '(quote)'}
                      getHref={(q) => `/quotes/${q.id}`}
                      itemDotColor={entityColors.quote}
                    />
                  </Card>
                )}
              </Stack>
            </Box>
          </Tabs.Panel>

          <Tabs.Panel value="timeline" pt={theme.spacing.md}>
            <CharacterTimeline
              events={events}
              arcs={arcs}
              characterName={character.name}
              firstAppearanceChapter={character.firstAppearanceChapter ?? 0}
            />
          </Tabs.Panel>

          <Tabs.Panel value="media" pt={theme.spacing.md}>
            <Stack gap="md">
              <Card withBorder radius="lg" shadow="lg" style={getCardStyles(theme, entityColors.media)}>
                <Stack gap="md" p="md">
                  <Group justify="space-between" align="center">
                    <Group gap="sm">
                      <ImageIcon size={20} color={entityColors.media} />
                      <Title order={4} c={textColors.media}>Media Gallery</Title>
                    </Group>
                    <Button
                      component={Link}
                      href={`/media?ownerType=character&ownerId=${character.id}`}
                      variant="outline"
                      c={entityColors.media}
                      size="sm"
                      radius="xl"
                    >
                      View All
                    </Button>
                  </Group>
                  <MediaGallery
                    ownerType="character"
                    ownerId={character.id}
                    purpose="gallery"
                    limit={8}
                    showTitle={false}
                    compactMode
                    showFilters={false}
                    initialMediaId={mediaId}
                  />
                </Stack>
              </Card>
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="annotations" pt={theme.spacing.md}>
            <AnnotationSection
              ownerType={AnnotationOwnerType.CHARACTER}
              ownerId={character.id}
              userProgress={user?.userProgress}
              currentUserId={user?.id}
              isAuthenticated={!!user}
            />
          </Tabs.Panel>
        </Tabs>
      </Card>
      </motion.div>
    </Stack>

    </Container>
    </Box>
  )
}
