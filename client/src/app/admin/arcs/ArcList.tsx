import { List, Datagrid, TextField, NumberField } from 'react-admin';

export const ArcList = () => (
    <List>
        <Datagrid rowClick="edit">
            <TextField source="id" />
            <TextField source="name" />
            <NumberField source="order" />
            <NumberField source="startChapter" />
            <NumberField source="endChapter" />
        </Datagrid>
    </List>
);