'use client'

import { Box, Container, Title, Text, Button, Group, Alert } from '@mantine/core'
import { useMantineTheme } from '@mantine/core'
import { CalendarSearch, Shield, FileText, MessageCircle, ExternalLink, Image, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { EnhancedSearchBar } from '../components/EnhancedSearchBar'
import { DynamicVolumeShowcase } from '../components/DynamicVolumeShowcase'
import { getActiveConfiguration } from '../lib/showcase-config'
import { FavoritesSection } from '../components/FavoritesSection'
import { LazySection } from '../components/LazySection'
import { useLandingData } from '../hooks/useLandingData'
import { motion } from 'motion/react'
import Script from 'next/script'
import { FAQ } from '@/components/FAQ'
import { textColors } from '../lib/mantine-theme'

export default function HomePage() {
  const theme = useMantineTheme()
  const { data: landingData, loading: landingLoading, error: landingError } = useLandingData()
  const showcaseConfig = getActiveConfiguration()



  // Structured data for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "L-File - Usogui Database",
    "alternateName": "L-File",
    "url": "https://l-file.com",
    "description": "The complete fan-made database for Usogui (Lie Eater) manga. Explore characters, story arcs, gambling mechanics, guides, and community content.",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://l-file.com/search?q={search_term_string}"
      },
      "query-input": "required name=search_term_string"
    },
    "mainEntity": {
      "@type": "CreativeWork",
      "@id": "https://l-file.com",
      "name": "Usogui Database",
      "description": "Comprehensive database for the Usogui manga series",
      "genre": ["Manga", "Database", "Fan Resource"],
      "about": {
        "@type": "ComicSeries",
        "name": "Usogui",
        "alternateName": "Lie Eater",
        "creator": {
          "@type": "Person",
          "name": "Sako Toshio"
        }
      }
    }
  }

  return (
    <>
      <Script
        id="structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <Container
        size="lg"
        style={{
          paddingTop: 'clamp(1rem, 3vw, 1.5rem)',
          paddingBottom: '2rem',
          paddingLeft: 'clamp(1rem, 4vw, 2rem)',
          paddingRight: 'clamp(1rem, 4vw, 2rem)'
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
        {/* Hero Section */}
        <Box style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <Title
            order={1}
            style={{
              fontWeight: 'bold',
              background: `linear-gradient(45deg, ${textColors.character}, ${textColors.arc})`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
              marginBottom: '1rem'
            }}
          >
            Welcome to the L-File
          </Title>
          <Text size="xl" c="dimmed" style={{ marginBottom: '2rem' }}>
            The ultimate database for the gambling manga masterpiece - Usogui (Lie Eater)
          </Text>

          <Box style={{ maxWidth: 600, margin: '0 auto 2.5rem auto' }}>
            <EnhancedSearchBar trendingData={landingData?.trending} />
          </Box>

        </Box>

        {/* Featured Volume Covers Section */}
        <LazySection minHeight={450} delay={100}>
          <DynamicVolumeShowcase
            volumes={showcaseConfig.volumes}
            layout={showcaseConfig.layout}
            animations={showcaseConfig.animations}
          />
        </LazySection>


        {/* Community Favorites Section */}
        <LazySection minHeight={400} delay={200}>
          <FavoritesSection />
        </LazySection>


        <LazySection minHeight={300} delay={400}>
          <FAQ />
        </LazySection>

        {/* Discord CTA Section */}
        <Box style={{ marginBottom: '2rem' }} />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.1 }}
        >
          <Box
            style={{
              textAlign: 'center',
              padding: 'clamp(1.5rem, 4vw, 2.5rem)',
              background: `linear-gradient(135deg, #5865F2 0%, #4752C4 50%, #3C45A5 100%)`,
              borderRadius: '1rem',
              border: `2px solid rgba(255, 255, 255, 0.1)`,
              color: 'white',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <Group justify="center" gap="md" style={{ marginBottom: '1rem' }}>
              <MessageCircle className="w-8 h-8" />
              <Title order={2} style={{ fontWeight: 'bold', color: '#ffffff' }}>
                Join Our Discord Community
              </Title>
            </Group>
            <Text size="xl" style={{ opacity: 0.9, marginBottom: '2rem', fontWeight: 'normal' }} c="#ffffff">
              Connect with fellow Usogui fans, discuss theories, share insights, and stay updated on the latest content
            </Text>

            {/* Database Stats */}
            {landingError ? (
              <Alert
                icon={<AlertCircle size={16} />}
                color="yellow"
                variant="light"
                radius="md"
                style={{ marginBottom: '2rem', maxWidth: 400, margin: '0 auto 2rem auto' }}
              >
                <Text size="sm">Stats temporarily unavailable. Join our community!</Text>
              </Alert>
            ) : landingData?.stats && (
              <Box style={{ marginBottom: '2rem' }}>
                <Text size="lg" fw={600} style={{ textAlign: 'center', marginBottom: '1.5rem', color: '#ffffff' }}>
                  Discover Rich Content & Community Insights
                </Text>
                <Group justify="center" gap="xl" style={{ flexWrap: 'wrap' }}>
                  {landingData.stats.totalGuides && (
                    <Box style={{ textAlign: 'center' }}>
                      <Text size="xl" fw={700} style={{ color: textColors.guide, marginBottom: '0.25rem' }}>
                        {landingData.stats.totalGuides.toLocaleString()}
                      </Text>
                      <Group justify="center" gap={4}>
                        <FileText size={14} style={{ color: textColors.tertiary }} />
                        <Text size="sm" style={{ color: textColors.tertiary }}>
                          Guides
                        </Text>
                      </Group>
                    </Box>
                  )}
                  {landingData.stats.totalEvents && (
                    <Box style={{ textAlign: 'center' }}>
                      <Text size="xl" fw={700} style={{ color: textColors.event, marginBottom: '0.25rem' }}>
                        {landingData.stats.totalEvents.toLocaleString()}
                      </Text>
                      <Group justify="center" gap={4}>
                        <CalendarSearch size={14} style={{ color: textColors.tertiary }} />
                        <Text size="sm" style={{ color: textColors.tertiary }}>
                          Events
                        </Text>
                      </Group>
                    </Box>
                  )}
                  {landingData.stats.totalMedia && (
                    <Box style={{ textAlign: 'center' }}>
                      <Text size="xl" fw={700} style={{ color: textColors.media, marginBottom: '0.25rem' }}>
                        {landingData.stats.totalMedia.toLocaleString()}
                      </Text>
                      <Group justify="center" gap={4}>
                        <Image size={14} style={{ color: textColors.tertiary }} />
                        <Text size="sm" style={{ color: textColors.tertiary }}>
                          Media
                        </Text>
                      </Group>
                    </Box>
                  )}
                  {landingData.stats.totalUsers && (
                    <Box style={{ textAlign: 'center' }}>
                      <Text size="xl" fw={700} style={{ color: textColors.character, marginBottom: '0.25rem' }}>
                        {landingData.stats.totalUsers.toLocaleString()}
                      </Text>
                      <Group justify="center" gap={4}>
                        <Shield size={14} style={{ color: textColors.tertiary }} />
                        <Text size="sm" style={{ color: textColors.tertiary }}>
                          Members
                        </Text>
                      </Group>
                    </Box>
                  )}
                </Group>
              </Box>
            )}

            <Button
              component="a"
              href="https://discord.gg/JXeRhV2qpY"
              target="_blank"
              rel="noopener noreferrer"
              variant="filled"
              size="lg"
              leftSection={<MessageCircle className="w-5 h-5" />}
              rightSection={<ExternalLink className="w-4 h-4" />}
              style={{
                backgroundColor: 'white',
                color: '#5865F2',
                fontWeight: 'bold',
                fontSize: '1.1rem',
                padding: '0.75rem 2rem',
                borderRadius: '0.5rem',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                transition: 'all 0.3s ease'
              }}
            >
              Join Discord Server
            </Button>
          </Box>
        </motion.div>
      </motion.div>
    </Container>
    </>
  )
}