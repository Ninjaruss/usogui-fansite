import { Box, Container, Skeleton, Group, Stack } from '@mantine/core'

export default function Loading() {
  return (
    <Container size="lg" py="xl">
      <Stack gap="xl">
        <Group justify="center">
          <Skeleton height={36} width={250} radius="md" />
        </Group>
        <Skeleton height={20} width={400} mx="auto" radius="md" />
        <Skeleton height={48} radius="xl" />
        <Box
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '16px',
          }}
        >
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} height={280} radius="md" />
          ))}
        </Box>
      </Stack>
    </Container>
  )
}
