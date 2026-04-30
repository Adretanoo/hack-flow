import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { judgingApi } from '@/api/judging'
import { hackathonsApi } from '@/api/hackathons'
import { exportToCSV } from '@/utils/export'
import { EmptyState } from '@/components/shared/EmptyState'
import { DataTable } from '@/components/shared/DataTable'
import { ScoreDetailDrawer } from './components/ScoreDetailDrawer'
import { formatDate } from '@/utils/format'
import { ArrowLeft, Plus, Download, AlertTriangle, RefreshCcw } from 'lucide-react'
import { clsx } from 'clsx'
import { toast } from 'sonner'
import { usePageTitle } from '@/hooks/usePageTitle'
import type { Track, Criteria, LeaderboardEntry, Conflict } from '@/types/api.types'

type Tab = 'criteria' | 'scores' | 'conflicts' | 'leaderboard'
const TABS: { key: Tab; label: string }[] = [
  { key: 'criteria', label: 'Критерії' },
  { key: 'scores', label: 'Оцінки' },
  { key: 'conflicts', label: 'Конфлікти' },
  { key: 'leaderboard', label: 'Лідборд' },
]

export function JudgingPage() {
  usePageTitle('Суддівство')
  const { hackathonId } = useParams<{ hackathonId: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const [activeTab, setActiveTab] = useState<Tab>('criteria')
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  
  // Criteria form state per track
  const [newCriteria, setNewCriteria] = useState<{ trackId: string; name: string; maxScore: number; weight: number }>({
    trackId: '', name: '', maxScore: 10, weight: 0.1
  })

  // Hackathons data
  const { data: hackData } = useQuery({
    queryKey: ['hackathons', 'all'],
    queryFn: () => hackathonsApi.list({ limit: 100 }),
  })

  // Judging specific data
  const { data: tracksData } = useQuery({
    queryKey: ['tracks', hackathonId],
    queryFn: () => hackathonsApi.listTracks(hackathonId!),
    enabled: !!hackathonId,
  })

  const { data: leaderboardData, isLoading: boardLoading, isFetching: boardFetching } = useQuery({
    queryKey: ['leaderboard', hackathonId],
    queryFn: () => judgingApi.getLeaderboard(hackathonId!),
    enabled: !!hackathonId && activeTab === 'leaderboard',
  })

  const { data: conflictsData, isLoading: conflictsLoading } = useQuery({
    queryKey: ['conflicts', hackathonId],
    queryFn: () => judgingApi.listAllConflicts({ hackathonId, limit: 1000 }),
    enabled: !!hackathonId && activeTab === 'conflicts',
  })

  const createCriteriaMut = useMutation({
    mutationFn: (data: Parameters<typeof judgingApi.createCriteria>[0]) => judgingApi.createCriteria(data),
    onSuccess: (_, variables) => {
      toast.success('Критерій додано')
      qc.invalidateQueries({ queryKey: ['criteria', variables.trackId] })
      setNewCriteria({ trackId: '', name: '', maxScore: 10, weight: 0.1 })
    },
  })

  const deleteCriteriaMut = useMutation({
    mutationFn: ({ id }: { id: string; trackId: string }) => judgingApi.deleteCriteria(id),
    onSuccess: (_, vars) => {
      toast.success('Критерій видалено')
      qc.invalidateQueries({ queryKey: ['criteria', vars.trackId] })
    },
  })

  const hackathons = hackData?.data.data ?? []

  if (!hackathonId) {
    return (
      <div className="mx-auto max-w-xl py-20 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">Суддівство</h2>
          <p className="text-muted-foreground">Оберіть хакатон для управління суддівством</p>
        </div>
        <div className="grid gap-3">
          {hackathons.map((h) => (
            <button key={h.id} onClick={() => navigate(`/judging/${h.id}`)}
              className="flex items-center justify-between rounded-xl border border-border bg-card p-5 text-left hover:border-primary/50 transition-colors">
              <div>
                <h3 className="font-semibold">{h.title}</h3>
                <p className="text-sm text-muted-foreground">{formatDate(h.startDate)}</p>
              </div>
              <ArrowLeft className="h-5 w-5 rotate-180 text-muted-foreground" />
            </button>
          ))}
        </div>
      </div>
    )
  }

  const tracks = (tracksData?.data.data ?? []) as Track[]
  const leaderboard = (leaderboardData?.data.data ?? []) as LeaderboardEntry[]
  const conflicts = ((conflictsData?.data as any)?.data ?? []) as Conflict[]

  const handleExportConflicts = () => {
    const rows = conflicts.map(c => ({
      'Суддя': c.judge?.fullName || c.judgeId,
      'Email Судді': c.judge?.email || '',
      'Команда': c.team?.name || c.teamId,
      'Причина': c.reason || '',
      'Дата': formatDate(c.createdAt)
    }))
    exportToCSV(`conflicts_${hackathonId}_${new Date().toISOString().split('T')[0]}.csv`, rows)
  }

  const handleExportLeaderboard = () => {
    const rows = leaderboard.map(l => ({
      'Місце': l.rank,
      'Команда': l.teamName,
      'Бали': l.totalScore
    }))
    exportToCSV(`leaderboard_${hackathonId}_${new Date().toISOString().split('T')[0]}.csv`, rows)
  }

  return (
    <div className="space-y-5 animate-fade-in relative">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/judging')}
          className="rounded-lg border border-border p-2 hover:bg-accent transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h2 className="text-2xl font-bold">Суддівство хакатону</h2>
          <p className="text-sm text-muted-foreground">Управління критеріями, оцінками та лідбордом</p>
        </div>
      </div>

      <div className="border-b border-border">
        <div className="flex">
          {TABS.map(({ key, label }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={clsx('border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
                activeTab === key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground')}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'criteria' && (
        <div className="space-y-4">
          {tracks.length === 0 ? (
            <EmptyState title="Немає треків" description="Створіть треки в налаштуваннях хакатону." />
          ) : (
            tracks.map(track => (
              <TrackCriteriaSection 
                key={track.id} 
                track={track} 
                newCriteria={newCriteria}
                setNewCriteria={setNewCriteria}
                onCreate={(data) => createCriteriaMut.mutate(data)}
                onDelete={(id) => deleteCriteriaMut.mutate({ id, trackId: track.id })}
                isLoading={createCriteriaMut.isPending || deleteCriteriaMut.isPending}
              />
            ))
          )}
        </div>
      )}

      {activeTab === 'scores' && (
        <div className="rounded-xl border border-border bg-card p-10 text-center text-muted-foreground italic">
          Оцінок ще немає або виберіть проєкт, щоб відкрити панель з деталями.
          <br /><br />
          {/* Temporary trigger to test drawer until projectsApi is hooked up */}
          <button onClick={() => setSelectedProjectId('test-id')} className="text-primary hover:underline">
            Тест: Відкрити деталі оцінок
          </button>
        </div>
      )}

      {activeTab === 'conflicts' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button onClick={handleExportConflicts} className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-accent">
              <Download className="h-4 w-4" /> Експорт CSV
            </button>
          </div>
          <DataTable
            columns={[
              { key: 'judge', header: 'Суддя', render: (c) => <span className="font-medium">{c.judge?.fullName || '—'}</span> },
              { key: 'team', header: 'Команда', render: (c) => <span className="font-medium">{c.team?.name || '—'}</span> },
              { key: 'reason', header: 'Причина', render: (c) => <span className="text-muted-foreground text-sm">{c.reason || '—'}</span> },
              { key: 'date', header: 'Дата', render: (c) => <span className="text-xs text-muted-foreground">{formatDate(c.createdAt)}</span> },
            ]}
            data={conflicts}
            loading={conflictsLoading}
            emptyTitle="Конфліктів немає"
          />
        </div>
      )}

      {activeTab === 'leaderboard' && (
        <div className="space-y-3">
          <div className="flex justify-end gap-2">
            <button onClick={() => qc.invalidateQueries({ queryKey: ['leaderboard'] })} 
              className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-accent">
              <RefreshCcw className={clsx("h-4 w-4", boardFetching && "animate-spin")} /> Оновити
            </button>
            <button onClick={handleExportLeaderboard} className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-accent">
              <Download className="h-4 w-4" /> Експорт CSV
            </button>
          </div>
          <DataTable
            columns={[
              { key: 'rank', header: 'Місце', className: 'w-16 font-bold', render: (l) => l.rank },
              { key: 'team', header: 'Команда', render: (l) => <span className="font-medium">{l.teamName}</span> },
              { key: 'score', header: 'Бал', render: (l) => <span className="font-bold text-primary">{Number(l.totalScore).toFixed(2)}</span> },
            ]}
            data={leaderboard}
            loading={boardLoading}
            emptyTitle="Результати з'являться після оцінювання"
            rowClassName={(l) => {
              if (l.rank === 1) return 'border-l-4 border-l-yellow-400 bg-yellow-50/10'
              if (l.rank === 2) return 'border-l-4 border-l-gray-300 bg-gray-50/10'
              if (l.rank === 3) return 'border-l-4 border-l-amber-600 bg-amber-50/10'
              return ''
            }}
          />
        </div>
      )}

      {selectedProjectId && (
        <ScoreDetailDrawer 
          projectId={selectedProjectId} 
          hackathonId={hackathonId} 
          onClose={() => setSelectedProjectId(null)} 
        />
      )}
    </div>
  )
}

function TrackCriteriaSection({ 
  track, newCriteria, setNewCriteria, onCreate, onDelete, isLoading 
}: { 
  track: Track; newCriteria: any; setNewCriteria: any; onCreate: (v: any) => void; onDelete: (id: string) => void; isLoading: boolean 
}) {
  const { data } = useQuery({
    queryKey: ['criteria', track.id],
    queryFn: () => judgingApi.listCriteria(track.id),
  })

  const criteriaList = (data?.data.data ?? []) as Criteria[]
  const totalWeight = useMemo(() => criteriaList.reduce((sum, c) => sum + Number(c.weight), 0), [criteriaList])
  const isOverweight = totalWeight > 1.0

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="bg-muted/30 px-5 py-4 flex items-center justify-between border-b border-border">
        <h3 className="font-semibold">{track.name}</h3>
        <span className={clsx("text-sm font-medium", isOverweight ? "text-destructive" : "text-muted-foreground")}>
          Сума ваг: {totalWeight.toFixed(2)} / 1.0
        </span>
      </div>
      
      <div className="p-5 space-y-5">
        {isOverweight && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-red-800 text-sm">
            <AlertTriangle className="h-4 w-4" />
            Сума ваг перевищує 1.0. Зменште вагу деяких критеріїв.
          </div>
        )}

        <div className="space-y-2">
          {criteriaList.map((c) => (
            <div key={c.id} className="flex items-center justify-between rounded-lg border border-border p-3 text-sm hover:bg-muted/20 transition-colors">
              <div>
                <p className="font-medium">{c.name}</p>
                <p className="text-xs text-muted-foreground">Макс. бал: {c.maxScore} • Вага: {c.weight}</p>
              </div>
              <button onClick={() => onDelete(c.id)} disabled={isLoading} className="text-xs text-destructive hover:underline disabled:opacity-50">
                Видалити
              </button>
            </div>
          ))}
          {criteriaList.length === 0 && <p className="text-sm text-muted-foreground italic">Критеріїв ще немає.</p>}
        </div>

        <div className="flex flex-wrap items-end gap-3 pt-4 border-t border-border mt-4">
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs text-muted-foreground mb-1 block">Назва критерію</label>
            <input type="text" value={newCriteria.trackId === track.id ? newCriteria.name : ''}
              onChange={(e) => setNewCriteria({ ...newCriteria, trackId: track.id, name: e.target.value })}
              className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm" />
          </div>
          <div className="w-24">
            <label className="text-xs text-muted-foreground mb-1 block">Вага (0-1)</label>
            <input type="number" step="0.1" min="0.1" max="1.0"
              value={newCriteria.trackId === track.id ? newCriteria.weight : ''}
              onChange={(e) => setNewCriteria({ ...newCriteria, trackId: track.id, weight: parseFloat(e.target.value) })}
              className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm" />
          </div>
          <div className="w-24">
            <label className="text-xs text-muted-foreground mb-1 block">Макс. бал</label>
            <input type="number" min="1"
              value={newCriteria.trackId === track.id ? newCriteria.maxScore : ''}
              onChange={(e) => setNewCriteria({ ...newCriteria, trackId: track.id, maxScore: parseInt(e.target.value) })}
              className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm" />
          </div>
          <button 
            disabled={isLoading || newCriteria.trackId !== track.id || !newCriteria.name}
            onClick={() => onCreate(newCriteria)}
            className="rounded-lg bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50 h-8">
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
