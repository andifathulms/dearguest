import { useState, useEffect, useRef } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import api from '../api/client.js'

const ic = {
  link: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" /><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" /></svg>,
  wa: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 14.4c-.3-.1-1.7-.8-1.9-.9-.3-.1-.5-.1-.7.1-.2.3-.7.9-.9 1.1-.2.2-.3.2-.6.1-1.6-.8-2.6-1.4-3.7-3.2-.3-.5.3-.4.8-1.4.1-.2 0-.4 0-.5 0-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.4s1 2.8 1.2 3c.1.2 2 3.1 5 4.3 1.8.8 2.5.8 3.4.7.6-.1 1.7-.7 1.9-1.4.2-.6.2-1.2.2-1.4-.1-.1-.3-.2-.6-.3zM12 2a10 10 0 0 0-8.5 15.2L2 22l4.9-1.5A10 10 0 1 0 12 2z" /></svg>,
  qr: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><path d="M14 14h3v3M21 14v.01M14 21h.01M21 21v-4M17 21h.01" /></svg>,
  trash: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" /></svg>,
}

function waNumber(n) {
  if (!n) return ''
  let d = n.replace(/\D/g, '')
  if (d.startsWith('0')) d = '62' + d.slice(1)
  return d
}

export default function GuestManager({ slug, brideName, groomName }) {
  const [guests, setGuests] = useState([])
  const [stats, setStats] = useState({ total: 0, checked_in: 0 })
  const [bulk, setBulk] = useState('')
  const [group, setGroup] = useState('')
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [qrGuest, setQrGuest] = useState(null)
  const [toast, setToast] = useState('')
  const qrRef = useRef(null)

  const origin = window.location.origin

  function guestLink(g) {
    return `${origin}/${slug}?to=${encodeURIComponent(g.name)}&g=${g.code}`
  }
  function inviteText(g) {
    return `Assalamualaikum Wr. Wb.\n\nKepada Yth. ${g.name},\nDengan penuh kebahagiaan, kami mengundang Anda ke pernikahan ${brideName} & ${groomName}.\n\nBuka undangan digital kami di:\n${guestLink(g)}\n\nMerupakan suatu kehormatan apabila Anda berkenan hadir. Terima kasih 🤍`
  }

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(''), 2000)
  }

  async function load() {
    try {
      const res = await api.get(`/invitations/${slug}/guests/`)
      setGuests(res.data.guests || [])
      setStats(res.data.stats || { total: 0, checked_in: 0 })
    } catch {
      // handled by parent auth flow
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [slug])

  async function handleAdd() {
    const names = bulk.split('\n').map(s => s.trim()).filter(Boolean)
    if (names.length === 0) return
    setAdding(true)
    try {
      await api.post(`/invitations/${slug}/guests/`, { names, group })
      setBulk('')
      setGroup('')
      await load()
      showToast(`${names.length} tamu ditambahkan`)
    } catch {
      showToast('Gagal menambah tamu')
    } finally {
      setAdding(false)
    }
  }

  async function toggleCheck(g) {
    try {
      await api.patch(`/invitations/${slug}/guests/${g.id}/`, { checked_in: !g.checked_in })
      await load()
    } catch {
      showToast('Gagal memperbarui')
    }
  }

  async function remove(g) {
    if (!window.confirm(`Hapus ${g.name} dari daftar tamu?`)) return
    try {
      await api.delete(`/invitations/${slug}/guests/${g.id}/`)
      await load()
    } catch {
      showToast('Gagal menghapus')
    }
  }

  function copyLink(g) {
    navigator.clipboard.writeText(guestLink(g)).then(() => showToast('Link disalin'))
  }

  function sendWa(g) {
    const num = waNumber(g.whatsapp)
    const url = `https://wa.me/${num}?text=${encodeURIComponent(inviteText(g))}`
    window.open(url, '_blank', 'noopener')
  }

  function downloadQr() {
    const canvas = qrRef.current?.querySelector('canvas')
    if (!canvas) return
    const a = document.createElement('a')
    a.href = canvas.toDataURL('image/png')
    a.download = `qr-${qrGuest.name.replace(/\s+/g, '-').toLowerCase()}.png`
    a.click()
  }

  if (loading) return <div className="gm-empty">Memuat daftar tamu…</div>

  return (
    <div>
      {/* Add guests */}
      <div className="gm-add">
        <h3>Tambah Tamu</h3>
        <p>Masukkan nama tamu, satu nama per baris. Tiap tamu otomatis mendapat link & QR personal.</p>
        <textarea
          value={bulk}
          onChange={e => setBulk(e.target.value)}
          placeholder={'Budi Santoso\nSiti Aminah\nKeluarga Pak Joko'}
        />
        <div className="gm-add-row">
          <input
            value={group}
            onChange={e => setGroup(e.target.value)}
            placeholder="Kelompok (opsional) — mis. Keluarga, Kantor"
          />
          <button className="gm-btn gm-btn-primary" onClick={handleAdd} disabled={adding}>
            {adding ? 'Menambahkan…' : 'Tambah Tamu'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="gm-stats">
        <div className="gm-stat"><strong>{stats.total}</strong><span>TOTAL TAMU</span></div>
        <div className="gm-stat"><strong style={{ color: '#4CAF50' }}>{stats.checked_in}</strong><span>SUDAH HADIR</span></div>
        <div className="gm-stat"><strong style={{ color: '#b8924e' }}>{stats.total - stats.checked_in}</strong><span>BELUM HADIR</span></div>
      </div>

      {/* List */}
      {guests.length === 0 ? (
        <div className="gm-list"><div className="gm-empty">Belum ada tamu. Tambahkan di atas untuk membuat link & QR personal.</div></div>
      ) : (
        <div className="gm-list">
          {guests.map(g => (
            <div className={`gm-row ${g.checked_in ? 'checked' : ''}`} key={g.id}>
              <label className="gm-check" title="Tandai hadir (check-in)">
                <input type="checkbox" checked={g.checked_in} onChange={() => toggleCheck(g)} />
              </label>
              <div className="gm-row-main">
                <div className="gm-row-name">{g.name}</div>
                <div className="gm-row-meta">
                  {g.group ? `${g.group} · ` : ''}kode {g.code}
                  {g.checked_in ? ' · hadir ✓' : ''}
                </div>
              </div>
              <div className="gm-row-actions">
                <button className="gm-btn" onClick={() => copyLink(g)}>{ic.link} Link</button>
                <button className="gm-btn gm-btn-wa" onClick={() => sendWa(g)}>{ic.wa} Kirim</button>
                <button className="gm-btn" onClick={() => setQrGuest(g)}>{ic.qr} QR</button>
                <button className="gm-btn" onClick={() => remove(g)} aria-label="Hapus">{ic.trash}</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* QR modal */}
      {qrGuest && (
        <div className="gm-modal-overlay" onClick={() => setQrGuest(null)}>
          <div className="gm-modal" onClick={e => e.stopPropagation()}>
            <h3>{qrGuest.name}</h3>
            <p>{guestLink(qrGuest)}</p>
            <div className="gm-modal-qr" ref={qrRef}>
              <QRCodeCanvas value={guestLink(qrGuest)} size={200} level="M" includeMargin />
            </div>
            <div className="gm-modal-actions">
              <button className="gm-btn gm-btn-primary" onClick={downloadQr}>Unduh QR</button>
              <button className="gm-btn" onClick={() => setQrGuest(null)}>Tutup</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="gm-toast">{toast}</div>}
    </div>
  )
}
