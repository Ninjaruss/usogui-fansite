import React from 'react'
import {
  List,
  Datagrid,
  TextField,
  Edit,
  Create,
  Show,
  TextInput,
  NumberInput,
  NumberField,
  SelectInput,
  ReferenceField,
  ReferenceInput,
  AutocompleteInput,
  ReferenceArrayInput,
  AutocompleteArrayInput,
  ArrayField,
  SingleFieldList,
  ChipField,
  FilterButton,
  TopToolbar,
  CreateButton,
  ExportButton,
  SearchInput,
  DateField,
  TabbedShowLayout,
  Tab,
  FormTab,
  TabbedForm
} from 'react-admin'
import { Box, Typography } from '@mui/material'
import { EditToolbar } from './EditToolbar'

const EVENT_TYPE_CHOICES = [
  { id: 'gamble', name: 'Gamble' },
  { id: 'decision', name: 'Decision' },
  { id: 'reveal', name: 'Reveal' },
  { id: 'shift', name: 'Shift' },
  { id: 'resolution', name: 'Resolution' },
]

const STATUS_CHOICES = [
  { id: 'draft', name: 'Draft' },
  { id: 'pending_review', name: 'Pending Review' },
  { id: 'approved', name: 'Approved' },
]

const EventFilters = [
  <SearchInput key="title-search" source="title" placeholder="Search by title" alwaysOn />,
  <SelectInput
    key="type-filter"
    source="type"
    label="Type"
    choices={EVENT_TYPE_CHOICES}
  />,
  <SelectInput
    key="status-filter"
    source="status"
    label="Status"
    choices={STATUS_CHOICES}
  />,
  <ReferenceInput key="arc-filter" source="arcId" reference="arcs" label="Arc">
    <AutocompleteInput optionText="name" />
  </ReferenceInput>,
  <ReferenceInput key="gamble-filter" source="gambleId" reference="gambles" label="Gamble">
    <AutocompleteInput optionText="name" />
  </ReferenceInput>,
]

const EventListActions = () => (
  <TopToolbar>
    <FilterButton />
    <CreateButton />
    <ExportButton />
  </TopToolbar>
)

export const EventList = () => (
  <List 
    filters={EventFilters} 
    actions={<EventListActions />}
    sort={{ field: 'chapterNumber', order: 'DESC' }}
  >
    <Datagrid rowClick="show" sx={{ '& .RaDatagrid-headerCell': { fontWeight: 600 } }}>
      <TextField source="title" sx={{ fontWeight: 500 }} />
      <NumberField source="chapterNumber" label="Ch." />
      <TextField source="type" sx={{ textTransform: 'capitalize' }} />
      <Box component="div">
        <TextField source="status" 
          sx={{ 
            textTransform: 'capitalize',
            '& .MuiChip-root': {
              fontSize: '0.75rem',
              height: '24px'
            }
          }} 
        />
      </Box>
      <ReferenceField source="arcId" reference="arcs" label="Arc" emptyText="-">
        <TextField source="name" sx={{ fontSize: '0.875rem' }} />
      </ReferenceField>
      <ReferenceField source="gambleId" reference="gambles" label="Gamble" emptyText="-">
        <TextField source="name" sx={{ fontSize: '0.875rem' }} />
      </ReferenceField>
    </Datagrid>
  </List>
)

export const EventShow = () => (
  <Show>
    <Box sx={{ 
      backgroundColor: '#0a0a0a',
      minHeight: '100vh',
      p: 3,
      '& .RaShow-main': {
        backgroundColor: 'transparent'
      }
    }}>
      <TabbedShowLayout sx={{
        backgroundColor: '#0a0a0a',
        '& .RaTabbedShowLayout-content': {
          backgroundColor: '#0a0a0a',
          border: '2px solid #f57c00',
          borderRadius: 2,
          borderTop: 'none',
          p: 0
        },
        '& .MuiTabs-root': {
          backgroundColor: '#0a0a0a',
          border: '2px solid #f57c00',
          borderBottom: 'none',
          borderRadius: '8px 8px 0 0',
          '& .MuiTab-root': {
            color: 'rgba(255, 255, 255, 0.7)',
            fontWeight: 600,
            textTransform: 'none',
            minHeight: 48,
            '&.Mui-selected': {
              color: '#f57c00',
              backgroundColor: 'rgba(245, 124, 0, 0.1)'
            },
            '&:hover': {
              color: '#f57c00',
              backgroundColor: 'rgba(245, 124, 0, 0.05)'
            }
          },
          '& .MuiTabs-indicator': {
            backgroundColor: '#f57c00',
            height: 3
          }
        }
      }}>
        <Tab label="Overview">
          <Box sx={{ p: 3, backgroundColor: '#0a0a0a' }}>
            <TextField source="title" 
              sx={{ 
                mb: 3, 
                fontSize: '1.5rem', 
                fontWeight: 600, 
                display: 'block',
                '& .MuiTypography-root': { 
                  fontSize: '1.5rem', 
                  fontWeight: 600,
                  color: '#ffffff'
                }
              }} 
            />
            
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 3, mb: 3 }}>
              <Box sx={{
                p: 2,
                backgroundColor: 'rgba(245, 124, 0, 0.05)',
                borderRadius: 2,
                border: '1px solid rgba(245, 124, 0, 0.2)'
              }}>
                <Typography variant="subtitle2" color="#f57c00" fontWeight="bold" gutterBottom>Type & Status</Typography>
                <TextField source="type" sx={{ textTransform: 'capitalize', fontWeight: 500, mb: 1, color: '#ffffff' }} />
                <TextField source="status" sx={{ textTransform: 'capitalize', color: '#ffffff' }} />
              </Box>
              
              <Box sx={{
                p: 2,
                backgroundColor: 'rgba(25, 118, 210, 0.05)',
                borderRadius: 2,
                border: '1px solid rgba(25, 118, 210, 0.2)'
              }}>
                <Typography variant="subtitle2" color="#1976d2" fontWeight="bold" gutterBottom>Chapter Info</Typography>
                <NumberField source="chapterNumber" label="Chapter" sx={{ fontWeight: 500, mb: 1, color: '#ffffff' }} />
                <NumberField source="spoilerChapter" label="Spoiler Chapter" emptyText="None" sx={{ color: '#ffffff' }} />
              </Box>
            </Box>
            
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 3, mb: 3 }}>
              <Box sx={{
                p: 2,
                backgroundColor: 'rgba(16, 185, 129, 0.05)',
                borderRadius: 2,
                border: '1px solid rgba(16, 185, 129, 0.2)'
              }}>
                <Typography variant="subtitle2" color="#10b981" fontWeight="bold" gutterBottom>Context</Typography>
                <ReferenceField source="arcId" reference="arcs" label="Arc" emptyText="-">
                  <TextField source="name" sx={{ fontWeight: 500, color: '#ffffff' }} />
                </ReferenceField>
                <ReferenceField source="gambleId" reference="gambles" label="Gamble" emptyText="-">
                  <TextField source="name" sx={{ fontWeight: 500, color: '#ffffff' }} />
                </ReferenceField>
              </Box>
              
              <Box sx={{
                p: 2,
                backgroundColor: 'rgba(156, 39, 176, 0.05)',
                borderRadius: 2,
                border: '1px solid rgba(156, 39, 176, 0.2)'
              }}>
                <Typography variant="subtitle2" color="#9c27b0" fontWeight="bold" gutterBottom>Metadata</Typography>
                <ReferenceField source="createdBy.id" reference="users" label="Created By" emptyText="-">
                  <TextField source="username" sx={{ color: '#ffffff' }} />
                </ReferenceField>
                <DateField source="createdAt" showTime={false} sx={{ display: 'block', color: '#ffffff' }} />
              </Box>
            </Box>
          </Box>
        </Tab>
        
        <Tab label="Description">
          <Box sx={{ p: 3, backgroundColor: '#0a0a0a' }}>
            <TextField 
              source="description" 
              component="pre" 
              sx={{
                whiteSpace: 'pre-wrap', 
                p: 2, 
                bgcolor: '#0f0f0f', 
                borderRadius: 1,
                border: '1px solid rgba(245, 124, 0, 0.3)',
                fontFamily: 'inherit',
                lineHeight: 1.6,
                color: '#ffffff'
              }} 
            />
          </Box>
        </Tab>
        
        <Tab label="Related Data">
          <Box sx={{ p: 3, backgroundColor: '#0a0a0a' }}>
            <Typography variant="h6" gutterBottom sx={{ color: '#ffffff', fontWeight: 'bold' }}>Characters</Typography>
            <ArrayField source="characters" label={false}>
              <SingleFieldList linkType={false}>
                <ChipField 
                  source="name" 
                  sx={{ 
                    mr: 1, 
                    mb: 1,
                    '& .MuiChip-root': {
                      backgroundColor: 'rgba(25, 118, 210, 0.2)',
                      color: '#ffffff',
                      border: '1px solid rgba(25, 118, 210, 0.5)'
                    }
                  }} 
                />
              </SingleFieldList>
            </ArrayField>
            
            <Typography variant="h6" gutterBottom sx={{ mt: 3, color: '#ffffff', fontWeight: 'bold' }}>Tags</Typography>
            <ArrayField source="tags" label={false}>
              <Datagrid 
                bulkActionButtons={false} 
                sx={{ 
                  boxShadow: 'none',
                  backgroundColor: '#0f0f0f',
                  border: '1px solid rgba(245, 124, 0, 0.3)',
                  borderRadius: 1,
                  '& .MuiTableCell-root': {
                    color: '#ffffff',
                    borderColor: 'rgba(255, 255, 255, 0.1)'
                  },
                  '& .MuiTableHead-root .MuiTableCell-root': {
                    backgroundColor: 'rgba(245, 124, 0, 0.1)',
                    fontWeight: 'bold'
                  }
                }}
              >
                <TextField source="name" sx={{ fontWeight: 500, color: '#ffffff' }} />
                <TextField source="description" sx={{ color: '#ffffff' }} />
              </Datagrid>
            </ArrayField>
          </Box>
        </Tab>
      </TabbedShowLayout>
    </Box>
  </Show>
)

export const EventEdit = () => (
  <Edit>
    <Box sx={{ 
      backgroundColor: '#0a0a0a',
      minHeight: '100vh',
      p: 3,
      '& .RaEdit-main': {
        backgroundColor: 'transparent'
      }
    }}>
      <TabbedForm 
        toolbar={<EditToolbar 
          resource="events"
          confirmTitle="Delete Event"
          confirmMessage="Are you sure you want to delete this event? This will remove all associated data and cannot be undone."
        />}
        sx={{
        backgroundColor: '#0a0a0a',
        '& .RaTabbedForm-content': {
          backgroundColor: '#0a0a0a',
          border: '2px solid #f57c00',
          borderRadius: 2,
          borderTop: 'none',
          p: 0
        },
        '& .MuiTabs-root': {
          backgroundColor: '#0a0a0a',
          border: '2px solid #f57c00',
          borderBottom: 'none',
          borderRadius: '8px 8px 0 0',
          '& .MuiTab-root': {
            color: 'rgba(255, 255, 255, 0.7)',
            fontWeight: 600,
            textTransform: 'none',
            minHeight: 48,
            '&.Mui-selected': {
              color: '#f57c00',
              backgroundColor: 'rgba(245, 124, 0, 0.1)'
            },
            '&:hover': {
              color: '#f57c00',
              backgroundColor: 'rgba(245, 124, 0, 0.05)'
            }
          },
          '& .MuiTabs-indicator': {
            backgroundColor: '#f57c00',
            height: 3
          }
        },
        '& .MuiTextField-root': {
          mb: 3,
          '& .MuiOutlinedInput-root': {
            backgroundColor: '#0f0f0f',
            border: '1px solid rgba(245, 124, 0, 0.3)',
            '&:hover': {
              borderColor: 'rgba(245, 124, 0, 0.5)'
            },
            '&.Mui-focused': {
              borderColor: '#f57c00'
            },
            '& .MuiOutlinedInput-notchedOutline': {
              border: 'none'
            }
          },
          '& .MuiInputLabel-root': {
            color: 'rgba(255, 255, 255, 0.7)',
            '&.Mui-focused': {
              color: '#f57c00'
            }
          },
          '& .MuiInputBase-input': {
            color: '#ffffff'
          },
          '& .MuiFormHelperText-root': {
            color: 'rgba(255, 255, 255, 0.6)'
          }
        },
        '& .MuiFormControl-root': {
          mb: 3
        }
      }}>
        <FormTab label="Basic Info">
          <Box sx={{ maxWidth: 600, p: 3, backgroundColor: '#0a0a0a' }}>
            <Typography variant="h6" gutterBottom sx={{ color: '#f57c00', mb: 2, fontWeight: 'bold' }}>Event Details</Typography>
            <TextInput 
              source="title" 
              required 
              fullWidth 
              sx={{ mb: 3 }}
              helperText="Descriptive title for this event"
            />
            
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
              <SelectInput
                source="type"
                choices={EVENT_TYPE_CHOICES}
                required
                helperText="Event category"
              />
              <SelectInput
                source="status"
                choices={STATUS_CHOICES}
                required
                defaultValue="draft"
                helperText="Review status"
              />
            </Box>
            
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
              <NumberInput 
                source="chapterNumber" 
                required 
                max={539} 
                min={1}
                helperText="Chapter (1-539)"
              />
              <NumberInput 
                source="spoilerChapter" 
                max={539} 
                min={1} 
                helperText="Spoiler chapter (optional)"
              />
            </Box>
            
            <Typography variant="subtitle1" gutterBottom sx={{ mt: 3, mb: 1, color: '#ffffff', fontWeight: 'bold' }}>Description</Typography>
            <TextInput 
              source="description" 
              multiline 
              rows={6} 
              required 
              fullWidth
              helperText="Detailed description of what happens in this event"
            />
          </Box>
        </FormTab>
        
        <FormTab label="Context & Relations">
          <Box sx={{ maxWidth: 600, p: 3, backgroundColor: '#0a0a0a' }}>
            <Typography variant="h6" gutterBottom sx={{ color: '#f57c00', mb: 2, fontWeight: 'bold' }}>Story Context</Typography>
            <ReferenceInput source="arcId" reference="arcs" label="Arc" sx={{ mb: 3 }}>
              <AutocompleteInput 
                optionText="name" 
                helperText="Which story arc does this event belong to?"
                sx={{
                  '& .MuiAutocomplete-root .MuiOutlinedInput-root': {
                    backgroundColor: '#0f0f0f'
                  }
                }}
              />
            </ReferenceInput>
            
            <ReferenceInput source="gambleId" reference="gambles" label="Associated Gamble" sx={{ mb: 3 }}>
              <AutocompleteInput 
                optionText="name" 
                helperText="Link to a specific gamble if relevant"
                sx={{
                  '& .MuiAutocomplete-root .MuiOutlinedInput-root': {
                    backgroundColor: '#0f0f0f'
                  }
                }}
              />
            </ReferenceInput>
            
            <Typography variant="subtitle1" gutterBottom sx={{ mt: 3, mb: 1, color: '#ffffff', fontWeight: 'bold' }}>Participants & Tags</Typography>
            <Box sx={{ mb: 3 }}>
              <ReferenceArrayInput source="characterIds" reference="characters" label="Characters">
                <AutocompleteArrayInput 
                  optionText="name" 
                  helperText="Characters involved in this event"
                  sx={{
                    '& .MuiAutocomplete-root .MuiOutlinedInput-root': {
                      backgroundColor: '#0f0f0f'
                    }
                  }}
                />
              </ReferenceArrayInput>
            </Box>
            
            <ReferenceArrayInput source="tagIds" reference="tags" label="Tags">
              <AutocompleteArrayInput 
                optionText="name" 
                helperText="Relevant tags for categorization"
                sx={{
                  '& .MuiAutocomplete-root .MuiOutlinedInput-root': {
                    backgroundColor: '#0f0f0f'
                  }
                }}
              />
            </ReferenceArrayInput>
          </Box>
        </FormTab>
      </TabbedForm>
    </Box>
  </Edit>
)

export const EventCreate = () => (
  <Create>
    <Box sx={{ 
      backgroundColor: '#0a0a0a',
      minHeight: '100vh',
      p: 3,
      '& .RaCreate-main': {
        backgroundColor: 'transparent'
      }
    }}>
      <TabbedForm sx={{
        backgroundColor: '#0a0a0a',
        '& .RaTabbedForm-content': {
          backgroundColor: '#0a0a0a',
          border: '2px solid #16a34a',
          borderRadius: 2,
          borderTop: 'none',
          p: 0
        },
        '& .MuiTabs-root': {
          backgroundColor: '#0a0a0a',
          border: '2px solid #16a34a',
          borderBottom: 'none',
          borderRadius: '8px 8px 0 0',
          '& .MuiTab-root': {
            color: 'rgba(255, 255, 255, 0.7)',
            fontWeight: 600,
            textTransform: 'none',
            minHeight: 48,
            '&.Mui-selected': {
              color: '#16a34a',
              backgroundColor: 'rgba(22, 163, 74, 0.1)'
            },
            '&:hover': {
              color: '#16a34a',
              backgroundColor: 'rgba(22, 163, 74, 0.05)'
            }
          },
          '& .MuiTabs-indicator': {
            backgroundColor: '#16a34a',
            height: 3
          }
        },
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
          },
          '& .MuiFormHelperText-root': {
            color: 'rgba(255, 255, 255, 0.6)'
          }
        },
        '& .MuiFormControl-root': {
          mb: 3
        }
      }}>
        <FormTab label="Basic Info">
          <Box sx={{ maxWidth: 600, p: 3, backgroundColor: '#0a0a0a' }}>
            <Typography variant="h6" gutterBottom sx={{ color: '#16a34a', mb: 2, fontWeight: 'bold' }}>New Event</Typography>
            <TextInput 
              source="title" 
              required 
              fullWidth 
              sx={{ mb: 3 }}
              helperText="Descriptive title for this event"
            />
            
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
              <SelectInput
                source="type"
                choices={EVENT_TYPE_CHOICES}
                required
                defaultValue="decision"
                helperText="Event category"
              />
              <SelectInput
                source="status"
                choices={STATUS_CHOICES}
                required
                defaultValue="draft"
                helperText="Review status"
              />
            </Box>
            
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
              <NumberInput 
                source="chapterNumber" 
                required 
                max={539} 
                min={1}
                helperText="Chapter (1-539)"
              />
              <NumberInput 
                source="spoilerChapter" 
                max={539} 
                min={1} 
                helperText="Spoiler chapter (optional)"
              />
            </Box>
            
            <Typography variant="subtitle1" gutterBottom sx={{ mt: 3, mb: 1, color: '#ffffff', fontWeight: 'bold' }}>Description</Typography>
            <TextInput 
              source="description" 
              multiline 
              rows={6} 
              required 
              fullWidth
              helperText="Detailed description of what happens in this event"
            />
          </Box>
        </FormTab>
        
        <FormTab label="Context & Relations">
          <Box sx={{ maxWidth: 600, p: 3, backgroundColor: '#0a0a0a' }}>
            <Typography variant="h6" gutterBottom sx={{ color: '#16a34a', mb: 2, fontWeight: 'bold' }}>Story Context</Typography>
            <ReferenceInput source="arcId" reference="arcs" label="Arc" sx={{ mb: 3 }}>
              <AutocompleteInput 
                optionText="name" 
                helperText="Which story arc does this event belong to?"
                sx={{
                  '& .MuiAutocomplete-root .MuiOutlinedInput-root': {
                    backgroundColor: '#0f0f0f'
                  }
                }}
              />
            </ReferenceInput>
            
            <ReferenceInput source="gambleId" reference="gambles" label="Associated Gamble" sx={{ mb: 3 }}>
              <AutocompleteInput 
                optionText="name" 
                helperText="Link to a specific gamble if relevant"
                sx={{
                  '& .MuiAutocomplete-root .MuiOutlinedInput-root': {
                    backgroundColor: '#0f0f0f'
                  }
                }}
              />
            </ReferenceInput>
            
            <Typography variant="subtitle1" gutterBottom sx={{ mt: 3, mb: 1, color: '#ffffff', fontWeight: 'bold' }}>Participants & Tags</Typography>
            <Box sx={{ mb: 3 }}>
              <ReferenceArrayInput source="characterIds" reference="characters" label="Characters">
                <AutocompleteArrayInput 
                  optionText="name" 
                  helperText="Characters involved in this event"
                  sx={{
                    '& .MuiAutocomplete-root .MuiOutlinedInput-root': {
                      backgroundColor: '#0f0f0f'
                    }
                  }}
                />
              </ReferenceArrayInput>
            </Box>
            
            <ReferenceArrayInput source="tagIds" reference="tags" label="Tags">
              <AutocompleteArrayInput 
                optionText="name" 
                helperText="Relevant tags for categorization"
                sx={{
                  '& .MuiAutocomplete-root .MuiOutlinedInput-root': {
                    backgroundColor: '#0f0f0f'
                  }
                }}
              />
            </ReferenceArrayInput>
          </Box>
        </FormTab>
      </TabbedForm>
    </Box>
  </Create>
)