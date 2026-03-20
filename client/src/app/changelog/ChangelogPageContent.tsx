'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Avatar,
  Anchor,
  Badge,
  Box,
  Button,
  Container,
  Group,
  Skeleton,
  Stack,
  Text,
  Title,
  Pagination,
  rem,
} from '@mantine/core'
import { Clock } from 'lucide-react'
import Link from 'next/link'
import { api } from '../../lib/api'
import { textColors } from '../../lib/mantine-theme'

type FilterType = 'all' | 'submissions'
type EntityFilter = 'all' | 'character' | 'gamble' | 'arc' | 'organization' | 'event' | 'guide' | 'media' | 'annotation'

interface EditEntry {
  id: number
  kind: 'edit'
  action: string
  entityType: string
  entityId: number
  entityName?: string
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
  entityName?: string
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
    annotation: textColors.annotation,
  }
  return map[entityType.toLowerCase()] ?? textColors.secondary
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

function getActionLabel(entry: EditEntry): string {
  const isSubmissionType = ['guide', 'media', 'annotation'].includes(entry.entityType)
  if (isSubmissionType && entry.action === 'update') {
    const priorStatusField = ((entry as any).changedFields ?? []).find(
      (f: string) => f.startsWith('priorStatus:')
    )
    const priorStatus = priorStatusField?.split(':')[1]
    if (priorStatus === 'REJECTED') return 'resubmitted'
    return 'edited'
  }
  return entry.action
}

const ALL_ENTITY_OPTIONS = [
  { label: 'All', value: 'all' },
  { label: 'Characters', value: 'character' },
  { label: 'Gambles', value: 'gamble' },
  { label: 'Arcs', value: 'arc' },
  { label: 'Orgs', value: 'organization' },
  { label: 'Events', value: 'event' },
  { label: 'Guides', value: 'guide' },
  { label: 'Media', value: 'media' },
  { label: 'Annotations', value: 'annotation' },
]

const SUBMISSION_ENTITY_OPTIONS = [
  { label: 'All', value: 'all' },
  { label: 'Guides', value: 'guide' },
  { label: 'Media', value: 'media' },
  { label: 'Annotations', value: 'annotation' },
]

const TYPE_FILTER_OPTIONS: { label: string; value: FilterType }[] = [
  { label: 'All Activity', value: 'all' },
  { label: 'Submissions', value: 'submissions' },
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

      if (filterType === 'submissions') {
        const submissions = await api.getRecentSubmissions({ page, limit: PAGE_LIMIT })
        const submissionEntries: SubmissionEntry[] = (submissions?.data ?? []).map((s) => ({
          id: s.id, kind: 'submission' as const,
          type: s.type, title: s.title, entityType: s.entityType, entityId: s.entityId,
          entityName: s.entityName,
          createdAt: s.createdAt, submittedBy: s.submittedBy,
        }))
        setEntries(submissionEntries)
        setTotalPages(submissions?.totalPages ?? 1)
        return
      }

      // filterType === 'all': combine edits and submissions
      const [edits, submissions] = await Promise.all([
        api.getRecentEdits({ page: 1, limit: page * PAGE_LIMIT, entityType: entityTypeParam }),
        api.getRecentSubmissions({ page: 1, limit: page * PAGE_LIMIT }),
      ])
      const editEntries: EditEntry[] = (edits?.data ?? []).map((e) => ({
        id: e.id, kind: 'edit' as const,
        action: e.action, entityType: e.entityType, entityId: e.entityId,
        entityName: e.entityName,
        createdAt: e.createdAt, user: e.user,
      }))
      const submissionEntries: SubmissionEntry[] = (submissions?.data ?? []).map((s) => ({
        id: s.id, kind: 'submission' as const,
        type: s.type, title: s.title, entityType: s.entityType, entityId: s.entityId,
        entityName: s.entityName,
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

  const handleFilterType = (val: FilterType) => {
    setFilterType(val)
    setPage(1)
  }

  const handleEntityFilter = (val: EntityFilter) => {
    setEntityFilter(val)
    setPage(1)
  }

  return (
    <Container size="md" py="xl">
      <style>{`
        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 0.8; }
          70% { transform: scale(2.4); opacity: 0; }
          100% { transform: scale(2.4); opacity: 0; }
        }
      `}</style>

      {/* Editorial Header */}
      <Box
        mb="xl"
        style={{
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          paddingBottom: rem(32),
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Faint diagonal texture */}
        <Box style={{
          position: 'absolute', inset: 0, opacity: 0.025,
          backgroundImage: 'repeating-linear-gradient(45deg, white 0px, white 1px, transparent 1px, transparent 8px)',
          pointerEvents: 'none'
        }} />

        <Group gap="sm" align="center" mb="xs">
          {/* Pulsing live dot */}
          <Box style={{ position: 'relative', width: rem(10), height: rem(10), flexShrink: 0 }}>
            <Box style={{
              width: rem(10), height: rem(10), borderRadius: '50%',
              backgroundColor: textColors.character,
              position: 'absolute'
            }} />
            <Box style={{
              width: rem(10), height: rem(10), borderRadius: '50%',
              border: `2px solid ${textColors.character}`,
              position: 'absolute',
              animation: 'pulse-ring 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite'
            }} />
          </Box>
          <Text
            style={{
              fontFamily: 'var(--font-opti-goudy-text)',
              fontSize: rem(40),
              fontWeight: 400,
              lineHeight: 1,
              color: '#ffffff'
            }}
          >
            Changelog
          </Text>
        </Group>
        <Text size="sm" c="dimmed" style={{ maxWidth: rem(480) }}>
          Live record of wiki edits by contributors and approved community submissions.
        </Text>
      </Box>

      {/* Filters */}
      <Stack gap="sm" mb="lg">
        {/* Type filter pills */}
        <Group gap="xs">
          {TYPE_FILTER_OPTIONS.map(opt => (
            <Button
              key={opt.value}
              size="xs"
              onClick={() => handleFilterType(opt.value)}
              style={{
                backgroundColor: filterType === opt.value ? 'rgba(255,255,255,0.12)' : 'transparent',
                border: `1px solid ${filterType === opt.value ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.07)'}`,
                color: filterType === opt.value ? '#ffffff' : 'rgba(255,255,255,0.45)',
                borderRadius: rem(4),
                fontWeight: filterType === opt.value ? 600 : 400,
                fontSize: rem(12),
                height: rem(28),
                padding: `0 ${rem(10)}`
              }}
            >
              {opt.label}
            </Button>
          ))}
        </Group>

        {/* Entity filter pills (colored) */}
        {(() => {
          const entityOptions = filterType === 'submissions' ? SUBMISSION_ENTITY_OPTIONS : ALL_ENTITY_OPTIONS
          return (
            <Group gap="xs">
              {entityOptions.map(opt => {
                const color = opt.value === 'all' ? 'rgba(255,255,255,0.5)' : entityColor(opt.value)
                const isActive = entityFilter === opt.value
                return (
                  <Button
                    key={opt.value}
                    size="xs"
                    onClick={() => handleEntityFilter(opt.value as EntityFilter)}
                    style={{
                      backgroundColor: isActive ? `${color}22` : 'transparent',
                      border: `1px solid ${isActive ? color : 'rgba(255,255,255,0.06)'}`,
                      color: isActive ? color : 'rgba(255,255,255,0.35)',
                      borderRadius: rem(4),
                      fontSize: rem(11),
                      height: rem(24),
                      padding: `0 ${rem(8)}`
                    }}
                  >
                    {opt.label}
                  </Button>
                )
              })}
            </Group>
          )
        })()}
      </Stack>

      {/* Feed */}
      <Stack gap={0} mb="xl">
        {loading ? (
          Array.from({ length: 10 }).map((_, i) => (
            <Box key={i} style={{
              display: 'flex', gap: rem(12), alignItems: 'center',
              padding: rem(12),
              borderBottom: '1px solid rgba(255,255,255,0.04)'
            }}>
              <Skeleton circle height={32} width={32} />
              <Box style={{ flex: 1 }}>
                <Skeleton height={14} width="55%" mb={6} radius="sm" />
                <Skeleton height={11} width="30%" radius="sm" />
              </Box>
            </Box>
          ))
        ) : entries.length === 0 ? (
          <Box style={{ textAlign: 'center', padding: rem(48) }}>
            <Text c="dimmed" size="lg">No activity found.</Text>
          </Box>
        ) : (
          entries.map((entry) => {
            if (entry.kind === 'edit') {
              const user = entry.user
              const link = entityLink(entry.entityType, entry.entityId)
              const displayName = entry.entityName ?? `#${entry.entityId}`
              const entityTypeLabel = entry.entityType.charAt(0).toUpperCase() + entry.entityType.slice(1).toLowerCase()
              const eColor = entityColor(entry.entityType)
              return (
                <Box
                  key={`edit-${entry.id}`}
                  style={{
                    display: 'flex',
                    gap: rem(12),
                    alignItems: 'flex-start',
                    padding: rem(12),
                    borderLeft: `4px solid ${eColor}`,
                    borderRadius: '0 0.5rem 0.5rem 0',
                    backgroundColor: 'rgba(255,255,255,0.02)',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                  }}
                >
                  <Avatar
                    src={avatarUrl(user)}
                    size={32}
                    radius="xl"
                    style={{ flexShrink: 0, outline: `2px solid ${eColor}40` }}
                  >
                    {user?.username?.[0]?.toUpperCase() ?? '?'}
                  </Avatar>
                  <Box style={{ flex: 1, minWidth: 0 }}>
                    <Group gap={6} wrap="nowrap" mb={4}>
                      <Anchor component={Link} href={`/users/${user?.id}`} fw={600} style={{ color: textColors.primary, flexShrink: 0 }}>
                        {user?.username ?? 'Unknown'}
                      </Anchor>
                      <Badge
                        size="sm"
                        variant="light"
                        color={entry.action === 'create' ? 'green' : entry.action === 'delete' ? 'red' : 'blue'}
                        style={{ textTransform: 'capitalize', flexShrink: 0 }}
                      >
                        {getActionLabel(entry)}
                      </Badge>
                      <Anchor
                        component={Link}
                        href={link}
                        size="sm"
                        fw={500}
                        style={{
                          color: eColor,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {displayName}
                      </Anchor>
                    </Group>
                    <Group gap={4}>
                      <Text size="xs" style={{ color: eColor, fontWeight: 600 }}>{entityTypeLabel}</Text>
                      <Text size="xs" c="dimmed" style={{ opacity: 0.5 }}>·</Text>
                      <Clock size={11} style={{ color: textColors.tertiary, opacity: 0.5 }} />
                      <Text size="xs" c="dimmed" style={{ opacity: 0.5 }}>{relativeTime(entry.createdAt)}</Text>
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
            const subTypeLabel = sub.type.charAt(0).toUpperCase() + sub.type.slice(1)
            const subColor = entityColor(sub.type)

            return (
              <Box
                key={`sub-${sub.id}`}
                style={{
                  display: 'flex',
                  gap: rem(12),
                  alignItems: 'flex-start',
                  padding: rem(12),
                  borderLeft: `4px solid ${subColor}`,
                  borderRadius: '0 0.5rem 0.5rem 0',
                  backgroundColor: 'rgba(255,255,255,0.02)',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                }}
              >
                <Avatar
                  src={avatarUrl(submitter)}
                  size={32}
                  radius="xl"
                  style={{ flexShrink: 0, outline: `2px solid ${subColor}40` }}
                >
                  {submitter?.username?.[0]?.toUpperCase() ?? '?'}
                </Avatar>
                <Box style={{ flex: 1, minWidth: 0 }}>
                  <Group gap={6} wrap="nowrap" mb={4}>
                    <Anchor component={Link} href={`/users/${submitter?.id}`} fw={600} style={{ color: textColors.primary, flexShrink: 0 }}>
                      {submitter?.username ?? 'Unknown'}
                    </Anchor>
                    <Badge size="sm" color="green" variant="light" style={{ flexShrink: 0 }}>
                      submitted
                    </Badge>
                    {sub.title && (
                      <Anchor
                        component={Link}
                        href={link}
                        size="sm"
                        fw={500}
                        style={{
                          color: subColor,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {sub.title}
                      </Anchor>
                    )}
                  </Group>
                  <Group gap={4}>
                    <Text size="xs" style={{ color: subColor, fontWeight: 600 }}>{subTypeLabel}</Text>
                    {sub.entityName && sub.entityType && (
                      <>
                        <Text size="xs" c="dimmed" style={{ opacity: 0.5 }}>·</Text>
                        <Text size="xs" c="dimmed" style={{ opacity: 0.5 }}>
                          for{' '}
                          <span style={{ color: entityColor(sub.entityType) }}>
                            {sub.entityType.charAt(0).toUpperCase() + sub.entityType.slice(1).toLowerCase()}: {sub.entityName}
                          </span>
                        </Text>
                      </>
                    )}
                    <Text size="xs" c="dimmed" style={{ opacity: 0.5 }}>·</Text>
                    <Clock size={11} style={{ color: textColors.tertiary, opacity: 0.5 }} />
                    <Text size="xs" c="dimmed" style={{ opacity: 0.5 }}>{relativeTime(sub.createdAt)}</Text>
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
