import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { hackathonsApi } from '@/api/hackathons'
import { tagsApi } from '@/api/tags'
import { DataTable } from '@/components/shared/DataTable'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { usePagination } from '@/hooks/usePagination'
import { useDebounce } from '@/hooks/useDebounce'
import { formatDate } from '@/utils/format'
import { Plus, Eye, Pencil, Trash2, Search, Tag, User } from 'lucide-react'
import { toast } from 'sonner'
import { useI18n } from '@/i18n'
import { useAuthStore } from '@/store/auth.store'
import type { Hackathon, Tag as TagType } from '@/types/api.types'
import type { Column } from '@/components/shared/DataTable'
import { usePageTitle } from '@/hooks/usePageTitle'

export function HackathonsListPage() {
  const { t, lang } = useI18n()
  usePageTitle(t.adminHackathons.title)
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { page, limit, setPage, setLimit } = usePagination(20)
  const { user } = useAuthStore()
  const isOrganizer = user?.role === 'organizer'

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [deleteTarget, setDeleteTarget] = useState<Hackathon | null>(null)
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false)

  const debouncedSearch = useDebounce(search, 300)

  const statusTabs = useMemo(() => [
    { value: '', label: lang === 'uk' ? 'Всі' : 'All' },
    { value: 'DRAFT', label: t.shared.statusBadge.draft },
    { value: 'PUBLISHED', label: t.shared.statusBadge.published },
    { value: 'ARCHIVED', label: lang === 'uk' ? 'Архів' : 'Archive' },
  ], [lang, t])

  const { data, isLoading } = useQuery({
    queryKey: ['hackathons', page, limit, statusFilter, selectedTags, debouncedSearch, isOrganizer],
    queryFn: () => hackathonsApi.list({
      page,
      limit,
      publishStatus: statusFilter || undefined,
      tags: selectedTags.join(',') || undefined,
      search: debouncedSearch || undefined,
      // organizer auto-filters by ownership on the backend
    }),
  })

  const { data: tagsData } = useQuery({
    queryKey: ['tags'],
    queryFn: () => tagsApi.list(),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => hackathonsApi.delete(id),
    onSuccess: () => {
      toast.success(lang === 'uk' ? 'Хакатон видалено' : 'Hackathon deleted')
      qc.invalidateQueries({ queryKey: ['hackathons'] })
      setDeleteTarget(null)
    },
    onError: () => toast.error(lang === 'uk' ? 'Помилка при видаленні' : 'Error deleting'),
  })

  const updateStatusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' }) => 
      hackathonsApi.overrideStatus(id, status),
    onSuccess: () => {
      toast.success(lang === 'uk' ? 'Статус оновлено' : 'Status updated')
      qc.invalidateQueries({ queryKey: ['hackathons'] })
      qc.invalidateQueries({ queryKey: ['hackathons', 'all'] })
    },
    onError: (err: any) => {
      // Reset the select UI back to real server value
      qc.invalidateQueries({ queryKey: ['hackathons'] })
      const backendMsg: string = err?.response?.data?.message ?? ''
      let msg: string
      if (backendMsg.toLowerCase().includes('stage')) {
        msg = lang === 'uk'
          ? '❌ Неможливо опублікувати — потрібна хоча б одна стадія'
          : '❌ Cannot publish — at least one stage is required'
      } else if (backendMsg) {
        msg = backendMsg
      } else {
        msg = lang === 'uk' ? 'Помилка при оновленні статусу' : 'Error updating status'
      }
      toast.error(msg)
    },
  })

  const hackathons = data?.data.data ?? []
  const total = data?.data.meta?.total ?? 0
  const allTags: TagType[] = tagsData?.data.data ?? []

  const toggleTag = (tagName: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagName) ? prev.filter((t) => t !== tagName) : [...prev, tagName],
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
      header: t.adminHackathons.name,
      render: (h) => (
        <div>
          <p className="font-medium text-foreground">{h.title}</p>
          {h.subtitle && <p className="text-xs text-muted-foreground">{h.subtitle}</p>}
        </div>
      ),
    },
    {
      key: 'status',
      header: t.adminHackathons.status,
      render: (h) => (
        <select
          value={h.status}
          onChange={(e) => updateStatusMut.mutate({ id: h.id, status: e.target.value as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' })}
          disabled={updateStatusMut.isPending}
          className="text-xs font-semibold px-2.5 py-1 rounded-full border border-border bg-background outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer"
          style={{
            backgroundColor: h.status === 'PUBLISHED' ? 'var(--green-50, #f0fdf4)' : h.status === 'ARCHIVED' ? 'var(--purple-50, #faf5ff)' : 'var(--gray-50, #f9fafb)',
            color: h.status === 'PUBLISHED' ? 'var(--green-700, #15803d)' : h.status === 'ARCHIVED' ? 'var(--purple-700, #7e22ce)' : 'var(--gray-700, #374151)'
          }}
        >
          <option value="DRAFT">{t.shared.statusBadge.draft}</option>
          <option value="PUBLISHED">{t.shared.statusBadge.published}</option>
          <option value="ARCHIVED">{lang === 'uk' ? 'Архів' : 'Archive'}</option>
        </select>
      ),
    },
    {
      key: 'dates',
      header: lang === 'uk' ? 'Дати' : 'Dates',
      render: (h) => (
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {formatDate(h.startDate)} — {formatDate(h.endDate)}
        </span>
      ),
    },
    ...(!isOrganizer ? [{
      key: 'owner',
      header: lang === 'uk' ? 'Власник' : 'Owner',
      render: (h: any) => (
        <div className="flex items-center gap-1.5">
          <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="text-sm">
            {h.ownerFullName
              ? <>{h.ownerFullName} <span className={`text-xs font-semibold ml-1 ${h.ownerRole === 'admin' ? 'text-red-500' : 'text-orange-500'}`}>({h.ownerRole === 'admin' ? 'admin' : 'org'})</span></>
              : <span className="text-muted-foreground">—</span>
            }
          </span>
        </div>
      ),
    }] as Column<Hackathon>[] : []),
    {
      key: 'teams',
      header: t.adminHackathons.teams,
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
            title={t.actions.view}
            className="rounded-md p-1.5 hover:bg-accent transition-colors"
            onClick={() => navigate(`/hackathons/${h.id}`)}
          >
            <Eye className="h-4 w-4 text-muted-foreground" />
          </button>

          <button
            title={t.actions.edit}
            className="rounded-md p-1.5 hover:bg-accent transition-colors"
            onClick={() => navigate(`/hackathons/${h.id}/edit`)}
          >
            <Pencil className="h-4 w-4 text-muted-foreground" />
          </button>
          <button
            title={t.actions.delete}
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
          <h2 className="text-2xl font-bold">{t.adminHackathons.title}</h2>
          <p className="text-sm text-muted-foreground">
            {lang === 'uk' ? 'Управління всіма хакатонами платформи' : 'Manage all platform hackathons'}
          </p>
        </div>
        <button
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          onClick={() => navigate('/hackathons/new')}
        >
          <Plus className="h-4 w-4" />
          {t.adminHackathons.create}
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={lang === 'uk' ? 'Пошук за назвою…' : 'Search by title...'}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="pl-9 pr-3 py-2 text-sm rounded-lg border border-input bg-background outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 w-60"
          />
        </div>

        {/* Status tabs */}
        <div className="flex rounded-lg border border-border overflow-hidden">
          {statusTabs.map((tab) => (
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
              {lang === 'uk' ? 'Теги' : 'Tags'}
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
                      checked={selectedTags.includes(tag.name)}
                      onChange={() => toggleTag(tag.name)}
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
        onLimitChange={setLimit}
        emptyTitle={t.adminHackathons.noHackathons}
        emptyDescription={lang === 'uk' ? 'Натисніть "Створити хакатон" щоб додати перший.' : 'Click "Create Hackathon" to add the first one.'}
      />

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        title={lang === 'uk' ? `Видалити «${deleteTarget?.title}»?` : `Delete "${deleteTarget?.title}"?`}
        description={lang === 'uk' ? "Ця дія є незворотною. Всі пов'язані команди та дані будуть втрачені." : "This action is irreversible. All associated teams and data will be lost."}
        confirmLabel={t.actions.delete}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
