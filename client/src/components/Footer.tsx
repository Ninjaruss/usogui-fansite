'use client'

import React from 'react'
import { Box, Text, Anchor, Group, Container } from '@mantine/core'
import { MessageCircle, Heart } from 'lucide-react'
import NextLink from 'next/link'

export const Footer: React.FC = () => {
  // Use current year directly - no need for state/effect since this is static
  const currentYear = new Date().getFullYear()

  return (
    <Box
      component="footer"
      role="contentinfo"
      aria-label="Site footer"
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
                fontFamily: '"OPTI Goudy Text", serif',
                fontWeight: 'bold',
                color: '#e11d48'
              }}
            >
              L-File
            </Text>
            <Group gap="sm" align="center">
              <Text size="xs" c="gray.5">
                Independent fan resource
              </Text>
              <Text c="gray.6" size="xs">•</Text>
              <Anchor
                component={NextLink}
                href="/about"
                c="gray.4"
                underline="hover"
                style={{
                  fontSize: '0.75rem',
                  padding: '0.25rem 0.5rem',
                  margin: '-0.25rem -0.5rem',
                  borderRadius: '4px',
                  transition: 'color 0.2s ease, background-color 0.2s ease'
                }}
                styles={{
                  root: {
                    '&:hover': {
                      color: '#ffffff',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)'
                    }
                  }
                }}
              >
                About
              </Anchor>
              <Text c="gray.6" size="xs">•</Text>
              <Anchor
                component={NextLink}
                href="/disclaimer"
                c="gray.4"
                underline="hover"
                style={{
                  fontSize: '0.75rem',
                  padding: '0.25rem 0.5rem',
                  margin: '-0.25rem -0.5rem',
                  borderRadius: '4px',
                  transition: 'color 0.2s ease, background-color 0.2s ease'
                }}
                styles={{
                  root: {
                    '&:hover': {
                      color: '#ffffff',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)'
                    }
                  }
                }}
              >
                Disclaimer
              </Anchor>
              <Text c="gray.6" size="xs">•</Text>
              <Text size="xs" c="gray.5">
                © {currentYear} L-File
              </Text>
            </Group>
          </Group>

          {/* Right: Emphasized Fluxer and Support */}
          <Group gap="md" align="center">
            <Anchor
              href="#" /* TODO: Replace with Fluxer server invite URL */
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Join Fluxer community (opens in new tab)"
              style={{
                textDecoration: 'none',
                color: '#e11d48',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                padding: '0.5rem 0.75rem',
                margin: '-0.5rem -0.75rem',
                borderRadius: '6px',
                transition: 'all 0.2s ease'
              }}
              styles={{
                root: {
                  '&:hover': {
                    color: '#f43f5e',
                    backgroundColor: 'rgba(225, 29, 72, 0.1)',
                    transform: 'translateY(-1px)'
                  }
                }
              }}
            >
              <MessageCircle size={18} aria-hidden="true" />
              Join Fluxer
            </Anchor>
            <Anchor
              href="https://ko-fi.com/ninjaruss"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Support us on Ko-fi (opens in new tab)"
              style={{
                textDecoration: 'none',
                color: '#ff5f5f',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                padding: '0.5rem 0.75rem',
                margin: '-0.5rem -0.75rem',
                borderRadius: '6px',
                transition: 'all 0.2s ease'
              }}
              styles={{
                root: {
                  '&:hover': {
                    color: '#ff8080',
                    backgroundColor: 'rgba(255, 95, 95, 0.1)',
                    transform: 'translateY(-1px)'
                  }
                }
              }}
            >
              <Heart size={18} aria-hidden="true" />
              Support Us
            </Anchor>
          </Group>
        </Group>
      </Container>
    </Box>
  )
}
