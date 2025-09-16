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
  Chip
} from '@mui/material'
import { Search, FileText, Eye, Calendar, ThumbsUp, Heart, X, Users, BookOpen, Dice6 } from 'lucide-react'
import { useTheme } from '@mui/material/styles'
import Link from 'next/link'
import { motion } from 'motion/react'
import AuthorProfileImage from '../../components/AuthorProfileImage'
import { UserRoleDisplay } from '../../components/BadgeDisplay'
import { api } from '../../lib/api'
import GuidesPageContent from './GuidesPageContent'

interface Guide {
  id: number
  title: string
  content: string
  description: string
  tags: string[]
  author: {
    id: number
    username: string
    role?: string
    customRole?: string
    profilePictureType?: 'discord' | 'character_media' | null
    selectedCharacterMediaId?: number | null
    selectedCharacterMedia?: {
      id: number
      url: string
      fileName?: string
      description?: string
    } | null
    discordId?: string | null
    discordAvatar?: string | null
  }
  characters?: Array<{
    id: number
    name: string
  }>
  arc?: {
    id: number
    name: string
  }
  gambles?: Array<{
    id: number
    name: string
  }>
  likeCount: number
  userHasLiked?: boolean
  viewCount: number
  createdAt: string
  updatedAt: string
}

interface GuidesPageProps {
  searchParams: Promise<{
    page?: string
    search?: string
    author?: string
    authorName?: string
  }>
}

export async function generateMetadata({ searchParams }: GuidesPageProps) {
  const resolvedSearchParams = await searchParams
  const search = resolvedSearchParams.search
  const authorName = resolvedSearchParams.authorName
  const page = parseInt(resolvedSearchParams.page || '1', 10)

  const title = authorName
    ? `Guides by ${authorName} - Usogui Fansite`
    : search
      ? `Guides matching "${search}" - Page ${page} - Usogui Fansite`
      : page > 1
        ? `Community Guides - Page ${page} - Usogui Fansite`
        : 'Community Guides - Usogui Fansite'

  const description = authorName
    ? `Browse community guides written by ${authorName}. In-depth analysis and insights about Usogui.`
    : search
      ? `Find community guides matching "${search}". Expert analysis and detailed breakdowns of Usogui content.`
      : 'Discover in-depth community guides about Usogui. Character analysis, arc breakdowns, gamble explanations, and strategic insights.'

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

export default async function GuidesPage({ searchParams }: GuidesPageProps) {
  const resolvedSearchParams = await searchParams
  const page = parseInt(resolvedSearchParams.page || '1', 10)
  const search = resolvedSearchParams.search || ''
  const authorId = resolvedSearchParams.author
  const authorName = resolvedSearchParams.authorName

  let guides: Guide[] = []
  let totalPages = 1
  let total = 0
  let error = ''

  try {
    const params: { page: number; limit: number; title?: string; authorId?: string; status?: string } = { page, limit: 12, status: 'approved' }
    if (search) params.title = search
    if (authorId) params.authorId = authorId

    const response = await api.getGuides(params)
    guides = response.data
    totalPages = response.totalPages
    total = response.total
  } catch (err: unknown) {
    error = err instanceof Error ? err.message : 'Failed to fetch guides'
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <GuidesPageContent
        initialGuides={guides}
        initialTotalPages={totalPages}
        initialTotal={total}
        initialPage={page}
        initialSearch={search}
        initialAuthorId={authorId}
        initialAuthorName={authorName}
        initialError={error}
      />
    </Container>
  )
}