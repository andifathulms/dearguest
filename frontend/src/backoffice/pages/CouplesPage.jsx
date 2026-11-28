import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ActionButton, Card, CopyButton, Data, Empty, PageHead, Pager, STATUS, Search, ago, date, rupiah, staffPost, useMe,
  useStaff, useTitle, waLink,
} from '../ui.jsx'

export default function CouplesPage() {
  useTitle('Pasangan')
  const me = useMe()
  const [query, setQuery] = useState({ q: '', page: 1 })
  const state = useStaff('couples/', query)
  return (
    <>
      <PageHead eyebrow="Pelanggan" title="Pasangan"
        lead="Akun di balik setiap undangan, untuk menjawab chat bantuan. Staf tidak membuka editor pasangan: lihat halaman publiknya dan angka-angkanya saja." />
      <div className="bo-toolbar">
        <Search value={query.q} onChange={q => setQuery({ q, page: 1 })} placeholder="Cari akun, email, WhatsApp, slug" />
      </div>
      <Data state={state}>
        {d => (d.results.length
          ? <div className="bo-grid">{d.results.map(c => <Couple key={c.id} c={c} owner={me.can_see_revenue} onDone={state.reload} />)}</div>
          : <Card><Empty>Tidak ada akun yang cocok.</Empty></Card>)}
      </Data>
      <Pager data={state.data} onPage={page => setQuery(q => ({ ...q, page }))} />
    </>
  )
}

function Couple({ c, owner, onDone }) {
  const [reset, setReset] = useState(null)
  return (
    <Card className="bo-couple">
      <div className="bo-couple-head">
        <h2>{c.username}</h2>
        {owner && c.paid > 0 && <span className="bo-paid dg-num">{rupiah(c.paid)}</span>}
      </div>
      <dl className="bo-facts compact">
        <div><dt>Email</dt><dd>{c.email || '—'}</dd></div>
        <div><dt>WhatsApp</dt><dd>{c.whatsapp
          ? <a href={waLink(c.whatsapp_intl)} target="_blank" rel="noopener noreferrer" className="dg-link">{c.whatsapp}</a> : '—'}</dd></div>
        <div><dt>Daftar</dt><dd>{date(c.joined)}</dd></div>
        <div><dt>Terakhir masuk</dt><dd>{c.last_login ? ago(c.last_login) : 'belum pernah'}</dd></div>
        <div><dt>Batas undangan</dt><dd>{c.max_invitations}</dd></div>
      </dl>
      <ul className="bo-inv-links">
        {c.invitations.length ? c.invitations.map(i => (
          <li key={i.id}><Link to={`/backoffice/undangan/${i.id}`} className="bo-slug">{i.slug}</Link>
            <span className="bo-quiet"> · {STATUS[i.status]?.label}</span></li>
        )) : <li className="bo-quiet">Belum membuat undangan</li>}
      </ul>
      <div className="bo-row">
        {c.max_invitations < 2 && (
          <ActionButton run={() => staffPost(`couples/${c.id}/allow-two/`)} onDone={onDone}>Izinkan 2 undangan</ActionButton>
        )}
        {owner && (
          <ActionButton run={() => staffPost(`couples/${c.id}/reset-link/`)} onDone={setReset}
            confirm="Buat tautan reset sandi? Kirim hanya ke nomor atau email milik pasangan ini.">Tautan reset sandi</ActionButton>
        )}
      </div>
      {reset && (
        <div className="bo-reset">
          <p className="bo-quiet">Berlaku sekali, dan berhenti saat pasangan masuk lagi. Tidak bisa dilihat ulang.</p>
          <input className="dg-input" readOnly value={reset.link} aria-label="Tautan reset sandi" onFocus={e => e.target.select()} />
          <div className="bo-row">
            {reset.whatsapp && <a className="dg-btn dg-btn-wa dg-btn-sm" href={reset.whatsapp} target="_blank" rel="noopener noreferrer">Kirim lewat WhatsApp</a>}
            <CopyButton text={reset.link}>Salin tautan</CopyButton>
          </div>
        </div>
      )}
    </Card>
  )
}
