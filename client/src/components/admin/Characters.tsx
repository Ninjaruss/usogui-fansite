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
  ReferenceArrayField
} from 'react-admin'
import { Box, Card, CardContent, Typography, Grid } from '@mui/material'
import { User, Edit3, Plus } from 'lucide-react'
import { EditToolbar } from './EditToolbar'

export const CharacterList = () => (
  <List>
    <Datagrid rowClick="show">
      <TextField source="id" />
      <TextField source="name" />
      <TextField source="occupation" />
      <NumberField source="firstAppearanceChapter" label="First Chapter" />
      <ArrayField source="alternateNames">
        <SingleFieldList linkType={false}>
          <ChipField source="" size="small" />
        </SingleFieldList>
      </ArrayField>
      <ArrayField source="factions" label="Factions">
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
      <TextField source="description" />
      <TextField source="occupation" />
      <NumberField source="firstAppearanceChapter" />
      <ArrayField source="alternateNames">
        <SingleFieldList linkType={false}>
          <ChipField source="" />
        </SingleFieldList>
      </ArrayField>
      <ArrayField source="notableRoles">
        <SingleFieldList linkType={false}>
          <ChipField source="" />
        </SingleFieldList>
      </ArrayField>
      <ArrayField source="notableGames">
        <SingleFieldList linkType={false}>
          <ChipField source="" />
        </SingleFieldList>
      </ArrayField>
      <ArrayField source="affiliations">
        <SingleFieldList linkType={false}>
          <ChipField source="" />
        </SingleFieldList>
      </ArrayField>
      <ArrayField source="factions" label="Factions">
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
                  <TextInput source="description" multiline rows={4} fullWidth />
                  <TextInput source="occupation" fullWidth />
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
                  <ArrayInput source="notableRoles">
                    <SimpleFormIterator>
                      <TextInput source="" label="Notable Role" fullWidth />
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
                    Game & Relations
                  </Typography>
                  <ArrayInput source="notableGames">
                    <SimpleFormIterator>
                      <TextInput source="" label="Notable Game" fullWidth />
                    </SimpleFormIterator>
                  </ArrayInput>
                  <ArrayInput source="affiliations">
                    <SimpleFormIterator>
                      <TextInput source="" label="Affiliation" fullWidth />
                    </SimpleFormIterator>
                  </ArrayInput>
                  <ReferenceArrayInput source="factions" reference="factions" label="Factions">
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
          <EditToolbar 
            resource="characters"
            confirmTitle="Delete Character"
            confirmMessage="Are you sure you want to delete this character? This will remove all associated data and cannot be undone."
          />
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
                  <TextInput source="description" multiline rows={4} fullWidth />
                  <TextInput source="occupation" fullWidth />
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
                  <ArrayInput source="notableRoles">
                    <SimpleFormIterator>
                      <TextInput source="" label="Notable Role" fullWidth />
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
                    Game & Relations
                  </Typography>
                  <ArrayInput source="notableGames">
                    <SimpleFormIterator>
                      <TextInput source="" label="Notable Game" fullWidth />
                    </SimpleFormIterator>
                  </ArrayInput>
                  <ArrayInput source="affiliations">
                    <SimpleFormIterator>
                      <TextInput source="" label="Affiliation" fullWidth />
                    </SimpleFormIterator>
                  </ArrayInput>
                  <ReferenceArrayInput source="factions" reference="factions" label="Factions">
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