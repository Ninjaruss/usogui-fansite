import React from 'react'
import { Container } from '@mantine/core'
import { api } from '../../lib/api'
import GamblesPageContent from './GamblesPageContent'

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
  createdAt: string
  updatedAt: string
}

interface GamblesPageProps {
  searchParams: Promise<{ page?: string; search?: string; character?: string }>
}

export async function generateMetadata({ searchParams }: GamblesPageProps) {
  const resolvedSearchParams = await searchParams
  const search = resolvedSearchParams.search
  const character = resolvedSearchParams.character
  const page = parseInt(resolvedSearchParams.page || '1', 10)

  let title = 'Gambles - Usogui Database'
  
  if (character && search) {
    title = `Gambles featuring "${character}" matching "${search}" - Page ${page} - Usogui Database`
  } else if (character) {
    title = `Gambles featuring "${character}" - ${page > 1 ? `Page ${page} - ` : ''}Usogui Database`
  } else if (search) {
    title = `Gambles matching "${search}" - Page ${page} - Usogui Database`
  } else if (page > 1) {
    title = `Gambles - Page ${page} - Usogui Database`
  }

  const description = character
    ? `Browse all gambles featuring ${character} in the Usogui manga series. Discover the complex games, rules, and psychological warfare.`
    : search
      ? `Browse gambles matching "${search}". Explore the intricate gambling games and psychological battles from the Usogui manga series.`
      : 'Browse all gambling games from the Usogui manga series. Discover the rules, participants, and outcomes of each psychological battle.'

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

export default async function GamblesPage({ searchParams }: GamblesPageProps) {
  const resolvedSearchParams = await searchParams
  const page = parseInt(resolvedSearchParams.page || '1', 10)
  const search = resolvedSearchParams.search || ''
  const character = resolvedSearchParams.character || ''

  // Fetch gambles server-side
  let gambles: Gamble[] = []
  let totalPages = 1
  let total = 0
  let error = ''

  try {
    let response
    if (character) {
      // Character-based filtering
      const charactersResponse = await api.getCharacters({ name: character, limit: 1 })
      if (charactersResponse.data.length > 0) {
        const characterId = charactersResponse.data[0].id
        const characterGamblesResponse = await api.getCharacterGambles(characterId, { limit: 1000 })
        const allGambles = characterGamblesResponse.data || []
        const startIndex = (page - 1) * 12
        const endIndex = startIndex + 12
        const paginatedGambles = allGambles.slice(startIndex, endIndex)
        
        response = {
          data: paginatedGambles,
          total: allGambles.length,
          totalPages: Math.ceil(allGambles.length / 12),
          page
        }
      } else {
        response = { data: [], total: 0, totalPages: 1, page: 1 }
      }
    } else {
      // Normal gamble fetching with search
      const params: { page: number; limit: number; name?: string } = { page, limit: 12 }
      if (search) params.name = search
      response = await api.getGambles(params)
    }
    
    gambles = response.data
    totalPages = response.totalPages
    total = response.total
  } catch (err: unknown) {
    error = err instanceof Error ? err.message : 'Failed to fetch gambles'
  }

  // Pre-fetch display media for the first page of gambles (parallel server-side requests)
  const initialMediaMap: Record<number, any[]> = {}
  if (gambles.length > 0) {
    const mediaResults = await Promise.allSettled(
      gambles.map(gamble =>
        api.get<any>(`/media/entity-display/gamble/${gamble.id}/cycling`)
      )
    )
    gambles.forEach((gamble, i) => {
      const result = mediaResults[i]
      if (result.status === 'fulfilled') {
        const d = result.value
        initialMediaMap[gamble.id] = Array.isArray(d) ? d : (d?.data || [])
      }
    })
  }

  return (
    <Container size="lg" style={{ paddingBlock: '2rem' }}>
      <GamblesPageContent
        initialGambles={gambles}
        initialTotalPages={totalPages}
        initialTotal={total}
        initialPage={page}
        initialSearch={search}
        initialCharacterFilter={character}
        initialError={error}
        initialMediaMap={initialMediaMap}
      />
    </Container>
  )
}
