'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Dumbbell, Calendar, Hash, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function NewRoutinePage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [startDate, setStartDate] = useState(todayStr())
  const [totalWeeks, setTotalWeeks] = useState(8)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function todayStr() {
    return new Date().toISOString().split('T')[0]
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('Please enter a routine name'); return }
    setLoading(true)
    setError(null)

    const res = await fetch('/api/routines', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), startDate, totalWeeks }),
    })
    const data = await res.json()
    setLoading(false)

    if (!res.ok) { setError(data.error ?? 'Failed to create routine'); return }
    router.push(`/routine/${data.routine.id}/build`)
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      {/* Background blobs */}
      <div aria-hidden style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: '60vw', height: '60vw', borderRadius: '50%', background: 'radial-gradient(circle, #3b82f615, transparent 70%)' }} />
        <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '50vw', height: '50vw', borderRadius: '50%', background: 'radial-gradient(circle, #22c55e10, transparent 70%)' }} />
      </div>

      <div className="container" style={{ flex: 1, position: 'relative', zIndex: 1, paddingTop: '2rem', paddingBottom: '6rem' }}>
        {/* Back */}
        <Link href="/dashboard" style={{ color: 'var(--text-muted)', fontSize: '0.82rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', marginBottom: '1.5rem' }}>
          ← Back
        </Link>

        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 56, height: 56, borderRadius: 16,
            background: 'linear-gradient(135deg, #3b82f6, #22c55e)',
            marginBottom: '1rem', boxShadow: '0 0 24px #3b82f640',
          }}>
            <Dumbbell size={28} color="#fff" />
          </div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.3rem' }}>New Routine</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Step 1 of 2 — Basic info
          </p>
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.75rem' }}>
          {[1, 2].map((s) => (
            <div key={s} style={{
              height: 4, flex: 1, borderRadius: 99,
              background: s === 1 ? 'var(--accent)' : 'var(--border)',
              transition: 'background 0.3s',
            }} />
          ))}
        </div>

        {error && <div className="alert alert-error" style={{ marginBottom: '1.25rem' }}>{error}</div>}

        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          <div>
            <label htmlFor="routine-name">Routine Name</label>
            <input
              id="routine-name"
              className="input"
              type="text"
              placeholder="e.g. Summer Cut, Bulk Phase 2…"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label htmlFor="start-date" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Calendar size={11} />Start Date
              </label>
              <input
                id="start-date"
                className="input"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                style={{ colorScheme: 'dark' }}
              />
            </div>
            <div>
              <label htmlFor="total-weeks" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Hash size={11} />Total Weeks
              </label>
              <input
                id="total-weeks"
                className="input"
                type="number"
                min={1}
                max={52}
                value={totalWeeks}
                onChange={(e) => setTotalWeeks(Number(e.target.value))}
                required
              />
            </div>
          </div>

          {/* Preview */}
          <div className="card" style={{ padding: '1rem', background: 'var(--bg-surface)', marginTop: '0.25rem' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Preview</p>
            <p style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.2rem' }}>{name || 'My Routine'}</p>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Starts {startDate} · {totalWeeks} weeks
            </p>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg btn-full"
            disabled={loading}
            style={{ marginTop: '0.5rem' }}
          >
            {loading
              ? <><span className="spinner" />Creating…</>
              : <>Next: Add Days <ArrowRight size={18} /></>
            }
          </button>
        </form>
      </div>
    </div>
  )
}
