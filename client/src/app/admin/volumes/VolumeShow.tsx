import { Show, SimpleShowLayout, TextField, NumberField, ReferenceField } from 'react-admin';

export const VolumeShow = () => (
    <Show>
        <SimpleShowLayout>
            <NumberField source="number" />
            <TextField source="coverUrl" />
            <NumberField source="startChapter" />
            <NumberField source="endChapter" />
            <TextField source="description" />
            <ReferenceField source="seriesId" reference="series">
                <TextField source="name" />
            </ReferenceField>
        </SimpleShowLayout>
    </Show>
);