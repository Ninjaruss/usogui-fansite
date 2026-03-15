'use client'

import React, { useEffect, useState } from 'react'
import {
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
import { RelatedContentSection } from '../../../components/layouts/RelatedContentSection'
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
  initialGambles
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
        stats={[
          { value: initialMembers?.length ?? 0, label: 'Members' },
          { value: initialGambles?.length ?? 0, label: 'Gambles' },
        ]}
      />

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
            <Box
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1fr) 260px',
                gap: 12,
                alignItems: 'start',
              }}
              className="detail-editorial-grid"
            >
              {/* Main column */}
              <Stack gap={theme.spacing.md}>
                {/* Organization Description Section */}
                {initialOrganization.description && (
                  <Card withBorder radius="lg" shadow="lg" style={{
                    ...getCardStyles(theme, entityColors.organization),
                    borderLeft: `3px solid ${entityColors.organization}`,
                  }}>
                    <Stack gap={theme.spacing.md} p={theme.spacing.lg}>
                      <Group justify="flex-start" gap="sm" style={{ marginBottom: 12, marginTop: 24 }}>
                        <Box style={{ height: 1, width: 40, background: `linear-gradient(to right, transparent, ${entityColors.organization}40)` }} />
                        <Text className="eyebrow-label" style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.68rem' }}>
                          ORGANIZATION OVERVIEW
                        </Text>
                        <Box style={{ height: 1, flex: 1, maxWidth: 120, background: `linear-gradient(to left, transparent, ${entityColors.organization}20)` }} />
                      </Group>
                      <TimelineSpoilerWrapper chapterNumber={1}>
                        <Box style={{ fontSize: 14, lineHeight: 1.6 }}>
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
                  <Card withBorder radius="lg" shadow="lg" style={{
                    ...getCardStyles(theme, entityColors.organization),
                    borderLeft: `3px solid ${entityColors.organization}`,
                  }}>
                    <Stack gap={theme.spacing.md} p={theme.spacing.lg}>
                      <Group justify="flex-start" gap="sm" style={{ marginBottom: 12, marginTop: 24 }}>
                        <Box style={{ height: 1, width: 40, background: `linear-gradient(to right, transparent, ${entityColors.organization}40)` }} />
                        <Text className="eyebrow-label" style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.68rem' }}>
                          ORGANIZATION OVERVIEW
                        </Text>
                        <Box style={{ height: 1, flex: 1, maxWidth: 120, background: `linear-gradient(to left, transparent, ${entityColors.organization}20)` }} />
                      </Group>
                      <Text size="sm" c={textColors.tertiary} style={{ fontStyle: 'italic', textAlign: 'center', padding: theme.spacing.xl }}>
                        No description available for this organization yet. Check back later for updates!
                      </Text>
                    </Stack>
                  </Card>
                )}
              </Stack>

              {/* Aside column */}
              <Stack gap={theme.spacing.sm}>
                {/* Details card */}
                <Card radius="lg" shadow="md" style={{ background: '#111', border: '1px solid #1a1a1a' }}>
                  <Stack gap={theme.spacing.xs} p={theme.spacing.md}>
                    <Text style={{ fontSize: fontSize.xs, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#555', marginBottom: 4 }}>
                      Details
                    </Text>
                    <Group justify="space-between">
                      <Text size="xs" c={textColors.tertiary}>Members</Text>
                      <Text size="xs" style={{ color: entityColors.character, fontWeight: 600 }}>
                        {initialMembers?.length ?? 0}
                      </Text>
                    </Group>
                    <Group justify="space-between">
                      <Text size="xs" c={textColors.tertiary}>Gambles</Text>
                      <Text size="xs" style={{ color: entityColors.gamble, fontWeight: 600 }}>
                        {initialGambles?.length ?? 0}
                      </Text>
                    </Group>
                  </Stack>
                </Card>

                {/* Members compact list */}
                <RelatedContentSection
                  entityType="character"
                  title="Members"
                  items={initialMembers ?? []}
                  previewCount={4}
                  getKey={(m) => m.id}
                  variant="compact"
                  getLabel={(m) => m.name}
                  getHref={(m) => `/characters/${m.id}`}
                  itemDotColor={entityColors.character}
                />

                {/* Gambles compact list */}
                <RelatedContentSection
                  entityType="gamble"
                  title="Gambles"
                  items={initialGambles ?? []}
                  previewCount={4}
                  getKey={(g) => g.id}
                  variant="compact"
                  getLabel={(g) => g.name}
                  getHref={(g) => `/gambles/${g.id}`}
                  itemDotColor={entityColors.gamble}
                />
              </Stack>
            </Box>
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
