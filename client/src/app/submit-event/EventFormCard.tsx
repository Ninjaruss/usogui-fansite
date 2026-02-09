'use client'

import React from 'react'
import {
  ActionIcon,
  Box,
  Card,
  Collapse,
  Group,
  MultiSelect,
  NumberInput,
  Select,
  Stack,
  Text,
  TextInput,
  Textarea,
  useMantineTheme
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { ChevronDown, ChevronUp, Trash2, GripVertical } from 'lucide-react'
import styles from './SubmitEventPageContent.module.css'

const MIN_TITLE_LENGTH = 3
const MIN_DESCRIPTION_LENGTH = 10

const EVENT_TYPE_OPTIONS = [
  { value: 'gamble', label: 'Gamble' },
  { value: 'decision', label: 'Decision' },
  { value: 'reveal', label: 'Reveal' },
  { value: 'shift', label: 'Shift' },
  { value: 'resolution', label: 'Resolution' }
]

export interface EventFormData {
  title: string
  description: string
  chapterNumber: number | ''
  type: string
  spoilerChapter: number | ''
  characterIds: number[]
}

interface EventFormCardProps {
  index: number
  data: EventFormData
  onChange: (data: EventFormData) => void
  onRemove: () => void
  canRemove: boolean
  characterOptions: Array<{ value: string; label: string }>
  accentColor: string
}

export default function EventFormCard({
  index,
  data,
  onChange,
  onRemove,
  canRemove,
  characterOptions,
  accentColor
}: EventFormCardProps) {
  const theme = useMantineTheme()
  const [expanded, { toggle }] = useDisclosure(true)

  const handleChange = (field: keyof EventFormData, value: unknown) => {
    onChange({
      ...data,
      [field]: value
    })
  }

  const isValid = data.title.trim().length >= MIN_TITLE_LENGTH &&
    data.description.trim().length >= MIN_DESCRIPTION_LENGTH &&
    data.chapterNumber && data.chapterNumber >= 1

  const cardTitle = data.title.trim() || `Event ${index + 1}`

  return (
    <Card
      withBorder
      radius="md"
      style={{
        backgroundColor: theme.colors.dark?.[6] ?? '#0d0d0d',
        borderColor: isValid ? `${accentColor}50` : 'rgba(255, 255, 255, 0.1)',
        transition: 'border-color 0.2s ease'
      }}
    >
      {/* Card Header */}
      <Group justify="space-between" p="md" style={{ cursor: 'pointer' }} onClick={toggle}>
        <Group gap="sm">
          <Box style={{ cursor: 'grab', color: 'rgba(255, 255, 255, 0.3)' }}>
            <GripVertical size={16} />
          </Box>
          <Text fw={600} c={isValid ? accentColor : 'dimmed'}>
            {cardTitle}
          </Text>
          {isValid && (
            <Text size="xs" c="green">
              Ready
            </Text>
          )}
        </Group>
        <Group gap="xs">
          {canRemove && (
            <ActionIcon
              variant="subtle"
              color="red"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onRemove()
              }}
            >
              <Trash2 size={16} />
            </ActionIcon>
          )}
          <ActionIcon variant="subtle" size="sm">
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </ActionIcon>
        </Group>
      </Group>

      {/* Collapsible Content */}
      <Collapse in={expanded}>
        <Stack gap="md" p="md" pt={0}>
          <TextInput
            label="Event Title"
            placeholder="e.g., 'Baku reveals the winning card'"
            value={data.title}
            onChange={(e) => handleChange('title', e.currentTarget.value)}
            required
            error={
              data.title.length > 0 && data.title.trim().length < MIN_TITLE_LENGTH
                ? `Minimum ${MIN_TITLE_LENGTH} characters`
                : undefined
            }
            styles={{
              input: {
                backgroundColor: theme.colors.dark?.[5] ?? '#0b0b0b',
                color: theme.colors.gray?.[0] ?? '#fff',
                borderColor: 'rgba(255,255,255,0.06)',
                '&:focus': {
                  borderColor: accentColor,
                  boxShadow: `0 0 0 2px rgba(250, 176, 5, 0.2)`
                }
              },
              label: {
                color: accentColor,
                fontWeight: 600
              }
            }}
          />

          <Textarea
            label="Description"
            placeholder="Describe what happens in this event..."
            value={data.description}
            onChange={(e) => handleChange('description', e.currentTarget.value)}
            required
            minRows={3}
            autosize
            error={
              data.description.length > 0 && data.description.trim().length < MIN_DESCRIPTION_LENGTH
                ? `Minimum ${MIN_DESCRIPTION_LENGTH} characters`
                : undefined
            }
            styles={{
              input: {
                backgroundColor: theme.colors.dark?.[5] ?? '#0b0b0b',
                color: theme.colors.gray?.[0] ?? '#fff',
                borderColor: 'rgba(255,255,255,0.06)',
                '&:focus': {
                  borderColor: accentColor,
                  boxShadow: `0 0 0 2px rgba(250, 176, 5, 0.2)`
                }
              },
              label: {
                color: 'rgba(255,255,255,0.7)',
                fontWeight: 500
              }
            }}
          />

          <Group grow>
            <NumberInput
              label="Chapter"
              placeholder="Chapter #"
              value={data.chapterNumber}
              onChange={(value) => handleChange('chapterNumber', value)}
              required
              min={1}
              styles={{
                input: {
                  backgroundColor: theme.colors.dark?.[5] ?? '#0b0b0b',
                  color: theme.colors.gray?.[0] ?? '#fff',
                  borderColor: 'rgba(255,255,255,0.06)',
                  '&:focus': {
                    borderColor: accentColor,
                    boxShadow: `0 0 0 2px rgba(250, 176, 5, 0.2)`
                  }
                },
                label: {
                  color: accentColor,
                  fontWeight: 600
                }
              }}
            />

            <Select
              label="Type"
              placeholder="Select type"
              value={data.type || null}
              onChange={(value) => handleChange('type', value || '')}
              data={EVENT_TYPE_OPTIONS}
              clearable
              styles={{
                input: {
                  backgroundColor: theme.colors.dark?.[5] ?? '#0b0b0b',
                  color: theme.colors.gray?.[0] ?? '#fff',
                  borderColor: 'rgba(255,255,255,0.06)',
                  '&:focus': {
                    borderColor: accentColor,
                    boxShadow: `0 0 0 2px rgba(250, 176, 5, 0.2)`
                  }
                },
                label: {
                  color: 'rgba(255,255,255,0.7)',
                  fontWeight: 500
                },
                dropdown: {
                  backgroundColor: theme.colors.dark?.[7] ?? '#1a1a1a',
                  borderColor: 'rgba(255,255,255,0.1)'
                }
              }}
              classNames={{ option: styles.selectOption }}
            />
          </Group>

          <Group grow>
            <NumberInput
              label="Spoiler Chapter"
              placeholder="Optional"
              value={data.spoilerChapter}
              onChange={(value) => handleChange('spoilerChapter', value)}
              min={1}
              description="Readers must reach this chapter"
              styles={{
                input: {
                  backgroundColor: theme.colors.dark?.[5] ?? '#0b0b0b',
                  color: theme.colors.gray?.[0] ?? '#fff',
                  borderColor: 'rgba(255,255,255,0.06)',
                  '&:focus': {
                    borderColor: accentColor,
                    boxShadow: `0 0 0 2px rgba(250, 176, 5, 0.2)`
                  }
                },
                label: {
                  color: 'rgba(255,255,255,0.7)',
                  fontWeight: 500
                }
              }}
            />

            <MultiSelect
              label="Characters"
              placeholder="Select characters"
              value={data.characterIds.map(String)}
              onChange={(values) => handleChange('characterIds', values.map((v) => parseInt(v)))}
              data={characterOptions}
              searchable
              clearable
              maxDropdownHeight={200}
              styles={{
                input: {
                  backgroundColor: theme.colors.dark?.[5] ?? '#0b0b0b',
                  color: theme.colors.gray?.[0] ?? '#fff',
                  borderColor: 'rgba(255,255,255,0.06)',
                  '&:focus': {
                    borderColor: accentColor,
                    boxShadow: `0 0 0 2px rgba(250, 176, 5, 0.2)`
                  }
                },
                label: {
                  color: 'rgba(255,255,255,0.7)',
                  fontWeight: 500
                },
                dropdown: {
                  backgroundColor: theme.colors.dark?.[7] ?? '#1a1a1a',
                  borderColor: 'rgba(255,255,255,0.1)'
                },
                pill: {
                  backgroundColor: `${accentColor}30`,
                  color: accentColor
                }
              }}
              classNames={{ option: styles.selectOption }}
            />
          </Group>
        </Stack>
      </Collapse>
    </Card>
  )
}
