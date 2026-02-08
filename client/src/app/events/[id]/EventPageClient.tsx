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
  fontSize,
  setTabAccentColors,
  backgroundStyles,
  getCardStyles
} from '../../../lib/mantine-theme'
import { CalendarSearch, BookOpen, Dice6, Users, Tag, Image as ImageIcon, Edit } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '../../../providers/AuthProvider'
import EnhancedSpoilerMarkdown from '../../../components/EnhancedSpoilerMarkdown'
import { motion } from 'motion/react'
import { usePageView } from '../../../hooks/usePageView'
import TimelineSpoilerWrapper from '../../../components/TimelineSpoilerWrapper'
import MediaGallery from '../../../components/MediaGallery'
import MediaThumbnail from '../../../components/MediaThumbnail'
import { BreadcrumbNav, createEntityBreadcrumbs } from '../../../components/Breadcrumb'
import type { Event } from '../../../types'

interface EventPageClientProps {
  initialEvent: Event
}

export default function EventPageClient({ initialEvent }: EventPageClientProps) {
  const theme = useMantineTheme()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<string>('overview')

  usePageView('event', initialEvent.id.toString(), true)

  // Check if current user can edit this event
  const canEdit = user &&
    initialEvent.createdBy?.id === user.id &&
    (initialEvent.status === 'pending' || initialEvent.status === 'rejected')
  const isRejected = initialEvent.status === 'rejected'

  // Set tab accent colors for event entity
  useEffect(() => {
    setTabAccentColors('event')
  }, [])

  // Use consistent theme colors
  const entityColors = {
    event: getEntityThemeColor(theme, 'event'),
    character: getEntityThemeColor(theme, 'character'),
    arc: getEntityThemeColor(theme, 'arc'),
    gamble: getEntityThemeColor(theme, 'gamble'),
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
          {/* Breadcrumb Navigation */}
          <BreadcrumbNav
            items={createEntityBreadcrumbs('event', initialEvent.title)}
            entityType="event"
          />

          {/* Enhanced Event Header */}
          <Card
            withBorder
            radius="lg"
            shadow="lg"
            p={0}
            style={{
              ...getCardStyles(theme, entityColors.event),
              border: `2px solid ${entityColors.event}`,
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
              <Group gap={theme.spacing.lg} align="stretch" wrap="nowrap">
                <Box style={{ flexShrink: 0 }}>
                  <Box
                    style={{
                      width: '200px',
                      height: '280px',
                      borderRadius: theme.radius.md,
                      overflow: 'hidden',
                      border: `3px solid ${entityColors.event}`,
                      boxShadow: theme.shadows.xl,
                      transition: `all ${theme.other?.transitions?.durationStandard || 250}ms ${theme.other?.transitions?.easingStandard || 'ease-in-out'}`
                    }}
                  >
                    <MediaThumbnail
                      entityType="event"
                      entityId={initialEvent.id}
                      entityName={initialEvent.title}
                      allowCycling={false}
                      maxWidth="200px"
                      maxHeight="280px"
                    />
                  </Box>
                </Box>

                <Stack gap={theme.spacing.md} style={{ flex: 1, minWidth: 0, height: '100%' }} justify="space-between">
                  <Stack gap={theme.spacing.sm}>
                    <Group gap={theme.spacing.sm} align="center">
                      <CalendarSearch size={28} color={entityColors.event} />
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
                        {initialEvent.title}
                      </Title>
                    </Group>

                    {/* Chapter Badge and Edit Button */}
                    <Group gap={theme.spacing.sm}>
                      <Badge
                        variant="filled"
                        size="lg"
                        radius="md"
                        style={{
                          background: `linear-gradient(135deg, ${entityColors.event} 0%, ${entityColors.event}dd 100%)`,
                          border: `1px solid ${entityColors.event}`,
                          boxShadow: theme.shadows.md,
                          fontSize: fontSize.sm,
                          color: textColors.primary,
                          fontWeight: 600
                        }}
                      >
                        Chapter {initialEvent.chapterNumber}
                      </Badge>
                      {canEdit && (
                        <Button
                          component={Link}
                          href={`/submit-event?edit=${initialEvent.id}`}
                          variant="outline"
                          size="sm"
                          radius="xl"
                          leftSection={<Edit size={14} />}
                          color={isRejected ? 'orange' : 'gray'}
                          style={{
                            fontWeight: 600
                          }}
                        >
                          {isRejected ? 'Edit & Resubmit' : 'Edit'}
                        </Button>
                      )}
                    </Group>
                  </Stack>

                  <Stack gap={theme.spacing.md} style={{ flex: 1, justifyContent: 'center' }}>
                    {/* Content Stats */}
                    <Group gap={theme.spacing.md} wrap="wrap" mt={theme.spacing.sm}>
                      {initialEvent.arc && (
                        <Badge
                          component={Link}
                          href={`/arcs/${initialEvent.arc.id}`}
                          size="lg"
                          variant="light"
                          c={textColors.arc}
                          style={{
                            fontSize: fontSize.xs,
                            fontWeight: 600,
                            background: getAlphaColor(entityColors.arc, 0.2),
                            border: `1px solid ${getAlphaColor(entityColors.arc, 0.4)}`,
                            textDecoration: 'none',
                            cursor: 'pointer'
                          }}
                        >
                          {initialEvent.arc.name}
                        </Badge>
                      )}
                      {initialEvent.gamble && (
                        <Badge
                          component={Link}
                          href={`/gambles/${initialEvent.gamble.id}`}
                          size="lg"
                          variant="light"
                          c={textColors.gamble}
                          style={{
                            fontSize: fontSize.xs,
                            fontWeight: 600,
                            background: getAlphaColor(entityColors.gamble, 0.2),
                            border: `1px solid ${getAlphaColor(entityColors.gamble, 0.4)}`,
                            textDecoration: 'none',
                            cursor: 'pointer'
                          }}
                        >
                          {initialEvent.gamble.name}
                        </Badge>
                      )}
                      <Badge
                        size="lg"
                        variant="light"
                        c={textColors.event}
                        leftSection={<Tag size={12} />}
                        style={{
                          fontSize: fontSize.xs,
                          fontWeight: 600,
                          background: getAlphaColor(entityColors.event, 0.2),
                          border: `1px solid ${getAlphaColor(entityColors.event, 0.4)}`
                        }}
                      >
                        {initialEvent.status === 'pending' ? 'Unverified' : initialEvent.status === 'approved' ? 'Verified' : initialEvent.status}
                      </Badge>
                      {initialEvent.characters && initialEvent.characters.length > 0 && (
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
                          {initialEvent.characters.length} Characters
                        </Badge>
                      )}
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
                className="event-tabs"
              >
                <Tabs.List>
                  <Tabs.Tab value="overview" leftSection={<CalendarSearch size={16} />}>Overview</Tabs.Tab>
                  <Tabs.Tab value="media" leftSection={<ImageIcon size={16} />}>Media</Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="overview" pt={theme.spacing.md}>
                  <Stack gap={theme.spacing.lg}>
                    {/* Event Description Section */}
                    <Card withBorder radius="lg" shadow="lg" style={getCardStyles(theme, entityColors.event)}>
                      <Stack gap={theme.spacing.md} p={theme.spacing.lg}>
                        <Group gap={theme.spacing.sm} align="center">
                          <CalendarSearch size={24} color={entityColors.event} />
                          <Title order={3} c={headerColors.h3}>Description</Title>
                        </Group>
                        <TimelineSpoilerWrapper chapterNumber={initialEvent.chapterNumber}>
                          <Box style={{ lineHeight: 1.6 }}>
                            <EnhancedSpoilerMarkdown
                              content={initialEvent.description}
                              className="event-description"
                              enableEntityEmbeds
                              compactEntityCards={false}
                            />
                          </Box>
                        </TimelineSpoilerWrapper>
                      </Stack>
                    </Card>

                    {/* Related Gamble Section */}
                    {initialEvent.gamble && (
                      <Card withBorder radius="lg" shadow="lg" style={getCardStyles(theme, entityColors.gamble)}>
                        <Stack gap={theme.spacing.md} p={theme.spacing.lg}>
                          <Group justify="space-between" align="center">
                            <Group gap={theme.spacing.sm}>
                              <Dice6 size={24} color={entityColors.gamble} />
                              <Title order={3} c={headerColors.h3}>Related Gamble</Title>
                            </Group>
                            <Button
                              component={Link}
                              href={`/gambles/${initialEvent.gamble.id}`}
                              variant="outline"
                              c={entityColors.gamble}
                              size="sm"
                              radius="xl"
                              style={{
                                fontWeight: 600,
                                border: `2px solid ${entityColors.gamble}`,
                                transition: `all ${theme.other?.transitions?.durationShort || 200}ms ease`
                              }}
                            >
                              View Gamble
                            </Button>
                          </Group>
                          <TimelineSpoilerWrapper chapterNumber={initialEvent.chapterNumber}>
                            <Paper withBorder radius="lg" p={theme.spacing.md} shadow="md" style={{
                              border: `1px solid ${getAlphaColor(entityColors.gamble, 0.3)}`
                            }}>
                              <Stack gap={theme.spacing.sm}>
                                <Text fw={600} c={textColors.gamble}>{initialEvent.gamble.name}</Text>
                                <Stack gap={4}>
                                  <Text size="sm" fw={600} c={textColors.secondary}>Rules</Text>
                                  <EnhancedSpoilerMarkdown
                                    content={initialEvent.gamble.rules}
                                    className="event-gamble-rules"
                                    enableEntityEmbeds
                                    compactEntityCards
                                  />
                                </Stack>
                                {initialEvent.gamble.winCondition && (
                                  <Stack gap={4}>
                                    <Text size="sm" fw={600} c={textColors.secondary}>Win Condition</Text>
                                    <EnhancedSpoilerMarkdown
                                      content={initialEvent.gamble.winCondition}
                                      className="event-gamble-win-condition"
                                      enableEntityEmbeds
                                      compactEntityCards
                                    />
                                  </Stack>
                                )}
                              </Stack>
                            </Paper>
                          </TimelineSpoilerWrapper>
                        </Stack>
                      </Card>
                    )}

                    {/* Featured Characters Section */}
                    {initialEvent.characters && initialEvent.characters.length > 0 && (
                      <Card withBorder radius="lg" shadow="lg" style={getCardStyles(theme, entityColors.character)}>
                        <Stack gap={theme.spacing.md} p={theme.spacing.md}>
                          <Group justify="space-between" align="center">
                            <Group gap={theme.spacing.sm}>
                              <Users size={20} color={entityColors.character} />
                              <Title order={4} c={textColors.character}>Featured Characters</Title>
                            </Group>
                          </Group>
                          <Group gap={theme.spacing.sm} wrap="wrap">
                            {initialEvent.characters.map((character) => (
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

                    {/* Tags Section */}
                    {initialEvent.tags && initialEvent.tags.length > 0 && (
                      <Card withBorder radius="lg" shadow="lg" style={getCardStyles(theme, entityColors.organization)}>
                        <Stack gap={theme.spacing.md} p={theme.spacing.md}>
                          <Group gap={theme.spacing.sm}>
                            <Tag size={20} color={entityColors.organization} />
                            <Title order={4} c={textColors.organization}>Tags</Title>
                          </Group>
                          <Group gap="xs" wrap="wrap">
                            {initialEvent.tags.map((tag) => (
                              <Badge
                                key={tag.id}
                                variant="outline"
                                radius="sm"
                                c={entityColors.organization}
                                style={{ borderColor: entityColors.organization }}
                              >
                                {tag.name}
                              </Badge>
                            ))}
                          </Group>
                        </Stack>
                      </Card>
                    )}

                    {/* Related Arc Section */}
                    {initialEvent.arc && (
                      <Card withBorder radius="lg" shadow="lg" style={getCardStyles(theme, entityColors.arc)}>
                        <Stack gap={theme.spacing.md} p={theme.spacing.md}>
                          <Group justify="space-between" align="center">
                            <Group gap={theme.spacing.sm}>
                              <BookOpen size={20} color={entityColors.arc} />
                              <Title order={4} c={textColors.arc}>Story Arc</Title>
                            </Group>
                            <Button
                              component={Link}
                              href={`/arcs/${initialEvent.arc.id}`}
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
                              View Arc
                            </Button>
                          </Group>
                          <Text c={textColors.arc} fw={500}>{initialEvent.arc.name}</Text>
                        </Stack>
                      </Card>
                    )}
                  </Stack>
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
                            href={`/media?ownerType=event&ownerId=${initialEvent.id}`}
                            variant="outline"
                            c={entityColors.media}
                            size="sm"
                            radius="xl"
                          >
                            View All
                          </Button>
                        </Group>
                        <MediaGallery
                          ownerType="event"
                          ownerId={initialEvent.id}
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
