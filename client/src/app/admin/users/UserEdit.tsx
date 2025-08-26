import { Edit, SimpleForm, TextInput, EmailField, BooleanInput, SelectInput, NumberInput, ReferenceInput } from 'react-admin';
import { UserRole } from '../../../entities/user.entity';

export const UserEdit = () => (
    <Edit>
        <SimpleForm>
            <TextInput source="username" />
            <EmailField source="email" />
            <BooleanInput source="isEmailVerified" />
            <SelectInput source="role" choices={Object.values(UserRole).map(role => ({ id: role, name: role }))} />
            <NumberInput source="userProgress" />
            <ReferenceInput source="profileImageId" reference="profile-images">
                <SelectInput optionText="id" />
            </ReferenceInput>
            <ReferenceInput source="favoriteQuoteId" reference="quotes">
                <SelectInput optionText="text" />
            </ReferenceInput>
            <ReferenceInput source="favoriteGambleId" reference="gambles">
                <SelectInput optionText="name" />
            </ReferenceInput>
        </SimpleForm>
    </Edit>
);