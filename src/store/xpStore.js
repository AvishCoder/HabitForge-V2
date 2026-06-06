import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export const useXPStore = create((set, get) => ({
  totalXP: 0,
  xpLog: [],
  loading: false,

  fetchProfile: async (userId) => {
    set({ loading: true })
    try {
      // total XP from xp_log
      const { data: logs, error: logErr } = await supabase
        .from('xp_log')
        .select('amount')
        .eq('user_id', userId)
      if (logErr) throw logErr
      const total = (logs || []).reduce((sum, r) => sum + (r.amount || 0), 0)
      set({ totalXP: total })

      // recent log
      const { data: recent } = await supabase
        .from('xp_log')
        .select('*')
        .eq('user_id', userId)
        .order('earned_at', { ascending: false })
        .limit(50)
      set({ xpLog: recent || [] })
    } catch (e) {
      console.error('fetchProfile (xp)', e)
    } finally {
      set({ loading: false })
    }
  },

  xpThisWeek: () => {
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
    return get()
      .xpLog.filter((l) => new Date(l.earned_at).getTime() >= oneWeekAgo)
      .reduce((sum, l) => sum + (l.amount || 0), 0)
  },
}))
