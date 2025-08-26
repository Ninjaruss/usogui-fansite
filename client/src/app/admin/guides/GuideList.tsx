import { List, Datagrid, TextField, NumberField, ReferenceField } from 'react-admin';

export const GuideList = () => (
    <List>
        <Datagrid rowClick="edit">
            <TextField source="id" />
            <TextField source="title" />
            <TextField source="status" />
            <NumberField source="viewCount" />
            <NumberField source="likeCount" />
            <ReferenceField source="authorId" reference="users">
                <TextField source="username" />
            </ReferenceField>
        </Datagrid>
    </List>
);