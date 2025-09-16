import { Metadata } from 'next'
import UsersPageContent from './UsersPageContent'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Community | L-file',
    description: 'Meet the L-file community members. Browse user profiles, reading progress, and community contributions.',
    openGraph: {
      title: 'Community | L-file',
      description: 'Meet the L-file community members. Browse user profiles, reading progress, and community contributions.',
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title: 'Community | L-file',
      description: 'Meet the L-file community members. Browse user profiles, reading progress, and community contributions.',
    },
  }
}

export default function UsersPage() {
  return <UsersPageContent />
}