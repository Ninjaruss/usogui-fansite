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
  FunctionField,
  TabbedShowLayout,
  Tab,
  ReferenceManyField,
  SingleFieldList,
  ChipField
} from 'react-admin'
import { Typography, Box, Card, CardContent, Grid } from '@mui/material'
import { Edit3, Plus, Users, Building2 } from 'lucide-react'
import EnhancedSpoilerMarkdown from '../EnhancedSpoilerMarkdown'
import { EditToolbar } from './EditToolbar'

export const OrganizationList = () => (
  <List sort={{ field: 'name', order: 'ASC' }}>
    <Datagrid rowClick="show">
      <TextField source="id" sortable />
      <TextField source="name" sortable />
      <FunctionField
        label="Description"
        render={(record: any) => (
          <Typography
            variant="body2"
            sx={{
              maxWidth: '400px',
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
        )}
      />
    </Datagrid>
  </List>
)

export const OrganizationShow = () => (
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
          border: '2px solid #7c3aed',
          borderRadius: 2,
          boxShadow: '0 0 30px rgba(124, 58, 237, 0.3)',
          overflow: 'hidden'
        }}
      >
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
              <Building2 size={32} color="white" />
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
              <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                Organization
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                ID: <TextField source="id" sx={{ '& span': { color: 'white', fontWeight: 'bold' } }} />
              </Typography>
            </Box>
          </Box>
        </Box>
      </Card>

      <TabbedShowLayout sx={{
        backgroundColor: '#0a0a0a',
        '& .RaTabbedShowLayout-content': {
          backgroundColor: '#0a0a0a',
          border: '2px solid #7c3aed',
          borderRadius: 2,
          borderTop: 'none',
          p: 0
        },
        '& .MuiTabs-root': {
          backgroundColor: '#0a0a0a',
          border: '2px solid #7c3aed',
          borderBottom: 'none',
          borderRadius: '8px 8px 0 0',
          '& .MuiTab-root': {
            color: 'rgba(255, 255, 255, 0.7)',
            fontWeight: 600,
            textTransform: 'none',
            minHeight: 48,
            '&.Mui-selected': {
              color: '#7c3aed',
              backgroundColor: 'rgba(124, 58, 237, 0.1)'
            },
            '&:hover': {
              color: '#7c3aed',
              backgroundColor: 'rgba(124, 58, 237, 0.05)'
            }
          },
          '& .MuiTabs-indicator': {
            backgroundColor: '#7c3aed',
            height: 3
          }
        }
      }}>
        <Tab label="Overview">
          <Box sx={{ p: 4, backgroundColor: '#0a0a0a' }}>
            <Typography variant="h6" gutterBottom sx={{ color: '#ffffff', fontWeight: 'bold', mb: 3 }}>
              Organization Description
            </Typography>
            <FunctionField
              source="description"
              render={(record: any) =>
                record.description ? (
                  <Box sx={{
                    p: 3,
                    bgcolor: '#0f0f0f',
                    borderRadius: 2,
                    border: '2px solid rgba(124, 58, 237, 0.3)',
                    '& p': {
                      mb: 1.5,
                      lineHeight: 1.7,
                      fontSize: '1rem',
                      color: '#ffffff'
                    },
                    '& h1, & h2, & h3': {
                      color: '#7c3aed',
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

        <Tab label="Members">
          <Box sx={{ p: 4, backgroundColor: '#0a0a0a' }}>
            <Typography variant="h6" gutterBottom sx={{ color: '#ffffff', fontWeight: 'bold', mb: 3 }}>
              <Users size={20} style={{ display: 'inline', marginRight: '8px' }} />
              Organization Members
            </Typography>
            <ReferenceManyField
              reference="characters"
              target="organizationIds"
              label={false}
            >
              <Datagrid
                bulkActionButtons={false}
                rowClick="show"
                sx={{
                  boxShadow: 'none',
                  backgroundColor: '#0f0f0f',
                  border: '1px solid rgba(124, 58, 237, 0.3)',
                  borderRadius: 2,
                  '& .MuiTableCell-root': {
                    color: '#ffffff',
                    borderColor: 'rgba(255, 255, 255, 0.1)'
                  },
                  '& .MuiTableHead-root .MuiTableCell-root': {
                    backgroundColor: 'rgba(124, 58, 237, 0.1)',
                    fontWeight: 'bold'
                  }
                }}
              >
                <TextField source="name" label="Character Name" sx={{ fontWeight: 500, color: '#ffffff' }} />
                <TextField source="firstAppearanceChapter" label="First Appearance" sx={{ color: '#ffffff' }} />
              </Datagrid>
            </ReferenceManyField>
          </Box>
        </Tab>
      </TabbedShowLayout>
    </Box>
  </Show>
)

export const OrganizationEdit = () => (
  <Edit>
    <SimpleForm
      toolbar={
        <EditToolbar
          resource="organizations"
          confirmTitle="Delete Organization"
          confirmMessage="Are you sure you want to delete this organization? This action cannot be undone."
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
            border: '2px solid #7c3aed',
            borderRadius: 2,
            boxShadow: '0 0 30px rgba(124, 58, 237, 0.2)'
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
              <Edit3 size={32} />
              Edit Organization
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9, mt: 1 }}>
              Update organization information
            </Typography>
          </Box>

          <CardContent sx={{ p: 4 }}>
            <Box sx={{
              '& .MuiTextField-root': {
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#0f0f0f',
                  border: '1px solid rgba(124, 58, 237, 0.3)',
                  '&:hover': {
                    borderColor: 'rgba(124, 58, 237, 0.5)'
                  },
                  '&.Mui-focused': {
                    borderColor: '#7c3aed'
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    border: 'none'
                  }
                },
                '& .MuiInputLabel-root': {
                  color: 'rgba(255, 255, 255, 0.7)',
                  '&.Mui-focused': {
                    color: '#7c3aed'
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
                    backgroundColor: 'rgba(124, 58, 237, 0.05)',
                    borderRadius: 2,
                    border: '1px solid rgba(124, 58, 237, 0.2)'
                  }}>
                    <Typography variant="h6" sx={{ color: '#7c3aed', mb: 2, fontWeight: 'bold' }}>
                      Organization Details
                    </Typography>
                    <TextInput
                      source="name"
                      required
                      fullWidth
                      label="Organization Name"
                      helperText="Enter the name of this organization"
                    />
                    <TextInput
                      source="description"
                      multiline
                      rows={6}
                      fullWidth
                      label="Description"
                      helperText="Supports Markdown formatting (bold, italic, lists, links, etc.)"
                    />
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

export const OrganizationCreate = () => (
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
              Create New Organization
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9, mt: 1 }}>
              Add a new organization to the system
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
                    border: '1px solid rgba(22, 163, 74, 0.2)'
                  }}>
                    <Typography variant="h6" sx={{ color: '#16a34a', mb: 2, fontWeight: 'bold' }}>
                      Organization Details
                    </Typography>
                    <TextInput
                      source="name"
                      required
                      fullWidth
                      label="Organization Name"
                    />
                    <TextInput
                      source="description"
                      multiline
                      rows={6}
                      fullWidth
                      label="Description"
                      helperText="Supports Markdown formatting (bold, italic, lists, links, etc.)"
                    />
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
