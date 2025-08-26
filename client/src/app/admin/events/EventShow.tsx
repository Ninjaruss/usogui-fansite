import { Show, SimpleShowLayout, TextField, NumberField, BooleanField, ReferenceField, ReferenceArrayField, ArrayField, Datagrid } from 'react-admin';

export const EventShow = () => (
    <Show>
        <SimpleShowLayout>
            <TextField source="title" />
            <TextField source="description" />
            <TextField source="type" />
            <NumberField source="startChapter" />
            <NumberField source="endChapter" />
            <NumberField source="spoilerChapter" />
            <BooleanField source="isVerified" />
            <ArrayField source="pageNumbers">
                <Datagrid>
                    <NumberField source="." />
                </Datagrid>
            </ArrayField>
            <ArrayField source="chapterReferences">
                <Datagrid>
                    <NumberField source="chapterNumber" />
                    <TextField source="context" />
                </Datagrid>
            </ArrayField>
            <ReferenceField source="arcId" reference="arcs">
                <TextField source="name" />
            </ReferenceField>
            <ReferenceField source="seriesId" reference="series">
                <TextField source="name" />
            </ReferenceField>
            <ReferenceField source="createdById" reference="users">
                <TextField source="username" />
            </ReferenceField>
            <ReferenceArrayField source="characterIds" reference="characters">
                <Datagrid>
                    <TextField source="name" />
                </Datagrid>
            </ReferenceArrayField>
            <ReferenceArrayField source="tagIds" reference="tags">
                <Datagrid>
                    <TextField source="name" />
                </Datagrid>
            </ReferenceArrayField>
        </SimpleShowLayout>
    </Show>
);