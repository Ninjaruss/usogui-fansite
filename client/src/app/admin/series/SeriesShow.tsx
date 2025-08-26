import { Show, SimpleShowLayout, TextField, NumberField, ArrayField, Datagrid } from 'react-admin';

export const SeriesShow = () => (
    <Show>
        <SimpleShowLayout>
            <TextField source="name" />
            <NumberField source="order" />
            <TextField source="description" />
            <ArrayField source="volumes">
                <Datagrid>
                    <NumberField source="number" />
                    <TextField source="coverUrl" />
                    <NumberField source="startChapter" />
                    <NumberField source="endChapter" />
                    <TextField source="description" />
                </Datagrid>
            </ArrayField>
        </SimpleShowLayout>
    </Show>
);