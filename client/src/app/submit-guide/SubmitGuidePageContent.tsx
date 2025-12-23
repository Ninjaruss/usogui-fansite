'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
  Alert,
  Badge,
  Box,
  Button,
  Card,
  CloseButton,
  Container,
  Grid,
  Group,
  Loader,
  MultiSelect,
  Select,
  Stack,
  Tabs,
  Text,
  TextInput,
  Textarea,
  ThemeIcon,
  Title,
  rem,
  useMantineTheme
} from '@mantine/core'
import { setTabAccentColors } from '../../lib/mantine-theme'
import { FileText, Send, Plus, BookOpen, Eye } from 'lucide-react'
import { useAuth } from '../../providers/AuthProvider'
import { api } from '../../lib/api'
import { motion } from 'motion/react'
import EntityEmbedHelperWithSearch from '../../components/EntityEmbedHelperWithSearch'
import EnhancedSpoilerMarkdown from '../../components/EnhancedSpoilerMarkdown'

const MIN_TITLE_LENGTH = 5
const MIN_DESCRIPTION_LENGTH = 20
const MIN_CONTENT_LENGTH = 100

export default function SubmitGuidePageContent() {
  const theme = useMantineTheme()
  const { user, loading: authLoading } = useAuth()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    tags: [] as string[],
    characterIds: [] as number[],
    arcId: null as number | null,
    gambleIds: [] as number[]
  })
  const [newTag, setNewTag] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [characters, setCharacters] = useState<Array<{ id: number; name: string }>>([])
  const [arcs, setArcs] = useState<Array<{ id: number; name: string }>>([])
  const [gambles, setGambles] = useState<Array<{ id: number; name: string }>>([])
  const [loadingData, setLoadingData] = useState(true)
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write')

  // Set tab accent colors for guide entity (since we're submitting guides)
  useEffect(() => {
    setTabAccentColors('guide')
  }, [])
  const contentRef = useRef<HTMLTextAreaElement | null>(null)

  const guideAccent = theme.other?.usogui?.guide ?? theme.colors.green[6]

  const handleInputChange = (field: string, value: unknown) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }))
  }

  const addTag = () => {
    const candidate = newTag.trim()
    if (candidate && !formData.tags.includes(candidate)) {
      setFormData((prev) => ({ ...prev, tags: [...prev.tags, candidate] }))
      setNewTag('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove)
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
    if (!formData.content.trim()) {
      return 'Content is required'
    }
    if (formData.content.trim().length < MIN_CONTENT_LENGTH) {
      return `Content must be at least ${MIN_CONTENT_LENGTH} characters long`
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
      await api.createGuide({
        title: formData.title.trim(),
        description: formData.description.trim(),
        content: formData.content.trim(),
        tags: formData.tags,
        characterIds: formData.characterIds.length ? formData.characterIds : undefined,
        arcId: formData.arcId ?? undefined,
        gambleIds: formData.gambleIds.length ? formData.gambleIds : undefined
      })
      setSuccess('Guide submitted successfully! It is now pending moderator approval and will be reviewed before being published.')
      setFormData({
        title: '',
        description: '',
        content: '',
        tags: [],
        characterIds: [],
        arcId: null,
        gambleIds: []
      })
      setActiveTab('write')
    } catch (submissionError: unknown) {
      if (submissionError instanceof Error) {
        setError(submissionError.message)
      } else {
        setError('Failed to submit guide. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      addTag()
    }
  }

  const handleInsertEmbed = (embedCode: string) => {
    const textarea = contentRef.current
    if (!textarea) {
      setFormData((prev) => ({ ...prev, content: prev.content + embedCode }))
      return
    }

    const currentValue = formData.content
    const cursorPosition = textarea.selectionStart ?? currentValue.length
    const newValue = `${currentValue.slice(0, cursorPosition)}${embedCode}${currentValue.slice(cursorPosition)}`
    setFormData((prev) => ({ ...prev, content: newValue }))

    requestAnimationFrame(() => {
      textarea.focus()
      const offset = cursorPosition + embedCode.length
      textarea.setSelectionRange(offset, offset)
    })
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
          <Text c="#ffb74d">Please log in to submit a guide.</Text>
        </Alert>
      </Container>
    )
  }

  const isFormValid = !validateForm()

  const characterOptions = characters.map((character) => ({ value: character.id.toString(), label: character.name }))
  const arcOptions = arcs.map((arc) => ({ value: arc.id.toString(), label: arc.name }))
  const gambleOptions = gambles.map((gamble) => ({ value: gamble.id.toString(), label: gamble.name }))

  return (
    <Container size="md" py="xl">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Stack align="center" gap="sm" mb="xl" ta="center">
          <ThemeIcon size={64} radius="xl" variant="light" style={{ backgroundColor: 'rgba(81, 207, 102, 0.15)', color: guideAccent }}>
            <FileText size={32} color={guideAccent} />
          </ThemeIcon>
          <Title order={1}>Write a Guide</Title>
          <Text size="lg" c="dimmed">
            Share your knowledge and insights about Usogui with the community
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
              backgroundColor: 'rgba(81, 207, 102, 0.1)',
              borderColor: 'rgba(81, 207, 102, 0.3)',
              color: '#86efac'
            }}
          >
            <Text size="sm" c="#51cf66">{success}</Text>
          </Alert>
        )}

        <Card
          className="guide-card"
          shadow="lg"
          radius="md"
          withBorder
          style={{
            backgroundColor: theme.colors.dark?.[7] ?? '#070707',
            color: theme.colors.gray?.[0] ?? '#fff',
            borderColor: `${guideAccent}40`,
            boxShadow: `0 4px 12px rgba(81, 207, 102, 0.1)`
          }}
        >
          <form onSubmit={handleSubmit}>
            <Stack gap="xl" p="xl">
              <Stack gap="md">
                <TextInput
                  label="Guide Title"
                  placeholder="e.g., 'Understanding the Rules of Air Poker' or 'Character Analysis: Baku Madarame'"
                  value={formData.title}
                  onChange={(event) => handleInputChange('title', event.currentTarget.value)}
                  required
                  error={
                    formData.title.length > 0 && formData.title.trim().length < MIN_TITLE_LENGTH
                      ? `Title must be at least ${MIN_TITLE_LENGTH} characters long`
                      : undefined
                  }
                  description="Choose a clear, descriptive title for your guide (minimum 5 characters)"
                  styles={{
                    input: {
                      backgroundColor: theme.colors.dark?.[5] ?? '#0b0b0b',
                      color: theme.colors.gray?.[0] ?? '#fff',
                      borderColor: 'rgba(255,255,255,0.06)',
                      '&:focus': {
                        borderColor: guideAccent,
                        boxShadow: `0 0 0 2px rgba(81, 207, 102, 0.2)`
                      }
                    },
                    label: {
                      color: guideAccent,
                      fontWeight: 600
                    }
                  }}
                />

                <Textarea
                  label="Guide Description"
                  placeholder="Provide a brief summary of what your guide covers. This will be shown in guide listings to help readers understand what they'll learn."
                  value={formData.description}
                  onChange={(event) => handleInputChange('description', event.currentTarget.value)}
                  required
                  minRows={3}
                  autosize
                  error={
                    formData.description.length > 0 && formData.description.trim().length < MIN_DESCRIPTION_LENGTH
                      ? `Description must be at least ${MIN_DESCRIPTION_LENGTH} characters long`
                      : undefined
                  }
                  description={`Write a compelling description that summarizes your guide (${formData.description.length}/20+ characters)`}
                  styles={{
                    input: {
                      backgroundColor: theme.colors.dark?.[5] ?? '#0b0b0b',
                      color: theme.colors.gray?.[0] ?? '#fff',
                      borderColor: 'rgba(255,255,255,0.06)',
                      '&:focus': {
                        borderColor: guideAccent,
                        boxShadow: `0 0 0 2px rgba(81, 207, 102, 0.2)`
                      }
                    },
                    label: {
                      color: guideAccent,
                      fontWeight: 600
                    }
                  }}
                />
              </Stack>

              <Stack gap="md">
                <EntityEmbedHelperWithSearch
                  onInsertEmbed={handleInsertEmbed}
                />

                <Box
                  style={{
                    backgroundColor: theme.colors.dark?.[6] ?? '#0a0a0a',
                    color: theme.colors.gray?.[0] ?? '#fff',
                    borderRadius: rem(12),
                    border: `1px solid ${guideAccent}40`,
                    padding: rem(16)
                  }}
                >
                  <Tabs
                    value={activeTab}
                    onChange={(value) => setActiveTab(value as 'write' | 'preview')}
                    styles={{
                      tab: {
                        padding: rem(12),
                        fontSize: rem(14),
                        color: 'rgba(255, 255, 255, 0.7)',
                        borderRadius: rem(6),
                        transition: 'all 150ms ease',
                        '&:hover': {
                          backgroundColor: 'rgba(81, 207, 102, 0.08)',
                          color: 'rgba(255, 255, 255, 0.95)',
                          borderColor: 'rgba(81, 207, 102, 0.4)'
                        },
                        '&[dataActive="true"]': {
                          color: '#ffffff',
                          backgroundColor: 'rgba(81, 207, 102, 0.12)',
                          borderColor: 'rgba(81, 207, 102, 0.8)',
                          fontWeight: 600
                        }
                      },
                    }}
                  >
                    <Tabs.List>
                      <Tabs.Tab value="write" leftSection={<FileText size={16} />}>
                        Write
                      </Tabs.Tab>
                      <Tabs.Tab value="preview" leftSection={<Eye size={16} />}>
                        Preview
                      </Tabs.Tab>
                    </Tabs.List>

                    <Tabs.Panel value="write" p="xl">
                      <Textarea
                        label="Guide Content"
                        placeholder="Write your guide here. Use Markdown for formatting and embed entities using {{entity_type:entity_id}} syntax."
                        value={formData.content}
                        onChange={(event) => handleInputChange('content', event.currentTarget.value)}
                        required
                        minRows={16}
                        autosize
                        error={
                          formData.content.length > 0 && formData.content.trim().length < MIN_CONTENT_LENGTH
                            ? `Content must be at least ${MIN_CONTENT_LENGTH} characters long`
                            : undefined
                        }
                        description={`Write your detailed guide content with entity embeds (${formData.content.length}/100+ characters)`}
                        ref={contentRef}
                        styles={{
                          input: {
                            padding: rem(12),
                            fontSize: rem(14),
                            backgroundColor: theme.colors.dark?.[5] ?? '#0b0b0b',
                            color: theme.colors.gray?.[0] ?? '#fff',
                            borderColor: 'rgba(255,255,255,0.06)'
                          }
                        }}
                      />
                    </Tabs.Panel>

                    <Tabs.Panel value="preview" p="xl">
                      <Stack gap="md">
                        <Title order={4}>Preview</Title>
                        <Box
                          style={{
                            border: `1px solid ${theme.other?.usogui?.guide ? `${theme.other.usogui.guide}40` : 'rgba(255,255,255,0.06)'}`,
                            borderRadius: rem(12),
                            padding: rem(16),
                            minHeight: rem(320),
                            backgroundColor: theme.colors.dark?.[7] ?? 'rgba(10, 10, 10, 0.6)'
                          }}
                        >
                          {formData.content ? (
                            <EnhancedSpoilerMarkdown content={formData.content} compactEntityCards={false} />
                          ) : (
                            <Text c="dimmed" fs="italic">
                              Start writing your guide to see the preview with entity embeds...
                            </Text>
                          )}
                        </Box>
                      </Stack>
                    </Tabs.Panel>
                  </Tabs>
                </Box>
              </Stack>

              <Box
                style={{
                  padding: rem(24),
                  backgroundColor: 'rgba(255,255,255,0.02)',
                  borderRadius: rem(12),
                  border: `1px solid ${guideAccent}33`
                }}
              >
                <Stack gap="md">
                  <Group gap="sm">
                    <BookOpen size={20} color={guideAccent} />
                    <Text fw={600} c={guideAccent}>
                      Related Content (Optional)
                    </Text>
                  </Group>

                  <Grid gutter="lg">
                    <Grid.Col span={{ base: 12, md: 4 }}>
                      <MultiSelect
                        label="Characters"
                        placeholder="Select related characters"
                        data={characterOptions}
                        value={formData.characterIds.map(String)}
                        onChange={(values) => handleInputChange('characterIds', values.map((v) => Number(v)))}
                        searchable
                        clearable
                        nothingFoundMessage="No characters"
                        description="Link to characters featured in your guide"
                        styles={{
                          input: {
                            backgroundColor: theme.colors.dark?.[5] ?? '#0b0b0b',
                            color: theme.colors.gray?.[0] ?? '#fff',
                            borderColor: 'rgba(255,255,255,0.06)',
                            '&:focus': {
                              borderColor: guideAccent,
                              boxShadow: `0 0 0 2px rgba(81, 207, 102, 0.2)`
                            }
                          },
                          dropdown: {
                            backgroundColor: theme.colors.dark?.[7] ?? '#070707',
                            borderColor: guideAccent,
                            border: `1px solid ${guideAccent}`
                          },
                          option: {
                            color: '#ffffff',
                            backgroundColor: 'transparent',
                            '&:hover': {
                              backgroundColor: guideAccent,
                              color: '#000000'
                            },
                            '&[dataSelected="true"]': {
                              backgroundColor: `${guideAccent}dd`,
                              color: '#000000'
                            }
                          },
                          pill: {
                            backgroundColor: 'rgba(81, 207, 102, 0.2)',
                            color: guideAccent,
                            border: `1px solid ${guideAccent}50`
                          },
                          label: {
                            color: guideAccent,
                            fontWeight: 600
                          }
                        }}
                      />
                    </Grid.Col>

                    <Grid.Col span={{ base: 12, md: 4 }}>
                      <Select
                        label="Arc"
                        placeholder="Select related arc"
                        data={arcOptions}
                        value={formData.arcId !== null ? formData.arcId.toString() : null}
                        onChange={(value) => handleInputChange('arcId', value ? Number(value) : null)}
                        searchable
                        clearable
                        nothingFoundMessage="No arcs"
                        description="Link to the story arc your guide covers"
                        styles={{
                          input: {
                            backgroundColor: theme.colors.dark?.[5] ?? '#0b0b0b',
                            color: theme.colors.gray?.[0] ?? '#fff',
                            borderColor: 'rgba(255,255,255,0.06)',
                            '&:focus': {
                              borderColor: guideAccent,
                              boxShadow: `0 0 0 2px rgba(81, 207, 102, 0.2)`
                            }
                          },
                          dropdown: {
                            backgroundColor: theme.colors.dark?.[7] ?? '#070707',
                            borderColor: guideAccent,
                            border: `1px solid ${guideAccent}`
                          },
                          option: {
                            color: '#ffffff',
                            backgroundColor: 'transparent',
                            '&:hover': {
                              backgroundColor: guideAccent,
                              color: '#000000'
                            },
                            '&[dataSelected="true"]': {
                              backgroundColor: `${guideAccent}dd`,
                              color: '#000000'
                            }
                          },
                          label: {
                            color: guideAccent,
                            fontWeight: 600
                          }
                        }}
                      />
                    </Grid.Col>

                    <Grid.Col span={{ base: 12, md: 4 }}>
                      <MultiSelect
                        label="Gambles"
                        placeholder="Select related gambles"
                        data={gambleOptions}
                        value={formData.gambleIds.map(String)}
                        onChange={(values) => handleInputChange('gambleIds', values.map((v) => Number(v)))}
                        searchable
                        clearable
                        nothingFoundMessage="No gambles"
                        description="Link to gambles analyzed in your guide"
                        styles={{
                          input: {
                            backgroundColor: theme.colors.dark?.[5] ?? '#0b0b0b',
                            color: theme.colors.gray?.[0] ?? '#fff',
                            borderColor: 'rgba(255,255,255,0.06)',
                            '&:focus': {
                              borderColor: guideAccent,
                              boxShadow: `0 0 0 2px rgba(81, 207, 102, 0.2)`
                            }
                          },
                          dropdown: {
                            backgroundColor: theme.colors.dark?.[7] ?? '#070707',
                            borderColor: guideAccent,
                            border: `1px solid ${guideAccent}`
                          },
                          option: {
                            color: '#ffffff',
                            backgroundColor: 'transparent',
                            '&:hover': {
                              backgroundColor: guideAccent,
                              color: '#000000'
                            },
                            '&[dataSelected="true"]': {
                              backgroundColor: `${guideAccent}dd`,
                              color: '#000000'
                            }
                          },
                          pill: {
                            backgroundColor: 'rgba(81, 207, 102, 0.2)',
                            color: guideAccent,
                            border: `1px solid ${guideAccent}50`
                          },
                          label: {
                            color: guideAccent,
                            fontWeight: 600
                          }
                        }}
                      />
                    </Grid.Col>
                  </Grid>
                </Stack>
              </Box>

              <Box
                style={{
                  padding: rem(24),
                  backgroundColor: 'rgba(255,255,255,0.02)',
                  borderRadius: rem(12),
                  border: `1px solid ${guideAccent}33`
                }}
              >
                <Stack gap="md">
                  <Group gap="sm">
                    <Plus size={20} color={guideAccent} />
                    <Text fw={600} c={guideAccent}>
                      Tags (Optional)
                    </Text>
                  </Group>

                  <Group gap={8} wrap="wrap">
                    {formData.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        styles={{
                          root: {
                            borderColor: guideAccent,
                            color: guideAccent,
                            backgroundColor: 'rgba(81, 207, 102, 0.1)'
                          }
                        }}
                        rightSection={<CloseButton size="sm" onClick={() => removeTag(tag)} />}
                      >
                        {tag}
                      </Badge>
                    ))}
                    {formData.tags.length === 0 && (
                      <Text size="sm" c="dimmed">
                        No tags added yet.
                      </Text>
                    )}
                  </Group>

                  <Group align="flex-end" gap="sm" wrap="nowrap">
                    <TextInput
                      placeholder="e.g., character-analysis, gambling, theory"
                      value={newTag}
                      onChange={(event) => setNewTag(event.currentTarget.value)}
                      onKeyDown={handleKeyPress}
                      style={{ flex: 1 }}
                      styles={{
                        input: {
                          backgroundColor: theme.colors.dark?.[5] ?? '#0b0b0b',
                          color: theme.colors.gray?.[0] ?? '#fff',
                          borderColor: 'rgba(255,255,255,0.06)',
                          '&:focus': {
                            borderColor: guideAccent,
                            boxShadow: `0 0 0 2px rgba(81, 207, 102, 0.2)`
                          }
                        }
                      }}
                    />
                    <Button
                      variant="outline"
                      styles={{
                        root: {
                          borderColor: guideAccent,
                          color: guideAccent,
                          '&:hover': {
                            backgroundColor: 'rgba(81, 207, 102, 0.1)'
                          }
                        }
                      }}
                      leftSection={<Plus size={16} />}
                      onClick={addTag}
                      disabled={!newTag.trim() || formData.tags.includes(newTag.trim())}
                    >
                      Add
                    </Button>
                  </Group>

                  <Text size="xs" c="dimmed">
                    Add relevant tags to help others find your guide (e.g., characters, gambles, arcs, analysis)
                  </Text>
                </Stack>
              </Box>

              {/* Validation hints when form is incomplete */}
              {!isFormValid && !loading && (
                <Alert
                  variant="light"
                  radius="md"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    padding: '12px 16px'
                  }}
                >
                  <Stack gap={4}>
                    <Text size="sm" fw={500} c="dimmed">Complete the following to submit:</Text>
                    <Stack gap={2}>
                      {!formData.title.trim() && (
                        <Text size="xs" c="dimmed">• Enter a guide title</Text>
                      )}
                      {formData.title.trim() && formData.title.trim().length < MIN_TITLE_LENGTH && (
                        <Text size="xs" c="dimmed">• Title needs {MIN_TITLE_LENGTH - formData.title.trim().length} more character{MIN_TITLE_LENGTH - formData.title.trim().length !== 1 ? 's' : ''}</Text>
                      )}
                      {!formData.description.trim() && (
                        <Text size="xs" c="dimmed">• Enter a description</Text>
                      )}
                      {formData.description.trim() && formData.description.trim().length < MIN_DESCRIPTION_LENGTH && (
                        <Text size="xs" c="dimmed">• Description needs {MIN_DESCRIPTION_LENGTH - formData.description.trim().length} more character{MIN_DESCRIPTION_LENGTH - formData.description.trim().length !== 1 ? 's' : ''}</Text>
                      )}
                      {!formData.content.trim() && (
                        <Text size="xs" c="dimmed">• Write your guide content</Text>
                      )}
                      {formData.content.trim() && formData.content.trim().length < MIN_CONTENT_LENGTH && (
                        <Text size="xs" c="dimmed">• Content needs {MIN_CONTENT_LENGTH - formData.content.trim().length} more character{MIN_CONTENT_LENGTH - formData.content.trim().length !== 1 ? 's' : ''}</Text>
                      )}
                    </Stack>
                  </Stack>
                </Alert>
              )}

              <Button
                type="submit"
                size="lg"
                fullWidth
                loading={loading}
                leftSection={loading ? undefined : <Send size={18} />}
                disabled={!isFormValid}
                styles={{
                  root: {
                    backgroundColor: guideAccent,
                    color: '#ffffff',
                    '&:hover': {
                      backgroundColor: theme.other?.usogui?.guide ? `${theme.other.usogui.guide}dd` : '#45c55a'
                    },
                    '&:disabled': {
                      backgroundColor: 'rgba(81, 207, 102, 0.3)',
                      color: 'rgba(255, 255, 255, 0.5)'
                    }
                  }
                }}
              >
                {loading ? 'Submitting...' : 'Submit Guide'}
              </Button>
            </Stack>
          </form>
        </Card>

        <Alert
          variant="light"
          mt="xl"
          style={{
            backgroundColor: 'rgba(77, 171, 247, 0.08)',
            borderColor: 'rgba(77, 171, 247, 0.25)',
            color: '#93c5fd'
          }}
        >
          <Text size="sm" c="#bfdbfe">
            <strong style={{ color: '#4dabf7' }}>Guide Writing Tips:</strong>
            <br />• Be thorough and informative
            <br />• Use clear headings and structure
            <br />• Use entity embeds to reference characters, arcs, gambles, etc. (e.g., <code style={{ backgroundColor: 'rgba(77, 171, 247, 0.1)', padding: '2px 4px', borderRadius: '4px' }}>{'{{character:1}}'}</code>)
            <br />• Add custom text to embeds for context (e.g., <code style={{ backgroundColor: 'rgba(77, 171, 247, 0.1)', padding: '2px 4px', borderRadius: '4px' }}>{'{{character:1:the protagonist}}'}</code>)
            <br />• Avoid major spoilers unless clearly marked
            <br />• Cite sources when referencing specific chapters
            <br />• Use the Preview tab to see how your entity embeds will look
            <br />• Proofread before submitting
            <br />• Guides will be reviewed before publication
          </Text>
        </Alert>
      </motion.div>
    </Container>
  )
}
