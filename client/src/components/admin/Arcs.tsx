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
  ReferenceManyField,
  ReferenceField,
  ReferenceInput,
  AutocompleteInput,
  useGetList,
  SearchInput,
  BulkDeleteButton
} from 'react-admin'
import { Typography, Chip, Box, Card, CardContent, Grid, Tooltip } from '@mui/material'
import { Edit3, Plus, BookOpen, Layers, GitBranch } from 'lucide-react'
import EnhancedSpoilerMarkdown from '../EnhancedSpoilerMarkdown'
import { EditToolbar } from './EditToolbar'

// Component to show arc type with sub-arc count tooltip
const ArcTypeWithTooltip = ({ record }: { record: any }) => {
  // Fetch sub-arcs for this arc to get the count
  const { data: subArcs, isLoading } = useGetList(
    'arcs',
    {
      filter: { parentId: record.id },
      pagination: { page: 1, perPage: 100 },
    },
    { enabled: !record.parentId } // Only fetch for major arcs
  )

  const subArcCount = subArcs?.length || 0
  const isMajorArc = !record.parentId

  const tooltipContent = isMajorArc
    ? isLoading
      ? 'Loading sub-arcs...'
      : subArcCount > 0
        ? `${subArcCount} sub-arc${subArcCount !== 1 ? 's' : ''}: ${subArcs?.map(a => a.name).join(', ')}`
        : 'No sub-arcs'
    : 'This is a sub-arc'

  return (
    <Tooltip
      title={tooltipContent}
      arrow
      placement="top"
      slotProps={{
        tooltip: {
          sx: {
            bgcolor: '#1a1a1a',
            color: '#fff',
            fontSize: '0.75rem',
            maxWidth: 300,
            border: '1px solid rgba(255, 152, 0, 0.3)',
            '& .MuiTooltip-arrow': {
              color: '#1a1a1a',
            }
          }
        }
      }}
    >
      <Chip
        size="small"
        label={
          isMajorArc
            ? subArcCount > 0
              ? `Major Arc (${subArcCount})`
              : 'Major Arc'
            : 'Sub-Arc'
        }
        sx={{
          backgroundColor: record.parentId
            ? 'rgba(156, 39, 176, 0.1)'
            : 'rgba(255, 152, 0, 0.1)',
          color: record.parentId ? '#9c27b0' : '#ff9800',
          fontWeight: '500',
          fontSize: '0.7rem',
          cursor: 'pointer'
        }}
      />
    </Tooltip>
  )
}

// Component for parent arc input in edit mode
const ParentArcInput = () => {
  return (
    <ReferenceInput
      source="parentId"
      reference="arcs"
      label="Parent Arc"
    >
      <AutocompleteInput
        optionText="name"
        filterToQuery={(searchText: string) => ({ name: searchText })}
        helperText="Leave empty for top-level arc, or select a parent to make this a sub-arc. Do not select the current arc as its own parent."
        sx={{
          '& .MuiAutocomplete-root .MuiOutlinedInput-root': {
            backgroundColor: '#0f0f0f'
          }
        }}
      />
    </ReferenceInput>
  )
}

const arcFilters = [
  <SearchInput key="q" source="q" placeholder="Search arcs" alwaysOn />,
  <ReferenceInput key="parentId" source="parentId" reference="arcs" label="Parent Arc" alwaysOn>
    <AutocompleteInput optionText="name" />
  </ReferenceInput>,
  <NumberInput key="startChapter" source="startChapter_gte" label="Start Chapter from" min={1} max={539} />,
  <NumberInput key="endChapter" source="endChapter_lte" label="End Chapter to" min={1} max={539} />
]

const ArcBulkActionButtons = () => (
  <>
    <BulkDeleteButton mutationMode="pessimistic" />
  </>
)

export const ArcList = () => (
  <List sort={{ field: 'startChapter', order: 'ASC' }} filters={arcFilters}>
    <Datagrid rowClick="show" bulkActionButtons={<ArcBulkActionButtons />}>
      <TextField source="id" sortable />
      <TextField source="name" sortable />
      <FunctionField
        label="Type"
        render={(record: any) => <ArcTypeWithTooltip record={record} />}
      />
      <ReferenceField
        source="parentId"
        reference="arcs"
        label="Parent Arc"
        link="show"
        emptyText="—"
      >
        <FunctionField
          render={(record: any) => (
            <Chip
              size="small"
              icon={<GitBranch size={14} />}
              label={record?.name || 'Unknown'}
              sx={{
                backgroundColor: 'rgba(255, 152, 0, 0.1)',
                color: '#ff9800',
                fontWeight: '500',
                '& .MuiChip-icon': { color: '#ff9800' }
              }}
            />
          )}
        />
      </ReferenceField>
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
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                <FunctionField
                  render={(record: any) => (
                    <Chip
                      icon={record.parentId ? <GitBranch size={16} /> : undefined}
                      label={record.parentId ? 'Sub-Arc' : 'Major Arc'}
                      sx={{
                        backgroundColor: record.parentId
                          ? 'rgba(156, 39, 176, 0.3)'
                          : 'rgba(255,255,255,0.2)',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '0.9rem'
                      }}
                    />
                  )}
                />
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

        <Tab label="Hierarchy">
          <Box sx={{ p: 4, backgroundColor: '#0a0a0a' }}>
            {/* Parent Arc Section */}
            <Typography variant="h6" gutterBottom sx={{ color: '#ffffff', fontWeight: 'bold', mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
              <GitBranch size={20} color="#ff9800" />
              Parent Arc
            </Typography>
            <Box sx={{
              p: 3,
              bgcolor: '#0f0f0f',
              borderRadius: 2,
              border: '2px solid rgba(255, 152, 0, 0.3)',
              mb: 4
            }}>
              <ReferenceField
                source="parentId"
                reference="arcs"
                label=""
                link="show"
                emptyText=""
              >
                <FunctionField
                  render={(record: any) => (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <GitBranch size={20} color="#ff9800" />
                      <Typography sx={{ color: '#ff9800', fontWeight: 'bold' }}>
                        {record?.name}
                      </Typography>
                      {record?.startChapter && record?.endChapter && (
                        <Chip
                          size="small"
                          label={`Ch. ${record.startChapter} - ${record.endChapter}`}
                          sx={{
                            backgroundColor: 'rgba(255, 152, 0, 0.1)',
                            color: '#ff9800'
                          }}
                        />
                      )}
                    </Box>
                  )}
                />
              </ReferenceField>
              <FunctionField
                render={(record: any) =>
                  !record.parentId && (
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                      This is a top-level arc (no parent)
                    </Typography>
                  )
                }
              />
            </Box>

            {/* Sub-Arcs Section */}
            <Typography variant="h6" gutterBottom sx={{ color: '#ffffff', fontWeight: 'bold', mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
              <GitBranch size={20} color="#9c27b0" />
              Sub-Arcs
            </Typography>
            <ReferenceManyField
              reference="arcs"
              target="parentId"
              label={false}
            >
              <Datagrid
                bulkActionButtons={false}
                rowClick="show"
                empty={
                  <Box sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                      No sub-arcs
                    </Typography>
                  </Box>
                }
                sx={{
                  boxShadow: 'none',
                  backgroundColor: '#0f0f0f',
                  border: '1px solid rgba(156, 39, 176, 0.3)',
                  borderRadius: 2,
                  '& .MuiTableCell-root': {
                    color: '#ffffff',
                    borderColor: 'rgba(255, 255, 255, 0.1)'
                  },
                  '& .MuiTableHead-root .MuiTableCell-root': {
                    backgroundColor: 'rgba(156, 39, 176, 0.1)',
                    fontWeight: 'bold'
                  }
                }}
              >
                <TextField source="name" sx={{ fontWeight: 500, color: '#ffffff' }} />
                <NumberField source="order" label="Order" />
                <FunctionField
                  label="Chapter Range"
                  render={(record: any) => (
                    <Chip
                      size="small"
                      label={`Ch. ${record.startChapter || '?'} - ${record.endChapter || '?'}`}
                      sx={{
                        backgroundColor: 'rgba(156, 39, 176, 0.1)',
                        color: '#9c27b0'
                      }}
                    />
                  )}
                />
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

                <Grid item xs={12}>
                  <Box sx={{
                    p: 3,
                    backgroundColor: 'rgba(156, 39, 176, 0.05)',
                    borderRadius: 2,
                    border: '1px solid rgba(156, 39, 176, 0.2)',
                    mb: 3
                  }}>
                    <Typography variant="h6" sx={{ color: '#9c27b0', mb: 2, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                      <GitBranch size={20} />
                      Arc Hierarchy
                    </Typography>
                    <ParentArcInput />
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
                    backgroundColor: 'rgba(156, 39, 176, 0.05)',
                    borderRadius: 2,
                    border: '1px solid rgba(156, 39, 176, 0.2)',
                    mb: 3
                  }}>
                    <Typography variant="h6" sx={{ color: '#9c27b0', mb: 2, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                      <GitBranch size={20} />
                      Arc Hierarchy
                    </Typography>
                    <ReferenceInput
                      source="parentId"
                      reference="arcs"
                      label="Parent Arc"
                    >
                      <AutocompleteInput
                        optionText="name"
                        filterToQuery={(searchText: string) => ({ name: searchText })}
                        helperText="Leave empty for top-level arc, or select a parent to make this a sub-arc"
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
