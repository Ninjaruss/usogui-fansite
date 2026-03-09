import React from 'react'
import { Container } from '@mantine/core'
import { api } from '../../lib/api'
import CharactersPageContent from './CharactersPageContent'

interface Character {
  id: number
  name: string
  alternateNames: string[] | null
  description: string
  firstAppearanceChapter: number
  imageFileName?: string
  imageDisplayName?: string
  organizations?: Array<{
    id: number
    name: string
    description?: string
  }>
}

interface CharactersPageProps {
  searchParams: Promise<{ page?: string; search?: string }>
}

export async function generateMetadata({ searchParams }: CharactersPageProps) {
  const resolvedSearchParams = await searchParams
  const search = resolvedSearchParams.search
  const page = parseInt(resolvedSearchParams.page || '1', 10)

  const title = search
    ? `Characters matching "${search}" - Page ${page} - Usogui Database`
    : page > 1
      ? `Characters - Page ${page} - Usogui Database`
      : 'Characters - Usogui Database'

  const description = search
    ? `Browse Usogui characters matching "${search}". Discover detailed profiles, appearances, and storylines.`
    : 'Explore the complex cast of Usogui characters. Detailed profiles, appearances, and story arcs of all major and minor characters.'

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
    },
  }
}

export default async function CharactersPage({ searchParams }: CharactersPageProps) {
  const resolvedSearchParams = await searchParams
  const page = parseInt(resolvedSearchParams.page || '1', 10)
  const search = resolvedSearchParams.search || ''

  // Fetch characters server-side
  const params: { page: number; limit: number; name?: string; includeOrganizations: boolean } = { 
    page, 
    limit: 12, 
    includeOrganizations: true 
  }
  if (search) params.name = search

  let characters: Character[] = []
  let totalPages = 1
  let total = 0
  let error = ''

  try {
    const response = await api.getCharacters(params)
    characters = response.data
    totalPages = response.totalPages
    total = response.total
  } catch (err: unknown) {
    error = err instanceof Error ? err.message : 'Failed to fetch characters'
  }

  // Pre-fetch display media for the first page of characters (parallel server-side requests)
  const initialMediaMap: Record<number, any[]> = {}
  if (characters.length > 0) {
    const mediaResults = await Promise.allSettled(
      characters.map(char =>
        api.get<any>(`/media/entity-display/character/${char.id}/cycling`)
      )
    )
    characters.forEach((char, i) => {
      const result = mediaResults[i]
      if (result.status === 'fulfilled') {
        const d = result.value
        initialMediaMap[char.id] = Array.isArray(d) ? d : (d?.data || [])
      }
    })
  }

  return (
    <Container size="lg" py="xl">
      <CharactersPageContent
        initialCharacters={characters}
        initialTotalPages={totalPages}
        initialTotal={total}
        initialSearch={search}
        initialError={error}
        initialMediaMap={initialMediaMap}
      />
    </Container>
  )
}
