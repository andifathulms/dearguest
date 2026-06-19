import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import api from '../api/client.js'
import ThemeRenderer from '../themes/ThemeRenderer.jsx'

export default function InvitationPage() {
  const { slug } = useParams()
  const [searchParams] = useSearchParams()
  const guestName = searchParams.get('to') || ''

  const [invitation, setInvitation] = useState(null)
  const [status, setStatus] = useState('loading')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    api.get(`/invitations/${slug}/`)
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
  }, [slug])

  if (status === 'loading') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Georgia, serif', color: '#888' }}>
        Memuat undangan...
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', fontFamily: 'Georgia, serif', color: '#888', padding: '2rem' }}>
        <div>
          <p style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>🤍</p>
          <p>{errorMessage}</p>
        </div>
      </div>
    )
  }

  return <ThemeRenderer invitation={invitation} guestName={guestName} />
}
