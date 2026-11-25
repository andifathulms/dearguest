import { useEffect, useState } from 'react'
import { useCopy } from '../../copy/CopyContext.jsx'

// Wide enough that the pill sits in the empty margin beside the content column.
const WIDE = '(min-width: 900px)'

// Floating shortcut that scrolls the guest to the RSVP form on a long invitation.
// It never sits over a card: a phone has no free margin, so there it shows only
// on the opening screen (over the hero's painted bottom band); a wide screen
// keeps it in the side margin. Once the form is on screen it has no job left.
export default function FloatingRSVP() {
  const { t } = useCopy()
  const [shown, setShown] = useState(true)

  useEffect(() => {
    const wide = window.matchMedia(WIDE)
    let frame = 0
    function update() {
      frame = 0
      const form = document.querySelector('.rsvp-section')
      const reached = form && form.getBoundingClientRect().top < window.innerHeight
      setShown(!reached && (wide.matches || window.scrollY < window.innerHeight * 0.4))
    }
    function onScroll() {
      if (!frame) frame = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    wide.addEventListener('change', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      wide.removeEventListener('change', onScroll)
      cancelAnimationFrame(frame)
    }
  }, [])

  function go() {
    document.querySelector('.rsvp-section')?.scrollIntoView({ behavior: 'smooth' })
  }
  return (
    <button
      className={`floating-rsvp${shown ? '' : ' is-hidden'}`}
      onClick={go}
      aria-hidden={!shown}
      tabIndex={shown ? 0 : -1}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
      <span>{t('floatingRsvp.label')}</span>
    </button>
  )
}
