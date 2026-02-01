import React, { useState, useEffect } from 'react'
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
  NumberInput,
  useRecordContext,
  useNotify,
  useRefresh,
  useRedirect,
  FunctionField,
  useListContext,
  BulkDeleteButton,
  Button,
  BooleanInput,
  BooleanField,
} from 'react-admin'
import { AnnotationStatus, AnnotationOwnerType } from '../../types'
import {
  Box,
  Chip,
  Typography,
  Button as MuiButton,
  ButtonGroup,
  TextField as MuiTextField,
  Grid,
  Card,
  CardContent,
  Avatar,
  CircularProgress,
} from '@mui/material'
import {
  Check,
  X,
  MessageSquare,
  User,
  Calendar,
  FileText,
  AlertTriangle,
} from 'lucide-react'
import { api } from '../../lib/api'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const AnnotationStatusField = ({ source }: { source: string }) => {
  const record = useRecordContext()
  if (!record) return null

  const status = record[source]
  const getStatusColor = (status: string) => {
    switch(status) {
      case AnnotationStatus.APPROVED: return 'success'
      case AnnotationStatus.REJECTED: return 'error'
      case AnnotationStatus.PENDING: return 'warning'
      default: return 'warning'
    }
  }

  const getStatusIcon = (status: string) => {
    switch(status) {
      case AnnotationStatus.APPROVED: return '✅'
      case AnnotationStatus.REJECTED: return '❌'
      case AnnotationStatus.PENDING: return '⏳'
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

const AnnotationOwnerTypeField = () => {
  const record = useRecordContext()
  if (!record) return null

  const ownerType = record.ownerType
  const getTypeColor = (type: string) => {
    switch(type) {
      case AnnotationOwnerType.CHARACTER: return { bg: 'rgba(76, 175, 80, 0.1)', color: '#4caf50' }
      case AnnotationOwnerType.GAMBLE: return { bg: 'rgba(244, 67, 54, 0.1)', color: '#f44336' }
      case AnnotationOwnerType.ARC: return { bg: 'rgba(255, 152, 0, 0.1)', color: '#ff9800' }
      default: return { bg: 'rgba(158, 158, 158, 0.1)', color: '#9e9e9e' }
    }
  }

  const colors = getTypeColor(ownerType)

  return (
    <Chip
      size="small"
      label={ownerType}
      sx={{
        fontWeight: '500',
        textTransform: 'capitalize',
        backgroundColor: colors.bg,
        color: colors.color,
        fontSize: '0.7rem'
      }}
    />
  )
}

const AnnotationAuthorField = () => {
  const record = useRecordContext()
  if (!record || !record.author) return null

  return (
    <Box sx={{
      display: 'flex',
      alignItems: 'center',
      gap: 1
    }}>
      <User size={14} />
      <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
        {record.author.username}
      </Typography>
    </Box>
  )
}

// Hook to fetch and cache entity names
const useEntityName = (ownerType: string, ownerId: number) => {
  const [entityName, setEntityName] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [isError, setIsError] = useState(false)

  useEffect(() => {
    const fetchEntityName = async () => {
      try {
        setIsError(false)
        let result
        switch(ownerType) {
          case AnnotationOwnerType.CHARACTER:
            const char = await api.getCharacter(ownerId)
            result = char.name
            break
          case AnnotationOwnerType.ARC:
            const arc = await api.getArc(ownerId)
            result = arc.name
            break
          case AnnotationOwnerType.GAMBLE:
            const gamble = await api.getGamble(ownerId)
            result = gamble.name
            break
          default:
            result = 'Unknown'
        }
        setEntityName(result)
      } catch (error) {
        console.error('Failed to fetch entity name:', error)
        setIsError(true)
        setEntityName(null)
      } finally {
        setLoading(false)
      }
    }
    fetchEntityName()
  }, [ownerType, ownerId])

  return { entityName, loading, isError }
}

// Component to display entity name with loading state
const EntityNameDisplay = () => {
  const record = useRecordContext()
  if (!record) return null

  const { entityName, loading, isError } = useEntityName(record.ownerType, record.ownerId)

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <CircularProgress size={12} sx={{ color: 'text.secondary' }} />
        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
          Loading...
        </Typography>
      </Box>
    )
  }

  if (isError) {
    return (
      <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.85rem', color: '#f44336' }}>
        Error loading entity
      </Typography>
    )
  }

  return (
    <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.85rem' }}>
      {entityName}
    </Typography>
  )
}

// Entity Info Field combining type chip and entity name
const EntityInfoField = () => {
  const record = useRecordContext()
  if (!record) return null

  const getTypeColor = (type: string) => {
    switch(type) {
      case AnnotationOwnerType.CHARACTER: return { bg: 'rgba(76, 175, 80, 0.2)', color: '#4caf50' }
      case AnnotationOwnerType.GAMBLE: return { bg: 'rgba(244, 67, 54, 0.2)', color: '#f44336' }
      case AnnotationOwnerType.ARC: return { bg: 'rgba(255, 152, 0, 0.2)', color: '#ff9800' }
      default: return { bg: 'rgba(158, 158, 158, 0.2)', color: '#9e9e9e' }
    }
  }

  const colors = getTypeColor(record.ownerType)

  return (
    <Box sx={{ width: '200px' }}>
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        p: 1,
        borderRadius: 1,
        backgroundColor: 'rgba(139, 92, 246, 0.05)',
        border: '1px solid rgba(139, 92, 246, 0.2)'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip
            size="small"
            label={record.ownerType}
            sx={{
              backgroundColor: colors.bg,
              color: colors.color,
              fontWeight: 'bold',
              textTransform: 'capitalize',
              fontSize: '0.75rem'
            }}
          />
          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
            #{record.ownerId}
          </Typography>
        </Box>
        <Box sx={{ minHeight: '20px' }}>
          <EntityNameDisplay />
        </Box>
      </Box>
    </Box>
  )
}

const AnnotationApprovalToolbar = () => {
  const { data, selectedIds, onSelect } = useListContext()
  const notify = useNotify()
  const refresh = useRefresh()
  const [approving, setApproving] = useState(false)

  const pendingItems = data ? data.filter((item: any) => item.status === AnnotationStatus.PENDING) : []
  const pendingIds = pendingItems.map((item: any) => item.id)

  const handleSelectAllPending = () => {
    if (pendingIds.length > 0) {
      onSelect(pendingIds)
      notify(`Selected ${pendingIds.length} pending annotation(s)`, { type: 'info' })
    }
  }

  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) return
    setApproving(true)
    let successCount = 0
    let errorCount = 0

    for (const id of selectedIds) {
      try {
        await api.approveAnnotation(Number(id))
        successCount++
      } catch {
        errorCount++
      }
    }

    setApproving(false)
    refresh()

    if (errorCount === 0) {
      notify(`Successfully approved ${successCount} annotation(s)`, { type: 'success' })
    } else {
      notify(`Approved ${successCount} annotation(s), ${errorCount} failed`, { type: 'warning' })
    }
  }

  const handleBulkReject = async () => {
    if (selectedIds.length === 0) return
    const reason = prompt('Rejection reason for all selected:')
    if (!reason) return

    let successCount = 0
    let errorCount = 0

    for (const id of selectedIds) {
      try {
        await api.rejectAnnotation(Number(id), reason)
        successCount++
      } catch {
        errorCount++
      }
    }

    refresh()

    if (errorCount === 0) {
      notify(`Successfully rejected ${successCount} annotation(s)`, { type: 'success' })
    } else {
      notify(`Rejected ${successCount} annotation(s), ${errorCount} failed`, { type: 'warning' })
    }
  }

  return (
    <Box sx={{
      display: 'flex',
      alignItems: 'center',
      gap: 2,
      p: 2,
      backgroundColor: 'rgba(10, 10, 10, 0.95)',
      borderRadius: '8px 8px 0 0',
      border: '1px solid rgba(139, 92, 246, 0.3)',
      borderBottom: 'none',
      mb: 0
    }}>
      <Chip
        label={`${pendingIds.length} Pending`}
        color="warning"
        size="small"
        sx={{ fontWeight: 'bold' }}
      />

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

      {selectedIds.length > 0 && (
        <Typography variant="body2" sx={{ color: 'white', mr: 1 }}>
          {selectedIds.length} selected
        </Typography>
      )}

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

      <MuiButton
        variant="contained"
        size="small"
        onClick={handleBulkReject}
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
    </Box>
  )
}

const AnnotationFilterToolbar = () => {
  const { filterValues, setFilters } = useListContext()

  const statusFilters = [
    { id: 'all', name: 'All', color: '#9e9e9e', icon: '📋' },
    { id: AnnotationStatus.PENDING, name: 'Pending', color: '#ff9800', icon: '⏳' },
    { id: AnnotationStatus.APPROVED, name: 'Approved', color: '#4caf50', icon: '✅' },
    { id: AnnotationStatus.REJECTED, name: 'Rejected', color: '#f44336', icon: '❌' }
  ]

  const ownerTypeFilters = [
    { id: 'all', name: 'All Types', color: '#9e9e9e' },
    { id: AnnotationOwnerType.CHARACTER, name: 'Character', color: '#4caf50' },
    { id: AnnotationOwnerType.GAMBLE, name: 'Gamble', color: '#f44336' },
    { id: AnnotationOwnerType.ARC, name: 'Arc', color: '#ff9800' }
  ]

  const handleStatusFilter = (status: string) => {
    const newFilters = status === 'all'
      ? { ...filterValues, status: undefined }
      : { ...filterValues, status }
    setFilters(newFilters, filterValues)
  }

  const handleOwnerTypeFilter = (ownerType: string) => {
    const newFilters = ownerType === 'all'
      ? { ...filterValues, ownerType: undefined }
      : { ...filterValues, ownerType }
    setFilters(newFilters, filterValues)
  }

  const currentStatus = filterValues?.status || 'all'
  const currentOwnerType = filterValues?.ownerType || 'all'

  return (
    <Box sx={{
      backgroundColor: 'rgba(10, 10, 10, 0.95)',
      borderRadius: 0,
      border: '1px solid rgba(139, 92, 246, 0.2)',
      borderTop: 'none',
      borderBottom: 'none',
      mb: 0,
      p: 2,
      backdropFilter: 'blur(8px)'
    }}>
      {/* Search */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" sx={{
          color: '#8b5cf6',
          fontWeight: 'bold',
          mb: 1,
          fontSize: '0.9rem'
        }}>
          🔍 Search Annotations
        </Typography>
        <MuiTextField
          label="Search by title or content..."
          fullWidth
          size="small"
          sx={{
            '& .MuiOutlinedInput-root': {
              backgroundColor: 'rgba(139, 92, 246, 0.05)',
              '& fieldset': { borderColor: 'rgba(139, 92, 246, 0.3)' },
              '&:hover fieldset': { borderColor: '#8b5cf6' },
              '&.Mui-focused fieldset': { borderColor: '#8b5cf6' }
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
          color: '#8b5cf6',
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

      {/* Owner Type Filters */}
      <Box>
        <Typography variant="subtitle2" sx={{
          color: '#8b5cf6',
          fontWeight: 'bold',
          mb: 1,
          fontSize: '0.9rem'
        }}>
          🎯 Filter by Type
        </Typography>
        <ButtonGroup variant="outlined" sx={{ flexWrap: 'wrap', gap: 0.5 }}>
          {ownerTypeFilters.map((filter) => (
            <MuiButton
              key={filter.id}
              onClick={() => handleOwnerTypeFilter(filter.id)}
              variant={currentOwnerType === filter.id ? 'contained' : 'outlined'}
              size="small"
              sx={{
                borderColor: filter.color,
                color: currentOwnerType === filter.id ? '#fff' : filter.color,
                backgroundColor: currentOwnerType === filter.id ? filter.color : 'transparent',
                fontSize: '0.75rem',
                minWidth: '80px',
                height: '32px',
                '&:hover': {
                  backgroundColor: currentOwnerType === filter.id
                    ? filter.color
                    : `${filter.color}20`,
                  borderColor: filter.color
                }
              }}
            >
              {filter.name}
            </MuiButton>
          ))}
        </ButtonGroup>
      </Box>
    </Box>
  )
}

// Bulk Action Buttons
const ApproveButton = () => {
  const { selectedIds } = useListContext()
  const refresh = useRefresh()
  const notify = useNotify()
  const unselectAll = useListContext().onUnselectItems

  const handleApprove = async () => {
    try {
      await Promise.all(selectedIds.map(id => api.approveAnnotation(id as number)))
      notify(`${selectedIds.length} annotation(s) approved`, { type: 'success' })
      unselectAll()
      refresh()
    } catch (error) {
      notify('Error approving annotations', { type: 'error' })
    }
  }

  return (
    <Button
      label={`Approve ${selectedIds.length}`}
      onClick={handleApprove}
      sx={{
        color: '#4caf50',
        borderColor: '#4caf50',
        '&:hover': { backgroundColor: 'rgba(76, 175, 80, 0.1)' }
      }}
    >
      <Check />
    </Button>
  )
}

const RejectButton = () => {
  const { selectedIds } = useListContext()
  const refresh = useRefresh()
  const notify = useNotify()
  const unselectAll = useListContext().onUnselectItems

  const handleReject = async () => {
    const reason = prompt('Rejection reason:')
    if (!reason) return

    try {
      await Promise.all(selectedIds.map(id => api.rejectAnnotation(id as number, reason)))
      notify(`${selectedIds.length} annotation(s) rejected`, { type: 'success' })
      unselectAll()
      refresh()
    } catch (error) {
      notify('Error rejecting annotations', { type: 'error' })
    }
  }

  return (
    <Button
      label={`Reject ${selectedIds.length}`}
      onClick={handleReject}
      sx={{
        color: '#f44336',
        borderColor: '#f44336',
        '&:hover': { backgroundColor: 'rgba(244, 67, 54, 0.1)' }
      }}
    >
      <X />
    </Button>
  )
}

const AnnotationBulkActionButtons = () => (
  <Box>
    <ApproveButton />
    <RejectButton />
    <BulkDeleteButton />
  </Box>
)

// Per-row action buttons
const AnnotationRowActions = () => {
  const record = useRecordContext()
  const notify = useNotify()
  const refresh = useRefresh()

  if (!record || record.status !== AnnotationStatus.PENDING) return null

  const handleApprove = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await api.approveAnnotation(Number(record.id))
      notify('Annotation approved', { type: 'success' })
      refresh()
    } catch {
      notify('Error approving annotation', { type: 'error' })
    }
  }

  const handleReject = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const reason = prompt('Rejection reason:')
    if (!reason) return
    try {
      await api.rejectAnnotation(Number(record.id), reason)
      notify('Annotation rejected', { type: 'success' })
      refresh()
    } catch {
      notify('Error rejecting annotation', { type: 'error' })
    }
  }

  return (
    <Box sx={{ display: 'flex', gap: 0.5 }}>
      <MuiButton
        size="small"
        variant="outlined"
        color="success"
        onClick={handleApprove}
        sx={{ minWidth: 'auto', px: 1, py: 0.25, fontSize: '0.7rem' }}
      >
        <Check size={14} />
      </MuiButton>
      <MuiButton
        size="small"
        variant="outlined"
        color="error"
        onClick={handleReject}
        sx={{ minWidth: 'auto', px: 1, py: 0.25, fontSize: '0.7rem' }}
      >
        <X size={14} />
      </MuiButton>
    </Box>
  )
}

// Main List Component
export const AnnotationList = () => (
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
    <AnnotationApprovalToolbar />
    <AnnotationFilterToolbar />
    <Datagrid
      rowClick="show"
      bulkActionButtons={<AnnotationBulkActionButtons />}
      sx={{
        marginTop: 0,
        borderRadius: '0 0 8px 8px',
        border: '1px solid rgba(139, 92, 246, 0.2)',
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
          borderBottom: '2px solid #8b5cf6',
          borderTop: 'none'
        },
        '& .RaDatagrid-rowCell': {
          padding: '8px 10px',
          backgroundColor: 'rgba(10, 10, 10, 0.8)',
          color: '#ffffff',
          borderBottom: '1px solid rgba(139, 92, 246, 0.2)'
        },
        '& .RaDatagrid-tbody tr:nth-of-type(even)': {
          backgroundColor: 'rgba(139, 92, 246, 0.05)'
        },
        '& .RaDatagrid-tbody tr:hover': {
          backgroundColor: 'rgba(139, 92, 246, 0.15) !important'
        }
      }}
    >
      <TextField source="id" sortable sx={{ width: '50px', fontSize: '0.85rem' }} />

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
        label="Entity"
        render={() => <EntityInfoField />}
      />

      <Box sx={{ width: '110px', display: 'flex', justifyContent: 'center' }}>
        <AnnotationStatusField source="status" />
      </Box>

      <AnnotationAuthorField />

      <BooleanField source="isSpoiler" />

      <DateField source="createdAt" sortable showTime sx={{ fontSize: '0.8rem' }} />

      <FunctionField label="Actions" render={() => <AnnotationRowActions />} />
    </Datagrid>
  </List>
)

// Edit Component
export const AnnotationEdit = () => (
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
          border: '2px solid #8b5cf6',
          borderRadius: 2,
          boxShadow: '0 0 30px rgba(139, 92, 246, 0.2)'
        }}
      >
        {/* Header */}
        <Box sx={{
          background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
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
            <MessageSquare size={32} />
            Edit Annotation
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.9, mt: 1 }}>
            Update annotation content and settings
          </Typography>
        </Box>

        <CardContent sx={{ p: 4 }}>
          <SimpleForm sx={{
            '& .MuiTextField-root': {
              mb: 3,
              '& .MuiOutlinedInput-root': {
                backgroundColor: '#0f0f0f',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                '&:hover': {
                  borderColor: 'rgba(139, 92, 246, 0.5)'
                },
                '&.Mui-focused': {
                  borderColor: '#8b5cf6'
                },
                '& .MuiOutlinedInput-notchedOutline': {
                  border: 'none'
                }
              },
              '& .MuiInputLabel-root': {
                color: 'rgba(255, 255, 255, 0.7)',
                '&.Mui-focused': {
                  color: '#8b5cf6'
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
              {/* Entity Association */}
              <Grid item xs={12}>
                <Box sx={{
                  p: 3,
                  backgroundColor: 'rgba(139, 92, 246, 0.05)',
                  borderRadius: 2,
                  border: '1px solid rgba(139, 92, 246, 0.2)',
                  mb: 3
                }}>
                  <Typography variant="h6" sx={{ color: '#8b5cf6', mb: 2, fontWeight: 'bold' }}>
                    Entity Association
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                    <SelectInput
                      source="ownerType"
                      choices={[
                        { id: AnnotationOwnerType.CHARACTER, name: 'Character' },
                        { id: AnnotationOwnerType.GAMBLE, name: 'Gamble' },
                        { id: AnnotationOwnerType.ARC, name: 'Arc' },
                      ]}
                      disabled
                      label="Entity Type"
                    />
                    <NumberInput source="ownerId" disabled label="Entity ID" />
                  </Box>
                </Box>
              </Grid>

              {/* Content */}
              <Grid item xs={12}>
                <Box sx={{
                  p: 3,
                  backgroundColor: 'rgba(16, 185, 129, 0.05)',
                  borderRadius: 2,
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  mb: 3
                }}>
                  <Typography variant="h6" sx={{ color: '#10b981', mb: 2, fontWeight: 'bold' }}>
                    Content
                  </Typography>
                  <TextInput source="title" fullWidth required label="Annotation Title" helperText="Enter a descriptive title" />
                  <TextInput source="content" multiline fullWidth required rows={6} label="Content" helperText="Supports Markdown formatting" />
                  <TextInput source="sourceUrl" fullWidth label="Source URL" helperText="Optional reference URL" />
                  <NumberInput source="chapterReference" label="Chapter Reference" helperText="Related chapter number" />
                </Box>
              </Grid>

              {/* Spoiler Settings */}
              <Grid item xs={12} md={6}>
                <Box sx={{
                  p: 3,
                  backgroundColor: 'rgba(244, 67, 54, 0.05)',
                  borderRadius: 2,
                  border: '1px solid rgba(244, 67, 54, 0.2)'
                }}>
                  <Typography variant="h6" sx={{ color: '#f44336', mb: 2, fontWeight: 'bold' }}>
                    Spoiler Settings
                  </Typography>
                  <BooleanInput source="isSpoiler" label="Contains Spoilers" />
                  <NumberInput source="spoilerChapter" label="Spoiler Chapter" helperText="Chapter up to which this spoils" />
                </Box>
              </Grid>

              {/* Status */}
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
                      { id: AnnotationStatus.PENDING, name: 'Pending' },
                      { id: AnnotationStatus.APPROVED, name: 'Approved' },
                      { id: AnnotationStatus.REJECTED, name: 'Rejected' },
                    ]}
                    fullWidth
                  />
                  <TextInput source="rejectionReason" multiline fullWidth rows={2} label="Rejection Reason" helperText="Required when rejecting" />
                </Box>
              </Grid>
            </Grid>
          </SimpleForm>
        </CardContent>
      </Card>
    </Box>
  </Edit>
)

// Create Component
export const AnnotationCreate = () => (
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
          border: '2px solid #8b5cf6',
          borderRadius: 2,
          boxShadow: '0 0 30px rgba(139, 92, 246, 0.2)'
        }}
      >
        {/* Header */}
        <Box sx={{
          background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
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
            <MessageSquare size={32} />
            Create Annotation
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.9, mt: 1 }}>
            Add a new annotation to a character, gamble, or arc
          </Typography>
        </Box>

        <CardContent sx={{ p: 4 }}>
          <SimpleForm sx={{
            '& .MuiTextField-root': {
              mb: 3,
              '& .MuiOutlinedInput-root': {
                backgroundColor: '#0f0f0f',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                '&:hover': {
                  borderColor: 'rgba(139, 92, 246, 0.5)'
                },
                '&.Mui-focused': {
                  borderColor: '#8b5cf6'
                },
                '& .MuiOutlinedInput-notchedOutline': {
                  border: 'none'
                }
              },
              '& .MuiInputLabel-root': {
                color: 'rgba(255, 255, 255, 0.7)',
                '&.Mui-focused': {
                  color: '#8b5cf6'
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
              {/* Entity Association */}
              <Grid item xs={12}>
                <Box sx={{
                  p: 3,
                  backgroundColor: 'rgba(139, 92, 246, 0.05)',
                  borderRadius: 2,
                  border: '1px solid rgba(139, 92, 246, 0.2)',
                  mb: 3
                }}>
                  <Typography variant="h6" sx={{ color: '#8b5cf6', mb: 2, fontWeight: 'bold' }}>
                    Entity Association
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                    <SelectInput
                      source="ownerType"
                      choices={[
                        { id: AnnotationOwnerType.CHARACTER, name: 'Character' },
                        { id: AnnotationOwnerType.GAMBLE, name: 'Gamble' },
                        { id: AnnotationOwnerType.ARC, name: 'Arc' },
                      ]}
                      required
                      label="Entity Type"
                      helperText="What type of entity is this annotation for?"
                    />
                    <NumberInput source="ownerId" required label="Entity ID" helperText="ID of the entity" />
                  </Box>
                </Box>
              </Grid>

              {/* Content */}
              <Grid item xs={12}>
                <Box sx={{
                  p: 3,
                  backgroundColor: 'rgba(16, 185, 129, 0.05)',
                  borderRadius: 2,
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  mb: 3
                }}>
                  <Typography variant="h6" sx={{ color: '#10b981', mb: 2, fontWeight: 'bold' }}>
                    Content
                  </Typography>
                  <TextInput source="title" fullWidth required label="Annotation Title" helperText="Enter a descriptive title" />
                  <TextInput source="content" multiline fullWidth required rows={6} label="Content" helperText="Supports Markdown formatting" />
                  <TextInput source="sourceUrl" fullWidth label="Source URL" helperText="Optional reference URL" />
                  <NumberInput source="chapterReference" label="Chapter Reference" helperText="Related chapter number" />
                </Box>
              </Grid>

              {/* Spoiler Settings */}
              <Grid item xs={12}>
                <Box sx={{
                  p: 3,
                  backgroundColor: 'rgba(244, 67, 54, 0.05)',
                  borderRadius: 2,
                  border: '1px solid rgba(244, 67, 54, 0.2)'
                }}>
                  <Typography variant="h6" sx={{ color: '#f44336', mb: 2, fontWeight: 'bold' }}>
                    Spoiler Settings
                  </Typography>
                  <BooleanInput source="isSpoiler" label="Contains Spoilers" />
                  <NumberInput source="spoilerChapter" label="Spoiler Chapter" helperText="Chapter up to which this spoils" />
                </Box>
              </Grid>
            </Grid>
          </SimpleForm>
        </CardContent>
      </Card>
    </Box>
  </Create>
)

// Show Component Content with enhanced layout
const AnnotationShowContent = () => {
  const record = useRecordContext()
  const notify = useNotify()
  const refresh = useRefresh()

  if (!record) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  const { entityName, loading: entityLoading, isError: entityError } = useEntityName(record.ownerType, record.ownerId)

  const handleApprove = async () => {
    try {
      await api.approveAnnotation(Number(record.id))
      notify('Annotation approved', { type: 'success' })
      refresh()
    } catch (error) {
      notify('Error approving annotation', { type: 'error' })
    }
  }

  const handleReject = async () => {
    const reason = prompt('Rejection reason:')
    if (!reason) return
    try {
      await api.rejectAnnotation(Number(record.id), reason)
      notify('Annotation rejected', { type: 'success' })
      refresh()
    } catch (error) {
      notify('Error rejecting annotation', { type: 'error' })
    }
  }

  return (
    <Box sx={{ maxWidth: '1200px', mx: 'auto', p: 3, backgroundColor: '#0a0a0a', minHeight: '100vh' }}>
      {/* Header Card with Gradient */}
      <Card elevation={0} sx={{
        mb: 3,
        backgroundColor: '#0a0a0a',
        border: '2px solid #8b5cf6',
        borderRadius: 2,
        boxShadow: '0 0 30px rgba(139, 92, 246, 0.3)',
        overflow: 'hidden'
      }}>
        <Box sx={{
          background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
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
              <MessageSquare size={32} color="white" />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h4" sx={{
                fontWeight: 'bold',
                color: 'white',
                mb: 0.5,
                textShadow: '0 2px 4px rgba(0,0,0,0.3)'
              }}>
                {record.title}
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Box sx={{ mb: 1 }}>
                <AnnotationStatusField source="status" />
              </Box>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                ID: {record.id}
              </Typography>
            </Box>
          </Box>

          {/* Action Buttons */}
          {record.status === AnnotationStatus.PENDING && (
            <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
              <MuiButton
                variant="contained"
                onClick={handleApprove}
                startIcon={<Check size={18} />}
                sx={{
                  px: 3, py: 1.5, borderRadius: 2, fontWeight: 'bold',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'rgba(76, 175, 80, 0.3)',
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                Approve
              </MuiButton>
              <MuiButton
                variant="contained"
                onClick={handleReject}
                startIcon={<X size={18} />}
                sx={{
                  px: 3, py: 1.5, borderRadius: 2, fontWeight: 'bold',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'rgba(244, 67, 54, 0.3)',
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                Reject
              </MuiButton>
            </Box>
          )}
        </Box>
      </Card>

      <Grid container spacing={3}>
        {/* Main Content - 8 columns */}
        <Grid item xs={12} md={8}>
          {/* Content Card */}
          <Card elevation={0} sx={{
            mb: 3,
            backgroundColor: '#0a0a0a',
            border: '1px solid rgba(139, 92, 246, 0.3)'
          }}>
            <Box sx={{
              background: 'linear-gradient(135deg, #388e3c 0%, #2e7d32 100%)',
              color: 'white',
              p: 2
            }}>
              <Typography variant="h5" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 2 }}>
                <FileText size={24} />
                Annotation Content
              </Typography>
            </Box>
            <CardContent sx={{ p: 4 }}>
              <Box sx={{
                p: 3,
                border: '2px solid rgba(139, 92, 246, 0.2)',
                borderRadius: 2,
                backgroundColor: '#0f0f0f',
                minHeight: '200px'
              }}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {record.content}
                </ReactMarkdown>
              </Box>
            </CardContent>
          </Card>

          {/* Metadata Card (conditional - only if data exists) */}
          {(record.sourceUrl || record.chapterReference) && (
            <Card elevation={0} sx={{
              mb: 3,
              backgroundColor: '#0a0a0a',
              border: '1px solid rgba(139, 92, 246, 0.3)'
            }}>
              <Box sx={{
                background: 'linear-gradient(135deg, #f57c00 0%, #ef6c00 100%)',
                color: 'white',
                p: 2
              }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Additional Information
                </Typography>
              </Box>
              <CardContent>
                {record.sourceUrl && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ color: '#8b5cf6', mb: 0.5 }}>
                      Source URL
                    </Typography>
                    <Typography variant="body2" sx={{
                      fontFamily: 'monospace',
                      wordBreak: 'break-all'
                    }}>
                      {record.sourceUrl}
                    </Typography>
                  </Box>
                )}
                {record.chapterReference && (
                  <Box>
                    <Typography variant="subtitle2" sx={{ color: '#8b5cf6', mb: 0.5 }}>
                      Chapter Reference
                    </Typography>
                    <Typography variant="body2">
                      Chapter {record.chapterReference}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* Sidebar - 4 columns */}
        <Grid item xs={12} md={4}>
          {/* Owner Entity Card */}
          <Card elevation={0} sx={{
            mb: 3,
            backgroundColor: '#0a0a0a',
            border: '1px solid rgba(139, 92, 246, 0.3)'
          }}>
            <Box sx={{
              background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
              color: 'white',
              p: 2
            }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Owner Entity
              </Typography>
            </Box>
            <CardContent>
              <Box sx={{ mb: 2 }}>
                <AnnotationOwnerTypeField />
              </Box>
              <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary' }}>
                Entity ID: {record.ownerId}
              </Typography>
              {!entityLoading && entityName && (
                <Typography variant="h6" sx={{ color: '#8b5cf6', fontWeight: 'bold' }}>
                  {entityName}
                </Typography>
              )}
              {!entityLoading && entityError && (
                <Typography variant="body2" sx={{ color: '#f44336', fontWeight: 'bold' }}>
                  Error loading entity
                </Typography>
              )}
              {entityLoading && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={16} />
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Loading entity...
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Author Card */}
          <Card elevation={0} sx={{
            mb: 3,
            backgroundColor: '#0a0a0a',
            border: '1px solid rgba(139, 92, 246, 0.3)'
          }}>
            <Box sx={{
              background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
              color: 'white',
              p: 2
            }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Author Information
              </Typography>
            </Box>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <User size={16} />
                <ReferenceField source="authorId" reference="users" link="show">
                  <FunctionField render={(user: any) => user?.username || 'Unknown'} />
                </ReferenceField>
              </Box>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Author ID: {record.authorId}
              </Typography>
            </CardContent>
          </Card>

          {/* Status & Dates Card */}
          <Card elevation={0} sx={{
            mb: 3,
            backgroundColor: '#0a0a0a',
            border: '1px solid rgba(139, 92, 246, 0.3)'
          }}>
            <Box sx={{
              background: 'linear-gradient(135deg, #f57c00 0%, #ef6c00 100%)',
              color: 'white',
              p: 2
            }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Status & Dates
              </Typography>
            </Box>
            <CardContent>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ color: '#8b5cf6', mb: 0.5 }}>
                  Status
                </Typography>
                <AnnotationStatusField source="status" />
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ color: '#8b5cf6', mb: 0.5 }}>
                  Created
                </Typography>
                <DateField source="createdAt" showTime />
              </Box>
              <Box sx={{ mb: record.rejectionReason ? 2 : 0 }}>
                <Typography variant="subtitle2" sx={{ color: '#8b5cf6', mb: 0.5 }}>
                  Updated
                </Typography>
                <DateField source="updatedAt" showTime />
              </Box>
              {record.rejectionReason && (
                <Box sx={{
                  p: 2,
                  backgroundColor: 'rgba(244, 67, 54, 0.1)',
                  border: '1px solid rgba(244, 67, 54, 0.3)',
                  borderRadius: 1
                }}>
                  <Typography variant="subtitle2" sx={{ color: '#f44336', mb: 0.5, fontWeight: 'bold' }}>
                    Rejection Reason
                  </Typography>
                  <Typography variant="body2">
                    {record.rejectionReason}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Spoiler Info Card (conditional) */}
          {record.isSpoiler && (
            <Card elevation={0} sx={{
              mb: 3,
              backgroundColor: '#0a0a0a',
              border: '1px solid rgba(244, 67, 54, 0.3)'
            }}>
              <Box sx={{
                background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
                color: 'white',
                p: 2
              }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AlertTriangle size={20} />
                  Spoiler Warning
                </Typography>
              </Box>
              <CardContent>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  This annotation contains spoilers
                </Typography>
                {record.spoilerChapter && (
                  <Typography variant="body2" sx={{ color: '#f44336', fontWeight: 'bold' }}>
                    Spoils up to Chapter {record.spoilerChapter}
                  </Typography>
                )}
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
    </Box>
  )
}

// Show Component wrapper
export const AnnotationShow = () => (
  <Show>
    <AnnotationShowContent />
  </Show>
)
