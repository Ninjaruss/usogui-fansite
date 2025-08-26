import { Create, SimpleForm, TextInput, NumberInput, ReferenceInput, SelectInput } from 'react-admin';

export const ChapterCreate = () => (
    <Create>
        <SimpleForm>
            <NumberInput source="number" />
            <TextInput source="title" />
            <TextInput source="summary" multiline rows={5} />
            <ReferenceInput source="seriesId" reference="series">
                <SelectInput optionText="name" />
            </ReferenceInput>
        </SimpleForm>
    </Create>
);