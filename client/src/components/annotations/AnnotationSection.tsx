'use client'

import React, { useEffect, useState } from 'react'
import {
  Card,
  Group,
  Stack,
  Text,
  Title,
  Button,
  Collapse,
  Skeleton,
  Badge,
  Modal,
  TextInput,
  Textarea,
  NumberInput,
  Switch,
  useMantineTheme,
} from '@mantine/core'
import {
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Plus,
} from 'lucide-react'
import Link from 'next/link'
import api from '../../lib/api'
import { Annotation, AnnotationOwnerType } from '../../types'
import { textColors, getCardStyles, getEntityThemeColor } from '../../lib/mantine-theme'
import AnnotationCard from './AnnotationCard'

interface AnnotationSectionProps {
  ownerType?: AnnotationOwnerType
  ownerId?: number
  chapterReference?: number
  userProgress?: number
  currentUserId?: number
  isAuthenticated?: boolean
}

export default function AnnotationSection({
  ownerType,
  ownerId,
  chapterReference,
  userProgress = 999,
  currentUserId,
  isAuthenticated = false,
}: AnnotationSectionProps) {
  const theme = useMantineTheme()
  const [annotations, setAnnotations] = useState<Annotation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)

  const entityColor = theme.colors.violet[5]

  useEffect(() => {
    const fetchAnnotations = async () => {
      try {
        setLoading(true)
        setError(null)

        let result: Annotation[]

        // Handle chapter annotations via chapterReference
        if (chapterReference !== undefined) {
          result = await api.getAnnotationsForChapter(chapterReference)
        } else if (ownerType && ownerId !== undefined) {
          switch (ownerType) {
            case AnnotationOwnerType.CHARACTER:
              result = await api.getAnnotationsForCharacter(ownerId)
              break
            case AnnotationOwnerType.GAMBLE:
              result = await api.getAnnotationsForGamble(ownerId)
              break
            case AnnotationOwnerType.ARC:
              result = await api.getAnnotationsForArc(ownerId)
              break
            default:
              result = []
          }
        } else {
          result = []
        }

        setAnnotations(result)
      } catch (err) {
        console.error('Failed to fetch annotations:', err)
        setError('Failed to load annotations')
      } finally {
        setLoading(false)
      }
    }

    fetchAnnotations()
  }, [ownerType, ownerId, chapterReference])

  const handleDelete = async (annotationId: number) => {
    if (!confirm('Are you sure you want to delete this annotation?')) {
      return
    }

    try {
      await api.deleteAnnotation(annotationId)
      setAnnotations((prev) => prev.filter((a) => a.id !== annotationId))
    } catch (err) {
      console.error('Failed to delete annotation:', err)
      alert('Failed to delete annotation')
    }
  }

  const [editingAnnotation, setEditingAnnotation] = useState<Annotation | null>(null)
  const [editForm, setEditForm] = useState({ title: '', content: '', sourceUrl: '', chapterReference: undefined as number | undefined, isSpoiler: false, spoilerChapter: undefined as number | undefined })
  const [editSaving, setEditSaving] = useState(false)

  const handleEdit = (annotation: Annotation) => {
    setEditingAnnotation(annotation)
    setEditForm({
      title: annotation.title,
      content: annotation.content,
      sourceUrl: annotation.sourceUrl || '',
      chapterReference: annotation.chapterReference || undefined,
      isSpoiler: annotation.isSpoiler,
      spoilerChapter: annotation.spoilerChapter || undefined,
    })
  }

  const handleEditSave = async () => {
    if (!editingAnnotation) return
    setEditSaving(true)
    try {
      const updated = await api.updateAnnotation(editingAnnotation.id, {
        title: editForm.title,
        content: editForm.content,
        sourceUrl: editForm.sourceUrl || undefined,
        chapterReference: editForm.chapterReference,
        isSpoiler: editForm.isSpoiler,
        spoilerChapter: editForm.isSpoiler ? editForm.spoilerChapter : undefined,
      })
      setAnnotations((prev) =>
        prev.map((a) => (a.id === editingAnnotation.id ? { ...a, ...updated } : a))
      )
      setEditingAnnotation(null)
    } catch (err) {
      console.error('Failed to update annotation:', err)
      alert('Failed to update annotation')
    } finally {
      setEditSaving(false)
    }
  }

  // Don't render if loading and no annotations, or if there's an error
  if (loading) {
    return (
      <Card withBorder radius="lg" shadow="lg" style={getCardStyles(theme, entityColor)}>
        <Stack gap="md" p="md">
          <Group gap="sm">
            <Skeleton circle height={24} width={24} />
            <Skeleton height={20} width={150} />
          </Group>
          <Stack gap="sm">
            {[1, 2].map((i) => (
              <Skeleton key={i} height={80} />
            ))}
          </Stack>
        </Stack>
      </Card>
    )
  }

  if (error) {
    return null
  }

  // Don't show section if no annotations and user is not authenticated
  if (annotations.length === 0 && !isAuthenticated) {
    return null
  }

  return (
    <Card withBorder radius="lg" shadow="lg" style={getCardStyles(theme, entityColor)}>
      <Stack gap="md" p="md">
        {/* Header */}
        <Group justify="space-between" align="center">
          <Group gap="sm">
            <MessageSquare size={20} color={entityColor} />
            <Title order={4} c={textColors.primary}>
              Annotations
            </Title>
            {annotations.length > 0 && (
              <Badge size="sm" variant="light" color="violet">
                {annotations.length}
              </Badge>
            )}
          </Group>

          <Group gap="sm">
            {isAuthenticated && (
              <Button
                component={Link}
                href={`/submit-annotation?type=${ownerType}&id=${ownerId}`}
                size="xs"
                variant="light"
                color="violet"
                leftSection={<Plus size={14} />}
              >
                Add
              </Button>
            )}

            {annotations.length > 0 && (
              <Button
                variant="subtle"
                size="xs"
                onClick={() => setExpanded(!expanded)}
                rightSection={
                  expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                }
              >
                {expanded ? 'Collapse' : 'Expand'}
              </Button>
            )}
          </Group>
        </Group>

        {/* Empty state */}
        {annotations.length === 0 && (
          <Text size="sm" c={textColors.tertiary} ta="center" py="md">
            No annotations yet.
            {isAuthenticated
              ? ' Be the first to add one!'
              : ' Log in to add annotations.'}
          </Text>
        )}

        {/* Annotation list */}
        {annotations.length > 0 && (
          <>
            {/* Preview (first 2 annotations) */}
            {!expanded && (
              <Stack gap="sm">
                {annotations.slice(0, 2).map((annotation) => (
                  <div key={annotation.id} id={`annotation-${annotation.id}`}>
                    <AnnotationCard
                      annotation={annotation}
                      userProgress={userProgress}
                      isOwner={currentUserId === annotation.authorId}
                      onEdit={
                        currentUserId === annotation.authorId
                          ? handleEdit
                          : undefined
                      }
                      onDelete={
                        currentUserId === annotation.authorId
                          ? handleDelete
                          : undefined
                      }
                    />
                  </div>
                ))}
                {annotations.length > 2 && (
                  <Text size="xs" c={textColors.tertiary} ta="center">
                    +{annotations.length - 2} more annotation
                    {annotations.length - 2 !== 1 ? 's' : ''}
                  </Text>
                )}
              </Stack>
            )}

            {/* Full list */}
            <Collapse in={expanded}>
              <Stack gap="sm">
                {annotations.map((annotation) => (
                  <div key={annotation.id} id={`annotation-${annotation.id}`}>
                    <AnnotationCard
                      annotation={annotation}
                      userProgress={userProgress}
                      isOwner={currentUserId === annotation.authorId}
                      onEdit={
                        currentUserId === annotation.authorId
                          ? handleEdit
                          : undefined
                      }
                      onDelete={
                        currentUserId === annotation.authorId
                          ? handleDelete
                          : undefined
                      }
                    />
                  </div>
                ))}
              </Stack>
            </Collapse>
          </>
        )}
      </Stack>

      {/* Edit Modal */}
      <Modal
        opened={!!editingAnnotation}
        onClose={() => setEditingAnnotation(null)}
        title="Edit Annotation"
        size="lg"
        styles={{
          header: { backgroundColor: theme.colors.dark[7], color: textColors.primary },
          body: { backgroundColor: theme.colors.dark[7] },
          content: { backgroundColor: theme.colors.dark[7] },
        }}
      >
        <Stack gap="md">
          <TextInput
            label="Title"
            required
            value={editForm.title}
            onChange={(e) => setEditForm((f) => ({ ...f, title: e.currentTarget.value }))}
          />
          <Textarea
            label="Content"
            required
            minRows={5}
            autosize
            value={editForm.content}
            onChange={(e) => setEditForm((f) => ({ ...f, content: e.currentTarget.value }))}
          />
          <TextInput
            label="Source URL"
            value={editForm.sourceUrl}
            onChange={(e) => setEditForm((f) => ({ ...f, sourceUrl: e.currentTarget.value }))}
          />
          <NumberInput
            label="Chapter Reference"
            value={editForm.chapterReference ?? ''}
            onChange={(val) => setEditForm((f) => ({ ...f, chapterReference: val ? Number(val) : undefined }))}
          />
          <Switch
            label="Contains Spoilers"
            checked={editForm.isSpoiler}
            onChange={(e) => setEditForm((f) => ({ ...f, isSpoiler: e.currentTarget.checked }))}
          />
          {editForm.isSpoiler && (
            <NumberInput
              label="Spoiler Chapter"
              value={editForm.spoilerChapter ?? ''}
              onChange={(val) => setEditForm((f) => ({ ...f, spoilerChapter: val ? Number(val) : undefined }))}
            />
          )}
          <Group justify="flex-end" gap="sm">
            <Button variant="subtle" onClick={() => setEditingAnnotation(null)}>
              Cancel
            </Button>
            <Button
              color="violet"
              loading={editSaving}
              disabled={!editForm.title.trim() || !editForm.content.trim()}
              onClick={handleEditSave}
            >
              Save Changes
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Card>
  )
}
