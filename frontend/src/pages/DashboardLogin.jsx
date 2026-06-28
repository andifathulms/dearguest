import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../api/client.js'
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
      const res = await api.post('/auth/login/', form)
      localStorage.setItem('access_token', res.data.access)
      localStorage.setItem('refresh_token', res.data.refresh)
      navigate('/my')
    } catch (err) {
      setError('Username atau password salah.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth">
      <div className="auth-card">
        <div className="auth-brand"><span className="auth-brand-mark">U</span><span>Undangan<em>Digital</em></span></div>
        <h1>Masuk</h1>
        <p className="auth-sub">Masuk untuk mengelola undangan dan melihat data RSVP kamu.</p>

        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="auth-field">
            <label className="auth-label" htmlFor="login-username">Username</label>
            <input className="auth-input" id="login-username" name="username" type="text" value={form.username}
              onChange={handleChange} required autoComplete="username" />
          </div>
          <div className="auth-field">
            <label className="auth-label" htmlFor="login-password">Kata Sandi</label>
            <input className="auth-input" id="login-password" name="password" type="password" value={form.password}
              onChange={handleChange} required autoComplete="current-password" />
          </div>
          <button className="auth-btn" type="submit" disabled={loading}>{loading ? 'Masuk…' : 'Masuk'}</button>
        </form>
        <p className="auth-foot" style={{ marginTop: '1rem' }}>
          <Link to="/forgot-password">Lupa kata sandi?</Link>
        </p>
        <p className="auth-foot" style={{ marginTop: '0.75rem' }}>
          Belum punya akun? <Link to="/register">Daftar gratis</Link>
        </p>
        <p className="auth-foot" style={{ marginTop: '0.75rem' }}>
          <Link to="/" style={{ color: '#8a7f74', fontWeight: 400 }}>← Kembali ke Beranda</Link>
        </p>
      </div>
    </div>
  )
}
