'use client'

import React, { useState, useEffect } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  Container,
  Grid,
  Group,
  Loader,
  MultiSelect,
  Select,
  Stack,
  TagsInput,
  Text,
  TextInput,
  Textarea,
  rem,
  useMantineTheme,
} from '@mantine/core'
import { AlertTriangle, BookOpen, FileText, Send } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/providers/AuthProvider'
import { FormProgressIndicator, FormStep } from '@/components/FormProgressIndicator'
import { FormSection } from '@/components/FormSection'
import { EditPageShell } from '@/components/EditPageShell'
import { api } from '@/lib/api'
import RichMarkdownEditor from '@/components/RichMarkdownEditor'
import SubmissionSuccess from '@/components/SubmissionSuccess'
import { getEntityColor } from '@/lib/entityColors'
import { getInputStyles, getMultiSelectStyles, getDimmedInputStyles } from '@/lib/submitFormStyles'
import { setTabAccentColors } from '@/lib/mantine-theme'

const MIN_TITLE_LENGTH = 5
const MIN_DESCRIPTION_LENGTH = 20
const MIN_CONTENT_LENGTH = 100

const AMBER = '#f59e0b'

interface ExistingGuide {
  id: number
  title: string
  description: string
  content: string
  characterIds?: number[]
  arcId?: number | null
  gambleIds?: number[]
  tags?: Array<{ id: number; name: string }>
  status: 'pending' | 'approved' | 'rejected'
  rejectionReason?: string | null
  createdAt?: string
  updatedAt?: string
}

interface EditGuidePageContentProps {
  id: number
}

export default function EditGuidePageContent({ id }: EditGuidePageContentProps) {
  const theme = useMantineTheme()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const accentColor = getEntityColor('guide')

  useEffect(() => { setTabAccentColors('guide') }, [])

  const inputStyles = getInputStyles(theme, accentColor)
  const multiSelectStyles = getMultiSelectStyles(theme, accentColor)
  const dimmedInputStyles = getDimmedInputStyles(theme)

  const [existingGuide, setExistingGuide] = useState<ExistingGuide | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    characterIds: [] as number[],
    arcId: null as number | null,
    gambleIds: [] as number[],
    tags: [] as string[],
  })
  const [initialData, setInitialData] = useState<typeof formData | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [error, setError] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)
  const [characters, setCharacters] = useState<Array<{ id: number; name: string }>>([])
  const [arcs, setArcs] = useState<Array<{ id: number; name: string }>>([])
  const [gambles, setGambles] = useState<Array<{ id: number; name: string }>>([])
  const [tags, setTags] = useState<Array<{ id: number; name: string }>>([])

  const handleInputChange = (field: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const isDirty = (field: keyof typeof formData): boolean => {
    if (!initialData) return false
    return JSON.stringify(formData[field]) !== JSON.stringify(initialData[field])
  }

  const validateForm = () => {
    if (!formData.title.trim()) return 'Title is required'
    if (formData.title.trim().length < MIN_TITLE_LENGTH) return 'Please provide a more descriptive title'
    if (!formData.description.trim()) return 'Description is required'
    if (formData.description.trim().length < MIN_DESCRIPTION_LENGTH) return 'Please add more detail to your description'
    if (!formData.content.trim()) return 'Content is required'
    if (formData.content.trim().length < MIN_CONTENT_LENGTH) return 'Your guide content needs more detail'
    return null
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    const validationError = validateForm()
    if (validationError) { setError(validationError); return }

    setLoading(true)
    try {
      await api.updateGuide(id, {
        title: formData.title.trim(),
        description: formData.description.trim(),
        content: formData.content.trim(),
        characterIds: formData.characterIds.length ? formData.characterIds : undefined,
        arcId: formData.arcId ?? undefined,
        gambleIds: formData.gambleIds.length ? formData.gambleIds : undefined,
        tagNames: formData.tags.length ? formData.tags : undefined,
      })
      setShowSuccess(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update guide. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const load = async () => {
      try {
        const [guide, charactersRes, arcsRes, gamblesRes, tagsRes] = await Promise.all([
          api.getMyGuideSubmission(id),
          api.getCharacters({ limit: 500 }),
          api.getArcs({ limit: 200 }),
          api.getGambles({ limit: 500 }),
          api.getTags({ limit: 500 }),
        ])
        setExistingGuide(guide)
        const populated = {
          title: guide.title || '',
          description: guide.description || '',
          content: guide.content || '',
          characterIds: guide.characterIds || [],
          arcId: guide.arcId ?? null,
          gambleIds: guide.gambleIds || [],
          tags: guide.tags?.map((t: { name: string }) => t.name) || [],
        }
        setFormData(populated)
        setInitialData(populated)
        setCharacters(charactersRes.data || [])
        setArcs(arcsRes.data || [])
        setGambles(gamblesRes.data || [])
        setTags(tagsRes.data || [])
      } catch {
        setError('Failed to load guide. You may not have permission to edit this guide.')
      } finally {
        setLoadingData(false)
      }
    }
    load()
  }, [id])

  // Loading state
  if (authLoading || loadingData) {
    return (
      <Container size="md" py="xl">
        <Stack align="center" gap="md" py="xl">
          <Loader size="sm" color={accentColor} />
          <Text size="sm" c="dimmed">Loading guide…</Text>
        </Stack>
      </Container>
    )
  }

  // Auth gate
  if (!user) {
    return (
      <Container size="md" py="xl">
        <Alert icon={<AlertTriangle size={16} />}>
          You need to be logged in to edit this guide.
        </Alert>
      </Container>
    )
  }

  // Load error (guide not found / no permission)
  if (!existingGuide && error) {
    return (
      <Container size="md" py="xl">
        <Alert
          icon={<AlertTriangle size={16} />}
          style={{ backgroundColor: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.3)' }}
        >
          <Text size="sm" c="#f87171">{error}</Text>
        </Alert>
      </Container>
    )
  }

  if (!existingGuide) return null

  const isFormValid = !validateForm()

  const progressSteps: FormStep[] = [
    { label: 'Title', completed: formData.title.trim().length >= MIN_TITLE_LENGTH, required: true },
    { label: 'Description', completed: formData.description.trim().length >= MIN_DESCRIPTION_LENGTH, required: true },
    { label: 'Content', completed: formData.content.trim().length >= MIN_CONTENT_LENGTH, required: true },
  ]

  const characterOptions = characters.map((c) => ({ value: c.id.toString(), label: c.name }))
  const arcOptions = arcs.map((a) => ({ value: a.id.toString(), label: a.name }))
  const gambleOptions = gambles.map((g) => ({ value: g.id.toString(), label: g.name }))
  const tagOptions = tags.map((t) => t.name)

  return (
    <Container size="md" py="xl">
      <EditPageShell
        type="guide"
        accentColor={accentColor}
        submissionTitle={existingGuide.title}
        status={existingGuide.status}
        submittedAt={existingGuide.createdAt ?? new Date().toISOString()}
        updatedAt={existingGuide.updatedAt}
        submissionId={existingGuide.id}
        rejectionReason={existingGuide.rejectionReason}
      >
        {showSuccess ? (
          <SubmissionSuccess
            type="guide"
            isEdit
            accentColor={accentColor}
            onSubmitAnother={() => router.push('/profile')}
          />
        ) : (
          <>
            {error && (
              <Alert
                icon={<AlertTriangle size={16} />}
                mb="md"
                style={{ backgroundColor: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.3)' }}
              >
                <Text size="sm" c="#f87171">{error}</Text>
              </Alert>
            )}

            <FormProgressIndicator steps={progressSteps} accentColor={accentColor} />

            <Card
              shadow="lg"
              radius="md"
              withBorder
              style={{
                backgroundColor: theme.colors.dark?.[7] ?? '#070707',
                borderColor: `${accentColor}35`,
                boxShadow: `0 4px 24px ${accentColor}12`,
              }}
            >
              <Box
                style={{
                  height: rem(3),
                  background: `linear-gradient(90deg, ${accentColor}70, transparent)`,
                  borderRadius: `${rem(6)} ${rem(6)} 0 0`,
                  marginBottom: rem(-3),
                }}
              />
              <form onSubmit={handleSubmit}>
                <Stack gap="xl" p="xl">
                  <FormSection
                    title="Guide Details"
                    description="Update the title and description of your guide"
                    icon={<FileText size={18} color={accentColor} />}
                    accentColor={accentColor}
                    required
                    stepNumber={1}
                    hasValue={!!formData.title || !!formData.description}
                  >
                    <Stack gap="md">
                      <TextInput
                        label={
                          <span>
                            Guide Title
                            {isDirty('title') && (
                              <span style={{ fontSize: rem(10), background: 'rgba(245,158,11,0.1)', color: AMBER, border: '1px solid rgba(245,158,11,0.25)', borderRadius: 3, padding: '1px 5px', marginLeft: 6 }}>
                                edited
                              </span>
                            )}
                          </span>
                        }
                        placeholder="e.g., 'Understanding the Rules of Air Poker'"
                        value={formData.title}
                        onChange={(e) => handleInputChange('title', e.currentTarget.value)}
                        required
                        error={formData.title.length > 0 && formData.title.trim().length < MIN_TITLE_LENGTH ? 'Please provide a more descriptive title' : undefined}
                        styles={inputStyles}
                      />
                      <Textarea
                        label="Guide Description"
                        placeholder="Provide a brief summary of what your guide covers…"
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.currentTarget.value)}
                        required
                        minRows={3}
                        autosize
                        error={formData.description.length > 0 && formData.description.trim().length < MIN_DESCRIPTION_LENGTH ? 'Please add more detail to your description' : undefined}
                        styles={inputStyles}
                      />
                    </Stack>
                  </FormSection>

                  <FormSection
                    title="Guide Content"
                    description="Update your guide content using the rich editor"
                    icon={<BookOpen size={18} color={accentColor} />}
                    accentColor={accentColor}
                    required
                    stepNumber={2}
                    hasValue={formData.content.length > 0}
                  >
                    <RichMarkdownEditor
                      value={formData.content}
                      onChange={(md) => setFormData((prev) => ({ ...prev, content: md }))}
                      placeholder="Update your guide content here."
                      minHeight={300}
                      label="Guide content"
                    />
                  </FormSection>

                  <FormSection
                    title="Related Content"
                    description="Update linked characters, arcs, gambles, and tags"
                    icon={<BookOpen size={18} color={accentColor} />}
                    accentColor={accentColor}
                    stepNumber={3}
                    hasValue={formData.characterIds.length > 0 || formData.arcId !== null || formData.gambleIds.length > 0 || formData.tags.length > 0}
                  >
                    <Grid gutter="md">
                      <Grid.Col span={{ base: 12, sm: 6 }}>
                        <MultiSelect label="Characters" placeholder="Select related characters" data={characterOptions} value={formData.characterIds.map(String)} onChange={(v) => handleInputChange('characterIds', v.map(Number))} searchable clearable nothingFoundMessage="No characters" styles={multiSelectStyles} />
                      </Grid.Col>
                      <Grid.Col span={{ base: 12, sm: 6 }}>
                        <Select label="Arc" placeholder="Select related arc" data={arcOptions} value={formData.arcId !== null ? formData.arcId.toString() : null} onChange={(v) => handleInputChange('arcId', v ? Number(v) : null)} searchable clearable nothingFoundMessage="No arcs" styles={dimmedInputStyles} />
                      </Grid.Col>
                      <Grid.Col span={{ base: 12, sm: 6 }}>
                        <MultiSelect label="Gambles" placeholder="Select related gambles" data={gambleOptions} value={formData.gambleIds.map(String)} onChange={(v) => handleInputChange('gambleIds', v.map(Number))} searchable clearable nothingFoundMessage="No gambles" styles={multiSelectStyles} />
                      </Grid.Col>
                      <Grid.Col span={{ base: 12, sm: 6 }}>
                        <TagsInput label="Tags" placeholder="Type and press Enter" data={tagOptions} value={formData.tags} onChange={(v) => handleInputChange('tags', v)} clearable maxTags={5} styles={multiSelectStyles} />
                      </Grid.Col>
                    </Grid>
                  </FormSection>

                  {/* Action bar */}
                  <Group justify="space-between" align="center">
                    <Group gap="sm">
                      <Button
                        type="submit"
                        size="lg"
                        loading={loading}
                        disabled={!isFormValid}
                        leftSection={!loading && <Send size={18} />}
                        style={{
                          backgroundColor: isFormValid ? AMBER : undefined,
                          color: isFormValid ? '#000' : undefined,
                        }}
                      >
                        {loading ? 'Updating…' : 'Save & Resubmit'}
                      </Button>
                      <Button
                        variant="subtle"
                        size="lg"
                        onClick={() => router.back()}
                        style={{ color: 'rgba(255,255,255,0.4)' }}
                      >
                        Discard Changes
                      </Button>
                    </Group>
                    <Text size="xs" c="dimmed">Sent back to moderators for review</Text>
                  </Group>
                </Stack>
              </form>
            </Card>
          </>
        )}
      </EditPageShell>
    </Container>
  )
}
