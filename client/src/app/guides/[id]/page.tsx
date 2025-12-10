import React from 'react'
import { Alert, Button, Container, Stack } from '@mantine/core'
import { semanticColors } from '../../../lib/mantine-theme'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Metadata } from 'next'
import { api } from '../../../lib/api'
import GuidePageClient from './GuidePageClient'
import { GuideStatus } from '../../../types'

interface PageProps {
  params: Promise<{ id: string }>
}

async function getGuide(id: number, isAuthenticated: boolean = false) {
  if (isAuthenticated) {
    // Try authenticated endpoint first (can access user's own drafts/pending guides)
    try {
      const guide = await api.getGuideAuthenticated(id)
      return guide
    } catch (error: any) {
      // If authenticated request fails, fall back to public endpoint
      if (error?.status === 401 || error?.status === 403) {
        console.log('[getGuide] Authenticated request failed, trying public endpoint')
        return await api.getGuide(id)
      }
      throw error
    }
  }
  
  // Use public endpoint for non-authenticated requests
  return await api.getGuide(id)
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const guideId = parseInt(id, 10)

  if (Number.isNaN(guideId) || guideId <= 0) {
    return {
      title: 'Guide Not Found - Usogui Fansite'
    }
  }

  try {
    const guide = await getGuide(guideId)
    return {
      title: `${guide.title} - Usogui Guide`,
      description: guide.description || guide.content.slice(0, 160).replace(/\n/g, ' ') + '...',
      openGraph: {
        title: `${guide.title} - Usogui Guide`,
        description: guide.description || guide.content.slice(0, 160).replace(/\n/g, ' ') + '...'
      }
    }
  } catch (error) {
    // For non-public guides, return generic metadata instead of failing
    return {
      title: 'Usogui Guide',
      description: 'A comprehensive guide for Usogui manga'
    }
  }
}

export default async function GuidePage({ params }: PageProps) {
  const { id } = await params
  const guideId = parseInt(id, 10)

  if (Number.isNaN(guideId) || guideId <= 0) {
    return (
      <Container size="lg" py="xl">
        <Stack gap="md">
          <Alert style={{ color: semanticColors.warning }} radius="md">
            Guide not found
          </Alert>
          <Button component={Link} href="/guides" variant="subtle" color="gray" leftSection={<ArrowLeft size={18} />}
          >
            Back to Guides
          </Button>
        </Stack>
      </Container>
    )
  }

  // First try to get the guide using the public endpoint (no auth required)
  try {
    const guide = await getGuide(guideId, false)
    
    // For approved guides, render normally
    if (guide.status === GuideStatus.APPROVED) {
      return <GuidePageClient initialGuide={guide} />
    }
    
    // For non-approved guides, let the client component handle authentication
    // and determine if the user can see this guide
    return <GuidePageClient initialGuide={guide} />
    
  } catch (error: any) {
    // If public endpoint fails, let the client component try with authentication
    return <GuidePageClient guideId={guideId} />
  }
}

