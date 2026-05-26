import { useMemo, useState, useEffect } from 'react'
import type { Hackathon, StageType } from '@/types/api.types'
import { useI18n } from '@/i18n'

/** Live clock that ticks every minute — forces stage recalculation without page refresh */
function useNow(intervalMs = 60_000): Date {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
  return now
}

const KNOWN_TYPES = new Set<string>(['REGISTRATION', 'HACKING', 'PRESENTATION', 'JUDGING', 'FINISHED'])

function resolveType(stage: { type?: string; name?: string } | undefined): StageType {
  if (!stage) return 'CUSTOM'
  const t = stage.type ?? ''
  if (t && t !== 'CUSTOM' && KNOWN_TYPES.has(t)) return t as StageType
  const n = (stage.name ?? '').toUpperCase()
  if (n && KNOWN_TYPES.has(n)) return n as StageType
  return 'CUSTOM'
}

export function useHackathonStage(hackathon?: Hackathon) {
  const now = useNow()   // re-evaluates every minute automatically
  const { t } = useI18n()

  const getLockMessage = (type: StageType): string => {
    switch (type) {
      case 'REGISTRATION': return t.dashboard.lockMessages.registration
      case 'HACKING':      return t.dashboard.lockMessages.hacking
      case 'JUDGING':      return t.dashboard.lockMessages.judging
      case 'FINISHED':     return t.dashboard.lockMessages.finished
      default:             return t.dashboard.lockMessages.upcoming
    }
  }

  return useMemo(() => {
    if (!hackathon?.stages || hackathon.stages.length === 0) {
      return {
        activeStage: null,
        activeStageType: 'CUSTOM' as StageType,
        isFinished: false,
        canRegister: false,
        canSubmit: false,
        canBookMentor: false,
        canScore: false,
        canViewResults: false,
        lockMessage: getLockMessage('CUSTOM'),
      }
    }

    // Sort by orderIndex
    const sorted = [...hackathon.stages].sort(
      (a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0),
    )

    // 1. Current stage — whose date window CONTAINS now
    const currentStage = sorted.find((s) => {
      const start = new Date(s.startDate)
      const end = new Date(s.endDate)
      return now >= start && now <= end
    })

    // 2. Display stage — fallback to most recently ended, then first upcoming
    let displayStage = currentStage
    if (!displayStage) {
      const past = sorted.filter((s) => new Date(s.endDate) < now)
      if (past.length > 0) displayStage = past[past.length - 1]
    }
    if (!displayStage) displayStage = sorted[0]

    // 3. Resolve effective type (handles NULL/CUSTOM type in DB by falling back to name)
    const type = resolveType(currentStage)

    return {
      activeStage: displayStage,
      activeStageType: type,
      isFinished:     type === 'FINISHED',
      canRegister:    type === 'REGISTRATION',
      canSubmit:      type === 'HACKING',
      canBookMentor:  type === 'HACKING',
      canScore:       type === 'JUDGING',
      canViewResults: type === 'JUDGING' || type === 'FINISHED' || hackathon.status === 'ARCHIVED',
      lockMessage:    getLockMessage(type),
    }
  }, [hackathon, now, t])
}
