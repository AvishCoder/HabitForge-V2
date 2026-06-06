import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, User, Mail, Calendar, Trophy, Flame, Target, Crown, Edit3, Check, X, Sparkles, Award, LogOut } from 'lucide-react'
import { format } from 'date-fns'
import { useAuth } from '../hooks/useAuth'
import { useHabits } from '../hooks/useHabits'
import { useXP } from '../hooks/useXP'
import { calcStreak } from '../utils/streakCalc'
import { RANKS } from '../lib/constants'
import XPBar from '../components/XPBar'

export default function Profile() {
  const navigate = useNavigate()
  const { user, profile, updateProfile, signOut } = useAuth()
  const { habits, completions } = useHabits()
  const { totalXP, rank, xpLog, xpThisWeek } = useXP()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(profile?.display_name || '')
  const [saving, setSaving] = useState(false)

  const stats = useMemo(() => {
    const totalCompletions = completions.filter((c) => !c.is_day_off).length
    const bestStreak = habits.length
      ? Math.max(
          ...habits.map((h) =>
            calcStreak(
              completions.filter((c) => c.habit_id === h.id),
              h.frequency_days || [0,1,2,3,4,5,6]
            )
          )
        )
      : 0
    const totalDayOffs = completions.filter((c) => c.is_day_off).length
    const activeHabits = habits.length
    const last7Days = xpLog.filter((l) => Date.now() - new Date(l.earned_at).getTime() < 7 * 24 * 60 * 60 * 1000)
    const weeklyXP = last7Days.reduce((s, l) => s + (l.amount || 0), 0)
    return { totalCompletions, bestStreak, totalDayOffs, activeHabits, weeklyXP }
  }, [habits, completions, xpLog])

  const memberSince = user?.created_at ? format(new Date(user.created_at), 'MMM yyyy') : '—'
  const initial = (profile?.display_name || user?.email || 'U')[0].toUpperCase()

  const onSave = async () => {
    if (!name.trim()) return
    setSaving(true)
    await updateProfile({ display_name: name.trim() })
    setSaving(false)
    setEditing(false)
  }

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 flex-1">Profile</h1>
        <button onClick={signOut} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300" title="Sign out">
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      {/* Hero card */}
      <div className="card overflow-hidden">
        <div className="h-24 bg-gradient-to-br from-brand-500 via-violet-500 to-fuchsia-500" />
        <div className="px-5 pb-5 -mt-12">
          <div className="flex items-end gap-4">
            <div className="w-24 h-24 rounded-2xl bg-white dark:bg-slate-900 p-1 shadow-soft">
              <div className="w-full h-full rounded-xl bg-gradient-to-br from-brand-500 to-violet-500 text-white flex items-center justify-center text-4xl font-extrabold">
                {initial}
              </div>
            </div>
            <div className="flex-1 pb-1 min-w-0">
              {editing ? (
                <div className="flex items-center gap-2">
                  <input
                    className="input flex-1"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoFocus
                    maxLength={32}
                  />
                  <button onClick={onSave} disabled={saving} className="btn-primary !p-2.5">
                    <Check className="w-4 h-4" />
                  </button>
                  <button onClick={() => { setEditing(false); setName(profile?.display_name || '') }} className="btn-secondary !p-2.5">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 truncate">
                    {profile?.display_name || 'Unnamed user'}
                  </h2>
                  <button onClick={() => setEditing(true)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>
              )}
              <div className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-1">
                <Mail className="w-3.5 h-3.5" /> {user?.email}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            <span className="chip bg-gradient-to-r from-amber-500 to-orange-500 text-white">
              <Crown className="w-3.5 h-3.5" /> {rank.current.name}
            </span>
            <span className="chip bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              <Sparkles className="w-3.5 h-3.5" /> {totalXP.toLocaleString()} XP
            </span>
            <span className="chip bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              <Calendar className="w-3.5 h-3.5" /> Joined {memberSince}
            </span>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatBlock icon={<Trophy className="w-5 h-5" />} value={totalXP.toLocaleString()} label="Total XP" color="bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400" />
        <StatBlock icon={<Flame className="w-5 h-5" />} value={stats.bestStreak} label="Best streak" color="bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400" />
        <StatBlock icon={<Check className="w-5 h-5" />} value={stats.totalCompletions} label="Completions" color="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" />
        <StatBlock icon={<Target className="w-5 h-5" />} value={stats.activeHabits} label="Active habits" color="bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400" />
      </div>

      {/* XP bar */}
      <XPBar totalXP={totalXP} rank={rank} progress={rank.progress} xpIntoRank={rank.xpIntoRank} xpForNext={rank.xpForNext} next={rank.next} />

      {/* Achievements */}
      <div className="card p-5">
        <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-3">
          <Award className="w-5 h-5 text-amber-500" /> Achievements
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {[
            { label: 'First Habit',       desc: 'Create your first habit',          earned: habits.length >= 1 },
            { label: 'Habit Builder',    desc: 'Create 3 habits',                  earned: habits.length >= 3 },
            { label: 'Day One Done',     desc: 'Complete a habit',                 earned: stats.totalCompletions >= 1 },
            { label: 'Getting Started',  desc: 'Earn 50 XP',                       earned: totalXP >= 50 },
            { label: 'Streak Starter',   desc: 'Reach a 7-day streak',             earned: stats.bestStreak >= 7 },
            { label: 'Streak Master',    desc: 'Reach a 30-day streak',            earned: stats.bestStreak >= 30 },
            { label: 'Consistent',       desc: 'Reach Consistent rank (200 XP)',   earned: totalXP >= 200 },
            { label: 'Disciplined',      desc: 'Reach Disciplined rank (600 XP)',  earned: totalXP >= 600 },
            { label: 'Elite',            desc: 'Reach Elite rank (1,500 XP)',      earned: totalXP >= 1500 },
            { label: 'Master',           desc: 'Reach Master rank (3,500 XP)',     earned: totalXP >= 3500 },
            { label: 'Legend',           desc: 'Reach Legend rank (7,000 XP)',     earned: totalXP >= 7000 },
            { label: 'Rest Day Pro',     desc: 'Take 10 day-offs',                 earned: stats.totalDayOffs >= 10 },
          ].map((a) => (
            <div
              key={a.label}
              className={`p-3 rounded-xl border-2 flex items-center gap-3 ${
                a.earned
                  ? 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-200 dark:border-amber-800/50'
                  : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 opacity-60'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                a.earned ? 'bg-amber-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
              }`}>
                {a.earned ? <Trophy className="w-5 h-5" /> : <Award className="w-5 h-5" />}
              </div>
              <div className="min-w-0">
                <div className={`font-bold text-sm ${a.earned ? 'text-slate-800 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400'}`}>
                  {a.label}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{a.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Rank ladder */}
      <div className="card p-5">
        <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-3">
          <Crown className="w-5 h-5 text-amber-500" /> Rank ladder
        </h3>
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
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/50'
                      : 'bg-white dark:bg-slate-800/30 border-slate-100 dark:border-slate-800 opacity-60'
                }`}
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${
                  current
                    ? 'bg-brand-600 text-white'
                    : reached
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                }`}>
                  {reached ? '✓' : '·'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
                    {r.name}
                    {current && <span className="chip bg-brand-600 text-white !text-[10px] !py-0.5">Current</span>}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{r.perk}</div>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium shrink-0">{r.min.toLocaleString()} XP</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function StatBlock({ icon, value, label, color }) {
  return (
    <div className="card p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>{icon}</div>
      <div>
        <div className="text-lg font-bold text-slate-800 dark:text-slate-100">{value}</div>
        <div className="text-xs text-slate-500 dark:text-slate-400">{label}</div>
      </div>
    </div>
  )
}
