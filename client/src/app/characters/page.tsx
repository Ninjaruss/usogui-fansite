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
  Pagination,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Snackbar
} from '@mui/material'
import { Search, Users, Eye, Edit, Upload, X } from 'lucide-react'
import { useTheme } from '@mui/material/styles'
import Link from 'next/link'
import EnhancedSpoilerMarkdown from '../../components/EnhancedSpoilerMarkdown'
import Image from 'next/image'
import { api } from '../../lib/api'
import { motion } from 'motion/react'
import MediaThumbnail from '../../components/MediaThumbnail'
import CharactersPageContent from './CharactersPageContent'

interface Character {
  id: number
  name: string
  alternateNames: string[] | null
  description: string
  firstAppearanceChapter: number
  imageFileName?: string
  imageDisplayName?: string
}

interface CharactersPageProps {
  searchParams: Promise<{ page?: string; search?: string }>
}

export async function generateMetadata({ searchParams }: CharactersPageProps) {
  const resolvedSearchParams = await searchParams
  const search = resolvedSearchParams.search
  const page = parseInt(resolvedSearchParams.page || '1', 10)

  const title = search
    ? `Characters matching "${search}" - Page ${page} - Usogui Fansite`
    : page > 1
      ? `Characters - Page ${page} - Usogui Fansite`
      : 'Characters - Usogui Fansite'

  const description = search
    ? `Browse Usogui characters matching "${search}". Discover detailed profiles, appearances, and storylines.`
    : 'Explore the complex cast of Usogui characters. Detailed profiles, appearances, and story arcs of all major and minor characters.'

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

export default async function CharactersPage({ searchParams }: CharactersPageProps) {
  const resolvedSearchParams = await searchParams
  const page = parseInt(resolvedSearchParams.page || '1', 10)
  const search = resolvedSearchParams.search || ''

  // Fetch characters server-side
  const params: { page: number; limit: number; name?: string } = { page, limit: 12 }
  if (search) params.name = search

  let characters: Character[] = []
  let totalPages = 1
  let total = 0
  let error = ''

  try {
    const response = await api.getCharacters(params)
    characters = response.data
    totalPages = response.totalPages
    total = response.total
  } catch (err: unknown) {
    error = err instanceof Error ? err.message : 'Failed to fetch characters'
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <CharactersPageContent
        initialCharacters={characters}
        initialTotalPages={totalPages}
        initialTotal={total}
        initialPage={page}
        initialSearch={search}
        initialError={error}
      />
    </Container>
  )
}