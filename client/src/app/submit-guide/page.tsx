import { Metadata } from 'next'
import SubmitGuidePageContent from './SubmitGuidePageContent'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Submit Guide | L-file',
    description: 'Submit your own guide to the L-file community. Share your knowledge about Usogui strategies, character analysis, and story insights.',
    openGraph: {
      title: 'Submit Guide | L-file',
      description: 'Submit your own guide to the L-file community. Share your knowledge about Usogui strategies, character analysis, and story insights.',
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title: 'Submit Guide | L-file',
      description: 'Submit your own guide to the L-file community. Share your knowledge about Usogui strategies, character analysis, and story insights.',
    },
  }
}

export default function SubmitGuidePage() {
  return <SubmitGuidePageContent />
}