import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import api from '../api/client.js'

function StatCard({ label, value, color }) {
  return (
    <div style={{ background: 'white', border: '1px solid #e0e0dc', padding: '1.5rem 2rem', textAlign: 'center', minWidth: '130px' }}>
      <p style={{ fontSize: '2rem', fontWeight: 300, color: color || '#1f1f1f', fontFamily: "'Cormorant Garamond', serif", lineHeight: 1 }}>{value}</p>
      <p style={{ fontSize: '0.75rem', color: '#888', letterSpacing: '0.05em', marginTop: '0.4rem' }}>{label}</p>
    </div>
  )
}

function exportCSV(rsvps) {
  const headers = ['Nama', 'WhatsApp', 'Hadir', 'Jumlah Tamu', 'Ucapan', 'Waktu']
  const rows = rsvps.map(r => [
    r.guest_name,
    r.whatsapp || '-',
    r.attending ? 'Ya' : 'Tidak',
    r.attending ? r.pax : 0,
    (r.wishes || '').replace(/,/g, ';'),
    format(new Date(r.submitted_at), 'dd/MM/yyyy HH:mm'),
  ])
  const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `rsvp-export.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function DashboardRSVP() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      navigate('/dashboard')
      return
    }
    api.get(`/invitations/${slug}/rsvps/`)
      .then(res => {
        setData(res.data)
        setLoading(false)
      })
      .catch(err => {
        if (err.response?.status === 401 || err.response?.status === 403) {
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          navigate('/dashboard')
        } else {
          setError('Gagal memuat data RSVP.')
          setLoading(false)
        }
      })
  }, [slug, navigate])

  function handleLogout() {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    navigate('/dashboard')
  }

  const headerStyle = { padding: '0.6rem 0.8rem', textAlign: 'left', fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#888', borderBottom: '1px solid #e0e0dc', fontWeight: 400, background: '#f5f5f3' }
  const cellStyle = { padding: '0.75rem 0.8rem', fontSize: '0.85rem', borderBottom: '1px solid #f0f0ee', verticalAlign: 'top' }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', color: '#888' }}>
      Memuat data...
    </div>
  )

  if (error) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', color: '#888' }}>
      {error}
    </div>
  )

  const { rsvps = [], stats = {} } = data

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', minHeight: '100vh', background: '#f5f5f3' }}>
      {/* Header */}
      <div style={{ background: 'white', borderBottom: '1px solid #e0e0dc', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.4rem', fontWeight: 300, fontStyle: 'italic', margin: 0 }}>
            Dashboard RSVP
          </h1>
          <p style={{ fontSize: '0.75rem', color: '#888', margin: 0, letterSpacing: '0.05em' }}>{slug}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            onClick={() => exportCSV(rsvps)}
            style={{ background: 'transparent', border: '1px solid #e0e0dc', padding: '0.5rem 1rem', cursor: 'pointer', fontSize: '0.8rem', color: '#1f1f1f' }}
          >
            Export CSV
          </button>
          <button
            onClick={handleLogout}
            style={{ background: '#1f1f1f', color: 'white', border: 'none', padding: '0.5rem 1rem', cursor: 'pointer', fontSize: '0.8rem' }}
          >
            Keluar
          </button>
        </div>
      </div>

      <div style={{ padding: '2rem', maxWidth: '1100px', margin: '0 auto' }}>
        {/* Stats */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
          <StatCard label="Total Konfirmasi" value={rsvps.length} />
          <StatCard label="Hadir" value={stats.total_hadir || 0} color="#4CAF50" />
          <StatCard label="Tidak Hadir" value={stats.total_tidak_hadir || 0} color="#e07070" />
          <StatCard label="Total Tamu" value={stats.total_pax || 0} color="#8a9e8a" />
        </div>

        {/* Table */}
        {rsvps.length === 0 ? (
          <div style={{ background: 'white', padding: '3rem', textAlign: 'center', color: '#888', border: '1px solid #e0e0dc' }}>
            Belum ada konfirmasi masuk.
          </div>
        ) : (
          <div style={{ background: 'white', border: '1px solid #e0e0dc', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={headerStyle}>Nama</th>
                  <th style={headerStyle}>WhatsApp</th>
                  <th style={headerStyle}>Hadir</th>
                  <th style={headerStyle}>Jml Tamu</th>
                  <th style={headerStyle}>Ucapan</th>
                  <th style={headerStyle}>Waktu</th>
                </tr>
              </thead>
              <tbody>
                {rsvps.map(r => (
                  <tr key={r.id} style={{ background: r.attending ? 'white' : '#fafafa' }}>
                    <td style={cellStyle}>{r.guest_name}</td>
                    <td style={{ ...cellStyle, color: '#888' }}>{r.whatsapp || '—'}</td>
                    <td style={{ ...cellStyle, color: r.attending ? '#4CAF50' : '#e07070', fontWeight: 500 }}>
                      {r.attending ? 'Ya' : 'Tidak'}
                    </td>
                    <td style={{ ...cellStyle, textAlign: 'center' }}>{r.attending ? r.pax : '—'}</td>
                    <td style={{ ...cellStyle, color: '#555', maxWidth: '250px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {r.wishes || <span style={{ color: '#ccc' }}>—</span>}
                    </td>
                    <td style={{ ...cellStyle, color: '#888', whiteSpace: 'nowrap', fontSize: '0.75rem' }}>
                      {format(new Date(r.submitted_at), 'dd MMM yyyy HH:mm', { locale: id })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
