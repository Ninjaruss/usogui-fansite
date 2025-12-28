'use client'

import React, { useEffect, useState } from 'react'
import {
  Badge,
  Box,
  Button,
  Card,
  Container,
  Grid,
  Group,
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
import { ArrowLeft, Users, Shield, Crown, Image as ImageIcon } from 'lucide-react'
import Link from 'next/link'
import EnhancedSpoilerMarkdown from '../../../components/EnhancedSpoilerMarkdown'
import { motion } from 'motion/react'
import MediaThumbnail from '../../../components/MediaThumbnail'
import MediaGallery from '../../../components/MediaGallery'
import { usePageView } from '../../../hooks/usePageView'
import TimelineSpoilerWrapper from '../../../components/TimelineSpoilerWrapper'
import OrganizationMembers from '../../../components/OrganizationMembers'

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
  const [activeTab, setActiveTab] = useState<string>('overview')
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  usePageView('organization', initialOrganization.id.toString(), true)

  // Set tab accent colors for organization entity
  useEffect(() => {
    setTabAccentColors('organization')
  }, [])

  if (!isClient) {
    return <Box py="md" c={textColors.primary}>Loading...</Box>
  }

  // Use consistent theme colors
  const entityColors = {
    organization: getEntityThemeColor(theme, 'organization'),
    character: getEntityThemeColor(theme, 'character'),
    gamble: getEntityThemeColor(theme, 'gamble'),
    media: getEntityThemeColor(theme, 'media')
  }

  return (
    <Box style={{
      backgroundColor: backgroundStyles.page(theme),
      minHeight: '100vh',
      color: textColors.primary
    }}>
    <Container size="lg" py="md" style={{ backgroundColor: backgroundStyles.container(theme) }}>
    <Stack gap={theme.spacing.md}>
      <Button
        component={Link}
        href="/organizations"
        variant="subtle"
        c={textColors.secondary}
        leftSection={<ArrowLeft size={18} />}
        mb="lg"
        style={{
          alignSelf: 'flex-start',
          color: textColors.secondary,
          '&:hover': {
            color: textColors.primary,
            backgroundColor: getAlphaColor(entityColors.organization, 0.1)
          }
        }}
      >
        Back to Organizations
      </Button>

      {/* Enhanced Organization Header */}
      <Card
        withBorder
        radius="lg"
        shadow="lg"
        p={0}
        style={{
          ...getCardStyles(theme, entityColors.organization),
          border: `2px solid ${entityColors.organization}`,
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
                  border: `3px solid ${entityColors.organization}`,
                  boxShadow: theme.shadows.xl,
                  transition: `all ${theme.other?.transitions?.durationStandard || 250}ms ${theme.other?.transitions?.easingStandard || 'ease-in-out'}`
                }}
              >
                <MediaThumbnail
                  entityType="organization"
                  entityId={initialOrganization.id}
                  entityName={initialOrganization.name}
                  allowCycling={false}
                  maxWidth="200px"
                  maxHeight="280px"
                />
              </Box>
            </Box>

            <Stack gap={theme.spacing.md} style={{ flex: 1, minWidth: 0, height: '100%' }} justify="space-between">
              <Stack gap={theme.spacing.sm}>
                <Group gap={theme.spacing.sm} align="center">
                  <Shield size={28} color={entityColors.organization} />
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
                    {initialOrganization.name}
                  </Title>
                </Group>
              </Stack>

              <Stack gap={theme.spacing.md} style={{ flex: 1, justifyContent: 'center' }}>
                {/* Content Stats */}
                <Group gap={theme.spacing.md} wrap="wrap" mt={theme.spacing.sm}>
                  <Badge size="lg" variant="light" c={textColors.character} style={{
                    fontSize: fontSize.xs,
                    fontWeight: 600,
                    background: getAlphaColor(entityColors.character, 0.2),
                    border: `1px solid ${getAlphaColor(entityColors.character, 0.4)}`
                  }}>
                    {initialMembers.length} Members
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
          className="organization-tabs"
        >
          <Tabs.List>
            <Tabs.Tab value="overview" leftSection={<Shield size={16} />}>Overview</Tabs.Tab>
            <Tabs.Tab value="members" leftSection={<Users size={16} />}>
              Members
            </Tabs.Tab>
            <Tabs.Tab value="media" leftSection={<Crown size={16} />}>Media</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="overview" pt={theme.spacing.md}>
            <Stack gap={theme.spacing.lg}>
              {/* Organization Description Section */}
              {initialOrganization.description && (
                <Card withBorder radius="lg" shadow="lg" style={getCardStyles(theme, entityColors.organization)}>
                  <Stack gap={theme.spacing.md} p={theme.spacing.lg}>
                    <Group gap={theme.spacing.sm} align="center">
                      <Shield size={24} color={entityColors.organization} />
                      <Title order={3} c={headerColors.h3}>About {initialOrganization.name}</Title>
                    </Group>
                    <TimelineSpoilerWrapper chapterNumber={1}>
                      <Box style={{ lineHeight: 1.6 }}>
                        <EnhancedSpoilerMarkdown
                          content={initialOrganization.description}
                          enableEntityEmbeds
                          compactEntityCards={false}
                        />
                      </Box>
                    </TimelineSpoilerWrapper>
                  </Stack>
                </Card>
              )}

              {!initialOrganization.description && (
                <Card withBorder radius="lg" shadow="lg" style={getCardStyles(theme, entityColors.organization)}>
                  <Stack gap={theme.spacing.md} p={theme.spacing.lg}>
                    <Group gap={theme.spacing.sm} align="center">
                      <Shield size={24} color={entityColors.organization} />
                      <Title order={3} c={headerColors.h3}>About {initialOrganization.name}</Title>
                    </Group>
                    <Text size="sm" c={textColors.tertiary} style={{ fontStyle: 'italic', textAlign: 'center', padding: theme.spacing.xl }}>
                      No description available for this organization yet. Check back later for updates!
                    </Text>
                  </Stack>
                </Card>
              )}

              {/* Organization Details */}
              <Card withBorder radius="lg" shadow="lg" style={getCardStyles(theme, entityColors.organization)}>
                <Stack gap={theme.spacing.md} p={theme.spacing.md}>
                  <Group gap={theme.spacing.sm}>
                    <Users size={20} color={entityColors.organization} />
                    <Title order={4} c={textColors.organization}>Organization Details</Title>
                  </Group>
                  <Grid gutter="md">
                    <Grid.Col span={6}>
                      <Stack gap={4}>
                        <Text size="sm" c={textColors.secondary}>
                          Organization Name
                        </Text>
                        <Text size="md">{initialOrganization.name}</Text>
                      </Stack>
                    </Grid.Col>
                    <Grid.Col span={6}>
                      <Stack gap={4}>
                        <Text size="sm" c={textColors.secondary}>
                          Known Members
                        </Text>
                        <Text size="md">
                          {initialMembers.length} {initialMembers.length === 1 ? 'member' : 'members'}
                        </Text>
                      </Stack>
                    </Grid.Col>
                  </Grid>
                </Stack>
              </Card>
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="members" pt={theme.spacing.md}>
            <OrganizationMembers organizationId={initialOrganization.id} />
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
                      href={`/media?ownerType=organization&ownerId=${initialOrganization.id}`}
                      variant="outline"
                      c={entityColors.media}
                      size="sm"
                      radius="xl"
                    >
                      View All
                    </Button>
                  </Group>
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
