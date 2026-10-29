import { useState, useEffect, lazy, Suspense } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import api from '../api/client.js'
import ThemeRenderer from '../themes/ThemeRenderer.jsx'
import { GuestProvider } from '../copy/GuestContext.jsx'
import { catalogThemes } from '../themes/registry.js'

// "Pakai tema ini" bar for theme demos opened from /tema/:id (see DemoBar).
const DemoBar = lazy(() => import('../components/ui/DemoBar.jsx'))

export default function InvitationPage() {
  const { slug, code: pathCode } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  // Personal links: /<slug>/<code>, or the legacy ?to=&g=<code>.
  const legacyCode = searchParams.get('g') || ''
  const code = pathCode || legacyCode
  // Owner draft preview: fetch via the authenticated editor endpoint.
  const preview = searchParams.get('preview') === '1'

  const [invitation, setInvitation] = useState(null)
  const [guest, setGuest] = useState(null)
  const [status, setStatus] = useState('loading')
  const [errorMessage, setErrorMessage] = useState('')

  // A legacy ?g= link becomes the clean /<slug>/<code> (same page, no reload).
  useEffect(() => {
    if (!pathCode && legacyCode) navigate(`/${slug}/${encodeURIComponent(legacyCode)}`, { replace: true })
  }, [slug, pathCode, legacyCode, navigate])

  // Invitations are private pages: keep them out of search results (nginx also
  // sends X-Robots-Tag; this covers crawlers that render the app).
  useEffect(() => {
    const meta = document.createElement('meta')
    meta.name = 'robots'
    meta.content = 'noindex, nofollow'
    document.head.appendChild(meta)
    return () => meta.remove()
  }, [])

  // The guest's name comes from the couple's list, never from the URL.
  useEffect(() => {
    if (!code) { setGuest(null); return }
    api.get(`/invitations/${slug}/guest/${encodeURIComponent(code)}/`)
      .then(({ data }) => {
        setGuest({ code: data.code, name: data.name, maxPax: data.max_pax })
        // Tell the couple this guest opened their link (no IP or device is
        // stored; the server ignores crawlers, the couple and quick repeats).
        if (!preview) api.post(`/invitations/${slug}/guest/${encodeURIComponent(data.code)}/open/`).catch(() => {})
      })
      .catch(() => setGuest(null))   // unknown code: a general invitation
  }, [slug, code, preview])

  // ?variant= (theme page's toggle) is honoured by the server for demo invitations only.
  const variant = searchParams.get('variant') || ''
  useEffect(() => {
    api.get(preview ? `/my/invitations/${slug}/` : `/invitations/${slug}/`, { params: !preview && variant ? { variant } : undefined })
      .then(res => {
        setInvitation(res.data)
        setStatus('ok')
      })
      .catch(err => {
        const code = err.response?.status
        const detail = err.response?.data?.detail || ''
        if (code === 404) {
          setErrorMessage('Undangan tidak ditemukan.')
        } else if (code === 403) {
          setErrorMessage(detail || 'Undangan belum aktif.')
        } else {
          setErrorMessage('Terjadi kesalahan. Silakan coba lagi.')
        }
        setStatus('error')
      })
  }, [slug, preview, variant])

  if (status === 'loading') {
    return (
      <div className="inv-status">
        <div className="inv-loader" aria-hidden="true">
          <span /><span /><span />
        </div>
        <p className="inv-status-text">Membuka undangan…</p>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="inv-status">
        <div className="inv-status-mark" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z" />
          </svg>
        </div>
        <p className="inv-status-title">{errorMessage}</p>
        <a className="inv-status-link" href="/">Kembali ke beranda</a>
      </div>
    )
  }

  // A ?to= name still shows on the cover of a general link (never on previews).
  const guestName = guest?.name || (pathCode ? '' : searchParams.get('to') || '')
  // Only on a demo opened from the theme page, never inside its phone frame.
  const demoTheme = searchParams.get('from') === 'tema' && window.self === window.top
    ? catalogThemes().find(t => t.demo === slug) : null
  return (
    <GuestProvider value={guest}>
      <ThemeRenderer invitation={invitation} guestName={guestName} preview={preview} />
      {demoTheme && <Suspense fallback={null}><DemoBar theme={demoTheme} /></Suspense>}
    </GuestProvider>
  )
}
