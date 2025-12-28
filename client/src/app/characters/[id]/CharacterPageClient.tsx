'use client'

import React, { useEffect, useState } from 'react'
import {
  Badge,
  Box,
  Button,
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
import { User, Crown, Calendar, BookOpen, Image as ImageIcon, Building2 } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'motion/react'
import { usePageView } from '../../../hooks/usePageView'
import MediaGallery from '../../../components/MediaGallery'
import CharacterTimeline, { TimelineEvent } from '../../../components/CharacterTimeline'
import TimelineSpoilerWrapper from '../../../components/TimelineSpoilerWrapper'
import EnhancedSpoilerMarkdown from '../../../components/EnhancedSpoilerMarkdown'
import type { Arc, Gamble, Guide, Quote } from '../../../types'
import MediaThumbnail from '../../../components/MediaThumbnail'
import CharacterRelationships from '../../../components/CharacterRelationships'
import CharacterOrganizationMemberships from '../../../components/CharacterOrganizationMemberships'

interface Character {
  id: number
  name: string
  alternateNames: string[] | null
  description: string | null
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
  const [activeTab, setActiveTab] = useState<string>('overview')

  usePageView('character', character.id.toString(), true)

  // Set tab accent colors for character entity
  useEffect(() => {
    setTabAccentColors('character')
  }, [])

  // Use consistent theme colors for better readability
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
      {/* Enhanced Character Header */}
      <Card
        withBorder
        radius="lg"
        shadow="lg"
        p={0}
        style={{
          ...getCardStyles(theme, entityColors.character),
          border: `2px solid ${entityColors.character}`,
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Subtle Pattern Overlay */}
        <Box
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `
              radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0),
              radial-gradient(circle at 20px 20px, rgba(255,255,255,0.03) 1px, transparent 0)
            `,
            backgroundSize: '40px 40px, 80px 80px',
            backgroundPosition: '0 0, 20px 20px',
            pointerEvents: 'none'
          }}
        />

        {/* Content */}
        <Box p={theme.spacing.lg} style={{ position: 'relative', zIndex: 1 }}>
          <Group gap={theme.spacing.lg} align="flex-start" wrap="wrap" justify="center">
            <Box style={{ flexShrink: 0 }}>
              <Box
                style={{
                  width: '200px',
                  height: '280px',
                  borderRadius: theme.radius.md,
                  overflow: 'hidden',
                  border: `3px solid ${entityColors.character}`,
                  boxShadow: theme.shadows.xl,
                  transition: `all ${theme.other?.transitions?.durationStandard || 250}ms ${theme.other?.transitions?.easingStandard || 'ease-in-out'}`
                }}
              >
                <MediaThumbnail
                  entityType="character"
                  entityId={character.id}
                  entityName={character.name}
                  allowCycling={false}
                  maxWidth="200px"
                  maxHeight="280px"
                />
              </Box>
            </Box>

            <Stack gap={theme.spacing.md} style={{ flex: 1, minWidth: '280px' }} justify="space-between">
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
                  <Badge size="lg" variant="light" c={textColors.arc} style={{
                    fontSize: fontSize.xs,
                    fontWeight: 600,
                    background: getAlphaColor(entityColors.arc, 0.2),
                    border: `1px solid ${getAlphaColor(entityColors.arc, 0.4)}`
                  }}>
                    {arcs.length} Story Arcs
                  </Badge>
                  <Badge size="lg" variant="light" c={textColors.gamble} style={{
                    fontSize: fontSize.xs,
                    fontWeight: 600,
                    background: getAlphaColor(entityColors.gamble, 0.2),
                    border: `1px solid ${getAlphaColor(entityColors.gamble, 0.4)}`
                  }}>
                    {gambles.length} Gambles
                  </Badge>
                  <Badge size="lg" variant="light" c={textColors.character} style={{
                    fontSize: fontSize.xs,
                    fontWeight: 600,
                    background: getAlphaColor(entityColors.character, 0.2),
                    border: `1px solid ${getAlphaColor(entityColors.character, 0.4)}`
                  }}>
                    {events.length} Events
                  </Badge>
                  <Badge size="lg" variant="light" c={textColors.quote} style={{
                    fontSize: fontSize.xs,
                    fontWeight: 600,
                    background: getAlphaColor(entityColors.quote, 0.2),
                    border: `1px solid ${getAlphaColor(entityColors.quote, 0.4)}`
                  }}>
                    {quotes.length} Quotes
                  </Badge>
                  <Badge size="lg" variant="light" c={textColors.guide} style={{
                    fontSize: fontSize.xs,
                    fontWeight: 600,
                    background: getAlphaColor(entityColors.guide, 0.2),
                    border: `1px solid ${getAlphaColor(entityColors.guide, 0.4)}`
                  }}>
                    {guides.length} Guides
                  </Badge>
                </Group>
              </Stack>
            </Stack>
          </Group>
        </Box>
      </Card>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
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
            <Tabs.Tab value="timeline" leftSection={<Calendar size={16} />} disabled={events.length === 0}>
              Timeline
            </Tabs.Tab>
            <Tabs.Tab value="media" leftSection={<BookOpen size={16} />}>Media</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="overview" pt={theme.spacing.md}>
            <Stack gap={theme.spacing.lg}>
              {/* Character Description Section */}
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

              {/* Character Relationships */}
              <CharacterRelationships
                characterId={character.id}
                characterName={character.name}
              />

              {/* Organization Memberships */}
              <Card withBorder radius="lg" shadow="lg" style={getCardStyles(theme, entityColors.organization)}>
                <Stack gap={theme.spacing.md} p={theme.spacing.md}>
                  <Group gap={theme.spacing.sm}>
                    <Building2 size={20} color={entityColors.organization} />
                    <Title order={4} c={textColors.primary}>Organizations</Title>
                  </Group>
                  <CharacterOrganizationMemberships
                    characterId={character.id}
                    characterName={character.name}
                  />
                </Stack>
              </Card>

              {/* Related Story Arcs */}
              {arcs.length > 0 && (
                <Card withBorder radius="lg" shadow="lg" style={getCardStyles(theme, entityColors.arc)}>
                  <Stack gap={theme.spacing.md} p={theme.spacing.md}>
                    <Group justify="space-between" align="center">
                      <Group gap={theme.spacing.sm}>
                        <BookOpen size={20} color={entityColors.arc} />
                        <Title order={4} c={textColors.arc}>Related Story Arcs</Title>
                      </Group>
                      <Button
                        component={Link}
                        href={`/arcs?character=${character.name}`}
                        variant="outline"
                        c={entityColors.arc}
                        size="sm"
                        radius="xl"
                        style={{
                          fontWeight: 600,
                          border: `2px solid ${entityColors.arc}`,
                          transition: `all ${theme.other?.transitions?.durationShort || 200}ms ease`
                        }}
                      >
                        View All ({arcs.length})
                      </Button>
                    </Group>
                    <Stack gap={theme.spacing.sm}>
                      {arcs.slice(0, 4).map((arc) => (
                        <Paper key={arc.id} withBorder radius="lg" p={theme.spacing.md} shadow="md" className="hoverable-paper" style={{
                          border: `1px solid ${getAlphaColor(entityColors.arc, 0.3)}`
                        }}>
                          <Group justify="space-between" align="flex-start">
                            <Box style={{ flex: 1 }}>
                              <Text
                                component={Link}
                                href={`/arcs/${arc.id}`}
                                fw={600}
                                size="sm"
                                c={textColors.arc}
                                style={{ textDecoration: 'none' }}
                              >
                                {arc.name}
                              </Text>
                              {arc.description && (
                                <Text size="xs" c={textColors.tertiary} lineClamp={2} mt={spacing.xs}>
                                  {arc.description}
                                </Text>
                              )}
                            </Box>
                            <Badge c={entityColors.arc} variant="outline" size="xs">
                              Arc {(arc as Arc & { order?: number }).order ?? "N/A"}
                            </Badge>
                          </Group>
                        </Paper>
                      ))}
                    </Stack>
                  </Stack>
                </Card>
              )}

              {/* Related Gambles */}
              {gambles.length > 0 && (
                <Card withBorder radius="lg" shadow="lg" style={getCardStyles(theme, entityColors.gamble)}>
                  <Stack gap={theme.spacing.md} p={theme.spacing.md}>
                    <Group justify="space-between" align="center">
                      <Group gap={theme.spacing.sm}>
                        <Crown size={20} color={entityColors.gamble} />
                        <Title order={4} c={textColors.gamble}>Related Gambles</Title>
                      </Group>
                      <Button
                        component={Link}
                        href={`/gambles?character=${character.name}`}
                        variant="outline"
                        c={entityColors.gamble}
                        size="sm"
                        radius="xl"
                      >
                        View All ({gambles.length})
                      </Button>
                    </Group>
                    <Stack gap={theme.spacing.sm}>
                      {gambles.slice(0, 4).map((gamble) => (
                        <Paper key={gamble.id} withBorder radius="lg" p={theme.spacing.md} shadow="md" className="hoverable-paper" style={{
                          border: `1px solid ${getAlphaColor(entityColors.gamble, 0.3)}`
                        }}>
                          <TimelineSpoilerWrapper chapterNumber={gamble.chapterId ?? undefined}>
                            <Group justify="space-between" align="flex-start">
                              <Box style={{ flex: 1 }}>
                                <Text
                                  component={Link}
                                  href={`/gambles/${gamble.id}`}
                                  fw={600}
                                  size="sm"
                                  c={textColors.gamble}
                                  style={{ textDecoration: 'none' }}
                                >
                                  {gamble.name}
                                </Text>
                                {gamble.description && (
                                  <Text size="xs" c={textColors.tertiary} lineClamp={2} mt={spacing.xs}>
                                    {gamble.description}
                                  </Text>
                                )}
                              </Box>
                              {gamble.chapterId && (
                                <Badge c={entityColors.gamble} variant="outline" size="xs">
                                  Ch. {gamble.chapterId}
                                </Badge>
                              )}
                            </Group>
                          </TimelineSpoilerWrapper>
                        </Paper>
                      ))}
                    </Stack>
                  </Stack>
                </Card>
              )}

              {/* Memorable Quotes */}
              {quotes.length > 0 && (
                <Card withBorder radius="lg" shadow="lg" style={getCardStyles(theme, entityColors.quote)}>
                  <Stack gap={theme.spacing.md} p={theme.spacing.md}>
                    <Group justify="space-between" align="center">
                      <Group gap={theme.spacing.sm}>
                        <BookOpen size={20} color={entityColors.quote} />
                        <Title order={4} c={textColors.quote}>Memorable Quotes</Title>
                      </Group>
                      <Button
                        component={Link}
                        href={`/quotes?characterId=${character.id}`}
                        variant="outline"
                        c={entityColors.quote}
                        size="sm"
                        radius="xl"
                      >
                        View All ({quotes.length})
                      </Button>
                    </Group>

                    <Stack gap={theme.spacing.sm}>
                      {quotes.slice(0, 3).map((quote) => (
                        <Paper key={quote.id} withBorder radius="lg" p={theme.spacing.md} shadow="md" className="hoverable-paper" style={{
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
                      ))}
                    </Stack>
                  </Stack>
                </Card>
              )}

              {/* Community Guides */}
              {guides.length > 0 && (
                <Card withBorder radius="lg" shadow="lg" style={getCardStyles(theme, entityColors.guide)}>
                  <Stack gap={theme.spacing.md} p={theme.spacing.md}>
                    <Group justify="space-between" align="center">
                      <Group gap={theme.spacing.sm}>
                        <BookOpen size={20} color={entityColors.guide} />
                        <Title order={4} c={textColors.guide}>Community Guides</Title>
                      </Group>
                      <Button
                        component={Link}
                        href={`/guides?character=${character.name}`}
                        variant="outline"
                        c={entityColors.guide}
                        size="sm"
                        radius="xl"
                      >
                        View All ({guides.length})
                      </Button>
                    </Group>

                    <Stack gap={theme.spacing.sm}>
                      {guides.slice(0, 4).map((guide) => (
                        <Paper key={guide.id} withBorder radius="lg" p={theme.spacing.md} shadow="md" className="hoverable-paper" style={{
                          border: `1px solid ${getAlphaColor(entityColors.guide, 0.3)}`
                        }}>
                          <Stack gap={spacing.xs}>
                            <Text
                              component={Link}
                              href={`/guides/${guide.id}`}
                              fw={600}
                              size="sm"
                              c={textColors.guide}
                              style={{ textDecoration: 'none' }}
                              lineClamp={2}
                            >
                              {guide.title}
                            </Text>
                            <Group gap={theme.spacing.xs} align="center">
                              <User size={12} color={textColors.tertiary} />
                              <Text size="xs" c={textColors.tertiary}>
                                By {guide.author?.username ?? 'Unknown'}
                              </Text>
                            </Group>
                          </Stack>
                        </Paper>
                      ))}
                    </Stack>
                  </Stack>
                </Card>
              )}
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
                  />
                </Stack>
              </Card>
            </Stack>
          </Tabs.Panel>
        </Tabs>
      </Card>

    </motion.div>
    </Stack>
    </Container>
    </Box>
  )
}
