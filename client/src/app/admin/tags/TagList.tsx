import { List, Datagrid, TextField, TextInput } from 'react-admin';

const TagFilter = [<TextInput key="q" source="q" label="Search" alwaysOn />];

export const TagList = () => (
    <List perPage={20} filters={TagFilter}>
        <Datagrid rowClick="edit">
            <TextField source="id" />
            <TextField source="name" />
        </Datagrid>
    </List>
);