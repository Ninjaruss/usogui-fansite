'use client'

import React, { useState, useEffect } from 'react'
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Grid,
  Chip,
  Autocomplete,
  FormControl
} from '@mui/material'
import { FileText, Send, Plus, X, Users, BookOpen, Dice6 } from 'lucide-react'
import { useTheme } from '@mui/material/styles'
import { useAuth } from '../../providers/AuthProvider'
import { api } from '../../lib/api'
import { motion } from 'motion/react'

export default function SubmitGuidePage() {
  const theme = useTheme()
  const { user, loading: authLoading } = useAuth()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    tags: [] as string[],
    characterIds: [] as number[],
    arcId: null as number | null,
    gambleIds: [] as number[]
  })
  const [newTag, setNewTag] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [characters, setCharacters] = useState<Array<{id: number, name: string}>>([])
  const [arcs, setArcs] = useState<Array<{id: number, name: string}>>([])
  const [gambles, setGambles] = useState<Array<{id: number, name: string}>>([])
  const [loadingData, setLoadingData] = useState(true)

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }))
      setNewTag('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      await api.createGuide({
        title: formData.title,
        description: formData.description,
        content: formData.content,
        tags: formData.tags,
        characterIds: formData.characterIds.length > 0 ? formData.characterIds : undefined,
        arcId: formData.arcId || undefined,
        gambleIds: formData.gambleIds.length > 0 ? formData.gambleIds : undefined
      })
      setSuccess('Guide submitted successfully! It is now pending moderator approval and will be reviewed before being published.')
      setFormData({
        title: '',
        description: '',
        content: '',
        tags: [],
        characterIds: [],
        arcId: null,
        gambleIds: []
      })
    } catch (error: any) {
      setError(error.message || 'Failed to submit guide')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && event.target === event.currentTarget) {
      event.preventDefault()
      addTag()
    }
  }

  useEffect(() => {
    const loadData = async () => {
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
        console.error('Error loading data:', error)
      } finally {
        setLoadingData(false)
      }
    }
    
    loadData()
  }, [])

  if (authLoading || loadingData) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <CircularProgress size={50} />
        </Box>
      </Container>
    )
  }

  if (!user) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Alert severity="warning">
          Please log in to submit a guide.
        </Alert>
      </Container>
    )
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <FileText size={48} color={theme.palette.usogui.guide} />
          </Box>
          <Typography variant="h3" component="h1" gutterBottom>
            Write a Guide
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Share your knowledge and insights about Usogui with the community
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {success}
          </Alert>
        )}

        <Card className="gambling-card">
          <CardContent>
            <form onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Guide Title"
                    placeholder="e.g., &apos;Understanding the Rules of Air Poker&apos; or &apos;Character Analysis: Baku Madarame&apos;"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    required
                    helperText="Choose a clear, descriptive title for your guide"
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Guide Description"
                    placeholder="Provide a brief summary of what your guide covers. This will be shown in guide listings to help readers understand what they'll learn."
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    required
                    helperText="Write a compelling description (10-1000 characters) that summarizes your guide"
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={12}
                    label="Guide Content"
                    placeholder="Write your guide here. You can include:
                    
• Analysis of characters, gambles, or story arcs
• Explanations of complex gambling rules
• Theories about plot developments
• Comparisons between different elements
• Tips for new readers

Be detailed and informative. Use clear headings and structure your content well."
                    value={formData.content}
                    onChange={(e) => handleInputChange('content', e.target.value)}
                    required
                    helperText="Minimum 50 characters. Use line breaks to structure your content."
                  />
                </Grid>

                <Grid item xs={12}>
                  <Box sx={{ 
                    p: 3, 
                    backgroundColor: 'rgba(16, 185, 129, 0.05)', 
                    borderRadius: 2, 
                    border: `1px solid ${theme.palette.usogui.guide}`,
                    mb: 3
                  }}>
                    <Typography variant="h6" gutterBottom sx={{ 
                      color: theme.palette.usogui.guide,
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}>
                      <BookOpen size={20} />
                      Related Content (Optional)
                    </Typography>
                    
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={4}>
                        <FormControl fullWidth>
                          <Autocomplete
                            multiple
                            options={characters}
                            getOptionLabel={(option) => option.name}
                            value={characters.filter(char => formData.characterIds.includes(char.id))}
                            onChange={(_, newValue) => {
                              handleInputChange('characterIds', newValue.map(char => char.id))
                            }}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                label="Characters"
                                placeholder="Select related characters"
                                helperText="Link to characters featured in your guide"
                              />
                            )}
                            renderOption={(props, option) => {
                              const { key, ...otherProps } = props;
                              return (
                                <li key={key} {...otherProps}>
                                  <Users size={16} style={{ marginRight: 8 }} />
                                  {option.name}
                                </li>
                              );
                            }}
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
                        </FormControl>
                      </Grid>

                      <Grid item xs={12} md={4}>
                        <FormControl fullWidth>
                          <Autocomplete
                            options={arcs}
                            getOptionLabel={(option) => option.name}
                            value={arcs.find(arc => arc.id === formData.arcId) || null}
                            onChange={(_, newValue) => {
                              handleInputChange('arcId', newValue?.id || null)
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
                        </FormControl>
                      </Grid>

                      <Grid item xs={12} md={4}>
                        <FormControl fullWidth>
                          <Autocomplete
                            multiple
                            options={gambles}
                            getOptionLabel={(option) => option.name}
                            value={gambles.filter(gamble => formData.gambleIds.includes(gamble.id))}
                            onChange={(_, newValue) => {
                              handleInputChange('gambleIds', newValue.map(gamble => gamble.id))
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
                        </FormControl>
                      </Grid>
                    </Grid>
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Tags
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                      {formData.tags.map((tag) => (
                        <Chip
                          key={tag}
                          label={tag}
                          onDelete={() => removeTag(tag)}
                          color="primary"
                          variant="outlined"
                          deleteIcon={<X size={16} />}
                        />
                      ))}
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <TextField
                        size="small"
                        label="Add tag"
                        placeholder="e.g., character-analysis, gambling, theory"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyPress={handleKeyPress}
                        sx={{ flexGrow: 1 }}
                      />
                      <Button
                        variant="outlined"
                        onClick={addTag}
                        startIcon={<Plus size={16} />}
                        disabled={!newTag.trim() || formData.tags.includes(newTag.trim())}
                      >
                        Add
                      </Button>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      Add relevant tags to help others find your guide (e.g., characters, gambles, arcs, analysis)
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    fullWidth
                    disabled={loading || !formData.title || !formData.description || !formData.content || formData.description.length < 10 || formData.content.length < 50}
                    startIcon={loading ? <CircularProgress size={20} /> : <Send size={20} />}
                  >
                    {loading ? 'Submitting...' : 'Submit Guide'}
                  </Button>
                </Grid>
              </Grid>
            </form>
          </CardContent>
        </Card>

        <Box sx={{ mt: 4 }}>
          <Alert severity="info">
            <Typography variant="body2">
              <strong>Guide Writing Tips:</strong>
              <br />• Be thorough and informative
              <br />• Use clear headings and structure
              <br />• Avoid major spoilers unless clearly marked
              <br />• Cite sources when referencing specific chapters
              <br />• Proofread before submitting
              <br />• Guides will be reviewed before publication
            </Typography>
          </Alert>
        </Box>
      </motion.div>
    </Container>
  )
}