import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query'
import {
  Users, UserPlus, Link as LinkIcon, LogOut, Copy, CheckCheck,
  Crown, Trash2, RefreshCw, AlertTriangle, Plus, AlertCircle, Info,
} from 'lucide-react'
import { teamsApi, extractToken } from '@/api/teams'
import type { TeamMember, JoinRequest } from '@/api/teams'
import { useAuthStore } from '@/store/auth.store'
import { Avatar } from '@/components/shared/Avatar'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import type { Hackathon, Team } from '@/types/api.types'
import { useI18n } from '@/i18n'

interface TeamTabProps {
  hackathon: Hackathon
  myTeam?: Team
  stageInfo: ReturnType<typeof import('@/hooks/useHackathonStage').useHackathonStage>
}

// ─── State 1: No team ────────────────────────────────────────────────────────

function NoTeamState({
  hackathon,
  stageInfo,
  onCreated,
}: {
  hackathon: Hackathon
  stageInfo: TeamTabProps['stageInfo']
  onCreated: () => void
}) {
  const [mode, setMode] = useState<'none' | 'create' | 'join'>('none')
  const [joinInput, setJoinInput] = useState('')
  const [joinError, setJoinError] = useState('')
  const { t } = useI18n()
  const { register, handleSubmit, reset, formState: { errors } } = useForm<{
    name: string
    description?: string
    trackId?: string
  }>()
  const queryClient = useQueryClient()

  const createMut = useMutation({
    mutationFn: (data: { name: string; description?: string; trackId?: string }) =>
      teamsApi.create({ ...data, hackathonId: hackathon.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-team'] })
      onCreated()
    },
  })

  const joinMut = useMutation({
    mutationFn: (token: string) => teamsApi.join(token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-team'] })
      onCreated()
    },
    onError: (err: any) => {
      const msg = err?.message || err?.error || t.teamTab.joinErrorGeneric
      if (msg.includes('недійсний') || msg.includes('invalid') || msg.includes('expired')) {
        setJoinError(t.teamTab.joinErrorInvalid)
      } else if (msg.includes('вже є') || msg.includes('already')) {
        setJoinError(t.teamTab.joinErrorAlready)
      } else if (msg.includes('заповнена') || msg.includes('maximum')) {
        setJoinError(t.teamTab.joinErrorFull)
      } else {
        setJoinError(msg || t.states.error)
      }
    },
  })

  const tracks = (hackathon as any).tracks || []

  return (
    <div className="mt-6 space-y-6">
      {/* Cards row */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Create card */}
        <div
          className={`rounded-xl border bg-card p-6 shadow-sm space-y-4 transition-all ${
            mode === 'create' ? 'border-primary ring-1 ring-primary/30' : 'border-border'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Plus className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">{t.teamTab.createTeam}</h3>
              <p className="text-xs text-muted-foreground">{t.actions.invite}</p>
            </div>
          </div>
          {mode !== 'create' && (
            <button
              onClick={() => { setMode('create'); reset() }}
              disabled={!stageInfo.canRegister}
              className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {t.actions.create}
            </button>
          )}
          {mode === 'create' && (
            <form
              onSubmit={handleSubmit((d) => createMut.mutate(d))}
              className="space-y-4 pt-2 border-t border-border"
            >
              <div>
                <label className="block text-sm font-medium mb-1">{t.teamTab.teamName} *</label>
                <input
                  {...register('name', { required: t.teamTab.nameRequired, minLength: { value: 2, message: t.settingsTab.min2Chars } })}
                  placeholder={t.teamTab.enterNamePlaceholder}
                  className="w-full rounded-md border border-border px-3 py-2 text-sm bg-background focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
                {errors.name && <p className="text-xs text-destructive mt-1">{errors.name.message}</p>}
              </div>
              {tracks.length > 0 && (
                <div>
                  <label className="block text-sm font-medium mb-1">{t.teamTab.track} *</label>
                  <select
                    {...register('trackId')}
                    className="w-full rounded-md border border-border px-3 py-2 text-sm bg-background focus:border-primary focus:outline-none"
                  >
                    <option value="">{t.actions.select} ▾</option>
                    {tracks.map((t: any) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground mt-1">{t.teamTab.trackChangeHint}</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-1">{t.projectTab.optionalDescLabel}</label>
                <textarea
                  {...register('description')}
                  rows={2}
                  placeholder={t.teamTab.teamDescriptionPlaceholder}
                  className="w-full rounded-md border border-border px-3 py-2 text-sm bg-background focus:border-primary focus:outline-none resize-none"
                />
              </div>
              {createMut.isError && (
                <p className="text-xs text-destructive">
                  {(createMut.error as any)?.message || t.teamTab.createError}
                </p>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMode('none')}
                  className="flex-1 rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
                >
                  {t.actions.cancel}
                </button>
                <button
                  type="submit"
                  disabled={createMut.isPending}
                  className="flex-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                   {createMut.isPending ? <LoadingSpinner size="sm" /> : t.teamTab.createTeam}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Join card */}
        <div
          className={`rounded-xl border bg-card p-6 shadow-sm space-y-4 transition-all ${
            mode === 'join' ? 'border-primary ring-1 ring-primary/30' : 'border-border'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-secondary/50 flex items-center justify-center">
              <LinkIcon className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold">{t.teamTab.joinTeam}</h3>
              <p className="text-xs text-muted-foreground">{t.dashboard.shareLink}</p>
            </div>
          </div>
          {mode !== 'join' && (
            <button
              onClick={() => { setMode('join'); setJoinInput(''); setJoinError('') }}
              disabled={!stageInfo.canRegister}
              className="w-full rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-accent disabled:opacity-50 transition-colors"
            >
              {t.teamTab.joinTeam}
            </button>
          )}
          {mode === 'join' && (
            <div className="space-y-4 pt-2 border-t border-border">
              <div>
                <label className="block text-sm font-medium mb-1">{t.teamTab.insertLinkOrToken}</label>
                <input
                  type="text"
                  placeholder={t.teamTab.joinLinkPlaceholder}
                  value={joinInput}
                  onChange={(e) => { setJoinInput(e.target.value); setJoinError('') }}
                  className="w-full rounded-md border border-border px-3 py-2 text-sm bg-background focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <p className="text-xs text-muted-foreground mt-1">{t.teamTab.joinExample}</p>
                {joinError && <p className="text-xs text-destructive mt-1">{joinError}</p>}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMode('none')}
                  className="flex-1 rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
                >
                  {t.actions.cancel}
                </button>
                <button
                  onClick={() => joinMut.mutate(extractToken(joinInput))}
                  disabled={!joinInput.trim() || joinMut.isPending}
                  className="flex-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                   {joinMut.isPending ? <LoadingSpinner size="sm" /> : t.teamTab.joinTeam}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      {!stageInfo.canRegister && (
        <p className="text-sm text-muted-foreground text-center">{t.teamTab.registrationClosed}</p>
      )}
    </div>
  )
}

// ─── State 2/3: Has team ─────────────────────────────────────────────────────

function HasTeamState({
  hackathon,
  myTeam,
}: {
  hackathon: Hackathon
  myTeam: Team
}) {
  const { user } = useAuthStore()
  const { t } = useI18n()
  const queryClient = useQueryClient()
  const [copied, setCopied] = useState(false)
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null)
  const [confirmTransfer, setConfirmTransfer] = useState<string | null>(null)
  const [confirmLeave, setConfirmLeave] = useState(false)

  // Members
  const { data: membersData, isLoading: membersLoading } = useQuery({
    queryKey: ['team-members', myTeam.id],
    queryFn: () => teamsApi.getMembers(myTeam.id).then((r) => r.data.data),
  })
  const members: TeamMember[] = membersData || []
  const myMember = members.find((m) => m.user?.id === user?.id)
  const isCaptain = myMember?.role === 'captain'

  // Join requests (captain only)
  const { data: requestsData, refetch: refetchRequests } = useQuery({
    queryKey: ['join-requests', myTeam.id],
    queryFn: () => teamsApi.getJoinRequests(myTeam.id).then((r) => r.data.data),
    enabled: isCaptain,
    retry: false,
  })
  const joinRequests: JoinRequest[] = requestsData || []

  const respondMut = useMutation({
    mutationFn: ({ requestId, action }: { requestId: string; action: 'accepted' | 'rejected' }) =>
      teamsApi.respondToJoinRequest(requestId, action),
    onSuccess: () => {
      refetchRequests()
      queryClient.invalidateQueries({ queryKey: ['team-members', myTeam.id] })
    },
  })
  const { data: inviteData, refetch: refetchInvite } = useQuery({
    queryKey: ['team-invite', myTeam.id],
    queryFn: () => teamsApi.getActiveInvite(myTeam.id).then((r) => r.data.data),
    enabled: isCaptain,
    retry: false,
  })
  const invite = inviteData ?? null
  const inviteUrl = invite ? `${window.location.origin}/join/${invite.token}` : null

  const copyInvite = async () => {
    if (!inviteUrl) return
    await navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const newInviteMut = useMutation({
    mutationFn: () => teamsApi.createInvite(myTeam.id, 10, 24),
    onSuccess: () => refetchInvite(),
  })

  const removeMut = useMutation({
    mutationFn: (userId: string) => teamsApi.removeMember(myTeam.id, userId),
    onSuccess: () => {
      setConfirmRemove(null)
      queryClient.invalidateQueries({ queryKey: ['team-members', myTeam.id] })
    },
  })

  const transferMut = useMutation({
    mutationFn: (newCaptainId: string) => teamsApi.transferCaptain(myTeam.id, newCaptainId),
    onSuccess: () => {
      setConfirmTransfer(null)
      queryClient.invalidateQueries({ queryKey: ['team-members', myTeam.id] })
      queryClient.invalidateQueries({ queryKey: ['my-team'] })
    },
  })

  const leaveMut = useMutation({
    mutationFn: () => teamsApi.leaveTeam(myTeam.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-team'] })
    },
  })

  // Approval status + comment from team data
  const approvalStatus = (myTeam as any).approvals?.[0]?.status ?? (myTeam as any).approvalStatus ?? 'PENDING'
  const approvalComment = (myTeam as any).approvals?.[0]?.comment ?? null
  const approvalColor =
    approvalStatus === 'APPROVED' ? 'bg-green-100 text-green-700' :
    approvalStatus === 'REJECTED' ? 'bg-red-100 text-red-700' :
    approvalStatus === 'DISQUALIFIED' ? 'bg-orange-100 text-orange-700' :
    'bg-amber-100 text-amber-700'
  const approvalLabel =
    approvalStatus === 'APPROVED'      ? `✅ ${t.states.approved}` :
    approvalStatus === 'REJECTED'      ? `❌ ${t.states.rejected}` :
    approvalStatus === 'DISQUALIFIED'  ? `🚫 ${t.states.disqualified}` : `⏳ ${t.states.pending}`

  const track = (myTeam as any).track
  const maxSize = (hackathon as any).maxTeamSize || 5

  return (
    <div className="mt-6 space-y-6">
      {/* Team header */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl">
              {myTeam.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-bold">{myTeam.name}</h2>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className={`px-2 py-0.5 text-xs font-medium rounded-md ${approvalColor}`}>
                  {approvalLabel}
                </span>
                {track && (
                  <span className="text-xs text-muted-foreground bg-accent px-2 py-0.5 rounded-md">
                    {track.name}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Approval status banner (visible to team) ───────────────── */}
      {approvalStatus === 'PENDING' && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
          <Info className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">{t.teamTab.applicationPending}</p>
            <p className="text-xs text-amber-700 mt-0.5">
              {t.teamTab.applicationPendingDesc}
            </p>
          </div>
        </div>
      )}

      {approvalStatus === 'REJECTED' && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-5 py-4">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-800">{t.teamTab.applicationRejected}</p>
            {approvalComment
              ? <p className="text-xs text-red-700 mt-0.5">{t.resultsTab.reasonLabel} <span className="font-medium">{approvalComment}</span></p>
              : <p className="text-xs text-red-700 mt-0.5">{t.teamTab.applicationRejectedNoComment}</p>
            }
          </div>
        </div>
      )}

      {approvalStatus === 'DISQUALIFIED' && (
        <div className="flex items-start gap-3 rounded-xl border border-orange-200 bg-orange-50 px-5 py-4">
          <AlertCircle className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-orange-800">{t.teamTab.applicationDisqualified}</p>
            {approvalComment
              ? <p className="text-xs text-orange-700 mt-0.5">{t.resultsTab.reasonLabel} <span className="font-medium">{approvalComment}</span></p>
              : <p className="text-xs text-orange-700 mt-0.5">{t.teamTab.applicationDisqualifiedNoComment}</p>
            }
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="border-b border-border bg-muted/20 px-6 py-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            {t.teamTab.members}
            <span className={`ml-auto text-sm font-normal ${members.length >= maxSize ? 'text-red-500 font-semibold' : 'text-muted-foreground'}`}>
              {members.length}/{maxSize}
            </span>
          </h3>
        </div>

        {membersLoading ? (
          <div className="p-6"><LoadingSpinner /></div>
        ) : (
          <ul className="divide-y divide-border">
            {members.map((member) => {
              const isMe = member.user?.id === user?.id
              const isThisCaptain = member.role === 'captain'
              const memberName = member.user?.fullName || t.teamTab.member

              return (
                <li key={member.id} className="px-6 py-4">
                  {/* Confirm transfer row */}
                  {confirmTransfer === member.userId && (
                    <div className="mb-3 p-4 rounded-lg border border-amber-200 bg-amber-50 space-y-3">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-sm text-amber-900">{t.teamTab.transferCaptainTitle}</p>
                          <p className="text-sm text-amber-700 mt-1">
                            {t.teamTab.transferCaptainDesc.replace('{name}', memberName)}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setConfirmTransfer(null)}
                          className="flex-1 rounded-md border border-border px-3 py-1.5 text-sm hover:bg-accent transition-colors"
                        >
                          {t.actions.cancel}
                        </button>
                        <button
                          onClick={() => transferMut.mutate(member.userId)}
                          disabled={transferMut.isPending}
                          className="flex-1 rounded-md bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50 transition-colors"
                        >
                          {transferMut.isPending ? <LoadingSpinner size="sm" /> : t.teamTab.transferCaptainBtn}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Confirm remove row */}
                  {confirmRemove === member.userId && (
                    <div className="mb-3 p-3 rounded-lg border border-red-200 bg-red-50 flex items-center gap-3">
                      <p className="text-sm text-red-700 flex-1">
                        {t.teamTab.removeMemberConfirm.replace('{name}', memberName)}
                      </p>
                      <button
                        onClick={() => removeMut.mutate(member.userId)}
                        disabled={removeMut.isPending}
                        className="rounded-md bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                      >
                        {t.actions.yes}
                      </button>
                      <button
                        onClick={() => setConfirmRemove(null)}
                        className="rounded-md border border-border px-3 py-1 text-xs hover:bg-accent"
                      >
                        {t.actions.no}
                      </button>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <Avatar name={memberName} url={member.user?.avatarUrl} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {memberName}
                        {isMe && <span className="ml-1 text-xs text-muted-foreground">{t.teamTab.you}</span>}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {isThisCaptain ? `👑 ${t.teamTab.captain}` : t.teamTab.member}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Captain can: transfer captain to others, remove non-captains */}
                      {isCaptain && !isThisCaptain && (
                        <>
                          <button
                            onClick={() => setConfirmTransfer(confirmTransfer === member.userId ? null : member.userId)}
                            className="flex items-center gap-1 px-2 py-1 rounded-md border border-border text-xs hover:bg-accent transition-colors"
                            title={t.teamTab.promote}
                          >
                            <Crown className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">{t.teamTab.captain}</span>
                          </button>
                          <button
                            onClick={() => setConfirmRemove(confirmRemove === member.userId ? null : member.userId)}
                            className="p-1.5 rounded-md border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
                            title={t.teamTab.kick}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                      {/* Non-captain sees leave on own row */}
                      {!isCaptain && isMe && (
                        <button
                          onClick={() => setConfirmLeave(true)}
                          className="flex items-center gap-1 px-2 py-1 rounded-md border border-red-200 text-red-600 text-xs hover:bg-red-50 transition-colors"
                        >
                          <LogOut className="h-3.5 w-3.5" />
                          <span>{t.actions.leave}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* Leave confirm */}
      {confirmLeave && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 space-y-3">
          <p className="font-semibold text-red-800">{t.settingsTab.leaveTeamConfirm}</p>
          <p className="text-sm text-red-700">{t.teamTab.leaveTeamDesc}</p>
          <div className="flex gap-2">
            <button
              onClick={() => setConfirmLeave(false)}
              className="flex-1 rounded-md border border-border px-3 py-1.5 text-sm hover:bg-white transition-colors"
            >
              {t.actions.cancel}
            </button>
            <button
              onClick={() => leaveMut.mutate()}
              disabled={leaveMut.isPending}
              className="flex-1 rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
               {leaveMut.isPending ? <LoadingSpinner size="sm" /> : t.teamTab.leaveTeam}
            </button>
          </div>
        </div>
      )}

      {/* Join Requests panel — captain only */}
      {isCaptain && (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="border-b border-border bg-muted/20 px-6 py-4 flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">{t.teamTab.incomingRequests}</h3>
            {joinRequests.length > 0 && (
              <span className="ml-auto flex items-center justify-center h-5 w-5 rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {joinRequests.length}
              </span>
            )}
          </div>
          {joinRequests.length === 0 ? (
            <div className="px-6 py-5 text-sm text-muted-foreground text-center">
              {t.teamTab.noIncomingRequests}
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {joinRequests.map((req) => {
                const name = req.user?.fullName || t.teamTab.member
                return (
                  <li key={req.id} className="px-6 py-4 space-y-2">
                    <div className="flex items-center gap-3">
                      <Avatar name={name} url={req.user?.avatarUrl} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{name}</p>
                        <p className="text-xs text-muted-foreground truncate">{req.user?.email}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => respondMut.mutate({ requestId: req.id, action: 'rejected' })}
                          disabled={respondMut.isPending}
                          className="px-2.5 py-1 rounded-md border border-red-200 text-red-600 text-xs hover:bg-red-50 disabled:opacity-50 transition-colors"
                        >
                          {t.actions.reject}
                        </button>
                        <button
                          onClick={() => respondMut.mutate({ requestId: req.id, action: 'accepted' })}
                          disabled={respondMut.isPending}
                          className="px-2.5 py-1 rounded-md bg-green-600 text-white text-xs font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
                        >
                          {t.teamTab.accept} ✓
                        </button>
                      </div>
                    </div>
                    {req.message && (
                      <p className="text-xs text-muted-foreground bg-muted/30 rounded-md px-3 py-2 ml-9">
                        &ldquo;{req.message}&rdquo;
                      </p>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}

      {/* Invite section — captain only */}
      {isCaptain && (
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">{t.dashboard.inviteMember}</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            {t.teamTab.inviteLinkDesc}
          </p>

          {invite && inviteUrl ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex-1 rounded-md border border-border bg-muted/30 px-3 py-2 text-sm font-mono truncate text-muted-foreground">
                  {window.location.origin}/join/…{invite.token.slice(-12)}
                </div>
                <button
                  onClick={copyInvite}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-all ${
                    copied
                      ? 'bg-green-100 text-green-700 border border-green-200'
                      : 'border border-border hover:bg-accent'
                  }`}
                >
                  <>{copied ? <><CheckCheck className="h-4 w-4" /> {t.dashboard.linkCopied}</> : <><Copy className="h-4 w-4" /> {t.teamTab.copyInvite}</>}</>
                </button>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{t.teamTab.validUntil}: {new Date(invite.expiresAt).toLocaleString('uk-UA')}</span>
                <span>{t.teamTab.usedCount}: {invite.usesCount} / {invite.maxUses}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {t.teamTab.noActiveInvite}
            </p>
          )}

          <button
            onClick={() => {
              if (invite && !window.confirm(t.teamTab.inviteResetConfirm)) return
              newInviteMut.mutate()
            }}
            disabled={newInviteMut.isPending}
            className="flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-accent disabled:opacity-50 transition-colors"
          >
            {newInviteMut.isPending
              ? <LoadingSpinner size="sm" />
              : <><RefreshCw className="h-4 w-4" /> {t.teamTab.createInviteBtn}</>
            }
          </button>
        </div>
      )}

    </div>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function TeamTab({ hackathon, myTeam, stageInfo }: TeamTabProps) {
  const queryClient = useQueryClient()

  if (!myTeam) {
    return (
      <NoTeamState
        hackathon={hackathon}
        stageInfo={stageInfo}
        onCreated={() => queryClient.invalidateQueries({ queryKey: ['my-team'] })}
      />
    )
  }

  return <HasTeamState hackathon={hackathon} myTeam={myTeam} />
}
