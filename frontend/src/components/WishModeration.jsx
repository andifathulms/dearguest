import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import api from '../api/client.js'

const FILTERS = [
  ['all', 'Semua'],
  ['pending', 'Menunggu'],
  ['visible', 'Tampil'],
  ['hidden', 'Disembunyikan'],
]
const STATUS_LABEL = { pending: 'Menunggu', visible: 'Tampil', hidden: 'Disembunyikan' }

// The couple's moderation of the public wishes wall: approve held wishes,
// hide/unhide, delete the text, plus the approval switch and blocklist.
export default function WishModeration({ slug, onChange }) {
  const [wishes, setWishes] = useState(null)
  const [filter, setFilter] = useState('all')
  const [settings, setSettings] = useState({ wishes_require_approval: false, wish_blocklist: '' })
  const [blocklist, setBlocklist] = useState('')
  const [message, setMessage] = useState('')

  function load() {
    api.get(`/my/invitations/${slug}/wishes/`).then(res => setWishes(res.data)).catch(() => setWishes([]))
  }

  useEffect(() => {
    load()
    api.get(`/my/invitations/${slug}/`).then(({ data }) => {
      setSettings({ wishes_require_approval: data.wishes_require_approval, wish_blocklist: data.wish_blocklist })
      setBlocklist(data.wish_blocklist || '')
    }).catch(() => {})
  }, [slug]) // eslint-disable-line react-hooks/exhaustive-deps

  function flash(text) {
    setMessage(text)
    setTimeout(() => setMessage(''), 2500)
  }

  async function setStatus(wish, wish_status) {
    try {
      await api.patch(`/my/invitations/${slug}/wishes/${wish.id}/`, { wish_status })
      setWishes(ws => ws.map(w => (w.id === wish.id ? { ...w, wish_status } : w)))
      onChange?.()
    } catch { flash('Gagal mengubah status') }
  }

  async function remove(wish) {
    if (!window.confirm('Hapus ucapan ini? Konfirmasi kehadirannya tetap tersimpan.')) return
    try {
      await api.delete(`/my/invitations/${slug}/wishes/${wish.id}/`)
      setWishes(ws => ws.filter(w => w.id !== wish.id))
      onChange?.()
    } catch { flash('Gagal menghapus') }
  }

  async function saveSettings(patch) {
    try {
      const { data } = await api.patch(`/my/invitations/${slug}/`, patch)
      setSettings({ wishes_require_approval: data.wishes_require_approval, wish_blocklist: data.wish_blocklist })
      flash('Pengaturan tersimpan')
    } catch { flash('Gagal menyimpan pengaturan') }
  }

  if (wishes === null) return <div className="dr-empty">Memuat ucapan…</div>

  const shown = filter === 'all' ? wishes : wishes.filter(w => w.wish_status === filter)
  const count = status => wishes.filter(w => w.wish_status === status).length

  return (
    <div className="wm">
      <div className="wm-settings">
        <label className="wm-switch">
          <input
            type="checkbox"
            checked={settings.wishes_require_approval}
            onChange={e => saveSettings({ wishes_require_approval: e.target.checked })}
          />
          <span>
            <strong>Setujui ucapan dulu sebelum tampil</strong>
            <small>Ucapan yang berisi link atau kata terlarang selalu menunggu persetujuan.</small>
          </span>
        </label>
        <div className="wm-blocklist">
          <label htmlFor="wm-blocklist"><strong>Kata terlarang</strong> <small>satu per baris</small></label>
          <textarea id="wm-blocklist" rows="3" value={blocklist} onChange={e => setBlocklist(e.target.value)} />
          <button
            className="ui-btn ui-btn-ghost"
            disabled={blocklist === (settings.wish_blocklist || '')}
            onClick={() => saveSettings({ wish_blocklist: blocklist })}
          >
            Simpan daftar
          </button>
        </div>
      </div>

      <div className="wm-filters" role="tablist" aria-label="Saring ucapan">
        {FILTERS.map(([key, label]) => (
          <button
            key={key}
            role="tab"
            aria-selected={filter === key}
            className={`wm-filter ${filter === key ? 'active' : ''}`}
            onClick={() => setFilter(key)}
          >
            {label}{key !== 'all' && <span>{count(key)}</span>}
          </button>
        ))}
      </div>
      {message && <p className="wm-message" role="status">{message}</p>}

      {shown.length === 0 ? (
        <div className="dr-empty">Tidak ada ucapan di sini.</div>
      ) : (
        <ul className="wm-list">
          {shown.map(w => (
            <li key={w.id} className={`wm-item wm-${w.wish_status}`}>
              <div className="wm-head">
                <strong>{w.guest_name}</strong>
                <span className={`wm-badge wm-badge-${w.wish_status}`}>{STATUS_LABEL[w.wish_status]}</span>
                <span className="dr-time">{format(new Date(w.updated_at || w.submitted_at), 'dd MMM yyyy HH:mm', { locale: id })}</span>
              </div>
              <p className="wm-text">{w.wishes}</p>
              <div className="wm-actions">
                {w.wish_status === 'pending' && <button className="ui-btn ui-btn-dark" onClick={() => setStatus(w, 'visible')}>Setujui</button>}
                {w.wish_status === 'visible' && <button className="ui-btn ui-btn-ghost" onClick={() => setStatus(w, 'hidden')}>Sembunyikan</button>}
                {w.wish_status === 'hidden' && <button className="ui-btn ui-btn-ghost" onClick={() => setStatus(w, 'visible')}>Tampilkan</button>}
                {w.wish_status === 'pending' && <button className="ui-btn ui-btn-ghost" onClick={() => setStatus(w, 'hidden')}>Sembunyikan</button>}
                <button className="ui-btn ui-btn-ghost wm-delete" onClick={() => remove(w)}>Hapus</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
