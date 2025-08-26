import { List, Datagrid, TextField, NumberField, ReferenceField, TextInput } from 'react-admin';

const QuoteFilter = [<TextInput key="q" source="q" label="Search" alwaysOn />];

export const QuoteList = () => (
    <List perPage={20} filters={QuoteFilter}>
        <Datagrid rowClick="edit">
            <TextField source="id" />
            <TextField source="text" />
            <NumberField source="chapterNumber" />
            <ReferenceField source="characterId" reference="characters">
                <TextField source="name" />
            </ReferenceField>
        </Datagrid>
    </List>
);