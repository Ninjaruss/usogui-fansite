import React, { Suspense } from 'react'
import QuotesPageContent from './QuotesPageContent'

interface QuotesPageProps {
  searchParams: Promise<{ page?: string; search?: string; characterId?: string }>
}

export async function generateMetadata({ searchParams }: QuotesPageProps) {
  const resolvedSearchParams = await searchParams
  const search = resolvedSearchParams.search
  const characterId = resolvedSearchParams.characterId
  const page = parseInt(resolvedSearchParams.page || '1', 10)

  let title = 'Quotes - Usogui Fansite'
  let description = 'Discover memorable quotes from Usogui characters. Browse philosophical insights, witty remarks, and powerful statements from the manga.'

  if (characterId && search) {
    title = `Quotes matching "${search}" by character - Page ${page} - Usogui Fansite`
    description = `Browse Usogui quotes matching "${search}" by a specific character. Discover philosophical insights and memorable dialogue.`
  } else if (characterId) {
    title = page > 1 
      ? `Character Quotes - Page ${page} - Usogui Fansite`
      : 'Character Quotes - Usogui Fansite'
    description = 'Browse memorable quotes from a specific Usogui character. Discover their philosophical insights and memorable dialogue.'
  } else if (search) {
    title = `Quotes matching "${search}" - Page ${page} - Usogui Fansite`
    description = `Browse Usogui quotes matching "${search}". Discover philosophical insights and memorable dialogue from the manga.`
  } else if (page > 1) {
    title = `Quotes - Page ${page} - Usogui Fansite`
  }

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
    },
  }
}

export default function QuotesPage({ searchParams }: QuotesPageProps) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <QuotesPageContent />
    </Suspense>
  )
}