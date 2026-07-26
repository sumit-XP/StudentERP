import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { login } from '../services/auth'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const location = useLocation()

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await login(email, password)
      const dest = location.state?.from?.pathname || '/'
      navigate(dest)
    } catch (err) {
      setError(err?.response?.data?.error || err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-slate-50">
      <div className="card w-full max-w-md">
        <div className="text-center mb-4">
          <div className="text-2xl font-bold">School ERP Login</div>
          <div className="text-sm text-gray-500">Use the account issued by your platform or school admin.</div>
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <div className="label">Email</div>
            <input
              className="input" type="email" value={email}
              onChange={e => setEmail(e.target.value)} required
            />
          </div>
          <div>
            <div className="label">Password</div>
            <input
              className="input" type="password" value={password}
              onChange={e => setPassword(e.target.value)}
              minLength={6} required
            />
          </div>

          {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">{error}</div>}

          <button className="btn btn-primary w-full" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}
