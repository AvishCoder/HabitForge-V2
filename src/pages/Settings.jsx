import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Settings as SettingsIcon, Bell, LogOut, Trash2, Save, Mail, ShieldCheck, AlertTriangle, Clock, Sun, Moon, Monitor, BellRing, BellOff, CheckCircle2, XCircle, Send, Plus } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useHabits } from '../hooks/useHabits'
import { useThemeStore } from '../store/themeStore'
import { useXP } from '../hooks/useXP'
import { isSupported, getPermission, requestNotificationPermission, testNotification, startNotificationScheduler, stopNotificationScheduler } from '../utils/notifications'
import { formatTime } from '../utils/dateHelpers'
import Modal from '../components/Modal'

const THEME_OPTIONS = [
  { value: 'light',  label: 'Light',  icon: Sun },
  { value: 'dark',   label: 'Dark',   icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
]

export default function Settings() {
  const navigate = useNavigate()
  const { user, profile, updateProfile, signOut, deleteAccount } = useAuth()
  const { habits } = useHabits()
  const { rank } = useXP()
  const theme = useThemeStore()
  const [name, setName] = useState('')
  const [defaultTime, setDefaultTime] = useState('')
  const [notifSupported, setNotifSupported] = useState(true)
  const [notifPermission, setNotifPermission] = useState('default')
  const [saved, setSaved] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  useEffect(() => {
    if (profile) {
      setName(profile.display_name || '')
      setDefaultTime(profile.default_reminder_time || '')
    }
  }, [profile])

  useEffect(() => {
    setNotifSupported(isSupported())
    setNotifPermission(getPermission())
  }, [])

  const habitsWithReminders = useMemo(
    () => habits.filter((h) => h.reminder_time && !h.is_archived),
    [habits]
  )

  const onSave = async () => {
    await updateProfile({
      display_name: name.trim(),
      default_reminder_time: defaultTime || null,
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 1800)
  }

  const enableNotifications = async () => {
    const res = await requestNotificationPermission()
    setNotifPermission(res)
    if (res === 'granted' && user) {
      startNotificationScheduler(user.id)
    }
  }

  const onTest = () => {
    testNotification('Test reminder')
  }

  const onDisable = () => {
    stopNotificationScheduler()
  }

  const onSignOut = async () => {
    await signOut()
  }

  const onDelete = async () => {
    setDeleting(true)
    setDeleteError('')
    const { error } = await deleteAccount()
    setDeleting(false)
    if (error) setDeleteError(error)
  }

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <SettingsIcon className="w-6 h-6 text-brand-600" />
        <h1 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">Settings</h1>
      </div>

      {/* Profile */}
      <div className="card p-5 space-y-4">
        <h3 className="font-bold text-slate-800 dark:text-slate-100">Profile</h3>
        <div>
          <label className="label">Display name</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} maxLength={32} />
        </div>
        <div>
          <label className="label">Email</label>
          <div className="input flex items-center gap-2 bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 cursor-not-allowed">
            <Mail className="w-4 h-4" /> {user?.email}
          </div>
        </div>
        <div>
          <label className="label flex items-center gap-1.5">
            <Clock className="w-4 h-4" /> Default reminder time
          </label>
          <input
            type="time"
            className="input"
            value={defaultTime}
            onChange={(e) => setDefaultTime(e.target.value)}
          />
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Pre-fills the reminder time for new habits</p>
        </div>
        <button onClick={onSave} className="btn-primary">
          <Save className="w-4 h-4" /> {saved ? 'Saved!' : 'Save changes'}
        </button>
      </div>

      {/* Appearance */}
      <div className="card p-5 space-y-3">
        <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          {theme.resolved === 'dark' ? <Moon className="w-5 h-5 text-brand-500" /> : <Sun className="w-5 h-5 text-amber-500" />}
          Appearance
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {THEME_OPTIONS.map((opt) => {
            const active = theme.preference === opt.value
            const Icon = opt.icon
            return (
              <button
                key={opt.value}
                onClick={() => theme.setPreference(opt.value)}
                className={`p-3 rounded-xl border-2 transition flex flex-col items-center gap-1.5 font-semibold text-sm ${
                  active
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <Icon className="w-5 h-5" />
                {opt.label}
              </button>
            )
          })}
        </div>
        {['Elite', 'Master', 'Legend'].includes(rank.current.name) ? (
          <p className="text-xs text-emerald-600 dark:text-emerald-400">✓ {rank.current.name} perk: dark theme unlocked</p>
        ) : (
          <p className="text-xs text-slate-500 dark:text-slate-400">Reach Elite rank (1,500 XP) to officially unlock dark theme</p>
        )}
      </div>

      {/* Notifications */}
      <div className="card p-5 space-y-4">
        <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Bell className="w-5 h-5 text-brand-600" /> Notifications
        </h3>

        {/* Status */}
        <div className="space-y-2">
          <StatusRow
            label="Browser support"
            ok={notifSupported}
            trueText="Available"
            falseText="Not supported in this browser"
          />
          <StatusRow
            label="Permission"
            ok={notifPermission === 'granted'}
            pending={notifPermission === 'default'}
            trueText="Granted"
            pendingText="Not requested yet"
            falseText={
              notifPermission === 'denied'
                ? 'Blocked — enable in your browser site settings'
                : notifPermission === 'unsupported'
                  ? 'Not supported'
                  : 'Unknown'
            }
          />
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">
          {notifPermission !== 'granted' && notifSupported && (
            <button onClick={enableNotifications} className="btn-primary">
              <BellRing className="w-4 h-4" /> Enable notifications
            </button>
          )}
          {notifPermission === 'granted' && (
            <>
              <button onClick={onTest} className="btn-secondary">
                <Send className="w-4 h-4" /> Send test notification
              </button>
              <button onClick={onDisable} className="btn-secondary">
                <BellOff className="w-4 h-4" /> Stop scheduler
              </button>
            </>
          )}
        </div>

        {/* Reminders list */}
        <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">Active reminders</h4>
            <span className="text-xs text-slate-500 dark:text-slate-400">{habitsWithReminders.length} set</span>
          </div>
          {habitsWithReminders.length === 0 ? (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-center">
              <p className="text-sm text-slate-500 dark:text-slate-400">No reminders set yet.</p>
              <button onClick={() => navigate('/habits/new')} className="btn-primary mt-3 text-xs">
                <Plus className="w-3.5 h-3.5" /> Add a habit with a reminder
              </button>
            </div>
          ) : (
            <div className="space-y-1.5">
              {habitsWithReminders.map((h) => (
                <button
                  key={h.id}
                  onClick={() => navigate(`/habits/${h.id}/edit`)}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 text-left transition"
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
                    style={{ backgroundColor: `${h.color}1a` }}
                  >
                    {h.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-800 dark:text-slate-100 text-sm truncate">{h.name}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Daily at {formatTime(h.reminder_time)}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3">
          <strong>How it works:</strong> when a habit's reminder time matches the current time, a browser
          notification fires (and an in-app toast appears at the top-right). The tab must be open.
          For background notifications on mobile, wire up a Service Worker + Push API.
        </div>
      </div>

      {/* Account */}
      <div className="card p-5 space-y-2">
        <h3 className="font-bold text-slate-800 dark:text-slate-100">Account</h3>
        <button onClick={() => navigate('/profile')} className="w-full btn-secondary justify-start">
          <Save className="w-4 h-4" /> View profile
        </button>
        <button onClick={onSignOut} className="w-full btn-secondary justify-start">
          <LogOut className="w-4 h-4" /> Sign out
        </button>
      </div>

      {/* Danger zone */}
      <div className="card p-5 border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 space-y-2">
        <h3 className="font-bold text-rose-700 dark:text-rose-400 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" /> Danger zone
        </h3>
        <p className="text-sm text-rose-700/80 dark:text-rose-300/80">
          This permanently deletes your account, all habits, completions, and XP history. This can't be undone.
        </p>
        <button onClick={() => setConfirmDelete(true)} className="btn-danger">
          <Trash2 className="w-4 h-4" /> Delete all my data
        </button>
      </div>

      <Modal open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Delete all data?">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-6 h-6 text-rose-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-slate-700 dark:text-slate-200">
              This will permanently delete your profile, habits, completions, and XP log. You'll be signed out immediately.
            </p>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">Type-confirm by tapping Delete below.</p>
          </div>
        </div>
        {deleteError && (
          <div className="text-sm text-rose-600 bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900 rounded-xl px-3 py-2 mt-3">{deleteError}</div>
        )}
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={() => setConfirmDelete(false)} className="btn-secondary">Cancel</button>
          <button onClick={onDelete} disabled={deleting} className="btn-danger">
            {deleting ? 'Deleting…' : 'Yes, delete everything'}
          </button>
        </div>
      </Modal>
    </div>
  )
}

function StatusRow({ label, ok, pending, trueText, falseText, pendingText }) {
  return (
    <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
      <div className="flex items-center gap-2.5 min-w-0">
        {ok ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
        ) : pending ? (
          <Clock className="w-5 h-5 text-amber-500 shrink-0" />
        ) : (
          <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
        )}
        <div className="min-w-0">
          <div className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{label}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
            {ok ? trueText : pending ? pendingText : falseText}
          </div>
        </div>
      </div>
    </div>
  )
}
