'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, X, Calendar, Hash } from 'lucide-react'

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [routineName, setRoutineName] = useState('')
  const [startDate, setStartDate] = useState(todayStr())
  const [totalWeeks, setTotalWeeks] = useState(8)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [dragging, setDragging] = useState(false)
  const router = useRouter()

  function todayStr() {
    return new Date().toISOString().split('T')[0]
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped?.name.endsWith('.xlsx') || dropped?.name.endsWith('.xls')) {
      setFile(dropped)
      setError(null)
    } else {
      setError('Please drop an Excel file (.xlsx or .xls)')
    }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) { setError('Please select a file'); return }

    setLoading(true)
    setError(null)

    const fd = new FormData()
    fd.append('file', file)
    fd.append('startDate', startDate)
    fd.append('totalWeeks', String(totalWeeks))
    if (routineName) fd.append('routineName', routineName)

    const res = await fetch('/api/routines/upload', { method: 'POST', body: fd })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Upload failed')
      setLoading(false)
      return
    }

    setSuccess(true)
    setTimeout(() => router.push('/dashboard'), 1800)
  }

  if (success) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div className="animate-scale-in" style={{ textAlign: 'center' }}>
          <CheckCircle2 size={64} color="var(--neon-green)" style={{ marginBottom: '1rem' }} />
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Routine imported!</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Taking you to your dashboard…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container page-pad">
      <header style={{ paddingTop: '1.5rem', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', marginBottom: '0.3rem' }}>Import Routine</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          Upload your gym Excel file to get started
        </p>
      </header>

      {error && (
        <div className="alert alert-error animate-fade-up" style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={16} />{error}
          </span>
          <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>
            <X size={16} />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-input')?.click()}
          style={{
            border: `2px dashed ${dragging ? 'var(--accent)' : file ? 'var(--neon-green)' : 'var(--border)'}`,
            borderRadius: 'var(--radius-lg)',
            padding: '2.5rem 1.5rem',
            textAlign: 'center',
            cursor: 'pointer',
            background: dragging ? 'var(--accent-glow)' : file ? '#0f2a1a' : 'var(--bg-card)',
            transition: 'all 0.25s ease',
          }}
        >
          <input
            id="file-input"
            type="file"
            accept=".xlsx,.xls"
            style={{ display: 'none' }}
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) { setFile(f); setError(null) }
            }}
          />
          {file ? (
            <>
              <CheckCircle2 size={40} color="var(--neon-green)" style={{ marginBottom: '0.75rem' }} />
              <p style={{ fontWeight: 700, marginBottom: '0.25rem' }}>{file.name}</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                {(file.size / 1024).toFixed(1)} KB · Click to change
              </p>
            </>
          ) : (
            <>
              <FileSpreadsheet size={40} color="var(--text-muted)" style={{ marginBottom: '0.75rem' }} />
              <p style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Drop your Excel file here</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>or tap to browse · .xlsx / .xls</p>
            </>
          )}
        </div>

        {/* Routine name */}
        <div>
          <label htmlFor="routine-name">
            Routine name <span style={{ color: 'var(--text-muted)', textTransform: 'none', fontWeight: 400 }}>(optional — defaults to sheet name)</span>
          </label>
          <input
            id="routine-name"
            className="input"
            type="text"
            placeholder="e.g. Summer Cut 2025"
            value={routineName}
            onChange={(e) => setRoutineName(e.target.value)}
          />
        </div>

        {/* Start date + weeks row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div>
            <label htmlFor="start-date" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Calendar size={12} />Start date
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
              <Hash size={12} />Total weeks
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

        {/* Expected format hint */}
        <div className="card" style={{ padding: '1rem', background: 'var(--bg-surface)' }}>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '0.5rem' }}>
            📋 Expected Excel format
          </p>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.7 }}>
            <p>• <strong style={{ color: 'var(--text-secondary)' }}>Multi-sheet:</strong> Each sheet = one training day (sheet name used as day name)</p>
            <p>• <strong style={{ color: 'var(--text-secondary)' }}>Single-sheet:</strong> Add a "Day" column to group exercises</p>
            <p>• Columns: <code style={{ color: 'var(--accent)', background: 'var(--bg-card)', padding: '0 4px', borderRadius: 4 }}>Exercise, Sets, Reps, Weight, Notes</code></p>
          </div>
        </div>

        <button
          id="upload-submit"
          type="submit"
          className="btn btn-primary btn-lg btn-full"
          disabled={loading || !file}
          style={{ marginTop: '0.25rem' }}
        >
          {loading
            ? <><span className="spinner" />Importing…</>
            : <><Upload size={18} />Import Routine</>
          }
        </button>
      </form>
    </div>
  )
}
