import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client.js'

// Data & privacy for the couple: download everything an invitation holds, or
// delete the account. Both ask for the password again (POST /auth/reauth/).
// Retention: guest data goes RETENTION_DAYS after the invitation expires
// (backend retention.py); the couple is emailed a week before.
export default function AccountData({ invitations }) {
  const navigate = useNavigate()
  const [pending, setPending] = useState(null)   // {kind: 'export'|'delete', slug?}
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  function ask(kind, slug) {
    setPending({ kind, slug })
    setPassword('')
    setError('')
  }

  async function confirm(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await api.post('/auth/reauth/', { password })
      if (pending.kind === 'export') {
        // A plain navigation: the browser downloads the ZIP with the cookies.
        window.location.assign(`/api/my/invitations/${pending.slug}/export.zip`)
        setPending(null)
      } else {
        await api.post('/auth/delete-account/')
        navigate('/', { replace: true })
      }
    } catch (err) {
      setError(err.response?.status === 403 ? 'Kata sandi salah.' : 'Gagal. Coba lagi.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="mi-privacy" aria-labelledby="mi-privacy-title">
      <h2 id="mi-privacy-title">Data &amp; privasi</h2>
      <p>
        Daftar tamu, konfirmasi kehadiran, ucapan, foto, musik dan data rekening dihapus otomatis
        90 hari setelah undangan berakhir. Kami mengirim email seminggu sebelumnya.
      </p>
      <div className="mi-privacy-actions">
        {invitations.map(it => (
          <button key={it.slug} className="mi-mini" onClick={() => ask('export', it.slug)}>Unduh semua data /{it.slug}</button>
        ))}
        <button className="mi-mini mi-danger" onClick={() => ask('delete')}>Hapus akun</button>
      </div>

      {pending && (
        <div className="mi-modal-overlay" onClick={() => !busy && setPending(null)}>
          <form className="mi-modal" onClick={e => e.stopPropagation()} onSubmit={confirm}>
            <h3>{pending.kind === 'export' ? 'Unduh semua data' : 'Hapus akun?'}</h3>
            <p>
              {pending.kind === 'export'
                ? 'File ZIP berisi daftar tamu, RSVP, ucapan, acara dan semua foto. Masukkan kata sandi untuk melanjutkan.'
                : 'Akun, semua undangan dan seluruh datanya (tamu, RSVP, ucapan, foto, musik) akan dihapus permanen dan tidak bisa dikembalikan.'}
            </p>
            <label className="mi-modal-label" htmlFor="mi-reauth">Kata sandi</label>
            <input id="mi-reauth" type="password" autoComplete="current-password" required value={password}
              onChange={e => setPassword(e.target.value)} />
            {error && <p className="mi-modal-error" role="alert">{error}</p>}
            <div className="mi-modal-actions">
              <button type="button" className="mi-mini" onClick={() => setPending(null)} disabled={busy}>Batal</button>
              <button type="submit" className={`mi-mini ${pending.kind === 'delete' ? 'mi-danger' : 'dark'}`} disabled={busy}>
                {pending.kind === 'export' ? 'Unduh' : 'Hapus permanen'}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  )
}
