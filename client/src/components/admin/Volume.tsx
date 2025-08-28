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

export const VolumeList = () => (
  <List>
    <Datagrid>
      <TextField source="id" />
      <ReferenceField source="seriesId" reference="series">
        <TextField source="title" />
      </ReferenceField>
      <NumberField source="volumeNumber" />
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

export const VolumeEdit = () => (
  <Edit>
    <SimpleForm>
      <TextInput source="id" disabled />
      <ReferenceInput source="seriesId" reference="series">
        <SelectInput optionText="title" />
      </ReferenceInput>
      <NumberInput source="volumeNumber" />
      <TextInput source="title" />
      <TextInput source="description" multiline />
      <DateInput source="createdAt" disabled />
      <DateInput source="updatedAt" disabled />
    </SimpleForm>
  </Edit>
);

export const VolumeCreate = () => (
  <Create>
    <SimpleForm>
      <ReferenceInput source="seriesId" reference="series">
        <SelectInput optionText="title" />
      </ReferenceInput>
      <NumberInput source="volumeNumber" />
      <TextInput source="title" />
      <TextInput source="description" multiline />
    </SimpleForm>
  </Create>
);

export const VolumeShow = () => (
  <Show>
    <SimpleShowLayout>
      <TextField source="id" />
      <ReferenceField source="seriesId" reference="series">
        <TextField source="title" />
      </ReferenceField>
      <NumberField source="volumeNumber" />
      <TextField source="title" />
      <TextField source="description" />
      <DateField source="createdAt" />
      <DateField source="updatedAt" />
    </SimpleShowLayout>
  </Show>
);
