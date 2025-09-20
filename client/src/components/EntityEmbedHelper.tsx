'use client'

import React, { useMemo, useState } from 'react'
import {
  Accordion,
  ActionIcon,
  Alert,
  Box,
  Button,
  Modal,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Title,
  Tooltip,
  rem,
  useMantineTheme,
  rgba
} from '@mantine/core'
import {
  Code,
  Copy,
  HelpCircle,
  ChevronDown,
  User,
  BookOpen,
  Dice6,
  FileText,
  Users,
  Hash,
  Volume2,
  Quote
} from 'lucide-react'
import { getEntityAccent, EntityAccentKey } from '../lib/mantine-theme'

interface EntityEmbedHelperProps {
  onInsertEmbed?: (embedCode: string) => void
}

interface EmbedExample {
  code: string
  description: string
}

interface EmbedEntityType {
  type: EntityAccentKey | 'chapter' | 'volume'
  label: string
  description: string
  icon: React.ReactNode
  color: string
  examples: EmbedExample[]
}

const baseExamples: Record<EntityAccentKey | 'chapter' | 'volume', EmbedExample[]> = {
  character: [
    { code: '{{character:1}}', description: 'Basic character embed' },
    { code: '{{character:1:Baku Madarame}}', description: 'Character with custom text' }
  ],
  arc: [
    { code: '{{arc:5}}', description: 'Basic arc embed' },
    { code: '{{arc:5:Tower Arc}}', description: 'Arc with custom text' }
  ],
  gamble: [
    { code: '{{gamble:12}}', description: 'Basic gamble embed' },
    { code: '{{gamble:12:Air Poker}}', description: 'Gamble with custom text' }
  ],
  guide: [
    { code: '{{guide:3}}', description: 'Basic guide embed' },
    { code: '{{guide:3:Gambling Rules Guide}}', description: 'Guide with custom text' }
  ],
  organization: [
    { code: '{{organization:2}}', description: 'Basic organization embed' },
    { code: '{{organization:2:Kakerou}}', description: 'Organization with custom text' }
  ],
  quote: [{ code: '{{quote:45}}', description: 'Basic quote embed' }],
  media: [],
  event: [],
  chapter: [
    { code: '{{chapter:150}}', description: 'Basic chapter embed' },
    { code: '{{chapter:150:The Final Gamble}}', description: 'Chapter with custom text' }
  ],
  volume: [
    { code: '{{volume:20}}', description: 'Basic volume embed' },
    { code: '{{volume:20:The Conclusion}}', description: 'Volume with custom text' }
  ]
}

const EntityEmbedHelper: React.FC<EntityEmbedHelperProps> = ({ onInsertEmbed }) => {
  const theme = useMantineTheme()
  const [opened, setOpened] = useState(false)

  const accent = (key: EntityAccentKey, fallback: string) =>
    getEntityAccent(key, theme) || fallback

  const entityTypes: EmbedEntityType[] = useMemo(
    () => [
      {
        type: 'character',
        label: 'Character',
        icon: <User size={16} />,
        color: accent('character', theme.colors.blue[6] || '#1976d2'),
        description: 'Link to character profiles',
        examples: baseExamples.character
      },
      {
        type: 'arc',
        label: 'Arc',
        icon: <BookOpen size={16} />,
        color: accent('arc', theme.colors.pink[5] || '#dc004e'),
        description: 'Link to story arcs',
        examples: baseExamples.arc
      },
      {
        type: 'gamble',
        label: 'Gamble',
        icon: <Dice6 size={16} />,
        color: accent('gamble', theme.colors.red[6] || '#d32f2f'),
        description: 'Link to gambling events',
        examples: baseExamples.gamble
      },
      {
        type: 'guide',
        label: 'Guide',
        icon: <FileText size={16} />,
        color: accent('guide', theme.colors.green[6] || '#388e3c'),
        description: 'Link to other guides',
        examples: baseExamples.guide
      },
      {
        type: 'organization',
        label: 'Organization',
        icon: <Users size={16} />,
        color: accent('organization', theme.colors.violet[6] || '#7c3aed'),
        description: 'Link to organizations and groups',
        examples: baseExamples.organization
      },
      {
        type: 'chapter',
        label: 'Chapter',
        icon: <Hash size={16} />,
        color: theme.other?.usogui?.red ?? theme.colors.red[6] ?? '#e11d48',
        description: 'Link to specific chapters',
        examples: baseExamples.chapter
      },
      {
        type: 'volume',
        label: 'Volume',
        icon: <Volume2 size={16} />,
        color: theme.other?.usogui?.purple ?? theme.colors.violet[5] ?? '#7c3aed',
        description: 'Link to manga volumes',
        examples: baseExamples.volume
      },
      {
        type: 'quote',
        label: 'Quote',
        icon: <Quote size={16} />,
        color: accent('quote', theme.colors.teal[6] || '#00796b'),
        description: 'Link to memorable quotes',
        examples: baseExamples.quote
      }
    ],
    [theme]
  )

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).catch((err) => {
      console.error('Clipboard copy failed', err)
    })
  }

  const handleInsertEmbed = (embedCode: string) => {
    onInsertEmbed?.(embedCode)
    copyToClipboard(embedCode)
  }

  return (
    <>
      <Paper
        withBorder
        radius="md"
        shadow="lg"
        mb="lg"
        p="lg"
        style={{
          border: `1px solid ${(theme.other?.usogui?.red ?? theme.colors.red[6] ?? '#e11d48')}30`,
          background: `linear-gradient(135deg, ${(theme.other?.usogui?.red ?? theme.colors.red[6] ?? '#e11d48')}08 0%, transparent 100%)`
        }}
      >
        <Stack gap="md">
          <Box style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box style={{ display: 'flex', alignItems: 'center', gap: rem(8) }}>
              <Code size={20} color={theme.other?.usogui?.red ?? theme.colors.red[6] ?? '#e11d48'} />
              <Title order={4} c={theme.other?.usogui?.red ?? theme.colors.red[6] ?? '#e11d48'}>
                Entity Embeds
              </Title>
            </Box>
            <Button
              variant="outline"
              size="xs"
              leftSection={<HelpCircle size={14} />}
              onClick={() => setOpened(true)}
            >
              Help
            </Button>
          </Box>

          <Text size="sm" c="dimmed">
            Embed interactive cards using <Text component="code">{'{{type:id}}'}</Text> or{' '}
            <Text component="code">{'{{type:id:custom_text}}'}</Text> to keep readers engaged with related
            content.
          </Text>

          <Box style={{ display: 'flex', flexWrap: 'wrap', gap: rem(8) }}>
            {entityTypes.slice(0, 4).map((entityType) => (
              <Button
                key={entityType.type}
                variant="outline"
                size="xs"
                leftSection={entityType.icon}
                onClick={() => handleInsertEmbed(`{{${entityType.type}:1}}`)}
                styles={{
                  root: {
                    borderColor: entityType.color,
                    color: entityType.color,
                    '&:hover': {
                        backgroundColor: rgba(entityType.color, 0.08)
                    }
                  }
                }}
              >
                {entityType.label}
              </Button>
            ))}
          </Box>
        </Stack>
      </Paper>

      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        radius="lg"
        size="lg"
        title={
          <Box style={{ display: 'flex', alignItems: 'center', gap: rem(8) }}>
            <Code size={20} />
            <Text fw={600}>Entity Embed Guide</Text>
          </Box>
        }
      >
        <Stack gap="xl">
          <Alert color="blue" variant="light" radius="md">
            Entity embeds create interactive cards linking to characters, arcs, gambles, and more. They make
            guides richer and help readers discover related content quickly.
          </Alert>

          <Stack gap="xs">
            <Title order={5}>Basic Syntax</Title>
            <Text size="sm">
              Use double curly braces with the entity type and ID:{' '}
              <Text component="code">{'{{character:1}}'}</Text>
            </Text>
            <Text size="sm">
              Add custom display text when needed:{' '}
              <Text component="code">{'{{character:1:Baku Madarame}}'}</Text>
            </Text>
          </Stack>

          <Accordion radius="md" chevron={<ChevronDown size={16} />}>
            {entityTypes.map((entityType) => (
              <Accordion.Item key={entityType.type} value={entityType.type}>
                <Accordion.Control>
                  <Box style={{ display: 'flex', alignItems: 'center', gap: rem(8) }}>
                    <Box style={{ color: entityType.color }}>{entityType.icon}</Box>
                    <Text fw={600}>{entityType.label}</Text>
                    <Text size="xs" c="dimmed">
                      {entityType.description}
                    </Text>
                  </Box>
                </Accordion.Control>
                <Accordion.Panel>
                  <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm"> 
                    {entityType.examples.map((example, index) => (
                      <Paper key={index} withBorder radius="md" p="sm">
                        <Box
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: rem(8)
                          }}
                        >
                          <Text size="sm" ff="monospace">
                            {example.code}
                          </Text>
                          <Tooltip label="Copy to clipboard" withArrow>
                            <ActionIcon
                              variant="subtle"
                              size="sm"
                              aria-label="Copy embed"
                              onClick={() => handleInsertEmbed(example.code)}
                            >
                              <Copy size={14} />
                            </ActionIcon>
                          </Tooltip>
                        </Box>
                        <Text size="xs" c="dimmed">
                          {example.description}
                        </Text>
                      </Paper>
                    ))}
                  </SimpleGrid>
                </Accordion.Panel>
              </Accordion.Item>
            ))}
          </Accordion>

          <Stack gap="xs">
            <Title order={5}>Tips for Using Entity Embeds</Title>
            <Box component="ul" style={{ paddingInlineStart: rem(18), margin: 0 }}>
              <li>
                <Text size="sm">
                  Reference key characters, events, or concepts to give readers deeper context.
                </Text>
              </li>
              <li>
                <Text size="sm">
                  Use custom text to clarify references, e.g.{' '}
                  <Text component="code">{'{{character:5:the main antagonist}}'}</Text>.
                </Text>
              </li>
              <li>
                <Text size="sm">Embeds render as interactive cards in the published guide.</Text>
              </li>
              <li>
                <Text size="sm">Combine multiple embeds in a section for comprehensive references.</Text>
              </li>
            </Box>
          </Stack>

          <Box style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button onClick={() => setOpened(false)} variant="light" color="red" radius="md">
              Close
            </Button>
          </Box>
        </Stack>
      </Modal>
    </>
  )
}

export default EntityEmbedHelper
