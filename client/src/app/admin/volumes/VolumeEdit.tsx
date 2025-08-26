import { Edit, SimpleForm, TextInput, NumberInput, ReferenceInput, SelectInput } from 'react-admin';

export const VolumeEdit = () => (
    <Edit>
        <SimpleForm>
            <NumberInput source="number" />
            <TextInput source="coverUrl" />
            <NumberInput source="startChapter" />
            <NumberInput source="endChapter" />
            <TextInput source="description" multiline rows={5} />
            <ReferenceInput source="seriesId" reference="series">
                <SelectInput optionText="name" />
            </ReferenceInput>
        </SimpleForm>
    </Edit>
);