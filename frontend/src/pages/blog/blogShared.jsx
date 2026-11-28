import { useEffect } from 'react'
import { Link } from 'react-router-dom'

// Tab title and description for people. Search engines and link previews get
// the server-rendered page instead (backend apps/invitations/blog.py).
export function usePageMeta(title, description) {
  useEffect(() => {
    const before = document.title
    document.title = title
    const tag = document.querySelector('meta[name="description"]')
    const was = tag?.getAttribute('content')
    if (tag && description) tag.setAttribute('content', description)
    return () => {
      document.title = before
      if (tag && was != null) tag.setAttribute('content', was)
    }
  }, [title, description])
}

// The publishing day in WIB, where the articles are written ("29 November 2026").
const DAY = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' })
export const articleDate = iso => (iso ? DAY.format(new Date(iso)) : '')

// One article as a card: cover, category, title, excerpt, date and reading time.
export function ArticleCard({ a, big = false }) {
  return (
    <article className={`bl-card${big ? ' big' : ''}`}>
      <Link to={`/blog/${a.slug}`} className="bl-card-cover" tabIndex={-1} aria-hidden="true">
        {a.cover ? <img src={a.cover} alt="" loading="lazy" /> : <span className="bl-card-blank" />}
      </Link>
      <div className="bl-card-text">
        <p className="dg-eyebrow">{a.category_label}</p>
        <h3><Link to={`/blog/${a.slug}`}>{a.title}</Link></h3>
        <p className="bl-card-excerpt">{a.excerpt}</p>
        <p className="bl-meta">{articleDate(a.published_at)} · {a.reading_minutes} menit baca</p>
      </div>
    </article>
  )
}
