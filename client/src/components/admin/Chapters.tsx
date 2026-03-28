import React, { useState } from 'react'
import {
  List,
  Datagrid,
  TextField,
  Edit,
  Create,
  Show,
  SimpleForm,
  TextInput,
  NumberInput,
  NumberField,
  FunctionField,
  TabbedShowLayout,
  Tab,
  BulkDeleteButton,
  useRecordContext,
  useGetList,
  useNotify,
  useRefresh,
  usePermissions,
  Button as RAButton,
  TopToolbar,
  BooleanField,
  EditButton,
} from 'react-admin'
import { Typography, Box, Card, CardContent } from '@mui/material'
import { Edit3, Plus, Hash, CheckCircle, Clock } from 'lucide-react'
import { EditToolbar } from './EditToolbar'
import { api } from '../../lib/api'

const ChapterNumberInput = ({ isEdit = false }: { isEdit?: boolean }) => {
  const record = useRecordContext()
  const [value, setValue] = useState<number | undefined>(record?.number)
  const { data: existing = [] } = useGetList('chapters', {
    pagination: { page: 1, perPage: 1 },
    filter: value !== undefined && value > 0 ? { number: value } : { number: -1 },
  })

  const isDuplicate = value !== undefined && value > 0 &&
    existing.length > 0 && (!isEdit || existing[0]?.id !== record?.id)

  return (
    <NumberInput
      source="number"
      label="Chapter Number"
      required
      fullWidth
      min={1}
      max={539}
      onChange={(e: any) => {
        const v = e.target.value
        setValue(v !== '' && v !== undefined && v !== null ? Number(v) : undefined)
      }}
      helperText={isDuplicate ? '⚠️ A chapter with this number already exists' : 'Chapter number (1–539)'}
    />
  )
}

const ChapterBulkActionButtons = () => (
  <>
    <BulkDeleteButton mutationMode="pessimistic" />
  </>
)

const VerifyButton = ({ apiMethod }: { apiMethod: (id: number) => Promise<any> }) => {
  const record = useRecordContext()
  const notify = useNotify()
  const refresh = useRefresh()
  const { permissions } = usePermissions()

  if (permissions !== 'admin' && permissions !== 'moderator') return null
  if (!record) return null

  const handleVerify = async () => {
    try {
      await apiMethod(Number(record.id))
      notify('Verified successfully', { type: 'success' })
      refresh()
    } catch (error: any) {
      notify(error?.message || 'Could not verify — you may have authored the last edit', { type: 'error' })
    }
  }

  if (record.isVerified) {
    return (
      <RAButton label="Verified" disabled color="success" startIcon={<CheckCircle size={16} />} onClick={() => {}} />
    )
  }

  return (
    <RAButton label="Verify" onClick={handleVerify} color="primary" startIcon={<Clock size={16} />} />
  )
}

const ChapterShowActions = () => (
  <TopToolbar>
    <EditButton />
    <VerifyButton apiMethod={api.verifyChapter.bind(api)} />
  </TopToolbar>
)

export const ChapterList = () => (
  <List sort={{ field: 'number', order: 'ASC' }}>
    <Datagrid rowClick="show" bulkActionButtons={<ChapterBulkActionButtons />}>
      <NumberField source="id" sortable />
      <NumberField source="number" label="Chapter #" sortable />
      <TextField source="title" sortable />
      <FunctionField
        label="Summary"
        render={(record: any) => (
          <Box sx={{ maxWidth: '400px' }}>
            <Typography
              variant="body2"
              sx={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                fontSize: '0.8rem',
                color: 'text.secondary',
                lineHeight: 1.3,
              }}
            >
              {record.summary || 'No summary'}
            </Typography>
          </Box>
        )}
      />
      <BooleanField source="isVerified" label="Verified" />
    </Datagrid>
  </List>
)

export const ChapterShow = () => (
  <Show actions={<ChapterShowActions />}>
    <Box sx={{ backgroundColor: '#0a0a0a', minHeight: '100vh', p: 3 }}>
      {/* Header */}
      <Card
        elevation={0}
        sx={{
          mb: 3,
          backgroundColor: '#0a0a0a',
          border: '2px solid #6366f1',
          borderRadius: 2,
          boxShadow: '0 0 30px rgba(99, 102, 241, 0.3)',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', p: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Box
              sx={{
                p: 1.5,
                borderRadius: 2,
                backgroundColor: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)',
              }}
            >
              <Hash size={32} color="white" />
            </Box>
            <Box sx={{ flex: 1 }}>
              <FunctionField
                render={(record: any) => (
                  <Typography
                    variant="h4"
                    sx={{ fontWeight: 'bold', color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}
                  >
                    Chapter {record.number}
                  </Typography>
                )}
              />
              <FunctionField
                render={(record: any) =>
                  record.title ? (
                    <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.85)', mt: 0.5 }}>
                      {record.title}
                    </Typography>
                  ) : null
                }
              />
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                ID: <TextField source="id" sx={{ '& span': { color: 'white', fontWeight: 'bold' } }} />
              </Typography>
            </Box>
          </Box>
        </Box>
      </Card>

      <TabbedShowLayout
        sx={{
          backgroundColor: '#0a0a0a',
          '& .RaTabbedShowLayout-content': {
            backgroundColor: '#0a0a0a',
            border: '2px solid #6366f1',
            borderRadius: 2,
            borderTop: 'none',
            p: 0,
          },
          '& .MuiTabs-root': {
            backgroundColor: '#0a0a0a',
            border: '2px solid #6366f1',
            borderBottom: 'none',
            borderRadius: '8px 8px 0 0',
            '& .MuiTab-root': {
              color: 'rgba(255, 255, 255, 0.7)',
              fontWeight: 600,
              textTransform: 'none',
              minHeight: 48,
              '&.Mui-selected': { color: '#6366f1', backgroundColor: 'rgba(99, 102, 241, 0.1)' },
              '&:hover': { color: '#6366f1', backgroundColor: 'rgba(99, 102, 241, 0.05)' },
            },
            '& .MuiTabs-indicator': { backgroundColor: '#6366f1', height: 3 },
          },
        }}
      >
        <Tab label="Overview">
          <Box sx={{ p: 4, backgroundColor: '#0a0a0a' }}>
            <Typography variant="h6" gutterBottom sx={{ color: '#ffffff', fontWeight: 'bold', mb: 3 }}>
              Chapter Summary
            </Typography>
            <FunctionField
              source="summary"
              render={(record: any) =>
                record.summary ? (
                  <Box
                    sx={{
                      p: 3,
                      bgcolor: '#0f0f0f',
                      borderRadius: 2,
                      border: '2px solid rgba(99, 102, 241, 0.3)',
                    }}
                  >
                    <Typography sx={{ color: '#ffffff', lineHeight: 1.7 }}>
                      {record.summary}
                    </Typography>
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    No summary available
                  </Typography>
                )
              }
            />
          </Box>
        </Tab>
      </TabbedShowLayout>
    </Box>
  </Show>
)

export const ChapterEdit = () => (
  <Edit>
    <SimpleForm
      toolbar={
        <EditToolbar
          resource="chapters"
          confirmTitle="Delete Chapter"
          confirmMessage="Are you sure you want to delete this chapter? This cannot be undone."
        />
      }
    >
      <Box sx={{ backgroundColor: '#0a0a0a', width: '100%', p: 3 }}>
        <Card
          elevation={0}
          sx={{
            maxWidth: '1000px',
            mx: 'auto',
            backgroundColor: '#0a0a0a',
            border: '2px solid #6366f1',
            borderRadius: 2,
            boxShadow: '0 0 30px rgba(99, 102, 241, 0.2)',
          }}
        >
          <Box sx={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', p: 3, color: 'white' }}>
            <Typography
              variant="h4"
              sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 2 }}
            >
              <Edit3 size={32} />
              Edit Chapter
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9, mt: 1 }}>
              Update chapter information and details
            </Typography>
          </Box>

          <CardContent sx={{ p: 4 }}>
            <Box
              sx={{
                '& .MuiTextField-root': {
                  mb: 3,
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#0f0f0f',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    '&:hover': { borderColor: 'rgba(99, 102, 241, 0.5)' },
                    '&.Mui-focused': { borderColor: '#6366f1' },
                    '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                  },
                  '& .MuiInputLabel-root': {
                    color: 'rgba(255, 255, 255, 0.7)',
                    '&.Mui-focused': { color: '#6366f1' },
                  },
                  '& .MuiInputBase-input': { color: '#ffffff' },
                },
                '& .MuiFormControl-root': { mb: 3 },
              }}
            >
              <Box
                sx={{
                  p: 3,
                  backgroundColor: 'rgba(99, 102, 241, 0.05)',
                  borderRadius: 2,
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                  mb: 3,
                }}
              >
                <Typography variant="h6" sx={{ color: '#6366f1', mb: 2, fontWeight: 'bold' }}>
                  Basic Information
                </Typography>
                <ChapterNumberInput isEdit={true} />
                <TextInput
                  source="title"
                  fullWidth
                  label="Title"
                  helperText="Chapter title (optional)"
                />
                <TextInput
                  source="summary"
                  multiline
                  rows={5}
                  fullWidth
                  label="Summary"
                  helperText="Brief summary of this chapter's content"
                />
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </SimpleForm>
  </Edit>
)

export const ChapterCreate = () => (
  <Create>
    <SimpleForm>
      <Box sx={{ backgroundColor: '#0a0a0a', width: '100%', p: 3 }}>
        <Card
          elevation={0}
          sx={{
            maxWidth: '1000px',
            mx: 'auto',
            backgroundColor: '#0a0a0a',
            border: '2px solid #16a34a',
            borderRadius: 2,
            boxShadow: '0 0 30px rgba(22, 163, 74, 0.2)',
          }}
        >
          <Box
            sx={{ background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)', p: 3, color: 'white' }}
          >
            <Typography
              variant="h4"
              sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 2 }}
            >
              <Plus size={32} />
              Create New Chapter
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9, mt: 1 }}>
              Add a new chapter to the system
            </Typography>
          </Box>

          <CardContent sx={{ p: 4 }}>
            <Box
              sx={{
                '& .MuiTextField-root': {
                  mb: 3,
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#0f0f0f',
                    border: '1px solid rgba(22, 163, 74, 0.3)',
                    '&:hover': { borderColor: 'rgba(22, 163, 74, 0.5)' },
                    '&.Mui-focused': { borderColor: '#16a34a' },
                    '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                  },
                  '& .MuiInputLabel-root': {
                    color: 'rgba(255, 255, 255, 0.7)',
                    '&.Mui-focused': { color: '#16a34a' },
                  },
                  '& .MuiInputBase-input': { color: '#ffffff' },
                },
                '& .MuiFormControl-root': { mb: 3 },
              }}
            >
              <Box
                sx={{
                  p: 3,
                  backgroundColor: 'rgba(22, 163, 74, 0.05)',
                  borderRadius: 2,
                  border: '1px solid rgba(22, 163, 74, 0.2)',
                  mb: 3,
                }}
              >
                <Typography variant="h6" sx={{ color: '#16a34a', mb: 2, fontWeight: 'bold' }}>
                  Basic Information
                </Typography>
                <ChapterNumberInput />
                <TextInput
                  source="title"
                  fullWidth
                  label="Title"
                  helperText="Chapter title (optional)"
                />
                <TextInput
                  source="summary"
                  multiline
                  rows={5}
                  fullWidth
                  label="Summary"
                  helperText="Brief summary of this chapter's content"
                />
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </SimpleForm>
  </Create>
)
