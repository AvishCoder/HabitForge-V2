import { useMemo } from 'react'
import { calcStreak, calcBestStreak } from '../utils/streakCalc'

export const useStreak = (completions, schedule = [0,1,2,3,4,5,6]) => {
  return useMemo(() => ({
    current: calcStreak(completions, schedule),
    best: calcBestStreak(completions, schedule),
  }), [completions, schedule])
}
