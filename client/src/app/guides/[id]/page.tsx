'use client'

import React, { useState, useEffect, useMemo, useCallback, memo } from 'react'
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
  Divider,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  Tabs,
  Tab,
  Grid,
  Paper
} from '@mui/material'
import { ArrowLeft, FileText, Calendar, ThumbsUp, Heart, Edit, Save, X, Users, BookOpen, Dice6, Eye } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { api } from '../../../lib/api'
import { motion } from 'motion/react'
import { useAuth } from '../../../providers/AuthProvider'
import TimelineSpoilerWrapper from '../../../components/TimelineSpoilerWrapper'
import EnhancedSpoilerMarkdown from '../../../components/EnhancedSpoilerMarkdown'
import EntityEmbedHelperWithSearch from '../../../components/EntityEmbedHelperWithSearch'
import { usePageView } from '../../../hooks/usePageView'
import AuthorProfileImage from '../../../components/AuthorProfileImage'
import { UserRoleDisplay } from '../../../components/BadgeDisplay'
import { useTheme } from '@mui/material/styles'
import { GuideStatus } from '../../../types'

interface Guide {
  id: number
  title: string
  description: string
  content: string
  status: GuideStatus
  viewCount: number
  likeCount: number
  userHasLiked?: boolean
  author: {
    id: number
    username: string
    role?: string
    customRole?: string | null
    // Note: Public guides API may not return full profile data
    // We'll use initials as fallback if profile data is missing
    profilePictureType?: 'discord' | 'character_media' | null
    selectedCharacterMediaId?: number | null
    selectedCharacterMedia?: {
      id: number
      url: string
      fileName?: string
      description?: string
    } | null
    discordId?: string | null
    discordAvatar?: string | null
  }
  tags: Array<{
    id: number
    name: string
  }>
  characters?: Array<{
    id: number
    name: string
  }>
  arc?: {
    id: number
    name: string
  }
  gambles?: Array<{
    id: number
    name: string
  }>
  createdAt: string
  updatedAt: string
}

// Helper function to get role badge styling
const getRoleBadge = (role?: string) => {
  if (!role) return null

  switch (role) {
    case 'admin':
      return { label: 'Admin', color: '#f44336' as const, bgcolor: 'rgba(244, 67, 54, 0.1)' }
    case 'moderator':
      return { label: 'Mod', color: '#ff9800' as const, bgcolor: 'rgba(255, 152, 0, 0.1)' }
    default:
      return null
  }
}

// Memoized components for better performance
const GuideHeader = memo(({ guide, canUserEdit, handleEditClick, formattedDate, roleBadge }: {
  guide: Guide
  canUserEdit: boolean
  handleEditClick: () => void
  formattedDate: string
  roleBadge: ReturnType<typeof getRoleBadge>
}) => (
  <Box sx={{ mb: 4 }}>
    <Box sx={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'flex-start', 
      mb: 3,
      flexDirection: { xs: 'column', sm: 'row' },
      gap: { xs: 2, sm: 0 }
    }}>
      <Box sx={{ flex: 1 }}>
        <Typography 
          variant="h3" 
          component="h1" 
          sx={{ 
            fontSize: { xs: '1.75rem', sm: '2.125rem', md: '2.5rem' },
            fontWeight: 'bold',
            lineHeight: 1.2,
            mb: { xs: 1, sm: 0 }
          }}
        >
          {guide.title}
        </Typography>
        
        {/* Status Chip for rejected/pending guides */}
        {(guide.status === GuideStatus.REJECTED || guide.status === GuideStatus.PENDING) && (
          <Box sx={{ mt: 1 }}>
            <Chip
              label={guide.status === GuideStatus.REJECTED ? 'Rejected' : 'Pending Approval'}
              size="medium"
              color={guide.status === GuideStatus.REJECTED ? 'error' : 'warning'}
              sx={{
                textTransform: 'capitalize',
                fontWeight: 'bold'
              }}
            />
            {guide.status === GuideStatus.REJECTED && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                This guide is only visible to you as its author.
              </Typography>
            )}
          </Box>
        )}
      </Box>
      
      {canUserEdit && (
        <Button
          variant="outlined"
          startIcon={<Edit size={16} />}
          onClick={handleEditClick}
          sx={{ 
            ml: { sm: 2 },
            minWidth: 'fit-content',
            whiteSpace: 'nowrap'
          }}
        >
          Edit Guide
        </Button>
      )}
    </Box>

    <Box sx={{ 
      display: 'flex', 
      alignItems: 'center', 
      flexWrap: 'wrap', 
      gap: { xs: 1.5, sm: 2 }, 
      mb: 3 
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
        <AuthorProfileImage
          author={guide.author}
          size={32}
          showFallback={true}
          className="guide-author-avatar"
        />
        <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0.5, minWidth: 0 }}>
          <Typography
            variant="body1"
            color="text.secondary"
            component={Link}
            href={`/users/${guide.author.id}`}
            sx={{
              textDecoration: 'none',
              '&:hover': {
                color: 'primary.main',
                textDecoration: 'underline'
              },
              fontSize: { xs: '0.875rem', sm: '1rem' }
            }}
          >
            by {guide.author.username}
          </Typography>
          <UserRoleDisplay
            userRole={guide.author.role as 'admin' | 'moderator' | 'user' || 'user'}
            customRole={guide.author.customRole}
            size="small"
            spacing={0.5}
          />
        </Box>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
        <Calendar size={16} />
        <Typography variant="body2" sx={{ ml: 0.5, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
          {formattedDate}
        </Typography>
      </Box>
    </Box>
  </Box>
))
GuideHeader.displayName = 'GuideHeader'

const GuideLikeSection = memo(({ guide, user, userHasLiked, liking, handleLikeToggle }: {
  guide: Guide
  user: any
  userHasLiked: boolean
  liking: boolean
  handleLikeToggle: () => void
}) => (
  <Box sx={{ 
    display: 'flex', 
    alignItems: 'center', 
    gap: 2, 
    flexWrap: 'wrap',
    p: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    borderRadius: 1,
    mb: 3
  }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <ThumbsUp size={18} />
      <Typography variant="body1" color="text.secondary">
        {guide.likeCount || 0} {guide.likeCount === 1 ? 'like' : 'likes'}
      </Typography>
    </Box>
    {user && (
      <Button
        size="small"
        variant={userHasLiked ? "contained" : "outlined"}
        color="primary"
        startIcon={<Heart size={16} />}
        onClick={handleLikeToggle}
        disabled={liking}
        sx={{ 
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'scale(1.05)'
          }
        }}
      >
        {liking ? 'Loading...' : userHasLiked ? 'Liked' : 'Like'}
      </Button>
    )}
  </Box>
))
GuideLikeSection.displayName = 'GuideLikeSection'

const RelatedContentSection = memo(({ guide }: { guide: Guide }) => (
  <Card 
    variant="outlined" 
    sx={{ 
      mb: 3,
      backgroundColor: 'rgba(0, 0, 0, 0.02)',
      border: '1px solid rgba(0, 0, 0, 0.08)'
    }}
  >
    <CardContent>
      <Typography 
        variant="h6" 
        gutterBottom 
        sx={{ 
          mb: 2, 
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          color: 'primary.main'
        }}
      >
        <BookOpen size={20} />
        Related Content
      </Typography>
      
      {guide.characters && guide.characters.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Users size={18} style={{ marginRight: 8 }} />
            <Typography variant="subtitle2" color="text.secondary" fontWeight="medium">
              Characters
            </Typography>
          </Box>
          <Box sx={{ ml: 3, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {guide.characters.map((character) => (
              <Chip
                key={character.id}
                label={character.name}
                size="small"
                color="primary"
                component={Link}
                href={`/characters/${character.id}`}
                clickable
                sx={{
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 2
                  }
                }}
              />
            ))}
          </Box>
        </Box>
      )}
      
      {guide.arc && (
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <BookOpen size={18} style={{ marginRight: 8 }} />
            <Typography variant="subtitle2" color="text.secondary" fontWeight="medium">
              Story Arc
            </Typography>
          </Box>
          <Box sx={{ ml: 3 }}>
            <Chip
              label={guide.arc.name}
              size="medium"
              color="secondary"
              component={Link}
              href={`/arcs/${guide.arc.id}`}
              clickable
              sx={{
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: 2
                }
              }}
            />
          </Box>
        </Box>
      )}
      
      {guide.gambles && guide.gambles.length > 0 && (
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Dice6 size={18} style={{ marginRight: 8 }} />
            <Typography variant="subtitle2" color="text.secondary" fontWeight="medium">
              Gambles
            </Typography>
          </Box>
          <Box sx={{ ml: 3, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {guide.gambles.map((gamble) => (
              <Chip
                key={gamble.id}
                label={gamble.name}
                size="small"
                color="info"
                component={Link}
                href={`/gambles/${gamble.id}`}
                clickable
                sx={{
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 2
                  }
                }}
              />
            ))}
          </Box>
        </Box>
      )}
    </CardContent>
  </Card>
))
RelatedContentSection.displayName = 'RelatedContentSection'

const GuideTagsSection = memo(({ guide }: { guide: Guide }) => {
  if (!guide.tags?.length) return null
  
  return (
    <Box sx={{ mb: 3 }}>
      <Typography 
        variant="subtitle1" 
        color="text.secondary" 
        gutterBottom 
        sx={{ fontWeight: 'medium', mb: 1 }}
      >
        Tags
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
        {guide.tags.map((tag) => (
          <Chip
            key={tag.id}
            label={tag.name}
            size="small"
            variant="outlined"
            color="default"
            sx={{ 
              opacity: 0.8,
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                opacity: 1,
                backgroundColor: 'rgba(0, 0, 0, 0.04)'
              }
            }}
          />
        ))}
      </Box>
    </Box>
  )
})
GuideTagsSection.displayName = 'GuideTagsSection'

export default function GuideDetailsPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const theme = useTheme()
  const [guide, setGuide] = useState<Guide | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [liking, setLiking] = useState(false)
  const [userHasLiked, setUserHasLiked] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    content: '',
    status: GuideStatus.PENDING,
    tagNames: [] as string[],
    characterIds: [] as number[],
    arcId: null as number | null,
    gambleIds: [] as number[]
  })
  const [saving, setSaving] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const [characters, setCharacters] = useState<Array<{id: number, name: string}>>([])
  const [arcs, setArcs] = useState<Array<{id: number, name: string}>>([])
  const [gambles, setGambles] = useState<Array<{id: number, name: string}>>([])
  const [loadingRelationData, setLoadingRelationData] = useState(false)
  const [activeTab, setActiveTab] = useState(0)

  const handleTabChange = useCallback((_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue)
  }, [])

  const handleInsertEmbed = useCallback((embedCode: string) => {
    // Get current cursor position and insert embed
    setEditForm(prev => ({
      ...prev,
      content: prev.content + ' ' + embedCode + ' '
    }))
  }, [])

  // Memoize role badge calculation
  const roleBadge = useMemo(() => {
    if (!guide?.author?.role) return null
    return getRoleBadge(guide.author.role)
  }, [guide?.author?.role])

  // Memoize formatted date
  const formattedDate = useMemo(() => {
    if (!guide?.createdAt) return ''
    return new Date(guide.createdAt).toLocaleDateString()
  }, [guide?.createdAt])

  // Memoize related content visibility
  const hasRelatedContent = useMemo(() => {
    return !!(
      (guide?.characters && guide.characters.length > 0) || 
      guide?.arc || 
      (guide?.gambles && guide.gambles.length > 0)
    )
  }, [guide?.characters, guide?.arc, guide?.gambles])

  // Optimize API calls with useCallback
  const handleLikeToggle = useCallback(async () => {
    if (!user || liking || !guide) return
    
    setLiking(true)
    try {
      const response = await api.toggleGuideLike(guide.id)
      setUserHasLiked(response.liked)
      if (guide) {
        setGuide({
          ...guide,
          likeCount: response.likeCount
        })
      }
    } catch (error: unknown) {
      console.error('Error toggling like:', error)
    } finally {
      setLiking(false)
    }
  }, [user, liking, guide])

  const handleEditClick = useCallback(async () => {
    if (!guide) return
    
    setEditForm({
      title: guide.title,
      description: guide.description,
      content: guide.content,
      status: guide.status,
      tagNames: guide.tags?.map(tag => tag.name) || [],
      characterIds: guide.characters?.map(char => char.id) || [],
      arcId: guide.arc?.id || null,
      gambleIds: guide.gambles?.map(gamble => gamble.id) || []
    })
    
    // Load relation data for dropdowns only when needed
    setLoadingRelationData(true)
    try {
      const [charactersRes, arcsRes, gamblesRes] = await Promise.all([
        api.getCharacters({ limit: 1000 }),
        api.getArcs({ limit: 1000 }),
        api.getGambles({ limit: 1000 })
      ])
      
      setCharacters(charactersRes.data || [])
      setArcs(arcsRes.data || [])
      setGambles(gamblesRes.data || [])
    } catch (error) {
      console.error('Error loading relation data:', error)
    } finally {
      setLoadingRelationData(false)
    }
    
    setIsEditing(true)
  }, [guide])

  const handleSaveEdit = useCallback(async () => {
    if (!guide || saving) return
    
    setSaving(true)
    try {
      const updateData = {
        title: editForm.title,
        description: editForm.description,
        content: editForm.content,
        status: GuideStatus.PENDING, // Always set to pending when user edits
        tagNames: editForm.tagNames,
        characterIds: editForm.characterIds.length > 0 ? editForm.characterIds : undefined,
        arcId: editForm.arcId || undefined,
        gambleIds: editForm.gambleIds.length > 0 ? editForm.gambleIds : undefined
      }
      const updatedGuide = await api.updateGuide(guide.id, updateData)
      setGuide(updatedGuide)
      setIsEditing(false)
      setError('')
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Failed to update guide')
    } finally {
      setSaving(false)
    }
  }, [guide, saving, editForm])

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false)
    setEditForm({
      title: '',
      description: '',
      content: '',
      status: GuideStatus.PENDING,
      tagNames: [],
      characterIds: [],
      arcId: null,
      gambleIds: []
    })
  }, [])

  // Track page view
  const guideId = Array.isArray(id) ? id[0] : id
  usePageView('guide', guideId || '', !!guideId)

  useEffect(() => {
    const fetchGuide = async () => {
      try {
        setLoading(true)
        
        const guideId = Array.isArray(id) ? id[0] : id
        
        // Validate that ID is a valid number
        if (!guideId || isNaN(Number(guideId))) {
          setError('Invalid guide ID')
          return
        }
        
        const numericId = Number(guideId)
        
        // Additional safety check for negative or zero IDs
        if (numericId <= 0) {
          setError('Invalid guide ID')
          return
        }
        
        let response
        let isOwnerViewingRejected = false
        
        try {
          // First try to get the guide via the public API (only returns approved guides)
          response = await api.getGuide(numericId)
        } catch (publicError) {
          // If public API fails, guide might be pending or rejected
          // Try admin API if user is authenticated
          if (user) {
            try {
              response = await api.getGuideAdmin(numericId)
              
              // Check if user is viewing their own rejected guide
              if (response.status === GuideStatus.REJECTED && response.author.id !== user.id) {
                setError('This guide has been rejected and is not publicly accessible')
                return
              } else if (response.status === GuideStatus.REJECTED && response.author.id === user.id) {
                isOwnerViewingRejected = true
              } else if (response.status === GuideStatus.PENDING && response.author.id !== user.id) {
                setError('This guide is pending approval and is not yet publicly accessible')
                return
              }
            } catch (adminError) {
              setError('Guide not found')
              return
            }
          } else {
            setError('Guide not found')
            return
          }
        }
        
        setGuide(response)
        // Set user like status if it's provided by the API
        if (response.userHasLiked !== undefined) {
          setUserHasLiked(response.userHasLiked)
        }
      } catch (error: unknown) {
        setError(error instanceof Error ? error.message : 'Failed to fetch guide')
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchGuide()
    }
  }, [id, user])

  const canUserEdit = Boolean(user && guide && guide.author.id === user.id)

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
    <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 4 } }}>
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
          sx={{ 
            mb: { xs: 2, sm: 3 },
            fontSize: { xs: '0.875rem', sm: '1rem' }
          }}
        >
          Back to Guides
        </Button>

        <Grid container spacing={{ xs: 2, sm: 3, md: 4 }} sx={{ mt: 2 }}>
          {/* Main Content */}
          <Grid item xs={12} lg={8}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card 
                className="gambling-card" 
                sx={{ 
                  mb: 3,
                  overflow: 'hidden',
                  boxShadow: { xs: 1, sm: 2, md: 3 },
                  borderRadius: { xs: 1, sm: 2 },
                  transition: 'all 0.3s ease-in-out',
                  '&:hover': {
                    boxShadow: { xs: 2, sm: 3, md: 4 },
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                <CardContent sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
                  <GuideHeader
                    guide={guide}
                    canUserEdit={canUserEdit}
                    handleEditClick={handleEditClick}
                    formattedDate={formattedDate}
                    roleBadge={roleBadge}
                  />

                  <GuideLikeSection
                    guide={guide}
                    user={user}
                    userHasLiked={userHasLiked}
                    liking={liking}
                    handleLikeToggle={handleLikeToggle}
                  />

                  <Divider sx={{ 
                    mb: 4, 
                    mx: { xs: -2, sm: -3, md: -4 },
                    borderColor: 'rgba(0, 0, 0, 0.08)'
                  }} />

                <Box sx={{ 
                  '& p': { mb: 2 }, 
                  '& h1, & h2, & h3, & h4, & h5, & h6': { mt: 3, mb: 2, fontWeight: 'bold' },
                  '& h1': { fontSize: { xs: '1.75rem', sm: '2.125rem' } },
                  '& h2': { fontSize: { xs: '1.5rem', sm: '1.875rem' } },
                  '& h3': { fontSize: { xs: '1.25rem', sm: '1.5rem' } },
                  '& h4': { fontSize: { xs: '1.125rem', sm: '1.25rem' } },
                  '& h5': { fontSize: { xs: '1rem', sm: '1.125rem' } },
                  '& h6': { fontSize: { xs: '0.875rem', sm: '1rem' } },
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
                    fontFamily: 'monospace',
                    fontSize: '0.875em'
                  },
                  '& pre': { 
                    backgroundColor: 'rgba(0, 0, 0, 0.1)', 
                    p: 2, 
                    borderRadius: 1, 
                    overflow: 'auto',
                    mb: 2,
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    '& code': {
                      backgroundColor: 'transparent',
                      padding: 0
                    }
                  },
                  '& table': {
                    width: '100%',
                    borderCollapse: 'collapse',
                    mb: 2,
                    overflow: 'auto',
                    display: 'block',
                    whiteSpace: 'nowrap',
                    [theme.breakpoints.up('sm')]: {
                      display: 'table',
                      whiteSpace: 'normal'
                    },
                    '& th, & td': {
                      border: '1px solid rgba(0, 0, 0, 0.12)',
                      p: 1,
                      textAlign: 'left',
                      fontSize: { xs: '0.75rem', sm: '0.875rem' }
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
                  },
                  '& img': {
                    maxWidth: '100%',
                    height: 'auto',
                    borderRadius: 1
                  }
                }}>
                  <TimelineSpoilerWrapper>
                    <EnhancedSpoilerMarkdown
                      content={guide.content}
                      enableEntityEmbeds={true}
                      compactEntityCards={false}
                    />
                  </TimelineSpoilerWrapper>
                </Box>
              </CardContent>
            </Card>
            </motion.div>
          </Grid>

          {/* Sidebar */}
          <Grid item xs={12} lg={4}>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Box sx={{ 
                position: { lg: 'sticky' }, 
                top: { lg: '100px' },
                display: 'flex',
                flexDirection: 'column',
                gap: 3
              }}>
                {hasRelatedContent && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.3 }}
                  >
                    <RelatedContentSection guide={guide} />
                  </motion.div>
                )}

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.4 }}
                >
                  <GuideTagsSection guide={guide} />
                </motion.div>

                {/* Call to Action */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.5 }}
                >
                  <Card 
                    variant="outlined" 
                    sx={{ 
                      backgroundColor: 'rgba(220, 0, 78, 0.02)',
                      border: '1px solid rgba(220, 0, 78, 0.1)',
                      textAlign: 'center',
                      transition: 'all 0.3s ease-in-out',
                      '&:hover': {
                        backgroundColor: 'rgba(220, 0, 78, 0.04)',
                        border: '1px solid rgba(220, 0, 78, 0.2)',
                        transform: 'translateY(-2px)',
                        boxShadow: 2
                      }
                    }}
                  >
                    <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                      <Typography 
                        variant="h6" 
                        gutterBottom 
                        sx={{ 
                          fontWeight: 'bold',
                          fontSize: { xs: '1.125rem', sm: '1.25rem' }
                        }}
                      >
                        Found this guide helpful?
                      </Typography>
                      <Typography 
                        variant="body2" 
                        color="text.secondary" 
                        sx={{ 
                          mb: 2,
                          fontSize: { xs: '0.875rem', sm: '1rem' }
                        }}
                      >
                        Share your own knowledge by writing a guide for the community
                      </Typography>
                      <Button
                        component={Link}
                        href="/submit-guide"
                        variant="contained"
                        startIcon={<FileText size={18} />}
                        fullWidth
                        sx={{
                          py: { xs: 1.25, sm: 1.5 },
                          fontSize: { xs: '0.875rem', sm: '1rem' },
                          fontWeight: 'bold',
                          transition: 'all 0.2s ease-in-out',
                          '&:hover': {
                            transform: 'scale(1.02)'
                          }
                        }}
                      >
                        Write Your Own Guide
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              </Box>
            </motion.div>
          </Grid>
        </Grid>

        {/* Edit Dialog */}
        <Dialog
          open={isEditing}
          onClose={handleCancelEdit}
          maxWidth="xl"
          fullWidth
          PaperProps={{
            sx: { 
              minHeight: '90vh',
              backgroundColor: '#0a0a0a',
              border: '2px solid #e11d48',
              borderRadius: 2
            }
          }}
        >
          <DialogTitle sx={{
            background: 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}>
            <Edit size={24} />
            Edit Guide
          </DialogTitle>
          <DialogContent sx={{ p: 0 }}>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: 0,
              backgroundColor: '#0a0a0a',
              color: 'white'
            }}>
              {/* Basic Information Section */}
              <Paper sx={{ 
                p: 3, 
                backgroundColor: 'rgba(225, 29, 72, 0.05)', 
                borderRadius: 0,
                border: 'none',
                borderBottom: '1px solid rgba(225, 29, 72, 0.2)'
              }}>
                <Typography variant="h6" sx={{ 
                  color: '#e11d48', 
                  mb: 2, 
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}>
                  <FileText size={20} />
                  Basic Information
                </Typography>
                
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField
                      label="Title"
                      value={editForm.title}
                      onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                      fullWidth
                      required
                      helperText="Choose a clear, descriptive title for your guide"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: '#0f0f0f',
                          '& fieldset': { borderColor: 'rgba(225, 29, 72, 0.3)' },
                          '&:hover fieldset': { borderColor: 'rgba(225, 29, 72, 0.5)' },
                          '&.Mui-focused fieldset': { borderColor: '#e11d48' }
                        },
                        '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' },
                        '& .MuiInputBase-input': { color: '#ffffff' },
                        '& .MuiFormHelperText-root': { color: 'rgba(255, 255, 255, 0.5)' }
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      label="Description"
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      fullWidth
                      multiline
                      rows={3}
                      required
                      helperText="Write a compelling description that summarizes your guide"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: '#0f0f0f',
                          '& fieldset': { borderColor: 'rgba(225, 29, 72, 0.3)' },
                          '&:hover fieldset': { borderColor: 'rgba(225, 29, 72, 0.5)' },
                          '&.Mui-focused fieldset': { borderColor: '#e11d48' }
                        },
                        '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' },
                        '& .MuiInputBase-input': { color: '#ffffff' },
                        '& .MuiFormHelperText-root': { color: 'rgba(255, 255, 255, 0.5)' }
                      }}
                    />
                  </Grid>
                </Grid>
              </Paper>

              {/* Content Editor with Entity Embeds */}
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ p: 3, backgroundColor: '#0a0a0a' }}>
                  <EntityEmbedHelperWithSearch onInsertEmbed={handleInsertEmbed} />
                  
                  <Card sx={{ 
                    mt: 2,
                    backgroundColor: '#0f0f0f',
                    border: '1px solid rgba(225, 29, 72, 0.3)'
                  }}>
                    <Box sx={{ borderBottom: 1, borderColor: 'rgba(225, 29, 72, 0.3)' }}>
                      <Tabs 
                        value={activeTab} 
                        onChange={handleTabChange}
                        sx={{
                          '& .MuiTab-root': { 
                            color: 'rgba(255, 255, 255, 0.7)',
                            '&.Mui-selected': { color: '#e11d48' }
                          },
                          '& .MuiTabs-indicator': { backgroundColor: '#e11d48' }
                        }}
                      >
                        <Tab label="Write" icon={<FileText size={16} />} iconPosition="start" />
                        <Tab label="Preview" icon={<Eye size={16} />} iconPosition="start" />
                      </Tabs>
                    </Box>
                    
                    <CardContent sx={{ p: 0 }}>
                      {activeTab === 0 ? (
                        <TextField
                          value={editForm.content}
                          onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                          fullWidth
                          multiline
                          minRows={18}
                          maxRows={25}
                          required
                          placeholder="Write your guide content here. Use Markdown for formatting and embed entities using {{entity_type:entity_id}} syntax."
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              backgroundColor: '#0f0f0f',
                              border: 'none',
                              '& fieldset': { border: 'none' },
                              fontFamily: 'monospace',
                              fontSize: '0.9rem',
                              lineHeight: 1.6
                            },
                            '& .MuiInputBase-input': { 
                              color: '#ffffff',
                              p: 3
                            }
                          }}
                        />
                      ) : (
                        <Box sx={{ 
                          p: 3,
                          minHeight: '500px',
                          backgroundColor: '#0f0f0f'
                        }}>
                          <Typography variant="h6" gutterBottom sx={{ color: '#e11d48' }}>
                            Preview
                          </Typography>
                          {editForm.content ? (
                            <EnhancedSpoilerMarkdown 
                              content={editForm.content}
                              compactEntityCards={false}
                            />
                          ) : (
                            <Typography color="text.secondary" fontStyle="italic">
                              Start writing your guide to see the preview with entity embeds...
                            </Typography>
                          )}
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Box>
              </Box>

              {/* Tags and Related Content */}
              <Paper sx={{ 
                p: 3, 
                backgroundColor: 'rgba(16, 185, 129, 0.05)', 
                borderRadius: 0,
                border: 'none',
                borderTop: '1px solid rgba(16, 185, 129, 0.2)'
              }}>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" sx={{ 
                      color: '#10b981',
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      mb: 2
                    }}>
                      <BookOpen size={20} />
                      Tags & Metadata
                    </Typography>
                    
                    <Autocomplete
                      multiple
                      freeSolo
                      value={editForm.tagNames}
                      onChange={(_, newValue) => {
                        setEditForm({ ...editForm, tagNames: newValue })
                      }}
                      inputValue={tagInput}
                      onInputChange={(_, newInputValue) => {
                        setTagInput(newInputValue)
                      }}
                      options={[]}
                      renderTags={(value, getTagProps) =>
                        value.map((option, index) => (
                          <Chip
                            variant="outlined"
                            label={option}
                            {...getTagProps({ index })}
                            key={option}
                            sx={{ 
                              backgroundColor: 'rgba(16, 185, 129, 0.1)',
                              borderColor: '#10b981',
                              color: '#10b981'
                            }}
                          />
                        ))
                      }
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Tags"
                          placeholder="Add tags (press Enter to add)"
                          helperText="Add relevant tags to help others find your guide"
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              backgroundColor: '#0f0f0f',
                              '& fieldset': { borderColor: 'rgba(16, 185, 129, 0.3)' },
                              '&:hover fieldset': { borderColor: 'rgba(16, 185, 129, 0.5)' },
                              '&.Mui-focused fieldset': { borderColor: '#10b981' }
                            },
                            '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' },
                            '& .MuiInputBase-input': { color: '#ffffff' },
                            '& .MuiFormHelperText-root': { color: 'rgba(255, 255, 255, 0.5)' }
                          }}
                        />
                      )}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" sx={{ 
                      color: '#10b981',
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      mb: 2
                    }}>
                      <Users size={20} />
                      Related Content
                    </Typography>
                    
                    {loadingRelationData ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                        <CircularProgress size={24} />
                      </Box>
                    ) : (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Autocomplete
                          multiple
                          options={characters}
                          getOptionLabel={(option) => option.name}
                          value={characters.filter(char => editForm.characterIds.includes(char.id))}
                          onChange={(_, newValue) => {
                            setEditForm({ ...editForm, characterIds: newValue.map(char => char.id) })
                          }}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Characters"
                              placeholder="Select related characters"
                              size="small"
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  backgroundColor: '#0f0f0f',
                                  '& fieldset': { borderColor: 'rgba(16, 185, 129, 0.3)' }
                                },
                                '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' },
                                '& .MuiInputBase-input': { color: '#ffffff' }
                              }}
                            />
                          )}
                          renderTags={(value, getTagProps) =>
                            value.map((option, index) => {
                              const { key, ...tagProps } = getTagProps({ index });
                              return (
                                <Chip
                                  key={key}
                                  label={option.name}
                                  {...tagProps}
                                  size="small"
                                  sx={{
                                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                    color: '#10b981'
                                  }}
                                />
                              );
                            })
                          }
                        />

                        <Autocomplete
                          options={arcs}
                          getOptionLabel={(option) => option.name}
                          value={arcs.find(arc => arc.id === editForm.arcId) || null}
                          onChange={(_, newValue) => {
                            setEditForm({ ...editForm, arcId: newValue?.id || null })
                          }}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Arc"
                              placeholder="Select related arc"
                              size="small"
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  backgroundColor: '#0f0f0f',
                                  '& fieldset': { borderColor: 'rgba(16, 185, 129, 0.3)' }
                                },
                                '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' },
                                '& .MuiInputBase-input': { color: '#ffffff' }
                              }}
                            />
                          )}
                        />

                        <Autocomplete
                          multiple
                          options={gambles}
                          getOptionLabel={(option) => option.name}
                          value={gambles.filter(gamble => editForm.gambleIds.includes(gamble.id))}
                          onChange={(_, newValue) => {
                            setEditForm({ ...editForm, gambleIds: newValue.map(gamble => gamble.id) })
                          }}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Gambles"
                              placeholder="Select related gambles"
                              size="small"
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  backgroundColor: '#0f0f0f',
                                  '& fieldset': { borderColor: 'rgba(16, 185, 129, 0.3)' }
                                },
                                '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' },
                                '& .MuiInputBase-input': { color: '#ffffff' }
                              }}
                            />
                          )}
                          renderTags={(value, getTagProps) =>
                            value.map((option, index) => {
                              const { key, ...tagProps } = getTagProps({ index });
                              return (
                                <Chip
                                  key={key}
                                  label={option.name}
                                  {...tagProps}
                                  size="small"
                                  sx={{
                                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                    color: '#10b981'
                                  }}
                                />
                              );
                            })
                          }
                        />
                      </Box>
                    )}
                  </Grid>
                </Grid>
              </Paper>
            </Box>
          </DialogContent>
          <DialogActions sx={{ 
            px: 4, 
            py: 3, 
            backgroundColor: '#0a0a0a',
            borderTop: '1px solid rgba(225, 29, 72, 0.2)',
            gap: 2,
            flexDirection: 'column',
            alignItems: 'stretch'
          }}>
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mb: 1 }}>
              Your guide will be submitted for review when you save changes.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                onClick={handleCancelEdit}
                startIcon={<X size={16} />}
                disabled={saving}
                sx={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    borderColor: 'rgba(255, 255, 255, 0.5)'
                  }
                }}
                variant="outlined"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveEdit}
                variant="contained"
                startIcon={<Save size={16} />}
                disabled={saving || !editForm.title || !editForm.description || !editForm.content}
                sx={{
                  backgroundColor: '#e11d48',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: '#be123c'
                  },
                  '&:disabled': {
                    backgroundColor: 'rgba(225, 29, 72, 0.3)',
                    color: 'rgba(255, 255, 255, 0.5)'
                  }
                }}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </Box>
          </DialogActions>
        </Dialog>
      </motion.div>
    </Container>
  )
}