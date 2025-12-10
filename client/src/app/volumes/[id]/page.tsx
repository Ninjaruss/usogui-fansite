import React from 'react'
import { Alert, Box, Button, Container, Stack, Text } from '@mantine/core'
import { colors } from '../../../lib/mantine-theme'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Metadata } from 'next'
import { api } from '../../../lib/api'
import VolumePageClient from './VolumePageClient'

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

    return {
      volume: volumeData,
      chapters: chapterDetails
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
      title: 'Volume Not Found - Usogui Fansite',
      description: 'The requested volume could not be found.'
    }
  }

  const { volume, chapters } = data
  const chapterCount = volume.endChapter - volume.startChapter + 1

  return {
    title: `Volume ${volume.number}${volume.title ? ` - ${volume.title}` : ''} | Usogui Fansite`,
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
    return (
      <Container size="lg" py="xl">
        <Stack gap="md">
          <Alert style={{ color: colors.gamble[5] }} radius="md">
            <Text size="sm">Volume not found</Text>
          </Alert>
          <Box>
            <Button
              component={Link}
              href="/volumes"
              variant="outline"
              style={{ color: colors.gamble[5] }}
              leftSection={<ArrowLeft size={16} />}
            >
              Back to Volumes
            </Button>
          </Box>
        </Stack>
      </Container>
    )
  }

  const { volume, chapters } = data

  return (
    <VolumePageClient
      initialVolume={volume}
      initialChapters={chapters}
    />
  )
}

// Force dynamic rendering to ensure SSR
export const dynamic = 'force-dynamic'
