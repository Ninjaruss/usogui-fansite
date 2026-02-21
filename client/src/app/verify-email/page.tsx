'use client'

import React, { useEffect, useState, Suspense } from 'react'
import { Alert, Button, Card, Container, Stack, Text, Title } from '@mantine/core'
import { AlertCircle, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { API_BASE_URL } from '../../../src/lib/api'

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const token = searchParams.get('token')
    if (!token) {
      setStatus('error')
      setMessage('No verification token provided.')
      return
    }

    const verify = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/auth/verify-email?token=${encodeURIComponent(token)}`, {
          headers: { 'X-Requested-With': 'Fetch' },
        })
        const data = await res.json()
        if (res.ok) {
          setStatus('success')
          setMessage(data.message || 'Your email has been verified!')
        } else {
          setStatus('error')
          setMessage(data.message || 'Verification failed. The link may have expired.')
        }
      } catch {
        setStatus('error')
        setMessage('Something went wrong. Please try again.')
      }
    }

    verify()
  }, [searchParams])

  return (
    <Container size="xs" py="xl">
      <Card withBorder radius="md" shadow="sm" padding="xl">
        <Stack gap="lg" align="center">
          {status === 'loading' && (
            <>
              <div className="animate-spin inline-block w-8 h-8 border-[3px] border-current border-t-transparent text-violet-400 rounded-full" />
              <Text size="sm" c="dimmed">Verifying your email...</Text>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle size={48} color="var(--mantine-color-green-6)" />
              <Title order={3} ta="center">Email Verified!</Title>
              <Text size="sm" c="dimmed" ta="center">{message}</Text>
              <Button component={Link} href="/login" color="violet">
                Sign In
              </Button>
            </>
          )}

          {status === 'error' && (
            <>
              <Alert icon={<AlertCircle size={16} />} color="red" variant="light" radius="md" w="100%">
                {message}
              </Alert>
              <Button component={Link} href="/login" variant="subtle" size="sm">
                Back to login
              </Button>
            </>
          )}
        </Stack>
      </Card>
    </Container>
  )
}

export default function VerifyEmailPage() {
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
      <VerifyEmailContent />
    </Suspense>
  )
}
