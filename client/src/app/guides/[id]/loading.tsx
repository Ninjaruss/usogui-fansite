import { Container, Skeleton, Stack, Group } from '@mantine/core'

export default function GuideDetailLoading() {
  return (
    <Container size="lg" py="xl">
      <Stack gap="lg">
        <Skeleton height={16} width={200} radius="md" />
        <Skeleton height={36} width={350} radius="md" />
        <Group gap="md">
          <Skeleton height={32} width={32} radius="xl" />
          <Skeleton height={18} width={120} radius="md" />
        </Group>
        <Group gap="sm">
          <Skeleton height={24} width={60} radius="xl" />
          <Skeleton height={24} width={60} radius="xl" />
          <Skeleton height={24} width={60} radius="xl" />
        </Group>
        <Skeleton height={400} radius="md" />
      </Stack>
    </Container>
  )
}
