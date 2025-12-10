'use client';

import {
  List,
  Datagrid,
  TextField,
  BooleanField,
  DateField,
  NumberField,
  Create,
  Edit,
  SimpleForm,
  TextInput,
  SelectInput,
  BooleanInput,
  NumberInput,
  ReferenceInput,
  AutocompleteInput,
  Show,
  SimpleShowLayout,
  CreateButton,
  TopToolbar,
  useRecordContext,
  FunctionField,
} from 'react-admin';
import { Chip } from '@mui/material';

const BadgeActions = () => (
  <TopToolbar>
    <CreateButton />
  </TopToolbar>
);

// Custom field to display badge preview using Material-UI Chip
const BadgePreview = ({ badge, size = 'medium' }: { badge?: any; size?: 'small' | 'medium' }) => {
  const record = useRecordContext();
  const badgeData = badge || record;
  if (!badgeData) return null;

  return (
    <Chip
      label={badgeData.name}
      size={size}
      variant="outlined"
      sx={{
        borderColor: badgeData.color,
        color: badgeData.color,
        backgroundColor: badgeData.backgroundColor ? `${badgeData.backgroundColor}33` : 'transparent',
        fontWeight: 600,
        fontSize: size === 'small' ? '0.6875rem' : '0.75rem',
        '&:hover': {
          backgroundColor: badgeData.backgroundColor ? `${badgeData.backgroundColor}44` : `${badgeData.color}11`,
          borderColor: badgeData.color,
          transform: 'scale(1.02)'
        },
        '& .MuiChip-label': {
          textTransform: 'uppercase',
          letterSpacing: '0.025em',
          fontWeight: 600
        }
      }}
    />
  );
};

export const BadgeList = () => (
  <List actions={<BadgeActions />} sort={{ field: 'displayOrder', order: 'ASC' }}>
    <Datagrid rowClick="show">
      <FunctionField
        label="Preview"
        render={(record: any) => (
          <BadgePreview badge={record} size="small" />
        )}
      />
      <TextField source="name" sortable />
      <TextField source="type" sortable />
      <FunctionField
        label="Description"
        render={(record: any) => (
          <div style={{ maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {record.description || 'No description'}
          </div>
        )}
      />
      <NumberField source="displayOrder" sortable label="Order" />
      <BooleanField source="isActive" sortable />
      <BooleanField source="isManuallyAwardable" sortable label="Manual Award" />
      <DateField source="createdAt" sortable showTime={false} />
    </Datagrid>
  </List>
);

export const BadgeShow = () => (
  <Show>
    <SimpleShowLayout>
      <FunctionField
        label="Preview"
        render={(record: any) => (
          <div className="flex items-center gap-2">
            <BadgePreview badge={record} size="medium" />
          </div>
        )}
      />
      <TextField source="name" />
      <TextField source="description" />
      <TextField source="type" />
      <TextField source="icon" />
      <TextField source="color" />
      <TextField source="backgroundColor" />
      <NumberField source="displayOrder" />
      <BooleanField source="isActive" />
      <BooleanField source="isManuallyAwardable" />
      <DateField source="createdAt" />
      <DateField source="updatedAt" />
    </SimpleShowLayout>
  </Show>
);

export const BadgeCreate = () => (
  <Create>
    <SimpleForm>
      <TextInput source="name" required />
      <TextInput source="description" multiline rows={3} />
      <SelectInput
        source="type"
        choices={[
          { id: 'supporter', name: 'Supporter' },
          { id: 'active_supporter', name: 'Active Supporter' },
          { id: 'sponsor', name: 'Sponsor' },
          { id: 'custom', name: 'Custom' },
        ]}
        required
      />
      <TextInput source="icon" required helperText="Emoji or icon character" />
      <TextInput source="color" required helperText="Hex color code (e.g., #FFD700)" />
      <TextInput source="backgroundColor" helperText="Hex color code (e.g., #1A1A1A)" />
      <NumberInput source="displayOrder" defaultValue={10} required />
      <BooleanInput source="isActive" defaultValue={true} />
      <BooleanInput source="isManuallyAwardable" defaultValue={false} />
    </SimpleForm>
  </Create>
);

export const BadgeEdit = () => (
  <Edit>
    <SimpleForm>
      <TextInput source="name" required />
      <TextInput source="description" multiline rows={3} />
      <SelectInput
        source="type"
        choices={[
          { id: 'supporter', name: 'Supporter' },
          { id: 'active_supporter', name: 'Active Supporter' },
          { id: 'sponsor', name: 'Sponsor' },
          { id: 'custom', name: 'Custom' },
        ]}
        required
      />
      <TextInput source="icon" required helperText="Emoji or icon character" />
      <TextInput source="color" required helperText="Hex color code (e.g., #FFD700)" />
      <TextInput source="backgroundColor" helperText="Hex color code (e.g., #1A1A1A)" />
      <NumberInput source="displayOrder" required />
      <BooleanInput source="isActive" />
      <BooleanInput source="isManuallyAwardable" />
    </SimpleForm>
  </Edit>
);

// Badge awarding component - Simple preview for testing
export const BadgeAward = () => {
  return (
    <div style={{ padding: '20px' }}>
      <h3>Badge Management</h3>
      <p>Badge management functionality is integrated into the user management interface.</p>
      <p>To award or manage badges, go to Users → Select User → Award Badge</p>
    </div>
  );
};