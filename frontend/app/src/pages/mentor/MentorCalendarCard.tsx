import { useState } from 'react'
import { Trash2, Video, X, Clock } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { mentorshipApi } from '@/api/mentorship'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { useI18n } from '@/i18n'

function fmtTime(dt: Date, lang: string) {
  return dt.toLocaleTimeString(lang === 'uk' ? 'uk-UA' : 'en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
}
function fmtDate(dt: Date, lang: string) {
  return dt.toLocaleDateString(lang === 'uk' ? 'uk-UA' : 'en-US', { day: 'numeric', month: 'short' })
}

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
  const { t, lang } = useI18n()
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
        <p className="font-bold text-xs">{fmtTime(start, lang)} – {fmtTime(end, lang)}</p>
      </div>
      <p className="text-[10px] text-muted-foreground truncate mb-1.5">{avail.track?.name || t.judge.noTrack} · {dur}{t.mentorsTab.minutes}</p>
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
  const { t, lang } = useI18n()
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

  const now = new Date()
  const slotGrid: { time: string; dt: Date; req?: any; passed: boolean }[] = []
  let cur = new Date(start)
  for (let i = 0; i < total; i++) {
    const dt = new Date(cur)
    const req = active.find((s: any) => Math.abs(new Date(s.startDatetime).getTime() - dt.getTime()) < 60000)
    slotGrid.push({ time: fmtTime(dt, lang), dt, req, passed: dt < now })
    cur = new Date(cur.getTime() + dur * 60000)
  }

  const inv = () => qc.invalidateQueries({ queryKey: ['my-availabilities'] })

  const deleteMut = useMutation({
    mutationFn: () => mentorshipApi.deleteAvailability(avail.id),
    onSuccess: () => { inv(); onClose() },
    onError: (e: any) => alert(e?.response?.data?.message || e.message || t.states.error),
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
    pending: t.mentor.pendingStatusLabel,
    accepted: t.mentor.confirmedStatusLabel,
    completed: t.mentor.completedStatusLabel,
    blocked: t.mentor.blockedStatusLabel,
    rejected: t.mentor.rejectedStatusLabel,
    cancelled: t.mentor.cancelledStatusLabel,
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed right-0 top-0 z-50 h-full w-full max-w-md bg-card border-l border-border shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/20 shrink-0">
          <div>
            <p className="font-bold">{fmtDate(start, lang)} · {fmtTime(start, lang)} – {fmtTime(end, lang)}</p>
            <p className="text-xs text-muted-foreground">{avail.track?.name || t.judge.noTrack} · {dur} {t.mentorsTab.minPerSlot} · {t.mentor.slotsCount(total)}</p>
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

        <div className="grid grid-cols-3 divide-x divide-border border-b border-border shrink-0">
          {[
            { label: t.mentor.freeLabel, val: Math.max(0, total - active.length), cls: 'text-teal-600' },
            { label: t.mentor.pendingLabel, val: pending, cls: 'text-amber-600' },
            { label: t.mentor.confirmedLabel, val: accepted, cls: 'text-blue-600' },
          ].map(s => (
            <div key={s.label} className="py-3 text-center">
              <p className={`text-xl font-bold ${s.cls}`}>{s.val}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {slotGrid.map((s, i) => {
            const isOccupied = !!s.req
            const isPassed = s.passed

            return (
              <div key={i} className={`flex flex-col p-4 rounded-xl border transition-all ${isPassed ? 'bg-muted/30 border-border/50 grayscale' : 'border-border bg-card shadow-sm hover:border-primary/20'}`}>
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-2 rounded-lg ${isPassed ? 'bg-muted' : 'bg-primary/10'}`}>
                      <Clock className={`h-4 w-4 ${isPassed ? 'text-muted-foreground' : 'text-primary'}`} />
                    </div>
                    <div>
                      <p className={`font-bold text-sm ${isPassed ? 'text-muted-foreground' : ''}`}>{s.time}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {isPassed ? t.mentor.timePassed : s.req ? (s.req.status === 'blocked' ? t.mentor.blockedLabel : `${t.mentor.requestLabel}${s.req.team?.name || '...'}`) : t.mentor.freeSlotLabel}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isOccupied && s.req && (
                      <div className="flex flex-col items-end gap-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isPassed && s.req.status === 'accepted' ? 'bg-muted text-muted-foreground' : (STATUS_BADGE[s.req.status] || 'bg-muted')}`}>
                          {isPassed && s.req.status === 'accepted' ? t.mentor.timePassed : (STATUS_LABEL[s.req.status] || s.req.status)}
                        </span>
                      </div>
                    )}
                    {!isOccupied && !isPassed && (
                      <button onClick={() => blockMut.mutate({ id: avail.id, start: s.dt.toISOString(), d: dur })} disabled={blockMut.isPending}
                        className="text-[10px] font-bold px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors flex items-center gap-1">
                        {t.mentor.blockAction}
                      </button>
                    )}
                    {s.req?.status === 'blocked' && !isPassed && (
                      <button onClick={() => unblockMut.mutate(s.req.id)} disabled={unblockMut.isPending}
                        className="text-[10px] font-bold px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors">{t.mentor.unblockAction}</button>
                    )}
                  </div>
                </div>

                {s.req?.status === 'pending' && !isPassed && (
                  <div className="mt-3 pt-3 border-t border-border space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">{t.mentor.meetingLinkLabel}</label>
                      <input type="url" placeholder="https://meet.google.com/..." value={links[s.req.id] || ''}
                        onChange={e => setLinks(p => ({ ...p, [s.req.id]: e.target.value }))}
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:border-primary" />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => acceptMut.mutate({ id: s.req.id, link: links[s.req.id] || '' })} disabled={!links[s.req.id] || acceptMut.isPending}
                        className="flex-1 rounded-lg bg-primary text-primary-foreground text-xs font-bold py-2 disabled:opacity-40 hover:bg-primary/90 transition-colors">
                        {t.mentor.acceptAction}
                      </button>
                      <button onClick={() => rejectMut.mutate(s.req.id)} disabled={rejectMut.isPending}
                        className="flex-1 rounded-lg bg-destructive/10 text-destructive text-xs font-bold py-2 hover:bg-destructive/20 transition-colors">
                        {t.mentor.declineAction}
                      </button>
                    </div>
                  </div>
                )}

                {s.req?.status === 'accepted' && s.req.meetingLink && !isPassed && (
                  <div className="mt-2 pt-2 border-t border-border/50">
                    <a href={s.req.meetingLink} target="_blank" rel="noreferrer" className="text-blue-600 flex items-center gap-1 text-[10px] underline font-medium">
                      <Video className="h-3.5 w-3.5" /> {t.mentor.openMeetingLink}
                    </a>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <ConfirmDialog open={deleteConfirm} title={t.mentor.deleteAvailabilityTitle}
        message={pending + accepted > 0 ? t.mentor.deleteAvailabilityHasBookings(pending + accepted) : t.mentor.deleteAvailabilityConfirm(`${fmtTime(start, lang)} – ${fmtTime(end, lang)}`)}
        confirmLabel={t.mentor.deleteConfirmBtn} cancelLabel={t.actions.cancel} danger
        onConfirm={() => { deleteMut.mutate(); setDeleteConfirm(false) }}
        onCancel={() => setDeleteConfirm(false)} />
    </>
  )
}
