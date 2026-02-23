'use client'

import { useEffect } from 'react'
import { Alert, Box, Button, Stack, Text, Title } from '@mantine/core'
import { textColors } from '../../../lib/mantine-theme'
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function UserProfileError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[UserProfileError] Error loading user profile:', error)
  }, [error])

  const isNotFound =
    error.message?.includes('404') || error.message?.includes('not found')
  const isNetworkError =
    error.message?.includes('fetch') ||
    error.message?.includes('network') ||
    error.message?.includes('timeout')

  let title = 'Error Loading Profile'
  let message = 'We encountered an error while loading this user profile.'

  if (isNotFound) {
    title = 'User Not Found'
    message = "This user profile doesn't exist or may have been removed."
  } else if (isNetworkError) {
    title = 'Connection Error'
    message = 'Unable to connect to the server. Please check your connection.'
  }

  return (
    <Box
      p="xl"
      style={{
        minHeight: '50vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Alert
        style={{
          color: textColors.character,
          maxWidth: '500px',
          width: '100%',
        }}
        radius="md"
        icon={<AlertTriangle size={24} />}
        title={<Title order={3}>{title}</Title>}
      >
        <Stack gap="md">
          <Text size="sm">{message}</Text>

          {process.env.NODE_ENV !== 'production' && error.message && (
            <Text
              size="xs"
              c="dimmed"
              style={{
                fontFamily: 'monospace',
                background: 'rgba(0,0,0,0.2)',
                padding: '8px',
                borderRadius: '4px',
              }}
            >
              {error.message}
            </Text>
          )}

          <Box style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Button
              variant="light"
              style={{ color: textColors.character }}
              leftSection={<RefreshCw size={16} />}
              onClick={() => reset()}
            >
              Try Again
            </Button>

            <Button
              component={Link}
              href="/users"
              variant="subtle"
              leftSection={<ArrowLeft size={16} />}
            >
              Back to Community
            </Button>
          </Box>

          {error.digest && (
            <Text size="xs" c="dimmed">
              Error ID: {error.digest}
            </Text>
          )}
        </Stack>
      </Alert>
    </Box>
  )
}
