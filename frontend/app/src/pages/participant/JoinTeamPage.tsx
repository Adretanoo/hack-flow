import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Trophy, Users, Loader2, CheckCircle, XCircle, LogIn } from 'lucide-react'
import { teamsApi } from '@/api/teams'
import api from '@/api/client'
import { useAuthStore } from '@/store/auth.store'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { useI18n } from '@/i18n'

const SESSION_KEY = 'hackflow_pending_join_token'

export function JoinTeamPage() {
  const { token } = useParams<{ token: string }>()
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const { t } = useI18n()
  const [status, setStatus] = useState<'idle' | 'joining' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  // Fetch invite info (unauthenticated — just peek at the team name via token)
  // We use a proxy: try GET /teams/join-info/:token if available, otherwise
  // we fall back to just showing a generic "join" card.
  const { data: teamData, isLoading } = useQuery({
    queryKey: ['invite-info', token],
    queryFn: async () => {
      try {
        // Try to GET team info from token — backend exposes it via join directly
        // We do a dry-run with a fake userId-less endpoint. For now we
        // rely on the inviteData we can infer after login.
        const res = await api.get(`/teams/invite-info/${token}`)
        return res.data?.data ?? null
      } catch {
        return null
      }
    },
    enabled: !!token,
    retry: false,
  })

  const joinMut = useMutation({
    mutationFn: () => teamsApi.join(token!),
    onSuccess: (res) => {
      setStatus('success')
      const hackathonId = (res.data?.data as any)?.hackathonId
      setTimeout(() => {
        if (hackathonId) navigate(`/app/hackathons/${hackathonId}`)
        else navigate('/app/hackathons')
      }, 1500)
    },
    onError: (err: any) => {
      setStatus('error')
      const msg = err?.message || err?.error || ''
      if (msg.includes('вже є') || msg.includes('already')) {
        setErrorMsg(t.joinTeamPage.alreadyMember)
      } else if (msg.includes('недійсний') || msg.includes('invalid') || msg.includes('expired')) {
        setErrorMsg(t.joinTeamPage.invalidInvite)
      } else if (msg.includes('Ліміт') || msg.includes('maximum')) {
        setErrorMsg(t.joinTeamPage.invalidInvite)
      } else {
        setErrorMsg(msg || t.joinTeamPage.joiningError)
      }
    },
  })

  // If user is logged in and there's a saved token — auto-join
  useEffect(() => {
    if (!user || !token) return
    const saved = sessionStorage.getItem(SESSION_KEY)
    if (saved === token) {
      sessionStorage.removeItem(SESSION_KEY)
      joinMut.mutate()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, token])

  const handleNotLoggedIn = (dest: '/login' | '/register') => {
    sessionStorage.setItem(SESSION_KEY, token!)
    navigate(dest)
  }

  const handleJoin = () => {
    setStatus('joining')
    joinMut.mutate()
  }

  const handleDecline = () => navigate('/app/hackathons')

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
          <h2 className="text-2xl font-bold">{t.joinTeamPage.successTitle}</h2>
          <p className="text-muted-foreground">{t.joinTeamPage.redirecting}</p>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full rounded-2xl border border-border bg-card p-8 shadow-lg text-center space-y-4">
          <XCircle className="h-14 w-14 text-red-500 mx-auto" />
          <h2 className="text-xl font-bold">{t.joinTeamPage.errorTitle}</h2>
          <p className="text-muted-foreground">{errorMsg}</p>
          <Link
            to="/app/hackathons"
            className="inline-block rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            {t.joinTeamPage.backToHackathons}
          </Link>
        </div>
      </div>
    )
  }

  // Not logged in
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full rounded-2xl border border-border bg-card p-8 shadow-lg space-y-6">
          <div className="text-center space-y-2">
            <Trophy className="h-12 w-12 text-primary mx-auto" />
            <h1 className="text-2xl font-bold">{t.joinTeamPage.invitedTitle}</h1>
            {teamData ? (
              <div className="text-muted-foreground space-y-0.5">
                <p className="text-lg font-semibold text-foreground">{teamData.name}</p>
                {teamData.hackathon && <p className="text-sm">{teamData.hackathon.title}</p>}
                {teamData.track && <p className="text-xs">{teamData.track.name}</p>}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">{t.joinTeamPage.loginToSeeDetails}</p>
            )}
          </div>
          <p className="text-sm text-center text-muted-foreground">
            {t.joinTeamPage.loginToJoinPrompt}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleNotLoggedIn('/login')}
              className="flex items-center justify-center gap-2 rounded-md border border-border px-4 py-2.5 text-sm font-medium hover:bg-accent transition-colors"
            >
              <LogIn className="h-4 w-4" /> {t.joinTeamPage.loginBtn}
            </button>
            <button
              onClick={() => handleNotLoggedIn('/register')}
              className="flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              {t.joinTeamPage.registerBtn}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Logged in — confirm join
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full rounded-2xl border border-border bg-card p-8 shadow-lg space-y-6">
        <div className="text-center space-y-2">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <Users className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">{t.joinTeamPage.confirmTitle}</h1>
          {teamData ? (
            <div className="space-y-0.5">
              <p className="text-lg font-semibold">{teamData.name}</p>
              {teamData.hackathon && <p className="text-sm text-muted-foreground">{teamData.hackathon.title}</p>}
              {teamData.track && <p className="text-xs text-muted-foreground">{teamData.track.name}</p>}
            </div>
          ) : null}
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleDecline}
            className="flex-1 rounded-md border border-border px-4 py-2.5 text-sm font-medium hover:bg-accent transition-colors"
          >
            {t.joinTeamPage.declineBtn}
          </button>
          <button
            onClick={handleJoin}
            disabled={joinMut.isPending}
            className="flex-1 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {joinMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {t.joinTeamPage.joinBtn}
          </button>
        </div>
      </div>
    </div>
  )
}
