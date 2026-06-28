import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../api/client.js'
import './Editor.css'

const THEMES = [
  ['javanese-dark', 'Javanese Malam Emas'],
  ['floral-light', 'Taman Bunga'],
  ['modern-minimalist', 'Minimalis Putih'],
  ['luxury-emerald', 'Zamrud Mewah'],
  ['rustic-kraft', 'Rustic Kraft'],
  ['boho-terracotta', 'Senja Terakota'],
]

/* ---------------- Settings ---------------- */
function SettingsSection({ inv, reload, notify }) {
  const [f, setF] = useState({
    theme: inv.theme, wedding_date: inv.wedding_date || '',
    opening_text: inv.opening_text || '', closing_text: inv.closing_text || '',
    livestream_url: inv.livestream_url || '',
  })
  const [music, setMusic] = useState(null)
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setF(s => ({ ...s, [k]: v }))

  async function save() {
    setSaving(true)
    try {
      const fd = new FormData()
      Object.entries(f).forEach(([k, v]) => fd.append(k, v))
      if (music) fd.append('music_file', music)
      await api.patch('/my/invitation/', fd)
      notify('Pengaturan tersimpan')
      reload()
    } catch { notify('Gagal menyimpan') } finally { setSaving(false) }
  }

  return (
    <div className="ed-card">
      <h2>Pengaturan Undangan</h2>
      <p className="ed-card-sub">Tema, tanggal, sambutan, musik, dan live streaming.</p>
      <div className="ed-field">
        <label>Tema</label>
        <select className="ed-select" value={f.theme} onChange={e => set('theme', e.target.value)}>
          {THEMES.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
        </select>
      </div>
      <div className="ed-field">
        <label>Tanggal pernikahan</label>
        <input className="ed-input" type="date" value={f.wedding_date} onChange={e => set('wedding_date', e.target.value)} />
      </div>
      <div className="ed-field">
        <label>Teks pembuka</label>
        <textarea className="ed-textarea" value={f.opening_text} onChange={e => set('opening_text', e.target.value)} placeholder="Kata sambutan untuk tamu…" />
      </div>
      <div className="ed-field">
        <label>Teks penutup</label>
        <textarea className="ed-textarea" value={f.closing_text} onChange={e => set('closing_text', e.target.value)} placeholder="Ucapan terima kasih…" />
      </div>
      <div className="ed-field">
        <label>Link live streaming (opsional — YouTube, dll.)</label>
        <input className="ed-input" value={f.livestream_url} onChange={e => set('livestream_url', e.target.value)} placeholder="https://youtube.com/watch?v=…" />
      </div>
      <div className="ed-field">
        <label>Musik latar {inv.music_file && <a href={inv.music_file} target="_blank" rel="noopener noreferrer" style={{ color: '#b8924e' }}>(file saat ini)</a>}</label>
        <input className="ed-file" type="file" accept="audio/*" onChange={e => setMusic(e.target.files[0] || null)} />
      </div>
      <div className="ed-save-row">
        <button className="ed-btn" onClick={save} disabled={saving}>{saving ? 'Menyimpan…' : 'Simpan Pengaturan'}</button>
      </div>
    </div>
  )
}

/* ---------------- Couple ---------------- */
function CoupleSection({ inv, reload, notify }) {
  const c = inv.couple || {}
  const [f, setF] = useState({
    bride_name: c.bride_name || '', bride_parents: c.bride_parents || '', bride_bio: c.bride_bio || '',
    groom_name: c.groom_name || '', groom_parents: c.groom_parents || '', groom_bio: c.groom_bio || '',
  })
  const [photos, setPhotos] = useState({ bride_photo: null, groom_photo: null })
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setF(s => ({ ...s, [k]: v }))

  async function save() {
    setSaving(true)
    try {
      const fd = new FormData()
      Object.entries(f).forEach(([k, v]) => fd.append(k, v))
      if (photos.bride_photo) fd.append('bride_photo', photos.bride_photo)
      if (photos.groom_photo) fd.append('groom_photo', photos.groom_photo)
      await api.put('/my/couple/', fd)
      notify('Data mempelai tersimpan')
      reload()
    } catch { notify('Gagal menyimpan') } finally { setSaving(false) }
  }

  return (
    <div className="ed-card">
      <h2>Mempelai</h2>
      <p className="ed-card-sub">Nama, orang tua, bio, dan foto kedua mempelai.</p>
      <div className="ed-row2">
        <div>
          <div className="ed-field"><label>Nama mempelai wanita</label><input className="ed-input" value={f.bride_name} onChange={e => set('bride_name', e.target.value)} /></div>
          <div className="ed-field"><label>Orang tua</label><input className="ed-input" value={f.bride_parents} onChange={e => set('bride_parents', e.target.value)} placeholder="Putri dari Bapak … & Ibu …" /></div>
          <div className="ed-field"><label>Bio (opsional)</label><textarea className="ed-textarea" value={f.bride_bio} onChange={e => set('bride_bio', e.target.value)} /></div>
          <div className="ed-field"><label>Foto {c.bride_photo && <a href={c.bride_photo} target="_blank" rel="noopener noreferrer" style={{ color: '#b8924e' }}>(lihat)</a>}</label><input className="ed-file" type="file" accept="image/*" onChange={e => setPhotos(p => ({ ...p, bride_photo: e.target.files[0] || null }))} /></div>
        </div>
        <div>
          <div className="ed-field"><label>Nama mempelai pria</label><input className="ed-input" value={f.groom_name} onChange={e => set('groom_name', e.target.value)} /></div>
          <div className="ed-field"><label>Orang tua</label><input className="ed-input" value={f.groom_parents} onChange={e => set('groom_parents', e.target.value)} placeholder="Putra dari Bapak … & Ibu …" /></div>
          <div className="ed-field"><label>Bio (opsional)</label><textarea className="ed-textarea" value={f.groom_bio} onChange={e => set('groom_bio', e.target.value)} /></div>
          <div className="ed-field"><label>Foto {c.groom_photo && <a href={c.groom_photo} target="_blank" rel="noopener noreferrer" style={{ color: '#b8924e' }}>(lihat)</a>}</label><input className="ed-file" type="file" accept="image/*" onChange={e => setPhotos(p => ({ ...p, groom_photo: e.target.files[0] || null }))} /></div>
        </div>
      </div>
      <div className="ed-save-row"><button className="ed-btn" onClick={save} disabled={saving}>{saving ? 'Menyimpan…' : 'Simpan Mempelai'}</button></div>
    </div>
  )
}

/* ---------------- Events ---------------- */
function EventsSection({ inv, reload, notify }) {
  const [items, setItems] = useState(inv.events.map(e => ({ ...e, datetime: (e.datetime || '').slice(0, 16) })))
  useEffect(() => { setItems(inv.events.map(e => ({ ...e, datetime: (e.datetime || '').slice(0, 16) }))) }, [inv])

  const update = (i, k, v) => setItems(arr => arr.map((it, j) => j === i ? { ...it, [k]: v } : it))
  const addDraft = () => setItems(arr => [...arr, { event_type: 'akad', datetime: '', venue_name: '', address: '', gmaps_url: '', gmaps_embed_url: '' }])

  async function saveOne(it) {
    const payload = { ...it }
    try {
      if (it.id) await api.put(`/my/events/${it.id}/`, payload)
      else await api.post('/my/events/', payload)
      notify('Acara tersimpan'); reload()
    } catch { notify('Gagal menyimpan acara') }
  }
  async function delOne(it, i) {
    if (it.id) { try { await api.delete(`/my/events/${it.id}/`); notify('Acara dihapus'); reload() } catch { notify('Gagal menghapus') } }
    else setItems(arr => arr.filter((_, j) => j !== i))
  }

  return (
    <div className="ed-card">
      <h2>Rangkaian Acara</h2>
      <p className="ed-card-sub">Akad nikah dan resepsi.</p>
      {items.length === 0 && <p className="ed-empty">Belum ada acara.</p>}
      {items.map((it, i) => (
        <div className="ed-item" key={it.id || `new-${i}`}>
          <div className="ed-item-head">
            <strong>{it.event_type === 'akad' ? 'Akad Nikah' : 'Resepsi'}</strong>
            <button className="ed-mini ed-btn-danger" onClick={() => delOne(it, i)}>Hapus</button>
          </div>
          <div className="ed-row2">
            <div className="ed-field"><label>Jenis</label>
              <select className="ed-select" value={it.event_type} onChange={e => update(i, 'event_type', e.target.value)}>
                <option value="akad">Akad Nikah</option><option value="resepsi">Resepsi</option>
              </select>
            </div>
            <div className="ed-field"><label>Tanggal & waktu</label><input className="ed-input" type="datetime-local" value={it.datetime} onChange={e => update(i, 'datetime', e.target.value)} /></div>
          </div>
          <div className="ed-field"><label>Nama tempat</label><input className="ed-input" value={it.venue_name} onChange={e => update(i, 'venue_name', e.target.value)} /></div>
          <div className="ed-field"><label>Alamat</label><textarea className="ed-textarea" value={it.address} onChange={e => update(i, 'address', e.target.value)} /></div>
          <div className="ed-row2">
            <div className="ed-field"><label>Link Google Maps</label><input className="ed-input" value={it.gmaps_url} onChange={e => update(i, 'gmaps_url', e.target.value)} placeholder="https://maps.app.goo.gl/…" /></div>
            <div className="ed-field"><label>Link embed peta</label><input className="ed-input" value={it.gmaps_embed_url} onChange={e => update(i, 'gmaps_embed_url', e.target.value)} placeholder="https://www.google.com/maps?…&output=embed" /></div>
          </div>
          <button className="ed-btn ed-btn-sm" onClick={() => saveOne(it)}>Simpan Acara</button>
        </div>
      ))}
      <button className="ed-btn-ghost ed-btn ed-btn-sm" onClick={addDraft}>+ Tambah Acara</button>
    </div>
  )
}

/* ---------------- Stories ---------------- */
function StoriesSection({ inv, reload, notify }) {
  const [items, setItems] = useState(inv.stories)
  useEffect(() => setItems(inv.stories), [inv])
  const update = (i, k, v) => setItems(arr => arr.map((it, j) => j === i ? { ...it, [k]: v } : it))
  const addDraft = () => setItems(arr => [...arr, { title: '', description: '', date: '', order: arr.length }])

  async function saveOne(it) {
    const payload = { ...it, date: it.date || null }
    try {
      if (it.id) await api.put(`/my/stories/${it.id}/`, payload)
      else await api.post('/my/stories/', payload)
      notify('Kisah tersimpan'); reload()
    } catch { notify('Gagal menyimpan') }
  }
  async function delOne(it, i) {
    if (it.id) { try { await api.delete(`/my/stories/${it.id}/`); notify('Kisah dihapus'); reload() } catch { notify('Gagal menghapus') } }
    else setItems(arr => arr.filter((_, j) => j !== i))
  }

  return (
    <div className="ed-card">
      <h2>Kisah Cinta</h2>
      <p className="ed-card-sub">Perjalanan cinta kalian (opsional).</p>
      {items.length === 0 && <p className="ed-empty">Belum ada kisah.</p>}
      {items.map((it, i) => (
        <div className="ed-item" key={it.id || `new-${i}`}>
          <div className="ed-item-head"><strong>{it.title || 'Kisah baru'}</strong>
            <button className="ed-mini ed-btn-danger" onClick={() => delOne(it, i)}>Hapus</button>
          </div>
          <div className="ed-row2">
            <div className="ed-field"><label>Judul</label><input className="ed-input" value={it.title} onChange={e => update(i, 'title', e.target.value)} /></div>
            <div className="ed-field"><label>Tanggal (opsional)</label><input className="ed-input" type="date" value={it.date || ''} onChange={e => update(i, 'date', e.target.value)} /></div>
          </div>
          <div className="ed-field"><label>Cerita</label><textarea className="ed-textarea" value={it.description} onChange={e => update(i, 'description', e.target.value)} /></div>
          <button className="ed-btn ed-btn-sm" onClick={() => saveOne(it)}>Simpan Kisah</button>
        </div>
      ))}
      <button className="ed-btn-ghost ed-btn ed-btn-sm" onClick={addDraft}>+ Tambah Kisah</button>
    </div>
  )
}

/* ---------------- Gallery ---------------- */
function GallerySection({ inv, reload, notify }) {
  const [file, setFile] = useState(null)
  const [caption, setCaption] = useState('')
  const [busy, setBusy] = useState(false)

  async function upload() {
    if (!file) return
    setBusy(true)
    try {
      const fd = new FormData()
      fd.append('image', file); fd.append('caption', caption); fd.append('order', inv.photos.length)
      await api.post('/my/photos/', fd)
      setFile(null); setCaption(''); notify('Foto diunggah'); reload()
    } catch { notify('Gagal mengunggah') } finally { setBusy(false) }
  }
  async function del(id) {
    try { await api.delete(`/my/photos/${id}/`); notify('Foto dihapus'); reload() } catch { notify('Gagal menghapus') }
  }

  return (
    <div className="ed-card">
      <h2>Galeri</h2>
      <p className="ed-card-sub">Foto prewedding dan momen kalian.</p>
      {inv.photos.length > 0 && (
        <div className="ed-gallery-grid">
          {inv.photos.map(p => (
            <div className="ed-gallery-cell" key={p.id}>
              <img src={p.image} alt={p.caption || ''} />
              <button className="ed-gallery-del" onClick={() => del(p.id)} aria-label="Hapus">×</button>
            </div>
          ))}
        </div>
      )}
      <div className="ed-field"><label>Tambah foto</label><input className="ed-file" type="file" accept="image/*" onChange={e => setFile(e.target.files[0] || null)} /></div>
      <div className="ed-field"><label>Keterangan (opsional)</label><input className="ed-input" value={caption} onChange={e => setCaption(e.target.value)} /></div>
      <button className="ed-btn ed-btn-sm" onClick={upload} disabled={busy || !file}>{busy ? 'Mengunggah…' : 'Unggah Foto'}</button>
    </div>
  )
}

/* ---------------- Gifts ---------------- */
function GiftsSection({ inv, reload, notify }) {
  const [items, setItems] = useState(inv.bank_accounts)
  const [qris, setQris] = useState({})
  useEffect(() => setItems(inv.bank_accounts), [inv])
  const update = (i, k, v) => setItems(arr => arr.map((it, j) => j === i ? { ...it, [k]: v } : it))
  const addDraft = () => setItems(arr => [...arr, { account_type: 'bank', bank_name: '', account_number: '', account_name: '', order: arr.length }])

  async function saveOne(it, i) {
    try {
      const fd = new FormData()
      ;['account_type', 'bank_name', 'account_number', 'account_name', 'order'].forEach(k => fd.append(k, it[k] ?? ''))
      if (qris[i]) fd.append('qris_image', qris[i])
      if (it.id) await api.put(`/my/bank-accounts/${it.id}/`, fd)
      else await api.post('/my/bank-accounts/', fd)
      notify('Rekening tersimpan'); reload()
    } catch { notify('Gagal menyimpan') }
  }
  async function delOne(it, i) {
    if (it.id) { try { await api.delete(`/my/bank-accounts/${it.id}/`); notify('Dihapus'); reload() } catch { notify('Gagal menghapus') } }
    else setItems(arr => arr.filter((_, j) => j !== i))
  }

  return (
    <div className="ed-card">
      <h2>Amplop Digital</h2>
      <p className="ed-card-sub">Rekening bank, e-wallet, atau QRIS.</p>
      {items.length === 0 && <p className="ed-empty">Belum ada rekening.</p>}
      {items.map((it, i) => (
        <div className="ed-item" key={it.id || `new-${i}`}>
          <div className="ed-item-head"><strong>{it.bank_name || 'Rekening baru'}</strong>
            <button className="ed-mini ed-btn-danger" onClick={() => delOne(it, i)}>Hapus</button>
          </div>
          <div className="ed-row2">
            <div className="ed-field"><label>Jenis</label>
              <select className="ed-select" value={it.account_type} onChange={e => update(i, 'account_type', e.target.value)}>
                <option value="bank">Bank</option><option value="ewallet">E-Wallet</option><option value="qris">QRIS</option>
              </select>
            </div>
            <div className="ed-field"><label>Nama (bank / e-wallet)</label><input className="ed-input" value={it.bank_name} onChange={e => update(i, 'bank_name', e.target.value)} placeholder="BCA / GoPay / QRIS" /></div>
          </div>
          {it.account_type !== 'qris' && (
            <div className="ed-field"><label>Nomor</label><input className="ed-input" value={it.account_number} onChange={e => update(i, 'account_number', e.target.value)} /></div>
          )}
          <div className="ed-field"><label>Atas nama</label><input className="ed-input" value={it.account_name} onChange={e => update(i, 'account_name', e.target.value)} /></div>
          {it.account_type === 'qris' && (
            <div className="ed-field"><label>Gambar QRIS {it.qris_image && <a href={it.qris_image} target="_blank" rel="noopener noreferrer" style={{ color: '#b8924e' }}>(lihat)</a>}</label><input className="ed-file" type="file" accept="image/*" onChange={e => setQris(q => ({ ...q, [i]: e.target.files[0] || null }))} /></div>
          )}
          <button className="ed-btn ed-btn-sm" onClick={() => saveOne(it, i)}>Simpan</button>
        </div>
      ))}
      <button className="ed-btn-ghost ed-btn ed-btn-sm" onClick={addDraft}>+ Tambah Rekening</button>
    </div>
  )
}

/* ---------------- Page ---------------- */
export default function EditorPage() {
  const navigate = useNavigate()
  const { slug } = useParams()
  const [inv, setInv] = useState(null)
  const [status, setStatus] = useState('loading')
  const [toast, setToast] = useState('')

  const notify = useCallback(msg => { setToast(msg); setTimeout(() => setToast(''), 2200) }, [])

  const load = useCallback(() => {
    api.get('/my/invitation/')
      .then(res => { setInv(res.data); setStatus('ok') })
      .catch(err => {
        if (err.response?.status === 404) navigate('/onboarding')
        else if (err.response?.status === 401) navigate('/dashboard')
        else setStatus('error')
      })
  }, [navigate])

  useEffect(() => {
    if (!localStorage.getItem('access_token')) { navigate('/dashboard'); return }
    load()
  }, [load, navigate])

  function logout() {
    localStorage.removeItem('access_token'); localStorage.removeItem('refresh_token'); navigate('/dashboard')
  }

  if (status === 'loading') return <div className="ed" style={{ display: 'grid', placeItems: 'center' }}><p style={{ color: '#8a7f74', padding: '4rem' }}>Memuat editor…</p></div>
  if (status === 'error') return <div className="ed" style={{ display: 'grid', placeItems: 'center' }}><p style={{ color: '#8a7f74', padding: '4rem' }}>Gagal memuat. Coba muat ulang.</p></div>

  return (
    <div className="ed">
      <div className="ed-bar">
        <div className="ed-bar-title">Editor Undangan<small>{inv.slug}</small></div>
        <div className="ed-bar-actions">
          <span className={`ed-badge ${inv.is_active ? 'active' : 'draft'}`}>{inv.is_active ? 'Aktif' : 'Draft'}</span>
          <a className="ed-link" href={`/${inv.slug}`} target="_blank" rel="noopener noreferrer">Pratinjau ↗</a>
          <a className="ed-link" href={`/dashboard/${slug}`}>RSVP</a>
          <button className="ed-mini dark" onClick={logout}>Keluar</button>
        </div>
      </div>

      <div className="ed-body">
        {!inv.is_active && (
          <div className="ed-note">
            <strong>Undangan masih draft.</strong> Lengkapi data di bawah, lalu hubungi admin untuk aktivasi
            setelah pembayaran. Kamu tetap bisa melihat pratinjau kapan saja.
          </div>
        )}
        <SettingsSection inv={inv} reload={load} notify={notify} />
        <CoupleSection inv={inv} reload={load} notify={notify} />
        <EventsSection inv={inv} reload={load} notify={notify} />
        <StoriesSection inv={inv} reload={load} notify={notify} />
        <GallerySection inv={inv} reload={load} notify={notify} />
        <GiftsSection inv={inv} reload={load} notify={notify} />
      </div>

      {toast && <div className="ed-toast">{toast}</div>}
    </div>
  )
}
