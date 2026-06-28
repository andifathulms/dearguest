import { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client.js'
import './Auth.css'

export default function ForgotPasswordPage() {
  const [ident, setIdent] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/auth/password-reset/', { username_or_email: ident })
      setSent(true)
    } catch {
      setSent(true) // same UX either way (don't leak existence)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth">
      <div className="auth-card">
        <div className="auth-brand"><span className="auth-brand-mark">U</span><span>Undangan<em>Digital</em></span></div>
        <h1>Lupa Kata Sandi</h1>
        {sent ? (
          <>
            <p className="auth-sub">Jika akun dengan data tersebut ada, kami telah mengirim tautan reset ke emailnya. Cek kotak masuk (dan folder spam) kamu.</p>
            <p className="auth-foot"><Link to="/dashboard">← Kembali ke Masuk</Link></p>
          </>
        ) : (
          <>
            <p className="auth-sub">Masukkan username atau email akunmu. Kami akan kirim tautan untuk mengatur ulang kata sandi.</p>
            <form onSubmit={handleSubmit}>
              <div className="auth-field">
                <label className="auth-label">Username atau Email</label>
                <input className="auth-input" value={ident} onChange={e => setIdent(e.target.value)} required />
              </div>
              <button className="auth-btn" type="submit" disabled={loading}>{loading ? 'Mengirim…' : 'Kirim Tautan Reset'}</button>
            </form>
            <p className="auth-foot"><Link to="/dashboard">← Kembali ke Masuk</Link></p>
          </>
        )}
      </div>
    </div>
  )
}
