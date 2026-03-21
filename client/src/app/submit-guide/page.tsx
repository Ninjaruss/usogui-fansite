import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { Center, Loader } from '@mantine/core'
import SubmitGuidePageContent from './SubmitGuidePageContent'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Submit Guide',
    description: 'Submit your own guide to the L-file community. Share your knowledge about Usogui strategies, character analysis, and story insights.',
    openGraph: {
      title: 'Submit Guide',
      description: 'Submit your own guide to the L-file community. Share your knowledge about Usogui strategies, character analysis, and story insights.',
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title: 'Submit Guide',
      description: 'Submit your own guide to the L-file community. Share your knowledge about Usogui strategies, character analysis, and story insights.',
    },
  }
}

export default async function SubmitGuidePage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>
}) {
  const { edit } = await searchParams
  if (edit) redirect(`/guides/${edit}/edit`)

  return (
    <Suspense fallback={<Center py="xl"><Loader size="lg" /></Center>}>
      <SubmitGuidePageContent />
    </Suspense>
  )
}