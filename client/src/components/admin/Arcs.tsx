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
  NumberField
} from 'react-admin'
import { EditToolbar } from './EditToolbar'

export const ArcList = () => (
  <List>
    <Datagrid rowClick="show">
      <TextField source="id" />
      <TextField source="name" />
      <NumberField source="startChapter" />
      <NumberField source="endChapter" />
      <TextField source="description" />
    </Datagrid>
  </List>
)

export const ArcShow = () => (
  <Show>
    <SimpleShowLayout>
      <TextField source="id" />
      <TextField source="name" />
      <TextField source="description" />
      <NumberField source="startChapter" />
      <NumberField source="endChapter" />
    </SimpleShowLayout>
  </Show>
)

export const ArcEdit = () => (
  <Edit>
    <SimpleForm 
      toolbar={<EditToolbar 
        resource="arcs"
        confirmTitle="Delete Arc"
        confirmMessage="Are you sure you want to delete this arc? This will remove all associated data and cannot be undone."
      />}
    >
      <TextInput source="name" required />
      <TextInput source="description" multiline rows={4} />
      <NumberInput source="startChapter" required />
      <NumberInput source="endChapter" required />
    </SimpleForm>
  </Edit>
)

export const ArcCreate = () => (
  <Create>
    <SimpleForm>
      <TextInput source="name" required />
      <TextInput source="description" multiline rows={4} />
      <NumberInput source="startChapter" required />
      <NumberInput source="endChapter" required />
    </SimpleForm>
  </Create>
)