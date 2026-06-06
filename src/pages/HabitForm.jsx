import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import EmojiPicker from 'emoji-picker-react'
import { ArrowLeft, Trash2, Save, Clock, Moon, Smile } from 'lucide-react'
import { useHabits } from '../hooks/useHabits'
import { HABIT_COLORS, DEFAULT_ICON, FREQUENCY_DAYS } from '../lib/constants'
import Modal from '../components/Modal'

export default function HabitForm({ mode }) {
  const navigate = useNavigate()
  const { id } = useParams()
  const { createHabit, updateHabit, deleteHabit, getHabit } = useHabits()

  const isEdit = mode === 'edit'
  const existing = isEdit ? getHabit(id) : null

  const [name, setName] = useState('')
  const [icon, setIcon] = useState(DEFAULT_ICON)
  const [color, setColor] = useState(HABIT_COLORS[0].value)
  const [frequency, setFrequency] = useState([0,1,2,3,4,5,6])
  const [dayOffEnabled, setDayOffEnabled] = useState(true)
  const [reminderTime, setReminderTime] = useState('')
  const [showEmoji, setShowEmoji] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    if (existing) {
      setName(existing.name || '')
      setIcon(existing.icon || DEFAULT_ICON)
      setColor(existing.color || HABIT_COLORS[0].value)
      setFrequency(existing.frequency_days || [0,1,2,3,4,5,6])
      setDayOffEnabled(!!existing.day_off_enabled)
      setReminderTime(existing.reminder_time || '')
    }
  }, [existing])

  const toggleDay = (d) => {
    setFrequency((f) => f.includes(d) ? f.filter((x) => x !== d) : [...f, d].sort())
  }

  const onSave = async (e) => {
    e.preventDefault()
    if (!name.trim()) { setError('Name is required'); return }
    if (frequency.length === 0) { setError('Pick at least one day'); return }
    setError('')
    setSaving(true)
    const payload = {
      name: name.trim(),
      icon,
      color,
      frequency_days: frequency,
      day_off_enabled: dayOffEnabled,
      reminder_time: reminderTime || null,
    }
    try {
      if (isEdit) {
        const { error } = await updateHabit(id, payload)
        if (error) throw new Error(error)
      } else {
        const { error } = await createHabit(payload)
        if (error) throw new Error(error)
      }
      navigate(isEdit ? `/habits/${id}` : '/dashboard')
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const onDelete = async () => {
    setSaving(true)
    const { error } = await deleteHabit(id)
    setSaving(false)
    if (error) { setError(error); return }
    navigate('/dashboard')
  }

  if (isEdit && !existing) {
    return (
      <div className="card p-6 text-center text-slate-500 dark:text-slate-400">
        Habit not found.
        <button onClick={() => navigate('/dashboard')} className="btn-primary mt-4">Back to dashboard</button>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">
          {isEdit ? 'Edit Habit' : 'New Habit'}
        </h1>
      </div>

      <form onSubmit={onSave} className="space-y-5">
        {/* Live preview */}
        <div className="card p-4 flex items-center gap-3">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0"
            style={{ backgroundColor: `${color}1a` }}
          >
            {icon}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-bold text-slate-800 dark:text-slate-100 truncate">{name || 'Habit name'}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {frequency.length === 7 ? 'Every day' :
                frequency.length === 0 ? 'No days selected' :
                frequency.length === 5 && !frequency.includes(0) && !frequency.includes(6) ? 'Weekdays' :
                frequency.length === 2 && frequency.includes(0) && frequency.includes(6) ? 'Weekends' :
                frequency.map((d) => FREQUENCY_DAYS[d].label).join(', ')}
            </div>
          </div>
        </div>

        <div className="card p-5 space-y-5">
          {/* Name */}
          <div>
            <label className="label">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Morning meditation"
              className="input"
              maxLength={48}
              required
            />
          </div>

          {/* Icon */}
          <div>
            <label className="label">Icon</label>
            <button
              type="button"
              onClick={() => setShowEmoji(true)}
              className="w-16 h-16 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-brand-400 text-3xl flex items-center justify-center"
            >
              {icon}
            </button>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">Pick any emoji</p>
          </div>

          {/* Color */}
          <div>
            <label className="label">Color</label>
            <div className="flex flex-wrap gap-2">
              {HABIT_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  aria-label={c.name}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold transition ${
                    color === c.value ? 'ring-2 ring-offset-2 ring-slate-400 dark:ring-offset-slate-900 scale-110' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: c.value }}
                >
                  {color === c.value ? '✓' : ''}
                </button>
              ))}
            </div>
          </div>

          {/* Frequency */}
          <div>
            <label className="label">Frequency</label>
            <div className="grid grid-cols-7 gap-1.5">
              {FREQUENCY_DAYS.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => toggleDay(d.value)}
                  className={`py-2.5 rounded-xl text-sm font-bold transition ${
                    frequency.includes(d.value)
                      ? 'bg-brand-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {d.short}
                </button>
              ))}
            </div>
          </div>

          {/* Day off toggle */}
          <label className="flex items-center justify-between gap-3 cursor-pointer p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
            <div className="flex items-center gap-3">
              <Moon className="w-5 h-5 text-slate-500 dark:text-slate-400" />
              <div>
                <div className="font-semibold text-slate-800 dark:text-slate-100 text-sm">Allow day-offs</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Mark a rest day to protect your streak</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={dayOffEnabled}
              onChange={(e) => setDayOffEnabled(e.target.checked)}
              className="w-5 h-5 accent-brand-600"
            />
          </label>

          {/* Reminder time */}
          <div>
            <label className="label flex items-center gap-1.5">
              <Clock className="w-4 h-4" /> Reminder time
            </label>
            <input
              type="time"
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
              className="input"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Browser will notify you while the tab is open</p>
          </div>
        </div>

        {error && (
          <div className="text-sm text-rose-600 bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900 rounded-xl px-3 py-2">{error}</div>
        )}

        <div className="flex items-center gap-2">
          <button type="submit" disabled={saving} className="btn-primary flex-1">
            <Save className="w-4 h-4" />
            {saving ? 'Saving…' : isEdit ? 'Update Habit' : 'Create Habit'}
          </button>
          {isEdit && (
            <button type="button" onClick={() => setConfirmDelete(true)} className="btn-danger">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </form>

      <Modal open={showEmoji} onClose={() => setShowEmoji(false)} title={
        <span className="flex items-center gap-2"><Smile className="w-5 h-5" /> Choose an emoji</span>
      }>
        <EmojiPicker
          onEmojiClick={(e) => { setIcon(e.emoji); setShowEmoji(false) }}
          width="100%"
          height={420}
          previewConfig={{ showPreview: false }}
          searchDisabled={false}
        />
      </Modal>

      <Modal open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Delete habit?">
        <p className="text-slate-600 dark:text-slate-300">This will permanently delete the habit and all its history. This can't be undone.</p>
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={() => setConfirmDelete(false)} className="btn-secondary">Cancel</button>
          <button onClick={onDelete} disabled={saving} className="btn-danger">
            {saving ? 'Deleting…' : 'Delete forever'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
