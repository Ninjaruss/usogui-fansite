'use client'

import {
  Alert,
  Box,
  Button,
  Container,
  Stack,
  Text,
  useMantineTheme
} from '@mantine/core'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { backgroundStyles, getAlphaColor, getEntityThemeColor, textColors } from '../../../lib/mantine-theme'

export default function UserNotFound() {
  const theme = useMantineTheme()
  const accent = getEntityThemeColor(theme, 'gamble')

  return (
    <Box style={{ backgroundColor: backgroundStyles.page(theme), minHeight: '100vh' }}>
      <Container
        size="lg"
        py="xl"
        style={{
          backgroundColor: backgroundStyles.container(theme),
          borderRadius: theme.radius.xl,
          boxShadow: theme.shadows.xl
        }}
      >
        <Stack gap="lg" align="center" ta="center">
          <Alert
            color="red"
            radius="lg"
            variant="light"
            styles={{
              root: {
                backgroundColor: getAlphaColor('#ff4d6d', 0.15),
                border: `1px solid ${getAlphaColor('#ff4d6d', 0.35)}`,
                color: textColors.primary,
                maxWidth: 480
              }
            }}
          >
            User not found
          </Alert>
          <Text size="sm" c={textColors.tertiary}>
            The user you are looking for may have been removed or never existed.
          </Text>
          <Button
            component={Link}
            href="/users"
            variant="outline"
            radius="md"
            leftSection={<ArrowLeft size={16} />}
            styles={{
              root: {
                borderColor: getAlphaColor(accent, 0.4),
                color: accent,
                backgroundColor: getAlphaColor(accent, 0.12),
                '&:hover': {
                  backgroundColor: getAlphaColor(accent, 0.2)
                }
              }
            }}
          >
            Back to Users
          </Button>
        </Stack>
      </Container>
    </Box>
  )
}
