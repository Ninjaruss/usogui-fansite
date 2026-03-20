'use client'

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Box, Container, Skeleton, SimpleGrid, Stack, Tabs, Group, Text, Button, Alert, ActionIcon } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { motion } from 'motion/react'
import { User as UserIcon, X } from 'lucide-react'
import Link from 'next/link'

import { useAuth } from '../../providers/AuthProvider'
import { api } from '../../lib/api'
import { GuideStatus } from '../../types'
import { invalidatePagedCache } from '../../lib/cache-utils'
import { outlineStyles } from '../../lib/mantine-theme'

import QuoteSelectionPopup from '../../components/QuoteSelectionPopup'
import GambleSelectionPopup from '../../components/GambleSelectionPopup'
import ProfilePictureSelector from '../../components/ProfilePictureSelector'

import ProfileHeader from './ProfileHeader'
import ProfileIntelPanel from './ProfileIntelPanel'
import ProfileFieldLog from './ProfileFieldLog'
import ProfileProgressReport from './ProfileProgressReport'
import ProfileContentTabs from './ProfileContentTabs'
import ProfileSettingsPanel from './ProfileSettingsPanel'

interface UserGuide {
  id: number
  title: string
  description?: string
  status: GuideStatus
  createdAt: string
  updatedAt: string
  rejectionReason?: string
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────
function ProfileSkeleton() {
  return (
    <Container size="lg" py="xl">
      <Stack gap="xl">
        {/* Header */}
        <Box style={{ background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: '4px', padding: '20px 24px' }}>
          <Skeleton height={8} width={160} mb={12} />
          <SimpleGrid cols={2}>
            <Stack gap="sm">
              <Skeleton circle height={72} width={72} />
              <Skeleton height={32} width={200} />
              <Skeleton height={20} width={150} />
            </Stack>
            <Skeleton height={60} />
          </SimpleGrid>
          <SimpleGrid cols={4} mt="md" spacing="xs">
            {[1,2,3,4].map(i => <Skeleton key={i} height={36} />)}
          </SimpleGrid>
        </Box>
        {/* Section grid */}
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
          <Skeleton height={280} radius="sm" />
          <Skeleton height={280} radius="sm" />
        </SimpleGrid>
        <Skeleton height={80} radius="sm" />
        <Skeleton height={240} radius="sm" />
      </Stack>
    </Container>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function ProfilePageClient() {
  const { user, loading: authLoading, refreshUser, linkFluxer } = useAuth()

  const [profileData, setProfileData] = useState({ favoriteQuote: '', favoriteGamble: '', customRole: '' })
  const [userGuides, setUserGuides] = useState<UserGuide[]>([])
  const [quotes, setQuotes] = useState<any[]>([])
  const [gambles, setGambles] = useState<any[]>([])
  const [userBadges, setUserBadges] = useState<any[]>([])
  const [submissions, setSubmissions] = useState<any[]>([])
  const [submissionEdits, setSubmissionEdits] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [savingCustomRole, setSavingCustomRole] = useState(false)
  const initialCustomRoleRef = useRef<string>('')

  const [profileTab, setProfileTab] = useState<'general' | 'settings'>('general')
  const [quoteModalOpened, { open: openQuoteModal, close: closeQuoteModal }] = useDisclosure(false)
  const [gambleModalOpened, { open: openGambleModal, close: closeGambleModal }] = useDisclosure(false)
  const [profilePictureSelectorOpened, { open: openProfilePictureSelector, close: closeProfilePictureSelector }] = useDisclosure(false)

  const isAuthenticated = !!user

  const hasActiveSupporterBadge = userBadges.some(ub => ub.badge?.type === 'active_supporter')

  const stats = useMemo(() => ({
    guides:      userGuides.length,
    media:       submissions.filter(s => s.type === 'media').length,
    annotations: submissions.filter(s => s.type === 'annotation').length,
  }), [userGuides, submissions])

  const loadProfileData = useCallback(async () => {
    try {
      setLoading(true)
      let favoriteQuoteId: number | null = null
      let favoriteGambleId: number | null = null

      try {
        const profileResp = await api.get('/users/profile')
        const data = (profileResp as any).data || profileResp
        const initialCustomRole = user?.customRole || data.customRole || ''
        initialCustomRoleRef.current = initialCustomRole
        setProfileData({
          favoriteQuote: data.favoriteQuoteId ? String(data.favoriteQuoteId) : '',
          favoriteGamble: data.favoriteGambleId ? String(data.favoriteGambleId) : '',
          customRole: initialCustomRole,
        })
        favoriteQuoteId = data.favoriteQuoteId ?? null
        favoriteGambleId = data.favoriteGambleId ?? null

        const [favQuoteResp, favGambleResp] = await Promise.all([
          favoriteQuoteId ? api.getQuote(favoriteQuoteId) : Promise.resolve(null),
          favoriteGambleId ? api.getGamble(favoriteGambleId) : Promise.resolve(null),
        ])
        const favQuote = favQuoteResp?.data ?? favQuoteResp
        const favGamble = favGambleResp?.data ?? favGambleResp
        if (favQuote) setQuotes(prev => prev.find(q => q.id === favQuote.id) ? prev : [...prev, favQuote])
        if (favGamble) setGambles(prev => prev.find(g => g.id === favGamble.id) ? prev : [...prev, favGamble])
      } catch (err) {
        console.error('Failed to fetch profile or favorites:', err)
      }

      const [guidesRes, quotesRes, gamblesRes, badgesRes, submissionsRes] = await Promise.allSettled([
        api.get('/guides/my-guides'),
        api.get('/quotes?limit=100'),
        api.get('/gambles?limit=100'),
        user?.id && typeof user.id === 'number' ? api.getUserBadges(user.id) : Promise.resolve([]),
        api.getUserSubmissions(),
      ])

      if (guidesRes.status === 'fulfilled') setUserGuides((guidesRes.value as any).data)
      if (quotesRes.status === 'fulfilled') {
        const fetched = (quotesRes.value as any).data || []
        setQuotes(prev => { const ids = new Set(prev.map(q => q.id)); return [...prev, ...fetched.filter((q: any) => !ids.has(q.id))] })
      }
      if (gamblesRes.status === 'fulfilled') {
        const fetched = (gamblesRes.value as any).data || []
        setGambles(prev => { const ids = new Set(prev.map(g => g.id)); return [...prev, ...fetched.filter((g: any) => !ids.has(g.id))] })
      }
      if (badgesRes.status === 'fulfilled') {
        const d = badgesRes.value as any
        setUserBadges(Array.isArray(d) ? d : d?.data || [])
      }
      if (submissionsRes.status === 'fulfilled') {
        const d = submissionsRes.value as any
        setSubmissions(Array.isArray(d) ? d : d?.data || [])
      }
    } catch (err) {
      console.error('Failed to load profile data:', err)
      notifications.show({ title: 'Error', message: 'Failed to load profile data', color: 'red' })
    } finally {
      setLoading(false)
    }
  }, [user, refreshUser])

  useEffect(() => {
    if (isAuthenticated && user) loadProfileData()
    else if (!authLoading && !isAuthenticated) setLoading(false)
  }, [isAuthenticated, user, authLoading, loadProfileData])

  useEffect(() => {
    if (isAuthenticated && user) {
      api.getMySubmissionEdits()
        .then((res: any) => {
          const data = Array.isArray(res) ? res : res?.data || []
          setSubmissionEdits(data)
        })
        .catch(() => {}) // Non-critical; activity feed degrades gracefully
    }
  }, [isAuthenticated, user])

  const handleSaveUsername = useCallback(async (username: string) => {
    await api.patch('/users/profile', { username })
    await refreshUser()
    invalidatePagedCache('users')
    notifications.show({ title: 'Username updated', message: 'Your username has been changed successfully', color: 'green' })
  }, [refreshUser])

  const handleProfilePictureSelect = useCallback(async (type: string, mediaId?: number) => {
    closeProfilePictureSelector()
    try {
      const updateData: any = { profilePictureType: type }
      if (mediaId) updateData.selectedCharacterMediaId = mediaId
      await api.patch('/users/profile', updateData)
      await refreshUser()
      invalidatePagedCache('users')
      notifications.show({ title: 'Success', message: 'Profile picture updated successfully', color: 'green' })
    } catch {
      notifications.show({ title: 'Error', message: 'Failed to update profile picture', color: 'red' })
    }
  }, [closeProfilePictureSelector, refreshUser])

  const handleQuoteSelect = useCallback(async (quoteId: number | null) => {
    setProfileData(prev => ({ ...prev, favoriteQuote: quoteId ? String(quoteId) : '' }))
    closeQuoteModal()
    try {
      await api.patch('/users/profile', { favoriteQuoteId: quoteId })
      notifications.show({ title: 'Success', message: 'Favorite quote updated', color: 'green' })
    } catch {
      notifications.show({ title: 'Error', message: 'Failed to update favorite quote', color: 'red' })
    }
  }, [closeQuoteModal])

  const handleGambleSelect = useCallback(async (gambleId: number | null) => {
    setProfileData(prev => ({ ...prev, favoriteGamble: gambleId ? String(gambleId) : '' }))
    closeGambleModal()
    try {
      await api.patch('/users/profile', { favoriteGambleId: gambleId })
      notifications.show({ title: 'Success', message: 'Favorite gamble updated', color: 'green' })
    } catch {
      notifications.show({ title: 'Error', message: 'Failed to update favorite gamble', color: 'red' })
    }
  }, [closeGambleModal])

  const handleSaveCustomRole = useCallback(async () => {
    if (!hasActiveSupporterBadge) return
    setSavingCustomRole(true)
    try {
      await api.patch('/users/profile/custom-role', { customRole: profileData.customRole })
      await refreshUser()
      initialCustomRoleRef.current = profileData.customRole
      notifications.show({ title: 'Success', message: 'Custom role saved', color: 'green' })
    } catch {
      notifications.show({ title: 'Error', message: 'Failed to save custom role', color: 'red' })
    } finally {
      setSavingCustomRole(false)
    }
  }, [hasActiveSupporterBadge, refreshUser, profileData.customRole])

  const handleUnlinkFluxer = useCallback(async () => {
    await api.unlinkFluxer()
    await refreshUser()
  }, [refreshUser])

  const handleDeleteGuide = useCallback(async (id: number) => {
    await api.deleteGuide(id)
    setUserGuides(prev => prev.filter(g => g.id !== id))
    notifications.show({ title: 'Guide deleted', message: 'Your guide has been removed.', color: 'green' })
  }, [])

  const handleDeleteMedia = useCallback(async (id: string) => {
    await api.deleteMedia(id)
    setSubmissions(prev => prev.filter(s => !(s.type === 'media' && s.id === id)))
    notifications.show({ title: 'Media deleted', message: 'You can resubmit a new version.', color: 'green' })
  }, [])

  const handleDeleteEvent = useCallback(async (id: number) => {
    await api.deleteEvent(id)
    setSubmissions(prev => prev.filter(s => !(s.type === 'event' && s.id === id)))
    notifications.show({ title: 'Event deleted', message: 'Your event has been removed.', color: 'green' })
  }, [])

  const handleDeleteAnnotation = useCallback(async (id: number) => {
    await api.deleteAnnotation(id)
    setSubmissions(prev => prev.filter(s => !(s.type === 'annotation' && s.id === id)))
    notifications.show({ title: 'Annotation deleted', message: 'Your annotation has been removed.', color: 'green' })
  }, [])

  if (authLoading) return <ProfileSkeleton />

  if (!isAuthenticated) {
    return (
      <Container size="lg" py="xl">
        <Alert icon={<UserIcon size={16} />} title="Authentication Required" variant="light">
          <Stack gap="md">
            <Text>You need to be logged in to view your profile.</Text>
            <Button component={Link} href={`/login?returnUrl=${encodeURIComponent('/profile')}`} variant="filled">Log In</Button>
          </Stack>
        </Alert>
      </Container>
    )
  }

  if (loading) return <ProfileSkeleton />

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <Container size="lg" py="xl">
        <Stack gap={0}>
          {/* Header */}
          <ProfileHeader
            user={user!}
            stats={stats}
            onOpenProfilePictureSelector={openProfilePictureSelector}
            onSaveUsername={handleSaveUsername}
            onToggleSettings={() => setProfileTab(prev => prev === 'settings' ? 'general' : 'settings')}
            isSettingsOpen={profileTab === 'settings'}
          />

          {/* Inline profile picture selector */}
          {profilePictureSelectorOpened && user?.id && typeof user.id === 'number' && (
            <Box style={{ background: '#0d0d0d', border: '1px solid #1a1a1a', borderTop: 'none', padding: '16px' }}>
              <Group justify="space-between" mb="sm">
                <Text size="sm" fw={600}>Profile Picture Options</Text>
                <ActionIcon variant="subtle" onClick={closeProfilePictureSelector} aria-label="Close">
                  <X size={16} />
                </ActionIcon>
              </Group>
              <ProfilePictureSelector
                currentUserId={user.id}
                currentProfileType="default"
                currentSelectedMediaId={null}
                onSelect={handleProfilePictureSelect}
              />
            </Box>
          )}

          {/* Tab switcher (hidden visually, controlled by gear icon) */}
          <Tabs
            value={profileTab}
            onChange={(v) => v && setProfileTab(v as 'general' | 'settings')}
            variant="outline"
            keepMounted={false}
            color={outlineStyles.accentColor}
          >
            <Tabs.List style={{ display: 'none' }}>
              <Tabs.Tab value="general">General</Tabs.Tab>
              <Tabs.Tab value="settings">Settings</Tabs.Tab>
            </Tabs.List>

            {/* General tab */}
            <Tabs.Panel value="general">
              <Box style={{ padding: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}
                className="profile-section-grid">
                <ProfileIntelPanel
                  quotes={quotes}
                  gambles={gambles}
                  favoriteQuoteId={profileData.favoriteQuote}
                  favoriteGambleId={profileData.favoriteGamble}
                  loading={loading}
                  onOpenQuoteModal={openQuoteModal}
                  onOpenGambleModal={openGambleModal}
                />
                <ProfileFieldLog
                  guides={userGuides}
                  submissions={submissions}
                  user={user!}
                  submissionEdits={submissionEdits}
                />
                <Box style={{ gridColumn: '1 / -1' }}>
                  <ProfileProgressReport userProgress={user?.userProgress ?? 0} />
                </Box>
                <Box style={{ gridColumn: '1 / -1' }}>
                  <ProfileContentTabs
                    userGuides={userGuides}
                    submissions={submissions}
                    onDeleteGuide={handleDeleteGuide}
                    onDeleteMedia={handleDeleteMedia}
                    onDeleteEvent={handleDeleteEvent}
                    onDeleteAnnotation={handleDeleteAnnotation}
                  />
                </Box>
              </Box>
            </Tabs.Panel>

            {/* Settings tab */}
            <Tabs.Panel value="settings">
              <Box p="md">
                <ProfileSettingsPanel
                  user={user!}
                  hasActiveSupporterBadge={hasActiveSupporterBadge}
                  customRole={profileData.customRole}
                  initialCustomRole={initialCustomRoleRef.current}
                  savingCustomRole={savingCustomRole}
                  onCustomRoleChange={(role) => setProfileData(prev => ({ ...prev, customRole: role }))}
                  onSaveCustomRole={handleSaveCustomRole}
                  onLinkFluxer={linkFluxer}
                  onUnlinkFluxer={handleUnlinkFluxer}
                  onRefreshUser={refreshUser}
                />
              </Box>
            </Tabs.Panel>
          </Tabs>
        </Stack>
      </Container>

      {/* Modals */}
      <QuoteSelectionPopup
        open={quoteModalOpened}
        onClose={closeQuoteModal}
        quotes={quotes}
        selectedQuoteId={profileData.favoriteQuote ? parseInt(profileData.favoriteQuote) : null}
        onSelectQuote={handleQuoteSelect}
        loading={loading}
      />
      <GambleSelectionPopup
        open={gambleModalOpened}
        onClose={closeGambleModal}
        gambles={gambles}
        selectedGambleId={profileData.favoriteGamble ? parseInt(profileData.favoriteGamble) : null}
        onSelectGamble={handleGambleSelect}
        loading={loading}
      />
    </motion.div>
  )
}
