import { create } from 'zustand'

const STORAGE_KEY = 'hf-theme'

const getInitial = () => {
  if (typeof window === 'undefined') return 'light'
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'light' || saved === 'dark' || saved === 'system') return saved
  } catch {}
  return 'light'
}

const applyTheme = (pref) => {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  const resolved = pref === 'system'
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : pref
  root.classList.toggle('dark', resolved === 'dark')
  root.setAttribute('data-theme', resolved)
}

export const useThemeStore = create((set, get) => ({
  preference: getInitial(), // 'light' | 'dark' | 'system'
  resolved: 'light',

  init: () => {
    applyTheme(get().preference)
    set({ resolved: resolve(get().preference) })
    // watch system changes when preference is 'system'
    if (window.matchMedia) {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      const handler = () => {
        if (get().preference === 'system') {
          applyTheme('system')
          set({ resolved: resolve('system') })
        }
      }
      mq.addEventListener?.('change', handler)
    }
  },

  setPreference: (pref) => {
    try { localStorage.setItem(STORAGE_KEY, pref) } catch {}
    applyTheme(pref)
    set({ preference: pref, resolved: resolve(pref) })
  },

  toggle: () => {
    const next = get().resolved === 'dark' ? 'light' : 'dark'
    get().setPreference(next)
  },
}))

const resolve = (pref) => {
  if (pref !== 'system') return pref
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}
