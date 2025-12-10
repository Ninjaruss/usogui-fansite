import { Metadata } from 'next'
import { Container } from '@mantine/core'
import MediaPageContent from './MediaPageContent'
import { JsonLd } from '../../components/JsonLd'

export const metadata: Metadata = {
  title: 'Media Gallery - L-file',
  description: 'Browse community-submitted fanart, videos, and other media related to Usogui. Discover amazing fan creations and contribute your own.',
  openGraph: {
    title: 'Media Gallery - L-file',
    description: 'Browse community-submitted fanart, videos, and other media related to Usogui. Discover amazing fan creations and contribute your own.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Media Gallery - L-file',
    description: 'Browse community-submitted fanart, videos, and other media related to Usogui. Discover amazing fan creations and contribute your own.',
  },
}

interface MediaPageProps {
  searchParams: Promise<{
    page?: string
    type?: string
    ownerType?: string
    ownerId?: string
    search?: string
  }>
}

export default async function MediaPage({ searchParams }: MediaPageProps) {
  const resolvedSearchParams = await searchParams
  const page = parseInt(resolvedSearchParams.page || '1', 10)
  const type = resolvedSearchParams.type
  const ownerType = resolvedSearchParams.ownerType as 'character' | 'arc' | 'event' | 'gamble' | 'organization' | 'user' | undefined
  const ownerId = resolvedSearchParams.ownerId ? parseInt(resolvedSearchParams.ownerId, 10) : undefined
  const search = resolvedSearchParams.search

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Usogui Media Gallery',
    description: 'Community-submitted fanart, videos, and other media related to Usogui manga',
    url: 'https://l-file.com/media',
    mainEntity: {
      '@type': 'ImageGallery',
      name: 'Usogui Fan Media Collection'
    }
  }

  return (
    <>
      <JsonLd data={structuredData} />
      <MediaPageContent
        initialPage={page}
        initialType={type}
        initialOwnerType={ownerType}
        initialOwnerId={ownerId}
        initialSearch={search}
      />
    </>
  )
}
