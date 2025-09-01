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
  AutocompleteArrayInput,
  TabbedForm,
  FormTab,
  BooleanField,
  DateField
} from 'react-admin'
import { Box, Typography, Divider, Card, CardContent } from '@mui/material'

export const GambleList = () => (
  <List>
    <Datagrid rowClick="show">
      <TextField source="id" />
      <TextField source="name" />
      <TextField source="chapterId" label="Chapter" />
      <BooleanField source="hasTeams" label="Team Game" />
      <ArrayField source="participants" label="Participants">
        <SingleFieldList>
          <ChipField source="character.name" size="small" />
        </SingleFieldList>
      </ArrayField>
      <TextField source="winnerTeam" label="Winner" />
      <DateField source="createdAt" />
    </Datagrid>
  </List>
)

export const GambleShow = () => (
  <Show>
    <SimpleShowLayout>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>Basic Information</Typography>
        <Divider sx={{ mb: 2 }} />
        <TextField source="id" />
        <TextField source="name" />
        <TextField source="chapterId" label="Chapter" />
        <BooleanField source="hasTeams" label="Team-based Game" />
        <TextField source="winnerTeam" label="Winning Team" />
      </Box>

      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>Game Details</Typography>
        <Divider sx={{ mb: 2 }} />
        <TextField source="rules" />
        <TextField source="winCondition" />
      </Box>

      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>Participants</Typography>
        <Divider sx={{ mb: 2 }} />
        <ArrayField source="participants" label="Players">
          <SingleFieldList>
            <ChipField source="character.name" />
          </SingleFieldList>
        </ArrayField>
        <ArrayField source="observers" label="Observers">
          <SingleFieldList>
            <ChipField source="name" />
          </SingleFieldList>
        </ArrayField>
      </Box>

      <Box>
        <Typography variant="h6" gutterBottom>Rounds</Typography>
        <Divider sx={{ mb: 2 }} />
        <ArrayField source="rounds">
          <SingleFieldList>
            <ChipField source="roundNumber" />
          </SingleFieldList>
        </ArrayField>
      </Box>
    </SimpleShowLayout>
  </Show>
)

export const GambleEdit = () => (
  <Edit>
    <TabbedForm>
      <FormTab label="Basic Info">
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom color="primary">
            Gamble Information
          </Typography>
          <TextInput source="name" required fullWidth sx={{ mb: 2 }} />
          <NumberInput 
            source="chapterId" 
            label="Chapter Number" 
            required 
            max={539} 
            helperText="Chapter where this gamble occurs (1-539)"
            sx={{ mb: 2 }}
          />
          <SelectInput 
            source="hasTeams" 
            label="Game Type"
            choices={[
              { id: false, name: 'Individual Players' },
              { id: true, name: 'Team-based Game' }
            ]}
            helperText="Whether this gamble involves teams or individual participants"
            sx={{ mb: 2 }}
          />
          <TextInput 
            source="winnerTeam" 
            label="Winning Team/Player" 
            helperText="Name of the team or player that won"
            fullWidth
          />
        </Box>
      </FormTab>

      <FormTab label="Game Rules">
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom color="primary">
            Rules & Conditions
          </Typography>
          <TextInput 
            source="rules" 
            multiline 
            rows={8} 
            required 
            fullWidth
            label="Game Rules"
            helperText="Detailed explanation of how the gamble works"
            sx={{ mb: 3 }}
          />
          <TextInput 
            source="winCondition" 
            multiline 
            rows={4}
            fullWidth
            label="Win Conditions"
            helperText="What determines victory in this gamble"
          />
        </Box>
      </FormTab>

      <FormTab label="Participants">
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom color="primary">
            Game Participants
          </Typography>
          <ArrayInput source="participants" label="Players">
            <SimpleFormIterator>
              <Card variant="outlined" sx={{ mb: 2, p: 2 }}>
                <CardContent>
                  <ReferenceInput source="characterId" reference="characters" label="Character" required>
                    <AutocompleteInput optionText="name" />
                  </ReferenceInput>
                  <TextInput source="teamName" label="Team Name" helperText="Leave blank for individual games" />
                  <SelectInput 
                    source="isWinner" 
                    label="Winner?"
                    choices={[
                      { id: false, name: 'No' },
                      { id: true, name: 'Yes' }
                    ]}
                  />
                  <TextInput source="stake" label="Stake" helperText="What this character is betting" />
                </CardContent>
              </Card>
            </SimpleFormIterator>
          </ArrayInput>
        </Box>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom color="primary">
            Observers
          </Typography>
          <ReferenceArrayInput source="observers" reference="characters">
            <AutocompleteArrayInput 
              optionText="name" 
              helperText="Characters who observed but didn't participate"
            />
          </ReferenceArrayInput>
        </Box>
      </FormTab>

      <FormTab label="Rounds">
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom color="primary">
            Game Rounds
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Document the progression of the gamble round by round
          </Typography>
          <ArrayInput source="rounds">
            <SimpleFormIterator>
              <Card variant="outlined" sx={{ mb: 2, p: 2 }}>
                <CardContent>
                  <NumberInput source="roundNumber" label="Round #" />
                  <TextInput 
                    source="outcome" 
                    label="What Happened" 
                    multiline 
                    rows={3} 
                    required 
                    fullWidth
                    helperText="Describe the events of this round"
                  />
                  <TextInput source="winnerTeam" label="Round Winner" />
                  <TextInput source="reward" label="Reward" helperText="What the winner gained" />
                  <TextInput source="penalty" label="Penalty" helperText="What the loser lost" />
                </CardContent>
              </Card>
            </SimpleFormIterator>
          </ArrayInput>
        </Box>
      </FormTab>
    </TabbedForm>
  </Edit>
)

export const GambleCreate = () => (
  <Create>
    <TabbedForm>
      <FormTab label="Basic Info">
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom color="primary">
            New Gamble Information
          </Typography>
          <TextInput source="name" required fullWidth sx={{ mb: 2 }} />
          <NumberInput 
            source="chapterId" 
            label="Chapter Number" 
            required 
            max={539} 
            helperText="Chapter where this gamble occurs (1-539)"
            sx={{ mb: 2 }}
          />
          <SelectInput 
            source="hasTeams" 
            label="Game Type"
            choices={[
              { id: false, name: 'Individual Players' },
              { id: true, name: 'Team-based Game' }
            ]}
            defaultValue={false}
            helperText="Whether this gamble involves teams or individual participants"
            sx={{ mb: 2 }}
          />
          <TextInput 
            source="winnerTeam" 
            label="Winning Team/Player" 
            helperText="Name of the team or player that won (optional)"
            fullWidth
          />
        </Box>
      </FormTab>

      <FormTab label="Game Rules">
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom color="primary">
            Rules & Conditions
          </Typography>
          <TextInput 
            source="rules" 
            multiline 
            rows={8} 
            required 
            fullWidth
            label="Game Rules"
            helperText="Detailed explanation of how the gamble works"
            sx={{ mb: 3 }}
          />
          <TextInput 
            source="winCondition" 
            multiline 
            rows={4}
            fullWidth
            label="Win Conditions"
            helperText="What determines victory in this gamble (optional)"
          />
        </Box>
      </FormTab>

      <FormTab label="Participants">
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom color="primary">
            Game Participants
          </Typography>
          <ArrayInput source="participants" label="Players">
            <SimpleFormIterator>
              <Card variant="outlined" sx={{ mb: 2, p: 2 }}>
                <CardContent>
                  <ReferenceInput source="characterId" reference="characters" label="Character" required>
                    <AutocompleteInput optionText="name" />
                  </ReferenceInput>
                  <TextInput source="teamName" label="Team Name" helperText="Leave blank for individual games" />
                  <SelectInput 
                    source="isWinner" 
                    label="Winner?"
                    choices={[
                      { id: false, name: 'No' },
                      { id: true, name: 'Yes' }
                    ]}
                    defaultValue={false}
                  />
                  <TextInput source="stake" label="Stake" helperText="What this character is betting" />
                </CardContent>
              </Card>
            </SimpleFormIterator>
          </ArrayInput>
        </Box>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom color="primary">
            Observers
          </Typography>
          <ReferenceArrayInput source="observers" reference="characters">
            <AutocompleteArrayInput 
              optionText="name" 
              helperText="Characters who observed but didn't participate"
            />
          </ReferenceArrayInput>
        </Box>
      </FormTab>

      <FormTab label="Rounds">
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom color="primary">
            Game Rounds
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Document the progression of the gamble round by round (optional)
          </Typography>
          <ArrayInput source="rounds">
            <SimpleFormIterator>
              <Card variant="outlined" sx={{ mb: 2, p: 2 }}>
                <CardContent>
                  <NumberInput source="roundNumber" label="Round #" />
                  <TextInput 
                    source="outcome" 
                    label="What Happened" 
                    multiline 
                    rows={3} 
                    required 
                    fullWidth
                    helperText="Describe the events of this round"
                  />
                  <TextInput source="winnerTeam" label="Round Winner" />
                  <TextInput source="reward" label="Reward" helperText="What the winner gained" />
                  <TextInput source="penalty" label="Penalty" helperText="What the loser lost" />
                </CardContent>
              </Card>
            </SimpleFormIterator>
          </ArrayInput>
        </Box>
      </FormTab>
    </TabbedForm>
  </Create>
)