import React from 'react'
import {
  Badge,
  Box,
  Card,
  Container,
  Grid,
  Group,
  Stack,
  Text,
  Title,
} from '@mantine/core'
import { notFound } from 'next/navigation'
import { BackButton } from '../../../components/BackButton'
import { CharacterStructuredData } from '../../../components/StructuredData'
import type { Arc, Event, Gamble, Guide, Quote } from '../../../types'
import { GuideStatus } from '../../../types'
import { Metadata } from 'next'
import nextDynamic from 'next/dynamic'
import { API_BASE_URL } from '../../../lib/api'

const CharacterPageClient = nextDynamic(() => import('./CharacterPageClient'), {
  loading: () => <Box py="md">Loading...</Box>
})

interface Character {
  id: number
  name: string
  alternateNames: string[] | null
  description: string | null
  backstory?: string | null
  firstAppearanceChapter: number | null
  imageFileName?: string | null
  imageDisplayName?: string | null
  organizations?: Array<{
    id: number
    name: string
    description?: string
  }>
  arcs?: Array<{
    id: number
    name: string
    order: number
  }>
}

interface CharacterPageData {
  character: Character
  gambles: Gamble[]
  events: Event[]
  guides: Guide[]
  quotes: Quote[]
  arcs: Arc[]
}

async function fetchCharacterData(characterId: number): Promise<CharacterPageData> {
  try {
    const [characterRes, gamblesRes, eventsRes, guidesRes, quotesRes, allArcsRes] = await Promise.all([
      fetch(`${API_BASE_URL}/characters/${characterId}`, { next: { revalidate: 300 } }),
      fetch(`${API_BASE_URL}/characters/${characterId}/gambles`, { next: { revalidate: 300 } }),
      fetch(`${API_BASE_URL}/characters/${characterId}/events`, { next: { revalidate: 300 } }),
      fetch(`${API_BASE_URL}/characters/${characterId}/guides?limit=5&status=${GuideStatus.APPROVED}`, { next: { revalidate: 300 } }),
      fetch(`${API_BASE_URL}/characters/${characterId}/quotes?limit=10`, { next: { revalidate: 300 } }),
      fetch(`${API_BASE_URL}/arcs`, { next: { revalidate: 300 } })
    ])

    if (!characterRes.ok) {
      throw new Error('Character not found')
    }

    const [character, gamblesData, eventsData, guidesData, quotesData, allArcsData] = await Promise.all([
      characterRes.json(),
      gamblesRes.ok ? gamblesRes.json() : { data: [] },
      eventsRes.ok ? eventsRes.json() : { data: [] },
      guidesRes.ok ? guidesRes.json() : { data: [] },
      quotesRes.ok ? quotesRes.json() : { data: [] },
      allArcsRes.ok ? allArcsRes.json() : { data: [] }
    ])

    // Filter arcs based on character events
    const characterArcIds = new Set(
      eventsData.data?.map((event: Event & { arcId?: number }) => event.arcId).filter(Boolean) || []
    )
    const filteredArcs = allArcsData.data?.filter((arc: Arc) => characterArcIds.has(arc.id)) || []

    // Note: Gambles are already filtered by the API endpoint `/characters/${characterId}/gambles`
    // This endpoint returns gambles that are related to the character through events
    const characterGambles = gamblesData.data || []

    return {
      character,
      gambles: characterGambles,
      events: eventsData.data || [],
      guides: guidesData.data || [],
      quotes: quotesData.data || [],
      arcs: filteredArcs
    }
  } catch (error) {
    console.error('Error fetching character data:', error)
    throw error
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const characterId = parseInt(id)

  if (isNaN(characterId) || characterId <= 0) {
    return {
      title: 'Character Not Found - Usogui Database'
    }
  }

  try {
    const { character } = await fetchCharacterData(characterId)
    const imageUrl = character.imageFileName
      ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/media/character/${character.imageFileName}`
      : undefined

    return {
      title: `${character.name} - Usogui Database`,
      description: character.description
        ? character.description.substring(0, 160).replace(/\n/g, ' ') + '...'
        : `Learn about ${character.name}, a character from the Usogui manga series. View their story arcs, gambles, quotes, and more.`,
      openGraph: {
        title: `${character.name} - Usogui Database`,
        description: character.description?.substring(0, 160) || `Character profile for ${character.name}`,
        images: imageUrl ? [{ url: imageUrl, alt: character.name }] : [],
        type: 'article'
      },
      twitter: {
        card: 'summary_large_image',
        title: `${character.name} - Usogui Database`,
        description: character.description?.substring(0, 160) || `Character profile for ${character.name}`,
        images: imageUrl ? [imageUrl] : []
      }
    }
  } catch {
    return {
      title: 'Character Not Found - Usogui Database'
    }
  }
}

export default async function CharacterDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const characterId = parseInt(id)

  if (isNaN(characterId) || characterId <= 0) {
    notFound()
  }

  let data: CharacterPageData

  try {
    data = await fetchCharacterData(characterId)
  } catch (error) {
    console.error('Error fetching character:', error)
    notFound()
  }

  const { character, gambles, events, guides, quotes, arcs } = data

  // Transform events to match the timeline component's expected interface
  const timelineEvents = events.map(event => ({
    id: event.id,
    title: event.title,
    description: event.description,
    chapterNumber: event.chapterNumber,
    type: event.type,
    arcId: event.arcId || 0,
    arcName: event.arc?.name || 'Unknown Arc',
    isSpoiler: event.spoilerChapter !== undefined,
    spoilerChapter: event.spoilerChapter
  }))

  return (
    <Container size="lg" py="xl">
      <CharacterStructuredData
        character={{
          id: character.id,
          name: character.name,
          alternateNames: character.alternateNames,
          description: character.description,
          firstAppearanceChapter: character.firstAppearanceChapter,
          imageUrl: character.imageFileName ? `/api/media/character/${character.imageFileName}` : undefined
        }}
      />

      <Stack gap="xl">
        <BackButton href="/characters" label="Back to Characters" />

        <CharacterPageClient
          character={character}
          gambles={gambles}
          events={timelineEvents}
          guides={guides}
          quotes={quotes}
          arcs={arcs}
        />
      </Stack>
    </Container>
  )
}

export const dynamic = 'force-dynamic'
