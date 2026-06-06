import { useMemo } from 'react'
import { useXPStore } from '../store/xpStore'
import { calcRank } from '../utils/xpCalc'

export const useXP = () => {
  const { totalXP, xpLog, fetchProfile, xpThisWeek } = useXPStore()
  const rank = useMemo(() => calcRank(totalXP), [totalXP])
  return { totalXP, xpLog, rank, fetchProfile, xpThisWeek }
}
