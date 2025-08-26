import { List, Datagrid, TextField, NumberField, TextInput } from 'react-admin';

const ChapterFilter = [<TextInput key="q" source="q" label="Search" alwaysOn />];

export const ChapterList = () => (
    <List perPage={20} filters={ChapterFilter}>
        <Datagrid rowClick="edit">
            <TextField source="id" />
            <NumberField source="number" />
            <TextField source="title" />
        </Datagrid>
    </List>
);