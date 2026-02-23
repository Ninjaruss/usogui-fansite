import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Login | L-File',
  description: 'Log in to L-File to manage your Usogui experience, track your reading progress, and contribute to the community.',
  robots: { index: false, follow: true },
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children
}
