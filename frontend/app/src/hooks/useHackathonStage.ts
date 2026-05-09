import { useMemo } from 'react'
import type { Hackathon, StageType } from '@/types/api.types'

export function useHackathonStage(hackathon?: Hackathon) {
  return useMemo(() => {
    if (!hackathon?.stages || hackathon.stages.length === 0) {
      return {
        activeStage: null,
        canRegister: false,
        canSubmit: false,
        canBookMentor: false,
        canViewResults: false,
      }
    }

    const now = new Date()

    // Sort by orderIndex
    const sorted = [...hackathon.stages].sort(
      (a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0),
    )

    // 1. "currentStage" — stage whose date window CONTAINS now.
    //    Used for permissions (canRegister, canSubmit, etc.)
    const currentStage = sorted.find((s) => {
      const start = new Date(s.startDate)
      const end = new Date(s.endDate)
      return now >= start && now <= end
    })

    // 2. "displayStage" — what to show in the UI badge.
    //    Falls back to the most recently ended stage, then to the next upcoming one.
    let displayStage = currentStage

    if (!displayStage) {
      const past = sorted.filter((s) => new Date(s.endDate) < now)
      if (past.length > 0) displayStage = past[past.length - 1]
    }

    if (!displayStage) {
      displayStage = sorted[0]
    }

    // Permissions are based on CURRENT stage only — a past REGISTRATION
    // stage must NOT re-enable canRegister.
    const type: StageType = currentStage?.type ?? 'CUSTOM'

    return {
      activeStage: displayStage,
      canRegister:    type === 'REGISTRATION',
      canSubmit:      type === 'HACKING',
      canBookMentor:  type === 'HACKING',
      canViewResults: type === 'JUDGING' || type === 'FINISHED' || hackathon.status === 'ARCHIVED',
    }
  }, [hackathon])
}

