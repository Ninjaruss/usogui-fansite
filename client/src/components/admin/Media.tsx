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
  UrlField,
  SelectInput,
  ReferenceInput,
  AutocompleteInput,
  Button,
  useRecordContext,
  useNotify,
  useRefresh,
  useListContext,
  FunctionField
} from 'react-admin'
import { useWatch } from 'react-hook-form'
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
  TextField as MuiTextField
} from '@mui/material'
import Image from 'next/image'
import {
  Check,
  X,
  Image as ImageIcon, 
  User, 
  BookOpen, 
  Calendar, 
  Volume2, 
  ExternalLink, 
  Link as LinkIcon
} from 'lucide-react'
import { api } from '../../lib/api'

const TruncatedUrlField = () => {
  const record = useRecordContext()
  if (!record?.url) return null

  // Function to truncate URL intelligently
  const truncateUrl = (url: string, maxLength: number = 30) => {
    if (url.length <= maxLength) return url
    
    // Try to keep the domain and show ... in the middle
    const urlObj = new URL(url)
    const domain = urlObj.hostname
    const path = urlObj.pathname + urlObj.search
    
    if (domain.length + 10 >= maxLength) {
      // If domain is too long, just truncate from the end
      return url.substring(0, maxLength - 3) + '...'
    }
    
    // Show domain + truncated path
    const availableForPath = maxLength - domain.length - 6 // 6 for "https://" and "..."
    if (path.length > availableForPath) {
      const truncatedPath = path.substring(0, availableForPath) + '...'
      return `${domain}${truncatedPath}`
    }
    
    return url
  }

  const displayUrl = truncateUrl(record.url)

  return (
    <Box sx={{ 
      maxWidth: '150px',
      overflow: 'hidden',
      '& a': {
        fontWeight: 'bold',
        color: 'primary.main',
        textDecoration: 'none',
        fontSize: '0.75rem',
        display: 'block',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        '&:hover': { 
          textDecoration: 'underline',
          // Show full URL on hover
          '&::after': {
            content: `"${record.url}"`,
            position: 'absolute',
            bottom: '100%',
            left: '0',
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '0.7rem',
            whiteSpace: 'nowrap',
            zIndex: 1000,
            pointerEvents: 'none',
            maxWidth: '300px',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }
        }
      }
    }}>
      <a href={record.url} target="_blank" rel="noopener noreferrer" title={record.url}>
        {displayUrl}
      </a>
    </Box>
  )
}

const MediaStatusField = ({ source }: { source: string }) => {
  const record = useRecordContext()
  if (!record) return null

  const status = record[source]
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'approved': return 'success'
      case 'rejected': return 'error'
      case 'pending': return 'warning'
      default: return 'warning'
    }
  }

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'approved': return '✅'
      case 'rejected': return '❌'
      case 'pending': return '⏳'
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
        minWidth: '85px'
      }}
    />
  )
}

const MediaPurposeField = ({ source }: { source: string }) => {
  const record = useRecordContext()
  if (!record) return null
  
  const purpose = record[source]
  const color = purpose === 'entity_display' ? 'secondary' : 'primary'
  const label = purpose === 'entity_display' ? 'Entity Display' : 'Gallery'
  
  return (
    <Chip 
      label={label} 
      color={color} 
      size="small" 
      sx={{
        fontWeight: 'bold',
        textTransform: 'capitalize',
        fontSize: '0.75rem',
        height: '28px',
        minWidth: '80px'
      }}
    />
  )
}

const MediaPreviewField = ({ source }: { source: string }) => {
  const record = useRecordContext()
  if (!record?.url) return null

  switch (record.type) {
    case 'image':
      return (
        <Box sx={{ width: '80px', height: '60px', position: 'relative', display: 'flex', justifyContent: 'center' }}>
          <Image
            src={record.url}
            alt="Media preview"
            width={60}
            height={60}
            style={{
              objectFit: 'cover',
              borderRadius: '4px',
              border: '2px solid #e11d48'
            }}
          />
        </Box>
      )
    case 'video':
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
            <Volume2 size={24} color="#e11d48" />
          </Box>
        </Box>
      )
    case 'audio':
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
            <Volume2 size={24} color="#e11d48" />
          </Box>
        </Box>
      )
    default:
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
            <ExternalLink size={24} color="#e11d48" />
          </Box>
        </Box>
      )
  }
}

const EntityInfoField = () => {
  const record = useRecordContext()
  if (!record) return null

  const getEntityTypeColor = (type: string) => {
    switch(type) {
      case 'character': return { bg: 'rgba(76, 175, 80, 0.2)', color: '#4caf50' }
      case 'arc': return { bg: 'rgba(255, 152, 0, 0.2)', color: '#ff9800' }
      case 'event': return { bg: 'rgba(156, 39, 176, 0.2)', color: '#9c27b0' }
      case 'gamble': return { bg: 'rgba(244, 67, 54, 0.2)', color: '#f44336' }
      case 'organization': return { bg: 'rgba(63, 81, 181, 0.2)', color: '#3f51b5' }
      default: return { bg: 'rgba(158, 158, 158, 0.2)', color: '#9e9e9e' }
    }
  }

  const colors = getEntityTypeColor(record.ownerType)

  return (
    <Box sx={{ width: '180px' }}>
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        p: 1,
        borderRadius: 1,
        backgroundColor: 'rgba(25, 118, 210, 0.05)',
        border: '1px solid rgba(25, 118, 210, 0.2)'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip
            size="small"
            label={record.ownerType || 'Unknown'}
            sx={{
              backgroundColor: colors.bg,
              color: colors.color,
              fontWeight: 'bold',
              textTransform: 'capitalize',
              fontSize: '0.75rem'
            }}
          />
          <Typography variant="caption" sx={{
            fontWeight: 'bold',
            color: 'text.secondary',
            fontSize: '0.7rem'
          }}>
            #{record.ownerId || 'N/A'}
          </Typography>
        </Box>
        <Box sx={{ minHeight: '20px' }}>
          <EntityNameDisplay />
        </Box>
      </Box>
    </Box>
  )
}

const MediaTypeField = () => {
  const record = useRecordContext()
  if (!record) return null

  const getTypeColor = (type: string) => {
    switch(type) {
      case 'image': return { bg: 'rgba(76, 175, 80, 0.1)', color: '#4caf50' }
      case 'video': return { bg: 'rgba(255, 152, 0, 0.1)', color: '#ff9800' }
      case 'audio': return { bg: 'rgba(156, 39, 176, 0.1)', color: '#9c27b0' }
      default: return { bg: 'rgba(158, 158, 158, 0.1)', color: '#9e9e9e' }
    }
  }

  const colors = getTypeColor(record.type)

  return (
    <Box sx={{ width: '140px', display: 'flex', flexDirection: 'column', gap: 0.5 }}>
      <Chip
        size="small"
        label={record.type || 'Unknown'}
        sx={{
          fontWeight: '500',
          textTransform: 'capitalize',
          backgroundColor: colors.bg,
          color: colors.color,
          fontSize: '0.7rem'
        }}
      />
      <MediaPurposeField source="purpose" />
    </Box>
  )
}

const SubmissionDetailsField = () => {
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
        {record.submittedBy?.username || 'Unknown'}
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

const ChapterInfoField = () => {
  const record = useRecordContext()
  if (!record) return null

  return (
    <Box sx={{ width: '80px', textAlign: 'center' }}>
      {record.chapterNumber ? (
        <Chip
          size="small"
          label={`Ch.${record.chapterNumber}`}
          sx={{
            backgroundColor: 'rgba(245, 124, 0, 0.1)',
            color: '#f57c00',
            fontWeight: 'bold',
            fontSize: '0.7rem'
          }}
        />
      ) : (
        <Typography sx={{ fontSize: '0.7rem', color: 'text.disabled' }}>
          -
        </Typography>
      )}
    </Box>
  )
}

// Custom Filter Toolbar Component
const MediaFilterToolbar = () => {
  const { filterValues, setFilters } = useListContext()
  const [entitySearch, setEntitySearch] = useState('')
  const [selectedEntities, setSelectedEntities] = useState<{
    characters: any[]
    arcs: any[]
    events: any[]
    gambles: any[]
    organizations: any[]
  }>({ characters: [], arcs: [], events: [], gambles: [], organizations: [] })
  
  const [entities, setEntities] = useState<{
    characters: any[]
    arcs: any[]
    events: any[]
    gambles: any[]
    organizations: any[]
  }>({ characters: [], arcs: [], events: [], gambles: [], organizations: [] })

  // Load entities on mount
  useEffect(() => {
    const loadEntities = async () => {
      try {
        const [charactersRes, arcsRes, eventsRes, gamblesRes, organizationsRes] = await Promise.all([
          api.getCharacters({ limit: 100 }),
          api.getArcs({ limit: 100 }),
          api.getEvents({ limit: 100 }),
          api.getGambles({ limit: 100 }),
          api.getOrganizations({ limit: 100 })
        ])
        
        const loadedEntities = {
          characters: charactersRes.data || [],
          arcs: arcsRes.data || [],
          events: eventsRes.data || [],
          gambles: gamblesRes.data || [],
          organizations: organizationsRes.data || []
        }
        
        setEntities(loadedEntities)
        
        // Initialize selected entities from URL parameters
        const newSelectedEntities: {
          characters: any[]
          arcs: any[]
          events: any[]
          gambles: any[]
          organizations: any[]
        } = {
          characters: [],
          arcs: [],
          events: [],
          gambles: [],
          organizations: []
        }
        
        if (filterValues?.characterIds) {
          const characterIds = filterValues.characterIds.split(',').map((id: string) => parseInt(id.trim()))
          newSelectedEntities.characters = loadedEntities.characters.filter(c => characterIds.includes(c.id))
        }
        
        if (filterValues?.arcIds) {
          const arcIds = filterValues.arcIds.split(',').map((id: string) => parseInt(id.trim()))
          newSelectedEntities.arcs = loadedEntities.arcs.filter(a => arcIds.includes(a.id))
        }
        
        if (filterValues?.eventIds) {
          const eventIds = filterValues.eventIds.split(',').map((id: string) => parseInt(id.trim()))
          newSelectedEntities.events = loadedEntities.events.filter(e => eventIds.includes(e.id))
        }
        
        if (filterValues?.gambleIds) {
          const gambleIds = filterValues.gambleIds.split(',').map((id: string) => parseInt(id.trim()))
          newSelectedEntities.gambles = loadedEntities.gambles.filter(g => gambleIds.includes(g.id))
        }
        
        if (filterValues?.organizationIds) {
          const organizationIds = filterValues.organizationIds.split(',').map((id: string) => parseInt(id.trim()))
          newSelectedEntities.organizations = loadedEntities.organizations.filter(f => organizationIds.includes(f.id))
        }
        
        setSelectedEntities(newSelectedEntities)
      } catch (error) {
        console.error('Error loading entities:', error)
      }
    }
    
    loadEntities()
  }, [filterValues?.characterIds, filterValues?.arcIds, filterValues?.eventIds, filterValues?.gambleIds, filterValues?.organizationIds])

  const statusFilters = [
    { id: 'all', name: 'All', color: '#666', icon: '🗂️' },
    { id: 'pending', name: 'Pending Review', color: '#f57c00', icon: '⏳' },
    { id: 'approved', name: 'Approved', color: '#4caf50', icon: '✅' },
    { id: 'rejected', name: 'Rejected', color: '#f44336', icon: '❌' }
  ]

  const handleStatusFilter = (status: string) => {
    const newFilters = status === 'all' 
      ? { ...filterValues }
      : { ...filterValues, status }
    
    if (status === 'all') {
      delete newFilters.status
    }
    
    setFilters(newFilters, filterValues)
  }

  const handleEntityFilter = () => {
    const newFilters = { ...filterValues }
    
    // Remove existing entity filters
    delete newFilters.characterIds
    delete newFilters.arcIds
    delete newFilters.eventIds
    delete newFilters.gambleIds
    delete newFilters.organizationIds
    
    // Add selected entity filters
    if (selectedEntities.characters.length > 0) {
      newFilters.characterIds = selectedEntities.characters.map(c => c.id).join(',')
    }
    if (selectedEntities.arcs.length > 0) {
      newFilters.arcIds = selectedEntities.arcs.map(a => a.id).join(',')
    }
    if (selectedEntities.events.length > 0) {
      newFilters.eventIds = selectedEntities.events.map(e => e.id).join(',')
    }
    if (selectedEntities.gambles.length > 0) {
      newFilters.gambleIds = selectedEntities.gambles.map(g => g.id).join(',')
    }
    if (selectedEntities.organizations.length > 0) {
      newFilters.organizationIds = selectedEntities.organizations.map(f => f.id).join(',')
    }
    
    setFilters(newFilters, filterValues)
  }

  const clearEntityFilters = () => {
    setSelectedEntities({ characters: [], arcs: [], events: [], gambles: [], organizations: [] })
    const newFilters = { ...filterValues }
    delete newFilters.characterIds
    delete newFilters.arcIds
    delete newFilters.eventIds
    delete newFilters.gambleIds
    delete newFilters.organizationIds
    setFilters(newFilters, filterValues)
  }

  const filteredEntities = {
    characters: entities.characters.filter(c => 
      c.name.toLowerCase().includes(entitySearch.toLowerCase())
    ),
    arcs: entities.arcs.filter(a => 
      a.name.toLowerCase().includes(entitySearch.toLowerCase())
    ),
    events: entities.events.filter(e => 
      e.title.toLowerCase().includes(entitySearch.toLowerCase())
    ),
    gambles: entities.gambles.filter(g => 
      g.name.toLowerCase().includes(entitySearch.toLowerCase())
    ),
    organizations: entities.organizations.filter(f => 
      f.name.toLowerCase().includes(entitySearch.toLowerCase())
    )
  }

  const currentStatus = filterValues?.status || 'all'
  const hasEntityFilters = selectedEntities.characters.length > 0 || 
                          selectedEntities.arcs.length > 0 || 
                          selectedEntities.events.length > 0 ||
                          selectedEntities.gambles.length > 0 ||
                          selectedEntities.organizations.length > 0

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFilters = { ...filterValues, search: e.target.value || undefined }
    setFilters(newFilters, filterValues)
  }

  return (
    <Box sx={{
      backgroundColor: 'rgba(10, 10, 10, 0.95)',
      borderRadius: '8px 8px 0 0', // Only round top corners
      border: '1px solid rgba(225, 29, 72, 0.2)',
      borderBottom: 'none', // Remove bottom border to connect with table
      mb: 0,
      p: 2,
      backdropFilter: 'blur(8px)'
    }}>
      {/* Search Bar */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" sx={{
          color: '#e11d48',
          fontWeight: 'bold',
          mb: 1,
          fontSize: '0.9rem'
        }}>
          🔍 Search Media
        </Typography>
        <MuiTextField
          label="Search by description or author..."
          value={filterValues?.search || ''}
          onChange={handleSearch}
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
          🎯 Filter by Status
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
                minWidth: '80px',
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

        {/* Active Entity Filters Display */}
        {(selectedEntities.characters.length > 0 || 
          selectedEntities.arcs.length > 0 || 
          selectedEntities.events.length > 0 || 
          selectedEntities.gambles.length > 0 || 
          selectedEntities.organizations.length > 0) && (
          <Box sx={{ mb: 2, p: 2, backgroundColor: 'rgba(124, 58, 237, 0.05)', borderRadius: 1, border: '1px solid rgba(124, 58, 237, 0.2)' }}>
            <Typography variant="body2" sx={{ color: '#7c3aed', fontWeight: 'bold', mb: 1 }}>
              🎯 Active Filters:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {selectedEntities.characters.map((character) => (
                <Chip
                  key={`char-${character.id}`}
                  label={`👤 ${character.name}`}
                  size="small"
                  onDelete={() => {
                    setSelectedEntities(prev => ({
                      ...prev,
                      characters: prev.characters.filter(c => c.id !== character.id)
                    }))
                  }}
                  sx={{ 
                    backgroundColor: 'rgba(124, 58, 237, 0.1)',
                    color: '#7c3aed',
                    fontSize: '0.7rem'
                  }}
                />
              ))}
              {selectedEntities.arcs.map((arc) => (
                <Chip
                  key={`arc-${arc.id}`}
                  label={`📖 ${arc.name}`}
                  size="small"
                  onDelete={() => {
                    setSelectedEntities(prev => ({
                      ...prev,
                      arcs: prev.arcs.filter(a => a.id !== arc.id)
                    }))
                  }}
                  sx={{ 
                    backgroundColor: 'rgba(124, 58, 237, 0.1)',
                    color: '#7c3aed',
                    fontSize: '0.7rem'
                  }}
                />
              ))}
              {selectedEntities.events.map((event) => (
                <Chip
                  key={`event-${event.id}`}
                  label={`⚡ ${event.name}`}
                  size="small"
                  onDelete={() => {
                    setSelectedEntities(prev => ({
                      ...prev,
                      events: prev.events.filter(e => e.id !== event.id)
                    }))
                  }}
                  sx={{ 
                    backgroundColor: 'rgba(124, 58, 237, 0.1)',
                    color: '#7c3aed',
                    fontSize: '0.7rem'
                  }}
                />
              ))}
              {selectedEntities.gambles.map((gamble) => (
                <Chip
                  key={`gamble-${gamble.id}`}
                  label={`🎲 ${gamble.name}`}
                  size="small"
                  onDelete={() => {
                    setSelectedEntities(prev => ({
                      ...prev,
                      gambles: prev.gambles.filter(g => g.id !== gamble.id)
                    }))
                  }}
                  sx={{ 
                    backgroundColor: 'rgba(124, 58, 237, 0.1)',
                    color: '#7c3aed',
                    fontSize: '0.7rem'
                  }}
                />
              ))}
              {selectedEntities.organizations.map((organization) => (
                <Chip
                  key={`organization-${organization.id}`}
                  label={`⚔️ ${organization.name}`}
                  size="small"
                  onDelete={() => {
                    setSelectedEntities(prev => ({
                      ...prev,
                      organizations: prev.organizations.filter(f => f.id !== organization.id)
                    }))
                  }}
                  sx={{ 
                    backgroundColor: 'rgba(124, 58, 237, 0.1)',
                    color: '#7c3aed',
                    fontSize: '0.7rem'
                  }}
                />
              ))}
            </Box>
          </Box>
        )}

        {/* Entity Selection Lists */}
        <Grid container spacing={2}>
          {/* Characters */}
          <Grid item xs={12} md={2.4}>
            <Typography variant="body2" sx={{ color: '#7c3aed', fontWeight: 'bold', mb: 1 }}>
              👤 Characters ({selectedEntities.characters.length})
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
          <Grid item xs={12} md={2.4}>
            <Typography variant="body2" sx={{ color: '#7c3aed', fontWeight: 'bold', mb: 1 }}>
              📖 Arcs ({selectedEntities.arcs.length})
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

          {/* Events */}
          <Grid item xs={12} md={2.4}>
            <Typography variant="body2" sx={{ color: '#7c3aed', fontWeight: 'bold', mb: 1 }}>
              ⚡ Events ({selectedEntities.events.length})
            </Typography>
            <Box sx={{ 
              maxHeight: 150, 
              overflowY: 'auto', 
              border: '1px solid rgba(124, 58, 237, 0.2)',
              borderRadius: 1,
              p: 1,
              backgroundColor: 'rgba(124, 58, 237, 0.02)'
            }}>
              {filteredEntities.events.slice(0, 10).map((event) => (
                <Box key={event.id} sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  mb: 0.5,
                  cursor: 'pointer',
                  p: 0.5,
                  borderRadius: 0.5,
                  backgroundColor: selectedEntities.events.find(e => e.id === event.id) 
                    ? 'rgba(124, 58, 237, 0.1)' 
                    : 'transparent',
                  '&:hover': { backgroundColor: 'rgba(124, 58, 237, 0.05)' }
                }}
                onClick={() => {
                  const isSelected = selectedEntities.events.find(e => e.id === event.id)
                  if (isSelected) {
                    setSelectedEntities(prev => ({
                      ...prev,
                      events: prev.events.filter(e => e.id !== event.id)
                    }))
                  } else {
                    setSelectedEntities(prev => ({
                      ...prev,
                      events: [...prev.events, event]
                    }))
                  }
                }}>
                  <Chip
                    size="small"
                    label={event.title}
                    variant={selectedEntities.events.find(e => e.id === event.id) ? 'filled' : 'outlined'}
                    sx={{ fontSize: '0.7rem' }}
                  />
                </Box>
              ))}
            </Box>
          </Grid>

          {/* Gambles */}
          <Grid item xs={12} md={2.4}>
            <Typography variant="body2" sx={{ color: '#7c3aed', fontWeight: 'bold', mb: 1 }}>
              🎲 Gambles ({selectedEntities.gambles.length})
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

          {/* Organizations */}
          <Grid item xs={12} md={2.4}>
            <Typography variant="body2" sx={{ color: '#7c3aed', fontWeight: 'bold', mb: 1 }}>
              🏛️ Organizations ({selectedEntities.organizations.length})
            </Typography>
            <Box sx={{ 
              maxHeight: 150, 
              overflowY: 'auto', 
              border: '1px solid rgba(124, 58, 237, 0.2)',
              borderRadius: 1,
              p: 1,
              backgroundColor: 'rgba(124, 58, 237, 0.02)'
            }}>
              {filteredEntities.organizations.slice(0, 10).map((organization) => (
                <Box key={organization.id} sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  mb: 0.5,
                  cursor: 'pointer',
                  p: 0.5,
                  borderRadius: 0.5,
                  backgroundColor: selectedEntities.organizations.find(f => f.id === organization.id) 
                    ? 'rgba(124, 58, 237, 0.1)' 
                    : 'transparent',
                  '&:hover': { backgroundColor: 'rgba(124, 58, 237, 0.05)' }
                }}
                onClick={() => {
                  const isSelected = selectedEntities.organizations.find(f => f.id === organization.id)
                  if (isSelected) {
                    setSelectedEntities(prev => ({
                      ...prev,
                      organizations: prev.organizations.filter(f => f.id !== organization.id)
                    }))
                  } else {
                    setSelectedEntities(prev => ({
                      ...prev,
                      organizations: [...prev.organizations, organization]
                    }))
                  }
                }}>
                  <Chip
                    size="small"
                    label={organization.name}
                    variant={selectedEntities.organizations.find(f => f.id === organization.id) ? 'filled' : 'outlined'}
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

const ApproveButton = () => {
  const record = useRecordContext()
  const notify = useNotify()
  const refresh = useRefresh()
  
  const handleApprove = async () => {
    if (!record) return
    
    try {
      await api.put(`/media/${record.id}/approve`, {})
      notify('Media approved successfully')
      refresh()
    } catch (error: any) {
      console.error('Error approving media:', error)
      const errorMessage = error?.details?.message || error?.message || 'Error approving media'
      notify(errorMessage, { type: 'error' })
    }
  }
  
  if (record?.status === 'approved') return null
  
  return (
    <Button 
      label="Approve" 
      onClick={handleApprove}
      color="primary"
      startIcon={<Check size={20} />}
    />
  )
}

const RejectButton = () => {
  const record = useRecordContext()
  const notify = useNotify()
  const refresh = useRefresh()
  
  const handleReject = async () => {
    if (!record) return
    
    const reason = prompt('Enter rejection reason:')
    if (!reason) return
    
    try {
      await api.put(`/media/${record.id}/reject`, { reason })
      notify('Media rejected successfully')
      refresh()
    } catch (error: any) {
      console.error('Error rejecting media:', error)
      const errorMessage = error?.details?.message || error?.message || 'Error rejecting media'
      notify(errorMessage, { type: 'error' })
    }
  }
  
  if (record?.status === 'rejected') return null
  
  return (
    <Button 
      label="Reject" 
      onClick={handleReject}
      color="secondary"
      startIcon={<X size={20} />}
    />
  )
}


const PolymorphicInfoChip = ({ source }: { source: string }) => {
  const record = useRecordContext()
  if (!record) return null
  
  if (record.ownerType && record.ownerId) {
    return (
      <Chip 
        label={`${record.ownerType}:${record.ownerId}${record.chapterNumber ? ` (Ch.${record.chapterNumber})` : ''}`}
        color="success" 
        size="small" 
        sx={{
          fontWeight: 'bold',
          fontSize: '0.7rem',
          height: '24px',
          backgroundColor: 'rgba(76, 175, 80, 0.2)',
          color: '#4caf50'
        }}
      />
    )
  }
  
  
  return (
    <Chip 
      label="No relationship"
      color="default" 
      size="small" 
      sx={{
        fontWeight: 'bold',
        fontSize: '0.7rem',
        height: '24px',
        backgroundColor: 'rgba(158, 158, 158, 0.2)',
        color: '#9e9e9e'
      }}
    />
  )
}

const EntityNameDisplay = () => {
  const record = useRecordContext()
  const [entityName, setEntityName] = useState<string>('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchEntityName = async () => {
      if (!record?.ownerType || !record?.ownerId) {
        setEntityName('')
        return
      }

      setLoading(true)
      try {
        let response
        switch (record.ownerType) {
          case 'character':
            response = await api.getCharacters({ limit: 100 })
            break
          case 'arc':
            response = await api.getArcs({ limit: 100 })
            break
          case 'event':
            response = await api.getEvents({ limit: 100 })
            break
          case 'gamble':
            response = await api.getGambles({ limit: 100 })
            break
          case 'organization':
            response = await api.getOrganizations({ limit: 100 })
            break
          case 'user':
            response = await api.getPublicUsers({ limit: 100 })
            break
          default:
            setEntityName(`Unknown entity type: ${record.ownerType}`)
            return
        }

        const entities = response.data || []
        const entity = entities.find((e: any) => e.id === record.ownerId)
        
        if (entity) {
          const name = entity.name || entity.title || entity.username || `${record.ownerType} ${entity.id}`
          setEntityName(name)
        } else {
          setEntityName(`${record.ownerType} #${record.ownerId} (not found)`)
        }
      } catch (error) {
        console.error('Failed to fetch entity name:', error)
        setEntityName(`${record.ownerType} #${record.ownerId} (error loading)`)
      } finally {
        setLoading(false)
      }
    }

    fetchEntityName()
  }, [record?.ownerType, record?.ownerId])

  if (loading) {
    return (
      <Typography sx={{ 
        fontWeight: 'bold', 
        fontSize: '1rem',
        color: '#dc004e',
        opacity: 0.7
      }}>
        Loading...
      </Typography>
    )
  }

  return (
    <Typography sx={{ 
      fontWeight: 'bold', 
      fontSize: '1rem',
      color: '#dc004e'
    }}>
      {entityName || `${record?.ownerType} #${record?.ownerId}`}
    </Typography>
  )
}

export const MediaList = () => (
  <List 
    perPage={25}
    sx={{
      '& .RaList-content': {
        '& > *:not(:last-child)': {
          marginBottom: 0 // Remove spacing between filter toolbar and table
        }
      }
    }}
  >
    <MediaFilterToolbar />
    <Datagrid 
      rowClick="show"
      sx={{
        marginTop: 0,
        borderRadius: '0 0 8px 8px', // Only round bottom corners to connect with toolbar
        border: '1px solid rgba(225, 29, 72, 0.2)',
        borderTop: 'none', // Remove top border to connect with toolbar
        overflow: 'hidden',
        '& .RaDatagrid-table': {
          borderRadius: 0, // Remove any internal border radius
        },
        '& .RaDatagrid-headerCell': {
          fontWeight: 'bold',
          fontSize: '0.9rem',
          backgroundColor: 'rgba(10, 10, 10, 0.95)',
          color: '#ffffff',
          borderBottom: '2px solid #e11d48',
          borderTop: 'none' // Remove top border from header
        },
        '& .RaDatagrid-rowCell': {
          padding: '14px 10px',
          backgroundColor: 'rgba(10, 10, 10, 0.8)',
          color: '#ffffff',
          borderBottom: '1px solid rgba(225, 29, 72, 0.2)'
        },
        // Group rows by entity type with alternating backgrounds
        '& .RaDatagrid-tbody tr:nth-of-type(even)': {
          backgroundColor: 'rgba(225, 29, 72, 0.05)'
        },
        '& .RaDatagrid-tbody tr:hover': {
          backgroundColor: 'rgba(225, 29, 72, 0.15) !important'
        }
      }}
    >
      <TextField source="id" sortable sx={{ width: '50px', fontSize: '0.85rem' }} />
      
      {/* Entity Information - Priority Section */}
      <EntityInfoField />
      
      {/* Media Preview */}
      <MediaPreviewField source="url" />
      
      {/* Media Details - Truncated URL */}
      <TruncatedUrlField />

      {/* Type & Purpose Combined */}
      <MediaTypeField />

      {/* Status - Prominent Display */}
      <Box sx={{ width: '100px', display: 'flex', justifyContent: 'center' }}>
        <MediaStatusField source="status" />
      </Box>
      
      <TextField 
        source="description" 
        sortable
        sx={{ 
          maxWidth: '200px',
          '& span': {
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            fontSize: '0.8rem',
            color: 'text.secondary',
            lineHeight: 1.2
          }
        }} 
      />

      {/* Submission Details - User & Date */}
      <FunctionField
        label="Submitted By"
        sortBy="user"
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
              {record?.submittedBy?.username || 'Unknown'}
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

      {/* Chapter Info (if applicable) */}
      <ChapterInfoField />
      
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
        <ApproveButton />
        <RejectButton />
      </Box>
    </Datagrid>
  </List>
)

export const MediaApprovalQueue = () => (
  <List filter={{ status: 'pending' }} title="Media Approval Queue">
    <Datagrid
      rowClick="show"
      sx={{
        '& .RaDatagrid-headerCell': {
          fontWeight: 'bold',
          fontSize: '0.9rem',
          backgroundColor: 'rgba(10, 10, 10, 0.95)',
          color: '#ffffff',
          borderBottom: '2px solid #f57c00'
        },
        '& .RaDatagrid-rowCell': {
          padding: '12px 8px',
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
      <Box sx={{ width: '120px', display: 'flex', justifyContent: 'center' }}>
        <Chip
          label="AWAITING REVIEW"
          color="warning"
          size="small"
          sx={{
            fontWeight: 'bold',
            fontSize: '0.65rem',
            backgroundColor: '#fff3e0',
            color: '#f57c00'
          }}
        />
      </Box>

      {/* Entity Information - Condensed */}
      <EntityInfoField />

      {/* Media Preview */}
      <MediaPreviewField source="url" />

      {/* Media Details - Truncated URL */}
      <TruncatedUrlField />

      {/* Type & Purpose Combined */}
      <MediaTypeField />

      <TextField
        source="description"
        sortable
        sx={{
          maxWidth: '180px',
          '& span': {
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            fontSize: '0.8rem',
            color: 'text.secondary',
            lineHeight: 1.2
          }
        }}
      />

      {/* Submission Details - User & Date */}
      <FunctionField
        label="Submitted By"
        sortBy="user"
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
              {record?.submittedBy?.username || 'Unknown'}
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

      {/* Priority Actions */}
      <Box
        sx={{
          display: 'flex',
          gap: 1,
          minWidth: '160px',
          justifyContent: 'center',
          '& .MuiButton-root': {
            minWidth: '65px',
            padding: '8px 14px',
            fontSize: '0.75rem',
            fontWeight: 'bold',
            textTransform: 'uppercase'
          }
        }}
      >
        <ApproveButton />
        <RejectButton />
      </Box>
    </Datagrid>
  </List>
)

export const MediaDraftManager = () => (
  <List
    filter={{ status: 'pending' }}
    title="Draft Media Submissions"
    perPage={50}
  >
    <Datagrid
      rowClick="edit"
      sx={{
        '& .RaDatagrid-headerCell': {
          fontWeight: 'bold',
          fontSize: '0.9rem',
          backgroundColor: 'rgba(10, 10, 10, 0.95)',
          color: '#ffffff',
          borderBottom: '2px solid #2196f3'
        },
        '& .RaDatagrid-rowCell': {
          padding: '10px 8px',
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
          label="DRAFT"
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

      {/* Entity Information - Compact for drafts */}
      <EntityInfoField />

      {/* Media Preview */}
      <MediaPreviewField source="url" />

      {/* Media Details - Truncated URL for drafts */}
      <TruncatedUrlField />

      {/* Type & Purpose */}
      <MediaTypeField />

      <TextField
        source="description"
        sortable
        sx={{
          maxWidth: '200px',
          '& span': {
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            fontSize: '0.8rem',
            color: 'text.secondary',
            lineHeight: 1.3,
            fontStyle: 'italic'
          }
        }}
      />

      {/* Author & Last Modified - Sortable by User */}
      <FunctionField
        label="Author"
        sortBy="user"
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
              {record?.submittedBy?.username || 'Unknown'}
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

      {/* Edit Actions */}
      <Box
        sx={{
          display: 'flex',
          gap: 1,
          minWidth: '120px',
          justifyContent: 'center',
          '& .MuiButton-root': {
            minWidth: '60px',
            padding: '6px 12px',
            fontSize: '0.7rem',
            fontWeight: 'bold',
            textTransform: 'uppercase'
          }
        }}
      >
        <Button
          label="Edit"
          onClick={() => {/* Navigate to edit */}}
          color="primary"
          startIcon={<LinkIcon size={16} />}
        />
        <Button
          label="Submit"
          onClick={() => {/* Submit for review */}}
          color="secondary"
          startIcon={<Check size={16} />}
        />
      </Box>
    </Datagrid>
  </List>
)

export const MediaShow = () => {
  const record = useRecordContext()
  
  const renderMediaContent = () => {
    if (!record?.url) return null
    
    switch (record.type) {
      case 'image':
        return (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center',
            p: 3,
            backgroundColor: '#0f0f0f',
            borderRadius: 2,
            border: '2px dashed rgba(225, 29, 72, 0.3)'
          }}>
            <Image
              src={record.url}
              alt={record.description || 'Media content'}
              width={800}
              height={600}
              style={{
                maxWidth: '100%',
                height: 'auto',
                borderRadius: '8px',
                boxShadow: '0 8px 32px rgba(225, 29, 72, 0.3)',
                border: '1px solid rgba(225, 29, 72, 0.2)'
              }}
              sizes="(max-width: 768px) 100vw, 800px"
            />
          </Box>
        )
      case 'video':
        return (
          <Box sx={{ 
            p: 2,
            backgroundColor: '#0f0f0f',
            borderRadius: 2,
            border: '2px solid rgba(225, 29, 72, 0.3)'
          }}>
            <video 
              controls 
              style={{ 
                width: '100%', 
                height: 'auto',
                borderRadius: '8px',
                border: '1px solid rgba(225, 29, 72, 0.2)'
              }}
              src={record.url}
            >
              Your browser does not support the video tag.
            </video>
          </Box>
        )
      case 'audio':
        return (
          <Box sx={{ 
            p: 3,
            backgroundColor: '#0f0f0f',
            borderRadius: 2,
            border: '2px solid rgba(225, 29, 72, 0.3)',
            textAlign: 'center'
          }}>
            <Box sx={{ mb: 2 }}>
              <Volume2 size={48} color="#e11d48" />
            </Box>
            <audio controls style={{ 
              width: '100%', 
              maxWidth: '400px',
              filter: 'sepia(1) saturate(2) hue-rotate(320deg)'
            }}>
              <source src={record.url} />
              Your browser does not support the audio element.
            </audio>
          </Box>
        )
      default:
        return (
          <Box sx={{ 
            p: 3,
            backgroundColor: '#0f0f0f',
            borderRadius: 2,
            border: '2px solid rgba(225, 29, 72, 0.3)',
            textAlign: 'center'
          }}>
            <ExternalLink size={48} color="#e11d48" style={{ marginBottom: 16 }} />
            <Typography variant="h6" gutterBottom sx={{ color: '#ffffff' }}>
              External Link
            </Typography>
            <MuiButton
              href={record.url} 
              target="_blank" 
              rel="noopener noreferrer"
              variant="contained"
              startIcon={<ExternalLink size={20} />}
              sx={{
                backgroundColor: '#e11d48',
                '&:hover': {
                  backgroundColor: '#be185d'
                }
              }}
            >
              View Media Content
            </MuiButton>
          </Box>
        )
    }
  }

  return (
    <Show>
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
                <ImageIcon size={32} color="white" />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h4" sx={{ 
                  fontWeight: 'bold', 
                  color: 'white', 
                  mb: 1,
                  textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                }}>
                  Media Submission #{record?.id}
                </Typography>
                <Typography variant="body1" sx={{ 
                  color: 'rgba(255,255,255,0.9)', 
                  fontSize: '1.1rem',
                  opacity: 0.95,
                  mb: 1
                }}>
                  {record?.description || 'No description provided'}
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Chip 
                    label={record?.type || 'Unknown'}
                    size="small"
                    sx={{ 
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      color: 'white',
                      fontWeight: 'bold',
                      textTransform: 'capitalize',
                      border: '1px solid rgba(255,255,255,0.3)'
                    }}
                  />
                </Box>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <MediaStatusField source="status" />
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
              <ApproveButton />
              <RejectButton />
            </Box>
          </Box>
        </Card>

        <Grid container spacing={3}>
          {/* Main Content - Media Preview */}
          <Grid item xs={12} md={8}>
            <Card elevation={0} sx={{ 
              mb: 3,
              backgroundColor: '#0a0a0a',
              border: '1px solid rgba(225, 29, 72, 0.3)'
            }}>
              <Box sx={{
                background: 'linear-gradient(135deg, #7b1fa2 0%, #6a1b9a 100%)',
                color: 'white',
                p: 2
              }}>
                <Typography variant="h5" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 2 }}>
                  <ImageIcon size={24} />
                  Media Content
                </Typography>
              </Box>
              <CardContent sx={{ p: 4 }}>
                {renderMediaContent()}
                
                {/* URL Display */}
                <Box sx={{ mt: 3, p: 2, backgroundColor: '#0f0f0f', borderRadius: 2, border: '1px solid rgba(225, 29, 72, 0.2)' }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Source URL
                  </Typography>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1,
                    p: 2,
                    backgroundColor: '#000000',
                    borderRadius: 1,
                    border: '1px solid rgba(225, 29, 72, 0.3)',
                    '& a': { 
                      fontFamily: 'monospace',
                      fontSize: '0.9rem',
                      wordBreak: 'break-all',
                      color: '#e11d48',
                      textDecoration: 'none',
                      '&:hover': {
                        color: '#f43f5e',
                        textDecoration: 'underline'
                      }
                    }
                  }}>
                    <LinkIcon size={16} color="#e11d48" />
                    <UrlField source="url" />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Sidebar with Details */}
          <Grid item xs={12} md={4}>
            {/* Associations */}
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
                  <BookOpen size={20} />
                  Associated Content
                </Typography>
              </Box>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Owner Type
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ 
                      bgcolor: '#1976d2', 
                      width: 36, 
                      height: 36,
                      border: '2px solid rgba(25, 118, 210, 0.5)'
                    }}>
                      <User size={20} />
                    </Avatar>
                    <TextField 
                      source="ownerType" 
                      sx={{ 
                        '& span': { 
                          fontWeight: 'bold', 
                          fontSize: '1rem',
                          color: '#1976d2',
                          textTransform: 'capitalize'
                        }
                      }}
                    />
                  </Box>
                </Box>
                
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Entity Name
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ 
                      bgcolor: '#dc004e', 
                      width: 36, 
                      height: 36,
                      border: '2px solid rgba(220, 0, 78, 0.5)'
                    }}>
                      <BookOpen size={20} />
                    </Avatar>
                    <EntityNameDisplay />
                  </Box>
                </Box>
                
                {record?.chapterNumber && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Chapter Number
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ 
                        bgcolor: '#f57c00', 
                        width: 36, 
                        height: 36,
                        border: '2px solid rgba(245, 124, 0, 0.5)'
                      }}>
                        <BookOpen size={20} />
                      </Avatar>
                      <TextField 
                        source="chapterNumber" 
                        sx={{ 
                          '& span': { 
                            fontWeight: 'bold', 
                            fontSize: '1rem',
                            color: '#f57c00'
                          }
                        }}
                      />
                    </Box>
                  </Box>
                )}
                

                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Purpose
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ 
                      bgcolor: record?.purpose === 'entity_display' ? '#9c27b0' : '#4caf50', 
                      width: 36, 
                      height: 36,
                      border: `2px solid rgba(${record?.purpose === 'entity_display' ? '156, 39, 176' : '76, 175, 80'}, 0.5)`
                    }}>
                      <ImageIcon size={20} />
                    </Avatar>
                    <MediaPurposeField source="purpose" />
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* Submission Details */}
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
                  Submission Info
                </Typography>
              </Box>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Submitted By
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ 
                      bgcolor: '#e11d48', 
                      width: 36, 
                      height: 36,
                      border: '2px solid rgba(225, 29, 72, 0.5)'
                    }}>
                      <User size={20} />
                    </Avatar>
                    <TextField 
                      source="submittedBy.username" 
                      sx={{ 
                        '& span': { 
                          fontWeight: 'bold', 
                          fontSize: '1rem',
                          color: '#e11d48'
                        }
                      }}
                    />
                  </Box>
                </Box>
                
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Submission Date
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
    </Show>
  )
}

const EntitySelector = ({ entities, loadingEntities, loadEntities, getEntityChoices, getCurrentEntityKey, record }: any) => {
  const ownerType = useWatch({ name: 'ownerType' })
  
  // Load entities when ownerType changes
  useEffect(() => {
    if (ownerType) {
      const entityKey = ownerType === 'user' ? 'users' : ownerType + 's'
      loadEntities(entityKey)
    }
  }, [ownerType, loadEntities])

  const currentOwnerType = ownerType || record?.ownerType
  
  return (
    <Grid container spacing={3}>
      <Grid item xs={12} sm={6}>
        <SelectInput 
          source="ownerType" 
          label="Entity Type"
          choices={[
            { id: 'character', name: 'Character' },
            { id: 'arc', name: 'Arc' },
            { id: 'event', name: 'Event' },
            { id: 'gamble', name: 'Gamble' },
            { id: 'organization', name: 'Organization' },
            { id: 'user', name: 'User' },
          ]}
          fullWidth
          sx={{
            '& .MuiSelect-select': {
              backgroundColor: '#0f0f0f'
            }
          }}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <SelectInput 
          source="ownerId" 
          label="Select Entity"
          choices={getEntityChoices(currentOwnerType)}
          disabled={!currentOwnerType || loadingEntities[getCurrentEntityKey(currentOwnerType)]}
          fullWidth
          sx={{
            '& .MuiSelect-select': {
              backgroundColor: '#0f0f0f'
            }
          }}
          helperText={
            loadingEntities[getCurrentEntityKey(currentOwnerType)] 
              ? `Loading ${currentOwnerType}s...` 
              : currentOwnerType
                ? `Select a ${currentOwnerType} from the list` 
                : 'First select an entity type'
          }
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextInput 
          source="chapterNumber" 
          label="Chapter Number"
          type="number"
          fullWidth
          helperText="For chapter-based progression (optional)"
        />
      </Grid>
    </Grid>
  )
}



const DynamicEntitySelector = () => {
  const record = useRecordContext()
  const ownerType = useWatch({ name: 'ownerType', defaultValue: record?.ownerType })

  if (ownerType === 'character') {
    return (
      <ReferenceInput source="ownerId" reference="characters" label="Character">
        <AutocompleteInput 
          optionText="name"
          fullWidth
          sx={{ 
            '& .MuiInputBase-root': {
              backgroundColor: 'rgba(10, 10, 10, 0.8)',
              color: '#ffffff',
            }
          }}
        />
      </ReferenceInput>
    )
  }

  if (ownerType === 'arc') {
    return (
      <ReferenceInput source="ownerId" reference="arcs" label="Arc">
        <AutocompleteInput 
          optionText="name"
          fullWidth
          sx={{ 
            '& .MuiInputBase-root': {
              backgroundColor: 'rgba(10, 10, 10, 0.8)',
              color: '#ffffff',
            }
          }}
        />
      </ReferenceInput>
    )
  }

  if (ownerType === 'event') {
    return (
      <ReferenceInput source="ownerId" reference="events" label="Event">
        <AutocompleteInput 
          optionText="title"
          fullWidth
          sx={{ 
            '& .MuiInputBase-root': {
              backgroundColor: 'rgba(10, 10, 10, 0.8)',
              color: '#ffffff',
            }
          }}
        />
      </ReferenceInput>
    )
  }

  if (ownerType === 'gamble') {
    return (
      <ReferenceInput source="ownerId" reference="gambles" label="Gamble">
        <AutocompleteInput 
          optionText="name"
          fullWidth
          sx={{ 
            '& .MuiInputBase-root': {
              backgroundColor: 'rgba(10, 10, 10, 0.8)',
              color: '#ffffff',
            }
          }}
        />
      </ReferenceInput>
    )
  }

  if (ownerType === 'organization') {
    return (
      <ReferenceInput source="ownerId" reference="organizations" label="Organization">
        <AutocompleteInput 
          optionText="name"
          fullWidth
          sx={{ 
            '& .MuiInputBase-root': {
              backgroundColor: 'rgba(10, 10, 10, 0.8)',
              color: '#ffffff',
            }
          }}
        />
      </ReferenceInput>
    )
  }

  if (ownerType === 'user') {
    return (
      <ReferenceInput source="ownerId" reference="users" label="User">
        <AutocompleteInput 
          optionText="username"
          fullWidth
          sx={{ 
            '& .MuiInputBase-root': {
              backgroundColor: 'rgba(10, 10, 10, 0.8)',
              color: '#ffffff',
            }
          }}
        />
      </ReferenceInput>
    )
  }

  return (
    <Box sx={{ 
      p: 2, 
      textAlign: 'center', 
      color: '#ffffff',
      backgroundColor: 'rgba(124, 58, 237, 0.1)',
      borderRadius: '4px',
      border: '1px dashed #7c3aed'
    }}>
      <Typography variant="body2">
        Select an Entity Type first to choose the specific entity
      </Typography>
    </Box>
  )
}

export const MediaEdit = () => {
  return (
    <Edit>
      <SimpleForm sx={{ 
        '& .MuiCardContent-root': {
          padding: '24px',
          backgroundColor: '#0a0a0a',
        },
        '& .MuiFormControl-root': {
          marginBottom: '16px',
        }
      }}>
        {/* Media Information Section */}
        <Box sx={{ 
          mb: 4, 
          p: 3, 
          border: '1px solid #e11d48', 
          borderRadius: '8px',
          backgroundColor: 'rgba(225, 29, 72, 0.05)',
          backdropFilter: 'blur(10px)',
        }}>
          <Typography variant="h6" sx={{ 
            mb: 2, 
            color: '#e11d48', 
            fontWeight: 600,
            fontFamily: '"OPTI Goudy Text", serif'
          }}>
            Media Information
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextInput 
                source="url" 
                required 
                fullWidth 
                label="Media URL"
                sx={{ 
                  '& .MuiInputBase-root': {
                    backgroundColor: 'rgba(10, 10, 10, 0.8)',
                    color: '#ffffff',
                  },
                  '& .MuiInputLabel-root': {
                    color: '#ffffff',
                  }
                }}
              />
            </Grid>
            <Grid item xs={6}>
              <SelectInput 
                source="type" 
                choices={[
                  { id: 'image', name: 'Image' },
                  { id: 'video', name: 'Video' },
                  { id: 'audio', name: 'Audio' },
                ]}
                required
                fullWidth
                label="Media Type"
                sx={{ 
                  '& .MuiInputBase-root': {
                    backgroundColor: 'rgba(10, 10, 10, 0.8)',
                    color: '#ffffff',
                  }
                }}
              />
            </Grid>
            <Grid item xs={6}>
              <SelectInput 
                source="purpose" 
                choices={[
                  { id: 'gallery', name: 'Gallery' },
                  { id: 'entity_display', name: 'Entity Display' },
                ]}
                required
                fullWidth
                label="Purpose"
                helperText="Gallery: User-submitted content | Entity Display: Official entity images"
                sx={{ 
                  '& .MuiInputBase-root': {
                    backgroundColor: 'rgba(10, 10, 10, 0.8)',
                    color: '#ffffff',
                  }
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextInput 
                source="description" 
                multiline 
                rows={4} 
                fullWidth
                label="Description"
                sx={{ 
                  '& .MuiInputBase-root': {
                    backgroundColor: 'rgba(10, 10, 10, 0.8)',
                    color: '#ffffff',
                  }
                }}
              />
            </Grid>
          </Grid>
        </Box>

        {/* Entity Association Section */}
        <Box sx={{ 
          mb: 4, 
          p: 3, 
          border: '1px solid #7c3aed', 
          borderRadius: '8px',
          backgroundColor: 'rgba(124, 58, 237, 0.05)',
          backdropFilter: 'blur(10px)',
        }}>
          <Typography variant="h6" sx={{ 
            mb: 2, 
            color: '#7c3aed', 
            fontWeight: 600,
            fontFamily: '"OPTI Goudy Text", serif'
          }}>
            Entity Association
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <SelectInput 
                source="ownerType" 
                label="Entity Type"
                choices={[
                  { id: 'character', name: 'Character' },
                  { id: 'arc', name: 'Arc' },
                  { id: 'event', name: 'Event' },
                  { id: 'gamble', name: 'Gamble' },
                  { id: 'organization', name: 'Organization' },
                  { id: 'user', name: 'User' },
                ]}
                fullWidth
                sx={{ 
                  '& .MuiInputBase-root': {
                    backgroundColor: 'rgba(10, 10, 10, 0.8)',
                    color: '#ffffff',
                  }
                }}
              />
            </Grid>
            <Grid item xs={6}>
              <DynamicEntitySelector />
            </Grid>
            <Grid item xs={6}>
              <TextInput 
                source="chapterNumber" 
                label="Chapter Number"
                type="number"
                fullWidth
                helperText="Optional: For progression-based content"
                sx={{ 
                  '& .MuiInputBase-root': {
                    backgroundColor: 'rgba(10, 10, 10, 0.8)',
                    color: '#ffffff',
                  }
                }}
              />
            </Grid>
          </Grid>
        </Box>

        {/* Moderation Section */}
        <Box sx={{ 
          mb: 2, 
          p: 3, 
          border: '1px solid #f57c00', 
          borderRadius: '8px',
          backgroundColor: 'rgba(245, 124, 0, 0.05)',
          backdropFilter: 'blur(10px)',
        }}>
          <Typography variant="h6" sx={{ 
            mb: 2, 
            color: '#f57c00', 
            fontWeight: 600,
            fontFamily: '"OPTI Goudy Text", serif'
          }}>
            Moderation
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <SelectInput 
                source="status" 
                choices={[
                  { id: 'pending', name: 'Pending Review' },
                  { id: 'approved', name: 'Approved' },
                  { id: 'rejected', name: 'Rejected' },
                ]}
                required
                fullWidth
                label="Status"
                sx={{ 
                  '& .MuiInputBase-root': {
                    backgroundColor: 'rgba(10, 10, 10, 0.8)',
                    color: '#ffffff',
                  }
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextInput 
                source="rejectionReason" 
                multiline 
                rows={3} 
                fullWidth
                label="Rejection Reason"
                helperText="Only required when status is 'Rejected'"
                sx={{ 
                  '& .MuiInputBase-root': {
                    backgroundColor: 'rgba(10, 10, 10, 0.8)',
                    color: '#ffffff',
                  }
                }}
              />
            </Grid>
          </Grid>
        </Box>
      </SimpleForm>
    </Edit>
  )
}

export const MediaCreate = () => (
  <Create>
    <SimpleForm>
      <TextInput source="url" required />
      <SelectInput 
        source="type" 
        choices={[
          { id: 'image', name: 'Image' },
          { id: 'video', name: 'Video' },
          { id: 'audio', name: 'Audio' },
        ]}
        required
      />
      <TextInput source="description" multiline rows={4} />
      
      {/* Polymorphic relationship fields */}
      <Typography variant="h6" sx={{ mt: 3, mb: 2, color: 'primary.main' }}>
        Entity Relationship
      </Typography>
      <SelectInput 
        source="ownerType" 
        label="Entity Type"
        choices={[
          { id: 'character', name: 'Character' },
          { id: 'arc', name: 'Arc' },
          { id: 'event', name: 'Event' },
          { id: 'gamble', name: 'Gamble' },
          { id: 'organization', name: 'Organization' },
          { id: 'user', name: 'User' },
        ]}
      />
      <TextInput 
        source="ownerId" 
        label="Entity ID"
        type="number"
        helperText="ID of the related entity"
      />
      <TextInput 
        source="chapterNumber" 
        label="Chapter Number"
        type="number"
        helperText="For chapter-based progression (optional)"
      />
      <SelectInput 
        source="purpose" 
        label="Purpose"
        choices={[
          { id: 'gallery', name: 'Gallery' },
          { id: 'entity_display', name: 'Entity Display' },
        ]}
        defaultValue="gallery"
        helperText="Purpose of the media - gallery for user uploads or entity display for official entity images"
      />
      
      <SelectInput 
        source="status" 
        choices={[
          { id: 'pending', name: 'Pending' },
          { id: 'approved', name: 'Approved' },
          { id: 'rejected', name: 'Rejected' },
        ]}
        defaultValue="pending"
        required
      />
    </SimpleForm>
  </Create>
)