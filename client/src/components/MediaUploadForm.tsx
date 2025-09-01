'use client'

import React, { useState } from 'react'
import {
  Box,
  Button,
  Typography,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Chip,
  CircularProgress,
} from '@mui/material'
import { Upload, Image, Video, FileText } from 'lucide-react'

interface MediaUploadFormProps {
  onUpload: (file: File, data: {
    type: 'image' | 'video' | 'audio'
    description?: string
    characterId?: number
    arcId?: number
    eventId?: number
  }) => Promise<void>
  characters: Array<{ id: number; name: string }>
  arcs: Array<{ id: number; name: string }>
  loading?: boolean
  dataLoading?: boolean
  error?: string
}

export default function MediaUploadForm({ 
  onUpload, 
  characters, 
  arcs, 
  loading = false, 
  dataLoading = false,
  error 
}: MediaUploadFormProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [formData, setFormData] = useState({
    type: 'image' as 'image' | 'video' | 'audio',
    description: '',
    characterId: null as number | null,
    arcId: null as number | null,
  })
  const [dragActive, setDragActive] = useState(false)

  const handleFileSelect = (file: File) => {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return
    }

    setSelectedFile(file)
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile) return

    await onUpload(selectedFile, {
      type: formData.type,
      description: formData.description || undefined,
      characterId: formData.characterId || undefined,
      arcId: formData.arcId || undefined,
    })
  }

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image': return <Image size={20} />
      case 'video': return <Video size={20} />
      default: return <FileText size={20} />
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            File Upload
          </Typography>
          
          <Box
            sx={{
              border: 2,
              borderStyle: 'dashed',
              borderColor: dragActive ? 'primary.main' : 'grey.300',
              borderRadius: 2,
              p: 4,
              textAlign: 'center',
              bgcolor: dragActive ? 'action.hover' : 'background.paper',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-input')?.click()}
          >
            <input
              id="file-input"
              type="file"
              hidden
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
            />
            
            <Upload size={48} color="#666" style={{ marginBottom: '16px' }} />
            
            {selectedFile ? (
              <Box>
                <Chip
                  icon={getFileIcon(formData.type)}
                  label={`${selectedFile.name} (${formatFileSize(selectedFile.size)})`}
                  onDelete={() => setSelectedFile(null)}
                  color="primary"
                  sx={{ mb: 1 }}
                />
                <Typography variant="body2" color="text.secondary">
                  Click to change file or drag and drop a new one
                </Typography>
              </Box>
            ) : (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Drag and drop your file here
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  or click to browse files
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Supported formats: JPEG, PNG, WebP, GIF • Max size: 10MB
                </Typography>
              </Box>
            )}
          </Box>
        </Box>

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Media Type</InputLabel>
          <Select
            value={formData.type}
            label="Media Type"
            onChange={(e) => handleInputChange('type', e.target.value)}
          >
            <MenuItem value="image">Image</MenuItem>
            <MenuItem value="video" disabled>Video (Coming Soon)</MenuItem>
            <MenuItem value="audio" disabled>Audio (Coming Soon)</MenuItem>
          </Select>
        </FormControl>

        <TextField
          fullWidth
          label="Description"
          multiline
          rows={3}
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="Describe this media, credit the artist if known, or provide context..."
          sx={{ mb: 2 }}
        />

        <FormControl fullWidth sx={{ mb: 2 }} disabled={dataLoading}>
          <InputLabel>Character (Optional)</InputLabel>
          <Select
            value={formData.characterId || ''}
            label="Character (Optional)"
            onChange={(e) => handleInputChange('characterId', e.target.value || null)}
          >
            <MenuItem value="">None</MenuItem>
            {dataLoading ? (
              <MenuItem value="" disabled>
                Loading characters...
              </MenuItem>
            ) : (
              characters.map((character) => (
                <MenuItem key={character.id} value={character.id}>
                  {character.name}
                </MenuItem>
              ))
            )}
          </Select>
        </FormControl>

        <FormControl fullWidth sx={{ mb: 3 }} disabled={dataLoading}>
          <InputLabel>Arc (Optional)</InputLabel>
          <Select
            value={formData.arcId || ''}
            label="Arc (Optional)"
            onChange={(e) => handleInputChange('arcId', e.target.value || null)}
          >
            <MenuItem value="">None</MenuItem>
            {dataLoading ? (
              <MenuItem value="" disabled>
                Loading arcs...
              </MenuItem>
            ) : (
              arcs.map((arc) => (
                <MenuItem key={arc.id} value={arc.id}>
                  {arc.name}
                </MenuItem>
              ))
            )}
          </Select>
        </FormControl>

        <Button
          type="submit"
          variant="contained"
          size="large"
          fullWidth
          disabled={!selectedFile || loading}
          startIcon={loading ? <CircularProgress size={16} /> : <Upload />}
        >
          {loading ? 'Uploading...' : 'Upload Media'}
        </Button>
      </form>
    </Box>
  )
}