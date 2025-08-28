"use client";

import {
  List,
  Datagrid,
  TextField,
  NumberField,
  DateField,
  EditButton,
  DeleteButton,
  Edit,
  SimpleForm,
  TextInput,
  Create,
  DateInput,
  Show,
  SimpleShowLayout,
  ShowButton,
  ReferenceField,
  ReferenceInput,
  SelectInput,
  ArrayInput,
  SimpleFormIterator,
} from 'react-admin';

export const GuideList = () => (
  <List>
    <Datagrid>
      <TextField source="id" />
      <TextField source="title" />
      <ReferenceField source="authorId" reference="users">
        <TextField source="username" />
      </ReferenceField>
      <NumberField source="likes" />
      <DateField source="createdAt" />
      <DateField source="updatedAt" />
      <EditButton />
      <ShowButton />
      <DeleteButton />
    </Datagrid>
  </List>
);

export const GuideEdit = () => (
  <Edit>
    <SimpleForm>
      <TextInput source="id" disabled />
      <TextInput source="title" />
      <TextInput source="content" multiline />
      <ReferenceInput source="authorId" reference="users">
        <SelectInput optionText="username" />
      </ReferenceInput>
      <ArrayInput source="tags">
        <SimpleFormIterator>
          <ReferenceInput source="id" reference="tags">
            <SelectInput optionText="name" />
          </ReferenceInput>
        </SimpleFormIterator>
      </ArrayInput>
      <DateInput source="createdAt" disabled />
      <DateInput source="updatedAt" disabled />
    </SimpleForm>
  </Edit>
);

export const GuideCreate = () => (
  <Create>
    <SimpleForm>
      <TextInput source="title" />
      <TextInput source="content" multiline />
      <ReferenceInput source="authorId" reference="users">
        <SelectInput optionText="username" />
      </ReferenceInput>
      <ArrayInput source="tags">
        <SimpleFormIterator>
          <ReferenceInput source="id" reference="tags">
            <SelectInput optionText="name" />
          </ReferenceInput>
        </SimpleFormIterator>
      </ArrayInput>
    </SimpleForm>
  </Create>
);

export const GuideShow = () => (
  <Show>
    <SimpleShowLayout>
      <TextField source="id" />
      <TextField source="title" />
      <TextField source="content" />
      <ReferenceField source="authorId" reference="users">
        <TextField source="username" />
      </ReferenceField>
      <NumberField source="likes" />
      <DateField source="createdAt" />
      <DateField source="updatedAt" />
    </SimpleShowLayout>
  </Show>
);
