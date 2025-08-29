import React from 'react'
import {
  List,
  Datagrid,
  TextField,
  ArrayField,
  ChipField,
  SingleFieldList,
  Edit,
  Create,
  Show,
  SimpleForm,
  TextInput,
  ArrayInput,
  SimpleFormIterator,
  SimpleShowLayout,
  NumberInput,
  NumberField
} from 'react-admin'

export const CharacterList = () => (
  <List>
    <Datagrid rowClick="show">
      <TextField source="id" />
      <TextField source="name" />
      <TextField source="occupation" />
      <NumberField source="firstAppearanceChapter" label="First Chapter" />
      <ArrayField source="alternateNames">
        <SingleFieldList>
          <ChipField source="" size="small" />
        </SingleFieldList>
      </ArrayField>
    </Datagrid>
  </List>
)

export const CharacterShow = () => (
  <Show>
    <SimpleShowLayout>
      <TextField source="id" />
      <TextField source="name" />
      <TextField source="description" />
      <TextField source="occupation" />
      <NumberField source="firstAppearanceChapter" />
      <ArrayField source="alternateNames">
        <SingleFieldList>
          <ChipField source="" />
        </SingleFieldList>
      </ArrayField>
      <ArrayField source="notableRoles">
        <SingleFieldList>
          <ChipField source="" />
        </SingleFieldList>
      </ArrayField>
      <ArrayField source="notableGames">
        <SingleFieldList>
          <ChipField source="" />
        </SingleFieldList>
      </ArrayField>
      <ArrayField source="affiliations">
        <SingleFieldList>
          <ChipField source="" />
        </SingleFieldList>
      </ArrayField>
    </SimpleShowLayout>
  </Show>
)

export const CharacterEdit = () => (
  <Edit>
    <SimpleForm>
      <TextInput source="name" required />
      <TextInput source="description" multiline rows={4} />
      <TextInput source="occupation" />
      <NumberInput source="firstAppearanceChapter" max={539} />
      <ArrayInput source="alternateNames">
        <SimpleFormIterator>
          <TextInput source="" label="Alternate Name" />
        </SimpleFormIterator>
      </ArrayInput>
      <ArrayInput source="notableRoles">
        <SimpleFormIterator>
          <TextInput source="" label="Notable Role" />
        </SimpleFormIterator>
      </ArrayInput>
      <ArrayInput source="notableGames">
        <SimpleFormIterator>
          <TextInput source="" label="Notable Game" />
        </SimpleFormIterator>
      </ArrayInput>
      <ArrayInput source="affiliations">
        <SimpleFormIterator>
          <TextInput source="" label="Affiliation" />
        </SimpleFormIterator>
      </ArrayInput>
    </SimpleForm>
  </Edit>
)

export const CharacterCreate = () => (
  <Create>
    <SimpleForm>
      <TextInput source="name" required />
      <TextInput source="description" multiline rows={4} />
      <TextInput source="occupation" />
      <NumberInput source="firstAppearanceChapter" max={539} />
      <ArrayInput source="alternateNames">
        <SimpleFormIterator>
          <TextInput source="" label="Alternate Name" />
        </SimpleFormIterator>
      </ArrayInput>
      <ArrayInput source="notableRoles">
        <SimpleFormIterator>
          <TextInput source="" label="Notable Role" />
        </SimpleFormIterator>
      </ArrayInput>
      <ArrayInput source="notableGames">
        <SimpleFormIterator>
          <TextInput source="" label="Notable Game" />
        </SimpleFormIterator>
      </ArrayInput>
      <ArrayInput source="affiliations">
        <SimpleFormIterator>
          <TextInput source="" label="Affiliation" />
        </SimpleFormIterator>
      </ArrayInput>
    </SimpleForm>
  </Create>
)