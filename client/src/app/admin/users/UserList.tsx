import { List, Datagrid, TextField, EmailField, BooleanField, TextInput } from 'react-admin';

const UserFilter = [<TextInput key="q" source="q" label="Search" alwaysOn />];

export const UserList = () => (
    <List perPage={20} filters={UserFilter}>
        <Datagrid rowClick="edit">
            <TextField source="id" />
            <TextField source="username" />
            <EmailField source="email" />
            <BooleanField source="isEmailVerified" />
            <TextField source="role" />
        </Datagrid>
    </List>
);