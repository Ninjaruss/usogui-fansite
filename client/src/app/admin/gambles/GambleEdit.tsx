import { Edit, SimpleForm, TextInput, NumberInput, ReferenceArrayInput, SelectArrayInput, ArrayInput, SimpleFormIterator, ReferenceInput, SelectInput } from 'react-admin';

export const GambleEdit = () => (
    <Edit>
        <SimpleForm>
            <TextInput source="name" />
            <TextInput source="rules" multiline rows={5} />
            <TextInput source="winCondition" multiline rows={5} />
            <NumberInput source="chapterId" />
            <ReferenceArrayInput source="observerIds" reference="characters">
                <SelectArrayInput optionText="name" />
            </ReferenceArrayInput>
            <ArrayInput source="teams">
                <SimpleFormIterator>
                    <TextInput source="name" />
                    <TextInput source="stake" />
                    <ReferenceArrayInput source="memberIds" reference="characters">
                        <SelectArrayInput optionText="name" />
                    </ReferenceArrayInput>
                </SimpleFormIterator>
            </ArrayInput>
            <ArrayInput source="rounds">
                <SimpleFormIterator>
                    <NumberInput source="roundNumber" />
                    <TextInput source="outcome" />
                    <TextInput source="reward" />
                    <TextInput source="penalty" />
                    <ReferenceInput source="winnerId" reference="gamble-teams">
                        <SelectInput optionText="name" />
                    </ReferenceInput>
                </SimpleFormIterator>
            </ArrayInput>
        </SimpleForm>
    </Edit>
);