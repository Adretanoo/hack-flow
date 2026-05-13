import { useState, useRef, useEffect } from 'react'
import { Bell, X, CheckCheck, Trash2 } from 'lucide-react'
import { useNotifications } from '@/hooks/useNotifications'
import { useNotificationsStore } from '@/store/notifications.store'
import { formatDistanceToNow } from 'date-fns'
import { uk } from 'date-fns/locale'

const statusStyles: Record<string, { bg: string; dot: string; text: string }> = {
  APPROVED:     { bg: 'bg-green-50 border-green-100',  dot: 'bg-green-500',  text: 'text-green-800' },
  REJECTED:     { bg: 'bg-red-50 border-red-100',      dot: 'bg-red-500',    text: 'text-red-800' },
  DISQUALIFIED: { bg: 'bg-orange-50 border-orange-100', dot: 'bg-orange-500', text: 'text-orange-800' },
  PENDING:      { bg: 'bg-amber-50 border-amber-100',  dot: 'bg-amber-500',  text: 'text-amber-800' },
  SLOT_CANCELLED: { bg: 'bg-purple-50 border-purple-100', dot: 'bg-purple-500', text: 'text-purple-800' },
}

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const { visible, unread, allIds } = useNotifications()
  const { readIds, markAllRead, dismiss, clearAll } = useNotificationsStore()

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Mark all as read when panel opens
  useEffect(() => {
    if (open && unread.length > 0) {
      markAllRead(allIds)
    }
  }, [open])

  const unreadCount = unread.length

  return (
    <div ref={ref} className="relative">
      {/* Bell button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-accent"
        title="Сповіщення"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-xl border border-border bg-background shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold text-sm">Сповіщення</span>
              {visible.length > 0 && (
                <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">
                  {visible.length}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {visible.length > 0 && (
                <>
                  <button
                    onClick={() => markAllRead(allIds)}
                    title="Позначити всі як прочитані"
                    className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                  >
                    <CheckCheck className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => clearAll(allIds)}
                    title="Очистити всі"
                    className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Notification list */}
          <div className="max-h-[420px] overflow-y-auto divide-y divide-border">
            {visible.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Bell className="h-8 w-8 text-muted-foreground/30 mb-2" />
                <p className="text-sm font-medium text-muted-foreground">Немає сповіщень</p>
                <p className="text-xs text-muted-foreground/70 mt-0.5">Сюди будуть приходити рішення організаторів</p>
              </div>
            ) : (
              visible.map((n) => {
                const isRead = readIds.includes(n.id)
                const styles = statusStyles[n.status] ?? statusStyles.PENDING
                return (
                  <div
                    key={n.id}
                    className={`relative flex gap-3 px-4 py-3.5 transition-colors hover:bg-muted/30 ${!isRead ? 'bg-primary/[0.03]' : ''}`}
                  >
                    {/* Unread dot */}
                    {!isRead && (
                      <span className="absolute left-1.5 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-primary" />
                    )}

                    {/* Status dot */}
                    <div className="mt-0.5 shrink-0">
                      <span className={`flex h-8 w-8 items-center justify-center rounded-full ${styles.bg} border text-base`}>
                        {n.status === 'APPROVED' ? '✅' : n.status === 'REJECTED' ? '❌' : n.status === 'PENDING' ? '⏳' : n.status === 'SLOT_CANCELLED' ? '🗓️' : '🚫'}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold leading-snug ${styles.text}`}>{n.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">{n.body}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-xs text-muted-foreground/60">
                          {formatDistanceToNow(new Date(n.timestamp), { addSuffix: true, locale: uk })}
                        </span>
                        <span className="text-muted-foreground/40">·</span>
                        <span className="text-xs text-muted-foreground/60 truncate">{n.hackathonTitle}</span>
                      </div>
                    </div>

                    {/* Dismiss */}
                    <button
                      onClick={() => dismiss(n.id)}
                      title="Прибрати"
                      className="shrink-0 self-start mt-0.5 p-1 rounded text-muted-foreground/40 hover:text-muted-foreground hover:bg-accent transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )
              })
            )}
          </div>

          {/* Footer */}
          {visible.length > 0 && (
            <div className="border-t border-border px-4 py-2.5 bg-muted/20">
              <p className="text-xs text-muted-foreground text-center">
                Сповіщення зберігаються локально у браузері
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
