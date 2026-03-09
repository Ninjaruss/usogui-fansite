'use client'

import React, { useEffect, useState } from 'react'
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
  textColors,
  headerColors,
  getAlphaColor,
  fontSize,
  setTabAccentColors,
  backgroundStyles,
  getCardStyles
} from '../../../lib/mantine-theme'
import { Users, Shield, Image as ImageIcon } from 'lucide-react'
import Link from 'next/link'
import EnhancedSpoilerMarkdown from '../../../components/EnhancedSpoilerMarkdown'
import { motion } from 'motion/react'
import { pageEnter } from '../../../lib/motion-presets'
import MediaGallery from '../../../components/MediaGallery'
import { BreadcrumbNav, createEntityBreadcrumbs } from '../../../components/Breadcrumb'
import { DetailPageHeader } from '../../../components/layouts/DetailPageHeader'
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
      {/* Breadcrumb Navigation */}
      <BreadcrumbNav
        items={createEntityBreadcrumbs('organization', initialOrganization.name)}
        entityType="organization"
      />

      {/* Enhanced Organization Header */}
      <DetailPageHeader
        entityType="organization"
        entityId={initialOrganization.id}
        entityName={initialOrganization.name}
      >
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
      </DetailPageHeader>

      <motion.div {...pageEnter}>
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
            <Tabs.Tab value="media" leftSection={<ImageIcon size={16} />}>Media</Tabs.Tab>
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
