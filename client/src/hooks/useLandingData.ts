'use client'

import { useState, useEffect } from 'react'
import { api } from '../lib/api'

interface LandingData {
  trending: {
    guides: Array<{
      id: number
      title: string
      description: string
      viewCount: number
      recentViewCount: number
      author: { id: number; username: string }
      createdAt: string
    }>
    characters: Array<{
      id: number
      name: string
      description?: string
      viewCount: number
      recentViewCount: number
    }>
    events: Array<{
      id: number
      title: string
      description: string
      viewCount: number
      recentViewCount: number
    }>
    gambles: Array<{
      id: number
      name: string
      rules: string
      viewCount: number
      recentViewCount: number
    }>
  }
  stats: {
    totalCharacters: number
    totalEvents: number
    totalGuides: number
    totalGambles: number
    totalArcs?: number
    totalMedia?: number
    totalUsers?: number
  }
}

export function useLandingData() {
  const [data, setData] = useState<LandingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const result = await api.getLandingPageData({ limit: 3, daysBack: 7 })
        setData(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load trending data')
        console.error('Error fetching landing page data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return { data, loading, error }
}