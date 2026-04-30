import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { judgeTrackApi, type JudgeAssignment } from '@/api/judgeTrack'
import { usersApi } from '@/api/users'
import { hackathonsApi } from '@/api/hackathons'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { toast } from 'sonner'
import { useState } from 'react'
import { UserPlus, Crown } from 'lucide-react'
import type { Track, UserProfile } from '@/types/api.types'
import { clsx } from 'clsx'

interface JudgeTrackManagerProps {
  hackathonId: string
}

export function JudgeTrackManager({ hackathonId }: JudgeTrackManagerProps) {
  const qc = useQueryClient()
  const [selectedUserId, setSelectedUserId] = useState('')
  const [selectedTrackId, setSelectedTrackId] = useState('')
  const [showAssignForm, setShowAssignForm] = useState(false)

  const { data: assignmentsData, isLoading } = useQuery({
    queryKey: ['judgeAssignments', hackathonId],
    queryFn: () => judgeTrackApi.list(hackathonId),
  })

  const { data: tracksData } = useQuery({
    queryKey: ['tracks', hackathonId],
    queryFn: () => hackathonsApi.listTracks(hackathonId),
  })

  const { data: usersData } = useQuery({
    queryKey: ['users', 'all'],
    queryFn: () => usersApi.list({ limit: 100 }),
  })

  const assignments: JudgeAssignment[] = (assignmentsData?.data.data as JudgeAssignment[]) ?? []
  const tracks: Track[] = tracksData?.data.data ?? []
  const users: UserProfile[] = (usersData?.data.data ?? []) as UserProfile[]

  // Build set of unique judges
  const judgeIds = [...new Set(assignments.map((a) => a.userId))]
  const judges = judgeIds.map((uid) => {
    const found = assignments.find((a) => a.userId === uid)
    return found?.user ?? users.find((u) => u.id === uid)
  }).filter(Boolean)


  const getAssignment = (userId: string, trackId: string) =>
    assignments.find((a) => a.userId === userId && a.trackId === trackId)

  const assignMut = useMutation({
    mutationFn: (data: { userId: string; trackId: string; isHeadJudge?: boolean }) =>
      judgeTrackApi.assign(data),
    onSuccess: () => {
      toast.success('Суддю призначено')
      qc.invalidateQueries({ queryKey: ['judgeAssignments', hackathonId] })
    },
    onError: () => toast.error('Помилка при призначенні'),
  })

  const removeMut = useMutation({
    mutationFn: (id: string) => judgeTrackApi.remove(id),
    onSuccess: () => {
      toast.success('Суддю знято')
      qc.invalidateQueries({ queryKey: ['judgeAssignments', hackathonId] })
    },
    onError: () => toast.error('Помилка при знятті'),
  })

  const toggleMut = useMutation({
    mutationFn: ({ id, isHeadJudge }: { id: string; isHeadJudge: boolean }) =>
      judgeTrackApi.update(id, { isHeadJudge }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['judgeAssignments', hackathonId] }),
  })

  const handleCellClick = (userId: string, trackId: string) => {
    const existing = getAssignment(userId, trackId)
    if (existing) {
      removeMut.mutate(existing.id)
    } else {
      assignMut.mutate({ userId, trackId })
    }
  }

  if (isLoading) return <LoadingSpinner className="py-8" />

  return (
    <div className="space-y-4">
      {/* Matrix table */}
      {tracks.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">Спочатку додайте треки до хакатону.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Суддя</th>
                {tracks.map((t) => (
                  <th key={t.id} className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">
                    {t.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {judges.length === 0 ? (
                <tr>
                  <td colSpan={tracks.length + 1} className="px-4 py-6 text-center text-sm text-muted-foreground">
                    Суддів ще не призначено
                  </td>
                </tr>
              ) : (
                (judges as (JudgeAssignment['user'] | UserProfile)[]).map((judge) => {
                  if (!judge) return null
                  const j = judge as { id: string; fullName: string; email: string }
                  return (
                    <tr key={j.id} className="bg-card hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium">{j.fullName}</p>
                        <p className="text-xs text-muted-foreground">{j.email}</p>
                      </td>
                      {tracks.map((track) => {
                        const assignment = getAssignment(j.id, track.id)
                        const assigned = !!assignment
                        return (
                          <td key={track.id} className="px-4 py-3 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <button
                                onClick={() => handleCellClick(j.id, track.id)}
                                className={clsx(
                                  'h-7 w-7 rounded-md border-2 transition-all',
                                  assigned
                                    ? 'border-primary bg-primary text-white'
                                    : 'border-border bg-background hover:border-primary/50',
                                )}
                              >
                                {assigned && <span className="text-xs">✓</span>}
                              </button>
                              {assigned && assignment && (
                                <button
                                  title="Head Judge"
                                  onClick={() => toggleMut.mutate({ id: assignment.id, isHeadJudge: !assignment.isHeadJudge })}
                                  className={clsx(
                                    'flex h-5 items-center gap-0.5 rounded px-1 text-[10px] transition-colors',
                                    assignment.isHeadJudge
                                      ? 'bg-amber-100 text-amber-700'
                                      : 'text-muted-foreground hover:text-amber-600',
                                  )}
                                >
                                  <Crown className="h-3 w-3" />
                                  {assignment.isHeadJudge ? 'Head' : ''}
                                </button>
                              )}
                            </div>
                          </td>
                        )
                      })}
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Assign new judge */}
      {showAssignForm ? (
        <div className="flex flex-wrap gap-2 rounded-lg border border-primary/30 bg-primary/5 p-3">
          <select value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring">
            <option value="">Оберіть користувача…</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.fullName} ({u.email})</option>)}
          </select>
          <select value={selectedTrackId} onChange={(e) => setSelectedTrackId(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring">
            <option value="">Оберіть трек…</option>
            {tracks.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <button
            onClick={() => { assignMut.mutate({ userId: selectedUserId, trackId: selectedTrackId }); setShowAssignForm(false) }}
            disabled={!selectedUserId || !selectedTrackId}
            className="rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
            Призначити
          </button>
          <button onClick={() => setShowAssignForm(false)}
            className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-accent">
            Скасувати
          </button>
        </div>
      ) : (
        <button onClick={() => setShowAssignForm(true)}
          className="flex items-center gap-2 rounded-lg border border-dashed border-border px-4 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
          <UserPlus className="h-4 w-4" /> Призначити суддю
        </button>
      )}
    </div>
  )
}
