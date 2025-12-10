import React from 'react'
import { Alert, Button, Container, Stack } from '@mantine/core'
import { colors } from '../../../lib/mantine-theme'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Metadata } from 'next'
import { api } from '../../../lib/api'
import ChapterPageClient from './ChapterPageClient'
import type { Chapter } from '../../../types'

interface PageProps {
  params: Promise<{ id: string }>
}

async function getChapterData(id: string): Promise<Chapter | null> {
  try {
    if (!id || isNaN(Number(id))) {
      throw new Error('Invalid chapter ID')
    }
    const chapterId = Number(id)
    if (chapterId <= 0) {
      throw new Error('Invalid chapter ID')
    }
    return await api.getChapter(chapterId)
  } catch (error: unknown) {
    console.error('Error fetching chapter data:', error)
    return null
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const chapter = await getChapterData(id)

  if (!chapter) {
    return {
      title: 'Chapter Not Found - Usogui Fansite',
      description: 'The requested chapter could not be found.'
    }
  }

  return {
    title: `Chapter ${chapter.number}${chapter.title ? ` - ${chapter.title}` : ''} | Usogui Fansite`,
    description: chapter.summary
      ? chapter.summary.substring(0, 160).replace(/\n/g, ' ') + '...'
      : `Read about Chapter ${chapter.number} of Usogui. Summary and details are available for readers to revisit key events.`
  }
}

export default async function ChapterDetailPage({ params }: PageProps) {
  const { id } = await params
  const chapter = await getChapterData(id)

  if (!chapter) {
    return (
      <Container size="lg" py="xl">
        <Stack gap="md">
          <Alert style={{ color: colors.gamble[5] }} radius="md">
            Chapter not found
          </Alert>
          <Button component={Link} href="/chapters" variant="subtle" color="gray" leftSection={<ArrowLeft size={18} />}>
            Back to Chapters
          </Button>
        </Stack>
      </Container>
    )
  }

  return <ChapterPageClient initialChapter={chapter} />
}

export const dynamic = 'force-dynamic'
