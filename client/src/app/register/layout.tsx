import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Create Account | L-File',
  description: 'Create an L-File account to track your Usogui reading progress, submit guides, and join the community.',
  robots: { index: false, follow: true },
}

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children
}
