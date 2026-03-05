'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useNotify } from 'react-admin'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button as MuiButton,
  TextField as MuiTextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Tooltip,
  CircularProgress,
  Tabs,
  Tab,
  Chip
} from '@mui/material'
import { Image as ImageIcon, Upload, Trash2, Edit, Plus, X, Link as LinkIcon } from 'lucide-react'
import { api } from '../../lib/api'

interface EntityDisplayMediaSectionProps {
  ownerType: 'character' | 'arc' | 'event' | 'gamble' | 'organization' | 'volume'
  ownerId: number | string
  accentColor?: string
  usageType?: string
}

interface MediaItem {
  id: string
  url: string
  type: string
  description?: string
  chapterNumber?: number
  status: string
  purpose: string
  createdAt: string
}

export const EntityDisplayMediaSection: React.FC<EntityDisplayMediaSectionProps> = ({
  ownerType,
  ownerId,
  accentColor = '#e11d48',
  usageType = 'character_image'
}) => {
  const notify = useNotify()
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Add form state
  const [addTab, setAddTab] = useState(0)
  const [urlInput, setUrlInput] = useState('')
  const [mediaType, setMediaType] = useState<'image' | 'video' | 'audio'>('image')
  const [description, setDescription] = useState('')
  const [chapterNumber, setChapterNumber] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  // Edit form state
  const [editDescription, setEditDescription] = useState('')
  const [editChapterNumber, setEditChapterNumber] = useState('')

  const numericOwnerId = typeof ownerId === 'string' ? parseInt(ownerId, 10) : ownerId

  const fetchMedia = useCallback(async () => {
    try {
      setLoading(true)
      const response = await api.getEntityDisplayMedia(ownerType, numericOwnerId)
      const data = Array.isArray(response) ? response : response?.data || []
      setMediaItems(data)
    } catch {
      setMediaItems([])
    } finally {
      setLoading(false)
    }
  }, [ownerType, numericOwnerId])

  useEffect(() => {
    if (numericOwnerId) {
      fetchMedia()
    }
  }, [numericOwnerId, fetchMedia])

  const resetAddForm = () => {
    setUrlInput('')
    setMediaType('image')
    setDescription('')
    setChapterNumber('')
    setSelectedFile(null)
    setAddTab(0)
  }

  const handleAddUrl = async () => {
    if (!urlInput.trim()) {
      notify('Please enter a URL', { type: 'warning' })
      return
    }

    try {
      setSubmitting(true)
      // Create media via URL
      const created = await api.submitMediaPolymorphic({
        url: urlInput.trim(),
        type: mediaType,
        ownerType,
        ownerId: numericOwnerId,
        description: description.trim() || undefined,
        chapterNumber: chapterNumber ? parseInt(chapterNumber) : undefined,
        purpose: 'entity_display'
      })

      // Auto-approve since admin is creating it
      if (created?.id) {
        try {
          await api.put(`/media/${created.id}/approve`, {})
        } catch {
          // Approval may fail if already approved or other reason - still OK
        }
      }

      notify('Media added successfully', { type: 'success' })
      resetAddForm()
      setAddModalOpen(false)
      fetchMedia()
    } catch (err: any) {
      notify(err?.message || 'Failed to add media', { type: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      notify('Please select a file', { type: 'warning' })
      return
    }

    try {
      setSubmitting(true)
      await api.uploadMedia(selectedFile, {
        type: 'image',
        ownerType,
        ownerId: numericOwnerId,
        purpose: 'entity_display',
        description: description.trim() || undefined,
        chapterNumber: chapterNumber ? parseInt(chapterNumber) : undefined,
        usageType
      })

      notify('Media uploaded successfully', { type: 'success' })
      resetAddForm()
      setAddModalOpen(false)
      fetchMedia()
    } catch (err: any) {
      notify(err?.message || 'Failed to upload media', { type: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = async () => {
    if (!selectedItem) return

    try {
      setSubmitting(true)
      await api.updateMedia(selectedItem.id, {
        description: editDescription.trim() || undefined,
        chapterNumber: editChapterNumber ? parseInt(editChapterNumber) : undefined
      })

      notify('Media updated successfully', { type: 'success' })
      setEditModalOpen(false)
      setSelectedItem(null)
      fetchMedia()
    } catch (err: any) {
      notify(err?.message || 'Failed to update media', { type: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedItem) return

    try {
      setSubmitting(true)
      await api.deleteMedia(selectedItem.id)
      notify('Media deleted successfully', { type: 'success' })
      setDeleteDialogOpen(false)
      setSelectedItem(null)
      fetchMedia()
    } catch (err: any) {
      notify(err?.message || 'Failed to delete media', { type: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  const openEditModal = (item: MediaItem) => {
    setSelectedItem(item)
    setEditDescription(item.description || '')
    setEditChapterNumber(item.chapterNumber?.toString() || '')
    setEditModalOpen(true)
  }

  const openDeleteDialog = (item: MediaItem) => {
    setSelectedItem(item)
    setDeleteDialogOpen(true)
  }

  return (
    <Box sx={{ mt: 3 }}>
      <Card
        elevation={0}
        sx={{
          backgroundColor: '#0a0a0a',
          border: `1px solid ${accentColor}40`,
          borderRadius: 2
        }}
      >
        {/* Header */}
        <Box
          sx={{
            background: `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}CC 100%)`,
            p: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontWeight: 'bold',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            <ImageIcon size={20} />
            Entity Display Media
          </Typography>
          <MuiButton
            startIcon={<Plus size={16} />}
            onClick={() => setAddModalOpen(true)}
            sx={{
              color: 'white',
              backgroundColor: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.3)',
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.25)'
              }
            }}
            size="small"
          >
            Add Media
          </MuiButton>
        </Box>

        <CardContent sx={{ p: 3 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={32} sx={{ color: accentColor }} />
            </Box>
          ) : mediaItems.length === 0 ? (
            <Box
              sx={{
                textAlign: 'center',
                py: 4,
                color: 'text.secondary'
              }}
            >
              <ImageIcon size={48} color={`${accentColor}66`} style={{ marginBottom: 8 }} />
              <Typography variant="body2">
                No entity display media yet. Click &quot;Add Media&quot; to add images.
              </Typography>
            </Box>
          ) : (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                gap: 2
              }}
            >
              {mediaItems.map((item) => (
                <Box
                  key={item.id}
                  sx={{
                    position: 'relative',
                    borderRadius: 1,
                    overflow: 'hidden',
                    border: `1px solid ${accentColor}30`,
                    backgroundColor: '#0f0f0f',
                    '&:hover .media-overlay': {
                      opacity: 1
                    }
                  }}
                >
                  <Box sx={{ aspectRatio: '4/3', overflow: 'hidden' }}>
                    <img
                      src={item.url}
                      alt={item.description || 'Entity display media'}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none'
                      }}
                    />
                  </Box>

                  {/* Overlay with actions */}
                  <Box
                    className="media-overlay"
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: 'rgba(0,0,0,0.7)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 1,
                      opacity: 0,
                      transition: 'opacity 0.2s ease'
                    }}
                  >
                    <Tooltip title="Edit">
                      <IconButton
                        onClick={() => openEditModal(item)}
                        sx={{ color: 'white', backgroundColor: 'rgba(255,255,255,0.1)' }}
                        size="small"
                      >
                        <Edit size={16} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        onClick={() => openDeleteDialog(item)}
                        sx={{ color: '#f44336', backgroundColor: 'rgba(255,255,255,0.1)' }}
                        size="small"
                      >
                        <Trash2 size={16} />
                      </IconButton>
                    </Tooltip>
                  </Box>

                  {/* Info bar */}
                  <Box sx={{ p: 1, borderTop: `1px solid ${accentColor}20` }}>
                    {item.description && (
                      <Typography
                        variant="caption"
                        sx={{
                          color: 'text.secondary',
                          display: 'block',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {item.description}
                      </Typography>
                    )}
                    <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                      {item.chapterNumber && (
                        <Chip
                          label={`Ch. ${item.chapterNumber}`}
                          size="small"
                          sx={{
                            height: 18,
                            fontSize: '0.65rem',
                            backgroundColor: `${accentColor}20`,
                            color: accentColor
                          }}
                        />
                      )}
                      <Chip
                        label={item.status}
                        size="small"
                        sx={{
                          height: 18,
                          fontSize: '0.65rem',
                          backgroundColor:
                            item.status === 'approved'
                              ? 'rgba(76, 175, 80, 0.2)'
                              : 'rgba(255, 152, 0, 0.2)',
                          color: item.status === 'approved' ? '#4caf50' : '#ff9800'
                        }}
                      />
                    </Box>
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Add Media Modal */}
      <Dialog
        open={addModalOpen}
        onClose={() => {
          setAddModalOpen(false)
          resetAddForm()
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: '#1a1a1a',
            color: 'white',
            border: `1px solid ${accentColor}40`
          }
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: `1px solid ${accentColor}30`
          }}
        >
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Plus size={20} />
            Add Entity Display Media
          </Typography>
          <IconButton
            onClick={() => {
              setAddModalOpen(false)
              resetAddForm()
            }}
            sx={{ color: 'text.secondary' }}
          >
            <X size={20} />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Tabs
            value={addTab}
            onChange={(_, v) => setAddTab(v)}
            sx={{
              mb: 3,
              '& .MuiTab-root': { color: 'text.secondary' },
              '& .Mui-selected': { color: accentColor },
              '& .MuiTabs-indicator': { backgroundColor: accentColor }
            }}
          >
            <Tab icon={<LinkIcon size={16} />} label="URL" iconPosition="start" />
            <Tab icon={<Upload size={16} />} label="Upload" iconPosition="start" />
          </Tabs>

          {addTab === 0 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <MuiTextField
                label="Media URL"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://..."
                fullWidth
                size="small"
                sx={{ '& .MuiOutlinedInput-root': { color: 'white' } }}
              />
              <FormControl size="small" fullWidth>
                <InputLabel sx={{ color: 'text.secondary' }}>Media Type</InputLabel>
                <Select
                  value={mediaType}
                  onChange={(e) => setMediaType(e.target.value as 'image' | 'video' | 'audio')}
                  label="Media Type"
                  sx={{ color: 'white' }}
                >
                  <MenuItem value="image">Image</MenuItem>
                  <MenuItem value="video">Video</MenuItem>
                  <MenuItem value="audio">Audio</MenuItem>
                </Select>
              </FormControl>
            </Box>
          )}

          {addTab === 1 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <MuiButton
                variant="outlined"
                component="label"
                startIcon={<Upload size={16} />}
                sx={{
                  color: accentColor,
                  borderColor: `${accentColor}60`,
                  '&:hover': { borderColor: accentColor }
                }}
              >
                {selectedFile ? selectedFile.name : 'Choose File'}
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                />
              </MuiButton>
              {selectedFile && (
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </Typography>
              )}
            </Box>
          )}

          {/* Common fields */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <MuiTextField
              label="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              fullWidth
              size="small"
              multiline
              rows={2}
              sx={{ '& .MuiOutlinedInput-root': { color: 'white' } }}
            />
            <MuiTextField
              label="Chapter Number (optional)"
              value={chapterNumber}
              onChange={(e) => setChapterNumber(e.target.value.replace(/\D/g, ''))}
              fullWidth
              size="small"
              sx={{ '& .MuiOutlinedInput-root': { color: 'white' } }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: `1px solid ${accentColor}30` }}>
          <MuiButton
            onClick={() => {
              setAddModalOpen(false)
              resetAddForm()
            }}
            sx={{ color: 'text.secondary' }}
          >
            Cancel
          </MuiButton>
          <MuiButton
            onClick={addTab === 0 ? handleAddUrl : handleUpload}
            disabled={submitting || (addTab === 0 ? !urlInput.trim() : !selectedFile)}
            variant="contained"
            sx={{
              backgroundColor: accentColor,
              '&:hover': { backgroundColor: `${accentColor}CC` }
            }}
          >
            {submitting ? <CircularProgress size={20} sx={{ color: 'white' }} /> : 'Add'}
          </MuiButton>
        </DialogActions>
      </Dialog>

      {/* Edit Modal */}
      <Dialog
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: '#1a1a1a',
            color: 'white',
            border: `1px solid ${accentColor}40`
          }
        }}
      >
        <DialogTitle sx={{ borderBottom: `1px solid ${accentColor}30` }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Edit size={20} />
            Edit Media
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {selectedItem && (
            <Box sx={{ mb: 2, textAlign: 'center' }}>
              <img
                src={selectedItem.url}
                alt="Preview"
                style={{
                  maxWidth: '100%',
                  maxHeight: 200,
                  borderRadius: 8,
                  border: `1px solid ${accentColor}30`
                }}
              />
            </Box>
          )}
          <MuiTextField
            label="Description"
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            fullWidth
            size="small"
            multiline
            rows={2}
            sx={{ '& .MuiOutlinedInput-root': { color: 'white' } }}
          />
          <MuiTextField
            label="Chapter Number"
            value={editChapterNumber}
            onChange={(e) => setEditChapterNumber(e.target.value.replace(/\D/g, ''))}
            fullWidth
            size="small"
            sx={{ '& .MuiOutlinedInput-root': { color: 'white' } }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: `1px solid ${accentColor}30` }}>
          <MuiButton onClick={() => setEditModalOpen(false)} sx={{ color: 'text.secondary' }}>
            Cancel
          </MuiButton>
          <MuiButton
            onClick={handleEdit}
            disabled={submitting}
            variant="contained"
            sx={{
              backgroundColor: accentColor,
              '&:hover': { backgroundColor: `${accentColor}CC` }
            }}
          >
            {submitting ? <CircularProgress size={20} sx={{ color: 'white' }} /> : 'Save'}
          </MuiButton>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{
          sx: {
            backgroundColor: '#1a1a1a',
            color: 'white',
            border: '1px solid rgba(244, 67, 54, 0.4)'
          }
        }}
      >
        <DialogTitle>Delete Media</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this media? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <MuiButton onClick={() => setDeleteDialogOpen(false)} sx={{ color: 'text.secondary' }}>
            Cancel
          </MuiButton>
          <MuiButton
            onClick={handleDelete}
            disabled={submitting}
            variant="contained"
            sx={{
              backgroundColor: '#f44336',
              '&:hover': { backgroundColor: '#d32f2f' }
            }}
          >
            {submitting ? <CircularProgress size={20} sx={{ color: 'white' }} /> : 'Delete'}
          </MuiButton>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
