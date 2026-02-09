'use client'

import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import styles from './SubmitEventPageContent.module.css'
import {
  Alert,
  Box,
  Button,
  Card,
  Container,
  Group,
  Loader,
  MultiSelect,
  NumberInput,
  Select,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Textarea,
  ThemeIcon,
  Title,
  useMantineTheme
} from '@mantine/core'
import { setTabAccentColors } from '../../lib/mantine-theme'
import { Zap, Send, FileText, BookOpen, Users, AlertTriangle, Plus } from 'lucide-react'
import EventFormCard, { EventFormData } from './EventFormCard'
import EventTimeline from './EventTimeline'
import { useAuth } from '../../providers/AuthProvider'
import { FormProgressIndicator, FormStep } from '../../components/FormProgressIndicator'
import { FormSection } from '../../components/FormSection'
import { api } from '../../lib/api'
import { motion } from 'motion/react'
import SubmissionGuidelines from '../../components/SubmissionGuidelines'

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
  const searchParams = useSearchParams()
  const editEventId = searchParams.get('edit')
  const isEditMode = Boolean(editEventId)

  // Shared context for batch mode
  const [sharedArcId, setSharedArcId] = useState<number | null>(null)
  const [sharedGambleId, setSharedGambleId] = useState<number | null>(null)

  // Single event form data (for edit mode)
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

  // Batch events (for create mode)
  const [batchEvents, setBatchEvents] = useState<EventFormData[]>([
    { title: '', description: '', chapterNumber: '' as number | '', type: '', spoilerChapter: '' as number | '', characterIds: [] }
  ])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [characters, setCharacters] = useState<Array<{ id: number; name: string }>>([])
  const [arcs, setArcs] = useState<Array<{ id: number; name: string }>>([])
  const [gambles, setGambles] = useState<Array<{ id: number; name: string }>>([])
  const [loadingData, setLoadingData] = useState(true)
  const [existingEvent, setExistingEvent] = useState<any>(null)

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

  const validateSingleForm = () => {
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

  const validateBatchEvents = () => {
    for (let i = 0; i < batchEvents.length; i++) {
      const event = batchEvents[i]
      if (!event.title.trim() || event.title.trim().length < MIN_TITLE_LENGTH) {
        return `Event ${i + 1}: Title must be at least ${MIN_TITLE_LENGTH} characters`
      }
      if (!event.description.trim() || event.description.trim().length < MIN_DESCRIPTION_LENGTH) {
        return `Event ${i + 1}: Description must be at least ${MIN_DESCRIPTION_LENGTH} characters`
      }
      if (!event.chapterNumber || event.chapterNumber < 1) {
        return `Event ${i + 1}: Chapter number is required`
      }
    }
    return null
  }

  const handleSingleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setSuccess('')

    const validationError = validateSingleForm()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    try {
      const eventPayload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        chapterNumber: formData.chapterNumber as number,
        type: formData.type || undefined,
        arcId: formData.arcId ?? undefined,
        gambleId: formData.gambleId ?? undefined,
        spoilerChapter: formData.spoilerChapter || undefined,
        characterIds: formData.characterIds.length ? formData.characterIds : undefined
      }

      if (isEditMode && editEventId) {
        await api.updateOwnEvent(parseInt(editEventId), eventPayload)
        setSuccess('Event updated! If it was previously rejected, it has been resubmitted for review.')
      } else {
        await api.createEvent(eventPayload)
        setSuccess('Event submitted! It is now pending review.')
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
      }
    } catch (submissionError: unknown) {
      if (submissionError instanceof Error) {
        setError(submissionError.message)
      } else {
        setError(isEditMode ? 'Failed to update event. Please try again.' : 'Failed to submit event. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleBatchSubmit = async () => {
    setError('')
    setSuccess('')

    const validationError = validateBatchEvents()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    const results = { success: 0, failed: 0, errors: [] as string[] }

    for (const event of batchEvents) {
      try {
        await api.createEvent({
          title: event.title.trim(),
          description: event.description.trim(),
          chapterNumber: event.chapterNumber as number,
          type: event.type || undefined,
          arcId: sharedArcId ?? undefined,
          gambleId: sharedGambleId ?? undefined,
          spoilerChapter: event.spoilerChapter || undefined,
          characterIds: event.characterIds.length ? event.characterIds : undefined
        })
        results.success++
      } catch (err: any) {
        results.failed++
        results.errors.push(`"${event.title || 'Untitled'}": ${err.message || 'Unknown error'}`)
      }
    }

    setLoading(false)

    if (results.failed === 0) {
      setSuccess(`Successfully submitted ${results.success} event${results.success !== 1 ? 's' : ''}! They are now pending review.`)
      // Reset to single empty event
      setBatchEvents([{ title: '', description: '', chapterNumber: '' as number | '', type: '', spoilerChapter: '' as number | '', characterIds: [] }])
    } else if (results.success > 0) {
      setSuccess(`Submitted ${results.success} event${results.success !== 1 ? 's' : ''}.`)
      setError(`${results.failed} event${results.failed !== 1 ? 's' : ''} failed: ${results.errors.join('; ')}`)
    } else {
      setError(`All submissions failed: ${results.errors.join('; ')}`)
    }
  }

  const addEvent = () => {
    setBatchEvents([
      ...batchEvents,
      { title: '', description: '', chapterNumber: '' as number | '', type: '', spoilerChapter: '' as number | '', characterIds: [] }
    ])
  }

  const removeEvent = (index: number) => {
    if (batchEvents.length > 1) {
      setBatchEvents(batchEvents.filter((_, i) => i !== index))
    }
  }

  const updateEvent = (index: number, data: EventFormData) => {
    const newEvents = [...batchEvents]
    newEvents[index] = data
    setBatchEvents(newEvents)
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

  // Fetch existing event data when in edit mode
  useEffect(() => {
    if (isEditMode && editEventId) {
      const fetchEventData = async () => {
        try {
          const eventData = await api.getEvent(parseInt(editEventId))
          setExistingEvent(eventData)
          setFormData({
            title: eventData.title || '',
            description: eventData.description || '',
            chapterNumber: eventData.chapterNumber || 1,
            type: eventData.type || '',
            arcId: eventData.arcId || null,
            gambleId: eventData.gambleId || null,
            spoilerChapter: eventData.spoilerChapter || '',
            characterIds: eventData.characters?.map((c: any) => c.id) || []
          })
        } catch (fetchError) {
          console.error('Error fetching event:', fetchError)
          setError('Failed to load event data. You may not have permission to edit this event.')
        }
      }
      fetchEventData()
    }
  }, [isEditMode, editEventId])

  if (authLoading || loadingData) {
    return (
      <Container size="xl" py="xl">
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

  const characterOptions = characters
    .filter((character) => character.id != null && character.name)
    .map((character) => ({ value: String(character.id), label: character.name }))
  const arcOptions = arcs
    .filter((arc) => arc.id != null && arc.name)
    .map((arc) => ({ value: String(arc.id), label: arc.name }))
  const gambleOptions = gambles
    .filter((gamble) => gamble.id != null && gamble.name)
    .map((gamble) => ({ value: String(gamble.id), label: gamble.name }))

  // Edit mode renders the original single-event form
  if (isEditMode) {
    const isFormValid = !validateSingleForm()
    const progressSteps: FormStep[] = [
      { label: 'Title', completed: formData.title.trim().length >= MIN_TITLE_LENGTH, required: true },
      { label: 'Description', completed: formData.description.trim().length >= MIN_DESCRIPTION_LENGTH, required: true },
      { label: 'Chapter Number', completed: !!formData.chapterNumber && formData.chapterNumber >= 1, required: true }
    ]

    return (
      <Container size="md" py="xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Stack align="center" gap="sm" mb="xl" ta="center">
            <ThemeIcon size={64} radius="xl" variant="light" style={{ backgroundColor: 'rgba(250, 176, 5, 0.15)', color: eventAccent }}>
              <Zap size={32} color={eventAccent} />
            </ThemeIcon>
            <Title order={1}>Edit Event</Title>
            <Text size="lg" c="dimmed">
              Update your event submission details
            </Text>
          </Stack>

          {error && (
            <Alert variant="light" mb="md" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)', color: '#fca5a5' }}>
              <Text size="sm" c="#f87171">{error}</Text>
            </Alert>
          )}

          {success && (
            <Alert variant="light" mb="md" style={{ backgroundColor: 'rgba(250, 176, 5, 0.1)', borderColor: 'rgba(250, 176, 5, 0.3)', color: '#fcd34d' }}>
              <Text size="sm" c={eventAccent}>{success}</Text>
            </Alert>
          )}

          <FormProgressIndicator steps={progressSteps} accentColor={eventAccent} />

          <Card className="event-card" shadow="lg" radius="md" withBorder style={{ backgroundColor: theme.colors.dark?.[7] ?? '#070707', color: theme.colors.gray?.[0] ?? '#fff', borderColor: `${eventAccent}40` }}>
            <form onSubmit={handleSingleSubmit}>
              <Stack gap="xl" p="xl">
                <FormSection title="Basic Information" description="Core details about the event" icon={<FileText size={20} color={eventAccent} />} accentColor={eventAccent} required>
                  <Stack gap="md">
                    <TextInput label="Event Title" placeholder="e.g., 'Baku reveals the winning card'" value={formData.title} onChange={(event) => handleInputChange('title', event.currentTarget.value)} required error={formData.title.length > 0 && formData.title.trim().length < MIN_TITLE_LENGTH ? `Title must be at least ${MIN_TITLE_LENGTH} characters long` : undefined} styles={{ input: { backgroundColor: theme.colors.dark?.[5] ?? '#0b0b0b', color: theme.colors.gray?.[0] ?? '#fff', borderColor: 'rgba(255,255,255,0.06)' }, label: { color: eventAccent, fontWeight: 600 } }} />
                    <Textarea label="Event Description" placeholder="Describe what happens in this event." value={formData.description} onChange={(event) => handleInputChange('description', event.currentTarget.value)} required minRows={4} autosize error={formData.description.length > 0 && formData.description.trim().length < MIN_DESCRIPTION_LENGTH ? `Description must be at least ${MIN_DESCRIPTION_LENGTH} characters long` : undefined} styles={{ input: { backgroundColor: theme.colors.dark?.[5] ?? '#0b0b0b', color: theme.colors.gray?.[0] ?? '#fff', borderColor: 'rgba(255,255,255,0.06)' }, label: { color: eventAccent, fontWeight: 600 } }} />
                    <NumberInput label="Chapter Number" placeholder="Enter chapter number" value={formData.chapterNumber} onChange={(value) => handleInputChange('chapterNumber', value)} required min={1} styles={{ input: { backgroundColor: theme.colors.dark?.[5] ?? '#0b0b0b', color: theme.colors.gray?.[0] ?? '#fff', borderColor: 'rgba(255,255,255,0.06)' }, label: { color: eventAccent, fontWeight: 600 } }} />
                  </Stack>
                </FormSection>

                <FormSection title="Event Classification" description="Categorize and link to related content" icon={<BookOpen size={20} color={eventAccent} />} accentColor={eventAccent}>
                  <Stack gap="md">
                    <Select label="Event Type" placeholder="Select event type" value={formData.type} onChange={(value) => handleInputChange('type', value || '')} data={EVENT_TYPE_OPTIONS} clearable styles={{ input: { backgroundColor: theme.colors.dark?.[5] ?? '#0b0b0b', color: theme.colors.gray?.[0] ?? '#fff', borderColor: 'rgba(255,255,255,0.06)' }, label: { color: 'rgba(255,255,255,0.7)', fontWeight: 500 }, dropdown: { backgroundColor: theme.colors.dark?.[7] ?? '#1a1a1a', borderColor: 'rgba(255,255,255,0.1)' } }} classNames={{ option: styles.selectOption }} />
                    <Select label="Story Arc" placeholder="Select arc" value={formData.arcId?.toString() || null} onChange={(value) => handleInputChange('arcId', value ? parseInt(value) : null)} data={arcOptions} clearable searchable nothingFoundMessage="No arcs found" styles={{ input: { backgroundColor: theme.colors.dark?.[5] ?? '#0b0b0b', color: theme.colors.gray?.[0] ?? '#fff', borderColor: 'rgba(255,255,255,0.06)' }, label: { color: 'rgba(255,255,255,0.7)', fontWeight: 500 }, dropdown: { backgroundColor: theme.colors.dark?.[7] ?? '#1a1a1a', borderColor: 'rgba(255,255,255,0.1)' } }} classNames={{ option: styles.selectOption }} />
                    <Select label="Related Gamble" placeholder="Select gamble" value={formData.gambleId?.toString() || null} onChange={(value) => handleInputChange('gambleId', value ? parseInt(value) : null)} data={gambleOptions} clearable searchable nothingFoundMessage="No gambles found" styles={{ input: { backgroundColor: theme.colors.dark?.[5] ?? '#0b0b0b', color: theme.colors.gray?.[0] ?? '#fff', borderColor: 'rgba(255,255,255,0.06)' }, label: { color: 'rgba(255,255,255,0.7)', fontWeight: 500 }, dropdown: { backgroundColor: theme.colors.dark?.[7] ?? '#1a1a1a', borderColor: 'rgba(255,255,255,0.1)' } }} classNames={{ option: styles.selectOption }} />
                  </Stack>
                </FormSection>

                <FormSection title="Characters Involved" description="Select characters who appear in this event" icon={<Users size={20} color={eventAccent} />} accentColor={eventAccent}>
                  <MultiSelect label="Characters" placeholder="Select characters" value={formData.characterIds.map(String)} onChange={(values) => handleInputChange('characterIds', values.map((v) => parseInt(v)))} data={characterOptions} searchable clearable nothingFoundMessage="No characters found" styles={{ input: { backgroundColor: theme.colors.dark?.[5] ?? '#0b0b0b', color: theme.colors.gray?.[0] ?? '#fff', borderColor: 'rgba(255,255,255,0.06)' }, label: { color: 'rgba(255,255,255,0.7)', fontWeight: 500 }, dropdown: { backgroundColor: theme.colors.dark?.[7] ?? '#1a1a1a', borderColor: 'rgba(255,255,255,0.1)' }, pill: { backgroundColor: `${eventAccent}30`, color: eventAccent } }} classNames={{ option: styles.selectOption }} />
                </FormSection>

                <FormSection title="Spoiler Settings" description="Mark if this event contains story spoilers" icon={<AlertTriangle size={20} color={eventAccent} />} accentColor={eventAccent}>
                  <NumberInput label="Spoiler Chapter" placeholder="Enter chapter number" value={formData.spoilerChapter} onChange={(value) => handleInputChange('spoilerChapter', value)} min={1} description="If this event contains spoilers, specify the chapter readers should have reached" styles={{ input: { backgroundColor: theme.colors.dark?.[5] ?? '#0b0b0b', color: theme.colors.gray?.[0] ?? '#fff', borderColor: 'rgba(255,255,255,0.06)' }, label: { color: 'rgba(255,255,255,0.7)', fontWeight: 500 } }} />
                </FormSection>

                <Button type="submit" size="lg" loading={loading} disabled={!isFormValid} leftSection={<Send size={20} />} style={{ backgroundColor: isFormValid ? eventAccent : undefined, color: isFormValid ? '#000' : undefined }}>
                  {loading ? 'Updating...' : 'Update Event'}
                </Button>

                <Text size="sm" c="dimmed" ta="center">
                  Your updated event will be reviewed by a moderator.
                </Text>
              </Stack>
            </form>
          </Card>
        </motion.div>
      </Container>
    )
  }

  // Batch mode (create mode)
  const isBatchValid = !validateBatchEvents()
  const validEventCount = batchEvents.filter(e =>
    e.title.trim().length >= MIN_TITLE_LENGTH &&
    e.description.trim().length >= MIN_DESCRIPTION_LENGTH &&
    e.chapterNumber && e.chapterNumber >= 1
  ).length

  return (
    <Container size="xl" py="xl">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Stack align="center" gap="sm" mb="xl" ta="center">
          <ThemeIcon size={64} radius="xl" variant="light" style={{ backgroundColor: 'rgba(250, 176, 5, 0.15)', color: eventAccent }}>
            <Zap size={32} color={eventAccent} />
          </ThemeIcon>
          <Title order={1}>Submit Events</Title>
          <Text size="lg" c="dimmed">
            Document key moments, decisions, and revelations from the Usogui story
          </Text>
        </Stack>

        <SubmissionGuidelines type="event" />

        {error && (
          <Alert variant="light" mb="md" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)', color: '#fca5a5' }}>
            <Text size="sm" c="#f87171">{error}</Text>
          </Alert>
        )}

        {success && (
          <Alert variant="light" mb="md" style={{ backgroundColor: 'rgba(250, 176, 5, 0.1)', borderColor: 'rgba(250, 176, 5, 0.3)', color: '#fcd34d' }}>
            <Text size="sm" c={eventAccent}>{success}</Text>
          </Alert>
        )}

        {/* Shared Context Selection */}
        <Card shadow="lg" radius="md" withBorder mb="xl" style={{ backgroundColor: theme.colors.dark?.[7] ?? '#070707', borderColor: `${eventAccent}40` }}>
          <Stack gap="md" p="lg">
            <Text fw={600} c={eventAccent}>Shared Context (applies to all events)</Text>
            <SimpleGrid cols={{ base: 1, sm: 2 }}>
              <Select
                label="Story Arc"
                placeholder="Select arc for all events"
                value={sharedArcId?.toString() || null}
                onChange={(value) => setSharedArcId(value ? parseInt(value) : null)}
                data={arcOptions}
                clearable
                styles={{
                  input: { backgroundColor: theme.colors.dark?.[5] ?? '#0b0b0b', color: theme.colors.gray?.[0] ?? '#fff', borderColor: 'rgba(255,255,255,0.06)' },
                  label: { color: 'rgba(255,255,255,0.7)', fontWeight: 500 },
                  dropdown: { backgroundColor: theme.colors.dark?.[7] ?? '#1a1a1a', borderColor: 'rgba(255,255,255,0.1)' }
                }}
                classNames={{ option: styles.selectOption }}
              />
              <Select
                label="Related Gamble"
                placeholder="Select gamble for all events"
                value={sharedGambleId?.toString() || null}
                onChange={(value) => setSharedGambleId(value ? parseInt(value) : null)}
                data={gambleOptions}
                clearable
                styles={{
                  input: { backgroundColor: theme.colors.dark?.[5] ?? '#0b0b0b', color: theme.colors.gray?.[0] ?? '#fff', borderColor: 'rgba(255,255,255,0.06)' },
                  label: { color: 'rgba(255,255,255,0.7)', fontWeight: 500 },
                  dropdown: { backgroundColor: theme.colors.dark?.[7] ?? '#1a1a1a', borderColor: 'rgba(255,255,255,0.1)' }
                }}
                classNames={{ option: styles.selectOption }}
              />
            </SimpleGrid>
          </Stack>
        </Card>

        {/* Main Content: Events and Timeline */}
        <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="xl">
          {/* Left Column: Event Forms */}
          <Stack gap="md">
            <Group justify="space-between" align="center">
              <Title order={3} c={eventAccent}>Events ({batchEvents.length})</Title>
              <Button variant="light" color="yellow" leftSection={<Plus size={16} />} onClick={addEvent}>
                Add Event
              </Button>
            </Group>

            {batchEvents.map((event, index) => (
              <EventFormCard
                key={index}
                index={index}
                data={event}
                onChange={(data) => updateEvent(index, data)}
                onRemove={() => removeEvent(index)}
                canRemove={batchEvents.length > 1}
                characterOptions={characterOptions}
                accentColor={eventAccent}
              />
            ))}

            <Card shadow="lg" radius="md" withBorder p="lg" style={{ backgroundColor: theme.colors.dark?.[7] ?? '#070707', borderColor: `${eventAccent}40` }}>
              <Stack gap="md">
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">{validEventCount} of {batchEvents.length} event{batchEvents.length !== 1 ? 's' : ''} ready</Text>
                </Group>
                <Button
                  size="lg"
                  loading={loading}
                  disabled={!isBatchValid}
                  onClick={handleBatchSubmit}
                  leftSection={<Send size={20} />}
                  style={{ backgroundColor: isBatchValid ? eventAccent : undefined, color: isBatchValid ? '#000' : undefined }}
                >
                  {loading ? 'Submitting...' : `Submit ${batchEvents.length} Event${batchEvents.length !== 1 ? 's' : ''} for Review`}
                </Button>
                <Text size="sm" c="dimmed" ta="center">
                  Your events will be reviewed by a moderator before being published.
                </Text>
              </Stack>
            </Card>
          </Stack>

          {/* Right Column: Timeline */}
          <Box>
            <Title order={3} c={eventAccent} mb="md">Existing Events</Title>
            {/* TEMPORARY: Commenting out to debug Select error */}
            {/* <EventTimeline
              arcId={sharedArcId}
              gambleId={sharedGambleId}
              accentColor={eventAccent}
            /> */}
          </Box>
        </SimpleGrid>
      </motion.div>
    </Container>
  )
}
