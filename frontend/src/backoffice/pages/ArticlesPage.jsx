import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Badge, Card, Chips, Data, Empty, PageHead, Search, dateTime, errorText, num, staffPost, useStaff, useTitle,
} from '../ui.jsx'

export const ARTICLE_STATE = { draft: ['Draf', 'muted'], scheduled: ['Terjadwal', 'warn'], live: ['Terbit', 'good'] }

export default function ArticlesPage() {
  useTitle('Artikel')
  const navigate = useNavigate()
  const [query, setQuery] = useState({ state: '', q: '' })
  const [title, setTitle] = useState('')
  const [error, setError] = useState('')
  const state = useStaff('articles/', query)
  const counts = state.data?.state_counts || {}

  async function start(e) {
    e.preventDefault()
    setError('')
    try {
      const a = await staffPost('articles/', { title })
      navigate(`/backoffice/artikel/${a.id}`)
    } catch (err) {
      setError(errorText(err))
    }
  }

  return (
    <>
      <PageHead eyebrow="Bisnis" title="Artikel"
        lead="Tulisan untuk blog di /blog: inspirasi, adat, dan panduan persiapan pernikahan. Artikel yang terbit dibaca mesin pencari, masuk sitemap dan RSS, dan muncul di halaman depan." />
      <Card>
        <form className="bo-inline" onSubmit={start}>
          <input className="dg-input" aria-label="Judul artikel baru" value={title} maxLength={140}
            placeholder="Judul artikel baru, mis. 7 Makna di Balik Prosesi Mappacci" onChange={e => setTitle(e.target.value)} />
          <button type="submit" className="dg-btn dg-btn-ink dg-btn-sm" disabled={!title.trim()}>Mulai menulis</button>
        </form>
        {error && <p className="bo-action-error" role="alert">{error}</p>}
      </Card>
      <div className="bo-toolbar">
        <Chips label="Status artikel" value={query.state} onChange={s => setQuery(q => ({ ...q, state: s }))} options={[
          { value: '', label: 'Semua', count: state.data ? Object.values(counts).reduce((a, b) => a + b, 0) : null },
          ...Object.entries(ARTICLE_STATE).map(([key, [label]]) => ({ value: key, label, count: counts[key] ?? null })),
        ]} />
        <Search value={query.q} onChange={q => setQuery(s => ({ ...s, q }))} placeholder="Cari judul atau alamat" />
      </div>
      <Data state={state}>
        {d => (d.results.length ? (
          <div className="bo-stack">
            {d.results.map(a => (
              <Link key={a.id} to={`/backoffice/artikel/${a.id}`} className="bo-article-row">
                <span className="bo-article-cover">{a.cover ? <img src={a.cover} alt="" /> : null}</span>
                <span className="bo-article-text">
                  <span className="bo-article-title">{a.title}</span>
                  <span className="bo-quiet">
                    {a.category_label} · {num(a.words)} kata · {a.reading_minutes} menit baca · /blog/{a.slug}
                  </span>
                  <span className="bo-quiet">
                    {a.state === 'draft' ? `Diubah ${dateTime(a.updated_at)}`
                      : `${a.state === 'live' ? 'Terbit' : 'Dijadwalkan terbit'} ${dateTime(a.published_at)}`}
                  </span>
                </span>
                <Badge tone={ARTICLE_STATE[a.state][1]}>{ARTICLE_STATE[a.state][0]}</Badge>
              </Link>
            ))}
          </div>
        ) : <Card><Empty>{query.state || query.q ? 'Tidak ada artikel yang cocok.' : 'Belum ada artikel. Tulis yang pertama di atas.'}</Empty></Card>)}
      </Data>
    </>
  )
}
