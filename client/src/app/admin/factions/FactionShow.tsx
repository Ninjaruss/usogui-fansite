import { Show, SimpleShowLayout, TextField, ReferenceArrayField, Datagrid } from 'react-admin';

export const FactionShow = () => (
    <Show>
        <SimpleShowLayout>
            <TextField source="name" />
            <TextField source="description" />
            <ReferenceArrayField source="characterIds" reference="characters">
                <Datagrid>
                    <TextField source="name" />
                </Datagrid>
            </ReferenceArrayField>
        </SimpleShowLayout>
    </Show>
);