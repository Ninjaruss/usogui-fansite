import React from 'react'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { api } from '../../../lib/api'
import EventPageClient from './EventPageClient'
import { EventStructuredData } from '../../../components/StructuredData'
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
      title: 'Event Not Found - Usogui Database',
      description: 'The requested event could not be found.'
    }
  }

  return {
    title: `${event.title} - Event Details | Usogui Database`,
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
    notFound()
  }

  return (
    <>
      <EventStructuredData event={event} />
      <EventPageClient initialEvent={event} />
    </>
  )
}

export const dynamic = 'force-dynamic'
