import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, Users, Trophy, Send, Clock, CheckCircle, XCircle } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { teamsApi } from '@/api/teams'
import { useAuthStore } from '@/store/auth.store'
import type { Team } from '@/types/api.types'
import { useI18n } from '@/i18n'

export function MatchmakingPage() {
  const { user } = useAuthStore()
  const { t } = useI18n()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [expandedRequest, setExpandedRequest] = useState<string | null>(null)
  const [requestMessages, setRequestMessages] = useState<Record<string, string>>({})
  const [sentRequests, setSentRequests] = useState<Record<string, 'sending' | 'sent' | 'error'>>({})

  // Fetch all published teams with open spots
  const { data, isLoading } = useQuery({
    queryKey: ['matchmaking-teams', search],
    queryFn: () =>
      teamsApi.list({ limit: 50, search: search || undefined }),
  })

  const allTeams: Team[] = data?.data?.data || []

  // Show teams that have space (max_team_size not reached)
  const teams = allTeams.filter((t: any) => {
    const memberCount = t._count?.members ?? t.members?.length ?? 0
    return memberCount < (t.hackathon?.maxTeamSize ?? 999)
  })

  const sendRequestMut = useMutation({
    mutationFn: ({ teamId, message }: { teamId: string; message?: string }) =>
      teamsApi.sendJoinRequest(teamId, message),
    onSuccess: (_, { teamId }) => {
      setSentRequests((prev) => ({ ...prev, [teamId]: 'sent' }))
      setExpandedRequest(null)
      queryClient.invalidateQueries({ queryKey: ['matchmaking-teams'] })
    },
    onError: (err: any, { teamId }) => {
      const msg: string = err?.message || err?.error || ''
      const isAlreadySent = msg.includes('вже подали') || msg.includes('already')
      const isAlreadyMember = msg.includes('вже є учасником') || msg.includes('вже є в') || msg.includes('member')
      if (isAlreadySent || isAlreadyMember) {
        setSentRequests((prev) => ({ ...prev, [teamId]: 'sent' }))
        setExpandedRequest(null)
      } else {
        setSentRequests((prev) => ({ ...prev, [teamId]: 'error' }))
      }
    },
  })

  const handleSend = (teamId: string) => {
    sendRequestMut.mutate({ teamId, message: requestMessages[teamId] })
  }

  if (isLoading) {
    return <div className="py-24"><LoadingSpinner /></div>
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={t.matchmaking.searchTeamTitle}
        subtitle={t.matchmaking.searchTeamSubtitle}
      />

      {/* Search */}
      <div className="relative w-full sm:w-80">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder={t.matchmaking.searchTeamPlaceholder}
          className="h-10 w-full rounded-md border border-border bg-background pl-9 pr-4 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {teams.length === 0 ? (
        <EmptyState
          title={t.matchmaking.noTeamsFound}
          description={t.matchmaking.noTeamsFoundDesc}
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((team: any) => {
            const memberCount = team._count?.members ?? 0
            const maxSize = team.hackathon?.maxTeamSize ?? 5
            const isFull = memberCount >= maxSize
            const requestStatus = sentRequests[team.id]
            const isExpanded = expandedRequest === team.id
            const approvalStatus = team.approvalStatus ?? team.approvals?.[0]?.status ?? 'PENDING'

            return (
              <div
                key={team.id}
                className="flex flex-col rounded-xl border border-border bg-card overflow-hidden hover:shadow-md transition-all"
              >
                {/* Card body */}
                <div className="p-5 flex-1 space-y-3">
                  {/* Team avatar + name */}
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl shrink-0">
                      {team.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold truncate">{team.name}</h3>
                      {team.track && (
                        <span className="text-xs text-muted-foreground">{team.track.name}</span>
                      )}
                    </div>
                  </div>

                  {/* Hackathon */}
                  {team.hackathon && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Trophy className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{team.hackathon.title}</span>
                    </div>
                  )}

                  {/* Members count */}
                  <div className="flex items-center gap-1.5 text-xs">
                    <Users className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className={isFull ? 'text-red-500 font-semibold' : 'text-muted-foreground'}>
                      {memberCount}/{maxSize} {t.homePage.participants} {isFull ? t.matchmaking.fullBadge : ''}
                    </span>
                  </div>

                  {/* Status */}
                  {approvalStatus === 'APPROVED' && (
                    <span className="inline-block px-2 py-0.5 rounded text-xs bg-green-100 text-green-700">✅ {t.matchmaking.teamApprovedBadge}</span>
                  )}
                </div>

                {/* Inline request form */}
                {isExpanded && (
                  <div className="px-5 pb-4 space-y-3 border-t border-border pt-4">
                    <label className="block text-sm font-medium">{t.matchmaking.messageToCaptain}</label>
                    <textarea
                      rows={2}
                      placeholder={t.matchmaking.aboutYourselfPlaceholder}
                      value={requestMessages[team.id] || ''}
                      onChange={(e) => setRequestMessages((prev) => ({ ...prev, [team.id]: e.target.value }))}
                      className="w-full rounded-md border border-border px-3 py-2 text-sm bg-background focus:border-primary focus:outline-none resize-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => setExpandedRequest(null)}
                        className="flex-1 rounded-md border border-border px-3 py-1.5 text-xs hover:bg-accent transition-colors"
                      >
                        {t.actions.cancel}
                      </button>
                      <button
                        onClick={() => handleSend(team.id)}
                        disabled={sendRequestMut.isPending}
                        className="flex-1 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-1"
                      >
                        {sendRequestMut.isPending ? <LoadingSpinner size="sm" /> : <><Send className="h-3 w-3" /> {t.actions.send}</>}
                      </button>
                    </div>
                  </div>
                )}

                {/* Action footer */}
                <div className="border-t border-border px-5 py-3">
                  {requestStatus === 'sent' ? (
                    <div className="flex items-center gap-1.5 text-sm text-green-600 font-medium justify-center">
                      <CheckCircle className="h-4 w-4" /> {t.matchmaking.requestSent}
                    </div>
                  ) : requestStatus === 'error' ? (
                    <div className="flex items-center gap-1.5 text-sm text-red-500 justify-center">
                      <XCircle className="h-4 w-4" /> {t.matchmaking.requestError}
                    </div>
                  ) : isFull ? (
                    <div className="text-center text-xs text-muted-foreground">{t.teamTab.joinErrorFull.split(' (')[0]}</div>
                  ) : !user ? (
                    <div className="text-center text-xs text-muted-foreground">{t.matchmaking.loginToApply}</div>
                  ) : !isExpanded ? (
                    <button
                      onClick={() => setExpandedRequest(team.id)}
                      className="w-full flex items-center justify-center gap-1.5 rounded-md bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                      <Send className="h-3.5 w-3.5" /> {t.matchmaking.applyBtn}
                    </button>
                  ) : null}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Info tip */}
      <div className="rounded-xl border border-border bg-muted/20 px-5 py-4 text-sm text-muted-foreground flex items-start gap-3">
        <Clock className="h-5 w-5 shrink-0 mt-0.5 text-primary/70" />
        <span>
          {t.matchmaking.matchmakingTip}
        </span>
      </div>
    </div>
  )
}
