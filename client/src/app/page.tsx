'use client'

import { Box, Container, Title, Text, Grid, Card, Button, Skeleton, Alert, Badge, Group } from '@mantine/core'
import { useMantineTheme } from '@mantine/core'
import { Users, BookOpen, Dices, CalendarSearch, TrendingUp, Book, Shield, FileText, Quote, ChevronRight, Sparkles, MessageCircle, ExternalLink, Image } from 'lucide-react'
import Link from 'next/link'
import { SearchBar } from '../components/SearchBar'
import { TrendingSection } from '../components/TrendingSection'
import { VolumeCoverSection } from '../components/VolumeCoverSection'
import { FavoritesSection } from '../components/FavoritesSection'
import { useLandingData } from '../hooks/useLandingData'
import { motion } from 'motion/react'
import Script from 'next/script'
import { FAQ } from '@/components/FAQ'

export default function HomePage() {
  const theme = useMantineTheme()
  const { data: landingData, loading: landingLoading, error: landingError } = useLandingData()

  // Primary features - most important content
  const primaryFeatures = [
    {
      icon: <Users className="w-8 h-8" style={{ color: theme.other?.usogui?.character || '#1976d2' }} />,
      title: 'Characters',
      description: 'Explore detailed profiles of all Usogui characters',
      href: '/characters',
      color: theme.other?.usogui?.character || '#1976d2'
    },
    {
      icon: <BookOpen className="w-8 h-8" style={{ color: theme.other?.usogui?.arc || '#dc004e' }} />,
      title: 'Story Arcs',
      description: 'Dive into the major arcs and storylines',
      href: '/arcs',
      color: theme.other?.usogui?.arc || '#dc004e'
    },
    {
      icon: <Dices className="w-8 h-8" style={{ color: theme.other?.usogui?.gamble || '#d32f2f' }} />,
      title: 'Gambles',
      description: 'Details on every gambling game and competition',
      href: '/gambles',
      color: theme.other?.usogui?.gamble || '#d32f2f'
    },
    {
      icon: <FileText className="w-8 h-8" style={{ color: theme.other?.usogui?.guide || '#388e3c' }} />,
      title: 'Guides',
      description: 'In-depth analysis and insights from the community',
      href: '/guides',
      color: theme.other?.usogui?.guide || '#388e3c'
    }
  ]


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
      <Container size="lg" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
        {/* Hero Section */}
        <Box style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <Title
            order={1}
            style={{
              fontWeight: 'bold',
              background: `linear-gradient(45deg, ${theme.other?.usogui?.character || '#1976d2'}, ${theme.other?.usogui?.arc || '#dc004e'})`,
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

          <Box style={{ maxWidth: 600, margin: '0 auto 3rem auto' }}>
            <SearchBar />
          </Box>

          {/* Quick Stats Bar */}
          {landingData?.stats && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Group justify="center" gap="md" style={{ flexWrap: 'wrap', marginBottom: '1rem' }}>
                {landingData.stats.totalCharacters && (
                  <Badge
                    leftSection={<Users className="w-4 h-4" style={{ color: theme.other?.usogui?.character || '#1976d2' }} />}
                    variant="outline"
                    style={{ borderColor: theme.other?.usogui?.character || '#1976d2', color: theme.other?.usogui?.character || '#1976d2' }}
                    size="lg"
                  >
                    {landingData.stats.totalCharacters.toLocaleString()} Characters
                  </Badge>
                )}
                {landingData.stats.totalArcs && (
                  <Badge
                    leftSection={<BookOpen className="w-4 h-4" style={{ color: theme.other?.usogui?.arc || '#dc004e' }} />}
                    variant="outline"
                    style={{ borderColor: theme.other?.usogui?.arc || '#dc004e', color: theme.other?.usogui?.arc || '#dc004e' }}
                    size="lg"
                  >
                    {landingData.stats.totalArcs.toLocaleString()} Arcs
                  </Badge>
                )}
                {landingData.stats.totalEvents && (
                  <Badge
                    leftSection={<CalendarSearch className="w-4 h-4" style={{ color: theme.other?.usogui?.event || '#f57c00' }} />}
                    variant="outline"
                    style={{ borderColor: theme.other?.usogui?.event || '#f57c00', color: theme.other?.usogui?.event || '#f57c00' }}
                    size="lg"
                  >
                    {landingData.stats.totalEvents.toLocaleString()} Events
                  </Badge>
                )}
                {landingData.stats.totalGuides && (
                  <Badge
                    leftSection={<FileText className="w-4 h-4" style={{ color: theme.other?.usogui?.guide || '#388e3c' }} />}
                    variant="outline"
                    style={{ borderColor: theme.other?.usogui?.guide || '#388e3c', color: theme.other?.usogui?.guide || '#388e3c' }}
                    size="lg"
                  >
                    {landingData.stats.totalGuides.toLocaleString()} Guides
                  </Badge>
                )}
                {landingData.stats.totalGambles && (
                  <Badge
                    leftSection={<Dices className="w-4 h-4" style={{ color: theme.other?.usogui?.gamble || '#d32f2f' }} />}
                    variant="outline"
                    style={{ borderColor: theme.other?.usogui?.gamble || '#d32f2f', color: theme.other?.usogui?.gamble || '#d32f2f' }}
                    size="lg"
                  >
                    {landingData.stats.totalGambles.toLocaleString()} Gambles
                  </Badge>
                )}
                {landingData.stats.totalMedia && (
                  <Badge
                    leftSection={<Image className="w-4 h-4" style={{ color: theme.other?.usogui?.media || '#7b1fa2' }} />}
                    variant="outline"
                    style={{ borderColor: theme.other?.usogui?.media || '#7b1fa2', color: theme.other?.usogui?.media || '#7b1fa2' }}
                    size="lg"
                  >
                    {landingData.stats.totalMedia.toLocaleString()} Media
                  </Badge>
                )}
                {landingData.stats.totalUsers && (
                  <Badge
                    leftSection={<Shield className="w-4 h-4" style={{ color: theme.other?.usogui?.purple || '#7c3aed' }} />}
                    variant="outline"
                    style={{ borderColor: theme.other?.usogui?.purple || '#7c3aed', color: theme.other?.usogui?.purple || '#7c3aed' }}
                    size="lg"
                  >
                    {landingData.stats.totalUsers.toLocaleString()} Users
                  </Badge>
                )}
              </Group>
            </motion.div>
          )}
        </Box>

        {/* Featured Volume Covers Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
        >
          <VolumeCoverSection />
        </motion.div>

        {/* Primary Features Section */}
        <Box style={{ marginBottom: '4rem' }}>
          <Box style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <Group justify="center" gap="xs" style={{ marginBottom: '1rem' }}>
              <Sparkles className="w-6 h-6" color={theme.colors?.red?.[5] || '#e11d48'} />
              <Title order={2} style={{ fontWeight: 'bold' }}>
                Start Exploring
              </Title>
            </Group>
            <Text size="lg" c="dimmed">
              Dive into the world of Usogui with our comprehensive content
            </Text>
          </Box>

          <Grid>
            {primaryFeatures.map((feature, index) => (
              <Grid.Col span={{ base: 12, sm: 6, md: 3 }} key={feature.title}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                >
                  <Card
                    className="gambling-card h-full"
                    style={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer',
                      textDecoration: 'none',
                      padding: '1.5rem'
                    }}
                    component={Link}
                    href={feature.href}
                  >
                    <Box style={{ flexGrow: 1, textAlign: 'center' }}>
                      <Box style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                        {feature.icon}
                      </Box>
                      <Title order={3} style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
                        {feature.title}
                      </Title>
                      <Text size="sm" c="dimmed" style={{ marginBottom: '1.5rem' }}>
                        {feature.description}
                      </Text>
                      <Group justify="center" gap="xs">
                        <Text size="sm" style={{ fontWeight: 'bold', color: feature.color }}>
                          Explore
                        </Text>
                        <ChevronRight className="w-4 h-4" style={{ color: feature.color }} />
                      </Group>
                    </Box>
                  </Card>
                </motion.div>
              </Grid.Col>
            ))}
          </Grid>
        </Box>

        {/* Community Favorites Section */}
        <FavoritesSection />

        {/* Featured Trending Content */}
        {landingData && (
          <Box style={{ marginBottom: '4rem' }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.7 }}
            >
              <Box style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <Group justify="center" gap="xs" style={{ marginBottom: '1rem' }}>
                  <TrendingUp className="w-6 h-6" color={theme.colors?.red?.[5] || '#e11d48'} />
                  <Title order={2} style={{ fontWeight: 'bold' }}>
                    What&apos;s Popular
                  </Title>
                </Group>
                <Text size="lg" c="dimmed">
                  Discover the most viewed content this week
                </Text>
              </Box>

              {landingError ? (
                <Alert color="blue">
                  Unable to load trending content at this time.
                </Alert>
              ) : landingLoading ? (
                <Grid>
                  {[1, 2, 3].map((i) => (
                    <Grid.Col span={{ base: 12, md: 4 }} key={i}>
                      <Card>
                        <Box style={{ padding: '1rem' }}>
                          <Skeleton height={24} style={{ width: '80%' }} />
                          <Skeleton height={40} style={{ width: '100%', marginTop: '0.5rem' }} />
                          <Skeleton height={20} style={{ width: '60%', marginTop: '0.5rem' }} />
                        </Box>
                      </Card>
                    </Grid.Col>
                  ))}
                </Grid>
              ) : (
                <Box>
                  {landingData.trending.guides.length > 0 && (
                    <TrendingSection
                      title="Trending Guides"
                      items={landingData.trending.guides}
                      type="guides"
                      maxItems={3}
                    />
                  )}
                </Box>
              )}
            </motion.div>
          </Box>
        )}

        <FAQ />

        {/* Discord CTA Section */}
        <Box style={{ marginBottom: '3rem' }} />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.1 }}
        >
          <Box
            style={{
              textAlign: 'center',
              padding: '3rem',
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
              <Title order={2} style={{ fontWeight: 'bold' }}>
                Join Our Discord Community
              </Title>
            </Group>
            <Text size="xl" style={{ opacity: 0.9, marginBottom: '2rem', fontWeight: 'normal' }}>
              Connect with fellow Usogui fans, discuss theories, share insights, and stay updated on the latest content
            </Text>

            <Grid justify="center" style={{ marginBottom: '2rem' }}>
              <Grid.Col span={{ base: 12, sm: 4 }}>
                <Box style={{ textAlign: 'center' }}>
                  <Users className="w-6 h-6" style={{ opacity: 0.9, margin: '0 auto 0.5rem auto', display: 'block' }} />
                  <Text size="sm" style={{ fontWeight: 'bold' }}>
                    Active Community
                  </Text>
                  <Text size="xs" style={{ opacity: 0.8 }}>
                    Chat with passionate fans
                  </Text>
                </Box>
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 4 }}>
                <Box style={{ textAlign: 'center' }}>
                  <Sparkles className="w-6 h-6" style={{ opacity: 0.9, margin: '0 auto 0.5rem auto', display: 'block' }} />
                  <Text size="sm" style={{ fontWeight: 'bold' }}>
                    Latest Updates
                  </Text>
                  <Text size="xs" style={{ opacity: 0.8 }}>
                    Be first to know about new content
                  </Text>
                </Box>
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 4 }}>
                <Box style={{ textAlign: 'center' }}>
                  <BookOpen className="w-6 h-6" style={{ opacity: 0.9, margin: '0 auto 0.5rem auto', display: 'block' }} />
                  <Text size="sm" style={{ fontWeight: 'bold' }}>
                    Theory Discussions
                  </Text>
                  <Text size="xs" style={{ opacity: 0.8 }}>
                    Dive deep into Usogui lore
                  </Text>
                </Box>
              </Grid.Col>
            </Grid>

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