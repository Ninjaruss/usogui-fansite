import { Show, SimpleShowLayout, TextField, NumberField, ReferenceField } from 'react-admin';

export const ChapterShow = () => (
    <Show>
        <SimpleShowLayout>
            <NumberField source="number" />
            <TextField source="title" />
            <TextField source="summary" />
            <ReferenceField source="seriesId" reference="series">
                <TextField source="name" />
            </ReferenceField>
        </SimpleShowLayout>
    </Show>
);