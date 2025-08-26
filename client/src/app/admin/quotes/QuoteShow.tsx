import { Show, SimpleShowLayout, TextField, NumberField, ReferenceField } from 'react-admin';

export const QuoteShow = () => (
    <Show>
        <SimpleShowLayout>
            <TextField source="text" />
            <NumberField source="chapterNumber" />
            <TextField source="description" />
            <NumberField source="pageNumber" />
            <ReferenceField source="characterId" reference="characters">
                <TextField source="name" />
            </ReferenceField>
            <ReferenceField source="seriesId" reference="series">
                <TextField source="name" />
            </ReferenceField>
            <ReferenceField source="submittedById" reference="users">
                <TextField source="username" />
            </ReferenceField>
        </SimpleShowLayout>
    </Show>
);