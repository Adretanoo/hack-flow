import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { teamsApi } from '@/api/teams'
import { useAuthStore } from '@/store/auth.store'
import { useNotificationsStore } from '@/store/notifications.store'
import type { AppNotification } from '@/store/notifications.store'
import { useI18n } from '@/i18n'
import type { Translations } from '@/i18n/uk'

function buildNotifications(teams: any[], t: Translations): AppNotification[] {
  const result: AppNotification[] = []

  for (const team of teams) {
    const approvals: any[] = team.approvals ?? []
    const hackathonTitle = team.hackathon?.title ?? t.notificationAlerts.hackathonDefault

    for (const approval of approvals) {
      if (!approval.approvedAt) continue

      const status = approval.status as AppNotification['status']
      if (status === 'PENDING' && !approval.comment?.trim()) continue

      const id = `${team.id}-${approval.id ?? approval.approvedAt}`
      let title = ''
      let body = ''

      if (status === 'APPROVED') {
        title = t.notificationAlerts.approvedTitle(team.name)
        body = approval.comment
          ? t.notificationAlerts.approvedBodyComment(approval.comment)
          : t.notificationAlerts.approvedBodyDefault(hackathonTitle)
      } else if (status === 'REJECTED') {
        title = t.notificationAlerts.rejectedTitle(team.name)
        body = approval.comment
          ? t.notificationAlerts.rejectedBodyComment(approval.comment)
          : t.notificationAlerts.rejectedBodyDefault
      } else if (status === 'DISQUALIFIED') {
        title = t.notificationAlerts.disqualifiedTitle(team.name)
        body = approval.comment
          ? t.notificationAlerts.disqualifiedBodyComment(approval.comment)
          : t.notificationAlerts.disqualifiedBodyDefault
      } else if (status === 'PENDING') {
        title = t.notificationAlerts.pendingTitle(team.name)
        body = t.notificationAlerts.pendingBodyComment(approval.comment)
      } else {
        continue
      }

      result.push({ id, status, title, body, teamName: team.name, hackathonTitle, timestamp: approval.approvedAt })
    }
  }

  return result.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

export function useNotifications() {
  const { user } = useAuthStore()
  const { readIds, dismissedIds, mentorNotifications } = useNotificationsStore()
  const { t } = useI18n()

  const { data } = useQuery({
    queryKey: ['my-teams-notifications', user?.id],
    queryFn: () => teamsApi.getMyTeams().then((r) => r.data?.data ?? []),
    enabled: !!user,
    refetchInterval: 60_000,
    staleTime: 30_000,
  })

  const teamNotifications = useMemo(() => buildNotifications(data ?? [], t), [data, t])

  // Merge team approval notifications + mentor slot cancellation notifications
  const all = useMemo(() => {
    const mentor = (mentorNotifications ?? []).map((n) => ({ ...n } as AppNotification))
    return [...teamNotifications, ...mentor].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
  }, [teamNotifications, mentorNotifications])

  const visible = useMemo(() => all.filter((n) => !dismissedIds.includes(n.id)), [all, dismissedIds])
  const unread = useMemo(() => visible.filter((n) => !readIds.includes(n.id)), [visible, readIds])

  return { all, visible, unread, allIds: all.map((n) => n.id) }
}
