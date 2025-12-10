'use client'

import React, { Component, ReactNode } from 'react'
import { Alert, Box, Button, Stack, Text, Title } from '@mantine/core'
import { textColors } from '../lib/mantine-theme'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorId: string | null
}

class ErrorBoundary extends Component<Props, State> {
  private retryCount = 0
  private maxRetries = 3

  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null, errorId: null }
  }

  static getDerivedStateFromError(error: Error): State {
    // Generate a unique error ID for tracking
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    return { hasError: true, error, errorId }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo)

    // Report to external error tracking service if available
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // Log additional context for debugging
    console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack)
    console.error('[ErrorBoundary] Error ID:', this.state.errorId)
  }

  handleRetry = () => {
    this.retryCount += 1

    if (this.retryCount <= this.maxRetries) {
      this.setState({ hasError: false, error: null, errorId: null })
    } else {
      // If max retries exceeded, reload the page
      window.location.reload()
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      const isNetworkError = this.state.error?.message?.includes('fetch') ||
                            this.state.error?.message?.includes('network') ||
                            this.state.error?.message?.includes('rate limit')

      return (
        <Box p="md" style={{ minHeight: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Alert
            style={{
              color: textColors.gamble,
              maxWidth: '500px',
              width: '100%'
            }}
            radius="md"
            icon={<AlertTriangle size={20} />}
            title={isNetworkError ? 'Connection Error' : 'Something went wrong'}
          >
            <Stack gap="sm">
              <Text size="sm">
                {isNetworkError
                  ? "We're having trouble connecting to our servers. This might be due to a temporary network issue or rate limiting."
                  : "We encountered an unexpected error while loading this content."
                }
              </Text>

              {this.state.error?.message && (
                <Text size="xs" c="dimmed" style={{ fontFamily: 'monospace' }}>
                  {this.state.error.message}
                </Text>
              )}

              <Box>
                <Button
                  variant="light"
                  style={{ color: textColors.gamble }}
                  size="sm"
                  leftSection={<RefreshCw size={16} />}
                  onClick={this.handleRetry}
                >
                  {this.retryCount >= this.maxRetries ? 'Reload Page' : 'Try Again'}
                </Button>

                {this.retryCount > 0 && this.retryCount < this.maxRetries && (
                  <Text size="xs" mt="xs" c="dimmed">
                    Retry {this.retryCount} of {this.maxRetries}
                  </Text>
                )}
              </Box>

              {this.state.errorId && (
                <Text size="xs" c="dimmed">
                  Error ID: {this.state.errorId}
                </Text>
              )}
            </Stack>
          </Alert>
        </Box>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
