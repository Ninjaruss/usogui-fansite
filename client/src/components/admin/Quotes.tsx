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
  ReferenceInput,
  AutocompleteInput,
  NumberInput,
  NumberField,
  FunctionField,
  ReferenceField,
  TabbedShowLayout,
  Tab,
  SearchInput,
  BulkDeleteButton
} from 'react-admin'
import { Typography, Box, Chip, Card, CardContent, Grid } from '@mui/material'
import { Edit3, Plus, MessageSquareQuote, User as UserIcon, BookOpen } from 'lucide-react'
import { EditToolbar } from './EditToolbar'

const quoteFilters = [
  <SearchInput key="q" source="q" placeholder="Search quotes" alwaysOn />,
  <ReferenceInput key="characterId" source="characterId" reference="characters" label="Character" alwaysOn>
    <AutocompleteInput optionText="name" />
  </ReferenceInput>,
  <NumberInput key="chapterFrom" source="chapterNumber_gte" label="Chapter from" min={1} max={539} />,
  <NumberInput key="chapterTo" source="chapterNumber_lte" label="Chapter to" min={1} max={539} />
]

const QuoteBulkActionButtons = () => (
  <>
    <BulkDeleteButton mutationMode="pessimistic" />
  </>
)

export const QuoteList = () => (
  <List
    sort={{ field: 'chapterNumber', order: 'DESC' }}
    filters={quoteFilters}
  >
    <Datagrid rowClick="show" bulkActionButtons={<QuoteBulkActionButtons />}>
      <TextField source="id" sortable />
      <FunctionField
        label="Quote Text"
        render={(record: any) => (
          <Box sx={{ maxWidth: '300px' }}>
            <Typography
              variant="body2"
              sx={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                fontSize: '0.85rem',
                fontStyle: 'italic',
                color: '#ffffff',
                lineHeight: 1.4,
                '&::before': { content: '"\u201C"' },
                '&::after': { content: '"\u201D"' }
              }}
            >
              {record.text}
            </Typography>
          </Box>
        )}
      />
      <FunctionField
        label="Character"
        sortBy="characterId"
        render={(record: any) => (
          <Chip
            label={record.character?.name || 'Unknown'}
            size="small"
            sx={{
              backgroundColor: 'rgba(76, 175, 80, 0.1)',
              color: '#4caf50',
              fontWeight: '500'
            }}
          />
        )}
      />
      <FunctionField
        label="Chapter"
        sortBy="chapterNumber"
        render={(record: any) => (
          <Chip
            label={`Ch. ${record.chapterNumber}`}
            size="small"
            sx={{
              backgroundColor: 'rgba(25, 118, 210, 0.1)',
              color: '#1976d2',
              fontWeight: '500'
            }}
          />
        )}
      />
      <FunctionField
        label="Context"
        render={(record: any) => (
          <Box sx={{ maxWidth: '200px' }}>
            <Typography
              variant="body2"
              sx={{
                display: '-webkit-box',
                WebkitLineClamp: 1,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                fontSize: '0.75rem',
                color: 'text.secondary'
              }}
            >
              {record.description || 'No context'}
            </Typography>
          </Box>
        )}
      />
    </Datagrid>
  </List>
)

export const QuoteShow = () => (
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
          border: '2px solid #ec4899',
          borderRadius: 2,
          boxShadow: '0 0 30px rgba(236, 72, 153, 0.3)',
          overflow: 'hidden'
        }}
      >
        <Box sx={{
          background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
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
              <MessageSquareQuote size={32} color="white" />
            </Box>
            <Box sx={{ flex: 1 }}>
              <FunctionField
                source="text"
                render={(record: any) => (
                  <Typography variant="h5" sx={{
                    fontWeight: 'bold',
                    color: 'white',
                    fontStyle: 'italic',
                    textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                    '&::before': { content: '"\u201C"' },
                    '&::after': { content: '"\u201D"' }
                  }}>
                    {record.text}
                  </Typography>
                )}
              />
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mt: 2 }}>
                <ReferenceField source="characterId" reference="characters" link={false}>
                  <Chip
                    icon={<UserIcon size={16} />}
                    label={<TextField source="name" />}
                    sx={{
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: '0.9rem'
                    }}
                  />
                </ReferenceField>
                <Chip
                  icon={<BookOpen size={16} />}
                  label={
                    <FunctionField
                      render={(record: any) => `Chapter ${record.chapterNumber}`}
                    />
                  }
                  sx={{
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '0.9rem'
                  }}
                />
              </Box>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                Quote ID: <TextField source="id" sx={{ '& span': { color: 'white', fontWeight: 'bold' } }} />
              </Typography>
            </Box>
          </Box>
        </Box>
      </Card>

      <TabbedShowLayout sx={{
        backgroundColor: '#0a0a0a',
        '& .RaTabbedShowLayout-content': {
          backgroundColor: '#0a0a0a',
          border: '2px solid #ec4899',
          borderRadius: 2,
          borderTop: 'none',
          p: 0
        },
        '& .MuiTabs-root': {
          backgroundColor: '#0a0a0a',
          border: '2px solid #ec4899',
          borderBottom: 'none',
          borderRadius: '8px 8px 0 0',
          '& .MuiTab-root': {
            color: 'rgba(255, 255, 255, 0.7)',
            fontWeight: 600,
            textTransform: 'none',
            minHeight: 48,
            '&.Mui-selected': {
              color: '#ec4899',
              backgroundColor: 'rgba(236, 72, 153, 0.1)'
            },
            '&:hover': {
              color: '#ec4899',
              backgroundColor: 'rgba(236, 72, 153, 0.05)'
            }
          },
          '& .MuiTabs-indicator': {
            backgroundColor: '#ec4899',
            height: 3
          }
        }
      }}>
        <Tab label="Quote Details">
          <Box sx={{ p: 4, backgroundColor: '#0a0a0a' }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ color: '#ffffff', fontWeight: 'bold', mb: 2 }}>
                  Full Quote
                </Typography>
                <Box sx={{
                  p: 3,
                  bgcolor: '#0f0f0f',
                  borderRadius: 2,
                  border: '2px solid rgba(236, 72, 153, 0.3)',
                  mb: 3
                }}>
                  <FunctionField
                    source="text"
                    render={(record: any) => (
                      <Typography variant="h6" sx={{
                        color: '#ffffff',
                        fontStyle: 'italic',
                        lineHeight: 1.6,
                        '&::before': { content: '"\u201C"', color: '#ec4899', fontSize: '2rem', marginRight: '8px' },
                        '&::after': { content: '"\u201D"', color: '#ec4899', fontSize: '2rem', marginLeft: '8px' }
                      }}>
                        {record.text}
                      </Typography>
                    )}
                  />
                </Box>
              </Grid>

              {/* Context/Description */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ color: '#ffffff', fontWeight: 'bold', mb: 2 }}>
                  Context
                </Typography>
                <FunctionField
                  source="description"
                  render={(record: any) => (
                    <Box sx={{
                      p: 3,
                      bgcolor: '#0f0f0f',
                      borderRadius: 2,
                      border: '1px solid rgba(236, 72, 153, 0.3)'
                    }}>
                      <Typography variant="body1" sx={{ color: '#ffffff', lineHeight: 1.7 }}>
                        {record.description || 'No context provided'}
                      </Typography>
                    </Box>
                  )}
                />
              </Grid>

              {/* Source Information */}
              <Grid item xs={12} md={6}>
                <Box sx={{
                  p: 3,
                  backgroundColor: 'rgba(25, 118, 210, 0.05)',
                  borderRadius: 2,
                  border: '1px solid rgba(25, 118, 210, 0.2)'
                }}>
                  <Typography variant="h6" sx={{ color: '#1976d2', mb: 2, fontWeight: 'bold' }}>
                    Source
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Chapter
                    </Typography>
                    <Typography variant="h5" sx={{ color: '#1976d2', fontWeight: 'bold' }}>
                      <NumberField source="chapterNumber" />
                    </Typography>
                  </Box>
                  <FunctionField
                    source="pageNumber"
                    render={(record: any) => record.pageNumber ? (
                      <Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Page Number
                        </Typography>
                        <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 'bold' }}>
                          {record.pageNumber}
                        </Typography>
                      </Box>
                    ) : null}
                  />
                </Box>
              </Grid>

              {/* Character Information */}
              <Grid item xs={12} md={6}>
                <Box sx={{
                  p: 3,
                  backgroundColor: 'rgba(76, 175, 80, 0.05)',
                  borderRadius: 2,
                  border: '1px solid rgba(76, 175, 80, 0.2)'
                }}>
                  <Typography variant="h6" sx={{ color: '#4caf50', mb: 2, fontWeight: 'bold' }}>
                    Spoken By
                  </Typography>
                  <ReferenceField source="characterId" reference="characters" link="show">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{
                        width: 48,
                        height: 48,
                        borderRadius: '50%',
                        backgroundColor: 'rgba(76, 175, 80, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '2px solid #4caf50'
                      }}>
                        <UserIcon size={24} color="#4caf50" />
                      </Box>
                      <Box>
                        <TextField
                          source="name"
                          sx={{
                            '& span': {
                              fontSize: '1.2rem',
                              fontWeight: 'bold',
                              color: '#4caf50'
                            }
                          }}
                        />
                        <Typography variant="body2" color="text.secondary">
                          Character
                        </Typography>
                      </Box>
                    </Box>
                  </ReferenceField>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Tab>
      </TabbedShowLayout>
    </Box>
  </Show>
)

export const QuoteEdit = () => (
  <Edit>
    <SimpleForm
      toolbar={
        <EditToolbar
          resource="quotes"
          confirmTitle="Delete Quote"
          confirmMessage="Are you sure you want to delete this quote? This action cannot be undone."
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
            border: '2px solid #ec4899',
            borderRadius: 2,
            boxShadow: '0 0 30px rgba(236, 72, 153, 0.2)'
          }}
        >
          {/* Header */}
          <Box sx={{
            background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
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
              Edit Quote
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9, mt: 1 }}>
              Update quote information and details
            </Typography>
          </Box>

          <CardContent sx={{ p: 4 }}>
            <Box sx={{
              '& .MuiTextField-root': {
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#0f0f0f',
                  border: '1px solid rgba(236, 72, 153, 0.3)',
                  '&:hover': {
                    borderColor: 'rgba(236, 72, 153, 0.5)'
                  },
                  '&.Mui-focused': {
                    borderColor: '#ec4899'
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    border: 'none'
                  }
                },
                '& .MuiInputLabel-root': {
                  color: 'rgba(255, 255, 255, 0.7)',
                  '&.Mui-focused': {
                    color: '#ec4899'
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
                    backgroundColor: 'rgba(236, 72, 153, 0.05)',
                    borderRadius: 2,
                    border: '1px solid rgba(236, 72, 153, 0.2)',
                    mb: 3
                  }}>
                    <Typography variant="h6" sx={{ color: '#ec4899', mb: 2, fontWeight: 'bold' }}>
                      Quote Text
                    </Typography>
                    <TextInput
                      source="text"
                      multiline
                      rows={4}
                      required
                      fullWidth
                      label="Quote"
                      helperText="Enter the full quote text"
                    />
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Box sx={{
                    p: 3,
                    backgroundColor: 'rgba(76, 175, 80, 0.05)',
                    borderRadius: 2,
                    border: '1px solid rgba(76, 175, 80, 0.2)'
                  }}>
                    <Typography variant="h6" sx={{ color: '#4caf50', mb: 2, fontWeight: 'bold' }}>
                      Character
                    </Typography>
                    <ReferenceInput source="characterId" reference="characters" label="Spoken By" perPage={200}>
                      <AutocompleteInput
                        optionText="name"
                        isRequired
                        sx={{
                          '& .MuiAutocomplete-root .MuiOutlinedInput-root': {
                            backgroundColor: '#0f0f0f'
                          }
                        }}
                      />
                    </ReferenceInput>
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
                      Source Location
                    </Typography>
                    <NumberInput
                      source="chapterNumber"
                      required
                      fullWidth
                      label="Chapter Number"
                      max={539}
                      min={1}
                      helperText="Chapter where this quote appears (1-539)"
                    />
                    <NumberInput
                      source="pageNumber"
                      fullWidth
                      label="Page Number"
                      min={1}
                      helperText="Page number (optional)"
                    />
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <Box sx={{
                    p: 3,
                    backgroundColor: 'rgba(245, 124, 0, 0.05)',
                    borderRadius: 2,
                    border: '1px solid rgba(245, 124, 0, 0.2)'
                  }}>
                    <Typography variant="h6" sx={{ color: '#f57c00', mb: 2, fontWeight: 'bold' }}>
                      Context & Description
                    </Typography>
                    <TextInput
                      source="description"
                      multiline
                      rows={3}
                      fullWidth
                      label="Context/Description"
                      helperText="Provide context for when this quote was said (supports Markdown)"
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

export const QuoteCreate = () => (
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
              Create New Quote
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9, mt: 1 }}>
              Add a new quote to the system
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
                      Quote Text
                    </Typography>
                    <TextInput
                      source="text"
                      multiline
                      rows={4}
                      required
                      fullWidth
                      label="Quote"
                      helperText="Enter the full quote text"
                    />
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Box sx={{
                    p: 3,
                    backgroundColor: 'rgba(76, 175, 80, 0.05)',
                    borderRadius: 2,
                    border: '1px solid rgba(76, 175, 80, 0.2)'
                  }}>
                    <Typography variant="h6" sx={{ color: '#4caf50', mb: 2, fontWeight: 'bold' }}>
                      Character
                    </Typography>
                    <ReferenceInput source="characterId" reference="characters" label="Spoken By" perPage={200}>
                      <AutocompleteInput optionText="name" isRequired helperText="Select the character who said this quote" />
                    </ReferenceInput>
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
                      Source Location
                    </Typography>
                    <NumberInput
                      source="chapterNumber"
                      required
                      fullWidth
                      label="Chapter Number"
                      max={539}
                      min={1}
                      helperText="Chapter where this quote appears (1-539)"
                    />
                    <NumberInput
                      source="pageNumber"
                      fullWidth
                      label="Page Number"
                      min={1}
                      helperText="Page number (optional)"
                    />
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <Box sx={{
                    p: 3,
                    backgroundColor: 'rgba(245, 124, 0, 0.05)',
                    borderRadius: 2,
                    border: '1px solid rgba(245, 124, 0, 0.2)'
                  }}>
                    <Typography variant="h6" sx={{ color: '#f57c00', mb: 2, fontWeight: 'bold' }}>
                      Context & Description
                    </Typography>
                    <TextInput
                      source="description"
                      multiline
                      rows={3}
                      fullWidth
                      label="Context/Description"
                      helperText="Provide context for when this quote was said (supports Markdown)"
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
