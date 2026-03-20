'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  Modal,
  TextInput,
  Group,
  Stack,
  Text,
  Badge,
  UnstyledButton,
  Button,
  Box,
  Loader,
  Chip,
} from '@mantine/core'
import { Search } from 'lucide-react'
import { api } from '../../lib/api'
import type { EntityType } from './EntityEmbedExtension'

interface InsertEntityModalProps {
  opened: boolean
  onClose: () => void
  onInsert: (attrs: {
    entityType: EntityType
    entityId: number
    displayText: string | null
  }) => void
}

interface SearchResult {
  id: number
  label: string
  sublabel?: string
}

type EntityTypeOption = {
  value: EntityType
  label: string
  color: string
}

const ENTITY_TYPE_OPTIONS: EntityTypeOption[] = [
  { value: 'character', label: 'Character', color: 'violet' },
  { value: 'arc', label: 'Arc', color: 'blue' },
  { value: 'gamble', label: 'Gamble', color: 'red' },
  { value: 'guide', label: 'Guide', color: 'green' },
  { value: 'organization', label: 'Organization', color: 'orange' },
  { value: 'chapter', label: 'Chapter', color: 'cyan' },
  { value: 'volume', label: 'Volume', color: 'teal' },
  { value: 'quote', label: 'Quote', color: 'gray' },
]

async function searchEntities(
  entityType: EntityType,
  query: string,
): Promise<SearchResult[]> {
  try {
    switch (entityType) {
      case 'character': {
        const res = await api.getCharacters({ name: query, limit: 10 })
        return (res.data ?? []).map((c: any) => ({
          id: c.id,
          label: c.name ?? `Character #${c.id}`,
        }))
      }
      case 'arc': {
        const res = await api.getArcs({ name: query, limit: 10 })
        return (res.data ?? []).map((a: any) => ({
          id: a.id,
          label: a.name ?? `Arc #${a.id}`,
        }))
      }
      case 'gamble': {
        const res = await api.getGambles({ gambleName: query, limit: 10 })
        return (res.data ?? []).map((g: any) => ({
          id: g.id,
          label: g.name ?? `Gamble #${g.id}`,
        }))
      }
      case 'guide': {
        const res = await api.getGuides({ search: query, limit: 10 })
        return (res.data ?? []).map((g: any) => ({
          id: g.id,
          label: g.title ?? `Guide #${g.id}`,
        }))
      }
      case 'organization': {
        const res = await api.getOrganizations({ name: query, limit: 10 })
        return (res.data ?? []).map((o: any) => ({
          id: o.id,
          label: o.name ?? `Organization #${o.id}`,
        }))
      }
      case 'chapter': {
        const params: { limit: number; title?: string } = { limit: 10 }
        if (query) params.title = query
        const res = await api.getChapters(params)
        return (res.data ?? []).map((c: any) => ({
          id: c.id,
          label: c.title ? `Chapter ${c.number}: ${c.title}` : `Chapter ${c.number}`,
        }))
      }
      case 'volume': {
        const res = await api.getVolumes({ limit: 10 })
        const all: any[] = res.data ?? []
        const filtered = query
          ? all.filter((v) => String(v.number).includes(query))
          : all
        return filtered.slice(0, 10).map((v: any) => ({
          id: v.id,
          label: v.title ? `Volume ${v.number}: ${v.title}` : `Volume ${v.number}`,
        }))
      }
      case 'quote': {
        const params: { limit: number; search?: string } = { limit: 10 }
        if (query) params.search = query
        const res = await api.getQuotes(params)
        return (res.data ?? []).map((q: any) => ({
          id: q.id,
          label: q.text ? `"${String(q.text).substring(0, 60)}..."` : `Quote #${q.id}`,
        }))
      }
      default:
        return []
    }
  } catch {
    return []
  }
}

export default function InsertEntityModal({
  opened,
  onClose,
  onInsert,
}: InsertEntityModalProps) {
  const [entityType, setEntityType] = useState<EntityType>('character')
  const [searchQuery, setSearchQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<SearchResult | null>(null)
  const [displayText, setDisplayText] = useState('')

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Reset all state when modal closes
  useEffect(() => {
    if (!opened) {
      setEntityType('character')
      setSearchQuery('')
      setResults([])
      setLoading(false)
      setSelected(null)
      setDisplayText('')
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [opened])

  // Debounced search
  const runSearch = useCallback(
    (type: EntityType, query: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(async () => {
        setLoading(true)
        const res = await searchEntities(type, query)
        setResults(res)
        setLoading(false)
      }, 300)
    },
    [],
  )

  // Trigger search when entity type or query changes (only while no selection)
  useEffect(() => {
    if (!opened || selected) return
    runSearch(entityType, searchQuery)
  }, [entityType, searchQuery, opened, selected, runSearch])

  function handleTypeChange(value: EntityType) {
    setEntityType(value)
    setSelected(null)
    setDisplayText('')
    setResults([])
  }

  function handleSelect(result: SearchResult) {
    setSelected(result)
    setDisplayText(result.label)
  }

  function handleBack() {
    setSelected(null)
    setDisplayText('')
  }

  function handleInsert() {
    if (!selected) return
    onInsert({
      entityType,
      entityId: selected.id,
      displayText: displayText.trim() || null,
    })
    onClose()
  }

  const typeOption = ENTITY_TYPE_OPTIONS.find((o) => o.value === entityType)

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Insert Entity Embed"
      size="md"
    >
      <Stack gap="sm">
        {/* Type filter chips */}
        <Group gap={6} wrap="wrap">
          {ENTITY_TYPE_OPTIONS.map((opt) => (
            <Chip
              key={opt.value}
              checked={entityType === opt.value}
              onChange={() => handleTypeChange(opt.value)}
              color={opt.color}
              size="xs"
            >
              {opt.label}
            </Chip>
          ))}
        </Group>

        {!selected ? (
          <>
            {/* Search input */}
            <TextInput
              placeholder={`Search ${typeOption?.label ?? entityType}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.currentTarget.value)}
              leftSection={<Search size={14} />}
              rightSection={loading ? <Loader size={14} /> : null}
              autoFocus
            />

            {/* Results list */}
            <Box
              style={{
                maxHeight: 240,
                overflowY: 'auto',
                border: '1px solid var(--mantine-color-default-border)',
                borderRadius: 'var(--mantine-radius-sm)',
              }}
            >
              {results.length === 0 && !loading && (
                <Text size="sm" c="dimmed" p="sm" ta="center">
                  {searchQuery ? 'No results found' : 'Start typing to search'}
                </Text>
              )}
              {results.map((result) => (
                <UnstyledButton
                  key={result.id}
                  onClick={() => handleSelect(result)}
                  w="100%"
                  px="sm"
                  py={8}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    borderBottom: '1px solid var(--mantine-color-default-border)',
                    cursor: 'pointer',
                  }}
                  styles={{
                    root: {
                      '&:hover': {
                        backgroundColor: 'var(--mantine-color-default-hover)',
                      },
                      '&:last-child': {
                        borderBottom: 'none',
                      },
                    },
                  }}
                >
                  <Badge
                    size="xs"
                    color={typeOption?.color ?? 'blue'}
                    variant="light"
                  >
                    {result.id}
                  </Badge>
                  <Text size="sm" style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {result.label}
                  </Text>
                </UnstyledButton>
              ))}
            </Box>
          </>
        ) : (
          /* Confirmation row */
          <Stack gap="sm">
            <Group gap="xs" align="center">
              <Badge color={typeOption?.color ?? 'blue'} variant="light">
                {typeOption?.label}
              </Badge>
              <Text size="sm" fw={500}>
                {selected.label}
              </Text>
              <Badge size="xs" variant="outline" color="gray">
                ID: {selected.id}
              </Badge>
            </Group>

            <TextInput
              label="Display text (optional)"
              description="Leave blank to use the entity name as display text"
              value={displayText}
              onChange={(e) => setDisplayText(e.currentTarget.value)}
              placeholder="Custom display text..."
            />

            <Group justify="flex-end" gap="sm">
              <Button variant="subtle" size="sm" onClick={handleBack}>
                Back
              </Button>
              <Button size="sm" onClick={handleInsert}>
                Insert embed
              </Button>
            </Group>
          </Stack>
        )}
      </Stack>
    </Modal>
  )
}
