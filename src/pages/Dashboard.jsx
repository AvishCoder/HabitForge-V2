import { useNavigate } from 'react-router-dom'
import { Plus, Flame, TrendingUp, Target } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useHabits } from '../hooks/useHabits'
import { useXP } from '../hooks/useXP'
import { getGreeting, formatDate } from '../utils/dateHelpers'
import { calcStreak } from '../utils/streakCalc'
import HabitCard from '../components/HabitCard'
import XPBar from '../components/XPBar'

export default function Dashboard() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { habits, scheduledToday, todaysProgress, completions } = useHabits()
  const { totalXP, rank } = useXP()

  const globalStreak = (() => {
    if (!habits.length) return 0
    const perHabit = habits.map((h) =>
      calcStreak(
        completions.filter((c) => c.habit_id === h.id),
        h.frequency_days || [0,1,2,3,4,5,6]
      )
    )
    return perHabit.length ? Math.max(...perHabit) : 0
  })()

  const completedCount = scheduledToday.filter(
    (h) => completions.find((c) => c.habit_id === h.id && c.completed_date === new Date().toISOString().slice(0,10) && !c.is_day_off)
  ).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 dark:text-slate-100">
            {getGreeting()}{profile?.display_name ? `, ${profile.display_name}` : ''} 👋
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">{formatDate(new Date(), 'EEEE, MMMM d')}</p>
        </div>
        <button
          onClick={() => navigate('/habits/new')}
          className="btn-primary"
        >
          <Plus className="w-4 h-4" /> Add Habit
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatCard
          icon={<Target className="w-5 h-5" />}
          label="Today"
          value={`${completedCount} / ${scheduledToday.length}`}
          sub={`${todaysProgress}% done`}
          color="bg-brand-50 text-brand-600"
        />
        <StatCard
          icon={<Flame className="w-5 h-5" />}
          label="Best Streak"
          value={`${globalStreak} ${globalStreak === 1 ? 'day' : 'days'}`}
          sub="Keep it alive!"
          color="bg-orange-50 text-orange-600"
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5" />}
          label="Total XP"
          value={totalXP.toLocaleString()}
          sub={`Rank: ${rank.current.name}`}
          color="bg-violet-50 text-violet-600"
        />
      </div>

      {/* XP bar */}
      <XPBar
        totalXP={totalXP}
        rank={rank}
        progress={rank.progress}
        xpIntoRank={rank.xpIntoRank}
        xpForNext={rank.xpForNext}
        next={rank.next}
      />

      {/* Habits list */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Today's Habits</h2>
          {scheduledToday.length > 0 && (
            <div className="text-sm text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-slate-700 dark:text-slate-200">{todaysProgress}%</span> complete
            </div>
          )}
        </div>

        {habits.length === 0 ? (
          <EmptyState onAdd={() => navigate('/habits/new')} />
        ) : scheduledToday.length === 0 ? (
          <div className="card p-6 text-center text-slate-500 dark:text-slate-400">
            No habits scheduled for today. Enjoy your rest day ✨
          </div>
        ) : (
          <div className="space-y-2.5">
            {scheduledToday.map((h) => (
              <HabitCard key={h.id} habit={h} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function StatCard({ icon, label, value, sub, color }) {
  return (
    <div className="card p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>{icon}</div>
      <div className="min-w-0">
        <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wide">{label}</div>
        <div className="text-lg font-bold text-slate-800 dark:text-slate-100 truncate">{value}</div>
        {sub && <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{sub}</div>}
      </div>
    </div>
  )
}

function EmptyState({ onAdd }) {
  return (
    <div className="card p-10 text-center">
      <div className="w-16 h-16 rounded-2xl bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 mx-auto flex items-center justify-center text-3xl">
        🎯
      </div>
      <h3 className="mt-4 text-lg font-bold text-slate-800 dark:text-slate-100">No habits yet</h3>
      <p className="text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
        Start by creating your first habit. Small steps lead to big changes.
      </p>
      <button onClick={onAdd} className="btn-primary mt-5">
        <Plus className="w-4 h-4" /> Create your first habit
      </button>
    </div>
  )
}
