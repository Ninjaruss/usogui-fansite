'use client'

import React from 'react'
import {
  Anchor,
  Badge,
  Box,
  Button,
  Card,
  Container,
  Divider,
  Grid,
  Group,
  Stack,
  Text,
  Title,
  rem,
  useMantineTheme
} from '@mantine/core'
import { getEntityThemeColor, semanticColors, textColors } from '../../../lib/mantine-theme'
import { ArrowLeft, Users, Shield, Crown } from 'lucide-react'
import Link from 'next/link'
import EnhancedSpoilerMarkdown from '../../../components/EnhancedSpoilerMarkdown'
import { motion } from 'motion/react'
import MediaThumbnail from '../../../components/MediaThumbnail'
import MediaGallery from '../../../components/MediaGallery'
import { usePageView } from '../../../hooks/usePageView'
import TimelineSpoilerWrapper from '../../../components/TimelineSpoilerWrapper'

interface Organization {
  id: number
  name: string
  description?: string
  createdAt: string
  updatedAt: string
  characters?: Array<{
    id: number
    name: string
    alternateNames?: string[]
    firstAppearanceChapter?: number
  }>
}

interface OrganizationPageClientProps {
  initialOrganization: Organization
  initialMembers: any[]
  initialEvents: any[]
  initialGambles: any[]
}

export default function OrganizationPageClient({
  initialOrganization,
  initialMembers,
  initialEvents: _initialEvents,
  initialGambles: _initialGambles
}: OrganizationPageClientProps) {
  const theme = useMantineTheme()
  const accentRed = getEntityThemeColor(theme, 'organization')
  const accentPurple = getEntityThemeColor(theme, 'organization')
  const dimmedColor = textColors.secondary
  const headingGradient = `linear-gradient(135deg, ${theme.white} 0%, ${accentPurple} 100%)`

  usePageView('organization', initialOrganization.id.toString(), true)

  return (
    <Container size="lg" py="xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Button component={Link} href="/organizations" variant="light" c={getEntityThemeColor(theme, 'gamble')} leftSection={<ArrowLeft size={16} />} mb="md">
          Back to Organizations
        </Button>

        <Card className="gambling-card" shadow="lg" radius="md" withBorder p="xl" mb="xl">
          <Grid align="center" gutter="xl">
            <Grid.Col span={{ base: 12, md: 4, lg: 3 }}>
              <Box pos="relative" ta="center">
                <MediaThumbnail
                  entityType="organization"
                  entityId={initialOrganization.id}
                  entityName={initialOrganization.name}
                  allowCycling
                  maxWidth={280}
                  maxHeight={320}
                  className="organization-thumbnail"
                />
              </Box>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 8, lg: 9 }}>
              <Title
                order={1}
                component="h1"
                style={{
                  marginBottom: theme.spacing.sm,
                  fontWeight: 700,
                  backgroundImage: headingGradient,
                  WebkitBackgroundClip: 'text',
                  color: 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  gap: rem(12)
                }}
              >
                <Shield size={40} color={accentPurple} />
                {initialOrganization.name}
              </Title>
            </Grid.Col>
          </Grid>
        </Card>

        <Grid gutter="xl">
          <Grid.Col span={{ base: 12, md: 8 }}>
            {initialOrganization.description && (
              <Card className="gambling-card" shadow="lg" radius="md" withBorder p="xl">
                <Stack gap="md">
                  <Title order={3} component="h2">
                    About {initialOrganization.name}
                  </Title>
                  <TimelineSpoilerWrapper chapterNumber={1}>
                    <EnhancedSpoilerMarkdown
                      content={initialOrganization.description}
                      className="organization-description"
                      enableEntityEmbeds
                      compactEntityCards={false}
                    />
                  </TimelineSpoilerWrapper>
                </Stack>
              </Card>
            )}

            {initialMembers.length > 0 && (
              <Card className="gambling-card" shadow="lg" radius="md" withBorder p="xl" mt="xl">
                <Stack gap="lg">
                  <Group justify="space-between" align="center">
                    <Group gap="sm" align="center">
                      <Users size={24} color={accentRed} />
                      <Title order={3} size="h4" c={accentRed}>
                        Organization Members ({initialMembers.length})
                      </Title>
                    </Group>
                    <Button
                      component={Link}
                      href={`/characters?organization=${encodeURIComponent(initialOrganization.name)}`}
                      variant="outline"
                      size="sm"
                      c={getEntityThemeColor(theme, 'gamble')}
                      radius="xl"
                    >
                      View All Characters
                    </Button>
                  </Group>

                  <Grid gutter="lg">
                    {initialMembers.map((member) => (
                      <Grid.Col key={member.id} span={{ base: 12, sm: 6, md: 4 }}>
                        <motion.div whileHover={{ y: -4, transition: { duration: 0.2 } }}>
                          <Card withBorder radius="md" shadow="md" style={{ overflow: 'hidden' }}>
                            <Box
                              style={{
                                position: 'relative',
                                width: '100%',
                                height: 200,
                                overflow: 'hidden'
                              }}
                            >
                              <MediaThumbnail
                                entityType="character"
                                entityId={member.id}
                                entityName={member.name}
                                allowCycling={false}
                                maxWidth="100%"
                                maxHeight="100%"
                                className="character-thumbnail"
                              />
                            </Box>
                            <Stack gap="sm" px="md" py="md">
                              <Anchor
                                component={Link}
                                href={`/characters/${member.id}`}
                                fw={600}
                                c={accentRed}
                                size="lg"
                                style={{ textDecoration: 'none' }}
                              >
                                {member.name}
                              </Anchor>

                              {member.alternateNames && member.alternateNames.length > 0 && (
                                <Stack gap={4}>
                                  <Text size="xs" c={dimmedColor} fw={500}>
                                    Also known as:
                                  </Text>
                                  <Group gap={6} wrap="wrap">
                                    {member.alternateNames.slice(0, 2).map((name: string, index: number) => (
                                      <Badge
                                        key={index}
                                        variant="outline"
                                        c={getEntityThemeColor(theme, 'media')}
                                        size="sm"
                                        radius="xl"
                                        style={{ borderColor: getEntityThemeColor(theme, 'media') }}
                                      >
                                        {name}
                                      </Badge>
                                    ))}
                                    {member.alternateNames.length > 2 && (
                                      <Badge
                                        variant="outline"
                                        size="sm"
                                        radius="xl"
                                        c={getEntityThemeColor(theme, 'media')}
                                        style={{ opacity: 0.75, borderColor: getEntityThemeColor(theme, 'media') }}
                                      >
                                        +{member.alternateNames.length - 2} more
                                      </Badge>
                                    )}
                                  </Group>
                                </Stack>
                              )}

                              {member.firstAppearanceChapter && (
                                <Group gap="xs" align="center">
                                  <Text size="xs" c={dimmedColor}>
                                    First appeared in Chapter {member.firstAppearanceChapter}
                                  </Text>
                                </Group>
                              )}
                            </Stack>
                          </Card>
                        </motion.div>
                      </Grid.Col>
                    ))}
                  </Grid>
                </Stack>
              </Card>
            )}

            {initialMembers.length === 0 && (
              <Card className="gambling-card" shadow="lg" radius="md" withBorder p="xl" mt="xl">
                <Stack align="center" gap="sm">
                  <Users size={48} color={dimmedColor} style={{ opacity: 0.5 }} />
                  <Title order={4} c={dimmedColor}>
                    No Known Members
                  </Title>
                  <Text size="sm" c={dimmedColor} ta="center" maw={400}>
                    This organization currently has no associated character members in our database. Member relationships may be added
                    as the story progresses.
                  </Text>
                </Stack>
              </Card>
            )}

            <Card className="gambling-card" shadow="lg" radius="md" withBorder p="xl" mt="xl">
              <Stack gap="md">
                <Title order={3} component="h2">
                  Media Gallery
                </Title>
                <MediaGallery
                  ownerType="organization"
                  ownerId={initialOrganization.id}
                  purpose="gallery"
                  showTitle={false}
                  compactMode={false}
                  showFilters
                  allowMultipleTypes
                />
              </Stack>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 4 }}>
            <Card className="gambling-card" shadow="lg" radius="md" withBorder p="xl">
              <Stack gap="md">
                <Title order={4}>Organization Details</Title>

                <Stack gap={4}>
                  <Text size="sm" c={dimmedColor}>
                    Organization Name
                  </Text>
                  <Text size="md">{initialOrganization.name}</Text>
                </Stack>

                <Stack gap={4}>
                  <Text size="sm" c={dimmedColor}>
                    Known Members
                  </Text>
                  <Text size="md">
                    {initialMembers.length} {initialMembers.length === 1 ? 'member' : 'members'}
                  </Text>
                </Stack>

                <Divider my="sm" color="rgba(225, 29, 72, 0.3)" />

                <Title order={4}>Quick Links</Title>

                <Stack gap="sm">
                  <Button
                    component={Link}
                    href="/characters"
                    variant="outline"
                    size="sm"
                    fullWidth
                    leftSection={<Users size={16} />}
                  >
                    Browse Characters
                  </Button>
                  <Button
                    component={Link}
                    href="/events"
                    variant="outline"
                    size="sm"
                    fullWidth
                    leftSection={<Crown size={16} />}
                  >
                    Browse Events
                  </Button>
                  <Button
                    component={Link}
                    href="/gambles"
                    variant="outline"
                    size="sm"
                    fullWidth
                    leftSection={<Shield size={16} />}
                  >
                    Browse Gambles
                  </Button>
                </Stack>
              </Stack>
            </Card>
          </Grid.Col>
        </Grid>
      </motion.div>
    </Container>
  )
}
