import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import api from '../api/client.js'
import ThemeRenderer from '../themes/ThemeRenderer.jsx'

export default function InvitationPage() {
  const { slug } = useParams()
  const [searchParams] = useSearchParams()
  const guestName = searchParams.get('to') || ''
  // Owner draft preview: fetch via the authenticated editor endpoint.
  const preview = searchParams.get('preview') === '1'

  const [invitation, setInvitation] = useState(null)
  const [status, setStatus] = useState('loading')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    api.get(preview ? `/my/invitations/${slug}/` : `/invitations/${slug}/`)
      .then(res => {
        setInvitation(res.data)
        setStatus('ok')
      })
      .catch(err => {
        const code = err.response?.status
        const detail = err.response?.data?.detail || ''
        if (code === 404) {
          setErrorMessage('Undangan tidak ditemukan.')
        } else if (code === 403) {
          setErrorMessage(detail || 'Undangan belum aktif.')
        } else {
          setErrorMessage('Terjadi kesalahan. Silakan coba lagi.')
        }
        setStatus('error')
      })
  }, [slug, preview])

  if (status === 'loading') {
    return (
      <div className="inv-status">
        <div className="inv-loader" aria-hidden="true">
          <span /><span /><span />
        </div>
        <p className="inv-status-text">Membuka undangan…</p>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="inv-status">
        <div className="inv-status-mark" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z" />
          </svg>
        </div>
        <p className="inv-status-title">{errorMessage}</p>
        <a className="inv-status-link" href="/">Kembali ke beranda</a>
      </div>
    )
  }

  return <ThemeRenderer invitation={invitation} guestName={guestName} />
}
