import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { Center, Loader } from '@mantine/core'
import SubmitAnnotationPageContent from './SubmitAnnotationPageContent'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Submit Annotation',
    description: 'Submit an annotation to the L-file wiki. Share your insights, analysis, and commentary on characters, gambles, chapters, and story arcs.',
    openGraph: {
      title: 'Submit Annotation',
      description: 'Submit an annotation to the L-file wiki. Share your insights, analysis, and commentary on characters, gambles, chapters, and story arcs.',
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title: 'Submit Annotation',
      description: 'Submit an annotation to the L-file wiki. Share your insights, analysis, and commentary on characters, gambles, chapters, and story arcs.',
    },
  }
}

export default async function SubmitAnnotationPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>
}) {
  const { edit } = await searchParams
  if (edit) redirect(`/annotations/${edit}/edit`)

  return (
    <Suspense fallback={<Center py="xl"><Loader size="lg" /></Center>}>
      <SubmitAnnotationPageContent />
    </Suspense>
  )
}
