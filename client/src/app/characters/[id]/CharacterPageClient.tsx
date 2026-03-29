'use client'

import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  Badge,
  Box,
  Card,
  Container,
  Group,
  Stack,
  Tabs,
  Text,
  useMantineTheme
} from '@mantine/core'
import {
  getEntityThemeColor,
  textColors,
  setTabAccentColors,
  backgroundStyles,
} from '../../../lib/mantine-theme'
import { CinematicCard, CinematicSectionHeader } from '../../../components/layouts/CinematicCard'
import { User, Calendar, Image as ImageIcon, MessageSquare } from 'lucide-react'
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
        <Card withBorder radius="lg" className="gambling-card" shadow="xl">
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
                <CinematicCard entityColor={entityColors.character}>
                  <CinematicSectionHeader label="Description" entityColor={entityColors.character} />
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
                    <Text size="sm" style={{ fontStyle: 'italic', color: `${entityColors.character}55` }}>
                      No description available yet.
                    </Text>
                  )}
                </CinematicCard>

                {/* Backstory */}
                {character.backstory && (
                  <CinematicCard entityColor={entityColors.character}>
                    <CinematicSectionHeader label="Backstory" entityColor={entityColors.character} />
                    <TimelineSpoilerWrapper chapterNumber={character.firstAppearanceChapter ?? undefined}>
                      <Box style={{ lineHeight: 1.6, fontSize: 14 }}>
                        <EnhancedSpoilerMarkdown
                          content={character.backstory}
                          enableEntityEmbeds
                          compactEntityCards={false}
                        />
                      </Box>
                    </TimelineSpoilerWrapper>
                  </CinematicCard>
                )}

                {/* Relationships */}
                <CharacterRelationships characterId={character.id} characterName={character.name} />

                {/* Organization memberships */}
                {character.organizations && character.organizations.length > 0 && (
                  <CinematicCard entityColor={entityColors.organization} padding="md">
                    <CinematicSectionHeader label="Organizations" entityColor={entityColors.organization} />
                    <CharacterOrganizationMemberships
                      characterId={character.id}
                      characterName={character.name}
                    />
                  </CinematicCard>
                )}
              </Stack>

              {/* ── Aside column ── */}
              <Stack gap={theme.spacing.sm}>
                {/* Details card */}
                <CinematicCard entityColor={entityColors.character} padding="md">
                  <CinematicSectionHeader label="Details" entityColor={entityColors.character} />
                  {character.firstAppearanceChapter != null && (
                    <Box style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: `1px solid ${entityColors.character}14` }}>
                      <Box style={{ width: 5, height: 5, borderRadius: '50%', background: entityColors.character, flexShrink: 0 }} />
                      <Text style={{ fontSize: 11, color: `${entityColors.character}66`, flex: 1 }}>Debut</Text>
                      <Text style={{ fontSize: 12, fontWeight: 700, color: entityColors.character }}>Ch. {character.firstAppearanceChapter}</Text>
                    </Box>
                  )}
                  {character.organizations && character.organizations.length > 0 && (
                    <Box style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: `1px solid ${entityColors.character}14` }}>
                      <Box style={{ width: 5, height: 5, borderRadius: '50%', background: entityColors.character, flexShrink: 0 }} />
                      <Text style={{ fontSize: 11, color: `${entityColors.character}66`, flex: 1 }}>Organization</Text>
                      <Text
                        component={Link}
                        href={`/organizations/${character.organizations[0].id}`}
                        style={{ fontSize: 12, fontWeight: 700, color: entityColors.organization, textDecoration: 'none' }}
                      >
                        {character.organizations[0].name}
                      </Text>
                    </Box>
                  )}
                  <Box style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: `1px solid ${entityColors.character}14` }}>
                    <Box style={{ width: 5, height: 5, borderRadius: '50%', background: entityColors.character, flexShrink: 0 }} />
                    <Text style={{ fontSize: 11, color: `${entityColors.character}66`, flex: 1 }}>Gambles</Text>
                    <Text style={{ fontSize: 12, fontWeight: 700, color: entityColors.character }}>{gambles.length}</Text>
                  </Box>
                  <Box style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0' }}>
                    <Box style={{ width: 5, height: 5, borderRadius: '50%', background: entityColors.character, flexShrink: 0 }} />
                    <Text style={{ fontSize: 11, color: `${entityColors.character}66`, flex: 1 }}>Arcs</Text>
                    <Text style={{ fontSize: 12, fontWeight: 700, color: entityColors.character }}>{arcs.length}</Text>
                  </Box>
                </CinematicCard>

                {/* Story Arcs compact */}
                {arcs.length > 0 && (
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
                )}

                {/* Gambles compact */}
                {gambles.length > 0 && (
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
                )}

                {/* Quotes compact */}
                {quotes && quotes.length > 0 && (
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
            <CinematicCard entityColor={entityColors.media} padding="md">
              <Group justify="space-between" align="center" mb={14}>
                <Box
                  style={{
                    fontSize: '0.55rem', fontWeight: 900, letterSpacing: '0.22em', textTransform: 'uppercase',
                    borderRadius: 4, padding: '3px 8px',
                    background: `${entityColors.media}18`, border: `1px solid ${entityColors.media}30`, color: entityColors.media,
                  }}
                >
                  Media Gallery
                </Box>
                <Box
                  component={Link}
                  href={`/media?ownerType=character&ownerId=${character.id}`}
                  style={{ fontSize: 11, color: `${entityColors.media}88`, textDecoration: 'none' }}
                >
                  View All →
                </Box>
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
            </CinematicCard>
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
