'use client'

import { useState } from 'react'
import { TrendingUp, ChevronDown, ChevronUp, Edit2, Check, X } from 'lucide-react'

type Exercise = {
  id: string
  name: string
  sets: number
  reps: string
  target_weight: number | null
  initial_weight: number | null
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
}

type WeightLog = {
  id: string
  exercise_id: string
  weight_used: number | null
  week_number: number
  logged_date: string
  sets_done: number | null
  reps_done: string | null
}

type Props = {
  routine: Routine & { routine_days: RoutineDay[] }
  logs: WeightLog[]
  currentWeek: number
}

export default function HistoryClient({ routine, logs, currentWeek }: Props) {
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null)
  const [editingTarget, setEditingTarget] = useState<string | null>(null)
  const [targetDraft, setTargetDraft] = useState<string>('')
  const [targets, setTargets] = useState<Record<string, number | null>>(() => {
    const map: Record<string, number | null> = {}
    routine.routine_days.flatMap((d) => d.exercises).forEach((ex) => {
      map[ex.id] = ex.target_weight
    })
    return map
  })
  const [saving, setSaving] = useState<string | null>(null)

  const logsByExercise: Record<string, WeightLog[]> = {}
  logs.forEach((log) => {
    if (!logsByExercise[log.exercise_id]) logsByExercise[log.exercise_id] = []
    logsByExercise[log.exercise_id].push(log)
  })

  async function saveTarget(exerciseId: string) {
    setSaving(exerciseId)
    const val = parseFloat(targetDraft)
    if (!isNaN(val)) {
      await fetch(`/api/exercises/${exerciseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetWeight: val }),
      })
      setTargets((prev) => ({ ...prev, [exerciseId]: val }))
    }
    setEditingTarget(null)
    setSaving(null)
  }

  return (
    <div className="container page-pad">
      <header style={{ paddingTop: '1.5rem', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', marginBottom: '0.3rem' }}>History</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          {routine.name} · Week {currentWeek} of {routine.total_weeks}
        </p>
      </header>

      {routine.routine_days.map((day) => (
        <div key={day.id} style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'linear-gradient(135deg, var(--accent)25, var(--neon-green)25)',
              border: '1px solid var(--accent)30',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--accent)' }}>D{day.day_number}</span>
            </div>
            <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>{day.name}</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {day.exercises.map((ex) => {
              const exLogs = logsByExercise[ex.id] ?? []
              const isExpanded = expandedExercise === ex.id
              const isEditing = editingTarget === ex.id
              const target = targets[ex.id]
              const lastLog = exLogs[0]

              return (
                <div key={ex.id} className="card" style={{ overflow: 'hidden' }}>
                  {/* Header row */}
                  <div
                    style={{ padding: '0.9rem 1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem' }}
                    onClick={() => setExpandedExercise(isExpanded ? null : ex.id)}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {ex.name}
                      </p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {ex.sets}×{ex.reps}
                        {lastLog?.weight_used != null && (
                          <span style={{ marginLeft: '0.5rem', color: 'var(--neon-green)' }}>
                            · Last: {lastLog.weight_used} kg (Wk {lastLog.week_number})
                          </span>
                        )}
                      </p>
                    </div>

                    {/* Target weight + edit */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                      {isEditing ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }} onClick={(e) => e.stopPropagation()}>
                          <input
                            className="input"
                            type="number"
                            value={targetDraft}
                            onChange={(e) => setTargetDraft(e.target.value)}
                            style={{ width: 68, padding: '0.3rem 0.5rem', fontSize: '0.9rem', textAlign: 'center' }}
                            autoFocus
                          />
                          <button className="btn btn-success btn-sm btn-icon" onClick={() => saveTarget(ex.id)} disabled={saving === ex.id}>
                            {saving === ex.id ? <span className="spinner" /> : <Check size={14} />}
                          </button>
                          <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setEditingTarget(null)}>
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <>
                          {target != null && (
                            <span style={{ fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 700 }}>
                              {target} kg
                            </span>
                          )}
                          <button
                            className="btn btn-ghost btn-sm btn-icon"
                            title="Edit target weight"
                            onClick={(e) => {
                              e.stopPropagation()
                              setTargetDraft(String(target ?? ''))
                              setEditingTarget(ex.id)
                            }}
                          >
                            <Edit2 size={13} />
                          </button>
                        </>
                      )}
                      {isExpanded ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
                    </div>
                  </div>

                  {/* Expanded log */}
                  {isExpanded && (
                    <div style={{ borderTop: '1px solid var(--border-subtle)', padding: '0.75rem 1rem' }}>
                      {exLogs.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center', padding: '0.5rem 0' }}>
                          No logs yet — complete a workout to see history.
                        </p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                          {exLogs.map((log) => (
                            <div key={log.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.35rem 0', borderBottom: '1px solid var(--border-subtle)' }}>
                              <TrendingUp size={13} color="var(--accent)" style={{ flexShrink: 0 }} />
                              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', flex: 1 }}>
                                Week {log.week_number} · {new Date(log.logged_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </span>
                              <span style={{ fontWeight: 700, fontSize: '0.875rem', color: log.weight_used ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                                {log.weight_used != null ? `${log.weight_used} kg` : '—'}
                              </span>
                              {log.sets_done != null && (
                                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                  {log.sets_done}×{log.reps_done}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {routine.routine_days.every((d) => d.exercises.length === 0) && (
        <div className="empty-state">
          <p style={{ color: 'var(--text-muted)' }}>No exercises found in this routine.</p>
        </div>
      )}
    </div>
  )
}
