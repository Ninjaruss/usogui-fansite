import { Edit, SimpleForm, TextInput, SelectInput, ReferenceInput, ReferenceArrayInput, SelectArrayInput } from 'react-admin';
import { GuideStatus } from '../../../entities/guide.entity';

export const GuideEdit = () => (
    <Edit>
        <SimpleForm>
            <TextInput source="title" />
            <TextInput source="description" multiline rows={5} />
            <TextInput source="content" multiline rows={10} />
            <SelectInput source="status" choices={Object.values(GuideStatus).map(status => ({ id: status, name: status }))} />
            <ReferenceInput source="authorId" reference="users">
                <SelectInput optionText="username" />
            </ReferenceInput>
            <ReferenceArrayInput source="tagIds" reference="tags">
                <SelectArrayInput optionText="name" />
            </ReferenceArrayInput>
        </SimpleForm>
    </Edit>
);