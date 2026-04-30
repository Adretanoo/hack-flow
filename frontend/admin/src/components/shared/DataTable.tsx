import { clsx } from 'clsx'
import { EmptyState } from './EmptyState'
import { Pagination } from './Pagination'

export interface Column<T> {
  key: string
  header: React.ReactNode
  render: (row: T) => React.ReactNode
  className?: string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  loading?: boolean
  total?: number
  page?: number
  limit?: number
  onPageChange?: (p: number) => void
  emptyTitle?: string
  emptyDescription?: string
  rowClassName?: (row: T) => string
}

function SkeletonRow({ cols }: { cols: number }) {
  return (
    <tr className="animate-pulse">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 rounded bg-muted" />
        </td>
      ))}
    </tr>
  )
}

export function DataTable<T extends { id?: string }>({
  columns,
  data,
  loading = false,
  total = 0,
  page = 1,
  limit = 20,
  onPageChange,
  emptyTitle,
  emptyDescription,
  rowClassName,
}: DataTableProps<T>) {
  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={clsx(
                    'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground',
                    col.className,
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <SkeletonRow key={i} cols={columns.length} />
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length}>
                  <EmptyState title={emptyTitle} description={emptyDescription} />
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr
                  key={(row as Record<string, unknown>).id as string ?? i}
                  className={clsx(
                    'bg-card transition-colors hover:bg-muted/30',
                    rowClassName?.(row),
                  )}
                >
                  {columns.map((col) => (
                    <td key={col.key} className={clsx('px-4 py-3', col.className)}>
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {onPageChange && total > 0 && (
        <Pagination page={page} total={total} limit={limit} onPageChange={onPageChange} />
      )}
    </div>
  )
}
