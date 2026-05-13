'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { calculateCurrentWeek } from '@/lib/week-utils'
import {
  ChevronLeft, ChevronRight, CheckCircle2, Circle,
  TrendingUp, Trophy, Minus, Plus,
} from 'lucide-react'

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

type WeightLog = {
  exercise_id: string
  weight_used: number | null
  week_number: number
  logged_date: string
}

type SetState = { done: boolean; weight: number | null }

export default function WorkoutPage() {
  const { dayId } = useParams() as { dayId: string }
  const router = useRouter()
  const supabase = createClient()

  const [exercises, setExercises] = useState<Exercise[]>([])
  const [dayName, setDayName] = useState('')
  const [routineId, setRoutineId] = useState('')
  const [currentWeek, setCurrentWeek] = useState(1)
  const [currentIdx, setCurrentIdx] = useState(0)
  const [sets, setSets] = useState<Record<string, SetState[]>>({})
  const [lastWeekLogs, setLastWeekLogs] = useState<Record<string, number | null>>({})
  const [saving, setSaving] = useState(false)
  const [sessionComplete, setSessionComplete] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch day + exercises
      const { data: day } = await supabase
        .from('routine_days')
        .select('*, exercises(*), routines(start_date, id)')
        .eq('id', dayId)
        .maybeSingle()

      if (!day) return

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const routine = (day as any).routines as { start_date: string; id: string }
      const exs: Exercise[] = [...((day as any).exercises ?? [])].sort(
        (a: Exercise, b: Exercise) => a.order_index - b.order_index
      )

      setDayName(day.name)
      setRoutineId(routine.id)
      setCurrentWeek(calculateCurrentWeek(routine.start_date))
      setExercises(exs)

      // Init set states
      const initSets: Record<string, SetState[]> = {}
      exs.forEach((ex) => {
        initSets[ex.id] = Array.from({ length: ex.sets }, () => ({
          done: false,
          weight: ex.target_weight ?? ex.initial_weight ?? null,
        }))
      })
      setSets(initSets)

      // Fetch last week logs for comparison
      const week = calculateCurrentWeek(routine.start_date)
      const { data: logs } = await supabase
        .from('weight_logs')
        .select('exercise_id, weight_used, week_number, logged_date')
        .eq('routine_id', routine.id)
        .eq('week_number', week - 1)

      const logMap: Record<string, number | null> = {}
      ;(logs ?? []).forEach((l: WeightLog) => { logMap[l.exercise_id] = l.weight_used })
      setLastWeekLogs(logMap)
      setLoading(false)
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayId])

  const currentEx = exercises[currentIdx]

  const toggleSet = useCallback((exId: string, setIdx: number) => {
    setSets((prev) => {
      const copy = [...(prev[exId] ?? [])]
      copy[setIdx] = { ...copy[setIdx], done: !copy[setIdx].done }
      return { ...prev, [exId]: copy }
    })
  }, [])

  const adjustWeight = useCallback((exId: string, delta: number) => {
    setSets((prev) => {
      const copy = prev[exId].map((s) => ({
        ...s,
        weight: Math.max(0, (s.weight ?? 0) + delta),
      }))
      return { ...prev, [exId]: copy }
    })
  }, [])

  async function saveExercise() {
    if (!currentEx) return
    setSaving(true)
    const exSets = sets[currentEx.id] ?? []
    const weight = exSets.find((s) => s.done)?.weight ?? exSets[0]?.weight ?? null
    const doneCount = exSets.filter((s) => s.done).length

    await fetch('/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        exerciseId: currentEx.id,
        routineId,
        weightUsed: weight,
        setsDone: doneCount,
        repsDone: currentEx.reps,
        weekNumber: currentWeek,
      }),
    })

    setSaving(false)

    if (currentIdx < exercises.length - 1) {
      setCurrentIdx(currentIdx + 1)
    } else {
      setSessionComplete(true)
    }
  }

  const allSetsDone = currentEx
    ? (sets[currentEx.id] ?? []).every((s) => s.done)
    : false

  const progressPct = exercises.length
    ? Math.round((currentIdx / exercises.length) * 100)
    : 0

  if (loading) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span className="spinner" style={{ width: 32, height: 32 }} />
      </div>
    )
  }

  if (sessionComplete) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div className="animate-scale-in" style={{ textAlign: 'center' }}>
          <Trophy size={72} color="var(--amber)" style={{ marginBottom: '1rem' }} />
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Workout Done!</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
            Week {currentWeek} · {dayName} complete 🔥
          </p>
          <button className="btn btn-primary btn-lg" onClick={() => router.push('/dashboard')}>
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  if (!currentEx) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>No exercises found for this day.</p>
      </div>
    )
  }

  const exSets = sets[currentEx.id] ?? []
  const currentWeight = exSets[0]?.weight ?? 0
  const lastWeight = lastWeekLogs[currentEx.id]
  const weightDelta = lastWeight != null ? currentWeight - lastWeight : null

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <div style={{
        padding: '1rem',
        paddingTop: 'calc(1rem + env(safe-area-inset-top))',
        borderBottom: '1px solid var(--border-subtle)',
        background: 'var(--bg-card)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <button
            className="btn btn-ghost btn-icon btn-sm"
            onClick={() => router.push('/dashboard')}
          >
            <ChevronLeft size={18} />
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Week {currentWeek} · {dayName}
            </p>
            <p style={{ fontWeight: 700, fontSize: '0.9rem' }}>
              {currentIdx + 1} / {exercises.length} exercises
            </p>
          </div>
          <span className="badge badge-blue">Wk {currentWeek}</span>
        </div>

        {/* Progress bar */}
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      {/* Exercise area */}
      <div style={{ flex: 1, padding: '1.25rem 1rem', overflowY: 'auto' }}>
        {/* Exercise name */}
        <div className="animate-fade-up" style={{ marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{currentEx.name}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <span className="badge badge-blue">{currentEx.sets} sets</span>
            <span className="badge badge-blue">{currentEx.reps} reps</span>
            {currentEx.notes && (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>💬 {currentEx.notes}</span>
            )}
          </div>
        </div>

        {/* Weight control */}
        <div className="card animate-fade-up" style={{ padding: '1.25rem', marginBottom: '1rem', animationDelay: '60ms' }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '1rem' }}>
            Weight (kg)
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.25rem' }}>
            <button
              className="btn btn-ghost"
              style={{ width: 52, height: 52, borderRadius: '50%', padding: 0, fontSize: '1.5rem' }}
              onClick={() => adjustWeight(currentEx.id, -2.5)}
            >
              <Minus size={20} />
            </button>
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
                {currentWeight % 1 === 0 ? currentWeight : currentWeight.toFixed(1)}
              </span>
              <span style={{ color: 'var(--text-muted)', fontSize: '1rem', marginLeft: '0.3rem' }}>kg</span>
            </div>
            <button
              className="btn btn-ghost"
              style={{ width: 52, height: 52, borderRadius: '50%', padding: 0, fontSize: '1.5rem' }}
              onClick={() => adjustWeight(currentEx.id, 2.5)}
            >
              <Plus size={20} />
            </button>
          </div>

          {/* Last week comparison */}
          {lastWeight != null && (
            <div style={{ textAlign: 'center', marginTop: '0.75rem' }}>
              <span style={{
                fontSize: '0.78rem',
                color: weightDelta != null && weightDelta > 0
                  ? 'var(--neon-green)'
                  : weightDelta != null && weightDelta < 0
                  ? 'var(--rose)'
                  : 'var(--text-muted)',
                display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
              }}>
                <TrendingUp size={13} />
                Last week: {lastWeight} kg
                {weightDelta != null && weightDelta !== 0 && (
                  <span>({weightDelta > 0 ? '+' : ''}{weightDelta.toFixed(1)} kg)</span>
                )}
              </span>
            </div>
          )}
        </div>

        {/* Sets checklist */}
        <div className="card animate-fade-up" style={{ padding: '1rem', animationDelay: '120ms' }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>
            Sets
          </p>
          {exSets.map((s, idx) => (
            <div key={idx} className="set-row">
              <button
                className={`set-check ${s.done ? 'done' : ''}`}
                onClick={() => toggleSet(currentEx.id, idx)}
                aria-label={`Set ${idx + 1} ${s.done ? 'completed' : 'incomplete'}`}
              >
                {s.done ? <CheckCircle2 size={16} /> : <Circle size={16} />}
              </button>
              <span style={{ flex: 1, fontWeight: 600, color: s.done ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                Set {idx + 1}
              </span>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                {currentEx.reps} reps
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <div style={{
        padding: '1rem',
        paddingBottom: 'calc(5.5rem + env(safe-area-inset-bottom))',
        borderTop: '1px solid var(--border-subtle)',
        background: 'rgba(10,10,15,0.96)',
        backdropFilter: 'blur(12px)',
      }}>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {currentIdx > 0 && (
            <button
              className="btn btn-ghost"
              onClick={() => setCurrentIdx(currentIdx - 1)}
              style={{ flexShrink: 0 }}
            >
              <ChevronLeft size={18} />
            </button>
          )}
          <button
            className={`btn btn-full btn-lg ${allSetsDone ? 'btn-success' : 'btn-primary'}`}
            onClick={saveExercise}
            disabled={saving}
          >
            {saving ? (
              <><span className="spinner" />Saving…</>
            ) : currentIdx < exercises.length - 1 ? (
              <>Log &amp; Next <ChevronRight size={18} /></>
            ) : (
              <>Finish Workout 🏁</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
