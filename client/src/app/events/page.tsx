import React from 'react'
import { Container } from '@mantine/core'
import { api } from '../../lib/api'
import EventsPageContent from './EventsPageContent'
import type { Event, Arc } from '../../types'
import { EventStatus } from '../../types'

interface EventsPageProps {
  searchParams: Promise<{ page?: string; search?: string; type?: string; status?: string; character?: string }>
}

interface GroupedEventsResponse {
  arcs: Array<{ arc: Arc; events: Event[] }>
  noArc: Event[]
}

const EVENTS_LIMIT = 100

export async function generateMetadata({ searchParams }: EventsPageProps) {
  const resolvedSearchParams = await searchParams
  const search = resolvedSearchParams.search
  const type = resolvedSearchParams.type
  const status = resolvedSearchParams.status as EventStatus | undefined
  const character = resolvedSearchParams.character

  const title = search
    ? `Events matching "${search}" - Usogui Fansite`
    : character
    ? `${character} Events - Usogui Fansite`
    : 'Events - Usogui Fansite'

  const description = search
    ? `Browse key Usogui events that match "${search}". Filter by type or character to explore the timeline.`
    : character
    ? `Explore key events featuring ${character}. Discover their important moments in the Usogui story.`
    : type
    ? `Explore Usogui events filtered by ${type}. Discover gambles, reveals, decisions, and more.`
    : status
      ? `Review Usogui events by status (${status}). Track approved or pending entries in the database.`
      : 'Explore key moments in the Usogui story. Filter by type or character to navigate the timeline.'

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

export default async function EventsPage({ searchParams }: EventsPageProps) {
  const resolvedSearchParams = await searchParams
  const search = resolvedSearchParams.search || ''
  const type = resolvedSearchParams.type || ''
  const status = (resolvedSearchParams.status as EventStatus | '') || ''
  const character = resolvedSearchParams.character || ''

  let groupedEvents: GroupedEventsResponse = { arcs: [], noArc: [] }
  let error = ''

  try {
    if (search) {
      const params: Record<string, string | number> = { page: 1, limit: EVENTS_LIMIT, title: search }
      if (type) params.type = type
      if (status) params.status = status
      if (character) params.character = character
      const response = await api.getEvents(params)
      groupedEvents = {
        arcs: [],
        noArc: response.data || []
      }
    } else {
      const params: Record<string, string> = {}
      if (type) params.type = type
      if (status) params.status = status
      if (character) params.character = character
      groupedEvents = await api.getEventsGroupedByArc(params)
    }
  } catch (err: unknown) {
    error = err instanceof Error ? err.message : 'Failed to fetch events'
  }

  return (
    <Container size="lg" py="xl">
      <EventsPageContent
        initialGroupedEvents={groupedEvents}
        initialSearch={search}
        initialType={type}
        initialStatus={status}
        initialCharacter={character}
        initialError={error}
      />
    </Container>
  )
}
