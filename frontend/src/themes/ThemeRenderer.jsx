import { lazy, Suspense, useMemo } from 'react'
import SilentBoundary from '../components/ui/SilentBoundary.jsx'
import { getTheme } from './registry.js'
import { CopyProvider } from '../copy/CopyContext.jsx'
import { withDefaultTexts } from '../copy/copy.js'

// Unknown or not-yet-renderable ids fall back to this pack.
const FALLBACK_THEME = 'sage'

// Theme packs: each pack's index.js is its own chunk (tokens, fonts, art).
const packModules = import.meta.glob('./packs/*/index.js')
const packModule = entry => packModules[`./packs/${entry.pack.dir}/index.js`]

// Each pack's manifest and hashed font URLs are known up front (a few hundred
// bytes of JSON and strings, no font data), so the primary fonts can start
// downloading in parallel with the pack's chunk instead of after it.
const packManifests = import.meta.glob('./packs/*/theme.json', { eager: true, import: 'default' })
const packFontUrls = import.meta.glob('./packs/*/fonts/*.woff2', { eager: true, query: '?url', import: 'default' })

function preloadFonts(entry) {
  const { dir } = entry.pack
  for (const file of packManifests[`./packs/${dir}/theme.json`]?.fonts?.preload || []) {
    const href = packFontUrls[`./packs/${dir}/${file}`]
    if (!href || document.head.querySelector(`link[rel="preload"][href="${href}"]`)) continue
    const link = Object.assign(document.createElement('link'), { rel: 'preload', as: 'font', type: 'font/woff2', href, crossOrigin: 'anonymous' })
    document.head.appendChild(link)
  }
}

// One lazy component per theme id, created once so re-renders don't remount it.
// Each loads only its own pack chunk (tokens, fonts, art).
const resolved = new Map()
function themeComponent(entry) {
  if (!resolved.has(entry.id)) {
    resolved.set(entry.id, lazy(() => {
      preloadFonts(entry)
      return Promise.all([
        import('./packs/_system/PackTheme.jsx'),
        packModule(entry)(),
      ]).then(([{ default: PackTheme }, { default: pack }]) => ({
        default: props => <PackTheme entry={entry} pack={pack} {...props} />,
      }))
    }))
  }
  return resolved.get(entry.id)
}

function resolveEntry(themeId) {
  const entry = getTheme(themeId)
  // A pack renders once its folder exists ("coming" packs may not have one yet).
  if (entry && packModule(entry)) return entry
  return getTheme(FALLBACK_THEME)
}

// Every theme is a separate lazy chunk, so a stale hash after a deploy — the
// classic trigger — rejects the import. Without a boundary that propagates past
// Suspense and unmounts the whole invitation, leaving a blank page. A reload
// fetches the current manifest, which is the actual fix.
function ThemeUnavailable() {
  return (
    <div className="inv-status">
      <div className="inv-status-mark" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z" />
        </svg>
      </div>
      <p className="inv-status-title">Undangan gagal dimuat.</p>
      <button className="inv-status-link" type="button" onClick={() => window.location.reload()}>
        Muat ulang
      </button>
    </div>
  )
}

export default function ThemeRenderer({ invitation: raw, guestName, preview = false }) {
  // Greeting/closing fall back to the couple's variant defaults; the pack reads
  // copy from the provider below.
  const invitation = useMemo(() => withDefaultTexts(raw), [raw])
  return (
    <CopyProvider invitation={invitation}>
      <ThemeBody invitation={invitation} guestName={guestName} preview={preview} />
    </CopyProvider>
  )
}

function ThemeBody({ invitation, guestName, preview }) {
  const entry = resolveEntry(invitation.theme)
  const Theme = themeComponent(entry)
  // Packs bring their own opening (packs/_system/openings) and motion settings.
  return (
    <SilentBoundary fallback={<ThemeUnavailable />}>
      <Suspense fallback={<div style={{ minHeight: '100vh' }} />}>
        <Theme invitation={invitation} guestName={guestName} preview={preview} />
      </Suspense>
    </SilentBoundary>
  )
}
