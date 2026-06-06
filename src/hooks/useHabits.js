import { useMemo, useCallback } from 'react'
import { useHabitsStore } from '../store/habitsStore'
import { todayISO, dayOfWeek } from '../utils/dateHelpers'

export const useHabits = () => {
  const {
    habits,
    completions,
    loading,
    fetchHabits,
    fetchCompletions,
    createHabit,
    updateHabit,
    archiveHabit,
    deleteHabit,
    toggleComplete,
    setDayOff,
  } = useHabitsStore()

  const today = todayISO()
  const todayDay = dayOfWeek()

  const scheduledToday = useMemo(
    () => habits.filter((h) => (h.frequency_days || []).includes(todayDay)),
    [habits, todayDay]
  )

  const completionsByDate = useMemo(() => {
    const map = {}
    for (const c of completions) {
      if (!map[c.completed_date]) map[c.completed_date] = []
      map[c.completed_date].push(c)
    }
    return map
  }, [completions])

  const todaysCompletions = useMemo(
    () => completions.filter((c) => c.completed_date === today),
    [completions, today]
  )

  const completedHabitIds = useMemo(() => {
    const s = new Set()
    for (const c of todaysCompletions) {
      if (!c.is_day_off) s.add(c.habit_id)
    }
    return s
  }, [todaysCompletions])

  const dayOffHabitIds = useMemo(() => {
    const s = new Set()
    for (const c of todaysCompletions) {
      if (c.is_day_off) s.add(c.habit_id)
    }
    return s
  }, [todaysCompletions])

  const todaysProgress = useMemo(() => {
    if (scheduledToday.length === 0) return 0
    const done = scheduledToday.filter((h) => completedHabitIds.has(h.id) || dayOffHabitIds.has(h.id)).length
    return Math.round((done / scheduledToday.length) * 100)
  }, [scheduledToday, completedHabitIds, dayOffHabitIds])

  const getHabit = useCallback((id) => habits.find((h) => h.id === id), [habits])

  const getHabitCompletions = useCallback(
    (id) => completions.filter((c) => c.habit_id === id),
    [completions]
  )

  return {
    habits,
    completions,
    completionsByDate,
    loading,
    fetchHabits,
    fetchCompletions,
    createHabit,
    updateHabit,
    archiveHabit,
    deleteHabit,
    toggleComplete,
    setDayOff,
    scheduledToday,
    todaysCompletions,
    completedHabitIds,
    dayOffHabitIds,
    todaysProgress,
    getHabit,
    getHabitCompletions,
  }
}
