'use client'

import React, { useState, useEffect } from 'react'
import styles from './SubmitAnnotationPageContent.module.css'
import {
  Alert,
  Badge,
  Box,
  Button,
  Card,
  Center,
  Checkbox,
  Container,
  Group,
  Loader,
  NumberInput,
  Select,
  Stack,
  Text,
  TextInput,
  Textarea,
  Title,
  rem,
  useMantineTheme
} from '@mantine/core'
import { MessageSquare, Send, FileText, Info, AlertTriangle } from 'lucide-react'
import { useAuth } from '../../providers/AuthProvider'
import { FormProgressIndicator, FormStep } from '../../components/FormProgressIndicator'
import { FormSection } from '../../components/FormSection'
import { api } from '../../lib/api'
import { AnnotationOwnerType } from '../../types'
import SubmissionGuidelines from '../../components/SubmissionGuidelines'
import SubmissionSuccess from '../../components/SubmissionSuccess'
import SubmitPageHeader from '../../components/SubmitPageHeader'
import { getInputStyles, getDimmedInputStyles } from '../../lib/submitFormStyles'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

const MIN_TITLE_LENGTH = 3
const MIN_CONTENT_LENGTH = 10

const OWNER_TYPE_OPTIONS = [
  { value: AnnotationOwnerType.CHARACTER, label: 'Character' },
  { value: AnnotationOwnerType.GAMBLE, label: 'Gamble' },
  { value: AnnotationOwnerType.ARC, label: 'Arc' }
]

export default function SubmitAnnotationPageContent() {
  const theme = useMantineTheme()
  const { user, loading: authLoading } = useAuth()
  const searchParams = useSearchParams()

  const editAnnotationId = searchParams.get('edit')
    ? Number(searchParams.get('edit'))
    : null
  const [editingAnnotation, setEditingAnnotation] = useState<any>(null)
  const [loadingEdit, setLoadingEdit] = useState(false)

  const [formData, setFormData] = useState({
    ownerType: editAnnotationId ? ('' as AnnotationOwnerType | '') : (searchParams.get('type') as AnnotationOwnerType | '' || ''),
    ownerId: editAnnotationId ? null as number | null : (searchParams.get('id') ? parseInt(searchParams.get('id')!) : null as number | null),
    title: '',
    content: '',
    sourceUrl: '',
    chapterReference: '' as number | '',
    isSpoiler: false,
    spoilerChapter: '' as number | ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)
  const [characters, setCharacters] = useState<Array<{ id: number; name: string }>>([])
  const [gambles, setGambles] = useState<Array<{ id: number; name: string }>>([])
  const [chapters, setChapters] = useState<Array<{ id: number; number: number }>>([])
  const [arcs, setArcs] = useState<Array<{ id: number; name: string }>>([])
  const [loadingData, setLoadingData] = useState(true)

  const accentColor = theme.colors.violet[5]
  const inputStyles = getInputStyles(theme, accentColor)
  const dimmedInputStyles = getDimmedInputStyles(theme)

  const handleInputChange = (field: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const validateForm = () => {
    if (!editAnnotationId && !formData.ownerType) return 'Owner type is required'
    if (!editAnnotationId && !formData.ownerId) return 'Please select an entity to annotate'
    if (!formData.title.trim()) return 'Title is required'
    if (formData.title.trim().length < MIN_TITLE_LENGTH) return `Title must be at least ${MIN_TITLE_LENGTH} characters long`
    if (!formData.content.trim()) return 'Content is required'
    if (formData.content.trim().length < MIN_CONTENT_LENGTH) return `Content must be at least ${MIN_CONTENT_LENGTH} characters long`
    if (formData.isSpoiler && (!formData.spoilerChapter || formData.spoilerChapter < 1)) return 'Spoiler chapter is required when marking as spoiler'
    return null
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')

    const validationError = validateForm()
    if (validationError) { setError(validationError); return }

    setLoading(true)
    try {
      if (editAnnotationId) {
        await api.updateAnnotation(editAnnotationId, {
          title: formData.title.trim(),
          content: formData.content.trim(),
          sourceUrl: formData.sourceUrl.trim() || undefined,
          chapterReference: formData.chapterReference || undefined,
          isSpoiler: formData.isSpoiler,
          spoilerChapter: formData.isSpoiler ? formData.spoilerChapter as number : undefined
        })
      } else {
        await api.createAnnotation({
          ownerType: formData.ownerType as AnnotationOwnerType,
          ownerId: formData.ownerId as number,
          title: formData.title.trim(),
          content: formData.content.trim(),
          sourceUrl: formData.sourceUrl.trim() || undefined,
          chapterReference: formData.chapterReference || undefined,
          isSpoiler: formData.isSpoiler,
          spoilerChapter: formData.isSpoiler ? formData.spoilerChapter as number : undefined
        })
      }
      setShowSuccess(true)
    } catch (submissionError: unknown) {
      setError(submissionError instanceof Error ? submissionError.message : 'Failed to submit annotation. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitAnother = () => {
    setShowSuccess(false)
    setFormData({
      ownerType: '',
      ownerId: null,
      title: '',
      content: '',
      sourceUrl: '',
      chapterReference: '',
      isSpoiler: false,
      spoilerChapter: ''
    })
  }

  useEffect(() => {
    const loadData = async () => {
      try {
        const [charactersRes, gamblesRes, chaptersRes, arcsRes] = await Promise.all([
          api.getCharacters({ limit: 500 }),
          api.getGambles({ limit: 500 }),
          api.getChapters({ limit: 1000 }),
          api.getArcs({ limit: 200 })
        ])
        setCharacters(charactersRes.data || [])
        setGambles(gamblesRes.data || [])
        setChapters(chaptersRes.data || [])
        setArcs(arcsRes.data || [])
      } catch (loadError) {
        console.error('Error loading data:', loadError)
        setError('Failed to load form data. Please refresh the page.')
      } finally {
        setLoadingData(false)
      }
    }
    loadData()
  }, [])

  useEffect(() => {
    if (!editAnnotationId) return
    setLoadingEdit(true)
    api.getMyAnnotationSubmission(editAnnotationId)
      .then((annotation) => {
        setEditingAnnotation(annotation)
        setFormData((prev) => ({
          ...prev,
          ownerType: annotation.ownerType ?? '',
          ownerId: annotation.ownerId ?? null,
          title: annotation.title ?? '',
          content: annotation.content ?? '',
          sourceUrl: annotation.sourceUrl ?? '',
          chapterReference: annotation.chapterReference ?? '',
          isSpoiler: annotation.isSpoiler ?? false,
          spoilerChapter: annotation.spoilerChapter ?? ''
        }))
      })
      .catch(() => {
        // If the fetch fails (not found / not owner), stay in create mode
      })
      .finally(() => setLoadingEdit(false))
  }, [editAnnotationId])

  if (authLoading || loadingData) {
    return (
      <Container size="md" py="xl">
        <Stack align="center" gap="md" py="xl">
          <Box style={{ color: accentColor }}><MessageSquare size={32} /></Box>
          <Loader size="sm" color={accentColor} />
          <Text size="sm" c="dimmed">Loading…</Text>
        </Stack>
      </Container>
    )
  }

  if (editAnnotationId && loadingEdit) {
    return (
      <Center p="xl">
        <Loader color={accentColor} />
      </Center>
    )
  }

  if (!user) {
    return (
      <Container size="md" py="xl">
        <Box
          style={{
            backgroundColor: `${accentColor}0d`,
            border: `1px solid ${accentColor}35`,
            borderRadius: rem(12),
            padding: rem(32),
            textAlign: 'center'
          }}
        >
          <Box mb="md" style={{ color: accentColor }}><MessageSquare size={36} /></Box>
          <Title order={4} style={{ fontFamily: 'var(--font-opti-goudy-text)', fontWeight: 400 }} mb="xs">
            Sign in to submit an annotation
          </Title>
          <Text size="sm" c="dimmed" mb="lg">
            You need to be logged in to share your insights.
          </Text>
          <Button component={Link} href="/login" style={{ backgroundColor: accentColor, color: '#fff' }}>
            Log In
          </Button>
        </Box>
      </Container>
    )
  }

  const isFormValid = !validateForm()

  const progressSteps: FormStep[] = [
    { label: 'Annotation Type', completed: !!formData.ownerType, required: true },
    { label: 'Entity Selection', completed: !!formData.ownerId, required: true },
    { label: 'Title', completed: formData.title.trim().length >= MIN_TITLE_LENGTH, required: true },
    { label: 'Content', completed: formData.content.trim().length >= MIN_CONTENT_LENGTH, required: true },
    { label: 'Spoiler Chapter', completed: !formData.isSpoiler || (formData.spoilerChapter !== '' && Number(formData.spoilerChapter) >= 1), required: formData.isSpoiler }
  ]

  const getOwnerOptions = () => {
    switch (formData.ownerType) {
      case AnnotationOwnerType.CHARACTER:
        return characters.map((c) => ({ value: c.id.toString(), label: c.name }))
      case AnnotationOwnerType.GAMBLE:
        return gambles.map((g) => ({ value: g.id.toString(), label: g.name }))
      case AnnotationOwnerType.ARC:
        return arcs.map((a) => ({ value: a.id.toString(), label: a.name }))
      default:
        return []
    }
  }

  const ownerOptions = getOwnerOptions()

  return (
    <Container size="md" py="xl">
      <Group align="center" mb="xs">
        <SubmitPageHeader
          label="Annotation Submission"
          title={editAnnotationId ? 'Edit Annotation' : 'Submit an Annotation'}
          description="Share your insights, analysis, and commentary on characters, gambles, and story arcs"
          icon={<MessageSquare size={22} />}
          accentColor={accentColor}
        />
        {editAnnotationId && (
          <Badge color="blue" variant="light">Editing</Badge>
        )}
      </Group>

      {editingAnnotation?.status === 'rejected' && editingAnnotation?.rejectionReason && (
        <Alert color="red" title="Submission Rejected" mb="md">
          {editingAnnotation.rejectionReason}
          <Text size="sm" mt={4}>Edit and resubmit your annotation below.</Text>
        </Alert>
      )}

      <SubmissionGuidelines type="annotation" accentColor={accentColor} />

      {showSuccess && (
        <SubmissionSuccess
          type="annotation"
          accentColor={accentColor}
          onSubmitAnother={handleSubmitAnother}
        />
      )}

      {error && (
        <Alert
          variant="light"
          mb="md"
          icon={<AlertTriangle size={16} />}
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.08)',
            borderColor: 'rgba(239, 68, 68, 0.3)',
            color: '#fca5a5'
          }}
        >
          <Text size="sm" c="#f87171">{error}</Text>
        </Alert>
      )}

      {!showSuccess && (
        <>
          <FormProgressIndicator steps={progressSteps} accentColor={accentColor} />

          <Card
            shadow="lg"
            radius="md"
            withBorder
            style={{
              backgroundColor: theme.colors.dark?.[7] ?? '#070707',
              borderColor: `${accentColor}35`,
              boxShadow: `0 4px 24px ${accentColor}12`
            }}
          >
            <Box
              style={{
                height: rem(3),
                background: `linear-gradient(90deg, ${accentColor}70, transparent)`,
                borderRadius: `${rem(6)} ${rem(6)} 0 0`,
                marginBottom: rem(-3)
              }}
            />
            <form onSubmit={handleSubmit}>
              <Stack gap="xl" p="xl">
                <FormSection
                  title="Entity Selection"
                  description="Choose what you want to annotate"
                  icon={<MessageSquare size={18} color={accentColor} />}
                  accentColor={accentColor}
                  required
                  stepNumber={1}
                >
                  <Stack gap="md">
                    <Select
                      label="Annotation Type"
                      placeholder="Select what you want to annotate"
                      value={formData.ownerType}
                      onChange={(value) => {
                        handleInputChange('ownerType', value || '')
                        handleInputChange('ownerId', null)
                      }}
                      data={OWNER_TYPE_OPTIONS}
                      required
                      clearable
                      styles={inputStyles}
                      classNames={{ option: styles.selectOption }}
                    />
                    {formData.ownerType && (
                      <Select
                        label={`Select ${formData.ownerType.charAt(0).toUpperCase() + formData.ownerType.slice(1)}`}
                        placeholder={`Choose a ${formData.ownerType}`}
                        value={formData.ownerId?.toString() || null}
                        onChange={(value) => handleInputChange('ownerId', value ? parseInt(value) : null)}
                        data={ownerOptions}
                        required
                        clearable
                        searchable
                        styles={inputStyles}
                        classNames={{ option: styles.selectOption }}
                      />
                    )}
                  </Stack>
                </FormSection>

                <FormSection
                  title="Annotation Content"
                  description="Write your analysis, insights, or commentary"
                  icon={<FileText size={18} color={accentColor} />}
                  accentColor={accentColor}
                  required
                  stepNumber={2}
                >
                  <Stack gap="md">
                    <TextInput
                      label="Title"
                      placeholder="e.g., 'Analysis of Baku's strategy'"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.currentTarget.value)}
                      required
                      error={formData.title.length > 0 && formData.title.trim().length < MIN_TITLE_LENGTH
                        ? `Title must be at least ${MIN_TITLE_LENGTH} characters long` : undefined}
                      description={`Minimum ${MIN_TITLE_LENGTH} characters`}
                      styles={inputStyles}
                    />
                    <Textarea
                      label="Content"
                      placeholder="Share your insights, analysis, theories, or commentary. You can use markdown formatting."
                      value={formData.content}
                      onChange={(e) => handleInputChange('content', e.currentTarget.value)}
                      required
                      minRows={6}
                      autosize
                      error={formData.content.length > 0 && formData.content.trim().length < MIN_CONTENT_LENGTH
                        ? `Content must be at least ${MIN_CONTENT_LENGTH} characters long` : undefined}
                      description={`${formData.content.length}/${MIN_CONTENT_LENGTH}+ characters`}
                      styles={inputStyles}
                    />
                  </Stack>
                </FormSection>

                <FormSection
                  title="Additional Details"
                  description="Optional references and sources"
                  icon={<Info size={18} color={accentColor} />}
                  accentColor={accentColor}
                  stepNumber={3}
                >
                  <Stack gap="md">
                    <TextInput
                      label="Source URL"
                      placeholder="https://example.com/source"
                      value={formData.sourceUrl}
                      onChange={(e) => handleInputChange('sourceUrl', e.currentTarget.value)}
                      description="Link to external source or reference (if applicable)"
                      styles={dimmedInputStyles}
                    />
                    <NumberInput
                      label="Chapter Reference"
                      placeholder="Enter chapter number"
                      value={formData.chapterReference}
                      onChange={(value) => handleInputChange('chapterReference', value)}
                      min={1}
                      description="Reference a specific chapter if your annotation relates to a particular point in the story"
                      styles={dimmedInputStyles}
                    />
                  </Stack>
                </FormSection>

                <FormSection
                  title="Spoiler Settings"
                  description="Mark if this annotation contains story spoilers"
                  icon={<AlertTriangle size={18} color={accentColor} />}
                  accentColor={accentColor}
                  stepNumber={4}
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
                        label="Spoiler Chapter"
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

                <Group justify="space-between" align="center">
                  <Button
                    type="submit"
                    size="lg"
                    loading={loading}
                    disabled={!isFormValid}
                    leftSection={<Send size={18} />}
                    style={{
                      backgroundColor: isFormValid ? accentColor : undefined,
                      color: isFormValid ? '#fff' : undefined
                    }}
                  >
                    {editAnnotationId ? 'Update Annotation' : 'Submit Annotation for Review'}
                  </Button>
                  <Text size="xs" c="dimmed">
                    Reviewed by a moderator before publishing
                  </Text>
                </Group>
              </Stack>
            </form>
          </Card>
        </>
      )}
    </Container>
  )
}
