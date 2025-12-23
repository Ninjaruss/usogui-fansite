import type { Metadata } from 'next'
import './globals.css'
import { ClientProviders } from '../providers/ClientProviders'
import { LayoutWrapper } from '../components/LayoutWrapper'
import { ColorSchemeScript } from '@mantine/core'

export const metadata: Metadata = {
  title: {
    template: '%s | L-File - Usogui Database',
    default: 'L-File - The Ultimate Usogui Database'
  },
  description: 'The complete fan-made database for Usogui (Lie Eater) manga. Explore characters, story arcs, gambling mechanics, guides, and community content.',
  keywords: ['Usogui', 'Lie Eater', 'manga', 'Baku Madarame', 'gambling', 'database', 'characters', 'arcs', 'gambles', 'fansite'],
  authors: [{ name: 'L-File Team' }],
  creator: 'L-File',
  publisher: 'L-File',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: 'L-File - The Ultimate Usogui Database',
    description: 'The complete fan-made database for Usogui (Lie Eater) manga. Explore characters, story arcs, gambling mechanics, guides, and community content.',
    url: 'https://l-file.com',
    siteName: 'L-File',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'L-File - The Ultimate Usogui Database',
    description: 'The complete fan-made database for Usogui (Lie Eater) manga.',
    creator: '@lfile',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" data-mantine-color-scheme="dark" suppressHydrationWarning>
      <head>
        <meta name="emotion-insertion-point" content="" />
        <ColorSchemeScript defaultColorScheme="dark" forceColorScheme="dark" />
      </head>
      <body suppressHydrationWarning>
        <ClientProviders>
          <LayoutWrapper>
            {children}
          </LayoutWrapper>
        </ClientProviders>
      </body>
    </html>
  )
}