'use client'

import React from 'react'
import { Box, Text, Anchor, Group, Container } from '@mantine/core'
import { MessageCircle, Heart } from 'lucide-react'
import NextLink from 'next/link'

export const Footer: React.FC = () => {
  const [currentYear, setCurrentYear] = React.useState<number>(2024)

  React.useEffect(() => {
    setCurrentYear(new Date().getFullYear())
  }, [])

  return (
    <Box
      component="footer"
      style={{
        marginTop: 'auto',
        backgroundColor: 'rgba(15, 15, 15, 0.95)',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '1rem 0'
      }}
    >
      <Container size="md">
        <Group justify="space-between" align="center" style={{ flexWrap: 'wrap', gap: '1rem' }}>
          {/* Left: Brand + Links */}
          <Group gap="md" align="center" style={{ flexWrap: 'wrap' }}>
            <Text
              size="lg"
              style={{
                fontWeight: 'bold',
                color: '#e11d48'
              }}
            >
              L-File
            </Text>
            <Group gap="sm" align="center">
              <Text size="xs" c="gray.6">
                Independent fan resource
              </Text>
              <Text c="gray.6" size="xs">•</Text>
              <Anchor
                component={NextLink}
                href="/about"
                c="gray.4"
                style={{ textDecoration: 'none', fontSize: '0.75rem' }}
              >
                About
              </Anchor>
              <Text c="gray.6" size="xs">•</Text>
              <Anchor
                component={NextLink}
                href="/disclaimer"
                c="gray.4"
                style={{ textDecoration: 'none', fontSize: '0.75rem' }}
              >
                Disclaimer
              </Anchor>
              <Text c="gray.6" size="xs">•</Text>
              <Text size="xs" c="gray.6">
                © {currentYear} L-File
              </Text>
            </Group>
          </Group>

          {/* Right: Emphasized Discord and Support */}
          <Group gap="lg" align="center">
            <Anchor
              href="https://discord.gg/JXeRhV2qpY"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                textDecoration: 'none',
                color: '#5865f2',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                transition: 'all 0.2s ease'
              }}
            >
              <MessageCircle size={18} />
              Join Discord
            </Anchor>
            <Anchor
              href="https://ko-fi.com/ninjaruss"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                textDecoration: 'none',
                color: '#ff5f5f',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                transition: 'all 0.2s ease'
              }}
            >
              <Heart size={18} />
              Support Us
            </Anchor>
          </Group>
        </Group>
      </Container>
    </Box>
  )
}