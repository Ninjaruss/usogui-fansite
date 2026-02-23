import { Container, Skeleton, Stack, Group } from '@mantine/core'

export default function VolumeDetailLoading() {
  return (
    <Container size="lg" py="xl">
      <Stack gap="lg">
        <Skeleton height={16} width={200} radius="md" />
        <Group gap="xl" align="flex-start">
          <Skeleton height={350} width={230} radius="md" />
          <Stack gap="md" style={{ flex: 1 }}>
            <Skeleton height={32} width={200} radius="md" />
            <Skeleton height={18} width={120} radius="md" />
            <Skeleton height={100} radius="md" />
          </Stack>
        </Group>
        <Skeleton height={48} radius="md" />
        <Skeleton height={200} radius="md" />
      </Stack>
    </Container>
  )
}
