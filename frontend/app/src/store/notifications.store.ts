import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type NotificationStatus = 'APPROVED' | 'REJECTED' | 'DISQUALIFIED' | 'PENDING' | 'SLOT_CANCELLED'

export interface AppNotification {
  id: string
  status: NotificationStatus
  title: string
  body: string
  teamName: string
  hackathonTitle: string
  timestamp: string
}

export interface MentorCancellationNotification {
  id: string
  status: 'SLOT_CANCELLED'
  title: string
  body: string
  teamName: string
  hackathonTitle: string
  timestamp: string
}

interface NotificationsState {
  readIds: string[]
  dismissedIds: string[]
  mentorNotifications: MentorCancellationNotification[]
  markRead: (id: string) => void
  markAllRead: (ids: string[]) => void
  dismiss: (id: string) => void
  clearAll: (ids: string[]) => void
  addMentorCancellation: (n: MentorCancellationNotification) => void
}

export const useNotificationsStore = create<NotificationsState>()(
  persist(
    (set) => ({
      readIds: [],
      dismissedIds: [],
      mentorNotifications: [],

      markRead: (id) =>
        set((s) => ({ readIds: s.readIds.includes(id) ? s.readIds : [...s.readIds, id] })),

      markAllRead: (ids) =>
        set((s) => ({ readIds: Array.from(new Set([...s.readIds, ...ids])) })),

      dismiss: (id) =>
        set((s) => ({
          dismissedIds: s.dismissedIds.includes(id) ? s.dismissedIds : [...s.dismissedIds, id],
          readIds: s.readIds.includes(id) ? s.readIds : [...s.readIds, id],
        })),

      clearAll: (ids) =>
        set((s) => ({
          dismissedIds: Array.from(new Set([...s.dismissedIds, ...ids])),
          readIds: Array.from(new Set([...s.readIds, ...ids])),
        })),

      addMentorCancellation: (n) =>
        set((s) => ({
          mentorNotifications: s.mentorNotifications.some((m) => m.id === n.id)
            ? s.mentorNotifications
            : [n, ...s.mentorNotifications],
        })),
    }),
    { name: 'hack-flow-notifications' }
  )
)
