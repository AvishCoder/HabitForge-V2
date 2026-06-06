import { useEffect, useState } from 'react'
import { X, Bell } from 'lucide-react'

export default function ToastHost() {
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    const handler = (e) => {
      const { title, body, color } = e.detail || {}
      const id = Date.now() + Math.random()
      setToasts((cur) => [...cur, { id, title, body, color }])
      setTimeout(() => {
        setToasts((cur) => cur.filter((t) => t.id !== id))
      }, 6000)
    }
    window.addEventListener('hf:toast', handler)
    return () => window.removeEventListener('hf:toast', handler)
  }, [])

  const dismiss = (id) => setToasts((cur) => cur.filter((t) => t.id !== id))

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto card p-4 flex items-start gap-3 shadow-lg border-l-4 animate-in"
          style={{ borderLeftColor: t.color || '#6366f1' }}
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${t.color || '#6366f1'}1a`, color: t.color || '#6366f1' }}
          >
            <Bell className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate">{t.title}</div>
            {t.body && <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{t.body}</div>}
          </div>
          <button onClick={() => dismiss(t.id)} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  )
}
