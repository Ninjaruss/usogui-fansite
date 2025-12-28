import React from 'react'
import {
  List,
  Datagrid,
  TextField,
  NumberField,
  DateField,
  Edit,
  Create,
  Show,
  SimpleForm,
  TextInput,
  NumberInput,
  SimpleShowLayout,
  ReferenceField,
  ReferenceInput,
  AutocompleteInput,
  FunctionField,
  TopToolbar,
  CreateButton,
  ExportButton,
  useRecordContext
} from 'react-admin'
import { Box, Chip, Typography, Divider } from '@mui/material'
import { Building2, ArrowRight } from 'lucide-react'

// Custom field to display chapter range
const ChapterRangeField = () => {
  const record = useRecordContext()
  if (!record) return null

  const range = record.endChapter
    ? `Ch. ${record.startChapter} - ${record.endChapter}`
    : `Ch. ${record.startChapter}+`

  return (
    <Chip
      label={range}
      size="small"
      variant="outlined"
      sx={{ fontSize: '0.75rem' }}
    />
  )
}

// Custom field to display role with styling
const RoleField = () => {
  const record = useRecordContext()
  if (!record) return null

  return (
    <Chip
      label={record.role}
      size="small"
      sx={{
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        color: '#8b5cf6',
        fontWeight: 'bold',
        fontSize: '0.75rem'
      }}
    />
  )
}

// Custom field to display membership direction
const MembershipField = () => {
  const record = useRecordContext()
  if (!record) return null

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <ReferenceField source="characterId" reference="characters" link="show">
        <TextField source="name" />
      </ReferenceField>
      <ArrowRight size={16} />
      <ReferenceField source="organizationId" reference="organizations" link="show">
        <TextField source="name" />
      </ReferenceField>
    </Box>
  )
}

// Filters for the list
const membershipFilters = [
  <ReferenceInput key="character" source="characterId" reference="characters" label="Character" alwaysOn>
    <AutocompleteInput
      optionText="name"
      filterToQuery={(searchText: string) => ({ name: searchText })}
      sx={{ minWidth: 200 }}
    />
  </ReferenceInput>,
  <ReferenceInput key="organization" source="organizationId" reference="organizations" label="Organization">
    <AutocompleteInput
      optionText="name"
      filterToQuery={(searchText: string) => ({ name: searchText })}
      sx={{ minWidth: 200 }}
    />
  </ReferenceInput>,
]

// Custom actions for the list
const ListActions = () => (
  <TopToolbar>
    <CreateButton label="Add Membership" />
    <ExportButton />
  </TopToolbar>
)

// List component
export const CharacterOrganizationList = () => (
  <List
    sort={{ field: 'id', order: 'DESC' }}
    perPage={25}
    filters={membershipFilters}
    actions={<ListActions />}
  >
    <Datagrid rowClick="show">
      <NumberField source="id" />
      <FunctionField
        label="Membership"
        render={() => <MembershipField />}
      />
      <FunctionField
        label="Role"
        render={() => <RoleField />}
      />
      <FunctionField
        label="Chapter Range"
        render={() => <ChapterRangeField />}
      />
      <NumberField source="spoilerChapter" label="Spoiler Ch." />
      <DateField source="createdAt" showTime />
    </Datagrid>
  </List>
)

// Show component
export const CharacterOrganizationShow = () => (
  <Show>
    <SimpleShowLayout>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.secondary', mt: 1 }}>
          Membership Details
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
          <ReferenceField source="characterId" reference="characters" label="Character" link="show">
            <TextField source="name" sx={{ fontWeight: 'bold' }} />
          </ReferenceField>
          <ArrowRight size={20} />
          <Building2 size={20} />
          <ReferenceField source="organizationId" reference="organizations" label="Organization" link="show">
            <TextField source="name" sx={{ fontWeight: 'bold' }} />
          </ReferenceField>
        </Box>

        <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary">Role</Typography>
          <FunctionField render={() => <RoleField />} />
        </Box>

        <Divider />

        <Typography variant="subtitle2" color="text.secondary">Notes</Typography>
        <TextField source="notes" emptyText="No notes" />

        <Divider />

        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.secondary' }}>
          Timeline
        </Typography>

        <Box sx={{ display: 'flex', gap: 4 }}>
          <Box>
            <Typography variant="caption" color="text.secondary">Start Chapter</Typography>
            <NumberField source="startChapter" />
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">End Chapter</Typography>
            <NumberField source="endChapter" emptyText="Ongoing" />
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">Spoiler Chapter</Typography>
            <NumberField source="spoilerChapter" />
          </Box>
        </Box>

        <Divider />

        <Box sx={{ display: 'flex', gap: 4 }}>
          <Box>
            <Typography variant="caption" color="text.secondary">ID</Typography>
            <NumberField source="id" />
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">Created</Typography>
            <DateField source="createdAt" showTime />
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">Updated</Typography>
            <DateField source="updatedAt" showTime />
          </Box>
        </Box>
      </Box>
    </SimpleShowLayout>
  </Show>
)

// Create component
export const CharacterOrganizationCreate = () => (
  <Create>
    <SimpleForm>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 600 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.secondary' }}>
          Character & Organization
        </Typography>

        <ReferenceInput source="characterId" reference="characters" label="Character">
          <AutocompleteInput
            optionText="name"
            filterToQuery={(searchText: string) => ({ name: searchText })}
            fullWidth
            helperText="Select the character"
          />
        </ReferenceInput>

        <ReferenceInput source="organizationId" reference="organizations" label="Organization">
          <AutocompleteInput
            optionText="name"
            filterToQuery={(searchText: string) => ({ name: searchText })}
            fullWidth
            helperText="Select the organization"
          />
        </ReferenceInput>

        <Divider sx={{ my: 1 }} />

        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.secondary' }}>
          Role & Details
        </Typography>

        <TextInput
          source="role"
          label="Role"
          fullWidth
          helperText="e.g., Leader, Member, Referee, etc."
        />

        <TextInput
          source="notes"
          label="Notes"
          multiline
          rows={2}
          fullWidth
          helperText="Additional context about this membership (optional)"
        />

        <Divider sx={{ my: 1 }} />

        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.secondary' }}>
          Timeline
        </Typography>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <NumberInput
            source="startChapter"
            min={1}
            helperText="Chapter where this role begins"
            sx={{ flex: 1 }}
          />
          <NumberInput
            source="endChapter"
            min={1}
            helperText="End chapter (optional)"
            sx={{ flex: 1 }}
          />
        </Box>

        <NumberInput
          source="spoilerChapter"
          min={1}
          helperText="Chapter to read before seeing this (defaults to startChapter)"
        />
      </Box>
    </SimpleForm>
  </Create>
)

// Edit component
export const CharacterOrganizationEdit = () => (
  <Edit>
    <SimpleForm>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 600 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.secondary' }}>
          Character & Organization
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
          <ReferenceInput source="characterId" reference="characters" label="Character">
            <AutocompleteInput
              optionText="name"
              filterToQuery={(searchText: string) => ({ name: searchText })}
              helperText="Select the character"
            />
          </ReferenceInput>
          <ArrowRight size={20} />
          <ReferenceInput source="organizationId" reference="organizations" label="Organization">
            <AutocompleteInput
              optionText="name"
              filterToQuery={(searchText: string) => ({ name: searchText })}
              helperText="Select the organization"
            />
          </ReferenceInput>
        </Box>

        <Divider sx={{ my: 1 }} />

        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.secondary' }}>
          Role & Details
        </Typography>

        <TextInput
          source="role"
          label="Role"
          fullWidth
          helperText="e.g., Leader, Member, Referee, etc."
        />

        <TextInput
          source="notes"
          label="Notes"
          multiline
          rows={3}
          fullWidth
          helperText="Additional context about this membership (optional)"
        />

        <Divider sx={{ my: 1 }} />

        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.secondary' }}>
          Timeline
        </Typography>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <NumberInput
            source="startChapter"
            label="Start Chapter"
            min={1}
            sx={{ flex: 1 }}
            helperText="When this role begins"
          />
          <NumberInput
            source="endChapter"
            label="End Chapter"
            min={1}
            sx={{ flex: 1 }}
            helperText="When it ends (optional)"
          />
        </Box>

        <NumberInput
          source="spoilerChapter"
          label="Spoiler Chapter"
          min={1}
          helperText="Chapter to read before seeing this"
        />

        <Divider sx={{ my: 1 }} />

        <NumberInput source="id" label="ID" disabled />
      </Box>
    </SimpleForm>
  </Edit>
)
