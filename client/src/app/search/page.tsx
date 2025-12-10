import { Metadata } from 'next'
import { Container } from '@mantine/core'
import SearchPageContent from './SearchPageContent'
import { JsonLd } from '../../components/JsonLd'

export const metadata: Metadata = {
  title: 'Search Results - L-file',
  description: 'Search through characters, arcs, events, gambles, guides, and other Usogui content.',
  openGraph: {
    title: 'Search Results - L-file',
    description: 'Search through characters, arcs, events, gambles, guides, and other Usogui content.',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Search Results - L-file',
    description: 'Search through characters, arcs, events, gambles, guides, and other Usogui content.',
  },
}

interface SearchPageProps {
  searchParams: Promise<{
    q?: string
    type?: string
    page?: string
  }>
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const resolvedSearchParams = await searchParams
  const query = resolvedSearchParams.q || ''
  const allowedTypes = new Set(['all', 'chapters', 'characters', 'events', 'arcs', 'gambles', 'organizations'])
  const type = resolvedSearchParams.type && allowedTypes.has(resolvedSearchParams.type)
    ? resolvedSearchParams.type
    : undefined
  const page = parseInt(resolvedSearchParams.page || '1', 10)

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'SearchResultsPage',
    name: `Search Results for "${query}"`,
    description: 'Search results from the L-file Usogui database',
    url: `https://l-file.com/search?q=${encodeURIComponent(query)}`,
    mainEntity: {
      '@type': 'SearchAction',
      query: query
    }
  }

  return (
    <>
      <JsonLd data={structuredData} />
      <Container size="lg" py="xl">
        <SearchPageContent
          initialQuery={query}
          initialType={type}
          initialPage={page}
        />
      </Container>
    </>
  )
}
