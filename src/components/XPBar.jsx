import { Trophy, Sparkles } from 'lucide-react'

export default function XPBar({ totalXP, rank, progress, xpIntoRank, xpForNext, next }) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-violet-500 flex items-center justify-center text-white">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Current Rank</div>
            <div className="font-bold text-slate-800 dark:text-slate-100">{rank.current.name}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Total XP</div>
          <div className="font-bold text-slate-800 dark:text-slate-100">{totalXP.toLocaleString()}</div>
        </div>
      </div>
      <div className="relative h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-brand-500 to-violet-500 transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex items-center justify-between mt-2 text-xs text-slate-500 dark:text-slate-400">
        <span>
          {next ? `${xpIntoRank.toLocaleString()} / ${xpForNext.toLocaleString()} XP` : 'Max rank reached'}
        </span>
        {next ? (
          <span className="inline-flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> Next: {next.name}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-amber-500 font-semibold">
            <Sparkles className="w-3.5 h-3.5" /> Legendary!
          </span>
        )}
      </div>
    </div>
  )
}
