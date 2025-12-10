import React from 'react'
import {
  List,
  Datagrid,
  TextField,
  ArrayField,
  ChipField,
  SingleFieldList,
  Edit,
  Create,
  Show,
  SimpleForm,
  TextInput,
  ArrayInput,
  SimpleFormIterator,
  SimpleShowLayout,
  NumberInput,
  NumberField,
  ReferenceArrayInput,
  AutocompleteArrayInput,
  ReferenceArrayField,
  FunctionField
} from 'react-admin'
import { Box, Card, CardContent, Typography, Grid, Chip } from '@mui/material'
import { User, Edit3, Plus } from 'lucide-react'
import EnhancedSpoilerMarkdown from '../EnhancedSpoilerMarkdown'
import { EditToolbar } from './EditToolbar'

export const CharacterList = () => (
  <List sort={{ field: 'name', order: 'ASC' }}>
    <Datagrid rowClick="show">
      <TextField source="id" sortable />
      <TextField source="name" sortable />
      <NumberField source="firstAppearanceChapter" label="First Chapter" sortable />
      <FunctionField
        label="Alternate Names"
        render={(record: any) => (
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', maxWidth: '200px' }}>
            {(record.alternateNames || []).slice(0, 3).map((name: string, index: number) => (
              <Chip
                key={index}
                label={name}
                size="small"
                sx={{
                  backgroundColor: 'rgba(25, 118, 210, 0.1)',
                  color: '#1976d2',
                  fontSize: '0.75rem',
                  height: '24px'
                }}
              />
            ))}
            {(record.alternateNames || []).length > 3 && (
              <Chip
                label={`+${record.alternateNames.length - 3}`}
                size="small"
                sx={{
                  backgroundColor: 'rgba(158, 158, 158, 0.1)',
                  color: '#9e9e9e',
                  fontSize: '0.75rem',
                  height: '24px'
                }}
              />
            )}
          </Box>
        )}
      />
      <ArrayField source="organizations" label="Organizations">
        <SingleFieldList linkType={false}>
          <ChipField source="name" size="small" />
        </SingleFieldList>
      </ArrayField>
    </Datagrid>
  </List>
)

export const CharacterShow = () => (
  <Show>
    <SimpleShowLayout>
      <TextField source="id" />
      <TextField source="name" />
      <FunctionField 
        label="Description" 
        render={(record: any) => 
          record.description ? (
            <EnhancedSpoilerMarkdown
              content={record.description}
              className="admin-description"
              enableEntityEmbeds={true}
              compactEntityCards={true}
            />
          ) : (
            <Typography variant="body2" color="text.secondary">
              No description
            </Typography>
          )
        }
      />
      <NumberField source="firstAppearanceChapter" />
      <FunctionField 
        label="Alternate Names" 
        render={(record: any) => (
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {(record.alternateNames || []).map((name: string, index: number) => (
              <Chip
                key={index}
                label={name}
                size="small"
                sx={{
                  backgroundColor: 'rgba(25, 118, 210, 0.1)',
                  color: '#1976d2',
                  fontSize: '0.75rem'
                }}
              />
            ))}
          </Box>
        )}
      />
      <ArrayField source="organizations" label="Organizations">
        <SingleFieldList linkType={false}>
          <ChipField source="name" />
        </SingleFieldList>
      </ArrayField>
    </SimpleShowLayout>
  </Show>
)

export const CharacterEdit = () => (
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
          border: '2px solid #1976d2',
          borderRadius: 2,
          boxShadow: '0 0 30px rgba(25, 118, 210, 0.2)'
        }}
      >
        {/* Header */}
        <Box sx={{
          background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
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
            Edit Character
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.9, mt: 1 }}>
            Update character information and details
          </Typography>
        </Box>

        <CardContent sx={{ p: 4 }}>
          <SimpleForm 
            toolbar={
              <EditToolbar 
                resource="characters"
                confirmTitle="Delete Character"
                confirmMessage="Are you sure you want to delete this character? This will remove all associated data and cannot be undone."
              />
            }
            sx={{
              '& .MuiTextField-root': {
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#0f0f0f',
                  border: '1px solid rgba(25, 118, 210, 0.3)',
                  '&:hover': {
                    borderColor: 'rgba(25, 118, 210, 0.5)'
                  },
                  '&.Mui-focused': {
                    borderColor: '#1976d2'
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    border: 'none'
                  }
                },
                '& .MuiInputLabel-root': {
                  color: 'rgba(255, 255, 255, 0.7)',
                  '&.Mui-focused': {
                    color: '#1976d2'
                  }
                },
                '& .MuiInputBase-input': {
                  color: '#ffffff'
                }
              },
              '& .MuiFormControl-root': {
                mb: 3
              }
            }}
          >
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Box sx={{ 
                  p: 3, 
                  backgroundColor: 'rgba(25, 118, 210, 0.05)', 
                  borderRadius: 2, 
                  border: '1px solid rgba(25, 118, 210, 0.2)',
                  mb: 3
                }}>
                  <Typography variant="h6" sx={{ color: '#1976d2', mb: 2, fontWeight: 'bold' }}>
                    Basic Information
                  </Typography>
                  <TextInput source="name" required fullWidth />
                  <TextInput 
                    source="description" 
                    multiline 
                    rows={4} 
                    fullWidth 
                    helperText="Supports Markdown formatting (bold, italic, lists, links, etc.)"
                  />
                  <NumberInput source="firstAppearanceChapter" max={539} min={1} fullWidth />
                </Box>
              </Grid>

              <Grid item xs={12} md={6}>
                <Box sx={{ 
                  p: 3, 
                  backgroundColor: 'rgba(245, 124, 0, 0.05)', 
                  borderRadius: 2, 
                  border: '1px solid rgba(245, 124, 0, 0.2)'
                }}>
                  <Typography variant="h6" sx={{ color: '#f57c00', mb: 2, fontWeight: 'bold' }}>
                    Additional Details
                  </Typography>
                  <ArrayInput source="alternateNames">
                    <SimpleFormIterator>
                      <TextInput source="" label="Alternate Name" fullWidth />
                    </SimpleFormIterator>
                  </ArrayInput>
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
                    Relations
                  </Typography>
                  <ReferenceArrayInput source="organizationIds" reference="organizations" label="Organizations">
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

export const CharacterCreate = () => (
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
          border: '2px solid #1976d2',
          borderRadius: 2,
          boxShadow: '0 0 30px rgba(25, 118, 210, 0.2)'
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
            Create New Character
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.9, mt: 1 }}>
            Add a new character to the system
          </Typography>
        </Box>

        <CardContent sx={{ p: 4 }}>
          <SimpleForm sx={{
            '& .MuiTextField-root': {
              mb: 3,
              '& .MuiOutlinedInput-root': {
                backgroundColor: '#0f0f0f',
                border: '1px solid rgba(25, 118, 210, 0.3)',
                '&:hover': {
                  borderColor: 'rgba(25, 118, 210, 0.5)'
                },
                '&.Mui-focused': {
                  borderColor: '#1976d2'
                },
                '& .MuiOutlinedInput-notchedOutline': {
                  border: 'none'
                }
              },
              '& .MuiInputLabel-root': {
                color: 'rgba(255, 255, 255, 0.7)',
                '&.Mui-focused': {
                  color: '#1976d2'
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
                  backgroundColor: 'rgba(25, 118, 210, 0.05)', 
                  borderRadius: 2, 
                  border: '1px solid rgba(25, 118, 210, 0.2)',
                  mb: 3
                }}>
                  <Typography variant="h6" sx={{ color: '#1976d2', mb: 2, fontWeight: 'bold' }}>
                    Basic Information
                  </Typography>
                  <TextInput source="name" required fullWidth />
                  <TextInput 
                    source="description" 
                    multiline 
                    rows={4} 
                    fullWidth 
                    helperText="Supports Markdown formatting (bold, italic, lists, links, etc.)"
                  />
                  <NumberInput source="firstAppearanceChapter" max={539} min={1} fullWidth />
                </Box>
              </Grid>

              <Grid item xs={12} md={6}>
                <Box sx={{ 
                  p: 3, 
                  backgroundColor: 'rgba(245, 124, 0, 0.05)', 
                  borderRadius: 2, 
                  border: '1px solid rgba(245, 124, 0, 0.2)'
                }}>
                  <Typography variant="h6" sx={{ color: '#f57c00', mb: 2, fontWeight: 'bold' }}>
                    Additional Details
                  </Typography>
                  <ArrayInput source="alternateNames">
                    <SimpleFormIterator>
                      <TextInput source="" label="Alternate Name" fullWidth />
                    </SimpleFormIterator>
                  </ArrayInput>
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
                    Relations
                  </Typography>
                  <ReferenceArrayInput source="organizationIds" reference="organizations" label="Organizations">
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
  </Create>
)
