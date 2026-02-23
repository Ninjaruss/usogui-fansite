import { Container, Skeleton, Stack, Group } from '@mantine/core'

export default function CharacterDetailLoading() {
  return (
    <Container size="lg" py="xl">
      <Stack gap="lg">
        <Skeleton height={16} width={200} radius="md" />
        <Group gap="xl" align="flex-start">
          <Skeleton height={300} width={220} radius="md" />
          <Stack gap="md" style={{ flex: 1 }}>
            <Skeleton height={32} width={250} radius="md" />
            <Skeleton height={18} width={150} radius="md" />
            <Skeleton height={100} radius="md" />
            <Group gap="sm">
              <Skeleton height={28} width={80} radius="xl" />
              <Skeleton height={28} width={80} radius="xl" />
              <Skeleton height={28} width={80} radius="xl" />
            </Group>
          </Stack>
        </Group>
        <Skeleton height={48} radius="md" />
        <Skeleton height={200} radius="md" />
      </Stack>
    </Container>
  )
}
