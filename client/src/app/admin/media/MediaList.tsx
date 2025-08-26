import { List, Datagrid, TextField, ReferenceField, TextInput } from 'react-admin';

const MediaFilter = [<TextInput key="q" source="q" label="Search" alwaysOn />];

export const MediaList = () => (
    <List perPage={20} filters={MediaFilter}>
        <Datagrid rowClick="edit">
            <TextField source="id" />
            <TextField source="url" />
            <TextField source="type" />
            <TextField source="status" />
            <ReferenceField source="submittedById" reference="users">
                <TextField source="username" />
            </ReferenceField>
        </Datagrid>
    </List>
);