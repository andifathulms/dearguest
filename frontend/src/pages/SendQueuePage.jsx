import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import api from '../api/client.js'
import useWaMessages from '../components/useWaMessages.js'
import { defaultTemplate, renderMessage, unknownVariables, VARIABLES } from '../utils/waTemplate.js'
import { normaliseWhatsapp, waLink } from '../utils/whatsapp.js'
import { guestUrl } from '../utils/publicUrl.js'
import '../brand/brand.css'
import './Dashboard.css'
import './DashboardRSVP.css'
import './SendQueue.css'

const TEMPLATE_TABS = [
  { key: 'formal', label: 'Formal' },
  { key: 'casual', label: 'Santai' },
  { key: 'group', label: 'Grup WhatsApp' },
]
const UNDO_MS = 6000

// Send personal invitations one guest at a time: open WhatsApp with the
// message ready, come back, the guest is marked sent and the next one shows.
// Deep links only: nothing is sent automatically.
export default function SendQueuePage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const wa = useWaMessages(slug)
  const [guests, setGuests] = useState(null)
  const [group, setGroup] = useState('')
  const [status, setStatus] = useState('unsent')
  const [pos, setPos] = useState(0)
  const [undo, setUndo] = useState(null)
  const [toast, setToast] = useState('')
  const pending = useRef(null)
  const undoTimer = useRef(null)

  useEffect(() => {
    api.get(`/invitations/${slug}/guests/`)
      .then(res => setGuests(res.data.guests || []))
      .catch(err => {
        if (err.response?.status === 401 || err.response?.status === 403) navigate('/dashboard')
        else setGuests([])
      })
  }, [slug, navigate])

  const groups = useMemo(() => [...new Set((guests || []).map(g => g.group).filter(Boolean))].sort(), [guests])
  const queue = useMemo(() => (guests || []).filter(g =>
    (!group || g.group === group) &&
    (status === 'all' || (status === 'sent' ? !!g.sent_at : !g.sent_at))), [guests, group, status])
  const current = queue[Math.min(pos, queue.length - 1)] || null
  const sentCount = (guests || []).filter(g => g.sent_at).length

  function flash(msg) {
    setToast(msg)
    setTimeout(() => setToast(''), 2000)
  }

  async function setSent(guest, sent) {
    const sent_at = sent ? new Date().toISOString() : null
    setGuests(list => list.map(g => (g.id === guest.id ? { ...g, sent_at } : g)))
    try {
      await api.patch(`/invitations/${slug}/guests/${guest.id}/`, { sent_at })
    } catch {
      setGuests(list => list.map(g => (g.id === guest.id ? { ...g, sent_at: guest.sent_at } : g)))
      flash('Gagal menyimpan status')
    }
  }

  // Marked sent: the "Belum dikirim" list shrinks, so the same position is
  // already the next guest; in the other views move on by one.
  function markSent(guest) {
    setSent(guest, true)
    if (status !== 'unsent') setPos(p => p + 1)
    clearTimeout(undoTimer.current)
    setUndo(guest)
    undoTimer.current = setTimeout(() => setUndo(null), UNDO_MS)
  }

  function undoSent() {
    const guest = undo
    setUndo(null)
    setSent(guest, false)
    const index = queue.findIndex(g => g.id === guest.id)
    setPos(index >= 0 ? index : pos)
  }

  // Coming back from WhatsApp marks the guest we opened it for.
  useEffect(() => {
    function onVisible() {
      if (document.visibilityState !== 'visible' || !pending.current) return
      const guest = (guests || []).find(g => g.id === pending.current)
      pending.current = null
      if (guest && !guest.sent_at) markSent(guest)
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  })

  function send(guest) {
    pending.current = guest.id
    window.open(waLink(guest.whatsapp, wa.messageFor(guest)), '_blank', 'noopener')
  }

  function copy(text, msg = 'Pesan disalin') {
    navigator.clipboard.writeText(text).then(() => flash(msg))
  }

  if (!guests || !wa.ready) return <div className="dr"><div className="dr-center">Memuat…</div></div>
  const allowed = wa.invitation.features?.wa_blast !== false

  return (
    <div className="dr">
      <header className="dr-bar dg dg-inline dg-dark">
        <div className="dr-bar-left">
          <Link to="/my" className="dg-brand">Dear<i>Guest</i></Link>
          <h1>Kirim Undangan<small>{slug}</small></h1>
        </div>
        <div className="dr-bar-actions">
          <Link className="dg-btn dg-btn-line dg-btn-sm" to={`/dashboard/${slug}`}>Kembali ke Tamu &amp; RSVP</Link>
        </div>
      </header>

      <div className="dr-body sq">
        {!allowed ? (
          <div className="dr-empty">Fitur kirim massal belum tersedia untuk paket undangan ini.</div>
        ) : (
          <>
            <section className="sq-panel" aria-labelledby="sq-queue-title">
              <div className="sq-head">
                <h2 id="sq-queue-title">Kirim satu per satu</h2>
                <span className="sq-progress">{sentCount} dari {guests.length} tamu sudah dikirimi</span>
              </div>
              <div className="sq-filters">
                <select value={status} onChange={e => { setStatus(e.target.value); setPos(0) }} aria-label="Status kirim">
                  <option value="unsent">Belum dikirim</option>
                  <option value="sent">Sudah dikirim</option>
                  <option value="all">Semua tamu</option>
                </select>
                <select value={group} onChange={e => { setGroup(e.target.value); setPos(0) }} aria-label="Grup tamu">
                  <option value="">Semua grup</option>
                  {groups.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>

              {guests.length === 0 ? (
                <div className="sq-done">
                  Belum ada tamu. <Link to={`/dashboard/${slug}`}>Tambahkan atau impor tamu</Link> dulu.
                </div>
              ) : !current || pos >= queue.length ? (
                <div className="sq-done">
                  {queue.length === 0 && status === 'unsent' ? 'Semua tamu di daftar ini sudah dikirimi undangan. 🤍' : 'Sudah sampai di akhir daftar.'}
                  {queue.length > 0 && <button className="gm-btn" onClick={() => setPos(0)}>Mulai lagi dari awal</button>}
                </div>
              ) : (
                <GuestCard
                  guest={current}
                  index={Math.min(pos, queue.length - 1)}
                  total={queue.length}
                  message={wa.messageFor(current)}
                  link={guestUrl(slug, current.code)}
                  onSend={() => send(current)}
                  onCopy={() => copy(wa.messageFor(current))}
                  onSkip={() => setPos(p => p + 1)}
                  onMark={() => (current.sent_at ? setPos(p => p + 1) : markSent(current))}
                />
              )}
            </section>

            <TemplateEditor wa={wa} sample={current || guests[0]} />

            <section className="sq-panel" aria-labelledby="sq-group-title">
              <h2 id="sq-group-title">Pesan untuk grup WhatsApp</h2>
              <p className="sq-hint">Untuk grup keluarga, kantor atau alumni: satu link umum tanpa nama tamu. Tamu dari grup tidak tercatat per orang.</p>
              <pre className="sq-message">{wa.groupMessage()}</pre>
              <div className="sq-actions">
                <button className="gm-btn" onClick={() => copy(wa.groupMessage())}>Salin pesan</button>
                <a className="gm-btn gm-btn-wa" href={waLink('', wa.groupMessage())} target="_blank" rel="noopener noreferrer">Bagikan via WhatsApp</a>
              </div>
            </section>
          </>
        )}
      </div>

      {undo && (
        <div className="gm-toast sq-undo" role="status">
          {undo.name} ditandai terkirim
          <button onClick={undoSent}>Batalkan</button>
        </div>
      )}
      {toast && !undo && <div className="gm-toast">{toast}</div>}
    </div>
  )
}

function GuestCard({ guest, index, total, message, link, onSend, onCopy, onSkip, onMark }) {
  const number = normaliseWhatsapp(guest.whatsapp)
  return (
    <div className="sq-card" data-testid="sq-card">
      <div className="sq-card-top">
        <div>
          <div className="sq-name">{guest.name}</div>
          <div className="sq-meta">
            {number ? `+${number}` : 'Belum ada nomor WhatsApp'}
            {guest.group ? ` · ${guest.group}` : ''}
            {guest.sent_at ? ' · sudah dikirim' : ''}
          </div>
        </div>
        <span className="sq-count">{index + 1} / {total}</span>
      </div>
      {!number && <p className="sq-note">Tanpa nomor, WhatsApp akan menanyakan kontak tujuan.</p>}
      <pre className="sq-message">{message}</pre>
      <a className="sq-link" href={link} target="_blank" rel="noopener noreferrer">{link}</a>
      <div className="sq-actions">
        <button className="gm-btn gm-btn-wa sq-send" onClick={onSend}>Kirim via WhatsApp</button>
        <button className="gm-btn" onClick={onCopy}>Salin pesan</button>
        <button className="gm-btn" onClick={onSkip}>Lewati</button>
        <button className="gm-btn" onClick={onMark}>{guest.sent_at ? 'Berikutnya' : 'Tandai terkirim'}</button>
      </div>
    </div>
  )
}

function TemplateEditor({ wa, sample }) {
  const [tab, setTab] = useState(wa.active)
  const [drafts, setDrafts] = useState({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState('')
  const textRef = useRef(null)
  const text = drafts[tab] ?? wa.templateText(tab)
  const unknown = unknownVariables(text)
  const isDefault = text === defaultTemplate(tab, wa.t)
  const preview = renderMessage(text, {
    ...wa.shared,
    nama: tab === 'group' ? '' : (sample?.name || 'Bapak/Ibu Tamu'),
    link: tab === 'group' ? 'https://…/undangan' : 'https://…/undangan/KODE',
  })

  function edit(value) {
    setDrafts(d => ({ ...d, [tab]: value }))
    setSaved('')
  }

  function insert(key) {
    const el = textRef.current
    const token = `{${key}}`
    const start = el?.selectionStart ?? text.length
    const end = el?.selectionEnd ?? text.length
    edit(text.slice(0, start) + token + text.slice(end))
    requestAnimationFrame(() => { el?.focus(); el?.setSelectionRange(start + token.length, start + token.length) })
  }

  async function save(patch) {
    setSaving(true)
    try {
      const next = { ...wa.saved, ...patch }
      // Text equal to the default is stored as "use the default".
      for (const key of ['formal', 'casual', 'group']) if (next[key] === defaultTemplate(key, wa.t)) next[key] = ''
      await wa.saveTemplates(next)
      setDrafts({})
      setSaved('Tersimpan')
    } catch {
      setSaved('Gagal menyimpan')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="sq-panel" aria-labelledby="sq-tpl-title">
      <h2 id="sq-tpl-title">Template pesan</h2>
      <div className="dash-tabs sq-tabs" role="tablist">
        {TEMPLATE_TABS.map(t => (
          <button key={t.key} role="tab" aria-selected={tab === t.key}
            className={`dash-tab ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
            {t.label}{t.key === wa.active && <span className="dash-tab-count">dipakai</span>}
          </button>
        ))}
      </div>
      <div className="sq-tpl">
        <div>
          <textarea ref={textRef} className="sq-textarea" value={text} onChange={e => edit(e.target.value)}
            aria-label={`Template ${tab}`} rows={12} />
          <div className="sq-chips" aria-label="Sisipkan">
            {VARIABLES.map(v => (
              <button key={v.key} className="sq-chip" onClick={() => insert(v.key)} title={v.label}>{`{${v.key}}`}</button>
            ))}
          </div>
          {unknown.length > 0 && (
            <p className="sq-warn" role="alert">
              Tidak dikenal: {unknown.map(u => `{${u}}`).join(', ')}. Periksa ejaannya; yang bisa dipakai: {VARIABLES.map(v => `{${v.key}}`).join(' ')}.
            </p>
          )}
          <div className="sq-actions">
            <button className="gm-btn gm-btn-primary" disabled={saving} onClick={() => save({ [tab]: text })}>Simpan template</button>
            {tab !== 'group' && tab !== wa.active && (
              <button className="gm-btn" disabled={saving} onClick={() => save({ [tab]: text, active: tab })}>Pakai untuk kirim</button>
            )}
            {!isDefault && <button className="gm-btn" disabled={saving} onClick={() => edit(defaultTemplate(tab, wa.t))}>Kembalikan ke bawaan</button>}
            {saved && <span className="sq-saved">{saved}</span>}
          </div>
        </div>
        <div>
          <div className="sq-preview-label">Pratinjau{tab !== 'group' && sample ? ` untuk ${sample.name}` : ''}</div>
          <pre className="sq-message">{preview}</pre>
        </div>
      </div>
    </section>
  )
}
