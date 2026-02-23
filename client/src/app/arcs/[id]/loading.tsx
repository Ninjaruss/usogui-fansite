import { Container, Skeleton, Stack, Group } from '@mantine/core'

export default function ArcDetailLoading() {
  return (
    <Container size="lg" py="xl">
      <Stack gap="lg">
        <Skeleton height={16} width={200} radius="md" />
        <Skeleton height={36} width={300} radius="md" />
        <Skeleton height={18} width={200} radius="md" />
        <Skeleton height={120} radius="md" />
        <Group gap="sm">
          <Skeleton height={28} width={80} radius="xl" />
          <Skeleton height={28} width={80} radius="xl" />
        </Group>
        <Skeleton height={48} radius="md" />
        <Skeleton height={200} radius="md" />
      </Stack>
    </Container>
  )
}
