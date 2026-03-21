'use client'

import React from 'react'
import {
  List,
  Datagrid,
  TextField,
  DateField,
  FunctionField,
  SelectInput,
  useRecordContext,
} from 'react-admin'
import { Chip, Typography } from '@mui/material'

const entityTypeChoices = [
  { id: 'character', name: 'Character' },
  { id: 'gamble', name: 'Gamble' },
  { id: 'arc', name: 'Arc' },
  { id: 'organization', name: 'Organization' },
  { id: 'event', name: 'Event' },
  { id: 'guide', name: 'Guide' },
  { id: 'volume', name: 'Volume' },
  { id: 'chapter', name: 'Chapter' },
  { id: 'media', name: 'Media' },
  { id: 'quote', name: 'Quote' },
]

const editLogFilters = [
  <SelectInput
    key="entityType"
    source="entityType"
    label="Entity Type"
    choices={entityTypeChoices}
    alwaysOn
  />,
]

const ChangedFieldsDisplay = () => {
  const record = useRecordContext()
  if (!record?.changedFields)
    return (
      <Typography variant="caption" color="text.secondary">
        —
      </Typography>
    )
  const fields =
    typeof record.changedFields === 'string'
      ? JSON.parse(record.changedFields)
      : record.changedFields
  const keys = Object.keys(fields || {})
  if (keys.length === 0)
    return (
      <Typography variant="caption" color="text.secondary">
        —
      </Typography>
    )
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
      {keys.slice(0, 5).map(k => (
        <Chip key={k} label={k} size="small" variant="outlined" />
      ))}
      {keys.length > 5 && (
        <Typography variant="caption" sx={{ alignSelf: 'center' }}>
          +{keys.length - 5} more
        </Typography>
      )}
    </div>
  )
}

export const EditLogList = () => (
  <List
    filters={editLogFilters}
    sort={{ field: 'createdAt', order: 'DESC' }}
    perPage={25}
    exporter={false}
  >
    <Datagrid bulkActionButtons={false} rowClick={false}>
      <DateField source="createdAt" label="Timestamp" showTime />
      <TextField source="entityType" label="Entity Type" />
      <TextField source="entityId" label="Entity ID" />
      <TextField source="action" label="Action" />
      <FunctionField label="Changed Fields" render={() => <ChangedFieldsDisplay />} />
      <TextField source="userId" label="User ID" />
    </Datagrid>
  </List>
)
