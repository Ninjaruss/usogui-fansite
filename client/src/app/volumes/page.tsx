import React from 'react'
import { Container } from '@mantine/core'
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
    ? `Volumes matching "${search}" - Page ${page} - Usogui Database`
    : page > 1
      ? `Volumes - Page ${page} - Usogui Database`
      : 'Volumes - Usogui Database'

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

  // Load all volumes server-side for client-side pagination
  let volumes: Volume[] = []
  let error = ''

  try {
    // Get all volumes in one request
    const response = await api.get<any>('/volumes?limit=100')
    volumes = response.data || []
  } catch (err: unknown) {
    error = err instanceof Error ? err.message : 'Failed to fetch volumes'
  }

  // Pre-fetch display media for the first page of volumes (parallel server-side requests)
  const initialMediaMap: Record<number, any[]> = {}
  if (volumes.length > 0) {
    const firstPage = volumes.slice(0, 12)
    const mediaResults = await Promise.allSettled(
      firstPage.map(vol =>
        api.get<any>(`/media/entity-display/volume/${vol.id}/cycling`)
      )
    )
    firstPage.forEach((vol, i) => {
      const result = mediaResults[i]
      if (result.status === 'fulfilled') {
        const d = result.value
        initialMediaMap[vol.id] = Array.isArray(d) ? d : (d?.data || [])
      }
    })
  }

  return (
    <Container size="lg" py="xl">
      <VolumesPageContent
        initialVolumes={volumes}
        initialTotalPages={1} // Not used with client-side pagination
        initialTotal={volumes.length}
        initialPage={page}
        initialSearch={search}
        initialError={error}
        initialMediaMap={initialMediaMap}
      />
    </Container>
  )
}
