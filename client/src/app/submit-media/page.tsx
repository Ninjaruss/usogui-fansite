import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { Center, Loader } from '@mantine/core'
import SubmitMediaPageContent from './SubmitMediaPageContent'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Submit Media',
    description: 'Submit images, videos, and other media to the L-file community. Share fan art, memorable scenes, and other Usogui-related content.',
    openGraph: {
      title: 'Submit Media',
      description: 'Submit images, videos, and other media to the L-file community. Share fan art, memorable scenes, and other Usogui-related content.',
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title: 'Submit Media',
      description: 'Submit images, videos, and other media to the L-file community. Share fan art, memorable scenes, and other Usogui-related content.',
    },
  }
}

export default async function SubmitMediaPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>
}) {
  const { edit } = await searchParams
  if (edit) redirect(`/media/${edit}/edit`)

  return (
    <Suspense fallback={<Center py="xl"><Loader size="lg" /></Center>}>
      <SubmitMediaPageContent />
    </Suspense>
  )
}