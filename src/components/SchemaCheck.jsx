import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import Modal from '../components/Modal'
import { AlertTriangle, Copy, Check, Database } from 'lucide-react'
import { useAuthStore } from '../store/authStore'

const MIGRATION_SQL = `-- HabitForge schema patch (run once in Supabase SQL Editor)
ALTER TABLE public.habits
  ADD COLUMN IF NOT EXISTS icon              text        DEFAULT '🎯',
  ADD COLUMN IF NOT EXISTS color             text        DEFAULT '#6366f1',
  ADD COLUMN IF NOT EXISTS frequency_days    integer[]   DEFAULT ARRAY[0,1,2,3,4,5,6],
  ADD COLUMN IF NOT EXISTS day_off_enabled   boolean     DEFAULT true,
  ADD COLUMN IF NOT EXISTS reminder_time     time,
  ADD COLUMN IF NOT EXISTS is_archived       boolean     DEFAULT false,
  ADD COLUMN IF NOT EXISTS created_at        timestamptz DEFAULT now();

ALTER TABLE public.completions
  ADD COLUMN IF NOT EXISTS completed_date    date,
  ADD COLUMN IF NOT EXISTS is_day_off        boolean     DEFAULT false,
  ADD COLUMN IF NOT EXISTS xp_earned         integer     DEFAULT 0,
  ADD COLUMN IF NOT EXISTS created_at        timestamptz DEFAULT now();

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS display_name             text,
  ADD COLUMN IF NOT EXISTS default_reminder_time    time,
  ADD COLUMN IF NOT EXISTS avatar_url               text,
  ADD COLUMN IF NOT EXISTS created_at               timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at               timestamptz DEFAULT now();

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS habit_id        uuid REFERENCES public.habits(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS reminder_time   time,
  ADD COLUMN IF NOT EXISTS enabled         boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS created_at      timestamptz DEFAULT now();

ALTER TABLE public.xp_log
  ADD COLUMN IF NOT EXISTS amount      integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reason      text,
  ADD COLUMN IF NOT EXISTS earned_at   timestamptz DEFAULT now();

NOTIFY pgrst, 'reload schema';`

export default function SchemaCheck({ children }) {
  const { user } = useAuthStore()
  const [ok, setOk] = useState(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!user) { setOk(true); return }
    let cancelled = false
    const probe = async () => {
      // 5s safety timeout — don't hang the UI on a dead network
      const timeout = new Promise((resolve) => setTimeout(() => resolve({ error: { message: 'timeout' } }), 5000))
      try {
        const result = await Promise.race([
          supabase
            .from('habits')
            .select('id,name,icon,color,frequency_days,day_off_enabled,reminder_time,is_archived,created_at')
            .limit(1),
          timeout,
        ])
        if (cancelled) return
        if (result?.error) {
          setOk(false)
        } else {
          setOk(true)
        }
      } catch {
        if (!cancelled) setOk(false)
      }
    }
    probe()
    return () => { cancelled = true }
  }, [user])

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(MIGRATION_SQL)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {}
  }

  if (ok !== false) return children

  return (
    <>
      {children}
      <Modal open onClose={() => {}} title="">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Schema needs a one-time update</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
              The Supabase database is missing some columns the app expects
              (e.g. <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-xs">color</code> on the
              <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-xs mx-1">habits</code> table).
            </p>
          </div>
        </div>

        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl p-3 text-sm text-amber-800 dark:text-amber-200 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <div>
            <strong>How to fix:</strong> open the Supabase dashboard → <em>SQL Editor</em> → paste the SQL below → click <em>Run</em>. Safe to re-run.
          </div>
        </div>

        <pre className="mt-3 p-3 rounded-xl bg-slate-900 text-slate-100 text-xs overflow-auto max-h-64 font-mono leading-relaxed">
{MIGRATION_SQL}
        </pre>

        <div className="flex items-center justify-between gap-2 mt-4">
          <button onClick={onCopy} className="btn-secondary text-xs">
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy SQL'}
          </button>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary text-xs"
          >
            I've run it — reload
          </button>
        </div>
      </Modal>
    </>
  )
}
