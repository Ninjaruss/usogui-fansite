'use client'

import { Box, Container, Typography, Grid, Card, CardContent, Button, Skeleton, Alert, Chip } from '@mui/material'
import { useTheme } from '@mui/material/styles'
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
  const theme = useTheme()
  const { data: landingData, loading: landingLoading, error: landingError } = useLandingData()
  
  // Primary features - most important content
  const primaryFeatures = [
    {
      icon: <Users className="w-8 h-8" style={{ color: theme.palette.usogui.character }} />,
      title: 'Characters',
      description: 'Explore detailed profiles of all Usogui characters',
      href: '/characters',
      color: theme.palette.usogui.character
    },
    {
      icon: <BookOpen className="w-8 h-8" style={{ color: theme.palette.usogui.arc }} />,
      title: 'Story Arcs',
      description: 'Dive into the major arcs and storylines',
      href: '/arcs',
      color: theme.palette.usogui.arc
    },
    {
      icon: <Dices className="w-8 h-8" style={{ color: theme.palette.usogui.gamble }} />,
      title: 'Gambles',
      description: 'Details on every gambling game and competition',
      href: '/gambles',
      color: theme.palette.usogui.gamble
    },
    {
      icon: <FileText className="w-8 h-8" style={{ color: theme.palette.usogui.guide }} />,
      title: 'Guides',
      description: 'In-depth analysis and insights from the community',
      href: '/guides',
      color: theme.palette.usogui.guide
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
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
        {/* Hero Section */}
        <Box textAlign="center" mb={8}>
          <Typography
            variant="h2"
            component="h1"
            gutterBottom
            sx={{
              fontWeight: 'bold',
              background: `linear-gradient(45deg, ${theme.palette.usogui.character}, ${theme.palette.usogui.arc})`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent'
            }}
          >
            Welcome to the L-File
          </Typography>
          <Typography variant="h5" color="text.secondary" mb={4}>
            The ultimate database for the gambling manga masterpiece - Usogui (Lie Eater)
          </Typography>

          <Box sx={{ maxWidth: 600, mx: 'auto', mb: 6 }}>
            <SearchBar />
          </Box>

          {/* Quick Stats Bar */}
          {landingData?.stats && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: { xs: 1.5, sm: 2 },
                  flexWrap: 'wrap',
                  mb: 2
                }}
              >
                {landingData.stats.totalCharacters && (
                  <Chip
                    icon={<Users className="w-4 h-4" style={{ color: theme.palette.usogui.character }} />}
                    label={`${landingData.stats.totalCharacters.toLocaleString()} Characters`}
                    variant="outlined"
                    size="small"
                    sx={{ borderColor: theme.palette.usogui.character, color: theme.palette.usogui.character }}
                  />
                )}
                {landingData.stats.totalArcs && (
                  <Chip
                    icon={<BookOpen className="w-4 h-4" style={{ color: theme.palette.usogui.arc }} />}
                    label={`${landingData.stats.totalArcs.toLocaleString()} Arcs`}
                    variant="outlined"
                    size="small"
                    sx={{ borderColor: theme.palette.usogui.arc, color: theme.palette.usogui.arc }}
                  />
                )}
                {landingData.stats.totalEvents && (
                  <Chip
                    icon={<CalendarSearch className="w-4 h-4" style={{ color: theme.palette.usogui.event }} />}
                    label={`${landingData.stats.totalEvents.toLocaleString()} Events`}
                    variant="outlined"
                    size="small"
                    sx={{ borderColor: theme.palette.usogui.event, color: theme.palette.usogui.event }}
                  />
                )}
                {landingData.stats.totalGuides && (
                  <Chip
                    icon={<FileText className="w-4 h-4" style={{ color: theme.palette.usogui.guide }} />}
                    label={`${landingData.stats.totalGuides.toLocaleString()} Guides`}
                    variant="outlined"
                    size="small"
                    sx={{ borderColor: theme.palette.usogui.guide, color: theme.palette.usogui.guide }}
                  />
                )}
                {landingData.stats.totalGambles && (
                  <Chip
                    icon={<Dices className="w-4 h-4" style={{ color: theme.palette.usogui.gamble }} />}
                    label={`${landingData.stats.totalGambles.toLocaleString()} Gambles`}
                    variant="outlined"
                    size="small"
                    sx={{ borderColor: theme.palette.usogui.gamble, color: theme.palette.usogui.gamble }}
                  />
                )}
{landingData.stats.totalMedia && (
                  <Chip
                    icon={<Image className="w-4 h-4" style={{ color: theme.palette.usogui.media }} />}
                    label={`${landingData.stats.totalMedia.toLocaleString()} Media`}
                    variant="outlined"
                    size="small"
                    sx={{ borderColor: theme.palette.usogui.media, color: theme.palette.usogui.media }}
                  />
                )}
                {landingData.stats.totalUsers && (
                  <Chip
                    icon={<Shield className="w-4 h-4" style={{ color: theme.palette.secondary.main }} />}
                    label={`${landingData.stats.totalUsers.toLocaleString()} Users`}
                    variant="outlined"
                    size="small"
                    sx={{ borderColor: theme.palette.secondary.main, color: theme.palette.secondary.main }}
                  />
                )}
              </Box>
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
        <Box mb={8}>
          <Box textAlign="center" mb={5}>
            <Box display="flex" alignItems="center" justifyContent="center" gap={1} mb={2}>
              <Sparkles className="w-6 h-6" color={theme.palette.primary.main} />
              <Typography variant="h4" component="h2" sx={{ fontWeight: 'bold' }}>
                Start Exploring
              </Typography>
            </Box>
            <Typography variant="body1" color="text.secondary">
              Dive into the world of Usogui with our comprehensive content
            </Typography>
          </Box>

          <Grid container spacing={4}>
            {primaryFeatures.map((feature, index) => (
              <Grid item xs={12} sm={6} md={3} key={feature.title}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                >
                  <Card
                    className="gambling-card h-full"
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer',
                      textDecoration: 'none',
                      '&:hover': {
                        transform: 'translateY(-12px)',
                        boxShadow: theme.shadows[12]
                      }
                    }}
                    component={Link}
                    href={feature.href}
                  >
                    <CardContent sx={{ flexGrow: 1, textAlign: 'center', p: 3 }}>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'center',
                          mb: 2
                        }}
                      >
                        {feature.icon}
                      </Box>
                      <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 'bold' }}>
                        {feature.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" mb={3}>
                        {feature.description}
                      </Typography>
                      <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
                        <Typography variant="button" sx={{ fontWeight: 'bold', color: feature.color }}>
                          Explore
                        </Typography>
                        <ChevronRight className="w-4 h-4" style={{ color: feature.color }} />
                      </Box>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Community Favorites Section */}
        <FavoritesSection />

        {/* Featured Trending Content */}
        {landingData && (
          <Box mb={8}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.7 }}
            >
              <Box textAlign="center" mb={4}>
                <Box display="flex" alignItems="center" justifyContent="center" gap={1} mb={2}>
                  <TrendingUp className="w-6 h-6" color={theme.palette.primary.main} />
                  <Typography variant="h4" component="h2" sx={{ fontWeight: 'bold' }}>
                    What&apos;s Popular
                  </Typography>
                </Box>
                <Typography variant="body1" color="text.secondary">
                  Discover the most viewed content this week
                </Typography>
              </Box>

              {landingError ? (
                <Alert severity="info" sx={{ mb: 3 }}>
                  Unable to load trending content at this time.
                </Alert>
              ) : landingLoading ? (
                <Grid container spacing={3}>
                  {[1, 2, 3].map((i) => (
                    <Grid item xs={12} md={4} key={i}>
                      <Card>
                        <CardContent>
                          <Skeleton variant="text" width="80%" height={24} />
                          <Skeleton variant="text" width="100%" height={40} sx={{ mt: 1 }} />
                          <Skeleton variant="text" width="60%" height={20} sx={{ mt: 1 }} />
                        </CardContent>
                      </Card>
                    </Grid>
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
        <Box mb={6} />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.1 }}
        >
          <Box
            textAlign="center"
            p={6}
            sx={{
              background: `linear-gradient(135deg, #5865F2 0%, #4752C4 50%, #3C45A5 100%)`,
              borderRadius: 4,
              border: `2px solid ${theme.palette.divider}`,
              color: 'white',
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.1) 50%, transparent 60%)',
                animation: 'shimmer 3s ease-in-out infinite',
                pointerEvents: 'none'
              },
              '@keyframes shimmer': {
                '0%': { transform: 'translateX(-100%)' },
                '100%': { transform: 'translateX(100%)' }
              }
            }}
          >
            <Box display="flex" alignItems="center" justifyContent="center" gap={2} mb={2}>
              <MessageCircle className="w-8 h-8" />
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                Join Our Discord Community
              </Typography>
            </Box>
            <Typography variant="h6" sx={{ opacity: 0.9, mb: 4, fontWeight: 'normal' }}>
              Connect with fellow Usogui fans, discuss theories, share insights, and stay updated on the latest content
            </Typography>

            <Grid container spacing={3} justifyContent="center" sx={{ mb: 4 }}>
              <Grid item xs={12} sm={4}>
                <Box textAlign="center">
                  <Users className="w-6 h-6 mx-auto mb-2" style={{ opacity: 0.9 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                    Active Community
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    Chat with passionate fans
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box textAlign="center">
                  <Sparkles className="w-6 h-6 mx-auto mb-2" style={{ opacity: 0.9 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                    Latest Updates
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    Be first to know about new content
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box textAlign="center">
                  <BookOpen className="w-6 h-6 mx-auto mb-2" style={{ opacity: 0.9 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                    Theory Discussions
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    Dive deep into Usogui lore
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            <Button
              component="a"
              href="https://discord.gg/JXeRhV2qpY"
              target="_blank"
              rel="noopener noreferrer"
              variant="contained"
              size="large"
              startIcon={<MessageCircle className="w-5 h-5" />}
              endIcon={<ExternalLink className="w-4 h-4" />}
              sx={{
                bgcolor: 'white',
                color: '#5865F2',
                fontWeight: 'bold',
                fontSize: '1.1rem',
                px: 4,
                py: 1.5,
                borderRadius: 2,
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                '&:hover': {
                  bgcolor: '#f8f9fa',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 16px rgba(0,0,0,0.4)'
                },
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