import { Edit, SimpleForm, TextInput, NumberInput, ArrayInput, SimpleFormIterator } from 'react-admin';

export const SeriesEdit = () => (
    <Edit>
        <SimpleForm>
            <TextInput source="name" />
            <NumberInput source="order" />
            <TextInput source="description" multiline rows={5} />
            <ArrayInput source="volumes">
                <SimpleFormIterator>
                    <NumberInput source="number" />
                    <TextInput source="coverUrl" />
                    <NumberInput source="startChapter" />
                    <NumberInput source="endChapter" />
                    <TextInput source="description" multiline rows={3} />
                </SimpleFormIterator>
            </ArrayInput>
        </SimpleForm>
    </Edit>
);