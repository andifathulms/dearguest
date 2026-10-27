import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import CoverGate from '../components/ui/CoverGate.jsx'
import SilentBoundary from '../components/ui/SilentBoundary.jsx'
import { MotionClockProvider } from '../motion/MotionClockContext.jsx'
import { getTheme } from './registry.js'
import { CopyProvider } from '../copy/CopyContext.jsx'
import { withDefaultTexts } from '../copy/copy.js'
import LegacyTheme, { loadLegacyTheme } from './legacy/LegacyTheme.jsx'

// Unknown or not-yet-renderable ids fall back to this legacy theme, as before.
const FALLBACK_THEME = 'javanese-dark'

// The WebGL ("cinematic") themes keep their own components: they differ by
// scene, not just CSS. Each is a separate chunk.
const ownComponents = import.meta.glob('./*/index.jsx')

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
// Each loads only its own code and CSS.
const resolved = new Map()
function themeComponent(entry) {
  if (!resolved.has(entry.id) && entry.kind === 'pack') {
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
  if (!resolved.has(entry.id)) {
    const { dir, ownComponent } = entry.legacy
    resolved.set(entry.id, lazy(ownComponent
      ? ownComponents[`./${dir}/index.jsx`]
      : () => loadLegacyTheme(entry).then(() => ({
        default: props => <LegacyTheme entry={entry} {...props} />,
      }))))
  }
  return resolved.get(entry.id)
}

function resolveEntry(themeId) {
  const entry = getTheme(themeId)
  if (entry?.kind === 'legacy') return entry
  // A pack renders once its folder exists ("coming" packs may not have one yet).
  if (entry?.kind === 'pack' && packModule(entry)) return entry
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

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setReduced(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])
  return reduced
}

export default function ThemeRenderer({ invitation: raw, guestName, preview = false }) {
  // Greeting/closing fall back to the couple's variant defaults; every theme
  // family (legacy, WebGL, packs) reads copy from the provider below.
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
  const reducedMotion = usePrefersReducedMotion()

  if (entry.kind === 'pack') {
    // Packs bring their own opening (packs/_system/openings) and motion settings.
    return (
      <SilentBoundary fallback={<ThemeUnavailable />}>
        <Suspense fallback={<div style={{ minHeight: '100vh' }} />}>
          <Theme invitation={invitation} guestName={guestName} preview={preview} />
        </Suspense>
      </SilentBoundary>
    )
  }

  // One decision point for the whole invitation: no clock means no motion
  // layer anywhere, and every consumer degrades to its ordinary CSS/Framer
  // behaviour on its own. Which themes get a clock is declared in the registry.
  const motionConfig = reducedMotion ? null : entry.legacy.motionClock

  return (
    <MotionClockProvider config={motionConfig}>
      {/* Editor preview renders the content directly, skipping the cover gate.
          The cover sits outside the theme root, so the registry names the class
          that styles it (the WebGL themes borrow a classic theme's cover). */}
      {!preview && (
        <CoverGate
          invitation={invitation}
          guestName={guestName}
          themeClass={entry.legacy.coverClass}
        />
      )}
      <SilentBoundary fallback={<ThemeUnavailable />}>
        <Suspense fallback={<div style={{ minHeight: '100vh' }} />}>
          <Theme invitation={invitation} guestName={guestName} />
        </Suspense>
      </SilentBoundary>
    </MotionClockProvider>
  )
}
