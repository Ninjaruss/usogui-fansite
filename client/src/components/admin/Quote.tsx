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
} from 'react-admin';

export const QuoteList = () => (
  <List>
    <Datagrid>
      <TextField source="id" />
      <ReferenceField source="characterId" reference="characters">
        <TextField source="name" />
      </ReferenceField>
      <TextField source="content" />
      <ReferenceField source="chapterId" reference="chapters">
        <TextField source="title" />
      </ReferenceField>
      <DateField source="createdAt" />
      <DateField source="updatedAt" />
      <EditButton />
      <ShowButton />
      <DeleteButton />
    </Datagrid>
  </List>
);

export const QuoteEdit = () => (
  <Edit>
    <SimpleForm>
      <TextInput source="id" disabled />
      <ReferenceInput source="characterId" reference="characters">
        <SelectInput optionText="name" />
      </ReferenceInput>
      <TextInput source="content" multiline />
      <ReferenceInput source="chapterId" reference="chapters">
        <SelectInput optionText="title" />
      </ReferenceInput>
      <DateInput source="createdAt" disabled />
      <DateInput source="updatedAt" disabled />
    </SimpleForm>
  </Edit>
);

export const QuoteCreate = () => (
  <Create>
    <SimpleForm>
      <ReferenceInput source="characterId" reference="characters">
        <SelectInput optionText="name" />
      </ReferenceInput>
      <TextInput source="content" multiline />
      <ReferenceInput source="chapterId" reference="chapters">
        <SelectInput optionText="title" />
      </ReferenceInput>
    </SimpleForm>
  </Create>
);

export const QuoteShow = () => (
  <Show>
    <SimpleShowLayout>
      <TextField source="id" />
      <ReferenceField source="characterId" reference="characters">
        <TextField source="name" />
      </ReferenceField>
      <TextField source="content" />
      <ReferenceField source="chapterId" reference="chapters">
        <TextField source="title" />
      </ReferenceField>
      <DateField source="createdAt" />
      <DateField source="updatedAt" />
    </SimpleShowLayout>
  </Show>
);
