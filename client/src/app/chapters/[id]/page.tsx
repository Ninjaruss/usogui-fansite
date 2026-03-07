import React from 'react'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { api } from '../../../lib/api'
import ChapterPageClient from './ChapterPageClient'
import { ChapterStructuredData } from '../../../components/StructuredData'
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

async function getChapterEvents(chapterNumber: number) {
  try {
    const result = await api.getEventsByChapter(chapterNumber)
    // Ensure we always return an array
    return Array.isArray(result) ? result : []
  } catch (error: unknown) {
    console.error('Error fetching chapter events:', error)
    return []
  }
}

async function getChapterQuotes(chapterNumber: number) {
  try {
    const result = await api.getQuotesByChapter(chapterNumber)
    // Ensure we always return an array
    return Array.isArray(result) ? result : []
  } catch (error: unknown) {
    console.error('Error fetching chapter quotes:', error)
    return []
  }
}

async function getChapterArc(chapterNumber: number) {
  try {
    const result = await api.getArcs({ limit: 100 })
    const arcs: Array<{ id: number; name: string; startChapter: number; endChapter: number }> = result.data || []
    return arcs.find(a => a.startChapter <= chapterNumber && a.endChapter >= chapterNumber) || null
  } catch (error: unknown) {
    console.error('Error fetching chapter arc:', error)
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
    title: `Chapter ${chapter.number}${chapter.title ? ` - ${chapter.title}` : ''} | Usogui Database`,
    description: chapter.summary
      ? chapter.summary.substring(0, 160).replace(/\n/g, ' ') + '...'
      : `Read about Chapter ${chapter.number} of Usogui. Summary and details are available for readers to revisit key events.`
  }
}

export default async function ChapterDetailPage({ params }: PageProps) {
  const { id } = await params
  const chapter = await getChapterData(id)

  if (!chapter) {
    notFound()
  }

  // Fetch events, quotes, and arc for this chapter
  const [events, quotes, arc] = await Promise.all([
    getChapterEvents(chapter.number),
    getChapterQuotes(chapter.number),
    getChapterArc(chapter.number)
  ])

  return (
    <>
      <ChapterStructuredData chapter={chapter} />
      <ChapterPageClient
        initialChapter={chapter}
        initialEvents={events}
        initialQuotes={quotes}
        initialArc={arc}
      />
    </>
  )
}

export const dynamic = 'force-dynamic'
