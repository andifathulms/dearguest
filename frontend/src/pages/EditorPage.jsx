import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../api/client.js'
import ImageCropper from '../components/ui/ImageCropper.jsx'
import './Editor.css'

const ADMIN_WA = import.meta.env.VITE_ADMIN_WHATSAPP_NUMBER || '628123456789'

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
    dress_code: inv.dress_code || '', livestream_url: inv.livestream_url || '',
    wishlist_url: inv.wishlist_url || '',
  })
  const [music, setMusic] = useState(null)
  const [presets, setPresets] = useState([])
  const [presetId, setPresetId] = useState(inv.music_preset || '')
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setF(s => ({ ...s, [k]: v }))

  useEffect(() => { api.get('/music-presets/').then(res => setPresets(res.data)).catch(() => {}) }, [])

  async function pickPreset(id) {
    setPresetId(id)
    try { await api.post(`/my/invitations/${inv.slug}/music-preset/`, { preset_id: id || null }); notify(id ? 'Musik dipilih' : 'Musik preset dilepas'); reload() }
    catch { notify('Gagal memilih musik') }
  }

  async function save() {
    setSaving(true)
    try {
      const fd = new FormData()
      Object.entries(f).forEach(([k, v]) => fd.append(k, v))
      if (music) fd.append('music_file', music)
      await api.patch(`/my/invitations/${inv.slug}/`, fd)
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
        <label>Dress code (opsional)</label>
        <input className="ed-input" value={f.dress_code} onChange={e => set('dress_code', e.target.value)} placeholder="mis. Batik / Earth tone / Formal" />
      </div>
      <div className="ed-field">
        <label>Link live streaming (opsional — YouTube, dll.)</label>
        <input className="ed-input" value={f.livestream_url} onChange={e => set('livestream_url', e.target.value)} placeholder="https://youtube.com/watch?v=…" />
      </div>
      <div className="ed-field">
        <label>Link wishlist / gift registry (opsional)</label>
        <input className="ed-input" value={f.wishlist_url} onChange={e => set('wishlist_url', e.target.value)} placeholder="https://tokopedia.link/… atau registry kalian" />
      </div>
      {presets.length > 0 && (
        <div className="ed-field">
          <label>Pilih dari pustaka musik</label>
          <select className="ed-select" value={presetId} onChange={e => pickPreset(e.target.value)}>
            <option value="">— Tidak ada / pakai file unggahan —</option>
            {presets.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>
        </div>
      )}
      <div className="ed-field">
        <label>Atau unggah musik sendiri {inv.music_file && <a href={inv.music_file} target="_blank" rel="noopener noreferrer" style={{ color: '#b8924e' }}>(file saat ini)</a>}</label>
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
  const [previews, setPreviews] = useState({})
  const [cropping, setCropping] = useState(null)
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setF(s => ({ ...s, [k]: v }))

  async function save() {
    setSaving(true)
    try {
      const fd = new FormData()
      Object.entries(f).forEach(([k, v]) => fd.append(k, v))
      if (photos.bride_photo) fd.append('bride_photo', photos.bride_photo)
      if (photos.groom_photo) fd.append('groom_photo', photos.groom_photo)
      await api.put(`/my/invitations/${inv.slug}/couple/`, fd)
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
          <div className="ed-field"><label>Foto</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              {(previews.bride_photo || c.bride_photo) && <img className="ed-thumb" src={previews.bride_photo || c.bride_photo} alt="Foto mempelai wanita" />}
              <input className="ed-file" type="file" accept="image/*" onChange={e => e.target.files[0] && setCropping({ field: 'bride_photo', file: e.target.files[0] })} />
            </div>
          </div>
        </div>
        <div>
          <div className="ed-field"><label>Nama mempelai pria</label><input className="ed-input" value={f.groom_name} onChange={e => set('groom_name', e.target.value)} /></div>
          <div className="ed-field"><label>Orang tua</label><input className="ed-input" value={f.groom_parents} onChange={e => set('groom_parents', e.target.value)} placeholder="Putra dari Bapak … & Ibu …" /></div>
          <div className="ed-field"><label>Bio (opsional)</label><textarea className="ed-textarea" value={f.groom_bio} onChange={e => set('groom_bio', e.target.value)} /></div>
          <div className="ed-field"><label>Foto</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              {(previews.groom_photo || c.groom_photo) && <img className="ed-thumb" src={previews.groom_photo || c.groom_photo} alt="Foto mempelai pria" />}
              <input className="ed-file" type="file" accept="image/*" onChange={e => e.target.files[0] && setCropping({ field: 'groom_photo', file: e.target.files[0] })} />
            </div>
          </div>
        </div>
      </div>
      <div className="ed-save-row"><button className="ed-btn" onClick={save} disabled={saving}>{saving ? 'Menyimpan…' : 'Simpan Mempelai'}</button></div>

      {cropping && (
        <ImageCropper
          file={cropping.file}
          onCancel={() => setCropping(null)}
          onDone={cropped => {
            setPhotos(p => ({ ...p, [cropping.field]: cropped }))
            setPreviews(pv => ({ ...pv, [cropping.field]: URL.createObjectURL(cropped) }))
            setCropping(null)
          }}
        />
      )}
    </div>
  )
}

/* ---------------- Events ---------------- */
function EventsSection({ inv, reload, notify }) {
  const [items, setItems] = useState(inv.events.map(e => ({ ...e, datetime: (e.datetime || '').slice(0, 16) })))
  useEffect(() => { setItems(inv.events.map(e => ({ ...e, datetime: (e.datetime || '').slice(0, 16) }))) }, [inv])

  const update = (i, k, v) => setItems(arr => arr.map((it, j) => j === i ? { ...it, [k]: v } : it))
  const addDraft = () => setItems(arr => [...arr, { event_type: 'akad', datetime: '', venue_name: '', address: '', gmaps_url: '', gmaps_embed_url: '' }])

  async function move(i, dir) {
    const j = i + dir
    if (j < 0 || j >= items.length) return
    const arr = [...items]
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
    setItems(arr)
    const updates = arr.map((it, idx) => ({ it, idx })).filter(({ it, idx }) => it.id && it.order !== idx)
    if (!updates.length) return
    try {
      await Promise.all(updates.map(({ it, idx }) => api.patch(`/my/invitations/${inv.slug}/events/${it.id}/`, { order: idx })))
      reload()
    } catch { notify('Gagal mengubah urutan') }
  }

  async function saveOne(it) {
    const payload = { ...it }
    try {
      if (it.id) await api.put(`/my/invitations/${inv.slug}/events/${it.id}/`, payload)
      else await api.post(`/my/invitations/${inv.slug}/events/`, payload)
      notify('Acara tersimpan'); reload()
    } catch { notify('Gagal menyimpan acara') }
  }
  async function delOne(it, i) {
    if (it.id) {
      if (!window.confirm('Hapus acara ini?')) return
      try { await api.delete(`/my/invitations/${inv.slug}/events/${it.id}/`); notify('Acara dihapus'); reload() } catch { notify('Gagal menghapus') }
    } else setItems(arr => arr.filter((_, j) => j !== i))
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <div className="ed-reorder">
                <button onClick={() => move(i, -1)} disabled={i === 0} aria-label="Naik">↑</button>
                <button onClick={() => move(i, 1)} disabled={i === items.length - 1} aria-label="Turun">↓</button>
              </div>
              <button className="ed-mini ed-btn-danger" onClick={() => delOne(it, i)}>Hapus</button>
            </div>
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

  async function move(i, dir) {
    const j = i + dir
    if (j < 0 || j >= items.length) return
    const arr = [...items]
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
    setItems(arr)
    const updates = arr.map((it, idx) => ({ it, idx })).filter(({ it, idx }) => it.id && it.order !== idx)
    if (!updates.length) return
    try {
      await Promise.all(updates.map(({ it, idx }) => api.patch(`/my/invitations/${inv.slug}/stories/${it.id}/`, { order: idx })))
      reload()
    } catch { notify('Gagal mengubah urutan') }
  }

  async function saveOne(it) {
    const payload = { ...it, date: it.date || null }
    try {
      if (it.id) await api.put(`/my/invitations/${inv.slug}/stories/${it.id}/`, payload)
      else await api.post(`/my/invitations/${inv.slug}/stories/`, payload)
      notify('Kisah tersimpan'); reload()
    } catch { notify('Gagal menyimpan') }
  }
  async function delOne(it, i) {
    if (it.id) {
      if (!window.confirm('Hapus kisah ini?')) return
      try { await api.delete(`/my/invitations/${inv.slug}/stories/${it.id}/`); notify('Kisah dihapus'); reload() } catch { notify('Gagal menghapus') }
    } else setItems(arr => arr.filter((_, j) => j !== i))
  }

  return (
    <div className="ed-card">
      <h2>Kisah Cinta</h2>
      <p className="ed-card-sub">Perjalanan cinta kalian (opsional).</p>
      {items.length === 0 && <p className="ed-empty">Belum ada kisah.</p>}
      {items.map((it, i) => (
        <div className="ed-item" key={it.id || `new-${i}`}>
          <div className="ed-item-head"><strong>{it.title || 'Kisah baru'}</strong>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <div className="ed-reorder">
                <button onClick={() => move(i, -1)} disabled={i === 0} aria-label="Naik">↑</button>
                <button onClick={() => move(i, 1)} disabled={i === items.length - 1} aria-label="Turun">↓</button>
              </div>
              <button className="ed-mini ed-btn-danger" onClick={() => delOne(it, i)}>Hapus</button>
            </div>
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
      await api.post(`/my/invitations/${inv.slug}/photos/`, fd)
      setFile(null); setCaption(''); notify('Foto diunggah'); reload()
    } catch { notify('Gagal mengunggah') } finally { setBusy(false) }
  }
  async function del(id) {
    if (!window.confirm('Hapus foto ini?')) return
    try { await api.delete(`/my/invitations/${inv.slug}/photos/${id}/`); notify('Foto dihapus'); reload() } catch { notify('Gagal menghapus') }
  }
  async function move(i, dir) {
    const arr = [...inv.photos]
    const j = i + dir
    if (j < 0 || j >= arr.length) return
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
    const updates = arr.map((p, idx) => ({ p, idx })).filter(({ p, idx }) => p.order !== idx)
    if (!updates.length) return
    try {
      await Promise.all(updates.map(({ p, idx }) => api.patch(`/my/invitations/${inv.slug}/photos/${p.id}/`, { order: idx })))
      reload()
    } catch { notify('Gagal mengubah urutan') }
  }

  return (
    <div className="ed-card">
      <h2>Galeri</h2>
      <p className="ed-card-sub">Foto prewedding dan momen kalian.</p>
      {inv.photos.length > 0 && (
        <div className="ed-gallery-grid">
          {inv.photos.map((p, idx) => (
            <div className="ed-gallery-cell" key={p.id}>
              <img src={p.image} alt={p.caption || ''} />
              <button className="ed-gallery-del" onClick={() => del(p.id)} aria-label="Hapus">×</button>
              <div className="ed-gallery-move">
                <button onClick={() => move(idx, -1)} disabled={idx === 0} aria-label="Geser kiri">‹</button>
                <button onClick={() => move(idx, 1)} disabled={idx === inv.photos.length - 1} aria-label="Geser kanan">›</button>
              </div>
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
      if (it.id) await api.put(`/my/invitations/${inv.slug}/bank-accounts/${it.id}/`, fd)
      else await api.post(`/my/invitations/${inv.slug}/bank-accounts/`, fd)
      notify('Rekening tersimpan'); reload()
    } catch { notify('Gagal menyimpan') }
  }
  async function delOne(it, i) {
    if (it.id) {
      if (!window.confirm('Hapus rekening ini?')) return
      try { await api.delete(`/my/invitations/${inv.slug}/bank-accounts/${it.id}/`); notify('Dihapus'); reload() } catch { notify('Gagal menghapus') }
    } else setItems(arr => arr.filter((_, j) => j !== i))
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

/* ---------------- Tier banner ---------------- */
function TierBanner({ inv }) {
  const tier = inv.tier || 'free'
  if (tier !== 'free') {
    return <div className="ed-tier paid">Paket <strong>{tier === 'bisnis' ? 'Bisnis' : 'Premium'}</strong> · undangan tampil tanpa watermark ✓</div>
  }
  const waUrl = `https://wa.me/${ADMIN_WA}?text=${encodeURIComponent(
    `Halo admin, saya ingin upgrade undangan "${inv.slug}" ke paket Premium (tanpa watermark).`
  )}`
  return (
    <div className="ed-tier">
      <div>Paket <strong>Gratis</strong> · watermark "Undangan Digital" tampil di undanganmu.</div>
      <a className="ed-mini" style={{ background: '#25d366', color: '#fff', borderColor: '#25d366' }} href={waUrl} target="_blank" rel="noopener noreferrer">Upgrade ke Premium</a>
    </div>
  )
}

/* ---------------- Completion checklist ---------------- */
function ChecklistCard({ inv }) {
  const c = inv.couple || {}
  const items = [
    { ok: !!(c.bride_name && c.groom_name), label: 'Nama kedua mempelai' },
    { ok: (inv.events || []).length > 0, label: 'Tanggal & rangkaian acara' },
    { ok: !!(c.bride_photo || c.groom_photo), label: 'Foto mempelai' },
    { ok: (inv.photos || []).length > 0, label: 'Foto galeri' },
    { ok: (inv.bank_accounts || []).length > 0 || !!inv.wishlist_url, label: 'Amplop digital / wishlist' },
  ]
  const done = items.filter(i => i.ok).length
  if (done === items.length) return null
  return (
    <div className="ed-card">
      <h2>Kelengkapan Undangan</h2>
      <p className="ed-card-sub">{done}/{items.length} bagian utama sudah terisi. Lengkapi sisanya sebelum aktivasi.</p>
      <ul className="ed-checklist">
        {items.map(i => (
          <li key={i.label} className={i.ok ? 'done' : ''}>{i.ok ? '✓' : '○'} {i.label}</li>
        ))}
      </ul>
    </div>
  )
}

/* ---------------- Publish / activation ---------------- */
function PublishCard({ inv, reload, notify }) {
  const [code, setCode] = useState('')
  const [reqLoading, setReqLoading] = useState(false)
  const [activating, setActivating] = useState(false)
  const [err, setErr] = useState('')

  const waUrl = `https://wa.me/${ADMIN_WA}?text=${encodeURIComponent(
    `Halo admin, saya ingin mengaktifkan undangan "${inv.slug}". Saya sudah melakukan pembayaran (bukti terlampir). Mohon kode aktivasinya 🙏`
  )}`

  if (inv.is_active) {
    return (
      <div className="ed-card ed-publish active">
        <h2>🎉 Undangan Kamu Sudah Aktif</h2>
        <p className="ed-card-sub">Undangan sudah bisa dibagikan ke tamu.</p>
        <a className="ed-btn" style={{ textDecoration: 'none' }} href={`/${inv.slug}`} target="_blank" rel="noopener noreferrer">Lihat Undangan ↗</a>
      </div>
    )
  }

  async function request() {
    setReqLoading(true)
    try { await api.post(`/my/invitations/${inv.slug}/request-activation/`); notify('Permintaan aktivasi terkirim'); reload() }
    catch { notify('Gagal mengirim permintaan') } finally { setReqLoading(false) }
  }
  async function activate() {
    setErr('')
    if (!code.trim()) { setErr('Masukkan kode aktivasi.'); return }
    setActivating(true)
    try { await api.post(`/my/invitations/${inv.slug}/activate/`, { code }); notify('Undangan aktif! 🎉'); reload() }
    catch (e) { setErr(e.response?.data?.detail || 'Kode tidak valid.') }
    finally { setActivating(false) }
  }

  // Status: draft → requested → code-issued → active
  const step = inv.has_activation_code ? 2 : (inv.activation_requested ? 1 : 0)

  return (
    <div className="ed-card ed-publish">
      <h2>Publikasikan Undangan</h2>
      <p className="ed-card-sub">Undangan masih draft. Ikuti langkah berikut untuk mengaktifkannya.</p>

      <div className="ed-stepper">
        <div className={`ed-step ${step >= 1 ? 'done' : ''}`}><span>1</span> Minta aktivasi</div>
        <div className={`ed-step ${step >= 2 ? 'done' : ''}`}><span>2</span> Konfirmasi pembayaran</div>
        <div className="ed-step"><span>3</span> Masukkan kode</div>
      </div>

      <ol className="ed-steps">
        <li>
          <strong>Hubungi admin & kirim bukti pembayaran.</strong>
          <div className="ed-pub-row">
            {inv.activation_requested
              ? <span className="ed-saved">✓ Permintaan aktivasi terkirim</span>
              : <button className="ed-btn-ghost ed-btn ed-btn-sm" onClick={request} disabled={reqLoading}>{reqLoading ? '…' : 'Minta Aktivasi'}</button>}
            <a className="ed-mini" style={{ background: '#25d366', color: '#fff', borderColor: '#25d366' }} href={waUrl} target="_blank" rel="noopener noreferrer">WhatsApp Admin</a>
          </div>
          {inv.activation_requested && !inv.has_activation_code && (
            <p className="ed-pub-wait">⏳ Menunggu konfirmasi admin — biasanya dalam beberapa jam. Kode aktivasi akan dikirim via WhatsApp.</p>
          )}
        </li>
        <li>
          <strong>Masukkan kode aktivasi dari admin.</strong>
          {inv.has_activation_code && <p className="ed-pub-ready">✓ Admin sudah menerbitkan kode — cek WhatsApp lalu masukkan di bawah.</p>}
          <div className="ed-pub-row">
            <input className="ed-input" style={{ maxWidth: '200px', textTransform: 'uppercase', letterSpacing: '0.1em' }} value={code} onChange={e => setCode(e.target.value)} placeholder="mis. A7K2QX" />
            <button className="ed-btn ed-btn-sm" onClick={activate} disabled={activating}>{activating ? '…' : 'Aktifkan'}</button>
          </div>
          {err && <p className="ed-pub-err">{err}</p>}
        </li>
      </ol>
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
  const [showPreview, setShowPreview] = useState(false)
  const [previewKey, setPreviewKey] = useState(0)
  const [dirty, setDirty] = useState(false)

  const notify = useCallback(msg => { setToast(msg); setTimeout(() => setToast(''), 2200) }, [])

  // Warn before leaving with unsaved edits.
  useEffect(() => {
    function onBeforeUnload(e) { if (dirty) { e.preventDefault(); e.returnValue = '' } }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [dirty])

  function guardNav(e) {
    if (dirty && !window.confirm('Ada perubahan yang belum disimpan. Tetap tinggalkan halaman?')) {
      e.preventDefault()
    }
  }

  const load = useCallback(() => {
    api.get(`/my/invitations/${slug}/`)
      .then(res => { setInv(res.data); setStatus('ok'); setPreviewKey(k => k + 1); setDirty(false) })
      .catch(err => {
        if (err.response?.status === 404) navigate('/my')
        else if (err.response?.status === 401) navigate('/dashboard')
        else setStatus('error')
      })
  }, [navigate, slug])

  useEffect(() => {
    if (!localStorage.getItem('access_token')) { navigate('/dashboard'); return }
    load()
  }, [load, navigate])

  function logout() {
    localStorage.removeItem('access_token'); localStorage.removeItem('refresh_token'); navigate('/dashboard')
  }
  function copyLink() {
    navigator.clipboard.writeText(`${window.location.origin}/${inv.slug}`).then(() => notify('Link undangan disalin'))
  }

  if (status === 'loading') return <div className="ed" style={{ display: 'grid', placeItems: 'center' }}><p style={{ color: '#8a7f74', padding: '4rem' }}>Memuat editor…</p></div>
  if (status === 'error') return <div className="ed" style={{ display: 'grid', placeItems: 'center' }}><p style={{ color: '#8a7f74', padding: '4rem' }}>Gagal memuat. Coba muat ulang.</p></div>

  return (
    <div className="ed">
      <div className="ed-bar">
        <div className="ed-bar-title">Editor Undangan<small>{inv.slug}</small></div>
        <div className="ed-bar-actions">
          <span className={`ed-badge ${inv.is_active ? 'active' : 'draft'}`}>{inv.is_active ? 'Aktif' : 'Draft'}</span>
          <a className="ed-link" href="/my" onClick={guardNav}>← Undangan Saya</a>
          <button className={`ed-link ${showPreview ? 'active' : ''}`} onClick={() => setShowPreview(s => !s)}>{showPreview ? 'Tutup Pratinjau' : 'Pratinjau Langsung'}</button>
          <button className="ed-link" onClick={copyLink}>Salin Link</button>
          <a className="ed-link" href={`/${inv.slug}`} target="_blank" rel="noopener noreferrer">Pratinjau ↗</a>
          <a className="ed-link" href={`/dashboard/${slug}`} onClick={guardNav}>RSVP</a>
          <button className="ed-mini dark" onClick={e => { guardNav(e); if (!e.defaultPrevented) logout() }}>Keluar</button>
        </div>
      </div>

      <nav className="ed-nav">
        <a href="#sec-pengaturan">Pengaturan</a>
        <a href="#sec-mempelai">Mempelai</a>
        <a href="#sec-acara">Acara</a>
        <a href="#sec-kisah">Kisah</a>
        <a href="#sec-galeri">Galeri</a>
        <a href="#sec-amplop">Amplop</a>
      </nav>

      <div className={`ed-main ${showPreview ? 'with-preview' : ''}`} onChange={() => setDirty(true)}>
      <div className="ed-body">
        <PublishCard inv={inv} reload={load} notify={notify} />
        <TierBanner inv={inv} />
        <ChecklistCard inv={inv} />
        <div className="ed-anchor" id="sec-pengaturan"><SettingsSection inv={inv} reload={load} notify={notify} /></div>
        <div className="ed-anchor" id="sec-mempelai"><CoupleSection inv={inv} reload={load} notify={notify} /></div>
        <div className="ed-anchor" id="sec-acara"><EventsSection inv={inv} reload={load} notify={notify} /></div>
        <div className="ed-anchor" id="sec-kisah"><StoriesSection inv={inv} reload={load} notify={notify} /></div>
        <div className="ed-anchor" id="sec-galeri"><GallerySection inv={inv} reload={load} notify={notify} /></div>
        <div className="ed-anchor" id="sec-amplop"><GiftsSection inv={inv} reload={load} notify={notify} /></div>
      </div>

      {showPreview && (
        <div className="ed-preview">
          <button className="ed-preview-close" onClick={() => setShowPreview(false)}>Tutup ✕</button>
          <iframe key={previewKey} title="Pratinjau undangan" src={`/${inv.slug}?preview=1`} />
        </div>
      )}
      </div>

      {toast && <div className="ed-toast">{toast}</div>}
    </div>
  )
}
