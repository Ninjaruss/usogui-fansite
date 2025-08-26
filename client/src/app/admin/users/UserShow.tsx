import { Show, SimpleShowLayout, TextField, EmailField, BooleanField, NumberField, ReferenceField } from 'react-admin';

export const UserShow = () => (
    <Show>
        <SimpleShowLayout>
            <TextField source="username" />
            <EmailField source="email" />
            <BooleanField source="isEmailVerified" />
            <TextField source="role" />
            <NumberField source="userProgress" />
            <ReferenceField source="profileImageId" reference="profile-images">
                <TextField source="id" />
            </ReferenceField>
            <ReferenceField source="favoriteQuoteId" reference="quotes">
                <TextField source="text" />
            </ReferenceField>
            <ReferenceField source="favoriteGambleId" reference="gambles">
                <TextField source="name" />
            </ReferenceField>
        </SimpleShowLayout>
    </Show>
);