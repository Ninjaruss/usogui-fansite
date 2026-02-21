'use client'

import React, { useState, Suspense } from 'react'
import {
  Alert,
  Anchor,
  Button,
  Card,
  Container,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import { AlertCircle, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { API_BASE_URL } from '../../../src/lib/api'

function PasswordResetContent() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/auth/password-reset/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'Fetch',
        },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (res.ok) {
        setSuccess(true)
      } else {
        setError(data.message || 'Something went wrong. Please try again.')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <Container size="xs" py="xl">
        <Card withBorder radius="md" shadow="sm" padding="xl">
          <Stack gap="md" align="center">
            <CheckCircle size={48} color="var(--mantine-color-green-6)" />
            <Title order={3} ta="center">Check your email</Title>
            <Text size="sm" c="dimmed" ta="center">
              If an account exists for <strong>{email}</strong>, we sent a password reset link.
            </Text>
            <Button component={Link} href="/login" variant="subtle" size="sm">
              Back to login
            </Button>
          </Stack>
        </Card>
      </Container>
    )
  }

  return (
    <Container size="xs" py="xl">
      <Card withBorder radius="md" shadow="sm" padding="xl">
        <Stack gap="lg">
          <Stack align="center" gap="xs">
            <Title order={2}>Reset Password</Title>
            <Text size="sm" c="dimmed">
              Enter your email to receive a reset link
            </Text>
          </Stack>

          {error && (
            <Alert icon={<AlertCircle size={16} />} color="red" variant="light" radius="md">
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Stack gap="sm">
              <TextInput
                label="Email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.currentTarget.value)}
                required
              />
              <Button type="submit" fullWidth size="md" loading={loading} disabled={!email}>
                Send Reset Link
              </Button>
            </Stack>
          </form>

          <Text size="xs" c="dimmed" ta="center">
            <Anchor component={Link} href="/login" size="xs">
              Back to login
            </Anchor>
          </Text>
        </Stack>
      </Card>
    </Container>
  )
}

export default function PasswordResetPage() {
  return (
    <Suspense fallback={
      <Container size="xs" py="xl">
        <Card withBorder radius="md" shadow="sm" padding="xl">
          <Stack align="center" py="xl">
            <Text size="sm" c="dimmed">Loading...</Text>
          </Stack>
        </Card>
      </Container>
    }>
      <PasswordResetContent />
    </Suspense>
  )
}
