import React from 'react'
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Box,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent
} from '@mui/material'
import { CalendarSearch, Eye, Calendar, Search } from 'lucide-react'
import { useTheme } from '@mui/material/styles'
import Link from 'next/link'
import EnhancedSpoilerMarkdown from '../../components/EnhancedSpoilerMarkdown'
import { api } from '../../lib/api'
import { motion } from 'motion/react'
import type { Event, Arc } from '../../types'
import { EventStatus } from '../../types'
import EventsPageContent from './EventsPageContent'

interface EventsPageProps {
  searchParams: Promise<{ search?: string; type?: string; status?: string }>
}

export async function generateMetadata({ searchParams }: EventsPageProps) {
  const resolvedSearchParams = await searchParams
  const search = resolvedSearchParams.search
  const type = resolvedSearchParams.type
  const status = resolvedSearchParams.status

  let title = 'Events - Usogui Fansite'
  let description = 'Explore key events and turning points in the Usogui story. Browse story events organized by arcs, including gambles, decisions, reveals, and major plot developments.'

  if (search && type && status) {
    title = `Events matching "${search}" (${type}, ${status}) - Usogui Fansite`
    description = `Browse Usogui story events matching "${search}" filtered by type: ${type} and status: ${status}.`
  } else if (search && type) {
    title = `Events matching "${search}" (${type}) - Usogui Fansite`
    description = `Browse Usogui story events matching "${search}" of type: ${type}.`
  } else if (search && status) {
    title = `Events matching "${search}" (${status}) - Usogui Fansite`
    description = `Browse Usogui story events matching "${search}" with status: ${status}.`
  } else if (search) {
    title = `Events matching "${search}" - Usogui Fansite`
    description = `Browse Usogui story events matching "${search}". Discover key plot points and turning moments.`
  } else if (type && status) {
    title = `${type} Events (${status}) - Usogui Fansite`
    description = `Browse Usogui ${type} events with status: ${status}. Explore key story moments and plot developments.`
  } else if (type) {
    title = `${type} Events - Usogui Fansite`
    description = `Browse Usogui ${type} events. Explore key story moments and plot developments of this type.`
  } else if (status) {
    title = `${status} Events - Usogui Fansite`
    description = `Browse Usogui events with status: ${status}. Explore key story moments and plot developments.`
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

export default async function EventsPage({ searchParams }: EventsPageProps) {
  const resolvedSearchParams = await searchParams
  const search = resolvedSearchParams.search || ''
  const type = resolvedSearchParams.type || ''
  const status = resolvedSearchParams.status || ''

  let groupedEvents: {
    arcs: Array<{ arc: Arc; events: Event[] }>
    noArc: Event[]
  } = { arcs: [], noArc: [] }
  let error = ''

  try {
    if (search) {
      // Fall back to regular search when searching
      const params: Record<string, string | number> = { page: 1, limit: 100, title: search }
      if (type) params.type = type
      if (status) params.status = status
      
      const response = await api.getEvents(params)
      groupedEvents = {
        arcs: [],
        noArc: response.data
      }
    } else {
      // Use grouped endpoint when not searching
      const params: Record<string, string> = {}
      if (type) params.type = type
      if (status) params.status = status
      
      const response = await api.getEventsGroupedByArc(params)
      groupedEvents = response
    }
  } catch (err: unknown) {
    error = err instanceof Error ? err.message : 'Failed to fetch events'
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <EventsPageContent
        initialGroupedEvents={groupedEvents}
        initialSearch={search}
        initialType={type}
        initialStatus={status}
        initialError={error}
      />
    </Container>
  )
}
