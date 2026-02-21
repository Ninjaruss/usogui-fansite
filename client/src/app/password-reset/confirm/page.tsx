'use client'

import React, { useState, Suspense } from 'react'
import {
  Alert,
  Anchor,
  Button,
  Card,
  Container,
  PasswordInput,
  Stack,
  Text,
  Title,
} from '@mantine/core'
import { AlertCircle, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { API_BASE_URL } from '../../../../src/lib/api'

function PasswordResetConfirmContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token') || ''
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!token) {
      setError('Invalid or missing reset token.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/auth/password-reset/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'Fetch',
        },
        body: JSON.stringify({ token, newPassword }),
      })
      const data = await res.json()
      if (res.ok) {
        setSuccess(true)
      } else {
        setError(data.message || 'Reset failed. The link may have expired.')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <Container size="xs" py="xl">
        <Card withBorder radius="md" shadow="sm" padding="xl">
          <Stack gap="md" align="center">
            <Alert icon={<AlertCircle size={16} />} color="red" variant="light" radius="md" w="100%">
              Invalid reset link. Please request a new one.
            </Alert>
            <Button component={Link} href="/password-reset" variant="subtle" size="sm">
              Request new link
            </Button>
          </Stack>
        </Card>
      </Container>
    )
  }

  if (success) {
    return (
      <Container size="xs" py="xl">
        <Card withBorder radius="md" shadow="sm" padding="xl">
          <Stack gap="md" align="center">
            <CheckCircle size={48} color="var(--mantine-color-green-6)" />
            <Title order={3} ta="center">Password Reset!</Title>
            <Text size="sm" c="dimmed" ta="center">Your password has been updated. You can now sign in.</Text>
            <Button component={Link} href="/login" color="violet">
              Sign In
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
            <Title order={2}>Set New Password</Title>
            <Text size="sm" c="dimmed">Choose a new password for your account</Text>
          </Stack>

          {error && (
            <Alert icon={<AlertCircle size={16} />} color="red" variant="light" radius="md">
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Stack gap="sm">
              <PasswordInput
                label="New Password"
                placeholder="At least 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.currentTarget.value)}
                required
              />
              <PasswordInput
                label="Confirm Password"
                placeholder="Repeat your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.currentTarget.value)}
                required
              />
              <Button
                type="submit"
                fullWidth
                size="md"
                loading={loading}
                disabled={!newPassword || !confirmPassword}
              >
                Reset Password
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

export default function PasswordResetConfirmPage() {
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
      <PasswordResetConfirmContent />
    </Suspense>
  )
}
