import { Container, Skeleton, Stack } from '@mantine/core'

export default function ChapterDetailLoading() {
  return (
    <Container size="lg" py="xl">
      <Stack gap="lg">
        <Skeleton height={16} width={200} radius="md" />
        <Skeleton height={36} width={300} radius="md" />
        <Skeleton height={18} width={150} radius="md" />
        <Skeleton height={150} radius="md" />
        <Skeleton height={48} radius="md" />
        <Skeleton height={200} radius="md" />
      </Stack>
    </Container>
  )
}
