'use client'

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
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
  Menu,
  PasswordInput,
  SegmentedControl,
  SimpleGrid,
  Skeleton,
  Stack,
  Tabs,
  Text,
  TextInput,
  Title,
  useMantineTheme,
  ActionIcon,
  Center
} from '@mantine/core'
import { useDisclosure, useDebouncedValue } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { getEntityThemeColor, semanticColors, textColors } from '../../lib/mantine-theme'
import {
  User,
  BookOpen,
  Edit,
  Check,
  X,
  FileText,
  Quote,
  Dices,
  AlertTriangle,
  Search,
  Plus,
  FileImage,
  Calendar,
  MessageSquare,
} from 'lucide-react'
import Link from 'next/link'
import { motion } from 'motion/react'
import { useAuth } from '../../providers/AuthProvider'
import { api } from '../../lib/api'
import { GuideStatus } from '../../types'
import { invalidatePagedCache } from '../../lib/cache-utils'
import UserProfileImage from '../../components/UserProfileImage'
import QuoteSelectionPopup from '../../components/QuoteSelectionPopup'
import GambleSelectionPopup from '../../components/GambleSelectionPopup'
import ProfilePictureSelector from '../../components/ProfilePictureSelector'
import UserBadges from '../../components/UserBadges'
import CustomRoleDisplay from '../../components/CustomRoleDisplay'
import SubmissionCard from '../../components/SubmissionCard'
import type { SubmissionItem } from '../../components/SubmissionCard'

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
  const { user, loading: authLoading, refreshUser, linkFluxer } = useAuth()
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

  // Unified content tab and filters
  type ContentTab = 'guides' | 'media' | 'events' | 'annotations'
  const [activeContentTab, setActiveContentTab] = useState<ContentTab>('guides')
  const [contentFilters, setContentFilters] = useState<Record<ContentTab, { status: string; search: string; visible: number }>>({
    guides: { status: 'all', search: '', visible: 6 },
    media: { status: 'all', search: '', visible: 10 },
    events: { status: 'all', search: '', visible: 10 },
    annotations: { status: 'all', search: '', visible: 10 },
  })
  const [debouncedSearch] = useDebouncedValue(contentFilters[activeContentTab].search, 300)

  const [quoteModalOpened, { open: openQuoteModal, close: closeQuoteModal }] = useDisclosure(false)
  const [gambleModalOpened, { open: openGambleModal, close: closeGambleModal }] = useDisclosure(false)
  const [profilePictureSelectorOpened, { open: openProfilePictureSelector, close: closeProfilePictureSelector }] = useDisclosure(false)
  const [editingUsername, setEditingUsername] = useState(false)
  const [usernameInput, setUsernameInput] = useState('')
  const [savingUsername, setSavingUsername] = useState(false)
  const [unlinkingProvider, setUnlinkingProvider] = useState<'fluxer' | null>(null)

  // Account Security: change email
  const [changeEmailForm, setChangeEmailForm] = useState({ newEmail: '', currentPassword: '' })
  const [changingEmail, setChangingEmail] = useState(false)

  // Account Security: change password
  const [changePasswordForm, setChangePasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [changingPassword, setChangingPassword] = useState(false)

  const isAuthenticated = !!user

  // Check if user has active supporter badge
  const hasActiveSupporterBadge = userBadges.some(userBadge =>
    userBadge.badge?.type === 'active_supporter'
  )

  // Content counts for tab badges
  const contentCounts = useMemo(() => ({
    guides: userGuides.length,
    media: submissions.filter(s => s.type === 'media').length,
    events: submissions.filter(s => s.type === 'event').length,
    annotations: submissions.filter(s => s.type === 'annotation').length,
  }), [userGuides, submissions])

  // Helper to update filter for a specific tab
  const updateContentFilter = useCallback((tab: ContentTab, key: 'status' | 'search' | 'visible', value: string | number) => {
    setContentFilters(prev => ({
      ...prev,
      [tab]: { ...prev[tab], [key]: value }
    }))
  }, [])

  // Reset visible count when filter changes
  const handleStatusFilterChange = useCallback((tab: ContentTab, status: string) => {
    setContentFilters(prev => ({
      ...prev,
      [tab]: { ...prev[tab], status, visible: tab === 'guides' ? 6 : 10 }
    }))
  }, [])

  // Filtered and visible content for current tab
  const getFilteredContent = useCallback((tab: ContentTab) => {
    const { status, visible } = contentFilters[tab]
    const searchTerm = debouncedSearch.toLowerCase()

    let items: any[] = tab === 'guides'
      ? userGuides
      : submissions.filter(s => s.type === tab)

    // Status filter
    if (status !== 'all') {
      items = items.filter(item => item.status === status)
    }

    // Search filter
    if (searchTerm) {
      items = items.filter(item =>
        item.title?.toLowerCase().includes(searchTerm) ||
        item.description?.toLowerCase().includes(searchTerm)
      )
    }

    return {
      filtered: items,
      visible: items.slice(0, visible),
      hasMore: items.length > visible,
      remaining: items.length - visible
    }
  }, [contentFilters, debouncedSearch, userGuides, submissions])

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

  const handleSaveUsername = async () => {
    const trimmed = usernameInput.trim()
    if (!trimmed || trimmed === user?.username) {
      setEditingUsername(false)
      return
    }
    if (trimmed.length < 3 || trimmed.length > 30) {
      notifications.show({ title: 'Invalid username', message: 'Username must be between 3 and 30 characters', color: 'red' })
      return
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
      notifications.show({ title: 'Invalid username', message: 'Username can only contain letters, numbers, underscores, and hyphens', color: 'red' })
      return
    }
    setSavingUsername(true)
    try {
      await api.patch('/users/profile', { username: trimmed })
      await refreshUser()
      invalidatePagedCache('users') // Clear users list cache
      setEditingUsername(false)
      notifications.show({ title: 'Username updated', message: 'Your username has been changed successfully', color: 'green' })
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to update username'
      notifications.show({ title: 'Error', message: msg, color: 'red' })
    } finally {
      setSavingUsername(false)
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
      invalidatePagedCache('users') // Clear users list cache

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

  const handleUnlink = async (provider: 'fluxer') => {
    setUnlinkingProvider(provider)
    try {
      await api.unlinkFluxer()
      await refreshUser()
      notifications.show({
        title: 'Account Unlinked',
        message: 'Fluxer account has been unlinked',
        color: 'green'
      })
    } catch (error: any) {
      notifications.show({
        title: 'Unlink Failed',
        message: error?.message || 'Failed to unlink Fluxer account',
        color: 'red'
      })
    } finally {
      setUnlinkingProvider(null)
    }
  }

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!changeEmailForm.newEmail) return
    setChangingEmail(true)
    try {
      await api.changeEmail(changeEmailForm.newEmail, changeEmailForm.currentPassword || undefined)
      setChangeEmailForm({ newEmail: '', currentPassword: '' })
      await refreshUser()
      notifications.show({
        title: 'Email updated',
        message: 'A verification link has been sent to your new email address.',
        color: 'green',
      })
    } catch (err: any) {
      notifications.show({
        title: 'Failed to update email',
        message: err?.message || 'Please check your password and try again.',
        color: 'red',
      })
    } finally {
      setChangingEmail(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    const { currentPassword, newPassword, confirmPassword } = changePasswordForm
    if (newPassword !== confirmPassword) {
      notifications.show({ title: 'Passwords do not match', message: 'New password and confirmation must be identical.', color: 'red' })
      return
    }
    const pwRules = [
      { ok: newPassword.length >= 8, msg: 'Password must be at least 8 characters.' },
      { ok: newPassword.length <= 128, msg: 'Password must not exceed 128 characters.' },
      { ok: /[A-Z]/.test(newPassword), msg: 'Password must contain at least one uppercase letter.' },
      { ok: /[a-z]/.test(newPassword), msg: 'Password must contain at least one lowercase letter.' },
      { ok: /\d/.test(newPassword), msg: 'Password must contain at least one number.' },
    ]
    const failed = pwRules.find(r => !r.ok)
    if (failed) {
      notifications.show({ title: 'Invalid password', message: failed.msg, color: 'red' })
      return
    }
    setChangingPassword(true)
    try {
      await api.changePassword(newPassword, currentPassword || undefined)
      setChangePasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      notifications.show({ title: 'Password updated', message: 'Your password has been changed successfully.', color: 'green' })
    } catch (err: any) {
      notifications.show({
        title: 'Failed to update password',
        message: err?.message || 'Please check your current password and try again.',
        color: 'red',
      })
    } finally {
      setChangingPassword(false)
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
                  {editingUsername ? (
                    <Group gap="xs">
                      <TextInput
                        value={usernameInput}
                        onChange={(e) => setUsernameInput(e.currentTarget.value)}
                        size="md"
                        styles={{ input: { fontWeight: 700, fontSize: '1.5rem' } }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleSaveUsername()
                          } else if (e.key === 'Escape') {
                            setEditingUsername(false)
                          }
                        }}
                        disabled={savingUsername}
                        autoFocus
                      />
                      <ActionIcon
                        variant="subtle"
                        color="green"
                        onClick={handleSaveUsername}
                        loading={savingUsername}
                        aria-label="Save username"
                      >
                        <Check size={16} />
                      </ActionIcon>
                      <ActionIcon
                        variant="subtle"
                        color="gray"
                        onClick={() => setEditingUsername(false)}
                        disabled={savingUsername}
                        aria-label="Cancel editing"
                      >
                        <X size={16} />
                      </ActionIcon>
                    </Group>
                  ) : (
                    <Group gap="xs">
                      <Title order={2}>{user?.username}</Title>
                      <ActionIcon
                        variant="subtle"
                        color="gray"
                        onClick={() => {
                          setUsernameInput(user?.username || '')
                          setEditingUsername(true)
                        }}
                        aria-label="Edit username"
                      >
                        <Edit size={14} />
                      </ActionIcon>
                    </Group>
                  )}
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
            {/* Linked Accounts Section */}
            <Card shadow="sm" padding="md" radius="md">
              <Stack gap="md">
                <Text fw={600} size="lg">Linked Accounts</Text>
                <Text size="sm" c="dimmed">Manage which accounts are connected to your profile.</Text>

                <Stack gap="sm">
                  {/* Fluxer Row */}
                  <Group justify="space-between" align="center" style={{ padding: '8px 0' }}>
                    <Group gap="sm">
                      <Box style={{ width: 32, height: 32, borderRadius: '50%', background: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Text size="xs" fw={700} c="white">Fx</Text>
                      </Box>
                      <Stack gap={2}>
                        <Text size="sm" fw={500}>Fluxer</Text>
                        {user?.fluxerId ? (
                          <Text size="xs" c="dimmed">@{user.fluxerUsername || user.fluxerId}</Text>
                        ) : (
                          <Text size="xs" c="dimmed">Not linked</Text>
                        )}
                      </Stack>
                    </Group>
                    {user?.fluxerId ? (
                      <Button
                        size="xs"
                        variant="light"
                        color="red"
                        onClick={() => handleUnlink('fluxer')}
                        loading={unlinkingProvider === 'fluxer'}
                        disabled={!!unlinkingProvider}
                        title="Unlink Fluxer account"
                      >
                        Unlink
                      </Button>
                    ) : (
                      <Button
                        size="xs"
                        variant="light"
                        color="violet"
                        onClick={linkFluxer}
                      >
                        Link Fluxer
                      </Button>
                    )}
                  </Group>
                </Stack>
              </Stack>
            </Card>

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

            {/* My Content Section - Unified Guides, Media, Events, Annotations */}
            <Card shadow="md" padding="lg" radius="md" withBorder>
              <Stack gap="lg">
                {/* Header with Create Menu */}
                <Group justify="space-between" wrap="wrap">
                  <Group gap="sm">
                    <BookOpen size={20} color={getEntityThemeColor(theme, 'guide')} />
                    <Text fw={600} size="lg">My Content</Text>
                  </Group>
                  <Menu shadow="md" width={200}>
                    <Menu.Target>
                      <Button
                        leftSection={<Plus size={16} />}
                        variant="light"
                        color="teal"
                        radius="md"
                      >
                        Create New
                      </Button>
                    </Menu.Target>
                    <Menu.Dropdown>
                      <Menu.Item component={Link} href="/submit-guide" leftSection={<FileText size={14} />}>
                        New Guide
                      </Menu.Item>
                      <Menu.Item component={Link} href="/submit-media" leftSection={<FileImage size={14} />}>
                        New Media
                      </Menu.Item>
                      <Menu.Item component={Link} href="/submit-event" leftSection={<Calendar size={14} />}>
                        New Event
                      </Menu.Item>
                      <Menu.Item component={Link} href="/submit-annotation" leftSection={<MessageSquare size={14} />}>
                        New Annotation
                      </Menu.Item>
                    </Menu.Dropdown>
                  </Menu>
                </Group>

                {/* Quick Stats */}
                <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="sm">
                  <Card withBorder padding="xs" radius="md">
                    <Text size="xs" c="dimmed">Total Approved</Text>
                    <Text size="lg" fw={700} c="green">
                      {submissions.filter(s => s.status === 'approved').length}
                    </Text>
                  </Card>
                  <Card withBorder padding="xs" radius="md">
                    <Text size="xs" c="dimmed">Pending Review</Text>
                    <Text size="lg" fw={700} c="yellow">
                      {submissions.filter(s => s.status === 'pending').length}
                    </Text>
                  </Card>
                  <Card withBorder padding="xs" radius="md">
                    <Text size="xs" c="dimmed">Needs Resubmit</Text>
                    <Text size="lg" fw={700} c="red">
                      {submissions.filter(s => s.status === 'rejected').length}
                    </Text>
                  </Card>
                  <Card withBorder padding="xs" radius="md">
                    <Text size="xs" c="dimmed">Total Submissions</Text>
                    <Text size="lg" fw={700}>
                      {submissions.length}
                    </Text>
                  </Card>
                </SimpleGrid>

                {/* Tabs with Counters */}
                <Tabs
                  value={activeContentTab}
                  onChange={(value) => value && setActiveContentTab(value as ContentTab)}
                  variant="outline"
                  keepMounted={false}
                  color={getEntityThemeColor(theme, 'guide')}
                >
                  <Tabs.List style={{ overflowX: 'auto', flexWrap: 'nowrap', gap: '4px' }}>
                    <Tabs.Tab
                      value="guides"
                      leftSection={<FileText size={16} />}
                      rightSection={contentCounts.guides > 0 ? (
                        <Badge size="xs" variant="light" color="teal" circle>{contentCounts.guides}</Badge>
                      ) : null}
                    >
                      Guides
                    </Tabs.Tab>
                    <Tabs.Tab
                      value="media"
                      leftSection={<FileImage size={16} />}
                      rightSection={contentCounts.media > 0 ? (
                        <Badge size="xs" variant="light" color="violet" circle>{contentCounts.media}</Badge>
                      ) : null}
                    >
                      Media
                    </Tabs.Tab>
                    <Tabs.Tab
                      value="events"
                      leftSection={<Calendar size={16} />}
                      rightSection={contentCounts.events > 0 ? (
                        <Badge size="xs" variant="light" color="orange" circle>{contentCounts.events}</Badge>
                      ) : null}
                    >
                      Events
                    </Tabs.Tab>
                    <Tabs.Tab
                      value="annotations"
                      leftSection={<MessageSquare size={16} />}
                      rightSection={contentCounts.annotations > 0 ? (
                        <Badge size="xs" variant="light" color="blue" circle>{contentCounts.annotations}</Badge>
                      ) : null}
                    >
                      Annotations
                    </Tabs.Tab>
                  </Tabs.List>

                  {/* Guides Panel */}
                  <Tabs.Panel value="guides" pt="md">
                    {(() => {
                      const { filtered, visible, hasMore, remaining } = getFilteredContent('guides')
                      const totalGuides = userGuides.length

                      return (
                        <Stack gap="md">
                          {/* Filter Bar */}
                          <Group gap="sm" wrap="wrap" p="xs" style={{ backgroundColor: 'var(--mantine-color-dark-7)', borderRadius: 'var(--mantine-radius-md)' }}>
                            <TextInput
                              placeholder="Search guides..."
                              leftSection={<Search size={16} />}
                              value={contentFilters.guides.search}
                              onChange={(e) => updateContentFilter('guides', 'search', e.target.value)}
                              rightSection={contentFilters.guides.search && (
                                <ActionIcon
                                  size="sm"
                                  variant="subtle"
                                  onClick={() => updateContentFilter('guides', 'search', '')}
                                >
                                  <X size={14} />
                                </ActionIcon>
                              )}
                              radius="md"
                              style={{ flex: '1 1 200px', minWidth: '150px' }}
                            />
                            <SegmentedControl
                              size="xs"
                              radius="md"
                              value={contentFilters.guides.status}
                              onChange={(v) => handleStatusFilterChange('guides', v)}
                              data={[
                                { label: 'All', value: 'all' },
                                { label: 'Pending', value: 'pending' },
                                { label: 'Approved', value: 'approved' },
                                { label: 'Rejected', value: 'rejected' },
                              ]}
                            />
                          </Group>

                          {/* Content */}
                          {totalGuides === 0 ? (
                            <Alert icon={<BookOpen size={16} />} title="No guides yet" variant="light">
                              <Text>You haven&apos;t created any guides yet. Start sharing your knowledge with the community!</Text>
                            </Alert>
                          ) : filtered.length === 0 ? (
                            <Text size="sm" c="dimmed" ta="center" py="md">
                              No guides match your search or filter.
                            </Text>
                          ) : (
                            <>
                              <Stack gap="sm">
                                {visible.map((guide: UserGuide) => (
                                  <SubmissionCard
                                    key={`guide-${guide.id}`}
                                    submission={{
                                      id: guide.id,
                                      type: 'guide',
                                      title: guide.title,
                                      description: guide.description,
                                      status: guide.status,
                                      rejectionReason: (guide as any).rejectionReason,
                                      createdAt: guide.createdAt,
                                    } as SubmissionItem}
                                    isOwnerView
                                    onDelete={async (id) => {
                                      try {
                                        await api.deleteGuide(id as number)
                                        setSubmissions(prev => prev.filter(s => !(s.type === 'guide' && s.id === id)))
                                        notifications.show({ title: 'Guide deleted', message: 'Your guide has been removed.', color: 'green' })
                                      } catch {
                                        notifications.show({ title: 'Error', message: 'Failed to delete guide.', color: 'red' })
                                      }
                                    }}
                                  />
                                ))}
                              </Stack>
                              {hasMore && (
                                <Button
                                  variant="subtle"
                                  fullWidth
                                  onClick={() => updateContentFilter('guides', 'visible', contentFilters.guides.visible + 6)}
                                >
                                  Show more ({remaining} remaining)
                                </Button>
                              )}
                            </>
                          )}
                        </Stack>
                      )
                    })()}
                  </Tabs.Panel>

                  {/* Media Panel */}
                  <Tabs.Panel value="media" pt="md">
                    {(() => {
                      const { filtered, visible, hasMore, remaining } = getFilteredContent('media')
                      const totalMedia = submissions.filter(s => s.type === 'media').length

                      return (
                        <Stack gap="md">
                          {/* Filter Bar */}
                          <Group gap="sm" wrap="wrap" p="xs" style={{ backgroundColor: 'var(--mantine-color-dark-7)', borderRadius: 'var(--mantine-radius-md)' }}>
                            <TextInput
                              placeholder="Search media..."
                              leftSection={<Search size={16} />}
                              value={contentFilters.media.search}
                              onChange={(e) => updateContentFilter('media', 'search', e.target.value)}
                              rightSection={contentFilters.media.search && (
                                <ActionIcon
                                  size="sm"
                                  variant="subtle"
                                  onClick={() => updateContentFilter('media', 'search', '')}
                                >
                                  <X size={14} />
                                </ActionIcon>
                              )}
                              radius="md"
                              style={{ flex: '1 1 200px', minWidth: '150px' }}
                            />
                            <SegmentedControl
                              size="xs"
                              radius="md"
                              value={contentFilters.media.status}
                              onChange={(v) => handleStatusFilterChange('media', v)}
                              data={[
                                { label: 'All', value: 'all' },
                                { label: 'Pending', value: 'pending' },
                                { label: 'Approved', value: 'approved' },
                                { label: 'Rejected', value: 'rejected' },
                              ]}
                            />
                          </Group>

                          {/* Content */}
                          {totalMedia === 0 ? (
                            <Alert icon={<FileImage size={16} />} title="No media submitted" variant="light">
                              <Text>You haven&apos;t submitted any media yet. Share fan art, screenshots, or other media!</Text>
                            </Alert>
                          ) : filtered.length === 0 ? (
                            <Text size="sm" c="dimmed" ta="center" py="md">
                              No media matches your search or filter.
                            </Text>
                          ) : (
                            <>
                              <Stack gap="sm">
                                {visible.map((submission: any) => (
                                  <SubmissionCard
                                    key={`media-${submission.id}`}
                                    submission={submission as SubmissionItem}
                                    isOwnerView
                                    onDelete={async (id) => {
                                      try {
                                        await api.deleteMedia(id as string)
                                        setSubmissions(prev => prev.filter(s => !(s.type === 'media' && s.id === id)))
                                        notifications.show({ title: 'Media deleted', message: 'You can resubmit a new version.', color: 'green' })
                                      } catch {
                                        notifications.show({ title: 'Error', message: 'Failed to delete media.', color: 'red' })
                                      }
                                    }}
                                  />
                                ))}
                              </Stack>
                              {hasMore && (
                                <Button
                                  variant="subtle"
                                  fullWidth
                                  onClick={() => updateContentFilter('media', 'visible', contentFilters.media.visible + 10)}
                                >
                                  Show more ({remaining} remaining)
                                </Button>
                              )}
                            </>
                          )}
                        </Stack>
                      )
                    })()}
                  </Tabs.Panel>

                  {/* Events Panel */}
                  <Tabs.Panel value="events" pt="md">
                    {(() => {
                      const { filtered, visible, hasMore, remaining } = getFilteredContent('events')
                      const totalEvents = submissions.filter(s => s.type === 'event').length

                      return (
                        <Stack gap="md">
                          {/* Filter Bar */}
                          <Group gap="sm" wrap="wrap" p="xs" style={{ backgroundColor: 'var(--mantine-color-dark-7)', borderRadius: 'var(--mantine-radius-md)' }}>
                            <TextInput
                              placeholder="Search events..."
                              leftSection={<Search size={16} />}
                              value={contentFilters.events.search}
                              onChange={(e) => updateContentFilter('events', 'search', e.target.value)}
                              rightSection={contentFilters.events.search && (
                                <ActionIcon
                                  size="sm"
                                  variant="subtle"
                                  onClick={() => updateContentFilter('events', 'search', '')}
                                >
                                  <X size={14} />
                                </ActionIcon>
                              )}
                              radius="md"
                              style={{ flex: '1 1 200px', minWidth: '150px' }}
                            />
                            <SegmentedControl
                              size="xs"
                              radius="md"
                              value={contentFilters.events.status}
                              onChange={(v) => handleStatusFilterChange('events', v)}
                              data={[
                                { label: 'All', value: 'all' },
                                { label: 'Pending', value: 'pending' },
                                { label: 'Approved', value: 'approved' },
                                { label: 'Rejected', value: 'rejected' },
                              ]}
                            />
                          </Group>

                          {/* Content */}
                          {totalEvents === 0 ? (
                            <Alert icon={<Calendar size={16} />} title="No events submitted" variant="light">
                              <Text>You haven&apos;t submitted any events yet. Help document story events on character, arc, or gamble pages!</Text>
                            </Alert>
                          ) : filtered.length === 0 ? (
                            <Text size="sm" c="dimmed" ta="center" py="md">
                              No events match your search or filter.
                            </Text>
                          ) : (
                            <>
                              <Stack gap="sm">
                                {visible.map((submission: any) => (
                                  <SubmissionCard
                                    key={`event-${submission.id}`}
                                    submission={submission as SubmissionItem}
                                    isOwnerView
                                    onDelete={async (id) => {
                                      try {
                                        await api.deleteEvent(id as number)
                                        setSubmissions(prev => prev.filter(s => !(s.type === 'event' && s.id === id)))
                                        notifications.show({ title: 'Event deleted', message: 'Your event has been removed.', color: 'green' })
                                      } catch {
                                        notifications.show({ title: 'Error', message: 'Failed to delete event.', color: 'red' })
                                      }
                                    }}
                                  />
                                ))}
                              </Stack>
                              {hasMore && (
                                <Button
                                  variant="subtle"
                                  fullWidth
                                  onClick={() => updateContentFilter('events', 'visible', contentFilters.events.visible + 10)}
                                >
                                  Show more ({remaining} remaining)
                                </Button>
                              )}
                            </>
                          )}
                        </Stack>
                      )
                    })()}
                  </Tabs.Panel>

                  {/* Annotations Panel */}
                  <Tabs.Panel value="annotations" pt="md">
                    {(() => {
                      const { filtered, visible, hasMore, remaining } = getFilteredContent('annotations')
                      const totalAnnotations = submissions.filter(s => s.type === 'annotation').length

                      return (
                        <Stack gap="md">
                          {/* Filter Bar */}
                          <Group gap="sm" wrap="wrap" p="xs" style={{ backgroundColor: 'var(--mantine-color-dark-7)', borderRadius: 'var(--mantine-radius-md)' }}>
                            <TextInput
                              placeholder="Search annotations..."
                              leftSection={<Search size={16} />}
                              value={contentFilters.annotations.search}
                              onChange={(e) => updateContentFilter('annotations', 'search', e.target.value)}
                              rightSection={contentFilters.annotations.search && (
                                <ActionIcon
                                  size="sm"
                                  variant="subtle"
                                  onClick={() => updateContentFilter('annotations', 'search', '')}
                                >
                                  <X size={14} />
                                </ActionIcon>
                              )}
                              radius="md"
                              style={{ flex: '1 1 200px', minWidth: '150px' }}
                            />
                            <SegmentedControl
                              size="xs"
                              radius="md"
                              value={contentFilters.annotations.status}
                              onChange={(v) => handleStatusFilterChange('annotations', v)}
                              data={[
                                { label: 'All', value: 'all' },
                                { label: 'Pending', value: 'pending' },
                                { label: 'Approved', value: 'approved' },
                                { label: 'Rejected', value: 'rejected' },
                              ]}
                            />
                          </Group>

                          {/* Content */}
                          {totalAnnotations === 0 ? (
                            <Alert icon={<MessageSquare size={16} />} title="No annotations yet" variant="light">
                              <Text>You haven&apos;t added any annotations yet. Add annotations to characters, gambles, or arcs!</Text>
                            </Alert>
                          ) : filtered.length === 0 ? (
                            <Text size="sm" c="dimmed" ta="center" py="md">
                              No annotations match your search or filter.
                            </Text>
                          ) : (
                            <>
                              <Stack gap="sm">
                                {visible.map((submission: any) => (
                                  <SubmissionCard
                                    key={`annotation-${submission.id}`}
                                    submission={submission as SubmissionItem}
                                    isOwnerView
                                    onDelete={async (id) => {
                                      try {
                                        await api.deleteAnnotation(id as number)
                                        setSubmissions(prev => prev.filter(s => !(s.type === 'annotation' && s.id === id)))
                                        notifications.show({ title: 'Annotation deleted', message: 'Your annotation has been removed.', color: 'green' })
                                      } catch {
                                        notifications.show({ title: 'Error', message: 'Failed to delete annotation.', color: 'red' })
                                      }
                                    }}
                                  />
                                ))}
                              </Stack>
                              {hasMore && (
                                <Button
                                  variant="subtle"
                                  fullWidth
                                  onClick={() => updateContentFilter('annotations', 'visible', contentFilters.annotations.visible + 10)}
                                >
                                  Show more ({remaining} remaining)
                                </Button>
                              )}
                            </>
                          )}
                        </Stack>
                      )
                    })()}
                  </Tabs.Panel>
                </Tabs>
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

            {/* Account Security Section */}
            <Card shadow="sm" padding="md" radius="md">
              <Stack gap="md">
                <Text fw={600} size="lg">Account Security</Text>

                {/* Change Email */}
                <Stack gap="xs">
                  <Text fw={500} size="md">Change Email</Text>
                  <Text size="sm" c="dimmed">
                    {user?.email
                      ? <>Current email: <strong>{user.email}</strong></>
                      : 'No email address set.'}
                  </Text>
                  <form onSubmit={handleChangeEmail}>
                    <Stack gap="xs">
                      <TextInput
                        label="New Email Address"
                        type="email"
                        placeholder="you@example.com"
                        value={changeEmailForm.newEmail}
                        onChange={(e) => setChangeEmailForm(prev => ({ ...prev, newEmail: e.currentTarget.value }))}
                        required
                        disabled={changingEmail}
                      />
                      {/* Only show current password if the account has one (i.e. has an email = was registered, not Fluxer-only) */}
                      {user?.email && (
                        <PasswordInput
                          label="Current Password"
                          placeholder="Confirm with your current password"
                          value={changeEmailForm.currentPassword}
                          onChange={(e) => setChangeEmailForm(prev => ({ ...prev, currentPassword: e.currentTarget.value }))}
                          required
                          disabled={changingEmail}
                        />
                      )}
                      <Button
                        type="submit"
                        size="sm"
                        loading={changingEmail}
                        disabled={changingEmail || !changeEmailForm.newEmail || (!!user?.email && !changeEmailForm.currentPassword)}
                        style={{ alignSelf: 'flex-start' }}
                      >
                        Update Email
                      </Button>
                    </Stack>
                  </form>
                </Stack>

                <Divider />

                {/* Change / Set Password */}
                <Stack gap="xs">
                  <Text fw={500} size="md">
                    {user?.email ? 'Change Password' : 'Set a Password'}
                  </Text>
                  {!user?.email && (
                    <Text size="sm" c="dimmed">
                      Add a password to your account so you can log in with email as well as Fluxer.
                    </Text>
                  )}
                  <form onSubmit={handleChangePassword}>
                    <Stack gap="xs">
                      {/* Show current password field only for accounts that already have a password (have email = registered with email) */}
                      {user?.email && (
                        <PasswordInput
                          label="Current Password"
                          placeholder="Your current password"
                          value={changePasswordForm.currentPassword}
                          onChange={(e) => setChangePasswordForm(prev => ({ ...prev, currentPassword: e.currentTarget.value }))}
                          required
                          disabled={changingPassword}
                        />
                      )}
                      <PasswordInput
                        label="New Password"
                        placeholder="At least 8 characters, uppercase, lowercase, number"
                        value={changePasswordForm.newPassword}
                        onChange={(e) => setChangePasswordForm(prev => ({ ...prev, newPassword: e.currentTarget.value }))}
                        required
                        disabled={changingPassword}
                        description="8–128 characters · uppercase · lowercase · number"
                      />
                      <PasswordInput
                        label="Confirm New Password"
                        placeholder="Repeat your new password"
                        value={changePasswordForm.confirmPassword}
                        onChange={(e) => setChangePasswordForm(prev => ({ ...prev, confirmPassword: e.currentTarget.value }))}
                        required
                        disabled={changingPassword}
                        error={
                          changePasswordForm.confirmPassword && changePasswordForm.newPassword !== changePasswordForm.confirmPassword
                            ? 'Passwords do not match'
                            : undefined
                        }
                      />
                      <Button
                        type="submit"
                        size="sm"
                        loading={changingPassword}
                        disabled={
                          changingPassword ||
                          !changePasswordForm.newPassword ||
                          !changePasswordForm.confirmPassword ||
                          (!!user?.email && !changePasswordForm.currentPassword)
                        }
                        style={{ alignSelf: 'flex-start' }}
                      >
                        {user?.email ? 'Change Password' : 'Set Password'}
                      </Button>
                    </Stack>
                  </form>
                </Stack>
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
