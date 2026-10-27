import { lazy, Suspense, useEffect, useState } from 'react'
import CoverGate from '../components/ui/CoverGate.jsx'
import SilentBoundary from '../components/ui/SilentBoundary.jsx'
import { MotionClockProvider } from '../motion/MotionClockContext.jsx'
import { getTheme } from './registry.js'
import LegacyTheme, { loadLegacyTheme } from './legacy/LegacyTheme.jsx'

// Unknown or not-yet-renderable ids fall back to this legacy theme, as before.
const FALLBACK_THEME = 'javanese-dark'

// The WebGL ("cinematic") themes keep their own components: they differ by
// scene, not just CSS. Each is a separate chunk.
const ownComponents = import.meta.glob('./*/index.jsx')

// One lazy component per theme id, created once so re-renders don't remount it.
// Each loads only its own code and CSS.
const resolved = new Map()
function themeComponent(entry) {
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
  return entry?.kind === 'legacy' ? entry : getTheme(FALLBACK_THEME)
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

export default function ThemeRenderer({ invitation, guestName, preview = false }) {
  const entry = resolveEntry(invitation.theme)
  const Theme = themeComponent(entry)
  const reducedMotion = usePrefersReducedMotion()

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
