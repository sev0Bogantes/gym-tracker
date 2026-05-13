'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Dumbbell, Mail, Lock } from 'lucide-react'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
        <div className="card animate-scale-in" style={{ maxWidth: '400px', width: '100%', padding: '2.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📧</div>
          <h2 style={{ marginBottom: '0.75rem' }}>Check your email</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            We sent a confirmation link to <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>.
            Click it to activate your account.
          </p>
          <Link href="/login" className="btn btn-ghost btn-full">Back to Login</Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
      <div aria-hidden style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '-20%', right: '-10%', width: '60vw', height: '60vw', borderRadius: '50%', background: 'radial-gradient(circle, #22c55e10, transparent 70%)' }} />
        <div style={{ position: 'absolute', bottom: '-20%', left: '-10%', width: '50vw', height: '50vw', borderRadius: '50%', background: 'radial-gradient(circle, #3b82f615, transparent 70%)' }} />
      </div>

      <div style={{ width: '100%', maxWidth: '400px', position: 'relative', zIndex: 1 }}>
        <div className="animate-fade-up" style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '72px', height: '72px', borderRadius: '20px', background: 'linear-gradient(135deg, #22c55e, #3b82f6)', marginBottom: '1rem', boxShadow: '0 0 32px #22c55e30' }}>
            <Dumbbell size={36} color="#fff" />
          </div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.4rem' }}><span className="glow-text">Get Started</span></h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Create your free GymTracker account</p>
        </div>

        <div className="card animate-fade-up" style={{ padding: '2rem', animationDelay: '80ms' }}>
          {error && <div className="alert alert-error" style={{ marginBottom: '1.25rem' }}>{error}</div>}

          <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label htmlFor="signup-email">Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input id="signup-email" className="input" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ paddingLeft: '2.5rem' }} />
              </div>
            </div>

            <div>
              <label htmlFor="signup-password">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input id="signup-password" className="input" type="password" placeholder="Min. 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} style={{ paddingLeft: '2.5rem' }} />
              </div>
            </div>

            <button id="signup-submit" type="submit" className="btn btn-success btn-lg btn-full" disabled={loading}>
              {loading ? <><span className="spinner" />Creating account…</> : 'Create Account'}
            </button>
          </form>

          <div className="divider" />

          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Already have an account?{' '}
            <Link href="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
