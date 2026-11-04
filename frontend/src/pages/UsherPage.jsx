import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import api from '../api/client.js'
import { formatClock } from '../utils/dates.js'
import { codeFromScan, expectedPax, matchesGuest } from '../utils/usher.js'
import '../brand/brand.css'
import './Usher.css'

const QrScanner = lazy(() => import('../components/QrScanner.jsx'))
const POLL_MS = 20000
const FILTERS = [['waiting', 'Belum datang'], ['arrived', 'Sudah datang'], ['all', 'Semua']]

function rsvpText(g) {
  if (g.is_walk_in) return 'Tanpa undangan'
  if (!g.rsvp) return 'Belum RSVP'
  return g.rsvp.attending ? `RSVP hadir ${g.rsvp.pax} orang` : 'RSVP tidak hadir'
}

function Stepper({ id, value, onChange, max = 50 }) {
  return (
    <div className="us-stepper">
      <button type="button" aria-label="Kurangi" onClick={() => onChange(Math.max(1, value - 1))} disabled={value <= 1}>−</button>
      <input id={id} inputMode="numeric" value={value} aria-label="Jumlah orang"
        onChange={e => onChange(Math.min(max, Math.max(1, Number(e.target.value.replace(/\D/g, '')) || 1)))} />
      <button type="button" aria-label="Tambah" onClick={() => onChange(Math.min(max, value + 1))}>+</button>
    </div>
  )
}

// The arrival details an usher fills in: people, envelope number, souvenir.
function ArrivalFields({ form, setForm, souvenirs }) {
  return (
    <>
      <div className="us-field">
        <label htmlFor="us-pax">Jumlah orang yang datang</label>
        <Stepper id="us-pax" value={form.arrived_pax} onChange={v => setForm(f => ({ ...f, arrived_pax: v }))} />
      </div>
      <div className="us-field">
        <label htmlFor="us-envelope">Nomor amplop <small>(tulis nomor yang sama di amplop)</small></label>
        <input id="us-envelope" className="dg-input" value={form.envelope_no} maxLength={20} inputMode="numeric"
          onChange={e => setForm(f => ({ ...f, envelope_no: e.target.value }))} placeholder="mis. 017" />
      </div>
      <label className="us-check">
        <input type="checkbox" checked={form.souvenir} onChange={e => setForm(f => ({ ...f, souvenir: e.target.checked }))} />
        Suvenir sudah diberikan
        {souvenirs != null && <small className={souvenirs <= 10 ? 'us-low' : ''}> · sisa {souvenirs}</small>}
      </label>
    </>
  )
}

function GuestSheet({ guest, tz, souvenirs, busy, onCheckIn, onSave, onUndo, onClose }) {
  const [form, setForm] = useState({
    arrived_pax: guest.arrived_pax || expectedPax(guest),
    envelope_no: guest.envelope_no || '',
    souvenir: guest.checked_in ? guest.souvenir_given : souvenirs !== 0,
  })
  return (
    <div className="us-sheet-wrap" role="dialog" aria-modal="true" aria-labelledby="us-sheet-name" onClick={onClose}>
      <div className="us-sheet" onClick={e => e.stopPropagation()}>
        <div className="us-sheet-head">
          <h2 id="us-sheet-name">{guest.name}</h2>
          <button type="button" className="us-x" onClick={onClose} aria-label="Tutup">×</button>
        </div>
        <p className="us-sheet-meta">
          {[guest.group, ...guest.sessions].filter(Boolean).join(' · ') || 'Tanpa grup'}
        </p>
        <p className={`us-pill ${!guest.rsvp ? 'none' : guest.rsvp.attending ? '' : 'no'}`}>{rsvpText(guest)}</p>

        {guest.checked_in && (
          <p className="us-already" role="status">
            Sudah check-in pukul {formatClock(guest.checked_in_at, tz)}
            {guest.envelope_no ? ` · amplop ${guest.envelope_no}` : ''}
          </p>
        )}

        <ArrivalFields form={form} setForm={setForm} souvenirs={souvenirs} />

        <div className="us-sheet-actions">
          {guest.checked_in ? (
            <>
              <button type="button" className="dg-btn dg-btn-ink dg-btn-block" disabled={busy}
                onClick={() => onSave(guest, { arrived_pax: form.arrived_pax, envelope_no: form.envelope_no, souvenir_given: form.souvenir })}>
                Simpan perubahan
              </button>
              <button type="button" className="dg-btn dg-btn-line dg-btn-block us-undo" disabled={busy} onClick={() => onUndo(guest)}>
                {guest.is_walk_in ? 'Hapus tamu ini' : 'Batalkan check-in'}
              </button>
            </>
          ) : (
            <button type="button" className="dg-btn dg-btn-gold dg-btn-block us-go" disabled={busy}
              onClick={() => onCheckIn(guest, form)}>
              Check-in {form.arrived_pax} orang
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function WalkInSheet({ souvenirs, busy, onSubmit, onClose }) {
  const [name, setName] = useState('')
  const [group, setGroup] = useState('')
  const [form, setForm] = useState({ arrived_pax: 1, envelope_no: '', souvenir: souvenirs !== 0 })
  return (
    <div className="us-sheet-wrap" role="dialog" aria-modal="true" aria-labelledby="us-walkin-title" onClick={onClose}>
      <form className="us-sheet" onClick={e => e.stopPropagation()}
        onSubmit={e => { e.preventDefault(); if (name.trim()) onSubmit({ name, group, ...form }) }}>
        <div className="us-sheet-head">
          <h2 id="us-walkin-title">Tamu tanpa undangan</h2>
          <button type="button" className="us-x" onClick={onClose} aria-label="Tutup">×</button>
        </div>
        <p className="us-sheet-meta">Untuk tamu yang datang tapi tidak ada di daftar. Tercatat di buku tamu.</p>
        <div className="us-field">
          <label htmlFor="us-walkin-name">Nama</label>
          <input id="us-walkin-name" className="dg-input" value={name} onChange={e => setName(e.target.value)} autoFocus required maxLength={200} />
        </div>
        <div className="us-field">
          <label htmlFor="us-walkin-group">Keterangan <small>(opsional, mis. teman ayah)</small></label>
          <input id="us-walkin-group" className="dg-input" value={group} onChange={e => setGroup(e.target.value)} maxLength={100} />
        </div>
        <ArrivalFields form={form} setForm={setForm} souvenirs={souvenirs} />
        <div className="us-sheet-actions">
          <button type="submit" className="dg-btn dg-btn-gold dg-btn-block us-go" disabled={busy || !name.trim()}>Catat & check-in</button>
        </div>
      </form>
    </div>
  )
}

// Mode Penerima Tamu (/penerima/:token): the ushers' phones at the door.
// No login: the couple shares this link, and it works only around the
// wedding days (usher.py).
export default function UsherPage() {
  const { token } = useParams()
  const base = `/usher/${token}/`
  const [data, setData] = useState(null)
  const [problem, setProblem] = useState('')
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState('waiting')
  const [openId, setOpenId] = useState(null)
  const [walkIn, setWalkIn] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState(null)

  const load = useCallback(() => api.get(base)
    .then(res => { setData(res.data); setProblem('') })
    .catch(err => {
      const s = err.response?.status
      setProblem(s === 404 || s === 403 ? (err.response.data?.detail || 'Link tidak berlaku.') : 'Tidak bisa terhubung. Periksa internet, lalu coba lagi.')
    }), [base])

  useEffect(() => {
    load()
    const timer = setInterval(() => { if (document.visibilityState === 'visible') load() }, POLL_MS)
    return () => clearInterval(timer)
  }, [load])

  useEffect(() => {
    document.title = 'Penerima Tamu'
    const meta = Object.assign(document.createElement('meta'), { name: 'robots', content: 'noindex, nofollow' })
    document.head.appendChild(meta)
    return () => meta.remove()
  }, [])

  function flash(text, tone = 'ok') {
    setToast({ text, tone })
    setTimeout(() => setToast(null), 3000)
  }

  function apply(res) {
    const { guest, stats } = res.data
    setData(d => ({
      ...d, stats,
      guests: guest
        ? (d.guests.some(g => g.id === guest.id) ? d.guests.map(g => (g.id === guest.id ? guest : g)) : [guest, ...d.guests])
        : d.guests,
    }))
    return guest
  }

  async function run(fn) {
    setBusy(true)
    try { await fn() } catch (err) {
      flash(err.response?.data?.detail || 'Gagal menyimpan. Coba lagi.', 'bad')
    } finally { setBusy(false) }
  }

  const checkIn = (guest, form) => run(async () => {
    const res = await api.post(`${base}checkin/`, { guest_id: guest.id, ...form })
    apply(res)
    setOpenId(null)
    flash(res.data.already ? `${guest.name} sudah check-in sebelumnya` : `${guest.name} · ${form.arrived_pax} orang tercatat`, res.data.already ? 'warn' : 'ok')
  })

  const save = (guest, patch) => run(async () => {
    apply(await api.patch(`${base}guests/${guest.id}/`, patch))
    setOpenId(null)
    flash('Perubahan tersimpan')
  })

  const undo = guest => run(async () => {
    if (!window.confirm(guest.is_walk_in ? `Hapus ${guest.name} dari buku tamu?` : `Batalkan check-in ${guest.name}?`)) return
    const res = await api.post(`${base}guests/${guest.id}/undo/`)
    if (res.data.removed) setData(d => ({ ...d, stats: res.data.stats, guests: d.guests.filter(g => g.id !== guest.id) }))
    else apply(res)
    setOpenId(null)
    flash('Check-in dibatalkan', 'warn')
  })

  const addWalkIn = form => run(async () => {
    const guest = apply(await api.post(`${base}walkin/`, form))
    setWalkIn(false)
    flash(`${guest.name} dicatat di buku tamu`)
  })

  function onScan(text) {
    const code = codeFromScan(text).toUpperCase()
    const guest = code && data?.guests.find(g => g.code.toUpperCase() === code)
    if (!guest) { flash('QR ini bukan undangan untuk acara ini', 'bad'); return }
    setScanning(false)
    setOpenId(guest.id)
  }

  const tz = data?.events?.[0]?.timezone || 'Asia/Jakarta'
  const shown = useMemo(() => (data?.guests || [])
    .filter(g => (filter === 'all' || (filter === 'arrived') === g.checked_in) && matchesGuest(g, q))
    .sort((a, b) => (filter === 'arrived'
      ? new Date(b.checked_in_at) - new Date(a.checked_in_at)
      : a.name.localeCompare(b.name, 'id'))), [data, filter, q])

  if (!data) {
    return (
      <div className="dg us us-center">
        <p className="us-brand">Dear<i>Guest</i> · Penerima Tamu</p>
        <p>{problem || 'Memuat daftar tamu…'}</p>
        {problem && <button type="button" className="dg-btn dg-btn-line" onClick={load}>Coba lagi</button>}
      </div>
    )
  }

  const { stats, couple } = data
  const open = openId != null ? data.guests.find(g => g.id === openId) : null
  const counts = { waiting: data.guests.filter(g => !g.checked_in).length, arrived: stats.arrived, all: data.guests.length }

  return (
    <div className="dg us">
      <header className="us-top dg-dark">
        <p className="us-brand">Penerima Tamu</p>
        <h1>{[couple.bride, couple.groom].filter(Boolean).join(' & ')}</h1>
        <div className="us-stats">
          <div><strong className="dg-num">{stats.arrived_pax}</strong><span>orang hadir</span></div>
          <div><strong className="dg-num">{stats.arrived}<small>/{stats.invited}</small></strong><span>undangan datang</span></div>
          {stats.souvenir_stock != null && (
            <div className={stats.souvenirs_left <= 10 ? 'us-low' : ''}><strong className="dg-num">{stats.souvenirs_left}</strong><span>suvenir tersisa</span></div>
          )}
        </div>
        {problem && <p className="us-offline" role="alert">{problem}</p>}
      </header>

      <div className="us-actions">
        <button type="button" className="dg-btn dg-btn-gold us-scan-btn" onClick={() => setScanning(true)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M4 12h16" /></svg>
          Scan QR tamu
        </button>
        <button type="button" className="dg-btn dg-btn-line" onClick={() => setWalkIn(true)}>+ Tanpa undangan</button>
      </div>

      <div className="us-search">
        <input className="dg-input" type="search" value={q} onChange={e => setQ(e.target.value)}
          placeholder="Cari nama, grup, atau nomor amplop" aria-label="Cari tamu" />
        <div className="us-filters" role="group" aria-label="Saring tamu">
          {FILTERS.map(([key, label]) => (
            <button key={key} type="button" className="dg-chip" aria-pressed={filter === key} onClick={() => setFilter(key)}>
              {label} <span className="count">{counts[key]}</span>
            </button>
          ))}
        </div>
      </div>

      <ul className="us-list">
        {shown.length === 0 && <li className="us-empty">{q ? 'Tidak ada tamu dengan nama itu. Datang tanpa undangan? Pakai "+ Tanpa undangan".' : 'Tidak ada tamu di sini.'}</li>}
        {shown.map(g => (
          <li key={g.id}>
            <button type="button" className={`us-row ${g.checked_in ? 'in' : ''}`} onClick={() => setOpenId(g.id)}>
              <span className="us-row-main">
                <span className="us-row-name">{g.name}</span>
                <span className="us-row-meta">{[g.group, ...g.sessions].filter(Boolean).join(' · ') || 'Tanpa grup'} · {rsvpText(g)}</span>
              </span>
              {g.checked_in ? (
                <span className="us-row-in">
                  ✓ {formatClock(g.checked_in_at, tz)}
                  <small>{g.arrived_pax} org{g.envelope_no ? ` · #${g.envelope_no}` : ''}</small>
                </span>
              ) : <span className="us-row-go" aria-hidden="true">›</span>}
            </button>
          </li>
        ))}
      </ul>

      <footer className="us-foot">
        <Link to={`/penerima/${token}/layar`} target="_blank">Buka layar sambutan (untuk TV/proyektor)</Link>
      </footer>

      {open && <GuestSheet key={open.id + String(open.checked_in)} guest={open} tz={tz} souvenirs={stats.souvenirs_left} busy={busy}
        onCheckIn={checkIn} onSave={save} onUndo={undo} onClose={() => setOpenId(null)} />}
      {walkIn && <WalkInSheet souvenirs={stats.souvenirs_left} busy={busy} onSubmit={addWalkIn} onClose={() => setWalkIn(false)} />}
      {scanning && <Suspense fallback={null}><QrScanner onCode={onScan} onClose={() => setScanning(false)} /></Suspense>}
      {toast && <div className={`us-toast ${toast.tone}`} role="status">{toast.text}</div>}
    </div>
  )
}
