// Floating shortcut that scrolls the guest to the RSVP form on a long invitation.
export default function FloatingRSVP() {
  function go() {
    document.querySelector('.rsvp-section')?.scrollIntoView({ behavior: 'smooth' })
  }
  return (
    <button className="floating-rsvp" onClick={go} aria-label="Konfirmasi kehadiran (RSVP)">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
      <span>RSVP</span>
    </button>
  )
}
