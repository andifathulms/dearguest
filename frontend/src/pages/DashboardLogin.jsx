import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../api/client.js'
import AuthShell from '../brand/AuthShell.jsx'
import './Auth.css'

export default function DashboardLogin() {
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await api.post('/auth/login/', form)
      navigate('/my')
    } catch (err) {
      setError('Akun atau kata sandi salah.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell>
      <div className="auth-card">
        <h1>Selamat datang kembali</h1>
        <p className="auth-sub">Kelola undangan, daftar tamu, dan RSVP kalian.</p>

        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="auth-field">
            <label className="auth-label" htmlFor="login-username">Username, email, atau nomor WhatsApp</label>
            <input className="auth-input" id="login-username" name="username" type="text" value={form.username}
              onChange={handleChange} placeholder="mis. dinda.raka atau 081234567890"
              required autoComplete="username" />
          </div>
          <div className="auth-field">
            <label className="auth-label" htmlFor="login-password">Kata Sandi</label>
            <input className="auth-input" id="login-password" name="password" type="password" value={form.password}
              onChange={handleChange} required autoComplete="current-password" />
          </div>
          <button className="auth-btn" type="submit" disabled={loading}>{loading ? 'Masuk…' : 'Masuk'}</button>
        </form>
        <p className="auth-foot">
          <Link to="/forgot-password">Lupa kata sandi?</Link>
        </p>
        <p className="auth-foot">
          Belum punya akun? <Link to="/register">Daftar gratis</Link>
        </p>
      </div>
    </AuthShell>
  )
}
