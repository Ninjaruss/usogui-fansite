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
  NumberInput,
  Create,
  DateInput,
  Show,
  SimpleShowLayout,
  ShowButton,
  ReferenceField,
  ReferenceInput,
  SelectInput,
} from 'react-admin';

export const ChapterList = () => (
  <List>
    <Datagrid>
      <TextField source="id" />
      <ReferenceField source="volumeId" reference="volumes">
        <TextField source="title" />
      </ReferenceField>
      <NumberField source="chapterNumber" />
      <TextField source="title" />
      <TextField source="description" />
      <DateField source="createdAt" />
      <DateField source="updatedAt" />
      <EditButton />
      <ShowButton />
      <DeleteButton />
    </Datagrid>
  </List>
);

export const ChapterEdit = () => (
  <Edit>
    <SimpleForm>
      <TextInput source="id" disabled />
      <ReferenceInput source="volumeId" reference="volumes">
        <SelectInput optionText="title" />
      </ReferenceInput>
      <NumberInput source="chapterNumber" />
      <TextInput source="title" />
      <TextInput source="description" multiline />
      <DateInput source="createdAt" disabled />
      <DateInput source="updatedAt" disabled />
    </SimpleForm>
  </Edit>
);

export const ChapterCreate = () => (
  <Create>
    <SimpleForm>
      <ReferenceInput source="volumeId" reference="volumes">
        <SelectInput optionText="title" />
      </ReferenceInput>
      <NumberInput source="chapterNumber" />
      <TextInput source="title" />
      <TextInput source="description" multiline />
    </SimpleForm>
  </Create>
);

export const ChapterShow = () => (
  <Show>
    <SimpleShowLayout>
      <TextField source="id" />
      <ReferenceField source="volumeId" reference="volumes">
        <TextField source="title" />
      </ReferenceField>
      <NumberField source="chapterNumber" />
      <TextField source="title" />
      <TextField source="description" />
      <DateField source="createdAt" />
      <DateField source="updatedAt" />
    </SimpleShowLayout>
  </Show>
);
