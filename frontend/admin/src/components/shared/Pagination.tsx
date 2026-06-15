import { ChevronLeft, ChevronRight } from 'lucide-react'
import { clsx } from 'clsx'

interface PaginationProps {
  page: number
  total: number
  limit: number
  onPageChange: (p: number) => void
  onLimitChange?: (l: number) => void
}

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

export function Pagination({ page, total, limit, onPageChange, onLimitChange }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const from = total === 0 ? 0 : (page - 1) * limit + 1
  const to   = Math.min(page * limit, total)

  // Build visible page numbers: always show first, last, and ±2 around current
  const allPages = Array.from({ length: totalPages }, (_, i) => i + 1)
  const visible  = allPages.filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2,
  )

  return (
    <div className="flex items-center justify-between border-t border-border pt-4 gap-4 flex-wrap">
      {/* Left: record count + per-page selector */}
      <div className="flex items-center gap-3">
        <p className="text-sm text-muted-foreground whitespace-nowrap">
          {total === 0 ? '0' : `${from}–${to}`}{' '}
          <span className="text-muted-foreground/60">з</span>{' '}
          <span className="font-medium text-foreground">{total}</span>
        </p>

        {onLimitChange && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">По:</span>
            <select
              value={limit}
              onChange={(e) => {
                onLimitChange(Number(e.target.value))
                onPageChange(1)
              }}
              className="text-xs rounded-md border border-input bg-background px-2 py-1 outline-none focus:border-ring focus:ring-1 focus:ring-ring/30 cursor-pointer"
            >
              {PAGE_SIZE_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Right: page buttons — always shown */}
      <div className="flex items-center gap-1">
        {/* Prev */}
        <button
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background text-sm transition-colors hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Попередня сторінка"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {/* Page numbers */}
        {visible.map((p, i) => {
          const prev = visible[i - 1]
          return (
            <span key={p} className="flex items-center gap-1">
              {prev && p - prev > 1 && (
                <span className="px-0.5 text-xs text-muted-foreground select-none">…</span>
              )}
              <button
                onClick={() => onPageChange(p)}
                className={clsx(
                  'inline-flex h-8 min-w-[2rem] px-1 items-center justify-center rounded-md border text-sm font-medium transition-colors',
                  p === page
                    ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                    : 'border-border bg-background hover:bg-accent hover:border-border/80',
                )}
              >
                {p}
              </button>
            </span>
          )
        })}

        {/* Next */}
        <button
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background text-sm transition-colors hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Наступна сторінка"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
