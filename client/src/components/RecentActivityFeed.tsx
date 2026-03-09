'use client'

import { useEffect, useState } from 'react'
import { Box, Text, Group, Avatar, Stack, Anchor, Badge, Skeleton } from '@mantine/core'
import { Clock, ArrowRight, BookOpen, Image, FileText, Edit3, Plus, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { api } from '../lib/api'
import { textColors } from '../lib/mantine-theme'

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
  const base = map[entityType.toLowerCase()] ?? '#'
  return entityId ? `${base}/${entityId}` : base
}

function entityLabel(entityType: string): string {
  const map: Record<string, string> = {
    character: 'Character',
    gamble: 'Gamble',
    arc: 'Arc',
    organization: 'Org',
    event: 'Event',
    guide: 'Guide',
    media: 'Media',
    annotation: 'Annotation',
  }
  return map[entityType.toLowerCase()] ?? entityType
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

function actionIcon(action: string) {
  if (action === 'create') return <Plus size={12} />
  if (action === 'delete') return <Trash2 size={12} />
  return <Edit3 size={12} />
}

function submissionIcon(type: string) {
  if (type === 'guide') return <FileText size={12} />
  if (type === 'media') return <Image size={12} />
  return <BookOpen size={12} />
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

interface RecentActivityFeedProps {
  limit?: number
  showHeader?: boolean
  showViewAll?: boolean
  entries?: FeedEntry[]
}

export function RecentActivityFeed({
  limit = 5,
  showHeader = true,
  showViewAll = false,
  entries: externalEntries,
}: RecentActivityFeedProps) {
  const [entries, setEntries] = useState<FeedEntry[]>(externalEntries ?? [])
  const [loading, setLoading] = useState(!externalEntries)

  useEffect(() => {
    if (externalEntries) {
      setEntries(externalEntries)
      return
    }

    async function load() {
      try {
        const [edits, submissions] = await Promise.all([
          api.getRecentEdits({ limit, page: 1 }),
          api.getRecentSubmissions({ limit, page: 1 }),
        ])

        const editEntries: EditEntry[] = (edits?.data ?? []).map((e) => ({
          id: e.id,
          kind: 'edit' as const,
          action: e.action,
          entityType: e.entityType,
          entityId: e.entityId,
          entityName: e.entityName,
          createdAt: e.createdAt,
          user: e.user,
        }))

        const submissionEntries: SubmissionEntry[] = (submissions?.data ?? []).map((s) => ({
          id: s.id,
          kind: 'submission' as const,
          type: s.type,
          title: s.title,
          entityType: s.entityType,
          entityId: s.entityId,
          entityName: s.entityName,
          createdAt: s.createdAt,
          submittedBy: s.submittedBy,
        }))

        const combined: FeedEntry[] = [...editEntries, ...submissionEntries]
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, limit)

        setEntries(combined)
      } catch {
        // silently fail — feed just stays empty
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [limit, externalEntries])

  return (
    <Box>
      {showHeader && (
        <Group justify="space-between" mb="md">
          <Group gap={8}>
            <Clock size={16} style={{ color: textColors.secondary }} />
            <Text fw={600} style={{ color: textColors.primary }}>
              Recent Wiki Activity
            </Text>
          </Group>
          {showViewAll && (
            <Anchor component={Link} href="/changelog" size="sm" style={{ color: textColors.secondary }}>
              <Group gap={4}>
                <span>See all</span>
                <ArrowRight size={14} />
              </Group>
            </Anchor>
          )}
        </Group>
      )}

      <Stack gap="xs">
        {loading ? (
          Array.from({ length: Math.min(limit, 5) }).map((_, i) => (
            <Box key={i} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <Skeleton circle height={32} width={32} />
              <Box style={{ flex: 1 }}>
                <Skeleton height={14} width="60%" mb={4} radius="sm" />
                <Skeleton height={12} width="40%" radius="sm" />
              </Box>
            </Box>
          ))
        ) : entries.length === 0 ? (
          <Text size="sm" c="dimmed" style={{ fontStyle: 'italic' }}>
            No recent activity yet.
          </Text>
        ) : (
          entries.map((entry) => {
            if (entry.kind === 'edit') {
              const user = entry.user
              const link = entityLink(entry.entityType, entry.entityId)
              const displayName = entry.entityName ?? `#${entry.entityId}`
              const entityTypeLabel = entityLabel(entry.entityType)
              return (
                <Box
                  key={`edit-${entry.id}`}
                  style={{
                    display: 'flex',
                    gap: '0.625rem',
                    alignItems: 'flex-start',
                    padding: '0.5rem',
                    borderRadius: '0.5rem',
                    background: 'rgba(255,255,255,0.02)',
                  }}
                >
                  <Avatar
                    src={avatarUrl(user)}
                    size={32}
                    radius="xl"
                    style={{ flexShrink: 0 }}
                  >
                    {user?.username?.[0]?.toUpperCase() ?? '?'}
                  </Avatar>
                  <Box style={{ flex: 1, minWidth: 0 }}>
                    <Group gap={4} wrap="nowrap">
                      <Text size="sm" fw={500} style={{ color: textColors.primary, flexShrink: 0 }}>
                        {user?.username ?? 'Unknown'}
                      </Text>
                      <Badge
                        size="xs"
                        variant="light"
                        leftSection={actionIcon(entry.action)}
                        style={{ flexShrink: 0, textTransform: 'capitalize' }}
                      >
                        {entry.action}
                      </Badge>
                      <Anchor
                        component={Link}
                        href={link}
                        size="sm"
                        style={{
                          color: entityColor(entry.entityType),
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {entityTypeLabel}: {displayName}
                      </Anchor>
                    </Group>
                    <Group gap={4}>
                      <Clock size={11} style={{ color: textColors.tertiary }} />
                      <Text size="xs" c="dimmed">
                        {relativeTime(entry.createdAt)}
                      </Text>
                    </Group>
                  </Box>
                </Box>
              )
            }

            // submission entry
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
                  gap: '0.625rem',
                  alignItems: 'flex-start',
                  padding: '0.5rem',
                  borderRadius: '0.5rem',
                  background: 'rgba(255,255,255,0.02)',
                }}
              >
                <Avatar
                  src={avatarUrl(submitter)}
                  size={32}
                  radius="xl"
                  style={{ flexShrink: 0 }}
                >
                  {submitter?.username?.[0]?.toUpperCase() ?? '?'}
                </Avatar>
                <Box style={{ flex: 1, minWidth: 0 }}>
                  <Group gap={4} wrap="nowrap">
                    <Text size="sm" fw={500} style={{ color: textColors.primary, flexShrink: 0 }}>
                      {submitter?.username ?? 'Unknown'}
                    </Text>
                    <Badge
                      size="xs"
                      variant="light"
                      color="green"
                      leftSection={submissionIcon(sub.type)}
                      style={{ flexShrink: 0, textTransform: 'capitalize' }}
                    >
                      submitted
                    </Badge>
                    {(sub.title || (sub.entityName && sub.entityType)) && (
                      <Anchor
                        component={Link}
                        href={link}
                        size="sm"
                        style={{
                          color: entityColor(sub.title ? sub.type : sub.entityType ?? sub.type),
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {sub.title ?? `${entityLabel(sub.entityType ?? sub.type)}: ${sub.entityName}`}
                      </Anchor>
                    )}
                  </Group>
                  <Group gap={4}>
                    <Clock size={11} style={{ color: textColors.tertiary }} />
                    <Text size="xs" c="dimmed">
                      {relativeTime(sub.createdAt)}
                    </Text>
                    {sub.entityName && sub.entityType && sub.type !== 'guide' && (
                      <>
                        <Text size="xs" c="dimmed">·</Text>
                        <Text size="xs" c="dimmed">
                          for{' '}
                          <span style={{ color: entityColor(sub.entityType) }}>
                            {entityLabel(sub.entityType)}
                          </span>
                        </Text>
                      </>
                    )}
                  </Group>
                </Box>
              </Box>
            )
          })
        )}
      </Stack>
    </Box>
  )
}
