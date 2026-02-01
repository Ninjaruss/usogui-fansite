import { useState, useEffect } from 'react'
import { useDataProvider } from 'react-admin'

interface PendingCounts {
  guides: number
  media: number
  events: number
  annotations: number
  total: number
}

/**
 * Shared hook to fetch pending counts for all moderatable resources.
 * Auto-refreshes every 60 seconds.
 */
export const usePendingCounts = () => {
  const [counts, setCounts] = useState<PendingCounts>({
    guides: 0,
    media: 0,
    events: 0,
    annotations: 0,
    total: 0
  })
  const [loading, setLoading] = useState(true)
  const dataProvider = useDataProvider()

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [guidesRes, mediaRes, eventsRes, annotationsRes] = await Promise.all([
          dataProvider.getList('guides', {
            filter: { status: 'pending' },
            pagination: { page: 1, perPage: 1 },
            sort: { field: 'id', order: 'ASC' }
          }),
          dataProvider.getList('media', {
            filter: { status: 'pending' },
            pagination: { page: 1, perPage: 1 },
            sort: { field: 'id', order: 'ASC' }
          }),
          dataProvider.getList('events', {
            filter: { status: 'pending' },
            pagination: { page: 1, perPage: 1 },
            sort: { field: 'id', order: 'ASC' }
          }),
          dataProvider.getList('annotations', {
            filter: { status: 'pending' },
            pagination: { page: 1, perPage: 1 },
            sort: { field: 'id', order: 'ASC' }
          })
        ])

        const newCounts = {
          guides: guidesRes.total || 0,
          media: mediaRes.total || 0,
          events: eventsRes.total || 0,
          annotations: annotationsRes.total || 0,
          total: 0
        }
        newCounts.total = newCounts.guides + newCounts.media + newCounts.events + newCounts.annotations

        setCounts(newCounts)
      } catch (error) {
        console.error('Failed to fetch pending counts:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCounts()

    // Refresh counts every 60 seconds
    const interval = setInterval(fetchCounts, 60000)
    return () => clearInterval(interval)
  }, [dataProvider])

  return { counts, loading }
}
