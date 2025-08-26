import { Show, SimpleShowLayout, TextField, ReferenceField } from 'react-admin';

export const MediaShow = () => (
    <Show>
        <SimpleShowLayout>
            <TextField source="url" />
            <TextField source="type" />
            <TextField source="description" />
            <TextField source="status" />
            <TextField source="rejectionReason" />
            <ReferenceField source="characterId" reference="characters">
                <TextField source="name" />
            </ReferenceField>
            <ReferenceField source="submittedById" reference="users">
                <TextField source="username" />
            </ReferenceField>
        </SimpleShowLayout>
    </Show>
);