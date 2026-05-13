'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import {
  ChevronDown, ChevronUp, Plus, Minus, Upload,
  Dumbbell, Calendar, TrendingUp, Check, Zap,
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
}

type RoutineDay = {
  id: string
  day_number: number
  name: string
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

  // Per-exercise: weight in KG (source of truth), unit, saving state
  const [weights, setWeights] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {}
    routine?.routine_days.flatMap((d) => d.exercises).forEach((ex) => {
      init[ex.id] = ex.target_weight ?? ex.initial_weight ?? 0
    })
    return init
  })
  const [units, setUnits] = useState<Record<string, Unit>>({})
  const [saved, setSaved] = useState<Record<string, boolean>>({})
  const [saving, setSaving] = useState<Record<string, boolean>>({})

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

  function changeUnit(exId: string, unit: Unit) {
    setUnits((prev) => ({ ...prev, [exId]: unit }))
  }

  async function saveWeight(exId: string) {
    setSaving((prev) => ({ ...prev, [exId]: true }))
    const kg = weights[exId] ?? 0
    await fetch(`/api/exercises/${exId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetWeight: kg }),
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
      <header style={{ paddingTop: '1.5rem', marginBottom: '1.5rem' }}>
        <p style={{
          color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600,
          letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.25rem',
        }}>
          {getGreeting()}
        </p>
        <h1 style={{ fontSize: '1.65rem' }}>{routine.name}</h1>
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

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem', marginBottom: '1.5rem' }}>
        <div className="card" style={{ padding: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Calendar size={18} color="var(--accent)" style={{ flexShrink: 0 }} />
          <div>
            <p style={{ fontSize: '1.2rem', fontWeight: 800 }}>{routine.routine_days.length}</p>
            <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Training Days</p>
          </div>
        </div>
        <div className="card" style={{ padding: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <TrendingUp size={18} color="var(--neon-green)" style={{ flexShrink: 0 }} />
          <div>
            <p style={{ fontSize: '1.2rem', fontWeight: 800 }}>
              {routine.routine_days.reduce((s, d) => s + d.exercises.length, 0)}
            </p>
            <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Exercises</p>
          </div>
        </div>
      </div>

      {/* Days accordion */}
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
                  <p style={{ fontWeight: 700, fontSize: '0.95rem' }}>{day.name}</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                    {day.exercises.length} exercise{day.exercises.length !== 1 ? 's' : ''}
                  </p>
                </div>

                {/* Start workout link */}
                <Link
                  href={`/workout/${day.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="btn btn-primary btn-sm"
                  style={{ flexShrink: 0, fontSize: '0.72rem', padding: '0.35rem 0.7rem' }}
                >
                  <Zap size={12} />
                  Start
                </Link>

                {isOpen
                  ? <ChevronUp size={16} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                  : <ChevronDown size={16} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                }
              </button>

              {/* Exercises list */}
              {isOpen && (
                <div style={{ borderTop: '1px solid var(--border-subtle)' }}>
                  {day.exercises.map((ex, idx) => {
                    const unit = getUnit(ex.id)
                    const weightKg = weights[ex.id] ?? 0
                    const displayVal = toDisplay(weightKg, unit)
                    const lastKg = lastWeekLogs[ex.id]
                    const lastDisplay = lastKg != null ? toDisplay(lastKg, unit) : null
                    const thisKg = thisWeekLogs[ex.id]
                    const thisDisplay = thisKg != null ? toDisplay(thisKg, unit) : null
                    const isSaving = saving[ex.id]
                    const isSaved = saved[ex.id]
                    const isLast = idx === day.exercises.length - 1

                    return (
                      <div
                        key={ex.id}
                        style={{
                          padding: '0.75rem 1rem',
                          borderBottom: isLast ? 'none' : '1px solid var(--border-subtle)',
                        }}
                      >
                        {/* Exercise name + meta */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.55rem', gap: '0.5rem' }}>
                          <p style={{ fontWeight: 600, fontSize: '0.88rem', flex: 1, minWidth: 0 }}>
                            {ex.name}
                          </p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', flexShrink: 0 }}>
                            <span className="badge badge-blue" style={{ fontSize: '0.65rem' }}>{ex.sets}×{ex.reps}</span>
                            {ex.notes && (
                              <span title={ex.notes} style={{ fontSize: '0.75rem', cursor: 'default' }}>💬</span>
                            )}
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
                            onClick={() => saveWeight(ex.id)}
                            disabled={isSaving}
                            aria-label="Save target weight"
                          >
                            {isSaving
                              ? <span className="spinner" style={{ width: 13, height: 13 }} />
                              : <Check size={15} />
                            }
                          </button>
                        </div>

                        {/* History comparison */}
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.55rem', flexWrap: 'wrap' }}>
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
              )}
            </div>
          )
        })}
      </div>

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
