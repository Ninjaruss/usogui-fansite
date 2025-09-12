'use client'

import React, { useState, useEffect, Suspense } from 'react'
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Box,
  TextField,
  InputAdornment,
  Pagination,
  CircularProgress,
  Alert,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Snackbar
} from '@mui/material'
import { Search, BookOpen, Eye, Edit, Upload, X } from 'lucide-react'
import { useTheme } from '@mui/material/styles'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { api } from '../../lib/api'
import { useAuth } from '../../providers/AuthProvider'
import { motion } from 'motion/react'
import MediaThumbnail from '../../components/MediaThumbnail'

interface Arc {
  id: number
  name: string
  description: string
  startChapter?: number
  endChapter?: number
  createdAt?: string
  updatedAt?: string
  imageFileName?: string
  imageDisplayName?: string
}

function ArcsPageContent() {
  const { user } = useAuth()
  const theme = useTheme()
  const searchParams = useSearchParams()
  const [arcs, setArcs] = useState<Arc[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [characterFilter, setCharacterFilter] = useState<string | null>(null)
  
  // Image upload state
  const [imageDialogOpen, setImageDialogOpen] = useState(false)
  const [selectedArc, setSelectedArc] = useState<Arc | null>(null)
  const [imageDisplayName, setImageDisplayName] = useState('')
  const [uploading, setUploading] = useState(false)
  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const isModeratorOrAdmin = user?.role === 'moderator' || user?.role === 'admin'

  const fetchArcs = async (page = 1, search = '', characterName?: string) => {
    setLoading(true)
    try {
      let response
      
      if (characterName) {
        // First find the character ID by name
        const charactersResponse = await api.getCharacters({ name: characterName, limit: 1 })
        if (charactersResponse.data.length > 0) {
          const characterId = charactersResponse.data[0].id
          // Get character-specific arcs
          const characterArcsResponse = await api.getCharacterArcs(characterId)
          // For character filtering, we'll simulate pagination client-side
          const allArcs = characterArcsResponse.data || []
          const startIndex = (page - 1) * 12
          const endIndex = startIndex + 12
          const paginatedArcs = allArcs.slice(startIndex, endIndex)
          
          response = {
            data: paginatedArcs,
            total: allArcs.length,
            totalPages: Math.ceil(allArcs.length / 12),
            page
          }
        } else {
          // Character not found, return empty results
          response = { data: [], total: 0, totalPages: 1, page: 1 }
        }
      } else {
        // Normal arc fetching with search
        const params: { page: number; limit: number; name?: string } = { page, limit: 12 }
        if (search) params.name = search
        response = await api.getArcs(params)
      }
      
      setArcs(response.data)
      setTotalPages(response.totalPages)
      setTotal(response.total)
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Failed to fetch arcs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const character = searchParams.get('character')
    setCharacterFilter(character)
    fetchArcs(currentPage, searchQuery, character || undefined)
  }, [currentPage, searchQuery, searchParams])

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value)
    setCurrentPage(1)
  }

  const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
    setCurrentPage(page)
  }

  const getChapterCount = (arc: Arc) => {
    if (typeof arc.startChapter === 'undefined' || typeof arc.endChapter === 'undefined') {
      return null
    }
    return arc.endChapter - arc.startChapter + 1
  }

  const handleEditImage = (arc: Arc) => {
    setSelectedArc(arc)
    setImageDisplayName(arc.imageDisplayName || '')
    setImageDialogOpen(true)
  }

  const handleCloseImageDialog = () => {
    setImageDialogOpen(false)
    setSelectedArc(null)
    setImageDisplayName('')
    setSelectedFile(null)
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
      if (!allowedTypes.includes(file.type)) {
        setSnackbarMessage('Please select a valid image file (JPEG, PNG, WebP, or GIF)')
        setSnackbarOpen(true)
        return
      }

      // Validate file size (10MB limit)
      const maxSize = 10 * 1024 * 1024
      if (file.size > maxSize) {
        setSnackbarMessage('File size must be less than 10MB')
        setSnackbarOpen(true)
        return
      }

      setSelectedFile(file)
    }
  }

  const handleUploadImage = async () => {
    if (!selectedArc || !selectedFile) return

    setUploading(true)
    try {
      await api.uploadArcImage(selectedArc.id, selectedFile, imageDisplayName.trim() || undefined)
      
      await fetchArcs(currentPage, searchQuery)
      setSnackbarMessage('Arc image uploaded successfully!')
      setSnackbarOpen(true)
      handleCloseImageDialog()
    } catch (error: unknown) {
      setSnackbarMessage(error instanceof Error ? error.message : 'Failed to upload image')
      setSnackbarOpen(true)
    } finally {
      setUploading(false)
    }
  }


  const handleRemoveImage = async () => {
    if (!selectedArc) return

    setUploading(true)
    try {
      await api.removeArcImage(selectedArc.id)
      
      await fetchArcs(currentPage, searchQuery)
      setSnackbarMessage('Arc image removed successfully!')
      setSnackbarOpen(true)
      handleCloseImageDialog()
    } catch (error: unknown) {
      setSnackbarMessage(error instanceof Error ? error.message : 'Failed to remove image')
      setSnackbarOpen(true)
    } finally {
      setUploading(false)
    }
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <BookOpen size={48} color={theme.palette.usogui.arc} />
          </Box>
          <Typography variant="h3" component="h1" gutterBottom>
            Story Arcs
          </Typography>
          <Typography variant="h6" color="text.secondary">
            {characterFilter 
              ? `Arcs featuring ${characterFilter}`
              : 'Explore the major storylines and arcs of Usogui'
            }
          </Typography>
        </Box>

        <Box sx={{ mb: 4 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search arcs..."
            value={searchQuery}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={20} />
                </InputAdornment>
              ),
            }}
            sx={{ maxWidth: 500, mx: 'auto', display: 'block' }}
          />
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress size={50} />
          </Box>
        ) : (
          <>
            <Typography variant="h6" sx={{ mb: 3 }}>
              {total} arc{total !== 1 ? 's' : ''} found
            </Typography>

            <Grid container spacing={4}>
              {arcs.map((arc, index) => (
                <Grid item xs={12} sm={6} md={4} key={arc.id}>
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
                      <Box sx={{ position: 'relative' }}>
                        <MediaThumbnail
                          entityType="arc"
                          entityId={arc.id}
                          entityName={arc.name}
                          maxWidth="100%"
                          maxHeight="200px"
                          allowCycling={false}
                        />
                        {isModeratorOrAdmin && (
                          <IconButton
                            onClick={() => handleEditImage(arc)}
                            sx={{
                              position: 'absolute',
                              top: 8,
                              right: 8,
                              backgroundColor: 'rgba(0, 0, 0, 0.7)',
                              color: 'white',
                              '&:hover': {
                                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                              },
                            }}
                            size="small"
                          >
                            <Edit size={16} />
                          </IconButton>
                        )}
                      </Box>
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" component="h2" gutterBottom>
                          {arc.name}
                        </Typography>
                        
                        <Box sx={{ mb: 2 }}>
                          {arc.startChapter && arc.endChapter && (
                            <Chip
                              label={`Chapters ${arc.startChapter}-${arc.endChapter}`}
                              size="small"
                              color="secondary"
                              variant="outlined"
                              sx={{ mr: 1 }}
                            />
                          )}
                          {getChapterCount(arc) && (
                            <Chip
                              label={`${getChapterCount(arc)} chapters`}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          )}
                        </Box>

                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            overflow: 'hidden',
                            display: '-webkit-box',
                            WebkitBoxOrient: 'vertical',
                            WebkitLineClamp: 4,
                          }}
                        >
                          {arc.description}
                        </Typography>
                      </CardContent>

                      <CardActions>
                        <Button
                          component={Link}
                          href={`/arcs/${arc.id}`}
                          variant="outlined"
                          startIcon={<Eye size={16} />}
                          fullWidth
                        >
                          View Details
                        </Button>
                      </CardActions>
                    </Card>
                  </motion.div>
                </Grid>
              ))}
            </Grid>

            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <Pagination
                  count={totalPages}
                  page={currentPage}
                  onChange={handlePageChange}
                  color="primary"
                  size="large"
                />
              </Box>
            )}
          </>
        )}

        {/* Image Edit Dialog */}
        <Dialog open={imageDialogOpen} onClose={handleCloseImageDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            Edit Image for {selectedArc?.name}
            <IconButton
              onClick={handleCloseImageDialog}
              sx={{
                position: 'absolute',
                right: 8,
                top: 8,
                color: (theme) => theme.palette.grey[500],
              }}
            >
              <X />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Upload a new image file to replace the current image:
            </Typography>

            {/* File Upload Section */}
            <Box sx={{ mb: 3, p: 2, border: '1px dashed', borderColor: 'primary.main', borderRadius: 1 }}>
              <Typography variant="h6" gutterBottom>
                Upload New Image
              </Typography>
              <input
                accept="image/jpeg,image/png,image/webp,image/gif"
                style={{ display: 'none' }}
                id="arc-image-upload"
                type="file"
                onChange={handleFileSelect}
              />
              <label htmlFor="arc-image-upload">
                <Button
                  variant="outlined"
                  component="span"
                  fullWidth
                  sx={{ mb: 2 }}
                  startIcon={<Upload />}
                  disabled={uploading}
                >
                  Select Image File
                </Button>
              </label>
              {selectedFile && (
                <Box>
                  <Typography variant="body2" color="primary">
                    Selected: {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
                  </Typography>
                </Box>
              )}
              <Typography variant="caption" color="text.secondary">
                Supported: JPEG, PNG, WebP, GIF • Max size: 10MB
              </Typography>
            </Box>


            <TextField
              fullWidth
              label="Display Name (Optional)"
              placeholder="e.g., Official Cover Art"
              value={imageDisplayName}
              onChange={(e) => setImageDisplayName(e.target.value)}
              margin="normal"
              helperText="Optional descriptive name for the image"
            />
            
            {selectedArc?.imageFileName && (
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Current Image:
                </Typography>
                <MediaThumbnail
                  entityType="arc"
                  entityId={selectedArc.id}
                  entityName={selectedArc.name}
                  maxWidth={200}
                  maxHeight={200}
                  allowCycling={false}
                />
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            {selectedArc?.imageFileName && (
              <Button
                onClick={handleRemoveImage}
                color="error"
                disabled={uploading}
                startIcon={<X />}
              >
                Remove Image
              </Button>
            )}
            <Button onClick={handleCloseImageDialog} disabled={uploading}>
              Cancel
            </Button>
            {selectedFile && (
              <Button
                onClick={handleUploadImage}
                variant="contained"
                disabled={uploading}
                startIcon={uploading ? <CircularProgress size={16} /> : <Upload />}
              >
                {uploading ? 'Uploading...' : 'Upload Image'}
              </Button>
            )}
          </DialogActions>
        </Dialog>

        {/* Success/Error Snackbar */}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={6000}
          onClose={() => setSnackbarOpen(false)}
          message={snackbarMessage}
        />
      </motion.div>
    </Container>
  )
}


export default function ArcsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ArcsPageContent />
    </Suspense>
  )
}