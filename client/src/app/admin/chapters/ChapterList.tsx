import { List, Datagrid, TextField, NumberField } from 'react-admin';

export const ChapterList = () => (
    <List>
        <Datagrid rowClick="edit">
            <TextField source="id" />
            <NumberField source="number" />
            <TextField source="title" />
        </Datagrid>
    </List>
);