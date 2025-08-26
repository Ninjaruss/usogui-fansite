import { List, Datagrid, TextField, EmailField, BooleanField } from 'react-admin';

export const UserList = () => (
    <List>
        <Datagrid rowClick="edit">
            <TextField source="id" />
            <TextField source="username" />
            <EmailField source="email" />
            <BooleanField source="isEmailVerified" />
            <TextField source="role" />
        </Datagrid>
    </List>
);