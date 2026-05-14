'use client'

import { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import {
  ChevronDown, ChevronUp, Plus, Minus, Upload,
  Dumbbell, TrendingUp, Check, Edit2, X, Bell, Trash2
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

type Unit = 'kg' | 'lbs'

type Exercise = {
  id: string
  name: string
  sets: number
  reps: string
  target_weight: number | null
  initial_weight: number | null
  notes: string | null
  order_index: number
  superset_id: string | null
}

type RoutineDay = {
  id: string
  day_number: number
  name: string
  description: string | null
  exercises: Exercise[]
}

type Routine = {
  id: string
  name: string
  start_date: string
  total_weeks: number | null
  is_active: boolean | null
}

type Props = {
  routine: (Routine & { routine_days: RoutineDay[] }) | null
  currentWeek: number
  progressPct: number
  lastWeekLogs: Record<string, number | null>
  thisWeekLogs: Record<string, number | null>
}

// ─── Unit helpers ─────────────────────────────────────────────────────────────

const KG_TO_LBS = 2.20462

function toDisplay(kg: number, unit: Unit): number {
  return unit === 'lbs' ? Math.round(kg * KG_TO_LBS * 10) / 10 : kg
}

function toKg(val: number, unit: Unit): number {
  return unit === 'lbs' ? Math.round((val / KG_TO_LBS) * 100) / 100 : val
}

function fmt(val: number): string {
  return val % 1 === 0 ? String(val) : val.toFixed(1)
}

// ─── Component ───────────────────────────────────────────────────────────────

// ─── Extra routine entry type ────────────────────────────────────────────────
type RoutineEntry = { id: string; name: string; sets: number; reps: string; notes: string }

export default function DashboardClient({
  routine,
  currentWeek,
  progressPct,
  lastWeekLogs,
  thisWeekLogs,
}: Props) {
  // Which days are expanded (default: all expanded)
  const [expandedDays, setExpandedDays] = useState<Set<string>>(
    () => new Set(routine?.routine_days.map((d) => d.id) ?? [])
  )

  // Per-exercise state
  const [weights, setWeights] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {}
    routine?.routine_days.flatMap((d) => d.exercises).forEach((ex) => {
      init[ex.id] = ex.target_weight ?? ex.initial_weight ?? 0
    })
    return init
  })
  const [sets, setSets] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {}
    routine?.routine_days.flatMap((d) => d.exercises).forEach((ex) => { init[ex.id] = ex.sets })
    return init
  })
  const [reps, setReps] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    routine?.routine_days.flatMap((d) => d.exercises).forEach((ex) => { init[ex.id] = ex.reps })
    return init
  })
  const [units, setUnits] = useState<Record<string, Unit>>({})
  const [saved, setSaved] = useState<Record<string, boolean>>({})
  const [saving, setSaving] = useState<Record<string, boolean>>({})

  // ─── Bi-weekly reminder ───────────────────────────────────────────────────
  const reminderKey = `gym_reminder_dismissed_w${currentWeek}`
  const showReminder = currentWeek % 2 === 0
  const [reminderDismissed, setReminderDismissed] = useState(false)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setReminderDismissed(!!sessionStorage.getItem(reminderKey))
    }
  }, [reminderKey])
  function dismissReminder() {
    sessionStorage.setItem(reminderKey, '1')
    setReminderDismissed(true)
  }

  // ─── Pre/Post routine sections ────────────────────────────────────────────
  const [preEntries, setPreEntries] = useState<RoutineEntry[]>([])
  const [postEntries, setPostEntries] = useState<RoutineEntry[]>([])
  const [preExpanded, setPreExpanded] = useState(true)
  const [postExpanded, setPostExpanded] = useState(true)
  const [newPre, setNewPre] = useState({ name: '', sets: 3, reps: '15', notes: '' })
  const [newPost, setNewPost] = useState({ name: '', sets: 1, reps: '20', notes: '' })
  const [showPreForm, setShowPreForm] = useState(false)
  const [showPostForm, setShowPostForm] = useState(false)

  useEffect(() => {
    try {
      const pre = localStorage.getItem('gym_pre_routine')
      const post = localStorage.getItem('gym_post_routine')
      if (pre) setPreEntries(JSON.parse(pre))
      if (post) setPostEntries(JSON.parse(post))
    } catch { /* ignore */ }
  }, [])

  function savePreEntries(entries: RoutineEntry[]) {
    setPreEntries(entries)
    localStorage.setItem('gym_pre_routine', JSON.stringify(entries))
  }
  function savePostEntries(entries: RoutineEntry[]) {
    setPostEntries(entries)
    localStorage.setItem('gym_post_routine', JSON.stringify(entries))
  }
  function addPreEntry() {
    if (!newPre.name.trim()) return
    const entry: RoutineEntry = { ...newPre, id: crypto.randomUUID() }
    savePreEntries([...preEntries, entry])
    setNewPre({ name: '', sets: 3, reps: '15', notes: '' })
    setShowPreForm(false)
  }
  function addPostEntry() {
    if (!newPost.name.trim()) return
    const entry: RoutineEntry = { ...newPost, id: crypto.randomUUID() }
    savePostEntries([...postEntries, entry])
    setNewPost({ name: '', sets: 1, reps: '20', notes: '' })
    setShowPostForm(false)
  }
  function deletePreEntry(id: string) { savePreEntries(preEntries.filter(e => e.id !== id)) }
  function deletePostEntry(id: string) { savePostEntries(postEntries.filter(e => e.id !== id)) }

  function getUnit(exId: string): Unit {
    return units[exId] ?? 'kg'
  }

  const toggleDay = useCallback((id: string) => {
    setExpandedDays((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }, [])

  function adjustWeight(exId: string, delta: number) {
    const unit = getUnit(exId)
    const currentKg = weights[exId] ?? 0
    const currentDisplay = toDisplay(currentKg, unit)
    const newDisplay = Math.max(0, currentDisplay + delta)
    const newKg = toKg(newDisplay, unit)
    setWeights((prev) => ({ ...prev, [exId]: newKg }))
    setSaved((prev) => ({ ...prev, [exId]: false }))
  }

  function handleSetChange(exId: string, val: number) {
    setSets((prev) => ({ ...prev, [exId]: Math.max(1, val) }))
    setSaved((prev) => ({ ...prev, [exId]: false }))
  }

  function handleRepChange(exId: string, val: string) {
    setReps((prev) => ({ ...prev, [exId]: val }))
    setSaved((prev) => ({ ...prev, [exId]: false }))
  }

  function changeUnit(exId: string, unit: Unit) {
    setUnits((prev) => ({ ...prev, [exId]: unit }))
  }

  async function saveExercise(exId: string) {
    setSaving((prev) => ({ ...prev, [exId]: true }))
    const kg = weights[exId] ?? 0
    await fetch(`/api/exercises/${exId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetWeight: kg, sets: sets[exId], reps: reps[exId] }),
    })
    setSaving((prev) => ({ ...prev, [exId]: false }))
    setSaved((prev) => ({ ...prev, [exId]: true }))
    setTimeout(() => setSaved((prev) => ({ ...prev, [exId]: false })), 2000)
  }

  // ─── Empty state ─────────────────────────────────────────────────────────

  if (!routine) {
    return (
      <div className="container page-pad">
        <header style={{ paddingTop: '1.5rem', marginBottom: '1.75rem' }}>
          <h1 style={{ fontSize: '1.75rem' }}>Dashboard</h1>
        </header>
        <div className="empty-state animate-fade-up">
          <div className="empty-state-icon">
            <Dumbbell size={28} />
          </div>
          <h2 style={{ fontSize: '1.3rem' }}>No routine yet</h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '260px' }}>
            Upload your Excel file from your gym to get started.
          </p>
          <Link href="/upload" className="btn btn-primary btn-lg" style={{ marginTop: '0.5rem' }}>
            <Upload size={18} />
            Import Routine
          </Link>
        </div>
      </div>
    )
  }

  // ─── Main render ──────────────────────────────────────────────────────────

  return (
    <div className="container page-pad">
      {/* Header */}
      <header style={{ paddingTop: '1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <p style={{
            color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600,
            letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.25rem',
          }}>
            {getGreeting()}
          </p>
          <h1 style={{ fontSize: '1.65rem' }}>{routine.name}</h1>
        </div>
        <Link 
          href={`/routine/${routine.id}/build`}
          className="btn btn-ghost btn-sm"
          style={{ gap: '0.4rem', padding: '0.4rem 0.6rem' }}
        >
          <Edit2 size={14} />
          <span style={{ fontSize: '0.75rem' }}>Edit Routine</span>
        </Link>
      </header>

      {/* Week progress card */}
      <div className="card animate-fade-up" style={{ padding: '1.25rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.9rem' }}>
          <div>
            <span className="badge badge-green" style={{ marginBottom: '0.35rem' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--neon-green)', display: 'inline-block' }} />
              Active
            </span>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
              Week {currentWeek} of {routine.total_weeks ?? 8}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--accent)', lineHeight: 1 }}>
              {currentWeek}
            </p>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>/ {routine.total_weeks} wks</p>
          </div>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${progressPct}%` }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.4rem' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Start: {formatDate(routine.start_date)}</span>
          <span style={{ fontSize: '0.72rem', color: 'var(--accent)', fontWeight: 700 }}>{progressPct}% complete</span>
        </div>
      </div>

      {/* Bi-weekly reminder banner */}
      {showReminder && !reminderDismissed && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          background: '#2a1a00', border: '1px solid #f59e0b60',
          borderRadius: 'var(--radius)', padding: '0.85rem 1rem',
          marginBottom: '1.25rem',
        }}>
          <Bell size={16} color="var(--amber)" style={{ flexShrink: 0 }} />
          <p style={{ flex: 1, fontSize: '0.82rem', color: 'var(--amber)', lineHeight: 1.4 }}>
            <strong>Week {currentWeek} reminder</strong> — Time to add <strong>+2 reps</strong> to each exercise!
          </p>
          <button
            onClick={dismissReminder}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--amber)', padding: '0.2rem', flexShrink: 0 }}
            aria-label="Dismiss reminder"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Pre-routine (Abs) */}
      {renderExtraSection({
        label: '🧘 Pre-Routine · Abs',
        entries: preEntries,
        expanded: preExpanded,
        setExpanded: setPreExpanded,
        showForm: showPreForm,
        setShowForm: setShowPreForm,
        newEntry: newPre,
        setNewEntry: setNewPre as (v: typeof newPre) => void,
        onAdd: addPreEntry,
        onDelete: deletePreEntry,
      })}

      {/* Main training days */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {routine.routine_days.map((day) => {
          const isOpen = expandedDays.has(day.id)
          return (
            <div key={day.id} className="card" style={{ overflow: 'hidden' }}>
              {/* Day header — tap to expand/collapse */}
              <button
                onClick={() => toggleDay(day.id)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: '0.85rem',
                  padding: '1rem 1.1rem', background: 'none', border: 'none',
                  cursor: 'pointer', color: 'inherit', fontFamily: 'inherit',
                  textAlign: 'left',
                }}
              >
                {/* Day badge */}
                <div style={{
                  width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                  background: isOpen
                    ? 'linear-gradient(135deg, var(--accent)30, var(--neon-green)20)'
                    : 'var(--bg-surface)',
                  border: `1px solid ${isOpen ? 'var(--accent)40' : 'var(--border-subtle)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s ease',
                }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 800, color: isOpen ? 'var(--accent)' : 'var(--text-muted)' }}>
                    D{day.day_number}
                  </span>
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                    {day.name}{day.description ? <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: '0.82rem' }}> · {day.description}</span> : null}
                  </p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                    {day.exercises.length} exercise{day.exercises.length !== 1 ? 's' : ''}
                  </p>
                </div>

                {isOpen
                  ? <ChevronUp size={16} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                  : <ChevronDown size={16} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                }
              </button>

              {/* Exercises list */}
              {isOpen && (
                <div style={{ borderTop: '1px solid var(--border-subtle)' }}>
                  {(() => {
                    // Group supersets
                    const groups: Exercise[][] = []
                    let currentGroupId: string | null = null
                    let currentGroup: Exercise[] = []
                    for (const ex of day.exercises) {
                      if (ex.superset_id && ex.superset_id === currentGroupId) {
                        currentGroup.push(ex)
                      } else {
                        if (currentGroup.length > 0) groups.push(currentGroup)
                        currentGroup = [ex]
                        currentGroupId = ex.superset_id ?? null
                      }
                    }
                    if (currentGroup.length > 0) groups.push(currentGroup)

                    return groups.map((group, gIdx) => {
                      const isSuperset = group.length > 1
                      const isLastGroup = gIdx === groups.length - 1

                      return (
                        <div
                          key={`group-${gIdx}`}
                          style={{
                            padding: isSuperset ? '0.75rem 0' : '0.75rem 1rem',
                            borderBottom: isLastGroup ? 'none' : '1px solid var(--border-subtle)',
                            background: isSuperset ? 'var(--bg-surface)' : 'transparent',
                          }}
                        >
                          {isSuperset && (
                            <div style={{ padding: '0 1rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span className="badge" style={{ background: 'var(--accent)', color: '#fff' }}>SUPERSET</span>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Swipe →</span>
                            </div>
                          )}

                          <div style={{
                            display: isSuperset ? 'flex' : 'block',
                            overflowX: isSuperset ? 'auto' : 'visible',
                            scrollSnapType: isSuperset ? 'x mandatory' : 'none',
                            gap: '1rem',
                            padding: isSuperset ? '0 1rem' : '0',
                            WebkitOverflowScrolling: 'touch',
                            scrollbarWidth: 'none',
                          }}>
                            {group.map((ex) => {
                              const unit = getUnit(ex.id)
                              const weightKg = weights[ex.id] ?? 0
                              const displayVal = toDisplay(weightKg, unit)
                              const lastKg = lastWeekLogs[ex.id]
                              const lastDisplay = lastKg != null ? toDisplay(lastKg, unit) : null
                              const thisKg = thisWeekLogs[ex.id]
                              const thisDisplay = thisKg != null ? toDisplay(thisKg, unit) : null
                              const isSaving = saving[ex.id]
                              const isSaved = saved[ex.id]

                              return (
                                <div
                                  key={ex.id}
                                  style={{
                                    flexShrink: 0,
                                    width: isSuperset ? '85vw' : '100%',
                                    maxWidth: isSuperset ? '340px' : 'none',
                                    scrollSnapAlign: 'start',
                                    background: isSuperset ? 'var(--bg-card)' : 'transparent',
                                    borderRadius: isSuperset ? 'var(--radius)' : 0,
                                    padding: isSuperset ? '1rem' : 0,
                                    border: isSuperset ? '1px solid var(--border-subtle)' : 'none',
                                  }}
                                >
                                  {/* Exercise name + meta */}
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', gap: '0.5rem' }}>
                                    <p style={{ fontWeight: 600, fontSize: '0.88rem', flex: 1, minWidth: 0 }}>
                                      {ex.name}
                                    </p>
                                    {ex.notes && (
                                      <span title={ex.notes} style={{ fontSize: '0.75rem', cursor: 'default' }}>💬</span>
                                    )}
                                  </div>

                                  {/* Sets/Reps inline edit row */}
                                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'var(--bg-surface)', padding: '0.3rem 0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', flexShrink: 0 }}>Sets</span>
                                      <input
                                        type="number"
                                        min={1}
                                        value={sets[ex.id] ?? ex.sets}
                                        onChange={(e) => handleSetChange(ex.id, parseInt(e.target.value) || 1)}
                                        style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '0.9rem', fontWeight: 600, width: 36, outline: 'none', MozAppearance: 'textfield' }}
                                      />
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'var(--bg-surface)', padding: '0.3rem 0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', flexShrink: 0 }}>Reps</span>
                                      <input
                                        type="text"
                                        value={reps[ex.id] ?? ex.reps}
                                        onChange={(e) => handleRepChange(ex.id, e.target.value)}
                                        style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '0.9rem', fontWeight: 600, width: 44, outline: 'none' }}
                                      />
                                    </div>
                                  </div>

                                  {/* Weight row: − value + | unit | save — fits 393px */}
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    {/* Minus */}
                                    <button
                                      className="btn btn-ghost"
                                      style={{ width: 36, height: 36, padding: 0, borderRadius: '50%', flexShrink: 0, border: '1px solid var(--border)' }}
                                      onClick={() => adjustWeight(ex.id, -5)}
                                      aria-label="-5"
                                    >
                                      <Minus size={15} />
                                    </button>

                                    {/* Weight value */}
                                    <div style={{
                                      flex: 1, textAlign: 'center', background: 'var(--bg-surface)',
                                      borderRadius: 'var(--radius-sm)', padding: '0.3rem 0.25rem',
                                      border: '1px solid var(--border)', minWidth: 0,
                                    }}>
                                      <span style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
                                        {fmt(displayVal)}
                                      </span>
                                    </div>

                                    {/* Plus */}
                                    <button
                                      className="btn btn-ghost"
                                      style={{ width: 36, height: 36, padding: 0, borderRadius: '50%', flexShrink: 0, border: '1px solid var(--border)' }}
                                      onClick={() => adjustWeight(ex.id, 5)}
                                      aria-label="+5"
                                    >
                                      <Plus size={15} />
                                    </button>

                                    {/* Unit dropdown */}
                                    <select
                                      value={unit}
                                      onChange={(e) => changeUnit(ex.id, e.target.value as Unit)}
                                      aria-label="unit"
                                      style={{
                                        background: 'var(--bg-surface)',
                                        border: '1px solid var(--border)',
                                        borderRadius: 'var(--radius-sm)',
                                        color: 'var(--text-primary)',
                                        fontFamily: 'inherit',
                                        fontSize: '0.75rem',
                                        fontWeight: 700,
                                        padding: '0.3rem 0.4rem',
                                        cursor: 'pointer',
                                        flexShrink: 0,
                                        width: 46,
                                        appearance: 'none',
                                        WebkitAppearance: 'none',
                                        textAlign: 'center',
                                      }}
                                    >
                                      <option value="kg">kg</option>
                                      <option value="lbs">lbs</option>
                                    </select>

                                    {/* Save — icon only to save width */}
                                    <button
                                      className={`btn ${isSaved ? 'btn-success' : 'btn-primary'}`}
                                      style={{ width: 36, height: 36, padding: 0, borderRadius: 'var(--radius-sm)', flexShrink: 0 }}
                                      onClick={() => saveExercise(ex.id)}
                                      disabled={isSaving}
                                      aria-label="Save changes"
                                    >
                                      {isSaving
                                        ? <span className="spinner" style={{ width: 13, height: 13 }} />
                                        : <Check size={15} />
                                      }
                                    </button>
                                  </div>

                                  {/* History comparison */}
                                  <div style={{ display: 'flex', gap: '1rem', marginTop: '0.65rem', flexWrap: 'wrap' }}>
                                    {thisDisplay != null && (
                                      <span style={{ fontSize: '0.72rem', color: 'var(--neon-green)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--neon-green)', display: 'inline-block' }} />
                                        This week: {fmt(thisDisplay)} {unit}
                                      </span>
                                    )}
                                    {lastDisplay != null && (
                                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                        <TrendingUp size={11} />
                                        Last week: {fmt(lastDisplay)} {unit}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })
                  })()}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Post-routine (Cardio) */}
      {renderExtraSection({
        label: '🏃 Post-Routine · Cardio',
        entries: postEntries,
        expanded: postExpanded,
        setExpanded: setPostExpanded,
        showForm: showPostForm,
        setShowForm: setShowPostForm,
        newEntry: newPost,
        setNewEntry: setNewPost as (v: typeof newPost) => void,
        onAdd: addPostEntry,
        onDelete: deletePostEntry,
      })}

      {/* Import new routine link */}
      <div style={{ marginTop: '1.75rem', paddingBottom: '1rem' }}>
        <Link
          href="/upload"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem', textDecoration: 'none' }}
        >
          <Upload size={13} />
          Import a new routine
        </Link>
      </div>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return '🌅 Good morning'
  if (h < 18) return '☀️ Good afternoon'
  return '🌙 Good evening'
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

// ─── Extra section renderer (Pre/Post routine) ────────────────────────────────

type ExtraSectionProps = {
  label: string
  entries: { id: string; name: string; sets: number; reps: string; notes: string }[]
  expanded: boolean
  setExpanded: (v: boolean) => void
  showForm: boolean
  setShowForm: (v: boolean) => void
  newEntry: { name: string; sets: number; reps: string; notes: string }
  setNewEntry: (v: { name: string; sets: number; reps: string; notes: string }) => void
  onAdd: () => void
  onDelete: (id: string) => void
}

function renderExtraSection({
  label, entries, expanded, setExpanded,
  showForm, setShowForm, newEntry, setNewEntry, onAdd, onDelete,
}: ExtraSectionProps) {
  return (
    <div className="card" style={{ overflow: 'hidden', marginBottom: '0.75rem' }}>
      {/* Section header */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem',
          padding: '0.85rem 1.1rem', background: 'none', border: 'none',
          cursor: 'pointer', color: 'inherit', fontFamily: 'inherit', textAlign: 'left',
        }}
      >
        <span style={{ flex: 1, fontWeight: 700, fontSize: '0.92rem' }}>{label}</span>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          {entries.length} exercise{entries.length !== 1 ? 's' : ''}
        </span>
        {expanded
          ? <ChevronUp size={16} color="var(--text-muted)" />
          : <ChevronDown size={16} color="var(--text-muted)" />}
      </button>

      {expanded && (
        <div style={{ borderTop: '1px solid var(--border-subtle)', padding: '0.75rem 1rem' }}>
          {/* Entry list */}
          {entries.map((e) => (
            <div key={e.id} style={{
              display: 'flex', alignItems: 'center', gap: '0.6rem',
              padding: '0.5rem 0', borderBottom: '1px solid var(--border-subtle)',
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 600, fontSize: '0.88rem' }}>{e.name}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {e.sets} sets × {e.reps} reps{e.notes ? ` · ${e.notes}` : ''}
                </p>
              </div>
              <button
                onClick={() => onDelete(e.id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.2rem', flexShrink: 0 }}
                aria-label="Delete"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}

          {/* Add form */}
          {showForm ? (
            <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <input
                className="input"
                placeholder="Exercise name"
                value={newEntry.name}
                onChange={(e) => setNewEntry({ ...newEntry, name: e.target.value })}
                style={{ fontSize: '0.85rem', padding: '0.5rem 0.75rem' }}
              />
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'var(--bg-surface)', padding: '0.3rem 0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', flexShrink: 0 }}>Sets</span>
                  <input
                    type="number" min={1}
                    value={newEntry.sets}
                    onChange={(e) => setNewEntry({ ...newEntry, sets: parseInt(e.target.value) || 1 })}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '0.9rem', fontWeight: 600, width: 36, outline: 'none' }}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'var(--bg-surface)', padding: '0.3rem 0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', flexShrink: 0 }}>Reps</span>
                  <input
                    type="text"
                    value={newEntry.reps}
                    onChange={(e) => setNewEntry({ ...newEntry, reps: e.target.value })}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '0.9rem', fontWeight: 600, width: 44, outline: 'none' }}
                  />
                </div>
                <input
                  className="input"
                  placeholder="Notes (optional)"
                  value={newEntry.notes}
                  onChange={(e) => setNewEntry({ ...newEntry, notes: e.target.value })}
                  style={{ flex: 1, fontSize: '0.8rem', padding: '0.3rem 0.6rem' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-primary btn-sm" onClick={onAdd} style={{ flex: 1 }}>
                  <Plus size={14} /> Add
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setShowForm(true)}
              style={{ marginTop: '0.6rem', width: '100%', justifyContent: 'center', gap: '0.4rem', fontSize: '0.78rem' }}
            >
              <Plus size={13} /> Add Exercise
            </button>
          )}
        </div>
      )}
    </div>
  )
}
