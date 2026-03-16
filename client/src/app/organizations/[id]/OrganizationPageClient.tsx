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
import { Users, Shield, Image as ImageIcon, Crown } from 'lucide-react'
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
                <Card withBorder radius="lg" shadow="lg" padding={0} style={getCardStyles(theme, entityColors.organization)}>
                  <Box style={{ height: 3, borderRadius: '6px 6px 0 0', background: `linear-gradient(90deg, ${entityColors.organization}, transparent 70%)` }} />
                  <Box p="lg">
                    <Group gap={10} mb={14} align="center">
                      <Box style={{ width: 28, height: 28, borderRadius: 6, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: getAlphaColor(entityColors.organization, 0.15), border: `1px solid ${getAlphaColor(entityColors.organization, 0.30)}` }}>
                        <Shield size={16} color={entityColors.organization} />
                      </Box>
                      <Text style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: entityColors.organization, opacity: 0.85 }}>Organization Overview</Text>
                      <Box style={{ flex: 1, height: 1, background: `linear-gradient(to right, ${getAlphaColor(entityColors.organization, 0.20)}, transparent)` }} />
                    </Group>
                    {initialOrganization.description ? (
                      <TimelineSpoilerWrapper chapterNumber={1}>
                        <Box style={{ fontSize: 14, lineHeight: 1.6 }}>
                          <EnhancedSpoilerMarkdown content={initialOrganization.description} enableEntityEmbeds compactEntityCards={false} />
                        </Box>
                      </TimelineSpoilerWrapper>
                    ) : (
                      <Text size="sm" c={textColors.tertiary} style={{ fontStyle: 'italic', textAlign: 'center', padding: theme.spacing.xl }}>
                        No description available for this organization yet. Check back later for updates!
                      </Text>
                    )}
                  </Box>
                </Card>
              </Stack>

              {/* Aside column */}
              <Stack gap={theme.spacing.sm}>
                {/* Details card */}
                <Card withBorder radius="lg" shadow="md" padding={0} style={getCardStyles(theme, entityColors.organization)}>
                  <Box style={{ height: 3, borderRadius: '6px 6px 0 0', background: `linear-gradient(90deg, ${entityColors.organization}, transparent 70%)` }} />
                  <Box p="md">
                    <Group gap={10} mb={14} align="center">
                      <Text style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: entityColors.organization, opacity: 0.85 }}>Details</Text>
                      <Box style={{ flex: 1, height: 1, background: `linear-gradient(to right, ${getAlphaColor(entityColors.organization, 0.20)}, transparent)` }} />
                    </Group>
                    <Box style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #161616' }}>
                      <Box style={{ width: 24, height: 24, borderRadius: 5, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: getAlphaColor(entityColors.organization, 0.10), border: `1px solid ${getAlphaColor(entityColors.organization, 0.20)}` }}>
                        <Users size={14} color={entityColors.character} />
                      </Box>
                      <Text style={{ fontSize: 11, color: '#555', flex: 1 }}>Members</Text>
                      <Text style={{ fontSize: 12, fontWeight: 700, color: entityColors.character }}>{initialMembers?.length ?? 0}</Text>
                    </Box>
                    <Box style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0' }}>
                      <Box style={{ width: 24, height: 24, borderRadius: 5, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: getAlphaColor(entityColors.organization, 0.10), border: `1px solid ${getAlphaColor(entityColors.organization, 0.20)}` }}>
                        <Crown size={14} color={entityColors.gamble} />
                      </Box>
                      <Text style={{ fontSize: 11, color: '#555', flex: 1 }}>Gambles</Text>
                      <Text style={{ fontSize: 12, fontWeight: 700, color: entityColors.gamble }}>{initialGambles?.length ?? 0}</Text>
                    </Box>
                  </Box>
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
              <Card withBorder radius="lg" shadow="lg" padding={0} style={{ background: backgroundStyles.card, border: `1px solid ${getAlphaColor(getEntityThemeColor(theme, 'media'), 0.4)}` }}>
                <Box style={{ height: 3, borderRadius: '6px 6px 0 0', background: `linear-gradient(90deg, ${getEntityThemeColor(theme, 'media')}, transparent 70%)` }} />
                <Box p="md">
                  <Group justify="space-between" align="center" mb={14}>
                    <Group gap={10} align="center">
                      <Box style={{ width: 28, height: 28, borderRadius: 6, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: getAlphaColor(getEntityThemeColor(theme, 'media'), 0.15), border: `1px solid ${getAlphaColor(getEntityThemeColor(theme, 'media'), 0.30)}` }}>
                        <ImageIcon size={16} color={getEntityThemeColor(theme, 'media')} />
                      </Box>
                      <Text style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: getEntityThemeColor(theme, 'media'), opacity: 0.85 }}>
                        Media Gallery
                      </Text>
                    </Group>
                    <Button component={Link} href={`/media?ownerType=organization&ownerId=${initialOrganization.id}`} variant="outline" c={getEntityThemeColor(theme, 'media')} size="sm" radius="xl">
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
                </Box>
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
