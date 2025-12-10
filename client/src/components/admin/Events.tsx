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
  NumberInput,
  NumberField,
  SimpleShowLayout,
  ReferenceField,
  SelectInput,
  ReferenceInput,
  AutocompleteInput,
  ReferenceArrayInput,
  AutocompleteArrayInput,
  SingleFieldList,
  ChipField,
  usePermissions,
  Button,
  useRecordContext,
  useNotify,
  useRefresh,
  Filter,
  Loading,
  useListContext,
  FunctionField,
  TabbedForm,
  FormTab
} from 'react-admin'
import { useFormContext } from 'react-hook-form'
import { EventStatus } from '../../types'
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
  Tabs
} from '@mui/material'
import {
  Check,
  X,
  Calendar,
  Clock,
  User,
  Eye,
  Heart,
  Edit3,
  BookOpen,
  Users,
  Target,
  Star,
  Zap,
  Activity
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { api } from '../../lib/api'
import EnhancedSpoilerMarkdown from '../EnhancedSpoilerMarkdown'
// Note: Removed EntityEmbedHelperWithSearch import to avoid Mantine/MUI conflicts

const EVENT_TYPE_CHOICES = [
  { id: 'gamble', name: 'Gamble' },
  { id: 'decision', name: 'Decision' },
  { id: 'reveal', name: 'Reveal' },
  { id: 'shift', name: 'Shift' },
  { id: 'resolution', name: 'Resolution' },
]

const STATUS_CHOICES = [
  { id: EventStatus.PENDING, name: 'Pending' },
  { id: EventStatus.APPROVED, name: 'Approved' },
  { id: EventStatus.REJECTED, name: 'Rejected' },
]

const EventStatusField = ({ source }: { source: string }) => {
  const record = useRecordContext()
  if (!record) return null

  const status = record[source]
  const getStatusColor = (status: string) => {
    switch(status) {
      case EventStatus.APPROVED: return 'success'
      case EventStatus.REJECTED: return 'error'
      case EventStatus.PENDING: return 'warning'
      default: return 'warning'
    }
  }

  const getStatusIcon = (status: string) => {
    switch(status) {
      case EventStatus.APPROVED: return '✅'
      case EventStatus.REJECTED: return '❌'
      case EventStatus.PENDING: return '⏳'
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

const EventTypeField = () => {
  const record = useRecordContext()
  if (!record) return null

  const getTypeColor = (type: string) => {
    switch(type) {
      case 'gamble': return { bg: 'rgba(233, 30, 99, 0.1)', color: '#e91e63' }
      case 'decision': return { bg: 'rgba(156, 39, 176, 0.1)', color: '#9c27b0' }
      case 'reveal': return { bg: 'rgba(63, 81, 181, 0.1)', color: '#3f51b5' }
      case 'shift': return { bg: 'rgba(255, 87, 34, 0.1)', color: '#ff5722' }
      case 'resolution': return { bg: 'rgba(76, 175, 80, 0.1)', color: '#4caf50' }
      default: return { bg: 'rgba(158, 158, 158, 0.1)', color: '#9e9e9e' }
    }
  }

  const colors = getTypeColor(record.type)

  return (
    <Box sx={{ width: '120px', display: 'flex', flexDirection: 'column', gap: 0.5 }}>
      <Chip
        size="small"
        label={record.type}
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

const EventPreviewField = () => {
  const record = useRecordContext()
  if (!record) return null

  const getEventIcon = (type: string) => {
    switch(type) {
      case 'gamble': return <Zap size={24} color="#e91e63" />
      case 'decision': return <Target size={24} color="#9c27b0" />
      case 'reveal': return <Eye size={24} color="#3f51b5" />
      case 'shift': return <Activity size={24} color="#ff5722" />
      case 'resolution': return <Check size={24} color="#4caf50" />
      default: return <Calendar size={24} color="#9e9e9e" />
    }
  }

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
        {getEventIcon(record.type)}
      </Box>
    </Box>
  )
}

const EventDetailsField = () => {
  const record = useRecordContext()
  if (!record) return null

  return (
    <Box sx={{
      width: '160px',
      display: 'flex',
      flexDirection: 'column',
      gap: 0.5
    }}>
      <Typography sx={{
        fontSize: '0.75rem',
        fontWeight: '500',
        color: 'primary.main'
      }}>
        Chapter {record.chapterNumber}
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
      {record.spoilerChapter && (
        <Typography sx={{
          fontSize: '0.65rem',
          color: '#f44336',
          fontWeight: 'bold'
        }}>
          Spoiler: Ch. {record.spoilerChapter}
        </Typography>
      )}
    </Box>
  )
}

const EventRelatedEntitiesField = () => {
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

        {/* Gamble */}
        {record.gamble && record.gamble.name && (
          <Box>
            <Chip
              label={record.gamble.name}
              size="small"
              sx={{
                backgroundColor: 'rgba(156, 39, 176, 0.2)',
                color: '#9c27b0',
                fontSize: '0.65rem',
                height: '18px'
              }}
            />
          </Box>
        )}

        {/* Characters */}
        {record.characters && record.characters.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {record.characters.slice(0, 2).map((character: any) => (
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
            {record.characters.length > 2 && (
              <Chip
                label={`+${record.characters.length - 2}`}
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

        {/* No entities */}
        {(!record.arc || !record.arc.name) &&
         (!record.gamble || !record.gamble.name) &&
         (!record.characters || record.characters.length === 0) && (
          <Typography sx={{ fontSize: '0.7rem', color: 'text.disabled', fontStyle: 'italic' }}>
            No related entities
          </Typography>
        )}
      </Box>
    </Box>
  )
}

// Custom Filter Toolbar Component
const EventFilterToolbar = () => {
  const { filterValues, setFilters } = useListContext()

  const statusFilters = [
    { id: 'all', name: 'All', color: '#666', icon: '🗂️' },
    { id: EventStatus.PENDING, name: 'Pending Review', color: '#f57c00', icon: '⏳' },
    { id: EventStatus.APPROVED, name: 'Approved', color: '#4caf50', icon: '✅' },
    { id: EventStatus.REJECTED, name: 'Rejected', color: '#f44336', icon: '❌' }
  ]

  const typeFilters = [
    { id: 'all', name: 'All Types', color: '#666', icon: '📋' },
    { id: 'gamble', name: 'Gambles', color: '#e91e63', icon: '🎲' },
    { id: 'decision', name: 'Decisions', color: '#9c27b0', icon: '🤔' },
    { id: 'reveal', name: 'Reveals', color: '#3f51b5', icon: '👁️' },
    { id: 'shift', name: 'Shifts', color: '#ff5722', icon: '🔄' },
    { id: 'resolution', name: 'Resolutions', color: '#4caf50', icon: '✨' }
  ]

  const handleStatusFilter = (status: string) => {
    const newFilters = status === 'all'
      ? { ...filterValues, status: undefined }
      : { ...filterValues, status }
    setFilters(newFilters, filterValues)
  }

  const handleTypeFilter = (type: string) => {
    const newFilters = type === 'all'
      ? { ...filterValues, type: undefined }
      : { ...filterValues, type }
    setFilters(newFilters, filterValues)
  }

  const handleTextSearch = (field: string, value: string) => {
    const newFilters = { ...filterValues }
    if (value.trim()) {
      newFilters[field] = value
    } else {
      delete newFilters[field]
    }
    setFilters(newFilters, filterValues)
  }

  const currentStatus = filterValues?.status || 'all'
  const currentType = filterValues?.type || 'all'

  return (
    <Box sx={{
      backgroundColor: 'rgba(10, 10, 10, 0.95)',
      borderRadius: '8px 8px 0 0',
      border: '1px solid rgba(225, 29, 72, 0.2)',
      borderBottom: 'none',
      mb: 0,
      p: 2,
      backdropFilter: 'blur(8px)'
    }}>
      {/* Search Filters */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" sx={{
          color: '#e11d48',
          fontWeight: 'bold',
          mb: 2,
          fontSize: '0.9rem'
        }}>
          🔍 Search Events
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <MuiTextField
              label="Search by title..."
              fullWidth
              size="small"
              defaultValue={filterValues?.title || ''}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'rgba(225, 29, 72, 0.05)',
                  '& fieldset': { borderColor: 'rgba(225, 29, 72, 0.3)' },
                  '&:hover fieldset': { borderColor: '#e11d48' },
                  '&.Mui-focused fieldset': { borderColor: '#e11d48' }
                }
              }}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                handleTextSearch('title', e.target.value)
              }}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <MuiTextField
              label="Search by description..."
              fullWidth
              size="small"
              defaultValue={filterValues?.description || ''}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'rgba(225, 29, 72, 0.05)',
                  '& fieldset': { borderColor: 'rgba(225, 29, 72, 0.3)' },
                  '&:hover fieldset': { borderColor: '#e11d48' },
                  '&.Mui-focused fieldset': { borderColor: '#e11d48' }
                }
              }}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                handleTextSearch('description', e.target.value)
              }}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <MuiTextField
              label="Search by arc name..."
              fullWidth
              size="small"
              defaultValue={filterValues?.arc || ''}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'rgba(225, 29, 72, 0.05)',
                  '& fieldset': { borderColor: 'rgba(225, 29, 72, 0.3)' },
                  '&:hover fieldset': { borderColor: '#e11d48' },
                  '&.Mui-focused fieldset': { borderColor: '#e11d48' }
                }
              }}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                handleTextSearch('arc', e.target.value)
              }}
            />
          </Grid>
        </Grid>
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

      {/* Type Filters */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" sx={{
          color: '#7c3aed',
          fontWeight: 'bold',
          mb: 1,
          fontSize: '0.9rem'
        }}>
          🎯 Filter by Type
        </Typography>
        <ButtonGroup variant="outlined" sx={{ flexWrap: 'wrap', gap: 0.5 }}>
          {typeFilters.map((filter) => (
            <MuiButton
              key={filter.id}
              onClick={() => handleTypeFilter(filter.id)}
              variant={currentType === filter.id ? 'contained' : 'outlined'}
              size="small"
              sx={{
                borderColor: filter.color,
                color: currentType === filter.id ? '#fff' : filter.color,
                backgroundColor: currentType === filter.id ? filter.color : 'transparent',
                fontSize: '0.75rem',
                minWidth: '80px',
                height: '32px',
                '&:hover': {
                  backgroundColor: currentType === filter.id
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

      {/* Additional Filters Note */}
      <Box sx={{
        p: 2,
        backgroundColor: 'rgba(37, 99, 235, 0.05)',
        borderRadius: 1,
        border: '1px solid rgba(37, 99, 235, 0.2)'
      }}>
        <Typography variant="body2" sx={{ color: '#2563eb', fontSize: '0.8rem' }}>
          💡 <strong>Available Filters:</strong> Title, Description, Arc Name, Event Type, and Status.
          Use the search fields above to filter events by these criteria.
        </Typography>
      </Box>
    </Box>
  )
}

export const EventList = () => (
  <List
    perPage={25}
    sx={{
      '& .RaList-content': {
        '& > *:not(:last-child)': {
          marginBottom: 0
        }
      }
    }}
  >
    <EventFilterToolbar />
    <Datagrid
      rowClick="show"
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

      {/* Event Preview */}
      <EventPreviewField />

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

      <FunctionField
        source="description"
        render={(record: any) => (
          <Box sx={{ maxWidth: '180px' }}>
            <Typography sx={{
              display: '-webkit-box',
              WebkitLineClamp: 1,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              fontSize: '0.8rem',
              color: 'text.secondary',
              lineHeight: 1.2
            }}>
              {record.description || 'No description'}
            </Typography>
          </Box>
        )}
      />

      {/* Event Type & Classification */}
      <EventTypeField />

      {/* Related Entities */}
      <EventRelatedEntitiesField />

      {/* Status - Prominent Display */}
      <Box sx={{ width: '110px', display: 'flex', justifyContent: 'center' }}>
        <EventStatusField source="status" />
      </Box>

      {/* Event Details */}
      <EventDetailsField />
    </Datagrid>
  </List>
)

const EventShowContent = () => {
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
              <Activity size={32} color="white" />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h4" sx={{
                fontWeight: 'bold',
                color: 'white',
                mb: 1,
                textShadow: '0 2px 4px rgba(0,0,0,0.3)'
              }}>
                {record?.title || 'Event Title'}
              </Typography>
              <Typography variant="body1" sx={{
                color: 'rgba(255,255,255,0.9)',
                fontSize: '1.1rem',
                opacity: 0.95
              }}>
                Chapter {record?.chapterNumber} • {record?.type}
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Box sx={{ mb: 1 }}>
                <EventStatusField source="status" />
              </Box>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                ID: {record?.id}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Card>

      <Grid container spacing={3}>
        {/* Main Content */}
        <Grid item xs={12} md={8}>
          {/* Event Description */}
          {record?.description ? (
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
                  <BookOpen size={24} />
                  Event Description
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
                  }
                }}>
                  <EnhancedSpoilerMarkdown
                    content={record.description}
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
                  No description available for this event.
                </Typography>
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* Sidebar with Meta Information */}
        <Grid item xs={12} md={4}>
          {/* Event Details */}
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
                <Activity size={20} />
                Event Details
              </Typography>
            </Box>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Type
                </Typography>
                <Chip
                  label={record.type}
                  sx={{
                    textTransform: 'capitalize',
                    fontWeight: 'bold',
                    backgroundColor: 'rgba(225, 29, 72, 0.2)',
                    color: '#f43f5e'
                  }}
                />
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Chapter
                </Typography>
                <Typography variant="h6" sx={{ color: '#e11d48', fontWeight: 'bold' }}>
                  {record.chapterNumber}
                </Typography>
              </Box>

              {record.spoilerChapter && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Spoiler Chapter
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#f44336', fontWeight: 'bold' }}>
                    {record.spoilerChapter}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Related Content */}
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
                <BookOpen size={20} />
                Related Content
              </Typography>
            </Box>
            <CardContent sx={{ p: 3 }}>
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

              {record?.gamble && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Gamble
                  </Typography>
                  <Chip
                    label={record.gamble.name}
                    color="info"
                    size="small"
                    sx={{ backgroundColor: 'rgba(25, 118, 210, 0.2)', color: '#60a5fa' }}
                  />
                </Box>
              )}

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

              {(!record?.arc && !record?.gamble && (!record?.characters || record.characters.length === 0)) && (
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                  No related content associated
                </Typography>
              )}
            </CardContent>
          </Card>

          {/* Dates */}
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
                Event Metadata
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
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}

export const EventShow = () => {
  return (
    <Show>
      <EventShowContent />
    </Show>
  )
}

// Content input component with tabs
const ContentInputWithPreview = () => {
  const [activeTab, setActiveTab] = useState(0)
  const record = useRecordContext()
  const { setValue, getValues, watch } = useFormContext()
  const [textAreaRef, setTextAreaRef] = useState<HTMLTextAreaElement | null>(null)
  const contentValue = watch('description')

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue)
  }

  const handleInsertEmbed = (embedCode: string) => {
    if (textAreaRef) {
      const currentValue = getValues().description || ''
      const cursorPosition = textAreaRef.selectionStart || currentValue.length
      const newValue =
        currentValue.slice(0, cursorPosition) +
        embedCode +
        currentValue.slice(cursorPosition)

      setValue('description', newValue, { shouldDirty: true, shouldValidate: true })

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
      const currentValue = getValues().description || ''
      setValue('description', currentValue + embedCode, { shouldDirty: true, shouldValidate: true })
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
        Event Description
      </Typography>

      <Box sx={{
        p: 2,
        backgroundColor: 'rgba(37, 99, 235, 0.05)',
        borderRadius: 1,
        border: '1px solid rgba(37, 99, 235, 0.2)',
        mb: 2
      }}>
        <Typography variant="body2" sx={{ color: '#2563eb', mb: 1, fontWeight: 'bold' }}>
          💡 Entity Embeds
        </Typography>
        <Typography variant="body2" sx={{ color: '#2563eb', fontSize: '0.8rem', mb: 2 }}>
          You can reference other entities in your description using the following formats:
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          <Chip
            size="small"
            label="[character:name]"
            onClick={() => handleInsertEmbed('[character:Baku]')}
            sx={{ cursor: 'pointer', fontSize: '0.7rem', backgroundColor: 'rgba(34, 197, 94, 0.2)', color: '#22c55e' }}
          />
          <Chip
            size="small"
            label="[arc:name]"
            onClick={() => handleInsertEmbed('[arc:Tower of Karma]')}
            sx={{ cursor: 'pointer', fontSize: '0.7rem', backgroundColor: 'rgba(168, 85, 247, 0.2)', color: '#a855f7' }}
          />
          <Chip
            size="small"
            label="[gamble:name]"
            onClick={() => handleInsertEmbed('[gamble:Hangman]')}
            sx={{ cursor: 'pointer', fontSize: '0.7rem', backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' }}
          />
        </Box>
      </Box>

      <Card sx={{ mt: 2, border: '1px solid rgba(124, 58, 237, 0.3)' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab label="Write" icon={<Edit3 size={16} />} iconPosition="start" />
            <Tab label="Preview" icon={<Eye size={16} />} iconPosition="start" />
          </Tabs>
        </Box>

        <CardContent>
          {activeTab === 0 ? (
            <TextInput
              source="description"
              multiline
              rows={15}
              required
              fullWidth
              label="Description (Markdown Supported)"
              helperText="Write the event description using Markdown formatting and entity embeds"
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
                    Start writing the event description to see the preview with entity embeds...
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

export const EventEdit = () => {
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
              Edit Event
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9, mt: 1 }}>
              Update event details and settings
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
                      label="Event Title"
                      helperText="Enter a descriptive title for this event"
                    />
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2, mt: 2 }}>
                      <SelectInput
                        source="type"
                        choices={EVENT_TYPE_CHOICES}
                        required
                        label="Event Type"
                        helperText="Category of event"
                      />
                      <NumberInput
                        source="chapterNumber"
                        required
                        max={539}
                        min={1}
                        label="Chapter"
                        helperText="Chapter (1-539)"
                      />
                      <NumberInput
                        source="spoilerChapter"
                        max={539}
                        min={1}
                        label="Spoiler Chapter"
                        helperText="Spoiler chapter (optional)"
                      />
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <ContentInputWithPreview />
                </Grid>

                <Grid item xs={12} md={6}>
                  <Box sx={{
                    p: 3,
                    backgroundColor: 'rgba(245, 124, 0, 0.05)',
                    borderRadius: 2,
                    border: '1px solid rgba(245, 124, 0, 0.2)'
                  }}>
                    <Typography variant="h6" sx={{ color: '#f57c00', mb: 2, fontWeight: 'bold' }}>
                      Publication Status
                    </Typography>
                    <SelectInput
                      source="status"
                      choices={[
                        { id: EventStatus.PENDING, name: 'Pending Review' },
                        { id: EventStatus.APPROVED, name: 'Approved' },
                        { id: EventStatus.REJECTED, name: 'Rejected' }
                      ]}
                      fullWidth
                      sx={{
                        '& .MuiSelect-select': {
                          backgroundColor: '#0f0f0f'
                        }
                      }}
                    />
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
                      Story Context
                    </Typography>
                    <ReferenceInput source="arcId" reference="arcs" label="Arc">
                      <AutocompleteInput
                        optionText="name"
                        sx={{
                          '& .MuiAutocomplete-root .MuiOutlinedInput-root': {
                            backgroundColor: '#0f0f0f'
                          }
                        }}
                      />
                    </ReferenceInput>
                    <ReferenceInput source="gambleId" reference="gambles" label="Associated Gamble">
                      <AutocompleteInput
                        optionText="name"
                        sx={{
                          '& .MuiAutocomplete-root .MuiOutlinedInput-root': {
                            backgroundColor: '#0f0f0f'
                          }
                        }}
                      />
                    </ReferenceInput>
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <Box sx={{
                    p: 3,
                    backgroundColor: 'rgba(25, 118, 210, 0.05)',
                    borderRadius: 2,
                    border: '1px solid rgba(25, 118, 210, 0.2)',
                    mb: 3
                  }}>
                    <Typography variant="h6" sx={{ color: '#1976d2', mb: 3, fontWeight: 'bold' }}>
                      Related Content
                    </Typography>
                    <ReferenceArrayInput source="characterIds" reference="characters" label="Characters">
                      <AutocompleteArrayInput
                        optionText="name"
                        sx={{
                          '& .MuiAutocomplete-root .MuiOutlinedInput-root': {
                            backgroundColor: '#0f0f0f'
                          }
                        }}
                      />
                    </ReferenceArrayInput>
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

export const EventCreate = () => (
  <Create>
    <Box sx={{
      backgroundColor: '#0a0a0a',
      minHeight: '100vh',
      p: 3,
      '& .RaCreate-main': {
        backgroundColor: 'transparent'
      }
    }}>
      <TabbedForm sx={{
        backgroundColor: '#0a0a0a',
        '& .RaTabbedForm-content': {
          backgroundColor: '#0a0a0a',
          border: '2px solid #16a34a',
          borderRadius: 2,
          borderTop: 'none',
          p: 0
        },
        '& .MuiTabs-root': {
          backgroundColor: '#0a0a0a',
          border: '2px solid #16a34a',
          borderBottom: 'none',
          borderRadius: '8px 8px 0 0',
          '& .MuiTab-root': {
            color: 'rgba(255, 255, 255, 0.7)',
            fontWeight: 600,
            textTransform: 'none',
            minHeight: 48,
            '&.Mui-selected': {
              color: '#16a34a',
              backgroundColor: 'rgba(22, 163, 74, 0.1)'
            },
            '&:hover': {
              color: '#16a34a',
              backgroundColor: 'rgba(22, 163, 74, 0.05)'
            }
          },
          '& .MuiTabs-indicator': {
            backgroundColor: '#16a34a',
            height: 3
          }
        },
        '& .MuiTextField-root': {
          mb: 3,
          '& .MuiOutlinedInput-root': {
            backgroundColor: '#0f0f0f',
            border: '1px solid rgba(22, 163, 74, 0.3)',
            '&:hover': {
              borderColor: 'rgba(22, 163, 74, 0.5)'
            },
            '&.Mui-focused': {
              borderColor: '#16a34a'
            },
            '& .MuiOutlinedInput-notchedOutline': {
              border: 'none'
            }
          },
          '& .MuiInputLabel-root': {
            color: 'rgba(255, 255, 255, 0.7)',
            '&.Mui-focused': {
              color: '#16a34a'
            }
          },
          '& .MuiInputBase-input': {
            color: '#ffffff'
          },
          '& .MuiFormHelperText-root': {
            color: 'rgba(255, 255, 255, 0.6)'
          }
        },
        '& .MuiFormControl-root': {
          mb: 3
        }
      }}>
        <FormTab label="Basic Info">
          <Box sx={{ maxWidth: 600, p: 3, backgroundColor: '#0a0a0a' }}>
            <Typography variant="h6" gutterBottom sx={{ color: '#16a34a', mb: 2, fontWeight: 'bold' }}>New Event</Typography>
            <TextInput
              source="title"
              required
              fullWidth
              sx={{ mb: 3 }}
              helperText="Descriptive title for this event"
            />

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
              <SelectInput
                source="type"
                choices={EVENT_TYPE_CHOICES}
                required
                defaultValue="decision"
                helperText="Event category"
              />
              <SelectInput
                source="status"
                choices={STATUS_CHOICES}
                required
                defaultValue={EventStatus.PENDING}
                helperText="Review status"
              />
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
              <NumberInput
                source="chapterNumber"
                required
                max={539}
                min={1}
                helperText="Chapter (1-539)"
              />
              <NumberInput
                source="spoilerChapter"
                max={539}
                min={1}
                helperText="Spoiler chapter (optional)"
              />
            </Box>

            <Typography variant="subtitle1" gutterBottom sx={{ mt: 3, mb: 1, color: '#ffffff', fontWeight: 'bold' }}>Description</Typography>
            <TextInput
              source="description"
              multiline
              rows={6}
              required
              fullWidth
              helperText="Detailed description of what happens in this event. Supports Markdown formatting."
            />
          </Box>
        </FormTab>

        <FormTab label="Context & Relations">
          <Box sx={{ maxWidth: 600, p: 3, backgroundColor: '#0a0a0a' }}>
            <Typography variant="h6" gutterBottom sx={{ color: '#16a34a', mb: 2, fontWeight: 'bold' }}>Story Context</Typography>
            <ReferenceInput source="arcId" reference="arcs" label="Arc" sx={{ mb: 3 }}>
              <AutocompleteInput
                optionText="name"
                helperText="Which story arc does this event belong to?"
                sx={{
                  '& .MuiAutocomplete-root .MuiOutlinedInput-root': {
                    backgroundColor: '#0f0f0f'
                  }
                }}
              />
            </ReferenceInput>

            <ReferenceInput source="gambleId" reference="gambles" label="Associated Gamble" sx={{ mb: 3 }}>
              <AutocompleteInput
                optionText="name"
                helperText="Link to a specific gamble if relevant"
                sx={{
                  '& .MuiAutocomplete-root .MuiOutlinedInput-root': {
                    backgroundColor: '#0f0f0f'
                  }
                }}
              />
            </ReferenceInput>

            <Typography variant="subtitle1" gutterBottom sx={{ mt: 3, mb: 1, color: '#ffffff', fontWeight: 'bold' }}>Participants & Tags</Typography>
            <Box sx={{ mb: 3 }}>
              <ReferenceArrayInput source="characterIds" reference="characters" label="Characters">
                <AutocompleteArrayInput
                  optionText="name"
                  helperText="Characters involved in this event"
                  sx={{
                    '& .MuiAutocomplete-root .MuiOutlinedInput-root': {
                      backgroundColor: '#0f0f0f'
                    }
                  }}
                />
              </ReferenceArrayInput>
            </Box>

            <ReferenceArrayInput source="tagIds" reference="tags" label="Tags">
              <AutocompleteArrayInput
                optionText="name"
                helperText="Relevant tags for categorization"
                sx={{
                  '& .MuiAutocomplete-root .MuiOutlinedInput-root': {
                    backgroundColor: '#0f0f0f'
                  }
                }}
              />
            </ReferenceArrayInput>
          </Box>
        </FormTab>
      </TabbedForm>
    </Box>
  </Create>
)
