'use client';

import {
  List,
  Datagrid,
  TextField,
  NumberField,
  DateField,
  Show,
  SimpleShowLayout,
  ReferenceField,
  FunctionField,
  BooleanField,
  ChipField,
  TopToolbar,
  Button,
  useRecordContext,
  useNotify,
  useRefresh,
  Filter,
  SelectInput,
  ReferenceInput,
  AutocompleteInput,
  Edit,
  SimpleForm,
  TextInput,
  EditButton,
} from 'react-admin';
import { useState } from 'react';
import { API_BASE_URL } from '../../lib/api';

const DonationStatusField = () => {
  const record = useRecordContext();
  if (!record) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#10B981'; // green
      case 'pending': return '#F59E0B'; // yellow
      case 'failed': return '#EF4444'; // red
      case 'refunded': return '#6B7280'; // gray
      default: return '#6B7280';
    }
  };

  return (
    <ChipField
      source="status"
      style={{
        backgroundColor: getStatusColor(record.status),
        color: 'white'
      }}
    />
  );
};

const AssignUserButton = ({ donationId }: { donationId: number }) => {
  const [isAssigning, setIsAssigning] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const notify = useNotify();
  const refresh = useRefresh();

  const handleAssign = async () => {
    if (!selectedUserId) {
      notify('Please select a user first', { type: 'warning' });
      return;
    }

    setIsAssigning(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/donations/${donationId}/assign/${selectedUserId}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to assign donation');
      }

      notify('Donation assigned successfully', { type: 'success' });
      refresh();
    } catch (error) {
      notify('Failed to assign donation', { type: 'error' });
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <select
        value={selectedUserId || ''}
        onChange={(e) => setSelectedUserId(Number(e.target.value))}
        className="border rounded px-2 py-1"
        disabled={isAssigning}
      >
        <option value="">Select user...</option>
        {/* This would need to be populated with users - you might want to use a proper user picker */}
      </select>
      <Button
        onClick={handleAssign}
        disabled={isAssigning || !selectedUserId}
        label={isAssigning ? 'Assigning...' : 'Assign'}
      />
    </div>
  );
};

const DonationFilter = (props: any) => (
  <Filter {...props}>
    <SelectInput
      source="status"
      choices={[
        { id: 'pending', name: 'Pending' },
        { id: 'completed', name: 'Completed' },
        { id: 'failed', name: 'Failed' },
        { id: 'refunded', name: 'Refunded' },
      ]}
    />
    <SelectInput
      source="provider"
      choices={[
        { id: 'kofi', name: 'Ko-fi' },
        { id: 'manual', name: 'Manual' },
      ]}
    />
    <ReferenceInput source="userId" reference="users">
      <AutocompleteInput optionText="username" />
    </ReferenceInput>
  </Filter>
);

export const DonationList = () => (
  <List filters={<DonationFilter />} sort={{ field: 'donationDate', order: 'DESC' }}>
    <Datagrid rowClick="show">
      <TextField source="id" sortable />
      <ReferenceField source="userId" reference="users" link="show" emptyText="Unassigned" sortable>
        <TextField source="username" />
      </ReferenceField>
      <NumberField source="amount" options={{ style: 'currency', currency: 'USD' }} sortable />
      <TextField source="currency" sortable />
      <DateField source="donationDate" sortable showTime={false} />
      <FunctionField
        label="Provider"
        sortBy="provider"
        render={(record: any) => (
          <ChipField
            record={record}
            source="provider"
            style={{
              backgroundColor: record.provider === 'kofi' ? 'rgba(255, 95, 95, 0.2)' : 'rgba(100, 100, 100, 0.2)',
              color: record.provider === 'kofi' ? '#ff5f5f' : '#888',
              fontWeight: '500',
              textTransform: 'uppercase',
              fontSize: '0.7rem'
            }}
          />
        )}
      />
      <FunctionField
        label="Status"
        sortBy="status"
        render={(record: any) => (
          <ChipField
            record={record}
            source="status"
            style={{
              backgroundColor:
                record.status === 'completed' ? '#10B981' :
                record.status === 'pending' ? '#F59E0B' :
                record.status === 'failed' ? '#EF4444' :
                record.status === 'refunded' ? '#6B7280' : '#6B7280',
              color: 'white',
              fontWeight: '600',
              textTransform: 'capitalize'
            }}
          />
        )}
      />
      <TextField source="donorName" sortable />
      <BooleanField source="isAnonymous" sortable label="Anonymous" />
      <BooleanField source="badgesProcessed" sortable label="Badges" />
      <DateField source="createdAt" sortable showTime={false} label="Created" />
      <EditButton />
    </Datagrid>
  </List>
);

export const DonationShow = () => (
  <Show
    actions={
      <TopToolbar>
        <EditButton />
      </TopToolbar>
    }
  >
    <SimpleShowLayout>
      <ReferenceField source="userId" reference="users" emptyText="Unassigned">
        <TextField source="username" />
      </ReferenceField>
      <NumberField source="amount" options={{ style: 'currency', currency: 'USD' }} />
      <TextField source="currency" />
      <DateField source="donationDate" />
      <TextField source="provider" />
      <FunctionField
        label="Status"
        render={(record: any) => <DonationStatusField />}
      />
      <TextField source="externalId" />
      <TextField source="donorName" />
      <TextField source="donorEmail" />
      <TextField source="message" />
      <BooleanField source="isAnonymous" />
      <BooleanField source="badgesProcessed" />
      <TextField source="adminNotes" />
      <DateField source="createdAt" />
      <DateField source="updatedAt" />

      <FunctionField
        label="Raw Webhook Data"
        render={(record: any) => (
          <pre className="text-xs bg-gray-800 p-2 rounded max-w-full overflow-auto">
            {JSON.stringify(record.webhookData, null, 2)}
          </pre>
        )}
      />
    </SimpleShowLayout>
  </Show>
);

export const DonationEdit = () => (
  <Edit>
    <SimpleForm>
      <ReferenceInput source="userId" reference="users">
        <AutocompleteInput optionText="username" />
      </ReferenceInput>
      <SelectInput
        source="status"
        choices={[
          { id: 'pending', name: 'Pending' },
          { id: 'completed', name: 'Completed' },
          { id: 'failed', name: 'Failed' },
          { id: 'refunded', name: 'Refunded' },
        ]}
      />
      <TextInput source="adminNotes" multiline rows={3} />
    </SimpleForm>
  </Edit>
);