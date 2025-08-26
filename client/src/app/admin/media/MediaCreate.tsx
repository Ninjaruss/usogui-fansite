import { Create, SimpleForm, TextInput, SelectInput, ReferenceInput } from 'react-admin';
import { MediaType, MediaStatus } from '../../../entities/media.entity';

export const MediaCreate = () => (
    <Create>
        <SimpleForm>
            <TextInput source="url" />
            <SelectInput source="type" choices={Object.values(MediaType).map(type => ({ id: type, name: type }))} />
            <TextInput source="description" multiline rows={5} />
            <SelectInput source="status" choices={Object.values(MediaStatus).map(status => ({ id: status, name: status }))} />
            <TextInput source="rejectionReason" multiline rows={5} />
            <ReferenceInput source="characterId" reference="characters">
                <SelectInput optionText="name" />
            </ReferenceInput>
            <ReferenceInput source="submittedById" reference="users">
                <SelectInput optionText="username" />
            </ReferenceInput>
        </SimpleForm>
    </Create>
);