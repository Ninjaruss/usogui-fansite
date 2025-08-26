import { Show, SimpleShowLayout, TextField, NumberField, ReferenceField, ReferenceArrayField, Datagrid } from 'react-admin';

export const GuideShow = () => (
    <Show>
        <SimpleShowLayout>
            <TextField source="title" />
            <TextField source="description" />
            <TextField source="content" />
            <TextField source="status" />
            <NumberField source="viewCount" />
            <NumberField source="likeCount" />
            <ReferenceField source="authorId" reference="users">
                <TextField source="username" />
            </ReferenceField>
            <ReferenceArrayField source="tagIds" reference="tags">
                <Datagrid>
                    <TextField source="name" />
                </Datagrid>
            </ReferenceArrayField>
        </SimpleShowLayout>
    </Show>
);