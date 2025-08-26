import { Create, SimpleForm, TextInput, ReferenceArrayInput, SelectArrayInput } from 'react-admin';

export const FactionCreate = () => (
    <Create>
        <SimpleForm>
            <TextInput source="name" />
            <TextInput source="description" multiline rows={5} />
            <ReferenceArrayInput source="characterIds" reference="characters">
                <SelectArrayInput optionText="name" />
            </ReferenceArrayInput>
        </SimpleForm>
    </Create>
);