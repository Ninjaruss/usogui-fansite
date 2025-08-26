import { List, Datagrid, TextField, NumberField, TextInput } from 'react-admin';

const SeriesFilter = [<TextInput key="q" source="q" label="Search" alwaysOn />];

export const SeriesList = () => (
    <List perPage={20} filters={SeriesFilter}>
        <Datagrid rowClick="edit">
            <TextField source="id" />
            <TextField source="name" />
            <NumberField source="order" />
        </Datagrid>
    </List>
);