import { useState, useMemo } from 'react'
import Calendar from 'react-calendar'
import { format } from 'date-fns'
import { Check, Moon, Minus, Calendar as CalIcon } from 'lucide-react'
import { useHabits } from '../hooks/useHabits'
import { isDayScheduled } from '../utils/streakCalc'

export default function CalendarPage() {
  const { habits, completions } = useHabits()
  const [selected, setSelected] = useState(new Date())
  const [activeMonth, setActiveMonth] = useState(new Date())

  // For each day, build summary
  const summaryByDate = useMemo(() => {
    const map = {}
    for (const c of completions) {
      if (!c.completed_date) continue
      if (!map[c.completed_date]) map[c.completed_date] = []
      map[c.completed_date].push(c)
    }
    return map
  }, [completions])

  const getDayInfo = (date) => {
    const key = format(date, 'yyyy-MM-dd')
    const scheduledHabits = habits.filter((h) => isDayScheduled(date, h.frequency_days || [0,1,2,3,4,5,6]))
    const dayCompletions = summaryByDate[key] || []
    const done = dayCompletions.filter((c) => !c.is_day_off).length
    const dayOff = dayCompletions.filter((c) => c.is_day_off).length
    const scheduled = scheduledHabits.length
    const isComplete = scheduled > 0 && done + dayOff >= scheduled
    return { key, done, dayOff, scheduled, isComplete, scheduledHabits, dayCompletions }
  }

  const tileContent = ({ date, view }) => {
    if (view !== 'month') return null
    const info = getDayInfo(date)
    if (info.scheduled === 0) return null
    // Show colored dots for each habit that has an entry
    const dayKey = info.key
    const habitChips = habits
      .filter((h) => isDayScheduled(date, h.frequency_days || [0,1,2,3,4,5,6]))
      .slice(0, 5)
      .map((h) => {
        const entry = (summaryByDate[dayKey] || []).find((c) => c.habit_id === h.id)
        if (!entry) return { habit: h, entry: null }
        return { habit: h, entry }
      })
    return (
      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex items-center gap-0.5">
        {habitChips.map(({ habit, entry }) => (
          <span
            key={habit.id}
            className="w-1.5 h-1.5 rounded-full"
            style={{
              backgroundColor: entry
                ? entry.is_day_off
                  ? '#cbd5e1'
                  : habit.color
                : 'transparent',
              border: !entry ? '1px solid #e2e8f0' : 'none',
            }}
          />
        ))}
      </div>
    )
  }

  const tileClassName = ({ date, view }) => {
    if (view !== 'month') return null
    const info = getDayInfo(date)
    if (info.isComplete) return 'hf-day-complete'
    return null
  }

  const dayInfo = getDayInfo(selected)
  const selectedDayEntries = dayInfo.dayCompletions

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <CalIcon className="w-6 h-6 text-brand-600" />
        <h1 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">Calendar</h1>
      </div>

      <div className="card p-4 md:p-5">
        <Calendar
          onChange={setSelected}
          onActiveStartDateChange={({ activeStartDate }) => setActiveMonth(activeStartDate || new Date())}
          value={selected}
          tileContent={tileContent}
          tileClassName={tileClassName}
          locale="en-US"
        />
        <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-brand-600" /> Completed
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-slate-300" /> Day off
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full border border-slate-200" /> Not done
          </div>
        </div>
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-slate-800 dark:text-slate-100">{format(selected, 'EEEE, MMMM d')}</h2>
          <div className="text-sm text-slate-500 dark:text-slate-400">
            {dayInfo.done} done · {dayInfo.dayOff} rest · {dayInfo.scheduled} scheduled
          </div>
        </div>

        {dayInfo.scheduledHabits.length === 0 ? (
          <p className="text-slate-500 dark:text-slate-400 text-sm">No habits scheduled for this day.</p>
        ) : (
          <div className="space-y-2">
            {dayInfo.scheduledHabits.map((h) => {
              const entry = selectedDayEntries.find((c) => c.habit_id === h.id)
              const status = entry
                ? entry.is_day_off ? 'rest' : 'done'
                : 'pending'
              return (
                <div key={h.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-lg"
                    style={{ backgroundColor: `${h.color}1a` }}
                  >
                    {h.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-800 dark:text-slate-100 truncate text-sm">{h.name}</div>
                  </div>
                  <StatusPill status={status} color={h.color} />
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function StatusPill({ status, color }) {
  if (status === 'done') {
    return (
      <span className="chip" style={{ backgroundColor: `${color}1a`, color }}>
        <Check className="w-3 h-3" strokeWidth={3} /> Done
      </span>
    )
  }
  if (status === 'rest') {
    return (
      <span className="chip bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
        <Moon className="w-3 h-3" /> Rest
      </span>
    )
  }
  return (
    <span className="chip bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
      <Minus className="w-3 h-3" /> Skipped
    </span>
  )
}
