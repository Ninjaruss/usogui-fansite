import React from 'react'
import { Container } from '@mantine/core'
import { api } from '../../lib/api'
import ArcsPageContent from './ArcsPageContent'

interface Arc {
  id: number
  name: string
  description: string
  startChapter?: number
  endChapter?: number
  createdAt?: string
  updatedAt?: string
  imageFileName?: string
  imageDisplayName?: string
}

interface ArcsPageProps {
  searchParams: Promise<{ page?: string; search?: string; character?: string }>
}

export async function generateMetadata({ searchParams }: ArcsPageProps) {
  const resolvedSearchParams = await searchParams
  const search = resolvedSearchParams.search
  const character = resolvedSearchParams.character
  const page = parseInt(resolvedSearchParams.page || '1', 10)

  const title = character
    ? `Story Arcs featuring ${character} - Usogui Fansite`
    : search
        ? `Arcs matching "${search}" - Page ${page} - Usogui Fansite`
        : page > 1
          ? `Story Arcs - Page ${page} - Usogui Fansite`
          : 'Story Arcs - Usogui Fansite'

  const description = character
    ? `Explore story arcs from Usogui featuring ${character}. Detailed analysis and storylines.`
    : search
        ? `Browse Usogui story arcs matching "${search}". Major storylines and plot developments.`
        : 'Explore the major storylines and arcs of Usogui. From the Tower of Doors to Air Poker, discover every major arc.'

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website'
    }
  }
}

export default async function ArcsPage({ searchParams }: ArcsPageProps) {
  const resolvedSearchParams = await searchParams
  const page = parseInt(resolvedSearchParams.page || '1', 10)
  const search = resolvedSearchParams.search || ''
  const character = resolvedSearchParams.character

  let arcs: Arc[] = []
  let totalPages = 1
  let total = 0
  let error = ''

  try {
    let response: { data: Arc[]; total: number; totalPages: number }

    if (character) {
      const charactersResponse = await api.getCharacters({ name: character, limit: 1 })
      if (charactersResponse.data.length > 0) {
        const characterId = charactersResponse.data[0].id
        const characterArcsResponse = await api.getCharacterArcs(characterId)
        const allArcs = (characterArcsResponse.data || []).map((arc: any) => ({
          ...arc,
          description: arc.description || ''
        })) as Arc[]
        const startIndex = (page - 1) * 12
        const paginatedArcs = allArcs.slice(startIndex, startIndex + 12)
        response = {
          data: paginatedArcs,
          total: allArcs.length,
          totalPages: Math.max(1, Math.ceil(allArcs.length / 12))
        }
      } else {
        response = { data: [], total: 0, totalPages: 1 }
      }
    } else {
      const params: { page: number; limit: number; name?: string } = { page, limit: 12 }
      if (search) params.name = search
      response = await api.getArcs(params)
    }

    arcs = response.data
    totalPages = response.totalPages
    total = response.total
  } catch (err: unknown) {
    error = err instanceof Error ? err.message : 'Failed to fetch arcs'
  }

  return (
    <Container size="lg" py="xl">
      <ArcsPageContent
        initialArcs={arcs}
        initialTotalPages={totalPages}
        initialTotal={total}
        initialPage={page}
        initialSearch={search}
        initialCharacter={character}
        initialError={error}
      />
    </Container>
  )
}
