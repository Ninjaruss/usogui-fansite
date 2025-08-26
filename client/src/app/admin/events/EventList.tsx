import { List, Datagrid, TextField, NumberField, BooleanField, TextInput } from 'react-admin';

const EventFilter = [<TextInput key="q" source="q" label="Search" alwaysOn />];

export const EventList = () => (
    <List perPage={20} filters={EventFilter}>
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