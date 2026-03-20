'use client'

import React, { useMemo } from 'react'
import { Box, Text, Group } from '@mantine/core'

type EventType = 'guide' | 'media' | 'annotation' | 'event' | 'progress'

interface FeedEvent {
  type: EventType
  title: string
  detail: string
  date: Date
}

const TYPE_STYLES: Record<EventType, { bg: string; color: string; label: string }> = {
  guide:      { bg: 'rgba(34,197,94,0.08)',   color: '#3a7a4a', label: 'guide' },
  media:      { bg: 'rgba(59,130,246,0.08)',  color: '#3a4a6a', label: 'media' },
  annotation: { bg: 'rgba(124,58,237,0.08)',  color: '#5a4a7a', label: 'annotation' },
  event:      { bg: 'rgba(245,158,11,0.08)',  color: '#7a6020', label: 'event' },
  progress:   { bg: 'rgba(249,115,22,0.08)',  color: '#7a5030', label: 'progress' },
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
      if (!TYPE_STYLES[type]) continue

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
      const resolvedType: EventType = TYPE_STYLES[type] ? type : 'event'
      items.push({
        type: resolvedType,
        title: `${edit.entityType.charAt(0).toUpperCase() + edit.entityType.slice(1)} ${action}`,
        detail: edit.entityName ?? '',
        date: new Date(edit.createdAt),
      })
    }

    // Sort descending, cap at 5
    return items.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 5)
  }, [guides, submissions, user, submissionEdits])

  return (
    <Box style={{ background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: '4px', padding: '12px' }}>
      <Text style={{ fontSize: '17px', fontWeight: 600, color: '#d4d4d4', marginBottom: 12 }}>Activity</Text>

      {events.length === 0 ? (
        <Text style={{ fontSize: '15px', color: '#666', fontStyle: 'italic' }}>No activity yet.</Text>
      ) : (
        <Box>
          {events.map((ev, i) => {
            const style = TYPE_STYLES[ev.type]
            return (
              <Group
                key={i}
                gap={10}
                align="flex-start"
                style={{
                  padding: '7px 0',
                  borderBottom: i < events.length - 1 ? '1px solid #0f0f0f' : 'none',
                }}
              >
                <Text style={{ fontSize: '14px', color: '#888', whiteSpace: 'nowrap', paddingTop: '1px', minWidth: '36px', fontFamily: 'monospace' }}>
                  {timeAgo(ev.date)}
                </Text>
                <Box style={{ flex: 1 }}>
                  <Text style={{ fontSize: '16px', color: i === 0 ? '#ddd' : '#bbb' }}>{ev.title}</Text>
                  {ev.detail && (
                    <Text style={{ fontSize: '14px', color: '#999', marginTop: '3px' }}>{ev.detail}</Text>
                  )}
                </Box>
                <Box
                  style={{
                    fontSize: '13px',
                    padding: '1px 5px',
                    background: style.bg,
                    color: style.color,
                    border: `1px solid ${style.bg.replace('0.08', '0.15')}`,
                    borderRadius: '2px',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  {style.label}
                </Box>
              </Group>
            )
          })}
        </Box>
      )}
    </Box>
  )
}
