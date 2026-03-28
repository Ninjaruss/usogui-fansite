import { useState, useEffect } from 'react'
import { useDataProvider } from 'react-admin'

interface PendingCounts {
  guides: number
  media: number
  events: number
  annotations: number
  quotes: number
  unverifiedEditorial: number
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
    quotes: 0,
    unverifiedEditorial: 0,
    total: 0
  })
  const [loading, setLoading] = useState(true)
  const dataProvider = useDataProvider()

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const unverifiedFilter = { isVerified: false }
        const oneItem = { page: 1, perPage: 1 }
        const idSort = { field: 'id', order: 'ASC' as const }

        const [guidesRes, mediaRes, eventsRes, annotationsRes, quotesRes,
               arcsRes, gamblesRes, chaptersRes, orgsRes] = await Promise.all([
          dataProvider.getList('guides', { filter: { status: 'pending' }, pagination: oneItem, sort: idSort }),
          dataProvider.getList('media', { filter: { status: 'pending' }, pagination: oneItem, sort: idSort }),
          dataProvider.getList('events', { filter: { status: 'pending' }, pagination: oneItem, sort: idSort }),
          dataProvider.getList('annotations', { filter: { status: 'pending' }, pagination: oneItem, sort: idSort }),
          dataProvider.getList('quotes', { filter: { status: 'pending' }, pagination: oneItem, sort: idSort }),
          dataProvider.getList('arcs', { filter: unverifiedFilter, pagination: oneItem, sort: idSort }),
          dataProvider.getList('gambles', { filter: unverifiedFilter, pagination: oneItem, sort: idSort }),
          dataProvider.getList('chapters', { filter: unverifiedFilter, pagination: oneItem, sort: idSort }),
          dataProvider.getList('organizations', { filter: unverifiedFilter, pagination: oneItem, sort: idSort }),
        ])

        const unverifiedEditorial =
          (arcsRes.total || 0) + (gamblesRes.total || 0) +
          (chaptersRes.total || 0) + (orgsRes.total || 0)

        const newCounts: PendingCounts = {
          guides: guidesRes.total || 0,
          media: mediaRes.total || 0,
          events: eventsRes.total || 0,
          annotations: annotationsRes.total || 0,
          quotes: quotesRes.total || 0,
          unverifiedEditorial,
          total: 0,
        }
        newCounts.total = newCounts.guides + newCounts.media + newCounts.events +
                          newCounts.annotations + newCounts.quotes

        setCounts(newCounts)
      } catch (error) {
        console.error('Failed to fetch pending counts:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCounts()
    const interval = setInterval(fetchCounts, 60000)
    return () => clearInterval(interval)
  }, [dataProvider])

  return { counts, loading }
}
