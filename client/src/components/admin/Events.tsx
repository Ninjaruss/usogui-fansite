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
  TabbedForm,
  FunctionField,
  useListContext
} from 'react-admin'
import { Box, Typography } from '@mui/material'
import EnhancedSpoilerMarkdown from '../EnhancedSpoilerMarkdown'
import { EditToolbar } from './EditToolbar'
import { EventStatus } from '../../types'

const EVENT_TYPE_CHOICES = [
  { id: 'gamble', name: 'Gamble' },
  { id: 'decision', name: 'Decision' },
  { id: 'reveal', name: 'Reveal' },
  { id: 'shift', name: 'Shift' },
  { id: 'resolution', name: 'Resolution' },
]

const STATUS_CHOICES = [
  { id: EventStatus.PENDING, name: 'Pending' },
  { id: EventStatus.APPROVED, name: 'Approved' },
  { id: EventStatus.REJECTED, name: 'Rejected' },
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

const EventFilterToolbar = () => {
  const { filterValues, setFilters } = useListContext()

  const statusFilters = [
    { id: 'all', name: 'All Events', color: '#666', icon: '🗂️' },
    { id: EventStatus.PENDING, name: 'Pending', color: '#f57c00', icon: '⏳' },
    { id: EventStatus.APPROVED, name: 'Approved', color: '#4caf50', icon: '✅' },
    { id: EventStatus.REJECTED, name: 'Rejected', color: '#f44336', icon: '❌' }
  ]

  const handleStatusChange = (status: string) => {
    const newFilters = { ...filterValues }
    if (status === 'all') {
      delete newFilters.status
    } else {
      newFilters.status = status
    }
    setFilters(newFilters, [])
  }

  const handleTypeChange = (type: string) => {
    const newFilters = { ...filterValues }
    if (!type) {
      delete newFilters.type
    } else {
      newFilters.type = type
    }
    setFilters(newFilters, [])
  }

  const handleSearchChange = (search: string) => {
    const newFilters = { ...filterValues }
    if (!search) {
      delete newFilters.q
    } else {
      newFilters.q = search
    }
    setFilters(newFilters, [])
  }

  const currentStatus = filterValues?.status || 'all'
  const currentType = filterValues?.type || ''
  const currentSearch = filterValues?.q || ''

  return (
    <Box sx={{
      p: 2,
      backgroundColor: 'rgba(10, 10, 10, 0.95)',
      border: '1px solid rgba(225, 29, 72, 0.2)',
      borderRadius: '8px 8px 0 0',
      borderBottom: 'none'
    }}>
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        {/* Search Input */}
        <Box sx={{ minWidth: 200 }}>
          <input
            type="text"
            placeholder="Search events..."
            value={currentSearch}
            onChange={(e) => handleSearchChange(e.target.value)}
            style={{
              width: '100%',
              height: '40px',
              padding: '8px 12px',
              backgroundColor: '#0f0f0f',
              border: '1px solid rgba(225, 29, 72, 0.3)',
              borderRadius: '4px',
              color: '#ffffff',
              fontSize: '14px'
            }}
          />
        </Box>

        {/* Status Filter Buttons */}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {statusFilters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => handleStatusChange(filter.id)}
              style={{
                padding: '8px 12px',
                backgroundColor: currentStatus === filter.id
                  ? 'rgba(225, 29, 72, 0.2)'
                  : 'rgba(10, 10, 10, 0.8)',
                border: `1px solid ${currentStatus === filter.id
                  ? '#e11d48'
                  : 'rgba(225, 29, 72, 0.3)'}`,
                borderRadius: '4px',
                color: currentStatus === filter.id ? '#e11d48' : '#ffffff',
                fontSize: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <span>{filter.icon}</span>
              {filter.name}
            </button>
          ))}
        </Box>

        {/* Type Filter */}
        <Box sx={{ minWidth: 120 }}>
          <select
            value={currentType}
            onChange={(e) => handleTypeChange(e.target.value)}
            style={{
              width: '100%',
              height: '40px',
              padding: '8px 12px',
              backgroundColor: '#0f0f0f',
              border: '1px solid rgba(225, 29, 72, 0.3)',
              borderRadius: '4px',
              color: '#ffffff',
              fontSize: '14px'
            }}
          >
            <option value="">All Types</option>
            {EVENT_TYPE_CHOICES.map((choice) => (
              <option key={choice.id} value={choice.id}>
                {choice.name}
              </option>
            ))}
          </select>
        </Box>
      </Box>
    </Box>
  )
}

export const EventList = () => (
  <List
    perPage={25}
    sx={{
      '& .RaList-content': {
        '& > *:not(:last-child)': {
          marginBottom: 0
        }
      }
    }}
  >
    <EventFilterToolbar />
    <Datagrid
      rowClick="show"
      sx={{
        marginTop: 0,
        borderRadius: '0 0 8px 8px',
        border: '1px solid rgba(225, 29, 72, 0.2)',
        borderTop: 'none',
        overflow: 'hidden',
        '& .RaDatagrid-table': {
          borderRadius: 0,
        },
        '& .RaDatagrid-headerCell': {
          fontWeight: 'bold',
          fontSize: '0.9rem',
          backgroundColor: 'rgba(10, 10, 10, 0.95)',
          color: '#ffffff',
          borderBottom: '2px solid #e11d48',
          borderTop: 'none'
        },
        '& .RaDatagrid-rowCell': {
          padding: '14px 10px',
          backgroundColor: 'rgba(10, 10, 10, 0.8)',
          color: '#ffffff',
          borderBottom: '1px solid rgba(225, 29, 72, 0.2)'
        },
        '& .RaDatagrid-tbody tr:nth-of-type(even)': {
          backgroundColor: 'rgba(225, 29, 72, 0.05)'
        },
        '& .RaDatagrid-tbody tr:hover': {
          backgroundColor: 'rgba(225, 29, 72, 0.15) !important'
        }
      }}
    >
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
            <FunctionField
              source="description"
              render={(record: any) =>
                record.description ? (
                  <Box sx={{
                    p: 2,
                    bgcolor: '#0f0f0f',
                    borderRadius: 1,
                    border: '1px solid rgba(245, 124, 0, 0.3)',
                  }}>
                    <EnhancedSpoilerMarkdown
                      content={record.description}
                      className="admin-description"
                      enableEntityEmbeds={true}
                      compactEntityCards={true}
                    />
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No description
                  </Typography>
                )
              }
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
                defaultValue={EventStatus.PENDING}
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
              helperText="Detailed description of what happens in this event. Supports Markdown formatting."
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
                defaultValue={EventStatus.PENDING}
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
              helperText="Detailed description of what happens in this event. Supports Markdown formatting."
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