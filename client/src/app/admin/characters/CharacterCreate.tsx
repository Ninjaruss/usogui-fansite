import { Create, SimpleForm, TextInput, NumberInput, ArrayInput, SimpleFormIterator, ReferenceInput, SelectInput } from 'react-admin';

export const CharacterCreate = () => (
    <Create>
        <SimpleForm>
            <TextInput source="name" />
            <TextInput source="description" multiline rows={5} />
            <NumberInput source="firstAppearanceChapter" />
            <TextInput source="occupation" />
            <ArrayInput source="alternateNames">
                <SimpleFormIterator>
                    <TextInput source="." />
                </SimpleFormIterator>
            </ArrayInput>
            <ArrayInput source="notableRoles">
                <SimpleFormIterator>
                    <TextInput source="." />
                </SimpleFormIterator>
            </ArrayInput>
            <ArrayInput source="notableGames">
                <SimpleFormIterator>
                    <TextInput source="." />
                </SimpleFormIterator>
            </ArrayInput>
            <ArrayInput source="affiliations">
                <SimpleFormIterator>
                    <TextInput source="." />
                </SimpleFormIterator>
            </ArrayInput>
            <ReferenceInput source="seriesId" reference="series">
                <SelectInput optionText="name" />
            </ReferenceInput>
        </SimpleForm>
    </Create>
);