import { ChevronLeft, ChevronRight } from 'lucide-react'
import { clsx } from 'clsx'

interface PaginationProps {
  page: number
  total: number
  limit: number
  onPageChange: (p: number) => void
}

export function Pagination({ page, total, limit, onPageChange }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / limit))
  if (totalPages <= 1) return null

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2,
  )

  return (
    <div className="flex items-center justify-between border-t border-border pt-4">
      <p className="text-sm text-muted-foreground">
        {(page - 1) * limit + 1}–{Math.min(page * limit, total)} з {total}
      </p>
      <div className="flex items-center gap-1">
        <button
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background text-sm transition-colors hover:bg-accent disabled:opacity-40"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {pages.map((p, i) => {
          const prev = pages[i - 1]
          return (
            <>
              {prev && p - prev > 1 && (
                <span key={`gap-${p}`} className="px-1 text-muted-foreground">…</span>
              )}
              <button
                key={p}
                onClick={() => onPageChange(p)}
                className={clsx(
                  'inline-flex h-8 w-8 items-center justify-center rounded-md border text-sm font-medium transition-colors',
                  p === page
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background hover:bg-accent',
                )}
              >
                {p}
              </button>
            </>
          )
        })}

        <button
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background text-sm transition-colors hover:bg-accent disabled:opacity-40"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
