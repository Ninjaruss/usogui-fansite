'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  Container,
  Group,
  Loader,
  NumberInput,
  Select,
  SimpleGrid,
  Stack,
  Tabs,
  Text,
  TextInput,
  Textarea,
  rem,
  useMantineTheme,
} from '@mantine/core'
import { AlertTriangle, Image, Link as LinkIcon, Send, Upload, Video } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/providers/AuthProvider'
import { FormSection } from '@/components/FormSection'
import { EditPageShell } from '@/components/EditPageShell'
import { api } from '@/lib/api'
import SubmissionSuccess from '@/components/SubmissionSuccess'
import { getEntityColor } from '@/lib/entityColors'
import { getInputStyles, getDimmedInputStyles } from '@/lib/submitFormStyles'
import { setTabAccentColors } from '@/lib/mantine-theme'

const AMBER = '#f59e0b'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB

type MediaOwnerType = 'character' | 'arc' | 'event' | 'gamble' | 'organization' | 'user'

interface ExistingMedia {
  id: string
  url: string
  type?: string
  mediaType?: string
  isUploaded?: boolean
  description?: string
  ownerType?: MediaOwnerType | ''
  ownerId?: number | null
  chapterNumber?: number | null
  status: 'pending' | 'approved' | 'rejected'
  rejectionReason?: string | null
  createdAt?: string
  updatedAt?: string
}

interface EditMediaFormState {
  url: string
  description: string
  ownerType: MediaOwnerType | ''
  ownerId: number | null
  chapterNumber: number | null
}

interface EditMediaPageContentProps {
  id: string
}

export default function EditMediaPageContent({ id }: EditMediaPageContentProps) {
  const theme = useMantineTheme()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const accentColor = getEntityColor('media')

  useEffect(() => { setTabAccentColors('media') }, [])

  const inputStyles = getInputStyles(theme, accentColor)
  const dimmedInputStyles = getDimmedInputStyles(theme)

  const [existingMedia, setExistingMedia] = useState<ExistingMedia | null>(null)
  const [formData, setFormData] = useState<EditMediaFormState>({
    url: '',
    description: '',
    ownerType: '',
    ownerId: null,
    chapterNumber: null,
  })
  const [initialData, setInitialData] = useState<EditMediaFormState | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [error, setError] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)

  const [activeTab, setActiveTab] = useState<'url' | 'upload'>('url')
  const [stagedFile, setStagedFile] = useState<File | null>(null)
  const [dropError, setDropError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const previewUrl = useMemo(
    () => (stagedFile ? URL.createObjectURL(stagedFile) : null),
    [stagedFile]
  )

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const isPrivilegedUser = !!user && (user.role === 'moderator' || user.role === 'admin')

  const [characters, setCharacters] = useState<Array<{ id: number; name: string }>>([])
  const [arcs, setArcs] = useState<Array<{ id: number; name: string }>>([])
  const [events, setEvents] = useState<Array<{ id: number; title: string }>>([])
  const [gambles, setGambles] = useState<Array<{ id: number; name: string }>>([])
  const [organizations, setOrganizations] = useState<Array<{ id: number; name: string }>>([])

  const handleInputChange = <K extends keyof EditMediaFormState>(field: K, value: EditMediaFormState[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleFileSelect = (file: File) => {
    setDropError(null)
    if (!(ALLOWED_TYPES as readonly string[]).includes(file.type)) {
      setDropError('Only JPEG, PNG, WebP, and GIF files are allowed.')
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      setDropError('File must be 5 MB or smaller.')
      return
    }
    setStagedFile(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }

  const handleTabChange = (value: string | null) => {
    const tab = (value as 'url' | 'upload') ?? 'url'
    setActiveTab(tab)
    if (tab === 'url') {
      setStagedFile(null)
      setDropError(null)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const isDirty = (field: keyof EditMediaFormState): boolean => {
    if (!initialData) return false
    return JSON.stringify(formData[field]) !== JSON.stringify(initialData[field])
  }

  const isValidUrl = (url: string) => {
    try { new URL(url); return true } catch { return false }
  }

  const validateForm = () => {
    if (activeTab === 'upload' && isPrivilegedUser) {
      if (!stagedFile) return 'Please select a file to upload'
    } else {
      if (!formData.url.trim()) return 'Media URL is required'
      if (!isValidUrl(formData.url)) return 'Please enter a valid URL'
    }
    if (!formData.ownerType) return 'Please select an entity type'
    if (!formData.ownerId) return 'Please select a specific entity'
    return null
  }

  useEffect(() => {
    const load = async () => {
      try {
        const [media, charactersRes, arcsRes, eventsRes, gamblesRes, orgsRes] = await Promise.all([
          api.getMyMediaSubmission(id),
          api.getCharacters({ limit: 500 }),
          api.getArcs({ limit: 200 }),
          api.getEvents({ limit: 200 }),
          api.getGambles({ limit: 500 }),
          api.getOrganizations({ limit: 100 }),
        ])
        setExistingMedia(media)
        const populated: EditMediaFormState = {
          url: media.url || '',
          description: media.description || '',
          ownerType: media.ownerType || '',
          ownerId: media.ownerId || null,
          chapterNumber: media.chapterNumber || null,
        }
        setFormData(populated)
        setInitialData(populated)
        setCharacters(charactersRes.data || [])
        setArcs(arcsRes.data || [])
        setEvents(eventsRes.data || [])
        setGambles(gamblesRes.data || [])
        setOrganizations(orgsRes.data || [])
      } catch {
        setError('Failed to load media. You may not have permission to edit this submission.')
      } finally {
        setLoadingData(false)
      }
    }
    load()
  }, [id])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    const validationError = validateForm()
    if (validationError) { setError(validationError); return }

    setLoading(true)
    try {
      const fd = new FormData()
      if (activeTab === 'upload' && isPrivilegedUser && stagedFile) {
        fd.append('file', stagedFile)
      } else {
        fd.append('url', formData.url.trim())
      }
      fd.append('ownerType', formData.ownerType)
      fd.append('ownerId', String(formData.ownerId!))
      if (formData.chapterNumber) fd.append('chapterNumber', String(formData.chapterNumber))
      if (formData.description.trim()) fd.append('description', formData.description.trim())
      await api.updateOwnMedia(id, fd)
      setShowSuccess(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update media. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const entityOptions = useMemo(() => {
    switch (formData.ownerType) {
      case 'character': return characters.map((i) => ({ value: String(i.id), label: i.name }))
      case 'arc': return arcs.map((i) => ({ value: String(i.id), label: i.name }))
      case 'event': return events.map((i) => ({ value: String(i.id), label: i.title }))
      case 'gamble': return gambles.map((i) => ({ value: String(i.id), label: i.name }))
      case 'organization': return organizations.map((i) => ({ value: String(i.id), label: i.name }))
      default: return []
    }
  }, [formData.ownerType, characters, arcs, events, gambles, organizations])

  // Determine existing media type for preview
  const existingMediaType = existingMedia?.type || existingMedia?.mediaType || 'image'

  // Loading state
  if (authLoading || loadingData) {
    return (
      <Container size="md" py="xl">
        <Stack align="center" gap="md" py="xl">
          <Loader size="sm" color={accentColor} />
          <Text size="sm" c="dimmed">Loading media…</Text>
        </Stack>
      </Container>
    )
  }

  // Auth gate
  if (!user) {
    return (
      <Container size="md" py="xl">
        <Alert icon={<AlertTriangle size={16} />}>
          You need to be logged in to edit this media submission.
        </Alert>
      </Container>
    )
  }

  // Load error
  if (!existingMedia && error) {
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

  if (!existingMedia) return null

  const isFormValid = !validateForm()
  const urlError = formData.url.length > 0 && !isValidUrl(formData.url) ? 'Please enter a valid URL' : null

  return (
    <Container size="md" py="xl">
      <EditPageShell
        type="media"
        accentColor={accentColor}
        submissionTitle={existingMedia.description || `Media Submission`}
        status={existingMedia.status}
        submittedAt={existingMedia.createdAt ?? new Date().toISOString()}
        updatedAt={existingMedia.updatedAt}
        rejectionReason={existingMedia.rejectionReason}
      >
        {showSuccess ? (
          <SubmissionSuccess
            type="media"
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
                  {/* Existing media preview */}
                  {existingMedia.url && (
                    <Box
                      style={{
                        backgroundColor: `${accentColor}08`,
                        border: `1px solid ${accentColor}22`,
                        borderRadius: rem(8),
                        padding: rem(16),
                      }}
                    >
                      <Text size="sm" c="dimmed" mb="xs">Current media</Text>
                      {existingMediaType === 'image' ? (
                        <img
                          src={existingMedia.url}
                          alt="Current media"
                          style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8, display: 'block' }}
                        />
                      ) : (
                        <Text size="sm" style={{ color: accentColor, wordBreak: 'break-all' }}>
                          {existingMedia.url}
                        </Text>
                      )}
                      <Text size="xs" c="dimmed" mt="xs">
                        {activeTab === 'upload' ? 'Upload a file below to replace it.' : 'Update the URL below to replace it.'}
                      </Text>
                    </Box>
                  )}

                  {/* Media URL */}
                  <FormSection
                    title="Media Link"
                    description={activeTab === 'upload' ? 'Upload an image file to replace the current media' : 'Update the URL to a video, audio track, or media post'}
                    icon={activeTab === 'upload' ? <Upload size={18} color={accentColor} /> : <LinkIcon size={18} color={accentColor} />}
                    accentColor={accentColor}
                    required
                    stepNumber={1}
                    hasValue={activeTab === 'upload' ? !!stagedFile : !!formData.url}
                  >
                    {/* Tab toggle — moderators and admins only */}
                    {isPrivilegedUser && (
                      <Tabs
                        value={activeTab}
                        onChange={handleTabChange}
                        mb="md"
                      >
                        <Tabs.List>
                          <Tabs.Tab value="url" leftSection={<LinkIcon size={14} />}>
                            URL
                          </Tabs.Tab>
                          <Tabs.Tab value="upload" leftSection={<Upload size={14} />}>
                            Upload File
                          </Tabs.Tab>
                        </Tabs.List>
                      </Tabs>
                    )}

                    {/* URL mode */}
                    {activeTab === 'url' && (
                      <TextInput
                        label={
                          <span>
                            Media URL
                            {isDirty('url') && (
                              <span style={{ fontSize: rem(10), background: 'rgba(245,158,11,0.1)', color: AMBER, border: '1px solid rgba(245,158,11,0.25)', borderRadius: 3, padding: '1px 5px', marginLeft: 6 }}>
                                edited
                              </span>
                            )}
                          </span>
                        }
                        placeholder="https://…"
                        value={formData.url}
                        onChange={(e) => handleInputChange('url', e.currentTarget.value)}
                        required
                        description={urlError ? undefined : 'YouTube, TikTok, Instagram, DeviantArt, Pixiv, SoundCloud, direct links, etc.'}
                        error={urlError}
                        leftSection={
                          <Box style={{ display: 'flex', alignItems: 'center' }}>
                            <LinkIcon size={16} />
                          </Box>
                        }
                        leftSectionPointerEvents="none"
                        styles={inputStyles}
                      />
                    )}

                    {/* Upload mode — moderators and admins only */}
                    {activeTab === 'upload' && (
                      <Box>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            const file = e.currentTarget.files?.[0]
                            if (file) handleFileSelect(file)
                            e.currentTarget.value = ''
                          }}
                        />

                        {stagedFile ? (
                          /* File preview */
                          <Box
                            style={{
                              border: `1px solid ${accentColor}40`,
                              borderRadius: rem(8),
                              padding: rem(12),
                              backgroundColor: `${accentColor}08`,
                              display: 'flex',
                              alignItems: 'center',
                              gap: rem(12),
                            }}
                          >
                            <img
                              src={previewUrl ?? undefined}
                              alt="Preview"
                              style={{ width: rem(56), height: rem(56), objectFit: 'cover', borderRadius: rem(4), flexShrink: 0 }}
                            />
                            <Box style={{ flex: 1, minWidth: 0 }}>
                              <Text size="sm" fw={500} style={{ wordBreak: 'break-all' }}>
                                {stagedFile.name}
                                <span style={{ fontSize: rem(10), background: 'rgba(245,158,11,0.1)', color: AMBER, border: '1px solid rgba(245,158,11,0.25)', borderRadius: 3, padding: '1px 5px', marginLeft: 6 }}>
                                  edited
                                </span>
                              </Text>
                              <Text size="xs" c="dimmed">{formatFileSize(stagedFile.size)}</Text>
                            </Box>
                            <Button
                              variant="subtle"
                              size="xs"
                              color="red"
                              onClick={() => { setStagedFile(null); setDropError(null) }}
                              style={{ flexShrink: 0 }}
                            >
                              ✕
                            </Button>
                          </Box>
                        ) : (
                          /* Dropzone */
                          <Box
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            style={{
                              border: `2px dashed ${dragActive ? accentColor : `${accentColor}40`}`,
                              borderRadius: rem(8),
                              padding: rem(32),
                              textAlign: 'center',
                              cursor: 'pointer',
                              backgroundColor: dragActive ? `${accentColor}12` : 'transparent',
                              transition: 'all 150ms ease',
                            }}
                          >
                            <Upload size={24} color={accentColor} style={{ marginBottom: rem(8) }} />
                            <Text size="sm" c="dimmed">
                              Drag & drop an image here, or{' '}
                              <span style={{ color: accentColor, textDecoration: 'underline' }}>browse</span>
                            </Text>
                            <Text size="xs" c="dimmed" mt={4}>JPEG, PNG, WebP, GIF — max 5 MB</Text>
                          </Box>
                        )}

                        {dropError && (
                          <Text size="xs" c="red" mt="xs">{dropError}</Text>
                        )}
                      </Box>
                    )}
                  </FormSection>

                  {/* Related Entity */}
                  <FormSection
                    title="Related Entity"
                    description="Link this media to a character, arc, gamble, or other entity"
                    icon={<Image size={18} color={accentColor} />}
                    accentColor={accentColor}
                    required
                    stepNumber={2}
                    hasValue={!!formData.ownerType && !!formData.ownerId}
                  >
                    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                      <Select
                        label={
                          <span>
                            Entity Type
                            {isDirty('ownerType') && (
                              <span style={{ fontSize: rem(10), background: 'rgba(245,158,11,0.1)', color: AMBER, border: '1px solid rgba(245,158,11,0.25)', borderRadius: 3, padding: '1px 5px', marginLeft: 6 }}>
                                edited
                              </span>
                            )}
                          </span>
                        }
                        placeholder="Select entity type…"
                        data={[
                          { value: 'character', label: 'Character' },
                          { value: 'arc', label: 'Arc' },
                          { value: 'event', label: 'Event' },
                          { value: 'gamble', label: 'Gamble' },
                          { value: 'organization', label: 'Organization' },
                        ]}
                        value={formData.ownerType || null}
                        onChange={(value) => {
                          handleInputChange('ownerType', (value ?? '') as MediaOwnerType | '')
                          handleInputChange('ownerId', null)
                        }}
                        searchable
                        clearable
                        withAsterisk
                        nothingFoundMessage="No matches"
                        styles={inputStyles}
                      />
                      <Select
                        label={
                          <span>
                            Specific Entity
                            {isDirty('ownerId') && (
                              <span style={{ fontSize: rem(10), background: 'rgba(245,158,11,0.1)', color: AMBER, border: '1px solid rgba(245,158,11,0.25)', borderRadius: 3, padding: '1px 5px', marginLeft: 6 }}>
                                edited
                              </span>
                            )}
                          </span>
                        }
                        placeholder={!formData.ownerType ? 'Select entity type first' : `Choose ${formData.ownerType}…`}
                        data={entityOptions}
                        value={formData.ownerId ? String(formData.ownerId) : null}
                        onChange={(value) => handleInputChange('ownerId', value ? Number(value) : null)}
                        disabled={!formData.ownerType}
                        searchable
                        withAsterisk
                        nothingFoundMessage="No matches found"
                        styles={inputStyles}
                      />
                    </SimpleGrid>
                  </FormSection>

                  {/* Additional Details */}
                  <FormSection
                    title="Additional Details"
                    description="Optional context and chapter reference"
                    icon={<Video size={18} color={accentColor} />}
                    accentColor={accentColor}
                    stepNumber={3}
                    hasValue={!!formData.chapterNumber || !!formData.description}
                  >
                    <Stack gap="md">
                      <NumberInput
                        label={
                          <span>
                            Chapter Number
                            {isDirty('chapterNumber') && (
                              <span style={{ fontSize: rem(10), background: 'rgba(245,158,11,0.1)', color: AMBER, border: '1px solid rgba(245,158,11,0.25)', borderRadius: 3, padding: '1px 5px', marginLeft: 6 }}>
                                edited
                              </span>
                            )}
                          </span>
                        }
                        placeholder="e.g., 45"
                        value={formData.chapterNumber ?? ''}
                        onChange={(value) => handleInputChange('chapterNumber', typeof value === 'number' ? value : null)}
                        min={1}
                        description="Associate with a specific chapter if relevant"
                        hideControls
                        styles={dimmedInputStyles}
                      />
                      <Textarea
                        label={
                          <span>
                            Description
                            {isDirty('description') && (
                              <span style={{ fontSize: rem(10), background: 'rgba(245,158,11,0.1)', color: AMBER, border: '1px solid rgba(245,158,11,0.25)', borderRadius: 3, padding: '1px 5px', marginLeft: 6 }}>
                                edited
                              </span>
                            )}
                          </span>
                        }
                        placeholder="Describe this media, credit the artist if known, or provide context…"
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.currentTarget.value)}
                        description="Please credit the original artist if known"
                        autosize
                        minRows={3}
                        styles={dimmedInputStyles}
                      />
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
