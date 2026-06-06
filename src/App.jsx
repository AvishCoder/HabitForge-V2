import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { useHabitsStore } from './store/habitsStore'
import { useXPStore } from './store/xpStore'
import { useThemeStore } from './store/themeStore'
import { requestNotificationPermission, startNotificationScheduler } from './utils/notifications'

import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import HabitForm from './pages/HabitForm'
import HabitDetail from './pages/HabitDetail'
import CalendarPage from './pages/Calendar'
import Stats from './pages/Stats'
import Settings from './pages/Settings'
import Profile from './pages/Profile'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import NameSetupModal from './components/NameSetupModal'
import SchemaCheck from './components/SchemaCheck'
import ToastHost from './components/ToastHost'

export default function App() {
  const { user, profile, initialized, initAuth } = useAuthStore()
  const { fetchHabits, fetchCompletions } = useHabitsStore()
  const { fetchProfile } = useXPStore()
  const initTheme = useThemeStore((s) => s.init)

  useEffect(() => {
    initAuth()
    initTheme()
  }, [initAuth, initTheme])

  useEffect(() => {
    if (user) {
      fetchProfile(user.id)
      fetchHabits()
      fetchCompletions()
    }
  }, [user, fetchProfile, fetchHabits, fetchCompletions])

  useEffect(() => {
    if (user) {
      requestNotificationPermission()
      startNotificationScheduler(user.id)
    }
  }, [user])

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
      </div>
    )
  }

  const showNameSetup = user && profile && !profile.display_name

  return (
    <SchemaCheck>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/habits/new" element={<HabitForm mode="create" />} />
          <Route path="/habits/:id" element={<HabitDetail />} />
          <Route path="/habits/:id/edit" element={<HabitForm mode="edit" />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
        <Route path="/" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {showNameSetup && <NameSetupModal />}
      <ToastHost />
    </SchemaCheck>
  )
}
