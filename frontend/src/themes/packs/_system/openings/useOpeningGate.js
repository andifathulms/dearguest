import { useCallback, useEffect, useRef, useState } from 'react'

// The contract every opening keeps, identical to the legacy CoverGate:
// - the page is scroll-locked (body.cover-open) until the guest opens it;
// - the open button gets focus;
// - opening dispatches `invitation:open` synchronously inside the click, which
//   is what lets MusicPlayer start audio under browser autoplay rules.
export function useOpeningGate() {
  const [opened, setOpened] = useState(false)
  const buttonRef = useRef(null)

  useEffect(() => {
    document.body.classList.add('cover-open')
    buttonRef.current?.focus({ preventScroll: true })
    return () => document.body.classList.remove('cover-open')
  }, [])

  const open = useCallback(() => {
    document.body.classList.remove('cover-open')
    window.dispatchEvent(new Event('invitation:open'))
    setOpened(true)
  }, [])

  return { opened, open, buttonRef }
}

// Dev-only test hooks (Playwright):
//   ?openingAt=0.5          pin the intro at 50 %
//   ?openingType=lottie&openingSrc=<url>[&openingPreset=…]   swap the opening for a fixture
export function devOpeningOverrides() {
  if (!import.meta.env.DEV) return {}
  const q = new URLSearchParams(window.location.search)
  const at = q.get('openingAt')
  return {
    pinnedAt: at === null ? null : Math.min(1, Math.max(0, Number(at) || 0)),
    type: q.get('openingType') || null,
    src: q.get('openingSrc') || null,
    preset: q.get('openingPreset') || null,
  }
}
