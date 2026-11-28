import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client.js'
import { copyText } from '../utils/clipboard.js'

// Who is signed in: { username, role: 'owner' | 'staff', can_see_revenue }.
export const MeContext = createContext(null)
export const useMe = () => useContext(MeContext)

export function useTitle(title) {
  useEffect(() => { document.title = `${title} · Backoffice Vowvella` }, [title])
}

// ---- data ----

// The staff API (backend apps/invitations/staff_views.py). A 401/403 means
// the staff session is gone: the shell sends the user to the login.
export const SIGNED_OUT = 'bo-signed-out'

function signedOut(err) {
  if ([401, 403].includes(err?.response?.status)) window.dispatchEvent(new Event(SIGNED_OUT))
}

export async function staffGet(path, params) {
  try {
    return (await api.get(`/staff/${path}`, { params })).data
  } catch (err) {
    signedOut(err)
    throw err
  }
}

export async function staffPost(path, body = {}) {
  return (await api.post(`/staff/${path}`, body)).data
}

// GET a staff endpoint and keep it fresh: { data, error, loading, reload }.
// `params` is compared by value, so callers can pass a fresh object.
export function useStaff(path, params) {
  const key = JSON.stringify(params || {})
  const [state, setState] = useState({ data: null, error: null, loading: true })
  const load = useCallback(() => {
    let live = true
    setState(s => ({ ...s, loading: true }))
    staffGet(path, JSON.parse(key))
      .then(data => live && setState({ data, error: null, loading: false }))
      .catch(err => live && setState(s => ({ ...s, error: errorText(err), loading: false })))
    return () => { live = false }
  }, [path, key])
  useEffect(load, [load])
  return { ...state, reload: load }
}

export function errorText(err) {
  const data = err?.response?.data
  if (data?.detail) return data.detail
  if (data && typeof data === 'object') return Object.values(data).flat().join(' ')
  return 'Tidak bisa terhubung ke server. Coba lagi.'
}

// ---- formatting (all times in WIB, where the business runs) ----

const TZ = 'Asia/Jakarta'
const nf = new Intl.NumberFormat('id-ID')
export const num = n => nf.format(n || 0)
export const rupiah = n => `Rp ${nf.format(n || 0)}`

export function date(iso, opts = { day: 'numeric', month: 'short', year: 'numeric' }) {
  if (!iso) return '—'
  // Date-only values ("2026-12-12") are calendar days, not instants.
  const d = iso.length === 10 ? new Date(`${iso}T12:00:00+07:00`) : new Date(iso)
  return new Intl.DateTimeFormat('id-ID', { timeZone: TZ, ...opts }).format(d)
}

export const dateTime = iso => date(iso, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
export const clock = iso => date(iso, { hour: '2-digit', minute: '2-digit' })
// The clock for today, the day and clock before that.
export const when = iso => (date(iso) === date(new Date().toISOString()) ? clock(iso) : dateTime(iso))

const rtf = new Intl.RelativeTimeFormat('id-ID', { numeric: 'auto' })
export function ago(iso) {
  if (!iso) return '—'
  const s = (new Date(iso) - Date.now()) / 1000
  for (const [unit, size] of [['day', 86400], ['hour', 3600], ['minute', 60]]) {
    if (Math.abs(s) >= size) return rtf.format(Math.round(s / size), unit)
  }
  return 'baru saja'
}

// How long since `iso`, without "ago": "26 jam", "3 hari".
export function since(iso) {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(iso)) / 60000))
  if (minutes < 60) return `${minutes} menit`
  if (minutes < 48 * 60) return `${Math.round(minutes / 60)} jam`
  return `${Math.round(minutes / 1440)} hari`
}

export function change(now, before) {
  if (!before) return now ? `+${now} dari 0` : 'sama'
  const pct = Math.round(((now - before) / before) * 100)
  return `${pct > 0 ? '+' : ''}${pct}% dari minggu lalu`
}

export const pct = (part, whole) => (whole ? `${Math.round((part / whole) * 100)}%` : '—')

export const STATUS = {
  draft: { label: 'Draf', tone: 'muted' },
  requested: { label: 'Minta aktivasi', tone: 'warn' },
  live: { label: 'Aktif', tone: 'good' },
  expired: { label: 'Berakhir', tone: 'muted' },
  purged: { label: 'Data dihapus', tone: 'muted' },
}
export const TIER = { free: 'Gratis', premium: 'Premium', bisnis: 'Bisnis' }

export function waLink(intl, text) {
  return `https://wa.me/${intl}${text ? `?text=${encodeURIComponent(text)}` : ''}`
}

// ---- components ----

export function Badge({ tone = 'muted', children }) {
  return <span className={`bo-badge ${tone}`}>{children}</span>
}

export function StatusBadge({ status }) {
  const s = STATUS[status] || STATUS.draft
  return <Badge tone={s.tone}>{s.label}</Badge>
}

export function PageHead({ eyebrow, title, lead, children }) {
  return (
    <header className="bo-head">
      <div className="bo-head-text">
        {eyebrow && <p className="dg-eyebrow">{eyebrow}</p>}
        <h1 className="bo-title">{title}</h1>
        {lead && <p className="bo-lead">{lead}</p>}
      </div>
      {children && <div className="bo-head-actions">{children}</div>}
    </header>
  )
}

export function Stat({ label, value, note, action, to }) {
  const body = (
    <>
      <span className="bo-stat-label">{label}</span>
      <span className={`bo-stat-value dg-num${String(value).length > 8 ? ' long' : ''}`}>{value}</span>
      {note && <span className="bo-stat-note">{note}</span>}
    </>
  )
  const cls = `bo-stat${action ? ' action' : ''}`
  return to ? <Link to={to} className={cls}>{body}</Link> : <div className={cls}>{body}</div>
}

export function Card({ title, aside, children, className = '' }) {
  return (
    <section className={`bo-card ${className}`}>
      {(title || aside) && (
        <div className="bo-card-head">
          {title && <h2>{title}</h2>}
          {aside}
        </div>
      )}
      {children}
    </section>
  )
}

export function Loading({ label = 'Memuat…' }) {
  return <p className="bo-quiet bo-pad">{label}</p>
}

export function Problem({ children, onRetry }) {
  return (
    <div className="bo-problem" role="alert">
      <span>{children}</span>
      {onRetry && <button type="button" className="dg-btn dg-btn-line dg-btn-sm" onClick={onRetry}>Coba lagi</button>}
    </div>
  )
}

export function Empty({ children }) {
  return <p className="bo-empty">{children}</p>
}

// Wraps a page's data: loading, error with retry, then the content.
export function Data({ state, children }) {
  if (state.error && !state.data) return <Problem onRetry={state.reload}>{state.error}</Problem>
  if (!state.data) return <Loading />
  return children(state.data)
}

export function Pager({ data, onPage }) {
  if (!data || data.pages <= 1) return null
  return (
    <nav className="bo-pager" aria-label="Halaman">
      <button type="button" className="dg-btn dg-btn-line dg-btn-sm" disabled={data.page <= 1}
        onClick={() => onPage(data.page - 1)}>← Sebelumnya</button>
      <span className="bo-quiet dg-num">Halaman {data.page} dari {data.pages} · {num(data.count)} baris</span>
      <button type="button" className="dg-btn dg-btn-line dg-btn-sm" disabled={data.page >= data.pages}
        onClick={() => onPage(data.page + 1)}>Berikutnya →</button>
    </nav>
  )
}

export function Chips({ options, value, onChange, label }) {
  return (
    <div className="bo-chips" role="group" aria-label={label}>
      {options.map(o => (
        <button key={o.value} type="button" className="dg-chip" aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}>
          {o.label}{o.count != null && <span className="count">{num(o.count)}</span>}
        </button>
      ))}
    </div>
  )
}

export function Search({ value, onChange, placeholder, id }) {
  const [text, setText] = useState(value)
  useEffect(() => setText(value), [value])
  useEffect(() => {
    if (text === value) return undefined
    const t = setTimeout(() => onChange(text), 350)
    return () => clearTimeout(t)
  }, [text, value, onChange])
  return (
    <input id={id} className="dg-input bo-search" type="search" value={text} placeholder={placeholder}
      aria-label={placeholder} onChange={e => setText(e.target.value)} />
  )
}

export function CopyButton({ text, children = 'Salin' }) {
  const [state, setState] = useState('')
  function copy() {
    copyText(text).then(() => setState('Tersalin')).catch(() => setState('Gagal menyalin'))
    setTimeout(() => setState(''), 2000)
  }
  return (
    <button type="button" className="dg-btn dg-btn-line dg-btn-sm" onClick={copy}>
      <span aria-live="polite">{state || children}</span>
    </button>
  )
}

// A button that runs an async staff action, shows it's busy, and reports a
// failure next to itself. `confirm` asks first (destructive actions).
export function ActionButton({ run, confirm, className = 'dg-btn dg-btn-line dg-btn-sm', children, onDone }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function click() {
    if (confirm && !window.confirm(confirm)) return
    setBusy(true)
    setError('')
    try {
      const result = await run()
      onDone?.(result)
    } catch (err) {
      setError(errorText(err))
    } finally {
      setBusy(false)
    }
  }
  return (
    <span className="bo-action">
      <button type="button" className={className} disabled={busy} onClick={click}>{busy ? 'Memproses…' : children}</button>
      {error && <span className="bo-action-error" role="alert">{error}</span>}
    </span>
  )
}
