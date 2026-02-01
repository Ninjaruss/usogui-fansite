import React, { useState, useEffect, useCallback } from 'react'
import {
  List,
  Datagrid,
  TextField,
  DateField,
  Edit,
  Create,
  Show,
  SimpleForm,
  TextInput,
  SimpleShowLayout,
  ReferenceField,
  SelectInput,
  NumberField,
  ReferenceInput,
  ReferenceArrayInput,
  ReferenceArrayField,
  AutocompleteInput,
  AutocompleteArrayInput,
  SingleFieldList,
  ChipField,
  usePermissions,
  Button,
  useRecordContext,
  useNotify,
  useRefresh,
  useRedirect,
  Filter,
  Loading,
  useListContext,
  FunctionField,
  useUnselectAll,
  BulkDeleteButton
} from 'react-admin'
import { useFormContext, useWatch } from 'react-hook-form'
import { GuideStatus } from '../../types'
import {
  Box,
  Chip,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Avatar,
  Button as MuiButton,
  ButtonGroup,
  Toolbar,
  AppBar,
  TextField as MuiTextField,
  Tab,
  Tabs,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material'
import {
  Check,
  X,
  FileText,
  User,
  Eye,
  Heart,
  Calendar,
  Clock,
  Edit3,
  BookOpen,
  Users,
  Target,
  Star
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { api } from '../../lib/api'
import EnhancedSpoilerMarkdown from '../EnhancedSpoilerMarkdown'
import EntityEmbedHelperWithSearch from '../EntityEmbedHelperWithSearch'

const GuideStatusField = ({ source }: { source: string }) => {
  const record = useRecordContext()
  if (!record) return null

  const status = record[source]
  const getStatusColor = (status: string) => {
    switch(status) {
      case GuideStatus.APPROVED: return 'success'
      case GuideStatus.REJECTED: return 'error'
      case GuideStatus.PENDING: return 'warning'
      default: return 'warning'
    }
  }

  const getStatusIcon = (status: string) => {
    switch(status) {
      case GuideStatus.APPROVED: return '✅'
      case GuideStatus.REJECTED: return '❌'
      case GuideStatus.PENDING: return '⏳'
      default: return '❓'
    }
  }

  return (
    <Chip
      label={`${getStatusIcon(status)} ${status}`}
      color={getStatusColor(status)}
      size="small"
      sx={{
        fontWeight: 'bold',
        textTransform: 'uppercase',
        fontSize: '0.75rem',
        height: '28px',
        minWidth: '100px'
      }}
    />
  )
}

const GuideTypeField = () => {
  const record = useRecordContext()
  if (!record) return null

  const getTypeColor = (hasCharacters: boolean, hasArc: boolean, hasGambles: boolean) => {
    // All three types
    if (hasCharacters && hasArc && hasGambles) return { bg: 'rgba(233, 30, 99, 0.1)', color: '#e91e63' }
    // Two types
    if (hasCharacters && hasArc) return { bg: 'rgba(156, 39, 176, 0.1)', color: '#9c27b0' }
    if (hasCharacters && hasGambles) return { bg: 'rgba(63, 81, 181, 0.1)', color: '#3f51b5' }
    if (hasArc && hasGambles) return { bg: 'rgba(255, 87, 34, 0.1)', color: '#ff5722' }
    // Single types
    if (hasCharacters) return { bg: 'rgba(76, 175, 80, 0.1)', color: '#4caf50' }
    if (hasArc) return { bg: 'rgba(255, 152, 0, 0.1)', color: '#ff9800' }
    if (hasGambles) return { bg: 'rgba(244, 67, 54, 0.1)', color: '#f44336' }
    // General
    return { bg: 'rgba(158, 158, 158, 0.1)', color: '#9e9e9e' }
  }

  const hasCharacters = record.characters && record.characters.length > 0
  const hasArc = record.arc && record.arc.name
  const hasGambles = record.gambles && record.gambles.length > 0
  const colors = getTypeColor(hasCharacters, hasArc, hasGambles)

  let label = 'General'
  if (hasCharacters && hasArc && hasGambles) label = 'Character + Arc + Gamble'
  else if (hasCharacters && hasArc) label = 'Character + Arc'
  else if (hasCharacters && hasGambles) label = 'Character + Gamble'
  else if (hasArc && hasGambles) label = 'Arc + Gamble'
  else if (hasCharacters) label = 'Character'
  else if (hasArc) label = 'Arc'
  else if (hasGambles) label = 'Gamble'

  return (
    <Box sx={{ width: '150px', display: 'flex', flexDirection: 'column', gap: 0.5 }}>
      <Chip
        size="small"
        label={label}
        sx={{
          fontWeight: '500',
          textTransform: 'capitalize',
          backgroundColor: colors.bg,
          color: colors.color,
          fontSize: '0.7rem'
        }}
      />
    </Box>
  )
}

const GuidePreviewField = () => {
  const record = useRecordContext()
  if (!record) return null

  return (
    <Box sx={{ width: '80px', display: 'flex', justifyContent: 'center' }}>
      <Box sx={{
        width: 60,
        height: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0f0f0f',
        borderRadius: '4px',
        border: '2px solid #e11d48'
      }}>
        <FileText size={24} color="#e11d48" />
      </Box>
    </Box>
  )
}

const GuideAuthorDetailsField = () => {
  const record = useRecordContext()
  if (!record) return null

  return (
    <Box sx={{
      width: '140px',
      display: 'flex',
      flexDirection: 'column',
      gap: 0.5
    }}>
      <Typography sx={{
        fontSize: '0.75rem',
        fontWeight: '500',
        color: 'primary.main'
      }}>
        {record.author?.username || record.submittedBy?.username || 'Unknown'}
      </Typography>
      <Typography sx={{
        fontSize: '0.7rem',
        color: 'text.secondary'
      }}>
        {record.createdAt ? new Date(record.createdAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }) : ''}
      </Typography>
    </Box>
  )
}

const GuideEngagementField = () => {
  const record = useRecordContext()
  if (!record) return null

  return (
    <Box sx={{ width: '80px', textAlign: 'center' }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
          <Eye size={12} color="#666" />
          <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
            {record.viewCount || 0}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
          <Heart size={12} color="#e11d48" />
          <Typography sx={{ fontSize: '0.7rem', color: '#e11d48' }}>
            {record.likeCount || 0}
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}

const GuideRelatedEntitiesField = () => {
  const record = useRecordContext()
  if (!record) return null

  return (
    <Box sx={{ width: '200px' }}>
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        p: 1,
        borderRadius: 1,
        backgroundColor: 'rgba(25, 118, 210, 0.05)',
        border: '1px solid rgba(25, 118, 210, 0.2)'
      }}>
        {/* Characters */}
        {record.characters && record.characters.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {record.characters.slice(0, 3).map((character: any) => (
              <Chip
                key={character.id}
                label={character.name}
                size="small"
                sx={{
                  backgroundColor: 'rgba(76, 175, 80, 0.2)',
                  color: '#4caf50',
                  fontSize: '0.65rem',
                  height: '18px'
                }}
              />
            ))}
            {record.characters.length > 3 && (
              <Chip
                label={`+${record.characters.length - 3}`}
                size="small"
                sx={{
                  backgroundColor: 'rgba(158, 158, 158, 0.2)',
                  color: '#9e9e9e',
                  fontSize: '0.65rem',
                  height: '18px'
                }}
              />
            )}
          </Box>
        )}
        
        {/* Arc */}
        {record.arc && record.arc.name && (
          <Box>
            <Chip
              label={record.arc.name}
              size="small"
              sx={{
                backgroundColor: 'rgba(255, 152, 0, 0.2)',
                color: '#ff9800',
                fontSize: '0.65rem',
                height: '18px'
              }}
            />
          </Box>
        )}
        
        {/* Gambles */}
        {record.gambles && record.gambles.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.3 }}>
            {record.gambles.slice(0, 2).map((gamble: any) => (
              <Chip
                key={gamble.id}
                label={gamble.name || `Gamble ${gamble.id}`}
                size="small"
                sx={{
                  backgroundColor: 'rgba(156, 39, 176, 0.2)',
                  color: '#9c27b0',
                  fontSize: '0.65rem',
                  height: '18px'
                }}
              />
            ))}
            {record.gambles.length > 2 && (
              <Chip
                label={`+${record.gambles.length - 2}`}
                size="small"
                sx={{
                  backgroundColor: 'rgba(156, 39, 176, 0.2)',
                  color: '#9c27b0',
                  fontSize: '0.65rem',
                  height: '18px'
                }}
              />
            )}
          </Box>
        )}
        
        {/* No entities */}
        {(!record.characters || record.characters.length === 0) && 
         (!record.arc || !record.arc.name) && 
         (!record.gambles || record.gambles.length === 0) && (
          <Typography sx={{ fontSize: '0.7rem', color: 'text.disabled', fontStyle: 'italic' }}>
            No related entities
          </Typography>
        )}
      </Box>
    </Box>
  )
}

// Custom Filter Toolbar Component
const GuideFilterToolbar = () => {
  const { filterValues, setFilters } = useListContext()
  
  const statusFilters = [
    { id: 'all', name: 'All', color: '#666', icon: '🗂️' },
    { id: GuideStatus.PENDING, name: 'Pending Review', color: '#f57c00', icon: '⏳' },
    { id: GuideStatus.APPROVED, name: 'Approved', color: '#4caf50', icon: '✅' },
    { id: GuideStatus.REJECTED, name: 'Rejected', color: '#f44336', icon: '❌' }
  ]
  
  const [entitySearch, setEntitySearch] = useState('')
  const [selectedEntities, setSelectedEntities] = useState<{
    characters: any[]
    arcs: any[]
    gambles: any[]
  }>({ characters: [], arcs: [], gambles: [] })
  
  const [entities, setEntities] = useState<{
    characters: any[]
    arcs: any[]
    gambles: any[]
  }>({ characters: [], arcs: [], gambles: [] })

  // Load entities on mount
  useEffect(() => {
    const loadEntities = async () => {
      try {
        const [charactersRes, arcsRes, gamblesRes] = await Promise.all([
          api.getCharacters({ limit: 100 }),
          api.getArcs({ limit: 100 }),
          api.getGambles({ limit: 100 })
        ])

        const loadedEntities = {
          characters: charactersRes.data || [],
          arcs: arcsRes.data || [],
          gambles: gamblesRes.data || []
        }

        setEntities(loadedEntities)

        // Initialize selected entities from URL parameters
        const newSelectedEntities: {
          characters: any[]
          arcs: any[]
          gambles: any[]
        } = {
          characters: [],
          arcs: [],
          gambles: []
        }

        if (filterValues?.characterIds) {
          const characterIds = filterValues.characterIds.split(',').map((id: string) => parseInt(id.trim()))
          newSelectedEntities.characters = loadedEntities.characters.filter(c => characterIds.includes(c.id))
        }

        if (filterValues?.arcIds) {
          const arcIds = filterValues.arcIds.split(',').map((id: string) => parseInt(id.trim()))
          newSelectedEntities.arcs = loadedEntities.arcs.filter(a => arcIds.includes(a.id))
        }

        if (filterValues?.gambleIds) {
          const gambleIds = filterValues.gambleIds.split(',').map((id: string) => parseInt(id.trim()))
          newSelectedEntities.gambles = loadedEntities.gambles.filter(g => gambleIds.includes(g.id))
        }

        setSelectedEntities(newSelectedEntities)
      } catch (error) {
        console.error('Error loading entities:', error)
      }
    }

    loadEntities()
  }, [filterValues?.characterIds, filterValues?.arcIds, filterValues?.gambleIds])

  const handleStatusFilter = (status: string) => {
    const newFilters = status === 'all' 
      ? { ...filterValues, status: undefined }
      : { ...filterValues, status }
    setFilters(newFilters, filterValues)
  }

  const handleEntityFilter = () => {
    const newFilters = { ...filterValues }
    
    // Remove existing entity filters
    delete newFilters.characterIds
    delete newFilters.arcIds
    delete newFilters.gambleIds
    
    // Add selected entity filters
    if (selectedEntities.characters.length > 0) {
      newFilters.characterIds = selectedEntities.characters.map(c => c.id).join(',')
    }
    if (selectedEntities.arcs.length > 0) {
      newFilters.arcIds = selectedEntities.arcs.map(a => a.id).join(',')
    }
    if (selectedEntities.gambles.length > 0) {
      newFilters.gambleIds = selectedEntities.gambles.map(g => g.id).join(',')
    }
    
    setFilters(newFilters, filterValues)
  }

  const clearEntityFilters = () => {
    setSelectedEntities({ characters: [], arcs: [], gambles: [] })
    const newFilters = { ...filterValues }
    delete newFilters.characterIds
    delete newFilters.arcIds
    delete newFilters.gambleIds
    setFilters(newFilters, filterValues)
  }

  const filteredEntities = {
    characters: entities.characters.filter(c => 
      c.name.toLowerCase().includes(entitySearch.toLowerCase())
    ),
    arcs: entities.arcs.filter(a => 
      a.name.toLowerCase().includes(entitySearch.toLowerCase())
    ),
    gambles: entities.gambles.filter(g => 
      g.name.toLowerCase().includes(entitySearch.toLowerCase())
    )
  }

  const currentStatus = filterValues?.status || 'all'
  const hasEntityFilters = selectedEntities.characters.length > 0 || 
                          selectedEntities.arcs.length > 0 || 
                          selectedEntities.gambles.length > 0

  return (
    <Box sx={{
      backgroundColor: 'rgba(10, 10, 10, 0.95)',
      borderRadius: 0,
      border: '1px solid rgba(225, 29, 72, 0.2)',
      borderTop: 'none',
      borderBottom: 'none',
      mb: 0,
      p: 2,
      backdropFilter: 'blur(8px)'
    }}>
      {/* General Text Search */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" sx={{
          color: '#e11d48',
          fontWeight: 'bold',
          mb: 1,
          fontSize: '0.9rem'
        }}>
          🔍 Search Guides
        </Typography>
        <MuiTextField
          label="Search by title, description, or author..."
          fullWidth
          size="small"
          sx={{
            '& .MuiOutlinedInput-root': {
              backgroundColor: 'rgba(225, 29, 72, 0.05)',
              '& fieldset': { borderColor: 'rgba(225, 29, 72, 0.3)' },
              '&:hover fieldset': { borderColor: '#e11d48' },
              '&.Mui-focused fieldset': { borderColor: '#e11d48' }
            }
          }}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            const newFilters = { ...filterValues, search: e.target.value || undefined }
            setFilters(newFilters, filterValues)
          }}
        />
      </Box>

      {/* Status Filters */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" sx={{ 
          color: '#e11d48', 
          fontWeight: 'bold', 
          mb: 1,
          fontSize: '0.9rem'
        }}>
          📊 Filter by Status
        </Typography>
        <ButtonGroup variant="outlined" sx={{ flexWrap: 'wrap', gap: 0.5 }}>
          {statusFilters.map((filter) => (
            <MuiButton
              key={filter.id}
              onClick={() => handleStatusFilter(filter.id)}
              variant={currentStatus === filter.id ? 'contained' : 'outlined'}
              size="small"
              sx={{
                borderColor: filter.color,
                color: currentStatus === filter.id ? '#fff' : filter.color,
                backgroundColor: currentStatus === filter.id ? filter.color : 'transparent',
                fontSize: '0.75rem',
                minWidth: '90px',
                height: '32px',
                '&:hover': {
                  backgroundColor: currentStatus === filter.id 
                    ? filter.color 
                    : `${filter.color}20`,
                  borderColor: filter.color
                }
              }}
            >
              {filter.icon} {filter.name}
            </MuiButton>
          ))}
        </ButtonGroup>
      </Box>

      {/* Entity Filters */}
      <Box>
        <Typography variant="subtitle2" sx={{ 
          color: '#7c3aed', 
          fontWeight: 'bold', 
          mb: 1,
          fontSize: '0.9rem'
        }}>
          � Filter by Related Entities
        </Typography>
        
        {/* Entity Search */}
        <Box sx={{ mb: 2 }}>
          <MuiTextField
            label="Search entities..."
            value={entitySearch}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEntitySearch(e.target.value)}
            fullWidth
            size="small"
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'rgba(124, 58, 237, 0.05)',
                '& fieldset': { borderColor: 'rgba(124, 58, 237, 0.3)' },
                '&:hover fieldset': { borderColor: '#7c3aed' },
                '&.Mui-focused fieldset': { borderColor: '#7c3aed' }
              }
            }}
          />
        </Box>

        {/* Entity Selection Lists */}
        <Grid container spacing={2}>
          {/* Characters */}
          <Grid item xs={12} md={4}>
            <Typography variant="body2" sx={{ color: '#7c3aed', fontWeight: 'bold', mb: 1 }}>
              👤 Characters ({selectedEntities.characters.length})
              {filteredEntities.characters.length > 10 && (
                <Typography component="span" sx={{ fontSize: '0.7rem', color: 'text.secondary', ml: 1 }}>
                  showing 10 of {filteredEntities.characters.length}
                </Typography>
              )}
            </Typography>
            <Box sx={{
              maxHeight: 150,
              overflowY: 'auto',
              border: '1px solid rgba(124, 58, 237, 0.2)',
              borderRadius: 1,
              p: 1,
              backgroundColor: 'rgba(124, 58, 237, 0.02)'
            }}>
              {filteredEntities.characters.slice(0, 10).map((character) => (
                <Box key={character.id} sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  mb: 0.5,
                  cursor: 'pointer',
                  p: 0.5,
                  borderRadius: 0.5,
                  backgroundColor: selectedEntities.characters.find(c => c.id === character.id) 
                    ? 'rgba(124, 58, 237, 0.1)' 
                    : 'transparent',
                  '&:hover': { backgroundColor: 'rgba(124, 58, 237, 0.05)' }
                }}
                onClick={() => {
                  const isSelected = selectedEntities.characters.find(c => c.id === character.id)
                  if (isSelected) {
                    setSelectedEntities(prev => ({
                      ...prev,
                      characters: prev.characters.filter(c => c.id !== character.id)
                    }))
                  } else {
                    setSelectedEntities(prev => ({
                      ...prev,
                      characters: [...prev.characters, character]
                    }))
                  }
                }}>
                  <Chip
                    size="small"
                    label={character.name}
                    variant={selectedEntities.characters.find(c => c.id === character.id) ? 'filled' : 'outlined'}
                    sx={{ fontSize: '0.7rem' }}
                  />
                </Box>
              ))}
            </Box>
          </Grid>

          {/* Arcs */}
          <Grid item xs={12} md={4}>
            <Typography variant="body2" sx={{ color: '#7c3aed', fontWeight: 'bold', mb: 1 }}>
              📖 Arcs ({selectedEntities.arcs.length})
              {filteredEntities.arcs.length > 10 && (
                <Typography component="span" sx={{ fontSize: '0.7rem', color: 'text.secondary', ml: 1 }}>
                  showing 10 of {filteredEntities.arcs.length}
                </Typography>
              )}
            </Typography>
            <Box sx={{
              maxHeight: 150,
              overflowY: 'auto',
              border: '1px solid rgba(124, 58, 237, 0.2)',
              borderRadius: 1,
              p: 1,
              backgroundColor: 'rgba(124, 58, 237, 0.02)'
            }}>
              {filteredEntities.arcs.slice(0, 10).map((arc) => (
                <Box key={arc.id} sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  mb: 0.5,
                  cursor: 'pointer',
                  p: 0.5,
                  borderRadius: 0.5,
                  backgroundColor: selectedEntities.arcs.find(a => a.id === arc.id) 
                    ? 'rgba(124, 58, 237, 0.1)' 
                    : 'transparent',
                  '&:hover': { backgroundColor: 'rgba(124, 58, 237, 0.05)' }
                }}
                onClick={() => {
                  const isSelected = selectedEntities.arcs.find(a => a.id === arc.id)
                  if (isSelected) {
                    setSelectedEntities(prev => ({
                      ...prev,
                      arcs: prev.arcs.filter(a => a.id !== arc.id)
                    }))
                  } else {
                    setSelectedEntities(prev => ({
                      ...prev,
                      arcs: [...prev.arcs, arc]
                    }))
                  }
                }}>
                  <Chip
                    size="small"
                    label={arc.name}
                    variant={selectedEntities.arcs.find(a => a.id === arc.id) ? 'filled' : 'outlined'}
                    sx={{ fontSize: '0.7rem' }}
                  />
                </Box>
              ))}
            </Box>
          </Grid>

          {/* Gambles */}
          <Grid item xs={12} md={4}>
            <Typography variant="body2" sx={{ color: '#7c3aed', fontWeight: 'bold', mb: 1 }}>
              🎲 Gambles ({selectedEntities.gambles.length})
              {filteredEntities.gambles.length > 10 && (
                <Typography component="span" sx={{ fontSize: '0.7rem', color: 'text.secondary', ml: 1 }}>
                  showing 10 of {filteredEntities.gambles.length}
                </Typography>
              )}
            </Typography>
            <Box sx={{
              maxHeight: 150,
              overflowY: 'auto',
              border: '1px solid rgba(124, 58, 237, 0.2)',
              borderRadius: 1,
              p: 1,
              backgroundColor: 'rgba(124, 58, 237, 0.02)'
            }}>
              {filteredEntities.gambles.slice(0, 10).map((gamble) => (
                <Box key={gamble.id} sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  mb: 0.5,
                  cursor: 'pointer',
                  p: 0.5,
                  borderRadius: 0.5,
                  backgroundColor: selectedEntities.gambles.find(g => g.id === gamble.id) 
                    ? 'rgba(124, 58, 237, 0.1)' 
                    : 'transparent',
                  '&:hover': { backgroundColor: 'rgba(124, 58, 237, 0.05)' }
                }}
                onClick={() => {
                  const isSelected = selectedEntities.gambles.find(g => g.id === gamble.id)
                  if (isSelected) {
                    setSelectedEntities(prev => ({
                      ...prev,
                      gambles: prev.gambles.filter(g => g.id !== gamble.id)
                    }))
                  } else {
                    setSelectedEntities(prev => ({
                      ...prev,
                      gambles: [...prev.gambles, gamble]
                    }))
                  }
                }}>
                  <Chip
                    size="small"
                    label={gamble.name}
                    variant={selectedEntities.gambles.find(g => g.id === gamble.id) ? 'filled' : 'outlined'}
                    sx={{ fontSize: '0.7rem' }}
                  />
                </Box>
              ))}
            </Box>
          </Grid>
        </Grid>

        {/* Filter Actions */}
        <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
          <MuiButton
            onClick={handleEntityFilter}
            variant="contained"
            size="small"
            disabled={!hasEntityFilters}
            sx={{
              backgroundColor: '#7c3aed',
              '&:hover': { backgroundColor: '#6d28d9' },
              fontSize: '0.75rem'
            }}
          >
            Apply Entity Filters
          </MuiButton>
          <MuiButton
            onClick={clearEntityFilters}
            variant="outlined"
            size="small"
            disabled={!hasEntityFilters}
            sx={{
              borderColor: '#7c3aed',
              color: '#7c3aed',
              '&:hover': { 
                borderColor: '#6d28d9',
                backgroundColor: 'rgba(124, 58, 237, 0.05)'
              },
              fontSize: '0.75rem'
            }}
          >
            Clear Filters
          </MuiButton>
        </Box>
      </Box>
    </Box>
  )
}

const ApproveGuideButton = () => {
  const record = useRecordContext()
  const notify = useNotify()
  const refresh = useRefresh()
  
  const handleApprove = async () => {
    if (!record) return
    
    try {
      await api.approveGuide(Number(record.id))
      notify('Guide approved successfully')
      refresh()
    } catch (error: any) {
      console.error('Error approving guide:', error)
      const errorMessage = error?.details?.message || error?.message || 'Error approving guide'
      notify(errorMessage, { type: 'error' })
    }
  }
  
  if (record?.status === GuideStatus.APPROVED) return null
  
  return (
    <Button 
      label="Approve" 
      onClick={handleApprove}
      color="primary"
      startIcon={<Check size={20} />}
    />
  )
}

// Rejection Modal Component
const GuideRejectionModal = ({ open, onClose, guideId, guideTitle, onSuccess }: {
  open: boolean;
  onClose: () => void;
  guideId: number;
  guideTitle: string;
  onSuccess: () => void;
}) => {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const notify = useNotify();

  const handleSubmit = async () => {
    if (!reason.trim()) {
      notify('Please enter a rejection reason', { type: 'warning' });
      return;
    }

    setSubmitting(true);
    try {
      await api.rejectGuide(guideId, reason.trim());
      notify('Guide rejected successfully', { type: 'success' });
      onSuccess();
      onClose();
      setReason('');
    } catch (error: any) {
      console.error('Error rejecting guide:', error);
      const errorMessage = error?.details?.message || error?.message || 'Error rejecting guide';
      notify(errorMessage, { type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      setReason('');
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        backgroundColor: 'rgba(244, 67, 54, 0.1)',
        borderBottom: '1px solid rgba(244, 67, 54, 0.3)',
        color: '#f44336',
        fontWeight: 'bold'
      }}>
        <X size={24} />
        Reject Guide
      </DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <Typography variant="body1">
            Are you sure you want to reject the guide <strong>"{guideTitle}"</strong>?
          </Typography>

          <MuiTextField
            fullWidth
            required
            multiline
            rows={3}
            label="Rejection Reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Explain why this guide is being rejected..."
            helperText="This reason will be shown to the author"
            error={!reason.trim() && reason.length > 0}
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: '#0f0f0f',
              }
            }}
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <MuiButton onClick={handleClose} disabled={submitting} variant="outlined">
          Cancel
        </MuiButton>
        <MuiButton
          onClick={handleSubmit}
          disabled={submitting || !reason.trim()}
          variant="contained"
          color="error"
        >
          {submitting ? 'Rejecting...' : 'Reject Guide'}
        </MuiButton>
      </DialogActions>
    </Dialog>
  );
};

const RejectGuideButton = () => {
  const record = useRecordContext()
  const refresh = useRefresh()
  const [modalOpen, setModalOpen] = useState(false)

  if (record?.status === GuideStatus.REJECTED) return null

  return (
    <>
      <Button
        label="Reject"
        onClick={() => setModalOpen(true)}
        color="secondary"
        startIcon={<X size={20} />}
      />
      {record && (
        <GuideRejectionModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          guideId={Number(record.id)}
          guideTitle={record.title || 'Untitled Guide'}
          onSuccess={refresh}
        />
      )}
    </>
  )
}

// Approval Toolbar - Always visible with Select All Pending
const GuideApprovalToolbar = () => {
  const { data, selectedIds, onSelect } = useListContext()
  const notify = useNotify()
  const refresh = useRefresh()
  const unselectAll = useUnselectAll('guides')
  const [approving, setApproving] = useState(false)
  const [rejectModalOpen, setRejectModalOpen] = useState(false)

  // Get all pending items from current data
  const pendingItems = data ? data.filter((item: any) => item.status === GuideStatus.PENDING) : []
  const pendingIds = pendingItems.map((item: any) => item.id)

  const handleSelectAllPending = () => {
    if (pendingIds.length > 0) {
      onSelect(pendingIds)
      notify(`Selected ${pendingIds.length} pending guide(s)`, { type: 'info' })
    }
  }

  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) return

    setApproving(true)
    let successCount = 0
    let errorCount = 0

    for (const id of selectedIds) {
      try {
        await api.approveGuide(Number(id))
        successCount++
      } catch (error) {
        console.error(`Error approving guide ${id}:`, error)
        errorCount++
      }
    }

    setApproving(false)
    unselectAll()
    refresh()

    if (errorCount === 0) {
      notify(`Successfully approved ${successCount} guide(s)`, { type: 'success' })
    } else {
      notify(`Approved ${successCount} guide(s), ${errorCount} failed`, { type: 'warning' })
    }
  }

  const handleRejectSuccess = () => {
    unselectAll()
    refresh()
  }

  return (
    <Box sx={{
      display: 'flex',
      alignItems: 'center',
      gap: 2,
      p: 2,
      backgroundColor: 'rgba(10, 10, 10, 0.95)',
      borderRadius: '8px 8px 0 0',
      border: '1px solid rgba(225, 29, 72, 0.3)',
      borderBottom: 'none',
      mb: 0
    }}>
      {/* Pending count badge */}
      <Chip
        label={`${pendingIds.length} Pending`}
        color="warning"
        size="small"
        sx={{ fontWeight: 'bold' }}
      />

      {/* Select All Pending Button */}
      <MuiButton
        variant="outlined"
        size="small"
        onClick={handleSelectAllPending}
        disabled={pendingIds.length === 0}
        startIcon={<Check size={16} />}
        sx={{
          borderColor: '#f57c00',
          color: '#f57c00',
          '&:hover': {
            borderColor: '#ef6c00',
            backgroundColor: 'rgba(245, 124, 0, 0.1)'
          },
          '&:disabled': {
            borderColor: 'rgba(245, 124, 0, 0.3)',
            color: 'rgba(245, 124, 0, 0.5)'
          }
        }}
      >
        Select All Pending
      </MuiButton>

      <Box sx={{ flex: 1 }} />

      {/* Selected count */}
      {selectedIds.length > 0 && (
        <Typography variant="body2" sx={{ color: 'white', mr: 1 }}>
          {selectedIds.length} selected
        </Typography>
      )}

      {/* Approve Button - Always visible */}
      <MuiButton
        variant="contained"
        size="small"
        onClick={handleBulkApprove}
        disabled={approving || selectedIds.length === 0}
        startIcon={<Check size={16} />}
        sx={{
          backgroundColor: selectedIds.length > 0 ? '#4caf50' : 'rgba(76, 175, 80, 0.3)',
          color: 'white',
          '&:hover': { backgroundColor: '#388e3c' },
          '&:disabled': {
            backgroundColor: 'rgba(76, 175, 80, 0.3)',
            color: 'rgba(255, 255, 255, 0.5)'
          }
        }}
      >
        {approving ? 'Approving...' : `Approve${selectedIds.length > 0 ? ` (${selectedIds.length})` : ''}`}
      </MuiButton>

      {/* Reject Button - Always visible */}
      <MuiButton
        variant="contained"
        size="small"
        onClick={() => setRejectModalOpen(true)}
        disabled={selectedIds.length === 0}
        startIcon={<X size={16} />}
        sx={{
          backgroundColor: selectedIds.length > 0 ? '#f44336' : 'rgba(244, 67, 54, 0.3)',
          color: 'white',
          '&:hover': { backgroundColor: '#d32f2f' },
          '&:disabled': {
            backgroundColor: 'rgba(244, 67, 54, 0.3)',
            color: 'rgba(255, 255, 255, 0.5)'
          }
        }}
      >
        Reject{selectedIds.length > 0 ? ` (${selectedIds.length})` : ''}
      </MuiButton>

      <BulkRejectModal
        open={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        selectedIds={selectedIds}
        onSuccess={handleRejectSuccess}
      />
    </Box>
  )
}

// Bulk Approve Button
const BulkApproveButton = () => {
  const { selectedIds } = useListContext()
  const notify = useNotify()
  const refresh = useRefresh()
  const unselectAll = useUnselectAll('guides')
  const [loading, setLoading] = useState(false)

  const handleBulkApprove = async () => {
    setLoading(true)
    let successCount = 0
    let errorCount = 0

    for (const id of selectedIds) {
      try {
        await api.approveGuide(Number(id))
        successCount++
      } catch (error) {
        console.error(`Error approving guide ${id}:`, error)
        errorCount++
      }
    }

    setLoading(false)
    unselectAll()
    refresh()

    if (errorCount === 0) {
      notify(`Successfully approved ${successCount} guide(s)`, { type: 'success' })
    } else {
      notify(`Approved ${successCount} guide(s), ${errorCount} failed`, { type: 'warning' })
    }
  }

  return (
    <Button
      label={loading ? 'Approving...' : `Approve (${selectedIds.length})`}
      onClick={handleBulkApprove}
      disabled={loading || selectedIds.length === 0}
      startIcon={<Check size={16} />}
      sx={{
        backgroundColor: '#4caf50',
        color: 'white',
        '&:hover': { backgroundColor: '#388e3c' },
        mr: 1
      }}
    />
  )
}

// Bulk Reject Modal
const BulkRejectModal = ({ open, onClose, selectedIds, onSuccess }: {
  open: boolean
  onClose: () => void
  selectedIds: any[]
  onSuccess: () => void
}) => {
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const notify = useNotify()

  const handleSubmit = async () => {
    if (!reason.trim()) {
      notify('Please enter a rejection reason', { type: 'warning' })
      return
    }

    setSubmitting(true)
    let successCount = 0
    let errorCount = 0

    for (const id of selectedIds) {
      try {
        await api.rejectGuide(Number(id), reason.trim())
        successCount++
      } catch (error) {
        console.error(`Error rejecting guide ${id}:`, error)
        errorCount++
      }
    }

    setSubmitting(false)

    if (errorCount === 0) {
      notify(`Successfully rejected ${successCount} guide(s)`, { type: 'success' })
    } else {
      notify(`Rejected ${successCount} guide(s), ${errorCount} failed`, { type: 'warning' })
    }

    onSuccess()
    onClose()
    setReason('')
  }

  return (
    <Dialog open={open} onClose={() => !submitting && onClose()} maxWidth="sm" fullWidth>
      <DialogTitle sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        backgroundColor: 'rgba(244, 67, 54, 0.1)',
        borderBottom: '1px solid rgba(244, 67, 54, 0.3)',
        color: '#f44336',
        fontWeight: 'bold'
      }}>
        <X size={24} />
        Bulk Reject {selectedIds.length} Guide(s)
      </DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <Typography variant="body1">
            You are about to reject <strong>{selectedIds.length}</strong> guide(s).
            All selected guides will receive the same rejection reason.
          </Typography>

          <MuiTextField
            fullWidth
            required
            multiline
            rows={3}
            label="Rejection Reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Explain why these guides are being rejected..."
            helperText="This reason will be shown to the authors"
            error={!reason.trim() && reason.length > 0}
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <MuiButton onClick={onClose} disabled={submitting} variant="outlined">
          Cancel
        </MuiButton>
        <MuiButton
          onClick={handleSubmit}
          disabled={submitting || !reason.trim()}
          variant="contained"
          color="error"
        >
          {submitting ? 'Rejecting...' : `Reject ${selectedIds.length} Guide(s)`}
        </MuiButton>
      </DialogActions>
    </Dialog>
  )
}

// Bulk Reject Button
const BulkRejectButton = () => {
  const { selectedIds } = useListContext()
  const refresh = useRefresh()
  const unselectAll = useUnselectAll('guides')
  const [modalOpen, setModalOpen] = useState(false)

  const handleSuccess = () => {
    unselectAll()
    refresh()
  }

  return (
    <>
      <Button
        label={`Reject (${selectedIds.length})`}
        onClick={() => setModalOpen(true)}
        disabled={selectedIds.length === 0}
        startIcon={<X size={16} />}
        sx={{
          backgroundColor: '#f44336',
          color: 'white',
          '&:hover': { backgroundColor: '#d32f2f' },
          mr: 1
        }}
      />
      <BulkRejectModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        selectedIds={selectedIds}
        onSuccess={handleSuccess}
      />
    </>
  )
}

// Bulk Action Buttons Component
const GuideBulkActionButtons = () => (
  <Box sx={{ display: 'flex', alignItems: 'center' }}>
    <BulkApproveButton />
    <BulkRejectButton />
  </Box>
)

export const GuideList = () => (
  <List
    perPage={25}
    filterDefaultValues={{ status: 'pending' }}
    sx={{
      '& .RaList-content': {
        '& > *:not(:last-child)': {
          marginBottom: 0
        }
      }
    }}
  >
    <GuideApprovalToolbar />
    <GuideFilterToolbar />
    <Datagrid
      rowClick="show"
      bulkActionButtons={<GuideBulkActionButtons />}
      sx={{
        marginTop: 0,
        borderRadius: '0 0 8px 8px',
        border: '1px solid rgba(225, 29, 72, 0.2)',
        borderTop: 'none',
        overflow: 'hidden',
        '& .RaDatagrid-table': {
          borderRadius: 0,
        },
        '& .RaDatagrid-headerCell': {
          fontWeight: 'bold',
          fontSize: '0.9rem',
          backgroundColor: 'rgba(10, 10, 10, 0.95)',
          color: '#ffffff',
          borderBottom: '2px solid #e11d48',
          borderTop: 'none'
        },
        '& .RaDatagrid-rowCell': {
          padding: '8px 10px',
          backgroundColor: 'rgba(10, 10, 10, 0.8)',
          color: '#ffffff',
          borderBottom: '1px solid rgba(225, 29, 72, 0.2)'
        },
        '& .RaDatagrid-tbody tr:nth-of-type(even)': {
          backgroundColor: 'rgba(225, 29, 72, 0.05)'
        },
        '& .RaDatagrid-tbody tr:hover': {
          backgroundColor: 'rgba(225, 29, 72, 0.15) !important'
        }
      }}
    >
      <TextField source="id" sortable sx={{ width: '50px', fontSize: '0.85rem' }} />
      
      {/* Guide Preview */}
      <GuidePreviewField />
      
      {/* Title & Description */}
      <TextField 
        source="title" 
        sortable
        sx={{ 
          maxWidth: '200px',
          '& span': {
            fontWeight: 'bold',
            color: 'primary.main',
            fontSize: '0.85rem'
          }
        }} 
      />
      
      <TextField
        source="description"
        sortable
        sx={{
          maxWidth: '180px',
          '& span': {
            display: '-webkit-box',
            WebkitLineClamp: 1,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            fontSize: '0.8rem',
            color: 'text.secondary',
            lineHeight: 1.2
          }
        }}
      />

      {/* Guide Type & Related Entities */}
      <GuideRelatedEntitiesField />

      {/* Type Classification */}
      <GuideTypeField />

      {/* Status - Prominent Display */}
      <Box sx={{ width: '110px', display: 'flex', justifyContent: 'center' }}>
        <GuideStatusField source="status" />
      </Box>

      {/* Author & Submission Details */}
      <FunctionField
        label="Author"
        sortBy="authorId"
        render={(record: any) => (
          <Box sx={{
            width: '140px',
            display: 'flex',
            flexDirection: 'column',
            gap: 0.5
          }}>
            <Typography sx={{
              fontSize: '0.75rem',
              fontWeight: '500',
              color: 'primary.main'
            }}>
              {record?.author?.username || record?.submittedBy?.username || 'Unknown'}
            </Typography>
            <Typography sx={{
              fontSize: '0.7rem',
              color: 'text.secondary'
            }}>
              {record?.createdAt ? new Date(record.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              }) : ''}
            </Typography>
          </Box>
        )}
      />

      {/* Engagement Metrics */}
      <GuideEngagementField />
      
      {/* Actions */}
      <Box 
        sx={{ 
          display: 'flex', 
          gap: 1, 
          minWidth: '160px',
          justifyContent: 'center',
          '& .MuiButton-root': {
            minWidth: '65px',
            padding: '6px 14px',
            fontSize: '0.75rem',
            fontWeight: 'bold',
            textTransform: 'uppercase'
          }
        }}
      >
        <ApproveGuideButton />
        <RejectGuideButton />
      </Box>
    </Datagrid>
  </List>
)

export const GuideApprovalQueue = () => (
  <List filter={{ status: GuideStatus.PENDING }} title="Guide Approval Queue" perPage={25}>
    <Datagrid 
      rowClick="show"
      sx={{
        borderRadius: '8px',
        border: '1px solid rgba(225, 29, 72, 0.2)',
        overflow: 'hidden',
        '& .RaDatagrid-headerCell': {
          fontWeight: 'bold',
          fontSize: '0.9rem',
          backgroundColor: 'rgba(10, 10, 10, 0.95)',
          color: '#ffffff',
          borderBottom: '2px solid #f57c00'
        },
        '& .RaDatagrid-rowCell': {
          padding: '8px 10px',
          backgroundColor: 'rgba(10, 10, 10, 0.8)',
          color: '#ffffff',
          borderBottom: '1px solid rgba(245, 124, 0, 0.2)'
        },
        '& .RaDatagrid-tbody tr:nth-of-type(even)': {
          backgroundColor: 'rgba(245, 124, 0, 0.05)'
        },
        '& .RaDatagrid-tbody tr:hover': {
          backgroundColor: 'rgba(245, 124, 0, 0.15) !important'
        }
      }}
    >
      <TextField source="id" sortable sx={{ width: '50px', fontSize: '0.85rem' }} />

      {/* Priority Display */}
      <Box sx={{ width: '140px', display: 'flex', justifyContent: 'center' }}>
        <Chip
          label="🔥 NEEDS APPROVAL"
          color="warning"
          size="small"
          sx={{
            fontWeight: 'bold',
            fontSize: '0.65rem',
            backgroundColor: '#fff3e0',
            color: '#f57c00',
            animation: 'pulse 2s infinite'
          }}
        />
      </Box>

      {/* Guide Preview */}
      <GuidePreviewField />

      {/* Title & Description - More space for pending guides */}
      <TextField 
        source="title" 
        sortable
        sx={{ 
          maxWidth: '220px',
          '& span': {
            fontWeight: 'bold',
            color: 'primary.main',
            fontSize: '0.9rem'
          }
        }} 
      />
      
      <TextField 
        source="description" 
        sortable
        sx={{ 
          maxWidth: '200px',
          '& span': {
            display: '-webkit-box',
            WebkitLineClamp: 1,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            fontSize: '0.8rem',
            color: 'text.secondary',
            lineHeight: 1.3
          }
        }} 
      />

      {/* Related Entities - Condensed for approval queue */}
      <GuideRelatedEntitiesField />

      {/* Type Classification */}
      <GuideTypeField />

      {/* Author & Submission Details */}
      <FunctionField
        label="Author"
        sortBy="authorId"
        render={(record: any) => (
          <Box sx={{
            width: '140px',
            display: 'flex',
            flexDirection: 'column',
            gap: 0.5
          }}>
            <Typography sx={{
              fontSize: '0.75rem',
              fontWeight: '500',
              color: 'primary.main'
            }}>
              {record?.author?.username || record?.submittedBy?.username || 'Unknown'}
            </Typography>
            <Typography sx={{
              fontSize: '0.7rem',
              color: 'text.secondary'
            }}>
              {record?.createdAt ? new Date(record.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              }) : ''}
            </Typography>
          </Box>
        )}
      />

      {/* Engagement Metrics */}
      <GuideEngagementField />

      {/* Priority Actions */}
      <Box 
        sx={{ 
          display: 'flex', 
          gap: 1, 
          minWidth: '160px',
          justifyContent: 'center',
          '& .MuiButton-root': {
            minWidth: '65px',
            padding: '8px 16px',
            fontSize: '0.75rem',
            fontWeight: 'bold',
            textTransform: 'uppercase'
          }
        }}
      >
        <ApproveGuideButton />
        <RejectGuideButton />
      </Box>
    </Datagrid>
  </List>
)

// Draft Actions Field Component
const DraftActionsField = () => {
  const record = useRecordContext()
  const notify = useNotify()
  const refresh = useRefresh()
  const redirect = useRedirect()

  if (!record) return null

  const handleEdit = () => {
    redirect(`/guides/${record.id}`)
  }

  const handleApprove = async () => {
    try {
      await api.approveGuide(Number(record.id))
      notify('Guide approved successfully', { type: 'success' })
      refresh()
    } catch (error: any) {
      console.error('Error approving guide:', error)
      const errorMessage = error?.details?.message || error?.message || 'Error approving guide'
      notify(errorMessage, { type: 'error' })
    }
  }

  return (
    <Box
      sx={{
        display: 'flex',
        gap: 1,
        minWidth: '140px',
        justifyContent: 'center',
        '& .MuiButton-root': {
          minWidth: '65px',
          padding: '6px 12px',
          fontSize: '0.7rem',
          fontWeight: 'bold',
          textTransform: 'uppercase'
        }
      }}
    >
      <Button
        label="Edit"
        onClick={handleEdit}
        color="primary"
        startIcon={<Edit3 size={16} />}
      />
      <Button
        label="Approve"
        onClick={handleApprove}
        color="secondary"
        startIcon={<Check size={16} />}
      />
    </Box>
  )
}

export const GuideDraftManager = () => (
  <List
    filter={{ status: GuideStatus.PENDING }}
    title="Pending Guide Submissions"
    perPage={50}
  >
    <Datagrid
      rowClick="edit"
      sx={{
        borderRadius: '8px',
        border: '1px solid rgba(225, 29, 72, 0.2)',
        overflow: 'hidden',
        '& .RaDatagrid-headerCell': {
          fontWeight: 'bold',
          fontSize: '0.9rem',
          backgroundColor: 'rgba(10, 10, 10, 0.95)',
          color: '#ffffff',
          borderBottom: '2px solid #2196f3'
        },
        '& .RaDatagrid-rowCell': {
          padding: '8px 10px',
          backgroundColor: 'rgba(10, 10, 10, 0.8)',
          color: '#ffffff',
          borderBottom: '1px solid rgba(33, 150, 243, 0.2)'
        },
        '& .RaDatagrid-tbody tr:nth-of-type(even)': {
          backgroundColor: 'rgba(33, 150, 243, 0.05)'
        },
        '& .RaDatagrid-tbody tr:hover': {
          backgroundColor: 'rgba(33, 150, 243, 0.15) !important'
        }
      }}
    >
      <TextField source="id" sortable sx={{ width: '50px', fontSize: '0.85rem' }} />

      {/* Draft Status */}
      <Box sx={{ width: '90px', display: 'flex', justifyContent: 'center' }}>
        <Chip
          label="📝 DRAFT"
          size="small"
          sx={{
            fontWeight: 'bold',
            fontSize: '0.7rem',
            backgroundColor: '#e3f2fd',
            color: '#1976d2',
            border: '1px solid #bbdefb'
          }}
        />
      </Box>

      {/* Guide Preview */}
      <GuidePreviewField />

      {/* Title & Description - More space for drafts */}
      <TextField 
        source="title" 
        sortable
        sx={{ 
          maxWidth: '200px',
          '& span': {
            fontWeight: 'bold',
            color: 'primary.main',
            fontSize: '0.85rem'
          }
        }} 
      />
      
      <TextField 
        source="description" 
        sortable
        sx={{ 
          maxWidth: '180px',
          '& span': {
            display: '-webkit-box',
            WebkitLineClamp: 1,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            fontSize: '0.8rem',
            color: 'text.secondary',
            lineHeight: 1.3,
            fontStyle: 'italic'
          }
        }} 
      />

      {/* Related Entities - Compact for drafts */}
      <GuideRelatedEntitiesField />

      {/* Type Classification */}
      <GuideTypeField />

      {/* Author & Last Modified */}
      <FunctionField
        label="Author"
        sortBy="authorId"
        render={(record: any) => (
          <Box sx={{
            width: '130px',
            display: 'flex',
            flexDirection: 'column',
            gap: 0.5
          }}>
            <Typography sx={{
              fontSize: '0.75rem',
              fontWeight: '500',
              color: 'primary.main'
            }}>
              {record?.author?.username || record?.submittedBy?.username || 'Unknown'}
            </Typography>
            <Typography sx={{
              fontSize: '0.7rem',
              color: 'text.secondary'
            }}>
              Created: {record?.createdAt ? new Date(record.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              }) : ''}
            </Typography>
            <Typography sx={{
              fontSize: '0.7rem',
              color: 'text.secondary'
            }}>
              Modified: {record?.updatedAt ? new Date(record.updatedAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              }) : ''}
            </Typography>
          </Box>
        )}
      />

      {/* Engagement Metrics */}
      <GuideEngagementField />

      {/* Edit Actions */}
      <DraftActionsField />
    </Datagrid>
  </List>
)

const GuideShowContent = () => {
  const record = useRecordContext()
  
  if (!record) {
    return <Loading />
  }

  return (
    <Box sx={{ 
      maxWidth: '1200px', 
      mx: 'auto', 
      p: 3,
      backgroundColor: '#0a0a0a',
      minHeight: '100vh',
      '& .RaShow-main': {
        backgroundColor: 'transparent'
      }
    }}>
        {/* Header Section */}
        <Card 
          elevation={0}
          sx={{ 
            mb: 3, 
            backgroundColor: '#0a0a0a',
            border: '2px solid #e11d48',
            borderRadius: 2,
            boxShadow: '0 0 30px rgba(225, 29, 72, 0.3)',
            overflow: 'hidden'
          }}
        >
          <Box sx={{
            background: 'linear-gradient(135deg, #e11d48 0%, #be185d 50%, #7c3aed 100%)',
            p: 4
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Box sx={{ 
                p: 1.5, 
                borderRadius: 2, 
                backgroundColor: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)'
              }}>
                <FileText size={32} color="white" />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h4" sx={{ 
                  fontWeight: 'bold', 
                  color: 'white', 
                  mb: 1,
                  textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                }}>
                  {record?.title || 'Guide Title'}
                </Typography>
                <Typography variant="body1" sx={{ 
                  color: 'rgba(255,255,255,0.9)', 
                  fontSize: '1.1rem',
                  opacity: 0.95
                }}>
                  {record?.description || 'No description provided'}
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Box sx={{ mb: 1 }}>
                  <GuideStatusField source="status" />
                </Box>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                  ID: {record?.id}
                </Typography>
              </Box>
            </Box>
            
            {/* Action Buttons */}
            <Box sx={{ 
              display: 'flex', 
              gap: 2, 
              mt: 3,
              '& .MuiButton-root': {
                px: 3,
                py: 1.5,
                borderRadius: 2,
                fontWeight: 'bold',
                fontSize: '1rem',
                minWidth: '140px',
                backgroundColor: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.3)',
                color: 'white',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                transition: 'all 0.3s ease',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.3)'
                }
              }
            }}>
              <ApproveGuideButton />
              <RejectGuideButton />
            </Box>
          </Box>
        </Card>

        <Grid container spacing={3}>
          {/* Main Content */}
          <Grid item xs={12} md={8}>
            {/* Guide Content */}
            {record?.content ? (
              <Card elevation={0} sx={{ 
                mb: 3,
                backgroundColor: '#0a0a0a',
                border: '1px solid rgba(225, 29, 72, 0.3)'
              }}>
                <Box sx={{
                  background: 'linear-gradient(135deg, #388e3c 0%, #2e7d32 100%)',
                  color: 'white',
                  p: 2
                }}>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 2 }}>
                    <FileText size={24} />
                    Guide Content
                  </Typography>
                </Box>
                <CardContent sx={{ p: 4 }}>
                  <Box sx={{ 
                    p: 3, 
                    border: '2px solid rgba(225, 29, 72, 0.2)', 
                    borderRadius: 2,
                    backgroundColor: '#0f0f0f',
                    minHeight: '200px',
                    '& h1': { 
                      fontSize: '1.75rem', 
                      fontWeight: 'bold', 
                      mb: 2,
                      color: '#e11d48',
                      borderBottom: '2px solid #e11d48',
                      pb: 1
                    },
                    '& h2': { 
                      fontSize: '1.5rem', 
                      fontWeight: 'bold', 
                      mb: 1.5,
                      color: '#f43f5e',
                      borderBottom: '1px solid rgba(225, 29, 72, 0.5)',
                      pb: 0.5
                    },
                    '& h3': { 
                      fontSize: '1.25rem', 
                      fontWeight: 'bold', 
                      mb: 1,
                      color: '#f43f5e'
                    },
                    '& p': { 
                      mb: 1.5, 
                      lineHeight: 1.7,
                      fontSize: '1rem',
                      color: '#ffffff'
                    },
                    '& ul, & ol': { 
                      mb: 2, 
                      pl: 3,
                      color: '#ffffff',
                      '& li': { 
                        mb: 0.8,
                        lineHeight: 1.6
                      }
                    },
                    '& code': { 
                      backgroundColor: 'rgba(225, 29, 72, 0.2)', 
                      color: '#f43f5e',
                      padding: '4px 8px', 
                      borderRadius: '6px',
                      fontSize: '0.9rem',
                      fontWeight: 'bold',
                      border: '1px solid rgba(225, 29, 72, 0.3)',
                      fontFamily: 'monospace'
                    },
                    '& pre': { 
                      backgroundColor: '#000000', 
                      color: '#ffffff',
                      p: 3, 
                      borderRadius: 2, 
                      overflow: 'auto',
                      mb: 2,
                      border: '2px solid #e11d48',
                      '& code': {
                        backgroundColor: 'transparent',
                        color: '#ffffff',
                        border: 'none',
                        padding: 0
                      }
                    },
                    '& blockquote': {
                      borderLeft: '4px solid #e11d48',
                      backgroundColor: 'rgba(225, 29, 72, 0.1)',
                      pl: 3,
                      pr: 2,
                      py: 2,
                      ml: 0,
                      mr: 0,
                      fontStyle: 'italic',
                      mb: 2,
                      borderRadius: '0 8px 8px 0',
                      color: '#ffffff'
                    },
                    '& table': {
                      width: '100%',
                      borderCollapse: 'collapse',
                      mb: 2,
                      '& th, & td': {
                        border: '1px solid rgba(225, 29, 72, 0.3)',
                        padding: '12px',
                        textAlign: 'left',
                        color: '#ffffff'
                      },
                      '& th': {
                        backgroundColor: 'rgba(225, 29, 72, 0.2)',
                        fontWeight: 'bold',
                        color: '#f43f5e'
                      }
                    },
                    '& a': {
                      color: '#e11d48',
                      textDecoration: 'underline',
                      '&:hover': {
                        color: '#f43f5e'
                      }
                    }
                  }}>
                    <EnhancedSpoilerMarkdown
                      content={record.content}
                      enableEntityEmbeds={true}
                      compactEntityCards={false}
                    />
                  </Box>
                </CardContent>
              </Card>
            ) : (
              <Card elevation={0} sx={{ 
                mb: 3,
                backgroundColor: '#0a0a0a',
                border: '1px solid rgba(225, 29, 72, 0.3)'
              }}>
                <CardContent sx={{ p: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    No content available for this guide.
                  </Typography>
                </CardContent>
              </Card>
            )}
          </Grid>

          {/* Sidebar with Meta Information */}
          <Grid item xs={12} md={4}>
            {/* Author Information */}
            <Card elevation={0} sx={{ 
              mb: 3,
              backgroundColor: '#0a0a0a',
              border: '1px solid rgba(225, 29, 72, 0.3)'
            }}>
              <Box sx={{
                background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                color: 'white',
                p: 2
              }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 2 }}>
                  <User size={20} />
                  Author Information
                </Typography>
              </Box>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ 
                    bgcolor: '#e11d48', 
                    width: 48, 
                    height: 48,
                    border: '2px solid rgba(225, 29, 72, 0.5)'
                  }}>
                    <User size={24} />
                  </Avatar>
                  <Box>
                    <ReferenceField source="authorId" reference="users" label="" link="show">
                      <TextField 
                        source="username" 
                        sx={{ 
                          '& span': { 
                            fontWeight: 'bold', 
                            fontSize: '1.1rem',
                            color: '#e11d48'
                          }
                        }}
                      />
                    </ReferenceField>
                    <Typography variant="body2" color="text.secondary">
                      Guide Author
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* Relations */}
            <Card elevation={0} sx={{ 
              mb: 3,
              backgroundColor: '#0a0a0a',
              border: '1px solid rgba(225, 29, 72, 0.3)'
            }}>
              <Box sx={{
                background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                color: 'white',
                p: 2
              }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 2 }}>
                  <FileText size={20} />
                  Related Content
                </Typography>
              </Box>
              <CardContent sx={{ p: 3 }}>
                {record?.characters && record.characters.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Characters
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {record.characters.map((character: any) => (
                        <Chip 
                          key={character.id}
                          label={character.name} 
                          color="primary" 
                          size="small"
                          sx={{ backgroundColor: 'rgba(225, 29, 72, 0.2)', color: '#f43f5e' }}
                        />
                      ))}
                    </Box>
                  </Box>
                )}
                
                {record?.arc && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Arc
                    </Typography>
                    <Chip 
                      label={record.arc.name} 
                      color="secondary" 
                      size="small"
                      sx={{ backgroundColor: 'rgba(124, 58, 237, 0.2)', color: '#a855f7' }}
                    />
                  </Box>
                )}
                
                {record?.gambles && record.gambles.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Gambles
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {record.gambles.map((gamble: any) => (
                        <Chip 
                          key={gamble.id}
                          label={gamble.name} 
                          color="info" 
                          size="small"
                          sx={{ backgroundColor: 'rgba(25, 118, 210, 0.2)', color: '#60a5fa' }}
                        />
                      ))}
                    </Box>
                  </Box>
                )}
                
                {(!record?.characters || record.characters.length === 0) && 
                 !record?.arc && 
                 (!record?.gambles || record.gambles.length === 0) && (
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    No related content associated
                  </Typography>
                )}
              </CardContent>
            </Card>

            {/* Statistics */}
            <Card elevation={0} sx={{ 
              mb: 3,
              backgroundColor: '#0a0a0a',
              border: '1px solid rgba(225, 29, 72, 0.3)'
            }}>
              <Box sx={{
                background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
                color: 'white',
                p: 2
              }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Eye size={20} />
                  Statistics
                </Typography>
              </Box>
              <CardContent sx={{ p: 3 }}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Box sx={{ 
                      textAlign: 'center', 
                      p: 2, 
                      backgroundColor: 'rgba(225, 29, 72, 0.1)', 
                      borderRadius: 2,
                      border: '1px solid rgba(225, 29, 72, 0.3)'
                    }}>
                      <Eye size={24} color="#e11d48" style={{ marginBottom: 8 }} />
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#ffffff' }}>
                        <NumberField source="viewCount" />
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Views
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ 
                      textAlign: 'center', 
                      p: 2, 
                      backgroundColor: 'rgba(225, 29, 72, 0.1)', 
                      borderRadius: 2,
                      border: '1px solid rgba(225, 29, 72, 0.3)'
                    }}>
                      <Heart size={24} color="#e11d48" style={{ marginBottom: 8 }} />
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#ffffff' }}>
                        <NumberField source="likeCount" />
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Likes
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Dates & Rejection Reason */}
            <Card elevation={0} sx={{
              backgroundColor: '#0a0a0a',
              border: '1px solid rgba(225, 29, 72, 0.3)'
            }}>
              <Box sx={{
                background: 'linear-gradient(135deg, #f57c00 0%, #ef6c00 100%)',
                color: 'white',
                p: 2
              }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Calendar size={20} />
                  Submission Details
                </Typography>
              </Box>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Created
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Calendar size={16} color="#e11d48" />
                    <DateField 
                      source="createdAt" 
                      sx={{ 
                        '& span': { 
                          fontWeight: '500',
                          fontSize: '0.95rem',
                          color: '#ffffff'
                        }
                      }}
                    />
                  </Box>
                </Box>
                
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Last Updated
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Clock size={16} color="#e11d48" />
                    <DateField 
                      source="updatedAt" 
                      sx={{ 
                        '& span': { 
                          fontWeight: '500',
                          fontSize: '0.95rem',
                          color: '#ffffff'
                        }
                      }}
                    />
                  </Box>
                </Box>

                {/* Rejection Reason if exists */}
                {record?.rejectionReason && (
                  <Box sx={{ 
                    p: 2, 
                    backgroundColor: 'rgba(225, 29, 72, 0.1)', 
                    borderRadius: 2,
                    border: '1px solid #e11d48'
                  }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Rejection Reason
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#f43f5e', fontStyle: 'italic' }}>
                      <TextField source="rejectionReason" />
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
    </Box>
  )
}

export const GuideShow = () => {
  return (
    <Show>
      <GuideShowContent />
    </Show>
  )
}

// Custom content input component with tabs
const ContentInputWithPreview = () => {
  const [activeTab, setActiveTab] = useState(0)
  const record = useRecordContext()
  const { setValue, getValues, watch } = useFormContext()
  const [textAreaRef, setTextAreaRef] = useState<HTMLTextAreaElement | null>(null)
  const contentValue = watch('content')

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue)
  }

  const handleInsertEmbed = (embedCode: string) => {
    if (textAreaRef) {
      const currentValue = getValues().content || ''
      const cursorPosition = textAreaRef.selectionStart || currentValue.length
      const newValue =
        currentValue.slice(0, cursorPosition) +
        embedCode +
        currentValue.slice(cursorPosition)

      setValue('content', newValue, { shouldDirty: true, shouldValidate: true })

      // Focus back to textarea and position cursor after the inserted embed
      setTimeout(() => {
        textAreaRef.focus()
        textAreaRef.setSelectionRange(
          cursorPosition + embedCode.length,
          cursorPosition + embedCode.length
        )
      }, 100)
    } else {
      // Fallback: just append to the end
      const currentValue = getValues().content || ''
      setValue('content', currentValue + embedCode, { shouldDirty: true, shouldValidate: true })
    }
  }

  return (
    <Box sx={{
      p: 3,
      backgroundColor: 'rgba(124, 58, 237, 0.05)',
      borderRadius: 2,
      border: '1px solid rgba(124, 58, 237, 0.2)',
      mb: 3
    }}>
      <Typography variant="h6" sx={{ color: '#7c3aed', mb: 2, fontWeight: 'bold' }}>
        Guide Content
      </Typography>

      <EntityEmbedHelperWithSearch
        onInsertEmbed={handleInsertEmbed}
      />

      <Card sx={{ mt: 2, border: '1px solid rgba(124, 58, 237, 0.3)' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab label="Write" icon={<FileText size={16} />} iconPosition="start" />
            <Tab label="Preview" icon={<Eye size={16} />} iconPosition="start" />
          </Tabs>
        </Box>

        <CardContent>
          {activeTab === 0 ? (
            <TextInput
              source="content"
              multiline
              rows={15}
              required
              fullWidth
              label="Content (Markdown Supported)"
              helperText="Write your guide content using Markdown formatting and entity embeds"
              sx={{
                '& .MuiInputBase-input': {
                  fontFamily: 'monospace',
                  fontSize: '0.9rem',
                  lineHeight: 1.6
                }
              }}
              inputProps={{
                ref: (ref: HTMLTextAreaElement) => setTextAreaRef(ref)
              }}
            />
          ) : (
            <Box>
              <Typography variant="h6" gutterBottom>
                Preview
              </Typography>
              <Box sx={{
                border: '1px solid rgba(124, 58, 237, 0.2)',
                borderRadius: 1,
                p: 2,
                minHeight: '400px',
                backgroundColor: 'rgba(124, 58, 237, 0.02)'
              }}>
                {contentValue ? (
                  <EnhancedSpoilerMarkdown
                    content={contentValue}
                    compactEntityCards={false}
                    enableEntityEmbeds={true}
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
    </Box>
  )
}

// Content input component for create page (no existing content)
const ContentInputWithPreviewCreate = () => {
  const [activeTab, setActiveTab] = useState(0)
  const { setValue, getValues, watch } = useFormContext()
  const [textAreaRef, setTextAreaRef] = useState<HTMLTextAreaElement | null>(null)
  const contentValue = watch('content')

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue)
  }

  const handleInsertEmbed = (embedCode: string) => {
    if (textAreaRef) {
      const currentValue = getValues().content || ''
      const cursorPosition = textAreaRef.selectionStart || currentValue.length
      const newValue =
        currentValue.slice(0, cursorPosition) +
        embedCode +
        currentValue.slice(cursorPosition)

      setValue('content', newValue, { shouldDirty: true, shouldValidate: true })

      // Focus back to textarea and position cursor after the inserted embed
      setTimeout(() => {
        textAreaRef.focus()
        textAreaRef.setSelectionRange(
          cursorPosition + embedCode.length,
          cursorPosition + embedCode.length
        )
      }, 100)
    } else {
      // Fallback: just append to the end
      const currentValue = getValues().content || ''
      setValue('content', currentValue + embedCode, { shouldDirty: true, shouldValidate: true })
    }
  }

  return (
    <Box sx={{
      p: 3,
      backgroundColor: 'rgba(124, 58, 237, 0.05)',
      borderRadius: 2,
      border: '1px solid rgba(124, 58, 237, 0.2)',
      mb: 3
    }}>
      <Typography variant="h6" sx={{ color: '#7c3aed', mb: 2, fontWeight: 'bold' }}>
        Guide Content
      </Typography>

      <EntityEmbedHelperWithSearch
        onInsertEmbed={handleInsertEmbed}
      />

      <Card sx={{ mt: 2, border: '1px solid rgba(124, 58, 237, 0.3)' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab label="Write" icon={<FileText size={16} />} iconPosition="start" />
            <Tab label="Preview" icon={<Eye size={16} />} iconPosition="start" />
          </Tabs>
        </Box>

        <CardContent>
          {activeTab === 0 ? (
            <TextInput
              source="content"
              multiline
              rows={12}
              required
              fullWidth
              label="Content (Markdown Supported)"
              helperText="Write your guide content using Markdown formatting and entity embeds"
              sx={{
                '& .MuiInputBase-input': {
                  fontFamily: 'monospace',
                  fontSize: '0.9rem',
                  lineHeight: 1.6
                }
              }}
              inputProps={{
                ref: (ref: HTMLTextAreaElement) => setTextAreaRef(ref)
              }}
            />
          ) : (
            <Box>
              <Typography variant="h6" gutterBottom>
                Preview
              </Typography>
              <Box sx={{
                border: '1px solid rgba(124, 58, 237, 0.2)',
                borderRadius: 1,
                p: 2,
                minHeight: '300px',
                backgroundColor: 'rgba(124, 58, 237, 0.02)'
              }}>
                {contentValue ? (
                  <EnhancedSpoilerMarkdown
                    content={contentValue}
                    compactEntityCards={false}
                    enableEntityEmbeds={true}
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
    </Box>
  )
}

// Publication Status Input with rejection reason validation
const PublicationStatusInput = () => {
  const { setValue, setError, clearErrors, formState: { errors } } = useFormContext()
  const status = useWatch({ name: 'status' })
  const rejectionReason = useWatch({ name: 'rejectionReason' })
  const notify = useNotify()
  const [showReasonWarning, setShowReasonWarning] = useState(false)

  useEffect(() => {
    if (status === GuideStatus.REJECTED && (!rejectionReason || rejectionReason.trim() === '')) {
      setShowReasonWarning(true)
      setError('rejectionReason', {
        type: 'required',
        message: 'Rejection reason is required when status is rejected'
      })
    } else {
      setShowReasonWarning(false)
      clearErrors('rejectionReason')
    }
  }, [status, rejectionReason, setError, clearErrors])

  const handleStatusChange = (event: any) => {
    const newStatus = event.target.value
    setValue('status', newStatus, { shouldDirty: true, shouldValidate: true })

    if (newStatus === GuideStatus.REJECTED) {
      notify('Please provide a rejection reason below', { type: 'warning' })
    }
  }

  return (
    <Box sx={{
      p: 3,
      backgroundColor: 'rgba(245, 124, 0, 0.05)',
      borderRadius: 2,
      border: showReasonWarning ? '2px solid #f44336' : '1px solid rgba(245, 124, 0, 0.2)'
    }}>
      <Typography variant="h6" sx={{ color: '#f57c00', mb: 2, fontWeight: 'bold' }}>
        Publication Status
      </Typography>

      <SelectInput
        source="status"
        choices={[
          { id: GuideStatus.PENDING, name: 'Pending Review' },
          { id: GuideStatus.APPROVED, name: 'Approved' },
          { id: GuideStatus.REJECTED, name: 'Rejected' }
        ]}
        fullWidth
        onChange={handleStatusChange}
        sx={{
          '& .MuiSelect-select': {
            backgroundColor: '#0f0f0f'
          }
        }}
      />

      <TextInput
        source="rejectionReason"
        multiline
        rows={3}
        label="Rejection Reason"
        helperText={showReasonWarning
          ? "REQUIRED: You must provide a reason when rejecting a guide"
          : "Required when status is rejected"
        }
        fullWidth
        sx={{
          mt: 2,
          '& .MuiOutlinedInput-root': {
            borderColor: showReasonWarning ? '#f44336' : undefined,
            '&:hover': {
              borderColor: showReasonWarning ? '#f44336' : undefined
            }
          },
          '& .MuiFormHelperText-root': {
            color: showReasonWarning ? '#f44336' : undefined,
            fontWeight: showReasonWarning ? 'bold' : undefined
          }
        }}
        validate={(value: string) => {
          if (status === GuideStatus.REJECTED && (!value || value.trim() === '')) {
            return 'Rejection reason is required when status is rejected'
          }
          return undefined
        }}
      />

      {showReasonWarning && (
        <Box sx={{
          mt: 2,
          p: 2,
          backgroundColor: 'rgba(244, 67, 54, 0.1)',
          borderRadius: 1,
          border: '1px solid #f44336'
        }}>
          <Typography variant="body2" sx={{
            color: '#f44336',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}>
            You must provide a rejection reason before saving
          </Typography>
        </Box>
      )}
    </Box>
  )
}

export const GuideEdit = () => {
  const { permissions } = usePermissions()

  return (
    <Edit>
      <Box sx={{ 
        backgroundColor: '#0a0a0a',
        minHeight: '100vh',
        p: 3,
        '& .RaEdit-main': {
          backgroundColor: 'transparent'
        }
      }}>
        <Card 
          elevation={0}
          sx={{ 
            maxWidth: '1000px',
            mx: 'auto',
            backgroundColor: '#0a0a0a',
            border: '2px solid #e11d48',
            borderRadius: 2,
            boxShadow: '0 0 30px rgba(225, 29, 72, 0.2)'
          }}
        >
          {/* Header */}
          <Box sx={{
            background: 'linear-gradient(135deg, #388e3c 0%, #2e7d32 100%)',
            p: 3,
            color: 'white'
          }}>
            <Typography variant="h4" sx={{ 
              fontWeight: 'bold', 
              display: 'flex', 
              alignItems: 'center', 
              gap: 2,
              textShadow: '0 2px 4px rgba(0,0,0,0.3)'
            }}>
              <Edit3 size={32} />
              Edit Guide
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9, mt: 1 }}>
              Update guide content and settings
            </Typography>
          </Box>

          <CardContent sx={{ p: 4 }}>
            <SimpleForm sx={{
              '& .MuiTextField-root': {
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#0f0f0f',
                  border: '1px solid rgba(225, 29, 72, 0.3)',
                  '&:hover': {
                    borderColor: 'rgba(225, 29, 72, 0.5)'
                  },
                  '&.Mui-focused': {
                    borderColor: '#e11d48'
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    border: 'none'
                  }
                },
                '& .MuiInputLabel-root': {
                  color: 'rgba(255, 255, 255, 0.7)',
                  '&.Mui-focused': {
                    color: '#e11d48'
                  }
                },
                '& .MuiInputBase-input': {
                  color: '#ffffff'
                }
              },
              '& .MuiFormControl-root': {
                mb: 3
              }
            }}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Box sx={{ 
                    p: 3, 
                    backgroundColor: 'rgba(225, 29, 72, 0.05)', 
                    borderRadius: 2, 
                    border: '1px solid rgba(225, 29, 72, 0.2)',
                    mb: 3
                  }}>
                    <Typography variant="h6" sx={{ color: '#e11d48', mb: 2, fontWeight: 'bold' }}>
                      Basic Information
                    </Typography>
                    <TextInput 
                      source="title" 
                      required 
                      fullWidth
                      label="Guide Title"
                      helperText="Enter a descriptive title for your guide"
                    />
                    <TextInput 
                      source="description" 
                      multiline 
                      rows={3} 
                      required 
                      fullWidth
                      label="Guide Description"
                      helperText="Provide a brief summary of what this guide covers"
                    />
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <ContentInputWithPreview />
                </Grid>

                <Grid item xs={12} md={6}>
                  <Box sx={{ 
                    p: 3, 
                    backgroundColor: 'rgba(25, 118, 210, 0.05)', 
                    borderRadius: 2, 
                    border: '1px solid rgba(25, 118, 210, 0.2)'
                  }}>
                    <Typography variant="h6" sx={{ color: '#1976d2', mb: 2, fontWeight: 'bold' }}>
                      Author Settings
                    </Typography>
                    <ReferenceInput
                      source="authorId"
                      reference="users"
                      label="Author"
                      fullWidth
                      perPage={200}
                    >
                      <AutocompleteInput 
                        optionText="username" 
                        disabled={permissions !== 'admin' && permissions !== 'moderator'}
                        sx={{
                          '& .MuiAutocomplete-root .MuiOutlinedInput-root': {
                            backgroundColor: '#0f0f0f'
                          }
                        }}
                      />
                    </ReferenceInput>
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <PublicationStatusInput />
                </Grid>

                <Grid item xs={12}>
                  <Box sx={{ 
                    p: 3, 
                    backgroundColor: 'rgba(16, 185, 129, 0.05)', 
                    borderRadius: 2, 
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                    mb: 3
                  }}>
                    <Typography variant="h6" sx={{ color: '#10b981', mb: 3, fontWeight: 'bold' }}>
                      Related Content
                    </Typography>
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={4}>
                        <ReferenceArrayInput
                          source="characterIds"
                          reference="characters"
                          label="Characters"
                          perPage={200}
                        >
                          <AutocompleteArrayInput 
                            optionText="name"
                            sx={{
                              '& .MuiAutocomplete-root .MuiOutlinedInput-root': {
                                backgroundColor: '#0f0f0f'
                              }
                            }}
                          />
                        </ReferenceArrayInput>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <ReferenceInput
                          source="arcId"
                          reference="arcs"
                          label="Arc"
                          perPage={200}
                        >
                          <AutocompleteInput 
                            optionText="name"
                            sx={{
                              '& .MuiAutocomplete-root .MuiOutlinedInput-root': {
                                backgroundColor: '#0f0f0f'
                              }
                            }}
                          />
                        </ReferenceInput>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <ReferenceArrayInput
                          source="gambleIds"
                          reference="gambles"
                          label="Gambles"
                          perPage={200}
                        >
                          <AutocompleteArrayInput 
                            optionText="name"
                            sx={{
                              '& .MuiAutocomplete-root .MuiOutlinedInput-root': {
                                backgroundColor: '#0f0f0f'
                              }
                            }}
                          />
                        </ReferenceArrayInput>
                      </Grid>
                    </Grid>
                  </Box>
                </Grid>
              </Grid>
            </SimpleForm>
          </CardContent>
        </Card>
      </Box>
    </Edit>
  )
}

export const GuideCreate = () => (
  <Create>
    <Box sx={{ 
      backgroundColor: '#0a0a0a',
      minHeight: '100vh',
      p: 3,
      '& .RaCreate-main': {
        backgroundColor: 'transparent'
      }
    }}>
      <Card 
        elevation={0}
        sx={{ 
          maxWidth: '1000px',
          mx: 'auto',
          backgroundColor: '#0a0a0a',
          border: '2px solid #e11d48',
          borderRadius: 2,
          boxShadow: '0 0 30px rgba(225, 29, 72, 0.2)'
        }}
      >
        <Box sx={{
          background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
          p: 3,
          color: 'white'
        }}>
          <Typography variant="h4" sx={{ 
            fontWeight: 'bold', 
            display: 'flex', 
            alignItems: 'center', 
            gap: 2,
            textShadow: '0 2px 4px rgba(0,0,0,0.3)'
          }}>
            <FileText size={32} />
            Create New Guide
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.9, mt: 1 }}>
            Add a new guide to the system
          </Typography>
        </Box>

        <CardContent sx={{ p: 4 }}>
          <SimpleForm sx={{
            '& .MuiTextField-root': {
              mb: 3,
              '& .MuiOutlinedInput-root': {
                backgroundColor: '#0f0f0f',
                border: '1px solid rgba(225, 29, 72, 0.3)',
                '&:hover': {
                  borderColor: 'rgba(225, 29, 72, 0.5)'
                },
                '&.Mui-focused': {
                  borderColor: '#e11d48'
                },
                '& .MuiOutlinedInput-notchedOutline': {
                  border: 'none'
                }
              },
              '& .MuiInputLabel-root': {
                color: 'rgba(255, 255, 255, 0.7)',
                '&.Mui-focused': {
                  color: '#e11d48'
                }
              },
              '& .MuiInputBase-input': {
                color: '#ffffff'
              }
            },
            '& .MuiFormControl-root': {
              mb: 3
            }
          }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Box sx={{ 
                  p: 3, 
                  backgroundColor: 'rgba(225, 29, 72, 0.05)', 
                  borderRadius: 2, 
                  border: '1px solid rgba(225, 29, 72, 0.2)',
                  mb: 3
                }}>
                  <Typography variant="h6" sx={{ color: '#e11d48', mb: 2, fontWeight: 'bold' }}>
                    Basic Information
                  </Typography>
                  <TextInput source="title" required fullWidth />
                  <TextInput source="description" multiline rows={3} required fullWidth />
                </Box>
              </Grid>

              <Grid item xs={12}>
                <ContentInputWithPreviewCreate />
              </Grid>

              <Grid item xs={12} md={6}>
                <Box sx={{ 
                  p: 3, 
                  backgroundColor: 'rgba(25, 118, 210, 0.05)', 
                  borderRadius: 2, 
                  border: '1px solid rgba(25, 118, 210, 0.2)'
                }}>
                  <Typography variant="h6" sx={{ color: '#1976d2', mb: 2, fontWeight: 'bold' }}>
                    Author & Status
                  </Typography>
                  <ReferenceInput source="authorId" reference="users" label="Author" perPage={200}>
                    <AutocompleteInput optionText="username" />
                  </ReferenceInput>
                  <SelectInput source="status" choices={[
                    { id: GuideStatus.PENDING, name: 'Pending Review' },
                    { id: GuideStatus.APPROVED, name: 'Approved' },
                    { id: GuideStatus.REJECTED, name: 'Rejected' }
                  ]} defaultValue={GuideStatus.PENDING} />
                  <TextInput source="rejectionReason" multiline rows={3} label="Rejection Reason" helperText="Required when status is rejected" />
                </Box>
              </Grid>

              <Grid item xs={12} md={6}>
                <Box sx={{ 
                  p: 3, 
                  backgroundColor: 'rgba(16, 185, 129, 0.05)', 
                  borderRadius: 2, 
                  border: '1px solid rgba(16, 185, 129, 0.2)'
                }}>
                  <Typography variant="h6" sx={{ color: '#10b981', mb: 2, fontWeight: 'bold' }}>
                    Related Content
                  </Typography>
                  <ReferenceArrayInput source="characterIds" reference="characters" label="Characters" perPage={200}>
                    <AutocompleteArrayInput optionText="name" />
                  </ReferenceArrayInput>
                  <ReferenceInput source="arcId" reference="arcs" label="Arc" perPage={200}>
                    <AutocompleteInput optionText="name" />
                  </ReferenceInput>
                  <ReferenceArrayInput source="gambleIds" reference="gambles" label="Gambles" perPage={200}>
                    <AutocompleteArrayInput optionText="name" />
                  </ReferenceArrayInput>
                </Box>
              </Grid>
            </Grid>
          </SimpleForm>
        </CardContent>
      </Card>
    </Box>
  </Create>
)