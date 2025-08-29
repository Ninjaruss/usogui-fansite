import React from 'react'
import {
  List,
  Datagrid,
  TextField,
  Edit,
  Create,
  Show,
  SimpleForm,
  SimpleShowLayout,
  TextInput
} from 'react-admin'

export const TagList = () => (
  <List>
    <Datagrid rowClick="show">
      <TextField source="id" />
      <TextField source="name" />
      <TextField source="description" />
    </Datagrid>
  </List>
)

export const TagShow = () => (
  <Show>
    <SimpleShowLayout>
      <TextField source="id" />
      <TextField source="name" />
      <TextField source="description" />
    </SimpleShowLayout>
  </Show>
)

export const TagEdit = () => (
  <Edit>
    <SimpleForm>
      <TextInput source="name" required />
      <TextInput source="description" multiline rows={2} />
    </SimpleForm>
  </Edit>
)

export const TagCreate = () => (
  <Create>
    <SimpleForm>
      <TextInput source="name" required />
      <TextInput source="description" multiline rows={2} />
    </SimpleForm>
  </Create>
)