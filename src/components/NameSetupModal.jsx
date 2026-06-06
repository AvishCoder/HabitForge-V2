import { useState } from 'react'
import { useAuthStore } from '../store/authStore'
import Modal from './Modal'
import { Sparkles } from 'lucide-react'

export default function NameSetupModal() {
  const { profile, updateProfile } = useAuthStore()
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  if (profile?.display_name) return null

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    await updateProfile({ display_name: name.trim() })
    setLoading(false)
  }

  return (
    <Modal open onClose={() => {}} title="">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-violet-500 mx-auto flex items-center justify-center mb-4">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Welcome to HabitForge</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1">What should we call you?</p>
      </div>
      <form onSubmit={onSubmit} className="mt-6 space-y-3">
        <input
          autoFocus
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className="input text-center text-lg"
          maxLength={32}
          required
        />
        <button type="submit" disabled={loading || !name.trim()} className="btn-primary w-full text-base py-3">
          {loading ? 'Setting up…' : 'Get started'}
        </button>
      </form>
    </Modal>
  )
}
