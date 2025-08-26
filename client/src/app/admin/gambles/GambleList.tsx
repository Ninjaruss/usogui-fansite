import { List, Datagrid, TextField, NumberField, TextInput } from 'react-admin';

const GambleFilter = [<TextInput key="q" source="q" label="Search" alwaysOn />];

export const GambleList = () => (
    <List perPage={20} filters={GambleFilter}>
        <Datagrid rowClick="edit">
            <TextField source="id" />
            <TextField source="name" />
            <NumberField source="chapterId" />
        </Datagrid>
    </List>
);