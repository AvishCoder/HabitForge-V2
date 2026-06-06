import { RANKS, XP_RULES } from '../lib/constants'

export const calcRank = (totalXP) => {
  let current = RANKS[0]
  for (const r of RANKS) {
    if (totalXP >= r.min) current = r
  }
  const idx = RANKS.findIndex((r) => r.name === current.name)
  const next = RANKS[idx + 1] || null
  const prevMin = current.min
  const nextMin = next ? next.min : current.min
  const progress = next
    ? Math.min(100, Math.round(((totalXP - prevMin) / (nextMin - prevMin)) * 100))
    : 100
  return { current, next, progress, xpIntoRank: totalXP - prevMin, xpForNext: next ? nextMin - prevMin : 0 }
}

export const applyMultiplier = (xp, currentStreak) => {
  if (currentStreak >= XP_RULES.MULTIPLIER_THRESHOLD) {
    return Math.round(xp * XP_RULES.MULTIPLIER)
  }
  return xp
}

export const calcPerfectDay = (habitsCount, completedCount) => {
  return habitsCount > 0 && completedCount === habitsCount
}
