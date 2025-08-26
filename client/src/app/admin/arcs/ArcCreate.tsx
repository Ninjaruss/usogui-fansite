import { Create, SimpleForm, TextInput, NumberInput, ReferenceInput, SelectInput } from 'react-admin';

export const ArcCreate = () => (
    <Create>
        <SimpleForm>
            <TextInput source="name" />
            <NumberInput source="order" />
            <TextInput source="description" multiline rows={5} />
            <NumberInput source="startChapter" />
            <NumberInput source="endChapter" />
            <ReferenceInput source="seriesId" reference="series">
                <SelectInput optionText="name" />
            </ReferenceInput>
        </SimpleForm>
    </Create>
);