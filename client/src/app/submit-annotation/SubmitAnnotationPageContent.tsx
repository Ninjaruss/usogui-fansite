'use client'

import React, { useState, useEffect } from 'react'
import styles from './SubmitAnnotationPageContent.module.css'
import {
  Alert,
  Box,
  Button,
  Card,
  Checkbox,
  Container,
  Loader,
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
import { MessageSquare, Send, FileText, Info, AlertTriangle } from 'lucide-react'
import { useAuth } from '../../providers/AuthProvider'
import { FormProgressIndicator, FormStep } from '../../components/FormProgressIndicator'
import { FormSection } from '../../components/FormSection'
import { api } from '../../lib/api'
import { AnnotationOwnerType } from '../../types'
import { motion } from 'motion/react'
import { useSearchParams } from 'next/navigation'

const MIN_TITLE_LENGTH = 3
const MIN_CONTENT_LENGTH = 10

const OWNER_TYPE_OPTIONS = [
  { value: AnnotationOwnerType.CHARACTER, label: 'Character' },
  { value: AnnotationOwnerType.GAMBLE, label: 'Gamble' },
  { value: AnnotationOwnerType.CHAPTER, label: 'Chapter' },
  { value: AnnotationOwnerType.ARC, label: 'Arc' }
]

export default function SubmitAnnotationPageContent() {
  const theme = useMantineTheme()
  const { user, loading: authLoading } = useAuth()
  const searchParams = useSearchParams()

  const [formData, setFormData] = useState({
    ownerType: searchParams.get('type') as AnnotationOwnerType | '' || '',
    ownerId: searchParams.get('id') ? parseInt(searchParams.get('id')!) : null as number | null,
    title: '',
    content: '',
    sourceUrl: '',
    chapterReference: '' as number | '',
    isSpoiler: false,
    spoilerChapter: '' as number | ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [characters, setCharacters] = useState<Array<{ id: number; name: string }>>([])
  const [gambles, setGambles] = useState<Array<{ id: number; name: string }>>([])
  const [chapters, setChapters] = useState<Array<{ id: number; number: number }>>([])
  const [arcs, setArcs] = useState<Array<{ id: number; name: string }>>([])
  const [loadingData, setLoadingData] = useState(true)

  const annotationAccent = theme.colors.violet[5]

  const handleInputChange = (field: string, value: unknown) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }))
  }

  const validateForm = () => {
    if (!formData.ownerType) {
      return 'Owner type is required'
    }
    if (!formData.ownerId) {
      return 'Please select an entity to annotate'
    }
    if (!formData.title.trim()) {
      return 'Title is required'
    }
    if (formData.title.trim().length < MIN_TITLE_LENGTH) {
      return `Title must be at least ${MIN_TITLE_LENGTH} characters long`
    }
    if (!formData.content.trim()) {
      return 'Content is required'
    }
    if (formData.content.trim().length < MIN_CONTENT_LENGTH) {
      return `Content must be at least ${MIN_CONTENT_LENGTH} characters long`
    }
    if (formData.isSpoiler && (!formData.spoilerChapter || formData.spoilerChapter < 1)) {
      return 'Spoiler chapter is required when marking as spoiler'
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
      setSuccess('Annotation submitted successfully! It is now pending moderator approval and will be reviewed before being published.')
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
    } catch (submissionError: unknown) {
      if (submissionError instanceof Error) {
        setError(submissionError.message)
      } else {
        setError('Failed to submit annotation. Please try again.')
      }
    } finally {
      setLoading(false)
    }
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
            backgroundColor: 'rgba(139, 92, 246, 0.1)',
            borderColor: 'rgba(139, 92, 246, 0.3)',
            color: '#c4b5fd'
          }}
        >
          <Text c="#c4b5fd">Please log in to submit an annotation.</Text>
        </Alert>
      </Container>
    )
  }

  const isFormValid = !validateForm()

  // Calculate progress steps for the indicator
  const progressSteps: FormStep[] = [
    { label: 'Annotation Type', completed: !!formData.ownerType, required: true },
    { label: 'Entity Selection', completed: !!formData.ownerId, required: true },
    { label: 'Title', completed: formData.title.trim().length >= MIN_TITLE_LENGTH, required: true },
    { label: 'Content', completed: formData.content.trim().length >= MIN_CONTENT_LENGTH, required: true },
    { label: 'Spoiler Chapter', completed: !formData.isSpoiler || (formData.spoilerChapter !== '' && Number(formData.spoilerChapter) >= 1), required: formData.isSpoiler }
  ]

  // Generate options based on owner type
  const getOwnerOptions = () => {
    switch (formData.ownerType) {
      case AnnotationOwnerType.CHARACTER:
        return characters.map((character) => ({ value: character.id.toString(), label: character.name }))
      case AnnotationOwnerType.GAMBLE:
        return gambles.map((gamble) => ({ value: gamble.id.toString(), label: gamble.name }))
      case AnnotationOwnerType.CHAPTER:
        return chapters.map((chapter) => ({ value: chapter.id.toString(), label: `Chapter ${chapter.number}` }))
      case AnnotationOwnerType.ARC:
        return arcs.map((arc) => ({ value: arc.id.toString(), label: arc.name }))
      default:
        return []
    }
  }

  const ownerOptions = getOwnerOptions()

  return (
    <Container size="md" py="xl">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Stack align="center" gap="sm" mb="xl" ta="center">
          <ThemeIcon size={64} radius="xl" variant="light" style={{ backgroundColor: 'rgba(139, 92, 246, 0.15)', color: annotationAccent }}>
            <MessageSquare size={32} color={annotationAccent} />
          </ThemeIcon>
          <Title order={1}>Submit an Annotation</Title>
          <Text size="lg" c="dimmed">
            Share your insights, analysis, and commentary on characters, gambles, chapters, and story arcs
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
              backgroundColor: 'rgba(139, 92, 246, 0.1)',
              borderColor: 'rgba(139, 92, 246, 0.3)',
              color: '#c4b5fd'
            }}
          >
            <Text size="sm" c={annotationAccent}>{success}</Text>
          </Alert>
        )}

        <FormProgressIndicator steps={progressSteps} accentColor={annotationAccent} />

        <Card
          className="annotation-card"
          shadow="lg"
          radius="md"
          withBorder
          style={{
            backgroundColor: theme.colors.dark?.[7] ?? '#070707',
            color: theme.colors.gray?.[0] ?? '#fff',
            borderColor: `${annotationAccent}40`,
            boxShadow: `0 4px 12px rgba(139, 92, 246, 0.1)`
          }}
        >
          <form onSubmit={handleSubmit}>
            <Stack gap="xl" p="xl">
              {/* Entity Selection Section */}
              <FormSection
                title="Entity Selection"
                description="Choose what you want to annotate"
                icon={<MessageSquare size={20} color={annotationAccent} />}
                accentColor={annotationAccent}
                required
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
                    styles={{
                      input: {
                        backgroundColor: theme.colors.dark?.[5] ?? '#0b0b0b',
                        color: theme.colors.gray?.[0] ?? '#fff',
                        borderColor: 'rgba(255,255,255,0.06)',
                        '&:focus': {
                          borderColor: annotationAccent,
                          boxShadow: `0 0 0 2px rgba(139, 92, 246, 0.2)`
                        }
                      },
                      label: {
                        color: annotationAccent,
                        fontWeight: 600
                      },
                      dropdown: {
                        backgroundColor: theme.colors.dark?.[7] ?? '#1a1a1a',
                        borderColor: 'rgba(255,255,255,0.1)'
                      }
                    }}
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
                      styles={{
                        input: {
                          backgroundColor: theme.colors.dark?.[5] ?? '#0b0b0b',
                          color: theme.colors.gray?.[0] ?? '#fff',
                          borderColor: 'rgba(255,255,255,0.06)',
                          '&:focus': {
                            borderColor: annotationAccent,
                            boxShadow: `0 0 0 2px rgba(139, 92, 246, 0.2)`
                          }
                        },
                        label: {
                          color: annotationAccent,
                          fontWeight: 600
                        },
                        dropdown: {
                          backgroundColor: theme.colors.dark?.[7] ?? '#1a1a1a',
                          borderColor: 'rgba(255,255,255,0.1)'
                        }
                      }}
                      classNames={{ option: styles.selectOption }}
                    />
                  )}
                </Stack>
              </FormSection>

              {/* Content Section */}
              <FormSection
                title="Annotation Content"
                description="Write your analysis, insights, or commentary"
                icon={<FileText size={20} color={annotationAccent} />}
                accentColor={annotationAccent}
                required
              >
                <Stack gap="md">
                  <TextInput
                    label="Title"
                    placeholder="e.g., 'Analysis of Baku's strategy' or 'Character development in this arc'"
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
                          borderColor: annotationAccent,
                          boxShadow: `0 0 0 2px rgba(139, 92, 246, 0.2)`
                        }
                      },
                      label: {
                        color: annotationAccent,
                        fontWeight: 600
                      }
                    }}
                  />

                  <Textarea
                    label="Content"
                    placeholder="Share your insights, analysis, theories, or commentary. You can use markdown formatting."
                    value={formData.content}
                    onChange={(event) => handleInputChange('content', event.currentTarget.value)}
                    required
                    minRows={6}
                    autosize
                    error={
                      formData.content.length > 0 && formData.content.trim().length < MIN_CONTENT_LENGTH
                        ? `Content must be at least ${MIN_CONTENT_LENGTH} characters long`
                        : undefined
                    }
                    description={`${formData.content.length}/${MIN_CONTENT_LENGTH}+ characters`}
                    styles={{
                      input: {
                        backgroundColor: theme.colors.dark?.[5] ?? '#0b0b0b',
                        color: theme.colors.gray?.[0] ?? '#fff',
                        borderColor: 'rgba(255,255,255,0.06)',
                        '&:focus': {
                          borderColor: annotationAccent,
                          boxShadow: `0 0 0 2px rgba(139, 92, 246, 0.2)`
                        }
                      },
                      label: {
                        color: annotationAccent,
                        fontWeight: 600
                      }
                    }}
                  />
                </Stack>
              </FormSection>

              {/* Additional Details Section */}
              <FormSection
                title="Additional Details"
                description="Optional references and sources"
                icon={<Info size={20} color={annotationAccent} />}
                accentColor={annotationAccent}
              >
                <Stack gap="md">
                  <TextInput
                    label="Source URL"
                    placeholder="https://example.com/source"
                    value={formData.sourceUrl}
                    onChange={(event) => handleInputChange('sourceUrl', event.currentTarget.value)}
                    description="Link to external source or reference (if applicable)"
                    styles={{
                      input: {
                        backgroundColor: theme.colors.dark?.[5] ?? '#0b0b0b',
                        color: theme.colors.gray?.[0] ?? '#fff',
                        borderColor: 'rgba(255,255,255,0.06)',
                        '&:focus': {
                          borderColor: annotationAccent,
                          boxShadow: `0 0 0 2px rgba(139, 92, 246, 0.2)`
                        }
                      },
                      label: {
                        color: 'rgba(255,255,255,0.7)',
                        fontWeight: 500
                      }
                    }}
                  />

                  <NumberInput
                    label="Chapter Reference"
                    placeholder="Enter chapter number"
                    value={formData.chapterReference}
                    onChange={(value) => handleInputChange('chapterReference', value)}
                    min={1}
                    description="Reference a specific chapter if your annotation relates to a particular point in the story"
                    styles={{
                      input: {
                        backgroundColor: theme.colors.dark?.[5] ?? '#0b0b0b',
                        color: theme.colors.gray?.[0] ?? '#fff',
                        borderColor: 'rgba(255,255,255,0.06)',
                        '&:focus': {
                          borderColor: annotationAccent,
                          boxShadow: `0 0 0 2px rgba(139, 92, 246, 0.2)`
                        }
                      },
                      label: {
                        color: 'rgba(255,255,255,0.7)',
                        fontWeight: 500
                      }
                    }}
                  />
                </Stack>
              </FormSection>

              {/* Spoiler Settings Section */}
              <FormSection
                title="Spoiler Settings"
                description="Mark if this annotation contains story spoilers"
                icon={<AlertTriangle size={20} color={annotationAccent} />}
                accentColor={annotationAccent}
              >
                <Stack gap="md">
                  <Checkbox
                    label="This annotation contains spoilers"
                    checked={formData.isSpoiler}
                    onChange={(event) => handleInputChange('isSpoiler', event.currentTarget.checked)}
                    styles={{
                      label: {
                        color: theme.colors.gray?.[3] ?? '#ddd'
                      }
                    }}
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
                      styles={{
                        input: {
                          backgroundColor: theme.colors.dark?.[5] ?? '#0b0b0b',
                          color: theme.colors.gray?.[0] ?? '#fff',
                          borderColor: 'rgba(255,255,255,0.06)',
                          '&:focus': {
                            borderColor: annotationAccent,
                            boxShadow: `0 0 0 2px rgba(139, 92, 246, 0.2)`
                          }
                        },
                        label: {
                          color: annotationAccent,
                          fontWeight: 600
                        }
                      }}
                    />
                  )}
                </Stack>
              </FormSection>

              <Button
                type="submit"
                size="lg"
                loading={loading}
                disabled={!isFormValid}
                leftSection={<Send size={20} />}
                style={{
                  backgroundColor: isFormValid ? annotationAccent : undefined,
                  color: isFormValid ? '#fff' : undefined
                }}
              >
                Submit Annotation for Review
              </Button>

              <Text size="sm" c="dimmed" ta="center">
                Your annotation will be reviewed by a moderator before being published.
              </Text>
            </Stack>
          </form>
        </Card>
      </motion.div>
    </Container>
  )
}
