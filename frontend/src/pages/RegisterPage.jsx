import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../api/client.js'
import './Auth.css'

export default function RegisterPage() {
  const [form, setForm] = useState({ username: '', email: '', password: '', whatsapp: '' })
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (form.password.length < 8) {
      setError('Kata sandi minimal 8 karakter.')
      return
    }
    if (!/^08\d{8,12}$/.test(form.whatsapp.replace(/\D/g, '').replace(/^62/, '0'))) {
      setError('Masukkan nomor WhatsApp yang valid, contoh: 081234567890.')
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
      const msg = data?.username?.[0] || data?.whatsapp?.[0] || data?.email?.[0] || data?.password?.[0] || 'Pendaftaran gagal. Coba lagi.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="auth-brand-mark">D</span>
          <span>Dear<em>Guest</em></span>
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
            <label className="auth-label" htmlFor="reg-wa">Nomor WhatsApp</label>
            <input className="auth-input" id="reg-wa" name="whatsapp" type="tel" inputMode="numeric"
              value={form.whatsapp} onChange={handleChange}
              placeholder="mis. 081234567890" required autoComplete="tel" />
            <p className="auth-hint">Dipakai admin untuk mengirim kode aktivasi undanganmu.</p>
          </div>
          <div className="auth-field">
            <label className="auth-label" htmlFor="reg-email">Email (opsional)</label>
            <input className="auth-input" id="reg-email" type="email" name="email" value={form.email} onChange={handleChange}
              placeholder="email@contoh.com" autoComplete="email" />
          </div>
          <div className="auth-field">
            <label className="auth-label" htmlFor="reg-password">Kata Sandi</label>
            <div className="auth-pass">
              <input className="auth-input" id="reg-password" type={showPass ? 'text' : 'password'} name="password"
                value={form.password} onChange={handleChange}
                placeholder="Minimal 8 karakter" required autoComplete="new-password" />
              <button type="button" className="auth-pass-toggle" onClick={() => setShowPass(v => !v)}
                aria-label={showPass ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}>
                {showPass ? 'Sembunyikan' : 'Lihat'}
              </button>
            </div>
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
