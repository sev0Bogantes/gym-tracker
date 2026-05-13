'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, X, Calendar, Hash, ChevronDown } from 'lucide-react'

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [routineName, setRoutineName] = useState('')
  const [startDate, setStartDate] = useState(todayStr())
  const [totalWeeks, setTotalWeeks] = useState(8)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<object | null>(null)
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
    if (dropped?.name.match(/\.xlsx?$/i)) {
      setFile(dropped)
      setError(null)
      setDebugInfo(null)
    } else {
      setError('Please drop an Excel file (.xlsx or .xls)')
    }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) { setError('Please select a file'); return }

    setLoading(true)
    setError(null)
    setDebugInfo(null)

    const fd = new FormData()
    fd.append('file', file)
    fd.append('startDate', startDate)
    fd.append('totalWeeks', String(totalWeeks))
    if (routineName) fd.append('routineName', routineName)

    const res = await fetch('/api/routines/upload', { method: 'POST', body: fd })
    const data = await res.json()

    setLoading(false)

    if (!res.ok) {
      setError(data.error ?? 'Upload failed')
      if (data.debug) setDebugInfo(data.debug)
      return
    }

    setSuccess(true)
    setTimeout(() => router.push('/dashboard'), 1600)
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
      <header style={{ paddingTop: '1.5rem', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.65rem', marginBottom: '0.25rem' }}>Import Routine</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
          Upload your gym Excel file
        </p>
      </header>

      {error && (
        <div className="alert alert-error animate-fade-up" style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
            <div style={{ flex: 1 }}>
              <p style={{ marginBottom: debugInfo ? '0.5rem' : 0 }}>{error}</p>
              {debugInfo && (
                <details style={{ marginTop: '0.5rem' }}>
                  <summary style={{ cursor: 'pointer', fontSize: '0.75rem', opacity: 0.7 }}>
                    Debug info (share this to get help)
                  </summary>
                  <pre style={{ fontSize: '0.65rem', marginTop: '0.5rem', overflowX: 'auto', whiteSpace: 'pre-wrap', opacity: 0.8 }}>
                    {JSON.stringify(debugInfo, null, 2)}
                  </pre>
                </details>
              )}
            </div>
            <button onClick={() => { setError(null); setDebugInfo(null) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', flexShrink: 0 }}>
              <X size={15} />
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-input')?.click()}
          style={{
            border: `2px dashed ${dragging ? 'var(--accent)' : file ? 'var(--neon-green)' : 'var(--border)'}`,
            borderRadius: 'var(--radius-lg)',
            padding: '2rem 1.25rem',
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
              if (f) { setFile(f); setError(null); setDebugInfo(null) }
            }}
          />
          {file ? (
            <>
              <CheckCircle2 size={36} color="var(--neon-green)" style={{ marginBottom: '0.6rem' }} />
              <p style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.2rem' }}>{file.name}</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                {(file.size / 1024).toFixed(1)} KB · Tap to change
              </p>
            </>
          ) : (
            <>
              <FileSpreadsheet size={36} color="var(--text-muted)" style={{ marginBottom: '0.6rem' }} />
              <p style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.2rem' }}>Drop or tap to browse</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>.xlsx / .xls</p>
            </>
          )}
        </div>

        {/* Routine name */}
        <div>
          <label htmlFor="routine-name">Routine name <span style={{ color: 'var(--text-muted)', fontWeight: 400, textTransform: 'none' }}>(optional)</span></label>
          <input
            id="routine-name"
            className="input"
            type="text"
            placeholder="e.g. Summer Cut 2025"
            value={routineName}
            onChange={(e) => setRoutineName(e.target.value)}
          />
        </div>

        {/* Start date + weeks */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
          <div>
            <label htmlFor="start-date" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Calendar size={11} />Start date
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
              <Hash size={11} />Total weeks
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

        {/* Format hint – collapsible */}
        <details style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', padding: '0.75rem 1rem' }}>
          <summary style={{ cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem', listStyle: 'none' }}>
            <ChevronDown size={13} /> Expected Excel format
          </summary>
          <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', lineHeight: 1.8, marginTop: '0.6rem' }}>
            <p>• <strong style={{ color: 'var(--text-secondary)' }}>Multi-sheet:</strong> Each sheet = one training day</p>
            <p>• <strong style={{ color: 'var(--text-secondary)' }}>Single-sheet:</strong> Use a &quot;Day&quot; column to group exercises</p>
            <p>• <strong style={{ color: 'var(--text-secondary)' }}>No day column:</strong> All exercises go into one day</p>
            <p style={{ marginTop: '0.4rem' }}>Columns: <code style={{ color: 'var(--accent)', background: 'var(--bg-card)', padding: '0 4px', borderRadius: 4 }}>Exercise, Sets, Reps, Weight, Notes</code></p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.68rem', marginTop: '0.3rem' }}>Spanish names also work: Ejercicio, Series, Repeticiones, Peso</p>
          </div>
        </details>

        <button
          id="upload-submit"
          type="submit"
          className="btn btn-primary btn-lg btn-full"
          disabled={loading || !file}
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
