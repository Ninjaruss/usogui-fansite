'use client'

import React, { useState, useEffect } from 'react'
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
  Chip,
  CircularProgress,
  Alert,
  CardMedia,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Snackbar
} from '@mui/material'
import { Search, Users, Eye, Edit, Upload, X } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { api } from '../../lib/api'
import { useAuth } from '../../providers/AuthProvider'
import { motion } from 'motion/react'

interface Character {
  id: number
  name: string
  alternateNames: string[]
  description: string
  firstAppearanceChapter: number
  notableRoles: string[]
  notableGames: string[]
  occupation: string
  affiliations: string[]
  imageFileName?: string
  imageDisplayName?: string
}

export default function CharactersPage() {
  const { user } = useAuth()
  const [characters, setCharacters] = useState<Character[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  
  // Image upload state
  const [imageDialogOpen, setImageDialogOpen] = useState(false)
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null)
  const [imageDisplayName, setImageDisplayName] = useState('')
  const [uploading, setUploading] = useState(false)
  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const isModeratorOrAdmin = user?.role === 'moderator' || user?.role === 'admin'

  const fetchCharacters = async (page = 1, search = '') => {
    setLoading(true)
    try {
      const params: { page: number; limit: number; name?: string } = { page, limit: 12 }
      if (search) params.name = search
      
      const response = await api.getCharacters(params)
      setCharacters(response.data)
      setTotalPages(response.totalPages)
      setTotal(response.total)
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Failed to fetch characters')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCharacters(currentPage, searchQuery)
  }, [currentPage, searchQuery])

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value)
    setCurrentPage(1)
  }

  const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
    setCurrentPage(page)
  }

  const handleEditImage = (character: Character) => {
    setSelectedCharacter(character)
    setImageDisplayName(character.imageDisplayName || '')
    setImageDialogOpen(true)
  }

  const handleCloseImageDialog = () => {
    setImageDialogOpen(false)
    setSelectedCharacter(null)
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
    if (!selectedCharacter || !selectedFile) return

    setUploading(true)
    try {
      await api.uploadCharacterImage(selectedCharacter.id, selectedFile, imageDisplayName.trim() || undefined)
      
      await fetchCharacters(currentPage, searchQuery)
      setSnackbarMessage('Character image uploaded successfully!')
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
    if (!selectedCharacter) return

    setUploading(true)
    try {
      await api.removeCharacterImage(selectedCharacter.id)
      
      await fetchCharacters(currentPage, searchQuery)
      setSnackbarMessage('Character image removed successfully!')
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
            <Users size={48} color="#1976d2" />
          </Box>
          <Typography variant="h3" component="h1" gutterBottom>
            Characters
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Discover the complex cast of Usogui
          </Typography>
        </Box>

        <Box sx={{ mb: 4 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search characters..."
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
              {total} character{total !== 1 ? 's' : ''} found
            </Typography>

            <Grid container spacing={4}>
              {characters.map((character, index) => (
                <Grid item xs={12} sm={6} md={4} key={character.id}>
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
                        {character.imageFileName && (
                          <CardMedia
                            component="img"
                            height="200"
                            image={`/api/media/character/${character.imageFileName}`}
                            alt={character.imageDisplayName || character.name}
                            sx={{ objectFit: 'cover' }}
                          />
                        )}
                        {isModeratorOrAdmin && (
                          <IconButton
                            onClick={() => handleEditImage(character)}
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
                          {character.name}
                        </Typography>
                        
                        {character.alternateNames?.length > 0 && (
                          <Box sx={{ mb: 2 }}>
                            {character.alternateNames.slice(0, 2).map((name) => (
                              <Chip
                                key={name}
                                label={name}
                                size="small"
                                variant="outlined"
                                color="secondary"
                                sx={{ mr: 0.5, mb: 0.5 }}
                              />
                            ))}
                          </Box>
                        )}

                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            mb: 2,
                            overflow: 'hidden',
                            display: '-webkit-box',
                            WebkitBoxOrient: 'vertical',
                            WebkitLineClamp: 3,
                          }}
                        >
                          {character.description}
                        </Typography>

                        {character.occupation && (
                          <Typography variant="body2" color="primary" sx={{ mb: 1 }}>
                            <strong>Occupation:</strong> {character.occupation}
                          </Typography>
                        )}

                        {character.firstAppearanceChapter && (
                          <Typography variant="body2" color="text.secondary">
                            <strong>First Appearance:</strong> Chapter {character.firstAppearanceChapter}
                          </Typography>
                        )}
                      </CardContent>

                      <CardActions>
                        <Button
                          component={Link}
                          href={`/characters/${character.id}`}
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
            Edit Image for {selectedCharacter?.name}
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
            <Box sx={{ mb: 3, p: 2, border: '1px dashed', borderColor: 'grey.300', borderRadius: 1 }}>
              <Typography variant="h6" gutterBottom>
                Upload New Image
              </Typography>
              <input
                accept="image/jpeg,image/png,image/webp,image/gif"
                style={{ display: 'none' }}
                id="character-image-upload"
                type="file"
                onChange={handleFileSelect}
              />
              <label htmlFor="character-image-upload">
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
              placeholder="e.g., Official Portrait"
              value={imageDisplayName}
              onChange={(e) => setImageDisplayName(e.target.value)}
              margin="normal"
              helperText="Optional descriptive name for the image"
            />
            
            {selectedCharacter?.imageFileName && (
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Current Image:
                </Typography>
                <Image
                  src={`/api/media/character/${selectedCharacter.imageFileName}`}
                  alt={selectedCharacter.imageDisplayName || selectedCharacter.name}
                  width={200}
                  height={200}
                  style={{ objectFit: 'cover' }}
                />
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            {selectedCharacter?.imageFileName && (
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