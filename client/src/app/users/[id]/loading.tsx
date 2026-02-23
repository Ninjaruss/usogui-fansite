import { Container, Skeleton, Stack, Group } from '@mantine/core'

export default function UserProfileLoading() {
  return (
    <Container size="lg" py="xl">
      <Stack gap="lg">
        <Group gap="lg" align="center">
          <Skeleton height={80} width={80} radius="xl" />
          <Stack gap="sm">
            <Skeleton height={28} width={200} radius="md" />
            <Skeleton height={16} width={120} radius="md" />
          </Stack>
        </Group>
        <Skeleton height={48} radius="md" />
        <Skeleton height={300} radius="md" />
      </Stack>
    </Container>
  )
}
