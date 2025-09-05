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
    <TabbedShowLayout>
      <Tab label="Overview">
        <Box sx={{ p: 2 }}>
          <TextField source="title" 
            sx={{ 
              mb: 3, 
              fontSize: '1.5rem', 
              fontWeight: 600, 
              display: 'block',
              '& .MuiTypography-root': { fontSize: '1.5rem', fontWeight: 600 }
            }} 
          />
          
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 3, mb: 3 }}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>Type & Status</Typography>
              <TextField source="type" sx={{ textTransform: 'capitalize', fontWeight: 500, mb: 1 }} />
              <TextField source="status" sx={{ textTransform: 'capitalize' }} />
            </Box>
            
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>Chapter Info</Typography>
              <NumberField source="chapterNumber" label="Chapter" sx={{ fontWeight: 500, mb: 1 }} />
              <NumberField source="spoilerChapter" label="Spoiler Chapter" emptyText="None" />
            </Box>
          </Box>
          
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 3, mb: 3 }}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>Context</Typography>
              <ReferenceField source="arcId" reference="arcs" label="Arc" emptyText="-">
                <TextField source="name" sx={{ fontWeight: 500 }} />
              </ReferenceField>
              <ReferenceField source="gambleId" reference="gambles" label="Gamble" emptyText="-">
                <TextField source="name" sx={{ fontWeight: 500 }} />
              </ReferenceField>
            </Box>
            
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>Metadata</Typography>
              <ReferenceField source="createdBy.id" reference="users" label="Created By" emptyText="-">
                <TextField source="username" />
              </ReferenceField>
              <DateField source="createdAt" showTime={false} sx={{ display: 'block' }} />
            </Box>
          </Box>
        </Box>
      </Tab>
      
      <Tab label="Description">
        <Box sx={{ p: 2 }}>
          <TextField 
            source="description" 
            component="pre" 
            sx={{
              whiteSpace: 'pre-wrap', 
              p: 2, 
              bgcolor: 'grey.50', 
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'grey.200',
              fontFamily: 'inherit',
              lineHeight: 1.6
            }} 
          />
        </Box>
      </Tab>
      
      <Tab label="Related Data">
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>Characters</Typography>
          <ArrayField source="characters" label={false}>
            <SingleFieldList linkType={false}>
              <ChipField source="name" sx={{ mr: 1, mb: 1 }} />
            </SingleFieldList>
          </ArrayField>
          
          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Tags</Typography>
          <ArrayField source="tags" label={false}>
            <Datagrid bulkActionButtons={false} sx={{ boxShadow: 'none' }}>
              <TextField source="name" sx={{ fontWeight: 500 }} />
              <TextField source="description" />
            </Datagrid>
          </ArrayField>
        </Box>
      </Tab>
    </TabbedShowLayout>
  </Show>
)

export const EventEdit = () => (
  <Edit>
    <TabbedForm>
      <FormTab label="Basic Info">
        <Box sx={{ maxWidth: 600 }}>
          <Typography variant="h6" gutterBottom sx={{ color: 'text.primary', mb: 2 }}>Event Details</Typography>
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
          
          <Typography variant="subtitle1" gutterBottom sx={{ mt: 3, mb: 1, color: 'text.primary' }}>Description</Typography>
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
        <Box sx={{ maxWidth: 600 }}>
          <Typography variant="h6" gutterBottom sx={{ color: 'text.primary', mb: 2 }}>Story Context</Typography>
          <ReferenceInput source="arcId" reference="arcs" label="Arc" sx={{ mb: 3 }}>
            <AutocompleteInput 
              optionText="name" 
              helperText="Which story arc does this event belong to?"
            />
          </ReferenceInput>
          
          <ReferenceInput source="gambleId" reference="gambles" label="Associated Gamble" sx={{ mb: 3 }}>
            <AutocompleteInput 
              optionText="name" 
              helperText="Link to a specific gamble if relevant"
            />
          </ReferenceInput>
          
          <Typography variant="subtitle1" gutterBottom sx={{ mt: 3, mb: 1, color: 'text.primary' }}>Participants & Tags</Typography>
          <Box sx={{ mb: 3 }}>
            <ReferenceArrayInput source="characterIds" reference="characters" label="Characters">
              <AutocompleteArrayInput 
                optionText="name" 
                helperText="Characters involved in this event"
              />
            </ReferenceArrayInput>
          </Box>
          
          <ReferenceArrayInput source="tagIds" reference="tags" label="Tags">
            <AutocompleteArrayInput 
              optionText="name" 
              helperText="Relevant tags for categorization"
            />
          </ReferenceArrayInput>
        </Box>
      </FormTab>
    </TabbedForm>
  </Edit>
)

export const EventCreate = () => (
  <Create>
    <TabbedForm>
      <FormTab label="Basic Info">
        <Box sx={{ maxWidth: 600 }}>
          <Typography variant="h6" gutterBottom sx={{ color: 'text.primary', mb: 2 }}>New Event</Typography>
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
          
          <Typography variant="subtitle1" gutterBottom sx={{ mt: 3, mb: 1, color: 'text.primary' }}>Description</Typography>
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
        <Box sx={{ maxWidth: 600 }}>
          <Typography variant="h6" gutterBottom sx={{ color: 'text.primary', mb: 2 }}>Story Context</Typography>
          <ReferenceInput source="arcId" reference="arcs" label="Arc" sx={{ mb: 3 }}>
            <AutocompleteInput 
              optionText="name" 
              helperText="Which story arc does this event belong to?"
            />
          </ReferenceInput>
          
          <ReferenceInput source="gambleId" reference="gambles" label="Associated Gamble" sx={{ mb: 3 }}>
            <AutocompleteInput 
              optionText="name" 
              helperText="Link to a specific gamble if relevant"
            />
          </ReferenceInput>
          
          <Typography variant="subtitle1" gutterBottom sx={{ mt: 3, mb: 1, color: 'text.primary' }}>Participants & Tags</Typography>
          <Box sx={{ mb: 3 }}>
            <ReferenceArrayInput source="characterIds" reference="characters" label="Characters">
              <AutocompleteArrayInput 
                optionText="name" 
                helperText="Characters involved in this event"
              />
            </ReferenceArrayInput>
          </Box>
          
          <ReferenceArrayInput source="tagIds" reference="tags" label="Tags">
            <AutocompleteArrayInput 
              optionText="name" 
              helperText="Relevant tags for categorization"
            />
          </ReferenceArrayInput>
        </Box>
      </FormTab>
    </TabbedForm>
  </Create>
)