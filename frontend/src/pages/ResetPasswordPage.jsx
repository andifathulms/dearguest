import { useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import api from '../api/client.js'
import './Auth.css'

export default function ResetPasswordPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const uid = params.get('uid')
  const token = params.get('token')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (password.length < 6) { setError('Kata sandi minimal 6 karakter.'); return }
    if (password !== confirm) { setError('Konfirmasi kata sandi tidak cocok.'); return }
    setLoading(true)
    try {
      await api.post('/auth/password-reset-confirm/', { uid, token, password })
      alert('Kata sandi berhasil diperbarui. Silakan masuk.')
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || 'Gagal memperbarui kata sandi.')
    } finally {
      setLoading(false)
    }
  }

  if (!uid || !token) {
    return (
      <div className="auth"><div className="auth-card">
        <h1>Tautan Tidak Valid</h1>
        <p className="auth-sub">Tautan reset tidak lengkap. Silakan minta tautan baru.</p>
        <p className="auth-foot"><Link to="/forgot-password">Minta tautan reset</Link></p>
      </div></div>
    )
  }

  return (
    <div className="auth">
      <div className="auth-card">
        <div className="auth-brand"><span className="auth-brand-mark">U</span><span>Undangan<em>Digital</em></span></div>
        <h1>Atur Ulang Kata Sandi</h1>
        <p className="auth-sub">Masukkan kata sandi baru untuk akunmu.</p>
        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="auth-field">
            <label className="auth-label" htmlFor="rp-password">Kata sandi baru</label>
            <input className="auth-input" id="rp-password" type="password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="new-password" />
          </div>
          <div className="auth-field">
            <label className="auth-label" htmlFor="rp-confirm">Ulangi kata sandi</label>
            <input className="auth-input" id="rp-confirm" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required autoComplete="new-password" />
          </div>
          <button className="auth-btn" type="submit" disabled={loading}>{loading ? 'Menyimpan…' : 'Simpan Kata Sandi'}</button>
        </form>
      </div>
    </div>
  )
}
