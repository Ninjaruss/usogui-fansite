import { List, Datagrid, TextField, ReferenceField } from 'react-admin';

export const MediaList = () => (
    <List>
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