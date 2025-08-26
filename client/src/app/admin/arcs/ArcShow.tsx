import { Show, SimpleShowLayout, TextField, NumberField, ReferenceField } from 'react-admin';

export const ArcShow = () => (
    <Show>
        <SimpleShowLayout>
            <TextField source="name" />
            <NumberField source="order" />
            <TextField source="description" />
            <NumberField source="startChapter" />
            <NumberField source="endChapter" />
            <ReferenceField source="seriesId" reference="series">
                <TextField source="name" />
            </ReferenceField>
        </SimpleShowLayout>
    </Show>
);