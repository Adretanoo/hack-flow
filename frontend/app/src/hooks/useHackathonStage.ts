import { useMemo } from 'react'
import type { Hackathon } from '@/types/api.types'

export function useHackathonStage(hackathon?: Hackathon) {
  return useMemo(() => {
    if (!hackathon?.stages) {
      return {
        activeStage: null,
        canRegister: false,
        canSubmit: false,
        canBookMentor: false,
        canViewResults: false,
      }
    }

    const activeStage = hackathon.stages.find((s: any) => s.status === 'ACTIVE')
    const type = activeStage?.type || activeStage?.name // fallback to name if type is undefined

    return {
      activeStage,
      canRegister: type === 'REGISTRATION',
      canSubmit: type === 'HACKING',
      canBookMentor: type === 'HACKING',
      canViewResults: type === 'POST_HACKATHON' || type === 'FINISHED' || hackathon.status === 'ARCHIVED',
    }
  }, [hackathon])
}
