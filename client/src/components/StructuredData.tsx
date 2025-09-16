import { JsonLd } from './JsonLd'

interface CharacterStructuredDataProps {
  character: {
    id: number
    name: string
    alternateNames?: string[] | null
    description?: string | null
    firstAppearanceChapter?: number | null
    imageUrl?: string
  }
}

interface ArcStructuredDataProps {
  arc: {
    id: number
    name: string
    description?: string
    startChapter?: number
    endChapter?: number
    imageUrl?: string
  }
}

interface GambleStructuredDataProps {
  gamble: {
    id: number
    name: string
    description?: string
    type?: string
    imageUrl?: string
  }
}

export function CharacterStructuredData({ character }: CharacterStructuredDataProps) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: character.name,
    additionalName: character.alternateNames?.filter(Boolean) || [],
    description: character.description || `Character from the manga series Usogui (Lie Eater)`,
    identifier: character.id.toString(),
    ...(character.imageUrl && {
      image: character.imageUrl
    }),
    ...(character.firstAppearanceChapter && {
      mentions: {
        '@type': 'CreativeWork',
        name: `Usogui Chapter ${character.firstAppearanceChapter}`,
        description: `First appearance in chapter ${character.firstAppearanceChapter}`
      }
    }),
    isPartOf: {
      '@type': 'CreativeWork',
      name: 'Usogui',
      alternateName: 'Lie Eater',
      author: {
        '@type': 'Person',
        name: 'Sako Toshio'
      },
      genre: ['Manga', 'Psychological', 'Gambling', 'Thriller'],
      publisher: {
        '@type': 'Organization',
        name: 'Shueisha'
      }
    }
  }

  return <JsonLd data={structuredData} />
}

export function ArcStructuredData({ arc }: ArcStructuredDataProps) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: arc.name,
    description: arc.description || `Story arc from the manga series Usogui (Lie Eater)`,
    identifier: arc.id.toString(),
    ...(arc.imageUrl && {
      image: arc.imageUrl
    }),
    ...(arc.startChapter && arc.endChapter && {
      position: `Chapters ${arc.startChapter}-${arc.endChapter}`,
      numberOfPages: arc.endChapter - arc.startChapter + 1
    }),
    isPartOf: {
      '@type': 'CreativeWork',
      name: 'Usogui',
      alternateName: 'Lie Eater',
      author: {
        '@type': 'Person',
        name: 'Sako Toshio'
      },
      genre: ['Manga', 'Psychological', 'Gambling', 'Thriller'],
      publisher: {
        '@type': 'Organization',
        name: 'Shueisha'
      }
    }
  }

  return <JsonLd data={structuredData} />
}

export function GambleStructuredData({ gamble }: GambleStructuredDataProps) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Game',
    name: gamble.name,
    description: gamble.description || `Gambling game from the manga series Usogui (Lie Eater)`,
    identifier: gamble.id.toString(),
    ...(gamble.imageUrl && {
      image: gamble.imageUrl
    }),
    ...(gamble.type && {
      category: gamble.type
    }),
    isPartOf: {
      '@type': 'CreativeWork',
      name: 'Usogui',
      alternateName: 'Lie Eater',
      author: {
        '@type': 'Person',
        name: 'Sako Toshio'
      },
      genre: ['Manga', 'Psychological', 'Gambling', 'Thriller'],
      publisher: {
        '@type': 'Organization',
        name: 'Shueisha'
      }
    }
  }

  return <JsonLd data={structuredData} />
}