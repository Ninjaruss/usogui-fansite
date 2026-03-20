'use client'

import { useMemo, useState } from 'react'
import { Box, Text, Group, Button } from '@mantine/core'

type EventType = 'guide' | 'media' | 'annotation' | 'event' | 'progress'

interface FeedEvent {
  type: EventType
  title: string
  detail: string
  date: Date
}

const TYPE_BORDER: Record<EventType, string> = {
  guide:      '#3a7a4a',
  media:      '#3a4a6a',
  annotation: '#5a4a7a',
  event:      '#7a6020',
  progress:   '#7a5030',
}

const TYPE_BG: Record<EventType, string> = {
  guide:      'rgba(34,197,94,0.04)',
  media:      'rgba(59,130,246,0.04)',
  annotation: 'rgba(124,58,237,0.04)',
  event:      'rgba(245,158,11,0.04)',
  progress:   'rgba(249,115,22,0.04)',
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

interface UserGuide {
  id: number
  title: string
  status: string
  createdAt: string
  updatedAt: string
}

interface SubmissionItem {
  id: number | string
  type: string
  title?: string
  status: string
  createdAt: string
}

interface FieldLogUser {
  userProgress?: number
  updatedAt?: string
}

interface SubmissionEditItem {
  id: number
  entityType: string
  entityId: number
  entityName?: string
  changedFields: string[] | null
  createdAt: string | Date
}

interface ProfileFieldLogProps {
  guides: UserGuide[]
  submissions: SubmissionItem[]
  user: FieldLogUser
  submissionEdits?: SubmissionEditItem[]
}

export default function ProfileFieldLog({ guides, submissions, user, submissionEdits }: ProfileFieldLogProps) {
  const [visibleCount, setVisibleCount] = useState(8)

  const events = useMemo<FeedEvent[]>(() => {
    const items: FeedEvent[] = []

    // Guides — use updatedAt so status changes surface correctly
    for (const guide of guides) {
      const actionMap: Record<string, string> = {
        pending: 'Guide submitted',
        approved: 'Guide approved',
        rejected: 'Guide rejected',
      }
      items.push({
        type: 'guide',
        title: actionMap[guide.status] ?? 'Guide updated',
        detail: guide.title,
        date: new Date(guide.updatedAt || guide.createdAt),
      })
    }

    // Submissions (media, events, annotations)
    for (const sub of submissions) {
      const type = sub.type as EventType
      if (!TYPE_BORDER[type]) continue

      const titleMap: Record<string, Record<string, string>> = {
        media:      { pending: 'Media submitted', approved: 'Media approved', rejected: 'Media rejected' },
        event:      { pending: 'Event submitted', approved: 'Event approved', rejected: 'Event rejected' },
        annotation: { pending: 'Annotation added', approved: 'Annotation approved', rejected: 'Annotation rejected' },
      }
      items.push({
        type,
        title: titleMap[type]?.[sub.status] ?? `${type} updated`,
        detail: sub.title ?? '',
        date: new Date(sub.createdAt),
      })
    }

    // Reading progress — single entry if progress > 0
    if (user?.userProgress && user.userProgress > 0 && user.updatedAt) {
      items.push({
        type: 'progress',
        title: 'Reading progress',
        detail: `Chapter ${user.userProgress} reached`,
        date: new Date(user.updatedAt),
      })
    }

    // Submission edits
    for (const edit of (submissionEdits ?? [])) {
      const type = edit.entityType as EventType
      const priorStatusField = (edit.changedFields ?? []).find(
        (f) => f.startsWith('priorStatus:')
      )
      const priorStatus = priorStatusField?.split(':')[1]
      const action = priorStatus === 'REJECTED' ? 'resubmitted' : 'edited'
      const resolvedType: EventType = TYPE_BORDER[type] ? type : 'event'
      items.push({
        type: resolvedType,
        title: `${edit.entityType.charAt(0).toUpperCase() + edit.entityType.slice(1)} ${action}`,
        detail: edit.entityName ?? '',
        date: new Date(edit.createdAt),
      })
    }

    // Sort descending — no slice here; visibleCount controls rendering
    return items.sort((a, b) => b.date.getTime() - a.date.getTime())
  }, [guides, submissions, user, submissionEdits])

  const visible = events.slice(0, visibleCount)

  return (
    <Box style={{ background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: '4px', padding: '12px' }}>
      <Text style={{ fontSize: '17px', fontWeight: 600, color: '#d4d4d4', marginBottom: 12 }}>Activity</Text>

      {events.length === 0 ? (
        <Text style={{ fontSize: '15px', color: '#666', fontStyle: 'italic' }}>No activity yet.</Text>
      ) : (
        <Box>
          {visible.map((ev, i) => (
            <Group
              key={i}
              gap={10}
              align="stretch"
              style={{ marginBottom: i < visible.length - 1 ? '6px' : 0 }}
            >
              {/* Colored left border */}
              <Box style={{ width: '2px', background: TYPE_BORDER[ev.type], borderRadius: '1px', flexShrink: 0 }} />

              {/* Card body */}
              <Box
                style={{
                  flex: 1,
                  padding: '7px 10px',
                  background: TYPE_BG[ev.type],
                  borderRadius: '3px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: '8px',
                }}
              >
                <Box style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{ fontSize: '13px', color: '#e5e5e5', fontWeight: 600, lineHeight: 1.3 }}>
                    {ev.title}
                  </Text>
                  {ev.detail && (
                    <Text style={{ fontSize: '11px', color: '#888', marginTop: '2px' }} lineClamp={1}>
                      {ev.detail}
                    </Text>
                  )}
                </Box>
                <Text style={{ fontSize: '10px', color: '#555', fontFamily: 'monospace', flexShrink: 0, paddingTop: '1px' }}>
                  {timeAgo(ev.date)}
                </Text>
              </Box>
            </Group>
          ))}

          {events.length > visibleCount && (
            <Button
              variant="subtle"
              size="xs"
              fullWidth
              mt={8}
              onClick={() => setVisibleCount((v) => v + 8)}
              styles={{ root: { color: '#666', fontSize: '12px' } }}
            >
              Show more ({events.length - visibleCount} remaining)
            </Button>
          )}
        </Box>
      )}
    </Box>
  )
}
