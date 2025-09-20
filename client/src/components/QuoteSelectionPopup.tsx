'use client'

import React, { useMemo, useState, useEffect } from 'react'
import {
  Badge,
  Box,
  Button,
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
import { Search, Quote as QuoteIcon } from 'lucide-react'

interface Quote {
  id: number
  text: string
  character: string | { id: number; name: string; [key: string]: any }
  chapterNumber: number
}

interface QuoteSelectionPopupProps {
  open: boolean
  onClose: () => void
  quotes: Quote[]
  selectedQuoteId?: number | null
  onSelectQuote: (quoteId: number | null) => void
  loading?: boolean
}

export default function QuoteSelectionPopup({
  open,
  onClose,
  quotes,
  selectedQuoteId,
  onSelectQuote,
  loading = false
}: QuoteSelectionPopupProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [tempSelectedQuote, setTempSelectedQuote] = useState<number | null>(selectedQuoteId ?? null)
  const theme = useMantineTheme()

  // Keep temp selection in sync when the modal is opened or the selectedQuoteId prop changes
  useEffect(() => {
    if (open) {
      setTempSelectedQuote(selectedQuoteId ?? null)
      // Reset search when opening so the selected quote is visible
      setSearchTerm('')
    }
  }, [open, selectedQuoteId])

  const accentColor = useMemo(
    () => theme.other?.usogui?.quote ?? theme.colors.teal?.[6] ?? '#00796b',
    [theme]
  )

  // Filter quotes based on search term
  const filteredQuotes = (quotes || []).filter(quote => {
    const characterName = typeof quote.character === 'string' ? quote.character : quote.character.name
    return quote.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      characterName.toLowerCase().includes(searchTerm.toLowerCase())
  })

  const handleConfirm = () => {
    onSelectQuote(tempSelectedQuote)
    onClose()
  }

  const handleCancel = () => {
    setTempSelectedQuote(selectedQuoteId || null)
    setSearchTerm('')
    onClose()
  }

  const handleClearSelection = () => {
    setTempSelectedQuote(null)
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
          <QuoteIcon size={24} />
          <Text size="lg" fw={600}>
            Select Favorite Quote
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
          placeholder="Search quotes by text or character..."
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.currentTarget.value)}
          leftSection={<Search size={18} />}
          size="md"
        />

        {/* Current Selection */}
        {tempSelectedQuote !== null && (
          <Paper
            withBorder
            radius="md"
            p="md"
            style={{
              backgroundColor: 'rgba(0, 121, 107, 0.12)'
            }}
          >
            <Text size="sm" fw={600} mb="xs">
              Currently Selected:
            </Text>
            {tempSelectedQuote && quotes.find(q => q.id === tempSelectedQuote) ? (
              <Box>
                <Text size="sm" style={{ fontStyle: 'italic', marginBottom: '0.5rem' }}>
                  "{quotes.find(q => q.id === tempSelectedQuote)!.text}"
                </Text>
                <Group gap="xs">
                  <Badge variant="outline" radius="sm">
                    {(() => {
                      const foundQuote = quotes.find(q => q.id === tempSelectedQuote)!;
                      return typeof foundQuote.character === 'string' ? foundQuote.character : foundQuote.character.name;
                    })()}
                  </Badge>
                  <Badge color="red" radius="sm" variant="light">
                    Ch. {quotes.find(q => q.id === tempSelectedQuote)!.chapterNumber}
                  </Badge>
                </Group>
              </Box>
            ) : (
              <Text size="sm" c="dimmed">
                Quote not found
              </Text>
            )}
          </Paper>
        )}

        {/* Quote List */}
        <Box style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <Text size="sm" fw={600} mb="xs">
            Available Quotes ({filteredQuotes.length})
          </Text>
          
          {loading ? (
            <Box style={{ display: 'flex', justifyContent: 'center', paddingBlock: '1.5rem' }}>
              <Loader color="red" />
            </Box>
          ) : filteredQuotes.length === 0 ? (
            <Text size="sm" c="dimmed" style={{ textAlign: 'center', paddingBlock: '1.5rem' }}>
              {searchTerm ? 'No quotes found matching your search.' : 'No quotes available.'}
            </Text>
          ) : (
            <ScrollArea offsetScrollbars style={{ flex: 1 }}>
              <Stack gap="sm">
                {filteredQuotes.map((quote) => {
                  const isSelected = tempSelectedQuote === quote.id
                  const backgroundColor = isSelected
                    ? 'rgba(0, 121, 107, 0.18)'
                    : 'rgba(10, 10, 10, 0.6)'

                  return (
                    <Paper
                      key={quote.id}
                      withBorder
                      radius="md"
                      onClick={() => setTempSelectedQuote(quote.id)}
                      role="button"
                      aria-pressed={isSelected}
                      tabIndex={0}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          setTempSelectedQuote(quote.id)
                        }
                      }}
                      style={{
                        cursor: 'pointer',
                        backgroundColor,
                        borderColor: isSelected ? accentColor : 'rgba(255, 255, 255, 0.08)',
                        padding: theme.spacing.md,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: theme.spacing.xs,
                        transition: 'transform 150ms ease, box-shadow 150ms ease'
                      }}
                      shadow={isSelected ? 'md' : 'sm'}
                    >
                      <Text
                        size="sm"
                        style={{ fontStyle: 'italic' }}
                        c={isSelected ? theme.white : 'rgba(255, 255, 255, 0.85)'}
                      >
                        "{quote.text}"
                      </Text>
                      <Group gap="xs">
                        <Badge
                          variant={isSelected ? 'filled' : 'outline'}
                          color={isSelected ? 'teal' : 'gray'}
                          radius="sm"
                        >
                          {typeof quote.character === 'string' ? quote.character : quote.character.name}
                        </Badge>
                        <Badge
                          variant={isSelected ? 'filled' : 'outline'}
                          color="red"
                          radius="sm"
                        >
                          Ch. {quote.chapterNumber}
                        </Badge>
                      </Group>
                    </Paper>
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
