import React from 'react'
import {
  List,
  Datagrid,
  TextField,
  DateField,
  Edit,
  Create,
  Show,
  SimpleForm,
  TextInput,
  SimpleShowLayout,
  ReferenceField,
  SelectInput,
  NumberField,
  ReferenceInput,
  AutocompleteInput,
  usePermissions
} from 'react-admin'

export const GuideList = () => (
  <List>
    <Datagrid rowClick="show">
      <TextField source="id" />
      <TextField source="title" />
      <TextField source="description" />
      <ReferenceField source="authorId" reference="users" label="Author">
        <TextField source="username" />
      </ReferenceField>
      <TextField source="status" />
      <NumberField source="viewCount" />
      <NumberField source="likeCount" />
      <DateField source="createdAt" />
      <DateField source="updatedAt" />
    </Datagrid>
  </List>
)

export const GuideShow = () => (
  <Show>
    <SimpleShowLayout>
      <TextField source="id" />
      <TextField source="title" />
      <TextField source="description" />
      <TextField source="content" />
      <ReferenceField source="authorId" reference="users" label="Author">
        <TextField source="username" />
      </ReferenceField>
      <TextField source="status" />
      <NumberField source="viewCount" />
      <NumberField source="likeCount" />
      <DateField source="createdAt" />
      <DateField source="updatedAt" />
    </SimpleShowLayout>
  </Show>
)

export const GuideEdit = () => {
  const { permissions } = usePermissions()
  
  return (
    <Edit>
      <SimpleForm>
        <TextInput source="title" required />
        <TextInput source="description" multiline rows={3} required />
        <TextInput source="content" multiline rows={12} required />
        <ReferenceInput 
          source="authorId" 
          reference="users" 
          label="Author"
        >
          <AutocompleteInput 
            optionText="username" 
            disabled={permissions !== 'admin' && permissions !== 'moderator'}
          />
        </ReferenceInput>
        <SelectInput source="status" choices={[
          { id: 'draft', name: 'Draft' },
          { id: 'published', name: 'Published' }
        ]} />
      </SimpleForm>
    </Edit>
  )
}

export const GuideCreate = () => (
  <Create>
    <SimpleForm>
      <TextInput source="title" required />
      <TextInput source="description" multiline rows={3} required />
      <TextInput source="content" multiline rows={12} required />
      <ReferenceInput source="authorId" reference="users" label="Author">
        <AutocompleteInput optionText="username" />
      </ReferenceInput>
      <SelectInput source="status" choices={[
        { id: 'draft', name: 'Draft' },
        { id: 'published', name: 'Published' }
      ]} defaultValue="draft" />
    </SimpleForm>
  </Create>
)