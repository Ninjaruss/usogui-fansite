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
  FunctionField,
  ReferenceManyField,
  ReferenceField,
  WithRecord,
  SearchInput,
  ReferenceInput,
  AutocompleteInput,
  BulkDeleteButton
} from 'react-admin'
import { Box, Card, CardContent, Typography, Grid, Chip, Button as MuiButton, Divider } from '@mui/material'
import { Edit3, Plus, Users, ArrowRight, Building2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import EnhancedSpoilerMarkdown from '../EnhancedSpoilerMarkdown'
import { EditToolbar } from './EditToolbar'
import { RelationshipType } from '../../types'

// Color mapping for relationship types
const getRelationshipColor = (type: string) => {
  switch (type) {
    case 'ally': return '#22c55e'
    case 'rival': return '#f97316'
    case 'mentor': return '#8b5cf6'
    case 'subordinate': return '#06b6d4'
    case 'family': return '#ec4899'
    case 'partner': return '#ef4444'
    case 'enemy': return '#dc2626'
    case 'acquaintance': return '#6b7280'
    default: return '#9e9e9e'
  }
}

const characterFilters = [
  <SearchInput key="q" source="q" placeholder="Search characters" alwaysOn />,
  <ReferenceInput key="organizationId" source="organizationId" reference="organizations" label="Organization" alwaysOn>
    <AutocompleteInput optionText="name" />
  </ReferenceInput>,
  <NumberInput key="firstAppearanceFrom" source="firstAppearanceChapter_gte" label="First appearance from" min={1} max={539} />,
  <NumberInput key="firstAppearanceTo" source="firstAppearanceChapter_lte" label="First appearance to" min={1} max={539} />
]

const CharacterBulkActionButtons = () => (
  <>
    <BulkDeleteButton mutationMode="pessimistic" />
  </>
)

export const CharacterList = () => (
  <List sort={{ field: 'name', order: 'ASC' }} filters={characterFilters}>
    <Datagrid rowClick="show" bulkActionButtons={<CharacterBulkActionButtons />}>
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
      <FunctionField
        label="Organizations"
        render={(record: any) => (
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', maxWidth: '200px' }}>
            {(record.organizations || []).map((org: any) => (
              <Chip
                key={org.id}
                label={org.name}
                size="small"
                sx={{
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  color: '#10b981',
                  fontSize: '0.75rem',
                  height: '24px'
                }}
              />
            ))}
          </Box>
        )}
      />
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
      <FunctionField
        label="Backstory"
        render={(record: any) =>
          record.backstory ? (
            <EnhancedSpoilerMarkdown
              content={record.backstory}
              className="admin-backstory"
              enableEntityEmbeds={true}
              compactEntityCards={true}
            />
          ) : (
            <Typography variant="body2" color="text.secondary">
              No backstory
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

      {/* Organization Memberships */}
      <Box sx={{ mt: 3 }}>
        <Typography variant="h6" sx={{ color: '#10b981', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Building2 size={20} />
          Organization Memberships
        </Typography>
        <ReferenceManyField
          reference="character-organizations"
          target="characterId"
          label={false}
        >
          <Datagrid
            bulkActionButtons={false}
            rowClick="show"
            empty={
              <Typography variant="body2" sx={{ color: 'text.secondary', py: 2 }}>
                No organization memberships
              </Typography>
            }
          >
            <ReferenceField source="organizationId" reference="organizations" link="show" label="Organization">
              <TextField source="name" />
            </ReferenceField>
            <FunctionField
              label="Role"
              render={(record: any) => (
                <Chip
                  label={record.role}
                  size="small"
                  sx={{
                    backgroundColor: 'rgba(16, 185, 129, 0.2)',
                    color: '#10b981',
                    fontWeight: 'bold'
                  }}
                />
              )}
            />
            <FunctionField
              label="Chapter Range"
              render={(record: any) => (
                <Chip
                  label={record.endChapter ? `Ch. ${record.startChapter}-${record.endChapter}` : `Ch. ${record.startChapter}+`}
                  size="small"
                  variant="outlined"
                />
              )}
            />
          </Datagrid>
        </ReferenceManyField>
      </Box>

      {/* Relationships */}
      <Box sx={{ mt: 3 }}>
        <Typography variant="h6" sx={{ color: '#8b5cf6', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Users size={20} />
          Relationships
        </Typography>
        <ReferenceManyField
          reference="character-relationships"
          target="sourceCharacterId"
          label={false}
        >
          <Datagrid
            bulkActionButtons={false}
            rowClick="show"
            empty={
              <Typography variant="body2" sx={{ color: 'text.secondary', py: 2 }}>
                No relationships defined
              </Typography>
            }
          >
            <FunctionField
              label="To"
              render={(record: any) => (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ArrowRight size={14} />
                  <ReferenceField source="targetCharacterId" reference="characters" link="show">
                    <TextField source="name" />
                  </ReferenceField>
                </Box>
              )}
            />
            <FunctionField
              label="Type"
              render={(record: any) => (
                <Chip
                  label={record.relationshipType}
                  size="small"
                  sx={{
                    backgroundColor: `${getRelationshipColor(record.relationshipType)}20`,
                    color: getRelationshipColor(record.relationshipType),
                    fontWeight: 'bold',
                    textTransform: 'capitalize'
                  }}
                />
              )}
            />
            <FunctionField
              label="Chapter"
              render={(record: any) => (
                <Chip
                  label={record.endChapter ? `Ch. ${record.startChapter}-${record.endChapter}` : `Ch. ${record.startChapter}+`}
                  size="small"
                  variant="outlined"
                />
              )}
            />
          </Datagrid>
        </ReferenceManyField>
      </Box>
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
            sanitizeEmptyValues={false}
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
                  <TextInput
                    source="backstory"
                    multiline
                    rows={8}
                    fullWidth
                    helperText="Detailed character history and background. Supports Markdown formatting."
                  />
                  <NumberInput source="firstAppearanceChapter" max={539} min={1} fullWidth helperText="Chapter number when this character first appears (1-539)" />
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
                      <TextInput source="" label="Alternate Name" fullWidth helperText="Other names this character is known by" />
                    </SimpleFormIterator>
                  </ArrayInput>
                </Box>
              </Grid>

              {/* Character Relationships Section */}
              <Grid item xs={12}>
                <Divider sx={{ my: 2, borderColor: 'rgba(139, 92, 246, 0.3)' }} />
                <Box sx={{
                  p: 3,
                  backgroundColor: 'rgba(139, 92, 246, 0.05)',
                  borderRadius: 2,
                  border: '1px solid rgba(139, 92, 246, 0.2)'
                }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ color: '#8b5cf6', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Users size={20} />
                      Character Relationships
                    </Typography>
                    <WithRecord render={(record) => (
                      <MuiButton
                        component={Link}
                        to={`/character-relationships/create?source=${encodeURIComponent(JSON.stringify({ sourceCharacterId: record.id }))}`}
                        size="small"
                        variant="contained"
                        startIcon={<Plus size={16} />}
                        sx={{
                          backgroundColor: '#8b5cf6',
                          '&:hover': { backgroundColor: '#7c3aed' }
                        }}
                      >
                        Add Relationship
                      </MuiButton>
                    )} />
                  </Box>

                  {/* Outgoing Relationships */}
                  <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 1, mt: 2 }}>
                    This Character&apos;s Relationships
                  </Typography>
                  <ReferenceManyField
                    reference="character-relationships"
                    target="sourceCharacterId"
                    label={false}
                  >
                    <Datagrid
                      bulkActionButtons={false}
                      rowClick="edit"
                      sx={{
                        '& .RaDatagrid-table': { backgroundColor: 'transparent' },
                        '& .RaDatagrid-headerCell': {
                          backgroundColor: 'rgba(139, 92, 246, 0.1)',
                          color: '#8b5cf6',
                          fontWeight: 'bold'
                        },
                        '& .RaDatagrid-row': {
                          '&:hover': { backgroundColor: 'rgba(139, 92, 246, 0.1)' }
                        }
                      }}
                      empty={
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', py: 2, textAlign: 'center' }}>
                          No outgoing relationships defined
                        </Typography>
                      }
                    >
                      <FunctionField
                        label="To"
                        render={(record: any) => (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <ArrowRight size={14} />
                            <ReferenceField source="targetCharacterId" reference="characters" link={false}>
                              <TextField source="name" />
                            </ReferenceField>
                          </Box>
                        )}
                      />
                      <FunctionField
                        label="Type"
                        render={(record: any) => (
                          <Chip
                            label={record.relationshipType}
                            size="small"
                            sx={{
                              backgroundColor: `${getRelationshipColor(record.relationshipType)}20`,
                              color: getRelationshipColor(record.relationshipType),
                              fontWeight: 'bold',
                              textTransform: 'capitalize'
                            }}
                          />
                        )}
                      />
                      <FunctionField
                        label="Chapter"
                        render={(record: any) => (
                          <Chip
                            label={record.endChapter ? `Ch. ${record.startChapter}-${record.endChapter}` : `Ch. ${record.startChapter}+`}
                            size="small"
                            variant="outlined"
                          />
                        )}
                      />
                    </Datagrid>
                  </ReferenceManyField>

                  <Divider sx={{ my: 2, borderColor: 'rgba(139, 92, 246, 0.2)' }} />

                  {/* Incoming Relationships */}
                  <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 1 }}>
                    Others&apos; Relationships to This Character
                  </Typography>
                  <ReferenceManyField
                    reference="character-relationships"
                    target="targetCharacterId"
                    label={false}
                  >
                    <Datagrid
                      bulkActionButtons={false}
                      rowClick="edit"
                      sx={{
                        '& .RaDatagrid-table': { backgroundColor: 'transparent' },
                        '& .RaDatagrid-headerCell': {
                          backgroundColor: 'rgba(139, 92, 246, 0.1)',
                          color: '#8b5cf6',
                          fontWeight: 'bold'
                        },
                        '& .RaDatagrid-row': {
                          '&:hover': { backgroundColor: 'rgba(139, 92, 246, 0.1)' }
                        }
                      }}
                      empty={
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', py: 2, textAlign: 'center' }}>
                          No incoming relationships defined
                        </Typography>
                      }
                    >
                      <FunctionField
                        label="From"
                        render={(record: any) => (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <ReferenceField source="sourceCharacterId" reference="characters" link={false}>
                              <TextField source="name" />
                            </ReferenceField>
                            <ArrowRight size={14} />
                          </Box>
                        )}
                      />
                      <FunctionField
                        label="Type"
                        render={(record: any) => (
                          <Chip
                            label={record.relationshipType}
                            size="small"
                            sx={{
                              backgroundColor: `${getRelationshipColor(record.relationshipType)}20`,
                              color: getRelationshipColor(record.relationshipType),
                              fontWeight: 'bold',
                              textTransform: 'capitalize'
                            }}
                          />
                        )}
                      />
                      <FunctionField
                        label="Chapter"
                        render={(record: any) => (
                          <Chip
                            label={record.endChapter ? `Ch. ${record.startChapter}-${record.endChapter}` : `Ch. ${record.startChapter}+`}
                            size="small"
                            variant="outlined"
                          />
                        )}
                      />
                    </Datagrid>
                  </ReferenceManyField>

                  <Box sx={{ mt: 2, textAlign: 'center' }}>
                    <WithRecord render={(record) => (
                      <MuiButton
                        component={Link}
                        to={`/character-relationships?filter=${encodeURIComponent(JSON.stringify({ sourceCharacterId: record.id }))}`}
                        size="small"
                        startIcon={<Users size={16} />}
                        sx={{ color: '#8b5cf6' }}
                      >
                        View All Relationships
                      </MuiButton>
                    )} />
                  </Box>
                </Box>
              </Grid>

              {/* Organization Memberships Section */}
              <Grid item xs={12}>
                <Divider sx={{ my: 2, borderColor: 'rgba(16, 185, 129, 0.3)' }} />
                <Box sx={{
                  p: 3,
                  backgroundColor: 'rgba(16, 185, 129, 0.05)',
                  borderRadius: 2,
                  border: '1px solid rgba(16, 185, 129, 0.2)'
                }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ color: '#10b981', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Building2 size={20} />
                      Organization Memberships
                    </Typography>
                    <WithRecord render={(record) => (
                      <MuiButton
                        component={Link}
                        to={`/character-organizations/create?source=${encodeURIComponent(JSON.stringify({ characterId: record.id }))}`}
                        size="small"
                        variant="contained"
                        startIcon={<Plus size={16} />}
                        sx={{
                          backgroundColor: '#10b981',
                          '&:hover': { backgroundColor: '#059669' }
                        }}
                      >
                        Add Membership
                      </MuiButton>
                    )} />
                  </Box>

                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mb: 2 }}>
                    Track this character&apos;s organization memberships with roles and timeline
                  </Typography>

                  <ReferenceManyField
                    reference="character-organizations"
                    target="characterId"
                    label={false}
                  >
                    <Datagrid
                      bulkActionButtons={false}
                      rowClick="edit"
                      sx={{
                        '& .RaDatagrid-table': { backgroundColor: 'transparent' },
                        '& .RaDatagrid-headerCell': {
                          backgroundColor: 'rgba(16, 185, 129, 0.1)',
                          color: '#10b981',
                          fontWeight: 'bold'
                        },
                        '& .RaDatagrid-row': {
                          '&:hover': { backgroundColor: 'rgba(16, 185, 129, 0.1)' }
                        }
                      }}
                      empty={
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', py: 2, textAlign: 'center' }}>
                          No organization memberships defined
                        </Typography>
                      }
                    >
                      <ReferenceField source="organizationId" reference="organizations" link={false} label="Organization">
                        <TextField source="name" />
                      </ReferenceField>
                      <FunctionField
                        label="Role"
                        render={(record: any) => (
                          <Chip
                            label={record.role}
                            size="small"
                            sx={{
                              backgroundColor: 'rgba(16, 185, 129, 0.2)',
                              color: '#10b981',
                              fontWeight: 'bold'
                            }}
                          />
                        )}
                      />
                      <FunctionField
                        label="Chapter Range"
                        render={(record: any) => (
                          <Chip
                            label={record.endChapter ? `Ch. ${record.startChapter}-${record.endChapter}` : `Ch. ${record.startChapter}+`}
                            size="small"
                            variant="outlined"
                          />
                        )}
                      />
                      <FunctionField
                        label="Spoiler Ch."
                        render={(record: any) => (
                          <Chip
                            label={`Ch. ${record.spoilerChapter}`}
                            size="small"
                            variant="outlined"
                            sx={{ borderColor: 'rgba(239, 68, 68, 0.5)', color: '#ef4444' }}
                          />
                        )}
                      />
                    </Datagrid>
                  </ReferenceManyField>

                  <Box sx={{ mt: 2, textAlign: 'center' }}>
                    <WithRecord render={(record) => (
                      <MuiButton
                        component={Link}
                        to={`/character-organizations?filter=${encodeURIComponent(JSON.stringify({ characterId: record.id }))}`}
                        size="small"
                        startIcon={<Building2 size={16} />}
                        sx={{ color: '#10b981' }}
                      >
                        View All Memberships
                      </MuiButton>
                    )} />
                  </Box>
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
                  <TextInput
                    source="backstory"
                    multiline
                    rows={8}
                    fullWidth
                    helperText="Detailed character history and background. Supports Markdown formatting."
                  />
                  <NumberInput source="firstAppearanceChapter" max={539} min={1} fullWidth helperText="Chapter number when this character first appears (1-539)" />
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
                      <TextInput source="" label="Alternate Name" fullWidth helperText="Other names this character is known by" />
                    </SimpleFormIterator>
                  </ArrayInput>
                </Box>
              </Grid>

            </Grid>
          </SimpleForm>
        </CardContent>
      </Card>
    </Box>
  </Create>
)
