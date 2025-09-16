import React from 'react'
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  TextField,
  Chip,
  CircularProgress,
  Alert,
  Pagination,
  InputAdornment
} from '@mui/material'
import { Search, Shield, Users } from 'lucide-react'
import Link from 'next/link'
import EnhancedSpoilerMarkdown from '../../components/EnhancedSpoilerMarkdown'
import { api } from '../../lib/api'
import { motion } from 'motion/react'
import MediaThumbnail from '../../components/MediaThumbnail'
import OrganizationsPageContent from './OrganizationsPageContent'

interface Organization {
  id: number
  name: string
  description?: string
  memberCount?: number
}

interface OrganizationsPageProps {
  searchParams: Promise<{ page?: string; search?: string }>
}

export async function generateMetadata({ searchParams }: OrganizationsPageProps) {
  const resolvedSearchParams = await searchParams
  const search = resolvedSearchParams.search
  const page = parseInt(resolvedSearchParams.page || '1', 10)

  const title = search
    ? `Organizations matching "${search}" - Page ${page} - Usogui Fansite`
    : page > 1
      ? `Organizations - Page ${page} - Usogui Fansite`
      : 'Organizations - Usogui Fansite'

  const description = search
    ? `Browse Usogui organizations matching "${search}". Explore factions, groups, and their roles in the gambling underworld.`
    : 'Explore the various organizations and factions in Usogui. Learn about their roles, members, and influence in the gambling underworld.'

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

export default async function OrganizationsPage({ searchParams }: OrganizationsPageProps) {
  const resolvedSearchParams = await searchParams
  const page = parseInt(resolvedSearchParams.page || '1', 10)
  const search = resolvedSearchParams.search || ''

  // Fetch organizations server-side
  const params: { page: number; limit: number; name?: string } = { page, limit: 12 }
  if (search) params.name = search

  let organizations: Organization[] = []
  let totalPages = 1
  let total = 0
  let error = ''

  try {
    const response = await api.getOrganizations(params)
    organizations = response.data
    totalPages = response.totalPages
    total = response.total
  } catch (err: unknown) {
    error = err instanceof Error ? err.message : 'Failed to fetch organizations'
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <OrganizationsPageContent
        initialOrganizations={organizations}
        initialTotalPages={totalPages}
        initialTotal={total}
        initialPage={page}
        initialSearch={search}
        initialError={error}
      />
    </Container>
  )
}