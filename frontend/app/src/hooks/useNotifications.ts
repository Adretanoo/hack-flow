import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { teamsApi } from '@/api/teams'
import { useAuthStore } from '@/store/auth.store'
import { useNotificationsStore } from '@/store/notifications.store'
import type { AppNotification } from '@/store/notifications.store'

function buildNotifications(teams: any[]): AppNotification[] {
  const result: AppNotification[] = []

  for (const team of teams) {
    const approvals: any[] = team.approvals ?? []
    const hackathonTitle = team.hackathon?.title ?? 'Хакатон'

    for (const approval of approvals) {
      if (!approval.approvedAt) continue

      const status = approval.status as AppNotification['status']

      // Skip bare PENDING with no comment — it's just the initial state, not an admin action
      if (status === 'PENDING' && !approval.comment?.trim()) continue

      const id = `${team.id}-${approval.id ?? approval.approvedAt}`

      let title = ''
      let body = ''

      if (status === 'APPROVED') {
        title = `✅ Команду «${team.name}» схвалено`
        body = approval.comment
          ? `Коментар організатора: ${approval.comment}`
          : `Ваша команда успішно затверджена для участі в хакатоні «${hackathonTitle}».`
      } else if (status === 'REJECTED') {
        title = `❌ Команду «${team.name}» відхилено`
        body = approval.comment
          ? `Причина: ${approval.comment}`
          : `Організатор відхилив вашу команду без пояснення. Зверніться до організаторів.`
      } else if (status === 'DISQUALIFIED') {
        title = `🚫 Команду «${team.name}» дискваліфіковано`
        body = approval.comment
          ? `Причина: ${approval.comment}`
          : `Зверніться до організаторів хакатону для уточнення.`
      } else if (status === 'PENDING') {
        // PENDING with comment = admin explicitly returned for review
        title = `⏳ Заявку команди «${team.name}» повернуто на розгляд`
        body = `Повідомлення організатора: ${approval.comment}`
      } else {
        continue
      }

      result.push({
        id,
        status,
        title,
        body,
        teamName: team.name,
        hackathonTitle,
        timestamp: approval.approvedAt,
      })
    }
  }

  // Newest first
  return result.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

export function useNotifications() {
  const { user } = useAuthStore()
  const { readIds, dismissedIds } = useNotificationsStore()

  const { data } = useQuery({
    queryKey: ['my-teams-notifications', user?.id],
    queryFn: () => teamsApi.getMyTeams().then((r) => r.data?.data ?? []),
    enabled: !!user,
    refetchInterval: 60_000, // refresh every minute
    staleTime: 30_000,
  })

  const all = useMemo(() => buildNotifications(data ?? []), [data])
  const visible = useMemo(() => all.filter((n) => !dismissedIds.includes(n.id)), [all, dismissedIds])
  const unread = useMemo(() => visible.filter((n) => !readIds.includes(n.id)), [visible, readIds])

  return { all, visible, unread, allIds: all.map((n) => n.id) }
}
