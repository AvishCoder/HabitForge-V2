export const HABIT_COLORS = [
  { name: 'Indigo',  value: '#6366f1' },
  { name: 'Rose',    value: '#f43f5e' },
  { name: 'Amber',   value: '#f59e0b' },
  { name: 'Emerald', value: '#10b981' },
  { name: 'Sky',     value: '#0ea5e9' },
  { name: 'Violet',  value: '#8b5cf6' },
  { name: 'Pink',    value: '#ec4899' },
  { name: 'Teal',    value: '#14b8a6' },
]

export const DEFAULT_ICON = '🎯'

export const FREQUENCY_DAYS = [
  { value: 0, label: 'Sun', short: 'S' },
  { value: 1, label: 'Mon', short: 'M' },
  { value: 2, label: 'Tue', short: 'T' },
  { value: 3, label: 'Wed', short: 'W' },
  { value: 4, label: 'Thu', short: 'T' },
  { value: 5, label: 'Fri', short: 'F' },
  { value: 6, label: 'Sat', short: 'S' },
]

export const XP_RULES = {
  COMPLETION: 10,
  PERFECT_DAY: 25,
  STREAK_7: 50,
  STREAK_30: 150,
  MULTIPLIER_THRESHOLD: 7,
  MULTIPLIER: 1.5,
}

export const RANKS = [
  { name: 'Beginner',   min: 0,    perk: 'Default features' },
  { name: 'Consistent', min: 200,  perk: 'Custom reminder per habit' },
  { name: 'Disciplined', min: 600, perk: 'Habit categories' },
  { name: 'Elite',      min: 1500, perk: 'Dark theme unlock' },
  { name: 'Master',     min: 3500, perk: 'Streak Shield — protect your streak' },
  { name: 'Legend',     min: 7000, perk: 'Custom accent color' },
]

export const HEATMAP_DAYS = 30
