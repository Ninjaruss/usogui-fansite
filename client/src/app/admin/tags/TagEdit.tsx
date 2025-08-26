import { Edit, SimpleForm, TextInput, ReferenceArrayInput, SelectArrayInput } from 'react-admin';

export const TagEdit = () => (
    <Edit>
        <SimpleForm>
            <TextInput source="name" />
            <TextInput source="description" multiline rows={5} />
            <ReferenceArrayInput source="eventIds" reference="events">
                <SelectArrayInput optionText="title" />
            </ReferenceArrayInput>
        </SimpleForm>
    </Edit>
);