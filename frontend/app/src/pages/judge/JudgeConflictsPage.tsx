import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, Info, ShieldAlert, X, GraduationCap, Users } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { judgingApi } from '@/api/judging'
import { teamsApi } from '@/api/teams'
import { formatDate } from '@/utils/format'
import { useI18n } from '@/i18n'

const DISMISS_KEY = 'conflict_info_dismissed'
const HACKATHON_KEY = 'judge_hackathon'

export function JudgeConflictsPage() {
  const queryClient = useQueryClient()
  const { t } = useI18n()
  const [teamId, setTeamId] = useState('')
  const [reason, setReason] = useState<'mentor' | 'personal' | ''>('')
  const [infoDismissed, setInfoDismissed] = useState(
    () => localStorage.getItem(DISMISS_KEY) === 'true'
  )
  const activeHackathonId = localStorage.getItem(HACKATHON_KEY) || ''

  const dismissInfo = () => {
    setInfoDismissed(true)
    localStorage.setItem(DISMISS_KEY, 'true')
  }

  // My conflicts
  const { data: myConflictsData, isLoading: conflictsLoading } = useQuery({
    queryKey: ['my-conflicts'],
    queryFn: () => judgingApi.getMyConflicts().then(res => res.data.data),
  })

  // My tracks → to filter relevant teams
  const { data: myTracksData } = useQuery({
    queryKey: ['my-tracks', activeHackathonId],
    queryFn: () => judgingApi.getMyTracks(activeHackathonId).then(res => res.data.data),
    enabled: !!activeHackathonId,
  })
  const trackIds: string[] = (myTracksData || []).map((t: any) => t.trackId)

  // Teams from judge's tracks
  const { data: teamsData } = useQuery({
    queryKey: ['judge-teams-for-conflict', activeHackathonId, trackIds.join(',')],
    queryFn: async () => {
      if (trackIds.length === 0) {
        return teamsApi.list({ limit: 200 }).then(r => r.data.data)
      }
      const results = await Promise.all(
        trackIds.map(tid =>
          teamsApi.list({ hackathon_id: activeHackathonId, track_id: tid, limit: 100 }).then(r => r.data.data)
        )
      )
      return results.flat()
    },
  })

  const conflicts: any[] = myConflictsData || []
  const allTeams: any[] = teamsData || []
  const conflictTeamIds = new Set(conflicts.map((c: any) => c.teamId))

  // Available teams = not yet in conflict
  const availableTeams = allTeams.filter((t: any) => !conflictTeamIds.has(t.id))
  const allReported = allTeams.length > 0 && availableTeams.length === 0

  const reportMut = useMutation({
    mutationFn: () => judgingApi.reportConflict({
      teamId,
      reason: reason === 'mentor' ? 'MENTORED' : 'RELATIVE',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-conflicts'] })
      setTeamId('')
      setReason('')
    },
    onError: (err: any) => alert(err.message || t.judge.errorReporting),
  })

  const getConflictReasonLabel = (code: string) => {
    if (code === 'MENTORED') return t.judge.mentoredReasonLabel
    if (code === 'RELATIVE') return t.judge.personalReasonLabel
    return code || t.judge.hasConflict
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      <PageHeader title={t.judge.conflictTitle} subtitle={t.judge.conflictSubtitle} />

      {/* Info card — collapsible, hidden after dismiss */}
      {!infoDismissed && (
        <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-5">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1 text-sm text-amber-800 dark:text-amber-200">
              <p className="font-semibold mb-1">{t.judge.whatIsConflict}</p>
              <p>{t.judge.conflictInfoDesc}</p>
            </div>
            <button
              onClick={dismissInfo}
              className="shrink-0 text-amber-600 hover:text-amber-900 transition-colors p-1 rounded"
              title={t.actions.close}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-3 ml-8">
            <button
              onClick={dismissInfo}
              className="text-xs text-amber-700 underline hover:text-amber-900 transition-colors"
            >
              {t.judge.dismissInfo}
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Report form */}
        <div className="space-y-5">
          <div className="rounded-xl border border-border bg-card shadow-sm p-6 space-y-5">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <h3 className="text-lg font-semibold">{t.judge.reportConflictBtn}</h3>
            </div>

            {allReported ? (
              <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-sm text-green-800">
                {t.judge.reportedAllConflicts}
              </div>
            ) : (
              <div className="space-y-5">
                {/* Team select */}
                <div>
                  <label className="block text-sm font-medium mb-2">{t.judge.selectTeam}</label>
                  <select
                    value={teamId}
                    onChange={e => setTeamId(e.target.value)}
                    className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none"
                  >
                    <option value="">{t.judge.notSelected}</option>
                    {availableTeams.map((t: any) => (
                      <option key={t.id} value={t.id}>
                        {t.name}{t.hackathon?.title ? ` (${t.hackathon.title})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Reason — large radio cards */}
                <div>
                  <label className="block text-sm font-medium mb-3">{t.judge.conflictType}</label>
                  <div className="grid grid-cols-2 gap-3">
                    {/* Mentor card */}
                    <button
                      type="button"
                      onClick={() => setReason('mentor')}
                      className={`flex flex-col items-center text-center gap-2 rounded-xl border-2 p-4 transition-all ${
                        reason === 'mentor'
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/40 hover:bg-muted/30'
                      }`}
                    >
                      <GraduationCap className={`h-8 w-8 ${reason === 'mentor' ? 'text-primary' : 'text-muted-foreground'}`} />
                      <div>
                        <p className="font-semibold text-sm">{t.judge.mentorReason}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{t.judge.mentorReasonDesc}</p>
                      </div>
                    </button>

                    {/* Personal card */}
                    <button
                      type="button"
                      onClick={() => setReason('personal')}
                      className={`flex flex-col items-center text-center gap-2 rounded-xl border-2 p-4 transition-all ${
                        reason === 'personal'
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/40 hover:bg-muted/30'
                      }`}
                    >
                      <Users className={`h-8 w-8 ${reason === 'personal' ? 'text-primary' : 'text-muted-foreground'}`} />
                      <div>
                        <p className="font-semibold text-sm">{t.judge.personalReason}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{t.judge.personalReasonDesc}</p>
                      </div>
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => reportMut.mutate()}
                  disabled={!teamId || !reason || reportMut.isPending}
                  className="w-full rounded-md bg-destructive px-4 py-2.5 text-sm font-semibold text-white hover:bg-destructive/90 disabled:opacity-50 transition-colors"
                >
                  {reportMut.isPending ? t.judge.processing : t.judge.reportConflictBtn}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Conflicts list */}
        <div className="rounded-xl border border-border bg-card shadow-sm p-6">
          <div className="flex items-center gap-2 border-b border-border pb-3 mb-5">
            <ShieldAlert className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold">{t.judge.myConflicts}</h3>
            {conflicts.length > 0 && (
              <span className="ml-auto text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-medium">
                {conflicts.length}
              </span>
            )}
          </div>

          {conflictsLoading ? (
            <div className="py-8"><LoadingSpinner /></div>
          ) : conflicts.length === 0 ? (
            <EmptyState title={t.judge.noConflicts} description={t.judge.noConflictsDesc} />
          ) : (
            <div className="space-y-3">
              {conflicts.map((c: any) => {
                const team = allTeams.find((t: any) => t.id === c.teamId)
                return (
                  <div key={c.id} className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                        <p className="font-semibold text-sm">{t.judge.teamLabel}{team?.name || c.teamId}</p>
                      </div>
                      <span className="shrink-0 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
                        {getConflictReasonLabel(c.reason)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground ml-6">
                      {t.judge.recordedAt} {formatDate(c.createdAt)}
                    </p>
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
