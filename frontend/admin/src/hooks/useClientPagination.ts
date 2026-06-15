import { useState, useMemo } from 'react'

/**
 * Client-side pagination hook.
 * Takes a full array and returns the current page slice + pagination state.
 */
export function useClientPagination<T>(items: T[], initialLimit = 20) {
  const [page, setPage] = useState(1)
  const [limit, setLimitState] = useState(initialLimit)

  const total = items.length
  const totalPages = Math.max(1, Math.ceil(total / limit))

  // Clamp page when limit changes or items shrink
  const safePage = Math.min(page, totalPages)

  const slice = useMemo(() => {
    const start = (safePage - 1) * limit
    return items.slice(start, start + limit)
  }, [items, safePage, limit])

  const setLimit = (l: number) => {
    setLimitState(l)
    setPage(1)
  }

  return {
    slice,
    page: safePage,
    limit,
    total,
    setPage,
    setLimit,
  }
}
