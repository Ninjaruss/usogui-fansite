import React from 'react'
import { Alert, Button, Container, Stack } from '@mantine/core'
import { colors } from '../../../lib/mantine-theme'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Metadata } from 'next'
import { api } from '../../../lib/api'
import EventPageClient from './EventPageClient'
import type { Event } from '../../../types'

interface PageProps {
  params: Promise<{ id: string }>
}

async function getEventData(id: string): Promise<Event | null> {
  try {
    if (!id || isNaN(Number(id))) {
      throw new Error('Invalid event ID')
    }
    const eventId = Number(id)
    if (eventId <= 0) {
      throw new Error('Invalid event ID')
    }
    return await api.getEvent(eventId)
  } catch (error: unknown) {
    console.error('Error fetching event data:', error)
    return null
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const event = await getEventData(id)

  if (!event) {
    return {
      title: 'Event Not Found - Usogui Fansite',
      description: 'The requested event could not be found.'
    }
  }

  return {
    title: `${event.title} - Event Details | Usogui Fansite`,
    description: `Explore the ${event.title} event from Chapter ${event.chapterNumber}. ${(event.description || '').slice(0, 150)}...`,
    keywords: `Usogui, ${event.title}, event, chapter ${event.chapterNumber}, manga${event.arc ? `, ${event.arc.name}` : ''}${event.gamble ? `, ${event.gamble.name}` : ''}`,
    openGraph: {
      title: `${event.title} - Usogui Event`,
      description: `${event.title} occurs in Chapter ${event.chapterNumber}${event.arc ? ` of the ${event.arc.name} arc` : ''}.`,
      type: 'article'
    },
    twitter: {
      card: 'summary',
      title: `${event.title} - Usogui Event`,
      description: `Explore the ${event.title} event from Chapter ${event.chapterNumber}.`
    }
  }
}

export default async function EventDetailPage({ params }: PageProps) {
  const { id } = await params
  const event = await getEventData(id)

  if (!event) {
    return (
      <Container size="lg" py="xl">
        <Stack gap="md">
          <Alert style={{ color: colors.gamble[5] }} radius="md">
            Event not found
          </Alert>
          <Button
            component={Link}
            href="/events"
            variant="subtle"
            color="gray"
            leftSection={<ArrowLeft size={18} />}
          >
            Back to Events
          </Button>
        </Stack>
      </Container>
    )
  }

  return <EventPageClient initialEvent={event} />
}

export const dynamic = 'force-dynamic'
