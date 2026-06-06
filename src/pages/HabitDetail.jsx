import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Pencil, Archive, Trash2, Check, Moon } from 'lucide-react'
import { useState } from 'react'
import { format } from 'date-fns'
import { useHabits } from '../hooks/useHabits'
import { useStreak } from '../hooks/useStreak'
import { formatTime, weekDays } from '../utils/dateHelpers'
import { isDayScheduled } from '../utils/streakCalc'
import HeatMap from '../components/HeatMap'
import WeekChart from '../components/WeekChart'
import Modal from '../components/Modal'

export default function HabitDetail() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { getHabit, getHabitCompletions, archiveHabit, deleteHabit, toggleComplete, setDayOff, completedHabitIds, dayOffHabitIds } = useHabits()
  const habit = getHabit(id)
  const [confirmArchive, setConfirmArchive] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  if (!habit) {
    return (
      <div className="card p-6 text-center text-slate-500">
        Habit not found.
        <button onClick={() => navigate('/dashboard')} className="btn-primary mt-4">Back</button>
      </div>
    )
  }

  const completions = getHabitCompletions(id)
  const { current, best } = useStreak(completions, habit.frequency_days || [0,1,2,3,4,5,6])
  const isDone = completedHabitIds.has(habit.id)
  const isDayOff = dayOffHabitIds.has(habit.id)
  const totalDone = completions.filter((c) => !c.is_day_off).length

  // Weekly bar chart — last 7 days
  const days = weekDays(new Date())
  const completionMap = completions.reduce((acc, c) => {
    acc[c.completed_date] = c
    return acc
  }, {})
  const weekData = days.map((d) => {
    const key = format(d, 'yyyy-MM-dd')
    const scheduled = isDayScheduled(d, habit.frequency_days || [0,1,2,3,4,5,6])
    const entry = completionMap[key]
    let value = 0
    if (entry && !entry.is_day_off) value = 1
    return {
      label: format(d, 'EEE'),
      value: scheduled ? value : 0,
      scheduled,
    }
  })

  const onArchive = async () => {
    await archiveHabit(habit.id)
    navigate('/dashboard')
  }
  const onDelete = async () => {
    await deleteHabit(habit.id)
    navigate('/dashboard')
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 flex-1 truncate">{habit.name}</h1>
        <button onClick={() => navigate(`/habits/${id}/edit`)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300">
          <Pencil className="w-5 h-5" />
        </button>
      </div>

      {/* Header card */}
      <div className="card p-5 flex items-center gap-4">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 text-3xl"
          style={{ backgroundColor: `${habit.color}1a` }}
        >
          {habit.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Habit</div>
          <div className="text-lg font-bold text-slate-800 dark:text-slate-100">{habit.name}</div>
          {habit.reminder_time && (
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">⏰ Reminder at {formatTime(habit.reminder_time)}</div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {habit.day_off_enabled && (
            <button
              onClick={() => setDayOff(habit.id)}
              className={`p-2 rounded-xl ${isDayOff ? 'bg-slate-700 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}
              title="Day off"
            >
              <Moon className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => toggleComplete(habit.id)}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition ${
              isDone ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
            }`}
          >
            <Check className="w-6 h-6" strokeWidth={3} />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatBlock label="Current" value={current} suffix={current === 1 ? 'day' : 'days'} />
        <StatBlock label="Best" value={best} suffix={best === 1 ? 'day' : 'days'} />
        <StatBlock label="Total" value={totalDone} suffix="done" />
      </div>

      {/* Weekly chart */}
      <div className="card p-5">
        <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-3">This week</h3>
        <WeekChart data={weekData} color={habit.color} height={180} unit="" />
      </div>

      {/* Heatmap */}
      <div className="card p-5">
        <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-3">Last 30 days</h3>
        <HeatMap completions={completions} color={habit.color} days={30} />
      </div>

      {/* Danger zone */}
      <div className="card p-5 space-y-2">
        <h3 className="font-bold text-slate-800 dark:text-slate-100">Manage</h3>
        <button onClick={() => setConfirmArchive(true)} className="w-full btn-secondary justify-start">
          <Archive className="w-4 h-4" /> Archive habit
        </button>
        <button onClick={() => setConfirmDelete(true)} className="w-full btn-secondary justify-start text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30">
          <Trash2 className="w-4 h-4" /> Delete habit
        </button>
      </div>

      <Modal open={confirmArchive} onClose={() => setConfirmArchive(false)} title="Archive habit?">
        <p className="text-slate-600 dark:text-slate-300">You can restore it later. History is kept.</p>
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={() => setConfirmArchive(false)} className="btn-secondary">Cancel</button>
          <button onClick={onArchive} className="btn-primary">Archive</button>
        </div>
      </Modal>
      <Modal open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Delete habit?">
        <p className="text-slate-600 dark:text-slate-300">This deletes the habit and all its history. This can't be undone.</p>
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={() => setConfirmDelete(false)} className="btn-secondary">Cancel</button>
          <button onClick={onDelete} className="btn-danger">Delete forever</button>
        </div>
      </Modal>
    </div>
  )
}

function StatBlock({ label, value, suffix }) {
  return (
    <div className="card p-4 text-center">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</div>
      <div className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 mt-1">{value}</div>
      <div className="text-xs text-slate-500 dark:text-slate-400">{suffix}</div>
    </div>
  )
}
