'use client'

import React, { useState } from 'react'
import {
  Anchor,
  ActionIcon,
  Badge,
  Box,
  Collapse,
  Group,
  Stack,
  Text,
  Tooltip,
  useMantineTheme,
} from '@mantine/core'
import {
  ExternalLink,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Edit,
  Trash2,
  BookOpen,
} from 'lucide-react'
import Link from 'next/link'
import { Annotation, AnnotationStatus } from '../../types'
import { getEntityThemeColor } from '../../lib/mantine-theme'
import EnhancedSpoilerMarkdown from '../EnhancedSpoilerMarkdown'

interface AnnotationCardProps {
  annotation: Annotation
  userProgress?: number
  isOwner?: boolean
  onEdit?: (annotation: Annotation) => void
  onDelete?: (annotationId: number) => void
}

function getStatusColor(status: AnnotationStatus): string {
  switch (status) {
    case AnnotationStatus.APPROVED:
      return '#51cf66'
    case AnnotationStatus.PENDING:
      return '#fab005'
    case AnnotationStatus.REJECTED:
      return '#ff6b6b'
    default:
      return '#868e96'
  }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export default function AnnotationCard({
  annotation,
  userProgress = 999,
  isOwner = false,
  onEdit,
  onDelete,
}: AnnotationCardProps) {
  const theme = useMantineTheme()
  const annotationColor = getEntityThemeColor(theme, 'annotation')
  const [expanded, setExpanded] = useState(false)

  const isSpoilerHidden =
    annotation.isSpoiler &&
    annotation.spoilerChapter &&
    userProgress < annotation.spoilerChapter

  const canShowContent = !isSpoilerHidden

  return (
    <Box
      style={{
        background: `linear-gradient(135deg, ${annotationColor}0d 0%, #0d0d0d 55%, #0a0a0a 100%)`,
        border: `1px solid ${annotationColor}25`,
        borderRadius: 10,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* 1px top accent */}
      <Box style={{ height: 1, background: `linear-gradient(90deg, ${annotationColor}, ${annotationColor}60 40%, transparent 80%)` }} />
      {/* 2px left vertical accent */}
      <Box
        style={{
          position: 'absolute',
          left: 0,
          top: 1,
          bottom: 0,
          width: 2,
          background: `linear-gradient(180deg, ${annotationColor}, ${annotationColor}40)`,
        }}
      />
      <Box p="md" pl="lg">
        <Stack gap="xs">
          {/* Header */}
          <Group justify="space-between" wrap="nowrap">
            <Text fw={700} size="sm" style={{ color: '#e8c0f8' }} truncate>
              {annotation.title}
            </Text>

            <Group gap="xs" wrap="nowrap">
              {annotation.isSpoiler && (
                <Tooltip
                  label={
                    isSpoilerHidden
                      ? `Spoiler for Chapter ${annotation.spoilerChapter}+`
                      : 'Contains spoilers'
                  }
                >
                  <Badge
                    size="xs"
                    variant="light"
                    color="orange"
                    leftSection={<AlertTriangle size={10} />}
                  >
                    Spoiler
                  </Badge>
                </Tooltip>
              )}

              {isOwner && annotation.status !== AnnotationStatus.APPROVED && (
                <Badge
                  size="xs"
                  variant="light"
                  style={{
                    backgroundColor: `${getStatusColor(annotation.status)}20`,
                    color: getStatusColor(annotation.status),
                    border: `1px solid ${getStatusColor(annotation.status)}40`,
                  }}
                >
                  {annotation.status}
                </Badge>
              )}

              <ActionIcon
                variant="subtle"
                size="sm"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </ActionIcon>
            </Group>
          </Group>

          {/* Collapsed preview */}
          {!expanded && canShowContent && (
            <Text size="xs" style={{ color: '#9070b0' }} lineClamp={2}>
              {annotation.content.substring(0, 150)}
              {annotation.content.length > 150 ? '...' : ''}
            </Text>
          )}

          {/* Spoiler warning when collapsed */}
          {!expanded && !canShowContent && (
            <Box
              p="xs"
              style={{
                backgroundColor: `${theme.colors.orange[9]}20`,
                borderRadius: theme.radius.sm,
              }}
            >
              <Group gap="xs">
                <AlertTriangle size={14} color={theme.colors.orange[5]} />
                <Text size="xs" style={{ color: theme.colors.orange[5] }}>
                  This annotation contains spoilers for Chapter{' '}
                  {annotation.spoilerChapter}+. Update your reading progress to view.
                </Text>
              </Group>
            </Box>
          )}

          {/* Expanded content */}
          <Collapse in={expanded}>
            <Stack gap="sm" pt="xs">
              {canShowContent ? (
                <Box
                  p="sm"
                  style={{
                    backgroundColor: '#0a0a0a',
                    border: `1px solid ${annotationColor}18`,
                    borderRadius: theme.radius.sm,
                  }}
                >
                  <EnhancedSpoilerMarkdown content={annotation.content} />
                </Box>
              ) : (
                <Box
                  p="md"
                  style={{
                    backgroundColor: `${theme.colors.orange[9]}20`,
                    borderRadius: theme.radius.sm,
                  }}
                >
                  <Stack gap="xs" align="center">
                    <AlertTriangle size={24} color={theme.colors.orange[5]} />
                    <Text size="sm" style={{ color: theme.colors.orange[5] }} ta="center">
                      This annotation contains spoilers for Chapter{' '}
                      {annotation.spoilerChapter}+
                    </Text>
                    <Text size="xs" style={{ color: '#9070b0' }} ta="center">
                      Update your reading progress to view this content.
                    </Text>
                  </Stack>
                </Box>
              )}

              {/* Metadata */}
              <Group justify="space-between" wrap="wrap" gap="xs">
                <Group gap="xs">
                  {annotation.sourceUrl && (
                    <Tooltip label="View source">
                      <Anchor
                        href={annotation.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        size="xs"
                        style={{ color: '#9070b0' }}
                      >
                        <Group gap={4}>
                          <ExternalLink size={12} />
                          <Text size="xs">Source</Text>
                        </Group>
                      </Anchor>
                    </Tooltip>
                  )}

                  {annotation.chapterReference && (
                    <Tooltip label="Chapter reference">
                      <Badge
                        size="xs"
                        variant="outline"
                        color="gray"
                        leftSection={<BookOpen size={10} />}
                      >
                        Ch. {annotation.chapterReference}
                      </Badge>
                    </Tooltip>
                  )}
                </Group>

                <Group gap="xs">
                  <Text size="xs" style={{ color: '#6040a0' }}>
                    by {annotation.author?.username || 'Unknown'} on{' '}
                    {formatDate(annotation.createdAt)}
                  </Text>

                  {isOwner && (
                    <Group gap={4}>
                      {onEdit && (
                        <Tooltip label="Edit annotation">
                          <ActionIcon
                            variant="subtle"
                            size="xs"
                            onClick={() => onEdit(annotation)}
                          >
                            <Edit size={12} />
                          </ActionIcon>
                        </Tooltip>
                      )}
                      {onDelete && (
                        <Tooltip label="Delete annotation">
                          <ActionIcon
                            variant="subtle"
                            size="xs"
                            color="red"
                            onClick={() => onDelete(annotation.id)}
                          >
                            <Trash2 size={12} />
                          </ActionIcon>
                        </Tooltip>
                      )}
                    </Group>
                  )}
                </Group>
              </Group>

              {/* Rejection reason */}
              {isOwner &&
                annotation.status === AnnotationStatus.REJECTED &&
                annotation.rejectionReason && (
                  <Box
                    p="xs"
                    style={{
                      backgroundColor: `${theme.colors.red[9]}20`,
                      borderRadius: theme.radius.sm,
                    }}
                  >
                    <Text size="xs" style={{ color: theme.colors.red[4] }}>
                      <strong>Rejection reason:</strong>{' '}
                      {annotation.rejectionReason}
                    </Text>
                  </Box>
                )}
            </Stack>
          </Collapse>
        </Stack>
      </Box>
    </Box>
  )
}
