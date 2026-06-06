import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export const useAuthStore = create((set, get) => ({
  user: null,
  profile: null,
  initialized: false,
  loading: false,

  initAuth: async () => {
    if (get().initialized) return
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user || null
      set({ user, initialized: true })
      if (user) {
        await get().fetchProfile(user.id)
      }
      supabase.auth.onAuthStateChange(async (_event, session) => {
        const u = session?.user || null
        set({ user: u })
        if (u) await get().fetchProfile(u.id)
      })
    } catch (e) {
      console.error('initAuth error', e)
      set({ initialized: true })
    }
  },

  fetchProfile: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()
      if (error) throw error
      set({ profile: data })
    } catch (e) {
      console.error('fetchProfile error', e)
    }
  },

  updateProfile: async (patch) => {
    const { user } = get()
    if (!user) return { error: 'No user' }
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update(patch)
        .eq('id', user.id)
        .select()
        .single()
      if (error) throw error
      set({ profile: data })
      return { data }
    } catch (e) {
      return { error: e.message }
    }
  },

  signUp: async (email, password) => {
    set({ loading: true })
    try {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) throw error
      return { data }
    } catch (e) {
      return { error: e.message }
    } finally {
      set({ loading: false })
    }
  },

  signIn: async (email, password) => {
    set({ loading: true })
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      return { data }
    } catch (e) {
      return { error: e.message }
    } finally {
      set({ loading: false })
    }
  },

  signInWithGoogle: async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin },
      })
      if (error) throw error
      return { data }
    } catch (e) {
      return { error: e.message }
    }
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null, profile: null })
    // Clear other stores
    try {
      const { useHabitsStore } = await import('./habitsStore')
      const { useXPStore } = await import('./xpStore')
      useHabitsStore.setState({ habits: [], completions: [] })
      useXPStore.setState({ totalXP: 0, xpLog: [] })
    } catch {}
  },

  deleteAccount: async () => {
    const { user } = get()
    if (!user) return { error: 'No user' }
    try {
      // delete all related data (RLS scoped to user)
      await supabase.from('completions').delete().eq('user_id', user.id)
      await supabase.from('notifications').delete().eq('user_id', user.id)
      await supabase.from('xp_log').delete().eq('user_id', user.id)
      await supabase.from('habits').delete().eq('user_id', user.id)
      await supabase.from('user_profiles').delete().eq('id', user.id)
      await supabase.auth.signOut()
      set({ user: null, profile: null })
      return {}
    } catch (e) {
      return { error: e.message }
    }
  },
}))
