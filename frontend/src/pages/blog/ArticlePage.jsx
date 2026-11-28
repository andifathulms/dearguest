import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import api from '../../api/client.js'
import { SiteFooter, SiteNav } from '../../brand/SiteChrome.jsx'
import { trackVisit } from '../../utils/funnel.js'
import { ArticleCard, articleDate, usePageMeta } from './blogShared.jsx'
import '../../brand/brand.css'
import './Blog.css'

// /blog/:slug. The body's HTML comes from the server's renderer, which escapes
// everything and emits only a small set of tags (backend blog.render), the
// same HTML search engines get.
export default function ArticlePage() {
  const { slug } = useParams()
  const [article, setArticle] = useState(undefined)   // undefined loading, null not found
  useEffect(trackVisit, [])

  useEffect(() => {
    let live = true
    setArticle(undefined)
    window.scrollTo(0, 0)
    api.get(`/blog/${slug}/`)
      .then(res => live && setArticle(res.data))
      .catch(() => live && setArticle(null))
    return () => { live = false }
  }, [slug])

  usePageMeta(article ? `${article.seo_title} · Vowvella` : 'Blog · Vowvella', article?.excerpt)

  return (
    <div className="dg bl-page">
      <SiteNav tone="light" />
      {article === undefined && <p className="bl-empty bl-pad">Memuat artikel…</p>}
      {article === null && (
        <main className="dg-container bl-pad bl-missing">
          <h1 className="dg-h2">Artikel tidak ditemukan</h1>
          <p className="dg-lead">Mungkin alamatnya berubah atau artikelnya belum terbit.</p>
          <Link to="/blog" className="dg-btn dg-btn-ink">Ke semua artikel</Link>
        </main>
      )}
      {article && <Article a={article} />}
      <SiteFooter />
    </div>
  )
}

function Article({ a }) {
  const toc = a.toc.filter(h => h.level === 2)
  return (
    <>
      <article className="bl-article">
        <header className="dg-container bl-article-head">
          <p className="dg-eyebrow"><Link to={`/blog?kategori=${a.category}`}>{a.category_label}</Link></p>
          <h1 className="bl-title">{a.title}</h1>
          {a.excerpt && <p className="dg-lead bl-standfirst">{a.excerpt}</p>}
          <p className="bl-meta">{a.author_name} · {articleDate(a.published_at)} · {a.reading_minutes} menit baca</p>
        </header>
        {a.cover && (
          <figure className="dg-container bl-cover"><img src={a.cover} alt={a.cover_alt || ''} /></figure>
        )}
        <div className="dg-container bl-body-wrap">
          {toc.length >= 3 && (
            <nav className="bl-toc" aria-label="Isi artikel">
              <p className="dg-eyebrow">Isi artikel</p>
              <ol>{toc.map(h => <li key={h.id}><a href={`#${h.id}`}>{h.text}</a></li>)}</ol>
            </nav>
          )}
          {/* Safe: rendered and escaped by the server (blog.render), never raw input. */}
          <div className="bl-prose" dangerouslySetInnerHTML={{ __html: a.html }} />
        </div>
      </article>

      {a.theme && (
        <section className="dg-container bl-theme-wrap">
          <div className="bl-theme dg-dark">
            {a.theme.preview && <div className="bl-theme-phone dg-phone"><img src={a.theme.preview} alt="" /></div>}
            <div className="bl-theme-text">
              <p className="dg-eyebrow">Tema di artikel ini</p>
              <h2 className="dg-h3">{a.theme.name}</h2>
              {a.theme.category && <p className="dg-small">{a.theme.category}</p>}
              <div className="bl-theme-actions">
                <Link to={`/tema/${a.theme.id}`} className="dg-btn dg-btn-gold">Lihat tema</Link>
                <Link to="/register" className="dg-btn dg-btn-line on-dark">Buat undangan</Link>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="bl-cta dg-dark">
        <div className="dg-container bl-cta-inner">
          <h2 className="dg-h2">Siap membuat <em>undangan</em>?</h2>
          <p className="dg-lead">Pilih tema berlukis, isi data acara, dan bagikan ke tamu lewat WhatsApp. Mulai gratis.</p>
          <div className="bl-theme-actions">
            <Link to="/register" className="dg-btn dg-btn-gold">Buat undangan gratis</Link>
            <Link to="/tema" className="dg-btn dg-btn-line on-dark">Lihat galeri tema</Link>
          </div>
        </div>
      </section>

      {a.related.length > 0 && (
        <section className="dg-container bl-related">
          <h2 className="dg-h3">Baca juga</h2>
          <div className="bl-grid">{a.related.map(r => <ArticleCard key={r.slug} a={r} />)}</div>
        </section>
      )}
    </>
  )
}
