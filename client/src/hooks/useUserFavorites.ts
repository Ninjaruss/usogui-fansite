'use client'

import { useState, useEffect } from 'react'
import { api } from '../lib/api'

interface UserFavoriteQuote {
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

interface UserFavoriteGamble {
  id: number
  name: string
  rules: string
  winCondition?: string
  chapterId: number
}

interface UserFavoritesData {
  favoriteQuote: UserFavoriteQuote | null
  favoriteGamble: UserFavoriteGamble | null
}

export function useUserFavorites() {
  const [data, setData] = useState<UserFavoritesData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchUserFavorites = async () => {
      try {
        setLoading(true)

        // Get current user data which includes favoriteQuoteId and favoriteGambleId
        const user = await api.getCurrentUser()

        const favoritePromises: Promise<any>[] = []

        // Fetch favorite quote if user has one selected
        if (user.favoriteQuoteId) {
          favoritePromises.push(api.getQuote(user.favoriteQuoteId))
        } else {
          favoritePromises.push(Promise.resolve(null))
        }

        // Fetch favorite gamble if user has one selected
        if (user.favoriteGambleId) {
          favoritePromises.push(api.getGamble(user.favoriteGambleId))
        } else {
          favoritePromises.push(Promise.resolve(null))
        }

        const [favoriteQuote, favoriteGamble] = await Promise.all(favoritePromises)

        setData({
          favoriteQuote,
          favoriteGamble
        })
      } catch (err) {
        // If user is not logged in, that's okay - just show empty state
        if (err instanceof Error && (err as any).status === 401) {
          setData({ favoriteQuote: null, favoriteGamble: null })
        } else {
          setError(err instanceof Error ? err.message : 'Failed to load user favorites')
          console.error('Error fetching user favorites:', err)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchUserFavorites()
  }, [])

  return { data, loading, error }
}