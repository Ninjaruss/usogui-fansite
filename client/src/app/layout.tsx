import type { Metadata } from 'next'
import './globals.css'
import { ClientProviders } from '../providers/ClientProviders'

export const metadata: Metadata = {
  title: 'Usogui Fansite - Ultimate Gambling Manga Resource',
  description: 'Complete resource for Usogui manga including characters, arcs, gambles, and fan content',
  keywords: 'Usogui, manga, gambling, Baku Madarame, fansite'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  )
}