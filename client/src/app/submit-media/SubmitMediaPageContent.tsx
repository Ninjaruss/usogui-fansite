'use client'

import React, { useEffect, useMemo, useState } from 'react'
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
  Title,
  rem,
  useMantineTheme
} from '@mantine/core'
import { setTabAccentColors } from '../../lib/mantine-theme'
import { Upload, Link as LinkIcon, Image, Video, Music, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '../../providers/AuthProvider'
import { FormProgressIndicator, FormStep } from '../../components/FormProgressIndicator'
import { FormSection } from '../../components/FormSection'
import { api } from '../../lib/api'
import { motion } from 'motion/react'
import MediaUploadForm from '../../components/MediaUploadForm'
import SubmissionGuidelines from '../../components/SubmissionGuidelines'
import SubmissionSuccess from '../../components/SubmissionSuccess'
import SubmitPageHeader from '../../components/SubmitPageHeader'
import { getInputStyles, getDimmedInputStyles } from '../../lib/submitFormStyles'

type MediaOwnerType = 'character' | 'arc' | 'event' | 'gamble' | 'organization' | 'user'
type MediaType = 'image' | 'video' | 'audio'

interface Character { id: number; name: string }
interface Arc { id: number; name: string }
interface Event { id: number; title: string }
interface Gamble { id: number; name: string }
interface Organization { id: number; name: string }

interface SubmitMediaFormState {
  url: string
  description: string
  ownerType: MediaOwnerType | ''
  ownerId: number | null
  chapterNumber: number | null
}

export default function SubmitMediaPageContent() {
  const { user, loading: authLoading } = useAuth()
  const theme = useMantineTheme()

  const [formData, setFormData] = useState<SubmitMediaFormState>({
    url: '',
    description: '',
    ownerType: '',
    ownerId: null,
    chapterNumber: null
  })
  const [characters, setCharacters] = useState<Character[]>([])
  const [arcs, setArcs] = useState<Arc[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [gambles, setGambles] = useState<Gamble[]>([])
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [users, setUsers] = useState<Array<{ id: number; username: string }>>([])
  const [loading, setLoading] = useState(false)
  const [dataLoading, setDataLoading] = useState(true)
  const [error, setError] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)
  const [activeTab, setActiveTab] = useState<'url' | 'upload'>('url')

  useEffect(() => { setTabAccentColors('media') }, [])

  const accentColor = '#a855f7'
  const inputStyles = getInputStyles(theme, accentColor)
  const dimmedInputStyles = getDimmedInputStyles(theme)

  useEffect(() => {
    if (!user) return
    const fetchData = async () => {
      try {
        setDataLoading(true)
        const [cRes, aRes, eRes, gRes, oRes, uRes] = await Promise.all([
          api.getCharacters({ limit: 500 }),
          api.getArcs({ limit: 200 }),
          api.getEvents({ limit: 200 }),
          api.getGambles({ limit: 500 }),
          api.getOrganizations({ limit: 100 }),
          api.getPublicUsers({ limit: 200 })
        ])
        setCharacters(cRes.data || [])
        setArcs(aRes.data || [])
        setEvents(eRes.data || [])
        setGambles(gRes.data || [])
        setOrganizations(oRes.data || [])
        setUsers(uRes.data || [])
      } catch (fetchError) {
        console.error('Failed to fetch data:', fetchError)
        setError('Failed to load form data. Please refresh the page.')
      } finally {
        setDataLoading(false)
      }
    }
    fetchData()
  }, [user])

  const handleInputChange = <K extends keyof SubmitMediaFormState>(field: K, value: SubmitMediaFormState[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const isValidUrl = (url: string) => { try { new URL(url); return true } catch { return false } }

  const validateForm = () => {
    if (!formData.url.trim()) return 'Media URL is required'
    if (!isValidUrl(formData.url)) return 'Please enter a valid URL'
    if (!formData.ownerType) return 'Please select an entity type'
    if (!formData.ownerId) return 'Please select a specific entity'
    return null
  }

  const getMediaType = (url: string): MediaType => {
    const lowerUrl = url.toLowerCase()
    if (['youtube.com', 'youtu.be', 'tiktok.com', 'vm.tiktok.com', 'vimeo.com', 'twitch.tv'].some(d => lowerUrl.includes(d))) return 'video'
    if (['soundcloud.com', 'spotify.com', 'apple.com/music'].some(d => lowerUrl.includes(d))) return 'audio'
    if (['twitter.com', 'x.com', 'instagram.com', 'deviantart.com', 'pixiv.net', 'imgur.com', 'artstation.com', 'pinterest.com'].some(d => lowerUrl.includes(d))) return 'image'
    if (lowerUrl.match(/\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i)) return 'image'
    if (lowerUrl.match(/\.(mp4|mov|avi|webm|mkv|flv)(\?|$)/i)) return 'video'
    if (lowerUrl.match(/\.(mp3|wav|ogg|flac|aac|m4a)(\?|$)/i)) return 'audio'
    return 'image'
  }

  const mediaTypeIcon = (url: string) => {
    const type = getMediaType(url)
    if (type === 'video') return <Video size={16} />
    if (type === 'audio') return <Music size={16} />
    return <Image size={16} />
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')

    const validationError = validateForm()
    if (validationError) { setError(validationError); return }

    setLoading(true)
    try {
      const mediaType = getMediaType(formData.url)
      if (mediaType === 'image') {
        setError('Image URLs are not allowed. Please use the "Upload File" tab to upload images directly (max 5MB). Only video and audio URLs are accepted via URL submission.')
        setLoading(false)
        return
      }
      await api.submitMediaPolymorphic({
        url: formData.url.trim(),
        type: mediaType,
        ownerType: formData.ownerType as MediaOwnerType,
        ownerId: formData.ownerId!,
        chapterNumber: formData.chapterNumber || undefined,
        description: formData.description.trim() || undefined
      })
      setShowSuccess(true)
      setFormData({ url: '', description: '', ownerType: '', ownerId: null, chapterNumber: null })
    } catch (submitError: unknown) {
      const msg = submitError instanceof Error ? submitError.message : 'Failed to submit media. Please try again.'
      setError(msg.includes('Image') || msg.includes('image') || msg.includes('/media/upload')
        ? 'Image URLs are not allowed. Please use the "Upload File" tab to upload images directly.'
        : msg)
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (
    file: File | null,
    uploadData: {
      type: MediaType
      description?: string
      ownerType: MediaOwnerType
      ownerId: number
      chapterNumber?: number
      purpose?: 'gallery' | 'entity_display'
      usageType: 'character_image' | 'guide_image' | 'gallery_upload'
    }
  ) => {
    setError('')
    setLoading(true)
    try {
      if (!file) throw new Error('File is required')
      await api.uploadMedia(file, uploadData)
      setShowSuccess(true)
    } catch (uploadError: unknown) {
      setError(uploadError instanceof Error ? uploadError.message : 'Failed to upload media. Please try again.')
      throw uploadError
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
      case 'user': return users.map((i) => ({ value: String(i.id), label: i.username }))
      default: return []
    }
  }, [formData.ownerType, characters, arcs, events, gambles, organizations, users])

  if (authLoading) {
    return (
      <Container size="md" py="xl">
        <Stack align="center" gap="md" py="xl">
          <Box style={{ color: accentColor }}><Upload size={32} /></Box>
          <Loader size="sm" color={accentColor} />
          <Text size="sm" c="dimmed">Loading…</Text>
        </Stack>
      </Container>
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
          <Box mb="md" style={{ color: accentColor }}><Upload size={36} /></Box>
          <Title order={4} style={{ fontFamily: 'var(--font-opti-goudy-text)', fontWeight: 400 }} mb="xs">
            Sign in to submit media
          </Title>
          <Text size="sm" c="dimmed" mb="lg">You need to be logged in to share media.</Text>
          <Button component={Link} href="/login" style={{ backgroundColor: accentColor, color: '#fff' }}>
            Log In
          </Button>
        </Box>
      </Container>
    )
  }

  const isPrivilegedUser = user.role === 'moderator' || user.role === 'editor' || user.role === 'admin'
  const urlError = formData.url.length > 0 && !isValidUrl(formData.url) ? 'Please enter a valid URL' : null
  const isFormValid = !validateForm()

  const progressSteps: FormStep[] = [
    { label: 'Media URL', completed: formData.url.trim().length > 0 && isValidUrl(formData.url), required: true },
    { label: 'Entity Type', completed: !!formData.ownerType, required: true },
    { label: 'Specific Entity', completed: !!formData.ownerId, required: true }
  ]

  return (
    <Container size="md" py="xl">
      <SubmitPageHeader
        label="Media Submission"
        title="Submit Media"
        description="Share fanart and videos from YouTube, DeviantArt, Pixiv, Twitter/X, or a direct image link"
        icon={<Upload size={22} />}
        accentColor={accentColor}
      />

      <SubmissionGuidelines type="media" accentColor={accentColor} />

      {error && (
        <Alert
          variant="light"
          mb="md"
          icon={<AlertTriangle size={16} />}
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.08)',
            borderColor: 'rgba(239, 68, 68, 0.3)'
          }}
        >
          <Text size="sm" c="#f87171">{error}</Text>
        </Alert>
      )}

      {showSuccess && (
        <SubmissionSuccess
          type="media"
          accentColor={accentColor}
          onSubmitAnother={() => {
            setShowSuccess(false)
            setFormData({ url: '', description: '', ownerType: '', ownerId: null, chapterNumber: null })
          }}
        />
      )}

      {!showSuccess && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut', delay: 0.1 }}
        >
          {activeTab === 'url' && (
            <FormProgressIndicator steps={progressSteps} accentColor={accentColor} />
          )}

          <Card
            withBorder
            radius="md"
            shadow="md"
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
            <Stack gap="xl" p="xl">
              {isPrivilegedUser && (
                <Tabs
                  value={activeTab}
                  onChange={(value) => setActiveTab((value as 'url' | 'upload') ?? 'url')}
                >
                  <Tabs.List>
                    <Tabs.Tab value="url" leftSection={<LinkIcon size={15} />}>Submit URL</Tabs.Tab>
                    <Tabs.Tab value="upload" leftSection={<Upload size={15} />}>Upload File</Tabs.Tab>
                  </Tabs.List>
                </Tabs>
              )}

              {activeTab === 'url' && (
                <form onSubmit={handleSubmit}>
                  <Stack gap="lg">
                    <FormSection
                      title="Media Link"
                      description="Paste the URL to a video, audio track, or media post"
                      icon={<LinkIcon size={18} color={accentColor} />}
                      accentColor={accentColor}
                      required
                      stepNumber={1}
                    >
                      <TextInput
                        label="Media URL"
                        placeholder="https://…"
                        value={formData.url}
                        onChange={(e) => handleInputChange('url', e.currentTarget.value)}
                        required
                        description={urlError ? undefined : 'YouTube, DeviantArt, Pixiv, Twitter/X, or a direct image link'}
                        error={urlError}
                        leftSection={
                          <Box style={{ display: 'flex', alignItems: 'center' }}>
                            {formData.url ? mediaTypeIcon(formData.url) : <LinkIcon size={16} />}
                          </Box>
                        }
                        leftSectionPointerEvents="none"
                        styles={inputStyles}
                      />
                    </FormSection>

                    <FormSection
                      title="Related Entity"
                      description="Link this media to a character, arc, gamble, or other entity"
                      icon={<Image size={18} color={accentColor} />}
                      accentColor={accentColor}
                      required
                      stepNumber={2}
                    >
                      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                        <Select
                          label="Entity Type"
                          placeholder="Select entity type…"
                          data={[
                            { value: 'character', label: 'Character' },
                            { value: 'arc', label: 'Arc' },
                            { value: 'event', label: 'Event' },
                            { value: 'gamble', label: 'Gamble' },
                            { value: 'organization', label: 'Organization' }
                          ]}
                          value={formData.ownerType || null}
                          onChange={(value) => {
                            handleInputChange('ownerType', (value ?? '') as MediaOwnerType | '')
                            handleInputChange('ownerId', null)
                          }}
                          disabled={dataLoading}
                          searchable
                          clearable
                          withAsterisk
                          nothingFoundMessage="No matches"
                          styles={inputStyles}
                        />
                        <Select
                          label="Specific Entity"
                          placeholder={!formData.ownerType ? 'Select entity type first' : `Choose ${formData.ownerType}…`}
                          data={entityOptions}
                          value={formData.ownerId ? String(formData.ownerId) : null}
                          onChange={(value) => handleInputChange('ownerId', value ? Number(value) : null)}
                          disabled={dataLoading || !formData.ownerType}
                          searchable
                          withAsterisk
                          nothingFoundMessage={dataLoading ? 'Loading…' : 'No matches found'}
                          styles={inputStyles}
                        />
                      </SimpleGrid>
                    </FormSection>

                    <FormSection
                      title="Additional Details"
                      description="Optional context and chapter reference"
                      icon={<Video size={18} color={accentColor} />}
                      accentColor={accentColor}
                      stepNumber={3}
                    >
                      <Stack gap="md">
                        <NumberInput
                          label="Chapter Number"
                          placeholder="e.g., 45"
                          value={formData.chapterNumber ?? ''}
                          onChange={(value) => handleInputChange('chapterNumber', typeof value === 'number' ? value : null)}
                          min={1}
                          description="Associate with a specific chapter if relevant"
                          hideControls
                          styles={dimmedInputStyles}
                        />
                        <Textarea
                          label="Description"
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

                    <Group justify="space-between" align="center">
                      <Button
                        type="submit"
                        size="lg"
                        loading={loading}
                        disabled={loading || !isFormValid}
                        leftSection={!loading && <Upload size={18} />}
                        style={{
                          backgroundColor: isFormValid ? accentColor : undefined,
                          color: isFormValid ? '#fff' : undefined
                        }}
                      >
                        {loading ? 'Submitting…' : 'Submit Media'}
                      </Button>
                      <Text size="xs" c="dimmed">Reviewed by a moderator before publishing</Text>
                    </Group>
                  </Stack>
                </form>
              )}

              {activeTab === 'upload' && isPrivilegedUser && (
                <Stack gap="lg">
                  <Alert
                    variant="light"
                    style={{
                      backgroundColor: 'rgba(77, 171, 247, 0.08)',
                      borderColor: 'rgba(77, 171, 247, 0.25)'
                    }}
                  >
                    <Text size="sm" c="#bfdbfe">
                      <strong style={{ color: '#4dabf7' }}>Direct Upload (Moderators/Admins)</strong>
                      <br />• Moderator/admin uploads are automatically approved
                      <br />• Supports JPEG, PNG, WebP, GIF (max 5MB)
                    </Text>
                  </Alert>
                  <MediaUploadForm
                    onUpload={handleUpload}
                    characters={characters}
                    arcs={arcs}
                    events={events}
                    gambles={gambles}
                    organizations={organizations}
                    users={users}
                    loading={loading}
                    dataLoading={dataLoading}
                    error={error}
                    userRole={(user?.role as 'user' | 'moderator' | 'admin') || 'user'}
                  />
                </Stack>
              )}
            </Stack>
          </Card>
        </motion.div>
      )}
    </Container>
  )
}
