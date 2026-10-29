import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../api/client.js'
import { logout as logoutSession } from '../api/session.js'
import { invitationUrl } from '../utils/publicUrl.js'
import { getTheme, selectableThemes, themeName } from '../themes/registry.js'
import { makeT, variantOptions, variantMeta } from '../copy/copy.js'
import { EVENT_TIMEZONES, TZ_LABEL, fromLocalInput, toLocalInputValue } from '../utils/dates.js'
import scriptureData from '../copy/scripture.json'

// Packs that offer photo filters declare them in their theme.json (tiny files,
// bundled eagerly so the editor can decide without loading a pack).
const PACK_MANIFESTS = Object.fromEntries(
  Object.entries(import.meta.glob('../themes/packs/*/theme.json', { eager: true, import: 'default' }))
    .map(([path, manifest]) => [path.split('/').at(-2), manifest]),
)
const FILTER_LABELS = { none: 'Asli', 'soft-warm': 'Hangat lembut', bw: 'Hitam putih' }
const photoFiltersFor = themeId => {
  const entry = getTheme(themeId)
  return entry?.kind === 'pack' ? PACK_MANIFESTS[entry.pack.dir]?.photoFilters || [] : []
}
import ImageCropper from '../components/ui/ImageCropper.jsx'
import { compressImage } from '../utils/compressImage.js'
import { formatRp } from '../brand/plans.js'
import '../brand/brand.css'
import './Editor.css'

const ADMIN_WA = import.meta.env.VITE_ADMIN_WHATSAPP_NUMBER || '628123456789'


/* ---------------- Settings ---------------- */
function SettingsSection({ inv, reload, notify }) {
  const [f, setF] = useState({
    theme: inv.theme, wedding_date: inv.wedding_date || '',
    opening_text: inv.opening_text || '', closing_text: inv.closing_text || '',
    dress_code: inv.dress_code || '', livestream_url: inv.livestream_url || '',
    wishlist_url: inv.wishlist_url || '', photo_filter: inv.photo_filter || 'none',
    copy_variant: inv.copy_variant || 'umum', scripture_mode: inv.scripture_mode || 'default',
    scripture_ref: inv.scripture_ref || '', scripture_text: inv.scripture_text || '',
    gift_recipient: inv.gift_recipient || '', gift_address: inv.gift_address || '', gift_phone: inv.gift_phone || '',
  })
  // Placeholders show what guests see when a field is left empty: the variant's defaults.
  const tv = makeT(f.copy_variant)
  const defaultVerse = scriptureData.entries.find(e => e.id === variantMeta(f.copy_variant)._scripture)
  const [music, setMusic] = useState(null)
  const [heroPhoto, setHeroPhoto] = useState(null)
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
      if (heroPhoto) fd.append('hero_photo', await compressImage(heroPhoto, 1800, 0.82))
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
        <label htmlFor="set-theme">Tema</label>
        <select id="set-theme" className="ed-select" value={f.theme} onChange={e => set('theme', e.target.value)}>
          {/* A theme that's since been retired stays selected (and kept on save) but isn't offered to switch back to. */}
          {!selectableThemes().some(t => t.id === inv.theme) && (
            <option value={inv.theme}>{themeName(inv.theme)} (tema lama)</option>
          )}
          {selectableThemes().map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>
      {photoFiltersFor(f.theme).length > 0 && (
        <div className="ed-field">
          <label htmlFor="set-filter">Filter foto (berlaku untuk semua foto)</label>
          <select id="set-filter" className="ed-select" value={f.photo_filter} onChange={e => set('photo_filter', e.target.value)}>
            {photoFiltersFor(f.theme).map(v => <option key={v} value={v}>{FILTER_LABELS[v] || v}</option>)}
          </select>
        </div>
      )}
      <div className="ed-field">
        <label htmlFor="set-date">Tanggal pernikahan</label>
        <input id="set-date" className="ed-input" type="date" value={f.wedding_date} onChange={e => set('wedding_date', e.target.value)} />
      </div>
      <div className="ed-field">
        <label htmlFor="set-variant">Gaya bahasa undangan</label>
        <select id="set-variant" className="ed-select" value={f.copy_variant} onChange={e => set('copy_variant', e.target.value)}>
          {variantOptions().map(v => <option key={v.id} value={v.id}>{v.label}</option>)}
        </select>
      </div>
      <div className="ed-field">
        <label htmlFor="set-opening">Teks pembuka (kosongkan untuk memakai teks bawaan)</label>
        <textarea id="set-opening" className="ed-textarea" value={f.opening_text} onChange={e => set('opening_text', e.target.value)} placeholder={tv('greeting.default')} />
      </div>
      <div className="ed-field">
        <label htmlFor="set-closing">Teks penutup (kosongkan untuk memakai teks bawaan)</label>
        <textarea id="set-closing" className="ed-textarea" value={f.closing_text} onChange={e => set('closing_text', e.target.value)} placeholder={tv('closing.default')} />
      </div>
      <div className="ed-field">
        <label htmlFor="set-scripture">Ayat / kutipan</label>
        <select id="set-scripture" className="ed-select" value={f.scripture_mode} onChange={e => set('scripture_mode', e.target.value)}>
          <option value="default" disabled={!defaultVerse}>{defaultVerse ? `Bawaan: ${defaultVerse.ref}` : 'Bawaan (tidak ada untuk gaya ini)'}</option>
          <option value="custom">Tulis sendiri</option>
          <option value="none">Tanpa ayat</option>
        </select>
      </div>
      {f.scripture_mode === 'custom' && (
        <>
          <div className="ed-field">
            <label htmlFor="set-scripture-ref">Sumber (mis. "Kolose 3:14")</label>
            <input id="set-scripture-ref" className="ed-input" value={f.scripture_ref} onChange={e => set('scripture_ref', e.target.value)} />
          </div>
          <div className="ed-field">
            <label htmlFor="set-scripture-text">Teks ayat / kutipan</label>
            <textarea id="set-scripture-text" className="ed-textarea" value={f.scripture_text} onChange={e => set('scripture_text', e.target.value)} />
          </div>
        </>
      )}
      <div className="ed-field">
        <label htmlFor="set-hero">Foto hero (tampil penuh di awal undangan) {inv.hero_photo && <a href={inv.hero_photo} target="_blank" rel="noopener noreferrer" style={{ color: '#b8924e' }}>(foto saat ini)</a>}</label>
        <input id="set-hero" className="ed-file" type="file" accept="image/*" onChange={e => setHeroPhoto(e.target.files[0] || null)} />
      </div>
      <div className="ed-field">
        <label htmlFor="set-dress">Dress code (opsional)</label>
        <input id="set-dress" className="ed-input" value={f.dress_code} onChange={e => set('dress_code', e.target.value)} placeholder="mis. Batik / Earth tone / Formal" />
      </div>
      <div className="ed-field">
        <label htmlFor="set-live">Link live streaming (opsional — YouTube, dll.)</label>
        <input id="set-live" className="ed-input" value={f.livestream_url} onChange={e => set('livestream_url', e.target.value)} placeholder="https://youtube.com/watch?v=…" />
      </div>
      <div className="ed-field">
        <label htmlFor="set-wishlist">Link wishlist / gift registry (opsional)</label>
        <input id="set-wishlist" className="ed-input" value={f.wishlist_url} onChange={e => set('wishlist_url', e.target.value)} placeholder="https://tokopedia.link/… atau registry kalian" />
      </div>
      <div className="ed-field ed-stack">
        <label htmlFor="set-gift-address">Alamat kirim hadiah (opsional)</label>
        <p className="ed-hint">Alamat ini akan terlihat oleh semua tamu.</p>
        <input id="set-gift-recipient" className="ed-input" aria-label="Nama penerima" value={f.gift_recipient} onChange={e => set('gift_recipient', e.target.value)} placeholder="Nama penerima" />
        <textarea id="set-gift-address" className="ed-textarea" value={f.gift_address} onChange={e => set('gift_address', e.target.value)} placeholder="Jalan, nomor, RT/RW, kelurahan, kota, kode pos" />
        <input id="set-gift-phone" className="ed-input" aria-label="Nomor HP penerima" value={f.gift_phone} onChange={e => set('gift_phone', e.target.value)} placeholder="Nomor HP penerima (opsional)" />
      </div>
      {presets.length > 0 && (
        <div className="ed-field">
          <label htmlFor="set-preset">Pilih dari pustaka musik</label>
          <select id="set-preset" className="ed-select" value={presetId} onChange={e => pickPreset(e.target.value)}>
            <option value="">— Tidak ada / pakai file unggahan —</option>
            {presets.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>
        </div>
      )}
      <div className="ed-field">
        <label htmlFor="set-music">Atau unggah musik sendiri {inv.music_file && <a href={inv.music_file} target="_blank" rel="noopener noreferrer" style={{ color: '#b8924e' }}>(file saat ini)</a>}</label>
        <input id="set-music" className="ed-file" type="file" accept="audio/*" onChange={e => setMusic(e.target.files[0] || null)} />
      </div>
      <div className="ed-save-row">
        <button className="ed-btn" onClick={save} disabled={saving}>{saving ? 'Menyimpan…' : 'Simpan Pengaturan'}</button>
      </div>
    </div>
  )
}

/* ---------------- Couple ---------------- */
const PERSON_KEYS = ['name', 'parents', 'bio', 'child_order', 'father', 'father_deceased', 'mother', 'mother_deceased', 'instagram']

function PersonFields({ person, label, f, set, photo, onPhoto }) {
  const id = k => `cpl-${person}-${k}`
  const v = k => f[`${person}_${k}`]
  const on = k => e => set(`${person}_${k}`, e.target.type === 'checkbox' ? e.target.checked : e.target.value)
  return (
    <div>
      <div className="ed-field"><label htmlFor={id('name')}>Nama {label}</label><input id={id('name')} className="ed-input" value={v('name')} onChange={on('name')} /></div>
      <div className="ed-field"><label htmlFor={id('order')}>Anak ke- (opsional)</label><input id={id('order')} className="ed-input" value={v('child_order')} onChange={on('child_order')} placeholder="pertama, kedua, bungsu" /></div>
      <div className="ed-field"><label htmlFor={id('father')}>Nama ayah</label><input id={id('father')} className="ed-input" value={v('father')} onChange={on('father')} placeholder="tanpa &quot;Bapak&quot;" />
        <label className="ed-check"><input type="checkbox" checked={Boolean(v('father_deceased'))} onChange={on('father_deceased')} /> Sudah wafat (Alm.)</label>
      </div>
      <div className="ed-field"><label htmlFor={id('mother')}>Nama ibu</label><input id={id('mother')} className="ed-input" value={v('mother')} onChange={on('mother')} placeholder="tanpa &quot;Ibu&quot;" />
        <label className="ed-check"><input type="checkbox" checked={Boolean(v('mother_deceased'))} onChange={on('mother_deceased')} /> Sudah wafat (Almh.)</label>
      </div>
      {!v('father') && !v('mother') && (
        <div className="ed-field"><label htmlFor={id('parents')}>Atau tulis bebas</label><input id={id('parents')} className="ed-input" value={v('parents')} onChange={on('parents')} placeholder="Bapak … & Ibu …" /></div>
      )}
      <div className="ed-field"><label htmlFor={id('ig')}>Instagram (opsional)</label><input id={id('ig')} className="ed-input" value={v('instagram')} onChange={on('instagram')} placeholder="@username" /></div>
      <div className="ed-field"><label htmlFor={id('bio')}>Bio (opsional)</label><textarea id={id('bio')} className="ed-textarea" value={v('bio')} onChange={on('bio')} /></div>
      <div className="ed-field"><label htmlFor={id('photo')}>Foto</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          {photo && <img className="ed-thumb" src={photo} alt={`Foto ${label}`} />}
          <input id={id('photo')} className="ed-file" type="file" accept="image/*" onChange={e => e.target.files[0] && onPhoto(e.target.files[0])} />
        </div>
      </div>
    </div>
  )
}

function CoupleSection({ inv, reload, notify }) {
  const c = inv.couple || {}
  const [f, setF] = useState(() => Object.fromEntries(['bride', 'groom'].flatMap(person =>
    PERSON_KEYS.map(k => [`${person}_${k}`, c[`${person}_${k}`] ?? (k.endsWith('deceased') ? false : '')]))))
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
    } catch (e) {
      notify(Object.values(e.response?.data || {}).flat()[0] || 'Gagal menyimpan')
    } finally { setSaving(false) }
  }

  return (
    <div className="ed-card">
      <h2>Mempelai</h2>
      <p className="ed-card-sub">Nama, orang tua, bio, dan foto kedua mempelai.</p>
      <div className="ed-row2">
        <PersonFields person="bride" label="mempelai wanita" f={f} set={set} photo={previews.bride_photo || c.bride_photo} onPhoto={file => setCropping({ field: 'bride_photo', file })} />
        <PersonFields person="groom" label="mempelai pria" f={f} set={set} photo={previews.groom_photo || c.groom_photo} onPhoto={file => setCropping({ field: 'groom_photo', file })} />
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
const EVENT_TYPES = ['akad', 'pemberkatan', 'sakramen', 'resepsi', 'adat', 'ngunduh_mantu', 'lainnya']
const LAST_TZ_KEY = 'dg:lastEventTz'
const lastTz = () => { try { return localStorage.getItem(LAST_TZ_KEY) || 'Asia/Jakarta' } catch { return 'Asia/Jakarta' } }

// Server times are instants; the editor shows and edits them as wall-clock
// time in each event's own zone (WIB / WITA / WIT).
const toDraft = e => ({ ...e, startLocal: toLocalInputValue(e.start, e.timezone), endLocal: toLocalInputValue(e.end, e.timezone) })

function EventsSection({ inv, reload, notify }) {
  const t = makeT(inv.copy_variant)
  const [items, setItems] = useState(inv.events.map(toDraft))
  useEffect(() => { setItems(inv.events.map(toDraft)) }, [inv])

  const update = (i, k, v) => setItems(arr => arr.map((it, j) => j === i ? { ...it, [k]: v } : it))
  const addDraft = (type = 'resepsi') => setItems(arr => [...arr, {
    event_type: type, title: '', startLocal: '', endLocal: '', timezone: arr.at(-1)?.timezone || lastTz(),
    venue_name: '', address: '', maps_link: '', dress_code: '', is_primary: arr.length === 0,
  }])
  // The variant's usual events that aren't in the list yet, as one-click adds.
  const suggestions = (variantMeta(inv.copy_variant)._defaultEvents || []).filter(type => !items.some(it => it.event_type === type))

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

  async function saveOne(it, i) {
    if (!it.startLocal) { notify('Isi tanggal & waktu mulai'); return }
    const payload = {
      event_type: it.event_type, title: it.title, timezone: it.timezone,
      start: fromLocalInput(it.startLocal, it.timezone), end: it.endLocal ? fromLocalInput(it.endLocal, it.timezone) : null,
      venue_name: it.venue_name, address: it.address, maps_link: it.maps_link, dress_code: it.dress_code,
      is_primary: it.is_primary, order: it.id ? it.order : i,
    }
    try {
      if (it.id) await api.put(`/my/invitations/${inv.slug}/events/${it.id}/`, payload)
      else await api.post(`/my/invitations/${inv.slug}/events/`, payload)
      try { localStorage.setItem(LAST_TZ_KEY, it.timezone) } catch { /* private mode */ }
      notify('Acara tersimpan'); reload()
    } catch (e) {
      const data = e.response?.data || {}
      notify(Object.values(data).flat()[0] || 'Gagal menyimpan acara')
    }
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
      <p className="ed-card-sub">Semua acara pernikahan kalian. Hitung mundur mengarah ke acara utama.</p>
      {items.length === 0 && <p className="ed-empty">Belum ada acara.</p>}
      {items.map((it, i) => (
        <div className="ed-item" key={it.id || `new-${i}`}>
          <div className="ed-item-head">
            <strong>{it.title || t(`events.type.${it.event_type}`)}</strong>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <div className="ed-reorder">
                <button onClick={() => move(i, -1)} disabled={i === 0} aria-label="Naik">↑</button>
                <button onClick={() => move(i, 1)} disabled={i === items.length - 1} aria-label="Turun">↓</button>
              </div>
              <button className="ed-mini ed-btn-danger" onClick={() => delOne(it, i)}>Hapus</button>
            </div>
          </div>
          <div className="ed-row2">
            <div className="ed-field"><label htmlFor={`evt-${i}-type`}>Jenis acara</label>
              <select id={`evt-${i}-type`} className="ed-select" value={it.event_type} onChange={e => update(i, 'event_type', e.target.value)}>
                {EVENT_TYPES.map(type => <option key={type} value={type}>{t(`events.type.${type}`)}</option>)}
              </select>
            </div>
            <div className="ed-field"><label htmlFor={`evt-${i}-title`}>Nama sendiri (opsional)</label>
              <input id={`evt-${i}-title`} className="ed-input" value={it.title} onChange={e => update(i, 'title', e.target.value)} placeholder="mis. Mappacci, Siraman, Midodareni" />
            </div>
          </div>
          <div className="ed-row2">
            <div className="ed-field"><label htmlFor={`evt-${i}-start`}>Mulai</label><input id={`evt-${i}-start`} className="ed-input" type="datetime-local" value={it.startLocal} onChange={e => update(i, 'startLocal', e.target.value)} /></div>
            <div className="ed-field"><label htmlFor={`evt-${i}-end`}>Selesai (kosongkan = "s.d. selesai")</label><input id={`evt-${i}-end`} className="ed-input" type="datetime-local" value={it.endLocal} onChange={e => update(i, 'endLocal', e.target.value)} /></div>
          </div>
          <div className="ed-row2">
            <div className="ed-field"><label htmlFor={`evt-${i}-tz`}>Zona waktu</label>
              <select id={`evt-${i}-tz`} className="ed-select" value={it.timezone} onChange={e => update(i, 'timezone', e.target.value)}>
                {EVENT_TIMEZONES.map(tz => <option key={tz} value={tz}>{TZ_LABEL[tz]} ({tz})</option>)}
              </select>
            </div>
            <div className="ed-field"><label htmlFor={`evt-${i}-primary`}>Acara utama</label>
              <label className="ed-check"><input id={`evt-${i}-primary`} type="radio" name="primary-event" checked={Boolean(it.is_primary)} onChange={() => setItems(arr => arr.map((x, j) => ({ ...x, is_primary: j === i })))} /> Hitung mundur ke acara ini</label>
            </div>
          </div>
          <div className="ed-field"><label htmlFor={`evt-${i}-venue`}>Nama tempat</label><input id={`evt-${i}-venue`} className="ed-input" value={it.venue_name} onChange={e => update(i, 'venue_name', e.target.value)} /></div>
          <div className="ed-field"><label htmlFor={`evt-${i}-addr`}>Alamat</label><textarea id={`evt-${i}-addr`} className="ed-textarea" value={it.address} onChange={e => update(i, 'address', e.target.value)} /></div>
          <div className="ed-row2">
            <div className="ed-field"><label htmlFor={`evt-${i}-maps`}>Link Google Maps atau koordinat</label><input id={`evt-${i}-maps`} className="ed-input" value={it.maps_link} onChange={e => update(i, 'maps_link', e.target.value)} placeholder="https://maps.app.goo.gl/… atau -7.80, 110.36" /></div>
            <div className="ed-field"><label htmlFor={`evt-${i}-dress`}>Dress code (opsional)</label><input id={`evt-${i}-dress`} className="ed-input" value={it.dress_code} onChange={e => update(i, 'dress_code', e.target.value)} /></div>
          </div>
          <button className="ed-btn ed-btn-sm" onClick={() => saveOne(it, i)}>Simpan Acara</button>
        </div>
      ))}
      <div className="ed-add-row">
        {suggestions.map(type => (
          <button key={type} className="ed-btn-ghost ed-btn ed-btn-sm" onClick={() => addDraft(type)}>+ {t(`events.type.${type}`)}</button>
        ))}
        <button className="ed-btn-ghost ed-btn ed-btn-sm" onClick={() => addDraft('lainnya')}>+ Acara lain</button>
      </div>
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
            <div className="ed-field"><label htmlFor={`sty-${i}-title`}>Judul</label><input id={`sty-${i}-title`} className="ed-input" value={it.title} onChange={e => update(i, 'title', e.target.value)} /></div>
            <div className="ed-field"><label htmlFor={`sty-${i}-date`}>Tanggal (opsional)</label><input id={`sty-${i}-date`} className="ed-input" type="date" value={it.date || ''} onChange={e => update(i, 'date', e.target.value)} /></div>
          </div>
          <div className="ed-field"><label htmlFor={`sty-${i}-desc`}>Cerita</label><textarea id={`sty-${i}-desc`} className="ed-textarea" value={it.description} onChange={e => update(i, 'description', e.target.value)} /></div>
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
      const compressed = await compressImage(file)
      const fd = new FormData()
      fd.append('image', compressed); fd.append('caption', caption); fd.append('order', inv.photos.length)
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
      <div className="ed-field"><label htmlFor="gal-file">Tambah foto</label><input id="gal-file" className="ed-file" type="file" accept="image/*" onChange={e => setFile(e.target.files[0] || null)} /></div>
      <div className="ed-field"><label htmlFor="gal-caption">Keterangan (opsional)</label><input id="gal-caption" className="ed-input" value={caption} onChange={e => setCaption(e.target.value)} /></div>
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
            <div className="ed-field"><label htmlFor={`gift-${i}-type`}>Jenis</label>
              <select id={`gift-${i}-type`} className="ed-select" value={it.account_type} onChange={e => update(i, 'account_type', e.target.value)}>
                <option value="bank">Bank</option><option value="ewallet">E-Wallet</option><option value="qris">QRIS</option>
              </select>
            </div>
            <div className="ed-field"><label htmlFor={`gift-${i}-name`}>Nama (bank / e-wallet)</label><input id={`gift-${i}-name`} className="ed-input" value={it.bank_name} onChange={e => update(i, 'bank_name', e.target.value)} placeholder="BCA / GoPay / QRIS" /></div>
          </div>
          {it.account_type !== 'qris' && (
            <div className="ed-field"><label htmlFor={`gift-${i}-num`}>Nomor</label><input id={`gift-${i}-num`} className="ed-input" value={it.account_number} onChange={e => update(i, 'account_number', e.target.value)} /></div>
          )}
          <div className="ed-field"><label htmlFor={`gift-${i}-holder`}>Atas nama</label><input id={`gift-${i}-holder`} className="ed-input" value={it.account_name} onChange={e => update(i, 'account_name', e.target.value)} /></div>
          {it.account_type === 'qris' && (
            <div className="ed-field"><label htmlFor={`gift-${i}-qris`}>Gambar QRIS {it.qris_image && <a href={it.qris_image} target="_blank" rel="noopener noreferrer" style={{ color: '#b8924e' }}>(lihat)</a>}</label><input id={`gift-${i}-qris`} className="ed-file" type="file" accept="image/*" onChange={e => setQris(q => ({ ...q, [i]: e.target.files[0] || null }))} /></div>
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
      <div>Paket <strong>Gratis</strong> · watermark "Dear Guest" tampil di undanganmu.</div>
      <a className="ed-mini" style={{ background: '#25d366', color: '#fff', borderColor: '#25d366' }} href={waUrl} target="_blank" rel="noopener noreferrer">Upgrade ke Premium</a>
    </div>
  )
}

/* ---------------- Completion checklist ---------------- */
function ChecklistCard({ inv }) {
  const c = inv.couple || {}
  const items = [
    { ok: !!(c.bride_name && c.groom_name), label: 'Nama kedua mempelai' },
    { ok: (inv.events || []).some(e => e.is_primary && e.start), label: 'Acara utama & tanggalnya' },
    { ok: (inv.events || []).length > 0 && inv.events.every(e => e.venue_name), label: 'Tempat setiap acara' },
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
  const [plans, setPlans] = useState([])
  useEffect(() => {
    if (inv.is_active) return
    api.get('/site/marketing/').then(({ data }) => setPlans((data.plans || []).filter(p => p.price > 0))).catch(() => {})
  }, [inv.is_active])

  const waUrl = `https://wa.me/${ADMIN_WA}?text=${encodeURIComponent(
    `Halo admin, saya ingin mengaktifkan undangan "${inv.slug}". Saya sudah melakukan pembayaran (bukti terlampir). Mohon kode aktivasinya.`
  )}`

  if (inv.is_active) {
    return (
      <div className="ed-card ed-publish active">
        <h2>Undangan kalian sudah aktif</h2>
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
    try { await api.post(`/my/invitations/${inv.slug}/activate/`, { code }); notify('Undangan aktif'); reload() }
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
          {plans.length > 0 && (
            <p className="ed-pub-plans">
              {plans.map(p => <span key={p.slug}><b>{p.name}</b> {formatRp(p.price)}</span>)}
              <small>sekali bayar per undangan</small>
            </p>
          )}
          <div className="ed-pub-row">
            {inv.activation_requested
              ? <span className="ed-saved">✓ Permintaan aktivasi terkirim</span>
              : <button className="ed-btn-ghost ed-btn ed-btn-sm" onClick={request} disabled={reqLoading}>{reqLoading ? '…' : 'Minta Aktivasi'}</button>}
            <a className="ed-mini" style={{ background: '#25d366', color: '#fff', borderColor: '#25d366' }} href={waUrl} target="_blank" rel="noopener noreferrer">WhatsApp Admin</a>
          </div>
          {inv.activation_requested && !inv.has_activation_code && (
            <p className="ed-pub-wait">Menunggu konfirmasi admin. Kode aktivasi dikirim lewat WhatsApp.</p>
          )}
        </li>
        <li>
          <strong>Masukkan kode aktivasi dari admin.</strong>
          {inv.has_activation_code && <p className="ed-pub-ready">Admin sudah menerbitkan kode. Cek WhatsApp, lalu masukkan di bawah.</p>}
          <div className="ed-pub-row">
            <input className="ed-input" aria-label="Kode aktivasi" style={{ maxWidth: '200px', textTransform: 'uppercase', letterSpacing: '0.1em' }} value={code} onChange={e => setCode(e.target.value)} placeholder="mis. A7K2QX" />
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
  // Wide screens show the live preview beside the form from the start.
  const [showPreview, setShowPreview] = useState(() => !!window.matchMedia?.('(min-width: 1025px)').matches)
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
    load()
  }, [load, navigate])

  const logout = () => logoutSession(navigate)
  function copyLink() {
    navigator.clipboard.writeText(invitationUrl(inv.slug)).then(() => notify('Link undangan disalin'))
  }

  if (status === 'loading') return <div className="dg ed" style={{ display: 'grid', placeItems: 'center' }}><p style={{ color: '#8a7f74', padding: '4rem' }}>Memuat editor…</p></div>
  if (status === 'error') return <div className="dg ed" style={{ display: 'grid', placeItems: 'center' }}><p style={{ color: '#8a7f74', padding: '4rem' }}>Gagal memuat. Coba muat ulang.</p></div>

  return (
    <div className="dg ed">
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
