'use client'

import React, { useState, useEffect } from 'react'
import styles from './SubmitEventPageContent.module.css'
import {
  Alert,
  Box,
  Button,
  Card,
  Container,
  Loader,
  MultiSelect,
  NumberInput,
  Select,
  Stack,
  Text,
  TextInput,
  Textarea,
  ThemeIcon,
  Title,
  useMantineTheme
} from '@mantine/core'
import { setTabAccentColors } from '../../lib/mantine-theme'
import { Zap, Send, FileText, BookOpen, Users, AlertTriangle } from 'lucide-react'
import { useAuth } from '../../providers/AuthProvider'
import { FormProgressIndicator, FormStep } from '../../components/FormProgressIndicator'
import { FormSection } from '../../components/FormSection'
import { api } from '../../lib/api'
import { motion } from 'motion/react'

const MIN_TITLE_LENGTH = 3
const MIN_DESCRIPTION_LENGTH = 10

const EVENT_TYPE_OPTIONS = [
  { value: 'gamble', label: 'Gamble' },
  { value: 'decision', label: 'Decision' },
  { value: 'reveal', label: 'Reveal' },
  { value: 'shift', label: 'Shift' },
  { value: 'resolution', label: 'Resolution' }
]

export default function SubmitEventPageContent() {
  const theme = useMantineTheme()
  const { user, loading: authLoading } = useAuth()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    chapterNumber: 1 as number | '',
    type: '' as string,
    arcId: null as number | null,
    gambleId: null as number | null,
    spoilerChapter: '' as number | '',
    characterIds: [] as number[]
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [characters, setCharacters] = useState<Array<{ id: number; name: string }>>([])
  const [arcs, setArcs] = useState<Array<{ id: number; name: string }>>([])
  const [gambles, setGambles] = useState<Array<{ id: number; name: string }>>([])
  const [loadingData, setLoadingData] = useState(true)

  // Set tab accent colors for event entity
  useEffect(() => {
    setTabAccentColors('event')
  }, [])

  const eventAccent = theme.other?.usogui?.event ?? theme.colors.yellow[6]

  const handleInputChange = (field: string, value: unknown) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }))
  }

  const validateForm = () => {
    if (!formData.title.trim()) {
      return 'Title is required'
    }
    if (formData.title.trim().length < MIN_TITLE_LENGTH) {
      return `Title must be at least ${MIN_TITLE_LENGTH} characters long`
    }
    if (!formData.description.trim()) {
      return 'Description is required'
    }
    if (formData.description.trim().length < MIN_DESCRIPTION_LENGTH) {
      return `Description must be at least ${MIN_DESCRIPTION_LENGTH} characters long`
    }
    if (!formData.chapterNumber || formData.chapterNumber < 1) {
      return 'Chapter number is required and must be at least 1'
    }
    return null
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setSuccess('')

    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    try {
      await api.createEvent({
        title: formData.title.trim(),
        description: formData.description.trim(),
        chapterNumber: formData.chapterNumber as number,
        type: formData.type || undefined,
        arcId: formData.arcId ?? undefined,
        gambleId: formData.gambleId ?? undefined,
        spoilerChapter: formData.spoilerChapter || undefined,
        characterIds: formData.characterIds.length ? formData.characterIds : undefined
      })
      setSuccess('Event submitted successfully! It is now pending moderator approval and will be reviewed before being published.')
      setFormData({
        title: '',
        description: '',
        chapterNumber: 1,
        type: '',
        arcId: null,
        gambleId: null,
        spoilerChapter: '',
        characterIds: []
      })
    } catch (submissionError: unknown) {
      if (submissionError instanceof Error) {
        setError(submissionError.message)
      } else {
        setError('Failed to submit event. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const loadData = async () => {
      try {
        const [charactersRes, arcsRes, gamblesRes] = await Promise.all([
          api.getCharacters({ limit: 500 }),
          api.getArcs({ limit: 200 }),
          api.getGambles({ limit: 500 })
        ])
        setCharacters(charactersRes.data || [])
        setArcs(arcsRes.data || [])
        setGambles(gamblesRes.data || [])
      } catch (loadError) {
        console.error('Error loading data:', loadError)
        setError('Failed to load form data. Please refresh the page.')
      } finally {
        setLoadingData(false)
      }
    }

    loadData()
  }, [])

  if (authLoading || loadingData) {
    return (
      <Container size="md" py="xl">
        <Box style={{ display: 'flex', justifyContent: 'center' }}>
          <Loader size="lg" />
        </Box>
      </Container>
    )
  }

  if (!user) {
    return (
      <Container size="md" py="xl">
        <Alert
          variant="light"
          style={{
            backgroundColor: 'rgba(245, 124, 0, 0.1)',
            borderColor: 'rgba(245, 124, 0, 0.3)',
            color: '#ffb74d'
          }}
        >
          <Text c="#ffb74d">Please log in to submit an event.</Text>
        </Alert>
      </Container>
    )
  }

  const isFormValid = !validateForm()

  // Calculate progress steps for the indicator
  const progressSteps: FormStep[] = [
    { label: 'Title', completed: formData.title.trim().length >= MIN_TITLE_LENGTH, required: true },
    { label: 'Description', completed: formData.description.trim().length >= MIN_DESCRIPTION_LENGTH, required: true },
    { label: 'Chapter Number', completed: !!formData.chapterNumber && formData.chapterNumber >= 1, required: true }
  ]

  const characterOptions = characters.map((character) => ({ value: character.id.toString(), label: character.name }))
  const arcOptions = arcs.map((arc) => ({ value: arc.id.toString(), label: arc.name }))
  const gambleOptions = gambles.map((gamble) => ({ value: gamble.id.toString(), label: gamble.name }))

  return (
    <Container size="md" py="xl">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Stack align="center" gap="sm" mb="xl" ta="center">
          <ThemeIcon size={64} radius="xl" variant="light" style={{ backgroundColor: 'rgba(250, 176, 5, 0.15)', color: eventAccent }}>
            <Zap size={32} color={eventAccent} />
          </ThemeIcon>
          <Title order={1}>Submit an Event</Title>
          <Text size="lg" c="dimmed">
            Document key moments, decisions, and revelations from the Usogui story
          </Text>
        </Stack>

        {error && (
          <Alert
            variant="light"
            mb="md"
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              borderColor: 'rgba(239, 68, 68, 0.3)',
              color: '#fca5a5'
            }}
          >
            <Text size="sm" c="#f87171">{error}</Text>
          </Alert>
        )}

        {success && (
          <Alert
            variant="light"
            mb="md"
            style={{
              backgroundColor: 'rgba(250, 176, 5, 0.1)',
              borderColor: 'rgba(250, 176, 5, 0.3)',
              color: '#fcd34d'
            }}
          >
            <Text size="sm" c={eventAccent}>{success}</Text>
          </Alert>
        )}

        <FormProgressIndicator steps={progressSteps} accentColor={eventAccent} />

        <Card
          className="event-card"
          shadow="lg"
          radius="md"
          withBorder
          style={{
            backgroundColor: theme.colors.dark?.[7] ?? '#070707',
            color: theme.colors.gray?.[0] ?? '#fff',
            borderColor: `${eventAccent}40`,
            boxShadow: `0 4px 12px rgba(250, 176, 5, 0.1)`
          }}
        >
          <form onSubmit={handleSubmit}>
            <Stack gap="xl" p="xl">
              {/* Basic Information Section */}
              <FormSection
                title="Basic Information"
                description="Core details about the event"
                icon={<FileText size={20} color={eventAccent} />}
                accentColor={eventAccent}
                required
              >
                <Stack gap="md">
                  <TextInput
                    label="Event Title"
                    placeholder="e.g., 'Baku reveals the winning card' or 'Start of the 17 Steps gamble'"
                    value={formData.title}
                    onChange={(event) => handleInputChange('title', event.currentTarget.value)}
                    required
                    error={
                      formData.title.length > 0 && formData.title.trim().length < MIN_TITLE_LENGTH
                        ? `Title must be at least ${MIN_TITLE_LENGTH} characters long`
                        : undefined
                    }
                    description={`Minimum ${MIN_TITLE_LENGTH} characters`}
                    styles={{
                      input: {
                        backgroundColor: theme.colors.dark?.[5] ?? '#0b0b0b',
                        color: theme.colors.gray?.[0] ?? '#fff',
                        borderColor: 'rgba(255,255,255,0.06)',
                        '&:focus': {
                          borderColor: eventAccent,
                          boxShadow: `0 0 0 2px rgba(250, 176, 5, 0.2)`
                        }
                      },
                      label: {
                        color: eventAccent,
                        fontWeight: 600
                      }
                    }}
                  />

                  <Textarea
                    label="Event Description"
                    placeholder="Describe what happens in this event. Include relevant context and details about the significance of this moment."
                    value={formData.description}
                    onChange={(event) => handleInputChange('description', event.currentTarget.value)}
                    required
                    minRows={4}
                    autosize
                    error={
                      formData.description.length > 0 && formData.description.trim().length < MIN_DESCRIPTION_LENGTH
                        ? `Description must be at least ${MIN_DESCRIPTION_LENGTH} characters long`
                        : undefined
                    }
                    description={`${formData.description.length}/${MIN_DESCRIPTION_LENGTH}+ characters`}
                    styles={{
                      input: {
                        backgroundColor: theme.colors.dark?.[5] ?? '#0b0b0b',
                        color: theme.colors.gray?.[0] ?? '#fff',
                        borderColor: 'rgba(255,255,255,0.06)',
                        '&:focus': {
                          borderColor: eventAccent,
                          boxShadow: `0 0 0 2px rgba(250, 176, 5, 0.2)`
                        }
                      },
                      label: {
                        color: eventAccent,
                        fontWeight: 600
                      }
                    }}
                  />

                  <NumberInput
                    label="Chapter Number"
                    placeholder="Enter chapter number"
                    value={formData.chapterNumber}
                    onChange={(value) => handleInputChange('chapterNumber', value)}
                    required
                    min={1}
                    description="The chapter where this event occurs"
                    styles={{
                      input: {
                        backgroundColor: theme.colors.dark?.[5] ?? '#0b0b0b',
                        color: theme.colors.gray?.[0] ?? '#fff',
                        borderColor: 'rgba(255,255,255,0.06)',
                        '&:focus': {
                          borderColor: eventAccent,
                          boxShadow: `0 0 0 2px rgba(250, 176, 5, 0.2)`
                        }
                      },
                      label: {
                        color: eventAccent,
                        fontWeight: 600
                      }
                    }}
                  />
                </Stack>
              </FormSection>

              {/* Event Classification Section */}
              <FormSection
                title="Event Classification"
                description="Categorize and link to related content"
                icon={<BookOpen size={20} color={eventAccent} />}
                accentColor={eventAccent}
              >
                <Stack gap="md">
                  <Select
                    label="Event Type"
                    placeholder="Select event type"
                    value={formData.type}
                    onChange={(value) => handleInputChange('type', value || '')}
                    data={EVENT_TYPE_OPTIONS}
                    clearable
                    description="Categorize this event by type"
                    styles={{
                      input: {
                        backgroundColor: theme.colors.dark?.[5] ?? '#0b0b0b',
                        color: theme.colors.gray?.[0] ?? '#fff',
                        borderColor: 'rgba(255,255,255,0.06)',
                        '&:focus': {
                          borderColor: eventAccent,
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

                  <Select
                    label="Story Arc"
                    placeholder="Select arc"
                    value={formData.arcId?.toString() || null}
                    onChange={(value) => handleInputChange('arcId', value ? parseInt(value) : null)}
                    data={arcOptions}
                    clearable
                    searchable
                    description="The story arc this event belongs to"
                    styles={{
                      input: {
                        backgroundColor: theme.colors.dark?.[5] ?? '#0b0b0b',
                        color: theme.colors.gray?.[0] ?? '#fff',
                        borderColor: 'rgba(255,255,255,0.06)',
                        '&:focus': {
                          borderColor: eventAccent,
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

                  <Select
                    label="Related Gamble"
                    placeholder="Select gamble"
                    value={formData.gambleId?.toString() || null}
                    onChange={(value) => handleInputChange('gambleId', value ? parseInt(value) : null)}
                    data={gambleOptions}
                    clearable
                    searchable
                    description="If this event is part of a gamble"
                    styles={{
                      input: {
                        backgroundColor: theme.colors.dark?.[5] ?? '#0b0b0b',
                        color: theme.colors.gray?.[0] ?? '#fff',
                        borderColor: 'rgba(255,255,255,0.06)',
                        '&:focus': {
                          borderColor: eventAccent,
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
                </Stack>
              </FormSection>

              {/* Characters Section */}
              <FormSection
                title="Characters Involved"
                description="Select characters who appear in this event"
                icon={<Users size={20} color={eventAccent} />}
                accentColor={eventAccent}
              >
                <MultiSelect
                  label="Characters"
                  placeholder="Select characters"
                  value={formData.characterIds.map(String)}
                  onChange={(values) => handleInputChange('characterIds', values.map((v) => parseInt(v)))}
                  data={characterOptions}
                  searchable
                  clearable
                  styles={{
                    input: {
                      backgroundColor: theme.colors.dark?.[5] ?? '#0b0b0b',
                      color: theme.colors.gray?.[0] ?? '#fff',
                      borderColor: 'rgba(255,255,255,0.06)',
                      '&:focus': {
                        borderColor: eventAccent,
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
                      backgroundColor: `${eventAccent}30`,
                      color: eventAccent
                    }
                  }}
                  classNames={{ option: styles.selectOption }}
                />
              </FormSection>

              {/* Spoiler Settings Section */}
              <FormSection
                title="Spoiler Settings"
                description="Mark if this event contains story spoilers"
                icon={<AlertTriangle size={20} color={eventAccent} />}
                accentColor={eventAccent}
              >
                <NumberInput
                  label="Spoiler Chapter"
                  placeholder="Enter chapter number"
                  value={formData.spoilerChapter}
                  onChange={(value) => handleInputChange('spoilerChapter', value)}
                  min={1}
                  description="If this event contains spoilers, specify the chapter readers should have reached"
                  styles={{
                    input: {
                      backgroundColor: theme.colors.dark?.[5] ?? '#0b0b0b',
                      color: theme.colors.gray?.[0] ?? '#fff',
                      borderColor: 'rgba(255,255,255,0.06)',
                      '&:focus': {
                        borderColor: eventAccent,
                        boxShadow: `0 0 0 2px rgba(250, 176, 5, 0.2)`
                      }
                    },
                    label: {
                      color: 'rgba(255,255,255,0.7)',
                      fontWeight: 500
                    }
                  }}
                />
              </FormSection>

              <Button
                type="submit"
                size="lg"
                loading={loading}
                disabled={!isFormValid}
                leftSection={<Send size={20} />}
                style={{
                  backgroundColor: isFormValid ? eventAccent : undefined,
                  color: isFormValid ? '#000' : undefined
                }}
              >
                Submit Event for Review
              </Button>

              <Text size="sm" c="dimmed" ta="center">
                Your event will be reviewed by a moderator before being published.
              </Text>
            </Stack>
          </form>
        </Card>
      </motion.div>
    </Container>
  )
}
