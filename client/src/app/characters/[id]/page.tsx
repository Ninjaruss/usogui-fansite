import React from 'react'
import {
  Badge,
  Box,
  Button,
  Card,
  Container,
  Grid,
  Group,
  Stack,
  Text,
  Title,
} from '@mantine/core'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import MediaThumbnail from '../../../components/MediaThumbnail'
import { CharacterStructuredData } from '../../../components/StructuredData'
import type { Arc, Event, Gamble, Guide, Quote } from '../../../types'
import { GuideStatus } from '../../../types'
import { Metadata } from 'next'
import dynamic from 'next/dynamic'
import { API_BASE_URL } from '../../../lib/api'

const CharacterPageClient = dynamic(() => import('./CharacterPageClient'), {
  loading: () => <Box py="md">Loading...</Box>
})

interface Character {
  id: number
  name: string
  alternateNames: string[] | null
  description: string | null
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
      fetch(`${API_BASE_URL}/characters/${characterId}/gambles?limit=5`, { next: { revalidate: 300 } }),
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

    const characterArcIds = new Set(
      eventsData.data?.map((event: Event & { arcId?: number }) => event.arcId).filter(Boolean) || []
    )
    const filteredArcs = allArcsData.data?.filter((arc: Arc) => characterArcIds.has(arc.id)) || []

    return {
      character,
      gambles: gamblesData.data || [],
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
      title: 'Character Not Found - Usogui Fansite'
    }
  }

  try {
    const { character } = await fetchCharacterData(characterId)
    const imageUrl = character.imageFileName
      ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/media/character/${character.imageFileName}`
      : undefined

    return {
      title: `${character.name} - Usogui Fansite`,
      description: character.description
        ? character.description.substring(0, 160).replace(/\n/g, ' ') + '...'
        : `Learn about ${character.name}, a character from the Usogui manga series. View their story arcs, gambles, quotes, and more.`,
      openGraph: {
        title: `${character.name} - Usogui Fansite`,
        description: character.description?.substring(0, 160) || `Character profile for ${character.name}`,
        images: imageUrl ? [{ url: imageUrl, alt: character.name }] : [],
        type: 'article'
      },
      twitter: {
        card: 'summary_large_image',
        title: `${character.name} - Usogui Fansite`,
        description: character.description?.substring(0, 160) || `Character profile for ${character.name}`,
        images: imageUrl ? [imageUrl] : []
      }
    }
  } catch {
    return {
      title: 'Character Not Found - Usogui Fansite'
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
    return // This ensures TypeScript knows the function exits here
  }

  const { character, gambles, events, guides, quotes, arcs } = data

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
        <Button
          component={Link}
          href="/characters"
          variant="subtle"
          color="gray"
          leftSection={<ArrowLeft size={18} />}
          maw={200}
        >
          Back to Characters
        </Button>

        <CharacterHeader character={character} arcs={arcs} gambles={gambles} quotes={quotes} />

        <CharacterPageClient
          character={character}
          gambles={gambles}
          events={events}
          guides={guides}
          quotes={quotes}
          arcs={arcs}
        />
      </Stack>
    </Container>
  )
}

function CharacterHeader({ character, arcs, gambles, quotes }: {
  character: Character
  arcs: Arc[]
  gambles: Gamble[]
  quotes: Quote[]
}) {

  return (
    <Card withBorder radius="md" className="gambling-card" shadow="md">
      <Grid gutter="xl" align="center">
        <Grid.Col span={{ base: 12, md: 4, lg: 3 }}>
          <Box ta="center">
            <MediaThumbnail
              entityType="character"
              entityId={character.id}
              entityName={character.name}
              allowCycling
              maxWidth="260px"
              maxHeight="320px"
            />
          </Box>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 8, lg: 9 }}>
          <Stack gap="lg">
            <Stack gap={4}>
              <Title order={1}>{character.name}</Title>
              {character.description && (
                <Text size="sm" c="dimmed">
                  {character.description.substring(0, 160)}
                  {character.description.length > 160 ? '...' : ''}
                </Text>
              )}
            </Stack>

            {character.alternateNames && character.alternateNames.length > 0 && (
              <Stack gap={4}>
                <Text size="sm" c="dimmed">
                  Also known as:
                </Text>
                <Group gap="xs" wrap="wrap">
                  {character.alternateNames.map((name) => (
                    <Badge key={name} variant="outline" color="violet" radius="xl">
                      {name}
                    </Badge>
                  ))}
                </Group>
              </Stack>
            )}

            {character.organizations && character.organizations.length > 0 && (
              <Stack gap={4}>
                <Text size="sm" c="dimmed">
                  Organization Affiliations:
                </Text>
                <Group gap="xs" wrap="wrap">
                  {character.organizations.map((organization) => (
                    <Badge
                      key={organization.id}
                      component={Link}
                      href={`/organizations/${organization.id}`}
                      color="red"
                      radius="xl"
                      style={{ textDecoration: 'none' }}
                    >
                      {organization.name}
                    </Badge>
                  ))}
                </Group>
              </Stack>
            )}

            {character.firstAppearanceChapter && (
              <Card withBorder radius="md" shadow="xs" padding="md" maw={280}>
                <Stack gap={4}>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                    First Appearance
                  </Text>
                  <Text
                    component={Link}
                    href={`/chapters/${character.firstAppearanceChapter}`}
                    fw={600}
                    size="lg"
                    style={{ textDecoration: 'none', color: '#f87171' }}
                  >
                    Chapter {character.firstAppearanceChapter}
                  </Text>
                </Stack>
              </Card>
            )}

            <Group gap="sm" wrap="wrap">
              <Badge
                component={Link}
                href={`/arcs?character=${character.name}`}
                color="red"
                radius="lg"
                style={{ textDecoration: 'none' }}
              >
                {arcs.length} Arc{arcs.length !== 1 ? 's' : ''}
              </Badge>
              <Badge
                component={Link}
                href={`/gambles?character=${character.name}`}
                color="violet"
                radius="lg"
                style={{ textDecoration: 'none' }}
              >
                {gambles.length} Gamble{gambles.length !== 1 ? 's' : ''}
              </Badge>
              <Badge
                component={Link}
                href={`/quotes?characterId=${character.id}`}
                color="yellow"
                variant="light"
                radius="lg"
                style={{ textDecoration: 'none' }}
              >
                {quotes.length} Quote{quotes.length !== 1 ? 's' : ''}
              </Badge>
            </Group>
          </Stack>
        </Grid.Col>
      </Grid>
    </Card>
  )
}
