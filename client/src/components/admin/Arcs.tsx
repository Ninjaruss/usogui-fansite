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
  ReferenceManyField
} from 'react-admin'
import { Typography, Chip, Box, Card, CardContent, Grid } from '@mui/material'
import { Edit3, Plus, BookOpen, Layers } from 'lucide-react'
import EnhancedSpoilerMarkdown from '../EnhancedSpoilerMarkdown'
import { EditToolbar } from './EditToolbar'

export const ArcList = () => (
  <List sort={{ field: 'startChapter', order: 'ASC' }}>
    <Datagrid rowClick="show">
      <TextField source="id" sortable />
      <TextField source="name" sortable />
      <NumberField source="startChapter" sortable />
      <NumberField source="endChapter" sortable />
      <FunctionField
        label="Chapter Range"
        render={(record: any) => (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              label={`Ch. ${record.startChapter} - ${record.endChapter}`}
              size="small"
              sx={{
                backgroundColor: 'rgba(255, 152, 0, 0.1)',
                color: '#ff9800',
                fontWeight: '500',
                fontSize: '0.75rem'
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
          <Box sx={{ maxWidth: '300px' }}>
            <Typography
              variant="body2"
              sx={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                fontSize: '0.8rem',
                color: 'text.secondary',
                lineHeight: 1.3
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

export const ArcShow = () => (
  <Show>
    <Box sx={{
      backgroundColor: '#0a0a0a',
      minHeight: '100vh',
      p: 3,
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
          border: '2px solid #ff9800',
          borderRadius: 2,
          boxShadow: '0 0 30px rgba(255, 152, 0, 0.3)',
          overflow: 'hidden'
        }}
      >
        <Box sx={{
          background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
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
              <BookOpen size={32} color="white" />
            </Box>
            <Box sx={{ flex: 1 }}>
              <TextField
                source="name"
                sx={{
                  mb: 1,
                  '& .MuiTypography-root': {
                    fontSize: '2rem',
                    fontWeight: 'bold',
                    color: 'white',
                    textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                  }
                }}
              />
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Chip
                  icon={<Layers size={16} />}
                  label={
                    <FunctionField
                      render={(record: any) =>
                        `Chapters ${record.startChapter} - ${record.endChapter}`
                      }
                    />
                  }
                  sx={{
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '0.9rem'
                  }}
                />
                <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                  <FunctionField
                    render={(record: any) =>
                      `(${record.endChapter - record.startChapter + 1} chapters total)`
                    }
                  />
                </Typography>
              </Box>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                Arc ID: <TextField source="id" sx={{ '& span': { color: 'white', fontWeight: 'bold' } }} />
              </Typography>
            </Box>
          </Box>
        </Box>
      </Card>

      <TabbedShowLayout sx={{
        backgroundColor: '#0a0a0a',
        '& .RaTabbedShowLayout-content': {
          backgroundColor: '#0a0a0a',
          border: '2px solid #ff9800',
          borderRadius: 2,
          borderTop: 'none',
          p: 0
        },
        '& .MuiTabs-root': {
          backgroundColor: '#0a0a0a',
          border: '2px solid #ff9800',
          borderBottom: 'none',
          borderRadius: '8px 8px 0 0',
          '& .MuiTab-root': {
            color: 'rgba(255, 255, 255, 0.7)',
            fontWeight: 600,
            textTransform: 'none',
            minHeight: 48,
            '&.Mui-selected': {
              color: '#ff9800',
              backgroundColor: 'rgba(255, 152, 0, 0.1)'
            },
            '&:hover': {
              color: '#ff9800',
              backgroundColor: 'rgba(255, 152, 0, 0.05)'
            }
          },
          '& .MuiTabs-indicator': {
            backgroundColor: '#ff9800',
            height: 3
          }
        }
      }}>
        <Tab label="Overview">
          <Box sx={{ p: 4, backgroundColor: '#0a0a0a' }}>
            <Typography variant="h6" gutterBottom sx={{ color: '#ffffff', fontWeight: 'bold', mb: 3 }}>
              Arc Description
            </Typography>
            <FunctionField
              source="description"
              render={(record: any) =>
                record.description ? (
                  <Box sx={{
                    p: 3,
                    bgcolor: '#0f0f0f',
                    borderRadius: 2,
                    border: '2px solid rgba(255, 152, 0, 0.3)',
                    '& p': {
                      mb: 1.5,
                      lineHeight: 1.7,
                      fontSize: '1rem',
                      color: '#ffffff'
                    },
                    '& h1, & h2, & h3': {
                      color: '#ff9800',
                      fontWeight: 'bold',
                      mb: 2
                    }
                  }}>
                    <EnhancedSpoilerMarkdown
                      content={record.description}
                      className="admin-description"
                      enableEntityEmbeds={true}
                      compactEntityCards={true}
                    />
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

        <Tab label="Related Content">
          <Box sx={{ p: 4, backgroundColor: '#0a0a0a' }}>
            <Typography variant="h6" gutterBottom sx={{ color: '#ffffff', fontWeight: 'bold', mb: 3 }}>
              Events in this Arc
            </Typography>
            <ReferenceManyField
              reference="events"
              target="arcId"
              label={false}
            >
              <Datagrid
                bulkActionButtons={false}
                rowClick="show"
                sx={{
                  boxShadow: 'none',
                  backgroundColor: '#0f0f0f',
                  border: '1px solid rgba(255, 152, 0, 0.3)',
                  borderRadius: 2,
                  '& .MuiTableCell-root': {
                    color: '#ffffff',
                    borderColor: 'rgba(255, 255, 255, 0.1)'
                  },
                  '& .MuiTableHead-root .MuiTableCell-root': {
                    backgroundColor: 'rgba(255, 152, 0, 0.1)',
                    fontWeight: 'bold'
                  }
                }}
              >
                <TextField source="title" sx={{ fontWeight: 500, color: '#ffffff' }} />
                <TextField source="type" sx={{ textTransform: 'capitalize', color: '#ffffff' }} />
                <NumberField source="chapterNumber" label="Chapter" sx={{ color: '#ffffff' }} />
                <TextField source="status" sx={{ textTransform: 'capitalize', color: '#ffffff' }} />
              </Datagrid>
            </ReferenceManyField>
          </Box>
        </Tab>
      </TabbedShowLayout>
    </Box>
  </Show>
)

export const ArcEdit = () => (
  <Edit>
    <SimpleForm
      toolbar={
        <EditToolbar
          resource="arcs"
          confirmTitle="Delete Arc"
          confirmMessage="Are you sure you want to delete this arc? This will remove all associated data and cannot be undone."
        />
      }
    >
      <Box sx={{
        backgroundColor: '#0a0a0a',
        width: '100%',
        p: 3
      }}>
        <Card
          elevation={0}
          sx={{
            maxWidth: '1000px',
            mx: 'auto',
            backgroundColor: '#0a0a0a',
            border: '2px solid #ff9800',
            borderRadius: 2,
            boxShadow: '0 0 30px rgba(255, 152, 0, 0.2)'
          }}
        >
          {/* Header */}
          <Box sx={{
            background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
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
              Edit Arc
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9, mt: 1 }}>
              Update story arc information and details
            </Typography>
          </Box>

          <CardContent sx={{ p: 4 }}>
            <Box sx={{
              '& .MuiTextField-root': {
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#0f0f0f',
                  border: '1px solid rgba(255, 152, 0, 0.3)',
                  '&:hover': {
                    borderColor: 'rgba(255, 152, 0, 0.5)'
                  },
                  '&.Mui-focused': {
                    borderColor: '#ff9800'
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    border: 'none'
                  }
                },
                '& .MuiInputLabel-root': {
                  color: 'rgba(255, 255, 255, 0.7)',
                  '&.Mui-focused': {
                    color: '#ff9800'
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
                    backgroundColor: 'rgba(255, 152, 0, 0.05)',
                    borderRadius: 2,
                    border: '1px solid rgba(255, 152, 0, 0.2)',
                    mb: 3
                  }}>
                    <Typography variant="h6" sx={{ color: '#ff9800', mb: 2, fontWeight: 'bold' }}>
                      Basic Information
                    </Typography>
                    <TextInput
                      source="name"
                      required
                      fullWidth
                      label="Arc Name"
                      helperText="Enter the name of this story arc"
                    />
                    <TextInput
                      source="description"
                      multiline
                      rows={6}
                      fullWidth
                      label="Arc Description"
                      helperText="Supports Markdown formatting (bold, italic, lists, links, etc.)"
                    />
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Box sx={{
                    p: 3,
                    backgroundColor: 'rgba(25, 118, 210, 0.05)',
                    borderRadius: 2,
                    border: '1px solid rgba(25, 118, 210, 0.2)'
                  }}>
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
                      helperText="First chapter of this arc (1-539)"
                    />
                    <NumberInput
                      source="endChapter"
                      required
                      fullWidth
                      min={1}
                      max={539}
                      label="End Chapter"
                      helperText="Last chapter of this arc (1-539)"
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
                      Arc Statistics
                    </Typography>
                    <Box sx={{
                      p: 2,
                      backgroundColor: 'rgba(255, 152, 0, 0.1)',
                      borderRadius: 2,
                      border: '1px solid rgba(255, 152, 0, 0.3)'
                    }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Total Chapters
                      </Typography>
                      <FunctionField
                        render={(record: any) => (
                          <Typography variant="h5" sx={{ color: '#ff9800', fontWeight: 'bold' }}>
                            {record.endChapter && record.startChapter
                              ? record.endChapter - record.startChapter + 1
                              : '-'
                            }
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

export const ArcCreate = () => (
  <Create>
    <SimpleForm>
      <Box sx={{
        backgroundColor: '#0a0a0a',
        width: '100%',
        p: 3
      }}>
        <Card
          elevation={0}
          sx={{
            maxWidth: '1000px',
            mx: 'auto',
            backgroundColor: '#0a0a0a',
            border: '2px solid #16a34a',
            borderRadius: 2,
            boxShadow: '0 0 30px rgba(22, 163, 74, 0.2)'
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
              <Plus size={32} />
              Create New Arc
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9, mt: 1 }}>
              Add a new story arc to the system
            </Typography>
          </Box>

          <CardContent sx={{ p: 4 }}>
            <Box sx={{
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
                    backgroundColor: 'rgba(22, 163, 74, 0.05)',
                    borderRadius: 2,
                    border: '1px solid rgba(22, 163, 74, 0.2)',
                    mb: 3
                  }}>
                    <Typography variant="h6" sx={{ color: '#16a34a', mb: 2, fontWeight: 'bold' }}>
                      Basic Information
                    </Typography>
                    <TextInput source="name" required fullWidth label="Arc Name" />
                    <TextInput
                      source="description"
                      multiline
                      rows={6}
                      fullWidth
                      label="Arc Description"
                      helperText="Supports Markdown formatting (bold, italic, lists, links, etc.)"
                    />
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <Box sx={{
                    p: 3,
                    backgroundColor: 'rgba(25, 118, 210, 0.05)',
                    borderRadius: 2,
                    border: '1px solid rgba(25, 118, 210, 0.2)'
                  }}>
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
