import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Calendar, BarChart3, Settings, Plus, User } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useThemeStore } from '../store/themeStore'
import { Sun, Moon } from 'lucide-react'

const navItems = [
  { to: '/dashboard', label: 'Today',     icon: LayoutDashboard },
  { to: '/calendar',  label: 'Calendar',  icon: Calendar },
  { to: '/stats',     label: 'Stats',     icon: BarChart3 },
  { to: '/profile',   label: 'Profile',   icon: User },
]

export default function Layout() {
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const theme = useThemeStore()
  const isDark = theme.resolved === 'dark'

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24 md:pb-6 transition-colors">
      {/* Top bar — desktop */}
      <header className="hidden md:flex items-center justify-between px-8 py-4 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 sticky top-0 z-20">
        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white font-bold">H</div>
          <span className="font-bold text-slate-800 dark:text-slate-100 text-lg">HabitForge</span>
        </button>
        <nav className="flex items-center gap-1">
          {navItems.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              className={({ isActive }) =>
                `px-4 py-2 rounded-xl text-sm font-semibold transition ${
                  isActive ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`
              }
            >
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <button
            onClick={() => theme.setPreference(isDark ? 'light' : 'dark')}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
            title={isDark ? 'Switch to light' : 'Switch to dark'}
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <button onClick={() => navigate('/settings')} className="text-right hidden lg:block">
            <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">{profile?.display_name || 'You'}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Level up your habits</div>
          </button>
          <button
            onClick={() => navigate('/profile')}
            className="w-9 h-9 rounded-full bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 flex items-center justify-center font-bold"
          >
            {(profile?.display_name || 'U')[0].toUpperCase()}
          </button>
        </div>
      </header>

      {/* Mobile top bar */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white font-bold">H</div>
          <span className="font-bold text-slate-800 dark:text-slate-100">HabitForge</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => theme.setPreference(isDark ? 'light' : 'dark')}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <button
            onClick={() => navigate('/profile')}
            className="w-9 h-9 rounded-full bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 flex items-center justify-center font-bold"
          >
            {(profile?.display_name || 'U')[0].toUpperCase()}
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 md:px-8 md:py-8">
        <Outlet />
      </main>

      {/* Floating add button — mobile */}
      <button
        onClick={() => navigate('/habits/new')}
        className="md:hidden fixed bottom-20 right-5 w-14 h-14 rounded-full bg-brand-600 text-white shadow-lg shadow-brand-600/30 flex items-center justify-center z-30 active:scale-95 transition"
        aria-label="Add habit"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Bottom nav — mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 z-20 safe-area-pb">
        <div className="grid grid-cols-4 max-w-md mx-auto">
          {navItems.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-2.5 gap-0.5 text-xs font-semibold transition ${
                  isActive ? 'text-brand-600 dark:text-brand-400' : 'text-slate-500 dark:text-slate-400'
                }`
              }
            >
              <n.icon className="w-5 h-5" />
              {n.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
