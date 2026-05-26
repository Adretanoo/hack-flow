import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { usersApi } from '@/api/users'
import { mentorshipApi } from '@/api/mentorship'
import { useAuthStore } from '@/store/auth.store'
import { Avatar } from '@/components/shared/Avatar'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { SkillsInput } from '@/components/shared/SkillsInput'
import { SocialsSection } from '@/components/shared/SocialsSection'
import { useI18n } from '@/i18n'

type FormValues = {
  fullName: string
  description: string | null
  isLookingForTeam: boolean
}

export function ProfilePage() {
  const { user, setUser } = useAuthStore()
  const queryClient = useQueryClient()
  const { t } = useI18n()

  const [skills, setSkills] = useState<string[]>([])
  const [successMsg, setSuccessMsg] = useState('')

  const isMentor = user?.role === 'mentor' || user?.role === 'admin'
  const isJudge = user?.role === 'judge'
  const isParticipant = user?.role === 'participant'

  // Mentor availabilities for expertise section
  const { data: availabilitiesData } = useQuery({
    queryKey: ['my-availabilities'],
    queryFn: () => mentorshipApi.getMyAvailabilities().then((res) => res.data.data),
    enabled: isMentor,
  })

  const expertiseTracks = Array.from(
    new Set(
      (availabilitiesData || [])
        .map((a: any) => a.track?.name)
        .filter(Boolean),
    ),
  ) as string[]

  const { register, handleSubmit, setValue } = useForm<FormValues>({
    defaultValues: {
      fullName: user?.fullName || '',
      description: user?.description || user?.bio || '',
      isLookingForTeam: user?.isLookingForTeam || false,
    },
  })

  useEffect(() => {
    if (user) {
      setValue('fullName', user.fullName)
      setValue('description', user.description || user.bio || '')
      setValue('isLookingForTeam', user.isLookingForTeam || false)
      setSkills(user.skills ?? [])
    }
  }, [user, setValue])

  const updateMut = useMutation({
    mutationFn: (data: FormValues & { skills: string[] }) => usersApi.updateMe(data),
    onSuccess: (res) => {
      setUser(res.data.data)
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
      setSuccessMsg(t.profile.successUpdate)
      setTimeout(() => setSuccessMsg(''), 3000)
    },
  })

  const onSubmit = (data: FormValues) => {
    const payload = {
      ...data,
      skills,
      description: data.description || null,
    }
    updateMut.mutate(payload)
  }

  if (!user) {
    return (
      <div className="py-24 flex justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  const roleLabel: Record<string, string> = {
    admin: t.adminUsers.roles.admin,
    mentor: t.adminUsers.roles.mentor,
    judge: t.adminUsers.roles.judge,
    participant: t.adminUsers.roles.participant,
  }

  const roleBadgeColor: Record<string, string> = {
    admin: 'bg-red-500/10 text-red-500 border-red-500/20',
    mentor: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    judge: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    participant: 'bg-primary/10 text-primary border-primary/20',
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t.profile.title}</h1>
        <p className="mt-2 text-muted-foreground">
          {t.profile.subtitle}
        </p>
      </div>

      {/* Profile card */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Avatar + identity */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-5">
            <div className="relative">
              <Avatar name={user.fullName} size="xl" />
              <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground ring-2 ring-card">
                {user.fullName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="space-y-1.5">
              <p className="font-semibold text-lg leading-tight">{user.fullName}</p>
              <p className="text-sm text-muted-foreground">@{user.username}</p>
              <span
                className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                  roleBadgeColor[user.role] ?? roleBadgeColor.participant
                }`}
              >
                {roleLabel[user.role] ?? user.role}
              </span>
            </div>
          </div>

          {/* Fields */}
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t.profile.fullNameLabel}</label>
              <input
                {...register('fullName')}
                type="text"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t.profile.emailLabel}</label>
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full rounded-md border border-border bg-muted px-3 py-2 text-sm text-muted-foreground cursor-not-allowed"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t.profile.bio}</label>
            <textarea
              {...register('description')}
              rows={3}
              placeholder={t.profile.bioPlaceholder}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all resize-none"
            />
          </div>

          {/* Skills (participants and all roles) */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t.profile.skills}</label>
            <p className="text-xs text-muted-foreground">
              {t.profile.skillsDesc}
            </p>
            <SkillsInput value={skills} onChange={setSkills} />
          </div>

          {/* Looking for team — only participants */}
          {(isParticipant || user.role === 'admin') && (
            <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 p-4">
              <div className="space-y-0.5">
                <label className="text-sm font-medium">{t.profile.lookingForTeam}</label>
                <p className="text-xs text-muted-foreground">
                  {t.profile.lookingForTeamDesc}
                </p>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  {...register('isLookingForTeam')}
                  className="peer sr-only"
                />
                <div className="peer h-6 w-11 rounded-full bg-border after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-focus:ring-2 peer-focus:ring-primary/20" />
              </label>
            </div>
          )}

          <div className="flex items-center justify-end gap-4 pt-2 border-t border-border">
            {successMsg && (
              <span className="text-sm font-medium text-emerald-600 flex items-center gap-1.5">
                <span>✓</span> {successMsg}
              </span>
            )}
            <button
              type="submit"
              disabled={updateMut.isPending}
              className="rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {updateMut.isPending ? <LoadingSpinner size="sm" /> : t.profile.saveChanges}
            </button>
          </div>
        </form>
      </div>

      {/* Social links — for all roles */}
      <SocialsSection />

      {/* Mentor expertise section */}
      {isMentor && (
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
          <div>
            <h3 className="text-lg font-bold">{t.profile.myExpertise}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {t.profile.expertiseDesc}
            </p>
          </div>
          {expertiseTracks.length === 0 ? (
            <div className="rounded-lg bg-muted/30 border border-border py-6 text-center text-sm text-muted-foreground">
              {t.profile.noExpertise}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {expertiseTracks.map((track) => (
                <span
                  key={track}
                  className="px-3 py-1 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 rounded-full text-sm font-medium"
                >
                  {track}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Judge info section */}
      {isJudge && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-6 shadow-sm space-y-4">
          <div>
            <h3 className="text-lg font-bold text-amber-700 dark:text-amber-400">{t.profile.judgeRoleTitle}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {t.profile.judgeRoleDesc}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(skills.length > 0 ? skills : ['—']).map((s) => (
              <span
                key={s}
                className="px-3 py-1 bg-amber-500/10 text-amber-600 border border-amber-500/20 rounded-full text-sm font-medium"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Teams participated */}
      {user.teams && user.teams.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
          <h3 className="text-lg font-bold">{t.profile.myTeams}</h3>
          <ul className="space-y-2">
            {user.teams.map((t) => (
              <li
                key={t.id}
                className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3"
              >
                <div>
                  <p className="font-medium text-sm">{t.name}</p>
                  {t.hackathon && (
                    <p className="text-xs text-muted-foreground">{t.hackathon.title}</p>
                  )}
                </div>
                <span className="text-xs rounded-full bg-primary/10 text-primary border border-primary/20 px-2.5 py-0.5 font-medium capitalize">
                  {t.role}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
