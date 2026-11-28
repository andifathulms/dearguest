import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '../../api/client.js'
import { SiteFooter, SiteNav } from '../../brand/SiteChrome.jsx'
import { trackVisit } from '../../utils/funnel.js'
import { ArticleCard, usePageMeta } from './blogShared.jsx'
import '../../brand/brand.css'
import './Blog.css'

// /blog: the newest article large, the rest as cards, filtered by category
// (?kategori=, so a filtered list can be linked and shared).
export default function BlogPage() {
  const [params, setParams] = useSearchParams()
  const category = params.get('kategori') || ''
  const [data, setData] = useState(null)
  const [more, setMore] = useState([])
  const [page, setPage] = useState(1)
  const [error, setError] = useState(false)
  useEffect(trackVisit, [])
  usePageMeta('Blog · Inspirasi dan panduan pernikahan · Vowvella',
    'Inspirasi, adat, dan panduan persiapan pernikahan dari Vowvella.')

  useEffect(() => {
    let live = true
    setData(null)
    setMore([])
    setPage(1)
    setError(false)
    api.get('/blog/', { params: category ? { kategori: category } : {} })
      .then(res => live && setData(res.data))
      .catch(() => live && setError(true))
    return () => { live = false }
  }, [category])

  async function loadMore() {
    const next = page + 1
    const res = await api.get('/blog/', { params: { page: next, ...(category ? { kategori: category } : {}) } })
    setMore(m => [...m, ...res.data.results])
    setPage(next)
  }

  const articles = data ? [...data.results, ...more] : []
  const [lead, ...rest] = category ? [null, ...articles] : articles
  const total = data?.categories.reduce((n, c) => n + c.count, 0)

  return (
    <div className="dg bl-page">
      <SiteNav />
      <header className="bl-header dg-dark">
        <div className="dg-container bl-header-inner">
          <p className="dg-eyebrow">Blog</p>
          <h1 className="dg-display">Cerita, adat, dan <em>persiapan</em></h1>
          <p className="dg-lead">
            Panduan menyiapkan pernikahan, makna di balik adat Nusantara, dan etiket mengundang tamu di zaman
            WhatsApp. Ditulis tim Vowvella.
          </p>
        </div>
      </header>

      <main className="dg-container bl-main">
        {data && (
          <div className="bl-filter" role="group" aria-label="Kategori">
            <button type="button" className="dg-chip" aria-pressed={!category} onClick={() => setParams({})}>
              Semua <span className="count">{total}</span>
            </button>
            {data.categories.filter(c => c.count).map(c => (
              <button key={c.key} type="button" className="dg-chip" aria-pressed={category === c.key}
                onClick={() => setParams({ kategori: c.key })}>
                {c.label} <span className="count">{c.count}</span>
              </button>
            ))}
          </div>
        )}

        {error && <p className="bl-empty">Blog tidak bisa dimuat. Coba muat ulang halaman.</p>}
        {!data && !error && <p className="bl-empty">Memuat artikel…</p>}
        {data && !articles.length && (
          <p className="bl-empty">Belum ada artikel di sini. Sementara itu, lihat <a className="dg-link" href="/tema">galeri tema</a>.</p>
        )}

        {lead && <ArticleCard a={lead} big />}
        {rest.length > 0 && <div className="bl-grid">{rest.map(a => <ArticleCard key={a.slug} a={a} />)}</div>}
        {data && page < data.pages && (
          <div className="bl-more"><button type="button" className="dg-btn dg-btn-line" onClick={loadMore}>Artikel lainnya</button></div>
        )}
      </main>
      <SiteFooter />
    </div>
  )
}
