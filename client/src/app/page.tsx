'use client'

import { Box, Container, Typography, Grid, Card, CardContent, Button, Skeleton, Alert } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { Users, BookOpen, Dices, CalendarSearch, TrendingUp, Book, Shield, FileText } from 'lucide-react'
import Link from 'next/link'
import { SearchBar } from '../components/SearchBar'
import { TrendingSection } from '../components/TrendingSection'
import { VolumeCoverSection } from '../components/VolumeCoverSection'
import { useLandingData } from '../hooks/useLandingData'
import { motion } from 'motion/react'

export default function HomePage() {
  const theme = useTheme()
  const { data: landingData, loading: landingLoading, error: landingError } = useLandingData()
  
  const features = [
    {
      icon: <Users className="w-8 h-8" color={theme.palette.usogui.character} />,
      title: 'Characters',
      description: 'Explore detailed profiles of all Usogui characters',
      href: '/characters',
      color: 'primary'
    },
    {
      icon: <BookOpen className="w-8 h-8" />,
      title: 'Story Arcs',
      description: 'Dive into the major arcs and storylines',
      href: '/arcs',
      color: 'secondary'
    },
    {
      icon: <Dices className="w-8 h-8" />,
      title: 'Gambles',
      description: 'Details on every gambling game and competition',
      href: '/gambles',
      color: 'error'
    },
    {
      icon: <CalendarSearch className="w-8 h-8" />,
      title: 'Events',
      description: 'Key events and plot points throughout the series',
      href: '/events',
      color: 'warning'
    },
    {
      icon: <Book className="w-8 h-8" />,
      title: 'Chapters',
      description: 'Read chapter summaries and explore the story',
      href: '/chapters',
      color: 'info'
    },
    {
      icon: <Book className="w-8 h-8" />,
      title: 'Volumes',
      description: 'Browse volume collections and covers',
      href: '/volumes',
      color: 'success'
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: 'Factions',
      description: 'Learn about the various groups and organizations',
      href: '/factions',
      color: 'secondary'
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: 'Community',
      description: 'Meet fellow fans and see their contributions',
      href: '/users',
      color: 'primary'
    }
  ]

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box textAlign="center" mb={6}>
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
            The unofficial database for the gambling manga masterpiece - Usogui (Lie Eater)
          </Typography>
          
          <Box sx={{ maxWidth: 600, mx: 'auto', mb: 4 }}>
            <SearchBar />
          </Box>
        </Box>

        {/* Featured Volume Covers Section */}
        <VolumeCoverSection />

        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={feature.title}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card
                  className="gambling-card h-full"
                  sx={{ 
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s',
                    '&:hover': { transform: 'translateY(-4px)' }
                  }}
                >
                  <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        mb: 2,
                        color: `${feature.color}.main`
                      }}
                    >
                      {feature.icon}
                    </Box>
                    <Typography variant="h6" component="h2" gutterBottom>
                      {feature.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" mb={2}>
                      {feature.description}
                    </Typography>
                    <Button
                      component={Link}
                      href={feature.href}
                      variant="outlined"
                      color={feature.color as any}
                      fullWidth
                    >
                      Explore
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>

        {/* Trending Section */}
        <Box>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <Box textAlign="center" mb={4}>
              <Box display="flex" alignItems="center" justifyContent="center" gap={1} mb={2}>
                <TrendingUp className="w-6 h-6" color={theme.palette.primary.main} />
                <Typography variant="h4" component="h2" sx={{ fontWeight: 'bold' }}>
                  What's Trending
                </Typography>
              </Box>
              <Typography variant="body1" color="text.secondary">
                Discover the most popular content from the past week
              </Typography>
            </Box>

            {landingError ? (
              <Alert severity="info" sx={{ mb: 3 }}>
                Unable to load trending content. Please check your connection and try again.
              </Alert>
            ) : landingLoading ? (
              <Box>
                {[1, 2, 3, 4].map((i) => (
                  <Box key={i} mb={3}>
                    <Skeleton variant="text" width={200} height={32} sx={{ mb: 1 }} />
                    <Grid container spacing={2}>
                      {[1, 2, 3].map((j) => (
                        <Grid item xs={12} md={4} key={j}>
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
                  </Box>
                ))}
              </Box>
            ) : landingData ? (
              <Box>
                {landingData.trending.guides.length > 0 && (
                  <TrendingSection
                    title="Trending Guides"
                    items={landingData.trending.guides}
                    type="guides"
                    maxItems={3}
                  />
                )}
                
                {landingData.trending.characters.length > 0 && (
                  <TrendingSection
                    title="Popular Characters"
                    items={landingData.trending.characters}
                    type="characters"
                    maxItems={3}
                  />
                )}
                
                {landingData.trending.events.length > 0 && (
                  <TrendingSection
                    title="Hot Events"
                    items={landingData.trending.events}
                    type="events"
                    maxItems={3}
                  />
                )}
                
                {landingData.trending.gambles.length > 0 && (
                  <TrendingSection
                    title="Featured Gambles"
                    items={landingData.trending.gambles}
                    type="gambles"
                    maxItems={3}
                  />
                )}

                {/* Site Stats */}
                {landingData.stats && (
                  <Box mt={4} textAlign="center">
                    <Typography variant="h6" gutterBottom>
                      Community Stats
                    </Typography>
                    <Grid container spacing={2} justifyContent="center">
                      <Grid item xs={6} sm={3}>
                        <Typography variant="h4" color="primary.main" sx={{ fontWeight: 'bold' }}>
                          {landingData.stats.totalGuides.toLocaleString()}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Guides
                        </Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="h4" color="secondary.main" sx={{ fontWeight: 'bold' }}>
                          {landingData.stats.totalCharacters.toLocaleString()}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Characters
                        </Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="h4" color="warning.main" sx={{ fontWeight: 'bold' }}>
                          {landingData.stats.totalEvents.toLocaleString()}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Events
                        </Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="h4" color="error.main" sx={{ fontWeight: 'bold' }}>
                          {landingData.stats.totalGambles.toLocaleString()}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Gambles
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>
                )}
              </Box>
            ) : null}
          </motion.div>
        </Box>

        <Box textAlign="center" mt={6}>
          <Typography variant="h4" gutterBottom>
            Join the Community
          </Typography>
          <Typography variant="body1" color="text.secondary" mb={3}>
            Create an account to submit fan content, guides, and track your reading progress
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button component={Link} href="/register" variant="contained" size="large">
              Sign Up
            </Button>
            <Button component={Link} href="/login" variant="outlined" size="large">
              Log In
            </Button>
          </Box>
        </Box>
      </motion.div>
    </Container>
  )
}