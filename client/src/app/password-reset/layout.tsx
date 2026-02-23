import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Reset Password | L-File',
  description: 'Reset your L-File account password.',
  robots: { index: false, follow: false },
}

export default function PasswordResetLayout({ children }: { children: React.ReactNode }) {
  return children
}
