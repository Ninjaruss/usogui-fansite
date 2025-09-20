'use client'

import React, { useState, useEffect } from 'react'
import {
  Alert,
  Badge,
  Box,
  Card,
  Container,
  Grid,
  Group,
  Loader,
  Pagination,
  Progress,
  Stack,
  Text,
  TextInput,
  Title,
  rem,
  useMantineTheme
} from '@mantine/core'
import { Search, Users, BookOpen } from 'lucide-react'
import Link from 'next/link'
import { api } from '../../lib/api'
import { motion } from 'motion/react'
import UserProfileImage from '../../components/UserProfileImage'
import UserBadges from '../../components/UserBadges'
import { UserRoleDisplay } from '../../components/BadgeDisplay'

interface PublicUser {
  id: number
  username: string
  role: string
  customRole?: string | null
  userProgress: number
  profilePictureType?: 'discord' | 'character_media' | null
  selectedCharacterMediaId?: number | null
  selectedCharacterMedia?: {
    id: number
    url: string
    fileName?: string
    description?: string
    ownerType?: string
    ownerId?: number
  } | null
  discordId?: string | null
  discordAvatar?: string | null
  createdAt: string
  guidesCount?: number
}

export default function UsersPageContent() {
  const theme = useMantineTheme()
  const [users, setUsers] = useState<PublicUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [total, setTotal] = useState(0)

  const limit = 12

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const params: any = { page, limit }
      if (searchTerm.trim()) {
        params.username = searchTerm
      }

      const response = await api.getPublicUsers(params)
      setUsers(response.data)
      setTotalPages(response.totalPages)
      setTotal(response.total)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchUsers()
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [page, searchTerm])

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value)
    setPage(1) // Reset to first page when searching
  }

  const handlePageChange = (value: number) => {
    setPage(value)
  }

  if (error) {
    return (
      <Container size="lg" py="xl">
        <Alert color="red" variant="light">
          {error}
        </Alert>
      </Container>
    )
  }

  return (
    <Container size="lg" py="xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Stack ta="center" gap="sm" mb="xl">
          <Users size={48} style={{ margin: '0 auto 16px' }} />
          <Title order={2} component="h1">
            Community
          </Title>
          <Text size="lg" c="dimmed">
            Meet the L-file community members
          </Text>
        </Stack>

        <TextInput
          size="md"
          placeholder="Search users by username..."
          value={searchTerm}
          onChange={handleSearch}
          leftSection={<Search size={18} />}
          mb="lg"
        />

        {loading ? (
          <Box style={{ display: 'flex', justifyContent: 'center', paddingBlock: theme.spacing.xl }}>
            <Loader size="lg" />
          </Box>
        ) : (
          <>
            <Text size="sm" c="dimmed" mb="md">
              {total} community members
            </Text>

            <Grid gutter="xl">
              {users.map((user) => {
                const progressPercentage = Math.round((user.userProgress / 539) * 100)
                
                return (
                  <Grid.Col span={{ base: 12, sm: 6, md: 4 }} key={user.id}>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }}
                      whileHover={{ y: -4, transition: { duration: 0.2 } }}
                    >
                      <Card
                        className="gambling-card"
                        shadow="lg"
                        radius="md"
                        withBorder
                        style={{ height: '100%' }}
                      >
                        <Stack gap="md" align="center" p="xl" style={{ height: '100%' }}>
                          <UserProfileImage
                            user={user}
                            size={60}
                            showFallback={true}
                            className="user-profile-avatar"
                          />

                          <Text
                            component={Link}
                            href={`/users/${user.id}`}
                            fw={600}
                            c={theme.other?.usogui?.red ?? theme.colors.red[5]}
                            ta="center"
                            style={{ textDecoration: 'none' }}
                          >
                            {user.username}
                          </Text>

                          {/* User Role Display with Custom Roles */}
                          <UserRoleDisplay
                            userRole={user.role as 'admin' | 'moderator' | 'user'}
                            customRole={user.customRole}
                            size="small"
                            spacing={0.5}
                          />

                          {/* User Badges */}
                          <UserBadges userId={user.id} size="sm" maxDisplay={4} />

                          <Stack gap={6} w="100%">
                            <Group justify="space-between" gap={theme.spacing.xs}>
                              <Text size="xs" c="dimmed">
                                Reading Progress
                              </Text>
                              <Text size="xs" c="dimmed">
                                Ch. {user.userProgress}
                              </Text>
                            </Group>
                            <Progress value={progressPercentage} size="sm" radius="md" color="red" />
                            <Text size="xs" c="dimmed" ta="center">
                              {progressPercentage}% complete
                            </Text>
                          </Stack>

                          {user.guidesCount !== undefined && user.guidesCount > 0 && (
                            <Box
                              style={{
                                marginTop: 'auto',
                                paddingTop: theme.spacing.sm,
                                borderTop: '1px solid rgba(255, 255, 255, 0.12)',
                                width: '100%',
                                display: 'flex',
                                justifyContent: 'center'
                              }}
                            >
                              <Badge
                                variant="outline"
                                color="purple"
                                leftSection={<BookOpen size={14} />}
                              >
                                {user.guidesCount} guide{user.guidesCount !== 1 ? 's' : ''}
                              </Badge>
                            </Box>
                          )}

                          <Text size="xs" c="dimmed" ta="center">
                            Joined {new Date(user.createdAt).toLocaleDateString()}
                          </Text>
                        </Stack>
                      </Card>
                    </motion.div>
                  </Grid.Col>
                )
              })}
            </Grid>

            {totalPages > 1 && (
              <Box style={{ display: 'flex', justifyContent: 'center', marginTop: theme.spacing.xl }}>
                <Pagination total={totalPages} value={page} onChange={handlePageChange} size="lg" color="red" />
              </Box>
            )}

            {users.length === 0 && !loading && (
              <Stack align="center" gap="sm" py="xl">
                <Title order={4} c="dimmed">
                  No users found
                </Title>
              </Stack>
            )}
          </>
        )}
      </motion.div>
    </Container>
  )
}
