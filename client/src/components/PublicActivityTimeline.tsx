'use client'

import { useEffect, useMemo, useState } from 'react'
import { Anchor, Box, Text, Group, Button, Badge } from '@mantine/core'
import Link from 'next/link'
import { api } from '../lib/api'
import { textColors } from '../lib/mantine-theme'

// ── Submission types (community contributions) ────────────────────────────────
type SubmissionEventType = 'guide' | 'media' | 'annotation' | 'event'

type FilterKind = 'all' | 'submissions' | 'edits'

const SUBMISSION_BORDER: Record<SubmissionEventType, string> = {
  guide:      '#3a7a4a',
  media:      '#3a4a6a',
  annotation: '#5a4a7a',
  event:      '#7a6020',
}
const SUBMISSION_BG: Record<SubmissionEventType, string> = {
  guide:      'rgba(34,197,94,0.04)',
  media:      'rgba(59,130,246,0.04)',
  annotation: 'rgba(124,58,237,0.04)',
  event:      'rgba(245,158,11,0.04)',
}
const SUBMISSION_COLOR: Record<SubmissionEventType, string> = {
  guide:      'rgba(34,197,94,0.8)',
  media:      'rgba(59,130,246,0.8)',
  annotation: 'rgba(124,58,237,0.8)',
  event:      'rgba(245,158,11,0.8)',
}

// ── Wiki entity types ─────────────────────────────────────────────────────────
type WikiEntityType = 'character' | 'arc' | 'gamble' | 'organization' | 'event' | 'chapter'

const WIKI_COLOR: Record<WikiEntityType, string> = {
  character:    textColors.character,
  arc:          textColors.arc,
  gamble:       textColors.gamble,
  organization: textColors.organization,
  event:        textColors.event,
  chapter:      textColors.chapter,
}

const ENTITY_LINK_MAP: Record<string, string> = {
  character:    '/characters',
  gamble:       '/gambles',
  arc:          '/arcs',
  organization: '/organizations',
  event:        '/events',
  guide:        '/guides',
  media:        '/media',
  chapter:      '/chapters',
}

// ── Unified timeline entry ────────────────────────────────────────────────────
interface TimelineEntry {
  kind: 'submission' | 'wiki'
  type: string          // submission type or entity type
  action?: string       // wiki only: 'create' | 'update' | 'delete'
  title: string
  href: string
  entityType?: string
  entityName?: string
  date: Date
  borderColor: string
  bgColor: string
  textColor: string
  changedFields?: string[] | null
}

function submissionHref(type: string, id: number, entityType?: string, entityId?: number): string {
  if (type === 'guide') return `/guides/${id}`
  if (entityType && entityId) {
    return `${ENTITY_LINK_MAP[entityType.toLowerCase()] ?? '#'}/${entityId}`
  }
  return '#'
}

function wikiHref(entityType: string, entityId: number): string {
  return `${ENTITY_LINK_MAP[entityType.toLowerCase()] ?? '#'}/${entityId}`
}

function actionLabel(action: string): string {
  if (action === 'create') return 'created'
  if (action === 'delete') return 'deleted'
  return 'edited'
}

function actionColor(action: string): string {
  if (action === 'create') return 'green'
  if (action === 'delete') return 'red'
  return 'blue'
}

function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d`
  return `${Math.floor(days / 7)}w`
}

function formatChangedFields(fields: string[] | null | undefined): string {
  if (!fields?.length) return ''
  const filtered = fields.filter(f => !f.startsWith('priorStatus:'))
  if (!filtered.length) return ''
  const shown = filtered.slice(0, 4).map(f => f.charAt(0).toUpperCase() + f.slice(1))
  const rest = filtered.length - 4
  return rest > 0 ? `${shown.join(', ')} +${rest} more` : shown.join(', ')
}

interface PublicActivityTimelineProps {
  userId: number
  submissions: any[]
}

export default function PublicActivityTimeline({ userId, submissions }: PublicActivityTimelineProps) {
  const [wikiEdits, setWikiEdits] = useState<any[]>([])
  const [visibleCount, setVisibleCount] = useState(8)
  const [filter, setFilter] = useState<FilterKind>('all')

  useEffect(() => {
    if (!userId) return
    api.getWikiEditsByUser(userId, { limit: 50 })
      .then((res) => setWikiEdits(res?.data ?? []))
      .catch(() => {}) // non-critical, degrade gracefully
  }, [userId])

  const events = useMemo<TimelineEntry[]>(() => {
    const submissionEntries: TimelineEntry[] = submissions
      .filter((s) => SUBMISSION_BORDER[s.type as SubmissionEventType])
      .map((s) => ({
        kind: 'submission' as const,
        type: s.type as string,
        title: (s.title ?? s.type) as string,
        href: submissionHref(s.type, s.id, s.entityType, s.entityId),
        entityType: s.entityType as string | undefined,
        entityName: s.entityName as string | undefined,
        date: new Date(s.createdAt),
        borderColor: SUBMISSION_BORDER[s.type as SubmissionEventType],
        bgColor: SUBMISSION_BG[s.type as SubmissionEventType],
        textColor: SUBMISSION_COLOR[s.type as SubmissionEventType],
      }))

    const wikiEntityTypes = new Set<string>(['character','arc','gamble','organization','event','chapter'])
    const wikiEntries: TimelineEntry[] = wikiEdits
      .filter((e) => wikiEntityTypes.has(e.entityType?.toLowerCase()))
      .map((e) => {
        const eType = e.entityType.toLowerCase() as WikiEntityType
        const color = WIKI_COLOR[eType] ?? textColors.secondary
        return {
          kind: 'wiki' as const,
          type: eType,
          action: e.action,
          title: e.entityName ?? `${eType} #${e.entityId}`,
          href: wikiHref(eType, e.entityId),
          date: new Date(e.createdAt),
          changedFields: e.changedFields ?? null,
          borderColor: color,
          bgColor: `${color}0a`,
          textColor: color,
        }
      })

    return [...submissionEntries, ...wikiEntries]
      .sort((a, b) => b.date.getTime() - a.date.getTime())
  }, [submissions, wikiEdits])

  const filtered = filter === 'edits'
    ? events.filter(e => e.kind === 'wiki')
    : filter === 'submissions'
    ? events.filter(e => e.kind === 'submission')
    : events

  const visible = filtered.slice(0, visibleCount)

  return (
    <Box style={{ background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: '4px', padding: '12px' }}>
      <Group justify="space-between" align="center" mb={10}>
        <Text style={{ fontSize: '17px', fontWeight: 600, color: '#d4d4d4' }}>Activity</Text>
        <Group gap={4}>
          {(['all', 'submissions', 'edits'] as FilterKind[]).map(f => (
            <Button
              key={f}
              size="xs"
              onClick={() => { setFilter(f); setVisibleCount(8) }}
              style={{
                backgroundColor: filter === f ? 'rgba(255,255,255,0.1)' : 'transparent',
                border: `1px solid ${filter === f ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.07)'}`,
                color: filter === f ? '#e5e5e5' : '#666',
                borderRadius: '3px',
                fontSize: '11px',
                height: '22px',
                padding: '0 8px',
                textTransform: 'capitalize',
              }}
            >
              {f}
            </Button>
          ))}
        </Group>
      </Group>

      {filtered.length === 0 ? (
        <Text style={{ fontSize: '15px', color: '#666', fontStyle: 'italic' }}>No public activity yet.</Text>
      ) : (
        <Box>
          {visible.map((ev, i) => (
            <Group
              key={`${ev.kind}-${ev.type}-${i}`}
              gap={10}
              align="stretch"
              style={{ marginBottom: i < visible.length - 1 ? '6px' : 0 }}
            >
              <Box style={{ width: '2px', background: ev.borderColor, borderRadius: '1px', flexShrink: 0 }} />
              <Box
                style={{
                  flex: 1, padding: '7px 10px',
                  background: ev.bgColor, borderRadius: '3px',
                  display: 'flex', justifyContent: 'space-between',
                  alignItems: 'flex-start', gap: '8px',
                }}
              >
                <Box style={{ flex: 1, minWidth: 0 }}>
                  <Group gap={6} wrap="nowrap" mb={2}>
                    {ev.kind === 'wiki' && ev.action ? (
                      <Badge
                        size="xs"
                        color={actionColor(ev.action)}
                        variant="light"
                        style={{ flexShrink: 0 }}
                      >
                        {actionLabel(ev.action)}
                      </Badge>
                    ) : (
                      <Badge
                        size="xs"
                        variant="dot"
                        style={{ color: ev.textColor, borderColor: ev.borderColor, background: 'transparent', flexShrink: 0 }}
                      >
                        {ev.type}
                      </Badge>
                    )}
                    <Anchor
                      component={Link}
                      href={ev.href}
                      style={{ fontSize: '13px', color: '#e5e5e5', fontWeight: 600, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    >
                      {ev.title}
                    </Anchor>
                  </Group>
                  {ev.kind === 'wiki' && (
                    <>
                      <Text style={{ fontSize: '11px', color: ev.textColor, marginTop: '1px', opacity: 0.7 }}>
                        {ev.type.charAt(0).toUpperCase() + ev.type.slice(1)}
                      </Text>
                      {(() => {
                        const fieldsLabel = formatChangedFields(ev.changedFields)
                        return fieldsLabel ? (
                          <Text style={{ fontSize: '11px', color: '#666', marginTop: '1px' }}>
                            {fieldsLabel}
                          </Text>
                        ) : null
                      })()}
                    </>
                  )}
                  {ev.kind === 'submission' && ev.entityName && ev.entityType && (
                    <Text style={{ fontSize: '11px', color: '#888', marginTop: '1px' }} lineClamp={1}>
                      {ev.entityType.charAt(0).toUpperCase() + ev.entityType.slice(1).toLowerCase()}: {ev.entityName}
                    </Text>
                  )}
                </Box>
                <Text style={{ fontSize: '10px', color: '#555', fontFamily: 'monospace', flexShrink: 0, paddingTop: '1px' }}>
                  {timeAgo(ev.date)}
                </Text>
              </Box>
            </Group>
          ))}

          {filtered.length > visibleCount && (
            <Button
              variant="subtle" size="xs" fullWidth mt={8}
              onClick={() => setVisibleCount((v) => v + 8)}
              styles={{ root: { color: '#666', fontSize: '12px' } }}
            >
              Show more ({filtered.length - visibleCount} remaining)
            </Button>
          )}
        </Box>
      )}
    </Box>
  )
}
