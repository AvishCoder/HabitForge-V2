import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart3, Trophy, TrendingUp, Crown, ArrowRight } from 'lucide-react'
import { format, subWeeks, startOfWeek, endOfWeek, eachDayOfInterval, getISOWeek } from 'date-fns'
import { useHabits } from '../hooks/useHabits'
import { useXP } from '../hooks/useXP'
import { isDayScheduled } from '../utils/streakCalc'
import { RANKS } from '../lib/constants'
import WeekChart from '../components/WeekChart'
import XPBar from '../components/XPBar'

export default function Stats() {
  const navigate = useNavigate()
  const { habits, completions } = useHabits()
  const { totalXP, rank, xpLog, xpThisWeek } = useXP()

  // Per-habit completion % over last 7 days
  const habitStats = useMemo(() => {
    return habits.map((h) => {
      const days = eachDayOfInterval({
        start: startOfWeek(new Date(), { weekStartsOn: 0 }),
        end: endOfWeek(new Date(), { weekStartsOn: 0 }),
      })
      const scheduledDays = days.filter((d) => isDayScheduled(d, h.frequency_days || [0,1,2,3,4,5,6]))
      const completionMap = completions
        .filter((c) => c.habit_id === h.id)
        .reduce((acc, c) => { acc[c.completed_date] = c; return acc }, {})
      const done = scheduledDays.filter((d) => {
        const k = format(d, 'yyyy-MM-dd')
        const e = completionMap[k]
        return e && !e.is_day_off
      }).length
      const pct = scheduledDays.length ? Math.round((done / scheduledDays.length) * 100) : 0
      return { habit: h, done, total: scheduledDays.length, pct }
    }).sort((a, b) => b.pct - a.pct)
  }, [habits, completions])

  const overallWeekPct = useMemo(() => {
    const all = habitStats
    const totalDone = all.reduce((s, x) => s + x.done, 0)
    const totalSched = all.reduce((s, x) => s + x.total, 0)
    return totalSched ? Math.round((totalDone / totalSched) * 100) : 0
  }, [habitStats])

  // Last 8 weeks trend
  const trend = useMemo(() => {
    const out = []
    for (let i = 7; i >= 0; i--) {
      const start = startOfWeek(subWeeks(new Date(), i), { weekStartsOn: 0 })
      const end = endOfWeek(subWeeks(new Date(), i), { weekStartsOn: 0 })
      const days = eachDayOfInterval({ start, end })
      let done = 0, sched = 0
      const completionMap = completions.reduce((acc, c) => { acc[c.completed_date] = c; return acc }, {})
      for (const d of days) {
        const k = format(d, 'yyyy-MM-dd')
        for (const h of habits) {
          if (!isDayScheduled(d, h.frequency_days || [0,1,2,3,4,5,6])) continue
          sched += 1
          const e = completionMap[k]
          if (e && !e.is_day_off) done += 1
        }
      }
      const pct = sched ? Math.round((done / sched) * 100) : 0
      out.push({ label: `W${getISOWeek(start)}`, value: pct })
    }
    return out
  }, [habits, completions])

  const bestHabit = habitStats[0]
  const weeklyXP = xpThisWeek()
  const lastFiveReasons = xpLog.slice(0, 5)

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <BarChart3 className="w-6 h-6 text-brand-600" />
        <h1 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">Stats</h1>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <SummaryStat label="Weekly avg" value={`${overallWeekPct}%`} icon={<TrendingUp className="w-5 h-5" />} color="bg-brand-50 text-brand-600" />
        <SummaryStat label="XP this week" value={weeklyXP.toLocaleString()} icon={<Trophy className="w-5 h-5" />} color="bg-amber-50 text-amber-600" />
        <SummaryStat label="Total XP" value={totalXP.toLocaleString()} icon={<Crown className="w-5 h-5" />} color="bg-violet-50 text-violet-600" />
      </div>

      <XPBar totalXP={totalXP} rank={rank} progress={rank.progress} xpIntoRank={rank.xpIntoRank} xpForNext={rank.xpForNext} next={rank.next} />

      <div className="card p-5">
        <h3 className="font-bold text-slate-800 mb-3">Last 8 weeks</h3>
        <WeekChart data={trend} color="#6366f1" height={200} />
      </div>

      {bestHabit && bestHabit.total > 0 && (
        <div className="card p-5 flex items-center gap-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-100 dark:border-amber-900/50">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 text-3xl"
            style={{ backgroundColor: `${bestHabit.habit.color}25` }}
          >
            {bestHabit.habit.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">Best this week</div>
            <div className="font-bold text-slate-800 dark:text-slate-100 truncate">{bestHabit.habit.name}</div>
            <div className="text-sm text-slate-600 dark:text-slate-400">{bestHabit.pct}% completion</div>
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 dark:text-slate-100">Habits</h3>
          <span className="text-xs text-slate-500 dark:text-slate-400">This week</span>
        </div>
        {habitStats.length === 0 ? (
          <div className="p-6 text-center text-slate-500 dark:text-slate-400 text-sm">No habits yet</div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {habitStats.map(({ habit, done, total, pct }) => (
              <button
                key={habit.id}
                onClick={() => navigate(`/habits/${habit.id}`)}
                className="w-full flex items-center gap-3 px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-left"
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-lg"
                  style={{ backgroundColor: `${habit.color}1a` }}
                >
                  {habit.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-800 dark:text-slate-100 truncate text-sm">{habit.name}</div>
                  <div className="mt-1.5 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: habit.color }} />
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-bold text-slate-800 dark:text-slate-100">{pct}%</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{done}/{total}</div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="card p-5">
        <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-3">Rank ladder</h3>
        <div className="space-y-2">
          {RANKS.map((r) => {
            const reached = totalXP >= r.min
            const current = r.name === rank.current.name
            return (
              <div
                key={r.name}
                className={`flex items-center gap-3 p-3 rounded-xl border ${
                  current
                    ? 'bg-brand-50 dark:bg-brand-900/30 border-brand-200 dark:border-brand-800'
                    : reached
                      ? 'bg-slate-50 dark:bg-slate-800/30 border-slate-100 dark:border-slate-800'
                      : 'bg-white dark:bg-slate-800/20 border-slate-100 dark:border-slate-800 opacity-60'
                }`}
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${
                  current ? 'bg-brand-600 text-white' : reached ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                }`}>
                  {reached ? '✓' : '·'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{r.name}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{r.perk}</div>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">{r.min.toLocaleString()} XP</div>
              </div>
            )
          })}
        </div>
      </div>

      {lastFiveReasons.length > 0 && (
        <div className="card p-5">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-3">Recent XP</h3>
          <div className="space-y-2">
            {lastFiveReasons.map((l) => (
              <div key={l.id} className="flex items-center justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-300 truncate">{l.reason || 'XP earned'}</span>
                <span className={`font-bold ${l.amount > 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                  {l.amount > 0 ? '+' : ''}{l.amount}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function SummaryStat({ label, value, icon, color }) {
  return (
    <div className="card p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>{icon}</div>
      <div>
        <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wide">{label}</div>
        <div className="text-lg font-bold text-slate-800 dark:text-slate-100">{value}</div>
      </div>
    </div>
  )
}
