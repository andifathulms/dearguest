import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client.js'

// Minimal placeholder — full section editor is built in the next step.
export default function EditorPage() {
  const navigate = useNavigate()
  const [inv, setInv] = useState(null)
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    if (!localStorage.getItem('access_token')) { navigate('/dashboard'); return }
    api.get('/my/invitation/')
      .then(res => { setInv(res.data); setStatus('ok') })
      .catch(err => {
        if (err.response?.status === 404) navigate('/onboarding')
        else if (err.response?.status === 401) navigate('/dashboard')
        else setStatus('error')
      })
  }, [navigate])

  if (status !== 'ok') {
    return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', fontFamily: 'Inter, sans-serif', color: '#888' }}>Memuat editor…</div>
  }

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', fontFamily: 'Inter, sans-serif', padding: '2rem' }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif" }}>Editor — {inv.slug}</h1>
        <p style={{ color: '#888' }}>Tema: {inv.theme} · Status: {inv.is_active ? 'Aktif' : 'Draft'}</p>
        <a href={`/${inv.slug}`} target="_blank" rel="noopener noreferrer">Pratinjau undangan →</a>
      </div>
    </div>
  )
}
