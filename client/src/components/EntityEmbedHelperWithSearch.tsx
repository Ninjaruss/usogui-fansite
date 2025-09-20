'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Accordion,
  ActionIcon,
  Alert,
  Box,
  Button,
  Loader,
  Modal,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
  Tooltip,
  rem,
  useMantineTheme
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
  Quote,
  Search
} from 'lucide-react'
import { api } from '../lib/api'
import { EntityAccentKey, getEntityAccent } from '../lib/mantine-theme'

interface EntityOption {
  id: number
  name: string
  type: EntityAccentKey | 'chapter' | 'volume'
  subtitle?: string
}

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
    { code: '{{character:1|Baku Madarame}}', description: 'Character with custom text' }
  ],
  arc: [
    { code: '{{arc:5}}', description: 'Basic arc embed' },
    { code: '{{arc:5|Tower Arc}}', description: 'Arc with custom text' }
  ],
  gamble: [
    { code: '{{gamble:12}}', description: 'Basic gamble embed' },
    { code: '{{gamble:12|Air Poker}}', description: 'Gamble with custom text' }
  ],
  guide: [
    { code: '{{guide:3}}', description: 'Basic guide embed' },
    { code: '{{guide:3|Gambling Rules Guide}}', description: 'Guide with custom text' }
  ],
  organization: [
    { code: '{{organization:2}}', description: 'Basic organization embed' },
    { code: '{{organization:2|Kakerou}}', description: 'Organization with custom text' }
  ],
  quote: [{ code: '{{quote:45}}', description: 'Basic quote embed' }],
  media: [],
  event: [],
  chapter: [
    { code: '{{chapter:150}}', description: 'Basic chapter embed' },
    { code: '{{chapter:150|The Final Gamble}}', description: 'Chapter with custom text' }
  ],
  volume: [
    { code: '{{volume:20}}', description: 'Basic volume embed' },
    { code: '{{volume:20|The Conclusion}}', description: 'Volume with custom text' }
  ]
}

const EntityEmbedHelperWithSearch: React.FC<EntityEmbedHelperProps> = ({ onInsertEmbed }) => {
  const theme = useMantineTheme()
  const [opened, setOpened] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchResults, setSearchResults] = useState<EntityOption[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [allEntities, setAllEntities] = useState({
    characters: [] as any[],
    arcs: [] as any[],
    gambles: [] as any[],
    guides: [] as any[],
    organizations: [] as any[],
    chapters: [] as any[],
    volumes: [] as any[],
    quotes: [] as any[]
  })

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

  useEffect(() => {
    const loadAllEntities = async () => {
      try {
        const [charactersRes, arcsRes, gamblesRes, quotesRes] = await Promise.all([
          api.getCharacters({ limit: 100 }),
          api.getArcs({ limit: 100 }),
          api.getGambles({ limit: 100 }),
          api.getQuotes({ limit: 100 })
        ])

        setAllEntities((current) => ({
          ...current,
          characters: charactersRes.data || [],
          arcs: arcsRes.data || [],
          gambles: gamblesRes.data || [],
          quotes: quotesRes.data || []
        }))
      } catch (error) {
        console.error('Error loading entities:', error)
      }
    }

    loadAllEntities()
  }, [])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).catch((err) => {
      console.error('Clipboard copy failed', err)
    })
  }

  const handleInsertEmbed = (embedCode: string) => {
    onInsertEmbed?.(embedCode)
    copyToClipboard(embedCode)
  }

  const handleInsertEntity = (entity: EntityOption) => {
    const embed = `{{${entity.type}:${entity.id}:${entity.name}}}`
    handleInsertEmbed(embed)
    setSearchQuery('')
    setSearchResults([])
  }

  const searchEntities = useCallback(
    (query: string) => {
      if (!query.trim() || query.length < 2) {
        setSearchResults([])
        return
      }

      setSearchLoading(true)
      try {
        const results: EntityOption[] = []
        const searchLower = query.toLowerCase()

        const pushMatches = <T extends { [key: string]: any }>(items: T[], mapper: (item: T) => EntityOption, limit = 5) => {
          results.push(...items.filter(Boolean).map(mapper).filter(Boolean).slice(0, limit))
        }

        pushMatches(allEntities.characters.filter((c) => c.name?.toLowerCase().includes(searchLower)), (c) => ({
          id: c.id,
          name: c.name,
          type: 'character',
          subtitle: c.description || c.arc?.name
        }))

        pushMatches(allEntities.arcs.filter((a) => a.name?.toLowerCase().includes(searchLower)), (a) => ({
          id: a.id,
          name: a.name,
          type: 'arc',
          subtitle: a.description
        }))

        pushMatches(allEntities.gambles.filter((g) => g.name?.toLowerCase().includes(searchLower)), (g) => ({
          id: g.id,
          name: g.name,
          type: 'gamble',
          subtitle: g.description || g.arc?.name
        }))

        pushMatches(allEntities.guides.filter((g) => g.title?.toLowerCase().includes(searchLower)), (g) => ({
          id: g.id,
          name: g.title,
          type: 'guide',
          subtitle: g.description
        }))

        pushMatches(allEntities.organizations.filter((o: any) => o.name?.toLowerCase().includes(searchLower)), (o: any) => ({
          id: o.id,
          name: o.name,
          type: 'organization',
          subtitle: o.description
        }), 3)

        pushMatches(
          allEntities.chapters.filter(
            (c) =>
              (c.title && c.title.toLowerCase().includes(searchLower)) ||
              c.number?.toString().includes(query)
          ),
          (c) => ({
            id: c.id,
            name: c.title || `Chapter ${c.number}`,
            type: 'chapter',
            subtitle: c.summary
          }),
          3
        )

        pushMatches(
          allEntities.volumes.filter(
            (v) =>
              (v.name && v.name.toLowerCase().includes(searchLower)) ||
              v.number?.toString().includes(query)
          ),
          (v) => ({
            id: v.id,
            name: v.name || `Volume ${v.number}`,
            type: 'volume',
            subtitle: v.description
          }),
          3
        )

        pushMatches(allEntities.quotes.filter((q) => q.text?.toLowerCase().includes(searchLower)), (q) => ({
          id: q.id,
          name: q.text ? `${q.text.substring(0, 50)}${q.text.length > 50 ? '...' : ''}` : 'Quote',
          type: 'quote',
          subtitle: q.character?.name || q.source
        }), 3)

        const sortedResults = results
          .filter((option, index, self) => self.findIndex((other) => other.type === option.type && other.id === option.id) === index)
          .sort((a, b) => {
            const lowerQuery = searchLower
            const aName = a.name.toLowerCase()
            const bName = b.name.toLowerCase()
            const aExact = aName === lowerQuery
            const bExact = bName === lowerQuery
            if (aExact && !bExact) return -1
            if (!aExact && bExact) return 1

            const aStarts = aName.startsWith(lowerQuery)
            const bStarts = bName.startsWith(lowerQuery)
            if (aStarts && !bStarts) return -1
            if (!aStarts && bStarts) return 1

            return aName.localeCompare(bName)
          })

        setSearchResults(sortedResults.slice(0, 20))
      } catch (error) {
        console.error('Search error:', error)
        setSearchResults([])
      } finally {
        setSearchLoading(false)
      }
    },
    [allEntities]
  )

  useEffect(() => {
    const timer = setTimeout(() => {
      searchEntities(searchQuery)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery, searchEntities])

  // Utility function to generate RGBA color strings
  function rgba(hex: string, alpha: number): string {
    const bigint = parseInt(hex.replace('#', ''), 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
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
          <Box style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
            Use embeds to reference characters, arcs, gambles, and more. Search for specific entities below or
            use the quick insert buttons.
          </Text>

          <TextInput
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.currentTarget.value)}
            placeholder="Search for characters, arcs, gambles..."
            size="sm"
            rightSection={searchLoading ? <Loader size="xs" /> : undefined}
            styles={{
              input: {
                padding: rem(12),
                fontSize: rem(14),
              },
            }}
          />

          {searchQuery.length >= 2 && (
            <Paper withBorder radius="md" shadow="sm" p="sm" style={{ maxHeight: rem(360), overflowY: 'auto' }}>
              {searchResults.length === 0 && !searchLoading ? (
                <Text size="sm" c="dimmed" ta="center" py="sm">
                  No entities found.
                </Text>
              ) : (
                <Stack gap="sm">
                  {searchResults.map((result) => {
                    const entityTypeDef = entityTypes.find((entity) => entity.type === result.type)
                    const entityColor = entityTypeDef?.color ?? '#666'

                    return (
                      <Button
                        key={`${result.type}-${result.id}`}
                        variant="default"
                        fullWidth
                        size="md"
                        onClick={() => handleInsertEntity(result)}
                        styles={{
                          root: {
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            backgroundColor: theme.colors.dark[6],
                            border: `1px solid ${rgba(entityColor, 0.22)}`,
                            borderRadius: rem(10),
                            padding: `${rem(10)} ${rem(14)}`,
                            minHeight: rem(56),
                            textAlign: 'left',
                            color: theme.colors.gray[2],
                            transition: 'background-color 120ms ease',
                            '&:hover': {
                              backgroundColor: rgba(entityColor, 0.06),
                            },
                          },
                        }}
                      >
                        <Box style={{ display: 'flex', gap: rem(12), alignItems: 'center', flex: 1 }}>
                          <Box style={{ width: rem(36), height: rem(36), display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: rem(8), background: rgba(entityColor, 0.08) }}>
                            {entityTypeDef?.icon}
                          </Box>

                          <Box style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', overflow: 'hidden' }}>
                            <Text size="sm" fw={700} style={{ lineHeight: 1.2, whiteSpace: 'normal', overflowWrap: 'break-word' }}>
                              {result.name}
                            </Text>
                          </Box>
                        </Box>

                        <Box style={{ marginLeft: rem(12), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Box style={{ backgroundColor: rgba(entityColor, 0.12), color: entityColor, padding: `${rem(6)} ${rem(8)}`, borderRadius: rem(999), fontWeight: 700, fontSize: rem(12) }}>
                            {entityTypeDef?.label.toUpperCase()}
                          </Box>
                        </Box>
                      </Button>
                    )
                  })}
                </Stack>
              )}
            </Paper>
          )}
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
              <Text component="code">{'{{character:1|Baku Madarame}}'}</Text>
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

export default EntityEmbedHelperWithSearch
