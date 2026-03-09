import type { Metadata } from 'next'
import './globals.css'
import '../lib/jquery-stub'
import { ClientProviders } from '../providers/ClientProviders'
import { LayoutWrapper } from '../components/LayoutWrapper'
import { ColorSchemeScript } from '@mantine/core'

export const metadata: Metadata = {
  title: {
    template: '%s | L-File - Usogui Database',
    default: 'L-File - Usogui Database'
  },
  description: 'The complete fan-made database for Usogui (Lie Eater) manga. Explore characters, story arcs, gambling mechanics, guides, and community content.',
  keywords: ['Usogui', 'Lie Eater', 'manga', 'Baku Madarame', 'gambling', 'database', 'characters', 'arcs', 'gambles', 'database'],
  authors: [{ name: 'L-File Team' }],
  creator: 'L-File',
  publisher: 'L-File',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: 'L-File - Usogui Database',
    description: 'The complete fan-made database for Usogui (Lie Eater) manga. Explore characters, story arcs, gambling mechanics, guides, and community content.',
    url: 'https://l-file.com',
    siteName: 'L-File',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'L-File - Usogui Database',
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
        {/* Preload local font to eliminate render-blocking */}
        <link rel="preload" href="/fonts/OPTIGoudy-Text.otf" as="font" type="font/otf" crossOrigin="anonymous" />
        {/* Preconnect to Google Fonts (used in globals.css) */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Preconnect to R2 media storage — replace with your actual R2_PUBLIC_URL host */}
        <link rel="preconnect" href="https://pub-c63e2958587a4d85b5c93e7e867a569c.r2.dev" />
        <link rel="dns-prefetch" href="https://pub-c63e2958587a4d85b5c93e7e867a569c.r2.dev" />
      </head>
      <body suppressHydrationWarning>
        <a href="#main-content" className="skip-to-content">
          Skip to main content
        </a>
        <ClientProviders>
          <LayoutWrapper>
            {children}
          </LayoutWrapper>
        </ClientProviders>
      </body>
    </html>
  )
}