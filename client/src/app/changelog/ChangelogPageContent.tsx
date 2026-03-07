'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Container,
  Title,
  Text,
  Box,
  Group,
  Badge,
  Avatar,
  Stack,
  Anchor,
  SegmentedControl,
  Pagination,
  Skeleton,
} from '@mantine/core'
import { Clock, Activity } from 'lucide-react'
import Link from 'next/link'
import { api } from '../../lib/api'
import { textColors } from '../../lib/mantine-theme'

type FilterType = 'all' | 'edits' | 'submissions'
type EntityFilter = 'all' | 'character' | 'gamble' | 'arc' | 'organization' | 'event' | 'guide' | 'media' | 'annotation'

interface EditEntry {
  id: number
  kind: 'edit'
  action: string
  entityType: string
  entityId: number
  createdAt: string
  user?: { id: number; username: string; fluxerAvatar?: string; fluxerId?: string } | null
}

interface SubmissionEntry {
  id: number
  kind: 'submission'
  type: 'guide' | 'media' | 'annotation'
  title?: string
  entityType?: string
  entityId?: number
  createdAt: string
  submittedBy?: { id: number; username: string; fluxerAvatar?: string; fluxerId?: string } | null
}

type FeedEntry = EditEntry | SubmissionEntry

function avatarUrl(user: { fluxerId?: string; fluxerAvatar?: string } | null | undefined): string | undefined {
  if (user?.fluxerId && user?.fluxerAvatar) {
    return `https://fluxerusercontent.com/avatars/${user.fluxerId}/${user.fluxerAvatar}.png`
  }
  return undefined
}

function entityLink(entityType: string, entityId: number): string {
  const map: Record<string, string> = {
    character: '/characters',
    gamble: '/gambles',
    arc: '/arcs',
    organization: '/organizations',
    event: '/events',
    guide: '/guides',
    media: '/media',
    annotation: '#',
  }
  return `${map[entityType.toLowerCase()] ?? '#'}/${entityId}`
}

function entityColor(entityType: string): string {
  const map: Record<string, string> = {
    character: textColors.character,
    gamble: textColors.gamble,
    arc: textColors.arc,
    organization: textColors.organization,
    event: textColors.event,
    guide: textColors.guide,
    media: textColors.media,
    annotation: textColors.secondary,
  }
  return map[entityType.toLowerCase()] ?? textColors.secondary
}

function actionBadgeColor(action: string): string {
  if (action === 'create') return 'green'
  if (action === 'delete') return 'red'
  return 'blue'
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString()
}

const ENTITY_FILTER_OPTIONS = [
  { label: 'All', value: 'all' },
  { label: 'Characters', value: 'character' },
  { label: 'Gambles', value: 'gamble' },
  { label: 'Arcs', value: 'arc' },
  { label: 'Orgs', value: 'organization' },
  { label: 'Events', value: 'event' },
]

const PAGE_LIMIT = 20

export function ChangelogPageContent() {
  const [filterType, setFilterType] = useState<FilterType>('all')
  const [entityFilter, setEntityFilter] = useState<EntityFilter>('all')
  const [page, setPage] = useState(1)
  const [entries, setEntries] = useState<FeedEntry[]>([])
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const entityTypeParam = entityFilter !== 'all' ? entityFilter : undefined

      if (filterType === 'edits' || filterType === 'all') {
        const edits = await api.getRecentEdits({ page, limit: PAGE_LIMIT, entityType: entityTypeParam })
        if (filterType === 'edits') {
          const editEntries: EditEntry[] = (edits?.data ?? []).map((e) => ({
            id: e.id, kind: 'edit' as const,
            action: e.action, entityType: e.entityType, entityId: e.entityId,
            createdAt: e.createdAt, user: e.user,
          }))
          setEntries(editEntries)
          setTotalPages(edits?.totalPages ?? 1)
          return
        }
      }

      if (filterType === 'submissions' || filterType === 'all') {
        const submissions = await api.getRecentSubmissions({ page, limit: PAGE_LIMIT })
        if (filterType === 'submissions') {
          const submissionEntries: SubmissionEntry[] = (submissions?.data ?? []).map((s) => ({
            id: s.id, kind: 'submission' as const,
            type: s.type, title: s.title, entityType: s.entityType, entityId: s.entityId,
            createdAt: s.createdAt, submittedBy: s.submittedBy,
          }))
          setEntries(submissionEntries)
          setTotalPages(submissions?.totalPages ?? 1)
          return
        }
      }

      // filterType === 'all': fetch both and merge
      const [edits, submissions] = await Promise.all([
        api.getRecentEdits({ page: 1, limit: PAGE_LIMIT, entityType: entityTypeParam }),
        api.getRecentSubmissions({ page: 1, limit: PAGE_LIMIT }),
      ])
      const editEntries: EditEntry[] = (edits?.data ?? []).map((e) => ({
        id: e.id, kind: 'edit' as const,
        action: e.action, entityType: e.entityType, entityId: e.entityId,
        createdAt: e.createdAt, user: e.user,
      }))
      const submissionEntries: SubmissionEntry[] = (submissions?.data ?? []).map((s) => ({
        id: s.id, kind: 'submission' as const,
        type: s.type, title: s.title, entityType: s.entityType, entityId: s.entityId,
        createdAt: s.createdAt, submittedBy: s.submittedBy,
      }))
      const combined = [...editEntries, ...submissionEntries]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice((page - 1) * PAGE_LIMIT, page * PAGE_LIMIT)
      const totalCombined = (edits?.total ?? 0) + (submissions?.total ?? 0)
      setEntries(combined)
      setTotalPages(Math.ceil(totalCombined / PAGE_LIMIT))
    } catch {
      setEntries([])
    } finally {
      setLoading(false)
    }
  }, [filterType, entityFilter, page])

  useEffect(() => {
    load()
  }, [load])

  const handleFilterType = (val: string) => {
    setFilterType(val as FilterType)
    setPage(1)
  }

  const handleEntityFilter = (val: string) => {
    setEntityFilter(val as EntityFilter)
    setPage(1)
  }

  return (
    <Container size="md" py="xl">
      {/* Header */}
      <Box mb="xl">
        <Group gap="sm" mb="xs">
          <Activity size={28} style={{ color: textColors.character }} />
          <Title
            order={1}
            style={{
              background: `linear-gradient(45deg, ${textColors.character}, ${textColors.arc})`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
              fontWeight: 'bold',
            }}
          >
            Changelog
          </Title>
        </Group>
        <Text c="dimmed" size="md">
          Recent wiki edits by contributors and approved community submissions.
        </Text>
      </Box>

      {/* Filters */}
      <Stack gap="sm" mb="lg">
        <SegmentedControl
          value={filterType}
          onChange={handleFilterType}
          data={[
            { label: 'All Activity', value: 'all' },
            { label: 'Wiki Edits', value: 'edits' },
            { label: 'Submissions', value: 'submissions' },
          ]}
          styles={{
            root: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '0.5rem' },
          }}
        />
        {filterType !== 'submissions' && (
          <SegmentedControl
            value={entityFilter}
            onChange={handleEntityFilter}
            data={ENTITY_FILTER_OPTIONS}
            size="xs"
            styles={{
              root: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '0.5rem' },
            }}
          />
        )}
      </Stack>

      {/* Feed */}
      <Stack gap="xs" mb="xl">
        {loading ? (
          Array.from({ length: 10 }).map((_, i) => (
            <Box key={i} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', padding: '0.75rem' }}>
              <Skeleton circle height={40} width={40} />
              <Box style={{ flex: 1 }}>
                <Skeleton height={16} width="55%" mb={6} radius="sm" />
                <Skeleton height={12} width="30%" radius="sm" />
              </Box>
            </Box>
          ))
        ) : entries.length === 0 ? (
          <Box style={{ textAlign: 'center', padding: '3rem' }}>
            <Text c="dimmed" size="lg">No activity found.</Text>
          </Box>
        ) : (
          entries.map((entry) => {
            if (entry.kind === 'edit') {
              const user = entry.user
              const link = entityLink(entry.entityType, entry.entityId)
              return (
                <Box
                  key={`edit-${entry.id}`}
                  style={{
                    display: 'flex',
                    gap: '0.75rem',
                    alignItems: 'flex-start',
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <Avatar src={avatarUrl(user)} size={40} radius="xl" style={{ flexShrink: 0 }}>
                    {user?.username?.[0]?.toUpperCase() ?? '?'}
                  </Avatar>
                  <Box style={{ flex: 1, minWidth: 0 }}>
                    <Group gap={6} wrap="wrap" mb={4}>
                      <Anchor component={Link} href={`/users/${user?.id}`} fw={600} style={{ color: textColors.primary }}>
                        {user?.username ?? 'Unknown'}
                      </Anchor>
                      <Badge size="sm" color={actionBadgeColor(entry.action)} variant="light" style={{ textTransform: 'capitalize' }}>
                        {entry.action}
                      </Badge>
                      <Text size="sm" c="dimmed">a</Text>
                      <Badge size="sm" variant="dot" style={{ color: entityColor(entry.entityType), textTransform: 'capitalize' }}>
                        {entry.entityType}
                      </Badge>
                      <Anchor component={Link} href={link} size="sm" style={{ color: entityColor(entry.entityType) }}>
                        #{entry.entityId}
                      </Anchor>
                    </Group>
                    <Group gap={4}>
                      <Clock size={12} style={{ color: textColors.tertiary }} />
                      <Text size="xs" c="dimmed">{relativeTime(entry.createdAt)}</Text>
                      <Text size="xs" c="dimmed">·</Text>
                      <Text size="xs" c="dimmed">{new Date(entry.createdAt).toLocaleString()}</Text>
                    </Group>
                  </Box>
                </Box>
              )
            }

            const sub = entry as SubmissionEntry
            const submitter = sub.submittedBy
            const link = sub.type === 'guide'
              ? `/guides/${sub.id}`
              : sub.entityType && sub.entityId
              ? entityLink(sub.entityType, sub.entityId)
              : '#'

            return (
              <Box
                key={`sub-${sub.id}`}
                style={{
                  display: 'flex',
                  gap: '0.75rem',
                  alignItems: 'flex-start',
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <Avatar src={avatarUrl(submitter)} size={40} radius="xl" style={{ flexShrink: 0 }}>
                  {submitter?.username?.[0]?.toUpperCase() ?? '?'}
                </Avatar>
                <Box style={{ flex: 1, minWidth: 0 }}>
                  <Group gap={6} wrap="wrap" mb={4}>
                    <Anchor component={Link} href={`/users/${submitter?.id}`} fw={600} style={{ color: textColors.primary }}>
                      {submitter?.username ?? 'Unknown'}
                    </Anchor>
                    <Badge size="sm" color="green" variant="light">
                      submitted {sub.type}
                    </Badge>
                    {sub.title && (
                      <Anchor component={Link} href={link} size="sm" style={{ color: entityColor(sub.type) }} fw={500}>
                        {sub.title}
                      </Anchor>
                    )}
                  </Group>
                  <Group gap={4}>
                    <Clock size={12} style={{ color: textColors.tertiary }} />
                    <Text size="xs" c="dimmed">{relativeTime(sub.createdAt)}</Text>
                    <Text size="xs" c="dimmed">·</Text>
                    <Text size="xs" c="dimmed">{new Date(sub.createdAt).toLocaleString()}</Text>
                  </Group>
                </Box>
              </Box>
            )
          })
        )}
      </Stack>

      {/* Pagination */}
      {totalPages > 1 && (
        <Group justify="center">
          <Pagination total={totalPages} value={page} onChange={setPage} />
        </Group>
      )}
    </Container>
  )
}
