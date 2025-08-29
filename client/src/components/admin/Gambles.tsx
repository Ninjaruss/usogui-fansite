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
  SelectInput,
  NumberInput,
  ReferenceInput,
  AutocompleteInput,
  ReferenceArrayInput,
  AutocompleteArrayInput
} from 'react-admin'

export const GambleList = () => (
  <List>
    <Datagrid rowClick="show">
      <TextField source="id" />
      <TextField source="name" />
      <TextField source="chapterId" label="Chapter" />
      <ArrayField source="participants" label="Participants">
        <SingleFieldList>
          <ChipField source="character.name" size="small" />
        </SingleFieldList>
      </ArrayField>
      <ArrayField source="observers" label="Observers">
        <SingleFieldList>
          <ChipField source="name" size="small" />
        </SingleFieldList>
      </ArrayField>
    </Datagrid>
  </List>
)

export const GambleShow = () => (
  <Show>
    <SimpleShowLayout>
      <TextField source="id" />
      <TextField source="name" />
      <TextField source="rules" />
      <TextField source="winCondition" />
      <TextField source="chapterId" label="Chapter" />
      <ArrayField source="participants" label="Participants">
        <SingleFieldList>
          <ChipField source="character.name" />
        </SingleFieldList>
      </ArrayField>
      <ArrayField source="rounds" label="Rounds">
        <SingleFieldList>
          <ChipField source="roundNumber" />
        </SingleFieldList>
      </ArrayField>
      <ArrayField source="observers" label="Observers">
        <SingleFieldList>
          <ChipField source="name" />
        </SingleFieldList>
      </ArrayField>
    </SimpleShowLayout>
  </Show>
)

export const GambleEdit = () => (
  <Edit>
    <SimpleForm>
      <TextInput source="name" required />
      <TextInput source="rules" multiline rows={6} required />
      <TextInput source="winCondition" multiline rows={3} />
      <NumberInput source="chapterId" label="Chapter Number" required max={539} />
      <SelectInput 
        source="hasTeams" 
        label="Type"
        choices={[
          { id: false, name: 'Individual' },
          { id: true, name: 'Team-based' }
        ]}
      />
      <ArrayInput source="participants" label="Participants">
        <SimpleFormIterator>
          <ReferenceInput source="characterId" reference="characters" label="Character" required>
            <AutocompleteInput optionText="name" />
          </ReferenceInput>
          <TextInput source="teamName" label="Team Name (optional)" />
          <SelectInput 
            source="isWinner" 
            label="Winner?"
            choices={[
              { id: false, name: 'No' },
              { id: true, name: 'Yes' }
            ]}
          />
          <TextInput source="stake" label="What they're betting" />
        </SimpleFormIterator>
      </ArrayInput>
      <ArrayInput source="rounds" label="Rounds">
        <SimpleFormIterator>
          <NumberInput source="roundNumber" label="Round Number" />
          <TextInput source="outcome" label="What happened" multiline rows={2} required />
          <TextInput source="winnerTeam" label="Winner Team" />
          <TextInput source="reward" label="Reward" />
          <TextInput source="penalty" label="Penalty" />
        </SimpleFormIterator>
      </ArrayInput>
      <ReferenceArrayInput source="observers" reference="characters" label="Observers">
        <AutocompleteArrayInput optionText="name" />
      </ReferenceArrayInput>
    </SimpleForm>
  </Edit>
)

export const GambleCreate = () => (
  <Create>
    <SimpleForm>
      <TextInput source="name" required />
      <TextInput source="rules" multiline rows={6} required />
      <TextInput source="winCondition" multiline rows={3} />
      <NumberInput source="chapterId" label="Chapter Number" required max={539} />
      <SelectInput 
        source="hasTeams" 
        label="Type"
        choices={[
          { id: false, name: 'Individual' },
          { id: true, name: 'Team-based' }
        ]}
        defaultValue={false}
      />
      <ArrayInput source="participants" label="Participants">
        <SimpleFormIterator>
          <ReferenceInput source="characterId" reference="characters" label="Character" required>
            <AutocompleteInput optionText="name" />
          </ReferenceInput>
          <TextInput source="teamName" label="Team Name (optional)" />
          <SelectInput 
            source="isWinner" 
            label="Winner?"
            choices={[
              { id: false, name: 'No' },
              { id: true, name: 'Yes' }
            ]}
            defaultValue={false}
          />
          <TextInput source="stake" label="What they're betting" />
        </SimpleFormIterator>
      </ArrayInput>
      <ArrayInput source="rounds" label="Rounds">
        <SimpleFormIterator>
          <NumberInput source="roundNumber" label="Round Number" />
          <TextInput source="outcome" label="What happened" multiline rows={2} required />
          <TextInput source="winnerTeam" label="Winner Team" />
          <TextInput source="reward" label="Reward" />
          <TextInput source="penalty" label="Penalty" />
        </SimpleFormIterator>
      </ArrayInput>
      <ReferenceArrayInput source="observers" reference="characters" label="Observers">
        <AutocompleteArrayInput optionText="name" />
      </ReferenceArrayInput>
    </SimpleForm>
  </Create>
)