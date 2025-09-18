'use client'

import React from 'react'
import { Box, Text, Anchor, Stack, Grid, Divider, Group } from '@mantine/core'
import { MessageCircle, Mail, Heart } from 'lucide-react'
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
        paddingTop: '2rem',
        paddingBottom: '2rem',
        paddingLeft: '1.5rem',
        paddingRight: '1.5rem',
        backgroundColor: 'rgba(10, 10, 10, 0.95)',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)'
      }}
    >
      <Box style={{ maxWidth: '1024px', margin: '0 auto' }}>
        <Grid justify="center">
          {/* Brand & Legal Section */}
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Stack gap="md">
              <Text size="xl" style={{ fontWeight: 'bold', color: '#e11d48' }}>
                L-File
              </Text>
              <Text size="sm" c="dimmed">
                The ultimate database for Usogui (Lie Eater) - connecting fans worldwide through comprehensive content and community.
              </Text>
              <Anchor component={NextLink} href="/disclaimer" c="red" style={{ textDecoration: 'none' }}>
                <Text size="sm">
                  Disclaimer & Legal Information
                </Text>
              </Anchor>
            </Stack>
          </Grid.Col>

          {/* Connect Section */}
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Stack gap="md">
              <Text size="xl" style={{ fontWeight: 'bold' }}>
                Connect With Us
              </Text>
              <Stack gap="sm">
                <Group gap="xs">
                  <Mail className="w-4 h-4" />
                  <Anchor href="mailto:ninjarussyt@gmail.com" c="red" style={{ textDecoration: 'none' }}>
                    <Text size="sm">ninjarussyt@gmail.com</Text>
                  </Anchor>
                </Group>
                <Group gap="xs">
                  <MessageCircle className="w-4 h-4" />
                  <Anchor
                    href="https://discord.gg/JXeRhV2qpY"
                    target="_blank"
                    rel="noopener noreferrer"
                    c="red"
                    style={{ textDecoration: 'none' }}
                  >
                    <Text size="sm">Discord Community</Text>
                  </Anchor>
                </Group>
                <Group gap="xs">
                  <Heart className="w-4 h-4" />
                  <Anchor
                    href="https://ko-fi.com/ninjaruss"
                    target="_blank"
                    rel="noopener noreferrer"
                    c="red"
                    style={{ textDecoration: 'none' }}
                  >
                    <Text size="sm">Support on Ko-fi</Text>
                  </Anchor>
                </Group>
              </Stack>
            </Stack>
          </Grid.Col>
        </Grid>

        <Divider style={{ margin: '1.5rem 0' }} />

        {/* Bottom Section */}
        <Stack
          gap="md"
          style={{
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center'
          }}
        >
          <Text size="sm" c="dimmed">
            L-file is an independent fan resource. Usogui © Sako Toshio/Shueisha.
          </Text>
          <Text size="sm" c="dimmed">
            © {currentYear} L-File. Made for the Usogui community.
          </Text>
        </Stack>
      </Box>
    </Box>
  )
}