import { useEffect, useState } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import api from '../api/client.js'
import { formatDateOnly } from '../utils/dates.js'
import { usherUrl, welcomeScreenUrl } from '../utils/publicUrl.js'
import { waLink } from '../utils/whatsapp.js'

const POLL_MS = 20000

async function downloadGuestbook(slug) {
  const res = await api.get(`/invitations/${slug}/guestbook.csv`, { responseType: 'blob' })
  const url = URL.createObjectURL(res.data)
  const a = Object.assign(document.createElement('a'), { href: url, download: `buku-tamu-${slug}.csv` })
  a.click()
  URL.revokeObjectURL(url)
}

// The couple's "Hari-H" tab: switch on Mode Penerima Tamu, hand the link to
// the ushers, count souvenirs, watch arrivals, export the guestbook.
export default function VenueSetup({ slug }) {
  const [state, setState] = useState(null)
  const [stock, setStock] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const load = () => api.get(`/my/invitations/${slug}/usher/`).then(res => {
      setState(res.data)
      setStock(s => (s === '' && res.data.souvenir_stock != null ? String(res.data.souvenir_stock) : s))
    }).catch(() => {})
    load()
    const timer = setInterval(load, POLL_MS)
    return () => clearInterval(timer)
  }, [slug])

  function flash(text) {
    setMessage(text)
    setTimeout(() => setMessage(''), 2500)
  }

  async function patch(body, done) {
    try {
      const res = await api.patch(`/my/invitations/${slug}/usher/`, body)
      setState(res.data)
      if (done) flash(done)
    } catch (err) {
      flash(err.response?.data?.souvenir_stock?.[0] || 'Gagal menyimpan')
    }
  }

  function copy(text) {
    navigator.clipboard.writeText(text).then(() => flash('Link disalin')).catch(() => {})
  }

  if (!state) return <div className="dr-empty">Memuat…</div>
  const link = state.token ? usherUrl(state.token) : ''
  const { stats } = state
  const shareText = `Link penerima tamu untuk pernikahan kami. Buka di HP saat bertugas di meja tamu, untuk scan QR undangan dan mencatat amplop:\n${link}`

  return (
    <div className="dg dg-inline vs">
      <label className="wm-switch">
        <input type="checkbox" checked={state.usher_enabled} onChange={e => patch({ usher_enabled: e.target.checked }, e.target.checked ? 'Mode penerima tamu aktif' : 'Mode penerima tamu dimatikan')} />
        <span>
          <strong>Mode Penerima Tamu</strong>
          <small>
            Penerima tamu memakai HP mereka sendiri untuk scan QR undangan, mencari nama, mencatat nomor amplop dan suvenir.
            Link aktif {formatDateOnly(state.window_start)} sampai {formatDateOnly(state.window_end)}; kalian sendiri bisa mencobanya kapan saja saat masuk.
          </small>
        </span>
      </label>
      {message && <p className="wm-message" role="status">{message}</p>}

      {state.usher_enabled && (
        <>
          <div className="dr-stats vs-stats">
            <div className="dr-stat lead"><strong className="dg-num">{stats.arrived_pax}</strong><span>orang sudah hadir</span></div>
            <div className="dr-stat"><strong className="dg-num">{stats.arrived}<small>/{stats.invited}</small></strong><span>undangan sudah datang</span></div>
            <div className="dr-stat"><strong className="dg-num">{stats.expected_pax}</strong><span>perkiraan maks. tamu</span></div>
            <div className="dr-stat"><strong className="dg-num">{stats.walk_ins}</strong><span>datang tanpa undangan</span></div>
          </div>

          <section className="vs-card" aria-labelledby="vs-link-title">
            <div className="vs-link">
              <div>
                <h3 id="vs-link-title">Link untuk penerima tamu</h3>
                <p className="vs-hint">Bagikan hanya ke penerima tamu. Siapa pun yang punya link ini bisa melihat daftar nama tamu (tanpa nomor WhatsApp).</p>
                <code className="vs-url">{link}</code>
                <div className="vs-actions">
                  <button type="button" className="dg-btn dg-btn-ink dg-btn-sm" onClick={() => copy(link)}>Salin link</button>
                  <a className="dg-btn dg-btn-wa dg-btn-sm" href={waLink('', shareText)} target="_blank" rel="noopener noreferrer">Kirim via WhatsApp</a>
                  <a className="dg-btn dg-btn-line dg-btn-sm" href={link} target="_blank" rel="noopener noreferrer">Coba sekarang</a>
                  <button type="button" className="dg-btn dg-btn-line dg-btn-sm"
                    onClick={() => { if (window.confirm('Buat link baru? Link lama langsung tidak berlaku.')) patch({ rotate: true }, 'Link baru dibuat') }}>
                    Ganti link
                  </button>
                </div>
              </div>
              <div className="vs-qr" aria-label="QR link penerima tamu">
                <QRCodeCanvas value={link} size={148} level="M" includeMargin />
                <small>Scan dengan HP penerima tamu</small>
              </div>
            </div>
          </section>

          <section className="vs-card" aria-labelledby="vs-welcome-title">
            <h3 id="vs-welcome-title">Layar sambutan</h3>
            <p className="vs-hint">Buka di laptop yang tersambung ke TV atau proyektor di pintu masuk. Setiap tamu yang check-in disambut dengan namanya, dengan lukisan tema undangan kalian. Klik sekali untuk layar penuh.</p>
            <div className="vs-actions">
              <a className="dg-btn dg-btn-line dg-btn-sm" href={welcomeScreenUrl(state.token)} target="_blank" rel="noopener noreferrer">Buka layar sambutan</a>
              <button type="button" className="dg-btn dg-btn-line dg-btn-sm" onClick={() => copy(welcomeScreenUrl(state.token))}>Salin link layar</button>
            </div>
          </section>

          <section className="vs-card" aria-labelledby="vs-souvenir-title">
            <h3 id="vs-souvenir-title">Suvenir</h3>
            <p className="vs-hint">Isi jumlah suvenir yang disiapkan; penerima tamu melihat sisanya. Kosongkan bila tidak dihitung.</p>
            <div className="vs-souvenir">
              <input className="dg-input" inputMode="numeric" value={stock} aria-label="Jumlah suvenir"
                onChange={e => setStock(e.target.value.replace(/\D/g, ''))} placeholder="mis. 300" />
              <button type="button" className="dg-btn dg-btn-ink dg-btn-sm" onClick={() => patch({ souvenir_stock: stock }, 'Jumlah suvenir tersimpan')}>Simpan</button>
              {stats.souvenir_stock != null && <span className="vs-hint">{stats.souvenirs_given} diberikan · sisa {stats.souvenirs_left}</span>}
            </div>
          </section>

          <section className="vs-card" aria-labelledby="vs-book-title">
            <h3 id="vs-book-title">Buku tamu digital</h3>
            <p className="vs-hint">Semua yang sudah check-in: waktu datang, jumlah orang, nomor amplop, suvenir dan ucapan mereka. Cocokkan nomor amplop dengan isinya setelah acara.</p>
            <button type="button" className="dg-btn dg-btn-line dg-btn-sm"
              onClick={() => downloadGuestbook(slug).catch(() => flash('Gagal mengunduh'))}>Unduh buku tamu (CSV)</button>
          </section>
        </>
      )}
    </div>
  )
}
