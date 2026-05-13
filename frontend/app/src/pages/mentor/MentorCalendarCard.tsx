import { useState } from 'react'
import { Trash2, Video, X } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { mentorshipApi } from '@/api/mentorship'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'

function fmtTime(dt: Date) { return dt.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit', hour12: false }) }
function fmtDate(dt: Date) { return dt.toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' }) }

const STATUS_COLOR: Record<string, string> = {
  free:      'bg-teal-400',
  pending:   'bg-amber-400',
  accepted:  'bg-blue-500',
  blocked:   'bg-muted-foreground/30',
  completed: 'bg-green-500',
}

function getAvailStatus(avail: any) {
  const slots: any[] = avail.slots || []
  const active = slots.filter((s: any) => s.status !== 'cancelled' && s.status !== 'rejected')
  if (active.some((s: any) => s.status === 'accepted')) return 'accepted'
  if (active.some((s: any) => s.status === 'pending'))  return 'pending'
  if (active.every((s: any) => s.status === 'blocked'))  return 'blocked'
  return 'free'
}

const CARD_BG: Record<string, string> = {
  free:     'bg-teal-50  border-teal-200 dark:bg-teal-900/20 dark:border-teal-800',
  pending:  'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800',
  accepted: 'bg-blue-50  border-blue-200 dark:bg-blue-900/20 dark:border-blue-800',
  blocked:  'bg-muted/50 border-border',
  completed:'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800',
}

/** Compact card shown in the calendar grid — no expanding content */
export function AvailabilityCard({ avail, onSelect }: { avail: any; onSelect: (a: any) => void }) {
  const start = new Date(avail.startDatetime)
  const end = new Date(avail.endDatetime)
  const dur = avail.slotDuration || 30
  const total = Math.floor((end.getTime() - start.getTime()) / 60000 / dur)
  const slots: any[] = avail.slots || []
  const active = slots.filter((s: any) => s.status !== 'cancelled' && s.status !== 'rejected')
  const pending = active.filter((s: any) => s.status === 'pending').length
  const accepted = active.filter((s: any) => s.status === 'accepted').length
  const free = Math.max(0, total - active.length)
  const status = getAvailStatus(avail)

  return (
    <button onClick={() => onSelect(avail)} className={`w-full text-left rounded-xl border-2 p-2.5 transition-all hover:shadow-md hover:scale-[1.01] ${CARD_BG[status]}`}>
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className={`w-2 h-2 rounded-full shrink-0 ${STATUS_COLOR[status]}`} />
        <p className="font-bold text-xs">{fmtTime(start)} – {fmtTime(end)}</p>
      </div>
      <p className="text-[10px] text-muted-foreground truncate mb-1.5">{avail.track?.name || 'Всі треки'} · {dur}хв</p>
      <div className="flex gap-1 flex-wrap">
        {free > 0     && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-teal-100  text-teal-700  font-bold">○{free}</span>}
        {pending > 0  && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-bold">⏳{pending}</span>}
        {accepted > 0 && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-100  text-blue-700  font-bold">✓{accepted}</span>}
      </div>
    </button>
  )
}

/** Full detail slide-over panel shown when a card is selected */
export function AvailDetailPanel({ avail, onClose }: { avail: any; onClose: () => void }) {
  const qc = useQueryClient()
  const [links, setLinks] = useState<Record<string, string>>({})
  const [deleteConfirm, setDeleteConfirm] = useState(false)

  const start = new Date(avail.startDatetime)
  const end = new Date(avail.endDatetime)
  const dur = avail.slotDuration || 30
  const total = Math.floor((end.getTime() - start.getTime()) / 60000 / dur)
  const slots: any[] = avail.slots || []
  const active = slots.filter((s: any) => s.status !== 'cancelled' && s.status !== 'rejected')
  const pending = active.filter((s: any) => s.status === 'pending').length
  const accepted = active.filter((s: any) => s.status === 'accepted').length

  const slotGrid: { time: string; dt: Date; req?: any }[] = []
  let cur = new Date(start)
  for (let i = 0; i < total; i++) {
    const dt = new Date(cur)
    const req = active.find((s: any) => Math.abs(new Date(s.startDatetime).getTime() - dt.getTime()) < 60000)
    slotGrid.push({ time: fmtTime(dt), dt, req })
    cur = new Date(cur.getTime() + dur * 60000)
  }

  const inv = () => qc.invalidateQueries({ queryKey: ['my-availabilities'] })

  const deleteMut = useMutation({
    mutationFn: () => mentorshipApi.deleteAvailability(avail.id),
    onSuccess: () => { inv(); onClose() },
    onError: (e: any) => alert(e?.response?.data?.message || e.message || 'Помилка'),
  })

  const acceptMut = useMutation({ mutationFn: ({ id, link }: { id: string; link: string }) => mentorshipApi.acceptRequest(id, link), onSuccess: inv })
  const rejectMut = useMutation({ mutationFn: (id: string) => mentorshipApi.rejectRequest(id), onSuccess: inv })
  const blockMut  = useMutation({ mutationFn: ({ id, start, d }: any) => mentorshipApi.blockSlot(id, { startDatetime: start, durationMinute: d }), onSuccess: inv })
  const unblockMut = useMutation({ mutationFn: (id: string) => mentorshipApi.unblockSlot(id), onSuccess: inv })

  const STATUS_BADGE: Record<string, string> = {
    pending:   'bg-amber-100 text-amber-700',
    accepted:  'bg-blue-100  text-blue-700',
    completed: 'bg-green-100 text-green-700',
    blocked:   'bg-muted text-muted-foreground',
    rejected:  'bg-red-100   text-red-600',
    cancelled: 'bg-muted text-muted-foreground',
  }
  const STATUS_LABEL: Record<string, string> = {
    pending: '⏳ Очікує', accepted: '✓ Підтверджено', completed: '✅ Завершено',
    blocked: '🔒 Заблоковано', rejected: '✗ Відхилено', cancelled: '✗ Скасовано',
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="fixed right-0 top-0 z-50 h-full w-full max-w-md bg-card border-l border-border shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/20 shrink-0">
          <div>
            <p className="font-bold">{fmtDate(start)} · {fmtTime(start)} – {fmtTime(end)}</p>
            <p className="text-xs text-muted-foreground">{avail.track?.name || 'Всі треки'} · {dur} хв/слот · {total} слотів</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setDeleteConfirm(true)} disabled={deleteMut.isPending}
              className="p-2 rounded-lg hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-colors">
              <Trash2 className="h-4 w-4" />
            </button>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-accent transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 divide-x divide-border border-b border-border shrink-0">
          {[
            { label: 'Вільних',      val: Math.max(0, total - active.length), cls: 'text-teal-600' },
            { label: 'Очікує',       val: pending,  cls: 'text-amber-600' },
            { label: 'Підтверджено', val: accepted, cls: 'text-blue-600' },
          ].map(s => (
            <div key={s.label} className="py-3 text-center">
              <p className={`text-xl font-bold ${s.cls}`}>{s.val}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Slots list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {slotGrid.map(({ time, dt, req }, i) => (
            <div key={i} className={`rounded-xl border p-3 ${req ? 'bg-card border-border' : 'bg-muted/10 border-dashed border-border/50'}`}>
              <div className="flex items-center gap-3">
                <span className="font-mono font-bold text-sm w-12 shrink-0">{time}</span>
                {req ? (
                  <>
                    <div className="flex-1 min-w-0">
                      {req.status !== 'blocked' && <p className="font-semibold text-sm truncate">{req.team?.name || 'Команда'}</p>}
                      {req.message && <p className="text-xs text-muted-foreground italic truncate mt-0.5">"{req.message}"</p>}
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full shrink-0 ${STATUS_BADGE[req.status] || ''}`}>
                      {STATUS_LABEL[req.status] || req.status}
                    </span>
                  </>
                ) : (
                  <span className="flex-1 text-xs text-muted-foreground/50">Вільний</span>
                )}
              </div>

              {/* Actions */}
              {req?.status === 'blocked' && (
                <button onClick={() => unblockMut.mutate(req.id)} className="mt-2 text-xs text-blue-600 hover:underline ml-14">Розблокувати</button>
              )}

              {req?.status === 'accepted' && req.meetingLink && (
                <a href={req.meetingLink} target="_blank" rel="noreferrer" className="mt-2 ml-14 flex items-center gap-1 text-xs text-blue-600 hover:underline">
                  <Video className="h-3 w-3" />{req.meetingLink}
                </a>
              )}

              {req?.status === 'pending' && (
                <div className="mt-3 ml-14 space-y-2">
                  <div className="flex gap-2">
                    <input type="url" placeholder="Google Meet / Zoom посилання..." value={links[req.id] || ''}
                      onChange={e => setLinks(p => ({ ...p, [req.id]: e.target.value }))}
                      className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:border-primary" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => acceptMut.mutate({ id: req.id, link: links[req.id] || '' })} disabled={!links[req.id]}
                      className="flex-1 rounded-lg bg-primary text-primary-foreground text-xs font-bold py-2 disabled:opacity-40 hover:bg-primary/90 transition-colors">
                      ✓ Прийняти
                    </button>
                    <button onClick={() => rejectMut.mutate(req.id)}
                      className="flex-1 rounded-lg bg-destructive/10 text-destructive text-xs font-bold py-2 hover:bg-destructive/20 transition-colors">
                      ✗ Відхилити
                    </button>
                  </div>
                </div>
              )}

              {!req && (
                <button onClick={() => blockMut.mutate({ id: avail.id, start: dt.toISOString(), d: dur })}
                  className="mt-2 ml-14 text-xs text-muted-foreground border border-border rounded px-2 py-0.5 hover:bg-muted transition-colors">
                  Заблокувати
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <ConfirmDialog open={deleteConfirm} title="Видалити блок доступності?"
        message={pending + accepted > 0 ? `Є ${pending + accepted} активних бронювань. Команди отримають сповіщення.` : `Видалити блок ${fmtTime(start)} – ${fmtTime(end)}?`}
        confirmLabel="Так, видалити" cancelLabel="Скасувати" danger
        onConfirm={() => { deleteMut.mutate(); setDeleteConfirm(false) }}
        onCancel={() => setDeleteConfirm(false)} />
    </>
  )
}
