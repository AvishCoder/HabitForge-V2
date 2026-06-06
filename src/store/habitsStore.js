import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { useXPStore } from './xpStore'
import { useAuthStore } from './authStore'
import { todayISO, dayOfWeek } from '../utils/dateHelpers'
import { XP_RULES } from '../lib/constants'
import { applyMultiplier, calcPerfectDay } from '../utils/xpCalc'
import { calcStreak } from '../utils/streakCalc'

export const useHabitsStore = create((set, get) => ({
  habits: [],
  completions: [],
  loading: false,

  fetchHabits: async () => {
    set({ loading: true })
    try {
      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .eq('is_archived', false)
        .order('created_at', { ascending: true })
      if (error) throw error
      set({ habits: data || [] })
    } catch (e) {
      console.error('fetchHabits', e)
    } finally {
      set({ loading: false })
    }
  },

  fetchCompletions: async () => {
    try {
      const { data, error } = await supabase
        .from('completions')
        .select('*')
        .order('completed_date', { ascending: false })
        .limit(2000)
      if (error) throw error
      set({ completions: data || [] })
    } catch (e) {
      console.error('fetchCompletions', e)
    }
  },

  createHabit: async (payload) => {
    const { user } = useAuthStore.getState()
    if (!user) return { error: 'No user' }
    try {
      const row = {
        user_id: user.id,
        name: payload.name,
        icon: payload.icon,
        color: payload.color,
        frequency_days: payload.frequency_days,
        day_off_enabled: payload.day_off_enabled,
        reminder_time: payload.reminder_time || null,
        is_archived: false,
      }
      const { data, error } = await supabase
        .from('habits')
        .insert(row)
        .select()
        .single()
      if (error) throw error
      set((s) => ({ habits: [...s.habits, data] }))

      if (payload.reminder_time) {
        await supabase.from('notifications').insert({
          user_id: user.id,
          habit_id: data.id,
          reminder_time: payload.reminder_time,
          enabled: true,
        })
      }
      return { data }
    } catch (e) {
      return { error: e.message }
    }
  },

  updateHabit: async (id, patch) => {
    try {
      const { data, error } = await supabase
        .from('habits')
        .update(patch)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      set((s) => ({ habits: s.habits.map((h) => (h.id === id ? data : h)) }))
      return { data }
    } catch (e) {
      return { error: e.message }
    }
  },

  archiveHabit: async (id) => {
    const res = await get().updateHabit(id, { is_archived: true })
    if (res.data) set((s) => ({ habits: s.habits.filter((h) => h.id !== id) }))
    return res
  },

  deleteHabit: async (id) => {
    try {
      const { error } = await supabase.from('habits').delete().eq('id', id)
      if (error) throw error
      set((s) => ({
        habits: s.habits.filter((h) => h.id !== id),
        completions: s.completions.filter((c) => c.habit_id !== id),
      }))
      return {}
    } catch (e) {
      return { error: e.message }
    }
  },

  toggleComplete: async (habitId) => {
    const { user } = useAuthStore.getState()
    if (!user) return { error: 'No user' }
    const today = todayISO()
    const existing = get().completions.find(
      (c) => c.habit_id === habitId && c.completed_date === today
    )
    if (existing && !existing.is_day_off) {
      try {
        const { error } = await supabase.from('completions').delete().eq('id', existing.id)
        if (error) throw error
        set((s) => ({ completions: s.completions.filter((c) => c.id !== existing.id) }))
        await get()._logXP(user.id, -existing.xp_earned, 'Undid completion')
        return {}
      } catch (e) {
        return { error: e.message }
      }
    } else if (existing && existing.is_day_off) {
      const { error } = await supabase.from('completions').delete().eq('id', existing.id)
      if (!error) {
        set((s) => ({ completions: s.completions.filter((c) => c.id !== existing.id) }))
      }
      return error ? { error: error.message } : {}
    } else {
      const habit = get().habits.find((h) => h.id === habitId)
      const completions = get().completions.filter((c) => c.habit_id === habitId)
      const streak = calcStreak(completions, habit?.frequency_days || [0,1,2,3,4,5,6])
      const xp = applyMultiplier(XP_RULES.COMPLETION, streak)
      try {
        const { data, error } = await supabase
          .from('completions')
          .upsert({
            habit_id: habitId,
            user_id: user.id,
            completed_date: today,
            is_day_off: false,
            xp_earned: xp,
          }, { onConflict: 'habit_id,completed_date' })
          .select()
          .single()
        if (error) throw error
        set((s) => {
          const others = s.completions.filter((c) => c.id !== data.id)
          return { completions: [data, ...others] }
        })
        await get()._logXP(user.id, xp, `Completed: ${habit?.name || 'habit'}`)

        if (streak + 1 === 7) await get()._logXP(user.id, XP_RULES.STREAK_7, '7-day streak milestone!')
        if (streak + 1 === 30) await get()._logXP(user.id, XP_RULES.STREAK_30, '30-day streak milestone!')

        const allHabits = get().habits
        const scheduledToday = allHabits.filter((h) => (h.frequency_days || []).includes(dayOfWeek()))
        const todaysDone = get().completions.filter(
          (c) => c.completed_date === today && !c.is_day_off
        )
        if (calcPerfectDay(scheduledToday.length, todaysDone.length + 1)) {
          await get()._logXP(user.id, XP_RULES.PERFECT_DAY, 'Perfect Day bonus!')
        }
        return { data }
      } catch (e) {
        return { error: e.message }
      }
    }
  },

  setDayOff: async (habitId, dateISO = todayISO()) => {
    const { user } = useAuthStore.getState()
    if (!user) return { error: 'No user' }
    try {
      const { data, error } = await supabase
        .from('completions')
        .upsert({
          habit_id: habitId,
          user_id: user.id,
          completed_date: dateISO,
          is_day_off: true,
          xp_earned: 0,
        }, { onConflict: 'habit_id,completed_date' })
        .select()
        .single()
      if (error) throw error
      set((s) => {
        const others = s.completions.filter((c) => c.id !== data.id)
        return { completions: [data, ...others] }
      })
      return { data }
    } catch (e) {
      return { error: e.message }
    }
  },

  _logXP: async (userId, amount, reason) => {
    if (!userId || !amount) return
    try {
      await supabase.from('xp_log').insert({
        user_id: userId,
        amount,
        reason,
        earned_at: new Date().toISOString(),
      })
      await useXPStore.getState().fetchProfile(userId)
    } catch (e) {
      console.error('_logXP', e)
    }
  },
}))
