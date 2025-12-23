'use client'

import React, { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  Container,
  Loader,
  NumberInput,
  Select,
  SimpleGrid,
  Stack,
  Tabs,
  Text,
  TextInput,
  Textarea,
  ThemeIcon,
  Title,
  useMantineTheme
} from '@mantine/core'
import { getEntityThemeColor, semanticColors, textColors, setTabAccentColors } from '../../lib/mantine-theme'
import { Upload, Link as LinkIcon, Image, Video, Music } from 'lucide-react'
import { useAuth } from '../../providers/AuthProvider'
import { api } from '../../lib/api'
import { motion } from 'motion/react'
import MediaUploadForm from '../../components/MediaUploadForm'

type MediaOwnerType = 'character' | 'arc' | 'event' | 'gamble' | 'organization' | 'user'

type MediaType = 'image' | 'video' | 'audio'

interface Character {
  id: number
  name: string
}

interface Arc {
  id: number
  name: string
}

interface Event {
  id: number
  title: string
}

interface Gamble {
  id: number
  name: string
}

interface Organization {
  id: number
  name: string
}

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
  const [success, setSuccess] = useState('')
  const [activeTab, setActiveTab] = useState<'url' | 'upload'>('url')

  // Set tab accent colors for media entity (since we're submitting media)
  useEffect(() => {
    setTabAccentColors('media')
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      try {
        setDataLoading(true)
        const [charactersResponse, arcsResponse, eventsResponse, gamblesResponse, organizationsResponse, usersResponse] = await Promise.all([
          api.getCharacters({ limit: 500 }),
          api.getArcs({ limit: 200 }),
          api.getEvents({ limit: 200 }),
          api.getGambles({ limit: 500 }),
          api.getOrganizations({ limit: 100 }),
          api.getPublicUsers({ limit: 200 })
        ])
        setCharacters(charactersResponse.data || [])
        setArcs(arcsResponse.data || [])
        setEvents(eventsResponse.data || [])
        setGambles(gamblesResponse.data || [])
        setOrganizations(organizationsResponse.data || [])
        setUsers(usersResponse.data || [])
      } catch (fetchError) {
        console.error('Failed to fetch data:', fetchError)
        setError('Failed to load form data. Please refresh the page.')
      } finally {
        setDataLoading(false)
      }
    }

    if (user) {
      fetchData()
    }
  }, [user])

  const handleInputChange = <K extends keyof SubmitMediaFormState>(field: K, value: SubmitMediaFormState[K]) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }))
  }

  const validateForm = () => {
    if (!formData.url.trim()) {
      return 'Media URL is required'
    }

    if (!isValidUrl(formData.url)) {
      return 'Please enter a valid URL'
    }

    if (!formData.ownerType) {
      return 'Please select an entity type'
    }

    if (!formData.ownerId) {
      return 'Please select a specific entity'
    }

    return null
  }

  const isValidUrl = (url: string) => {
    try {
       
      new URL(url)
      return true
    } catch {
      return false
    }
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
      const mediaType = getMediaType(formData.url)

      await api.submitMediaPolymorphic({
        url: formData.url.trim(),
        type: mediaType,
        ownerType: formData.ownerType as MediaOwnerType,
        ownerId: formData.ownerId!,
        chapterNumber: formData.chapterNumber || undefined,
        description: formData.description.trim() || undefined
      })

      setSuccess('Media submitted successfully! It will be reviewed by moderators before appearing on the site.')
      setFormData({
        url: '',
        description: '',
        ownerType: '',
        ownerId: null,
        chapterNumber: null
      })
    } catch (submitError: unknown) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to submit media. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (
    file: File,
    uploadData: {
      type: MediaType
      description?: string
      ownerType: MediaOwnerType
      ownerId: number
      chapterNumber?: number
      purpose?: 'gallery' | 'entity_display'
    }
  ) => {
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      await api.uploadMedia(file, uploadData)
      setSuccess('Media uploaded successfully! It has been automatically approved.')
    } catch (uploadError: unknown) {
      setError(uploadError instanceof Error ? uploadError.message : 'Failed to upload media. Please try again.')
      throw uploadError
    } finally {
      setLoading(false)
    }
  }

  const getMediaType = (url: string): MediaType => {
    const lowerUrl = url.toLowerCase()

    if (
      lowerUrl.includes('youtube.com') ||
      lowerUrl.includes('youtu.be') ||
      lowerUrl.includes('tiktok.com') ||
      lowerUrl.includes('vm.tiktok.com') ||
      lowerUrl.includes('vimeo.com') ||
      lowerUrl.includes('twitch.tv')
    ) {
      return 'video'
    }

    if (
      lowerUrl.includes('soundcloud.com') ||
      lowerUrl.includes('spotify.com') ||
      lowerUrl.includes('apple.com/music')
    ) {
      return 'audio'
    }

    if (
      lowerUrl.includes('twitter.com') ||
      lowerUrl.includes('x.com') ||
      lowerUrl.includes('instagram.com') ||
      lowerUrl.includes('deviantart.com') ||
      lowerUrl.includes('pixiv.net') ||
      lowerUrl.includes('imgur.com') ||
      lowerUrl.includes('artstation.com') ||
      lowerUrl.includes('pinterest.com')
    ) {
      return 'image'
    }

    if (lowerUrl.match(/\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i)) {
      return 'image'
    }
    if (lowerUrl.match(/\.(mp4|mov|avi|webm|mkv|flv)(\?|$)/i)) {
      return 'video'
    }
    if (lowerUrl.match(/\.(mp3|wav|ogg|flac|aac|m4a)(\?|$)/i)) {
      return 'audio'
    }

    return 'image'
  }

  const mediaTypeIcon = (url: string) => {
    const type = getMediaType(url)
    switch (type) {
      case 'video':
        return <Video size={18} />
      case 'audio':
        return <Music size={18} />
      case 'image':
        return <Image size={18} />
      default:
        return <LinkIcon size={18} />
    }
  }

  const entityOptions = useMemo(() => {
    if (!formData.ownerType) {
      return []
    }

    switch (formData.ownerType) {
      case 'character':
        return characters.map((item) => ({ value: String(item.id), label: item.name }))
      case 'arc':
        return arcs.map((item) => ({ value: String(item.id), label: item.name }))
      case 'event':
        return events.map((item) => ({ value: String(item.id), label: item.title }))
      case 'gamble':
        return gambles.map((item) => ({ value: String(item.id), label: item.name }))
      case 'organization':
        return organizations.map((item) => ({ value: String(item.id), label: item.name }))
      case 'user':
        return users.map((item) => ({ value: String(item.id), label: item.username }))
      default:
        return []
    }
  }, [formData.ownerType, characters, arcs, events, gambles, organizations, users])

  if (authLoading) {
    return (
      <Container size="md" py="xl">
        <Stack align="center" justify="center" miw="100%">
          <Loader size="lg" />
        </Stack>
      </Container>
    )
  }

  if (!user) {
    return (
      <Container size="md" py="xl">
        <Alert
          variant="light"
          radius="md"
          style={{
            backgroundColor: 'rgba(245, 124, 0, 0.1)',
            borderColor: 'rgba(245, 124, 0, 0.3)',
            color: '#ffb74d'
          }}
        >
          <Text c="#ffb74d">Please log in to submit media.</Text>
        </Alert>
      </Container>
    )
  }

  const isPrivilegedUser = user.role === 'moderator' || user.role === 'admin'
  const urlError = formData.url.length > 0 && !isValidUrl(formData.url) ? 'Please enter a valid URL' : null
  const isFormValid = !validateForm()

  return (
    <Container size="md" py="xl">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Stack gap="xl">
          <Stack align="center" gap="sm" ta="center">
            <ThemeIcon size={64} radius="xl" variant="light" style={{ backgroundColor: 'rgba(168, 85, 247, 0.15)', color: '#a855f7' }}>
              <Upload size={32} color="#a855f7" />
            </ThemeIcon>
            <Title order={1}>Submit Media</Title>
            <Text size="lg" c="dimmed">
              Share fanart, videos, audio, or other media from YouTube, TikTok, Instagram, Pixiv, DeviantArt, Imgur, SoundCloud, and more
            </Text>
          </Stack>

          {error && (
            <Alert
              variant="light"
              radius="md"
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
              radius="md"
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
            withBorder
            radius="md"
            shadow="md"
            className="media-card"
            style={{
              backgroundColor: theme.colors.dark?.[7] ?? '#070707',
              color: theme.colors.gray?.[0] ?? '#fff',
              borderColor: 'rgba(168, 85, 247, 0.4)',
              boxShadow: '0 4px 12px rgba(168, 85, 247, 0.1)'
            }}
          >
            <Stack gap="xl">
              {isPrivilegedUser && (
                <Tabs
                  value={activeTab}
                  onChange={(value) => setActiveTab((value as 'url' | 'upload') ?? 'url')}
                  styles={{
                    tab: {
                      color: 'rgba(255, 255, 255, 0.7)',
                      borderRadius: '6px',
                      transition: 'all 150ms ease',
                      '&:hover': {
                        backgroundColor: 'rgba(168, 85, 247, 0.08)',
                        color: 'rgba(255, 255, 255, 0.95)',
                        borderColor: 'rgba(168, 85, 247, 0.4)'
                      },
                      '&[dataActive="true"]': {
                        color: '#ffffff',
                        backgroundColor: 'rgba(168, 85, 247, 0.12)',
                        borderColor: 'rgba(168, 85, 247, 0.8)',
                        fontWeight: 600
                      }
                    },
                  }}
                >
                  <Tabs.List>
                    <Tabs.Tab value="url">Submit URL</Tabs.Tab>
                    <Tabs.Tab value="upload">Upload File</Tabs.Tab>
                  </Tabs.List>
                </Tabs>
              )}

              <Stack gap="lg">
                {activeTab === 'url' && (
                  <form onSubmit={handleSubmit}>
                    <Stack gap="lg">
                      <TextInput
                        label="Media URL"
                        placeholder="https://..."
                        value={formData.url}
                        onChange={(event) => handleInputChange('url', event.currentTarget.value)}
                        required
                        description={urlError ? undefined : 'Link to fanart, video, or other media (YouTube, TikTok, Instagram, Twitter, DeviantArt, Pixiv, Imgur, SoundCloud, direct links, etc.)'}
                        error={urlError}
                        leftSection={
                          <Box style={{ display: 'flex', alignItems: 'center' }}>
                            {formData.url ? mediaTypeIcon(formData.url) : <LinkIcon size={18} />}
                          </Box>
                        }
                        leftSectionPointerEvents="none"
                        styles={{
                          input: {
                            backgroundColor: theme.colors.dark?.[5] ?? '#0b0b0b',
                            color: theme.colors.gray?.[0] ?? '#fff',
                            borderColor: 'rgba(255,255,255,0.06)',
                            '&:focus': {
                              borderColor: '#a855f7',
                              boxShadow: '0 0 0 2px rgba(168, 85, 247, 0.2)'
                            }
                          },
                          label: {
                            color: '#a855f7',
                            fontWeight: 600
                          }
                        }}
                      />

                      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                        <Select
                          label="Related Entity"
                          placeholder="Select entity type..."
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
                          styles={{
                            input: {
                              backgroundColor: theme.colors.dark?.[5] ?? '#0b0b0b',
                              color: theme.colors.gray?.[0] ?? '#fff',
                              borderColor: 'rgba(255,255,255,0.06)',
                              '&:focus': {
                                borderColor: '#a855f7',
                                boxShadow: '0 0 0 2px rgba(168, 85, 247, 0.2)'
                              }
                            },
                            dropdown: {
                              backgroundColor: theme.colors.dark?.[7] ?? '#070707',
                              borderColor: '#a855f7',
                              border: '1px solid #a855f7'
                            },
                            option: {
                              color: '#ffffff',
                              backgroundColor: 'transparent',
                              '&:hover': {
                                backgroundColor: '#a855f7',
                                color: '#000000'
                              },
                              '&[dataSelected="true"]': {
                                backgroundColor: '#9333ea',
                                color: '#ffffff'
                              }
                            },
                            label: {
                              color: '#a855f7',
                              fontWeight: 600
                            }
                          }}
                        />

                        <Select
                          label="Specific Entity"
                          placeholder={!formData.ownerType ? 'Select entity type first' : `Choose ${formData.ownerType}...`}
                          data={entityOptions}
                          value={formData.ownerId ? String(formData.ownerId) : null}
                          onChange={(value) => handleInputChange('ownerId', value ? Number(value) : null)}
                          disabled={dataLoading || !formData.ownerType}
                          searchable
                          withAsterisk
                          nothingFoundMessage={dataLoading ? 'Loading...' : 'No matches found'}
                          styles={{
                            input: {
                              backgroundColor: theme.colors.dark?.[5] ?? '#0b0b0b',
                              color: theme.colors.gray?.[0] ?? '#fff',
                              borderColor: 'rgba(255,255,255,0.06)',
                              '&:focus': {
                                borderColor: '#a855f7',
                                boxShadow: '0 0 0 2px rgba(168, 85, 247, 0.2)'
                              }
                            },
                            dropdown: {
                              backgroundColor: theme.colors.dark?.[7] ?? '#070707',
                              borderColor: '#a855f7',
                              border: '1px solid #a855f7'
                            },
                            option: {
                              color: '#ffffff',
                              backgroundColor: 'transparent',
                              '&:hover': {
                                backgroundColor: '#a855f7',
                                color: '#000000'
                              },
                              '&[dataSelected="true"]': {
                                backgroundColor: '#9333ea',
                                color: '#ffffff'
                              }
                            },
                            label: {
                              color: '#a855f7',
                              fontWeight: 600
                            }
                          }}
                        />
                      </SimpleGrid>

                      <NumberInput
                        label="Chapter Number (Optional)"
                        placeholder="e.g., 45"
                        value={formData.chapterNumber ?? ''}
                        onChange={(value) => handleInputChange('chapterNumber', typeof value === 'number' ? value : null)}
                        min={1}
                        description="Associate with a specific chapter if relevant"
                        hideControls
                        styles={{
                          input: {
                            backgroundColor: theme.colors.dark?.[5] ?? '#0b0b0b',
                            color: theme.colors.gray?.[0] ?? '#fff',
                            borderColor: 'rgba(255,255,255,0.06)',
                            '&:focus': {
                              borderColor: '#a855f7',
                              boxShadow: '0 0 0 2px rgba(168, 85, 247, 0.2)'
                            }
                          },
                          label: {
                            color: '#a855f7',
                            fontWeight: 600
                          }
                        }}
                      />

                      <Textarea
                        label="Description (Optional)"
                        placeholder="Describe this media, credit the artist if known, or provide context..."
                        value={formData.description}
                        onChange={(event) => handleInputChange('description', event.currentTarget.value)}
                        description="Please provide credit to the original artist if known"
                        autosize
                        minRows={4}
                        styles={{
                          input: {
                            backgroundColor: theme.colors.dark?.[5] ?? '#0b0b0b',
                            color: theme.colors.gray?.[0] ?? '#fff',
                            borderColor: 'rgba(255,255,255,0.06)',
                            '&:focus': {
                              borderColor: '#a855f7',
                              boxShadow: '0 0 0 2px rgba(168, 85, 247, 0.2)'
                            }
                          },
                          label: {
                            color: '#a855f7',
                            fontWeight: 600
                          }
                        }}
                      />

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
                              {!formData.url.trim() && (
                                <Text size="xs" c="dimmed">• Enter a media URL</Text>
                              )}
                              {formData.url.trim() && !isValidUrl(formData.url) && (
                                <Text size="xs" c="dimmed">• Enter a valid URL</Text>
                              )}
                              {!formData.ownerType && (
                                <Text size="xs" c="dimmed">• Select an entity type</Text>
                              )}
                              {formData.ownerType && !formData.ownerId && (
                                <Text size="xs" c="dimmed">• Select a specific {formData.ownerType}</Text>
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
                        disabled={loading || !isFormValid}
                        leftSection={!loading ? <Upload size={18} /> : undefined}
                        styles={{
                          root: {
                            backgroundColor: '#a855f7',
                            color: '#ffffff',
                            '&:hover': {
                              backgroundColor: '#9333ea'
                            },
                            '&:disabled': {
                              backgroundColor: 'rgba(168, 85, 247, 0.3)',
                              color: 'rgba(255, 255, 255, 0.5)'
                            }
                          }
                        }}
                      >
                        {loading ? 'Submitting...' : 'Submit Media'}
                      </Button>
                    </Stack>
                  </form>
                )}

                {activeTab === 'upload' && isPrivilegedUser && (
                  <Stack gap="lg">
                    <Alert
                      variant="light"
                      radius="md"
                      style={{
                        backgroundColor: 'rgba(77, 171, 247, 0.08)',
                        borderColor: 'rgba(77, 171, 247, 0.25)',
                        color: '#93c5fd'
                      }}
                    >
                      <Text size="sm" c="#bfdbfe">
                        <strong style={{ color: '#4dabf7' }}>Direct Upload (Moderators/Admins)</strong>
                        <br />• Files are automatically approved
                        <br />• Uploaded to Backblaze B2 storage
                        <br />• Supports JPEG, PNG, WebP, GIF (max 10MB)
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
                    />
                  </Stack>
                )}
              </Stack>
            </Stack>
          </Card>

          <Alert
            variant="light"
            radius="md"
            style={{
              backgroundColor: 'rgba(77, 171, 247, 0.08)',
              borderColor: 'rgba(77, 171, 247, 0.25)',
              color: '#93c5fd'
            }}
          >
            <Text size="sm" c="#bfdbfe">
              <strong style={{ color: '#4dabf7' }}>Submission Guidelines:</strong>
              <br />• Only submit media you have permission to share
              <br />• Always credit the original artist when possible
              <br />• Media will be reviewed by moderators before appearing on the site
              <br />• Inappropriate or copyrighted content will be removed
              <br />• Supported platforms: YouTube, TikTok, Instagram, Twitter/X, DeviantArt, Pixiv, Imgur, SoundCloud, and direct file links
            </Text>
          </Alert>
        </Stack>
      </motion.div>
    </Container>
  )
}
