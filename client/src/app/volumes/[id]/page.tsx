'use client'

import React, { useState, useEffect } from 'react'
import {
  Container,
  Typography,
  Box,
  Chip,
  Card,
  CardContent,
  Grid,
  Button,
  CircularProgress,
  Alert,
  Divider
} from '@mui/material'
import { ArrowLeft, Book, Hash } from 'lucide-react'
import { useTheme } from '@mui/material/styles'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { api } from '../../../lib/api'
import { motion } from 'motion/react'
import TimelineSpoilerWrapper from '../../../components/TimelineSpoilerWrapper'
import { usePageView } from '../../../hooks/usePageView'

interface Volume {
  id: number
  number: number
  title?: string
  description?: string
  coverUrl?: string
  startChapter: number
  endChapter: number
  createdAt: string
  updatedAt: string
}

export default function VolumeDetailPage() {
  const theme = useTheme()
  const [volume, setVolume] = useState<Volume | null>(null)
  const [chapters, setChapters] = useState<number[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const params = useParams()

  // Track page view
  const volumeId = Array.isArray(params.id) ? params.id[0] : params.id
  usePageView('volume', volumeId || '', !!volumeId)

  useEffect(() => {
    const fetchVolumeData = async () => {
      try {
        const id = Array.isArray(params.id) ? params.id[0] : params.id
        const volumeIdNum = Number(id)
        
        // Fetch volume and chapters data
        const [volumeData, chaptersData] = await Promise.all([
          api.getVolume(volumeIdNum),
          api.getVolumeChapters(volumeIdNum)
        ])
        
        setVolume(volumeData)
        setChapters(chaptersData.chapters)
      } catch (error: any) {
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchVolumeData()
    }
  }, [params.id])

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <CircularProgress size={50} />
        </Box>
      </Container>
    )
  }

  if (error || !volume) {
    return (
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Alert severity="error">
          {error || 'Volume not found'}
        </Alert>
        <Box sx={{ mt: 3 }}>
          <Button component={Link} href="/volumes" startIcon={<ArrowLeft />}>
            Back to Volumes
          </Button>
        </Box>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Button
          component={Link}
          href="/volumes"
          startIcon={<ArrowLeft />}
          sx={{ mb: 3 }}
        >
          Back to Volumes
        </Button>

        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom>
            Volume {volume.number}
          </Typography>
          
          {volume.title && (
            <Typography variant="h5" color="text.secondary" gutterBottom>
              {volume.title}
            </Typography>
          )}

          {volume.coverUrl ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
              <img 
                src={volume.coverUrl}
                alt={`Volume ${volume.number} cover`}
                style={{ 
                  maxWidth: '200px',
                  maxHeight: '300px',
                  borderRadius: '8px',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                }}
              />
            </Box>
          ) : (
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
              <Book size={48} color={theme.palette.primary.main} />
            </Box>
          )}

          <Box sx={{ mt: 2 }}>
            <Chip
              label={`Chapters ${volume.startChapter}-${volume.endChapter}`}
              size="medium"
              color="primary"
              variant="outlined"
              icon={<Hash size={16} />}
            />
          </Box>
        </Box>

        <Grid container spacing={4}>
          <Grid item xs={12} md={8}>
            {volume.description && (
              <Card className="gambling-card">
                <CardContent>
                  <Typography variant="h5" gutterBottom>
                    Volume Summary
                  </Typography>
                  <TimelineSpoilerWrapper 
                    chapterNumber={volume.startChapter}
                  >
                    <Typography variant="body1" paragraph>
                      {volume.description}
                    </Typography>
                  </TimelineSpoilerWrapper>
                </CardContent>
              </Card>
            )}

            {/* Chapters Section */}
            {chapters.length > 0 && (
              <Card className="gambling-card" sx={{ mt: 4 }}>
                <CardContent>
                  <Typography variant="h5" gutterBottom>
                    Chapters in this Volume
                  </Typography>
                  <Grid container spacing={1}>
                    {chapters.map((chapterNumber) => (
                      <Grid item xs={6} sm={4} md={3} key={chapterNumber}>
                        <Button
                          component={Link}
                          href={`/chapters/${chapterNumber}`}
                          variant="outlined"
                          size="small"
                          fullWidth
                          sx={{ 
                            mb: 1,
                            '&:hover': {
                              backgroundColor: 'primary.main',
                              color: 'white',
                              borderColor: 'primary.main'
                            }
                          }}
                        >
                          Chapter {chapterNumber}
                        </Button>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            )}
          </Grid>

          <Grid item xs={12} md={4}>
            <Card className="gambling-card">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Volume Info
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Volume Number
                  </Typography>
                  <Typography variant="body1">
                    {volume.number}
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Chapter Range
                  </Typography>
                  <Typography variant="body1">
                    Chapters {volume.startChapter} - {volume.endChapter}
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Total Chapters
                  </Typography>
                  <Typography variant="body1">
                    {volume.endChapter - volume.startChapter + 1} chapters
                  </Typography>
                </Box>

                <Divider sx={{ my: 2 }} />
                
                <Typography variant="h6" gutterBottom>
                  Quick Navigation
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Button
                    component={Link}
                    href={`/chapters/${volume.startChapter}`}
                    variant="outlined"
                    size="small"
                    fullWidth
                  >
                    First Chapter ({volume.startChapter})
                  </Button>
                  <Button
                    component={Link}
                    href={`/chapters/${volume.endChapter}`}
                    variant="outlined"
                    size="small"
                    fullWidth
                  >
                    Last Chapter ({volume.endChapter})
                  </Button>
                  <Button
                    component={Link}
                    href="/chapters"
                    variant="outlined"
                    size="small"
                    fullWidth
                  >
                    Browse All Chapters
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </motion.div>
    </Container>
  )
}