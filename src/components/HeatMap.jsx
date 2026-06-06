import { format } from 'date-fns'
import { lastNDays } from '../utils/dateHelpers'

export default function HeatMap({ completions, color = '#6366f1', days = 30 }) {
  const dates = lastNDays(days)
  const map = completions.reduce((acc, c) => {
    if (!c.completed_date) return acc
    acc[c.completed_date] = c
    return acc
  }, {})

  return (
    <div>
      <div className="grid grid-cols-10 sm:grid-cols-15 gap-1.5">
        {dates.map((d) => {
          const key = format(d, 'yyyy-MM-dd')
          const entry = map[key]
          let bg = 'bg-slate-100'
          let title = format(d, 'MMM d')
          if (entry && !entry.is_day_off) {
            bg = ''
            title = `Completed · ${format(d, 'MMM d')}`
          } else if (entry && entry.is_day_off) {
            bg = 'bg-slate-300'
            title = `Day off · ${format(d, 'MMM d')}`
          }
          return (
            <div
              key={key}
              title={title}
              className={`aspect-square rounded-md ${bg}`}
              style={entry && !entry.is_day_off ? { backgroundColor: color } : undefined}
            />
          )
        })}
      </div>
      <div className="flex items-center gap-2 mt-3 text-xs text-slate-500">
        <span>Less</span>
        <div className="w-3 h-3 rounded-sm bg-slate-100" />
        <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: color, opacity: 0.3 }} />
        <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: color, opacity: 0.6 }} />
        <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }} />
        <span>More</span>
      </div>
    </div>
  )
}
