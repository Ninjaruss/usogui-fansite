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
  ReferenceField,
  SelectInput,
  NumberField,
  ReferenceInput,
  AutocompleteInput,
  usePermissions,
  Button,
  useRecordContext,
  useNotify,
  useRefresh,
  Filter
} from 'react-admin'
import { Box, Chip } from '@mui/material'
import CheckIcon from '@mui/icons-material/Check'
import CloseIcon from '@mui/icons-material/Close'
import { api } from '../../lib/api'

const GuideStatusField = ({ source }: { source: string }) => {
  const record = useRecordContext()
  if (!record) return null
  
  const status = record[source]
  const color = status === 'published' ? 'success' : status === 'rejected' ? 'error' : 'warning'
  
  return <Chip label={status} color={color} size="small" />
}

const GuideFilter = (props: any) => (
  <Filter {...props}>
    <SelectInput 
      source="status" 
      choices={[
        { id: 'draft', name: 'Draft' },
        { id: 'pending', name: 'Pending' },
        { id: 'published', name: 'Published' },
        { id: 'rejected', name: 'Rejected' },
      ]}
      alwaysOn
    />
  </Filter>
)

const ApproveGuideButton = () => {
  const record = useRecordContext()
  const notify = useNotify()
  const refresh = useRefresh()
  
  const handleApprove = async () => {
    if (!record) return
    
    try {
      await api.approveGuide(Number(record.id))
      notify('Guide approved successfully')
      refresh()
    } catch (error: any) {
      console.error('Error approving guide:', error)
      const errorMessage = error?.details?.message || error?.message || 'Error approving guide'
      notify(errorMessage, { type: 'error' })
    }
  }
  
  if (record?.status !== 'pending') return null
  
  return (
    <Button 
      label="Approve" 
      onClick={handleApprove}
      color="primary"
      startIcon={<CheckIcon />}
    />
  )
}

const RejectGuideButton = () => {
  const record = useRecordContext()
  const notify = useNotify()
  const refresh = useRefresh()
  
  const handleReject = async () => {
    if (!record) return
    
    const reason = prompt('Enter rejection reason:')
    if (!reason) return
    
    try {
      await api.rejectGuide(Number(record.id), reason)
      notify('Guide rejected successfully')
      refresh()
    } catch (error: any) {
      console.error('Error rejecting guide:', error)
      const errorMessage = error?.details?.message || error?.message || 'Error rejecting guide'
      notify(errorMessage, { type: 'error' })
    }
  }
  
  if (record?.status !== 'pending') return null
  
  return (
    <Button 
      label="Reject" 
      onClick={handleReject}
      color="secondary"
      startIcon={<CloseIcon />}
    />
  )
}

export const GuideList = () => (
  <List filters={<GuideFilter />}>
    <Datagrid rowClick="show">
      <TextField source="id" />
      <TextField source="title" />
      <TextField source="description" />
      <ReferenceField source="authorId" reference="users" label="Author">
        <TextField source="username" />
      </ReferenceField>
      <GuideStatusField source="status" />
      <TextField source="rejectionReason" label="Rejection Reason" />
      <NumberField source="viewCount" />
      <NumberField source="likeCount" />
      <DateField source="createdAt" />
      <Box display="flex" gap={1}>
        <ApproveGuideButton />
        <RejectGuideButton />
      </Box>
    </Datagrid>
  </List>
)

export const GuideApprovalQueue = () => (
  <List filter={{ status: 'pending' }} title="Guide Approval Queue">
    <Datagrid rowClick="show">
      <TextField source="id" />
      <TextField source="title" />
      <TextField source="description" />
      <ReferenceField source="authorId" reference="users" label="Author">
        <TextField source="username" />
      </ReferenceField>
      <DateField source="createdAt" />
      <Box display="flex" gap={1}>
        <ApproveGuideButton />
        <RejectGuideButton />
      </Box>
    </Datagrid>
  </List>
)

export const GuideShow = () => (
  <Show>
    <SimpleShowLayout>
      <TextField source="id" />
      <TextField source="title" />
      <TextField source="description" />
      <TextField source="content" />
      <ReferenceField source="authorId" reference="users" label="Author">
        <TextField source="username" />
      </ReferenceField>
      <GuideStatusField source="status" />
      <TextField source="rejectionReason" label="Rejection Reason" />
      <NumberField source="viewCount" />
      <NumberField source="likeCount" />
      <DateField source="createdAt" />
      <DateField source="updatedAt" />
      <Box display="flex" gap={1} mt={2}>
        <ApproveGuideButton />
        <RejectGuideButton />
      </Box>
    </SimpleShowLayout>
  </Show>
)

export const GuideEdit = () => {
  const { permissions } = usePermissions()
  
  return (
    <Edit>
      <SimpleForm>
        <TextInput source="title" required />
        <TextInput source="description" multiline rows={3} required />
        <TextInput source="content" multiline rows={12} required />
        <ReferenceInput 
          source="authorId" 
          reference="users" 
          label="Author"
        >
          <AutocompleteInput 
            optionText="username" 
            disabled={permissions !== 'admin' && permissions !== 'moderator'}
          />
        </ReferenceInput>
        <SelectInput source="status" choices={[
          { id: 'draft', name: 'Draft' },
          { id: 'pending', name: 'Pending' },
          { id: 'published', name: 'Published' },
          { id: 'rejected', name: 'Rejected' }
        ]} />
        <TextInput source="rejectionReason" multiline rows={3} label="Rejection Reason" helperText="Required when status is rejected" />
      </SimpleForm>
    </Edit>
  )
}

export const GuideCreate = () => (
  <Create>
    <SimpleForm>
      <TextInput source="title" required />
      <TextInput source="description" multiline rows={3} required />
      <TextInput source="content" multiline rows={12} required />
      <ReferenceInput source="authorId" reference="users" label="Author">
        <AutocompleteInput optionText="username" />
      </ReferenceInput>
      <SelectInput source="status" choices={[
        { id: 'draft', name: 'Draft' },
        { id: 'pending', name: 'Pending' },
        { id: 'published', name: 'Published' },
        { id: 'rejected', name: 'Rejected' }
      ]} defaultValue="pending" />
      <TextInput source="rejectionReason" multiline rows={3} label="Rejection Reason" helperText="Required when status is rejected" />
    </SimpleForm>
  </Create>
)