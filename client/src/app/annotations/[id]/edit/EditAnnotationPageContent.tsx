'use client'

import React, { useState, useEffect } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  Checkbox,
  Container,
  Group,
  Loader,
  NumberInput,
  Stack,
  Text,
  TextInput,
  rem,
  useMantineTheme,
} from '@mantine/core'
import { AlertTriangle, FileText, Info, MessageSquare, Send } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/providers/AuthProvider'
import { FormProgressIndicator, FormStep } from '@/components/FormProgressIndicator'
import { FormSection } from '@/components/FormSection'
import { EditPageShell } from '@/components/EditPageShell'
import { api } from '@/lib/api'
import RichMarkdownEditor from '@/components/RichMarkdownEditor'
import SubmissionSuccess from '@/components/SubmissionSuccess'
import { getEntityColor } from '@/lib/entityColors'
import { getInputStyles, getDimmedInputStyles } from '@/lib/submitFormStyles'
import { setTabAccentColors } from '@/lib/mantine-theme'

const MIN_TITLE_LENGTH = 3
const MIN_CONTENT_LENGTH = 10

const AMBER = '#f59e0b'

interface ExistingAnnotation {
  id: number
  title: string
  content: string
  sourceUrl?: string | null
  chapterReference?: number | null
  isSpoiler: boolean
  spoilerChapter?: number | null
  ownerType: string
  ownerId: number
  status: 'pending' | 'approved' | 'rejected'
  rejectionReason?: string | null
  createdAt?: string
  updatedAt?: string
}

interface EditAnnotationPageContentProps {
  id: number
}

export default function EditAnnotationPageContent({ id }: EditAnnotationPageContentProps) {
  const theme = useMantineTheme()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const accentColor = getEntityColor('annotation')

  useEffect(() => { setTabAccentColors('annotation') }, [])

  const inputStyles = getInputStyles(theme, accentColor)
  const dimmedInputStyles = getDimmedInputStyles(theme)

  const [existingAnnotation, setExistingAnnotation] = useState<ExistingAnnotation | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    sourceUrl: '',
    chapterReference: '' as number | '',
    isSpoiler: false,
    spoilerChapter: '' as number | '',
  })
  const [initialData, setInitialData] = useState<typeof formData | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [error, setError] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)

  const handleInputChange = (field: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const isDirty = (field: keyof typeof formData): boolean => {
    if (!initialData) return false
    return JSON.stringify(formData[field]) !== JSON.stringify(initialData[field])
  }

  const validateForm = () => {
    if (!formData.title.trim()) return 'Title is required'
    if (formData.title.trim().length < MIN_TITLE_LENGTH) return `Title must be at least ${MIN_TITLE_LENGTH} characters long`
    if (!formData.content.trim()) return 'Content is required'
    if (formData.content.trim().length < MIN_CONTENT_LENGTH) return `Content must be at least ${MIN_CONTENT_LENGTH} characters long`
    if (formData.isSpoiler && (!formData.spoilerChapter || Number(formData.spoilerChapter) < 1)) return 'Spoiler chapter is required when marking as spoiler'
    return null
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    const validationError = validateForm()
    if (validationError) { setError(validationError); return }

    setLoading(true)
    try {
      await api.updateAnnotation(id, {
        title: formData.title.trim(),
        content: formData.content.trim(),
        sourceUrl: formData.sourceUrl.trim() || undefined,
        chapterReference: formData.chapterReference || undefined,
        isSpoiler: formData.isSpoiler,
        spoilerChapter: formData.isSpoiler ? formData.spoilerChapter as number : undefined,
      })
      setShowSuccess(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update annotation. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const load = async () => {
      try {
        const annotation = await api.getMyAnnotationSubmission(id)
        setExistingAnnotation(annotation)
        const populated = {
          title: annotation.title || '',
          content: annotation.content || '',
          sourceUrl: annotation.sourceUrl || '',
          chapterReference: (annotation.chapterReference ?? '') as number | '',
          isSpoiler: annotation.isSpoiler ?? false,
          spoilerChapter: (annotation.spoilerChapter ?? '') as number | '',
        }
        setFormData(populated)
        setInitialData(populated)
      } catch {
        setError('Failed to load annotation. You may not have permission to edit this annotation.')
      } finally {
        setLoadingData(false)
      }
    }
    load()
  }, [id])

  if (authLoading || loadingData) {
    return (
      <Container size="md" py="xl">
        <Stack align="center" gap="md" py="xl">
          <Loader size="sm" color={accentColor} />
          <Text size="sm" c="dimmed">Loading annotation…</Text>
        </Stack>
      </Container>
    )
  }

  if (!user) {
    return (
      <Container size="md" py="xl">
        <Alert icon={<AlertTriangle size={16} />}>
          You need to be logged in to edit this annotation.
        </Alert>
      </Container>
    )
  }

  if (!existingAnnotation && error) {
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

  if (!existingAnnotation) return null

  const isFormValid = !validateForm()

  const progressSteps: FormStep[] = [
    { label: 'Title', completed: formData.title.trim().length >= MIN_TITLE_LENGTH, required: true },
    { label: 'Content', completed: formData.content.trim().length >= MIN_CONTENT_LENGTH, required: true },
    { label: 'Spoiler Chapter', completed: !formData.isSpoiler || (formData.spoilerChapter !== '' && Number(formData.spoilerChapter) >= 1), required: formData.isSpoiler },
  ]

  return (
    <Container size="md" py="xl">
      <EditPageShell
        type="annotation"
        accentColor={accentColor}
        submissionTitle={existingAnnotation.title}
        status={existingAnnotation.status}
        submittedAt={existingAnnotation.createdAt ?? new Date().toISOString()}
        updatedAt={existingAnnotation.updatedAt}
        submissionId={existingAnnotation.id}
        rejectionReason={existingAnnotation.rejectionReason}
      >
        {showSuccess ? (
          <SubmissionSuccess
            type="annotation"
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
                  {/* Subject — read-only */}
                  <FormSection
                    title="Subject"
                    description="The entity this annotation is attached to"
                    icon={<MessageSquare size={18} color={accentColor} />}
                    accentColor={accentColor}
                    stepNumber={1}
                    hasValue
                  >
                    <Group gap="md">
                      <Box>
                        <Text size="xs" c="dimmed" mb={4}>Type</Text>
                        <Text fw={500} style={{ textTransform: 'capitalize' }}>{existingAnnotation.ownerType}</Text>
                      </Box>
                      <Box>
                        <Text size="xs" c="dimmed" mb={4}>Entity ID</Text>
                        <Text fw={500}>#{existingAnnotation.ownerId}</Text>
                      </Box>
                    </Group>
                    <Text size="xs" c="dimmed" mt="xs">Subject cannot be changed after creation.</Text>
                  </FormSection>

                  {/* Annotation Content */}
                  <FormSection
                    title="Annotation Content"
                    description="Update your analysis, insights, or commentary"
                    icon={<FileText size={18} color={accentColor} />}
                    accentColor={accentColor}
                    required
                    stepNumber={2}
                    hasValue={!!formData.title || formData.content.length > 0}
                  >
                    <Stack gap="md">
                      <TextInput
                        label={
                          <span>
                            Title
                            {isDirty('title') && (
                              <span style={{ fontSize: rem(10), background: 'rgba(245,158,11,0.1)', color: AMBER, border: '1px solid rgba(245,158,11,0.25)', borderRadius: 3, padding: '1px 5px', marginLeft: 6 }}>
                                edited
                              </span>
                            )}
                          </span>
                        }
                        placeholder="e.g., 'Analysis of Baku&apos;s strategy'"
                        value={formData.title}
                        onChange={(e) => handleInputChange('title', e.currentTarget.value)}
                        required
                        error={formData.title.length > 0 && formData.title.trim().length < MIN_TITLE_LENGTH
                          ? `Title must be at least ${MIN_TITLE_LENGTH} characters long` : undefined}
                        description={`Minimum ${MIN_TITLE_LENGTH} characters`}
                        styles={inputStyles}
                      />
                      <Box>
                        {isDirty('content') && (
                          <Text size="xs" mb={4} style={{ color: AMBER }}>
                            <span style={{ fontSize: rem(10), background: 'rgba(245,158,11,0.1)', color: AMBER, border: '1px solid rgba(245,158,11,0.25)', borderRadius: 3, padding: '1px 5px' }}>
                              edited
                            </span>
                          </Text>
                        )}
                        <RichMarkdownEditor
                          value={formData.content}
                          onChange={(md) => setFormData((prev) => ({ ...prev, content: md }))}
                          placeholder="Update your annotation analysis here..."
                          minHeight={180}
                          label="Annotation content"
                        />
                      </Box>
                    </Stack>
                  </FormSection>

                  {/* Additional Details */}
                  <FormSection
                    title="Additional Details"
                    description="Optional references and sources"
                    icon={<Info size={18} color={accentColor} />}
                    accentColor={accentColor}
                    stepNumber={3}
                    hasValue={!!formData.sourceUrl || formData.chapterReference !== ''}
                  >
                    <Stack gap="md">
                      <TextInput
                        label={
                          <span>
                            Source URL
                            {isDirty('sourceUrl') && (
                              <span style={{ fontSize: rem(10), background: 'rgba(245,158,11,0.1)', color: AMBER, border: '1px solid rgba(245,158,11,0.25)', borderRadius: 3, padding: '1px 5px', marginLeft: 6 }}>
                                edited
                              </span>
                            )}
                          </span>
                        }
                        placeholder="https://example.com/source"
                        value={formData.sourceUrl}
                        onChange={(e) => handleInputChange('sourceUrl', e.currentTarget.value)}
                        description="Link to external source or reference (if applicable)"
                        styles={dimmedInputStyles}
                      />
                      <NumberInput
                        label={
                          <span>
                            Chapter Reference
                            {isDirty('chapterReference') && (
                              <span style={{ fontSize: rem(10), background: 'rgba(245,158,11,0.1)', color: AMBER, border: '1px solid rgba(245,158,11,0.25)', borderRadius: 3, padding: '1px 5px', marginLeft: 6 }}>
                                edited
                              </span>
                            )}
                          </span>
                        }
                        placeholder="Enter chapter number"
                        value={formData.chapterReference}
                        onChange={(value) => handleInputChange('chapterReference', value)}
                        min={1}
                        description="Reference a specific chapter if your annotation relates to a particular point in the story"
                        styles={dimmedInputStyles}
                      />
                    </Stack>
                  </FormSection>

                  {/* Spoiler Settings */}
                  <FormSection
                    title="Spoiler Settings"
                    description="Mark if this annotation contains story spoilers"
                    icon={<AlertTriangle size={18} color={accentColor} />}
                    accentColor={accentColor}
                    stepNumber={4}
                    hasValue={formData.isSpoiler}
                  >
                    <Stack gap="md">
                      <Checkbox
                        label="This annotation contains spoilers"
                        checked={formData.isSpoiler}
                        onChange={(e) => handleInputChange('isSpoiler', e.currentTarget.checked)}
                        styles={{ label: { color: 'rgba(255,255,255,0.75)' } }}
                      />
                      {formData.isSpoiler && (
                        <NumberInput
                          label={
                            <span>
                              Spoiler Chapter
                              {isDirty('spoilerChapter') && (
                                <span style={{ fontSize: rem(10), background: 'rgba(245,158,11,0.1)', color: AMBER, border: '1px solid rgba(245,158,11,0.25)', borderRadius: 3, padding: '1px 5px', marginLeft: 6 }}>
                                  edited
                                </span>
                              )}
                            </span>
                          }
                          placeholder="Enter chapter number"
                          value={formData.spoilerChapter}
                          onChange={(value) => handleInputChange('spoilerChapter', value)}
                          required
                          min={1}
                          description="Readers who have not reached this chapter will see a spoiler warning"
                          styles={inputStyles}
                        />
                      )}
                    </Stack>
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
