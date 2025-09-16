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
  FormControl,
  Tab,
  Tabs
} from '@mui/material'
import { FileText, Send, Plus, X, Users, BookOpen, Dice6, Eye } from 'lucide-react'
import { useTheme } from '@mui/material/styles'
import { useAuth } from '../../providers/AuthProvider'
import { api } from '../../lib/api'
import { motion } from 'motion/react'
import EntityEmbedHelperWithSearch from '../../components/EntityEmbedHelperWithSearch'
import EnhancedSpoilerMarkdown from '../../components/EnhancedSpoilerMarkdown'

export default function SubmitGuidePageContent() {
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
  const [activeTab, setActiveTab] = useState(0)
  const [contentTextAreaRef, setContentTextAreaRef] = useState<HTMLTextAreaElement | null>(null)

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

  const validateForm = () => {
    if (!formData.title.trim()) {
      return 'Title is required'
    }
    if (formData.title.length < 5) {
      return 'Title must be at least 5 characters long'
    }
    if (!formData.description.trim()) {
      return 'Description is required'
    }
    if (formData.description.length < 20) {
      return 'Description must be at least 20 characters long'
    }
    if (!formData.content.trim()) {
      return 'Content is required'
    }
    if (formData.content.length < 100) {
      return 'Content must be at least 100 characters long'
    }
    return null
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setSuccess('')

    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)

    try {
      await api.createGuide({
        title: formData.title.trim(),
        description: formData.description.trim(),
        content: formData.content.trim(),
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
      setError(error.message || 'Failed to submit guide. Please try again.')
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

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue)
  }

  const handleInsertEmbed = (embedCode: string) => {
    if (contentTextAreaRef) {
      const textArea = contentTextAreaRef
      const currentValue = formData.content
      const cursorPosition = textArea.selectionStart || currentValue.length
      const newValue =
        currentValue.slice(0, cursorPosition) +
        embedCode +
        currentValue.slice(cursorPosition)

      setFormData(prev => ({
        ...prev,
        content: newValue
      }))

      // Focus back to textarea and position cursor after the inserted embed
      setTimeout(() => {
        textArea.focus()
        textArea.setSelectionRange(
          cursorPosition + embedCode.length,
          cursorPosition + embedCode.length
        )
      }, 100)
    } else {
      // Fallback: just append to the end
      setFormData(prev => ({
        ...prev,
        content: prev.content + embedCode
      }))
    }
  }

  useEffect(() => {
    const loadData = async () => {
      try {
        const [charactersRes, arcsRes, gamblesRes] = await Promise.all([
          api.getCharacters({ limit: 500 }),
          api.getArcs({ limit: 200 }),
          api.getGambles({ limit: 500 })
        ])
        
        setCharacters(charactersRes.data || [])
        setArcs(arcsRes.data || [])
        setGambles(gamblesRes.data || [])
      } catch (error) {
        console.error('Error loading data:', error)
        setError('Failed to load form data. Please refresh the page.')
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

  const isFormValid = !validateForm()

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
                {/* Title */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Guide Title"
                    placeholder="e.g., 'Understanding the Rules of Air Poker' or 'Character Analysis: Baku Madarame'"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    required
                    error={formData.title.length > 0 && formData.title.length < 5}
                    helperText={
                      formData.title.length > 0 && formData.title.length < 5
                        ? 'Title must be at least 5 characters long'
                        : 'Choose a clear, descriptive title for your guide (minimum 5 characters)'
                    }
                  />
                </Grid>

                {/* Description */}
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
                    error={formData.description.length > 0 && formData.description.length < 20}
                    helperText={
                      formData.description.length > 0 && formData.description.length < 20
                        ? 'Description must be at least 20 characters long'
                        : `Write a compelling description that summarizes your guide (${formData.description.length}/20+ characters)`
                    }
                  />
                </Grid>

                {/* Enhanced Content Section with Entity Embeds */}
                <Grid item xs={12}>
                  <EntityEmbedHelperWithSearch onInsertEmbed={handleInsertEmbed} />
                  
                  <Card className="gambling-card">
                    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                      <Tabs value={activeTab} onChange={handleTabChange}>
                        <Tab label="Write" icon={<FileText size={16} />} iconPosition="start" />
                        <Tab label="Preview" icon={<Eye size={16} />} iconPosition="start" />
                      </Tabs>
                    </Box>
                    
                    <CardContent>
                      {activeTab === 0 ? (
                        <TextField
                          fullWidth
                          multiline
                          rows={16}
                          label="Guide Content"
                          placeholder="Write your guide here. Use Markdown for formatting and embed entities using {{entity_type:entity_id}} syntax. You may use entity embed search above to insert embeds."
                          value={formData.content}
                          onChange={(e) => handleInputChange('content', e.target.value)}
                          required
                          error={formData.content.length > 0 && formData.content.length < 100}
                          helperText={
                            formData.content.length > 0 && formData.content.length < 100
                              ? 'Content must be at least 100 characters long'
                              : `Write your detailed guide content with entity embeds (${formData.content.length}/100+ characters)`
                          }
                          inputProps={{
                            ref: (ref: HTMLTextAreaElement) => setContentTextAreaRef(ref)
                          }}
                        />
                      ) : (
                        <Box>
                          <Typography variant="h6" gutterBottom>
                            Preview
                          </Typography>
                          <Box sx={{ 
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: 1,
                            p: 2,
                            minHeight: '400px',
                            backgroundColor: 'rgba(0,0,0,0.02)'
                          }}>
                            {formData.content ? (
                              <EnhancedSpoilerMarkdown 
                                content={formData.content}
                                compactEntityCards={false}
                              />
                            ) : (
                              <Typography color="text.secondary" fontStyle="italic">
                                Start writing your guide to see the preview with entity embeds...
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>

                {/* Related Content Section */}
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
                      {/* Characters */}
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
                              const { key, ...otherProps } = props
                              return (
                                <li key={key} {...otherProps}>
                                  <Users size={16} style={{ marginRight: 8 }} />
                                  {option.name}
                                </li>
                              )
                            }}
                            renderTags={(value, getTagProps) =>
                              value.map((option, index) => {
                                const { key, ...tagProps } = getTagProps({ index })
                                return (
                                  <Chip
                                    key={key}
                                    label={option.name}
                                    {...tagProps}
                                    color="primary"
                                    size="small"
                                    icon={<Users size={14} />}
                                  />
                                )
                              })
                            }
                          />
                        </FormControl>
                      </Grid>

                      {/* Arc */}
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
                            renderOption={(props, option) => {
                              const { key, ...otherProps } = props
                              return (
                                <li key={key} {...otherProps}>
                                  <BookOpen size={16} style={{ marginRight: 8 }} />
                                  {option.name}
                                </li>
                              )
                            }}
                          />
                        </FormControl>
                      </Grid>

                      {/* Gambles */}
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
                            renderOption={(props, option) => {
                              const { key, ...otherProps } = props
                              return (
                                <li key={key} {...otherProps}>
                                  <Dice6 size={16} style={{ marginRight: 8 }} />
                                  {option.name}
                                </li>
                              )
                            }}
                            renderTags={(value, getTagProps) =>
                              value.map((option, index) => {
                                const { key, ...tagProps } = getTagProps({ index })
                                return (
                                  <Chip
                                    key={key}
                                    label={option.name}
                                    {...tagProps}
                                    color="secondary"
                                    size="small"
                                    icon={<Dice6 size={14} />}
                                  />
                                )
                              })
                            }
                          />
                        </FormControl>
                      </Grid>
                    </Grid>
                  </Box>
                </Grid>

                {/* Tags */}
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

                {/* Submit Button */}
                <Grid item xs={12}>
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    fullWidth
                    disabled={loading || !isFormValid}
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
              <br />• Use entity embeds to reference characters, arcs, gambles, etc. (e.g., <code>{'{{character:1}}'}</code>)
              <br />• Add custom text to embeds for context (e.g., <code>{'{{character:1:the protagonist}}'}</code>)
              <br />• Avoid major spoilers unless clearly marked
              <br />• Cite sources when referencing specific chapters
              <br />• Use the Preview tab to see how your entity embeds will look
              <br />• Proofread before submitting
              <br />• Guides will be reviewed before publication
            </Typography>
          </Alert>
        </Box>
      </motion.div>
    </Container>
  )
}
