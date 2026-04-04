'use client'

import { Box, Container, Title, Text, Button, Group, Skeleton, SimpleGrid } from '@mantine/core'
import { useMantineTheme } from '@mantine/core'
import { CalendarSearch, Shield, FileText, MessageCircle, ExternalLink, Image } from 'lucide-react'
import Link from 'next/link'
import { EnhancedSearchBar } from '../components/EnhancedSearchBar'
import { DynamicVolumeShowcase } from '../components/DynamicVolumeShowcase'
import type { VolumeShowcaseSlot } from '../lib/showcase-config'
import type { ShowcaseSlot } from '../types'
import { api } from '../lib/api'
import { RecentActivityFeed } from '../components/RecentActivityFeed'
import { FavoritesSection } from '../components/FavoritesSection'
import { LazySection } from '../components/LazySection'
import { useLandingData } from '../hooks/useLandingData'
import { motion } from 'motion/react'
import Script from 'next/script'
import { FAQ } from '@/components/FAQ'
import { DiagonalStripes, SuitWatermark } from '../components/decorative/MangaPatterns'
import { useState, useEffect } from 'react'

export default function HomePage() {
  const theme = useMantineTheme()
  const { data: landingData, loading: landingLoading, error: landingError } = useLandingData()

  const [showcaseSlots, setShowcaseSlots] = useState<VolumeShowcaseSlot[] | null>(null)

  useEffect(() => {
    async function loadShowcase() {
      try {
        const items = await api.getShowcaseReadyVolumes()
        if (items.length > 0) {
          setShowcaseSlots(
            items.map((slot: ShowcaseSlot) => ({
              primary: {
                id: slot.primary.volumeId,
                backgroundImage: slot.primary.backgroundUrl,
                popoutImage: slot.primary.popoutUrl,
                title: slot.primary.title,
              },
              secondary: slot.secondary ? {
                id: slot.secondary.volumeId,
                backgroundImage: slot.secondary.backgroundUrl,
                popoutImage: slot.secondary.popoutUrl,
                title: slot.secondary.title,
              } : undefined,
            }))
          )
        } else {
          setShowcaseSlots([])
        }
      } catch {
        setShowcaseSlots([])
      }
    }
    loadShowcase()
  }, [])



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
        <Box
          style={{
            textAlign: 'center',
            marginBottom: '3rem',
            position: 'relative',
            padding: 'clamp(3rem, 6vw, 5rem) 1rem',
            borderRadius: '1rem',
          }}
        >
          {/* Decorative layer — overflow hidden to clip bg effects to rounded box */}
          <Box aria-hidden="true" style={{ position: 'absolute', inset: 0, borderRadius: '1rem', overflow: 'hidden', pointerEvents: 'none' }}>
            {/* Radial red glow */}
            <Box style={{
              position: 'absolute', inset: 0,
              background: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(225,29,72,0.10) 0%, transparent 70%)',
            }} />
            {/* Manga texture overlays */}
            <Box className="manga-speed-lines" style={{ color: 'rgba(225,29,72,0.6)' }} />
            <Box className="manga-halftone" style={{ color: 'rgba(255,255,255,1)' }} />
          </Box>

          {/* Content above overlays */}
          <Box style={{ position: 'relative', zIndex: 1 }}>

            {/* Eyebrow + suit divider */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.1 }}>
              <Text style={{
                fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.22em',
                textTransform: 'uppercase', color: '#e11d48', marginBottom: '0.75rem',
                fontFamily: 'var(--font-noto-sans)',
              }}>
                The Usogui Database
              </Text>
            </motion.div>

            {/* Large display title in OPTI Goudy */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.25 }}>
              <Title order={1} style={{
                fontFamily: 'var(--font-opti-goudy-text)',
                fontSize: 'clamp(4rem, 10vw, 7rem)',
                fontWeight: 400, lineHeight: 0.95, color: '#ffffff',
                letterSpacing: '-0.02em', marginBottom: '1.25rem',
                textShadow: '0 2px 40px rgba(225,29,72,0.25), 0 0 80px rgba(225,29,72,0.08)',
              }}>
                L-File
              </Title>
            </motion.div>

            {/* Subtitle + search bar */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }}>
              <Text size="md" style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '2rem', letterSpacing: '0.04em' }}>
                A fan-built database dedicated to Usogui (Lie Eater)
              </Text>
              <Box style={{
                maxWidth: 600, margin: '0 auto',
                padding: '0.25rem', borderRadius: '0.75rem',
                background: 'rgba(10,10,10,0.6)', backdropFilter: 'blur(8px)',
                border: '1px solid rgba(225,29,72,0.15)',
              }}>
                <EnhancedSearchBar trendingData={landingData?.trending} />
              </Box>
            </motion.div>

          </Box>
        </Box>

        {/* Featured Volume Covers Section */}
        {showcaseSlots && showcaseSlots.length > 0 && (
          <LazySection minHeight={360} delay={100}>
            <DynamicVolumeShowcase
              slots={showcaseSlots}
            />
          </LazySection>
        )}

        <Box aria-hidden="true" style={{ height: 1, margin: '0.5rem 0 2.5rem 0', background: 'linear-gradient(to right, transparent, rgba(225,29,72,0.2), transparent)' }} />

        {/* Community Favorites Section */}
        <LazySection minHeight={400} delay={200}>
          <FavoritesSection />
        </LazySection>

        <Box aria-hidden="true" style={{ height: 1, margin: '0.5rem 0 2.5rem 0', background: 'linear-gradient(to right, transparent, rgba(225,29,72,0.2), transparent)' }} />

        <LazySection minHeight={300} delay={400}>
          <FAQ />
        </LazySection>

        <Box aria-hidden="true" style={{ height: 1, margin: '0.5rem 0 2.5rem 0', background: 'linear-gradient(to right, transparent, rgba(225,29,72,0.2), transparent)' }} />

        {/* Site Statistics Section */}
        {!landingError && (
          <Box style={{ marginBottom: '2rem' }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.0 }}
            >
              {/* Section label with gradient lines */}
              <Group justify="center" gap="sm" style={{ marginBottom: '1.5rem' }}>
                <Box style={{ height: 1, flex: 1, maxWidth: 120, background: 'linear-gradient(to right, transparent, rgba(225,29,72,0.3))' }} />
                <Text style={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' }}>
                  Site Statistics
                </Text>
                <Box style={{ height: 1, flex: 1, maxWidth: 120, background: 'linear-gradient(to left, transparent, rgba(225,29,72,0.3))' }} />
              </Group>

              {landingLoading ? (
                <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
                  {[1, 2, 3, 4].map((i) => (
                    <Box key={i} style={{ padding: '1.25rem', borderRadius: '0.75rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
                      <Skeleton height={36} width={60} mb={8} radius="sm" mx="auto" />
                      <Skeleton height={14} width={50} radius="sm" mx="auto" />
                    </Box>
                  ))}
                </SimpleGrid>
              ) : (
                <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
                  {landingData?.stats?.totalGuides && (
                    <Box className="manga-panel-border" style={{
                      position: 'relative', padding: '1.5rem 1rem', borderRadius: '0.75rem', textAlign: 'center',
                      background: 'rgba(81, 207, 102, 0.05)', border: '1px solid rgba(81, 207, 102, 0.25)',
                      color: '#51cf66',
                    }}>
                      <Box style={{ marginBottom: '0.5rem', opacity: 0.7 }}>
                        <FileText size={20} style={{ color: '#51cf66' }} />
                      </Box>
                      <Text style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontFamily: 'var(--font-opti-goudy-text)', fontWeight: 400, color: '#51cf66', lineHeight: 1, marginBottom: '0.35rem' }}>
                        {landingData.stats.totalGuides.toLocaleString()}
                      </Text>
                      <Text style={{ fontSize: '0.75rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' }}>
                        Guides
                      </Text>
                    </Box>
                  )}
                  {landingData?.stats?.totalEvents && (
                    <Box className="manga-panel-border" style={{
                      position: 'relative', padding: '1.5rem 1rem', borderRadius: '0.75rem', textAlign: 'center',
                      background: 'rgba(249, 115, 22, 0.05)', border: '1px solid rgba(249, 115, 22, 0.25)',
                      color: '#f97316',
                    }}>
                      <Box style={{ marginBottom: '0.5rem', opacity: 0.7 }}>
                        <CalendarSearch size={20} style={{ color: '#f97316' }} />
                      </Box>
                      <Text style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontFamily: 'var(--font-opti-goudy-text)', fontWeight: 400, color: '#f97316', lineHeight: 1, marginBottom: '0.35rem' }}>
                        {landingData.stats.totalEvents.toLocaleString()}
                      </Text>
                      <Text style={{ fontSize: '0.75rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' }}>
                        Events
                      </Text>
                    </Box>
                  )}
                  {landingData?.stats?.totalMedia && (
                    <Box className="manga-panel-border" style={{
                      position: 'relative', padding: '1.5rem 1rem', borderRadius: '0.75rem', textAlign: 'center',
                      background: 'rgba(168, 85, 247, 0.05)', border: '1px solid rgba(168, 85, 247, 0.25)',
                      color: '#a855f7',
                    }}>
                      <Box style={{ marginBottom: '0.5rem', opacity: 0.7 }}>
                        <Image size={20} style={{ color: '#a855f7' }} />
                      </Box>
                      <Text style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontFamily: 'var(--font-opti-goudy-text)', fontWeight: 400, color: '#a855f7', lineHeight: 1, marginBottom: '0.35rem' }}>
                        {landingData.stats.totalMedia.toLocaleString()}
                      </Text>
                      <Text style={{ fontSize: '0.75rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' }}>
                        Media
                      </Text>
                    </Box>
                  )}
                  {landingData?.stats?.totalUsers && (
                    <Box className="manga-panel-border" style={{
                      position: 'relative', padding: '1.5rem 1rem', borderRadius: '0.75rem', textAlign: 'center',
                      background: 'rgba(77, 171, 247, 0.05)', border: '1px solid rgba(77, 171, 247, 0.25)',
                      color: '#4dabf7',
                    }}>
                      <Box style={{ marginBottom: '0.5rem', opacity: 0.7 }}>
                        <Shield size={20} style={{ color: '#4dabf7' }} />
                      </Box>
                      <Text style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontFamily: 'var(--font-opti-goudy-text)', fontWeight: 400, color: '#4dabf7', lineHeight: 1, marginBottom: '0.35rem' }}>
                        {landingData.stats.totalUsers.toLocaleString()}
                      </Text>
                      <Text style={{ fontSize: '0.75rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' }}>
                        Members
                      </Text>
                    </Box>
                  )}
                </SimpleGrid>
              )}
            </motion.div>
          </Box>
        )}

        {/* Recent Wiki Activity */}
        <LazySection minHeight={200} delay={1050}>
          <Box
            style={{
              padding: 'clamp(1.5rem, 3vw, 2rem)',
              background: theme.colors.dark?.[8] ?? '#1a1a1a',
              borderRadius: '1rem',
              border: `1px solid ${theme.colors.dark?.[6] ?? '#333'}`,
              marginBottom: '2rem',
            }}
          >
            <RecentActivityFeed limit={5} showHeader showViewAll />
          </Box>
        </LazySection>

        <Box aria-hidden="true" style={{ height: 1, margin: '0.5rem 0 2.5rem 0', background: 'linear-gradient(to right, transparent, rgba(225,29,72,0.2), transparent)' }} />

        {/* Fluxer CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.1 }}
        >
          <Box
            className="manga-panel-border"
            style={{
              position: 'relative',
              overflow: 'hidden',
              textAlign: 'center',
              padding: 'clamp(2rem, 5vw, 3rem) clamp(1.5rem, 4vw, 2.5rem)',
              background: 'rgba(225, 29, 72, 0.06)',
              borderRadius: '1rem',
              border: '1px solid rgba(225, 29, 72, 0.3)',
              color: '#e11d48',
            }}
          >
            <DiagonalStripes color="rgba(225, 29, 72, 0.04)" width={1} gap={8} />
            <SuitWatermark suit="club" color="#e11d48" size={180} opacity={0.04} position="top-right" />

            <Box style={{ position: 'relative', zIndex: 1 }}>
              <Text style={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(225,29,72,0.7)', marginBottom: '0.75rem' }}>
                Community
              </Text>
              <Title order={2} style={{
                fontFamily: 'var(--font-opti-goudy-text)',
                fontSize: 'clamp(1.75rem, 4vw, 2.75rem)',
                fontWeight: 400, color: '#ffffff', marginBottom: '1rem',
                textShadow: '0 2px 20px rgba(225,29,72,0.2)',
              }}>
                Join Our Fluxer Community
              </Title>
              <Text size="lg" style={{ color: 'rgba(255,255,255,0.65)', maxWidth: 540, margin: '0 auto 2rem auto', lineHeight: 1.6 }}>
                Discuss gambles, character analysis, and ongoing reads with other Usogui fans — and help shape the database.
              </Text>
              <Button
                component="a"
                href="https://fluxer.gg/7ce7lrCc"
                rel="noopener noreferrer"
                variant="filled"
                size="lg"
                leftSection={<MessageCircle size={18} />}
                rightSection={<ExternalLink size={16} />}
                style={{
                  backgroundColor: '#e11d48',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '1rem',
                  padding: '0.75rem 2.5rem',
                  borderRadius: '0.5rem',
                  boxShadow: '0 4px 20px rgba(225,29,72,0.35)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  letterSpacing: '0.02em',
                }}
              >
                Join Fluxer Server
              </Button>
            </Box>
          </Box>
        </motion.div>
      </motion.div>
    </Container>
    </>
  )
}