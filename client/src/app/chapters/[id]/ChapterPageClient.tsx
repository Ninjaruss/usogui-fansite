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
  Tooltip,
  useMantineTheme
} from '@mantine/core'
import {
  getEntityThemeColor,
  textColors,
  headerColors,
  getAlphaColor,
  fontSize,
  setTabAccentColors,
  backgroundStyles,
  getCardStyles
} from '../../../lib/mantine-theme'
import { BookOpen, Hash, FileText, Users, MessageSquareQuote, CalendarSearch, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'motion/react'
import TimelineSpoilerWrapper from '../../../components/TimelineSpoilerWrapper'
import { usePageView } from '../../../hooks/usePageView'
import { BreadcrumbNav, createEntityBreadcrumbs } from '../../../components/Breadcrumb'
import type { Chapter as ChapterResource } from '../../../types'
import { AnnotationSection } from '../../../components/annotations'
import { EntityQuickActions } from '../../../components/EntityQuickActions'
import { useAuth } from '../../../providers/AuthProvider'
import { AnnotationOwnerType } from '../../../types'

interface Character {
  id: number
  name: string
}

interface Event {
  id: number
  title: string
  description: string
}

interface Quote {
  id: number
  text: string
  pageNumber?: number
  character?: Character
}

type Chapter = ChapterResource & {
  chapterNumber?: number | null
}

interface ChapterPageClientProps {
  initialChapter: Chapter
  initialEvents?: Event[]
  initialQuotes?: Quote[]
  initialCharacters?: Character[]
}

export default function ChapterPageClient({
  initialChapter,
  initialEvents = [],
  initialQuotes = [],
  initialCharacters = []
}: ChapterPageClientProps) {
  const theme = useMantineTheme()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<string>('overview')

  usePageView('chapter', initialChapter.id.toString(), true)

  // Set tab accent colors for chapter entity
  useEffect(() => {
    setTabAccentColors('chapter')
  }, [])

  // Use consistent theme colors
  const entityColors = {
    chapter: getEntityThemeColor(theme, 'chapter'),
    character: getEntityThemeColor(theme, 'character'),
    event: getEntityThemeColor(theme, 'event'),
    quote: getEntityThemeColor(theme, 'quote'),
    volume: getEntityThemeColor(theme, 'volume')
  }

  return (
    <Box style={{
      backgroundColor: backgroundStyles.page(theme),
      minHeight: '100vh',
      color: textColors.primary
    }}>
      <Container size="lg" py="md" style={{ backgroundColor: backgroundStyles.container(theme) }}>
        <Stack gap={theme.spacing.md}>
          {/* Breadcrumb Navigation */}
          <BreadcrumbNav
            items={createEntityBreadcrumbs('chapter', initialChapter.title || `Chapter ${initialChapter.number}`)}
            entityType="chapter"
          />

          {/* Enhanced Chapter Header */}
          <Card
            withBorder
            radius="lg"
            shadow="lg"
            p={0}
            style={{
              ...getCardStyles(theme, entityColors.chapter),
              border: `2px solid ${entityColors.chapter}`,
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
              <Stack gap={theme.spacing.md} style={{ flex: 1, minWidth: 0 }} justify="space-between">
                  <Stack gap={theme.spacing.sm}>
                    <Group gap={theme.spacing.sm} align="center">
                      <BookOpen size={28} color={entityColors.chapter} />
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
                        Chapter {initialChapter.number}
                      </Title>
                    </Group>

                    {initialChapter.title && (
                      <Text size="lg" c={textColors.secondary} fw={500}>
                        {initialChapter.title}
                      </Text>
                    )}

                    {/* Volume Badge */}
                    {initialChapter.volume && (
                      <Badge
                        component={Link}
                        href={`/volumes/${initialChapter.volume.id}`}
                        variant="filled"
                        size="lg"
                        radius="md"
                        style={{
                          background: `linear-gradient(135deg, ${entityColors.volume} 0%, ${entityColors.volume}dd 100%)`,
                          border: `1px solid ${entityColors.volume}`,
                          boxShadow: theme.shadows.md,
                          fontSize: fontSize.sm,
                          color: textColors.primary,
                          fontWeight: 600,
                          alignSelf: 'flex-start',
                          textDecoration: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        Volume {initialChapter.volume.number}
                        {initialChapter.volume.title ? `: ${initialChapter.volume.title}` : ''}
                      </Badge>
                    )}
                  </Stack>

                  <Stack gap={theme.spacing.md} style={{ flex: 1, justifyContent: 'center' }}>
                    {/* Content Stats */}
                    <Group gap={theme.spacing.md} wrap="wrap" mt={theme.spacing.sm}>
                      <Badge
                        size="lg"
                        variant="light"
                        c={textColors.chapter}
                        leftSection={<Hash size={14} />}
                        style={{
                          fontSize: fontSize.xs,
                          fontWeight: 600,
                          background: getAlphaColor(entityColors.chapter, 0.2),
                          border: `1px solid ${getAlphaColor(entityColors.chapter, 0.4)}`
                        }}
                      >
                        Chapter #{initialChapter.number}
                      </Badge>
                      {Array.isArray(initialEvents) && initialEvents.length > 0 && (
                        <Badge
                          size="lg"
                          variant="light"
                          c={textColors.event}
                          style={{
                            fontSize: fontSize.xs,
                            fontWeight: 600,
                            background: getAlphaColor(entityColors.event, 0.2),
                            border: `1px solid ${getAlphaColor(entityColors.event, 0.4)}`
                          }}
                        >
                          {initialEvents.length} Events
                        </Badge>
                      )}
                      {Array.isArray(initialQuotes) && initialQuotes.length > 0 && (
                        <Badge
                          size="lg"
                          variant="light"
                          c={textColors.quote}
                          style={{
                            fontSize: fontSize.xs,
                            fontWeight: 600,
                            background: getAlphaColor(entityColors.quote, 0.2),
                            border: `1px solid ${getAlphaColor(entityColors.quote, 0.4)}`
                          }}
                        >
                          {initialQuotes.length} Quotes
                        </Badge>
                      )}
                      {initialCharacters.length > 0 && (
                        <Badge
                          size="lg"
                          variant="light"
                          c={textColors.character}
                          style={{
                            fontSize: fontSize.xs,
                            fontWeight: 600,
                            background: getAlphaColor(entityColors.character, 0.2),
                            border: `1px solid ${getAlphaColor(entityColors.character, 0.4)}`
                          }}
                        >
                          {initialCharacters.length} Characters
                        </Badge>
                      )}
                    </Group>
                  </Stack>
                </Stack>
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
                className="chapter-tabs"
              >
                <Tabs.List>
                  <Tabs.Tab value="overview" leftSection={<BookOpen size={16} />}>Overview</Tabs.Tab>
                  <Tooltip
                    label="No events available for this chapter"
                    disabled={Array.isArray(initialEvents) && initialEvents.length > 0}
                    position="bottom"
                    withArrow
                  >
                    <Tabs.Tab
                      value="events"
                      leftSection={<CalendarSearch size={16} />}
                      rightSection={Array.isArray(initialEvents) && initialEvents.length > 0 ? <Badge size="xs" variant="light" c={entityColors.event}>{initialEvents.length}</Badge> : null}
                      disabled={!Array.isArray(initialEvents) || initialEvents.length === 0}
                    >
                      Events
                    </Tabs.Tab>
                  </Tooltip>
                  <Tooltip
                    label="No quotes available for this chapter"
                    disabled={Array.isArray(initialQuotes) && initialQuotes.length > 0}
                    position="bottom"
                    withArrow
                  >
                    <Tabs.Tab
                      value="quotes"
                      leftSection={<MessageSquareQuote size={16} />}
                      rightSection={Array.isArray(initialQuotes) && initialQuotes.length > 0 ? <Badge size="xs" variant="light" c={entityColors.quote}>{initialQuotes.length}</Badge> : null}
                      disabled={!Array.isArray(initialQuotes) || initialQuotes.length === 0}
                    >
                      Quotes
                    </Tabs.Tab>
                  </Tooltip>
                  <Tabs.Tab value="annotations" leftSection={<MessageSquare size={16} />}>Annotations</Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="overview" pt={theme.spacing.md}>
                  <Stack gap={theme.spacing.lg}>
                    {/* Chapter Summary Section */}
                    <Card withBorder radius="lg" shadow="lg" style={getCardStyles(theme, entityColors.chapter)}>
                      <Stack gap={theme.spacing.md} p={theme.spacing.lg}>
                        <Group gap={theme.spacing.sm} align="center">
                          <FileText size={24} color={entityColors.chapter} />
                          <Title order={3} c={headerColors.h3}>Chapter Summary</Title>
                        </Group>
                        {(initialChapter.description || initialChapter.summary) ? (
                          <TimelineSpoilerWrapper chapterNumber={initialChapter.number}>
                            <Box style={{ lineHeight: 1.6 }}>
                              <Text size="md">{initialChapter.description || initialChapter.summary}</Text>
                            </Box>
                          </TimelineSpoilerWrapper>
                        ) : (
                          <Text size="sm" c={textColors.tertiary} style={{ fontStyle: 'italic', textAlign: 'center', padding: theme.spacing.xl }}>
                            No summary available for this chapter yet. Check back later for updates!
                          </Text>
                        )}
                      </Stack>
                    </Card>

                    {/* Featured Characters Section */}
                    {initialCharacters.length > 0 && (
                      <Card withBorder radius="lg" shadow="lg" style={getCardStyles(theme, entityColors.character)}>
                        <Stack gap={theme.spacing.md} p={theme.spacing.md}>
                          <Group gap={theme.spacing.sm}>
                            <Users size={20} color={entityColors.character} />
                            <Title order={4} c={textColors.character}>Featured Characters</Title>
                          </Group>
                          <Group gap={theme.spacing.sm} wrap="wrap">
                            {initialCharacters.map((character) => (
                              <Badge
                                key={character.id}
                                component={Link}
                                href={`/characters/${character.id}`}
                                variant="light"
                                size="lg"
                                radius="md"
                                c={textColors.character}
                                style={{
                                  background: getAlphaColor(entityColors.character, 0.2),
                                  border: `1px solid ${getAlphaColor(entityColors.character, 0.4)}`,
                                  textDecoration: 'none',
                                  cursor: 'pointer',
                                  transition: `all ${theme.other?.transitions?.durationShort || 200}ms ease`
                                }}
                              >
                                {character.name}
                              </Badge>
                            ))}
                          </Group>
                        </Stack>
                      </Card>
                    )}

                    {/* No Characters Info */}
                    {initialCharacters.length === 0 && (
                      <Card withBorder radius="lg" shadow="lg" style={getCardStyles(theme, entityColors.character)}>
                        <Stack align="center" gap="sm" p={theme.spacing.xl}>
                          <Users size={48} color={textColors.secondary} style={{ opacity: 0.5 }} />
                          <Title order={4} c={textColors.secondary}>
                            No Character Data
                          </Title>
                          <Text size="sm" c={textColors.tertiary} ta="center" maw={400}>
                            Character information isn't available for this chapter yet.
                          </Text>
                        </Stack>
                      </Card>
                    )}
                  </Stack>
                </Tabs.Panel>

                <Tabs.Panel value="events" pt={theme.spacing.md}>
                  <Stack gap={theme.spacing.lg}>
                    <Card withBorder radius="lg" shadow="lg" style={getCardStyles(theme, entityColors.event)}>
                      <Stack gap={theme.spacing.md} p={theme.spacing.md}>
                        <Group gap={theme.spacing.sm}>
                          <CalendarSearch size={20} color={entityColors.event} />
                          <Title order={4} c={textColors.event}>Chapter Events</Title>
                        </Group>
                        <Stack gap={theme.spacing.sm}>
                          {Array.isArray(initialEvents) && initialEvents.map((event) => (
                            <Paper
                              key={event.id}
                              withBorder
                              radius="lg"
                              p={theme.spacing.md}
                              shadow="md"
                              style={{
                                border: `1px solid ${getAlphaColor(entityColors.event, 0.3)}`,
                                transition: `all ${theme.other?.transitions?.durationShort || 200}ms ease`
                              }}
                            >
                              <Stack gap={4}>
                                <Text
                                  component={Link}
                                  href={`/events/${event.id}`}
                                  fw={600}
                                  c={textColors.event}
                                  style={{ textDecoration: 'none' }}
                                >
                                  {event.title}
                                </Text>
                                <Text size="sm" c={textColors.tertiary} lineClamp={2}>
                                  {event.description}
                                </Text>
                              </Stack>
                            </Paper>
                          ))}
                        </Stack>
                      </Stack>
                    </Card>
                  </Stack>
                </Tabs.Panel>

                <Tabs.Panel value="quotes" pt={theme.spacing.md}>
                  <Stack gap={theme.spacing.lg}>
                    <Card withBorder radius="lg" shadow="lg" style={getCardStyles(theme, entityColors.quote)}>
                      <Stack gap={theme.spacing.md} p={theme.spacing.md}>
                        <Group gap={theme.spacing.sm}>
                          <MessageSquareQuote size={20} color={entityColors.quote} />
                          <Title order={4} c={textColors.quote}>Memorable Quotes</Title>
                        </Group>
                        <Stack gap={theme.spacing.sm}>
                          {Array.isArray(initialQuotes) && initialQuotes.map((quote) => (
                            <Paper
                              key={quote.id}
                              withBorder
                              radius="lg"
                              p={theme.spacing.md}
                              shadow="md"
                              style={{
                                border: `1px solid ${getAlphaColor(entityColors.quote, 0.3)}`,
                                transition: `all ${theme.other?.transitions?.durationShort || 200}ms ease`
                              }}
                            >
                              <Stack gap={theme.spacing.sm}>
                                <Text size="sm" style={{ fontStyle: 'italic', lineHeight: 1.5 }}>
                                  &ldquo;{quote.text}&rdquo;
                                </Text>
                                <Group gap="xs" align="center">
                                  {quote.character && (
                                    <Badge
                                      component={Link}
                                      href={`/characters/${quote.character.id}`}
                                      c={entityColors.character}
                                      variant="light"
                                      radius="sm"
                                      size="sm"
                                      style={{
                                        textDecoration: 'none',
                                        cursor: 'pointer',
                                        backgroundColor: getAlphaColor(entityColors.character, 0.2),
                                        border: `1px solid ${getAlphaColor(entityColors.character, 0.4)}`
                                      }}
                                    >
                                      — {quote.character.name}
                                    </Badge>
                                  )}
                                  {quote.pageNumber && (
                                    <Badge c={entityColors.quote} variant="outline" radius="sm" size="xs">
                                      p.{quote.pageNumber}
                                    </Badge>
                                  )}
                                </Group>
                              </Stack>
                            </Paper>
                          ))}
                        </Stack>
                      </Stack>
                    </Card>
                  </Stack>
                </Tabs.Panel>

                <Tabs.Panel value="annotations" pt={theme.spacing.md}>
                  <AnnotationSection
                    ownerType={AnnotationOwnerType.CHAPTER}
                    ownerId={initialChapter.id}
                    userProgress={user?.userProgress}
                    currentUserId={user?.id}
                    isAuthenticated={!!user}
                  />
                </Tabs.Panel>
              </Tabs>
            </Card>

          </motion.div>
        </Stack>

        {/* Quick Actions for authenticated users */}
        <EntityQuickActions
          entityType="chapter"
          entityId={initialChapter.id}
          isAuthenticated={!!user}
        />
      </Container>
    </Box>
  )
}
