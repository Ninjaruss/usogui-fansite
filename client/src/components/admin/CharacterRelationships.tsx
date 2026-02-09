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
  SelectInput,
  AutocompleteInput,
  useRecordContext,
  FunctionField,
  TopToolbar,
  CreateButton,
  ExportButton
} from 'react-admin'
import { Box, Chip, Typography, Divider } from '@mui/material'
import { ArrowRight } from 'lucide-react'
import { RelationshipType } from '../../types'

// Validation function for chapter range
const validateChapterRange = (values: any) => {
  const errors: any = {}
  if (values.startChapter && values.endChapter && values.startChapter > values.endChapter) {
    errors.endChapter = 'End chapter must be >= start chapter'
  }
  return errors
}

// Relationship type choices for the select input
const RELATIONSHIP_TYPE_CHOICES = [
  { id: RelationshipType.ALLY, name: 'Ally' },
  { id: RelationshipType.RIVAL, name: 'Rival' },
  { id: RelationshipType.MENTOR, name: 'Mentor' },
  { id: RelationshipType.SUBORDINATE, name: 'Subordinate' },
  { id: RelationshipType.FAMILY, name: 'Family' },
  { id: RelationshipType.PARTNER, name: 'Partner' },
  { id: RelationshipType.ENEMY, name: 'Enemy' },
  { id: RelationshipType.ACQUAINTANCE, name: 'Acquaintance' },
]

// Choices for reverse relationship (includes "none" option)
const REVERSE_RELATIONSHIP_CHOICES = [
  { id: '', name: '— No reverse relationship —' },
  { id: RelationshipType.ALLY, name: 'Ally' },
  { id: RelationshipType.RIVAL, name: 'Rival' },
  { id: RelationshipType.MENTOR, name: 'Mentor' },
  { id: RelationshipType.SUBORDINATE, name: 'Subordinate' },
  { id: RelationshipType.FAMILY, name: 'Family' },
  { id: RelationshipType.PARTNER, name: 'Partner' },
  { id: RelationshipType.ENEMY, name: 'Enemy' },
  { id: RelationshipType.ACQUAINTANCE, name: 'Acquaintance' },
]

// Color mapping for relationship types
const getTypeColor = (type: string) => {
  switch (type) {
    case 'ally': return { bg: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }
    case 'rival': return { bg: 'rgba(249, 115, 22, 0.1)', color: '#f97316' }
    case 'mentor': return { bg: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }
    case 'subordinate': return { bg: 'rgba(6, 182, 212, 0.1)', color: '#06b6d4' }
    case 'family': return { bg: 'rgba(236, 72, 153, 0.1)', color: '#ec4899' }
    case 'partner': return { bg: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }
    case 'enemy': return { bg: 'rgba(220, 38, 38, 0.1)', color: '#dc2626' }
    case 'acquaintance': return { bg: 'rgba(107, 114, 128, 0.1)', color: '#6b7280' }
    default: return { bg: 'rgba(158, 158, 158, 0.1)', color: '#9e9e9e' }
  }
}

// Custom field to display relationship type with color
const RelationshipTypeField = () => {
  const record = useRecordContext()
  if (!record) return null

  const colors = getTypeColor(record.relationshipType)

  return (
    <Chip
      label={record.relationshipType}
      size="small"
      sx={{
        backgroundColor: colors.bg,
        color: colors.color,
        fontWeight: 'bold',
        textTransform: 'capitalize',
        fontSize: '0.75rem'
      }}
    />
  )
}

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

// Custom field to display relationship direction
const RelationshipDirectionField = () => {
  const record = useRecordContext()
  if (!record) return null

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <ReferenceField source="sourceCharacterId" reference="characters" link="show">
        <TextField source="name" />
      </ReferenceField>
      <ArrowRight size={16} />
      <ReferenceField source="targetCharacterId" reference="characters" link="show">
        <TextField source="name" />
      </ReferenceField>
    </Box>
  )
}

// Filters for the list
const relationshipFilters = [
  <ReferenceInput key="source" source="sourceCharacterId" reference="characters" label="Source Character" alwaysOn perPage={200}>
    <AutocompleteInput
      optionText="name"
      filterToQuery={(searchText: string) => ({ name: searchText })}
      sx={{ minWidth: 200 }}
    />
  </ReferenceInput>,
  <ReferenceInput key="target" source="targetCharacterId" reference="characters" label="Target Character" perPage={200}>
    <AutocompleteInput
      optionText="name"
      filterToQuery={(searchText: string) => ({ name: searchText })}
      sx={{ minWidth: 200 }}
    />
  </ReferenceInput>,
  <SelectInput key="type" source="relationshipType" choices={RELATIONSHIP_TYPE_CHOICES} label="Type" />,
]

// Custom actions for the list
const ListActions = () => (
  <TopToolbar>
    <CreateButton label="Add Relationship" />
    <ExportButton />
  </TopToolbar>
)

// List component
export const CharacterRelationshipList = () => (
  <List
    sort={{ field: 'id', order: 'DESC' }}
    perPage={25}
    filters={relationshipFilters}
    actions={<ListActions />}
  >
    <Datagrid rowClick="show">
      <NumberField source="id" />
      <FunctionField
        label="Relationship"
        render={() => <RelationshipDirectionField />}
      />
      <FunctionField
        label="Type"
        render={() => <RelationshipTypeField />}
      />
      <FunctionField
        label="Chapter Range"
        render={() => <ChapterRangeField />}
      />
      <NumberField source="spoilerChapter" label="Spoiler Ch." />
      <DateField source="createdAt" showTime sortable />
    </Datagrid>
  </List>
)

// Show component
export const CharacterRelationshipShow = () => (
  <Show>
    <SimpleShowLayout>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.secondary', mt: 1 }}>
          Relationship Details
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
          <ReferenceField source="sourceCharacterId" reference="characters" label="From" link="show">
            <TextField source="name" sx={{ fontWeight: 'bold' }} />
          </ReferenceField>
          <ArrowRight size={20} />
          <FunctionField
            render={() => <RelationshipTypeField />}
          />
          <ArrowRight size={20} />
          <ReferenceField source="targetCharacterId" reference="characters" label="To" link="show">
            <TextField source="name" sx={{ fontWeight: 'bold' }} />
          </ReferenceField>
        </Box>

        <Divider />

        <Typography variant="subtitle2" color="text.secondary">Description</Typography>
        <TextField source="description" emptyText="No description" />

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
export const CharacterRelationshipCreate = () => (
  <Create>
    <SimpleForm validate={validateChapterRange}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 600 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.secondary' }}>
          Characters
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1, fontSize: '0.8rem' }}>
          e.g., If Baku sees Kaji as a Rival, then Baku is the Source and Kaji is the Target.
        </Typography>

        <ReferenceInput source="sourceCharacterId" reference="characters" label="Source Character" perPage={200}>
          <AutocompleteInput
            optionText="name"
            filterToQuery={(searchText: string) => ({ name: searchText })}
            fullWidth
            helperText="The character who has this view of the other"
          />
        </ReferenceInput>

        <ReferenceInput source="targetCharacterId" reference="characters" label="Target Character" perPage={200}>
          <AutocompleteInput
            optionText="name"
            filterToQuery={(searchText: string) => ({ name: searchText })}
            fullWidth
            helperText="The character being viewed"
          />
        </ReferenceInput>

        <Divider sx={{ my: 1 }} />

        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.secondary' }}>
          Source's View of Target
        </Typography>

        <SelectInput
          source="relationshipType"
          label="How Source sees Target"
          choices={RELATIONSHIP_TYPE_CHOICES}
          fullWidth
          helperText="Type of relationship from Source's perspective toward Target"
        />

        <TextInput
          source="description"
          label="Source → Target Description"
          multiline
          rows={2}
          fullWidth
          helperText="How Source relates to Target (optional)"
        />

        <Divider sx={{ my: 1 }} />

        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.secondary' }}>
          Target's View of Source (Optional)
        </Typography>

        <SelectInput
          source="reverseRelationshipType"
          label="How Target sees Source"
          choices={REVERSE_RELATIONSHIP_CHOICES}
          fullWidth
          helperText="Leave empty for one-way relationship, or select same type for symmetric relationships"
        />

        <TextInput
          source="reverseDescription"
          label="Target → Source Description"
          multiline
          rows={2}
          fullWidth
          helperText="How Target relates to Source (optional)"
        />

        <Divider sx={{ my: 1 }} />

        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.secondary' }}>
          Timeline
        </Typography>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <NumberInput
            source="startChapter"
            min={1}
            helperText="Chapter where this relationship begins"
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
export const CharacterRelationshipEdit = () => (
  <Edit>
    <SimpleForm validate={validateChapterRange}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 600 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.secondary' }}>
          Characters
        </Typography>

        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1, fontSize: '0.8rem' }}>
          e.g., If Baku sees Kaji as a Rival, then Baku is the Source and Kaji is the Target.
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
          <ReferenceInput source="sourceCharacterId" reference="characters" label="Source Character" perPage={200}>
            <AutocompleteInput
              optionText="name"
              filterToQuery={(searchText: string) => ({ name: searchText })}
              helperText="The character who has this view of the other"
            />
          </ReferenceInput>
          <ArrowRight size={20} />
          <ReferenceInput source="targetCharacterId" reference="characters" label="Target Character" perPage={200}>
            <AutocompleteInput
              optionText="name"
              filterToQuery={(searchText: string) => ({ name: searchText })}
              helperText="The character being viewed"
            />
          </ReferenceInput>
        </Box>

        <Divider sx={{ my: 1 }} />

        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.secondary' }}>
          Source's View of Target
        </Typography>

        <SelectInput
          source="relationshipType"
          label="How Source sees Target"
          choices={RELATIONSHIP_TYPE_CHOICES}
          fullWidth
          helperText="Type of relationship from Source's perspective toward Target"
        />

        <TextInput
          source="description"
          label="Source → Target Description"
          multiline
          rows={3}
          fullWidth
          helperText="How Source relates to Target (optional)"
        />

        <Divider sx={{ my: 1 }} />

        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.secondary' }}>
          Target's View of Source (Optional)
        </Typography>

        <SelectInput
          source="reverseRelationshipType"
          label="How Target sees Source"
          choices={REVERSE_RELATIONSHIP_CHOICES}
          fullWidth
          helperText="Leave empty to keep as one-way relationship, or select the same type for symmetric relationships"
        />

        <TextInput
          source="reverseDescription"
          label="Target → Source Description"
          multiline
          rows={3}
          fullWidth
          helperText="How Target relates to Source (optional)"
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
            helperText="When this relationship begins"
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
