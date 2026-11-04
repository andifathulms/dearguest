import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import api from '../api/client.js'
import useWaMessages from '../components/useWaMessages.js'
import { defaultTemplate, renderMessage, TEMPLATE_KEYS, unknownVariables, VARIABLES } from '../utils/waTemplate.js'
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
  { key: 'reminder', label: 'Pengingat RSVP' },
]

// Two queues on one page. "Undangan" sends the invitation; "Pengingat" goes
// back to guests who were sent it but haven't answered the RSVP yet. Each
// marks its own timestamp (sent_at / reminded_at) when the couple comes back.
const MODES = {
  invite: {
    field: 'sent_at',
    template: null,   // the couple's chosen formal / santai template
    pool: () => true,
    statuses: [['unsent', 'Belum dikirim'], ['sent', 'Sudah dikirim'], ['all', 'Semua tamu']],
    shrinking: 'unsent',
  },
  remind: {
    field: 'reminded_at',
    template: 'reminder',
    pool: g => !!g.sent_at && !g.responded,
    statuses: [['unsent', 'Belum diingatkan'], ['sent', 'Sudah diingatkan'], ['all', 'Semua yang belum menjawab']],
    shrinking: 'unsent',
  },
}
const UNDO_MS = 6000

// Send personal invitations one guest at a time: open WhatsApp with the
// message ready, come back, the guest is marked sent and the next one shows.
// Deep links only: nothing is sent automatically.
export default function SendQueuePage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const wa = useWaMessages(slug)
  const [searchParams, setSearchParams] = useSearchParams()
  const modeKey = searchParams.get('mode') === 'pengingat' ? 'remind' : 'invite'
  const mode = MODES[modeKey]
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
    mode.pool(g) && (!group || g.group === group) &&
    (status === 'all' || (status === 'sent' ? !!g[mode.field] : !g[mode.field]))), [guests, group, status, mode])
  const current = queue[Math.min(pos, queue.length - 1)] || null
  const sentCount = (guests || []).filter(g => g.sent_at).length
  const awaiting = (guests || []).filter(MODES.remind.pool)
  const remindedCount = awaiting.filter(g => g.reminded_at).length
  const message = guest => wa.messageFor(guest, mode.template || undefined)

  function switchMode(key) {
    setSearchParams(key === 'remind' ? { mode: 'pengingat' } : {}, { replace: true })
    setStatus('unsent')
    setPos(0)
  }

  function flash(msg) {
    setToast(msg)
    setTimeout(() => setToast(''), 2000)
  }

  async function setSent(guest, sent, field = mode.field) {
    const value = sent ? new Date().toISOString() : null
    setGuests(list => list.map(g => (g.id === guest.id ? { ...g, [field]: value } : g)))
    try {
      await api.patch(`/invitations/${slug}/guests/${guest.id}/`, { [field]: value })
    } catch {
      setGuests(list => list.map(g => (g.id === guest.id ? { ...g, [field]: guest[field] } : g)))
      flash('Gagal menyimpan status')
    }
  }

  // Marked: the "Belum dikirim / diingatkan" list shrinks, so the same
  // position is already the next guest; in the other views move on by one.
  function markSent(guest) {
    setSent(guest, true)
    if (status !== mode.shrinking) setPos(p => p + 1)
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
      if (guest && !guest[mode.field]) markSent(guest)
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  })

  function send(guest) {
    pending.current = guest.id
    window.open(waLink(guest.whatsapp, message(guest)), '_blank', 'noopener')
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
            <div className="dash-tabs sq-modes" role="tablist" aria-label="Jenis pesan">
              <button role="tab" aria-selected={modeKey === 'invite'} className={`dash-tab ${modeKey === 'invite' ? 'active' : ''}`}
                onClick={() => switchMode('invite')}>Kirim undangan</button>
              <button role="tab" aria-selected={modeKey === 'remind'} className={`dash-tab ${modeKey === 'remind' ? 'active' : ''}`}
                onClick={() => switchMode('remind')}>
                Ingatkan RSVP{awaiting.length - remindedCount > 0 && <span className="dash-tab-count">{awaiting.length - remindedCount}</span>}
              </button>
            </div>

            <section className="sq-panel" aria-labelledby="sq-queue-title">
              <div className="sq-head">
                <h2 id="sq-queue-title">{modeKey === 'remind' ? 'Ingatkan yang belum menjawab' : 'Kirim satu per satu'}</h2>
                <span className="sq-progress">
                  {modeKey === 'remind'
                    ? `${awaiting.length} tamu sudah dikirimi tapi belum RSVP · ${remindedCount} sudah diingatkan`
                    : `${sentCount} dari ${guests.length} tamu sudah dikirimi`}
                </span>
              </div>
              {modeKey === 'remind' && (
                <p className="sq-hint">Pesan pengingat memakai template "Pengingat RSVP" di bawah. Tamu yang menjawab otomatis keluar dari daftar ini.</p>
              )}
              <div className="sq-filters">
                <select value={status} onChange={e => { setStatus(e.target.value); setPos(0) }} aria-label="Status kirim">
                  {mode.statuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
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
                  {queue.length === 0 && status === 'unsent'
                    ? (modeKey === 'remind'
                      ? (awaiting.length === 0 ? 'Semua tamu yang sudah dikirimi undangan sudah menjawab RSVP. 🤍' : 'Semua tamu yang belum menjawab sudah diingatkan.')
                      : 'Semua tamu di daftar ini sudah dikirimi undangan. 🤍')
                    : 'Sudah sampai di akhir daftar.'}
                  {queue.length > 0 && <button className="gm-btn" onClick={() => setPos(0)}>Mulai lagi dari awal</button>}
                </div>
              ) : (
                <GuestCard
                  guest={current}
                  index={Math.min(pos, queue.length - 1)}
                  total={queue.length}
                  remind={modeKey === 'remind'}
                  message={message(current)}
                  link={guestUrl(slug, current.code)}
                  onSend={() => send(current)}
                  onCopy={() => copy(message(current))}
                  onSkip={() => setPos(p => p + 1)}
                  onMark={() => (current[mode.field] ? setPos(p => p + 1) : markSent(current))}
                />
              )}
            </section>

            <TemplateEditor key={modeKey} wa={wa} sample={current || guests[0]} initialTab={mode.template || wa.active} />

            {modeKey === 'invite' && <section className="sq-panel" aria-labelledby="sq-group-title">
              <h2 id="sq-group-title">Pesan untuk grup WhatsApp</h2>
              <p className="sq-hint">Untuk grup keluarga, kantor atau alumni: satu link umum tanpa nama tamu. Tamu dari grup tidak tercatat per orang.</p>
              <pre className="sq-message">{wa.groupMessage()}</pre>
              <div className="sq-actions">
                <button className="gm-btn" onClick={() => copy(wa.groupMessage())}>Salin pesan</button>
                <a className="gm-btn gm-btn-wa" href={waLink('', wa.groupMessage())} target="_blank" rel="noopener noreferrer">Bagikan via WhatsApp</a>
              </div>
            </section>}
          </>
        )}
      </div>

      {undo && (
        <div className="gm-toast sq-undo" role="status">
          {undo.name} ditandai {modeKey === 'remind' ? 'sudah diingatkan' : 'terkirim'}
          <button onClick={undoSent}>Batalkan</button>
        </div>
      )}
      {toast && !undo && <div className="gm-toast">{toast}</div>}
    </div>
  )
}

function GuestCard({ guest, index, total, remind, message, link, onSend, onCopy, onSkip, onMark }) {
  const number = normaliseWhatsapp(guest.whatsapp)
  const done = remind ? guest.reminded_at : guest.sent_at
  return (
    <div className="sq-card" data-testid="sq-card">
      <div className="sq-card-top">
        <div>
          <div className="sq-name">{guest.name}</div>
          <div className="sq-meta">
            {number ? `+${number}` : 'Belum ada nomor WhatsApp'}
            {guest.group ? ` · ${guest.group}` : ''}
            {remind
              ? (guest.open_count > 0 ? ` · undangan dibuka${guest.open_count > 1 ? ` ${guest.open_count}×` : ''}` : ' · undangan belum dibuka')
              : (guest.sent_at ? ' · sudah dikirim' : '')}
            {remind && guest.reminded_at ? ` · diingatkan ${new Date(guest.reminded_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}` : ''}
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
        <button className="gm-btn" onClick={onMark}>{done ? 'Berikutnya' : (remind ? 'Tandai diingatkan' : 'Tandai terkirim')}</button>
      </div>
    </div>
  )
}

function TemplateEditor({ wa, sample, initialTab }) {
  const [tab, setTab] = useState(initialTab)
  const [drafts, setDrafts] = useState({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState('')
  const textRef = useRef(null)
  const text = drafts[tab] ?? wa.templateText(tab)
  const unknown = unknownVariables(text)
  const isDefault = text === defaultTemplate(tab, wa.t)
  const preview = renderMessage(text, {
    ...(tab === 'group' ? wa.shared : wa.varsFor(sample?.group || '')),
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
      for (const key of TEMPLATE_KEYS) if (next[key] === defaultTemplate(key, wa.t)) next[key] = ''
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
            {t.label}{(t.key === wa.active || t.key === 'reminder') && <span className="dash-tab-count">dipakai</span>}
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
            {(tab === 'formal' || tab === 'casual') && tab !== wa.active && (
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
