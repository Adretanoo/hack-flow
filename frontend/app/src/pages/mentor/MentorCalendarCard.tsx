import { useState } from 'react'
import { Trash2, ChevronDown, ChevronUp, Video } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { mentorshipApi } from '@/api/mentorship'
import { useNotificationsStore } from '@/store/notifications.store'
import { getMentorSlotStatusMeta } from '@/utils/format'

function fmtTime(dt: Date) { return dt.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' }) }

const SLOT_COLORS: Record<string, string> = {
  free: 'bg-teal-50 border-teal-200 dark:bg-teal-900/20 dark:border-teal-800',
  pending: 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800',
  accepted: 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800',
  blocked: 'bg-muted border-border',
}

function getCardColor(avail: any) {
  const slots: any[] = avail.slots || []
  const active = slots.filter((s: any) => s.status !== 'cancelled' && s.status !== 'rejected')
  if (active.some((s: any) => s.status === 'accepted')) return SLOT_COLORS.accepted
  if (active.some((s: any) => s.status === 'pending')) return SLOT_COLORS.pending
  if (active.every((s: any) => s.status === 'blocked')) return SLOT_COLORS.blocked
  return SLOT_COLORS.free
}

export function AvailabilityCard({ avail, onDeleted }: { avail: any; onDeleted?: () => void }) {
  const qc = useQueryClient()
  const [expanded, setExpanded] = useState(false)
  const [links, setLinks] = useState<Record<string, string>>({})
  const { addMentorCancellation } = useNotificationsStore()

  const start = new Date(avail.startDatetime)
  const end = new Date(avail.endDatetime)
  const dur = avail.slotDuration || 30
  const total = Math.floor((end.getTime() - start.getTime()) / 60000 / dur)
  const slots: any[] = avail.slots || []
  const active = slots.filter((s: any) => s.status !== 'cancelled' && s.status !== 'rejected')
  const pending = active.filter((s: any) => s.status === 'pending').length
  const accepted = active.filter((s: any) => s.status === 'accepted').length
  const free = Math.max(0, total - active.length)

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
    onSuccess: (res: any) => {
      const cancelled = res?.data?.data?.cancelledRequests || []
      cancelled.forEach((r: any) => addMentorCancellation({
        id: `slot-del-${r.id}`,
        status: 'SLOT_CANCELLED',
        title: '🗓️ Слот менторства скасовано',
        body: `Ментор видалив слот ${new Date(r.startDatetime).toLocaleDateString('uk-UA')} о ${new Date(r.startDatetime).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })} (${r.durationMinute} хв)`,
        teamName: r.teamName, hackathonTitle: '', timestamp: new Date().toISOString(),
      }))
      inv(); onDeleted?.()
    },
    onError: (e: any) => alert(e.message || 'Помилка'),
  })

  const acceptMut = useMutation({ mutationFn: ({ id, link }: { id: string; link: string }) => mentorshipApi.acceptRequest(id, link), onSuccess: inv, onError: (e: any) => alert(e.message) })
  const rejectMut = useMutation({ mutationFn: (id: string) => mentorshipApi.rejectRequest(id), onSuccess: inv, onError: (e: any) => alert(e.message) })
  const blockMut = useMutation({ mutationFn: ({ id, start, d }: any) => mentorshipApi.blockSlot(id, { startDatetime: start, durationMinute: d }), onSuccess: inv })
  const unblockMut = useMutation({ mutationFn: (id: string) => mentorshipApi.unblockSlot(id), onSuccess: inv })

  const handleDelete = () => {
    const hasBkgs = pending + accepted > 0
    const msg = hasBkgs ? `Є ${pending + accepted} активних бронювань — команди отримають сповіщення. Видалити?` : 'Видалити цей часовий блок?'
    if (confirm(msg)) deleteMut.mutate()
  }

  return (
    <div className={`rounded-xl border-2 overflow-hidden transition-all ${getCardColor(avail)}`}>
      <div className="px-3 py-2.5 flex items-center gap-2 cursor-pointer" onClick={() => setExpanded(v => !v)}>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-xs">{fmtTime(start)} – {fmtTime(end)}</p>
          <p className="text-[10px] text-muted-foreground truncate">{avail.track?.name || 'Всі треки'} · {dur}хв</p>
          <div className="flex gap-1 mt-1 flex-wrap">
            {free > 0 && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-teal-100 text-teal-700 font-semibold">○{free}</span>}
            {pending > 0 && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold">⏳{pending}</span>}
            {accepted > 0 && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold">✓{accepted}</span>}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={e => { e.stopPropagation(); handleDelete() }} disabled={deleteMut.isPending} className="p-1 rounded hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-colors">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          {expanded ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-current/10 bg-background/60 p-3 space-y-1.5">
          {slotGrid.map(({ time, dt, req }, i) => (
            <div key={i} className={`rounded-lg p-2.5 text-xs border ${req ? 'bg-blue-50/80 dark:bg-blue-900/20 border-blue-200/60' : 'bg-card border-border'}`}>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold w-10 shrink-0 text-xs">{time}</span>
                {req ? (
                  req.status === 'blocked' ? (
                    <span className="flex-1 text-muted-foreground italic text-xs">Заблоковано</span>
                  ) : (
                    <span className="flex-1 font-semibold truncate text-xs">{req.team?.name || 'Команда'}</span>
                  )
                ) : (
                  <span className="flex-1 text-muted-foreground text-xs">Вільний</span>
                )}
                {req?.status && (() => {
                  const m = getMentorSlotStatusMeta(req.status === 'accepted' ? 'BOOKED' : req.status === 'pending' ? 'PENDING' : req.status === 'completed' ? 'COMPLETED' : 'FREE')
                  return <span className={`text-[10px] px-1.5 py-0.5 rounded-full shrink-0 ${m.className}`}>{m.icon} {m.label}</span>
                })()}
                {!req && (
                  <button onClick={() => blockMut.mutate({ id: avail.id, start: dt.toISOString(), d: dur })} className="text-[10px] px-2 py-0.5 border border-border rounded hover:bg-muted transition-colors shrink-0">
                    Блок
                  </button>
                )}
              </div>

              {req?.status === 'blocked' && (
                <button onClick={() => unblockMut.mutate(req.id)} className="mt-1.5 ml-12 text-[10px] text-blue-600 hover:underline">Розблокувати</button>
              )}
              {req?.status === 'pending' && (
                <div className="mt-2 ml-12 space-y-1.5">
                  {req.message && <p className="text-[10px] italic text-muted-foreground">"{req.message}"</p>}
                  <div className="flex gap-1.5">
                    <input type="url" placeholder="Google Meet / Zoom..." value={links[req.id] || ''} onChange={e => setLinks(p => ({ ...p, [req.id]: e.target.value }))} className="flex-1 rounded border border-border px-2 py-1 text-[10px] bg-background" />
                    <button onClick={() => acceptMut.mutate({ id: req.id, link: links[req.id] })} disabled={!links[req.id]} className="px-2 py-1 rounded bg-primary text-primary-foreground text-[10px] font-bold disabled:opacity-40">✓</button>
                    <button onClick={() => { if (confirm('Відхилити?')) rejectMut.mutate(req.id) }} className="px-2 py-1 rounded bg-destructive/10 text-destructive text-[10px] font-bold">✗</button>
                  </div>
                </div>
              )}
              {req?.status === 'accepted' && req.meetingLink && (
                <a href={req.meetingLink} target="_blank" rel="noreferrer" className="mt-1.5 ml-12 flex items-center gap-1 text-[10px] text-blue-600 hover:underline">
                  <Video className="h-2.5 w-2.5" /> {req.meetingLink}
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
