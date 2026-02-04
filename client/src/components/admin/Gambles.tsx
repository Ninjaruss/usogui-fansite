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
  TextInput,
  NumberInput,
  ReferenceArrayInput,
  AutocompleteArrayInput,
  TabbedForm,
  FormTab,
  DateField,
  useEditController,
  TabbedShowLayout,
  Tab,
  ReferenceManyField,
  TopToolbar,
  FilterButton,
  CreateButton,
  ExportButton,
  SearchInput,
  NumberField,
  FunctionField
} from 'react-admin'
import { Box, Typography } from '@mui/material'
import EnhancedSpoilerMarkdown from '../EnhancedSpoilerMarkdown'
import { EditToolbar } from './EditToolbar'


const GambleFilters = [
  <SearchInput key="search" source="name" placeholder="Search by name" alwaysOn />,
  <NumberInput key="chapter-filter" source="chapterId" label="Chapter" />,
]

const GambleListActions = () => (
  <TopToolbar>
    <FilterButton />
    <CreateButton />
    <ExportButton />
  </TopToolbar>
)

export const GambleList = () => (
  <List 
    filters={GambleFilters} 
    actions={<GambleListActions />}
    sort={{ field: 'chapterId', order: 'DESC' }}
  >
    <Datagrid rowClick="show" sx={{ '& .RaDatagrid-headerCell': { fontWeight: 600 } }}>
      <TextField source="name" sx={{ fontWeight: 500 }} />
      <FunctionField
        label="Description"
        render={(record: any) => {
          // Use description if available, otherwise fallback to rules
          let displayText = record.description

          if (!displayText || displayText.trim() === '') {
            displayText = record.rules || 'No description available'
          }

          return (
            <Box sx={{ maxWidth: '300px' }}>
              <Typography
                variant="body2"
                sx={{
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  fontSize: '0.8rem',
                  color: displayText === 'No description available' ? 'text.disabled' : 'text.secondary',
                  lineHeight: 1.3,
                  fontStyle: displayText === 'No description available' ? 'italic' : 'normal'
                }}
              >
                {displayText}
              </Typography>
            </Box>
          )
        }}
      />
      <NumberField source="chapterId" label="Chapter" />
      <ArrayField source="participants" label="Participants">
        <SingleFieldList linkType={false}>
          <ChipField source="name" size="small" sx={{ mr: 0.5, mb: 0.5 }} />
        </SingleFieldList>
      </ArrayField>
      <DateField source="createdAt" showTime={false} label="Created" />
    </Datagrid>
  </List>
)

export const GambleShow = () => (
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
          border: '2px solid #d32f2f',
          borderRadius: 2,
          borderTop: 'none',
          p: 0
        },
        '& .MuiTabs-root': {
          backgroundColor: '#0a0a0a',
          border: '2px solid #d32f2f',
          borderBottom: 'none',
          borderRadius: '8px 8px 0 0',
          '& .MuiTab-root': {
            color: 'rgba(255, 255, 255, 0.7)',
            fontWeight: 600,
            textTransform: 'none',
            minHeight: 48,
            '&.Mui-selected': {
              color: '#d32f2f',
              backgroundColor: 'rgba(211, 47, 47, 0.1)'
            },
            '&:hover': {
              color: '#d32f2f',
              backgroundColor: 'rgba(211, 47, 47, 0.05)'
            }
          },
          '& .MuiTabs-indicator': {
            backgroundColor: '#d32f2f',
            height: 3
          }
        }
      }}>
        <Tab label="Overview">
          <Box sx={{ p: 3, backgroundColor: '#0a0a0a' }}>
            <TextField source="name" 
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
            
            <Box sx={{
              p: 2,
              bgcolor: '#0f0f0f',
              borderRadius: 1,
              border: '1px solid rgba(211, 47, 47, 0.3)',
              mb: 3
            }}>
              <Typography variant="subtitle2" color="#d32f2f" fontWeight="bold" gutterBottom>Description</Typography>
              <FunctionField
                source="description"
                render={(record: any) =>
                  record.description ? (
                    <EnhancedSpoilerMarkdown
                      content={record.description}
                      className="admin-gamble-description"
                      enableEntityEmbeds={true}
                      compactEntityCards={true}
                    />
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                      No description provided
                    </Typography>
                  )
                }
              />
            </Box>
            
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 3, mb: 3 }}>
              <Box sx={{
                p: 2,
                backgroundColor: 'rgba(211, 47, 47, 0.05)',
                borderRadius: 2,
                border: '1px solid rgba(211, 47, 47, 0.2)'
              }}>
                <Typography variant="subtitle2" color="#d32f2f" fontWeight="bold" gutterBottom>Chapter</Typography>
                <NumberField source="chapterId" sx={{ fontWeight: 500, fontSize: '1.1rem', color: '#ffffff' }} />
              </Box>
              
              <Box sx={{
                p: 2,
                backgroundColor: 'rgba(25, 118, 210, 0.05)',
                borderRadius: 2,
                border: '1px solid rgba(25, 118, 210, 0.2)'
              }}>
                <Typography variant="subtitle2" color="#1976d2" fontWeight="bold" gutterBottom>Created</Typography>
                <DateField source="createdAt" showTime={false} sx={{ fontWeight: 500, color: '#ffffff' }} />
                <DateField source="updatedAt" showTime={false} label="Updated" sx={{ display: 'block', fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.7)' }} />
              </Box>
            </Box>
          </Box>
        </Tab>
      
        <Tab label="Game Rules">
          <Box sx={{ p: 3, backgroundColor: '#0a0a0a' }}>
            <Typography variant="h6" gutterBottom sx={{ color: '#ffffff', fontWeight: 'bold' }}>Rules</Typography>
            <FunctionField 
              source="rules"
              render={(record: any) => 
                record.rules ? (
                  <Box sx={{
                    p: 2, 
                    bgcolor: '#0f0f0f', 
                    borderRadius: 1,
                    border: '1px solid rgba(211, 47, 47, 0.3)',
                    mb: 3
                  }}>
                    <EnhancedSpoilerMarkdown
                      content={record.rules}
                      className="admin-gamble-rules"
                      enableEntityEmbeds={true}
                      compactEntityCards={true}
                    />
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No rules defined
                  </Typography>
                )
              }
            />
            
            <Typography variant="h6" gutterBottom sx={{ color: '#ffffff', fontWeight: 'bold' }}>Win Conditions</Typography>
            <FunctionField 
              source="winCondition"
              render={(record: any) => 
                record.winCondition ? (
                  <Box sx={{
                    p: 2, 
                    bgcolor: '#0f0f0f', 
                    borderRadius: 1,
                    border: '1px solid rgba(211, 47, 47, 0.3)',
                  }}>
                    <EnhancedSpoilerMarkdown
                      content={record.winCondition}
                      className="admin-gamble-win-condition"
                      enableEntityEmbeds={true}
                      compactEntityCards={true}
                    />
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No specific win conditions defined
                  </Typography>
                )
              }
            />

            <Typography variant="h6" gutterBottom sx={{ color: '#ffffff', fontWeight: 'bold', mt: 3 }}>Explanation & Analysis</Typography>
            <FunctionField
              source="explanation"
              render={(record: any) =>
                record.explanation ? (
                  <Box sx={{
                    p: 2,
                    bgcolor: '#0f0f0f',
                    borderRadius: 1,
                    border: '1px solid rgba(211, 47, 47, 0.3)',
                  }}>
                    <EnhancedSpoilerMarkdown
                      content={record.explanation}
                      className="admin-gamble-explanation"
                      enableEntityEmbeds={true}
                      compactEntityCards={true}
                    />
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No explanation provided
                  </Typography>
                )
              }
            />
          </Box>
        </Tab>

        <Tab label="Participants">
          <Box sx={{ p: 3, backgroundColor: '#0a0a0a' }}>
            <Typography variant="h6" gutterBottom sx={{ color: '#ffffff', fontWeight: 'bold', mb: 2 }}>Gamble Participants</Typography>
            <ArrayField source="participants" label={false}>
              <Datagrid 
                bulkActionButtons={false} 
                sx={{ 
                  boxShadow: 'none',
                  backgroundColor: '#0f0f0f',
                  border: '1px solid rgba(211, 47, 47, 0.3)',
                  borderRadius: 1,
                  '& .MuiTableCell-root': {
                    color: '#ffffff',
                    borderColor: 'rgba(255, 255, 255, 0.1)'
                  },
                  '& .MuiTableHead-root .MuiTableCell-root': {
                    backgroundColor: 'rgba(211, 47, 47, 0.1)',
                    fontWeight: 'bold'
                  }
                }}
              >
                <TextField source="name" sx={{ fontWeight: 500, color: '#ffffff' }} />
                <TextField source="nicknames" label="Also known as" emptyText="-" sx={{ color: '#ffffff' }} />
              </Datagrid>
            </ArrayField>
          </Box>
        </Tab>
      
        <Tab label="Related Events">
          <Box sx={{ p: 3, backgroundColor: '#0a0a0a' }}>
            <Typography variant="h6" gutterBottom sx={{ color: '#ffffff', fontWeight: 'bold' }}>Events in this Gamble</Typography>
            <ReferenceManyField
              reference="events"
              target="gambleId"
              label={false}
              emptyText="No related events found"
            >
              <Datagrid 
                bulkActionButtons={false} 
                rowClick="show" 
                sx={{ 
                  boxShadow: 'none',
                  backgroundColor: '#0f0f0f',
                  border: '1px solid rgba(211, 47, 47, 0.3)',
                  borderRadius: 1,
                  '& .MuiTableCell-root': {
                    color: '#ffffff',
                    borderColor: 'rgba(255, 255, 255, 0.1)'
                  },
                  '& .MuiTableHead-root .MuiTableCell-root': {
                    backgroundColor: 'rgba(211, 47, 47, 0.1)',
                    fontWeight: 'bold'
                  }
                }}
              >
                <TextField source="title" sx={{ fontWeight: 500, color: '#ffffff' }} />
                <TextField source="type" sx={{ textTransform: 'capitalize', color: '#ffffff' }} />
                <NumberField source="chapterNumber" label="Ch." sx={{ color: '#ffffff' }} />
                <TextField source="status" sx={{ textTransform: 'capitalize', color: '#ffffff' }} />
              </Datagrid>
            </ReferenceManyField>
          </Box>
        </Tab>
      </TabbedShowLayout>
    </Box>
  </Show>
)

const GambleEditForm = () => {
  const { record, isLoading } = useEditController()
  
  if (isLoading || !record) return null

  // Transform record to include participantIds for the form
  const transformedRecord = {
    ...record,
    participantIds: record.participants ? record.participants.map((p: any) => p.id) : []
  }

  return (
    <TabbedForm
      record={transformedRecord}
      sanitizeEmptyValues={false}
      toolbar={<GambleEditToolbar />}
      sx={{
        backgroundColor: '#0a0a0a',
        '& .RaTabbedForm-content': {
          backgroundColor: '#0a0a0a',
          border: '2px solid #d32f2f',
          borderRadius: 2,
          borderTop: 'none',
          p: 0
        },
        '& .MuiTabs-root': {
          backgroundColor: '#0a0a0a',
          border: '2px solid #d32f2f',
          borderBottom: 'none',
          borderRadius: '8px 8px 0 0',
          '& .MuiTab-root': {
            color: 'rgba(255, 255, 255, 0.7)',
            fontWeight: 600,
            textTransform: 'none',
            minHeight: 48,
            '&.Mui-selected': {
              color: '#d32f2f',
              backgroundColor: 'rgba(211, 47, 47, 0.1)'
            },
            '&:hover': {
              color: '#d32f2f',
              backgroundColor: 'rgba(211, 47, 47, 0.05)'
            }
          },
          '& .MuiTabs-indicator': {
            backgroundColor: '#d32f2f',
            height: 3
          }
        },
        '& .MuiTextField-root': {
          mb: 3,
          '& .MuiOutlinedInput-root': {
            backgroundColor: '#0f0f0f',
            border: '1px solid rgba(211, 47, 47, 0.3)',
            '&:hover': {
              borderColor: 'rgba(211, 47, 47, 0.5)'
            },
            '&.Mui-focused': {
              borderColor: '#d32f2f'
            },
            '& .MuiOutlinedInput-notchedOutline': {
              border: 'none'
            }
          },
          '& .MuiInputLabel-root': {
            color: 'rgba(255, 255, 255, 0.7)',
            '&.Mui-focused': {
              color: '#d32f2f'
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
      }}
    >
      <FormTab label="Basic Info">
        <Box sx={{ maxWidth: 600, p: 3, backgroundColor: '#0a0a0a' }}>
          <Typography variant="h6" gutterBottom sx={{ color: '#d32f2f', mb: 2, fontWeight: 'bold' }}>Gamble Details</Typography>
          <TextInput
            source="name"
            required
            fullWidth
            sx={{ mb: 3 }}
            helperText="Name or title of this gamble"
          />

          <TextInput
            source="description"
            multiline
            rows={3}
            fullWidth
            label="Description"
            helperText="Brief description of this gamble (optional). Supports Markdown formatting."
            sx={{ mb: 3 }}
          />

          <NumberInput
            source="chapterId"
            label="Chapter Number"
            required
            min={1}
            max={539}
            helperText="Chapter where this gamble occurs (1-539)"
            sx={{ width: '200px' }}
          />
        </Box>
      </FormTab>

      <FormTab label="Game Rules">
        <Box sx={{ maxWidth: 800, p: 3, backgroundColor: '#0a0a0a' }}>
          <Typography variant="h6" gutterBottom sx={{ color: '#d32f2f', mb: 2, fontWeight: 'bold' }}>How the Game Works</Typography>
          <TextInput 
            source="rules" 
            multiline 
            rows={8} 
            required 
            fullWidth
            label="Game Rules"
            helperText="Detailed explanation of how the gamble works. Supports Markdown formatting."
            sx={{ mb: 3 }}
          />
          
          <Typography variant="subtitle1" gutterBottom sx={{ mt: 3, mb: 1, color: '#ffffff', fontWeight: 'bold' }}>Victory Conditions</Typography>
          <TextInput 
            source="winCondition" 
            multiline 
            rows={4}
            fullWidth
            label="Win Conditions"
            helperText="What determines victory in this gamble (optional). Supports Markdown formatting."
          />

          <Typography variant="subtitle1" gutterBottom sx={{ mt: 3, mb: 1, color: '#ffffff', fontWeight: 'bold' }}>Explanation & Analysis</Typography>
          <TextInput
            source="explanation"
            multiline
            rows={8}
            fullWidth
            label="Explanation"
            helperText="In-depth explanation of gamble mechanics, strategy, and analysis (optional). Supports Markdown formatting."
          />
        </Box>
      </FormTab>

      <FormTab label="Participants">
        <Box sx={{ maxWidth: 600, p: 3, backgroundColor: '#0a0a0a' }}>
          <Typography variant="h6" gutterBottom sx={{ color: '#d32f2f', mb: 2, fontWeight: 'bold' }}>Gamble Participants</Typography>
          <ReferenceArrayInput source="participantIds" reference="characters" perPage={200}>
            <AutocompleteArrayInput 
              optionText="name" 
              helperText="Characters who participated in this gamble"
              fullWidth
              noOptionsText="No characters available"
              sx={{
                '& .MuiAutocomplete-root .MuiOutlinedInput-root': {
                  backgroundColor: '#0f0f0f'
                }
              }}
            />
          </ReferenceArrayInput>
        </Box>
      </FormTab>

      <FormTab label="Related Events">
        <Box sx={{ maxWidth: 600, p: 3, backgroundColor: '#0a0a0a' }}>
          <Typography variant="h6" gutterBottom sx={{ color: '#d32f2f', mb: 2, fontWeight: 'bold' }}>Associated Events</Typography>
          <Typography variant="body1" color="rgba(255, 255, 255, 0.7)" sx={{ mb: 2 }}>
            Events related to this gamble are managed from the Events admin page.
            After saving this gamble, you can link events to it from the Events section.
          </Typography>
        </Box>
      </FormTab>
    </TabbedForm>
  )
}

const GambleEditToolbar = () => (
  <EditToolbar 
    resource="gambles"
    confirmTitle="Delete Gamble"
    confirmMessage="Are you sure you want to delete this gamble? This will remove all associated events and data and cannot be undone."
  />
)

export const GambleEdit = () => {
  return (
    <Edit>
      <Box sx={{ 
        backgroundColor: '#0a0a0a',
        minHeight: '100vh',
        p: 3,
        '& .RaEdit-main': {
          backgroundColor: 'transparent'
        }
      }}>
        <GambleEditForm />
      </Box>
    </Edit>
  )
}

export const GambleCreate = () => {
  return (
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
              <Typography variant="h6" gutterBottom sx={{ color: '#16a34a', mb: 2, fontWeight: 'bold' }}>New Gamble</Typography>
              <TextInput
                source="name"
                required
                fullWidth
                sx={{ mb: 3 }}
                helperText="Name or title of this gamble"
              />

              <TextInput
                source="description"
                multiline
                rows={3}
                fullWidth
                label="Description"
                helperText="Brief description of this gamble (optional). Supports Markdown formatting."
                sx={{ mb: 3 }}
              />

              <NumberInput
                source="chapterId"
                label="Chapter Number"
                required
                min={1}
                max={539}
                helperText="Chapter where this gamble occurs (1-539)"
                sx={{ width: '200px' }}
              />
            </Box>
          </FormTab>

          <FormTab label="Game Rules">
            <Box sx={{ maxWidth: 800, p: 3, backgroundColor: '#0a0a0a' }}>
              <Typography variant="h6" gutterBottom sx={{ color: '#16a34a', mb: 2, fontWeight: 'bold' }}>How the Game Works</Typography>
              <TextInput 
                source="rules" 
                multiline 
                rows={8} 
                required 
                fullWidth
                label="Game Rules"
                helperText="Detailed explanation of how the gamble works. Supports Markdown formatting."
                sx={{ mb: 3 }}
              />
              
              <Typography variant="subtitle1" gutterBottom sx={{ mt: 3, mb: 1, color: '#ffffff', fontWeight: 'bold' }}>Victory Conditions</Typography>
              <TextInput 
                source="winCondition" 
                multiline 
                rows={4}
                fullWidth
                label="Win Conditions"
                helperText="What determines victory in this gamble (optional). Supports Markdown formatting."
              />

              <Typography variant="subtitle1" gutterBottom sx={{ mt: 3, mb: 1, color: '#ffffff', fontWeight: 'bold' }}>Explanation & Analysis</Typography>
              <TextInput
                source="explanation"
                multiline
                rows={8}
                fullWidth
                label="Explanation"
                helperText="In-depth explanation of gamble mechanics, strategy, and analysis (optional). Supports Markdown formatting."
              />
            </Box>
          </FormTab>

          <FormTab label="Participants">
            <Box sx={{ maxWidth: 600, p: 3, backgroundColor: '#0a0a0a' }}>
              <Typography variant="h6" gutterBottom sx={{ color: '#16a34a', mb: 2, fontWeight: 'bold' }}>Gamble Participants</Typography>
              <ReferenceArrayInput source="participantIds" reference="characters" perPage={200}>
                <AutocompleteArrayInput 
                  optionText="name" 
                  helperText="Characters who participated in this gamble"
                  fullWidth
                  noOptionsText="No characters available"
                  sx={{
                    '& .MuiAutocomplete-root .MuiOutlinedInput-root': {
                      backgroundColor: '#0f0f0f'
                    }
                  }}
                />
              </ReferenceArrayInput>
            </Box>
          </FormTab>

          <FormTab label="Related Events">
            <Box sx={{ maxWidth: 600, p: 3, backgroundColor: '#0a0a0a' }}>
              <Typography variant="h6" gutterBottom sx={{ color: '#16a34a', mb: 2, fontWeight: 'bold' }}>Associated Events</Typography>
              <Typography variant="body1" color="rgba(255, 255, 255, 0.7)" sx={{ mb: 2 }}>
                Events related to this gamble are managed from the Events admin page.
                After creating this gamble, you can link events to it from the Events section.
              </Typography>
            </Box>
          </FormTab>
        </TabbedForm>
      </Box>
    </Create>
  )
}