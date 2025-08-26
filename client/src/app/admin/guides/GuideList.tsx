import { List, Datagrid, TextField, NumberField, ReferenceField, TextInput } from 'react-admin';

const GuideFilter = [<TextInput key="q" source="q" label="Search" alwaysOn />];

export const GuideList = () => (
    <List perPage={20} filters={GuideFilter}>
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