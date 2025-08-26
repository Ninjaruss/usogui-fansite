import { List, Datagrid, TextField, NumberField, ReferenceField } from 'react-admin';

export const QuoteList = () => (
    <List>
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