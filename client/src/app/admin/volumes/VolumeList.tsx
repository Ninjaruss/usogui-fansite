import { List, Datagrid, TextField, NumberField, ReferenceField } from 'react-admin';

export const VolumeList = () => (
    <List>
        <Datagrid rowClick="edit">
            <TextField source="id" />
            <NumberField source="number" />
            <TextField source="coverUrl" />
            <NumberField source="startChapter" />
            <NumberField source="endChapter" />
            <ReferenceField source="seriesId" reference="series">
                <TextField source="name" />
            </ReferenceField>
        </Datagrid>
    </List>
);