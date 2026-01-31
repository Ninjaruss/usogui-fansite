'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  Alert,
  Badge,
  Box,
  Button,
  Card,
  Container,
  Divider,
  Group,
  Loader,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  TextInput,
  Title,
  useMantineTheme,
  ActionIcon,
  Center
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { getEntityThemeColor, semanticColors, textColors } from '../../lib/mantine-theme'
import {
  User,
  BookOpen,
  Edit,
  X,
  FileText,
  Quote,
  Dices,
  FileImage,
  Calendar,
  MessageSquare
} from 'lucide-react'
import Link from 'next/link'
import { motion } from 'motion/react'
import { useAuth } from '../../providers/AuthProvider'
import { api } from '../../lib/api'
import { GuideStatus } from '../../types'
import UserProfileImage from '../../components/UserProfileImage'
import QuoteSelectionPopup from '../../components/QuoteSelectionPopup'
import GambleSelectionPopup from '../../components/GambleSelectionPopup'
import ProfilePictureSelector from '../../components/ProfilePictureSelector'
import UserBadges from '../../components/UserBadges'
import CustomRoleDisplay from '../../components/CustomRoleDisplay'

interface UserGuide {
  id: number
  title: string
  description?: string
  status: GuideStatus
  createdAt: string
  updatedAt: string
  readingProgress?: number
}

// Profile loading skeleton
function ProfileSkeleton() {
  return (
    <Container size="lg" py="xl">
      <Stack gap="xl">
        {/* Header skeleton */}
        <Card withBorder radius="lg" shadow="md" p="xl">
          <Group align="flex-start" gap="xl">
            <Skeleton circle height={120} width={120} />
            <Stack gap="sm" style={{ flex: 1 }}>
              <Skeleton height={28} width={200} />
              <Skeleton height={20} width={150} />
              <Group gap="xs">
                <Skeleton height={24} width={80} radius="xl" />
                <Skeleton height={24} width={100} radius="xl" />
              </Group>
            </Stack>
          </Group>
        </Card>

        {/* Stats skeleton */}
        <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} withBorder radius="md" p="md">
              <Stack gap="xs" align="center">
                <Skeleton height={40} width={40} circle />
                <Skeleton height={24} width={60} />
                <Skeleton height={16} width={80} />
              </Stack>
            </Card>
          ))}
        </SimpleGrid>

        {/* Favorites skeleton */}
        <Card withBorder radius="lg" shadow="md" p="xl">
          <Stack gap="md">
            <Skeleton height={24} width={150} />
            <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
              {[1, 2, 3].map((i) => (
                <Card key={i} withBorder radius="md" p="md">
                  <Stack gap="xs">
                    <Skeleton height={20} width={100} />
                    <Skeleton height={60} />
                  </Stack>
                </Card>
              ))}
            </SimpleGrid>
          </Stack>
        </Card>
      </Stack>
    </Container>
  )
}

export default function ProfilePageClient() {
  const { user, loading: authLoading, refreshUser } = useAuth()
  const theme = useMantineTheme()

  const [profileData, setProfileData] = useState({
    favoriteCharacter: '',
    favoriteQuote: '',
    favoriteGamble: '',
    customRole: ''
  })
  const [userGuides, setUserGuides] = useState<UserGuide[]>([])
  const [quotes, setQuotes] = useState<any[]>([])
  const [gambles, setGambles] = useState<any[]>([])
  const [userBadges, setUserBadges] = useState<any[]>([])
  const [submissions, setSubmissions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingCustomRole, setSavingCustomRole] = useState(false)
  const initialCustomRoleRef = useRef<string>('')

  const [quoteModalOpened, { open: openQuoteModal, close: closeQuoteModal }] = useDisclosure(false)
  const [gambleModalOpened, { open: openGambleModal, close: closeGambleModal }] = useDisclosure(false)
  const [profilePictureSelectorOpened, { open: openProfilePictureSelector, close: closeProfilePictureSelector }] = useDisclosure(false)

  const isAuthenticated = !!user

  // Check if user has active supporter badge
  const hasActiveSupporterBadge = userBadges.some(userBadge =>
    userBadge.badge?.type === 'active_supporter'
  )

  // Save custom role with confirmation
  const saveCustomRole = useCallback(async () => {
    if (!hasActiveSupporterBadge) return

    try {
      setSavingCustomRole(true)
      await api.patch('/users/profile/custom-role', { customRole: profileData.customRole })
      await refreshUser()
      initialCustomRoleRef.current = profileData.customRole
      notifications.show({
        title: 'Success',
        message: 'Custom role saved successfully',
        color: 'green'
      })
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to save custom role',
        color: 'red'
      })
    } finally {
      setSavingCustomRole(false)
    }
  }, [hasActiveSupporterBadge, refreshUser, profileData.customRole])

  useEffect(() => {
    if (isAuthenticated && user) {
      loadProfileData()
    } else if (!authLoading && !isAuthenticated) {
      setLoading(false)
    }
  }, [isAuthenticated, user, authLoading])

  const loadProfileData = async () => {
    try {
      setLoading(true)
      // Fetch profile first so we can immediately load the user's saved favorites
      let favoriteQuoteId: number | null = null
      let favoriteGambleId: number | null = null

      try {
        const profileResp = await api.get('/users/profile')
        const responseData = (profileResp as any).data || profileResp
        const initialCustomRole = user?.customRole || responseData.customRole || ''
        initialCustomRoleRef.current = initialCustomRole
        setProfileData({
          favoriteCharacter: responseData.favoriteCharacter || '',
          favoriteQuote: responseData.favoriteQuoteId ? responseData.favoriteQuoteId.toString() : '',
          favoriteGamble: responseData.favoriteGambleId ? responseData.favoriteGambleId.toString() : '',
          customRole: initialCustomRole
        })
        favoriteQuoteId = responseData.favoriteQuoteId ?? null
        favoriteGambleId = responseData.favoriteGambleId ?? null

        // If user has favorites, fetch them now so UI can show them immediately
        const favFetches: Promise<any>[] = []
        if (favoriteQuoteId != null && typeof favoriteQuoteId === 'number' && favoriteQuoteId > 0) {
          favFetches.push(api.getQuote(favoriteQuoteId))
        } else {
          favFetches.push(Promise.resolve(null))
        }
        if (favoriteGambleId != null && typeof favoriteGambleId === 'number' && favoriteGambleId > 0) {
          favFetches.push(api.getGamble(favoriteGambleId))
        } else {
          favFetches.push(Promise.resolve(null))
        }

        const [favQuoteResp, favGambleResp] = await Promise.all(favFetches)
        const favQuote = favQuoteResp?.data ?? favQuoteResp
        const favGamble = favGambleResp?.data ?? favGambleResp

        if (favQuote) {
          setQuotes(prev => {
            if (prev.find(q => q.id === favQuote.id)) return prev
            return [...prev, favQuote]
          })
        }

        if (favGamble) {
          setGambles(prev => {
            if (prev.find(g => g.id === favGamble.id)) return prev
            return [...prev, favGamble]
          })
        }
      } catch (err) {
        console.error('Failed to fetch profile or favorites:', err)
      }

      // Then fetch other resources concurrently (with pagination limits for performance)
      const [guidesResponse, quotesResponse, gamblesResponse, badgesResponse, submissionsResponse] = await Promise.allSettled([
        api.get('/guides/my-guides'),
        api.get('/quotes?limit=100'),
        api.get('/gambles?limit=100'),
        user?.id && typeof user.id === 'number' ? api.getUserBadges(user.id) : Promise.resolve([]),
        api.getUserSubmissions()
      ])

      if (guidesResponse.status === 'fulfilled') {
        setUserGuides((guidesResponse.value as any).data)
      }

      if (quotesResponse.status === 'fulfilled') {
        // Merge fetched quotes with any favorites we already added, avoiding duplicates
        const fetchedQuotes = (quotesResponse.value as any).data || []
        setQuotes(prev => {
          const existingIds = new Set(prev.map(q => q.id))
          const merged = [...prev]
          for (const q of fetchedQuotes) {
            if (!existingIds.has(q.id)) merged.push(q)
          }
          return merged
        })
      }

      if (gamblesResponse.status === 'fulfilled') {
        const fetchedGambles = (gamblesResponse.value as any).data || []
        setGambles(prev => {
          const existingIds = new Set(prev.map(g => g.id))
          const merged = [...prev]
          for (const g of fetchedGambles) {
            if (!existingIds.has(g.id)) merged.push(g)
          }
          return merged
        })
      }

      if (badgesResponse.status === 'fulfilled') {
        const badgesData = badgesResponse.value as any
        setUserBadges(Array.isArray(badgesData) ? badgesData : badgesData?.data || [])
      }

      if (submissionsResponse.status === 'fulfilled') {
        const submissionsData = submissionsResponse.value as any
        setSubmissions(Array.isArray(submissionsData) ? submissionsData : submissionsData?.data || [])
      }
    } catch (error) {
      console.error('Failed to load profile data:', error)
      notifications.show({
        title: 'Error',
        message: 'Failed to load profile data',
        color: 'red'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)

      // Convert string IDs to numbers for API
      const updateData = {
        favoriteQuoteId: profileData.favoriteQuote && !isNaN(parseInt(profileData.favoriteQuote))
          ? parseInt(profileData.favoriteQuote)
          : null,
        favoriteGambleId: profileData.favoriteGamble && !isNaN(parseInt(profileData.favoriteGamble))
          ? parseInt(profileData.favoriteGamble)
          : null,
        customRole: profileData.customRole || null
      }

      await api.patch('/users/profile', updateData)
      notifications.show({
        title: 'Success',
        message: 'Profile updated successfully',
        color: 'green'
      })
    } catch (error) {
      console.error('Failed to save profile:', error)
      notifications.show({
        title: 'Error',
        message: 'Failed to save profile',
        color: 'red'
      })
    } finally {
      setSaving(false)
    }
  }

  const handleProfilePictureSelect = async (type: string, mediaId?: number) => {
    closeProfilePictureSelector()
    
    try {
      const updateData: any = { profilePictureType: type }
      if (mediaId) {
        updateData.selectedCharacterMediaId = mediaId
      }
      await api.patch('/users/profile', updateData)
      
      // Refresh user data to update the profile picture display
      await refreshUser()
      
      notifications.show({
        title: 'Success',
        message: 'Profile picture updated successfully',
        color: 'green'
      })
    } catch (error) {
      console.error('Failed to update profile picture:', error)
      notifications.show({
        title: 'Error',
        message: 'Failed to update profile picture',
        color: 'red'
      })
    }
  }

  const handleQuoteSelect = async (quoteId: number | null) => {
    const newQuote = quoteId ? quoteId.toString() : ''
    setProfileData(prev => ({ ...prev, favoriteQuote: newQuote }))
    closeQuoteModal()

    // Auto-save the change
    try {
      await api.patch('/users/profile', { favoriteQuoteId: quoteId })
      notifications.show({
        title: 'Success',
        message: 'Favorite quote updated successfully',
        color: 'green'
      })
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to update favorite quote',
        color: 'red'
      })
    }
  }

  const handleGambleSelect = async (gambleId: number | null) => {
    const newGamble = gambleId ? gambleId.toString() : ''
    setProfileData(prev => ({ ...prev, favoriteGamble: newGamble }))
    closeGambleModal()

    // Auto-save the change
    try {
      await api.patch('/users/profile', { favoriteGambleId: gambleId })
      notifications.show({
        title: 'Success',
        message: 'Favorite gamble updated successfully',
        color: 'green'
      })
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to update favorite gamble',
        color: 'red'
      })
    }
  }

  if (authLoading) {
    return <ProfileSkeleton />
  }

  if (!isAuthenticated) {
    return (
      <Container size="lg" py="xl">
        <Alert
          icon={<User size={16} />}
          title="Authentication Required"
          style={{ color: getEntityThemeColor(theme, 'character') }}
          variant="light"
        >
          <Stack gap="md">
            <Text>You need to be logged in to view your profile.</Text>
            <Group>
              <Button 
                component={Link} 
                href={`/login?returnUrl=${encodeURIComponent('/profile')}`} 
                variant="filled"
              >
                Log In
              </Button>
              <Button component={Link} href="/register" variant="outline">
                Sign Up
              </Button>
            </Group>
          </Stack>
        </Alert>
      </Container>
    )
  }

  if (loading) {
    return <ProfileSkeleton />
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Container size="lg" py="xl">
        <Stack gap="xl">
          {/* Profile Header */}
          <Card shadow="md" padding="xl" radius="md">
            <Group align="center" gap="lg">
              <Box
                style={{
                  position: 'relative',
                  cursor: 'pointer',
                  borderRadius: '50%',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e: any) => {
                  e.currentTarget.style.transform = 'scale(1.05)'
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.3)'
                  const overlay = e.currentTarget.querySelector('.profile-edit-overlay')
                  if (overlay) overlay.style.opacity = '1'
                }}
                onMouseLeave={(e: any) => {
                  e.currentTarget.style.transform = 'scale(1)'
                  e.currentTarget.style.boxShadow = 'none'
                  const overlay = e.currentTarget.querySelector('.profile-edit-overlay')
                  if (overlay) overlay.style.opacity = '0'
                }}
                onClick={() => {
                  if (user?.id && typeof user.id === 'number') {
                    openProfilePictureSelector();
                  } else {
                    notifications.show({
                      title: 'Error',
                      message: 'Unable to load profile options',
                      color: 'red'
                    });
                  }
                }}
              >
                <UserProfileImage user={user} size={140} />
                {/* Full overlay on hover */}
                <Box
                  className="profile-edit-overlay"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    borderRadius: '50%',
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: 0,
                    transition: 'opacity 0.2s ease'
                  }}
                >
                  <Stack gap={4} align="center">
                    <Edit size={24} color="white" />
                    <Text size="xs" c="white" fw={500}>Change</Text>
                  </Stack>
                </Box>
                {/* Always-visible edit badge */}
                <Box
                  style={{
                    position: 'absolute',
                    bottom: 4,
                    right: 4,
                    backgroundColor: theme.colors.blue[6],
                    borderRadius: '50%',
                    width: '36px',
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: `3px solid ${theme.white}`,
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
                  }}
                >
                  <Edit size={18} color="white" />
                </Box>
              </Box>
              <Stack gap="sm">
                <Group align="center" gap="md">
                  <Title order={2}>{user?.username}</Title>
                  <Badge variant="light" color={
                    user?.role === 'admin' ? 'red' :
                    user?.role === 'moderator' ? 'orange' : 'blue'
                  }>
                    {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
                  </Badge>
                  <UserBadges userId={user?.id} />
                  <CustomRoleDisplay customRole={user?.customRole || null} />
                </Group>
                <Text size="sm" c="dimmed">
                  Member since {new Date(user?.createdAt || '').toLocaleDateString()}
                </Text>
              </Stack>
            </Group>
          </Card>

          {/* Profile Picture Selector - Inline when opened */}
          {profilePictureSelectorOpened && user?.id && typeof user.id === 'number' && (
            <Card shadow="sm" padding="md" radius="md">
              <Stack gap="md">
                <Group justify="space-between">
                  <Text fw={600} size="lg">Profile Picture Options</Text>
                  <ActionIcon variant="subtle" onClick={closeProfilePictureSelector} aria-label="Close profile picture options">
                    <X size={16} />
                  </ActionIcon>
                </Group>
                <ProfilePictureSelector
                  currentUserId={user.id}
                  currentProfileType="default"
                  currentSelectedMediaId={null}
                  onSelect={handleProfilePictureSelect}
                />
              </Stack>
            </Card>
          )}

          {/* Main Content - Single Page Layout */}
          <Stack gap="xl">
            {/* Favorites Section */}
            <Card shadow="sm" padding="md" radius="md">
              <Stack gap="md">
                <Text fw={600} size="lg">Favorites</Text>

                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                  <Stack gap="sm">
                    <Text size="sm" fw={500}>Favorite Quote:</Text>
                    <Button
                      variant="outline"
                      styles={{
                        root: {
                          height: 'auto',
                          minHeight: '48px',
                          padding: '12px 16px',
                          borderColor: profileData.favoriteQuote ? getEntityThemeColor(theme, 'quote') : 'rgba(255, 255, 255, 0.2)',
                          borderStyle: 'dashed',
                          backgroundColor: profileData.favoriteQuote ? 'rgba(255, 255, 255, 0.03)' : 'transparent',
                          justifyContent: 'flex-start',
                          textAlign: 'left',
                          whiteSpace: 'normal',
                          wordBreak: 'break-word'
                        },
                        label: {
                          whiteSpace: 'normal',
                          overflow: 'visible'
                        }
                      }}
                      leftSection={<Quote size={16} style={{ flexShrink: 0 }} />}
                      onClick={() => {
                        if (quotes.length === 0 && !loading) {
                          notifications.show({
                            title: 'No Quotes Available',
                            message: 'No quotes are currently available to select from',
                            color: 'yellow'
                          });
                        } else {
                          openQuoteModal();
                        }
                      }}
                      fullWidth
                    >
                      <Text size="sm" c={profileData.favoriteQuote ? undefined : 'dimmed'} style={{ lineHeight: 1.4 }}>
                        {loading ? 'Loading...' :
                         profileData.favoriteQuote ?
                          (() => {
                            const selectedQuote = quotes.find(q => q.id === parseInt(profileData.favoriteQuote) || 0);
                            if (selectedQuote?.text) {
                              return `"${selectedQuote.text.length > 100
                                ? selectedQuote.text.substring(0, 100) + '...'
                                : selectedQuote.text}"`;
                            }
                            return 'Selected quote not found';
                          })()
                          : 'Click to select a favorite quote'}
                      </Text>
                    </Button>
                  </Stack>

                  <Stack gap="sm">
                    <Text size="sm" fw={500}>Favorite Gamble:</Text>
                    <Button
                      variant="outline"
                      styles={{
                        root: {
                          height: 'auto',
                          minHeight: '48px',
                          padding: '12px 16px',
                          borderColor: profileData.favoriteGamble ? getEntityThemeColor(theme, 'gamble') : 'rgba(255, 255, 255, 0.2)',
                          borderStyle: 'dashed',
                          backgroundColor: profileData.favoriteGamble ? 'rgba(255, 255, 255, 0.03)' : 'transparent',
                          justifyContent: 'flex-start',
                          textAlign: 'left'
                        }
                      }}
                      leftSection={<Dices size={16} style={{ flexShrink: 0 }} />}
                      onClick={() => {
                        if (gambles.length === 0 && !loading) {
                          notifications.show({
                            title: 'No Gambles Available',
                            message: 'No gambles are currently available to select from',
                            color: 'yellow'
                          });
                        } else {
                          openGambleModal();
                        }
                      }}
                      fullWidth
                    >
                      {loading ? (
                        <Text size="sm" c="dimmed">Loading...</Text>
                      ) : profileData.favoriteGamble ? (
                        (() => {
                          const selected = gambles.find(g => g.id === parseInt(profileData.favoriteGamble) || 0)
                          return selected ? (
                            <Badge radius="lg" variant="filled" size="md" style={{ backgroundColor: getEntityThemeColor(theme, 'gamble'), color: '#fff', fontWeight: 700 }}>
                              {selected.name}
                            </Badge>
                          ) : (
                            <Text size="sm" c="dimmed">Selected gamble not found</Text>
                          )
                        })()
                      ) : (
                        <Text size="sm" c="dimmed">Click to select a favorite gamble</Text>
                      )}
                    </Button>
                  </Stack>
                </SimpleGrid>
              </Stack>
            </Card>

            {/* Settings Section */}
            <Card shadow="sm" padding="md" radius="md">
              <Stack gap="md">
                <Text fw={600} size="lg">Settings</Text>
                
                {/* Custom Role Editor */}
                <Stack gap="sm">
                  <Text fw={500} size="md">Custom Role</Text>
                  {!hasActiveSupporterBadge ? (
                    <Alert style={{ color: getEntityThemeColor(theme, 'character') }} variant="light">
                      <Stack gap="xs">
                        <Text size="sm" fw={500}>Custom roles are exclusive to active supporters!</Text>
                        <Text size="sm">
                          Support us on Ko-fi to unlock custom role customization and help keep this fansite running.
                        </Text>
                        <Button
                          component="a"
                          href="https://ko-fi.com/ninjaruss"
                          target="_blank"
                          rel="noopener noreferrer"
                          size="sm"
                          style={{ color: getEntityThemeColor(theme, 'character') }}
                        >
                          ☕ Support on Ko-fi
                        </Button>
                      </Stack>
                    </Alert>
                  ) : (
                    <>
                      <Text size="sm" c="dimmed">
                        Customize how your role appears to other users
                      </Text>
                      <Stack gap="xs">
                        <TextInput
                          placeholder="Enter custom role (e.g., 'Gambling Expert')"
                          value={profileData.customRole}
                          onChange={(e) => {
                            setProfileData(prev => ({ ...prev, customRole: e.target.value }))
                          }}
                          maxLength={50}
                        />
                        <Group gap="xs">
                          <Button
                            onClick={saveCustomRole}
                            loading={savingCustomRole}
                            disabled={savingCustomRole || profileData.customRole === initialCustomRoleRef.current}
                            size="sm"
                            variant="filled"
                            style={{ backgroundColor: getEntityThemeColor(theme, 'character') }}
                          >
                            Save Custom Role
                          </Button>
                          {profileData.customRole !== initialCustomRoleRef.current && (
                            <Button
                              onClick={() => {
                                setProfileData(prev => ({ ...prev, customRole: initialCustomRoleRef.current }))
                              }}
                              size="sm"
                              variant="subtle"
                              color="gray"
                            >
                              Cancel
                            </Button>
                          )}
                        </Group>
                      </Stack>
                    </>
                  )}
                </Stack>
              </Stack>
            </Card>

            {/* My Submissions Section */}
            <Card shadow="sm" padding="md" radius="md">
              <Stack gap="md">
                <Text fw={600} size="lg">My Submissions</Text>

                {submissions.length > 0 ? (
                  <Stack gap="sm">
                    {submissions.map((submission: any) => {
                      const statusColor =
                        submission.status === 'approved' ? 'green' :
                        submission.status === 'pending' ? 'yellow' : 'red'

                      const typeIcon =
                        submission.type === 'guide' ? <FileText size={16} /> :
                        submission.type === 'media' ? <FileImage size={16} /> :
                        submission.type === 'event' ? <Calendar size={16} /> :
                        <MessageSquare size={16} />

                      // Construct proper link for media submissions - link to entity pages
                      const getSubmissionLink = () => {
                        if (submission.type === 'guide') return `/guides/${submission.id}`
                        if (submission.type === 'event') return `/events/${submission.id}`
                        if (submission.type === 'annotation') return `/annotations/${submission.id}`
                        if (submission.type === 'media' && submission.ownerType && submission.ownerId) {
                          const entityPathMap: Record<string, string> = {
                            character: 'characters',
                            arc: 'arcs',
                            event: 'events',
                            gamble: 'gambles',
                            organization: 'organizations',
                            guide: 'guides',
                            user: 'users',
                            volume: 'volumes'
                          }
                          const basePath = entityPathMap[submission.ownerType] || 'media'
                          return `/${basePath}/${submission.ownerId}#media`
                        }
                        return '#'
                      }

                      return (
                        <Card key={`${submission.type}-${submission.id}`} padding="sm" radius="md" withBorder>
                          <Group justify="space-between" wrap="nowrap">
                            <Group gap="sm" style={{ flex: 1, minWidth: 0 }}>
                              {typeIcon}
                              <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
                                <Text fw={500} size="sm" lineClamp={1}>
                                  {submission.title}
                                </Text>
                                {submission.type === 'media' && submission.description && (
                                  <Text size="xs" c="dimmed" lineClamp={1}>
                                    {submission.description}
                                  </Text>
                                )}
                                <Group gap="xs">
                                  <Badge size="xs" variant="light" color={statusColor}>
                                    {submission.status}
                                  </Badge>
                                  <Badge size="xs" variant="outline">
                                    {submission.type}
                                  </Badge>
                                  <Text size="xs" c="dimmed">
                                    {new Date(submission.createdAt).toLocaleDateString()}
                                  </Text>
                                </Group>
                              </Stack>
                            </Group>
                            {submission.status === 'approved' && submission.type !== 'annotation' && (
                              <Link href={getSubmissionLink()}>
                                <Button size="xs" variant="subtle">View</Button>
                              </Link>
                            )}
                          </Group>
                        </Card>
                      )
                    })}
                  </Stack>
                ) : (
                  <Alert icon={<FileText size={16} />} title="No submissions yet" variant="light">
                    <Text>You haven&apos;t made any submissions yet. Start contributing to the community!</Text>
                  </Alert>
                )}
              </Stack>
            </Card>

            {/* My Guides Section */}
            <Card shadow="sm" padding="md" radius="md">
              <Stack gap="md">
                <Group justify="space-between">
                  <Text fw={600} size="lg">My Guides</Text>
                  <Button component={Link} href="/submit-guide" leftSection={<FileText size={16} />}>
                    Create New Guide
                  </Button>
                </Group>

                {userGuides.length > 0 ? (
                  <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing="md">
                    {userGuides.map((guide) => (
                      <Link key={guide.id} href={`/guides/${guide.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                        <Card shadow="sm" padding="md" radius="md" style={{ cursor: 'pointer' }}>
                          <Stack gap="sm">
                            <Group justify="space-between">
                              <Text fw={600} size="md" lineClamp={2} style={{ flex: 1 }}>{guide.title}</Text>
                              <Badge
                                variant="light"
                                color={
                                  guide.status === GuideStatus.APPROVED ? 'green' :
                                  guide.status === GuideStatus.PENDING ? 'yellow' : 'red'
                                }
                                size="sm"
                              >
                                {guide.status}
                              </Badge>
                            </Group>
                            {guide.description && (
                              <Text size="sm" c="dimmed" lineClamp={3}>
                                {guide.description}
                              </Text>
                            )}
                            <Group gap="xs" mt="auto">
                              <Text size="xs" c="dimmed">
                                Updated {new Date(guide.updatedAt).toLocaleDateString()}
                              </Text>
                            </Group>
                          </Stack>
                        </Card>
                      </Link>
                    ))}
                  </SimpleGrid>
                ) : (
                  <Alert icon={<BookOpen size={16} />} title="No guides yet" variant="light">
                    <Text>You haven&apos;t created any guides yet. Start sharing your knowledge with the community!</Text>
                  </Alert>
                )}
              </Stack>
            </Card>
          </Stack>
        </Stack>
      </Container>

      {/* Modals */}
      <QuoteSelectionPopup
        open={quoteModalOpened}
        onClose={closeQuoteModal}
        quotes={quotes}
        selectedQuoteId={profileData.favoriteQuote && !isNaN(parseInt(profileData.favoriteQuote)) ? parseInt(profileData.favoriteQuote) : null}
        onSelectQuote={handleQuoteSelect}
        loading={loading}
      />

      <GambleSelectionPopup
        open={gambleModalOpened}
        onClose={closeGambleModal}
        gambles={gambles}
        selectedGambleId={profileData.favoriteGamble && !isNaN(parseInt(profileData.favoriteGamble)) ? parseInt(profileData.favoriteGamble) : null}
        onSelectGamble={handleGambleSelect}
        loading={loading}
      />
    </motion.div>
  )
}
