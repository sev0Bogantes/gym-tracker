import { createClient } from '@/lib/supabase/server'
import { getActiveRoutine } from '@/lib/models/routine.model'
import { calculateCurrentWeek, getProgressPercent } from '@/lib/week-utils'
import Link from 'next/link'
import { Dumbbell, Upload, ChevronRight, Zap, Calendar, TrendingUp } from 'lucide-react'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const routine = await getActiveRoutine(supabase, user.id)
  const currentWeek = routine ? calculateCurrentWeek(routine.start_date) : 1
  const progressPct = routine
    ? Math.round(getProgressPercent(routine.start_date, routine.total_weeks ?? 8) * 100)
    : 0

  return (
    <div className="container page-pad">
      {/* Header */}
      <header style={{ paddingTop: '1.5rem', marginBottom: '1.75rem' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
          Good {getGreeting()}
        </p>
        <h1 style={{ fontSize: '1.75rem' }}>Your Dashboard</h1>
      </header>

      {routine ? (
        <div className="stagger" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Active Routine Card */}
          <div className="card animate-fade-up" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div>
                <span className="badge badge-green" style={{ marginBottom: '0.5rem' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--neon-green)', display: 'inline-block' }} />
                  Active
                </span>
                <h2 style={{ fontSize: '1.2rem', marginTop: '0.25rem' }}>{routine.name}</h2>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent)', lineHeight: 1 }}>
                  {currentWeek}
                </p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                  / {routine.total_weeks} wks
                </p>
              </div>
            </div>

            {/* Progress bar */}
            <div style={{ marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Week {currentWeek} of {routine.total_weeks}</span>
                <span style={{ fontSize: '0.78rem', color: 'var(--accent)', fontWeight: 700 }}>{progressPct}%</span>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${progressPct}%` }} />
              </div>
            </div>
          </div>

          {/* Days Grid */}
          <h2 style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Choose a Day</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {routine.routine_days.map((day, idx) => (
              <Link
                key={day.id}
                href={`/workout/${day.id}`}
                className="card animate-fade-up"
                style={{
                  padding: '1rem 1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  textDecoration: 'none',
                  color: 'inherit',
                  animationDelay: `${idx * 60}ms`,
                }}
              >
                <div style={{
                  width: 44, height: 44, borderRadius: '12px',
                  background: `linear-gradient(135deg, var(--accent)20, var(--neon-green)20)`,
                  border: `1px solid var(--accent)30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--accent)' }}>D{day.day_number}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.15rem' }}>{day.name}</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                    {day.exercises.length} exercise{day.exercises.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <ChevronRight size={18} color="var(--text-muted)" />
              </Link>
            ))}
          </div>

          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.5rem' }}>
            <div className="card animate-fade-up" style={{ padding: '1rem', textAlign: 'center', animationDelay: '200ms' }}>
              <Calendar size={20} color="var(--accent)" style={{ marginBottom: '0.5rem' }} />
              <p style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>{routine.routine_days.length}</p>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Training Days</p>
            </div>
            <div className="card animate-fade-up" style={{ padding: '1rem', textAlign: 'center', animationDelay: '260ms' }}>
              <TrendingUp size={20} color="var(--neon-green)" style={{ marginBottom: '0.5rem' }} />
              <p style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {routine.routine_days.reduce((sum, d) => sum + d.exercises.length, 0)}
              </p>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Exercises</p>
            </div>
          </div>
        </div>
      ) : (
        /* Empty state */
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
      )}

      {/* Quick action */}
      {routine && (
        <div style={{ marginTop: '1.5rem' }}>
          <Link href="/upload" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.82rem', textDecoration: 'none' }}>
            <Zap size={14} />
            Import a new routine
          </Link>
        </div>
      )}
    </div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 18) return 'afternoon'
  return 'evening'
}
