import { Show, SimpleShowLayout, TextField, NumberField, ArrayField, Datagrid, ReferenceField } from 'react-admin';

export const CharacterShow = () => (
    <Show>
        <SimpleShowLayout>
            <TextField source="name" />
            <TextField source="description" />
            <NumberField source="firstAppearanceChapter" />
            <TextField source="occupation" />
            <ArrayField source="alternateNames">
                <Datagrid>
                    <TextField source="." />
                </Datagrid>
            </ArrayField>
            <ArrayField source="notableRoles">
                <Datagrid>
                    <TextField source="." />
                </Datagrid>
            </ArrayField>
            <ArrayField source="notableGames">
                <Datagrid>
                    <TextField source="." />
                </Datagrid>
            </ArrayField>
            <ArrayField source="affiliations">
                <Datagrid>
                    <TextField source="." />
                </Datagrid>
            </ArrayField>
            <ReferenceField source="seriesId" reference="series">
                <TextField source="name" />
            </ReferenceField>
        </SimpleShowLayout>
    </Show>
);