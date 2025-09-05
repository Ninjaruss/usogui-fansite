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
  ArrayInput,
  SimpleFormIterator,
  SimpleShowLayout,
  SelectInput,
  NumberInput,
  ReferenceInput,
  AutocompleteInput,
  ReferenceArrayInput,
  AutocompleteArrayInput,
  TabbedForm,
  FormTab,
  BooleanField,
  DateField,
  ReferenceField,
  useEditController,
  useRecordContext,
  useRedirect,
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
import { Box, Typography, Divider, Card, CardContent } from '@mui/material'


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
  <List filters={GambleFilters} actions={<GambleListActions />}>
    <Datagrid rowClick="show">
      <TextField source="id" />
      <TextField source="name" />
      <NumberField source="chapterId" label="Chapter" />
      <ArrayField source="participants" label="Participants">
        <SingleFieldList linkType={false}>
          <ChipField source="name" size="small" />
        </SingleFieldList>
      </ArrayField>
      <DateField source="createdAt" />
      <DateField source="updatedAt" />
    </Datagrid>
  </List>
)

export const GambleShow = () => (
  <Show>
    <TabbedShowLayout>
      <Tab label="Summary">
        <TextField source="id" label="Gamble ID" />
        <TextField source="name" label="Gamble Name" />
        <NumberField source="chapterId" label="Chapter" />
        <DateField source="createdAt" />
        <DateField source="updatedAt" />
      </Tab>
      
      <Tab label="Game Details">
        <TextField source="rules" component="pre" style={{ whiteSpace: 'pre-wrap' }} />
        <TextField source="winCondition" component="pre" style={{ whiteSpace: 'pre-wrap' }} />
      </Tab>
      
      <Tab label="Participants">
        <ArrayField source="participants" label="Participants">
          <Datagrid bulkActionButtons={false}>
            <TextField source="id" />
            <TextField source="name" />
            <TextField source="nicknames" />
          </Datagrid>
        </ArrayField>
      </Tab>
      
      <Tab label="Related Events">
        <ReferenceManyField
          reference="events"
          target="gambleId"
          label="Events featuring this gamble"
        >
          <Datagrid bulkActionButtons={false} rowClick="show">
            <TextField source="id" />
            <TextField source="title" />
            <TextField source="type" />
            <NumberField source="chapterNumber" />
            <NumberField source="spoilerChapter" />
            <TextField source="status" />
          </Datagrid>
        </ReferenceManyField>
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
        <TextInput source="name" required fullWidth sx={{ mb: 2 }} />
        <NumberInput 
          source="chapterId" 
          label="Chapter Number" 
          required 
          min={1}
          max={539} 
          helperText="Chapter where this gamble occurs (1-539)"
          sx={{ mb: 2 }}
        />
      </FormTab>

      <FormTab label="Game Rules">
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
        <TextInput 
          source="winCondition" 
          multiline 
          rows={4}
          fullWidth
          label="Win Conditions"
          helperText="What determines victory in this gamble"
        />
      </FormTab>

      <FormTab label="Participants">
        <ReferenceArrayInput source="participantIds" reference="characters">
          <AutocompleteArrayInput 
            optionText="name" 
            helperText="Characters who participated in this gamble"
            fullWidth
            noOptionsText="No characters available"
          />
        </ReferenceArrayInput>
      </FormTab>

      <FormTab label="Related Events">
        <Typography variant="body1" color="textSecondary" sx={{ mb: 2 }}>
          Related events are managed from the Events admin page.
          After saving this gamble, you can associate events with it.
        </Typography>
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
          <TextInput source="name" required fullWidth sx={{ mb: 2 }} />
          <NumberInput 
            source="chapterId" 
            label="Chapter Number" 
            required 
            min={1}
            max={539} 
            helperText="Chapter where this gamble occurs (1-539)"
            sx={{ mb: 2 }}
          />
        </FormTab>

        <FormTab label="Game Rules">
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
          <TextInput 
            source="winCondition" 
            multiline 
            rows={4}
            fullWidth
            label="Win Conditions"
            helperText="What determines victory in this gamble (optional)"
          />
        </FormTab>

        <FormTab label="Participants">
          <ReferenceArrayInput source="participantIds" reference="characters">
            <AutocompleteArrayInput 
              optionText="name" 
              helperText="Characters who participated in this gamble"
              fullWidth
              noOptionsText="No characters available"
            />
          </ReferenceArrayInput>
        </FormTab>

        <FormTab label="Related Events">
          <Typography variant="body1" color="textSecondary" sx={{ mb: 2 }}>
            Related events are managed from the Events admin page.
            After saving this gamble, you can associate events with it.
          </Typography>
        </FormTab>
      </TabbedForm>
    </Create>
  )
}