import { useNavigate } from 'react-router-dom'
import { Check, Moon, Clock } from 'lucide-react'
import { useStreak } from '../hooks/useStreak'
import { useHabits } from '../hooks/useHabits'
import StreakBadge from './StreakBadge'

export default function HabitCard({ habit }) {
  const navigate = useNavigate()
  const { completedHabitIds, dayOffHabitIds, toggleComplete, setDayOff, getHabitCompletions } = useHabits()
  const completions = getHabitCompletions(habit.id)
  const { current: streak } = useStreak(completions, habit.frequency_days || [0,1,2,3,4,5,6])

  const isDone = completedHabitIds.has(habit.id)
  const isDayOff = dayOffHabitIds.has(habit.id)

  return (
    <div
      onClick={() => navigate(`/habits/${habit.id}`)}
      className="card p-4 flex items-center gap-3 cursor-pointer hover:shadow-md dark:hover:border-slate-700 transition active:scale-[0.99]"
    >
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 text-2xl"
        style={{ backgroundColor: `${habit.color}1a` }}
      >
        {habit.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-slate-800 dark:text-slate-100 truncate">{habit.name}</div>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <StreakBadge count={streak} size="sm" />
          {habit.reminder_time && (
            <span className="chip bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              <Clock className="w-3 h-3" /> {habit.reminder_time}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {habit.day_off_enabled && (
          <button
            onClick={(e) => { e.stopPropagation(); setDayOff(habit.id) }}
            className={`p-2 rounded-xl transition ${
              isDayOff
                ? 'bg-slate-700 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
            aria-label="Day off"
            title="Day off"
          >
            <Moon className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); toggleComplete(habit.id) }}
          className={`w-12 h-12 rounded-2xl flex items-center justify-center transition active:scale-90 ${
            isDone
              ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
              : isDayOff
                ? 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
          aria-label={isDone ? 'Mark incomplete' : 'Mark complete'}
        >
          {isDone ? <Check className="w-6 h-6" strokeWidth={3} /> : isDayOff ? <Moon className="w-5 h-5" /> : <Check className="w-6 h-6" />}
        </button>
      </div>
    </div>
  )
}
