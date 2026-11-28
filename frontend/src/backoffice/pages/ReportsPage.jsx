import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ActionButton, Badge, Card, Chips, Data, Empty, PageHead, Pager, dateTime, errorText, staffPost, useStaff, useTitle,
} from '../ui.jsx'

const TONE = { new: 'warn', takedown: 'bad', no_action: 'muted', resolved: 'good' }

export default function ReportsPage() {
  useTitle('Laporan')
  const [query, setQuery] = useState({ status: '', page: 1 })
  const [adding, setAdding] = useState(false)
  const state = useStaff('reports/', query)
  return (
    <>
      <PageHead eyebrow="Moderasi" title="Laporan"
        lead="Laporan takedown dan penyalahgunaan yang masuk lewat email atau WhatsApp. Catat di sini, putuskan, lalu kabari pasangan. Disimpan satu tahun (RUNBOOK §7).">
        {!adding && <button type="button" className="dg-btn dg-btn-ink dg-btn-sm" onClick={() => setAdding(true)}>Catat laporan</button>}
      </PageHead>
      {adding && state.data && (
        <NewReport reasons={state.data.reasons} onClose={() => setAdding(false)} onSaved={() => { setAdding(false); state.reload() }} />
      )}
      <div className="bo-toolbar">
        <Chips label="Status laporan" value={query.status} onChange={status => setQuery({ status, page: 1 })} options={[
          { value: '', label: 'Semua' }, { value: 'new', label: 'Baru' }, { value: 'takedown', label: 'Dinonaktifkan' },
          { value: 'no_action', label: 'Tidak ada tindakan' }, { value: 'resolved', label: 'Selesai' },
        ]} />
      </div>
      <Data state={state}>
        {d => (d.results.length
          ? <div className="bo-stack">{d.results.map(r => <Report key={r.id} r={r} onDone={state.reload} />)}</div>
          : <Card><Empty>Belum ada laporan. Semoga tetap begitu.</Empty></Card>)}
      </Data>
      <Pager data={state.data} onPage={page => setQuery(q => ({ ...q, page }))} />
    </>
  )
}

function Report({ r, onDone }) {
  const [note, setNote] = useState(r.decision_note)
  const decide = decision => () => staffPost(`reports/${r.id}/decide/`, { decision, note })
  return (
    <Card className="bo-report">
      <div className="bo-report-head">
        <div>
          <h2>{r.reason_label}</h2>
          <p className="bo-quiet">
            {r.slug ? <Link to={`/backoffice/undangan/${r.invitation_id}`} className="bo-slug">{r.slug}</Link> : 'undangan tidak ditemukan'}
            {' · '}{dateTime(r.created_at)}{r.reporter ? ` · dari ${r.reporter}` : ''}
          </p>
        </div>
        <Badge tone={TONE[r.status]}>{r.status_label}</Badge>
      </div>
      <p className="bo-report-url">{r.url}</p>
      {r.details && <p>{r.details}</p>}
      {r.decided_by && <p className="bo-quiet">Diputuskan {r.decided_by} · {dateTime(r.decided_at)}</p>}
      <div className="dg-field">
        <label className="dg-label" htmlFor={`bo-note-${r.id}`}>Keputusan dan yang disampaikan ke pasangan</label>
        <textarea id={`bo-note-${r.id}`} className="dg-input" rows={2} value={note} onChange={e => setNote(e.target.value)} />
      </div>
      <div className="bo-row">
        {r.invitation_active !== false && (
          <ActionButton className="dg-btn dg-btn-ink dg-btn-sm" run={decide('takedown')} onDone={onDone}
            confirm="Nonaktifkan undangan ini sekarang? Tamu akan melihat 'belum aktif'.">Takedown: nonaktifkan</ActionButton>
        )}
        {r.status === 'new' && <ActionButton run={decide('no_action')} onDone={onDone}>Tidak ada tindakan</ActionButton>}
        {r.invitation_active === false && <ActionButton run={decide('restore')} onDone={onDone}>Selesai: aktifkan lagi</ActionButton>}
      </div>
    </Card>
  )
}

function NewReport({ reasons, onClose, onSaved }) {
  const [form, setForm] = useState({ url: '', reason: reasons[0]?.key || '', reporter: '', details: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const set = patch => setForm(f => ({ ...f, ...patch }))

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await staffPost('reports/', form)
      onSaved()
    } catch (err) {
      setError(errorText(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card title="Catat laporan baru" className="bo-new">
      <form className="bo-form" onSubmit={submit}>
        <div className="bo-form-grid">
          <div className="dg-field">
            <label className="dg-label" htmlFor="bo-r-url">Tautan yang dilaporkan</label>
            <input id="bo-r-url" className="dg-input" required value={form.url} placeholder="https://…/slug-undangan"
              onChange={e => set({ url: e.target.value })} />
          </div>
          <div className="dg-field">
            <label className="dg-label" htmlFor="bo-r-reason">Alasan</label>
            <select id="bo-r-reason" className="dg-input" value={form.reason} onChange={e => set({ reason: e.target.value })}>
              {reasons.map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
            </select>
          </div>
          <div className="dg-field">
            <label className="dg-label" htmlFor="bo-r-who">Pelapor dan lewat apa</label>
            <input id="bo-r-who" className="dg-input" value={form.reporter} placeholder="mis. email ke admin, 29 Nov"
              onChange={e => set({ reporter: e.target.value })} />
          </div>
        </div>
        <div className="dg-field">
          <label className="dg-label" htmlFor="bo-r-details">Isi laporan</label>
          <textarea id="bo-r-details" className="dg-input" rows={3} value={form.details} onChange={e => set({ details: e.target.value })} />
        </div>
        {error && <p className="bo-action-error" role="alert">{error}</p>}
        <div className="bo-row">
          <button type="submit" className="dg-btn dg-btn-ink dg-btn-sm" disabled={busy}>{busy ? 'Menyimpan…' : 'Simpan laporan'}</button>
          <button type="button" className="dg-btn dg-btn-line dg-btn-sm" onClick={onClose}>Batal</button>
        </div>
      </form>
    </Card>
  )
}
