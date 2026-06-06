import { supabase } from '../lib/supabase'
import { format, parseISO } from 'date-fns'

const FALLBACK_ICON = '🔔'

export const isSupported = () => typeof window !== 'undefined' && 'Notification' in window
export const getPermission = () => (isSupported() ? Notification.permission : 'unsupported')

export const requestNotificationPermission = async () => {
  if (!isSupported()) return 'unsupported'
  if (Notification.permission === 'granted' || Notification.permission === 'denied') {
    return Notification.permission
  }
  try {
    const res = await Notification.requestPermission()
    return res
  } catch (e) {
    console.warn('[Notifications] requestPermission failed', e)
    return 'default'
  }
}

const fireSystemNotification = (title, body) => {
  if (!isSupported() || Notification.permission !== 'granted') return false
  try {
    new Notification(title, { body, icon: '/favicon.svg', badge: '/favicon.svg', tag: `hf-${Date.now()}` })
    return true
  } catch (e) {
    console.warn('[Notifications] fire failed', e)
    return false
  }
}

export const testNotification = async (habitName = 'Test habit') => {
  const ok = fireSystemNotification(`${FALLBACK_ICON} ${habitName}`, `Test notification — if you see this, reminders are working!`)
  // Always emit an in-app event so the UI can show a toast fallback
  window.dispatchEvent(new CustomEvent('hf:toast', { detail: { title: `${FALLBACK_ICON} ${habitName}`, body: 'Test notification' } }))
  return ok
}

let userId = null
let habitsCache = []
let intervalId = null
let timeoutId = null
let firedKeys = new Set() // prevent re-firing same reminder on the same day

const fetchHabitsAndNotifs = async (uid) => {
  try {
    const [{ data: habits, error: hErr }, { data: notifs, error: nErr }] = await Promise.all([
      supabase
        .from('habits')
        .select('id, name, icon, color, is_archived, reminder_time')
        .eq('is_archived', false)
        .eq('user_id', uid),
      supabase
        .from('notifications')
        .select('habit_id, reminder_time, enabled')
        .eq('user_id', uid)
        .eq('enabled', true),
    ])
    if (hErr) console.warn('[Notifications] habits query error', hErr)
    if (nErr) console.warn('[Notifications] notifs query error', nErr)
    return { habits: habits || [], notifs: notifs || [] }
  } catch (e) {
    console.error('[Notifications] fetch error', e)
    return { habits: [], notifs: [] }
  }
}

const nowHHMM = () => {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const todayKey = () => format(new Date(), 'yyyy-MM-dd')

const fireForHabit = (habit) => {
  const ok = fireSystemNotification(
    `${habit.icon || FALLBACK_ICON} ${habit.name}`,
    `Time to do your habit — keep your streak going!`
  )
  // Always emit in-app toast (works even if system notif is blocked)
  window.dispatchEvent(new CustomEvent('hf:toast', {
    detail: {
      title: `${habit.icon || FALLBACK_ICON} ${habit.name}`,
      body: 'Time to do your habit — keep your streak going!',
      color: habit.color,
    },
  }))
  return ok
}

const fireDue = async () => {
  if (!userId) return
  if (!isSupported() || Notification.permission !== 'granted') return

  const today = todayKey()
  const hhmm = nowHHMM()
  const fireKey = `${today}-${hhmm}`
  if (firedKeys.has(fireKey)) return

  try {
    const { habits, notifs } = await fetchHabitsAndNotifs(userId)
    habitsCache = habits
    if (!notifs.length) return

    // Mark today as done for these habits to avoid firing twice
    const doneToday = await supabase
      .from('completions')
      .select('habit_id')
      .eq('user_id', userId)
      .eq('completed_date', today)
      .eq('is_day_off', false)
    const doneIds = new Set((doneToday.data || []).map((c) => c.habit_id))

    let fired = 0
    for (const n of notifs) {
      if (n.reminder_time !== hhmm) continue
      const habit = habits.find((h) => h.id === n.habit_id)
      if (!habit || habit.is_archived) continue
      if (doneIds.has(habit.id)) continue
      fireForHabit(habit)
      fired += 1
    }
    if (fired > 0) firedKeys.add(fireKey)
  } catch (e) {
    console.error('[Notifications] fireDue error', e)
  }
}

const scheduleNextTick = () => {
  if (timeoutId) clearTimeout(timeoutId)
  // Align to the next minute boundary, plus 1.5s buffer so we land inside the minute
  const now = new Date()
  const msToNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds() + 1500
  timeoutId = setTimeout(() => {
    fireDue()
    // also fire the backup poll
    scheduleNextTick()
  }, Math.max(1000, msToNextMinute))
}

const startBackupPoll = () => {
  if (intervalId) clearInterval(intervalId)
  // Backup poll every 60s in case the precise timeout drifts or is throttled
  intervalId = setInterval(fireDue, 60 * 1000)
}

const refreshCache = async () => {
  if (!userId) return
  await fetchHabitsAndNotifs(userId)
}

export const startNotificationScheduler = (uid) => {
  if (intervalId) clearInterval(intervalId)
  if (timeoutId) clearTimeout(timeoutId)
  userId = uid
  firedKeys = new Set()

  if (!isSupported()) {
    console.info('[Notifications] Browser does not support notifications')
    return
  }
  if (Notification.permission === 'denied') {
    console.info('[Notifications] Permission denied by user')
    return
  }

  // Reset fired-keys at midnight
  const checkMidnight = () => {
    const today = todayKey()
    for (const k of [...firedKeys]) {
      if (!k.startsWith(today)) firedKeys.delete(k)
    }
  }
  setInterval(checkMidnight, 60 * 1000)

  // Refresh cache every 5 minutes so newly-created habits show up
  setInterval(refreshCache, 5 * 60 * 1000)
  refreshCache()

  scheduleNextTick()
  startBackupPoll()
  // also do an immediate check in case we mounted at the right minute
  setTimeout(fireDue, 1500)

  console.info('[Notifications] Scheduler started for user', uid)
}

export const stopNotificationScheduler = () => {
  if (intervalId) clearInterval(intervalId)
  if (timeoutId) clearTimeout(timeoutId)
  intervalId = null
  timeoutId = null
  userId = null
  habitsCache = []
  firedKeys = new Set()
}

export const getHabitsWithReminders = async (uid) => {
  return fetchHabitsAndNotifs(uid)
}
