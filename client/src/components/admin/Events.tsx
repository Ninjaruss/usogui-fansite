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
  SimpleShowLayout,
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
  Labeled,
  useRecordContext,
  FormTab,
  TabbedForm,
  WrapperField
} from 'react-admin'

const EventFilters = [
  <SearchInput key="title-search" source="title" placeholder="Search by title" alwaysOn />,
  <SelectInput
    key="type-filter"
    source="type"
    label="Type"
    choices={[
      { id: 'gamble', name: 'Gamble' },
      { id: 'decision', name: 'Decision' },
      { id: 'reveal', name: 'Reveal' },
      { id: 'shift', name: 'Shift' },
      { id: 'resolution', name: 'Resolution' },
    ]}
  />,
  <SelectInput
    key="status-filter"
    source="status"
    label="Status"
    choices={[
      { id: 'draft', name: 'Draft' },
      { id: 'pending_review', name: 'Pending Review' },
      { id: 'approved', name: 'Approved' },
    ]}
  />,
  <ReferenceInput key="arc-filter" source="arcId" reference="arcs" label="Arc">
    <AutocompleteInput optionText="name" />
  </ReferenceInput>,
  <ReferenceInput key="gamble-filter" source="gambleId" reference="gambles" label="Gamble">
    <AutocompleteInput optionText="name" />
  </ReferenceInput>,
  <ReferenceInput key="creator-filter" source="createdBy.id" reference="users" label="Created By">
    <AutocompleteInput optionText="username" />
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
  <List filters={EventFilters} actions={<EventListActions />}>
    <Datagrid rowClick="show">
      <TextField source="id" />
      <TextField source="title" />
      <TextField source="type" />
      <NumberField source="chapterNumber" />
      <NumberField source="spoilerChapter" label="Spoiler Ch." />
      <TextField source="status" />
      <ReferenceField source="arcId" reference="arcs" label="Arc">
        <TextField source="name" />
      </ReferenceField>
      <ReferenceField source="gambleId" reference="gambles" label="Gamble" emptyText="-">
        <TextField source="name" />
      </ReferenceField>
      <ArrayField source="characters" label="Characters">
        <SingleFieldList linkType={false}>
          <ChipField source="name" size="small" />
        </SingleFieldList>
      </ArrayField>
      <ReferenceField source="createdBy.id" reference="users" label="Created By" emptyText="System">
        <TextField source="username" />
      </ReferenceField>
      <DateField source="createdAt" />
    </Datagrid>
  </List>
)

export const EventShow = () => (
  <Show>
    <TabbedShowLayout>
      <Tab label="Summary">
        <TextField source="id" />
        <TextField source="title" />
        <TextField source="type" />
        <TextField source="status" />
        <NumberField source="chapterNumber" />
        <NumberField source="spoilerChapter" />
        <ReferenceField source="arcId" reference="arcs" label="Arc" emptyText="None">
          <TextField source="name" />
        </ReferenceField>
        <ReferenceField source="gambleId" reference="gambles" label="Gamble" emptyText="None">
          <TextField source="name" />
        </ReferenceField>
        <ReferenceField source="createdBy.id" reference="users" label="Created By" emptyText="System">
          <TextField source="username" />
        </ReferenceField>
        <DateField source="createdAt" />
        <DateField source="updatedAt" />
      </Tab>
      <Tab label="Description">
        <TextField source="description" component="pre" style={{ whiteSpace: 'pre-wrap' }} />
      </Tab>
      <Tab label="Related">
        <ArrayField source="characters" label="Characters">
          <Datagrid bulkActionButtons={false}>
            <TextField source="id" />
            <TextField source="name" />
          </Datagrid>
        </ArrayField>
        <ArrayField source="tags" label="Tags">
          <Datagrid bulkActionButtons={false}>
            <TextField source="id" />
            <TextField source="name" />
            <TextField source="description" />
          </Datagrid>
        </ArrayField>
      </Tab>
    </TabbedShowLayout>
  </Show>
)

export const EventEdit = () => (
  <Edit>
    <TabbedForm>
      <FormTab label="Basic Info">
        <TextInput source="title" required fullWidth />
        <SelectInput
          source="type"
          choices={[
            { id: 'gamble', name: 'Gamble' },
            { id: 'decision', name: 'Decision' },
            { id: 'reveal', name: 'Reveal' },
            { id: 'shift', name: 'Shift' },
            { id: 'resolution', name: 'Resolution' },
          ]}
          required
        />
        <SelectInput
          source="status"
          choices={[
            { id: 'draft', name: 'Draft' },
            { id: 'pending_review', name: 'Pending Review' },
            { id: 'approved', name: 'Approved' },
          ]}
          required
          defaultValue="draft"
        />
        <NumberInput source="chapterNumber" required max={539} min={1} />
        <NumberInput source="spoilerChapter" max={539} min={1} />
        <TextInput source="description" multiline rows={6} required fullWidth />
      </FormTab>
      <FormTab label="Relationships">
        <ReferenceInput source="arcId" reference="arcs" label="Arc">
          <AutocompleteInput optionText="name" />
        </ReferenceInput>
        <ReferenceInput source="gambleId" reference="gambles" label="Gamble">
          <AutocompleteInput optionText="name" />
        </ReferenceInput>
        <ReferenceArrayInput source="characterIds" reference="characters" label="Characters">
          <AutocompleteArrayInput optionText="name" />
        </ReferenceArrayInput>
        <ReferenceArrayInput source="tagIds" reference="tags" label="Tags">
          <AutocompleteArrayInput optionText="name" />
        </ReferenceArrayInput>
      </FormTab>
    </TabbedForm>
  </Edit>
)

export const EventCreate = () => (
  <Create>
    <TabbedForm>
      <FormTab label="Basic Info">
        <TextInput source="title" required fullWidth />
        <SelectInput
          source="type"
          choices={[
            { id: 'gamble', name: 'Gamble' },
            { id: 'decision', name: 'Decision' },
            { id: 'reveal', name: 'Reveal' },
            { id: 'shift', name: 'Shift' },
            { id: 'resolution', name: 'Resolution' },
          ]}
          required
          defaultValue="decision"
        />
        <SelectInput
          source="status"
          choices={[
            { id: 'draft', name: 'Draft' },
            { id: 'pending_review', name: 'Pending Review' },
            { id: 'approved', name: 'Approved' },
          ]}
          required
          defaultValue="draft"
        />
        <NumberInput source="chapterNumber" required max={539} min={1} />
        <NumberInput source="spoilerChapter" max={539} min={1} />
        <TextInput source="description" multiline rows={6} required fullWidth />
      </FormTab>
      <FormTab label="Relationships">
        <ReferenceInput source="arcId" reference="arcs" label="Arc">
          <AutocompleteInput optionText="name" />
        </ReferenceInput>
        <ReferenceInput source="gambleId" reference="gambles" label="Gamble">
          <AutocompleteInput optionText="name" />
        </ReferenceInput>
        <ReferenceArrayInput source="characterIds" reference="characters" label="Characters">
          <AutocompleteArrayInput optionText="name" />
        </ReferenceArrayInput>
        <ReferenceArrayInput source="tagIds" reference="tags" label="Tags">
          <AutocompleteArrayInput optionText="name" />
        </ReferenceArrayInput>
      </FormTab>
    </TabbedForm>
  </Create>
)