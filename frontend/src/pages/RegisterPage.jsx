import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../api/client.js'
import './Auth.css'

export default function RegisterPage() {
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (form.password.length < 6) {
      setError('Kata sandi minimal 6 karakter.')
      return
    }
    setLoading(true)
    try {
      const res = await api.post('/auth/register/', form)
      localStorage.setItem('access_token', res.data.access)
      localStorage.setItem('refresh_token', res.data.refresh)
      navigate('/onboarding')
    } catch (err) {
      const data = err.response?.data
      const msg = data?.username?.[0] || data?.email?.[0] || data?.password?.[0] || 'Pendaftaran gagal. Coba lagi.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="auth-brand-mark">U</span>
          <span>Undangan<em>Digital</em></span>
        </div>
        <h1>Buat Akun</h1>
        <p className="auth-sub">Daftar gratis dan mulai rancang undangan pernikahan digital kalian.</p>

        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="auth-field">
            <label className="auth-label" htmlFor="reg-username">Username</label>
            <input className="auth-input" id="reg-username" name="username" value={form.username} onChange={handleChange}
              placeholder="mis. dinda.raka" required autoComplete="username" />
          </div>
          <div className="auth-field">
            <label className="auth-label" htmlFor="reg-email">Email (opsional)</label>
            <input className="auth-input" id="reg-email" type="email" name="email" value={form.email} onChange={handleChange}
              placeholder="email@contoh.com" autoComplete="email" />
          </div>
          <div className="auth-field">
            <label className="auth-label" htmlFor="reg-password">Kata Sandi</label>
            <input className="auth-input" id="reg-password" type="password" name="password" value={form.password} onChange={handleChange}
              placeholder="Minimal 6 karakter" required autoComplete="new-password" />
          </div>
          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? 'Mendaftar…' : 'Daftar'}
          </button>
        </form>
        <p className="auth-foot">Sudah punya akun? <Link to="/dashboard">Masuk</Link></p>
      </div>
    </div>
  )
}
