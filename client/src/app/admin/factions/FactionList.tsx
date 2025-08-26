import { List, Datagrid, TextField, TextInput } from 'react-admin';

const FactionFilter = [<TextInput key="q" source="q" label="Search" alwaysOn />];

export const FactionList = () => (
    <List perPage={20} filters={FactionFilter}>
        <Datagrid rowClick="edit">
            <TextField source="id" />
            <TextField source="name" />
        </Datagrid>
    </List>
);