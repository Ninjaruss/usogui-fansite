import { Box, Button, Container, Stack, Text, Title } from '@mantine/core'
import { Home, Search } from 'lucide-react'
import Link from 'next/link'
import { textColors } from '../lib/mantine-theme'

export default function NotFound() {
  return (
    <Container size="sm" py="xl">
      <Box
        style={{
          minHeight: '50vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Stack align="center" gap="lg">
          <Title
            order={1}
            style={{ fontSize: '6rem', lineHeight: 1, color: textColors.gamble }}
          >
            404
          </Title>
          <Title order={2} ta="center">
            Page Not Found
          </Title>
          <Text size="md" c="dimmed" ta="center" maw={400}>
            The page you&apos;re looking for doesn&apos;t exist or may have been moved.
          </Text>
          <Box style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <Button
              component={Link}
              href="/"
              leftSection={<Home size={16} />}
              variant="light"
              style={{ color: textColors.character }}
            >
              Go Home
            </Button>
            <Button
              component={Link}
              href="/search"
              leftSection={<Search size={16} />}
              variant="subtle"
            >
              Search
            </Button>
          </Box>
        </Stack>
      </Box>
    </Container>
  )
}
