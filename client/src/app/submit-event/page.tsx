import { Metadata } from 'next'
import { Suspense } from 'react'
import { Container, Box, Loader } from '@mantine/core'
import SubmitEventPageContent from './SubmitEventPageContent'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Submit Event | L-file',
    description: 'Submit a story event to the L-file wiki. Help document key moments, decisions, and revelations from Usogui.',
    openGraph: {
      title: 'Submit Event | L-file',
      description: 'Submit a story event to the L-file wiki. Help document key moments, decisions, and revelations from Usogui.',
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title: 'Submit Event | L-file',
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

export default function SubmitEventPage() {
  return (
    <Suspense fallback={<SubmitEventFallback />}>
      <SubmitEventPageContent />
    </Suspense>
  )
}
