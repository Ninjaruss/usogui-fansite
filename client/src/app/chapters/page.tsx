import React from 'react'
import { Container } from '@mui/material'
import { api } from '../../lib/api'
import ChaptersPageContent from './ChaptersPageContent'

interface Chapter {
  id: number
  number: number
  title?: string | null
  summary?: string | null
  description?: string
  volume?: {
    id: number
    number: number
    title?: string
  }
}

interface ChaptersPageProps {
  searchParams: Promise<{ page?: string; search?: string }>
}

export async function generateMetadata({ searchParams }: ChaptersPageProps) {
  const resolvedSearchParams = await searchParams
  const search = resolvedSearchParams.search
  const page = parseInt(resolvedSearchParams.page || '1', 10)

  const title = search
    ? `Chapters matching "${search}" - Page ${page} - Usogui Fansite`
    : page > 1
      ? `Chapters - Page ${page} - Usogui Fansite`
      : 'Chapters - Usogui Fansite'

  const description = search
    ? `Browse Usogui chapters matching "${search}". Find chapter summaries, key events, and navigate through the series.`
    : 'Browse all Usogui manga chapters. Find chapter summaries, key events, and navigate through the complete series chronologically.'

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

export default async function ChaptersPage({ searchParams }: ChaptersPageProps) {
  const resolvedSearchParams = await searchParams
  const page = parseInt(resolvedSearchParams.page || '1', 10)
  const search = resolvedSearchParams.search || ''

  // Fetch chapters server-side
  const params: { page: number; limit: number; search?: string } = { page, limit: 20 }
  if (search) params.search = search

  let chapters: Chapter[] = []
  let totalPages = 1
  let total = 0
  let error = ''

  try {
    const response = await api.getChapters(params)
    chapters = response.data
    totalPages = response.totalPages
    total = response.total
  } catch (err: unknown) {
    error = err instanceof Error ? err.message : 'Failed to fetch chapters'
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <ChaptersPageContent
        initialChapters={chapters}
        initialTotalPages={totalPages}
        initialTotal={total}
        initialPage={page}
        initialSearch={search}
        initialError={error}
      />
    </Container>
  )
}