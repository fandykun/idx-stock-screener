import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export function Register() {
  const auth = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      await auth.register(email, password)
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Registration failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="auth-shell">
      <section className="panel auth-card">
        <p className="eyebrow">Create account</p>
        <h1>Register for protected watchlists and alerts.</h1>
        <form className="auth-form" onSubmit={handleSubmit}>
          <label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
          <label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} maxLength={128} required /></label>
          {error ? <p className="error">{error}</p> : null}
          <button className="primary" disabled={isSubmitting}>{isSubmitting ? 'Creating account…' : 'Register'}</button>
        </form>
        <p className="muted">Already registered? <Link to="/login">Login</Link></p>
      </section>
    </main>
  )
}
