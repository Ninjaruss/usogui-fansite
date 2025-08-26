import { Edit, SimpleForm, TextInput, NumberInput, ReferenceInput, SelectInput } from 'react-admin';

export const QuoteEdit = () => (
    <Edit>
        <SimpleForm>
            <TextInput source="text" multiline rows={5} />
            <NumberInput source="chapterNumber" />
            <TextInput source="description" multiline rows={5} />
            <NumberInput source="pageNumber" />
            <ReferenceInput source="characterId" reference="characters">
                <SelectInput optionText="name" />
            </ReferenceInput>
            <ReferenceInput source="seriesId" reference="series">
                <SelectInput optionText="name" />
            </ReferenceInput>
            <ReferenceInput source="submittedById" reference="users">
                <SelectInput optionText="username" />
            </ReferenceInput>
        </SimpleForm>
    </Edit>
);