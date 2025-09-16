import React from 'react'
import { Container } from '@mui/material'
import { api } from '../../lib/api'
import VolumesPageContent from './VolumesPageContent'

interface Volume {
  id: number
  number: number
  title?: string
  description?: string
  coverUrl?: string
  startChapter: number
  endChapter: number
}

interface VolumesPageProps {
  searchParams: Promise<{ page?: string; search?: string }>
}

export async function generateMetadata({ searchParams }: VolumesPageProps) {
  const resolvedSearchParams = await searchParams
  const search = resolvedSearchParams.search
  const page = parseInt(resolvedSearchParams.page || '1', 10)

  const title = search
    ? `Volumes matching "${search}" - Page ${page} - Usogui Fansite`
    : page > 1
      ? `Volumes - Page ${page} - Usogui Fansite`
      : 'Volumes - Usogui Fansite'

  const description = search
    ? `Browse Usogui manga volumes matching "${search}". Explore the collected chapters and story arcs.`
    : 'Browse all Usogui manga volumes. Explore the complete collection of volumes with chapter ranges and cover artwork.'

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

export default async function VolumesPage({ searchParams }: VolumesPageProps) {
  const resolvedSearchParams = await searchParams
  const page = parseInt(resolvedSearchParams.page || '1', 10)
  const search = resolvedSearchParams.search || ''

  // Fetch volumes server-side
  let volumes: Volume[] = []
  let totalPages = 1
  let total = 0
  let error = ''

  try {
    const params: { page: number; limit: number; search?: string } = { page, limit: 12 }
    if (search) params.search = search

    const response = await api.getVolumes(params)
    volumes = response.data
    totalPages = response.totalPages
    total = response.total
  } catch (err: unknown) {
    error = err instanceof Error ? err.message : 'Failed to fetch volumes'
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <VolumesPageContent
        initialVolumes={volumes}
        initialTotalPages={totalPages}
        initialTotal={total}
        initialPage={page}
        initialSearch={search}
        initialError={error}
      />
    </Container>
  )
}