import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { Box, Container, Loader } from '@mantine/core'
import SubmitEventPageContent from './SubmitEventPageContent'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Submit Event',
    description: 'Submit a story event to the L-file wiki. Help document key moments, decisions, and revelations from Usogui.',
    openGraph: {
      title: 'Submit Event',
      description: 'Submit a story event to the L-file wiki. Help document key moments, decisions, and revelations from Usogui.',
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title: 'Submit Event',
      description: 'Submit a story event to the L-file wiki. Help document key moments, decisions, and revelations from Usogui.',
    },
  }
}

function SubmitEventFallback() {
  return (
    <Container size="md" py="xl">
      <Box style={{ display: 'flex', justifyContent: 'center' }}>
        <Loader size="lg" />
      </Box>
    </Container>
  )
}

export default async function SubmitEventPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>
}) {
  const { edit } = await searchParams
  if (edit) redirect(`/events/${edit}/edit`)

  return (
    <Suspense fallback={<SubmitEventFallback />}>
      <SubmitEventPageContent />
    </Suspense>
  )
}
