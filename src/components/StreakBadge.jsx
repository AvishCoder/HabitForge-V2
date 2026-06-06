import { Flame } from 'lucide-react'

export default function StreakBadge({ count, best, size = 'md' }) {
  const sizes = {
    sm: { wrap: 'px-2.5 py-1 text-xs', icon: 'w-3.5 h-3.5' },
    md: { wrap: 'px-3 py-1.5 text-sm', icon: 'w-4 h-4' },
    lg: { wrap: 'px-4 py-2 text-base', icon: 'w-5 h-5' },
  }
  const s = sizes[size]
  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full font-bold ${s.wrap} bg-orange-50 text-orange-600`}>
      <Flame className={s.icon} fill="currentColor" />
      <span>{count}</span>
      {best !== undefined && best !== null && (
        <span className="text-orange-400 font-medium">· best {best}</span>
      )}
    </div>
  )
}
