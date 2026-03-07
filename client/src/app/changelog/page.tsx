import type { Metadata } from 'next'
import { ChangelogPageContent } from './ChangelogPageContent'

export const metadata: Metadata = {
  title: 'Changelog - L-File Usogui Database',
  description: 'See the latest wiki edits and approved community submissions on the L-File Usogui database.',
  keywords: ['Usogui', 'changelog', 'wiki edits', 'community', 'activity'],
  openGraph: {
    title: 'Changelog - L-File',
    description: 'Recent wiki edits and approved community submissions.',
    type: 'website',
  },
}

export default function ChangelogPage() {
  return <ChangelogPageContent />
}
