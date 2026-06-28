import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import api from '../api/client.js'
import GuestManager from '../components/GuestManager.jsx'
import './Dashboard.css'
import './DashboardRSVP.css'

function StatCard({ label, value, color }) {
  return (
    <div className="dr-stat">
      <strong style={color ? { color } : undefined}>{value}</strong>
      <span>{label}</span>
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
  a.download = 'rsvp-export.csv'
  a.click()
  URL.revokeObjectURL(url)
}

export default function DashboardRSVP() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [couple, setCouple] = useState({ bride_name: '', groom_name: '' })
  const [tab, setTab] = useState('rsvp')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) { navigate('/dashboard'); return }
    api.get(`/invitations/${slug}/rsvps/`)
      .then(res => { setData(res.data); setLoading(false) })
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
    api.get(`/invitations/${slug}/`)
      .then(res => setCouple(res.data.couple || { bride_name: '', groom_name: '' }))
      .catch(() => {})
  }, [slug, navigate])

  function handleLogout() {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    navigate('/dashboard')
  }

  if (loading) return <div className="dr"><div className="dr-center">Memuat data…</div></div>
  if (error) return <div className="dr"><div className="dr-center">{error}</div></div>

  const { rsvps = [], stats = {} } = data

  return (
    <div className="dr">
      <div className="dr-bar">
        <h1>Dashboard<small>{slug}</small></h1>
        <div className="dr-bar-actions">
          <a className="ui-btn ui-btn-ghost" href={`/dashboard/${slug}/edit`}>Edit Undangan</a>
          <button className="ui-btn ui-btn-ghost" onClick={() => exportCSV(rsvps)}>Export CSV</button>
          <button className="ui-btn ui-btn-dark" onClick={handleLogout}>Keluar</button>
        </div>
      </div>

      <div className="dr-body">
        <div className="dash-tabs">
          <button className={`dash-tab ${tab === 'rsvp' ? 'active' : ''}`} onClick={() => setTab('rsvp')}>
            Konfirmasi RSVP<span className="dash-tab-count">{rsvps.length}</span>
          </button>
          <button className={`dash-tab ${tab === 'guests' ? 'active' : ''}`} onClick={() => setTab('guests')}>
            Daftar Tamu &amp; QR
          </button>
        </div>

        {tab === 'guests' ? (
          <GuestManager slug={slug} brideName={couple.bride_name} groomName={couple.groom_name} />
        ) : (
          <>
            <div className="dr-stats">
              <StatCard label="Total Konfirmasi" value={rsvps.length} />
              <StatCard label="Hadir" value={stats.total_hadir || 0} color="#2e7d46" />
              <StatCard label="Tidak Hadir" value={stats.total_tidak_hadir || 0} color="#e07070" />
              <StatCard label="Total Tamu" value={stats.total_pax || 0} color="#8a9e8a" />
            </div>

            {rsvps.length === 0 ? (
              <div className="dr-empty">Belum ada konfirmasi masuk.</div>
            ) : (
              <div className="dr-table-wrap">
                <table className="dr-table">
                  <thead>
                    <tr>
                      <th>Nama</th><th>WhatsApp</th><th>Hadir</th><th>Jml Tamu</th><th>Ucapan</th><th>Waktu</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rsvps.map(r => (
                      <tr key={r.id}>
                        <td>{r.guest_name}</td>
                        <td style={{ color: 'var(--muted)' }}>{r.whatsapp || '—'}</td>
                        <td className={r.attending ? 'dr-yes' : 'dr-no'}>{r.attending ? 'Ya' : 'Tidak'}</td>
                        <td style={{ textAlign: 'center' }}>{r.attending ? r.pax : '—'}</td>
                        <td className="dr-wishes">{r.wishes || <span style={{ color: '#ccc' }}>—</span>}</td>
                        <td className="dr-time">{format(new Date(r.submitted_at), 'dd MMM yyyy HH:mm', { locale: id })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
