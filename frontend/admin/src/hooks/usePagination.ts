import { useState, useCallback } from 'react'

export interface PaginationState {
  page: number
  limit: number
  setPage: (p: number) => void
  setLimit: (l: number) => void
  reset: () => void
}

export function usePagination(initialLimit = 20): PaginationState {
  const [page, setPageState] = useState(1)
  const [limit, setLimitState] = useState(initialLimit)

  const setPage = useCallback((p: number) => setPageState(p), [])
  const setLimit = useCallback((l: number) => { setLimitState(l); setPageState(1) }, [])
  const reset = useCallback(() => { setPageState(1) }, [])

  return { page, limit, setPage, setLimit, reset }
}
