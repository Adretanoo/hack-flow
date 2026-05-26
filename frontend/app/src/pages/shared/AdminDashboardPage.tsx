import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Trophy, Star, AlertTriangle, Calendar, Clock, CheckCircle2, XCircle, Hourglass, Trash2, Plus, RefreshCw, ClipboardList, Pencil, Check, X as XIcon, ShieldAlert } from 'lucide-react'
import { hackathonsApi } from '@/api/hackathons'
import { judgingApi } from '@/api/judging'
import { mentorshipApi } from '@/api/mentorship'
import { tracksApi } from '@/api/tracks'
import { usersApi } from '@/api/users'
import { teamsApi } from '@/api/teams'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { PageHeader } from '@/components/shared/PageHeader'

const TABS = [
  { id: 'judging',    label: 'Судівство',   icon: Star },
  { id: 'mentorship', label: 'Менторство', icon: Calendar },
]

function fmtTime(dt: Date) { return dt.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit', hour12: false }) }
function fmtDate(dt: Date) { return dt.toLocaleDateString('uk-UA', { day: 'numeric', month: 'short', year: 'numeric' }) }

const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  pending:   { label: '⏳ Очікує',       cls: 'bg-amber-100 text-amber-700' },
  accepted:  { label: '✓ Підтверджено', cls: 'bg-blue-100 text-blue-700' },
  rejected:  { label: '✗ Відхилено',    cls: 'bg-red-100 text-red-600' },
  cancelled: { label: '✗ Скасовано',    cls: 'bg-muted text-muted-foreground' },
  completed: { label: '✅ Завершено',    cls: 'bg-green-100 text-green-700' },
  blocked:   { label: '🔒 Заблок.',      cls: 'bg-muted text-muted-foreground' },
}

const CONFLICT_REASON: Record<string, string> = {
  MENTORED: '👨‍🏫 Ментор команди',
  RELATIVE: '👥 Особисті стосунки',
}

// ─── Judging Tab ────────────────────────────────────────────────────────────
function JudgingTab({ hackathonId }: { hackathonId: string }) {
  const qc = useQueryClient()
  const [subTab, setSubTab] = useState('leaderboard')
  const [trackId, setTrackId] = useState('')
  const [newCrit, setNewCrit] = useState({ name: '', maxScore: 10, weight: 1, description: '' })
  const [showCritForm, setShowCritForm] = useState(false)

  const { data: leaderboardData, isLoading: lbLoading } = useQuery({
    queryKey: ['admin-leaderboard', hackathonId],
    queryFn: () => judgingApi.getLeaderboard(hackathonId).then(r => r.data.data),
    enabled: !!hackathonId,
    refetchInterval: 30_000,
  })

  const { data: conflictsData, isLoading: confLoading } = useQuery({
    queryKey: ['admin-conflicts', hackathonId],
    queryFn: () => judgingApi.getAllConflicts(hackathonId || undefined).then(r => (r.data as any).data ?? []),
    refetchInterval: 30_000,
  })

  const { data: judgesData } = useQuery({
    queryKey: ['admin-judges'],
    queryFn: () => usersApi.getUsers({ role: 'judge', limit: 100 }).then((r: any) => r.data.data),
  })

  const { data: teamsData2 } = useQuery({
    queryKey: ['admin-all-teams', hackathonId],
    queryFn: () => teamsApi.list({ hackathon_id: hackathonId || undefined, limit: 200 }).then((r: any) => r.data.data),
  })

  const { data: tracksData } = useQuery({
    queryKey: ['tracks', hackathonId],
    queryFn: () => tracksApi.list({ hackathon_id: hackathonId, limit: 100 }).then((r: any) => r.data.data),
    enabled: !!hackathonId,
  })

  const { data: criteriaData, refetch: refetchCrit } = useQuery({
    queryKey: ['criteria', trackId],
    queryFn: () => judgingApi.getCriteriaByTrack(trackId).then(r => r.data.data),
    enabled: !!trackId,
  })

  const deleteCritMut = useMutation({
    mutationFn: (id: string) => judgingApi.deleteCriteria(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['criteria', trackId] }) },
  })

  const createCritMut = useMutation({
    mutationFn: (data: any) => judgingApi.createCriteria(data),
    onSuccess: () => { refetchCrit(); setNewCrit({ name: '', maxScore: 10, weight: 1, description: '' }); setShowCritForm(false) },
  })

  const leaderboard: any[] = leaderboardData || []
  const conflicts: any[] = Array.isArray(conflictsData) ? conflictsData : []
  const tracks: any[] = tracksData || []
  const criteria: any[] = criteriaData || []
  const judges: any[] = judgesData || []
  const allAdminTeams: any[] = teamsData2 || []

  // Create conflict form state
  const [newConflict, setNewConflict] = useState({ judgeId: '', teamId: '', reason: 'MENTORED' as 'MENTORED' | 'RELATIVE' })
  const [showCreateForm, setShowCreateForm] = useState(false)
  // Inline edit state: conflictId → new reason
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editReason, setEditReason] = useState<'MENTORED' | 'RELATIVE'>('MENTORED')

  const createConflictMut = useMutation({
    mutationFn: () => judgingApi.adminCreateConflict({ judgeId: newConflict.judgeId, teamId: newConflict.teamId, reason: newConflict.reason }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-conflicts'] }); setNewConflict({ judgeId: '', teamId: '', reason: 'MENTORED' }); setShowCreateForm(false) },
  })

  const deleteConflictMut = useMutation({
    mutationFn: (id: string) => judgingApi.adminDeleteConflict(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-conflicts'] }),
  })

  const updateConflictMut = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: 'MENTORED' | 'RELATIVE' }) => judgingApi.adminUpdateConflict(id, reason),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-conflicts'] }); setEditingId(null) },
  })


  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Команд у лідерборді', val: leaderboard.length, icon: Trophy, cls: 'text-yellow-600' },
          { label: 'Конфлікти суддів',   val: conflicts.length,   icon: AlertTriangle, cls: 'text-red-500' },
          { label: 'Треки',              val: tracks.length,       icon: Star, cls: 'text-blue-500' },
          { label: 'Критеріїв',           val: criteria.length,     icon: Star, cls: 'text-purple-500' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
            <s.icon className={`h-6 w-6 ${s.cls} shrink-0`} />
            <div>
              <p className="text-2xl font-bold">{s.val}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 border-b border-border pb-1 overflow-x-auto no-scrollbar">
        {[
          { id: 'leaderboard', label: 'Лідерборд', icon: Trophy },
          { id: 'scores',      label: 'Оцінки',     icon: Star },
          { id: 'criteria',    label: 'Критерії',   icon: ClipboardList },
          { id: 'conflicts',   label: 'Конфлікти',  icon: AlertTriangle },
        ].map(t => (
          <button key={t.id} onClick={() => setSubTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold transition-all border-b-2 whitespace-nowrap ${subTab === t.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {subTab === 'leaderboard' && (
        !hackathonId ? (
          <div className="py-12 text-center text-muted-foreground">
            <Trophy className="h-10 w-10 mx-auto mb-3 opacity-20" />
            <p>Оберіть хакатон для перегляду лідерборду</p>
          </div>
        ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/20">
            <h3 className="font-bold flex items-center gap-2"><Trophy className="h-4 w-4 text-yellow-500" /> Лідерборд</h3>
            {lbLoading && <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground border-b border-border bg-muted/10">
                  <th className="px-4 py-2.5">#</th>
                  <th className="px-4 py-2.5">Команда</th>
                  <th className="px-4 py-2.5">Трек</th>
                  <th className="px-4 py-2.5 text-right">Бал</th>
                  <th className="px-4 py-2.5 text-right">Дії</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground text-sm">Немає даних</td></tr>
                ) : leaderboard.map((entry: any, i: number) => (
                  <tr key={entry.teamId} className="border-b border-border/50 hover:bg-muted/5 transition-colors">
                    <td className="px-4 py-3">
                      <span className={`font-bold text-sm ${i === 0 ? 'text-yellow-500' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-amber-600' : 'text-muted-foreground'}`}>
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold">{entry.teamName}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{entry.trackName || '—'}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-primary">{Number(entry.score || 0).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right">
                      {entry.projectId && (
                        <Link to={`/app/judge/score/${entry.projectId}`} className="text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-lg hover:bg-primary/20 font-bold transition-colors">
                          Статистика
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        )
      )}

      {subTab === 'scores' && (
        !hackathonId ? (
          <div className="py-12 text-center text-muted-foreground">
            <Star className="h-10 w-10 mx-auto mb-3 opacity-20" />
            <p>Оберіть хакатон для перегляду оцінок</p>
          </div>
        ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/20">
            <h3 className="font-bold flex items-center gap-2"><Star className="h-4 w-4 text-primary" /> Оцінки команд</h3>
            {lbLoading && <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground border-b border-border bg-muted/10">
                  <th className="px-4 py-2.5">Команда</th>
                  <th className="px-4 py-2.5">Трек</th>
                  <th className="px-4 py-2.5 text-right">Поточний бал</th>
                  <th className="px-4 py-2.5 text-right">Дії</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground text-sm">Немає команд</td></tr>
                ) : leaderboard.map((entry: any) => (
                  <tr key={entry.teamId} className="border-b border-border/50 hover:bg-muted/5 transition-colors">
                    <td className="px-4 py-3 font-semibold">{entry.teamName}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{entry.trackName || '—'}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-primary">{Number(entry.score || 0).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right">
                      {entry.projectId && (
                        <Link to={`/app/judge/score/${entry.projectId}`} className="text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-lg hover:bg-primary/20 font-bold transition-colors">
                          Статистика
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        )
      )}


      {subTab === 'conflicts' && (
        <div className="rounded-xl border border-border bg-card overflow-hidden space-y-0">
          {/* Header */}
          <div className="flex items-center gap-2 px-5 py-4 border-b border-border bg-muted/20">
            <ShieldAlert className="h-4 w-4 text-red-500" />
            <h3 className="font-bold">Конфлікти інтересів</h3>
            {confLoading && <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground ml-1" />}
            <span className="ml-1 text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">{conflicts.length}</span>
            <button
              onClick={() => setShowCreateForm(v => !v)}
              className="ml-auto flex items-center gap-1 text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-lg hover:bg-primary/90 font-semibold"
            >
              <Plus className="h-3 w-3" /> Додати конфлікт
            </button>
          </div>

          {/* Create form */}
          {showCreateForm && (
            <div className="p-4 border-b border-border bg-amber-50/50 dark:bg-amber-900/10 grid grid-cols-1 sm:grid-cols-4 gap-3">
              <select
                value={newConflict.judgeId}
                onChange={e => setNewConflict(p => ({ ...p, judgeId: e.target.value }))}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-primary"
              >
                <option value="">Оберіть суддю</option>
                {judges.map((j: any) => <option key={j.id} value={j.id}>{j.fullName}</option>)}
              </select>
              <select
                value={newConflict.teamId}
                onChange={e => setNewConflict(p => ({ ...p, teamId: e.target.value }))}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-primary"
              >
                <option value="">Оберіть команду</option>
                {allAdminTeams.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              <select
                value={newConflict.reason}
                onChange={e => setNewConflict(p => ({ ...p, reason: e.target.value as any }))}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-primary"
              >
                <option value="MENTORED">👨‍🏫 Ментор команди</option>
                <option value="RELATIVE">👥 Особисті стосунки</option>
              </select>
              <button
                onClick={() => createConflictMut.mutate()}
                disabled={!newConflict.judgeId || !newConflict.teamId || createConflictMut.isPending}
                className="rounded-lg bg-primary text-primary-foreground text-sm font-bold py-2 disabled:opacity-40 hover:bg-primary/90"
              >
                {createConflictMut.isPending ? '...' : 'Зберегти'}
              </button>
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground border-b border-border bg-muted/10">
                  <th className="px-4 py-2.5">Суддя</th>
                  <th className="px-4 py-2.5">Email</th>
                  <th className="px-4 py-2.5">Команда</th>
                  <th className="px-4 py-2.5">Причина</th>
                  <th className="px-4 py-2.5">Дата</th>
                  <th className="px-4 py-2.5"></th>
                </tr>
              </thead>
              <tbody>
                {confLoading ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center"><LoadingSpinner /></td></tr>
                ) : conflicts.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-10 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <ShieldAlert className="h-8 w-8 text-muted-foreground opacity-30" />
                      <p className="text-muted-foreground text-sm">Жодних конфліктів не зафіксовано</p>
                      {!hackathonId && <p className="text-xs text-muted-foreground">Оберіть хакатон для фільтрації або переглядайте всі</p>}
                    </div>
                  </td></tr>
                ) : conflicts.map((c: any) => (
                  <tr key={c.id} className="border-b border-border/50 hover:bg-muted/5 transition-colors group">
                    <td className="px-4 py-3 font-semibold text-sm">{c.judge?.fullName || '—'}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{c.judge?.email || '—'}</td>
                    <td className="px-4 py-3 text-sm">{c.team?.name || '—'}</td>
                    <td className="px-4 py-3">
                      {editingId === c.id ? (
                        <div className="flex items-center gap-1">
                          <select
                            value={editReason}
                            onChange={e => setEditReason(e.target.value as any)}
                            className="text-xs rounded border border-border bg-background px-2 py-1 focus:outline-none focus:border-primary"
                          >
                            <option value="MENTORED">👨‍🏫 Ментор</option>
                            <option value="RELATIVE">👥 Особисті</option>
                          </select>
                          <button onClick={() => updateConflictMut.mutate({ id: c.id, reason: editReason })}
                            className="p-1 rounded hover:bg-green-100 text-green-600">
                            <Check className="h-3 w-3" />
                          </button>
                          <button onClick={() => setEditingId(null)}
                            className="p-1 rounded hover:bg-muted">
                            <XIcon className="h-3 w-3 text-muted-foreground" />
                          </button>
                        </div>
                      ) : (
                        <span
                          className="text-xs cursor-pointer hover:underline"
                          onClick={() => { setEditingId(c.id); setEditReason(c.reason || 'MENTORED') }}
                          title="Клацніть для редагування"
                        >
                          {CONFLICT_REASON[c.reason] ?? c.reason ?? 'Не вказано'}
                          <Pencil className="inline ml-1 h-2.5 w-2.5 text-muted-foreground opacity-0 group-hover:opacity-100" />
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{fmtDate(new Date(c.createdAt))}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => { if (confirm('Видалити конфлікт?')) deleteConflictMut.mutate(c.id) }}
                        disabled={deleteConflictMut.isPending}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-all disabled:opacity-40"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {subTab === 'criteria' && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/20">
            <h3 className="font-bold flex items-center gap-2"><Star className="h-4 w-4 text-purple-500" /> Критерії оцінювання</h3>
            <div className="flex items-center gap-3">
              <select value={trackId} onChange={e => setTrackId(e.target.value)}
                className="text-sm rounded-lg border border-border bg-background px-3 py-1.5 focus:outline-none">
                <option value="">Оберіть трек</option>
                {tracks.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              {trackId && <button onClick={() => setShowCritForm(v => !v)}
                className="flex items-center gap-1 text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-lg hover:bg-primary/90">
                <Plus className="h-3 w-3" /> Додати
              </button>}
            </div>
          </div>

          {showCritForm && trackId && (
            <div className="p-4 border-b border-border bg-muted/10 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <input value={newCrit.name} onChange={e => setNewCrit(p => ({ ...p, name: e.target.value }))}
                placeholder="Назва критерію" className="col-span-2 sm:col-span-2 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-primary" />
              <input type="number" value={newCrit.maxScore} onChange={e => setNewCrit(p => ({ ...p, maxScore: Number(e.target.value) }))}
                placeholder="Макс. бал" className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-primary" />
              <input type="number" step="0.1" value={newCrit.weight} onChange={e => setNewCrit(p => ({ ...p, weight: Number(e.target.value) }))}
                placeholder="Вага" className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-primary" />
              <input value={newCrit.description} onChange={e => setNewCrit(p => ({ ...p, description: e.target.value }))}
                placeholder="Опис (необов'язково)" className="col-span-2 sm:col-span-3 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-primary" />
              <button onClick={() => createCritMut.mutate({ trackId, ...newCrit })} disabled={!newCrit.name || createCritMut.isPending}
                className="rounded-lg bg-primary text-primary-foreground text-sm font-bold py-2 disabled:opacity-40 hover:bg-primary/90">
                {createCritMut.isPending ? '...' : 'Зберегти'}
              </button>
            </div>
          )}

          {!trackId ? (
            <p className="px-5 py-8 text-center text-muted-foreground text-sm">Оберіть трек для перегляду критеріїв</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground border-b border-border bg-muted/10">
                  <th className="px-4 py-2.5">Назва</th>
                  <th className="px-4 py-2.5">Опис</th>
                  <th className="px-4 py-2.5 text-right">Макс. бал</th>
                  <th className="px-4 py-2.5 text-right">Вага</th>
                  <th className="px-4 py-2.5"></th>
                </tr>
              </thead>
              <tbody>
                {criteria.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Немає критеріїв</td></tr>
                ) : criteria.map((c: any) => (
                  <tr key={c.id} className="border-b border-border/50 hover:bg-muted/5">
                    <td className="px-4 py-3 font-semibold">{c.name}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{c.description || '—'}</td>
                    <td className="px-4 py-3 text-right font-mono">{c.maxScore}</td>
                    <td className="px-4 py-3 text-right font-mono">{c.weight}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => deleteCritMut.mutate(c.id)}
                        className="p-1.5 rounded hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Mentorship Tab ──────────────────────────────────────────────────────────
function MentorshipTab({ hackathonId }: { hackathonId: string }) {
  const [statusFilter, setStatusFilter] = useState('all')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-mentorship-requests'],
    queryFn: () => mentorshipApi.getAllRequests().then(r => r.data.data),
    refetchInterval: 15_000,
  })

  const all: any[] = (data || []).filter((r: any) => {
    const hack = r.availability?.hackathon?.id
    if (hackathonId && hack !== hackathonId) return false
    if (statusFilter !== 'all' && r.status !== statusFilter) return false
    return true
  })

  const counts = (data || []).reduce((acc: any, r: any) => {
    const hack = r.availability?.hackathon?.id
    if (!hackathonId || hack === hackathonId) acc[r.status] = (acc[r.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { key: 'all',       label: 'Всього',       cls: 'text-primary',       icon: Calendar },
          { key: 'pending',   label: 'Очікує',       cls: 'text-amber-600',     icon: Hourglass },
          { key: 'accepted',  label: 'Підтверджено', cls: 'text-blue-600',      icon: CheckCircle2 },
          { key: 'completed', label: 'Завершено',    cls: 'text-green-600',     icon: CheckCircle2 },
          { key: 'rejected',  label: 'Відхилено',    cls: 'text-red-500',       icon: XCircle },
        ].map(s => (
          <button key={s.key} onClick={() => setStatusFilter(s.key)}
            className={`rounded-xl border-2 p-3 text-left transition-all ${statusFilter === s.key ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/30'}`}>
            <s.icon className={`h-5 w-5 mb-1 ${s.cls} `} />
            <p className="text-xl font-bold">{s.key === 'all' ? (data || []).filter((r: any) => !hackathonId || r.availability?.hackathon?.id === hackathonId).length : (counts[s.key] || 0)}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/20">
          <h3 className="font-bold flex items-center gap-2"><Clock className="h-4 w-4 text-blue-500" /> Запити на менторство</h3>
          {isLoading && <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground border-b border-border bg-muted/10">
                <th className="px-4 py-2.5">Команда</th>
                <th className="px-4 py-2.5">Ментор</th>
                <th className="px-4 py-2.5">Трек</th>
                <th className="px-4 py-2.5">Хакатон</th>
                <th className="px-4 py-2.5">Час</th>
                <th className="px-4 py-2.5">Тривалість</th>
                <th className="px-4 py-2.5">Статус</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center"><LoadingSpinner /></td></tr>
              ) : all.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Немає запитів</td></tr>
              ) : all.map((r: any) => {
                const dt = new Date(r.startDatetime)
                const cfg = STATUS_CFG[r.status] || { label: r.status, cls: 'bg-muted text-muted-foreground' }
                return (
                  <tr key={r.id} className="border-b border-border/50 hover:bg-muted/5 transition-colors">
                    <td className="px-4 py-3 font-semibold">{r.team?.name || '—'}</td>
                    <td className="px-4 py-3">{r.availability?.mentor?.fullName || '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{r.availability?.track?.name || 'Всі'}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs truncate max-w-[130px]">{r.availability?.hackathon?.title || '—'}</td>
                    <td className="px-4 py-3 font-mono text-xs">{fmtDate(dt)} {fmtTime(dt)}</td>
                    <td className="px-4 py-3 text-xs">{r.durationMinute} хв</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${cfg.cls}`}>{cfg.label}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ─── Admin Dashboard ─────────────────────────────────────────────────────────
export function AdminDashboardPage() {
  const [tab, setTab] = useState('judging')
  const [hackathonId, setHackathonId] = useState('')

  const { data: hackathonsData } = useQuery({
    queryKey: ['hackathons-admin'],
    queryFn: () => hackathonsApi.list({ limit: 100 }).then(r => r.data.data),
  })
  const hackathons: any[] = hackathonsData || []

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader title="Адмін-панель" subtitle="Управління судівством та менторством" />
        <select value={hackathonId} onChange={e => setHackathonId(e.target.value)}
          className="rounded-lg border border-border bg-card px-4 py-2 text-sm shadow-sm min-w-[220px] focus:outline-none focus:border-primary">
          <option value="">🌐 Всі хакатони</option>
          {hackathons.map((h: any) => <option key={h.id} value={h.id}>{h.title}</option>)}
        </select>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-muted/30 p-1 border border-border w-fit">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${tab === t.id ? 'bg-card shadow-sm text-primary border border-border' : 'text-muted-foreground hover:text-foreground'}`}>
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'judging'    && <JudgingTab    hackathonId={hackathonId} />}
      {tab === 'mentorship' && <MentorshipTab hackathonId={hackathonId} />}
    </div>
  )
}
