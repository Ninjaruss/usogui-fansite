'use client'

import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  Badge,
  Box,
  Card,
  Container,
  Group,
  Paper,
  Stack,
  Tabs,
  Text,
  Title,
  useMantineTheme
} from '@mantine/core'
import {
  getEntityThemeColor,
  textColors,
  headerColors,
  getAlphaColor,
  spacing,
  fontSize,
  setTabAccentColors,
  backgroundStyles,
  getCardStyles
} from '../../../lib/mantine-theme'
import { User, Crown, Calendar, BookOpen, Image as ImageIcon, Building2, MessageSquare } from 'lucide-react'
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
import { EntityQuickActions } from '../../../components/EntityQuickActions'
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
      >
        <Stack gap={theme.spacing.sm}>
          <Title
            order={1}
            size="2.8rem"
            fw={800}
            c={headerColors.h1}
            style={{
              lineHeight: 1.1,
              textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
              letterSpacing: '-0.02em'
            }}
          >
            {character.name}
          </Title>
          {character.alternateNames && character.alternateNames.length > 0 && (
            <Group gap={theme.spacing.xs} wrap="wrap">
              {character.alternateNames.map((name, index) => (
                <Badge
                  key={index}
                  variant="light"
                  size="md"
                  radius="md"
                  style={{
                    background: `${theme.colors.dark[5]}80`,
                    border: `1px solid ${theme.colors.dark[4]}`,
                    fontWeight: 500,
                    letterSpacing: '0.02em'
                  }}
                  c={textColors.secondary}
                >
                  {name}
                </Badge>
              ))}
            </Group>
          )}
        </Stack>

        <Stack gap={theme.spacing.md} style={{ flex: 1, justifyContent: 'center' }}>
          <Group gap={theme.spacing.md} wrap="wrap" align="center">
            {character.firstAppearanceChapter && (
              <Badge
                variant="filled"
                size="lg"
                radius="md"
                style={{
                  background: `linear-gradient(135deg, ${entityColors.character} 0%, ${entityColors.character}dd 100%)`,
                  border: `1px solid ${entityColors.character}`,
                  boxShadow: theme.shadows.md,
                  fontSize: fontSize.sm,
                  color: textColors.primary,
                  fontWeight: 600
                }}
              >
                First appears in Chapter {character.firstAppearanceChapter}
              </Badge>
            )}
          </Group>

          {character.organizations && character.organizations.length > 0 && (
            <Group gap={theme.spacing.sm} wrap="wrap">
              {character.organizations.map((org) => (
                <Badge
                  key={org.id}
                  variant="light"
                  size="lg"
                  radius="md"
                  style={{
                    background: getAlphaColor(entityColors.character, 0.25),
                    border: `1.5px solid ${entityColors.character}`,
                    color: textColors.character,
                    fontSize: fontSize.sm,
                    padding: `${spacing.sm} ${spacing.md}`,
                    fontWeight: 500,
                    transition: `all ${theme.other?.transitions?.durationShort || 200}ms ease`
                  }}
                >
                  {org.name}
                </Badge>
              ))}
            </Group>
          )}

          {/* Content Stats */}
          <Group gap={theme.spacing.md} wrap="wrap" mt={theme.spacing.sm}>
            {[
              { count: arcs.length, label: 'Story Arcs', color: entityColors.arc, textColor: textColors.arc },
              { count: gambles.length, label: 'Gambles', color: entityColors.gamble, textColor: textColors.gamble },
              { count: events.length, label: 'Events', color: entityColors.character, textColor: textColors.character },
              { count: quotes.length, label: 'Quotes', color: entityColors.quote, textColor: textColors.quote },
              { count: guides.length, label: 'Guides', color: entityColors.guide, textColor: textColors.guide }
            ].map(({ count, label, color, textColor }) => (
              <Badge key={label} size="lg" variant="light" c={textColor} style={{
                fontSize: fontSize.xs,
                fontWeight: 600,
                background: getAlphaColor(color, 0.2),
                border: `1px solid ${getAlphaColor(color, 0.4)}`
              }}>
                {count} {label}
              </Badge>
            ))}
          </Group>
        </Stack>
      </DetailPageHeader>

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
            <Stack gap={theme.spacing.lg}>
              {/* Character Description */}
              <Card withBorder radius="lg" shadow="lg" style={getCardStyles(theme, entityColors.character)}>
                <Stack gap={theme.spacing.md} p={theme.spacing.lg}>
                  <Group gap={theme.spacing.sm} align="center">
                    <User size={24} color={entityColors.character} />
                    <Title order={3} c={headerColors.h3}>About {character.name}</Title>
                  </Group>
                  {character.description ? (
                    <TimelineSpoilerWrapper chapterNumber={character.firstAppearanceChapter ?? undefined}>
                      <Box style={{ lineHeight: 1.6 }}>
                        <EnhancedSpoilerMarkdown content={character.description} enableEntityEmbeds compactEntityCards={false} />
                      </Box>
                    </TimelineSpoilerWrapper>
                  ) : (
                    <Text size="sm" c={textColors.tertiary} style={{ fontStyle: 'italic', textAlign: 'center', padding: theme.spacing.xl }}>
                      No description available for this character yet. Check back later for updates!
                    </Text>
                  )}
                </Stack>
              </Card>

              {/* Character Backstory */}
              {character.backstory && (
                <Card withBorder radius="lg" shadow="lg" style={getCardStyles(theme, entityColors.character)}>
                  <Stack gap={theme.spacing.md} p={theme.spacing.lg}>
                    <Group gap={theme.spacing.sm} align="center">
                      <BookOpen size={24} color={entityColors.character} />
                      <Title order={3} c={headerColors.h3}>History & Background</Title>
                    </Group>
                    <TimelineSpoilerWrapper chapterNumber={character.firstAppearanceChapter ?? undefined}>
                      <Box style={{ lineHeight: 1.6 }}>
                        <EnhancedSpoilerMarkdown content={character.backstory} enableEntityEmbeds compactEntityCards={false} />
                      </Box>
                    </TimelineSpoilerWrapper>
                  </Stack>
                </Card>
              )}

              {/* Character Relationships */}
              <CharacterRelationships characterId={character.id} characterName={character.name} />

              {/* Organization Memberships */}
              <Card withBorder radius="lg" shadow="lg" style={getCardStyles(theme, entityColors.organization)}>
                <Stack gap={theme.spacing.md} p={theme.spacing.md}>
                  <Group gap={theme.spacing.sm}>
                    <Building2 size={20} color={entityColors.organization} />
                    <Title order={4} c={textColors.primary}>Organizations</Title>
                  </Group>
                  <CharacterOrganizationMemberships characterId={character.id} characterName={character.name} />
                </Stack>
              </Card>

              {/* Related Story Arcs */}
              <RelatedContentSection
                entityType="arc"
                icon={<BookOpen size={20} color={entityColors.arc} />}
                title="Related Story Arcs"
                items={arcs}
                previewCount={4}
                viewAllHref={`/arcs?character=${character.name}`}
                getKey={(arc) => arc.id}
                titleColorKey="arc"
                renderItem={(arc) => (
                  <Paper withBorder radius="lg" p={theme.spacing.md} shadow="md" className="hoverable-paper" style={{
                    border: `1px solid ${getAlphaColor(entityColors.arc, 0.3)}`
                  }}>
                    <Group justify="space-between" align="flex-start">
                      <Box style={{ flex: 1 }}>
                        <Text component={Link} href={`/arcs/${arc.id}`} fw={600} size="sm" c={textColors.arc} style={{ textDecoration: 'none' }}>
                          {arc.name}
                        </Text>
                        {arc.description && (
                          <Text size="xs" c={textColors.tertiary} lineClamp={2} mt={spacing.xs}>{arc.description}</Text>
                        )}
                      </Box>
                      <Badge c={entityColors.arc} variant="outline" size="xs">
                        Arc {(arc as Arc & { order?: number }).order ?? "N/A"}
                      </Badge>
                    </Group>
                  </Paper>
                )}
              />

              {/* Related Gambles */}
              <RelatedContentSection
                entityType="gamble"
                icon={<Crown size={20} color={entityColors.gamble} />}
                title="Related Gambles"
                items={gambles}
                previewCount={4}
                viewAllHref={`/gambles?character=${character.name}`}
                getKey={(gamble) => gamble.id}
                titleColorKey="gamble"
                renderItem={(gamble) => (
                  <Paper withBorder radius="lg" p={theme.spacing.md} shadow="md" className="hoverable-paper" style={{
                    border: `1px solid ${getAlphaColor(entityColors.gamble, 0.3)}`
                  }}>
                    <TimelineSpoilerWrapper chapterNumber={gamble.chapterId ?? undefined}>
                      <Group justify="space-between" align="flex-start">
                        <Box style={{ flex: 1 }}>
                          <Text component={Link} href={`/gambles/${gamble.id}`} fw={600} size="sm" c={textColors.gamble} style={{ textDecoration: 'none' }}>
                            {gamble.name}
                          </Text>
                          {gamble.description && (
                            <Text size="xs" c={textColors.tertiary} lineClamp={2} mt={spacing.xs}>{gamble.description}</Text>
                          )}
                        </Box>
                        {gamble.chapterId && (
                          <Badge c={entityColors.gamble} variant="outline" size="xs">Ch. {gamble.chapterId}</Badge>
                        )}
                      </Group>
                    </TimelineSpoilerWrapper>
                  </Paper>
                )}
              />

              {/* Memorable Quotes */}
              <RelatedContentSection
                entityType="quote"
                icon={<BookOpen size={20} color={entityColors.quote} />}
                title="Memorable Quotes"
                items={quotes}
                previewCount={3}
                viewAllHref={`/quotes?characterId=${character.id}`}
                getKey={(quote) => quote.id}
                titleColorKey="quote"
                renderItem={(quote) => (
                  <Paper withBorder radius="lg" p={theme.spacing.md} shadow="md" className="hoverable-paper" style={{
                    border: `1px solid ${getAlphaColor(entityColors.quote, 0.3)}`
                  }}>
                    <TimelineSpoilerWrapper chapterNumber={quote.chapter?.number ?? undefined}>
                      <Stack gap={theme.spacing.sm}>
                        <Text size="sm" style={{ fontStyle: 'italic', lineHeight: 1.5 }}>
                          &ldquo;{quote.text}&rdquo;
                        </Text>
                        <Badge c={entityColors.quote} variant="light" radius="sm" size="xs" style={{ alignSelf: 'flex-start' }}>
                          Chapter {quote.chapter?.number ?? '?'}
                        </Badge>
                      </Stack>
                    </TimelineSpoilerWrapper>
                  </Paper>
                )}
              />

              {/* Community Guides */}
              <RelatedContentSection
                entityType="guide"
                icon={<BookOpen size={20} color={entityColors.guide} />}
                title="Community Guides"
                items={guides}
                previewCount={4}
                viewAllHref={`/guides?character=${character.name}`}
                getKey={(guide) => guide.id}
                titleColorKey="guide"
                renderItem={(guide) => (
                  <Paper withBorder radius="lg" p={theme.spacing.md} shadow="md" className="hoverable-paper" style={{
                    border: `1px solid ${getAlphaColor(entityColors.guide, 0.3)}`
                  }}>
                    <Stack gap={spacing.xs}>
                      <Text component={Link} href={`/guides/${guide.id}`} fw={600} size="sm" c={textColors.guide} style={{ textDecoration: 'none' }} lineClamp={2}>
                        {guide.title}
                      </Text>
                      <Group gap={theme.spacing.xs} align="center">
                        <User size={12} color={textColors.tertiary} />
                        <Text size="xs" c={textColors.tertiary}>By {guide.author?.username ?? 'Unknown'}</Text>
                      </Group>
                    </Stack>
                  </Paper>
                )}
              />
            </Stack>
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

    <EntityQuickActions
      entityType="character"
      entityId={character.id}
      isAuthenticated={!!user}
    />
    </Container>
    </Box>
  )
}
