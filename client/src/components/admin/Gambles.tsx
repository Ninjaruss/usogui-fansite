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
  NumberField
} from 'react-admin'
import { Box, Typography } from '@mui/material'


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
      <NumberField source="chapterId" label="Ch." />
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
    <TabbedShowLayout>
      <Tab label="Overview">
        <Box sx={{ p: 2 }}>
          <TextField source="name" 
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
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>Chapter</Typography>
              <NumberField source="chapterId" sx={{ fontWeight: 500, fontSize: '1.1rem' }} />
            </Box>
            
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>Created</Typography>
              <DateField source="createdAt" showTime={false} sx={{ fontWeight: 500 }} />
              <DateField source="updatedAt" showTime={false} label="Updated" sx={{ display: 'block', fontSize: '0.875rem', color: 'text.secondary' }} />
            </Box>
          </Box>
        </Box>
      </Tab>
      
      <Tab label="Game Rules">
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom sx={{ color: 'text.primary' }}>Rules</Typography>
          <TextField 
            source="rules" 
            component="pre" 
            sx={{
              whiteSpace: 'pre-wrap', 
              p: 2, 
              bgcolor: 'grey.50', 
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'grey.200',
              fontFamily: 'inherit',
              lineHeight: 1.6,
              mb: 3
            }} 
          />
          
          <Typography variant="h6" gutterBottom sx={{ color: 'text.primary' }}>Win Conditions</Typography>
          <TextField 
            source="winCondition" 
            component="pre" 
            emptyText="No specific win conditions defined"
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
      
      <Tab label="Participants">
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom sx={{ color: 'text.primary', mb: 2 }}>Gamble Participants</Typography>
          <ArrayField source="participants" label={false}>
            <Datagrid bulkActionButtons={false} sx={{ boxShadow: 'none' }}>
              <TextField source="name" sx={{ fontWeight: 500 }} />
              <TextField source="nicknames" label="Also known as" emptyText="-" />
            </Datagrid>
          </ArrayField>
        </Box>
      </Tab>
      
      <Tab label="Related Events">
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom sx={{ color: 'text.primary' }}>Events in this Gamble</Typography>
          <ReferenceManyField
            reference="events"
            target="gambleId"
            label={false}
            emptyText="No related events found"
          >
            <Datagrid bulkActionButtons={false} rowClick="show" sx={{ boxShadow: 'none' }}>
              <TextField source="title" sx={{ fontWeight: 500 }} />
              <TextField source="type" sx={{ textTransform: 'capitalize' }} />
              <NumberField source="chapterNumber" label="Ch." />
              <TextField source="status" sx={{ textTransform: 'capitalize' }} />
            </Datagrid>
          </ReferenceManyField>
        </Box>
      </Tab>
    </TabbedShowLayout>
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
    >
      <FormTab label="Basic Info">
        <Box sx={{ maxWidth: 600 }}>
          <Typography variant="h6" gutterBottom sx={{ color: 'text.primary', mb: 2 }}>Gamble Details</Typography>
          <TextInput 
            source="name" 
            required 
            fullWidth 
            sx={{ mb: 3 }}
            helperText="Name or title of this gamble"
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
        <Box sx={{ maxWidth: 800 }}>
          <Typography variant="h6" gutterBottom sx={{ color: 'text.primary', mb: 2 }}>How the Game Works</Typography>
          <TextInput 
            source="rules" 
            multiline 
            rows={8} 
            required 
            fullWidth
            label="Game Rules"
            helperText="Detailed explanation of how the gamble works"
            sx={{ mb: 3 }}
          />
          
          <Typography variant="subtitle1" gutterBottom sx={{ mt: 3, mb: 1, color: 'text.primary' }}>Victory Conditions</Typography>
          <TextInput 
            source="winCondition" 
            multiline 
            rows={4}
            fullWidth
            label="Win Conditions"
            helperText="What determines victory in this gamble (optional)"
          />
        </Box>
      </FormTab>

      <FormTab label="Participants">
        <Box sx={{ maxWidth: 600 }}>
          <Typography variant="h6" gutterBottom sx={{ color: 'text.primary', mb: 2 }}>Gamble Participants</Typography>
          <ReferenceArrayInput source="participantIds" reference="characters">
            <AutocompleteArrayInput 
              optionText="name" 
              helperText="Characters who participated in this gamble"
              fullWidth
              noOptionsText="No characters available"
            />
          </ReferenceArrayInput>
        </Box>
      </FormTab>

      <FormTab label="Related Events">
        <Box sx={{ maxWidth: 600 }}>
          <Typography variant="h6" gutterBottom sx={{ color: 'text.primary', mb: 2 }}>Associated Events</Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            Events related to this gamble are managed from the Events admin page.
            After saving this gamble, you can link events to it from the Events section.
          </Typography>
        </Box>
      </FormTab>
    </TabbedForm>
  )
}

export const GambleEdit = () => {
  return (
    <Edit>
      <GambleEditForm />
    </Edit>
  )
}

export const GambleCreate = () => {
  return (
    <Create>
      <TabbedForm>
        <FormTab label="Basic Info">
          <Box sx={{ maxWidth: 600 }}>
            <Typography variant="h6" gutterBottom sx={{ color: 'text.primary', mb: 2 }}>New Gamble</Typography>
            <TextInput 
              source="name" 
              required 
              fullWidth 
              sx={{ mb: 3 }}
              helperText="Name or title of this gamble"
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
          <Box sx={{ maxWidth: 800 }}>
            <Typography variant="h6" gutterBottom sx={{ color: 'text.primary', mb: 2 }}>How the Game Works</Typography>
            <TextInput 
              source="rules" 
              multiline 
              rows={8} 
              required 
              fullWidth
              label="Game Rules"
              helperText="Detailed explanation of how the gamble works"
              sx={{ mb: 3 }}
            />
            
            <Typography variant="subtitle1" gutterBottom sx={{ mt: 3, mb: 1, color: 'text.primary' }}>Victory Conditions</Typography>
            <TextInput 
              source="winCondition" 
              multiline 
              rows={4}
              fullWidth
              label="Win Conditions"
              helperText="What determines victory in this gamble (optional)"
            />
          </Box>
        </FormTab>

        <FormTab label="Participants">
          <Box sx={{ maxWidth: 600 }}>
            <Typography variant="h6" gutterBottom sx={{ color: 'text.primary', mb: 2 }}>Gamble Participants</Typography>
            <ReferenceArrayInput source="participantIds" reference="characters">
              <AutocompleteArrayInput 
                optionText="name" 
                helperText="Characters who participated in this gamble"
                fullWidth
                noOptionsText="No characters available"
              />
            </ReferenceArrayInput>
          </Box>
        </FormTab>

        <FormTab label="Related Events">
          <Box sx={{ maxWidth: 600 }}>
            <Typography variant="h6" gutterBottom sx={{ color: 'text.primary', mb: 2 }}>Associated Events</Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              Events related to this gamble are managed from the Events admin page.
              After creating this gamble, you can link events to it from the Events section.
            </Typography>
          </Box>
        </FormTab>
      </TabbedForm>
    </Create>
  )
}