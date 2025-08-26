import { List, Datagrid, TextField, TextInput } from 'react-admin';

const CharacterFilter = [<TextInput key="q" source="q" label="Search" alwaysOn />];

export const CharacterList = () => (
    <List perPage={20} filters={CharacterFilter}>
        <Datagrid rowClick="edit">
            <TextField source="id" />
            <TextField source="name" />
        </Datagrid>
    </List>
);