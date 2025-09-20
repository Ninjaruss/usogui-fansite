'use client'

import React, { useMemo, useState, useEffect } from 'react'
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Collapse,
  Group,
  Loader,
  Modal,
  Paper,
  ScrollArea,
  Stack,
  Text,
  TextInput,
  useMantineTheme
} from '@mantine/core'
import { Search, Dices, ChevronDown, ChevronRight } from 'lucide-react'
// GambleChip removed — render simple Badge chips inline

interface Gamble {
  id: number
  name: string
  rules?: string
}

interface GambleSelectionPopupProps {
  open: boolean
  onClose: () => void
  gambles: Gamble[]
  selectedGambleId?: number | null
  onSelectGamble: (gambleId: number | null) => void
  loading?: boolean
}

export default function GambleSelectionPopup({
  open,
  onClose,
  gambles,
  selectedGambleId,
  onSelectGamble,
  loading = false
}: GambleSelectionPopupProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [tempSelectedGamble, setTempSelectedGamble] = useState<number | null>(selectedGambleId ?? null)
  const [expandedGamble, setExpandedGamble] = useState<number | null>(null)
  const theme = useMantineTheme()

  // Keep temp selection in sync when the modal is opened or the selectedGambleId prop changes
  useEffect(() => {
    if (open) {
      setTempSelectedGamble(selectedGambleId ?? null)
      // Reset search and expanded state so selection is visible
      setSearchTerm('')
      setExpandedGamble(null)
    }
  }, [open, selectedGambleId])

  const accentColor = useMemo(
    () => theme.other?.usogui?.gamble ?? theme.colors.red?.[6] ?? '#d32f2f',
    [theme]
  )

  // Filter gambles based on search term
  const filteredGambles = gambles.filter(gamble =>
    gamble.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (gamble.rules && gamble.rules.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const handleConfirm = () => {
    onSelectGamble(tempSelectedGamble)
    onClose()
  }

  const handleCancel = () => {
    setTempSelectedGamble(selectedGambleId || null)
    setSearchTerm('')
    setExpandedGamble(null)
    onClose()
  }

  const handleClearSelection = () => {
    setTempSelectedGamble(null)
  }

  const toggleExpanded = (gambleId: number) => {
    setExpandedGamble(expandedGamble === gambleId ? null : gambleId)
  }

  return (
    <Modal
      opened={open}
      onClose={handleCancel}
      size="lg"
      centered
      radius="md"
      title={
        <Group gap="sm">
          <Dices size={24} />
          <Text size="lg" fw={600}>
            Select Favorite Gamble
          </Text>
        </Group>
      }
      styles={{
        content: {
          height: '80vh',
          display: 'flex',
          flexDirection: 'column'
        },
        body: {
          display: 'flex',
          flexDirection: 'column',
          gap: theme.spacing.md,
          paddingBottom: theme.spacing.md,
          flex: 1
        },
        header: {
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          marginBottom: theme.spacing.md,
          paddingBottom: theme.spacing.sm
        }
      }}
    >
      <Stack gap="md" style={{ flex: 1 }}>
        {/* Search Field */}
        <TextInput
          placeholder="Search gambles by name or rules..."
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.currentTarget.value)}
          leftSection={<Search size={18} />}
          size="md"
        />

        {/* Current Selection */}
    {tempSelectedGamble !== null && (
            <Paper
            withBorder
            radius="md"
            p="md"
            style={{
              backgroundColor: (theme as any).fn?.rgba ? (theme as any).fn.rgba(accentColor, 0.12) : 'rgba(211, 47, 47, 0.12)'
            }}
          >
            <Text size="sm" fw={600} mb="xs">
              Currently Selected:
            </Text>
              {(() => {
              const selectedGamble = gambles.find(g => g.id === tempSelectedGamble)
              return selectedGamble ? (
                <Box>
                  <Badge radius="lg" size="sm" variant="filled" color="gamble" style={{ fontWeight: 700 }}>
                    {selectedGamble.name}
                  </Badge>
                </Box>
              ) : (
                <Text size="sm" c="dimmed">
                  Gamble not found
                </Text>
              )
            })()}
          </Paper>
        )}

        {/* Gamble List */}
        <Box style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <Text size="sm" fw={600} mb="xs">
            Available Gambles ({filteredGambles.length})
          </Text>
          
          {loading ? (
            <Box style={{ display: 'flex', justifyContent: 'center', paddingBlock: '1.5rem' }}>
              <Loader color="red" />
            </Box>
          ) : filteredGambles.length === 0 ? (
            <Text size="sm" c="dimmed" style={{ textAlign: 'center', paddingBlock: '1.5rem' }}>
              {searchTerm ? 'No gambles found matching your search.' : 'No gambles available.'}
            </Text>
          ) : (
            <ScrollArea offsetScrollbars style={{ flex: 1 }}>
              <Stack gap="sm">
                {filteredGambles.map((gamble) => {
                  const isSelected = tempSelectedGamble === gamble.id
                  const hasLongRules = Boolean(gamble.rules && gamble.rules.length > 100)

                  const cardBackground = isSelected
                    ? (theme as any).fn?.rgba
                      ? (theme as any).fn.rgba(accentColor, 0.18)
                      : 'rgba(211, 47, 47, 0.18)'
                    : 'rgba(10, 10, 10, 0.6)'

                  return (
                    <Box key={gamble.id}>
                      <Paper
                        withBorder
                        radius="md"
                        onClick={() => setTempSelectedGamble(gamble.id)}
                        role="button"
                        aria-pressed={isSelected}
                        tabIndex={0}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault()
                            setTempSelectedGamble(gamble.id)
                          }
                        }}
                        style={{
                          cursor: 'pointer',
                          backgroundColor: cardBackground,
                          borderColor: isSelected ? accentColor : 'rgba(255, 255, 255, 0.08)',
                          padding: theme.spacing.md,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: theme.spacing.xs,
                          transition: 'transform 150ms ease, box-shadow 150ms ease'
                        }}
                        shadow={isSelected ? 'md' : 'sm'}
                      >
                        <Group justify="space-between" align="flex-start" gap="xs">
                          <Badge radius="lg" size="sm" variant={isSelected ? 'filled' : 'outline'} color="gamble" style={{ fontWeight: 700 }}>
                            {gamble.name}
                          </Badge>
                          {hasLongRules && (
                            <ActionIcon
                              variant="subtle"
                              color={isSelected ? 'red' : 'gray'}
                              onClick={(event) => {
                                event.stopPropagation()
                                toggleExpanded(gamble.id)
                              }}
                            >
                              {expandedGamble === gamble.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                            </ActionIcon>
                          )}
                        </Group>

                        {gamble.rules && (
                          <Text
                            size="sm"
                            c={isSelected ? theme.white : 'rgba(255, 255, 255, 0.7)'}
                            style={{ opacity: 0.9 }}
                          >
                            {hasLongRules
                              ? `${gamble.rules.substring(0, 100)}...`
                              : gamble.rules}
                          </Text>
                        )}
                      </Paper>

                      {gamble.rules && (
                        <Collapse in={expandedGamble === gamble.id}>
                          <Paper
                            withBorder
                            radius="md"
                            p="md"
                            style={{
                              marginTop: theme.spacing.xs,
                              backgroundColor: 'rgba(10, 10, 10, 0.65)'
                            }}
                          >
                            <Text size="sm" c="dimmed">
                              <strong>Full Rules:</strong> {gamble.rules}
                            </Text>
                          </Paper>
                        </Collapse>
                      )}
                    </Box>
                  )
                })}
              </Stack>
            </ScrollArea>
          )}
        </Box>
      </Stack>

      <Group justify="space-between" mt="auto">
        <Button onClick={handleClearSelection} variant="outline" color="yellow">
          Clear Selection
        </Button>
        <Group gap="sm">
          <Button onClick={handleCancel} variant="subtle" color="gray">
            Cancel
          </Button>
          <Button onClick={handleConfirm} color="red" disabled={loading}>
            Confirm Selection
          </Button>
        </Group>
      </Group>
    </Modal>
  )
}
