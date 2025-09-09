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
  Autocomplete
} from '@mui/material'
import { ArrowLeft, FileText, Calendar, ThumbsUp, User, Heart, Edit, Save, X, Users, BookOpen, Dice6 } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { api } from '../../../lib/api'
import { motion } from 'motion/react'
import { useAuth } from '../../../providers/AuthProvider'
import SpoilerWrapper from '../../../components/SpoilerWrapper'
import SpoilerMarkdown from '../../../components/SpoilerMarkdown'
import { usePageView } from '../../../hooks/usePageView'

interface Guide {
  id: number
  title: string
  description: string
  content: string
  status: string
  viewCount: number
  likeCount: number
  userHasLiked?: boolean
  author: {
    id: number
    username: string
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

export default function GuideDetailsPage() {
  const { id } = useParams()
  const { user } = useAuth()
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
    status: 'draft' as string,
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

  // Track page view
  const guideId = Array.isArray(id) ? id[0] : id
  usePageView('guide', guideId || '', !!guideId)

  useEffect(() => {
    const fetchGuide = async () => {
      try {
        setLoading(true)
        let response
        if (user) {
          // Try authenticated endpoint first to get full guide data including status
          try {
            response = await api.getGuideAdmin(Number(id))
          } catch {
            // If authenticated request fails, fall back to public endpoint
            response = await api.getGuide(Number(id))
          }
        } else {
          // Use public endpoint for non-authenticated users
          response = await api.getGuide(Number(id))
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

  const handleLikeToggle = async () => {
    if (!user || liking) return
    
    setLiking(true)
    try {
      const response = await api.toggleGuideLike(Number(id))
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
  }

  const handleEditClick = async () => {
    if (guide) {
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
      
      // Load relation data for dropdowns
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
    }
  }

  const handleSaveEdit = async () => {
    if (!guide || saving) return
    
    setSaving(true)
    try {
      const updateData = {
        title: editForm.title,
        description: editForm.description,
        content: editForm.content,
        status: editForm.status,
        tagNames: editForm.tagNames,
        characterIds: editForm.characterIds.length > 0 ? editForm.characterIds : undefined,
        arcId: editForm.arcId || undefined,
        gambleIds: editForm.gambleIds.length > 0 ? editForm.gambleIds : undefined
      }
      const updatedGuide = await api.updateGuide(Number(id), updateData)
      setGuide(updatedGuide)
      setIsEditing(false)
      setError('')
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Failed to update guide')
    } finally {
      setSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditForm({
      title: '',
      description: '',
      content: '',
      status: 'draft',
      tagNames: [],
      characterIds: [],
      arcId: null,
      gambleIds: []
    })
  }

  const canUserEdit = user && guide && guide.author.id === user.id

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
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Typography variant="h3" component="h1" gutterBottom sx={{ flex: 1 }}>
                  {guide.title}
                </Typography>
                {canUserEdit && (
                  <Button
                    variant="outlined"
                    startIcon={<Edit size={16} />}
                    onClick={handleEditClick}
                    sx={{ ml: 2 }}
                  >
                    Edit Guide
                  </Button>
                )}
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ width: 32, height: 32, mr: 1 }}>
                    <User size={16} />
                  </Avatar>
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
                      }
                    }}
                  >
                    by {guide.author.username}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Calendar size={16} />
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
                    {new Date(guide.createdAt).toLocaleDateString()}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ThumbsUp size={16} />
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
                    {guide.likeCount || 0} likes
                  </Typography>
                  {user && (
                    <Button
                      size="small"
                      variant={userHasLiked ? "contained" : "outlined"}
                      color="primary"
                      startIcon={<Heart size={16} />}
                      onClick={handleLikeToggle}
                      disabled={liking}
                      sx={{ ml: 1 }}
                    >
                      {liking ? '...' : userHasLiked ? 'Liked' : 'Like'}
                    </Button>
                  )}
                </Box>
              </Box>

              {((guide.characters && guide.characters.length > 0) || guide.arc || (guide.gambles && guide.gambles.length > 0)) && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom sx={{ mb: 2, fontWeight: 'bold' }}>
                    Related Content
                  </Typography>
                  
                  {guide.characters && guide.characters.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Users size={18} style={{ marginRight: 8 }} />
                        <Typography variant="subtitle2" color="text.secondary">
                          Characters
                        </Typography>
                      </Box>
                      <Box sx={{ ml: 3 }}>
                        {guide.characters.map((character) => (
                          <Chip
                            key={character.id}
                            label={character.name}
                            size="small"
                            color="primary"
                            sx={{ mr: 0.5, mb: 0.5 }}
                            component={Link}
                            href={`/characters/${character.id}`}
                            clickable
                          />
                        ))}
                      </Box>
                    </Box>
                  )}
                  
                  {guide.arc && (
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <BookOpen size={18} style={{ marginRight: 8 }} />
                        <Typography variant="subtitle2" color="text.secondary">
                          Arc
                        </Typography>
                      </Box>
                      <Box sx={{ ml: 3 }}>
                        <Chip
                          label={guide.arc.name}
                          size="small"
                          color="secondary"
                          component={Link}
                          href={`/arcs/${guide.arc.id}`}
                          clickable
                        />
                      </Box>
                    </Box>
                  )}
                  
                  {guide.gambles && guide.gambles.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Dice6 size={18} style={{ marginRight: 8 }} />
                        <Typography variant="subtitle2" color="text.secondary">
                          Gambles
                        </Typography>
                      </Box>
                      <Box sx={{ ml: 3 }}>
                        {guide.gambles.map((gamble) => (
                          <Chip
                            key={gamble.id}
                            label={gamble.name}
                            size="small"
                            color="info"
                            sx={{ mr: 0.5, mb: 0.5 }}
                            component={Link}
                            href={`/gambles/${gamble.id}`}
                            clickable
                          />
                        ))}
                      </Box>
                    </Box>
                  )}
                </Box>
              )}

              {guide.tags?.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Tags
                  </Typography>
                  {guide.tags.map((tag) => (
                    <Chip
                      key={tag.id}
                      label={tag.name}
                      size="small"
                      variant="outlined"
                      color="default"
                      sx={{ mr: 0.5, mb: 0.5, opacity: 0.8 }}
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
              <SpoilerWrapper
                spoilerType="minor"
                description="Guide content may contain story spoilers"
              >
                <SpoilerMarkdown 
                  content={guide.content}
                />
              </SpoilerWrapper>
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

        {/* Edit Dialog */}
        <Dialog
          open={isEditing}
          onClose={handleCancelEdit}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: { minHeight: '80vh' }
          }}
        >
          <DialogTitle>
            Edit Guide
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
              <TextField
                label="Title"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                fullWidth
                required
                helperText="Choose a clear, descriptive title for your guide"
              />

              <TextField
                label="Description"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                fullWidth
                multiline
                rows={3}
                required
                helperText="Write a compelling description that summarizes your guide"
              />

              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={editForm.status}
                  label="Status"
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                >
                  <MenuItem value="draft">Draft</MenuItem>
                  <MenuItem value="pending">Submit for Review</MenuItem>
                  <MenuItem value="published">Published</MenuItem>
                </Select>
              </FormControl>

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
                    />
                  ))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Tags"
                    placeholder="Add tags (press Enter to add)"
                    helperText="Add relevant tags to help others find your guide"
                  />
                )}
              />

              {/* Related Content Section */}
              <Box sx={{ 
                p: 3, 
                backgroundColor: 'rgba(16, 185, 129, 0.05)', 
                borderRadius: 2, 
                border: '1px solid #10b981',
                mb: 2
              }}>
                <Typography variant="h6" gutterBottom sx={{ 
                  color: '#10b981',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  mb: 2
                }}>
                  <BookOpen size={20} />
                  Related Content (Optional)
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
                          helperText="Link to characters featured in your guide"
                        />
                      )}
                      renderOption={(props, option) => (
                        <li {...props}>
                          <Users size={16} style={{ marginRight: 8 }} />
                          {option.name}
                        </li>
                      )}
                      renderTags={(value, getTagProps) =>
                        value.map((option, index) => {
                          const { key, ...tagProps } = getTagProps({ index });
                          return (
                            <Chip
                              key={key}
                              label={option.name}
                              {...tagProps}
                              color="primary"
                              size="small"
                              icon={<Users size={14} />}
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
                          helperText="Link to the story arc your guide covers"
                        />
                      )}
                      renderOption={(props, option) => (
                        <li {...props}>
                          <BookOpen size={16} style={{ marginRight: 8 }} />
                          {option.name}
                        </li>
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
                          helperText="Link to gambles analyzed in your guide"
                        />
                      )}
                      renderOption={(props, option) => (
                        <li {...props}>
                          <Dice6 size={16} style={{ marginRight: 8 }} />
                          {option.name}
                        </li>
                      )}
                      renderTags={(value, getTagProps) =>
                        value.map((option, index) => {
                          const { key, ...tagProps } = getTagProps({ index });
                          return (
                            <Chip
                              key={key}
                              label={option.name}
                              {...tagProps}
                              color="secondary"
                              size="small"
                              icon={<Dice6 size={14} />}
                            />
                          );
                        })
                      }
                    />
                  </Box>
                )}
              </Box>

              <TextField
                label="Content"
                value={editForm.content}
                onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                fullWidth
                multiline
                minRows={15}
                maxRows={25}
                required
                helperText="Write your guide content in Markdown format"
                sx={{
                  '& .MuiInputBase-root': {
                    fontFamily: 'monospace'
                  }
                }}
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button
              onClick={handleCancelEdit}
              startIcon={<X size={16} />}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              variant="contained"
              startIcon={<Save size={16} />}
              disabled={saving || !editForm.title || !editForm.description || !editForm.content}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogActions>
        </Dialog>
      </motion.div>
    </Container>
  )
}