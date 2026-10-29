import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import api from '../api/client.js'
import { logout } from '../api/session.js'
import GuestManager from '../components/GuestManager.jsx'
import WishModeration from '../components/WishModeration.jsx'
import '../brand/brand.css'
import './Dashboard.css'
import './DashboardRSVP.css'

function StatCard({ label, value, tone }) {
  return (
    <div className={`dr-stat ${tone || ''}`}>
      <strong className="dg-num">{value}</strong>
      <span>{label}</span>
    </div>
  )
}

// The server builds the CSV (quoting, BOM, formula guard, event timezone);
// fetched with the JWT header, then saved as a file.
async function downloadCSV(slug) {
  const res = await api.get(`/invitations/${slug}/rsvps.csv`, { responseType: 'blob' })
  const url = URL.createObjectURL(res.data)
  const a = document.createElement('a')
  a.href = url
  a.download = `rsvp-${slug}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function DashboardRSVP() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [tab, setTab] = useState('rsvp')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadRsvps = () => api.get(`/invitations/${slug}/rsvps/`).then(res => { setData(res.data); setLoading(false) })

  useEffect(() => {
    loadRsvps()
      .catch(err => {
        if (err.response?.status === 401 || err.response?.status === 403) {
          navigate('/dashboard')
        } else {
          setError('Gagal memuat data RSVP.')
          setLoading(false)
        }
      })
  }, [slug, navigate]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleLogout = () => logout(navigate)

  if (loading) return <div className="dr"><div className="dr-center">Memuat data…</div></div>
  if (error) return <div className="dr"><div className="dr-center">{error}</div></div>

  const { rsvps = [], stats = {} } = data

  return (
    <div className="dr">
      <header className="dr-bar dg dg-inline dg-dark">
        <div className="dr-bar-left">
          <Link to="/my" className="dg-brand">Dear<i>Guest</i></Link>
          <h1>Tamu &amp; RSVP<small>{slug}</small></h1>
        </div>
        <div className="dr-bar-actions">
          <Link className="dr-bar-link" to={`/dashboard/${slug}/edit`}>Edit undangan</Link>
          <Link className="dg-btn dg-btn-gold dg-btn-sm" to={`/dashboard/${slug}/kirim`}>Kirim undangan</Link>
          <button className="dg-btn dg-btn-line dg-btn-sm" onClick={handleLogout}>Keluar</button>
        </div>
      </header>

      <div className="dr-body">
        <div className="dash-tabs">
          <button className={`dash-tab ${tab === 'rsvp' ? 'active' : ''}`} onClick={() => setTab('rsvp')}>
            Konfirmasi RSVP<span className="dash-tab-count">{rsvps.length}</span>
          </button>
          <button className={`dash-tab ${tab === 'wishes' ? 'active' : ''}`} onClick={() => setTab('wishes')}>
            Ucapan{stats.wishes_pending > 0 && <span className="dash-tab-count">{stats.wishes_pending}</span>}
          </button>
          <button className={`dash-tab ${tab === 'guests' ? 'active' : ''}`} onClick={() => setTab('guests')}>
            Daftar Tamu &amp; QR
          </button>
        </div>

        {tab === 'guests' ? (
          <GuestManager slug={slug} />
        ) : tab === 'wishes' ? (
          <WishModeration slug={slug} onChange={loadRsvps} />
        ) : (
          <RsvpTab rsvps={rsvps} stats={stats} onCsv={() => downloadCSV(slug).catch(() => setError('Gagal mengunduh CSV.'))} />
        )}
      </div>
    </div>
  )
}

// RSVP tab: the numbers first, then the answers, searchable and filterable.
function RsvpTab({ rsvps, stats, onCsv }) {
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState('all')
  const needle = q.trim().toLowerCase()
  const rows = rsvps.filter(r =>
    (filter === 'all' || (filter === 'yes') === r.attending) &&
    (!needle || `${r.guest_name} ${r.whatsapp || ''} ${r.wishes || ''}`.toLowerCase().includes(needle)))
  const FILTERS = [['all', 'Semua', rsvps.length], ['yes', 'Hadir', stats.total_hadir || 0], ['no', 'Tidak hadir', stats.total_tidak_hadir || 0]]

  return (
    <div className="dg dg-inline dr-rsvp">
      <div className="dr-stats">
        <StatCard label="tamu akan hadir" value={stats.total_pax || 0} tone="lead" />
        <StatCard label="konfirmasi hadir" value={stats.total_hadir || 0} tone="yes" />
        <StatCard label="tidak hadir" value={stats.total_tidak_hadir || 0} tone="no" />
        <StatCard label="total jawaban" value={rsvps.length} />
      </div>

      {rsvps.length === 0 ? (
        <div className="dr-empty">Belum ada konfirmasi. Jawaban tamu muncul di sini begitu mereka mengisi RSVP.</div>
      ) : (
        <>
          <div className="dr-tools">
            <input className="dg-input dr-search" type="search" value={q} onChange={e => setQ(e.target.value)}
              placeholder="Cari nama, nomor, atau ucapan" aria-label="Cari jawaban RSVP" />
            <div className="dr-filters" role="group" aria-label="Saring kehadiran">
              {FILTERS.map(([key, label, n]) => (
                <button key={key} type="button" className="dg-chip" aria-pressed={filter === key} onClick={() => setFilter(key)}>
                  {label} <span className="count">{n}</span>
                </button>
              ))}
            </div>
            <button type="button" className="dg-btn dg-btn-line dg-btn-sm dr-csv" onClick={onCsv}>Unduh CSV</button>
          </div>
          {rows.length === 0 ? (
            <div className="dr-empty">Tidak ada jawaban yang cocok.</div>
          ) : (
            <div className="dr-table-wrap">
              <table className="dr-table">
                <thead>
                  <tr>
                    <th>Nama</th><th>WhatsApp</th><th>Hadir</th><th>Jml Tamu</th><th>Ucapan</th><th>Waktu</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(r => (
                    <tr key={r.id}>
                      <td className="dr-name">{r.guest_name}</td>
                      <td className="dr-muted">{r.whatsapp || '—'}</td>
                      <td><span className={`dr-pill ${r.attending ? 'yes' : 'no'}`}>{r.attending ? 'Hadir' : 'Tidak'}</span></td>
                      <td className="dg-num dr-center-cell">{r.attending ? r.pax : '—'}</td>
                      <td className="dr-wishes">{r.wishes || <span className="dr-muted">—</span>}</td>
                      <td className="dr-time">
                        {format(new Date(r.submitted_at), 'dd MMM yyyy HH:mm', { locale: id })}
                        {r.updated_at && new Date(r.updated_at) - new Date(r.submitted_at) > 60000 && (
                          <small className="dr-updated">diperbarui {format(new Date(r.updated_at), 'dd MMM HH:mm', { locale: id })}</small>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}
