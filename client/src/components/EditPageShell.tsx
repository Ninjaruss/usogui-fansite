'use client'

import React from 'react'
import { Alert, Badge, Box, Group, Text, Title, rem } from '@mantine/core'
import { AlertTriangle, ChevronLeft, Info, Pencil } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'motion/react'

const AMBER = '#f59e0b'

const STATUS_BADGE: Record<string, { label: string; color: string }> = {
  pending:  { label: 'Pending Review', color: '#fbbf24' },
  approved: { label: 'Approved',       color: '#22c55e' },
  rejected: { label: 'Rejected',       color: '#f87171' },
}

export interface EditPageShellProps {
  type: 'guide' | 'media' | 'annotation' | 'event'
  accentColor: string
  submissionTitle: string
  status: 'pending' | 'approved' | 'rejected'
  submittedAt: string
  updatedAt?: string
  submissionId?: number | string   // optional — media uses UUID strings; omit to hide
  rejectionReason?: string | null
  children: React.ReactNode
}

export function EditPageShell({
  type,
  accentColor,
  submissionTitle,
  status,
  submittedAt,
  updatedAt,
  submissionId,
  rejectionReason,
  children,
}: EditPageShellProps) {
  const statusInfo = STATUS_BADGE[status] ?? STATUS_BADGE.pending
  const typeLabel = type.charAt(0).toUpperCase() + type.slice(1)

  const submittedDate = new Date(submittedAt).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
  const updatedDate = updatedAt
    ? new Date(updatedAt).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
      })
    : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {/* Breadcrumb */}
      <Group gap="xs" mb="md" style={{ fontSize: rem(13), color: '#666' }}>
        <Link
          href="/profile"
          style={{
            color: '#888',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: rem(4),
          }}
        >
          <ChevronLeft size={14} />
          My Submissions
        </Link>
        <Text c="dimmed" size="sm">/</Text>
        <Text size="sm" c="dimmed">Edit {typeLabel}</Text>
      </Group>

      {/* Edit Identity Header */}
      <Box
        mb="md"
        style={{
          backgroundColor: '#111114',
          border: `1px solid ${accentColor}22`,
          borderRadius: rem(10),
          padding: rem(20),
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Top gradient bar: amber → entity color → transparent */}
        <Box
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0,
            height: rem(2),
            background: `linear-gradient(90deg, ${AMBER}, ${accentColor} 45%, transparent)`,
            opacity: 0.85,
          }}
        />
        {/* Left stripe: amber → entity color → transparent */}
        <Box
          style={{
            position: 'absolute',
            top: 0, left: 0, bottom: 0,
            width: rem(3),
            background: `linear-gradient(180deg, ${AMBER} 0%, ${accentColor} 60%, transparent 100%)`,
          }}
        />

        <Group gap="md" align="flex-start" mt={rem(4)} ml={rem(8)}>
          {/* Icon */}
          <Box
            style={{
              width: rem(42), height: rem(42),
              borderRadius: rem(9),
              backgroundColor: `${accentColor}12`,
              border: `1px solid ${accentColor}25`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: accentColor,
              flexShrink: 0,
            }}
          >
            <Pencil size={18} />
          </Box>

          <Box style={{ flex: 1 }}>
            {/* Badge row */}
            <Group gap="xs" mb={rem(4)}>
              <Text
                size="xs"
                style={{
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color: accentColor,
                  fontWeight: 600,
                }}
              >
                {typeLabel} Submission
              </Text>
              <Badge
                size="xs"
                style={{
                  backgroundColor: `${AMBER}18`,
                  color: AMBER,
                  borderColor: `${AMBER}35`,
                }}
                variant="outline"
              >
                ✎ Editing
              </Badge>
              <Badge
                size="xs"
                style={{
                  backgroundColor: `${statusInfo.color}14`,
                  color: statusInfo.color,
                  borderColor: `${statusInfo.color}35`,
                }}
                variant="outline"
              >
                {statusInfo.label}
              </Badge>
            </Group>

            {/* Submission title */}
            <Title
              order={2}
              style={{
                fontFamily: 'var(--font-opti-goudy-text)',
                fontSize: rem(22),
                fontWeight: 400,
                lineHeight: 1.2,
                marginBottom: rem(6),
              }}
            >
              {submissionTitle}
            </Title>

            {/* Metadata */}
            <Text size="xs" c="dimmed">
              Submitted {submittedDate}
              {updatedDate && ` · Updated ${updatedDate}`}
              {submissionId != null && ` · ID #${submissionId}`}
            </Text>
          </Box>
        </Group>
      </Box>

      {/* Status Context Panel */}
      {status === 'rejected' && rejectionReason && (
        <Alert
          mb="md"
          icon={<AlertTriangle size={16} />}
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.06)',
            borderColor: 'rgba(239, 68, 68, 0.22)',
            borderLeft: '3px solid rgba(239, 68, 68, 0.6)',
          }}
        >
          <Text size="sm" c="#f87171" fw={700} mb={4} style={{ letterSpacing: '0.06em', textTransform: 'uppercase', fontSize: rem(10) }}>
            Moderator Feedback
          </Text>
          <Text size="sm" c="rgba(248, 113, 113, 0.85)">{rejectionReason}</Text>
        </Alert>
      )}

      {status === 'approved' && (
        <Alert
          mb="md"
          icon={<Info size={16} />}
          style={{
            backgroundColor: `${accentColor}08`,
            borderColor: `${accentColor}25`,
          }}
        >
          <Text size="sm" style={{ color: accentColor }}>
            This submission is approved and live. Editing will send it back for moderator re-review.
          </Text>
        </Alert>
      )}

      {children}
    </motion.div>
  )
}

export default EditPageShell
