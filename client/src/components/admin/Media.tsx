import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
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
  FunctionField,
  NumberField,
  useUnselectAll
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
  TextField as MuiTextField,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material'
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
import { GuideStatus } from '../../types'
import { ApproveRejectToolbar } from './EditToolbar'

const TruncatedUrlField = () => {
  const record = useRecordContext()
  if (!record?.url) return null

  // Function to truncate URL intelligently
  const truncateUrl = (url: string, maxLength: number = 30) => {
    if (url.length <= maxLength) return url

    try {
      // Try to parse as absolute URL first
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
    } catch {
      // If URL parsing fails (relative URLs, invalid URLs), just truncate from the end
      if (url.length > maxLength) {
        return url.substring(0, maxLength - 3) + '...'
      }
      return url
    }
  }

  const displayUrl = truncateUrl(record.url)

  return (
    <Tooltip
      title={record.url}
      placement="top"
      arrow
      enterDelay={300}
      leaveDelay={100}
      slotProps={{
        tooltip: {
          sx: {
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            color: 'white',
            fontSize: '0.7rem',
            maxWidth: '400px',
            wordBreak: 'break-all'
          }
        }
      }}
    >
      <Box sx={{
        maxWidth: '150px',
        overflow: 'hidden'
      }}>
        <a
          href={record.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontWeight: 'bold',
            color: '#1976d2',
            textDecoration: 'none',
            fontSize: '0.75rem',
            display: 'block',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
          onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
        >
          {displayUrl}
        </a>
      </Box>
    </Tooltip>
  )
}

const MediaStatusField = ({ source }: { source: string }) => {
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
  const [imageError, setImageError] = useState(false)

  if (!record?.url) return null

  switch (record.type) {
    case 'image':
      if (imageError) {
        return (
          <Box sx={{
            width: '80px',
            height: '60px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0f0f0f',
            borderRadius: '4px',
            border: '2px solid #e11d48'
          }}>
            <ImageIcon size={24} color="#e11d48" />
          </Box>
        )
      }

      return (
        <Box sx={{ width: '80px', height: '60px', position: 'relative', display: 'flex', justifyContent: 'center' }}>
          <img
            src={record.url}
            alt="Media preview"
            style={{
              width: 60,
              height: 60,
              objectFit: 'cover',
              borderRadius: '4px',
              border: '2px solid #e11d48'
            }}
            onError={() => setImageError(true)}
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

  const resourceMap: Record<string, string> = {
    character: 'characters',
    arc: 'arcs',
    event: 'events',
    gamble: 'gambles',
    organization: 'organizations',
  }

  const adminShowPath = record.ownerId && resourceMap[record.ownerType]
    ? `/${resourceMap[record.ownerType]}/${record.ownerId}/show`
    : null

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
        <Box sx={{ minHeight: '20px', display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <EntityNameDisplay />
          {adminShowPath && (
            <Link
              to={adminShowPath}
              onClick={(e) => e.stopPropagation()}
              style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}
            >
              <ExternalLink size={11} color="#666" />
            </Link>
          )}
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
  const [showResults, setShowResults] = useState(false)
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

  const searchRef = useRef<HTMLDivElement>(null)
  const userChangedRef = useRef(false)
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 })

  const updateDropdownPos = () => {
    if (searchRef.current) {
      const rect = searchRef.current.getBoundingClientRect()
      setDropdownPos({ top: rect.bottom, left: rect.left, width: rect.width })
    }
  }

  // Load entities on mount and initialize from URL params
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
        const newSelectedEntities: typeof selectedEntities = {
          characters: [],
          arcs: [],
          events: [],
          gambles: [],
          organizations: []
        }

        if (filterValues?.characterIds) {
          const ids = filterValues.characterIds.split(',').map((id: string) => parseInt(id.trim()))
          newSelectedEntities.characters = loadedEntities.characters.filter(c => ids.includes(c.id))
        }
        if (filterValues?.arcIds) {
          const ids = filterValues.arcIds.split(',').map((id: string) => parseInt(id.trim()))
          newSelectedEntities.arcs = loadedEntities.arcs.filter(a => ids.includes(a.id))
        }
        if (filterValues?.eventIds) {
          const ids = filterValues.eventIds.split(',').map((id: string) => parseInt(id.trim()))
          newSelectedEntities.events = loadedEntities.events.filter(e => ids.includes(e.id))
        }
        if (filterValues?.gambleIds) {
          const ids = filterValues.gambleIds.split(',').map((id: string) => parseInt(id.trim()))
          newSelectedEntities.gambles = loadedEntities.gambles.filter(g => ids.includes(g.id))
        }
        if (filterValues?.organizationIds) {
          const ids = filterValues.organizationIds.split(',').map((id: string) => parseInt(id.trim()))
          newSelectedEntities.organizations = loadedEntities.organizations.filter(o => ids.includes(o.id))
        }

        setSelectedEntities(newSelectedEntities)
      } catch (error) {
        console.error('Error loading entities:', error)
      }
    }

    loadEntities()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto-apply entity filters when selection changes (only on user-initiated changes)
  useEffect(() => {
    if (!userChangedRef.current) return
    userChangedRef.current = false

    const newFilters = { ...filterValues }
    delete newFilters.characterIds
    delete newFilters.arcIds
    delete newFilters.eventIds
    delete newFilters.gambleIds
    delete newFilters.organizationIds

    if (selectedEntities.characters.length) newFilters.characterIds = selectedEntities.characters.map((c: any) => c.id).join(',')
    if (selectedEntities.arcs.length) newFilters.arcIds = selectedEntities.arcs.map((a: any) => a.id).join(',')
    if (selectedEntities.events.length) newFilters.eventIds = selectedEntities.events.map((e: any) => e.id).join(',')
    if (selectedEntities.gambles.length) newFilters.gambleIds = selectedEntities.gambles.map((g: any) => g.id).join(',')
    if (selectedEntities.organizations.length) newFilters.organizationIds = selectedEntities.organizations.map((o: any) => o.id).join(',')

    setFilters(newFilters, filterValues)
  }, [selectedEntities])

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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
    if (status === 'all') delete newFilters.status
    setFilters(newFilters, filterValues)
  }

  // Flat results across all entity types for the unified search dropdown
  const flatResults = useMemo(() => {
    if (!entitySearch.trim()) return []
    const q = entitySearch.toLowerCase()
    const results: { type: string; icon: string; id: number; name: string }[] = []

    entities.characters
      .filter(c => c.name.toLowerCase().includes(q) && !selectedEntities.characters.find((s: any) => s.id === c.id))
      .slice(0, 5).forEach(c => results.push({ type: 'character', icon: '👤', id: c.id, name: c.name }))
    entities.arcs
      .filter(a => a.name.toLowerCase().includes(q) && !selectedEntities.arcs.find((s: any) => s.id === a.id))
      .slice(0, 5).forEach(a => results.push({ type: 'arc', icon: '📖', id: a.id, name: a.name }))
    entities.events
      .filter(e => e.title.toLowerCase().includes(q) && !selectedEntities.events.find((s: any) => s.id === e.id))
      .slice(0, 5).forEach(e => results.push({ type: 'event', icon: '⚡', id: e.id, name: e.title }))
    entities.gambles
      .filter(g => g.name.toLowerCase().includes(q) && !selectedEntities.gambles.find((s: any) => s.id === g.id))
      .slice(0, 5).forEach(g => results.push({ type: 'gamble', icon: '🎲', id: g.id, name: g.name }))
    entities.organizations
      .filter(o => o.name.toLowerCase().includes(q) && !selectedEntities.organizations.find((s: any) => s.id === o.id))
      .slice(0, 5).forEach(o => results.push({ type: 'organization', icon: '⚔️', id: o.id, name: o.name }))

    return results.slice(0, 15)
  }, [entitySearch, entities, selectedEntities])

  const addEntity = (result: { type: string; icon: string; id: number; name: string }) => {
    userChangedRef.current = true
    setSelectedEntities(prev => {
      const key = result.type === 'character' ? 'characters'
        : result.type === 'arc' ? 'arcs'
        : result.type === 'event' ? 'events'
        : result.type === 'gamble' ? 'gambles'
        : 'organizations'
      return { ...prev, [key]: [...(prev as any)[key], { id: result.id, name: result.name, title: result.name }] }
    })
    setEntitySearch('')
    setShowResults(false)
  }

  const removeEntity = (type: string, id: number) => {
    userChangedRef.current = true
    setSelectedEntities(prev => {
      const key = type === 'character' ? 'characters'
        : type === 'arc' ? 'arcs'
        : type === 'event' ? 'events'
        : type === 'gamble' ? 'gambles'
        : 'organizations'
      return { ...prev, [key]: (prev as any)[key].filter((e: any) => e.id !== id) }
    })
  }

  const hasEntityFilters = selectedEntities.characters.length > 0 ||
    selectedEntities.arcs.length > 0 ||
    selectedEntities.events.length > 0 ||
    selectedEntities.gambles.length > 0 ||
    selectedEntities.organizations.length > 0

  const currentStatus = filterValues?.status || 'all'

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFilters = { ...filterValues, search: e.target.value || undefined }
    setFilters(newFilters, filterValues)
  }

  return (
    <Box sx={{
      backgroundColor: 'rgba(10, 10, 10, 0.95)',
      borderRadius: 0,
      border: '1px solid rgba(225, 29, 72, 0.2)',
      borderTop: 'none',
      borderBottom: 'none',
      mb: 0,
      p: 2,
      backdropFilter: 'blur(8px)',
      position: 'relative',
      zIndex: 2
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

      {/* Entity Filters - Unified Search */}
      <Box>
        <Typography variant="subtitle2" sx={{
          color: '#7c3aed',
          fontWeight: 'bold',
          mb: 1,
          fontSize: '0.9rem'
        }}>
          🔗 Filter by Related Entities
        </Typography>

        {/* Active entity chips */}
        {hasEntityFilters && (
          <Box sx={{ mb: 1.5, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {selectedEntities.characters.map((c: any) => (
              <Chip key={`char-${c.id}`} label={`👤 ${c.name}`} size="small"
                onDelete={() => removeEntity('character', c.id)}
                sx={{ backgroundColor: 'rgba(124, 58, 237, 0.1)', color: '#7c3aed', fontSize: '0.7rem' }} />
            ))}
            {selectedEntities.arcs.map((a: any) => (
              <Chip key={`arc-${a.id}`} label={`📖 ${a.name}`} size="small"
                onDelete={() => removeEntity('arc', a.id)}
                sx={{ backgroundColor: 'rgba(124, 58, 237, 0.1)', color: '#7c3aed', fontSize: '0.7rem' }} />
            ))}
            {selectedEntities.events.map((e: any) => (
              <Chip key={`event-${e.id}`} label={`⚡ ${e.title || e.name}`} size="small"
                onDelete={() => removeEntity('event', e.id)}
                sx={{ backgroundColor: 'rgba(124, 58, 237, 0.1)', color: '#7c3aed', fontSize: '0.7rem' }} />
            ))}
            {selectedEntities.gambles.map((g: any) => (
              <Chip key={`gamble-${g.id}`} label={`🎲 ${g.name}`} size="small"
                onDelete={() => removeEntity('gamble', g.id)}
                sx={{ backgroundColor: 'rgba(124, 58, 237, 0.1)', color: '#7c3aed', fontSize: '0.7rem' }} />
            ))}
            {selectedEntities.organizations.map((o: any) => (
              <Chip key={`org-${o.id}`} label={`⚔️ ${o.name}`} size="small"
                onDelete={() => removeEntity('organization', o.id)}
                sx={{ backgroundColor: 'rgba(124, 58, 237, 0.1)', color: '#7c3aed', fontSize: '0.7rem' }} />
            ))}
          </Box>
        )}

        {/* Unified search input + dropdown */}
        <Box ref={searchRef} sx={{ position: 'relative' }}>
          <MuiTextField
            label="Search characters, arcs, events, gambles, organizations..."
            value={entitySearch}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setEntitySearch(e.target.value)
              updateDropdownPos()
              setShowResults(true)
            }}
            onFocus={() => { updateDropdownPos(); setShowResults(true) }}
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
          {showResults && flatResults.length > 0 && createPortal(
            <Box sx={{
              position: 'fixed',
              top: dropdownPos.top,
              left: dropdownPos.left,
              width: dropdownPos.width,
              zIndex: 9999,
              backgroundColor: 'rgba(15, 15, 15, 0.98)',
              border: '1px solid rgba(124, 58, 237, 0.3)',
              borderTop: 'none',
              borderRadius: '0 0 4px 4px',
              maxHeight: 200,
              overflowY: 'auto'
            }}>
              {flatResults.map(result => (
                <Box
                  key={`${result.type}-${result.id}`}
                  onMouseDown={() => addEntity(result)}
                  sx={{
                    px: 1.5,
                    py: 0.75,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    '&:hover': { backgroundColor: 'rgba(124, 58, 237, 0.1)' }
                  }}
                >
                  <span style={{ fontSize: '0.9rem' }}>{result.icon}</span>
                  <Typography variant="body2" sx={{ color: '#fff', flex: 1, fontSize: '0.85rem' }}>
                    {result.name}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                    {result.type}
                  </Typography>
                </Box>
              ))}
            </Box>
          , document.body)}
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

// Media Rejection Modal Component
const MediaRejectionModal = ({ open, onClose, mediaId, mediaUrl, onSuccess }: {
  open: boolean;
  onClose: () => void;
  mediaId: number;
  mediaUrl: string;
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
      await api.put(`/media/${mediaId}/reject`, { reason: reason.trim() });
      notify('Media rejected successfully', { type: 'success' });
      onSuccess();
      onClose();
      setReason('');
    } catch (error: any) {
      console.error('Error rejecting media:', error);
      const errorMessage = error?.details?.message || error?.message || 'Error rejecting media';
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

  // Truncate URL for display
  const displayUrl = mediaUrl && mediaUrl.length > 50 ? mediaUrl.substring(0, 50) + '...' : mediaUrl;

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
        Reject Media
      </DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <Typography variant="body1">
            Are you sure you want to reject this media submission?
          </Typography>
          {displayUrl && (
            <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
              {displayUrl}
            </Typography>
          )}

          <MuiTextField
            fullWidth
            required
            multiline
            rows={3}
            label="Rejection Reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Explain why this media is being rejected..."
            helperText="This reason will be shown to the submitter"
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
          {submitting ? 'Rejecting...' : 'Reject Media'}
        </MuiButton>
      </DialogActions>
    </Dialog>
  );
};

const RejectButton = () => {
  const record = useRecordContext()
  const refresh = useRefresh()
  const [modalOpen, setModalOpen] = useState(false)

  if (record?.status === 'rejected') return null

  return (
    <>
      <Button
        label="Reject"
        onClick={() => setModalOpen(true)}
        color="secondary"
        startIcon={<X size={20} />}
      />
      {record && (
        <MediaRejectionModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          mediaId={Number(record.id)}
          mediaUrl={record.url || ''}
          onSuccess={refresh}
        />
      )}
    </>
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
        let name: string
        switch (record.ownerType) {
          case 'character': {
            const entity = await api.getCharacter(record.ownerId)
            name = entity.name
            break
          }
          case 'arc': {
            const entity = await api.getArc(record.ownerId)
            name = entity.name
            break
          }
          case 'event': {
            const entity = await api.getEvent(record.ownerId)
            name = entity.title || entity.name || `Event #${record.ownerId}`
            break
          }
          case 'gamble': {
            const entity = await api.getGamble(record.ownerId)
            name = entity.name
            break
          }
          case 'organization': {
            const entity = await api.getOrganization(record.ownerId)
            name = entity.name
            break
          }
          case 'user': {
            const entity = await api.get<{ username: string }>(`/users/${record.ownerId}`)
            name = entity.username
            break
          }
          default:
            setEntityName(`Unknown entity type: ${record.ownerType}`)
            return
        }
        setEntityName(name)
      } catch (error) {
        console.error('Failed to fetch entity name:', error)
        setEntityName(`${record.ownerType} #${record.ownerId}`)
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

// Approval Toolbar - Always visible with Select All Pending
const MediaApprovalToolbar = () => {
  const { data, selectedIds, onSelect } = useListContext()
  const notify = useNotify()
  const refresh = useRefresh()
  const unselectAll = useUnselectAll('media')
  const [approving, setApproving] = useState(false)
  const [rejectModalOpen, setRejectModalOpen] = useState(false)

  // Get all pending items from current data
  const pendingItems = data ? data.filter((item: any) => item.status === 'pending') : []
  const pendingIds = pendingItems.map((item: any) => item.id)

  const handleSelectAllPending = () => {
    if (pendingIds.length > 0) {
      onSelect(pendingIds)
      notify(`Selected ${pendingIds.length} pending media item(s)`, { type: 'info' })
    }
  }

  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) return

    setApproving(true)
    let successCount = 0
    let errorCount = 0

    for (const id of selectedIds) {
      try {
        await api.put(`/media/${id}/approve`, {})
        successCount++
      } catch (error) {
        console.error(`Error approving media ${id}:`, error)
        errorCount++
      }
    }

    setApproving(false)
    unselectAll()
    refresh()

    if (errorCount === 0) {
      notify(`Successfully approved ${successCount} media item(s)`, { type: 'success' })
    } else {
      notify(`Approved ${successCount} item(s), ${errorCount} failed`, { type: 'warning' })
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

      <MediaBulkRejectModal
        open={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        selectedIds={selectedIds}
        onSuccess={handleRejectSuccess}
      />
    </Box>
  )
}

// Bulk Approve Button for Media
const MediaBulkApproveButton = () => {
  const { selectedIds } = useListContext()
  const notify = useNotify()
  const refresh = useRefresh()
  const unselectAll = useUnselectAll('media')
  const [loading, setLoading] = useState(false)

  const handleBulkApprove = async () => {
    setLoading(true)
    let successCount = 0
    let errorCount = 0

    for (const id of selectedIds) {
      try {
        await api.put(`/media/${id}/approve`, {})
        successCount++
      } catch (error) {
        console.error(`Error approving media ${id}:`, error)
        errorCount++
      }
    }

    setLoading(false)
    unselectAll()
    refresh()

    if (errorCount === 0) {
      notify(`Successfully approved ${successCount} media item(s)`, { type: 'success' })
    } else {
      notify(`Approved ${successCount} item(s), ${errorCount} failed`, { type: 'warning' })
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

// Bulk Reject Modal for Media
const MediaBulkRejectModal = ({ open, onClose, selectedIds, onSuccess }: {
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
        await api.put(`/media/${id}/reject`, { reason: reason.trim() })
        successCount++
      } catch (error) {
        console.error(`Error rejecting media ${id}:`, error)
        errorCount++
      }
    }

    setSubmitting(false)

    if (errorCount === 0) {
      notify(`Successfully rejected ${successCount} media item(s)`, { type: 'success' })
    } else {
      notify(`Rejected ${successCount} item(s), ${errorCount} failed`, { type: 'warning' })
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
        Bulk Reject {selectedIds.length} Media Item(s)
      </DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <Typography variant="body1">
            You are about to reject <strong>{selectedIds.length}</strong> media item(s).
            All selected items will receive the same rejection reason.
          </Typography>

          <MuiTextField
            fullWidth
            required
            multiline
            rows={3}
            label="Rejection Reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Explain why these media items are being rejected..."
            helperText="This reason will be shown to the submitters"
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
          {submitting ? 'Rejecting...' : `Reject ${selectedIds.length} Item(s)`}
        </MuiButton>
      </DialogActions>
    </Dialog>
  )
}

// Bulk Reject Button for Media
const MediaBulkRejectButton = () => {
  const { selectedIds } = useListContext()
  const refresh = useRefresh()
  const unselectAll = useUnselectAll('media')
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
      <MediaBulkRejectModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        selectedIds={selectedIds}
        onSuccess={handleSuccess}
      />
    </>
  )
}

// Media Bulk Action Buttons Component
const MediaBulkActionButtons = () => (
  <Box sx={{ display: 'flex', alignItems: 'center' }}>
    <MediaBulkApproveButton />
    <MediaBulkRejectButton />
  </Box>
)

const MediaDatagrid = () => (
  <Datagrid
    rowClick="show"
      bulkActionButtons={<MediaBulkActionButtons />}
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
          padding: '14px 10px',
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
      <EntityInfoField />
      <MediaPreviewField source="url" />
      <TruncatedUrlField />
      <MediaTypeField />
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
      <ChapterInfoField />
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
)

export const MediaList = () => (
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
    <MediaApprovalToolbar />
    <MediaFilterToolbar />
    <MediaDatagrid />
  </List>
)

export const MediaApprovalQueue = () => (
  <List filter={{ status: 'pending' }} title="Media Approval Queue">
    <Datagrid
      rowClick="show"
      bulkActionButtons={<MediaBulkActionButtons />}
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

const MediaShowContent = () => {
  const record = useRecordContext()
  const [imageError, setImageError] = useState(false)

  const renderMediaContent = () => {
    if (!record?.url) return null

    switch (record.type) {
      case 'image':
        if (imageError) {
          return (
            <Box sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              p: 6,
              backgroundColor: '#0f0f0f',
              borderRadius: 2,
              border: '2px dashed rgba(225, 29, 72, 0.3)',
              minHeight: '300px'
            }}>
              <ImageIcon size={64} color="#e11d48" style={{ marginBottom: 16 }} />
              <Typography variant="h6" sx={{ color: '#e11d48', mb: 1 }}>
                Image Failed to Load
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center' }}>
                The image could not be displayed. This may be due to:<br/>
                • Invalid or broken URL<br/>
                • Domain not configured in image settings<br/>
                • Network connectivity issues
              </Typography>
            </Box>
          )
        }

        return (
          <Box sx={{
            display: 'flex',
            justifyContent: 'center',
            p: 3,
            backgroundColor: '#0f0f0f',
            borderRadius: 2,
            border: '2px dashed rgba(225, 29, 72, 0.3)'
          }}>
            <img
              src={record.url}
              alt={record.description || 'Media content'}
              style={{
                maxWidth: '100%',
                height: 'auto',
                borderRadius: '8px',
                boxShadow: '0 8px 32px rgba(225, 29, 72, 0.3)',
                border: '1px solid rgba(225, 29, 72, 0.2)'
              }}
              onError={() => setImageError(true)}
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

  if (!record) return null

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

            {/* File Metadata */}
            <Card elevation={0} sx={{
              mt: 3,
              backgroundColor: '#0a0a0a',
              border: '1px solid rgba(225, 29, 72, 0.3)'
            }}>
              <Box sx={{
                background: 'linear-gradient(135deg, #374151 0%, #1f2937 100%)',
                color: 'white',
                p: 2
              }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 2 }}>
                  File Metadata
                </Typography>
              </Box>
              <CardContent sx={{ p: 3 }}>
                <TextField source="fileName" label="File Name" emptyText="—" />
                <TextField source="mimeType" label="MIME Type" emptyText="—" />
                <NumberField source="fileSize" label="File Size (bytes)" emptyText="—" />
                <NumberField source="width" label="Width (px)" emptyText="—" />
                <NumberField source="height" label="Height (px)" emptyText="—" />
                <TextField source="b2FileId" label="B2 File ID" emptyText="—" />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
  )
}

export const MediaShow = () => (
  <Show>
    <MediaShowContent />
  </Show>
)

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
      <ReferenceInput source="ownerId" reference="characters" label="Character" perPage={200}>
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
      <ReferenceInput source="ownerId" reference="arcs" label="Arc" perPage={200}>
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
      <ReferenceInput source="ownerId" reference="events" label="Event" perPage={200}>
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
      <ReferenceInput source="ownerId" reference="gambles" label="Gamble" perPage={200}>
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
      <ReferenceInput source="ownerId" reference="organizations" label="Organization" perPage={200}>
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
      <ReferenceInput source="ownerId" reference="users" label="User" perPage={200}>
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
      <SimpleForm
        toolbar={<ApproveRejectToolbar resource="media" showDelete={true} />}
        sx={{
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
            <Grid item xs={12}>
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
              <MediaStatusField source="status" />
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', mt: 1 }}>
                Use the Approve / Reject buttons in the toolbar below to change status.
              </Typography>
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