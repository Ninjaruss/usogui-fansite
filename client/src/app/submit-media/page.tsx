import { Metadata } from 'next'
import { Suspense } from 'react'
import { Loader, Center } from '@mantine/core'
import SubmitMediaPageContent from './SubmitMediaPageContent'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Submit Media | L-file',
    description: 'Submit images, videos, and other media to the L-file community. Share fan art, memorable scenes, and other Usogui-related content.',
    openGraph: {
      title: 'Submit Media | L-file',
      description: 'Submit images, videos, and other media to the L-file community. Share fan art, memorable scenes, and other Usogui-related content.',
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title: 'Submit Media | L-file',
      description: 'Submit images, videos, and other media to the L-file community. Share fan art, memorable scenes, and other Usogui-related content.',
    },
  }
}

export default function SubmitMediaPage() {
  return (
    <Suspense fallback={<Center py="xl"><Loader size="lg" /></Center>}>
      <SubmitMediaPageContent />
    </Suspense>
  )
}