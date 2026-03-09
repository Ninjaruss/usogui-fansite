import React from 'react'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { api } from '../../../lib/api'
import VolumePageClient from './VolumePageClient'
import { VolumeStructuredData } from '../../../components/StructuredData'

interface PageProps {
  params: Promise<{ id: string }>
}

interface Volume {
  id: number
  number: number
  title?: string
  description?: string
  coverUrl?: string
  startChapter: number
  endChapter: number
  createdAt: string
  updatedAt: string
}

// Fetch volume data at build time or request time
async function getVolumeData(id: string) {
  try {
    const volumeId = Number(id)

    // Fetch volume and chapters data
    const [volumeData, chaptersData] = await Promise.all([
      api.getVolume(volumeId),
      api.getVolumeChapters(volumeId)
    ])

    // Fetch detailed chapter information for each chapter number
    const chapterDetails = await Promise.all(
      chaptersData.chapters.map(chapterNumber =>
        api.getChapterByNumber(chapterNumber)
      )
    )

    // Fetch arcs that overlap with this volume's chapter range
    const arcsResult = await api.getArcs({ limit: 100 })
    const overlappingArcs = (arcsResult.data || []).filter(
      (a: { startChapter: number; endChapter: number }) =>
        a.startChapter <= volumeData.endChapter && a.endChapter >= volumeData.startChapter
    )

    return {
      volume: volumeData,
      chapters: chapterDetails,
      arcs: overlappingArcs
    }
  } catch (error: unknown) {
    console.error('Error fetching volume data:', error)
    return null
  }
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const data = await getVolumeData(id)

  if (!data?.volume) {
    return {
      title: 'Volume Not Found - Usogui Database',
      description: 'The requested volume could not be found.'
    }
  }

  const { volume, chapters } = data
  const chapterCount = volume.endChapter - volume.startChapter + 1

  return {
    title: `Volume ${volume.number}${volume.title ? ` - ${volume.title}` : ''} | Usogui Database`,
    description: `Volume ${volume.number} of Usogui${volume.title ? ` (${volume.title})` : ''} spans chapters ${volume.startChapter}-${volume.endChapter} with ${chapterCount} chapters. ${volume.description ? volume.description.slice(0, 120) + '...' : ''}`,
    keywords: `Usogui, Volume ${volume.number}, chapters ${volume.startChapter}-${volume.endChapter}, manga${volume.title ? `, ${volume.title}` : ''}`,
    openGraph: {
      title: `Volume ${volume.number}${volume.title ? ` - ${volume.title}` : ''} - Usogui`,
      description: `Volume ${volume.number} contains chapters ${volume.startChapter}-${volume.endChapter} (${chapterCount} chapters total).`,
      type: 'article'
    },
    twitter: {
      card: 'summary',
      title: `Volume ${volume.number} - Usogui`,
      description: `Explore Volume ${volume.number} with chapters ${volume.startChapter}-${volume.endChapter}.`
    }
  }
}

export default async function VolumeDetailPage({ params }: PageProps) {
  const { id } = await params
  const data = await getVolumeData(id)

  if (!data?.volume) {
    notFound()
  }

  const { volume, chapters, arcs } = data

  return (
    <>
      <VolumeStructuredData volume={volume} />
      <VolumePageClient
        initialVolume={volume}
        initialChapters={chapters}
        initialArcs={arcs}
      />
    </>
  )
}

// Force dynamic rendering to ensure SSR
export const dynamic = 'force-dynamic'
