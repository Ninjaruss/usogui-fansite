import { Show, SimpleShowLayout, TextField, NumberField, ReferenceArrayField, ArrayField, Datagrid, ReferenceField } from 'react-admin';

export const GambleShow = () => (
    <Show>
        <SimpleShowLayout>
            <TextField source="name" />
            <TextField source="rules" />
            <TextField source="winCondition" />
            <NumberField source="chapterId" />
            <ReferenceArrayField source="observerIds" reference="characters">
                <Datagrid>
                    <TextField source="name" />
                </Datagrid>
            </ReferenceArrayField>
            <ArrayField source="teams">
                <Datagrid>
                    <TextField source="name" />
                    <TextField source="stake" />
                    <ReferenceArrayField source="memberIds" reference="characters">
                        <Datagrid>
                            <TextField source="name" />
                        </Datagrid>
                    </ReferenceArrayField>
                </Datagrid>
            </ArrayField>
            <ArrayField source="rounds">
                <Datagrid>
                    <NumberField source="roundNumber" />
                    <TextField source="outcome" />
                    <TextField source="reward" />
                    <TextField source="penalty" />
                    <ReferenceField source="winnerId" reference="gamble-teams">
                        <TextField source="name" />
                    </ReferenceField>
                </Datagrid>
            </ArrayField>
        </SimpleShowLayout>
    </Show>
);