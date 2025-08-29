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
  NumberField,
  SelectInput,
  ReferenceField,
  ReferenceInput,
  AutocompleteInput
} from 'react-admin'

export const EventList = () => (
  <List>
    <Datagrid rowClick="show">
      <TextField source="id" />
      <TextField source="title" />
      <TextField source="type" />
      <NumberField source="startChapter" />
      <NumberField source="endChapter" />
      <ReferenceField source="arcId" reference="arcs" label="Arc">
        <TextField source="name" />
      </ReferenceField>
      <TextField source="description" />
    </Datagrid>
  </List>
)

export const EventShow = () => (
  <Show>
    <SimpleShowLayout>
      <TextField source="id" />
      <TextField source="title" />
      <TextField source="description" />
      <TextField source="type" />
      <NumberField source="startChapter" />
      <NumberField source="endChapter" />
      <NumberField source="spoilerChapter" />
      <ReferenceField source="arcId" reference="arcs" label="Arc">
        <TextField source="name" />
      </ReferenceField>
    </SimpleShowLayout>
  </Show>
)

export const EventEdit = () => (
  <Edit>
    <SimpleForm>
      <TextInput source="title" required />
      <TextInput source="description" multiline rows={4} required />
      <SelectInput
        source="type"
        choices={[
          { id: 'arc', name: 'Arc' },
          { id: 'character_reveal', name: 'Character Reveal' },
          { id: 'plot_twist', name: 'Plot Twist' },
          { id: 'death', name: 'Death' },
          { id: 'backstory', name: 'Backstory' },
          { id: 'plot', name: 'Plot' },
          { id: 'other', name: 'Other' },
        ]}
        required
      />
      <NumberInput source="startChapter" required max={539} />
      <NumberInput source="endChapter" max={539} />
      <NumberInput source="spoilerChapter" max={539} />
      <ReferenceInput source="arcId" reference="arcs" label="Arc">
        <AutocompleteInput optionText="name" />
      </ReferenceInput>
    </SimpleForm>
  </Edit>
)

export const EventCreate = () => (
  <Create>
    <SimpleForm>
      <TextInput source="title" required />
      <TextInput source="description" multiline rows={4} required />
      <SelectInput
        source="type"
        choices={[
          { id: 'arc', name: 'Arc' },
          { id: 'character_reveal', name: 'Character Reveal' },
          { id: 'plot_twist', name: 'Plot Twist' },
          { id: 'death', name: 'Death' },
          { id: 'backstory', name: 'Backstory' },
          { id: 'plot', name: 'Plot' },
          { id: 'other', name: 'Other' },
        ]}
        required
        defaultValue="other"
      />
      <NumberInput source="startChapter" required max={539} />
      <NumberInput source="endChapter" max={539} />
      <NumberInput source="spoilerChapter" max={539} />
      <ReferenceInput source="arcId" reference="arcs" label="Arc">
        <AutocompleteInput optionText="name" />
      </ReferenceInput>
    </SimpleForm>
  </Create>
)