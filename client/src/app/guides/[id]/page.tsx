'use client'

import React, { useState, useEffect } from 'react'
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Alert,
  CircularProgress,
  Chip,
  Avatar,
  Divider
} from '@mui/material'
import { ArrowLeft, FileText, Calendar, ThumbsUp, User } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { api } from '../../../lib/api'
import { motion } from 'motion/react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface Guide {
  id: number
  title: string
  description: string
  content: string
  status: string
  viewCount: number
  likeCount: number
  author: {
    id: number
    username: string
  }
  tags: Array<{
    id: number
    name: string
  }>
  createdAt: string
  updatedAt: string
}

export default function GuideDetailsPage() {
  const { id } = useParams()
  const [guide, setGuide] = useState<Guide | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchGuide = async () => {
      try {
        setLoading(true)
        const response = await api.getGuide(Number(id))
        setGuide(response)
      } catch (error: unknown) {
        setError(error instanceof Error ? error.message : 'Failed to fetch guide')
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchGuide()
    }
  }, [id])

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <CircularProgress size={50} />
        </Box>
      </Container>
    )
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button component={Link} href="/guides" variant="outlined" startIcon={<ArrowLeft />}>
          Back to Guides
        </Button>
      </Container>
    )
  }

  if (!guide) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="warning" sx={{ mb: 3 }}>
          Guide not found
        </Alert>
        <Button component={Link} href="/guides" variant="outlined" startIcon={<ArrowLeft />}>
          Back to Guides
        </Button>
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
          href="/guides"
          variant="outlined"
          startIcon={<ArrowLeft />}
          sx={{ mb: 3 }}
        >
          Back to Guides
        </Button>

        <Card className="gambling-card">
          <CardContent>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h3" component="h1" gutterBottom>
                {guide.title}
              </Typography>

              <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ width: 32, height: 32, mr: 1 }}>
                    <User size={18} />
                  </Avatar>
                  <Typography variant="body1" color="text.secondary">
                    by {guide.author.username}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Calendar size={16} />
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
                    {new Date(guide.createdAt).toLocaleDateString()}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <ThumbsUp size={16} />
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
                    {guide.likeCount || 0} likes
                  </Typography>
                </Box>
              </Box>

              {guide.tags?.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  {guide.tags.map((tag) => (
                    <Chip
                      key={tag.id}
                      label={tag.name}
                      size="small"
                      variant="outlined"
                      color="secondary"
                      sx={{ mr: 0.5, mb: 0.5 }}
                    />
                  ))}
                </Box>
              )}
            </Box>

            <Divider sx={{ mb: 4 }} />

            <Box sx={{ 
              '& p': { mb: 2 }, 
              '& h1, & h2, & h3, & h4, & h5, & h6': { mt: 3, mb: 2, fontWeight: 'bold' },
              '& h1': { fontSize: '2.125rem' },
              '& h2': { fontSize: '1.875rem' },
              '& h3': { fontSize: '1.5rem' },
              '& h4': { fontSize: '1.25rem' },
              '& h5': { fontSize: '1.125rem' },
              '& h6': { fontSize: '1rem' },
              '& ul, & ol': { pl: 3, mb: 2 },
              '& li': { mb: 0.5 },
              '& blockquote': { 
                borderLeft: '4px solid #dc004e', 
                pl: 2, 
                ml: 0, 
                fontStyle: 'italic',
                backgroundColor: 'rgba(220, 0, 78, 0.05)',
                borderRadius: 1,
                p: 2,
                mb: 2
              },
              '& code': { 
                backgroundColor: 'rgba(0, 0, 0, 0.1)', 
                padding: '2px 4px', 
                borderRadius: 1,
                fontFamily: 'monospace'
              },
              '& pre': { 
                backgroundColor: 'rgba(0, 0, 0, 0.1)', 
                p: 2, 
                borderRadius: 1, 
                overflow: 'auto',
                mb: 2,
                '& code': {
                  backgroundColor: 'transparent',
                  padding: 0
                }
              },
              '& table': {
                width: '100%',
                borderCollapse: 'collapse',
                mb: 2,
                '& th, & td': {
                  border: '1px solid rgba(0, 0, 0, 0.12)',
                  p: 1,
                  textAlign: 'left'
                },
                '& th': {
                  backgroundColor: 'rgba(0, 0, 0, 0.05)',
                  fontWeight: 'bold'
                }
              },
              '& hr': {
                my: 3,
                border: 'none',
                borderTop: '1px solid rgba(0, 0, 0, 0.12)'
              },
              '& a': {
                color: '#dc004e',
                textDecoration: 'none',
                '&:hover': {
                  textDecoration: 'underline'
                }
              }
            }}>
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
              >
                {guide.content}
              </ReactMarkdown>
            </Box>
          </CardContent>
        </Card>

        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            Found this guide helpful?
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            Share your own knowledge by writing a guide for the community
          </Typography>
          <Button
            component={Link}
            href="/submit-guide"
            variant="contained"
            startIcon={<FileText size={20} />}
          >
            Write Your Own Guide
          </Button>
        </Box>
      </motion.div>
    </Container>
  )
}