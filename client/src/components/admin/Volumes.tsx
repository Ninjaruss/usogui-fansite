import React from 'react'
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
  WithRecord,
} from 'react-admin'
import { Typography, Chip, Box, Card, CardContent, Grid } from '@mui/material'
import { Edit3, Plus, BookOpen, Layers, Image as ImageIcon } from 'lucide-react'
import { EntityDisplayMediaSection } from './EntityDisplayMediaSection'
import { EditToolbar } from './EditToolbar'

const validateChapterRange = (values: any) => {
  const errors: any = {}
  if (values.startChapter && values.endChapter && values.startChapter > values.endChapter) {
    errors.endChapter = 'End chapter must be >= start chapter'
  }
  return errors
}

const VolumeBulkActionButtons = () => (
  <>
    <BulkDeleteButton mutationMode="pessimistic" />
  </>
)

export const VolumeList = () => (
  <List sort={{ field: 'number', order: 'ASC' }}>
    <Datagrid rowClick="show" bulkActionButtons={<VolumeBulkActionButtons />}>
      <NumberField source="id" sortable />
      <NumberField source="number" label="Volume #" sortable />
      <NumberField source="startChapter" label="Start Ch." sortable />
      <NumberField source="endChapter" label="End Ch." sortable />
      <FunctionField
        label="Chapter Range"
        render={(record: any) => (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              label={`Ch. ${record.startChapter} - ${record.endChapter}`}
              size="small"
              sx={{
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                color: '#6366f1',
                fontWeight: '500',
                fontSize: '0.75rem',
              }}
            />
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              ({record.endChapter - record.startChapter + 1} chapters)
            </Typography>
          </Box>
        )}
      />
      <FunctionField
        label="Description"
        render={(record: any) => (
          <Box sx={{ maxWidth: '350px' }}>
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
              {record.description || 'No description'}
            </Typography>
          </Box>
        )}
      />
    </Datagrid>
  </List>
)

export const VolumeShow = () => (
  <Show>
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
              <BookOpen size={32} color="white" />
            </Box>
            <Box sx={{ flex: 1 }}>
              <FunctionField
                render={(record: any) => (
                  <Typography
                    variant="h4"
                    sx={{ fontWeight: 'bold', color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}
                  >
                    Volume {record.number}
                  </Typography>
                )}
              />
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', mt: 1 }}>
                <Chip
                  icon={<Layers size={16} />}
                  label={
                    <FunctionField
                      render={(record: any) =>
                        `Chapters ${record.startChapter} - ${record.endChapter}`
                      }
                    />
                  }
                  sx={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 'bold' }}
                />
                <FunctionField
                  render={(record: any) => (
                    <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                      ({record.endChapter - record.startChapter + 1} chapters)
                    </Typography>
                  )}
                />
              </Box>
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
              Volume Description
            </Typography>
            <FunctionField
              source="description"
              render={(record: any) =>
                record.description ? (
                  <Box
                    sx={{
                      p: 3,
                      bgcolor: '#0f0f0f',
                      borderRadius: 2,
                      border: '2px solid rgba(99, 102, 241, 0.3)',
                    }}
                  >
                    <Typography sx={{ color: '#ffffff', lineHeight: 1.7 }}>
                      {record.description}
                    </Typography>
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    No description available
                  </Typography>
                )
              }
            />
          </Box>
        </Tab>

        <Tab label="Media">
          <WithRecord
            render={(record) => (
              <EntityDisplayMediaSection
                ownerType="volume"
                ownerId={record.id}
                accentColor="#6366f1"
                usageType="volume_image"
              />
            )}
          />
        </Tab>

        <Tab label="Showcase Images">
          <WithRecord
            render={(record) => (
              <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <Box>
                  <Typography variant="h6" sx={{ color: '#6366f1', fontWeight: 'bold', mb: 1 }}>
                    Background Image
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mb: 2 }}>
                    Full-width background used in the homepage volume showcase.
                  </Typography>
                  <EntityDisplayMediaSection
                    ownerType="volume"
                    ownerId={record.id}
                    accentColor="#6366f1"
                    usageType="volume_showcase_background"
                  />
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ color: '#6366f1', fontWeight: 'bold', mb: 1 }}>
                    Popout Image
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mb: 2 }}>
                    Foreground popout image used in the homepage volume showcase.
                  </Typography>
                  <EntityDisplayMediaSection
                    ownerType="volume"
                    ownerId={record.id}
                    accentColor="#6366f1"
                    usageType="volume_showcase_popout"
                  />
                </Box>
              </Box>
            )}
          />
        </Tab>
      </TabbedShowLayout>
    </Box>
  </Show>
)

export const VolumeEdit = () => (
  <Edit>
    <SimpleForm
      validate={validateChapterRange}
      toolbar={
        <EditToolbar
          resource="volumes"
          confirmTitle="Delete Volume"
          confirmMessage="Are you sure you want to delete this volume? This cannot be undone."
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
              Edit Volume
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9, mt: 1 }}>
              Update volume information and details
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
              <Grid container spacing={3}>
                <Grid item xs={12}>
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
                    <NumberInput
                      source="number"
                      required
                      fullWidth
                      min={1}
                      label="Volume Number"
                      helperText="The volume number (e.g. 1, 2, 3...)"
                    />
                    <TextInput
                      source="description"
                      multiline
                      rows={4}
                      fullWidth
                      label="Description"
                      helperText="Brief description of this volume's content"
                    />
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Box
                    sx={{
                      p: 3,
                      backgroundColor: 'rgba(25, 118, 210, 0.05)',
                      borderRadius: 2,
                      border: '1px solid rgba(25, 118, 210, 0.2)',
                    }}
                  >
                    <Typography variant="h6" sx={{ color: '#1976d2', mb: 2, fontWeight: 'bold' }}>
                      Chapter Range
                    </Typography>
                    <NumberInput
                      source="startChapter"
                      required
                      fullWidth
                      min={1}
                      max={539}
                      label="Start Chapter"
                      helperText="First chapter of this volume (1-539)"
                    />
                    <NumberInput
                      source="endChapter"
                      required
                      fullWidth
                      min={1}
                      max={539}
                      label="End Chapter"
                      helperText="Last chapter of this volume (1-539)"
                    />
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Box
                    sx={{
                      p: 3,
                      backgroundColor: 'rgba(16, 185, 129, 0.05)',
                      borderRadius: 2,
                      border: '1px solid rgba(16, 185, 129, 0.2)',
                    }}
                  >
                    <Typography variant="h6" sx={{ color: '#10b981', mb: 2, fontWeight: 'bold' }}>
                      Volume Statistics
                    </Typography>
                    <Box
                      sx={{
                        p: 2,
                        backgroundColor: 'rgba(99, 102, 241, 0.1)',
                        borderRadius: 2,
                        border: '1px solid rgba(99, 102, 241, 0.3)',
                      }}
                    >
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Total Chapters
                      </Typography>
                      <FunctionField
                        render={(record: any) => (
                          <Typography variant="h5" sx={{ color: '#6366f1', fontWeight: 'bold' }}>
                            {record.endChapter && record.startChapter
                              ? record.endChapter - record.startChapter + 1
                              : '-'}
                          </Typography>
                        )}
                      />
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </SimpleForm>
  </Edit>
)

export const VolumeCreate = () => (
  <Create>
    <SimpleForm validate={validateChapterRange}>
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
              Create New Volume
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9, mt: 1 }}>
              Add a new manga volume to the system
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
              <Grid container spacing={3}>
                <Grid item xs={12}>
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
                    <NumberInput
                      source="number"
                      required
                      fullWidth
                      min={1}
                      label="Volume Number"
                      helperText="The volume number (e.g. 1, 2, 3...)"
                    />
                    <TextInput
                      source="description"
                      multiline
                      rows={4}
                      fullWidth
                      label="Description"
                      helperText="Brief description of this volume's content"
                    />
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <Box
                    sx={{
                      p: 3,
                      backgroundColor: 'rgba(25, 118, 210, 0.05)',
                      borderRadius: 2,
                      border: '1px solid rgba(25, 118, 210, 0.2)',
                    }}
                  >
                    <Typography variant="h6" sx={{ color: '#1976d2', mb: 2, fontWeight: 'bold' }}>
                      Chapter Range
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <NumberInput
                          source="startChapter"
                          required
                          fullWidth
                          min={1}
                          max={539}
                          label="Start Chapter"
                          helperText="First chapter (1-539)"
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <NumberInput
                          source="endChapter"
                          required
                          fullWidth
                          min={1}
                          max={539}
                          label="End Chapter"
                          helperText="Last chapter (1-539)"
                        />
                      </Grid>
                    </Grid>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </SimpleForm>
  </Create>
)
