'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Dumbbell, User, Lock, Eye, EyeOff } from 'lucide-react'

// Single-user app: "sevilla" maps to the internal auth email
const USERNAME_MAP: Record<string, string> = {
  sevilla: 'sevilla@gymtracker.app',
}

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const email = USERNAME_MAP[username.trim().toLowerCase()]
    if (!email) {
      setError('Invalid username or password.')
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('Invalid username or password.')
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem',
    }}>
      {/* Background blobs */}
      <div aria-hidden style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: '60vw', height: '60vw', borderRadius: '50%', background: 'radial-gradient(circle, #3b82f615, transparent 70%)' }} />
        <div style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: '50vw', height: '50vw', borderRadius: '50%', background: 'radial-gradient(circle, #22c55e10, transparent 70%)' }} />
      </div>

      <div style={{ width: '100%', maxWidth: '380px', position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <div className="animate-fade-up" style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '80px', height: '80px', borderRadius: '24px',
            background: 'linear-gradient(135deg, #3b82f6, #22c55e)',
            marginBottom: '1.25rem',
            boxShadow: '0 0 40px #3b82f640',
          }}>
            <Dumbbell size={40} color="#fff" />
          </div>
          <h1 style={{ fontSize: '2.2rem', marginBottom: '0.4rem' }}>
            <span className="glow-text">GymTracker</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Your personal workout companion
          </p>
        </div>

        {/* Card */}
        <div className="card animate-fade-up" style={{ padding: '2rem', animationDelay: '80ms' }}>
          {error && (
            <div className="alert alert-error" style={{ marginBottom: '1.25rem' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label htmlFor="username">Username</label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                <input
                  id="username"
                  className="input"
                  type="text"
                  placeholder="sevilla"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoCapitalize="none"
                  autoCorrect="off"
                  style={{ paddingLeft: '2.5rem' }}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                <input
                  id="password"
                  className="input"
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{ paddingLeft: '2.5rem', paddingRight: '2.75rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                  style={{
                    position: 'absolute', right: '0.9rem', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                    padding: '4px',
                  }}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              id="login-submit"
              type="submit"
              className="btn btn-primary btn-lg btn-full"
              disabled={loading}
              style={{ marginTop: '0.25rem' }}
            >
              {loading
                ? <><span className="spinner" />Signing in…</>
                : <>Let&apos;s lift 💪</>
              }
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '1.5rem' }}>
          Personal use only
        </p>
      </div>
    </div>
  )
}
