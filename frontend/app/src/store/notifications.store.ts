import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type NotificationStatus = 'APPROVED' | 'REJECTED' | 'DISQUALIFIED' | 'PENDING'

export interface AppNotification {
  id: string
  status: NotificationStatus
  title: string
  body: string
  teamName: string
  hackathonTitle: string
  timestamp: string
}

interface NotificationsState {
  readIds: string[]
  dismissedIds: string[]
  markRead: (id: string) => void
  markAllRead: (ids: string[]) => void
  dismiss: (id: string) => void
  clearAll: (ids: string[]) => void
}

export const useNotificationsStore = create<NotificationsState>()(
  persist(
    (set) => ({
      readIds: [],
      dismissedIds: [],

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
    }),
    { name: 'hack-flow-notifications' }
  )
)
