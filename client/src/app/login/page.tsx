'use client'

import React, { useState, useEffect } from 'react'
import {
  Container,
  Paper,
  Button,
  Typography,
  Box,
  Alert,
  Divider,
  Stack
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../providers/AuthProvider'
import { motion } from 'motion/react'

// Discord icon component
const DiscordIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
  </svg>
)

export default function LoginPage() {
  const theme = useTheme()
  const [error, setError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const { loginWithDiscord, devLogin, user, loading } = useAuth()
  const router = useRouter()

  // Redirect authenticated users to homepage
  useEffect(() => {
    if (!loading && user) {
      router.replace('/')
    }
  }, [user, loading, router])

  const handleDiscordLogin = () => {
    setError('')
    loginWithDiscord()
  }

  const handleDevLogin = async (asAdmin: boolean = false) => {
    setError('')
    setLoginLoading(true)

    try {
      await devLogin(asAdmin)
    } catch (error: any) {
      setError(error.message || 'Development login failed. Please try again.')
    } finally {
      setLoginLoading(false)
    }
  }

  const isDevelopment = process.env.NODE_ENV === 'development'

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Paper elevation={8} sx={{ p: 4, borderRadius: 3 }}>
          <Box textAlign="center" mb={4}>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
              <DiscordIcon />
            </Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Welcome to Usogui
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Join our community with Discord authentication
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Stack spacing={2}>
            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={handleDiscordLogin}
              sx={{ 
                py: 1.5,
                backgroundColor: '#5865F2',
                '&:hover': {
                  backgroundColor: '#4752C4'
                }
              }}
              startIcon={<DiscordIcon />}
            >
              Continue with Discord
            </Button>

            {isDevelopment && (
              <>
                <Divider sx={{ my: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Development Only
                  </Typography>
                </Divider>

                <Button
                  fullWidth
                  variant="outlined"
                  size="large"
                  onClick={() => handleDevLogin(false)}
                  disabled={loginLoading}
                  sx={{ py: 1.5 }}
                >
                  Dev Login (User)
                </Button>

                <Button
                  fullWidth
                  variant="outlined"
                  size="large"
                  onClick={() => handleDevLogin(true)}
                  disabled={loginLoading}
                  color="warning"
                  sx={{ py: 1.5 }}
                >
                  Dev Login (Admin)
                </Button>
              </>
            )}
          </Stack>

          <Box textAlign="center" mt={4}>
            <Typography variant="body2" color="text.secondary">
              By continuing, you agree to our Terms of Service and Privacy Policy
            </Typography>
          </Box>
        </Paper>
      </motion.div>
    </Container>
  )
}