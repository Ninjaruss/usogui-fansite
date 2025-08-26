import { Show, SimpleShowLayout, TextField, ReferenceArrayField, Datagrid } from 'react-admin';

export const TagShow = () => (
    <Show>
        <SimpleShowLayout>
            <TextField source="name" />
            <TextField source="description" />
            <ReferenceArrayField source="eventIds" reference="events">
                <Datagrid>
                    <TextField source="title" />
                </Datagrid>
            </ReferenceArrayField>
        </SimpleShowLayout>
    </Show>
);