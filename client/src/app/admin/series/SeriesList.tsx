import { List, Datagrid, TextField, NumberField } from 'react-admin';

export const SeriesList = () => (
    <List>
        <Datagrid rowClick="edit">
            <TextField source="id" />
            <TextField source="name" />
            <NumberField source="order" />
        </Datagrid>
    </List>
);