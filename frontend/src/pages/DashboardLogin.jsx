import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client.js'

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

      // Fetch the invitation slug associated with the couple_user
      try {
        const profileRes = await api.get('/auth/me/')
        const slug = profileRes.data.invitation_slug
        if (slug) {
          navigate(`/dashboard/${slug}`)
          return
        }
      } catch {
        // /auth/me/ might not exist — ask for slug manually below
      }

      // Fallback: redirect to a slug prompt
      const slug = prompt('Masukkan slug undangan Anda:')
      if (slug) navigate(`/dashboard/${slug}`)
    } catch (err) {
      setError('Username atau password salah.')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    display: 'block', width: '100%', padding: '0.75rem 1rem',
    border: '1px solid #e0e0dc', background: '#f5f5f3',
    fontFamily: 'Inter, sans-serif', fontSize: '0.9rem',
    color: '#1f1f1f', marginBottom: '1rem', boxSizing: 'border-box',
    outline: 'none',
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fdf8f5', fontFamily: 'Inter, sans-serif', padding: '2rem' }}>
      <div style={{ width: '100%', maxWidth: '380px' }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.8rem', fontWeight: 400, fontStyle: 'italic', textAlign: 'center', marginBottom: '0.5rem', color: '#1f1f1f' }}>
          Dashboard
        </h1>
        <p style={{ textAlign: 'center', fontSize: '0.8rem', color: '#888', marginBottom: '2rem', letterSpacing: '0.05em' }}>
          Masuk untuk melihat data RSVP undangan Anda
        </p>
        <form onSubmit={handleSubmit}>
          <input
            style={inputStyle}
            name="username"
            type="text"
            placeholder="Username"
            value={form.username}
            onChange={handleChange}
            required
            autoComplete="username"
          />
          <input
            style={inputStyle}
            name="password"
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            required
            autoComplete="current-password"
          />
          {error && <p style={{ color: '#c0392b', fontSize: '0.8rem', marginBottom: '0.75rem' }}>{error}</p>}
          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', padding: '0.85rem', background: '#1f1f1f', color: 'white', border: 'none', cursor: 'pointer', fontSize: '0.85rem', letterSpacing: '0.1em', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Masuk...' : 'Masuk'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <a href="/" style={{ color: '#888', fontSize: '0.75rem', textDecoration: 'none' }}>← Kembali ke Beranda</a>
        </p>
      </div>
    </div>
  )
}
