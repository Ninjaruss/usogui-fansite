'use client'

import { useState, useEffect } from 'react'
import { api } from '../lib/api'

interface FavoriteQuote {
  quote: {
    id: number
    text: string
    description?: string
    chapterNumber: number
    pageNumber?: number
    character: {
      id: number
      name: string
    }
  }
  userCount: number
}

interface FavoriteGamble {
  gamble: {
    id: number
    name: string
    rules: string
    winCondition?: string
    chapterId: number
  }
  userCount: number
}

interface FavoriteCharacterMedia {
  media: {
    id: number
    url: string
    fileName: string
    description?: string
    ownerType: string
    ownerId: number
    chapterNumber?: number
    character: {
      id: number
      name: string
    }
    submittedBy?: {
      id: number
      username: string
    } | null
  }
  userCount: number
}

interface CharacterFavoriteEntry {
  character: { id: number; name: string; entityImageUrl?: string | null }
}

export interface FavoriteCharacterStats {
  mostFavorited: Array<CharacterFavoriteEntry & { totalCount: number }>
  mostPrimary: Array<CharacterFavoriteEntry & { primaryCount: number }>
  mostLoyal: Array<CharacterFavoriteEntry & { loyaltyRatio: number; primaryCount: number; totalCount: number }>
}

interface FavoritesData {
  favoriteQuotes: FavoriteQuote[]
  favoriteGambles: FavoriteGamble[]
  favoriteCharacterMedia: FavoriteCharacterMedia[]
  favoriteCharacters: FavoriteCharacterStats
}

export function useFavoritesData() {
  const [data, setData] = useState<FavoritesData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const result = await api.getFavoritesData()
        setData(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load favorites data')
        console.error('Error fetching favorites data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return { data, loading, error }
}