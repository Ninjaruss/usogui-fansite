import { List, Datagrid, TextField, NumberField } from 'react-admin';

export const GambleList = () => (
    <List>
        <Datagrid rowClick="edit">
            <TextField source="id" />
            <TextField source="name" />
            <NumberField source="chapterId" />
        </Datagrid>
    </List>
);