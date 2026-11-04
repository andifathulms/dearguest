import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import api from '../api/client.js'
import { waLink } from '../utils/whatsapp.js'

const FILTERS = [['all', 'Semua'], ['todo', 'Belum berterima kasih'], ['done', 'Sudah']]
const rupiah = n => `Rp${Number(n).toLocaleString('id-ID')}`

function thankYou(name, couple) {
  const names = [couple?.bride_name, couple?.groom_name].filter(Boolean).join(' & ')
  return `Halo ${name},\n\nTerima kasih banyak atas hadiah dan doa restunya untuk pernikahan kami. Kami sangat menghargainya.\n\n${names}`
}

// The couple's "Kado" tab: who said they sent a gift, through what, and
// whether they've been thanked. Matching against the bank statement is the
// couple's job; this is the list to tick off.
export default function GiftLog({ slug }) {
  const [data, setData] = useState(null)
  const [inv, setInv] = useState(null)
  const [filter, setFilter] = useState('todo')
  const [message, setMessage] = useState('')

  function load() {
    api.get(`/my/invitations/${slug}/gifts/`).then(res => setData(res.data)).catch(() => setData({ gifts: [], stats: {} }))
  }

  useEffect(() => {
    load()
    api.get(`/my/invitations/${slug}/`).then(res => setInv(res.data)).catch(() => {})
  }, [slug]) // eslint-disable-line react-hooks/exhaustive-deps

  function flash(text) {
    setMessage(text)
    setTimeout(() => setMessage(''), 2500)
  }

  async function setThanked(gift, thanked) {
    try {
      await api.patch(`/my/invitations/${slug}/gifts/${gift.id}/`, { thanked })
      load()
    } catch { flash('Gagal menyimpan') }
  }

  async function remove(gift) {
    if (!window.confirm(`Hapus konfirmasi dari ${gift.sender_name}?`)) return
    try {
      await api.delete(`/my/invitations/${slug}/gifts/${gift.id}/`)
      load()
    } catch { flash('Gagal menghapus') }
  }

  function sendThanks(gift) {
    window.open(waLink(gift.guest_whatsapp, thankYou(gift.sender_name, inv?.couple)), '_blank', 'noopener')
    if (!gift.thanked_at) setThanked(gift, true)
  }

  async function toggleForm(on) {
    try {
      const res = await api.patch(`/my/invitations/${slug}/`, { gift_confirm: on })
      setInv(res.data)
      flash(on ? 'Formulir konfirmasi ditampilkan' : 'Formulir konfirmasi disembunyikan')
    } catch { flash('Gagal menyimpan pengaturan') }
  }

  if (data === null) return <div className="dr-empty">Memuat…</div>
  const { gifts, stats } = data
  const shown = gifts.filter(g => filter === 'all' || (filter === 'done') === !!g.thanked_at)

  return (
    <div className="dg dg-inline wm gl">
      <div className="dr-stats">
        <div className="dr-stat lead"><strong className="dg-num">{stats.count || 0}</strong><span>konfirmasi hadiah</span></div>
        <div className="dr-stat"><strong className="dg-num">{rupiah(stats.amount || 0)}</strong><span>nominal yang disebutkan</span></div>
        <div className="dr-stat no"><strong className="dg-num">{stats.unthanked || 0}</strong><span>belum diberi ucapan terima kasih</span></div>
      </div>

      {inv && (
        <label className="wm-switch gl-switch">
          <input type="checkbox" checked={!!inv.gift_confirm} onChange={e => toggleForm(e.target.checked)} />
          <span>
            <strong>Tampilkan tombol "Konfirmasi Kirim Hadiah" di undangan</strong>
            <small>Tamu bisa memberi tahu nama, rekening tujuan dan nominal (opsional). Nominal hanya terlihat oleh kalian.</small>
          </span>
        </label>
      )}

      <div className="wm-filters" role="tablist" aria-label="Saring konfirmasi">
        {FILTERS.map(([key, label]) => (
          <button key={key} role="tab" aria-selected={filter === key} className={`wm-filter ${filter === key ? 'active' : ''}`}
            onClick={() => setFilter(key)}>{label}</button>
        ))}
      </div>
      {message && <p className="wm-message" role="status">{message}</p>}

      {shown.length === 0 ? (
        <div className="dr-empty">
          {gifts.length === 0 ? 'Belum ada konfirmasi hadiah. Konfirmasi dari tamu muncul di sini.' : 'Tidak ada konfirmasi di sini.'}
        </div>
      ) : (
        <ul className="wm-list">
          {shown.map(g => (
            <li key={g.id} className={`wm-item ${g.thanked_at ? 'wm-hidden' : ''}`}>
              <div className="wm-head">
                <strong>{g.sender_name}</strong>
                {g.guest_group && <span className="wm-badge">{g.guest_group}</span>}
                {g.thanked_at && <span className="wm-badge wm-badge-visible">Sudah berterima kasih</span>}
                <span className="dr-time">{format(new Date(g.created_at), 'dd MMM yyyy HH:mm', { locale: id })}</span>
              </div>
              <p className="gl-line">
                {g.channel || 'Cara kirim tidak disebutkan'}
                {g.amount ? <> · <strong className="dg-num">{rupiah(g.amount)}</strong></> : ''}
              </p>
              {g.note && <p className="wm-text">{g.note}</p>}
              <div className="wm-actions">
                {g.guest_whatsapp && (
                  <button className="ui-btn ui-btn-dark" onClick={() => sendThanks(g)}>Kirim terima kasih via WhatsApp</button>
                )}
                <button className="ui-btn ui-btn-ghost" onClick={() => setThanked(g, !g.thanked_at)}>
                  {g.thanked_at ? 'Tandai belum' : 'Tandai sudah berterima kasih'}
                </button>
                <button className="ui-btn ui-btn-ghost wm-delete" onClick={() => remove(g)}>Hapus</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
