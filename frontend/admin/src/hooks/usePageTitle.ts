import { useEffect } from 'react'

export function usePageTitle(title: string) {
  useEffect(() => {
    document.title = `${title} — Hack-Flow CMS`
  }, [title])
}
