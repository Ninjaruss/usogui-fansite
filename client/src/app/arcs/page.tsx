import React, { Suspense } from 'react'
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
  Pagination,
  CircularProgress,
  Alert,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Snackbar
} from '@mui/material'
import { Search, BookOpen, Eye, Edit, Upload, X } from 'lucide-react'
import { useTheme } from '@mui/material/styles'
import Link from 'next/link'
import EnhancedSpoilerMarkdown from '../../components/EnhancedSpoilerMarkdown'
import { motion } from 'motion/react'
import MediaThumbnail from '../../components/MediaThumbnail'
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
      type: 'website',
    },
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
    let response

    if (character) {
      // First find the character ID by name
      const charactersResponse = await api.getCharacters({ name: character, limit: 1 })
      if (charactersResponse.data.length > 0) {
        const characterId = charactersResponse.data[0].id
        // Get character-specific arcs
        const characterArcsResponse = await api.getCharacterArcs(characterId)
        // For character filtering, we'll simulate pagination client-side
        const allArcs = characterArcsResponse.data || []
        const startIndex = (page - 1) * 12
        const endIndex = startIndex + 12
        const paginatedArcs = allArcs.slice(startIndex, endIndex)

        response = {
          data: paginatedArcs,
          total: allArcs.length,
          totalPages: Math.ceil(allArcs.length / 12),
          page
        }
      } else {
        // Character not found, return empty results
        response = { data: [], total: 0, totalPages: 1, page: 1 }
      }
    } else {
      // Normal arc fetching with search
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
    <Container maxWidth="lg" sx={{ py: 4 }}>
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