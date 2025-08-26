import { List, Datagrid, TextField, NumberField, TextInput } from 'react-admin';

const ArcFilter = [
  <TextInput key="q" source="q" label="Search" alwaysOn />,
];

export const ArcList = () => (
    <List perPage={20} filters={ArcFilter}>
        <Datagrid rowClick="edit">
            <TextField source="id" />
            <TextField source="name" />
            <NumberField source="order" />
            <NumberField source="startChapter" />
            <NumberField source="endChapter" />
        </Datagrid>
    </List>
);