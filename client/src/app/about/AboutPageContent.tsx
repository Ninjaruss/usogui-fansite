'use client'

import {
  Anchor,
  Box,
  Button,
  Card,
  Container,
  Divider,
  Grid,
  Group,
  List,
  Stack,
  Text,
  Title,
  useMantineTheme
} from '@mantine/core'
import { getEntityThemeColor, backgroundStyles } from '../../lib/mantine-theme'
import { Heart, Mail, Coffee, Github, Twitter } from 'lucide-react'

const supportItems = [
  {
    primary: 'Buy me a coffee',
    secondary: 'Help cover hosting costs and development time'
  },
  {
    primary: 'Contribute content',
    secondary: 'Submit guides, character analyses, or media'
  },
  {
    primary: 'Spread the word',
    secondary: 'Share L-File with other Usogui fans'
  },
  {
    primary: 'Report issues',
    secondary: 'Help us improve by reporting bugs or suggesting features'
  }
]

const resolveHex = (color: string | undefined, fallback: string) => {
  if (!color) return fallback
  return color.startsWith('#') ? color : fallback
}

const normalizeHex = (hex: string) => {
  const sanitized = hex.replace('#', '')
  if (sanitized.length === 3) {
    return sanitized
      .split('')
      .map((char) => `${char}${char}`)
      .join('')
  }
  return sanitized.padEnd(6, '0').slice(0, 6)
}

const hexToRgba = (hex: string, alpha: number) => {
  const normalized = normalizeHex(hex)
  const int = Number.parseInt(normalized, 16)
  const r = (int >> 16) & 255
  const g = (int >> 8) & 255
  const b = int & 255
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

const createGradient = (angle: number, from: string, to: string) =>
  `linear-gradient(${angle}deg, ${from}, ${to})`

export function AboutPageContent() {
  const theme = useMantineTheme()

  const accentRedRaw = theme.colors.red?.[5]
  const accentPurpleRaw = theme.colors.purple?.[5]
  const surfaceUpperRaw = theme.colors.black?.[1]
  const surfaceLowerRaw = theme.colors.black?.[3]
  const mutedRaw = theme.colors.black?.[6]
  const whiteRaw = theme.white

  const accentRedHex = resolveHex(accentRedRaw, '#e11d48')
  const accentPurpleHex = resolveHex(accentPurpleRaw, '#7c3aed')
  const surfaceUpperHex = resolveHex(surfaceUpperRaw, '#171717')
  const surfaceLowerHex = resolveHex(surfaceLowerRaw, '#404040')
  const mutedHex = resolveHex(mutedRaw, '#a3a3a3')
  const whiteHex = resolveHex(whiteRaw, '#ffffff')

  const cardBaseStyle = {
    background: createGradient(160, hexToRgba(surfaceUpperHex, 0.88), hexToRgba(surfaceLowerHex, 0.96)),
    border: `1px solid ${hexToRgba(accentPurpleHex, 0.22)}`,
    boxShadow: `0 25px 55px -30px ${hexToRgba(accentPurpleHex, 0.55)}`,
    backdropFilter: 'blur(16px)'
  } as const

  const accentCardStyle = {
    ...cardBaseStyle,
    background: createGradient(135, hexToRgba(accentRedHex, 0.16), hexToRgba(accentPurpleHex, 0.18)),
    border: `1px solid ${hexToRgba(accentRedHex, 0.35)}`,
    boxShadow: `0 30px 60px -28px ${hexToRgba(accentRedHex, 0.6)}`
  } as const

  const mutedTextColor = hexToRgba(mutedHex, 0.9)

  return (
    <Box style={{ backgroundColor: backgroundStyles.page(theme), minHeight: '100vh' }}>
    <Container size="lg" py="xl">
      <Stack gap="xl">
        <Box ta="center">
          <Title order={2} mb="sm" c={whiteHex}>
            About L-File
          </Title>
          <Text size="lg" c={hexToRgba(whiteHex, 0.65)}>
            Comprehensive fan-made archive and community hub for the world of Usogui
          </Text>
        </Box>

        <Grid gutter="xl">
          <Grid.Col span={12}>
            <Card radius="xl" p="xl" style={cardBaseStyle}>
              <Stack gap="md">
                <Title order={3} c={accentRedHex}>
                  About
                </Title>
                <Text size="md" c={hexToRgba(whiteHex, 0.82)}>
                  L-File is a comprehensive fan-made database and community hub dedicated to the manga series Usogui (The Lie Eater).
                  This project aims to provide fans with detailed information about characters, story arcs, gambles, events, and guides
                  to help navigate the complex world of Usogui.
                </Text>
                <Text size="md" c={hexToRgba(whiteHex, 0.82)}>
                  Our mission is to create the most complete and accurate resource for Usogui fans worldwide, featuring character
                  profiles, detailed gamble explanations, chapter guides, and community-contributed content. Whether you&apos;re a new reader
                  trying to understand the intricate gambling strategies or a long-time fan looking to dive deeper into character
                  relationships, L-File is here to enhance your Usogui experience.
                </Text>
                <Text size="md" c={hexToRgba(whiteHex, 0.82)}>
                  This is a non-profit, fan-created project built with love for the Usogui community. All content is created by fans,
                  for fans, and we encourage community participation through guide submissions and media contributions.
                </Text>
              </Stack>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 6 }}>
            <Card
              radius="xl"
              p="xl"
              style={{ ...accentCardStyle, display: 'flex', flexDirection: 'column', height: '100%' }}>
              <Stack gap="md" style={{ flex: 1 }}>
                <Group gap="sm">
                  <Heart size={24} color={accentRedHex} />
                  <Title order={3} c={accentRedHex}>
                    Support Me
                  </Title>
                </Group>
                <Text size="md" c={hexToRgba(whiteHex, 0.78)}>
                  L-File is a passion project that takes considerable time and effort to maintain. If you find this resource helpful
                  and would like to support its continued development, here are some ways you can help:
                </Text>
                <List spacing="md" size="sm" withPadding>
                  {supportItems.map((item) => (
                    <List.Item
                      key={item.primary}
                      style={{
                        background: hexToRgba(surfaceUpperHex, 0.65),
                        borderRadius: theme.radius.md,
                        border: `1px solid ${hexToRgba(accentPurpleHex, 0.25)}`,
                        padding: `${theme.spacing.sm} ${theme.spacing.md}`
                      }}>
                      <Text fw={600} c={whiteHex}>
                        {item.primary}
                      </Text>
                      <Text size="sm" c={hexToRgba(whiteHex, 0.6)}>
                        {item.secondary}
                      </Text>
                    </List.Item>
                  ))}
                </List>
                <Group gap="sm" mt="md">
                  <Button
                    size="md"
                    variant="gradient"
                    gradient={{ from: accentRedHex, to: accentPurpleHex }}
                    leftSection={<Coffee size={16} />}>
                    Ko-fi (Coming Soon)
                  </Button>
                  <Button size="md" variant="outline" style={{ color: getEntityThemeColor(theme, 'gamble') }} leftSection={<Github size={16} />}>
                    GitHub (Coming Soon)
                  </Button>
                </Group>
              </Stack>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 6 }}>
            <Card radius="xl" p="xl" style={cardBaseStyle}>
              <Stack gap="md">
                <Title order={3} c={accentPurpleHex}>
                  Supporters
                </Title>
                <Text size="md" c={hexToRgba(whiteHex, 0.8)}>
                  A huge thank you to everyone who has supported L-File through contributions, feedback, and by spreading the word!
                </Text>
                <Text size="sm" c={hexToRgba(whiteHex, 0.55)} fs="italic">
                  Supporter list coming soon...
                </Text>
                <Divider my="md" color={hexToRgba(accentPurpleHex, 0.35)} />
                <Text size="sm" c={hexToRgba(whiteHex, 0.6)}>
                  Want to be featured here? Support the project and help us grow the Usogui community!
                </Text>
              </Stack>
            </Card>
          </Grid.Col>

          <Grid.Col span={12}>
            <Card radius="xl" p="xl" style={cardBaseStyle}>
              <Stack gap="md">
                <Title order={3} c={accentRedHex}>
                  Contact
                </Title>
                <Text size="md" c={hexToRgba(whiteHex, 0.82)}>
                  Have questions, suggestions, or want to get involved? Here&apos;s how you can reach out:
                </Text>
                <Grid gutter="md">
                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <Stack gap="sm">
                      <Group gap="sm">
                        <Mail size={20} />
                        <Text size="md" c={whiteHex}>
                          Email{' '}
                          <Anchor href="mailto:contact@l-file.com" underline="hover">
                            contact@l-file.com
                          </Anchor>
                        </Text>
                      </Group>
                      <Group gap="sm">
                        <Github size={20} />
                        <Text size="md" c={mutedTextColor}>
                          GitHub: Coming Soon
                        </Text>
                      </Group>
                    </Stack>
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <Group gap="sm">
                      <Twitter size={20} />
                      <Text size="md" c={mutedTextColor}>
                        Twitter: Coming Soon
                      </Text>
                    </Group>
                  </Grid.Col>
                </Grid>
                <Divider my="md" color={hexToRgba(accentRedHex, 0.35)} />
                <Text size="sm" c={hexToRgba(whiteHex, 0.6)}>
                  For content submissions, please use the dedicated &quot;Submit Guide&quot; and &quot;Submit Media&quot; options in the navigation menu.
                </Text>
              </Stack>
            </Card>
          </Grid.Col>
        </Grid>
      </Stack>
    </Container>
    </Box>
  )
}
