import React from 'react'
import {
  List,
  Datagrid,
  TextField,
  DateField,
  Edit,
  Create,
  Show,
  SimpleForm,
  TextInput,
  SimpleShowLayout,
  UrlField,
  SelectInput,
  ReferenceInput,
  AutocompleteInput,
  Filter,
  Button,
  useRecordContext,
  useNotify,
  useRefresh
} from 'react-admin'
import { Box, Chip } from '@mui/material'
import CheckIcon from '@mui/icons-material/Check'
import CloseIcon from '@mui/icons-material/Close'
import { api } from '../../lib/api'

const MediaStatusField = ({ source }: { source: string }) => {
  const record = useRecordContext()
  if (!record) return null
  
  const status = record[source]
  const color = status === 'approved' ? 'success' : status === 'rejected' ? 'error' : 'warning'
  
  return <Chip label={status} color={color} size="small" />
}

const MediaFilter = (props: any) => (
  <Filter {...props}>
    <SelectInput 
      source="status" 
      choices={[
        { id: 'pending', name: 'Pending' },
        { id: 'approved', name: 'Approved' },
        { id: 'rejected', name: 'Rejected' },
      ]}
      alwaysOn
    />
  </Filter>
)

const ApproveButton = () => {
  const record = useRecordContext()
  const notify = useNotify()
  const refresh = useRefresh()
  
  const handleApprove = async () => {
    if (!record) return
    
    try {
      await api.put(`/media/${record.id}/approve`, {})
      notify('Media approved successfully')
      refresh()
    } catch (error: any) {
      console.error('Error approving media:', error)
      const errorMessage = error?.details?.message || error?.message || 'Error approving media'
      notify(errorMessage, { type: 'error' })
    }
  }
  
  if (record?.status === 'approved') return null
  
  return (
    <Button 
      label="Approve" 
      onClick={handleApprove}
      color="primary"
      startIcon={<CheckIcon />}
    />
  )
}

const RejectButton = () => {
  const record = useRecordContext()
  const notify = useNotify()
  const refresh = useRefresh()
  
  const handleReject = async () => {
    if (!record) return
    
    const reason = prompt('Enter rejection reason:')
    if (!reason) return
    
    try {
      await api.put(`/media/${record.id}/reject`, { reason })
      notify('Media rejected successfully')
      refresh()
    } catch (error: any) {
      console.error('Error rejecting media:', error)
      const errorMessage = error?.details?.message || error?.message || 'Error rejecting media'
      notify(errorMessage, { type: 'error' })
    }
  }
  
  if (record?.status === 'rejected') return null
  
  return (
    <Button 
      label="Reject" 
      onClick={handleReject}
      color="secondary"
      startIcon={<CloseIcon />}
    />
  )
}

export const MediaList = () => (
  <List filters={<MediaFilter />}>
    <Datagrid rowClick="show">
      <TextField source="id" />
      <UrlField source="url" />
      <TextField source="type" />
      <TextField source="description" />
      <TextField source="character.name" label="Character" />
      <TextField source="arc.name" label="Arc" />
      <MediaStatusField source="status" />
      <TextField source="submittedBy.username" label="Submitted By" />
      <DateField source="createdAt" />
      <Box display="flex" gap={1}>
        <ApproveButton />
        <RejectButton />
      </Box>
    </Datagrid>
  </List>
)

export const MediaApprovalQueue = () => (
  <List filter={{ status: 'pending' }} title="Media Approval Queue">
    <Datagrid rowClick="show">
      <TextField source="id" />
      <UrlField source="url" />
      <TextField source="type" />
      <TextField source="description" />
      <TextField source="character.name" label="Character" />
      <TextField source="arc.name" label="Arc" />
      <TextField source="submittedBy.username" label="Submitted By" />
      <DateField source="createdAt" />
      <Box display="flex" gap={1}>
        <ApproveButton />
        <RejectButton />
      </Box>
    </Datagrid>
  </List>
)

export const MediaShow = () => (
  <Show>
    <SimpleShowLayout>
      <TextField source="id" />
      <UrlField source="url" />
      <TextField source="type" />
      <TextField source="description" />
      <TextField source="character.name" label="Character" />
      <TextField source="arc.name" label="Arc" />
      <MediaStatusField source="status" />
      <TextField source="rejectionReason" />
      <TextField source="submittedBy.username" label="Submitted By" />
      <DateField source="createdAt" />
      <Box display="flex" gap={1} mt={2}>
        <ApproveButton />
        <RejectButton />
      </Box>
    </SimpleShowLayout>
  </Show>
)

export const MediaEdit = () => (
  <Edit>
    <SimpleForm>
      <TextInput source="url" required />
      <SelectInput 
        source="type" 
        choices={[
          { id: 'image', name: 'Image' },
          { id: 'video', name: 'Video' },
          { id: 'audio', name: 'Audio' },
        ]}
        required
      />
      <TextInput source="description" multiline rows={4} />
      <ReferenceInput source="characterId" reference="characters" label="Character">
        <AutocompleteInput optionText="name" />
      </ReferenceInput>
      <ReferenceInput source="arcId" reference="arcs" label="Arc">
        <AutocompleteInput optionText="name" />
      </ReferenceInput>
      <SelectInput 
        source="status" 
        choices={[
          { id: 'pending', name: 'Pending' },
          { id: 'approved', name: 'Approved' },
          { id: 'rejected', name: 'Rejected' },
        ]}
        required
      />
      <TextInput source="rejectionReason" multiline rows={2} />
    </SimpleForm>
  </Edit>
)

export const MediaCreate = () => (
  <Create>
    <SimpleForm>
      <TextInput source="url" required />
      <SelectInput 
        source="type" 
        choices={[
          { id: 'image', name: 'Image' },
          { id: 'video', name: 'Video' },
          { id: 'audio', name: 'Audio' },
        ]}
        required
      />
      <TextInput source="description" multiline rows={4} />
      <ReferenceInput source="characterId" reference="characters" label="Character">
        <AutocompleteInput optionText="name" />
      </ReferenceInput>
      <ReferenceInput source="arcId" reference="arcs" label="Arc">
        <AutocompleteInput optionText="name" />
      </ReferenceInput>
      <SelectInput 
        source="status" 
        choices={[
          { id: 'pending', name: 'Pending' },
          { id: 'approved', name: 'Approved' },
          { id: 'rejected', name: 'Rejected' },
        ]}
        defaultValue="pending"
        required
      />
    </SimpleForm>
  </Create>
)