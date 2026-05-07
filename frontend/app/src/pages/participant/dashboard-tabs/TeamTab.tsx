import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query'
import { Users, UserPlus, Link as LinkIcon, LogOut, Copy, Trash2 } from 'lucide-react'
import api from '@/api/client'
import { teamsApi } from '@/api/teams'
import { useAuthStore } from '@/store/auth.store'
import { Avatar } from '@/components/shared/Avatar'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { formatDate } from '@/utils/format'
import type { Hackathon, Team, TeamMember } from '@/types/api.types'

interface TeamTabProps {
  hackathon: Hackathon
  myTeam?: Team
  stageInfo: ReturnType<typeof import('@/hooks/useHackathonStage').useHackathonStage>
}

export function TeamTab({ hackathon, myTeam, stageInfo }: TeamTabProps) {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [inviteToken, setInviteToken] = useState('')
  const [inviteError, setInviteError] = useState('')
  const [copied, setCopied] = useState(false)

  const { data: membersData } = useQuery({
    queryKey: ['team-members', myTeam?.id],
    queryFn: () => api.get<{ data: TeamMember[] }>(`/teams/${myTeam?.id}/members`).then((res: any) => res.data),
    enabled: !!myTeam?.id,
  })

  // We mock api here because we didn't add it to teamsApi for members specifically, wait, I can just use client.
  // Let me import api from client.
  
  const members = membersData?.data || []
  const myMemberInfo = members.find((m: any) => m.userId === user?.id)
  const isCaptain = myMemberInfo?.role === 'captain'

  const { register, handleSubmit } = useForm()

  const createMut = useMutation({
    mutationFn: (data: any) => teamsApi.create({ ...data, hackathonId: hackathon.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-team'] })
    }
  })

  const joinMut = useMutation({
    mutationFn: (token: string) => teamsApi.join(token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-team'] })
    },
    onError: (err: any) => setInviteError(err.message || 'Помилка приєднання')
  })

  const generateInviteMut = useMutation({
    mutationFn: () => teamsApi.createInvite(myTeam!.id, 10, 24),
    onSuccess: (res) => {
      const token = res.data.data.token
      navigator.clipboard.writeText(token)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  })

  const removeMemberMut = useMutation({
    mutationFn: (userId: string) => teamsApi.removeMember(myTeam!.id, userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['team-members'] })
  })

  if (!myTeam) {
    return (
      <div className="grid gap-8 md:grid-cols-2 mt-6">
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-6">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" /> Створити команду
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Зберіть свою команду для участі в хакатоні
            </p>
          </div>
          
          <form onSubmit={handleSubmit((d) => createMut.mutate(d))} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Назва команди</label>
              <input {...register('name', { required: true })} className="w-full rounded-md border border-border px-3 py-2 text-sm bg-background" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Опис</label>
              <textarea {...register('description')} className="w-full rounded-md border border-border px-3 py-2 text-sm bg-background resize-none" rows={3} />
            </div>
            {hackathon.tracks && hackathon.tracks.length > 0 && (
              <div>
                <label className="block text-sm font-medium mb-1">Напрямок (Track)</label>
                <select {...register('trackId')} className="w-full rounded-md border border-border px-3 py-2 text-sm bg-background">
                  <option value="">Не обрано</option>
                  {hackathon.tracks.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            )}
            <button 
              type="submit" 
              disabled={createMut.isPending || !stageInfo.canRegister}
              className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {createMut.isPending ? <LoadingSpinner size="sm" /> : 'Створити'}
            </button>
            {!stageInfo.canRegister && <p className="text-xs text-destructive text-center">Реєстрація наразі недоступна</p>}
          </form>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-6 h-fit">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <LinkIcon className="h-5 w-5 text-primary" /> Приєднатись за посиланням
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Введіть токен із запрошення від капітана
            </p>
          </div>
          
          <div className="space-y-4">
            <div>
              <input 
                type="text" 
                placeholder="Введіть токен..." 
                value={inviteToken}
                onChange={e => setInviteToken(e.target.value)}
                className="w-full rounded-md border border-border px-3 py-2 text-sm bg-background" 
              />
              {inviteError && <p className="text-xs text-destructive mt-1">{inviteError}</p>}
            </div>
            <button 
              onClick={() => joinMut.mutate(inviteToken)}
              disabled={!inviteToken || joinMut.isPending || !stageInfo.canRegister}
              className="w-full rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/80 disabled:opacity-50"
            >
              {joinMut.isPending ? <LoadingSpinner size="sm" /> : 'Приєднатись'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-8 lg:grid-cols-3 mt-6">
      <div className="lg:col-span-2 space-y-6">
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl">
              {myTeam.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-bold">{myTeam.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-2 py-0.5 text-xs font-medium rounded-md ${
                  myTeam.approvalStatus === 'APPROVED' ? 'bg-green-100 text-green-700' :
                  myTeam.approvalStatus === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {myTeam.approvalStatus === 'APPROVED' ? 'Схвалено' :
                  myTeam.approvalStatus === 'PENDING' ? 'Очікує' : 'Відхилено'}
                </span>
                {myTeam.track && (
                  <span className="text-xs text-muted-foreground bg-accent px-2 py-0.5 rounded-md">
                    {myTeam.track.name}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="border-b border-border bg-muted/20 px-6 py-4 flex justify-between items-center">
            <h3 className="font-semibold">Учасники команди ({members.length}/{hackathon.maxTeamSize})</h3>
          </div>
          <div className="divide-y divide-border">
            {members.map((member: any) => (
              <div key={member.id} className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-3">
                  <Avatar name={member.user?.fullName || 'User'} url={member.user?.avatarUrl} />
                  <div>
                    <p className="font-medium text-sm">
                      {member.user?.fullName} 
                      {member.userId === user?.id && <span className="text-muted-foreground ml-1">(Ви)</span>}
                    </p>
                    <p className="text-xs text-muted-foreground">Приєднався: {formatDate(member.joinedAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {member.role === 'captain' && (
                    <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded-md">
                      Капітан
                    </span>
                  )}
                  {isCaptain && member.userId !== user?.id && (
                    <button 
                      onClick={() => {
                        if (confirm('Видалити учасника?')) removeMemberMut.mutate(member.userId)
                      }}
                      className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                      title="Видалити"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {stageInfo.canRegister && (
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" /> Запросити учасників
            </h3>
            <p className="text-sm text-muted-foreground">
              Згенеруйте токен запрошення для нових учасників
            </p>
            <button
              onClick={() => generateInviteMut.mutate()}
              disabled={generateInviteMut.isPending}
              className="w-full rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/80 flex items-center justify-center gap-2"
            >
              <Copy className="h-4 w-4" />
              {copied ? 'Скопійовано!' : 'Згенерувати та скопіювати'}
            </button>
          </div>
        )}

        {!isCaptain && (
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <button className="w-full rounded-md border border-destructive/20 bg-destructive/5 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 flex items-center justify-center gap-2 transition-colors">
              <LogOut className="h-4 w-4" />
              Покинути команду
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
