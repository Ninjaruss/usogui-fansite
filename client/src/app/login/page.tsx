'use client'

import React, { useEffect, Suspense, useState } from 'react'
import {
  Alert,
  Button,
  Card,
  Container,
  Divider,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
  Anchor,
} from '@mantine/core'
import { AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { API_BASE_URL } from '../../../src/lib/api'
import { useAuth } from '../../providers/AuthProvider'

const errorMessages: Record<string, string> = {
  missing_token: 'Authentication token was not received. Please try again.',
  invalid_token: 'Authentication token was invalid. Please try again.',
  callback_error: 'An error occurred during authentication. Please try again.',
  access_denied: 'Access was denied. Please try again or contact support.',
  default: 'Authentication failed. Please try again.'
}

function LoginContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { login } = useAuth()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [emailLoading, setEmailLoading] = useState(false)

  useEffect(() => {
    const returnUrl = searchParams.get('returnUrl')
    if (returnUrl) {
      localStorage.setItem('authReturnUrl', returnUrl)
    }

    const error = searchParams.get('error')
    if (error) {
      setErrorMessage(errorMessages[error] || errorMessages.default)
    }
  }, [searchParams])

  const handleFluxerLogin = () => {
    setErrorMessage(null)
    setIsRedirecting(true)
    window.location.href = `${API_BASE_URL}/auth/fluxer`
  }

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setEmailLoading(true)
    try {
      await login(identifier, password)
      const returnUrl = localStorage.getItem('authReturnUrl')
      localStorage.removeItem('authReturnUrl')
      router.push(returnUrl || '/')
    } catch (err: any) {
      setErrorMessage(err?.message || 'Login failed. Check your credentials and try again.')
    } finally {
      setEmailLoading(false)
    }
  }

  return (
    <Container size="xs" py="xl">
      <Card withBorder radius="md" shadow="sm" padding="xl">
        <Stack gap="lg">
          <Stack align="center" gap="xs">
            <Title order={2}>Welcome Back</Title>
            <Text size="sm" c="dimmed">
              Log in to manage your Usogui experience
            </Text>
          </Stack>

          {errorMessage && (
            <Alert
              icon={<AlertCircle size={16} />}
              color="red"
              variant="light"
              radius="md"
            >
              {errorMessage}
            </Alert>
          )}

          <Stack gap="xs">
            <Button
              onClick={handleFluxerLogin}
              color="violet"
              fullWidth
              size="md"
              loading={isRedirecting}
              disabled={isRedirecting || emailLoading}
              aria-busy={isRedirecting}
              aria-label={isRedirecting ? 'Redirecting to Fluxer...' : 'Continue with Fluxer'}
              leftSection={
                !isRedirecting && (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                  </svg>
                )
              }
            >
              {isRedirecting ? 'Redirecting to Fluxer...' : 'Continue with Fluxer'}
            </Button>
            <Text size="xs" c="dimmed" ta="center">
              New to Fluxer?{' '}
              <Anchor href="https://fluxer.app/" target="_blank" rel="noopener noreferrer" size="xs">
                Learn more
              </Anchor>
            </Text>
          </Stack>

          <Divider label="or" labelPosition="center" />

          <form onSubmit={handleEmailLogin}>
            <Stack gap="sm">
              <TextInput
                label="Username or Email"
                placeholder="your_username or you@example.com"
                value={identifier}
                onChange={(e) => setIdentifier(e.currentTarget.value)}
                required
                disabled={isRedirecting}
              />
              <PasswordInput
                label="Password"
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.currentTarget.value)}
                required
                disabled={isRedirecting}
              />
              <Text size="xs" ta="right">
                <Anchor component={Link} href="/password-reset" size="xs">
                  Forgot password?
                </Anchor>
              </Text>
              <Button
                type="submit"
                fullWidth
                size="md"
                loading={emailLoading}
                disabled={isRedirecting || emailLoading || !identifier || !password}
              >
                Sign In
              </Button>
            </Stack>
          </form>

          <Text size="xs" c="dimmed" ta="center">
            Don&apos;t have an account?{' '}
            <Anchor component={Link} href="/register" size="xs">
              Create one
            </Anchor>
          </Text>
        </Stack>
      </Card>
    </Container>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <Container size="xs" py="xl">
        <Card withBorder radius="md" shadow="sm" padding="xl">
          <Stack gap="lg">
            <Stack align="center" gap="xs">
              <Title order={2}>Welcome Back</Title>
              <Text size="sm" c="dimmed">Loading...</Text>
            </Stack>
          </Stack>
        </Card>
      </Container>
    }>
      <LoginContent />
    </Suspense>
  )
}
