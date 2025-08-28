"use client";

import {
  List,
  Datagrid,
  TextField,
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
  ChipField,
  RadioButtonGroupInput,
} from 'react-admin';

const mediaTypeChoices = [
  { id: 'fanart', name: 'Fanart' },
  { id: 'video', name: 'Video' },
];

export const MediaList = () => (
  <List>
    <Datagrid>
      <TextField source="id" />
      <TextField source="title" />
      <TextField source="url" />
      <ChipField source="type" />
      <ReferenceField source="characterId" reference="characters" label="Character">
        <TextField source="name" />
      </ReferenceField>
      <ReferenceField source="arcId" reference="arcs" label="Arc">
        <TextField source="title" />
      </ReferenceField>
      <ReferenceField source="submittedById" reference="users" label="Submitted By">
        <TextField source="username" />
      </ReferenceField>
      <DateField source="createdAt" />
      <DateField source="updatedAt" />
      <EditButton />
      <ShowButton />
      <DeleteButton />
    </Datagrid>
  </List>
);

export const MediaEdit = () => (
  <Edit>
    <SimpleForm>
      <TextInput source="id" disabled />
      <TextInput source="title" />
      <TextInput source="url" />
      <RadioButtonGroupInput source="type" choices={mediaTypeChoices} />
      <ReferenceInput source="characterId" reference="characters" label="Character">
        <SelectInput optionText="name" />
      </ReferenceInput>
      <ReferenceInput source="arcId" reference="arcs" label="Arc">
        <SelectInput optionText="title" />
      </ReferenceInput>
      <ReferenceInput source="submittedById" reference="users" label="Submitted By">
        <SelectInput optionText="username" />
      </ReferenceInput>
      <DateInput source="createdAt" disabled />
      <DateInput source="updatedAt" disabled />
    </SimpleForm>
  </Edit>
);

export const MediaCreate = () => (
  <Create>
    <SimpleForm>
      <TextInput source="title" />
      <TextInput source="url" />
      <RadioButtonGroupInput source="type" choices={mediaTypeChoices} />
      <ReferenceInput source="characterId" reference="characters" label="Character">
        <SelectInput optionText="name" />
      </ReferenceInput>
      <ReferenceInput source="arcId" reference="arcs" label="Arc">
        <SelectInput optionText="title" />
      </ReferenceInput>
      <ReferenceInput source="submittedById" reference="users" label="Submitted By">
        <SelectInput optionText="username" />
      </ReferenceInput>
    </SimpleForm>
  </Create>
);

export const MediaShow = () => (
  <Show>
    <SimpleShowLayout>
      <TextField source="id" />
      <TextField source="title" />
      <TextField source="url" />
      <ChipField source="type" />
      <ReferenceField source="characterId" reference="characters" label="Character">
        <TextField source="name" />
      </ReferenceField>
      <ReferenceField source="arcId" reference="arcs" label="Arc">
        <TextField source="title" />
      </ReferenceField>
      <ReferenceField source="submittedById" reference="users" label="Submitted By">
        <TextField source="username" />
      </ReferenceField>
      <DateField source="createdAt" />
      <DateField source="updatedAt" />
    </SimpleShowLayout>
  </Show>
);
