import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { hackathonsApi } from '@/api/hackathons'
import { tagsApi } from '@/api/tags'
import { DataTable } from '@/components/shared/DataTable'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { usePagination } from '@/hooks/usePagination'
import { useDebounce } from '@/hooks/useDebounce'
import { formatDate } from '@/utils/format'
import { Plus, Eye, Pencil, Trash2, Search, Tag } from 'lucide-react'
import { toast } from 'sonner'
import type { Hackathon, Tag as TagType } from '@/types/api.types'
import type { Column } from '@/components/shared/DataTable'

const STATUS_TABS = [
  { value: '', label: 'Всі' },
  { value: 'DRAFT', label: 'Чернетки' },
  { value: 'PUBLISHED', label: 'Опубліковані' },
  { value: 'ARCHIVED', label: 'Архів' },
]

import { usePageTitle } from '@/hooks/usePageTitle'

export function HackathonsListPage() {
  usePageTitle('Хакатони')
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { page, limit, setPage } = usePagination(10)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [deleteTarget, setDeleteTarget] = useState<Hackathon | null>(null)
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false)

  const debouncedSearch = useDebounce(search, 300)

  const { data, isLoading } = useQuery({
    queryKey: ['hackathons', page, limit, statusFilter, selectedTags, debouncedSearch],
    queryFn: () => hackathonsApi.list({
      page,
      limit,
      status: statusFilter || undefined,
      tags: selectedTags.join(',') || undefined,
      search: debouncedSearch || undefined,
    }),
  })

  const { data: tagsData } = useQuery({
    queryKey: ['tags'],
    queryFn: () => tagsApi.list(),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => hackathonsApi.delete(id),
    onSuccess: () => {
      toast.success('Хакатон видалено')
      qc.invalidateQueries({ queryKey: ['hackathons'] })
      setDeleteTarget(null)
    },
    onError: () => toast.error('Помилка при видаленні'),
  })

  const hackathons = data?.data.data ?? []
  const total = data?.data.total ?? 0
  const allTags: TagType[] = tagsData?.data.data ?? []

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId],
    )
    setPage(1)
  }

  const columns: Column<Hackathon>[] = [
    {
      key: 'banner',
      header: '',
      className: 'w-12',
      render: (h) =>
        h.banner ? (
          <img src={h.banner} alt="" className="h-10 w-10 rounded-md object-cover" />
        ) : (
          <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center text-muted-foreground text-xs">
            IMG
          </div>
        ),
    },
    {
      key: 'title',
      header: 'Назва',
      render: (h) => (
        <div>
          <p className="font-medium text-foreground">{h.title}</p>
          {h.subtitle && <p className="text-xs text-muted-foreground">{h.subtitle}</p>}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Статус',
      render: (h) => <StatusBadge status={h.status} />,
    },
    {
      key: 'dates',
      header: 'Дати',
      render: (h) => (
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {formatDate(h.startDate)} — {formatDate(h.endDate)}
        </span>
      ),
    },
    {
      key: 'teams',
      header: 'Команди',
      render: (h) => (
        <span className="text-sm text-muted-foreground">{h._count?.teams ?? '—'}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-28',
      render: (h) => (
        <div className="flex items-center gap-1">
          <button
            title="Переглянути"
            className="rounded-md p-1.5 hover:bg-accent transition-colors"
            onClick={() => navigate(`/hackathons/${h.id}`)}
          >
            <Eye className="h-4 w-4 text-muted-foreground" />
          </button>
          <button
            title="Редагувати"
            className="rounded-md p-1.5 hover:bg-accent transition-colors"
            onClick={() => navigate(`/hackathons/${h.id}/edit`)}
          >
            <Pencil className="h-4 w-4 text-muted-foreground" />
          </button>
          <button
            title="Видалити"
            className="rounded-md p-1.5 hover:bg-destructive/10 transition-colors"
            onClick={() => setDeleteTarget(h)}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Хакатони</h2>
          <p className="text-sm text-muted-foreground">Управління всіма хакатонами платформи</p>
        </div>
        <button
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          onClick={() => navigate('/hackathons/new')}
        >
          <Plus className="h-4 w-4" />
          Створити хакатон
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Пошук за назвою…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="pl-9 pr-3 py-2 text-sm rounded-lg border border-input bg-background outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 w-60"
          />
        </div>

        {/* Status tabs */}
        <div className="flex rounded-lg border border-border overflow-hidden">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => { setStatusFilter(tab.value); setPage(1) }}
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                statusFilter === tab.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background text-muted-foreground hover:bg-accent'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tag filter */}
        {allTags.length > 0 && (
          <div className="relative">
            <button
              className="flex items-center gap-2 rounded-lg border border-input bg-background px-3 py-2 text-sm hover:bg-accent transition-colors"
              onClick={() => setTagDropdownOpen((o) => !o)}
            >
              <Tag className="h-4 w-4 text-muted-foreground" />
              Теги
              {selectedTags.length > 0 && (
                <span className="rounded-full bg-primary px-1.5 py-0.5 text-xs text-primary-foreground">
                  {selectedTags.length}
                </span>
              )}
            </button>
            {tagDropdownOpen && (
              <div className="absolute top-10 z-20 min-w-48 rounded-lg border border-border bg-card p-2 shadow-lg">
                {allTags.map((tag) => (
                  <label
                    key={tag.id}
                    className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
                  >
                    <input
                      type="checkbox"
                      checked={selectedTags.includes(tag.id)}
                      onChange={() => toggleTag(tag.id)}
                      className="h-3.5 w-3.5 accent-primary"
                    />
                    {tag.name}
                  </label>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={hackathons}
        loading={isLoading}
        total={total}
        page={page}
        limit={limit}
        onPageChange={setPage}
        emptyTitle="Хакатонів ще немає"
        emptyDescription='Натисніть "Створити хакатон" щоб додати перший.'
      />

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        title={`Видалити «${deleteTarget?.title}»?`}
        description="Ця дія є незворотною. Всі пов'язані команди та дані будуть втрачені."
        confirmLabel="Видалити"
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
