'use client'

import React from 'react'
import {
  Alert,
  Badge,
  Button,
  Card,
  Group,
  Stack,
  Text,
} from '@mantine/core'
import {
  FileText,
  FileImage,
  Calendar,
  MessageSquare,
  AlertTriangle,
  Edit,
  Trash2,
  Eye,
} from 'lucide-react'
import Link from 'next/link'

export interface SubmissionItem {
  id: number | string
  type: 'guide' | 'media' | 'event' | 'annotation'
  title: string
  description?: string
  status: 'pending' | 'approved' | 'rejected'
  rejectionReason?: string | null
  createdAt: string
  ownerType?: string
  ownerId?: number | string
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  guide: <FileText size={16} />,
  media: <FileImage size={16} />,
  event: <Calendar size={16} />,
  annotation: <MessageSquare size={16} />,
}

const TYPE_LABELS: Record<string, string> = {
  guide: 'Guide',
  media: 'Media',
  event: 'Event',
  annotation: 'Annotation',
}

const STATUS_COLORS: Record<string, string> = {
  approved: 'green',
  pending: 'yellow',
  rejected: 'red',
}

function getSubmissionLink(submission: SubmissionItem): string {
  if (submission.type === 'guide') return `/guides/${submission.id}`
  if (submission.type === 'event') return `/events/${submission.id}`
  if (submission.type === 'annotation') return `/annotations/${submission.id}`
  if (submission.type === 'media' && submission.ownerType && submission.ownerId) {
    const entityPathMap: Record<string, string> = {
      character: 'characters',
      arc: 'arcs',
      event: 'events',
      gamble: 'gambles',
      organization: 'organizations',
      guide: 'guides',
      user: 'users',
      volume: 'volumes',
    }
    const basePath = entityPathMap[submission.ownerType] || 'media'
    return `/${basePath}/${submission.ownerId}#media`
  }
  return '#'
}

function getEditLink(submission: SubmissionItem): string | null {
  if (submission.type === 'guide') return `/guides/${submission.id}`
  if (submission.type === 'annotation' && submission.ownerType && submission.ownerId) {
    const entityPathMap: Record<string, string> = {
      character: 'characters',
      gamble: 'gambles',
      arc: 'arcs',
    }
    const basePath = entityPathMap[submission.ownerType]
    if (basePath) return `/${basePath}/${submission.ownerId}`
  }
  return null
}

function getStatusLabel(submission: SubmissionItem): string {
  if (submission.type === 'event') {
    if (submission.status === 'pending') return 'Unverified'
    if (submission.status === 'approved') return 'Verified'
  }
  return submission.status
}

interface SubmissionCardProps {
  submission: SubmissionItem
  /** Whether this is the owner's view (shows edit/delete actions) */
  isOwnerView?: boolean
  /** Called when user wants to delete a media submission */
  onDeleteMedia?: (id: string) => void
  /** Card styling overrides */
  cardStyle?: React.CSSProperties
}

export default function SubmissionCard({
  submission,
  isOwnerView = false,
  onDeleteMedia,
  cardStyle,
}: SubmissionCardProps) {
  const statusColor = STATUS_COLORS[submission.status] || 'gray'
  const statusLabel = getStatusLabel(submission)
  const link = getSubmissionLink(submission)
  const editLink = getEditLink(submission)
  const isRejected = submission.status === 'rejected'
  const canEdit = isOwnerView && editLink && (submission.type === 'guide' || submission.type === 'annotation')
  const canDelete = isOwnerView && submission.type === 'media' && isRejected && onDeleteMedia

  // Determine if the entire card should be clickable
  const isCardClickable = submission.status === 'approved' && submission.type !== 'annotation' && link !== '#'

  const cardContent = (
    <Card
      padding="sm"
      radius="md"
      withBorder
      style={{
        ...cardStyle,
        cursor: isCardClickable ? 'pointer' : undefined,
        textDecoration: 'none',
        color: 'inherit',
        transition: 'transform 160ms ease, box-shadow 160ms ease',
      }}
      onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
        if (isCardClickable) {
          e.currentTarget.style.transform = 'translateY(-2px)'
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)'
        }
      }}
      onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
        if (isCardClickable) {
          e.currentTarget.style.transform = 'none'
          e.currentTarget.style.boxShadow = 'none'
        }
      }}
    >
      <Stack gap={6}>
        <Group justify="space-between" wrap="nowrap">
          <Group gap="sm" style={{ flex: 1, minWidth: 0 }}>
            {TYPE_ICONS[submission.type]}
            <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
              <Text fw={500} size="sm" lineClamp={1}>
                {submission.title}
              </Text>
              {submission.type === 'media' && submission.description && (
                <Text size="xs" c="dimmed" lineClamp={1}>
                  {submission.description}
                </Text>
              )}
              <Group gap="xs">
                <Badge size="xs" variant="light" color={statusColor}>
                  {statusLabel}
                </Badge>
                <Badge size="xs" variant="outline">
                  {TYPE_LABELS[submission.type]}
                </Badge>
                <Text size="xs" c="dimmed">
                  {new Date(submission.createdAt).toLocaleDateString()}
                </Text>
              </Group>
            </Stack>
          </Group>
          <Group gap={4} wrap="nowrap">
            {canEdit && (
              <Link href={editLink!} onClick={(e) => e.stopPropagation()}>
                <Button
                  size="xs"
                  variant="subtle"
                  color={isRejected ? 'orange' : undefined}
                  leftSection={<Edit size={14} />}
                >
                  {isRejected ? 'Edit & Resubmit' : 'Edit'}
                </Button>
              </Link>
            )}
            {canDelete && (
              <Button
                size="xs"
                variant="subtle"
                color="red"
                leftSection={<Trash2 size={14} />}
                onClick={(e) => {
                  e.stopPropagation()
                  e.preventDefault()
                  onDeleteMedia!(submission.id as string)
                }}
              >
                Delete
              </Button>
            )}
          </Group>
        </Group>
        {isOwnerView && isRejected && submission.rejectionReason && (
          <Alert
            icon={<AlertTriangle size={14} />}
            color="red"
            variant="light"
            p="xs"
            radius="sm"
          >
            <Text size="xs">{submission.rejectionReason}</Text>
          </Alert>
        )}
      </Stack>
    </Card>
  )

  if (isCardClickable) {
    return (
      <Link href={link} style={{ textDecoration: 'none', color: 'inherit' }}>
        {cardContent}
      </Link>
    )
  }

  return cardContent
}
