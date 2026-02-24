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
import { Heart, Mail, Coffee, Github } from 'lucide-react'

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

  const user = 'ninjarussyt'
  const domain = 'gmail.com'

  return (
    <Box style={{ backgroundColor: backgroundStyles.page(theme), minHeight: '100vh' }}>
    <Container size="lg" py="xl">
      <Stack gap="xl">
        <Box ta="center">
          <Title order={2} mb="sm" c={whiteHex}>
            About L-File
          </Title>
        </Box>

        <Grid gutter="xl">
          {/* Support Section - Prominent at top */}
          <Grid.Col span={12}>
            <Card
              radius="xl"
              p="xl"
              style={accentCardStyle}>
              <Grid gutter="xl" align="center">
                <Grid.Col span={{ base: 12, md: 7 }}>
                  <Stack gap="md">
                    <Group gap="sm">
                      <Heart size={28} color={accentRedHex} />
                      <Title order={3} c={accentRedHex}>
                        Support L-File
                      </Title>
                    </Group>
                    <Text size="md" c={hexToRgba(whiteHex, 0.85)}>
                      L-File is an independent fan project built in spare time by someone who genuinely loves Usogui.
                      Support helps cover hosting and development costs, keeping the site free and ad-free for the community.
                    </Text>

                    <Group gap="sm" mt="sm">
                      <Button
                        component="a"
                        href="https://ko-fi.com/ninjaruss"
                        target="_blank"
                        rel="noopener noreferrer"
                        size="lg"
                        variant="gradient"
                        gradient={{ from: accentRedHex, to: accentPurpleHex }}
                        leftSection={<Coffee size={20} />}>
                        Support on Ko-fi
                      </Button>
                      <Button
                        component="a"
                        href="https://github.com/Ninjaruss/l-file"
                        target="_blank"
                        rel="noopener noreferrer"
                        size="lg"
                        variant="outline"
                        style={{
                          color: hexToRgba(whiteHex, 0.9),
                          borderColor: hexToRgba(whiteHex, 0.3)
                        }}
                        leftSection={<Github size={20} />}>
                        GitHub
                      </Button>
                    </Group>
                  </Stack>
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 5 }}>
                  <Stack gap="xs">
                    {supportItems.slice(0, 3).map((item) => (
                      <Box
                        key={item.primary}
                        style={{
                          background: hexToRgba(surfaceUpperHex, 0.5),
                          borderRadius: theme.radius.md,
                          border: `1px solid ${hexToRgba(accentPurpleHex, 0.2)}`,
                          padding: `${theme.spacing.sm} ${theme.spacing.md}`
                        }}>
                        <Text fw={600} size="sm" c={whiteHex}>
                          {item.primary}
                        </Text>
                        <Text size="xs" c={hexToRgba(whiteHex, 0.6)}>
                          {item.secondary}
                        </Text>
                      </Box>
                    ))}
                  </Stack>
                </Grid.Col>
              </Grid>
            </Card>
          </Grid.Col>

          {/* About Section */}
          <Grid.Col span={12}>
            <Card radius="xl" p="xl" style={cardBaseStyle}>
              <Stack gap="md">
                <Title order={3} c={accentRedHex}>
                  About
                </Title>
                <Text size="md" c={hexToRgba(whiteHex, 0.82)}>
                  L-File is a fan-made database and community hub dedicated to <i>Usogui (The Lie Eater)</i>.
                  It organizes information about characters, story arcs, gambles, and events to help readers explore the series’ complex world.
                </Text>

                <Text size="md" c={hexToRgba(whiteHex, 0.82)}>
                  Usogui is dense, strategic, and detail-heavy, and existing resources can be difficult to navigate.
                  L-File exists to present information in a clearer, more structured way while preserving the depth that makes the series special.
                </Text>

                <Text size="md" c={hexToRgba(whiteHex, 0.82)}>
                  This is a non-profit fan project. Content is created by fans, for fans, and community contributions help the database continue to grow over time.
                </Text>
              </Stack>
            </Card>
          </Grid.Col>

          {/* Supporters Section */}
          <Grid.Col span={12}>
            <Card radius="xl" p="xl" style={cardBaseStyle}>
              <Stack gap="md">
                <Title order={3} c={accentPurpleHex}>
                  Supporters
                </Title>
                <Text size="md" c={hexToRgba(whiteHex, 0.8)}>
                  Thank you to everyone who has supported L-File through contributions, feedback, and sharing the project with other readers.
                </Text>
                <Text size="sm" c={hexToRgba(whiteHex, 0.6)}>
                  Ko-fi supporters automatically receive special badges on their profiles. Your support helps keep this project running!
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
                  Questions, suggestions, or interested in contributing? You can reach out here:
                </Text>

                <Grid gutter="md">
                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <Stack gap="sm">
                      <Group gap="sm">
                        <Mail size={20} />
                        <Text size="md" c={whiteHex}>
                          Email{' '}
                          <Anchor href={`mailto:${user}@${domain}`}>
                            {user}@{domain}
                          </Anchor>
                        </Text>
                      </Group>
                      <Group gap="sm">
                        <Github size={20} />
                        <Anchor
                          href="https://github.com/ninjaruss"
                          target="_blank"
                          rel="noopener noreferrer"
                          c={whiteHex}
                          underline="hover"
                          size="md"
                        >
                          @ninjaruss
                        </Anchor>
                      </Group>
                    </Stack>
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <Group gap="sm">
                      <Coffee size={20} />
                      <Anchor
                        href="https://ko-fi.com/ninjaruss"
                        target="_blank"
                        rel="noopener noreferrer"
                        c={whiteHex}
                        underline="hover"
                        size="md"
                      >
                        ko-fi.com/ninjaruss
                      </Anchor>
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
