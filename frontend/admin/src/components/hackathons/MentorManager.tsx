import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { mentorTrackApi } from '@/api/mentorTrack'
import { usersApi } from '@/api/users'
import { hackathonsApi } from '@/api/hackathons'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { toast } from 'sonner'
import { useState } from 'react'
import { UserPlus, Trash2 } from 'lucide-react'
import type { Track, UserProfile } from '@/types/api.types'
import { clsx } from 'clsx'

interface MentorAssignment {
  id: string
  userId: string
  trackId: string
  user?: UserProfile
}

interface MentorManagerProps {
  hackathonId: string
}

export function MentorManager({ hackathonId }: MentorManagerProps) {
  const qc = useQueryClient()
  const [selectedUserId, setSelectedUserId] = useState('')
  const [selectedTrackId, setSelectedTrackId] = useState('')
  const [showAssignForm, setShowAssignForm] = useState(false)

  const { data: assignmentsData, isLoading } = useQuery({
    queryKey: ['mentorAssignments', hackathonId],
    queryFn: () => mentorTrackApi.listAssignments(hackathonId),
  })

  const { data: tracksData } = useQuery({
    queryKey: ['tracks', hackathonId],
    queryFn: () => hackathonsApi.listTracks(hackathonId),
  })

  const { data: usersData } = useQuery({
    queryKey: ['users', 'mentors'],
    queryFn: () => usersApi.list({ limit: 100, role: 'mentor' }),
  })

  const assignments: MentorAssignment[] = (assignmentsData?.data?.data as MentorAssignment[]) ?? []
  const tracks: Track[] = tracksData?.data?.data ?? []
  const users: UserProfile[] = (usersData?.data?.data ?? []) as UserProfile[]

  // Build set of unique mentors
  const mentorIds = [...new Set(assignments.map((a) => a.userId))]
  const mentors = mentorIds.map((uid) => {
    const found = assignments.find((a) => a.userId === uid)
    return found?.user ?? users.find((u) => u.id === uid)
  }).filter(Boolean)

  const getAssignment = (userId: string, trackId: string) =>
    assignments.find((a) => a.userId === userId && a.trackId === trackId)

  const assignMut = useMutation({
    mutationFn: (data: { userId: string; trackId: string }) =>
      mentorTrackApi.assign(hackathonId, data),
    onSuccess: () => {
      toast.success('Ментора призначено')
      qc.invalidateQueries({ queryKey: ['mentorAssignments', hackathonId] })
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { error?: { message?: string }; message?: string } } }
      const msg = e.response?.data?.error?.message || e.response?.data?.message || 'Помилка при призначенні'
      toast.error(msg)
    },
  })

  const assignToAllMut = useMutation({
    mutationFn: async (userId: string) => {
      for (const track of tracks) {
        const existing = getAssignment(userId, track.id)
        if (!existing) {
          await mentorTrackApi.assign(hackathonId, { userId, trackId: track.id })
        }
      }
    },
    onSuccess: () => {
      toast.success('Ментора призначено на всі треки')
      qc.invalidateQueries({ queryKey: ['mentorAssignments', hackathonId] })
    },
    onError: () => toast.error('Помилка при масовому призначенні'),
  })

  const removeMut = useMutation({
    mutationFn: (id: string) => mentorTrackApi.unassign(hackathonId, id),
    onSuccess: () => {
      toast.success('Ментора знято')
      qc.invalidateQueries({ queryKey: ['mentorAssignments', hackathonId] })
    },
    onError: () => toast.error('Помилка при знятті'),
  })

  const removeAllMut = useMutation({
    mutationFn: async (userId: string) => {
      const userAssignments = assignments.filter((a) => a.userId === userId)
      for (const assignment of userAssignments) {
        await mentorTrackApi.unassign(hackathonId, assignment.id)
      }
    },
    onSuccess: () => {
      toast.success('Ментора знято з усіх треків')
      qc.invalidateQueries({ queryKey: ['mentorAssignments', hackathonId] })
    },
    onError: () => toast.error('Помилка при видаленні'),
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
        <p className="text-sm text-muted-foreground italic">
          Треків ще немає. Додайте треки в налаштуваннях хакатону.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Ментор</th>
                {tracks.map((t) => (
                  <th key={t.id} className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">
                    {t.name}
                  </th>
                ))}
                <th className="px-4 py-3 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {mentors.length === 0 ? (
                <tr>
                  <td colSpan={tracks.length + 2} className="px-4 py-6 text-center text-sm text-muted-foreground">
                    Менторів не призначено. Спочатку призначте роль ментора користувачам.
                  </td>
                </tr>
              ) : (
                (mentors as (MentorAssignment['user'] | UserProfile)[]).map((mentor) => {
                  if (!mentor) return null
                  const m = mentor as { id: string; fullName: string; email: string }
                  return (
                    <tr key={m.id} className="bg-card hover:bg-muted/20 transition-colors group">
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{m.fullName}</p>
                            <p className="text-xs text-muted-foreground">{m.email}</p>
                          </div>
                          <button
                            title="Видалити ментора з усіх треків"
                            onClick={() => {
                              if (confirm(`Зняти ментора ${m.fullName} з усіх треків?`)) {
                                removeAllMut.mutate(m.id)
                              }
                            }}
                            className="p-1.5 text-destructive opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 rounded-md"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                      {tracks.map((track) => {
                        const assignment = getAssignment(m.id, track.id)
                        const assigned = !!assignment
                        return (
                          <td key={track.id} className="px-4 py-3 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <button
                                onClick={() => handleCellClick(m.id, track.id)}
                                title={assigned ? 'Зняти' : 'Призначити'}
                                className={clsx(
                                  'h-7 w-7 rounded-md border-2 transition-all',
                                  assigned
                                    ? 'border-primary bg-primary text-white'
                                    : 'border-border bg-background hover:border-primary/50',
                                )}
                              >
                                {assigned && <span className="text-xs">✓</span>}
                              </button>
                            </div>
                          </td>
                        )
                      })}
                      <td className="px-2" />
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Assign new mentor */}
      {showAssignForm ? (
        <div className="flex flex-wrap gap-2 rounded-lg border border-primary/30 bg-primary/5 p-3">
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring"
          >
            <option value="">Обрати ментора…</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.fullName} ({u.email})</option>
            ))}
          </select>
          <select
            value={selectedTrackId}
            onChange={(e) => setSelectedTrackId(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring"
          >
            <option value="">Обрати трек…</option>
            <option value="ALL" className="font-semibold text-primary">Всі треки</option>
            {tracks.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          <button
            onClick={() => {
              if (!selectedUserId || !selectedTrackId) return
              if (selectedTrackId === 'ALL') {
                assignToAllMut.mutate(selectedUserId)
              } else {
                assignMut.mutate({ userId: selectedUserId, trackId: selectedTrackId })
              }
              setShowAssignForm(false)
            }}
            disabled={!selectedUserId || !selectedTrackId}
            className="rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            Призначити
          </button>
          <button
            onClick={() => setShowAssignForm(false)}
            className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-accent"
          >
            Скасувати
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowAssignForm(true)}
          className="flex items-center gap-2 rounded-lg border border-dashed border-border px-4 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        >
          <UserPlus className="h-4 w-4" /> Призначити ментора
        </button>
      )}
    </div>
  )
}
