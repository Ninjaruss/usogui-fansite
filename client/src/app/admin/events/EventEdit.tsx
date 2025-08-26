import { Edit, SimpleForm, TextInput, NumberInput, SelectInput, BooleanInput, ReferenceInput, ReferenceArrayInput, SelectArrayInput, ArrayInput, SimpleFormIterator } from 'react-admin';
import { EventType } from '../../../entities/event.entity';

export const EventEdit = () => (
    <Edit>
        <SimpleForm>
            <TextInput source="title" />
            <TextInput source="description" multiline rows={5} />
            <SelectInput source="type" choices={Object.values(EventType).map(type => ({ id: type, name: type }))} />
            <NumberInput source="startChapter" />
            <NumberInput source="endChapter" />
            <NumberInput source="spoilerChapter" />
            <BooleanInput source="isVerified" />
            <ArrayInput source="pageNumbers">
                <SimpleFormIterator>
                    <NumberInput source="." />
                </SimpleFormIterator>
            </ArrayInput>
            <ArrayInput source="chapterReferences">
                <SimpleFormIterator>
                    <NumberInput source="chapterNumber" />
                    <TextInput source="context" />
                </SimpleFormIterator>
            </ArrayInput>
            <ReferenceInput source="arcId" reference="arcs">
                <SelectInput optionText="name" />
            </ReferenceInput>
            <ReferenceInput source="seriesId" reference="series">
                <SelectInput optionText="name" />
            </ReferenceInput>
            <ReferenceInput source="createdById" reference="users">
                <SelectInput optionText="username" />
            </ReferenceInput>
            <ReferenceArrayInput source="characterIds" reference="characters">
                <SelectArrayInput optionText="name" />
            </ReferenceArrayInput>
            <ReferenceArrayInput source="tagIds" reference="tags">
                <SelectArrayInput optionText="name" />
            </ReferenceArrayInput>
        </SimpleForm>
    </Edit>
);