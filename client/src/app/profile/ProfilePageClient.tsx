'use client'

import React, { useState, useEffect } from 'react'
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
import {
  User,
  BookOpen,
  Edit,
  X,
  FileText
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
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [quoteModalOpened, { open: openQuoteModal, close: closeQuoteModal }] = useDisclosure(false)
  const [gambleModalOpened, { open: openGambleModal, close: closeGambleModal }] = useDisclosure(false)
  const [profilePictureSelectorOpened, { open: openProfilePictureSelector, close: closeProfilePictureSelector }] = useDisclosure(false)

  const isAuthenticated = !!user

  // Check if user has active supporter badge
  const hasActiveSupporterBadge = userBadges.some(userBadge => 
    userBadge.badge?.type === 'active_supporter'
  )

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
        setProfileData({
          favoriteCharacter: responseData.favoriteCharacter || '',
          favoriteQuote: responseData.favoriteQuoteId ? responseData.favoriteQuoteId.toString() : '',
          favoriteGamble: responseData.favoriteGambleId ? responseData.favoriteGambleId.toString() : '',
          customRole: user?.customRole || responseData.customRole || ''
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

      // Then fetch other resources concurrently
      const [guidesResponse, quotesResponse, gamblesResponse, badgesResponse] = await Promise.allSettled([
        api.get('/guides/my-guides'),
        api.get('/quotes'),
        api.get('/gambles'),
        user?.id && typeof user.id === 'number' ? api.getUserBadges(user.id) : Promise.resolve([])
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
    return (
      <Container size="lg" py="xl">
        <Center h={300}>
          <Loader size="lg" />
        </Center>
      </Container>
    )
  }

  if (!isAuthenticated) {
    return (
      <Container size="lg" py="xl">
        <Alert
          icon={<User size={16} />}
          title="Authentication Required"
          color="blue"
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
    return (
      <Container size="lg" py="xl">
        <Center h={300}>
          <Loader size="lg" />
        </Center>
      </Container>
    )
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
                }}
                onMouseLeave={(e: any) => {
                  e.currentTarget.style.transform = 'scale(1)'
                  e.currentTarget.style.boxShadow = 'none'
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
                <UserProfileImage user={user} size={120} />
                <Box
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    backgroundColor: theme.colors.blue[6],
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: `2px solid ${theme.white}`,
                    opacity: 0.8
                  }}
                >
                  <Edit size={16} color="white" />
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
                  <ActionIcon variant="subtle" onClick={closeProfilePictureSelector}>
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
                    <Box 
                      style={{ 
                        cursor: 'pointer',
                        padding: '8px',
                        borderRadius: '4px',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent'
                      }}
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
                    >
                      <Text size="sm" c={profileData.favoriteQuote ? undefined : 'dimmed'}>
                        {loading ? 'Loading...' : 
                         profileData.favoriteQuote ? 
                          (() => {
                            const selectedQuote = quotes.find(q => q.id === parseInt(profileData.favoriteQuote) || 0);
                            if (selectedQuote?.text) {
                              return selectedQuote.text.length > 100 
                                ? selectedQuote.text.substring(0, 100) + '...'
                                : selectedQuote.text;
                            }
                            return 'Selected quote not found';
                          })()
                          : 'Click to select a favorite quote'}
                      </Text>
                    </Box>
                  </Stack>

                  <Stack gap="sm">
                    <Text size="sm" fw={500}>Favorite Gamble:</Text>
                    <Box 
                      style={{ 
                        cursor: 'pointer',
                        padding: '8px',
                        borderRadius: '4px',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent'
                      }}
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
                    >
                      {loading ? (
                        <Text size="sm" c="dimmed">Loading...</Text>
                      ) : profileData.favoriteGamble ? (
                        (() => {
                          const selected = gambles.find(g => g.id === parseInt(profileData.favoriteGamble) || 0)
                          return selected ? (
                            <Link href={`/gambles/${selected.id}`} style={{ textDecoration: 'none', display: 'inline-block' }}>
                              <Badge radius="lg" variant="outline" size="sm" style={{ borderColor: (theme.colors as any).gamble?.[5] ?? theme.colors.red[6], color: (theme.colors as any).gamble?.[5] ?? theme.colors.red[6], fontWeight: 700 }}>
                                {selected.name}
                              </Badge>
                            </Link>
                          ) : (
                            <Text size="sm" c="dimmed">Selected gamble not found</Text>
                          )
                        })()
                      ) : (
                        <Text size="sm" c="dimmed">Click to select a favorite gamble</Text>
                      )}
                    </Box>
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
                    <Alert color="blue" variant="light">
                      <Stack gap="xs">
                        <Text size="sm" fw={500}>Custom roles are exclusive to active supporters!</Text>
                        <Text size="sm">
                          Support us on Ko-fi to unlock custom role customization and help keep this fansite running.
                        </Text>
                        <Button 
                          component="a" 
                          href="https://ko-fi.com" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          size="sm"
                          color="blue"
                        >
                          Support on Ko-fi
                        </Button>
                      </Stack>
                    </Alert>
                  ) : (
                    <>
                      <Text size="sm" c="dimmed">
                        Customize how your role appears to other users
                      </Text>
                      <Group gap="md">
                        <TextInput
                          placeholder="Enter custom role (e.g., 'Gambling Expert')"
                          value={profileData.customRole}
                          onChange={(e) => setProfileData(prev => ({ ...prev, customRole: e.target.value }))}
                          style={{ flex: 1 }}
                          maxLength={50}
                        />
                        <Button 
                          onClick={async () => {
                            try {
                              setSaving(true)
                              await api.patch('/users/profile/custom-role', { customRole: profileData.customRole })
                              await refreshUser()
                              notifications.show({
                                title: 'Success',
                                message: 'Custom role updated successfully',
                                color: 'green'
                              })
                            } catch (error) {
                              notifications.show({
                                title: 'Error',
                                message: 'Failed to update custom role',
                                color: 'red'
                              })
                            } finally {
                              setSaving(false)
                            }
                          }}
                          loading={saving}
                          size="sm"
                        >
                          Save
                        </Button>
                      </Group>
                    </>
                  )}
                </Stack>
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
