import React from 'react'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { api } from '../../../lib/api'
import ArcPageClient from './ArcPageClient'

interface PageProps {
  params: Promise<{ id: string }>
}

interface Arc {
  id: number
  name: string
  description: string
  startChapter: number
  endChapter: number
  order?: number
  imageFileName?: string
  imageDisplayName?: string
  createdAt: string
  updatedAt: string
}

interface Character {
  id: number
  name: string
}

interface Event {
  id: number
  title: string
  description: string
  type: string
  chapterNumber: number
  characters?: Character[]
}

interface ArcGroup {
  arc: Arc
  events: Event[]
}

async function getArcData(id: string) {
  try {
    if (!id || isNaN(Number(id))) {
      throw new Error('Invalid arc ID')
    }

    const arcId = Number(id)
    if (arcId <= 0) {
      throw new Error('Invalid arc ID')
    }

    const [arcData, eventsGroupedData, gamblesData, chaptersData] = await Promise.all([
      api.getArc(arcId),
      api.getEventsGroupedByArc(),
      api.getArcGambles(arcId),
      api.getChapters({ limit: 500, sort: 'number', order: 'ASC' })
    ])

    const arcGroup = eventsGroupedData.arcs.find((group: ArcGroup) => group.arc.id === arcId)
    const events = arcGroup?.events || []
    const gambles = gamblesData.data || []

    const arcChapters = (chaptersData.data || chaptersData || []).filter(
      (c: { number: number }) => c.number >= arcData.startChapter && c.number <= arcData.endChapter
    )

    return {
      arc: arcData,
      events,
      gambles,
      chapters: arcChapters
    }
  } catch (error: unknown) {
    console.error('Error fetching arc data:', error)
    return null
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const data = await getArcData(id)

  if (!data?.arc) {
    return {
      title: 'Arc Not Found - Usogui Database',
      description: 'The requested arc could not be found.'
    }
  }

  const { arc, events, gambles } = data
  const chapterCount = arc.endChapter - arc.startChapter + 1

  return {
    title: `${arc.name} - Arc Details`,
    description: `Explore ${arc.name}, spanning chapters ${arc.startChapter}-${arc.endChapter} with ${chapterCount} chapters, ${events.length} key events, and ${gambles.length} gambles. ${arc.description ? arc.description.slice(0, 100) + '...' : ''}`,
    keywords: `Usogui, ${arc.name}, arc, chapters ${arc.startChapter}-${arc.endChapter}, manga, gambling`,
    openGraph: {
      title: `${arc.name} - Usogui Arc`,
      description: `${arc.name} spans chapters ${arc.startChapter}-${arc.endChapter} with ${events.length} events and ${gambles.length} gambles.`,
      type: 'article',
      images: arc.imageFileName
        ? [{ url: `/api/media/arc/${arc.imageFileName}`, alt: `${arc.name} cover image` }]
        : undefined
    },
    twitter: {
      card: 'summary_large_image',
      title: `${arc.name} - Usogui Arc`,
      description: `Explore the ${arc.name} arc with ${chapterCount} chapters and ${events.length} key events.`
    }
  }
}

export default async function ArcDetailPage({ params }: PageProps) {
  const { id } = await params
  const data = await getArcData(id)

  if (!data?.arc) {
    notFound()
  }

  const { arc, events, gambles, chapters } = data

  return <ArcPageClient initialArc={arc} initialEvents={events} initialGambles={gambles} initialChapters={chapters} />
}

export const dynamic = 'force-dynamic'
