import React, { Suspense } from 'react'
import { Container } from '@mantine/core'
import { api } from '../../lib/api'
import QuotesPageContent from './QuotesPageContent'

interface Quote {
  id: number
  text: string
  speaker: string
  context?: string
  tags: string[]
  chapter?: number
  volume?: number
  updatedAt: string
}

interface QuotesPageProps {
  searchParams: Promise<{ page?: string; search?: string; characterId?: string }>
}

export async function generateMetadata({ searchParams }: QuotesPageProps) {
  const resolvedSearchParams = await searchParams
  const search = resolvedSearchParams.search
  const characterId = resolvedSearchParams.characterId
  const page = parseInt(resolvedSearchParams.page || '1', 10)

  let title = 'Quotes - Usogui Fansite'
  let description = 'Discover memorable quotes from Usogui characters. Browse philosophical insights, witty remarks, and powerful statements from the manga.'

  if (characterId && search) {
    title = `Quotes matching "${search}" by character - Page ${page} - Usogui Fansite`
    description = `Browse Usogui quotes matching "${search}" by a specific character. Discover philosophical insights and memorable dialogue.`
  } else if (characterId) {
    title = page > 1
      ? `Character Quotes - Page ${page} - Usogui Fansite`
      : 'Character Quotes - Usogui Fansite'
    description = 'Browse memorable quotes from a specific Usogui character. Discover their philosophical insights and memorable dialogue.'
  } else if (search) {
    title = `Quotes matching "${search}" - Page ${page} - Usogui Fansite`
    description = `Browse Usogui quotes matching "${search}". Discover philosophical insights and memorable dialogue from the manga.`
  } else if (page > 1) {
    title = `Quotes - Page ${page} - Usogui Fansite`
  }

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

export default async function QuotesPage({ searchParams }: QuotesPageProps) {
  const resolvedSearchParams = await searchParams
  const page = parseInt(resolvedSearchParams.page || '1', 10)
  const search = resolvedSearchParams.search || ''
  const characterId = resolvedSearchParams.characterId

  // Fetch quotes server-side
  const params: { page: number; limit: number; search?: string; characterId?: number } = { page, limit: 12 }
  if (search) params.search = search
  if (characterId && !isNaN(Number(characterId))) params.characterId = Number(characterId)

  let quotes: Quote[] = []
  let totalPages = 1
  let total = 0
  let error = ''
  let characterName: string | null = null

  try {
    const quotesResponse = await api.getQuotes(params)
    
    const transformedQuotes = quotesResponse.data.map((quote: any) => ({
      id: quote.id,
      text: quote.text,
      speaker: quote.character?.name || 'Unknown',
      context: quote.description || quote.context,
      tags: quote.tags ? (Array.isArray(quote.tags) ? quote.tags : [quote.tags]) : [],
      chapter: quote.chapterNumber,
      volume: quote.volumeNumber,
      updatedAt: quote.updatedAt
    }))

    quotes = transformedQuotes
    totalPages = quotesResponse.totalPages
    total = quotesResponse.total

    // Fetch character name if filtering by character
    if (characterId && !isNaN(Number(characterId))) {
      try {
        const character = await api.getCharacter(Number(characterId))
        characterName = character.name
      } catch {
        characterName = 'Unknown'
      }
    }
  } catch (err: unknown) {
    error = err instanceof Error ? err.message : 'Failed to fetch quotes'
  }

  return (
    <Container size="lg" py="xl">
      <QuotesPageContent
        initialQuotes={quotes}
        initialTotalPages={totalPages}
        initialTotal={total}
        initialPage={page}
        initialSearch={search}
        initialCharacterId={characterId}
        initialCharacterName={characterName}
        initialError={error}
      />
    </Container>
  )
}