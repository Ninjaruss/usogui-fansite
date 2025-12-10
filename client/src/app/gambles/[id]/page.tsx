import React from 'react'
import { Alert, Button, Container, Stack } from '@mantine/core'
import { colors } from '../../../lib/mantine-theme'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Metadata } from 'next'
import { api } from '../../../lib/api'
import GamblePageClient from './GamblePageClient'

interface PageProps {
  params: Promise<{ id: string }>
}

interface Gamble {
  id: number
  name: string
  description?: string
  rules: string
  winCondition?: string
  chapterId: number
  participants?: Array<{
    id: number
    name: string
    description?: string
    alternateNames?: string[]
  }>
  chapter?: {
    id: number
    number: number
    title?: string
  }
  createdAt: string
  updatedAt: string
}

async function getGambleData(id: string): Promise<Gamble | null> {
  try {
    if (!id || isNaN(Number(id))) {
      throw new Error('Invalid gamble ID')
    }
    const gambleId = Number(id)
    if (gambleId <= 0) {
      throw new Error('Invalid gamble ID')
    }

    return await api.getGamble(gambleId)
  } catch (error: unknown) {
    console.error('Error fetching gamble data:', error)
    return null
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const gamble = await getGambleData(id)

  if (!gamble) {
    return {
      title: 'Gamble Not Found - Usogui Fansite',
      description: 'The requested gamble could not be found.'
    }
  }

  const chapterInfo = gamble.chapter
    ? `Chapter ${gamble.chapter.number}${gamble.chapter.title ? ` - ${gamble.chapter.title}` : ''}`
    : `Chapter ${gamble.chapterId}`
  const participantCount = gamble.participants?.length ?? 0

  return {
    title: `${gamble.name} - Gamble Details | Usogui Fansite`,
    description: `Explore the ${gamble.name} gamble from ${chapterInfo}${participantCount > 0 ? ` with ${participantCount} participants` : ''}. ${(gamble.description || gamble.rules).slice(0, 120)}...`,
    keywords: `Usogui, ${gamble.name}, gamble, ${chapterInfo}, manga, gambling${gamble.participants?.map((p) => `, ${p.name}`).join('') || ''}`,
    openGraph: {
      title: `${gamble.name} - Usogui Gamble`,
      description: `${gamble.name} originates from ${chapterInfo}${participantCount > 0 ? ` and features ${participantCount} participants` : ''}.`,
      type: 'article'
    },
    twitter: {
      card: 'summary',
      title: `${gamble.name} - Usogui Gamble`,
      description: `Explore the rules and mechanics of the ${gamble.name} gamble from ${chapterInfo}.`
    }
  }
}

export default async function GambleDetailPage({ params }: PageProps) {
  const { id } = await params
  const gamble = await getGambleData(id)

  if (!gamble) {
    return (
      <Container size="lg" py="xl">
        <Stack gap="md">
          <Alert style={{ color: colors.gamble[5] }} radius="md">
            Gamble not found
          </Alert>
          <Button
            component={Link}
            href="/gambles"
            variant="subtle"
            color="gray"
            leftSection={<ArrowLeft size={18} />}
            maw={220}
          >
            Back to Gambles
          </Button>
        </Stack>
      </Container>
    )
  }

  return <GamblePageClient initialGamble={gamble} />
}

export const dynamic = 'force-dynamic'
