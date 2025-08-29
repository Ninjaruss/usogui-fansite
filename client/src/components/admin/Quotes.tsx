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
  ReferenceInput,
  AutocompleteInput,
  NumberInput
} from 'react-admin'

export const QuoteList = () => (
  <List>
    <Datagrid rowClick="show">
      <TextField source="id" />
      <TextField source="text" />
      <TextField source="character.name" label="Character" />
      <TextField source="chapterNumber" />
      <TextField source="description" />
    </Datagrid>
  </List>
)

export const QuoteShow = () => (
  <Show>
    <SimpleShowLayout>
      <TextField source="id" />
      <TextField source="text" />
      <TextField source="character.name" label="Character" />
      <TextField source="chapterNumber" />
      <TextField source="description" />
      <TextField source="pageNumber" />
    </SimpleShowLayout>
  </Show>
)

export const QuoteEdit = () => (
  <Edit>
    <SimpleForm>
      <TextInput source="text" multiline rows={4} required />
      <ReferenceInput source="characterId" reference="characters" label="Character">
        <AutocompleteInput optionText="name" isRequired />
      </ReferenceInput>
      <NumberInput source="chapterNumber" required label="Chapter Number" max={539} />
      <TextInput source="description" multiline rows={2} label="Context/Description" />
      <NumberInput source="pageNumber" label="Page Number" />
    </SimpleForm>
  </Edit>
)

export const QuoteCreate = () => (
  <Create>
    <SimpleForm>
      <TextInput source="text" multiline rows={4} required />
      <ReferenceInput source="characterId" reference="characters" label="Character">
        <AutocompleteInput optionText="name" isRequired />
      </ReferenceInput>
      <NumberInput source="chapterNumber" required label="Chapter Number" max={539} />
      <TextInput source="description" multiline rows={2} label="Context/Description" />
      <NumberInput source="pageNumber" label="Page Number" />
    </SimpleForm>
  </Create>
)