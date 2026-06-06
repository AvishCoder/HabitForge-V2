import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, Mail, Lock, Loader2 } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

export default function Login() {
  const navigate = useNavigate()
  const { signIn, signUp, signInWithGoogle, loading } = useAuth()
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setInfo('')
    setBusy(true)
    try {
      if (mode === 'login') {
        const { error } = await signIn(email, password)
        if (error) throw new Error(error)
        navigate('/dashboard')
      } else {
        const { error, data } = await signUp(email, password)
        if (error) throw new Error(error)
        if (data?.session) {
          navigate('/dashboard')
        } else {
          setInfo('Check your email to confirm your account, then log in.')
          setMode('login')
        }
      }
    } catch (e) {
      setError(e.message || 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  const onGoogle = async () => {
    setError('')
    setBusy(true)
    const { error } = await signInWithGoogle()
    setBusy(false)
    if (error) setError(error)
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Hero panel */}
      <div className="md:flex-1 bg-gradient-to-br from-brand-600 via-violet-600 to-fuchsia-600 text-white p-8 md:p-16 flex flex-col justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="text-xl font-bold">HabitForge</span>
        </div>

        <div className="my-12 md:my-0">
          <h1 className="text-4xl md:text-6xl font-extrabold leading-tight">
            Build better<br />habits, every day.
          </h1>
          <p className="mt-4 text-white/80 text-lg max-w-md">
            Track daily habits, earn XP, unlock ranks, and keep your streak alive. Simple, fast, and beautifully designed.
          </p>
          <div className="mt-8 flex flex-wrap gap-3 text-sm">
            <span className="chip bg-white/15 backdrop-blur text-white">⚡ XP & Ranks</span>
            <span className="chip bg-white/15 backdrop-blur text-white">🔥 Streaks</span>
            <span className="chip bg-white/15 backdrop-blur text-white">📅 Calendar</span>
            <span className="chip bg-white/15 backdrop-blur text-white">🔔 Reminders</span>
          </div>
        </div>

        <div className="hidden md:block text-sm text-white/60">
          © {new Date().getFullYear()} HabitForge
        </div>
      </div>

      {/* Form panel */}
      <div className="md:flex-1 flex items-center justify-center p-6 md:p-12 bg-white dark:bg-slate-900 transition-colors">
        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {mode === 'login' ? 'Log in to continue your streak.' : 'Start your habit journey today.'}
          </p>

          <button
            type="button"
            onClick={onGoogle}
            disabled={busy}
            className="mt-6 w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold text-slate-700 dark:text-slate-200 transition active:scale-[0.98]"
          >
            <GoogleIcon /> Continue with Google
          </button>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
            <span className="text-xs text-slate-400 font-medium">OR</span>
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
          </div>

          <form onSubmit={onSubmit} className="space-y-3">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="input pl-10"
                required
                autoComplete="email"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="input pl-10"
                required
                minLength={6}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
            </div>

            {error && (
              <div className="text-sm text-rose-600 bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900 rounded-xl px-3 py-2">
                {error}
              </div>
            )}
            {info && (
              <div className="text-sm text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900 rounded-xl px-3 py-2">
                {info}
              </div>
            )}

            <button type="submit" disabled={busy} className="btn-primary w-full py-3">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {mode === 'login' ? 'Log in' : 'Create account'}
            </button>
          </form>

          <p className="text-sm text-slate-500 dark:text-slate-400 text-center mt-5">
            {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button
              onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setInfo('') }}
              className="text-brand-600 dark:text-brand-400 font-semibold hover:underline"
            >
              {mode === 'login' ? 'Sign up' : 'Log in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}
