import React from 'react'
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
} from '@mui/material'
import {
  Check,
  X,
  MessageSquare,
  User,
  Calendar,
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
      case AnnotationOwnerType.CHAPTER: return { bg: 'rgba(33, 150, 243, 0.1)', color: '#2196f3' }
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
    { id: AnnotationOwnerType.CHAPTER, name: 'Chapter', color: '#2196f3' },
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
    sx={{
      '& .RaList-content': {
        '& > *:not(:last-child)': {
          marginBottom: 0
        }
      }
    }}
  >
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

      <AnnotationOwnerTypeField />

      <TextField source="ownerId" sortable sx={{ width: '80px', fontSize: '0.85rem' }} />

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
    <SimpleForm>
      <TextInput source="id" disabled />

      <SelectInput
        source="ownerType"
        choices={[
          { id: AnnotationOwnerType.CHARACTER, name: 'Character' },
          { id: AnnotationOwnerType.GAMBLE, name: 'Gamble' },
          { id: AnnotationOwnerType.CHAPTER, name: 'Chapter' },
          { id: AnnotationOwnerType.ARC, name: 'Arc' },
        ]}
        disabled
      />

      <NumberInput source="ownerId" disabled />

      <TextInput source="title" fullWidth required />

      <TextInput source="content" multiline fullWidth required rows={6} />

      <TextInput source="sourceUrl" fullWidth />

      <NumberInput source="chapterReference" />

      <BooleanInput source="isSpoiler" />

      <NumberInput source="spoilerChapter" />

      <SelectInput
        source="status"
        choices={[
          { id: AnnotationStatus.PENDING, name: 'Pending' },
          { id: AnnotationStatus.APPROVED, name: 'Approved' },
          { id: AnnotationStatus.REJECTED, name: 'Rejected' },
        ]}
      />

      <TextInput source="rejectionReason" multiline fullWidth rows={2} />
    </SimpleForm>
  </Edit>
)

// Create Component
export const AnnotationCreate = () => (
  <Create>
    <SimpleForm>
      <SelectInput
        source="ownerType"
        choices={[
          { id: AnnotationOwnerType.CHARACTER, name: 'Character' },
          { id: AnnotationOwnerType.GAMBLE, name: 'Gamble' },
          { id: AnnotationOwnerType.CHAPTER, name: 'Chapter' },
          { id: AnnotationOwnerType.ARC, name: 'Arc' },
        ]}
        required
      />

      <NumberInput source="ownerId" required />

      <TextInput source="title" fullWidth required />

      <TextInput source="content" multiline fullWidth required rows={6} />

      <TextInput source="sourceUrl" fullWidth />

      <NumberInput source="chapterReference" />

      <BooleanInput source="isSpoiler" />

      <NumberInput source="spoilerChapter" />
    </SimpleForm>
  </Create>
)

// Show Component
export const AnnotationShow = () => {
  const record = useRecordContext()
  const notify = useNotify()
  const refresh = useRefresh()
  const redirect = useRedirect()

  const handleApprove = async () => {
    if (!record) return
    try {
      await api.approveAnnotation(Number(record.id))
      notify('Annotation approved', { type: 'success' })
      refresh()
    } catch (error) {
      notify('Error approving annotation', { type: 'error' })
    }
  }

  const handleReject = async () => {
    if (!record) return
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
    <Show>
      <SimpleShowLayout>
        {/* Action Buttons */}
        {record?.status === AnnotationStatus.PENDING && (
          <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
            <MuiButton
              variant="contained"
              color="success"
              onClick={handleApprove}
              startIcon={<Check size={18} />}
            >
              Approve
            </MuiButton>
            <MuiButton
              variant="contained"
              color="error"
              onClick={handleReject}
              startIcon={<X size={18} />}
            >
              Reject
            </MuiButton>
          </Box>
        )}

        <TextField source="id" />
        <TextField source="title" sx={{ fontSize: '1.2rem', fontWeight: 'bold' }} />

        <FunctionField
          label="Status"
          render={(record: any) => (
            <AnnotationStatusField source="status" />
          )}
        />

        <FunctionField
          label="Owner Type"
          render={(record: any) => (
            <AnnotationOwnerTypeField />
          )}
        />

        <TextField source="ownerId" />

        <FunctionField
          label="Content"
          render={(record: any) => (
            <Box sx={{
              p: 2,
              backgroundColor: 'rgba(139, 92, 246, 0.05)',
              borderRadius: 1,
              border: '1px solid rgba(139, 92, 246, 0.2)'
            }}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {record.content}
              </ReactMarkdown>
            </Box>
          )}
        />

        <TextField source="sourceUrl" />
        <TextField source="chapterReference" />
        <BooleanField source="isSpoiler" />
        <TextField source="spoilerChapter" />
        <TextField source="rejectionReason" />

        <FunctionField
          label="Author"
          render={(record: any) => (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <User size={16} />
              <Typography>
                {record.author?.username} (ID: {record.authorId})
              </Typography>
            </Box>
          )}
        />

        <DateField source="createdAt" showTime />
        <DateField source="updatedAt" showTime />
      </SimpleShowLayout>
    </Show>
  )
}
