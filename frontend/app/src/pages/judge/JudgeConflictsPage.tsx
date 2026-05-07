import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, Info, ShieldAlert } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { judgingApi } from '@/api/judging'
import { teamsApi } from '@/api/teams'
import { formatDate } from '@/utils/format'

export function JudgeConflictsPage() {
  const queryClient = useQueryClient()
  const [teamId, setTeamId] = useState('')
  const [reason, setReason] = useState('')

  // Fetch my conflicts
  const { data: myConflictsData, isLoading: conflictsLoading } = useQuery({
    queryKey: ['my-conflicts'],
    queryFn: () => judgingApi.getMyConflicts().then(res => res.data.data)
  })

  // To provide a dropdown of teams, we could fetch teams. 
  // For simplicity across hackathons, we'll fetch a list of recent teams or let the user search.
  // We'll just fetch all teams (limit 200) for now.
  const { data: teamsData } = useQuery({
    queryKey: ['all-teams-for-conflict'],
    queryFn: () => teamsApi.list({ limit: 200 }).then(res => res.data.data)
  })

  const conflicts = myConflictsData || []
  const teams = teamsData || []

  const reportMut = useMutation({
    mutationFn: () => judgingApi.reportConflict({ teamId, reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-conflicts'] })
      setTeamId('')
      setReason('')
      alert('Конфлікт успішно задекларовано.')
    },
    onError: (err: any) => alert(err.message || 'Помилка при декларуванні')
  })

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      <PageHeader title="Конфлікт інтересів" subtitle="Управління конфліктами інтересів з командами" />

      <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900 p-4 flex gap-3 text-amber-800 dark:text-amber-200">
        <Info className="h-5 w-5 shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-semibold mb-1">Політика доброчесності</p>
          <p>Якщо ви були ментором команди, маєте родинні, особисті або тісні професійні зв'язки з її учасниками — ви зобов'язані повідомити про конфлікт інтересів. Після цього ви не зможете оцінювати цю команду, а ваші оцінки не будуть враховуватись у загальному рейтингу.</p>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Left: Report Form */}
        <div className="rounded-xl border border-border bg-card shadow-sm p-6 space-y-4 h-fit">
          <div className="flex items-center gap-2 mb-4 border-b border-border pb-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <h3 className="text-lg font-semibold">Задекларувати конфлікт</h3>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Оберіть команду</label>
              <select 
                value={teamId}
                onChange={e => setTeamId(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="">Не обрано</option>
                {teams.map((t: any) => (
                  <option key={t.id} value={t.id}>{t.name} {t.hackathon?.title ? `(${t.hackathon.title})` : ''}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Тип зв'язку (причина)</label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm">
                  <input type="radio" name="reason" value="Менторство" checked={reason === 'Менторство'} onChange={e => setReason(e.target.value)} className="text-primary focus:ring-primary" />
                  Я був(ла) ментором цієї команди
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="radio" name="reason" value="Особисті зв'язки" checked={reason === "Особисті зв'язки"} onChange={e => setReason(e.target.value)} className="text-primary focus:ring-primary" />
                  Маю особисті стосунки з учасниками
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="radio" name="reason" value="Професійні зв'язки" checked={reason === "Професійні зв'язки"} onChange={e => setReason(e.target.value)} className="text-primary focus:ring-primary" />
                  Спільне місце роботи / Колеги
                </label>
              </div>
            </div>

            <button 
              onClick={() => reportMut.mutate()}
              disabled={!teamId || !reason || reportMut.isPending}
              className="w-full mt-4 rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50 transition-colors"
            >
              {reportMut.isPending ? 'Обробка...' : 'Підтвердити наявність конфлікту'}
            </button>
          </div>
        </div>

        {/* Right: List of Conflicts */}
        <div className="rounded-xl border border-border bg-card shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4 border-b border-border pb-2">
            <ShieldAlert className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold">Ваші активні конфлікти</h3>
          </div>

          {conflictsLoading ? (
            <div className="py-8"><LoadingSpinner /></div>
          ) : conflicts.length === 0 ? (
            <EmptyState title="Конфліктів не знайдено" description="Ви можете оцінювати всі команди у ваших треках" />
          ) : (
            <div className="space-y-3">
              {conflicts.map((c: any) => {
                const team = teams.find((t: any) => t.id === c.teamId)
                return (
                  <div key={c.id} className="p-3 rounded-lg border border-border bg-muted/20 flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-sm">{team?.name || 'Невідома команда'}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Повідомлено: {formatDate(c.createdAt)}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
                      {c.reason}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
