import { List, Datagrid, TextField, NumberField, BooleanField } from 'react-admin';

export const EventList = () => (
    <List>
        <Datagrid rowClick="edit">
            <TextField source="id" />
            <TextField source="title" />
            <TextField source="type" />
            <NumberField source="startChapter" />
            <NumberField source="endChapter" />
            <BooleanField source="isVerified" />
        </Datagrid>
    </List>
);