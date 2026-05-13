'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Plus, Trash2, ChevronDown, ChevronUp,
  Check, Dumbbell, CheckCircle2, X, Edit2
} from 'lucide-react'

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  'General', 'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps',
  'Legs', 'Glutes', 'Core / Abs', 'Cardio', 'Full Body', 'Other',
]

// ─── Types ────────────────────────────────────────────────────────────────────

type Exercise = {
  id: string
  name: string
  sets: number
  reps: string
  initial_weight: number | null
  category: string | null
  notes: string | null
  order_index: number
}

type Day = {
  id: string
  day_number: number
  name: string
  description?: string | null
  exercises: Exercise[]
}

type Routine = { id: string; name: string; total_weeks: number | null }

// ─── ExerciseForm ─────────────────────────────────────────────────────────────

type ExerciseFormState = {
  name: string; sets: string; reps: string
  weight: string; category: string; notes: string
}

const EMPTY_EX: ExerciseFormState = {
  name: '', sets: '3', reps: '10', weight: '', category: 'General', notes: '',
}

function ExerciseForm({
  initial, onSave, onCancel, saving,
}: {
  initial?: ExerciseFormState
  onSave: (f: ExerciseFormState) => void
  onCancel: () => void
  saving: boolean
}) {
  const [form, setForm] = useState<ExerciseFormState>(initial ?? EMPTY_EX)
  const set = (k: keyof ExerciseFormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }))

  return (
    <div style={{
      background: 'var(--bg-surface)', borderRadius: 'var(--radius)',
      padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.7rem',
      border: '1px solid var(--accent)30',
    }}>
      {/* Name */}
      <div>
        <label htmlFor="ex-name">Exercise Name *</label>
        <input id="ex-name" className="input" placeholder="e.g. Bench Press" value={form.name} onChange={set('name')} required />
      </div>

      {/* Sets + Reps */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
        <div>
          <label htmlFor="ex-sets">Sets</label>
          <input id="ex-sets" className="input" type="number" min={1} max={20} value={form.sets} onChange={set('sets')} />
        </div>
        <div>
          <label htmlFor="ex-reps">Reps</label>
          <input id="ex-reps" className="input" placeholder="10 or 8-12" value={form.reps} onChange={set('reps')} />
        </div>
      </div>

      {/* Weight + Category */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
        <div>
          <label htmlFor="ex-weight">Weight (kg)</label>
          <input id="ex-weight" className="input" type="number" min={0} step={0.5} placeholder="0" value={form.weight} onChange={set('weight')} />
        </div>
        <div>
          <label htmlFor="ex-category">Category</label>
          <select
            id="ex-category"
            value={form.category}
            onChange={set('category')}
            style={{
              background: 'var(--bg-surface)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)',
              fontFamily: 'inherit', fontSize: '0.9rem', padding: '0.65rem 0.75rem',
              width: '100%', cursor: 'pointer',
            }}
          >
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="ex-notes">Notes <span style={{ color: 'var(--text-muted)', fontWeight: 400, textTransform: 'none' }}>(optional)</span></label>
        <input id="ex-notes" className="input" placeholder="e.g. slow on the way down" value={form.notes} onChange={set('notes')} />
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.2rem' }}>
        <button
          className="btn btn-primary btn-full"
          disabled={saving || !form.name.trim()}
          onClick={() => onSave(form)}
          style={{ flex: 1 }}
        >
          {saving ? <><span className="spinner" style={{ width: 14, height: 14 }} />Saving…</> : <><Check size={15} />{initial ? 'Update' : 'Add Exercise'}</>}
        </button>
        <button className="btn btn-ghost" onClick={onCancel} style={{ flexShrink: 0 }}>
          <X size={15} />
        </button>
      </div>
    </div>
  )
}

// ─── Main Builder ─────────────────────────────────────────────────────────────

export default function RoutineBuilderPage() {
  const { routineId } = useParams() as { routineId: string }
  const router = useRouter()

  const [routine, setRoutine] = useState<Routine | null>(null)
  const [days, setDays] = useState<Day[]>([])
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  // Day form
  const [showDayForm, setShowDayForm] = useState(false)
  const [dayName, setDayName] = useState('')
  const [dayDesc, setDayDesc] = useState('')
  const [addingDay, setAddingDay] = useState(false)

  // Exercise forms: keyed by dayId
  const [showExForm, setShowExForm] = useState<Record<string, boolean>>({})
  const [editingEx, setEditingEx] = useState<Record<string, Exercise | null>>({})
  const [savingEx, setSavingEx] = useState<Record<string, boolean>>({})
  const [deletingEx, setDeletingEx] = useState<Record<string, boolean>>({})
  const [deletingDay, setDeletingDay] = useState<Record<string, boolean>>({})

  useEffect(() => {
    loadData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routineId])

  async function loadData() {
    setLoading(true)
    const [routineRes, daysRes] = await Promise.all([
      fetch(`/api/routines?id=${routineId}`),
      fetch(`/api/routines/${routineId}/days`),
    ])

    // Fetch routine details from the days endpoint and infer routine info
    const daysData = await daysRes.json()
    const loadedDays: Day[] = (daysData.days ?? []).map((d: Day) => ({
      ...d,
      exercises: [...(d.exercises ?? [])].sort((a, b) => a.order_index - b.order_index),
    }))
    setDays(loadedDays)

    // Get routine info separately
    const allRes = await fetch('/api/routines')
    const allData = await allRes.json()
    const found = (allData.routines ?? []).find((r: Routine) => r.id === routineId)
    if (found) setRoutine(found)

    // Expand all days by default
    setExpandedDays(new Set(loadedDays.map((d: Day) => d.id)))
    setLoading(false)
  }

  // ─── Add Day ───────────────────────────────────────────────────────────────

  async function handleAddDay(e: React.FormEvent) {
    e.preventDefault()
    if (!dayName.trim()) return
    setAddingDay(true)

    const res = await fetch(`/api/routines/${routineId}/days`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dayNumber: days.length + 1,
        name: dayName.trim(),
        description: dayDesc.trim() || null,
      }),
    })
    const data = await res.json()
    setAddingDay(false)

    if (res.ok) {
      const newDay: Day = { ...data.day, exercises: [] }
      setDays((prev) => [...prev, newDay])
      setExpandedDays((prev) => new Set([...prev, newDay.id]))
      setDayName('')
      setDayDesc('')
      setShowDayForm(false)
    }
  }

  // ─── Delete Day ────────────────────────────────────────────────────────────

  async function handleDeleteDay(dayId: string) {
    if (!confirm('Delete this day and all its exercises?')) return
    setDeletingDay((p) => ({ ...p, [dayId]: true }))
    await fetch(`/api/days/${dayId}`, { method: 'DELETE' })
    setDays((prev) => prev.filter((d) => d.id !== dayId))
  }

  // ─── Add Exercise ──────────────────────────────────────────────────────────

  async function handleAddExercise(dayId: string, form: ExerciseFormState) {
    setSavingEx((p) => ({ ...p, [dayId]: true }))
    const day = days.find((d) => d.id === dayId)!

    const res = await fetch('/api/exercises', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        routineDayId: dayId,
        routineId,
        name: form.name.trim(),
        sets: Number(form.sets) || 3,
        reps: form.reps.trim() || '10',
        initialWeight: form.weight ? Number(form.weight) : null,
        category: form.category || 'General',
        notes: form.notes.trim() || null,
        orderIndex: day.exercises.length,
      }),
    })
    const data = await res.json()
    setSavingEx((p) => ({ ...p, [dayId]: false }))

    if (res.ok) {
      setDays((prev) => prev.map((d) =>
        d.id === dayId ? { ...d, exercises: [...d.exercises, data.exercise] } : d
      ))
      setShowExForm((p) => ({ ...p, [dayId]: false }))
    }
  }

  // ─── Edit Exercise ─────────────────────────────────────────────────────────

  async function handleUpdateExercise(exId: string, dayId: string, form: ExerciseFormState) {
    setSavingEx((p) => ({ ...p, [exId]: true }))

    const res = await fetch(`/api/exercises/${exId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name.trim(),
        sets: Number(form.sets) || 3,
        reps: form.reps.trim() || '10',
        initialWeight: form.weight ? Number(form.weight) : null,
        targetWeight: form.weight ? Number(form.weight) : null,
        category: form.category || 'General',
        notes: form.notes.trim() || null,
      }),
    })
    const data = await res.json()
    setSavingEx((p) => ({ ...p, [exId]: false }))

    if (res.ok) {
      setDays((prev) => prev.map((d) =>
        d.id === dayId
          ? { ...d, exercises: d.exercises.map((e) => e.id === exId ? data.exercise : e) }
          : d
      ))
      setEditingEx((p) => ({ ...p, [exId]: null }))
    }
  }

  // ─── Delete Exercise ───────────────────────────────────────────────────────

  async function handleDeleteExercise(exId: string, dayId: string) {
    setDeletingEx((p) => ({ ...p, [exId]: true }))
    await fetch(`/api/exercises/${exId}`, { method: 'DELETE' })
    setDays((prev) => prev.map((d) =>
      d.id === dayId ? { ...d, exercises: d.exercises.filter((e) => e.id !== exId) } : d
    ))
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span className="spinner" style={{ width: 32, height: 32 }} />
      </div>
    )
  }

  const totalExercises = days.reduce((s, d) => s + d.exercises.length, 0)

  return (
    <div className="container" style={{ paddingTop: '1.5rem', paddingBottom: '7rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.2rem' }}>
          Step 2 of 2 — Build your days
        </p>
        <h1 style={{ fontSize: '1.5rem', marginBottom: '0.2rem' }}>{routine?.name ?? 'Routine'}</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
          {days.length} day{days.length !== 1 ? 's' : ''} · {totalExercises} exercise{totalExercises !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Step bar */}
      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.5rem' }}>
        {[1, 2].map((s) => (
          <div key={s} style={{ height: 4, flex: 1, borderRadius: 99, background: 'var(--accent)', transition: 'background 0.3s' }} />
        ))}
      </div>

      {/* Days list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
        {days.map((day) => {
          const isOpen = expandedDays.has(day.id)
          return (
            <div key={day.id} className="card" style={{ overflow: 'hidden' }}>
              {/* Day header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.85rem 1rem' }}>
                <button
                  onClick={() => setExpandedDays((p) => {
                    const n = new Set(p)
                    n.has(day.id) ? n.delete(day.id) : n.add(day.id)
                    return n
                  })}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.65rem', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontFamily: 'inherit', textAlign: 'left', padding: 0 }}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                    background: isOpen ? 'linear-gradient(135deg, var(--accent)30, var(--neon-green)20)' : 'var(--bg-surface)',
                    border: `1px solid ${isOpen ? 'var(--accent)40' : 'var(--border-subtle)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
                  }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: isOpen ? 'var(--accent)' : 'var(--text-muted)' }}>D{day.day_number}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: day.description ? '0.1rem' : 0 }}>{day.name}</p>
                    {day.description && <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{day.description}</p>}
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>{day.exercises.length} exercise{day.exercises.length !== 1 ? 's' : ''}</p>
                  </div>
                  {isOpen ? <ChevronUp size={15} color="var(--text-muted)" /> : <ChevronDown size={15} color="var(--text-muted)" />}
                </button>

                {/* Delete day */}
                <button
                  className="btn btn-ghost btn-sm btn-icon"
                  onClick={() => handleDeleteDay(day.id)}
                  disabled={deletingDay[day.id]}
                  style={{ flexShrink: 0, color: 'var(--rose)' }}
                  aria-label="Delete day"
                >
                  {deletingDay[day.id] ? <span className="spinner" style={{ width: 13, height: 13 }} /> : <Trash2 size={14} />}
                </button>
              </div>

              {/* Exercises */}
              {isOpen && (
                <div style={{ borderTop: '1px solid var(--border-subtle)' }}>
                  {day.exercises.map((ex, idx) => {
                    const isEditing = editingEx[ex.id] !== undefined && editingEx[ex.id] !== null
                    return (
                      <div key={ex.id} style={{
                        padding: '0.75rem 1rem',
                        borderBottom: idx < day.exercises.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                      }}>
                        {isEditing ? (
                          <ExerciseForm
                            initial={{
                              name: ex.name,
                              sets: String(ex.sets),
                              reps: ex.reps,
                              weight: ex.initial_weight != null ? String(ex.initial_weight) : '',
                              category: ex.category ?? 'General',
                              notes: ex.notes ?? '',
                            }}
                            onSave={(f) => handleUpdateExercise(ex.id, day.id, f)}
                            onCancel={() => setEditingEx((p) => ({ ...p, [ex.id]: null }))}
                            saving={!!savingEx[ex.id]}
                          />
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {/* Category dot */}
                            <div style={{
                              width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                              background: categoryColor(ex.category),
                            }} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>{ex.name}</p>
                              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                {ex.sets}×{ex.reps}
                                {ex.initial_weight != null && ` · ${ex.initial_weight} kg`}
                                {ex.category && ex.category !== 'General' && ` · ${ex.category}`}
                              </p>
                            </div>
                            {/* Edit */}
                            <button
                              className="btn btn-ghost btn-sm btn-icon"
                              onClick={() => setEditingEx((p) => ({ ...p, [ex.id]: ex }))}
                              aria-label="Edit exercise"
                            ><Edit2 size={13} /></button>
                            {/* Delete */}
                            <button
                              className="btn btn-ghost btn-sm btn-icon"
                              onClick={() => handleDeleteExercise(ex.id, day.id)}
                              disabled={deletingEx[ex.id]}
                              style={{ color: 'var(--rose)' }}
                              aria-label="Delete exercise"
                            >
                              {deletingEx[ex.id] ? <span className="spinner" style={{ width: 12, height: 12 }} /> : <Trash2 size={13} />}
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}

                  {/* Add exercise inline */}
                  <div style={{ padding: '0.75rem 1rem', borderTop: day.exercises.length > 0 ? '1px solid var(--border-subtle)' : 'none' }}>
                    {showExForm[day.id] ? (
                      <ExerciseForm
                        onSave={(f) => handleAddExercise(day.id, f)}
                        onCancel={() => setShowExForm((p) => ({ ...p, [day.id]: false }))}
                        saving={!!savingEx[day.id]}
                      />
                    ) : (
                      <button
                        className="btn btn-ghost btn-full"
                        style={{ borderStyle: 'dashed', fontSize: '0.82rem', color: 'var(--accent)' }}
                        onClick={() => setShowExForm((p) => ({ ...p, [day.id]: true }))}
                      >
                        <Plus size={15} />Add Exercise
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Add Day */}
      {showDayForm ? (
        <div className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.7rem', border: '1px solid var(--accent)30', marginBottom: '1rem' }}>
          <p style={{ fontWeight: 700, fontSize: '0.9rem' }}>New Training Day</p>
          <form onSubmit={handleAddDay} style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            <div>
              <label htmlFor="day-name">Day Name *</label>
              <input
                id="day-name"
                className="input"
                placeholder="e.g. Push, Shoulders, Legs A…"
                value={dayName}
                onChange={(e) => setDayName(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div>
              <label htmlFor="day-desc">Description <span style={{ color: 'var(--text-muted)', fontWeight: 400, textTransform: 'none' }}>(optional)</span></label>
              <input
                id="day-desc"
                className="input"
                placeholder="e.g. Day 1 - Shoulders & Triceps"
                value={dayDesc}
                onChange={(e) => setDayDesc(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: '0.6rem' }}>
              <button type="submit" className="btn btn-primary" disabled={addingDay} style={{ flex: 1 }}>
                {addingDay ? <><span className="spinner" style={{ width: 14, height: 14 }} />Adding…</> : <><Plus size={15} />Add Day</>}
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => { setShowDayForm(false); setDayName(''); setDayDesc('') }}>
                <X size={15} />
              </button>
            </div>
          </form>
        </div>
      ) : (
        <button
          className="btn btn-ghost btn-full"
          style={{ borderStyle: 'dashed', marginBottom: '1rem' }}
          onClick={() => setShowDayForm(true)}
        >
          <Plus size={16} />Add Training Day
        </button>
      )}

      {/* Done */}
      {days.length > 0 && totalExercises > 0 && (
        <button
          className="btn btn-success btn-lg btn-full"
          onClick={() => router.push('/dashboard')}
        >
          <CheckCircle2 size={18} />Done — Go to Dashboard
        </button>
      )}

      {days.length === 0 && (
        <div className="empty-state" style={{ padding: '2rem 1rem' }}>
          <div className="empty-state-icon"><Dumbbell size={24} /></div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', textAlign: 'center' }}>
            Add your first training day above to get started
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function categoryColor(cat: string | null): string {
  const map: Record<string, string> = {
    Chest: '#ef4444', Back: '#3b82f6', Shoulders: '#a855f7',
    Biceps: '#f59e0b', Triceps: '#f97316', Legs: '#22c55e',
    Glutes: '#ec4899', 'Core / Abs': '#06b6d4', Cardio: '#84cc16',
    'Full Body': '#6366f1', Other: '#94a3b8', General: '#64748b',
  }
  return map[cat ?? 'General'] ?? '#64748b'
}
